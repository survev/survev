import "./testHelpers";
import { Constants } from "@survev/lib/net";
import { describe, expect, test } from "vitest";
import { MapObjectDefs } from "../src/defs/mapObjectDefs";
import type {
    BuildingDef,
    LootSpawnerDef,
    ObstacleDef,
    StructureDef,
} from "../src/defs/mapObjectsTyping";

const mapObjects = Object.entries(MapObjectDefs);

const obstacles = mapObjects.filter(([, def]) => {
    return def.type === "obstacle";
}) as [string, ObstacleDef][];

describe.for(obstacles)("Obstacle %s", ([, def]) => {
    test("Scale", () => {
        expect(def.scale).toEqual({
            createMin: expect.toBeInRange({
                min: Constants.MapObjectMinScale,
                max: Constants.MapObjectMaxScale,
            }),
            createMax: expect.toBeInRange({
                min: Constants.MapObjectMinScale,
                max: Constants.MapObjectMaxScale,
            }),
            destroy: expect.toBeInRange({
                min: Constants.MapObjectMinScale,
                max: Constants.MapObjectMaxScale,
            }),
        });
    });

    // smart loot obstacles calculate the destroy type at runtime
    // based on the player role (used for cobalt class pods)
    if (!def.smartLoot) {
        expect(def.destroyType).toBeValidMapObjOrNone();
    }

    if (def.loot.length) {
        test.for(def.loot)("Loot %$", (loot) => {
            if (loot.type) {
                expect(loot.type).toBeValidLoot();
            }
            if (loot.tier) {
                expect(loot.tier).toBeValidLootTier();
            }
        });
    }
});

const buildings = mapObjects.filter(([, def]) => {
    return def.type === "building";
}) as [string, BuildingDef][];

describe.for(buildings)("Building %s", ([, def]) => {
    if (def.mapObjects.length > 0) {
        test.for(def.mapObjects)("Child Object %$", (childObj) => {
            if (typeof childObj.type !== "object") {
                expect(childObj.type).toBeValidMapObjOrNone();
            } else {
                for (const type in childObj.type) {
                    expect(type).toBeValidMapObjOrNone();
                }
            }
            expect(childObj.scale).toBeInRange({
                min: Constants.MapObjectMinScale,
                max: Constants.MapObjectMaxScale,
            });
        });
    } else {
        // just so vitest doesn't complain theres no test for this building
        // in case it has no map objects
        test("Type", () => {
            expect(def.type).toBe("building");
        });
    }
});

const structures = mapObjects.filter(([, def]) => {
    return def.type === "structure";
}) as [string, StructureDef][];

describe.for(structures)("Structure %s", ([, def]) => {
    test.for(def.layers)("Layer %$", (layer) => {
        expect(layer.type).toBeValidMapObj("building");
    });
});

const lootSpawners = mapObjects.filter(([, def]) => {
    return def.type === "loot_spawner";
}) as [string, LootSpawnerDef][];

describe.for(lootSpawners)("Loot Spawner %s", ([, def]) => {
    test.for(def.loot)("Loot %$", (loot) => {
        if (loot.type) {
            expect(loot.type).toBeValidLoot();
        }
        if (loot.tier) {
            expect(loot.tier).toBeValidLootTier();
        }
    });
});
