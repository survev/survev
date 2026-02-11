import "./testHelpers";
import { describe, expect, test } from "vitest";
import { Atlases } from "../../client/atlas-builder/atlasDefs";
import { type MapDef, MapDefs } from "../../shared/defs/mapDefs";
import { Constants } from "../../shared/net/net";

const maps = Object.keys(MapDefs);

describe.for(maps)("Map %s", (map) => {
    const mapDef: MapDef = MapDefs[map as keyof typeof MapDefs];

    describe("Loot Tables", () => {
        test.for(Object.entries(mapDef.lootTable))(
            "Loot table $0",
            ([tableId, table]) => {
                const itemsSet = new Set();
                for (const item of table) {
                    itemsSet.add(item.name);
                    if (item.name.startsWith("tier_")) {
                        expect(item.name).toBeValidLootTier();
                    } else if (item.name !== "") {
                        expect(item.name).toBeValidLoot();
                    }
                }
                expect(itemsSet.size, "Loot table must not have duplicated items").toBe(
                    table.length,
                );

                expect(tableId).toBeValidLootTier();
            },
        );
    });

    describe("Airdrop Crates", () => {
        test.for(mapDef.gameConfig.planes.crates)("Crate %$", (crate) => {
            expect(crate.name).toBeValidMapObj();
        });
    });

    if (mapDef.gameConfig.unlocks) {
        describe("Unlocks", () => {
            test.for(mapDef.gameConfig.unlocks!.timings)("Unlock %$", (unlock) => {
                expect(unlock.type).toBeValidMapObj();
            });
        });
    }

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

        test.for(mapGen.customSpawnRules.placeSpawns)("Place Spawn %$", (spawn) => {
            expect(spawn).toBeValidMapObj();
        });

        test.for(mapGen.customSpawnRules.locationSpawns)("Location Spawn %$", (spawn) => {
            expect(spawn.type).toBeValidMapObj();
        });

        test.for(Object.entries(mapGen.densitySpawns[0]))("Density Spawn $0", ([key]) => {
            expect(key).toBeValidMapObj();
        });

        test.for(Object.entries(mapGen.fixedSpawns[0]))("Fixed Spawn $0", ([key]) => {
            expect(key).toBeValidMapObj();
        });

        test.for(mapGen.randomSpawns.map((p) => p.spawns).flat())(
            "Random Spawn %0",
            (spawn) => {
                expect(spawn).toBeValidMapObj();
            },
        );

        test.for(Object.entries(mapGen.spawnReplacements[0]))(
            "Spawn Replacement $0",
            ([key]) => {
                expect(key).toBeValidMapObj();
            },
        );

        test.for(mapGen.importantSpawns)("Important Spawn $0", (spawn) => {
            expect(spawn).toBeValidMapObj();
        });
    });

    describe("No duplicated sprites", () => {
        const sprites = new Set<string>();

        test.for(mapDef.assets.atlases)("Atlas $0", (atlas) => {
            const atlasDef = Atlases[atlas];
            for (const sprite of atlasDef.images) {
                expect(sprites.has(sprite), `Duplicated sprite ${sprite}`).toBeFalsy();

                sprites.add(sprite);
            }
        });
    });
});
