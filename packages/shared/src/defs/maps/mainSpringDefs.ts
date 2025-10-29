import { util } from "../../utils/util";
import type { MapDef } from "../mapDefs";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    desc: {
        backgroundImg: "img/main_splash_7_3.png",
    },
    assets: {
        audio: [],
        atlases: ["gradient", "loadout", "shared", "main"],
    },
    biome: {
        colors: {
            background: 0x20536e,
            water: 0x3282ab,
            waterRipple: 0xb3f0ff,
            beach: 0xf4ae48,
            riverbank: 0x8a8a8a,
            grass: 0x5c910a,
            underground: 0x1b0d03,
            playerSubmerge: 0x2b8ca4,
            playerGhillie: 0x5b8e0a,
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
    },
    mapGen: {
        densitySpawns: [
            {
                stone_01: 350,
                barrel_01: 76,
                silo_01: 8,
                crate_01: 50,
                crate_02: 4,
                crate_03: 8,
                bush_01: 78,
                cache_06: 12,
                tree_07sp: 300,
                tree_08sp: 30,
                tree_08spb: 30,
                tree_07spr: 160,
                tree_08spr: 80,
                hedgehog_01: 24,
                container_01: 5,
                container_02: 5,
                container_03: 5,
                container_04: 5,
                shack_01: 7,
                outhouse_01: 5,
                loot_tier_1: 24,
                loot_tier_beach: 4,
            },
        ],
        fixedSpawns: [
            {
                warehouse_01: 2,
                house_red_01: { small: 2, large: 3 },
                house_red_02: { small: 2, large: 3 },
                barn_01: { small: 1, large: 3 },
                barn_02: 1,
                hut_01: 3,
                hut_02: 1,
                hut_03: 1,
                shack_03a: 2,
                shack_03b: { small: 2, large: 3 },
                greenhouse_01: 1,
                cache_01: 1,
                cache_02sp: 1,
                cache_07: 1,
                bunker_structure_01: { odds: 0.05 },
                bunker_structure_02: 1,
                bunker_structure_03: 1,
                bunker_structure_04: 1,
                bunker_structure_05: 1,
                warehouse_complex_01: 1,
                chest_01: 1,
                chest_03: { odds: 0.2 },
                mil_crate_02: { odds: 0.25 },
                tree_02: 3,
                teahouse_01: { small: 2, large: 3 },
                stone_04: 1,
                club_complex_01: 1,
            },
        ],
        spawnReplacements: [{ tree_01: "tree_07sp" }],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const MainSpring = util.mergeDeep({}, Main, mapDef) as MapDef;
