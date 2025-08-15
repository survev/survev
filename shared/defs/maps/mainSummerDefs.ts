import { util } from "../../utils/util";
import type { MapDef } from "../mapDefs";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    assets: {
        audio: [
            { name: "club_music_01", channel: "ambient" },
            { name: "club_music_02", channel: "ambient" },
            {
                name: "ambient_steam_01",
                channel: "ambient",
            },
            { name: "log_11", channel: "sfx" },
            { name: "log_12", channel: "sfx" },
        ],
        atlases: ["gradient", "loadout", "shared", "main"],
    },
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
    },
    /* STRIP_FROM_PROD_CLIENT:START */
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
                tree_01: 320,
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
                house_red_01: { small: 3, large: 4 },
                house_red_02: { small: 3, large: 4 },
                barn_01: { small: 1, large: 3 },
                barn_02: 1,
                hut_01: 3,
                hut_02: 1,
                hut_03: 1,
                shack_03a: 2,
                shack_03b: { small: 2, large: 3 },
                greenhouse_01: 1,
                cache_01: 1,
                cache_02su: 1,
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
                teahouse_complex_01su: {
                    small: 1,
                    large: 2,
                },
                stone_04: 1,
                club_complex_01: 1,
            },
        ],
        spawnReplacements: [{ bush_01: "bush_01f", tree_01: "tree_08su" }],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const MainSummer = util.mergeDeep({}, Main, mapDef) as MapDef;
