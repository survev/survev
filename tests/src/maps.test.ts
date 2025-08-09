import { describe, expect, test } from "vitest";
import { type MapDef, MapDefs } from "../../shared/defs/mapDefs";
import { Constants } from "../../shared/net/net";
import "./testHelpers";

const maps = Object.keys(MapDefs);

describe.for(maps)("Map %s", (map) => {
    const mapDef: MapDef = MapDefs[map as keyof typeof MapDefs];

    describe("Loot Tables", () => {
        for (const tableId in mapDef.lootTable) {
            const table = mapDef.lootTable[tableId];

            test(tableId, () => {
                for (const item of table) {
                    if (item.name.startsWith("tier_")) {
                        expect(item.name).toBeValidLootTier();
                    } else if (item.name !== "") {
                        expect(item.name).toBeValidLoot();
                    }
                }
            });
        }
    });

    describe("Map Gen", () => {
        const mapGen = mapDef.mapGen;

        test("Map Size", () => {
            const map = mapGen.map;

            const widthSmall = map.baseWidth * map.scale.small + map.extension;
            const heightSmall = map.baseHeight * map.scale.small + map.extension;

            const widthLarge = map.baseWidth * map.scale.large + map.extension;
            const heightLarge = map.baseHeight * map.scale.large + map.extension;

            expect(widthSmall).toBeLessThanOrEqual(Constants.MaxPosition);
            expect(heightSmall).toBeLessThanOrEqual(Constants.MaxPosition);
            expect(widthLarge).toBeLessThanOrEqual(Constants.MaxPosition);
            expect(heightLarge).toBeLessThanOrEqual(Constants.MaxPosition);
        });

        test("Bridge Types", () => {
            expect(mapGen.bridgeTypes.medium).toBeValidMapObjOrNone();
            expect(mapGen.bridgeTypes.large).toBeValidMapObjOrNone();
            expect(mapGen.bridgeTypes.xlarge).toBeValidMapObjOrNone();
        });

        test("Custom Spawns", () => {
            for (const spawn of mapGen.customSpawnRules.placeSpawns) {
                expect(spawn).toBeValidMapObj();
            }
            for (const spawn of mapGen.customSpawnRules.locationSpawns) {
                expect(spawn.type).toBeValidMapObj();
            }
        });

        test("Density Spawns", () => {
            for (const spawn in mapGen.densitySpawns[0]) {
                expect(spawn).toBeValidMapObj();
            }
        });

        test("Fixed Spawns", () => {
            for (const spawn in mapGen.fixedSpawns[0]) {
                expect(spawn).toBeValidMapObj();
            }
        });

        test("random Spawns", () => {
            for (const spawn of mapGen.randomSpawns) {
                for (const type of spawn.spawns) {
                    expect(type).toBeValidMapObj();
                }
            }
        });

        test("Spawn Replacements", () => {
            const replc = mapGen.spawnReplacements[0];
            for (const spawnA in replc) {
                const spawnB = replc[spawnA];
                expect(spawnA).toBeValidMapObj();
                expect(spawnB).toBeValidMapObj();
            }
        });

        test("Important Spawns", () => {
            for (const spawn of mapDef.mapGen.importantSpawns) {
                expect(spawn).toBeValidMapObj();
            }
        });
    });
});
