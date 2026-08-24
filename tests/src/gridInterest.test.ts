import { describe, expect, test } from "vitest";
import { Grid } from "../../server/src/game/grid.ts";
import type { AABB } from "../../shared/utils/coldet.ts";
import type { Vec2 } from "../../shared/utils/v2.ts";

interface ReferenceObject {
    __id: number;
    __gridBounds: { min: Vec2; max: Vec2 };
    __onGrid: boolean;
    __gridQueryId: number;
    bounds: AABB;
    pos: Vec2;
}

interface ObjectPair {
    reference: ReferenceObject;
    interest: ReferenceObject;
}

const objectBounds = aabb(-1, -1, 1, 1);

describe("Grid integrated interest", () => {
    test("maintains exact visible membership and net changes", () => {
        const grid = new Grid<ReferenceObject>(256, 256);
        const index = grid.enableInterest({
            maxObjectId: 16,
            maxClients: 4,
        });
        const first = gridObject(1, 20, 20);
        const second = gridObject(2, 100, 100);

        grid.addObject(first);
        grid.addObject(second);
        index.updateClientView(0, aabb(0, 0, 64, 64));

        expect(ids(index.visibleObjects(0))).toEqual([1]);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [1], removed: [] });

        // Crossing from one subscribed cell into another must not emit a false remove/add pair.
        first.pos.x = 40;
        grid.updateObject(first);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [], removed: [] });

        first.pos.x = 120;
        first.pos.y = 120;
        grid.updateObject(first);
        expect(ids(index.visibleObjects(0))).toEqual([]);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [], removed: [1] });

        index.updateClientView(0, aabb(80, 80, 144, 144));
        expect(ids(index.visibleObjects(0))).toEqual([1, 2]);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [1, 2], removed: [] });
    });

    test("deduplicates multi-cell objects and cancels same-tick transitions", () => {
        const grid = new Grid<ReferenceObject>(256, 256);
        const index = grid.enableInterest({
            maxObjectId: 16,
            maxClients: 4,
        });
        const large = gridObject(1, 64, 64, aabb(-24, -24, 24, 24));

        grid.addObject(large);
        index.updateClientView(0, aabb(48, 48, 80, 80));
        expect(ids(index.visibleObjects(0))).toEqual([1]);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [1], removed: [] });

        grid.remove(large);
        grid.addObject(large);
        expect(ids(index.visibleObjects(0))).toEqual([1]);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [], removed: [] });

        index.updateClientView(0, aabb(160, 160, 192, 192));
        index.updateClientView(0, aabb(48, 48, 80, 80));
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [], removed: [] });
    });

    test("supports object ID reuse after removal and rejects it while active", () => {
        const grid = new Grid<ReferenceObject>(256, 256);
        const index = grid.enableInterest({
            maxObjectId: 16,
            maxClients: 4,
        });
        const oldObject = gridObject(1, 32, 32);
        const replacement = gridObject(1, 32, 32);

        grid.addObject(oldObject);
        expect(() => grid.addObject(replacement)).toThrow(/reused before/);

        index.updateClientView(0, aabb(0, 0, 64, 64));
        index.drainChanges(0);
        grid.remove(oldObject);
        grid.addObject(replacement);

        const changes = index.drainChanges(0);
        expect(changes.removed).toEqual([oldObject]);
        expect(changes.added).toEqual([replacement]);
        expect([...index.visibleObjects(0)]).toEqual([replacement]);
    });

    test("backfills objects that entered the grid before registration assigned an ID", () => {
        const grid = new Grid<ReferenceObject>(256, 256);
        const index = grid.enableInterest({ maxObjectId: 16, maxClients: 4 });
        const object = gridObject(0, 32, 32);

        grid.addObject(object);
        object.__id = 1;
        grid.addObject(object);
        index.updateClientView(0, aabb(0, 0, 64, 64));

        expect(ids(index.visibleObjects(0))).toEqual([1]);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [1], removed: [] });
    });

    test("keeps the forced active object visible without false spatial transitions", () => {
        const grid = new Grid<ReferenceObject>(256, 256);
        const index = grid.enableInterest({ maxObjectId: 16, maxClients: 4 });
        const spatial = gridObject(1, 32, 32);
        const forced = gridObject(2, 160, 160);

        grid.addObject(spatial);
        grid.addObject(forced);
        index.updateClientView(0, aabb(0, 0, 64, 64));
        index.setForcedObject(0, forced);
        expect(ids(index.visibleObjects(0))).toEqual([1, 2]);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [1, 2], removed: [] });

        forced.pos.x = 32;
        forced.pos.y = 32;
        grid.updateObject(forced);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [], removed: [] });

        index.setForcedObject(0, spatial);
        expect(ids(index.visibleObjects(0))).toEqual([1, 2]);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [], removed: [] });

        forced.pos.x = 160;
        forced.pos.y = 160;
        grid.updateObject(forced);
        expect(ids(index.visibleObjects(0))).toEqual([1]);
        expect(changeIds(index.drainChanges(0))).toEqual({ added: [], removed: [2] });
    });

    test("matches Grid.intersectAABBSet through randomized movement and lifecycle changes", () => {
        const random = mulberry32(0x5eed1234);
        const worldSize = 256;
        const objectCount = 96;
        const clientCount = 8;
        const reference = new Grid<ReferenceObject>(worldSize, worldSize);
        const incrementalGrid = new Grid<ReferenceObject>(worldSize, worldSize);
        const incremental = incrementalGrid.enableInterest({
            maxObjectId: objectCount + 1,
            maxClients: clientCount,
        });
        const pairs: ObjectPair[] = [];
        const activeObjects = new Uint8Array(objectCount);
        const views: Array<AABB | undefined> = new Array(clientCount);

        for (let id = 1; id <= objectCount; id++) {
            const pair = objectPair(id, randomPosition(random), randomPosition(random));
            pairs.push(pair);
            activeObjects[id - 1] = 1;
            reference.addObject(pair.reference);
            incrementalGrid.addObject(pair.interest);
        }
        for (let client = 0; client < clientCount; client++) {
            const view = randomView(random, worldSize);
            views[client] = view;
            incremental.updateClientView(client, view);
            incremental.drainChanges(client);
        }

        assertEquivalent(reference, incremental, views);

        for (let step = 0; step < 5_000; step++) {
            const operation = Math.floor(random() * 10);
            if (operation < 6) {
                const objectIndex = Math.floor(random() * objectCount);
                const pair = pairs[objectIndex];
                if (activeObjects[objectIndex]) {
                    pair.reference.pos.x = pair.interest.pos.x = randomPosition(random);
                    pair.reference.pos.y = pair.interest.pos.y = randomPosition(random);
                    reference.updateObject(pair.reference);
                    incrementalGrid.updateObject(pair.interest);
                } else {
                    activeObjects[objectIndex] = 1;
                    reference.addObject(pair.reference);
                    incrementalGrid.addObject(pair.interest);
                }
            } else if (operation < 7) {
                const objectIndex = Math.floor(random() * objectCount);
                if (activeObjects[objectIndex]) {
                    activeObjects[objectIndex] = 0;
                    reference.remove(pairs[objectIndex].reference);
                    incrementalGrid.remove(pairs[objectIndex].interest);
                }
            } else if (operation < 9) {
                const client = Math.floor(random() * clientCount);
                const view = randomView(random, worldSize);
                views[client] = view;
                incremental.updateClientView(client, view);
            } else {
                const client = Math.floor(random() * clientCount);
                if (views[client]) {
                    views[client] = undefined;
                    incremental.removeClient(client);
                } else {
                    const view = randomView(random, worldSize);
                    views[client] = view;
                    incremental.updateClientView(client, view);
                }
            }

            if (step % 10 === 0) assertEquivalent(reference, incremental, views);
        }

        assertEquivalent(reference, incremental, views);
    });
});

