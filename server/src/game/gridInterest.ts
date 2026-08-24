import type { AABB } from "../../../shared/utils/coldet.ts";
import { math } from "../../../shared/utils/math.ts";

export interface GridCellBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

interface ClientState<T> {
    bounds?: GridCellBounds;
    forced?: T;
    visible: Set<T>;
    visibleOrder: Map<T, number>;
    nextVisibleOrder: number;
    added: Set<T>;
    removed: Set<T>;
}

interface GridInterestHost<T> {
    objectsAt: (x: number, y: number) => Iterable<T>;
    objectBounds: (object: T) => GridCellBounds;
}

export interface GridInterestOptions<T> {
    maxObjectId?: number;
    maxClients?: number;
    objectId?: (object: T) => number;
}

export interface InterestChanges<T> {
    added: T[];
    removed: T[];
}

export interface InterestSnapshot<T> {
    visible: ReadonlySet<T>;
    added: ReadonlySet<T>;
    removed: ReadonlySet<T>;
}

export interface InterestMemoryEstimate {
    cellSubscriberMasks: number;
    objectClientMasks: number;
    recomputeScratch: number;
    affectedStamps: number;
    totalTypedArrayBytes: number;
}

/**
 * Persistent client visibility derived from an existing Grid's cells.
 *
 * Grid owns object membership and bounds. This tracker stores only cell subscribers, each object's
 * client mask, and per-client visible/change sets. Visibility order follows Set insertion order so
 * callers can reproduce the existing network object order without scanning the visible set.
 */
export class GridInterest<T> {
    readonly maxObjectId: number;
    readonly maxClients: number;
    readonly clientWordCount: number;

    private readonly cellSubscriberMasks: Uint32Array;
    private readonly objectClientMasks: Uint32Array;
    private readonly recomputeScratch: Uint32Array;
    private readonly objects: Array<T | undefined>;
    private readonly clients: Array<ClientState<T> | undefined>;
    private readonly pendingObjectFlags: Uint8Array;
    private readonly pendingObjectIds: number[] = [];
    private readonly affectedStamps: Uint32Array;
    private readonly affectedObjects: T[] = [];
    private readonly getObjectId: (object: T) => number;
    private affectedEpoch = 0;
    private activeClientCount = 0;
    private highestActiveClientSlot = -1;

    constructor(
        private readonly width: number,
        private readonly height: number,
        private readonly cellSize: number,
        options: GridInterestOptions<T> & GridInterestHost<T>,
    ) {
        this.maxObjectId = options.maxObjectId ?? 65535;
        this.maxClients = options.maxClients ?? 128;
        this.clientWordCount = Math.ceil(this.maxClients / 32);
        this.getObjectId = options.objectId ?? defaultObjectId;
        this.objectsAt = options.objectsAt;
        this.objectBounds = options.objectBounds;

        if (!Number.isInteger(this.maxObjectId) || this.maxObjectId < 2) {
            throw new RangeError("GridInterest maxObjectId must be an integer greater than one");
        }
        if (!Number.isInteger(this.maxClients) || this.maxClients < 1) {
            throw new RangeError("GridInterest maxClients must be a positive integer");
        }

        const cellCount = (this.width + 1) * (this.height + 1);
        this.cellSubscriberMasks = new Uint32Array(cellCount * this.clientWordCount);
        this.objectClientMasks = new Uint32Array(this.maxObjectId * this.clientWordCount);
        this.recomputeScratch = new Uint32Array(this.clientWordCount);
        this.objects = new Array(this.maxObjectId);
        this.clients = new Array(this.maxClients);
        this.pendingObjectFlags = new Uint8Array(this.maxObjectId);
        this.affectedStamps = new Uint32Array(this.maxObjectId);
    }

    private readonly objectsAt: GridInterestHost<T>["objectsAt"];
    private readonly objectBounds: GridInterestHost<T>["objectBounds"];

    /** Validates and reserves an object ID before Grid mutates cell membership. */
    prepareObject(object: T): boolean {
        const id = this.registeredObjectId(object);
        if (id === undefined) return false;
        const previousObject = this.objects[id];
        if (previousObject && previousObject !== object) {
            throw new Error(
                `Grid interest object ID ${id} was reused before its previous object was removed`,
            );
        }
        if (previousObject === object) return false;
        this.objects[id] = object;
        return true;
    }

