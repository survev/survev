import type { AABB } from "../../shared/utils/coldet.ts";
import type { Vec2 } from "../../shared/utils/v2.ts";
import { Grid } from "../src/game/grid.ts";
import type { GridInterest } from "../src/game/gridInterest.ts";

interface ReferenceObject {
    __id: number;
    __gridBounds: { min: Vec2; max: Vec2 };
    __onGrid: boolean;
    __gridQueryId: number;
    bounds: AABB;
    pos: Vec2;
}

interface MovingObject<T extends { pos: Vec2 }> {
    object: T;
    vx: number;
    vy: number;
}

interface MovingClient {
    view: AABB;
    vx: number;
    vy: number;
}

interface Scenario {
    name: string;
    movingObjects: number;
    objectSpeed: number;
    clientSpeed: number;
}

interface WorkResult {
    visibleCount: number;
    visibleIdSum: number;
    addedIdSum: number;
    removedIdSum: number;
    objectCellChanges: number;
    viewCellChanges: number;
}

interface TrialResult {
    milliseconds: number;
    work: WorkResult;
}

const worldSize = 1024;
const objectCount = 2_400;
const clientCount = 80;
const maxClientCapacity = 256;
const warmupFrames = 300;
const measuredFrames = 1_200;
const trialCount = 5;
const objectBounds = aabb(-1, -1, 1, 1);

const scenarios: Scenario[] = [
    { name: "quiet", movingObjects: 80, objectSpeed: 0.5, clientSpeed: 0.35 },
    { name: "typical", movingObjects: 240, objectSpeed: 1.5, clientSpeed: 1 },
    { name: "busy", movingObjects: 800, objectSpeed: 5, clientSpeed: 3 },
    { name: "pathological", movingObjects: 2_400, objectSpeed: 20, clientSpeed: 12 },
];

console.log(
    `TypeScript interest benchmark: ${objectCount} objects, ${clientCount}/${maxClientCapacity} clients, `
        + `${measuredFrames} measured frames, median of ${trialCount}`,
);

for (const scenario of scenarios) {
    const referenceTrials: TrialResult[] = [];
    const incrementalTrials: TrialResult[] = [];

    for (let trial = 0; trial < trialCount; trial++) {
        // Alternate order to reduce systematic JIT, thermal, and GC bias.
        if (trial % 2 === 0) {
            referenceTrials.push(runReference(scenario));
            incrementalTrials.push(runIncremental(scenario));
        } else {
            incrementalTrials.push(runIncremental(scenario));
            referenceTrials.push(runReference(scenario));
        }
    }

    const reference = medianTrial(referenceTrials);
    const incremental = medianTrial(incrementalTrials);
    assertEquivalentWork(reference.work, incremental.work, scenario.name);
    const speedup = reference.milliseconds / incremental.milliseconds;
    const timeChange = (incremental.milliseconds / reference.milliseconds - 1) * 100;

    console.log(`\n${scenario.name}`);
    console.table([
        {
            backend: "Grid query + full diff",
            milliseconds: reference.milliseconds.toFixed(1),
            "frames/sec": (measuredFrames * 1000 / reference.milliseconds).toFixed(0),
            speedup: "1.00x",
            "time change": "baseline",
        },
        {
            backend: "Integrated incremental grid",
            milliseconds: incremental.milliseconds.toFixed(1),
            "frames/sec": (measuredFrames * 1000 / incremental.milliseconds).toFixed(0),
            speedup: `${speedup.toFixed(2)}x`,
            "time change": `${timeChange >= 0 ? "+" : ""}${timeChange.toFixed(1)}%`,
        },
    ]);
    console.log(
        `rounded-cell changes: ${incremental.work.objectCellChanges.toLocaleString()} objects, `
            + `${incremental.work.viewCellChanges.toLocaleString()} views`,
    );
}

const productionMemory = new Grid<ReferenceObject>(worldSize, worldSize).enableInterest({
    maxObjectId: 65_535,
    maxClients: maxClientCapacity,
}).memoryEstimate();
console.log(
    `\nProduction-capacity typed arrays: ${formatBytes(productionMemory.totalTypedArrayBytes)} `
        + "(excludes JS object arrays and Set storage)",
);