function assertEquivalent(
    reference: Grid<ReferenceObject>,
    incremental: ReturnType<Grid<ReferenceObject>["enableInterest"]>,
    views: Array<AABB | undefined>,
): void {
    for (let client = 0; client < views.length; client++) {
        const view = views[client];
        if (!view) continue;
        expect(ids(incremental.visibleObjects(client)), `client ${client}`).toEqual(
            ids(reference.intersectAABBSet(view)),
        );
    }
}

function objectPair(id: number, x: number, y: number): ObjectPair {
    return {
        reference: gridObject(id, x, y),
        interest: gridObject(id, x, y),
    };
}

function gridObject(id: number, x: number, y: number, bounds = objectBounds): ReferenceObject {
    return {
        __id: id,
        __gridBounds: { min: { x: -1, y: -1 }, max: { x: -1, y: -1 } },
        __onGrid: false,
        __gridQueryId: 0,
        bounds,
        pos: { x, y },
    };
}

function aabb(minX: number, minY: number, maxX: number, maxY: number): AABB {
    return { type: 1, min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

function ids(objects: Iterable<{ __id: number }>): number[] {
    return [...objects].map(object => object.__id).sort((a, b) => a - b);
}

function changeIds(changes: { added: ReferenceObject[]; removed: ReferenceObject[] }) {
    return {
        added: ids(changes.added),
        removed: ids(changes.removed),
    };
}

function randomView(random: () => number, worldSize: number): AABB {
    const halfWidth = 24 + random() * 48;
    const halfHeight = 16 + random() * 32;
    const x = random() * worldSize;
    const y = random() * worldSize;
    return aabb(x - halfWidth, y - halfHeight, x + halfWidth, y + halfHeight);
}

function randomPosition(random: () => number): number {
    return -32 + random() * 320;
}

function mulberry32(seed: number): () => number {
    return () => {
        seed |= 0;
        seed = seed + 0x6d2b79f5 | 0;
        let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
        value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
}