    updateObject(object: T): void {
        const id = this.rememberObject(object);
        if (id === undefined) return;
        if (this.activeClientCount === 0) return;
        if (this.pendingObjectFlags[id]) return;
        this.pendingObjectFlags[id] = 1;
        this.pendingObjectIds.push(id);
    }

    /** Resolves movement once at the network-sync boundary using each object's final grid bounds. */
    flushObjectUpdates(): void {
        for (let index = 0; index < this.pendingObjectIds.length; index++) {
            const id = this.pendingObjectIds[index];
            this.pendingObjectFlags[id] = 0;
            const object = this.objects[id];
            if (object) this.recomputeObjectClientMask(object, this.objectBounds(object));
        }
        this.pendingObjectIds.length = 0;
    }

    removeObject(object: T): void {
        const id = this.registeredObjectId(object);
        if (id === undefined) return;
        const previousObject = this.objects[id];
        if (previousObject && previousObject !== object) {
            throw new Error(`Grid interest object ID ${id} belongs to another active object`);
        }
        if (previousObject) this.applyObjectClientMask(object, id, undefined);
        this.objects[id] = undefined;
    }

    updateClientView(clientSlot: number, aabb: AABB): boolean {
        // Subscriber masks must only change against fully resolved object positions.
        this.flushObjectUpdates();
        clientSlot = this.validateClientSlot(clientSlot);
        const newBounds = this.aabbBounds(aabb);
        let client = this.clients[clientSlot];
        if (!client) {
            client = {
                visible: new Set(),
                visibleOrder: new Map(),
                nextVisibleOrder: 0,
                added: new Set(),
                removed: new Set(),
            };
            this.clients[clientSlot] = client;
            this.activeClientCount++;
            this.highestActiveClientSlot = Math.max(this.highestActiveClientSlot, clientSlot);
        }
        const oldBounds = client.bounds;
        if (oldBounds && boundsEqual(oldBounds, newBounds)) return false;

        this.beginAffectedObjects();
        if (oldBounds) {
            this.forEachCellDifference(oldBounds, newBounds, (x, y, cellIndex) => {
                this.setCellSubscriber(cellIndex, clientSlot, false);
                this.markCellObjectsAffected(x, y);
            });
        }
        this.forEachCellDifference(newBounds, oldBounds, (x, y, cellIndex) => {
            this.setCellSubscriber(cellIndex, clientSlot, true);
            this.markCellObjectsAffected(x, y);
        });
        client.bounds = newBounds;
        this.recomputeAffectedObjects();
        return true;
    }

    /** Keeps one object visible independently of spatial membership, for the active-player rule. */
    setForcedObject(clientSlot: number, object: T | undefined): boolean {
        clientSlot = this.validateClientSlot(clientSlot);
        const client = this.client(clientSlot);
        const previous = client.forced;
        if (previous === object) return false;

        client.forced = object;
        if (previous && !this.isSpatiallyVisible(previous, clientSlot)) {
            this.removeVisibleObject(client, previous);
        }
        if (object) this.addVisibleObject(client, object);
        return true;
    }

    removeClient(clientSlot: number): boolean {
        // A disconnect can happen between network syncs; resolve movement before clearing its bit.
        this.flushObjectUpdates();
        clientSlot = this.validateClientSlot(clientSlot);
        const client = this.clients[clientSlot];
        if (!client) return false;

        this.beginAffectedObjects();
        if (client.bounds) {
            this.forEachCell(client.bounds, (x, y, cellIndex) => {
                this.setCellSubscriber(cellIndex, clientSlot, false);
                this.markCellObjectsAffected(x, y);
            });
        }
        this.recomputeAffectedObjects();
        this.clients[clientSlot] = undefined;
        this.activeClientCount--;
        if (clientSlot === this.highestActiveClientSlot) {
            while (
                this.highestActiveClientSlot >= 0
                && !this.clients[this.highestActiveClientSlot]
            ) {
                this.highestActiveClientSlot--;
            }
        }
        return true;
    }

    visibleObjects(clientSlot: number): ReadonlySet<T> {
        return this.client(clientSlot).visible;
    }

