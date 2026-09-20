import { util } from "../../utils/util.ts";
import type { MapDef } from "../mapDefs.ts";
import { Main, type PartialMapDef } from "./baseDefs.ts";

/** A compact island using the normal game's buildings, cover and loot rules. */
export const Duel = util.mergeDeep<MapDef>(
    {},
    Main,
    {
        desc: { name: "Ranked Duel" },
        gameMode: { maxPlayers: 8, killLeaderEnabled: false },
        /* STRIP_FROM_PROD_CLIENT:START */
        gameConfig: { planes: { timings: [] } },
        mapGen: {
            map: {
                baseWidth: 280,
                baseHeight: 280,
                scale: { small: 1, large: 1 },
                extension: 0,
                shoreInset: 18,
                grassInset: 10,
                rivers: { lakes: [], weights: [{ weight: 1, widths: [4] }], spawnCabins: false },
            },
            places: [{ name: "Duel Island", pos: { x: 0.5, y: 0.5 } }],
            customSpawnRules: { locationSpawns: [], placeSpawns: [] },
            densitySpawns: [{}],
            fixedSpawns: [{
                house_red_01: 2,
                warehouse_01: 1,
                container_01: 2,
                container_02: 2,
                stone_01: 38,
                tree_01: 38,
                bush_01: 16,
                barrel_01: 10,
                crate_01: 24,
                crate_03: 4,
                loot_tier_1: 28,
            }],
            randomSpawns: [],
            spawnReplacements: [{}],
            importantSpawns: [],
        },
        /* STRIP_FROM_PROD_CLIENT:END */
    } satisfies PartialMapDef,
) as MapDef;
