import "./testHelpers.ts";
import { describe, expect, test } from "vitest";

import type { BuildingDef, LootSpawnerDef, ObstacleDef, StructureDef } from "../../shared/defs/mapObjectsTyping.ts";
import { MapObjectDefs } from "../../shared/defs/register.ts";
import { Constants } from "../../shared/net/net.ts";

const mapObjects = MapObjectDefs.getAllTypes();

const obstacles = mapObjects.filter((type) => {
    return MapObjectDefs.typeToDef(type).type === "obstacle";
}).map(t => [t, MapObjectDefs.typeToDef(t)]) as [string, ObstacleDef][];

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

const buildings = mapObjects.filter((type) => {
    return MapObjectDefs.typeToDef(type).type === "building";
}).map(t => [t, MapObjectDefs.typeToDef(t)]) as [string, BuildingDef][];

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

const structures = mapObjects.filter((type) => {
    return MapObjectDefs.typeToDef(type).type === "structure";
}).map(t => [t, MapObjectDefs.typeToDef(t)]) as [string, StructureDef][];

describe.for(structures)("Structure %s", ([, def]) => {
    test.for(def.layers)("Layer %$", (layer) => {
        expect(layer.type).toBeValidMapObj("building");
    });
});

const lootSpawners = mapObjects.filter((type) => {
    return MapObjectDefs.typeToDef(type).type === "loot_spawner";
}).map(t => [t, MapObjectDefs.typeToDef(t)]) as [string, LootSpawnerDef][];

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