    /** Iterates clients that can see an object spatially. Forced visibility is handled separately. */
    forEachSpatialClient(object: T, consumer: (clientSlot: number) => void): void {
        const id = this.registeredObjectId(object);
        if (id === undefined) return;
        const objectMaskOffset = id * this.clientWordCount;
        for (let word = 0; word < this.activeWordCount; word++) {
            let clients = this.objectClientMasks[objectMaskOffset + word] >>> 0;
            while (clients !== 0) {
                const lowestBit = (clients & -clients) >>> 0;
                const bit = 31 - Math.clz32(lowestBit);
                const clientSlot = word * 32 + bit;
                if (this.clients[clientSlot]) consumer(clientSlot);
                clients = (clients & (clients - 1)) >>> 0;
            }
        }
    }

    isSpatiallyVisible(object: T, clientSlot: number): boolean {
        clientSlot = this.validateClientSlot(clientSlot);
        const id = this.registeredObjectId(object);
        if (id === undefined) return false;
        const word = clientSlot >>> 5;
        const bit = 1 << (clientSlot & 31);
        return (this.objectClientMasks[id * this.clientWordCount + word] & bit) !== 0;
    }

    visibilityOrder(clientSlot: number, object: T): number {
        return this.client(clientSlot).visibleOrder.get(object) ?? Number.MAX_SAFE_INTEGER;
    }

    drainChanges(clientSlot: number): InterestChanges<T> {
        const client = this.client(clientSlot);
        const changes = { added: [...client.added], removed: [...client.removed] };
        client.added.clear();
        client.removed.clear();
        return changes;
    }

    /** Reads persistent state without copies and clears changes after the callback. */
    consumeChanges<Result>(
        clientSlot: number,
        consumer: (snapshot: InterestSnapshot<T>) => Result,
    ): Result {
        const client = this.client(clientSlot);
        try {
            return consumer(client);
        } finally {
            client.added.clear();
            client.removed.clear();
        }
    }

    memoryEstimate(): InterestMemoryEstimate {
        const cellSubscriberMasks = this.cellSubscriberMasks.byteLength;
        const objectClientMasks = this.objectClientMasks.byteLength;
        const recomputeScratch = this.recomputeScratch.byteLength;
        const affectedStamps = this.affectedStamps.byteLength;
        return {
            cellSubscriberMasks,
            objectClientMasks,
            recomputeScratch,
            affectedStamps,
            totalTypedArrayBytes: cellSubscriberMasks
                + objectClientMasks
                + recomputeScratch
                + affectedStamps,
        };
    }

    private recomputeObjectClientMask(object: T, bounds: GridCellBounds): void {
        const id = this.rememberObject(object);
        if (id === undefined) return;
        const nextMask = this.recomputeScratch;
        const activeWordCount = this.activeWordCount;
        nextMask.fill(0, 0, activeWordCount);
        this.forEachCell(bounds, (_x, _y, cellIndex) => {
            const cellMaskOffset = cellIndex * this.clientWordCount;
            for (let word = 0; word < activeWordCount; word++) {
                nextMask[word] |= this.cellSubscriberMasks[cellMaskOffset + word];
            }
        });
        this.applyObjectClientMask(object, id, nextMask);
    }

    private applyObjectClientMask(
        object: T,
        id: number,
        nextMask: Uint32Array | undefined,
    ): void {
        const objectMaskOffset = id * this.clientWordCount;
        for (let word = 0; word < this.activeWordCount; word++) {
            const previous = this.objectClientMasks[objectMaskOffset + word];
            const next = nextMask?.[word] ?? 0;
            let changed = (previous ^ next) >>> 0;
            while (changed !== 0) {
                const lowestBit = (changed & -changed) >>> 0;
                const bit = 31 - Math.clz32(lowestBit);
                const client = this.clients[word * 32 + bit];
                if (client) {
                    if ((next & lowestBit) !== 0) {
                        this.addVisibleObject(client, object);
                    } else if (client.forced !== object) {
                        this.removeVisibleObject(client, object);
                    }
                }
                changed = (changed & (changed - 1)) >>> 0;
            }
            this.objectClientMasks[objectMaskOffset + word] = next;
        }
    }

    private addVisibleObject(client: ClientState<T>, object: T): void {
        if (client.visible.has(object)) return;
        client.visible.add(object);
        client.visibleOrder.set(object, client.nextVisibleOrder++);
        if (!client.removed.delete(object)) client.added.add(object);
    }

    private removeVisibleObject(client: ClientState<T>, object: T): void {
        if (!client.visible.delete(object)) return;
        client.visibleOrder.delete(object);
        if (!client.added.delete(object)) client.removed.add(object);
    }

