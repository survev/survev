import { util } from "../../utils/util";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    desc: {
        name: "Turkey",
        icon: "",
        buttonCss: "",
        backgroundImg: "img/main_splash_turkey_01.png",
    },
    assets: {
        audio: [
            { name: "club_music_01", channel: "ambient" },
            { name: "club_music_02", channel: "ambient" },
            {
                name: "ambient_steam_01",
                channel: "ambient",
            },
            { name: "cluck_01", channel: "sfx" },
            { name: "cluck_02", channel: "sfx" },
            { name: "feather_01", channel: "sfx" },
            { name: "xp_pickup_01", channel: "ui" },
            { name: "xp_pickup_02", channel: "ui" },
            { name: "xp_drop_01", channel: "sfx" },
            { name: "xp_drop_02", channel: "sfx" },
            { name: "pumpkin_break_01", channel: "sfx" },
        ],
        atlases: ["main", "gradient", "loadout", "shared"],
    },
    biome: {
        colors: {
            background: 0x474d4a,
            water: 0x707b76,
            waterRipple: 0x7e8984,
            beach: 0xcc975b,
            riverbank: 0xbd5c21,
            grass: 0xa08b2f,
            underground: 0x1b0d03,
            playerSubmerge: 0x2b8ca4,
            playerGhillie: 0xa48e2e,
        },
    },
    mapGen: {
        densitySpawns: [
            {
                squash_01: 25,
                squash_02: 12,
                stone_01: 200,
                barrel_01: 76,
                silo_01: 9,
                crate_01: 45,
                crate_02: 3,
                crate_03: 7,
                bush_06tr: 70, // leaf pile turkey (without loot)
                cache_03: 50, // leaf pile with loot
                tree_07: 20,
                tree_08: 170,
                tree_08b: 4,
                hedgehog_01: 24,
                container_01: 5,
                container_02: 5,
                container_03: 5,
                container_04: 5,
                shack_01: 7,
                outhouse_01: 7,
                outhouse_02: 2, // fire axe outhouse
                loot_tier_1: 24,
                loot_tier_beach: 4,
                woodpile_02: 4,
            },
        ],
        fixedSpawns: [
            {
                // small is spawn count for solos and duos, large is spawn count for squads
                warehouse_01: 3,
                house_red_01: { small: 3, large: 4 },
                house_red_02: { small: 3, large: 4 },
                barn_01: { small: 1, large: 3 },
                barn_02: 1,
                hut_01: 1,
                hut_02: { odds: 0.05 }, // spas hut
                hut_03: { odds: 0.05 }, // scout hut
                shack_03a: 2,
                shack_03b: { small: 2, large: 3 },
                greenhouse_01: 1,
                cache_01: 1,
                cache_02w: 1, // mosin tree
                cache_07: 1,
                bunker_structure_01: { odds: 0.05 },
                bunker_structure_02: 1,
                bunker_structure_03: 1,
                bunker_structure_04: 1,
                bunker_structure_05: 1,
                warehouse_complex_01: 1,
                chest_01: 1,
                chest_03tr: { odds: 0.2 },
                mil_crate_02: { odds: 0.25 },
                tree_02: 4,
                stone_04: 1,
                club_complex_01: 1,
            },
        ],
        spawnReplacements: [
            {
                tree_01: "tree_08",
                stone_03: "stone_03tr",
            },
        ],
    },
    gameMode: { turkeyMode: 1 },
};

export const Turkey = util.mergeDeep({}, Main, mapDef);
