import { util } from "../../utils/util";
import { v2 } from "../../utils/v2";
import type { MapDef } from "../mapDefs";
import { MapId } from "../types/misc";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    mapId: MapId.Birthday,
    desc: {
        name: "Birthday",
        icon: "img/gui/birthday.svg",
        buttonCss: "btn-mode-birthday",
    },
    assets: {
        audio: [],
        atlases: ["gradient", "loadout", "shared", "main"],
    },
    biome: {
        colors: {
            background: 0x20536e,
            water: 0x80af49, // this is the ground color bc of the bug
            waterRipple: 0xb3f0ff,
            beach: 0x719644, // this is the border color bc of the bug
            riverbank: 0x905e24,
            grass: 0x80af49,
            underground: 0x1b0d03,
            playerSubmerge: 0x2b8ca4,
            playerGhillie: 0x83af50,
        },
        valueAdjust: 1,
        sound: { riverShore: "sand" },
        particles: { camera: "" },
        tracerColors: {},
        airdrop: {
            planeImg: "map-plane-01.img",
            planeSound: "plane_01",
            airdropImg: "map-chute-01.img",
        },
    },
    gameMode: {
        maxPlayers: 80,
        killLeaderEnabled: true,
    },
    gameConfig: {
        planes: {
            timings: [],
        },
    },
    /* STRIP_FROM_PROD_CLIENT:START */
    // NOTE: this loot table is not the original one so its not accurate
    // ? are guesses based on statistics
    // ! are uncertain data based on leak
    lootTable: {
        tier_world: [
            { name: "tier_guns", count: 1, weight: 0.4 }, // TODO get more data on this from original
            { name: "tier_scopes", count: 1, weight: 0.15 }, // ?
            { name: "tier_armor", count: 1, weight: 0.15 }, // ?
            { name: "tier_medical", count: 1, weight: 0.15 }, // ?
            { name: "tier_packs", count: 1, weight: 0.2 }, // ?
            { name: "tier_outfits", count: 1, weight: 0.01 }, // ?
        ],
        tier_scopes: [
            { name: "2xscope", count: 1, weight: 24 },
            { name: "4xscope", count: 1, weight: 8 },
            { name: "8xscope", count: 1, weight: 2 }, // ?
            { name: "15xscope", count: 1, weight: 0.08 }, // ?
        ],
        tier_armor: [
            { name: "helmet01", count: 1, weight: 10 }, // !
            { name: "helmet02", count: 1, weight: 6 },
            { name: "helmet03", count: 1, weight: 0.2 },
            { name: "chest01", count: 1, weight: 15 }, // !
            { name: "chest02", count: 1, weight: 6 },
            { name: "chest03", count: 1, weight: 0.2 },
        ],
        tier_packs: [
            { name: "backpack01", count: 1, weight: 15 }, // !
            { name: "backpack02", count: 1, weight: 7 },
            { name: "backpack03", count: 1, weight: 0.7 },
        ],
        tier_medical: [
            { name: "bandage", count: 5, weight: 16 },
            { name: "healthkit", count: 1, weight: 4 },
            { name: "soda", count: 1, weight: 15 },
            { name: "painkiller", count: 1, weight: 5 },
        ],
        tier_guns: [
            { name: "ak47", count: 1, weight: 8 },
            { name: "mosin", count: 1, weight: 1 },
            { name: "m39", count: 1, weight: 0.5 },
            { name: "saiga", count: 1, weight: 0.5 },
            { name: "mp5", count: 1, weight: 10 },
            { name: "m870", count: 1, weight: 9 },
            { name: "m9", count: 1, weight: 10 },
        ],
        tier_outfits: [
            // CHECK IF THERE ARE ANY OTHER SKINS
            { name: "outfitWhite", count: 1, weight: 0.2 }, // yes
            { name: "outfitWoodland", count: 1, weight: 0.1 }, // yes
            { name: "outfitKeyLime", count: 1, weight: 0.15 },
            { name: "outfitRed", count: 1, weight: 0.1 }, // yes
            { name: "outfitCamo", count: 1, weight: 0.1 },
        ],
    },
    mapGen: {
        map: {
            baseWidth: 512,
            baseHeight: 512,
            scale: { small: 1.1875, large: 1.21875 },
            extension: 112,
            shoreInset: -1,
            grassInset: 0,
            rivers: {
                lakes: [],
                weights: [{ weight: 1, widths: [] }],
                smoothness: 1,
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
                name: "Cordial Creek",
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
        ],
        bridgeTypes: {
            medium: "",
            large: "",
            xlarge: "",
        },
        customSpawnRules: {
            locationSpawns: [],
            placeSpawns: [],
        },
        densitySpawns: [
            {
                stone_01: 250,
                barrel_01bd: 70,
                silo_01: 16,
                crate_01: 120,
                tree_01: 300,
                loot_tier_1: 100,
            },
        ],
        fixedSpawns: [
            {
                // none lol
            },
        ],
        randomSpawns: [
            {
                spawns: [],
                choose: 0,
            },
        ],
        spawnReplacements: [{}],
        importantSpawns: [],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const Birthday = util.mergeDeep({}, Main, mapDef) as MapDef;
