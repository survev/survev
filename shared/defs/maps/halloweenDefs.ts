import { GameConfig } from "../../gameConfig";
import { util } from "../../utils/util";
import type { MapDef } from "../mapDefs";
import { MapId } from "../types/misc";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    mapId: MapId.Halloween,

    desc: {
        name: "Halloween",
        icon: "img/gui/pumpkin-play.svg",
        buttonCss: "btn-mode-halloween",
        backgroundImg: "img/main_splash_halloween.png",
    },
    assets: {
        audio: [
            {
                name: "log_01",
                channel: "sfx",
            },
            {
                name: "log_02",
                channel: "sfx",
            },
            {
                name: "pumpkin_break_01",
                channel: "sfx",
            },
            {
                name: "vault_change_02",
                channel: "sfx",
            },
            {
                name: "kill_leader_assigned_01",
                channel: "ui",
            },
            {
                name: "kill_leader_assigned_02",
                channel: "ui",
            },
            {
                name: "kill_leader_dead_01",
                channel: "ui",
            },
            {
                name: "kill_leader_dead_02",
                channel: "ui",
            },
            {
                name: "trick_01",
                channel: "ui",
            },
            {
                name: "trick_02",
                channel: "ui",
            },
            {
                name: "trick_03",
                channel: "ui",
            },
            {
                name: "treat_01",
                channel: "ui",
            },
            {
                name: "xp_pickup_01",
                channel: "ui",
            },
            {
                name: "xp_pickup_02",
                channel: "ui",
            },
            {
                name: "xp_drop_01",
                channel: "sfx",
            },
            {
                name: "xp_drop_02",
                channel: "sfx",
            },
        ],
        atlases: ["gradient", "loadout", "shared", "halloween"],
    },
    biome: {
        colors: {
            background: 0x170000,
            water: 0x280000,
            waterRipple: 0x100101,
            beach: 0x64410e,
            riverbank: 0x3c1b05,
            grass: 0x212404,
            underground: 0x120801,
            playerSubmerge: 0x140000,
        },
        particles: {
            camera: "falling_leaf_halloween",
        },
        valueAdjust: 0.3,
    },
    gameMode: {
        maxPlayers: 80,
        killLeaderEnabled: true,
        spookyKillSounds: true,
    },
    /* STRIP_FROM_PROD_CLIENT:START */
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
                    options: {
                        type: GameConfig.Plane.Airdrop,
                        airdropType: "airdrop_crate_02h",
                    },
                },
            ],
            crates: [
                { name: "airdrop_crate_01", weight: 10 },
                { name: "airdrop_crate_02", weight: 1 },
            ],
        },
    },
    lootTable: {
        tier_throwables: [
            { name: "frag", count: 2, weight: 0.5 },
            { name: "smoke", count: 1, weight: 1 },
            { name: "mirv", count: 2, weight: 0.05 },
        ],
        tier_airdrop_outfits: [
            { name: "", count: 1, weight: 4 },
            { name: "outfitAirdrop", count: 1, weight: 1 },
        ],
        tier_toilet: [
            { name: "tier_guns", count: 1, weight: 0.1 },
            { name: "tier_scopes", count: 1, weight: 0.05 },
            { name: "tier_medical", count: 1, weight: 0.6 },
            {
                name: "tier_throwables",
                count: 1,
                weight: 0.05,
            },
            { name: "tier_outfits", count: 1, weight: 0 },
        ],
        tier_container: [
            { name: "tier_guns", count: 1, weight: 0.29 },
            { name: "tier_ammo", count: 1, weight: 0.04 },
            { name: "tier_scopes", count: 1, weight: 0.15 },
            { name: "tier_armor", count: 1, weight: 0.1 },
            {
                name: "tier_medical",
                count: 1,
                weight: 0.17,
            },
            {
                name: "tier_throwables",
                count: 1,
                weight: 0.05,
            },
            { name: "tier_packs", count: 1, weight: 0.09 },
            { name: "tier_outfits", count: 1, weight: 0 },
        ],
        tier_scopes: [
            { name: "2xscope", count: 1, weight: 24 },
            { name: "4xscope", count: 1, weight: 5 },
        ],
        tier_airdrop_scopes: [
            { name: "", count: 1, weight: 18 },
            { name: "4xscope", count: 1, weight: 0 },
        ],
        tier_outfits: [
            { name: "outfitBarrel", count: 1, weight: 1 },
            { name: "outfitWoodBarrel", count: 1, weight: 1 },
            { name: "outfitStone", count: 1, weight: 1 },
            { name: "outfitHalloweenTree", count: 1, weight: 1 },
            { name: "outfitStump", count: 1, weight: 1 },
            { name: "outfitBush", count: 1, weight: 1 },
            { name: "outfitLeafPile", count: 1, weight: 1 },
            { name: "outfitCrate", count: 1, weight: 1 },
            { name: "outfitTable", count: 1, weight: 1 },
            { name: "outfitSoviet", count: 1, weight: 1 },
            { name: "outfitOven", count: 1, weight: 1 },
            { name: "outfitRefrigerator", count: 1, weight: 1 },
            { name: "outfitVending", count: 1, weight: 1 },
            { name: "outfitPumpkin", count: 1, weight: 1 },
            { name: "outfitWoodpile", count: 1, weight: 1 },
            { name: "outfitToilet", count: 1, weight: 1 },
            { name: "outfitBushRiver", count: 1, weight: 1 },
            { name: "outfitCrab", count: 1, weight: 1 },
            { name: "outfitStumpAxe", count: 1, weight: 1 },
        ],
    },
    mapGen: {
        map: {
            scale: { small: 1.1875, large: 1.1875 },
            rivers: {
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
            },
        },
        customSpawnRules: {
            locationSpawns: [],
        },
        densitySpawns: [
            {
                stone_01: 125,
                barrel_01: 76,
                crate_01: 120,
                crate_02: 6,
                crate_03: 8,
                bush_01: 90,
                hedgehog_01: 12,
                cache_pumpkin_01: 32,
                cache_pumpkin_03: 32,
                shack_01: 6,
                outhouse_01: 6,
                loot_tier_1: 48,
                loot_tier_beach: 8,
            },
        ],
        fixedSpawns: [
            {
                junkyard_01: 1,
                warehouse_01h: 4,
                house_red_01h: 7,
                barn_01h: 1,
                cache_03: 36,
                cache_01: 1,
                cache_02h: 1,
                mansion_structure_02: 1,
                bunker_structure_01: 1,
                bunker_structure_03: 1,
                bunker_structure_07: 1,
                mil_crate_02: { odds: 0.25 },
                tree_05: 72,
                tree_07: 700,
                tree_08: 200,
                tree_09: 36,
                barrel_02: 24,
                oven_01: 24,
                refrigerator_01: 24,
                table_01: 24,
                vending_01: 24,
                woodpile_01: 24,
                stone_04: 1,
            },
        ],
        randomSpawns: [],
        spawnReplacements: [
            {
                tree_01: "tree_07",
                stone_03: "stone_01",
                cabin_01: "cabin_02",
            },
        ],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const Halloween = util.mergeDeep({}, Main, mapDef) as MapDef;
