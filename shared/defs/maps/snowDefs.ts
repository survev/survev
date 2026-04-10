import { GameConfig } from "../../gameConfig";
import { util } from "../../utils/util";
import type { MapDef } from "../mapDefs";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    desc: {
        backgroundImg: "img/main_splash_0_6_10.png",
        icon: "img/loot/loot-throwable-snowball.svg",
        buttonCss: "btn-mode-snow",
    },
    assets: {
        audio: [
            { name: "snowball_01", channel: "sfx" },
            { name: "snowball_02", channel: "sfx" },
            { name: "plane_02", channel: "sfx" },
            { name: "bells_01", channel: "ui" },
            { name: "snowball_pickup_01", channel: "ui" },
        ],
        atlases: ["gradient", "loadout", "shared", "snow"],
    },
    biome: {
        colors: {
            background: 0x93639,
            water: 0xc4d51,
            waterRipple: 0xb3f0ff,
            beach: 0xcdb35b,
            riverbank: 0x905e24,
            grass: 0xbdbdbd,
            underground: 0x1b0d03,
            playerSubmerge: 0x2b8ca4,
            playerGhillie: 0xbbbbbb, // surviv never had a snow color for the ghillie at all, i checked, so keeping this value. - Leia
        },
        particles: { camera: "falling_snow_fast" },
        airdrop: {
            planeImg: "map-plane-01x.img",
            planeSound: "plane_02",
            airdropImg: "map-chute-01x.img",
        },
    },
    /* STRIP_FROM_PROD_CLIENT:START */
    gameConfig: {
        planes: {
            timings: [
                {
                    circleIdx: 0,
                    wait: 10,
                    options: { type: GameConfig.Plane.Airdrop },
                },
                {
                    circleIdx: 1,
                    wait: 10,
                    options: { type: GameConfig.Plane.Airdrop },
                },
                {
                    circleIdx: 2,
                    wait: 6,
                    options: { type: GameConfig.Plane.Airdrop },
                },
                {
                    circleIdx: 3,
                    wait: 2,
                    options: { type: GameConfig.Plane.Airdrop },
                },
            ],
            crates: [
                { name: "airdrop_crate_01x", weight: 10 },
                { name: "airdrop_crate_02x", weight: 1 },
            ],
        },
    },
    lootTable: {
        tier_airdrop_outfits: [
            { name: "", count: 1, weight: 3 },
            { name: "outfitElf", count: 1, weight: 1 },
        ],
        tier_throwables: [
            { name: "frag", count: 2, weight: 1 },
            { name: "smoke", count: 1, weight: 1 },
            { name: "mirv", count: 2, weight: 0.05 },
            { name: "snowball", count: 5, weight: 1 },
        ],
        tier_sv98: [{ name: "sv98_winter", count: 1, weight: 1 }],
        tier_guns: [
            { name: "famas", count: 1, weight: 0.9 },
            { name: "hk416", count: 1, weight: 4 },
            { name: "mk12", count: 1, weight: 0.1 },
            { name: "pkp", count: 1, weight: 0.005 },
            { name: "m249", count: 1, weight: 0.006 },
            { name: "ak47", count: 1, weight: 2.7 },
            { name: "scar", count: 1, weight: 0.01 },
            { name: "dp28", count: 1, weight: 0.5 },
            { name: "bar", count: 1, weight: 0.05 },
            { name: "mosin", count: 1, weight: 0.05 },
            { name: "m39", count: 1, weight: 0.1 },
            { name: "mp5", count: 1, weight: 10 },
            { name: "mac10", count: 1, weight: 6 },
            { name: "ump9", count: 1, weight: 3 },
            { name: "m870", count: 1, weight: 9 },
            { name: "m1100", count: 1, weight: 6 },
            { name: "mp220", count: 1, weight: 2 },
            { name: "saiga", count: 1, weight: 0.1 },
            { name: "ot38", count: 1, weight: 8 },
            { name: "m9", count: 1, weight: 19 },
            { name: "m93r", count: 1, weight: 5 },
            { name: "glock", count: 1, weight: 7 },
            { name: "deagle", count: 1, weight: 0.05 },
            { name: "vector", count: 1, weight: 0.01 },
            { name: "sv98_winter", count: 1, weight: 0.01 },
            { name: "spas12", count: 1, weight: 1 },
            { name: "qbb97", count: 1, weight: 0.01 },
            { name: "flare_gun", count: 1, weight: 0.145 }, // !
            { name: "flare_gun_dual", count: 1, weight: 0.0025 }, // !
            { name: "groza", count: 1, weight: 0.8 },
            { name: "scout_elite", count: 1, weight: 0.1 },
            { name: "vss", count: 1, weight: 0.1 }, // !
        ],
        tier_chest: [
            { name: "famas", count: 1, weight: 1.15 },
            { name: "hk416", count: 1, weight: 4 },
            { name: "mk12", count: 1, weight: 0.55 },
            { name: "m249", count: 1, weight: 0.07 },
            { name: "ak47", count: 1, weight: 4 },
            { name: "scar", count: 1, weight: 0.27 },
            { name: "dp28", count: 1, weight: 0.55 },
            { name: "bar", count: 1, weight: 0.27 },
            { name: "mosin", count: 1, weight: 0.55 },
            { name: "m39", count: 1, weight: 0.55 },
            { name: "saiga", count: 1, weight: 0.26 },
            { name: "mp220", count: 1, weight: 1.5 },
            { name: "deagle", count: 1, weight: 0.15 },
            { name: "vector", count: 1, weight: 0.1 },
            { name: "sv98_winter", count: 1, weight: 0.1 },
            { name: "spas12", count: 1, weight: 1 },
            { name: "groza", count: 1, weight: 1.15 },
            { name: "helmet02", count: 1, weight: 1 },
            { name: "helmet03", count: 1, weight: 0.25 },
            { name: "chest02", count: 1, weight: 1 },
            { name: "chest03", count: 1, weight: 0.25 },
            { name: "4xscope", count: 1, weight: 0.5 },
            { name: "8xscope", count: 1, weight: 0.25 },
        ],
        tier_barn_melee: [{ name: "iceaxe", count: 1, weight: 1 }],
        tier_airdrop_melee: [
            { name: "", count: 1, weight: 18 },
            { name: "iceaxe", count: 1, weight: 1 },
            { name: "pan", count: 1, weight: 1 },
        ],
        tier_airdrop_uncommon: [
            { name: "mk12", count: 1, weight: 2.5 },
            { name: "scar", count: 1, weight: 0.75 },
            { name: "bar", count: 1, weight: 1 },
            { name: "mosin", count: 1, weight: 1.5 },
            { name: "m39", count: 1, weight: 2.5 },
            { name: "saiga", count: 1, weight: 1 },
            { name: "deagle", count: 1, weight: 1 },
            { name: "vector", count: 1, weight: 1 },
            { name: "sv98_winter", count: 1, weight: 0.5 },
            { name: "qbb97", count: 1, weight: 1.5 },
            { name: "m9", count: 1, weight: 0.01 },
            { name: "flare_gun", count: 1, weight: 0.5 },
            { name: "scout_elite", count: 1, weight: 2.5 },
            { name: "vss", count: 1, weight: 2.5 }, // !
        ],
        tier_airdrop_rare: [
            { name: "garand", count: 1, weight: 6 },
            { name: "awc_winter", count: 1, weight: 3 },
            { name: "pkp", count: 1, weight: 0.08 },
            { name: "m249", count: 1, weight: 0.1 },
            { name: "m4a1", count: 1, weight: 4 },
            { name: "scorpion", count: 1, weight: 5 }, // ?
            { name: "ots38_dual", count: 1, weight: 4.5 },
        ],
        tier_airdrop_throwables: [
            { name: "frag", count: 2, weight: 1 },
            { name: "mirv", count: 2, weight: 0.5 },
            { name: "snowball", count: 10, weight: 0.5 },
        ],
        tier_eye_block: [
            { name: "m9", count: 1, weight: 1 },
            { name: "ots38_dual", count: 1, weight: 1.5 },
            { name: "flare_gun", count: 1, weight: 1.5 },
            { name: "svd_winter", count: 1, weight: 1.5 },
            { name: "762mm", count: 1, weight: 1 },
            { name: "snowball", count: 1, weight: 1 },
            { name: "scar", count: 1, weight: 1.5 },
            { name: "sv98_winter", count: 1, weight: 1 },
            { name: "awc_winter", count: 1, weight: 0.75 },
            { name: "pkp", count: 1, weight: 0.75 },
        ],
        tier_crow_case_melee: [
            { name: "crowbar", count: 1, weight: 3 },
            { name: "iceaxe", count: 1, weight: 1 },
        ],
        tier_outfits: [
            { name: "outfitCobaltShell", count: 1, weight: 0.3 },
            { name: "outfitWoodland", count: 1, weight: 0.3 },
            { name: "outfitBlackIce", count: 1, weight: 0.2 },
            { name: "outfitCamo", count: 1, weight: 0.15 },
            { name: "outfitSnow", count: 1, weight: 0.15 },
            { name: "outfitGhillie", count: 1, weight: 0.01 },
        ],
    },
    mapGen: {
        densitySpawns: [
            {
                stone_01x: 350,
                barrel_01: 76,
                silo_01: 8,
                crate_01x: 38,
                crate_02x: 4,
                crate_03: 8,
                crate_03x: 1,
                bush_01x: 78,
                cache_06: 12,
                tree_10: 300,
                tree_11: 20,
                hedgehog_01: 24,
                container_01x: 5,
                container_02: 5,
                container_03: 5,
                container_04: 5,
                shack_01x: 7,
                outhouse_01x: 5,
                loot_tier_1: 24,
                loot_tier_beach: 4,
            },
        ],
        fixedSpawns: [
            {
                // small is spawn count for solos and duos, large is spawn count for squads
                warehouse_01x: { small: 1, large: 2 },
                warehouse_03x: 1,
                house_red_01x: { small: 3, large: 4 },
                house_red_02x: { small: 3, large: 4 },
                barn_01x: { small: 1, large: 3 },
                barn_02x: 1,
                hut_01x: 3,
                hut_02x: 1, // spas hut
                hut_03: 1, // scout hut
                shack_03a: 2,
                shack_03x: { small: 2, large: 3 },
                greenhouse_02: 1,
                cache_01x: 1,
                cache_02x: 1, // mosin tree
                cache_07: 1,
                bunker_structure_01: { odds: 0.05 },
                bunker_structure_02: 1,
                bunker_structure_03: 1,
                bunker_structure_04: 1,
                bunker_structure_05: 1,
                warehouse_complex_01: 1,
                chest_01: 1,
                chest_03x: { odds: 0.2 },
                mil_crate_03: { odds: 0.25 },
                tree_02: 3,
                teahouse_complex_01x: {
                    small: 1,
                    large: 2,
                },
                stone_04x: 3, // had to add the whole table to change this...might want to consider adding some form of partial override - Stu
                camp_01: {
                    small: 2,
                    large: 3,
                },
            },
        ],
        randomSpawns: [
            {
                spawns: ["mansion_structure_01x", "police_01x", "bank_01x"],
                choose: 2,
            },
        ],
        spawnReplacements: [
            {
                bridge_lg_01: "bridge_lg_01x",
                bush_07: "bush_07x",
                cabin_01: "cabin_01x",
                container_01: "container_01x",
                crate_01: "crate_01x",
                crate_02: "crate_02x",
                mil_crate_02: "mil_crate_03",
                shack_01: "shack_01x",
                shack_02: "shack_02x",
                stone_03: "stone_03x",
                table_01: "table_01x",
                table_02: "table_02x",
                table_03: "table_03x",
                tree_01: "tree_10",
                warehouse_02: "warehouse_02x",
            },
        ],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const Snow = util.mergeDeep({}, Main, mapDef) as MapDef;
