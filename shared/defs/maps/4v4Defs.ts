import { GameConfig } from "../../gameConfig";
import { util, type DeepPartial } from "../../utils/util";
import { v2 } from "../../utils/v2";
import type { MapDef } from "../mapDefs";
import { MapId } from "../types/misc";
import { Comp, PartialMapDef } from "./compDefs";

// @NOTE: Entries defined as single-element arrays, like fixedSpawns: [{ }],
// are done this way so that util.mergeDeep(...) will function as expected
// when used by derivative maps.
//
// Arrays are not mergeable, so the derived map will always redefine all
// elements if that property is set.

export const mapDef: PartialMapDef = {
    mapId: MapId.FourVsFour,
    desc: {
        name: "4v4",
        icon: "img/gui/gas.svg",
        buttonCss: "btn-mode-faction",
        buttonText: "4v4",
        backgroundImg: "img/main_splash.png",
    },
    biome: {
        colors: {
            background: 0x20536e,
            water: 0x3282ab,
            waterRipple: 0xb3f0ff,
            beach: 0xcdb35b,
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
            supplyImg: "map-supply-chute-01.img",
        },
    },
    gameMode: {
        maxPlayers: 80,
        killLeaderEnabled: true,

        freezeTime: 0,
        joinTime: 30, // time until players can move after game start
        airdropMinDistance: 300,
        unlimitedAdren: true,
        pickup: false,
        indicator: true,
        canDespawn: false,
        betterStats: true,

        edgeBuffer: 0, // distance to maps border (to prevent pakistani spawns)
        centerNoSpawnRadius: 0, // no spawn zone in the center of the map
        minSpawnRad: 0, // spawn radius away from alive players
        minPosSpawnRad: 0,

        announceTeams: false,
        betterMapGen: false,

        xpMultiplier: {
            kill: 0,
            damage: 0.00025, 
            win: 0.25,
            timeSurvived: 0.004, 
        },
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
                /* EU-Comp Special Supply Drop
                {
                    circleIdx: 1,
                    wait: 50,
                    options: { type: GameConfig.Plane.SupplyDrop, airdropType: "supply_crate_01" },
                },
                */
                {
                    circleIdx: 3,
                    wait: 2,
                    options: { type: GameConfig.Plane.Airdrop },
                },
            ],
            crates: [
                { name: "airdrop_crate_01", weight: 5 },
                { name: "airdrop_crate_02", weight: 1 },
            ],
        },
        bagSizes: {},
        bleedDamage: 2,
        bleedDamageMult: 1,
    },

    //default items
    defaultItems: {
            weapons: [
                { type: "spas12", ammo: 9 },
                { type: "mosin", ammo: 5 },
                { type: "fists", ammo: 0 },
                { type: "", ammo: 0 },
            ],
            outfit: "outfitDarkShirt",
            backpack: "backpack03",
            helmet: "helmet03",
            chest: "chest03",
            scope: "4xscope",
            perks: [],
            inventory: {
                "9mm": 0,
                "762mm": 0,
                "556mm": 0,
                "12gauge": 0,
                "50AE": 0,
                "308sub": 0,
                flare: 0,
                "45acp": 0,
                frag: 8,
                smoke: 4,
                strobe: 1,
                mirv: 4,
                snowball: 0,
                potato: 0,
                coconut: 12,
                bandage: 30,
                healthkit: 4,
                soda: 0,
                painkiller: 0,
                "1xscope": 1,
                "2xscope": 1,
                "4xscope": 1,
                "8xscope": 0,
                "15xscope": 0,
            },
        },


    // NOTE: this loot table is not the original one so its not accurate
    // ? are guesses based on statistics
    // ! are uncertain data based on leak
    mapGen: {
        map: {
            baseWidth: 210,
            baseHeight: 210,
            scale: { small: 1, large: 1 },
            extension: 0,
            shoreInset: 3,
            grassInset: 6,
            rivers: {
                lakes: [],
                weights: [
                    { weight: 1, widths: [] },
                ],
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
        bridgeTypes: {
            medium: "",
            large: "",
            xlarge: "",
        },
        customSpawnRules: {
            locationSpawns: [],
            placeSpawns: ["warehouse_01", "house_red_01", "house_red_02", "barn_01"],
        },
        densitySpawns: [
            {
                stone_01: 25,
                barrel_01: 5,
                tree_01: 30,
            },
        ],
        fixedSpawns: [
            {
                stone_01: 45,
                barrel_01: 6,
                silo_01: 1,
                tree_01: 60,
                container_01: 1,
                container_02: 2,
                container_03: 1,
                container_04: 2,
                outhouse_01: 3,
                stone_01_indestructible: 1,
            },
        ],
        randomSpawns: [
            {
                spawns: ["logging_complex_01local", "mansion_structure_01", "police_01", "club_complex_01", "warehouse_complex_01", "workshop_complex_01", "logging_complex_01local", "kopje_patch_01", "river_town_02_local", "desert_town_02_local"],
                choose: 1,
            },
            {
                spawns: ["bank_01", "greenhouse_01", "saloon_structure_01"],
                choose: 2,
            },
            {
                spawns: ["warehouse_01", "house_red_01", "house_red_02", "barn_01", "barn_02" ],
                choose: 2,
            },
            {
                spawns: ["teahouse_complex_01su", "shack_01", "shack_01", "shack_01" ],
                choose: 3,
            }
        ],
        spawnReplacements: [{}],
        importantSpawns: ["logging_complex_01local", "mansion_structure_01", "police_01", "club_complex_01", "warehouse_complex_01", "workshop_complex_01", "logging_complex_01local", "kopje_patch_01", "river_town_02_local", "desert_town_02_local"],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const FourVsFour = util.mergeDeep({}, Comp, mapDef);
