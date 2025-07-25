import { util } from "../../utils/util";
import { v2 } from "../../utils/v2";
import type { MapDef } from "../mapDefs";
import type { PartialMapDef } from "./baseDefs";
import { Woods } from "./woodsDefs";

const mapDef: PartialMapDef = {
    biome: {
        colors: {
            background: 0x20536e,
            water: 0x3282ab,
            waterRipple: 0xb3f0ff,
            beach: 0xdc9e28,
            riverbank: 0xa37119,
            grass: 0x629522,
            underground: 0x1b0d03,
            playerSubmerge: 0x2b8ca4,
            playerGhillie: 0x659825,
        },
        particles: { camera: "falling_leaf_summer" },
    },
    mapGen: {
        customSpawnRules: {
            locationSpawns: [
                {
                    type: "logging_complex_01su",
                    pos: v2.create(0.5, 0.5),
                    rad: 200,
                    retryOnFailure: true,
                },
            ],
        },
        fixedSpawns: [
            {
                logging_complex_01su: 1,
                logging_complex_02su: 1,
                logging_complex_03su: 3,
                teapavilion_01w: 1,
                warehouse_01: 3,
                house_red_01: 3,
                barn_01: 3,
                cache_06: 48,
                cache_01: 1,
                cache_02w: 1,
                bunker_structure_01b: 1,
                bunker_structure_03: 1,
                bunker_structure_07: 1,
                teahouse_01: {
                    small: 2,
                    large: 3,
                },
                chest_03: { odds: 0.5 },
                crate_19: 12,
                stone_04: 6,
                tree_02: 6,
                tree_07su: 1100,
                tree_08su: 1100,
                tree_08sub: 150,
                tree_09: 84,
            },
        ],
        spawnReplacements: [
            {
                ...Woods.mapGen.spawnReplacements[0],
                tree_01: "tree_07su",
                tree_02: "tree_07su",
                tree_07: "tree_07su",
            },
        ],
    },
};

export const WoodsSummer = util.mergeDeep({}, Woods, mapDef) as MapDef;
