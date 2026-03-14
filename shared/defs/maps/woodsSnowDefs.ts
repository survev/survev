import { util } from "../../utils/util";
import type { MapDef } from "../mapDefs";
import type { PartialMapDef } from "./baseDefs";
import { Woods } from "./woodsDefs";

const mapDef: PartialMapDef = {
    assets: {
        audio: [
            { name: "vault_change_02", channel: "sfx" },
            { name: "footstep_08", channel: "sfx" },
            { name: "footstep_09", channel: "sfx" },
            { name: "snowball_01", channel: "sfx" },
            { name: "snowball_02", channel: "sfx" },
            { name: "snowball_pickup_01", channel: "ui" },
            { name: "helmet03_forest_pickup_01", channel: "ui" },
        ],
        atlases: ["gradient", "loadout", "shared", "woods"],
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
            playerGhillie: 0xbbbbbb,
        },
        particles: { camera: "falling_snow_slow" },
        tracerColors: {
            "762mm": {
                regular: 0x96a1e6,
                saturated: 0xabc4ff,
                alphaRate: 0.96,
                alphaMin: 0.4,
            },
        },
    },
    /* STRIP_FROM_PROD_CLIENT:START */
    lootTable: {
        tier_throwables: [
            { name: "frag", count: 3, weight: 1 },
            { name: "mirv", count: 2, weight: 0.75 },
            { name: "smoke", count: 1, weight: 0.75 },
            { name: "snowball", count: 5, weight: 0.5 },
        ],
        tier_airdrop_throwables: [
            { name: "mirv", count: 2, weight: 1 },
            { name: "snowball", count: 20, weight: 0.25 },
        ],
        tier_airdrop_melee: [
            { name: "", count: 1, weight: 13 },
            { name: "iceaxe", count: 1, weight: 1 },
            { name: "pan", count: 1, weight: 1 },
        ],
        tier_airdrop_outfits: [
            { name: "", count: 1, weight: 16 },
            { name: "outfitSpetsnaz", count: 1, weight: 5 },
            { name: "outfitMeteor", count: 1, weight: 5 },
            { name: "outfitGhillie", count: 1, weight: 0.5 },
        ],
        tier_outfits: [
            { name: "outfitCobaltShell", count: 1, weight: 0.2 },
            { name: "outfitWoodland", count: 1, weight: 0.2 },
            { name: "outfitWhite", count: 1, weight: 0.15 },
            { name: "outfitCarbonFiber", count: 1, weight: 0.15 },
            { name: "outfitBlackIce", count: 1, weight: 0.15 },
            { name: "outfitDarkGloves", count: 1, weight: 0.1 },
            { name: "outfitCamo", count: 1, weight: 0.1 },
            { name: "outfitSnow", count: 1, weight: 0.1 },
            { name: "outfitGhillie", count: 1, weight: 0.01 },
        ],
        tier_hatchet_melee: [
            { name: "fireaxe", count: 1, weight: 5 },
            { name: "tier_katanas", count: 1, weight: 3 },
            { name: "iceaxe", count: 1, weight: 1 },
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
    },
    mapGen: {
        fixedSpawns: [
            {
                camp_01w: {
                    small: 2,
                    large: 3,
                },
                logging_complex_02x: 1,
                logging_complex_03x: 2,
                warehouse_01: 3,
                workshop_complex_01w: 1,
                house_red_01x: 3,
                barn_01x: 3,
                cache_03: 48,
                cache_01w: 1,
                cache_02w: 1,
                cache_07w: 1,
                bunker_structure_01b: 1,
                bunker_structure_03: 1,
                bunker_structure_07: 1,
                teahouse_01x: {
                    small: 2,
                    large: 3,
                },
                chest_03: { odds: 0.5 },
                crate_19: 12,
                stone_04x: 6,
                tree_02: 6,
                tree_07: 1100,
                tree_08: 1100,
                tree_08b: 150,
                tree_09: 84,
            },
        ],
        spawnReplacements: [
            {
                bridge_lg_01: "bridge_lg_01x",
                container_01: "container_01x",
                crate_02: "crate_19",
                crate_08: "crate_19",
                crate_09: "crate_19",
                outhouse_01: "outhouse_01x",
                shack_01: "shack_01x",
                warehouse_01: "warehouse_01x",
                warehouse_02: "warehouse_02x",
                bush_01: "bush_01x",
                chest_03: "chest_03x",
                crate_01: "crate_01x",
                stone_01: "stone_01x",
                stone_03: "stone_03x",
                tree_01: "tree_07",
                // make eye bunkers have the proper woods recorders
                recorder_01: "recorder_08",
                recorder_02: "recorder_09",
            },
        ],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const WoodsSnow = util.mergeDeep({}, Woods, mapDef) as MapDef;
