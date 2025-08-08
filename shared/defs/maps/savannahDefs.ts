import { GameConfig } from "../../gameConfig";
import { util } from "../../utils/util";
import { v2 } from "../../utils/v2";
import { MapId } from "../types/misc";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    mapId: MapId.Savannah,

    desc: {
        name: "Savannah",
        icon: "img/gui/player-the-hunted.svg",
        buttonCss: "btn-mode-savannah",
    },
    assets: {
        audio: [],
        atlases: ["gradient", "loadout", "shared", "savannah"],
    },
    biome: {
        colors: {
            background: 0x1c5b5f,
            water: 0x41a4aa,
            waterRipple: 0x96f0f6,
            beach: 0xcb7132,
            riverbank: 0xb25e24,
            grass: 0xb4b02e,
            underground: 0x3d0d03,
            playerSubmerge: 0x4e9b8f,
            playerGhillie: 0xb0ac2b,
        },
        particles: {},
    },
    gameMode: { maxPlayers: 80, sniperMode: true },
    gameConfig: {
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
                { name: "airdrop_crate_01sv", weight: 10 },
                { name: "airdrop_crate_02sv", weight: 1 },
            ],
        },
    },
    mapGen: {
        map: {
            baseWidth: 512,
            baseHeight: 512,
            scale: { small: 1.1875, large: 1.28125 },
            extension: 112,
            shoreInset: 24,
            grassInset: 12,
            rivers: {
                lakes: [
                    {
                        odds: 1,
                        innerRad: 32,
                        outerRad: 48,
                        spawnBound: {
                            pos: v2.create(0.5, 0.5),
                            rad: 200,
                        },
                    },
                    {
                        odds: 1,
                        innerRad: 16,
                        outerRad: 32,
                        spawnBound: {
                            pos: v2.create(0.5, 0.5),
                            rad: 200,
                        },
                    },
                    {
                        odds: 1,
                        innerRad: 16,
                        outerRad: 32,
                        spawnBound: {
                            pos: v2.create(0.5, 0.5),
                            rad: 200,
                        },
                    },
                ],
                weights: [{ weight: 1, widths: [4] }],
                smoothness: 0.45,
                spawnCabins: false,
                masks: [],
            },
        },
        places: [
            {
                name: "The Killpit",
                pos: v2.create(0.53, 0.64),
            },
            {
                name: "Sweatbath",
                pos: v2.create(0.84, 0.18),
            },
            {
                name: "Tarkhany",
                pos: v2.create(0.15, 0.11),
            },
            {
                name: "Ytyk-Kyuyol",
                pos: v2.create(0.25, 0.42),
            },
            {
                name: "Todesfelde",
                pos: v2.create(0.81, 0.85),
            },
            {
                name: "Pineapple",
                pos: v2.create(0.21, 0.79),
            },
            {
                name: "Fowl Forest",
                pos: v2.create(0.73, 0.47),
            },
            {
                name: "Ranchito Pollo",
                pos: v2.create(0.53, 0.25),
            },
        ],
        customSpawnRules: {
            locationSpawns: [],
            placeSpawns: [],
        },
        densitySpawns: [
            {
                stone_01: 72,
                barrel_01: 48,
                propane_01: 24,
                stone_07: 6,
                crate_01: 50,
                crate_02sv: 4,
                crate_03: 8,
                crate_21b: 2,
                bush_01sv: 48,
                tree_01sv: 48,
                hedgehog_01: 24,
                tree_12: 24,
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
                grassy_cover_01: { small: 8, large: 9 },
                grassy_cover_02: { small: 8, large: 9 },
                grassy_cover_03: { small: 8, large: 9 },
                grassy_cover_complex_01: { small: 2, large: 3 },
                brush_clump_01: { small: 11, large: 13 },
                brush_clump_02: { small: 11, large: 13 },
                brush_clump_03: { small: 11, large: 13 },
                perch_01: { small: 11, large: 13 },
                kopje_patch_01: { small: 2, large: 3 },
                savannah_patch_01: { small: 4, large: 5 },
                mansion_structure_01: 1,
                warehouse_01: { small: 4, large: 5 },
                crate_02sv_lake: 1,
                cache_01: 1,
                cache_02sv: 1, // mosin tree
                cache_07: 1,
                bunker_structure_01: 1,
                bunker_structure_03: 1,
                chest_01: 1,
                chest_03sv: 1,
                mil_crate_05: { small: 6, large: 8 },
                tree_02: 3,
            },
        ],
        randomSpawns: [],
        spawnReplacements: [
            {
                tree_01: "tree_01sv",
                bush_01: "bush_01sv",
                crate_02: "crate_02sv",
                stone_03: "stone_03sv",
            },
        ],
    },
};

export const Savannah = util.mergeDeep({}, Main, mapDef);
