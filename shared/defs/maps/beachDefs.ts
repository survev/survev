import { GameConfig } from "../../gameConfig";
import { util } from "../../utils/util";
import { v2 } from "../../utils/v2";
import type { MapDef } from "../mapDefs";
import { MapId } from "../types/misc";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    mapId: MapId.Beach,
    desc: {
        name: "Beach",
        icon: "img/loot/loot-throwable-coconut.svg",
        buttonCss: "btn-mode-beach",
    },
    assets: {
        audio: [
            { name: "coconut_01", channel: "sfx" },
            { name: "potato_pickup_01", channel: "ui" },
        ],
        atlases: ["gradient", "loadout", "shared", "main", "beach"],
    },
    biome: {
        colors: {
            background: 0x20536e,
            water: 0x42b0ba,
            waterRipple: 0xb3f0ff,
            beach: 0xffe7ba,
            riverbank: 0xa37119,
            grass: 0x7ba865,
            underground: 0x1b0d03,
            playerSubmerge: 0x2b8ca4,
            playerGhillie: 0x7dac66,
        },
    },
    gameConfig: {
        planes: {
            timings: [
                {
                    circleIdx: 0,
                    wait: 25,
                    options: { type: GameConfig.Plane.Airdrop },
                },
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
    },
    /* STRIP_FROM_PROD_CLIENT:START */
    lootTable: {
        tier_soviet: [
            { name: "tier_guns", count: 1, weight: 1.75 },
            { name: "tier_surviv", count: 1, weight: 2.5 },
            { name: "tier_chest", count: 1, weight: 0.75 },
        ],
        tier_throwables: [
            { name: "frag", count: 2, weight: 1 },
            { name: "smoke", count: 1, weight: 1 },
            { name: "mirv", count: 2, weight: 0.05 },
            { name: "coconut", count: 3, weight: 0.4 },
        ],
        tier_chest: [
            { name: "hk416", count: 1, weight: 4 },
            { name: "ak47", count: 1, weight: 4 },
            { name: "mp220", count: 1, weight: 1.75 },
            { name: "groza", count: 1, weight: 1.25 },
            { name: "famas", count: 1, weight: 1 },
            { name: "spas12", count: 1, weight: 0.77 },
            { name: "mk12", count: 1, weight: 0.77 },
            { name: "m39", count: 1, weight: 0.77 },
            { name: "dp28", count: 1, weight: 0.77 },
            { name: "scar", count: 1, weight: 0.27 },
            { name: "bar", count: 1, weight: 0.27 },
            { name: "scout_elite", count: 1, weight: 0.27 },
            { name: "saiga", count: 1, weight: 0.27 },
            { name: "mosin", count: 1, weight: 0.15 },
            { name: "deagle", count: 1, weight: 0.15 },
            { name: "vector", count: 1, weight: 0.1 },
            { name: "m249", count: 1, weight: 0.05 },
            { name: "sv98", count: 1, weight: 0.05 },
            { name: "helmet02", count: 1, weight: 1 },
            { name: "helmet03", count: 1, weight: 0.3 },
            { name: "chest02", count: 1, weight: 1 },
            { name: "chest03", count: 1, weight: 0.3 },
            { name: "4xscope", count: 1, weight: 0.5 },
            { name: "8xscope", count: 1, weight: 0.25 },
        ],
        tier_airdrop_throwable: [{ name: "coconut", count: 4, weight: 1 }],
        tier_pirate_melee: [
            { name: "hook", count: 1, weight: 1 },
            { name: "cutlass", count: 1, weight: 2 },
        ],
        tier_outfits: [
            { name: "outfitAqua", count: 1, weight: 0.3 },
            { name: "outfitCoral", count: 1, weight: 0.3 },
            { name: "outfitIslander", count: 1, weight: 0.3 },
            { name: "outfitBeachCamo", count: 1, weight: 0.25 },
            { name: "outfitGhillie", count: 1, weight: 0.01 },
        ],
        tier_airdrop_melee: [
            { name: "", count: 1, weight: 15 },
            { name: "cutlass", count: 1, weight: 4 },
            { name: "pan", count: 1, weight: 1 },
        ],
        tier_airdrop_outfits: [
            { name: "", count: 1, weight: 10 },
            { name: "outfitPineapple", count: 1, weight: 8 },
            { name: "outfitWave", count: 1, weight: 8 },
            { name: "outfitGhillie", count: 1, weight: 0.5 },
        ],
        tier_pirate_outfits: [
            { name: "outfitRoyalFortune", count: 1, weight: 1 },
            { name: "outfitParrotfish", count: 1, weight: 1 },
        ],
    },
    mapGen: {
        map: {
            baseWidth: 512,
            baseHeight: 512,
            scale: { small: 1.1875, large: 1.28125 },
            extension: 112,
            shoreInset: 72,
            grassInset: 48,
            rivers: {
                lakes: [],
                weights: [
                    { weight: 0.25, widths: [20, 16] },
                    { weight: 0.25, widths: [18, 18, 4] },
                    { weight: 0.25, widths: [18, 4, 4] },
                    { weight: 0.25, widths: [16, 16, 10] },
                    { weight: 0.25, widths: [16, 16, 6, 4] },
                    { weight: 0.25, widths: [16, 10, 10] },
                    {
                        weight: 1e-4,
                        widths: [16, 10, 10, 4, 4],
                    },
                ],
                smoothness: 0.45,
                spawnCabins: true,
                masks: [],
            },
        },
        places: [
            {
                name: "The Sandpit",
                pos: v2.create(0.53, 0.64),
            },
            {
                name: "Sunburn",
                pos: v2.create(0.84, 0.18),
            },
            {
                name: "Okhotsk",
                pos: v2.create(0.15, 0.11),
            },
            {
                name: "Ytyk-Plaz",
                pos: v2.create(0.25, 0.42),
            },
            {
                name: "Todesinsel",
                pos: v2.create(0.81, 0.85),
            },
            {
                name: "Coconut",
                pos: v2.create(0.21, 0.79),
            },
            {
                name: "Sandy Shores",
                pos: v2.create(0.73, 0.47),
            },
            {
                name: "Playa Pollo",
                pos: v2.create(0.53, 0.25),
            },
        ],
        bridgeTypes: {
            medium: "bridge_md_structure_01",
            large: "",
            xlarge: "",
        },
        densitySpawns: [
            {
                stone_01: 275,
                barrel_01: 76,
                silo_01: 3,
                crate_01: 50,
                crate_03: 8,
                crate_09bh: 6,
                bush_01: 78,
                cache_06bh: 12,
                tree_01: 75,
                tree_13bh: 195,
                tree_14: 35,
                hedgehog_01: 10,
                container_01: 5,
                container_02: 5,
                container_03: 5,
                container_04: 5,
                shack_01: 7,
                outhouse_01: 5,
                loot_tier_1: 24,
                loot_tier_beach: 24,
                barrel_05: 10,
            },
        ],
        fixedSpawns: [
            {
                // small is spawn count for solos and duos, large is spawn count for squads
                warehouse_01: 1,
                house_red_01: { small: 2, large: 3 },
                house_red_02: { small: 2, large: 3 },
                barn_01: { small: 2, large: 3 },
                barn_02: 1,
                hut_01bh: { small: 5, large: 6 },
                hut_02: 1, // spas hut
                hut_03: 1, // scout hut
                hut_04: 1, // pirate hut
                shack_03a: 2,
                shack_03b: { small: 4, large: 6 },
                cache_01bh: 1,
                cache_02bh: 1,
                cache_07bh: 1,
                bunker_structure_01: { odds: 0.25 },
                bunker_structure_02: 1,
                bunker_structure_03: 1,
                bunker_structure_04: 1,
                bunker_structure_05: 1,
                warehouse_complex_01: 1,
                chest_01: 1,
                chest_02: 2,
                chest_03: { odds: 0.5 },
                mil_crate_02: { odds: 0.25 },
                tree_02: 3,
                teahouse_complex_01su: {
                    small: 1,
                    large: 2,
                },
                stone_04: 1,
                mansion_structure_03: 1,
            },
        ],
        randomSpawns: [
            {
                spawns: [],
            },
        ],
        spawnReplacements: [
            {
                bush_01: "bush_03",
                stone_03: "stone_03bh",
            },
        ],
        importantSpawns: ["club_complex_01", "warehouse_complex_01"],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const Beach = util.mergeDeep({}, Main, mapDef) as MapDef;