    private beginAffectedObjects(): void {
        this.affectedObjects.length = 0;
        this.affectedEpoch++;
        if (this.affectedEpoch > 0xffffffff) {
            this.affectedStamps.fill(0);
            this.affectedEpoch = 1;
        }
    }

    private markCellObjectsAffected(x: number, y: number): void {
        for (const object of this.objectsAt(x, y)) {
            const id = this.rememberObject(object);
            if (id === undefined) continue;
            if (this.affectedStamps[id] === this.affectedEpoch) continue;
            this.affectedStamps[id] = this.affectedEpoch;
            this.affectedObjects.push(object);
        }
    }

    private recomputeAffectedObjects(): void {
        for (let index = 0; index < this.affectedObjects.length; index++) {
            const object = this.affectedObjects[index];
            this.recomputeObjectClientMask(object, this.objectBounds(object));
        }
    }

    private setCellSubscriber(cellIndex: number, clientSlot: number, subscribed: boolean): void {
        const word = clientSlot >>> 5;
        const bit = 1 << (clientSlot & 31);
        const offset = cellIndex * this.clientWordCount + word;
        if (subscribed) this.cellSubscriberMasks[offset] |= bit;
        else this.cellSubscriberMasks[offset] &= ~bit;
    }

    private aabbBounds(aabb: AABB): GridCellBounds {
        return {
            minX: this.roundToCell(aabb.min.x, this.width),
            minY: this.roundToCell(aabb.min.y, this.height),
            maxX: this.roundToCell(aabb.max.x, this.width),
            maxY: this.roundToCell(aabb.max.y, this.height),
        };
    }

    private roundToCell(value: number, max: number): number {
        return math.clamp(Math.floor(value / this.cellSize), 0, max);
    }

    private forEachCell(
        bounds: GridCellBounds,
        callback: (x: number, y: number, cellIndex: number) => void,
    ): void {
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
            for (let y = bounds.minY; y <= bounds.maxY; y++) {
                callback(x, y, this.cellIndex(x, y));
            }
        }
    }

    private forEachCellDifference(
        bounds: GridCellBounds,
        excluded: GridCellBounds | undefined,
        callback: (x: number, y: number, cellIndex: number) => void,
    ): void {
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
            for (let y = bounds.minY; y <= bounds.maxY; y++) {
                if (excluded && cellInBounds(x, y, excluded)) continue;
                callback(x, y, this.cellIndex(x, y));
            }
        }
    }

    private cellIndex(x: number, y: number): number {
        return x * (this.height + 1) + y;
    }

    private rememberObject(object: T): number | undefined {
        const id = this.registeredObjectId(object);
        if (id === undefined) return undefined;
        const previousObject = this.objects[id];
        if (previousObject && previousObject !== object) {
            throw new Error(
                `Grid interest object ID ${id} was reused before its previous object was removed`,
            );
        }
        this.objects[id] = object;
        return id;
    }

    private registeredObjectId(object: T): number | undefined {
        const id = this.getObjectId(object);
        if (id === undefined || id === 0) return undefined;
        return this.validateObjectId(id);
    }

    private validateObjectId(id: number): number {
        if (!Number.isInteger(id) || id <= 0 || id >= this.maxObjectId) {
            throw new RangeError(
                `Grid interest object ID ${id} must be between 1 and ${this.maxObjectId - 1}`,
            );
        }
        return id;
    }

    private validateClientSlot(clientSlot: number): number {
        if (!Number.isInteger(clientSlot) || clientSlot < 0 || clientSlot >= this.maxClients) {
            throw new RangeError(
                `Grid interest client slot ${clientSlot} must be between 0 and ${this.maxClients - 1}`,
            );
        }
        return clientSlot;
    }

    private client(clientSlot: number): ClientState<T> {
        clientSlot = this.validateClientSlot(clientSlot);
        const client = this.clients[clientSlot];
        if (!client) throw new Error(`Client slot ${clientSlot} is not active`);
        return client;
    }

    private get activeWordCount(): number {
        return this.highestActiveClientSlot < 0 ? 0 : (this.highestActiveClientSlot >>> 5) + 1;
    }
}

function defaultObjectId(object: unknown): number {
    return (object as { __id: number }).__id;
}

function boundsEqual(first: GridCellBounds, second: GridCellBounds): boolean {
    return first.minX === second.minX
        && first.minY === second.minY
        && first.maxX === second.maxX
        && first.maxY === second.maxY;
}

function cellInBounds(x: number, y: number, bounds: GridCellBounds): boolean {
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}