function runReference(scenario: Scenario): TrialResult {
    const random = mulberry32(0x1a2b3c4d);
    const grid = new Grid<ReferenceObject>(worldSize, worldSize);
    const objects = createObjects(random, scenario, true);
    const clients = createClients(random, scenario);

    for (const moving of objects) grid.addObject(moving.object);
    const previous = clients.map(client => grid.intersectAABBSet(client.view));
    for (let frame = 0; frame < warmupFrames; frame++) {
        referenceFrame(grid, objects, clients, previous, scenario, false);
    }

    const start = performance.now();
    let work = emptyWork();
    for (let frame = 0; frame < measuredFrames; frame++) {
        work = addWork(work, referenceFrame(grid, objects, clients, previous, scenario, true));
    }
    return { milliseconds: performance.now() - start, work };
}

function runIncremental(scenario: Scenario): TrialResult {
    const random = mulberry32(0x1a2b3c4d);
    const grid = new Grid<ReferenceObject>(worldSize, worldSize);
    const index = grid.enableInterest({
        maxObjectId: objectCount + 1,
        maxClients: maxClientCapacity,
    });
    const objects = createObjects(random, scenario, true);
    const clients = createClients(random, scenario);

    for (const moving of objects) grid.addObject(moving.object);
    for (let client = 0; client < clients.length; client++) {
        index.updateClientView(client, clients[client].view);
        index.drainChanges(client);
    }
    for (let frame = 0; frame < warmupFrames; frame++) {
        incrementalFrame(grid, index, objects, clients, scenario, false);
    }

    const start = performance.now();
    let work = emptyWork();
    for (let frame = 0; frame < measuredFrames; frame++) {
        work = addWork(work, incrementalFrame(grid, index, objects, clients, scenario, true));
    }
    return { milliseconds: performance.now() - start, work };
}

function referenceFrame(
    grid: Grid<ReferenceObject>,
    objects: Array<MovingObject<ReferenceObject>>,
    clients: MovingClient[],
    previous: Array<Set<ReferenceObject>>,
    scenario: Scenario,
    collect: boolean,
): WorkResult {
    for (let index = 0; index < scenario.movingObjects; index++) {
        const moving = objects[index];
        moveObject(moving, scenario.objectSpeed);
        grid.updateObject(moving.object);
    }

    const work = emptyWork();
    for (let clientSlot = 0; clientSlot < clients.length; clientSlot++) {
        const client = clients[clientSlot];
        moveView(client, scenario.clientSpeed);
        const visible = grid.intersectAABBSet(client.view);
        if (collect) {
            for (const object of previous[clientSlot]) {
                if (!visible.has(object)) work.removedIdSum += object.__id;
            }
            for (const object of visible) {
                work.visibleCount++;
                work.visibleIdSum += object.__id;
                if (!previous[clientSlot].has(object)) work.addedIdSum += object.__id;
            }
        }
        previous[clientSlot] = visible;
    }
    return work;
}

function incrementalFrame(
    grid: Grid<ReferenceObject>,
    index: GridInterest<ReferenceObject>,
    objects: Array<MovingObject<ReferenceObject>>,
    clients: MovingClient[],
    scenario: Scenario,
    collect: boolean,
): WorkResult {
    const work = emptyWork();
    for (let objectIndex = 0; objectIndex < scenario.movingObjects; objectIndex++) {
        const moving = objects[objectIndex];
        moveObject(moving, scenario.objectSpeed);
        if (grid.updateObject(moving.object) && collect) work.objectCellChanges++;
    }
    index.flushObjectUpdates();

    for (let clientSlot = 0; clientSlot < clients.length; clientSlot++) {
        const client = clients[clientSlot];
        moveView(client, scenario.clientSpeed);
        if (index.updateClientView(clientSlot, client.view) && collect) work.viewCellChanges++;
        index.consumeChanges(clientSlot, snapshot => {
            if (!collect) return;
            for (const object of snapshot.removed) work.removedIdSum += object.__id;
            for (const object of snapshot.visible) {
                work.visibleCount++;
                work.visibleIdSum += object.__id;
                if (snapshot.added.has(object)) work.addedIdSum += object.__id;
            }
        });
    }
    return work;
}

