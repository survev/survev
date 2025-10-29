import { GameConfig } from "../../gameConfig";
import { util } from "../../utils/util";
import { v2 } from "../../utils/v2";
import type { MapDef } from "../mapDefs";
import { MapId } from "../types/misc";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    mapId: MapId.Woods,
    desc: {
        name: "Woods",
        icon: "img/gui/player-king-woods.svg",
        buttonCss: "btn-mode-woods",
    },
    assets: {
        audio: [
            { name: "vault_change_02", channel: "sfx" },
            { name: "footstep_08", channel: "sfx" },
            { name: "footstep_09", channel: "sfx" },
            { name: "helmet03_forest_pickup_01", channel: "ui" },
        ],
        atlases: ["gradient", "loadout", "shared", "woods"],
    },
    biome: {
        colors: {
            background: 0x20536e,
            water: 0x3282ab,
            waterRipple: 0xb3f0ff,
            beach: 0xefb35b,
            riverbank: 0x77360b,
            grass: 0x8e832a,
            underground: 0x1b0d03,
            playerSubmerge: 0x2b8ca4,
        },
        particles: { camera: "falling_leaf" },
    },
    gameMode: { maxPlayers: 80, woodsMode: true },
    gameConfig: {
        /* STRIP_FROM_PROD_CLIENT:START */
        planes: {
            timings: [
                {
                    circleIdx: 1,
                    wait: 10,
                    options: { type: GameConfig.Plane.Airdrop },
                },
                {
                    circleIdx: 3,
                    wait: 2,
                    options: { type: GameConfig.Plane.Airdrop },
                },
            ],
            crates: [
                { name: "airdrop_crate_01", weight: 10 },
                { name: "airdrop_crate_02", weight: 1 },
            ],
        },
        /* STRIP_FROM_PROD_CLIENT:END */
        bagSizes: {
            frag: [6, 12, 15, 18],
            smoke: [6, 12, 15, 18],
        },
    },
    /* STRIP_FROM_PROD_CLIENT:START */
    lootTable: {
        tier_guns: [
            { name: "dp28", count: 1, weight: 3.5 },
            { name: "m1100", count: 1, weight: 3 },
            { name: "mp220", count: 1, weight: 1.5 },
            { name: "saiga", count: 1, weight: 0.1 },
            { name: "spas12", count: 1, weight: 3 },
            { name: "qbb97", count: 1, weight: 0.1 },
            { name: "bar", count: 1, weight: 3 },
            { name: "pkp", count: 1, weight: 0.005 },
            { name: "m249", count: 1, weight: 0.008 },
        ],
        tier_ammo: [
            { name: "762mm", count: 60, weight: 3 },
            { name: "556mm", count: 60, weight: 6 },
            { name: "12gauge", count: 10, weight: 1 },
        ],
        tier_ammo_crate: [
            { name: "762mm", count: 60, weight: 3 },
            { name: "556mm", count: 60, weight: 6 },
            { name: "12gauge", count: 10, weight: 1 },
        ],
        tier_throwables: [
            { name: "frag", count: 3, weight: 1 },
            { name: "mirv", count: 2, weight: 0.5 },
            { name: "smoke", count: 1, weight: 1 },
            { name: "strobe", count: 1, weight: 0.2 },
        ],
        tier_armor: [
            { name: "helmet01", count: 1, weight: 3 },
            { name: "helmet02", count: 1, weight: 2 },
            { name: "helmet03", count: 1, weight: 1 },
            { name: "chest01", count: 1, weight: 3 },
            { name: "chest02", count: 1, weight: 2 },
            { name: "chest03", count: 1, weight: 1 },
        ],
        tier_packs: [
            { name: "backpack01", count: 1, weight: 3 },
            { name: "backpack02", count: 1, weight: 2 },
            { name: "backpack03", count: 1, weight: 1 },
        ],
        tier_chest: [
            { name: "dp28", count: 1, weight: 0.5 },
            { name: "saiga", count: 1, weight: 0.1 },
            { name: "spas12", count: 1, weight: 1 },
            { name: "qbb97", count: 1, weight: 0.1 },
            { name: "bar", count: 1, weight: 1 },
            { name: "helmet03", count: 1, weight: 1 },
            { name: "chest03", count: 1, weight: 1 },
            { name: "4xscope", count: 1, weight: 1 },
            { name: "8xscope", count: 1, weight: 0.5 },
            { name: "pkp", count: 1, weight: 0.05 },
            { name: "m249", count: 1, weight: 0.05 },
        ],
        tier_airdrop_throwables: [
            { name: "frag", count: 2, weight: 1 },
            { name: "mirv", count: 2, weight: 0.5 },
            { name: "strobe", count: 1, weight: 0.5 },
        ],
        tier_airdrop_uncommon: [
            { name: "mirv", count: 8, weight: 1 },
            { name: "strobe", count: 2, weight: 0.5 },
            { name: "saiga", count: 1, weight: 1 },
            { name: "qbb97", count: 1, weight: 2 },
        ],
        tier_airdrop_rare: [
            { name: "usas", count: 1, weight: 2 },
            { name: "pkp", count: 1, weight: 0.08 },
            { name: "m249", count: 1, weight: 1 },
            { name: "m9", count: 1, weight: 0.005 },
        ],
        tier_airdrop_ammo: [
            { name: "762mm", count: 30, weight: 3 },
            { name: "556mm", count: 30, weight: 3 },
            { name: "12gauge", count: 5, weight: 3 },
        ],
        tier_hatchet: [
            { name: "usas", count: 1, weight: 2 },
            { name: "pkp", count: 1, weight: 0.08 },
            { name: "m249", count: 1, weight: 1 },
        ],
        tier_airdrop_melee: [
            { name: "", count: 1, weight: 19 },
            { name: "stonehammer", count: 1, weight: 1 },
            { name: "pan", count: 1, weight: 1 },
        ],
    },
    mapGen: {
        map: {
            scale: { small: 1.1875, large: 1.21875 },
            shoreInset: 8,
            grassInset: 12,
            rivers: {
                lakes: [
                    {
                        odds: 1,
                        innerRad: 32,
                        outerRad: 96,
                        spawnBound: {
                            pos: v2.create(0.5, 0.5),
                            rad: 100,
                        },
                    },
                ],
                weights: [
                    { weight: 0.1, widths: [4] },
                    { weight: 0.15, widths: [8] },
                    { weight: 0.25, widths: [8, 4] },
                    { weight: 0.21, widths: [8] },
                    { weight: 0.09, widths: [8, 8] },
                    { weight: 0.2, widths: [8, 8, 4] },
                    {
                        weight: 1e-4,
                        widths: [8, 8, 8, 6, 4],
                    },
                ],
                smoothness: 0.45,
                masks: [],
            },
        },
        customSpawnRules: {
            locationSpawns: [
                {
                    type: "logging_complex_01",
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
                crate_01: 60,
                crate_03: 12,
                bush_01: 54,
                hedgehog_01: 12,
                container_01: 2,
                container_02: 2,
                container_03: 2,
                container_04: 2,
                shack_01: 2,
                outhouse_01: 1,
                loot_tier_1: 36,
                loot_tier_beach: 8,
            },
        ],
        fixedSpawns: [
            {
                logging_complex_01: 1,
                logging_complex_02: 1,
                logging_complex_03: 3,
                teapavilion_01w: 1,
                warehouse_01: 3,
                house_red_01: 3,
                barn_01: 3,
                cache_03: 48,
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
                tree_07: 1100,
                tree_08: 1100,
                tree_08b: 150,
                tree_09: 84,
            },
        ],
        randomSpawns: [],
        spawnReplacements: [
            {
                tree_01: "tree_07",
                crate_02: "crate_19",
                crate_08: "crate_19",
                crate_09: "crate_19",
                // make eye bunkers have the proper woods recorders
                recorder_01: "recorder_08",
                recorder_02: "recorder_09",
            },
        ],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};
export const Woods = util.mergeDeep({}, Main, mapDef) as MapDef;
