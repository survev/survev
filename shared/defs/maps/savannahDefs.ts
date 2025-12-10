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
    lootTable: {
        tier_scopes: [
            { name: "4xscope", count: 1, weight: 5 },
            { name: "8xscope", count: 1, weight: 1 }, // ?
            { name: "15xscope", count: 1, weight: 0.02 }, // ?
        ],
        tier_guns: [
            { name: "scar", count: 1, weight: 1 },
            { name: "scorpion", count: 1, weight: 1 },
            { name: "mp5", count: 1, weight: 5 },
            { name: "mac10", count: 1, weight: 6 },
            { name: "ump9", count: 1, weight: 3 },
            { name: "m1a1", count: 1, weight: 5 },
            { name: "ot38", count: 1, weight: 4 },
            { name: "colt45", count: 1, weight: 4 },
            { name: "m9", count: 1, weight: 9 },
            { name: "m1911", count: 1, weight: 9 },
            { name: "flare_gun", count: 1, weight: 0.145 },
            { name: "flare_gun_dual", count: 1, weight: 0.0025 },
            { name: "model94", count: 1, weight: 6 }, // ?
            { name: "blr", count: 1, weight: 6 }, // ?
            { name: "scout_elite", count: 1, weight: 3 }, // ?
            { name: "mk12", count: 1, weight: 2 }, // ?
            { name: "m39", count: 1, weight: 2 }, // ?
            { name: "vss", count: 1, weight: 1.5 }, // ?
            { name: "mosin", count: 1, weight: 0.75 }, // ?
            { name: "mkg45", count: 1, weight: 0.75 }, // ?
            { name: "l86", count: 1, weight: 0.75 }, // ?
            { name: "svd", count: 1, weight: 0.75 }, // ?
            { name: "garand", count: 1, weight: 0.45 }, // ?
            { name: "scarssr", count: 1, weight: 0.15 }, // ?
            { name: "awc", count: 1, weight: 0.15 }, // ?
            { name: "sv98", count: 1, weight: 0.1 }, // ?
        ],
        tier_airdrop_uncommon: [
            { name: "mk12", count: 1, weight: 2.5 },
            { name: "scar", count: 1, weight: 0.75 },
            { name: "mosin", count: 1, weight: 2.5 },
            { name: "m39", count: 1, weight: 2.5 },
            { name: "sv98", count: 1, weight: 0.5 },
            { name: "m9", count: 1, weight: 0.01 },
            { name: "flare_gun", count: 1, weight: 0.5 },
            { name: "mkg45", count: 1, weight: 2.5 }, // !
            { name: "vss", count: 1, weight: 2.5 }, // !
            { name: "l86", count: 1, weight: 0.75 }, // ?
            { name: "svd", count: 1, weight: 0.75 }, // ?
            { name: "scarssr", count: 1, weight: 0.15 }, // ?
            { name: "awc", count: 1, weight: 0.15 }, // ?
            { name: "sv98", count: 1, weight: 0.1 }, // ?
        ],
        tier_airdrop_rare: [
            { name: "garand", count: 1, weight: 6 },
            { name: "awc", count: 1, weight: 3 },
            { name: "scarssr", count: 1, weight: 3 },
            { name: "sv98", count: 1, weight: 3 },
            { name: "scorpion", count: 1, weight: 5 }, // ?
            { name: "ots38_dual", count: 1, weight: 4.5 },
        ],
        tier_ammo: [
            { name: "9mm", count: 30, weight: 3 },
            { name: "45acp", count: 30, weight: 3 },
            { name: "762mm", count: 30, weight: 3 },
            { name: "556mm", count: 30, weight: 3 },
        ],
        tier_ammo_crate: [
            { name: "9mm", count: 30, weight: 3 },
            { name: "45acp", count: 30, weight: 3 },
            { name: "762mm", count: 30, weight: 3 },
            { name: "556mm", count: 30, weight: 3 },
            { name: "308sub", count: 5, weight: 1 },
            { name: "flare", count: 1, weight: 1 },
        ],
        tier_airdrop_ammo: [
            { name: "9mm", count: 30, weight: 3 },
            { name: "45acp", count: 30, weight: 3 },
            { name: "762mm", count: 30, weight: 3 },
            { name: "556mm", count: 30, weight: 3 },
        ],
        tier_chest: [
            { name: "mk12", count: 1, weight: 0.55 },
            { name: "scar", count: 1, weight: 0.27 },
            { name: "mosin", count: 1, weight: 0.55 },
            { name: "m39", count: 1, weight: 0.55 },
            { name: "sv98", count: 1, weight: 0.1 },
            { name: "helmet02", count: 1, weight: 1 },
            { name: "helmet03", count: 1, weight: 0.25 },
            { name: "chest02", count: 1, weight: 1 },
            { name: "chest03", count: 1, weight: 0.25 },
            { name: "4xscope", count: 1, weight: 0.5 },
            { name: "8xscope", count: 1, weight: 0.25 },
        ],
        tier_hatchet: [
            { name: "vss", count: 1, weight: 1 },
            { name: "svd", count: 1, weight: 1 },
            { name: "l86", count: 1, weight: 1 },
        ],
        tier_throwables: [
            { name: "frag", count: 2, weight: 1 },
            { name: "smoke", count: 1, weight: 1 },
            { name: "strobe", count: 1, weight: 0.2 },
            { name: "mirv", count: 2, weight: 0.05 },
        ],
        tier_airdrop_throwables: [
            { name: "strobe", count: 1, weight: 1 },
            { name: "mirv", count: 2, weight: 1 },
        ],
    },
    mapGen: {
        map: {
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
                cache_01sv: 1,
                cache_02sv: 1, // mosin tree
                cache_07: 1,
                bunker_structure_01sv: 1,
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
                stone_03: "stone_03sv",
            },
        ],
    },
};

export const Savannah = util.mergeDeep({}, Main, mapDef);
