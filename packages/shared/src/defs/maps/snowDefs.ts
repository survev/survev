import { GameConfig } from "../../gameConfig";
import { util } from "../../utils/util";
import type { MapDef } from "../mapDefs";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    desc: {
        backgroundImg: "img/main_splash_0_6_10.png",
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
        frozenSprites: ["player-snow-01.img", "player-snow-02.img", "player-snow-03.img"],
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
            { name: "snowball", count: 5, weight: 0.5 },
        ],
        tier_airdrop_throwables: [
            { name: "frag", count: 2, weight: 1 },
            { name: "mirv", count: 2, weight: 0.5 },
            { name: "snowball", count: 10, weight: 0.5 },
        ],
    },
    mapGen: {
        densitySpawns: [
            {
                stone_01x: 350,
                barrel_01: 76,
                silo_01: 8,
                crate_01: 38,
                crate_02: 4,
                crate_03: 8,
                crate_03x: 1,
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
        randomSpawns: [],
        spawnReplacements: [
            {
                bank_01: "bank_01x",
                barn_01: "barn_01x",
                bridge_lg_01: "bridge_lg_01x",
                cabin_01: "cabin_01x",
                container_01: "container_01x",
                greenhouse_01: "greenhouse_02",
                house_red_01: "house_red_01x",
                house_red_02: "house_red_02x",
                hut_01: "hut_01x",
                hut_02: "hut_02x",
                mansion_01: "mansion_01x",
                outhouse_01: "outhouse_01x",
                police_01: "police_01x",
                shack_01: "shack_01x",
                shack_02: "shack_02x",
                shack_03a: "shack_03x",
                warehouse_01: "warehouse_01x",
                warehouse_02: "warehouse_02x",
                bush_01: "bush_01x",
                bush_07: "bush_07x",
                chest_03: "chest_03x",
                crate_01: "crate_01x",
                crate_02: "crate_02x",
                stone_01: "stone_01x",
                stone_03: "stone_03x",
                table_01: "table_01x",
                table_02: "table_02x",
                table_03: "table_03x",
                tree_01: "tree_10",
                mil_crate_02: "mil_crate_03",
            },
        ],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const Snow = util.mergeDeep({}, Main, mapDef) as MapDef;