function createObjects(
    random: () => number,
    scenario: Scenario,
    _reference: boolean,
): Array<MovingObject<ReferenceObject>> {
    const objects: Array<MovingObject<ReferenceObject>> = [];
    for (let id = 1; id <= objectCount; id++) {
        const object: ReferenceObject = {
            __id: id,
            __gridBounds: { min: { x: -1, y: -1 }, max: { x: -1, y: -1 } },
            __onGrid: false,
            __gridQueryId: 0,
            bounds: objectBounds,
            pos: randomWorldPosition(random),
        };
        const angle = random() * Math.PI * 2;
        objects.push({ object, vx: Math.cos(angle), vy: Math.sin(angle) });
    }
    // Consume the scenario argument in both implementations to make accidental setup drift obvious.
    if (scenario.movingObjects > objects.length) throw new Error("Too many moving objects");
    return objects;
}

function createClients(random: () => number, scenario: Scenario): MovingClient[] {
    const clients: MovingClient[] = [];
    for (let index = 0; index < clientCount; index++) {
        const center = randomWorldPosition(random);
        const angle = random() * Math.PI * 2;
        clients.push({
            view: aabb(center.x - 64, center.y - 36, center.x + 64, center.y + 36),
            vx: Math.cos(angle),
            vy: Math.sin(angle),
        });
    }
    if (scenario.clientSpeed < 0) throw new Error("Client speed cannot be negative");
    return clients;
}

function moveObject<T extends { pos: Vec2 }>(moving: MovingObject<T>, speed: number): void {
    const position = moving.object.pos;
    position.x += moving.vx * speed;
    position.y += moving.vy * speed;
    if (position.x < 0 || position.x > worldSize) {
        moving.vx *= -1;
        position.x = Math.max(0, Math.min(worldSize, position.x));
    }
    if (position.y < 0 || position.y > worldSize) {
        moving.vy *= -1;
        position.y = Math.max(0, Math.min(worldSize, position.y));
    }
}

function moveView(client: MovingClient, speed: number): void {
    client.view.min.x += client.vx * speed;
    client.view.max.x += client.vx * speed;
    client.view.min.y += client.vy * speed;
    client.view.max.y += client.vy * speed;
    if (client.view.min.x < 0 || client.view.max.x > worldSize) {
        client.vx *= -1;
        const correction = client.view.min.x < 0 ? -client.view.min.x : worldSize - client.view.max.x;
        client.view.min.x += correction;
        client.view.max.x += correction;
    }
    if (client.view.min.y < 0 || client.view.max.y > worldSize) {
        client.vy *= -1;
        const correction = client.view.min.y < 0 ? -client.view.min.y : worldSize - client.view.max.y;
        client.view.min.y += correction;
        client.view.max.y += correction;
    }
}

function emptyWork(): WorkResult {
    return {
        visibleCount: 0,
        visibleIdSum: 0,
        addedIdSum: 0,
        removedIdSum: 0,
        objectCellChanges: 0,
        viewCellChanges: 0,
    };
}

function addWork(total: WorkResult, frame: WorkResult): WorkResult {
    total.visibleCount += frame.visibleCount;
    total.visibleIdSum += frame.visibleIdSum;
    total.addedIdSum += frame.addedIdSum;
    total.removedIdSum += frame.removedIdSum;
    total.objectCellChanges += frame.objectCellChanges;
    total.viewCellChanges += frame.viewCellChanges;
    return total;
}

function assertEquivalentWork(reference: WorkResult, incremental: WorkResult, scenario: string): void {
    for (const field of ["visibleCount", "visibleIdSum", "addedIdSum", "removedIdSum"] as const) {
        if (reference[field] !== incremental[field]) {
            throw new Error(
                `${scenario}: ${field} differs: Grid=${reference[field]}, incremental=${incremental[field]}`,
            );
        }
    }
}

function medianTrial(trials: TrialResult[]): TrialResult {
    return [...trials].sort((a, b) => a.milliseconds - b.milliseconds)[Math.floor(trials.length / 2)];
}

function randomWorldPosition(random: () => number): Vec2 {
    return { x: random() * worldSize, y: random() * worldSize };
}

function aabb(minX: number, minY: number, maxX: number, maxY: number): AABB {
    return { type: 1, min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

function formatBytes(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
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
