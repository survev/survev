import { util } from "../../utils/util";
import { v2 } from "../../utils/v2";
import type { MapDef } from "../mapDefs";
import type { PartialMapDef } from "./baseDefs";
import { Woods } from "./woodsDefs";

const mapDef: PartialMapDef = {
    desc: {
        buttonCss: "btn-woods-spring-mode",
    },
    assets: {
        audio: [
            { name: "vault_change_02", channel: "sfx" },
            { name: "footstep_08", channel: "sfx" },
            { name: "footstep_09", channel: "sfx" },
            {
                name: "helmet03_forest_pickup_01",
                channel: "ui",
            },
            { name: "ability_stim_01", channel: "sfx" },
            { name: "leader_dead_01", channel: "ui" },
        ],
        atlases: ["gradient", "loadout", "shared", "woods"],
    },
    biome: {
        colors: {
            background: 0x20536e,
            water: 0x3282ab,
            waterRipple: 0xb3f0ff,
            beach: 0xefb35b,
            riverbank: 0x8a8a8a,
            grass: 0x426609,
            underground: 0x1b0d03,
            playerSubmerge: 0x2b8ca4,
            playerGhillie: 0x41630a,
        },
        sound: { riverShore: "stone" },
        particles: { camera: "falling_leaf_spring" },
    },
    /* STRIP_FROM_PROD_CLIENT:START */
    lootTable: {
        // this override is not from the leak!
        tier_chrys_case: [
            { name: "", count: 1, weight: 2 }, // ?
            { name: "helmet03_moon", count: 1, weight: 3 },
            { name: "tier_katanas", count: 1, weight: 3 }, // ?
            { name: "naginata", count: 1, weight: 1 }, // ?
        ],
        tier_ghillie: [
            {
                name: "outfitGhillie",
                count: 1,
                weight: 1,
            },
        ],
    },
    mapGen: {
        customSpawnRules: {
            locationSpawns: [
                {
                    type: "logging_complex_01sp",
                    pos: v2.create(0.5, 0.5),
                    rad: 200,
                    retryOnFailure: true,
                },
            ],
        },
        densitySpawns: [
            {
                stone_01: 48,
                barrel_01: 36,
                cache_06: 34,
                crate_01: 60,
                crate_03: 12,
                crate_19: 12,
                bush_01: 54,
                hedgehog_01: 12,
                container_01: 2,
                container_02: 2,
                container_03: 2,
                container_04: 2,
                shack_01: 2,
                outhouse_01: 3,
                loot_tier_1: 36,
                loot_tier_beach: 12,
                tree_08sp: 350,
                tree_08spb: 100,
                tree_07sp: 1200,
                tree_07spr: 106,
                tree_08spr: 53,
                tree_09: 60,
            },
        ],
        fixedSpawns: [
            {
                logging_complex_01sp: 1,
                logging_complex_02sp: 1,
                logging_complex_03sp: 3,
                teapavilion_01w: 1,
                warehouse_01: { small: 3, large: 4 },
                house_red_01: { small: 3, large: 4 },
                barn_01: { small: 3, large: 4 },
                cache_01: 1,
                cache_02sp: 1,
                bunker_structure_01b: 1,
                bunker_structure_03: 1,
                bunker_structure_07: 1,
                chest_03: { odds: 0.5 },
                stone_04: { small: 6, large: 8 },
                tree_02: { small: 6, large: 8 },
                teahouse_01: { small: 2, large: 3 },
            },
        ],
        spawnReplacements: [
            {
                bush_07: "bush_07sp",
                tree_01: "tree_07sp",
                tree_07: "tree_07sp",
                crate_02: "crate_19",
                crate_08: "crate_19",
                crate_09: "crate_19",
                recorder_01: "recorder_08",
                recorder_02: "recorder_09",
            },
        ],
        importantSpawns: [
            "logging_complex_01sp",
            "logging_complex_02sp",
            "teapavilion_01w",
        ],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const WoodsSpring = util.mergeDeep({}, Woods, mapDef) as MapDef;
