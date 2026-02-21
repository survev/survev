import { GameConfig } from "../../gameConfig";
import type { DeepPartial } from "../../utils/util";
import { v2 } from "../../utils/v2";
import type { MapDef } from "../mapDefs";
import { MapId } from "../types/misc";

// @NOTE: Entries defined as single-element arrays, like fixedSpawns: [{ }],
// are done this way so that util.mergeDeep(...) will function as expected
// when used by derivative maps.
//
// Arrays are not mergeable, so the derived map will always redefine all
// elements if that property is set.

export const FourVsFour: MapDef = {
    mapId: MapId.FourVsFour,
    desc: {
        name: "4v4",
        icon: "img/gui/gas.svg",
        buttonCss: "btn-mode-faction",
        buttonText: "4v4",
        backgroundImg: "img/main_splash.png",
    },
    assets: {
        audio: [
            { name: "club_music_01", channel: "ambient" },
            { name: "club_music_02", channel: "ambient" },
            { name: "ambient_steam_01", channel: "ambient" },
            { name: "log_11", channel: "sfx" },
            { name: "log_12", channel: "sfx" },
        ],
        atlases: ["gradient", "loadout", "shared", "main"],
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

        edgeBuffer: 0, // distance to maps border (to prevent pakistani spawns)
        centerNoSpawnRadius: 0, // no spawn zone in the center of the map
        minSpawnRad: 0, // spawn radius away from alive players
        minPosSpawnRad: 0,
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
            perks: ["takedown", "endless_ammo"],
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
    lootTable: {
        tier_world: [
            { name: "tier_guns", count: 1, weight: 0.28995 }, // TODO get more data on this from original 30%
            { name: "tier_ammo", count: 1, weight: 0.25 }, // ? 30%
            { name: "tier_scopes", count: 1, weight: 0.18 }, // ? 20%
            { name: "tier_armor", count: 1, weight: 0.18 }, // ? 20%
            { name: "tier_medical", count: 1, weight: 0.26 }, // ? 20%
            { name: "tier_throwables", count: 1, weight: 0.05 }, // ? 5%
            { name: "tier_packs", count: 1, weight: 0.15 }, // ? 9%
            //{ name: "pkm", count: 1, weight: 0.00005 }, // ? 0.01% (1/10000)
        ],
        tier_surviv: [
            { name: "tier_scopes", count: 1, weight: 0.15 }, // TODO get more data on this from original 23%
            { name: "tier_armor", count: 1, weight: 0.15 }, // ? 23%
            { name: "tier_medical", count: 1, weight: 0.2 }, // ? 31%
            { name: "tier_throwables", count: 1, weight: 0.05 }, // ? 8%
            { name: "tier_packs", count: 1, weight: 0.11 }, // ? 14%
        ],
        tier_container: [
            { name: "tier_guns", count: 1, weight: 0.27 }, // 27
            { name: "tier_ammo", count: 1, weight: 0.04 }, // 4
            { name: "tier_scopes", count: 1, weight: 0.15 }, // 15
            { name: "tier_armor", count: 1, weight: 0.2 }, // 20
            { name: "tier_medical", count: 1, weight: 0.2 }, // 20
            { name: "tier_throwables", count: 1, weight: 0.05 }, // 5
            { name: "tier_packs", count: 1, weight: 0.011 }, // 9
            //{ name: "tier_outfits", count: 1, weight: 0.035 }, // ! 3
        ],
        tier_leaf_pile: [
            { name: "tier_ammo", count: 1, weight: 0.19 },
            { name: "tier_scopes", count: 1, weight: 0.19 },
            { name: "tier_armor", count: 1, weight: 0.19 },
            { name: "tier_medical", count: 1, weight: 0.25 },
            { name: "tier_throwables", count: 1, weight: 0.12 },
            { name: "tier_packs", count: 1, weight: 0.05 },
        ],
        tier_soviet: [
            { name: "tier_guns", count: 1, weight: 3 }, // ?
            { name: "tier_armor", count: 1, weight: 2 }, // ?
            { name: "tier_packs", count: 1, weight: 1 }, // ?
        ],
        tier_toilet: [
            { name: "tier_guns", count: 1, weight: 0.1 },
            { name: "tier_scopes", count: 1, weight: 0.05 },
            { name: "tier_medical", count: 1, weight: 0.6 },
            { name: "tier_throwables", count: 1, weight: 0.05 },
            //{ name: "tier_outfits", count: 1, weight: 0.025 }, // !
        ],
        tier_metal_toilet: [
            { name: "tier_scopes", count: 1, weight: 0.2 },
            { name: "chest02", count: 1, weight: 0.15 },
            { name: "helmet02", count: 1, weight: 0.15 },
            { name: "tier_medical", count: 1, weight: 0.2 },
            { name: "spas12", count: 1, weight: 0.1 },
            { name: "m870", count: 1, weight: 0.1 },
            { name: "mp220", count: 1, weight: 0.1 },
            //{ name: "tier_outfits", count: 1, weight: 0.025 }, // !
        ],
        tier_scopes: [
            { name: "2xscope", count: 1, weight: 10 },
            { name: "4xscope", count: 1, weight: 30 },
            //{ name: "8xscope", count: 1, weight: 1 }, // ?
            //{ name: "15xscope", count: 1, weight: 0.02 }, // ?
        ],
        tier_armor: [
            { name: "helmet01", count: 1, weight: 6 }, // !
            { name: "helmet02", count: 1, weight: 10 },
            { name: "helmet03", count: 1, weight: 0.15 },
            { name: "chest01", count: 1, weight: 6 }, // !
            { name: "chest02", count: 1, weight: 15 },
            { name: "chest03", count: 1, weight: 0.15 },
        ],
        tier_packs: [
            { name: "backpack01", count: 1, weight: 13 }, // !
            { name: "backpack02", count: 1, weight: 8 },
            { name: "backpack03", count: 1, weight: 1 },
        ],
        tier_medical: [
            { name: "bandage", count: 5, weight: 16 },
            { name: "healthkit", count: 1, weight: 4 },
            { name: "tier_soda", count: 1, weight: 20 },
            { name: "painkiller", count: 1, weight: 10 },
        ],
        tier_health: [
            { name: "bandage", count: 5, weight: 10 },
            { name: "healthkit", count: 1, weight: 4 },
        ],
        tier_soda: [
            { name: "soda", count: 2, weight: 1},
            { name: "soda", count: 1, weight: 1},
        ],
        tier_throwables: [
            { name: "frag", count: 2, weight: 1 }, // !
            { name: "smoke", count: 1, weight: 1 },
            { name: "mirv", count: 2, weight: 0.05 },
        ],
        tier_better_throwables: [
            { name: "frag", count: 3, weight: 0.6 }, // !
            { name: "smoke", count: 2, weight: 0.2 },
            { name: "mirv", count: 2, weight: 1 },
        ],
        tier_ammo: [
            { name: "9mm", count: 60, weight: 0.25 },
            { name: "762mm", count: 60, weight: 0.25 },
            { name: "556mm", count: 60, weight: 0.25 },
            { name: "12gauge", count: 10, weight: 0.25 },
        ],
        tier_ammo_crate: [
            { name: "9mm", count: 60, weight: 3 },
            { name: "762mm", count: 60, weight: 3 },
            { name: "556mm", count: 60, weight: 3 },
            { name: "12gauge", count: 10, weight: 3 },
            { name: "50AE", count: 21, weight: 1 },
            { name: "flare", count: 1, weight: 1.5 },
            { name: "45acp", count: 60, weight: 3 },
        ],
        tier_vending_soda: [
            { name: "soda", count: 1, weight: 2 }, // ?
            { name: "tier_medical", count: 1, weight: 1 }, // ?
        ],
        tier_beverage_crate: [
            { name: "soda", count: 1, weight: 1.5 }, // ?
            { name: "tier_health", count: 1, weight: 1 }, // ?
        ],
        tier_sv98: [{ name: "sv98", count: 1, weight: 1 }],
        tier_scopes_sniper: [
            { name: "4xscope", count: 1, weight: 5 }, // ?
            //{ name: "8xscope", count: 1, weight: 1 }, // ?
           // { name: "15xscope", count: 1, weight: 0.02 }, // ?
        ],
        tier_mansion_floor: [{ name: "outfitCasanova", count: 1, weight: 0.66 }, { name: "saw", count: 1, weight: 33 }],
        tier_vault_floor: [{ name: "crowbar", count: 1, weight: 1 }],
        tier_police_floor: [{ name: "kukri_trad", count: 1, weight: 1 }],
        tier_fragtastic: [
            { name: "", count: 1, weight: 1 },
            { name: "outfitFragtastic", count: 1, weight: 0.15 },
        ],
        tier_turkey_outfit: [
            { name: "", count: 1, weight: 1 },
            { name: "outfitTurkey", count: 1, weight: 0.05 },
        ],
        tier_hydra_floor: [{ name: "spade", count: 1, weight: 1 }],
        tier_chrys_01: [{ name: "outfitImperial", count: 1, weight: 1 }],
        tier_chrys_02: [{ name: "katana", count: 1, weight: 1 }],
        tier_chrys_03: [
            { name: "scout_elite", count: 1, weight: 0.85 },
            { name: "scorpion", count: 1, weight: 0.15 },
            //{ name: "2xscope", count: 1, weight: 5 }, // ?
            //{ name: "4xscope", count: 1, weight: 5 }, // ?
            //{ name: "8xscope", count: 1, weight: 5 }, // ?
            //{ name: "15xscope", count: 1, weight: 0.1 }, // ?
        ],
        tier_pink_bush: [
            { name: "model94", count: 1, weight: 0.33 },  // 1/3 for every gun
            { name: "vector45", count: 1, weight: 0.33 },
            { name: "mkg45", count: 1, weight: 0.33 },
        ],
        tier_crab: [
            { name: "model94", count: 1, weight: 0.4 },
            { name: "", count: 1, weight: 0.6 },
        ],
        tier_chrys_case: [
            { name: "", count: 1, weight: 5 }, // ?
            { name: "tier_katanas", count: 1, weight: 3 }, // ?
            { name: "naginata", count: 1, weight: 1 }, // ?
        ],
        tier_crow_case_melee: [{ name: "crowbar", count: 1, weight: 1 }],
        tier_crow_case_skin: [
            { name: "outfitCarbonFiber", count: 1, weight: 1 },
            { name: "outfitDarkGloves", count: 1, weight: 1 },
        ],
        tier_eye_02: [{ name: "stonehammer", count: 1, weight: 1 }],
        tier_eye_block: [
            { name: "flare_gun", count: 1, weight: 0.12 }, // 12%
            { name: "an94", count: 1, weight: 0.23 }, // 20%
            //{ name: "tier_hawk", count: 1, weight: 0.16 }, // 16%
            { name: "sv98", count: 1, weight: 0.1 }, // 10%
            //{ name: "m134", count: 1, weight: 0.13 }, // 15%
            { name: "pkp", count: 1, weight: 0.13 }, // 14%
            { name: "awc", count: 1, weight: 0.1 }, // 10%
            //{ name: "pkm", count: 1, weight: 0.03 }, // 3%
        ],
        tier_eye_stone: [
            { name: "vector45", count: 1, weight: 1 },
            { name: "45acp", count: 1, weight: 1 },
            { name: "garand", count: 1, weight: 1 },
            { name: "strobe", count: 1, weight: 1 },
            { name: "healthkit", count: 1, weight: 1 },
            { name: "painkiller", count: 1, weight: 1 },
            { name: "m4a1", count: 1, weight: 0.7 },
            { name: "m249", count: 1, weight: 0.2 },
            { name: "scarssr", count: 1, weight: 0.1 },
            { name: "awc", count: 1, weight: 0.1 },
            { name: "pkp", count: 1, weight: 0.1 },
        ],
        tier_barn_melee: [{ name: "sledgehammer", count: 1, weight: 1 }],
        tier_sledgehammer: [{ name: "sledgehammer", count: 1, weight: 1 }],
        tier_chest_04: [
            { name: "p30l", count: 1, weight: 40 }, // ?
            { name: "p30l_dual", count: 1, weight: 1 }, // ?
        ],
        tier_woodaxe: [{ name: "woodaxe", count: 1, weight: 1 }],
        tier_fireaxe: [{ name: "fireaxe", count: 1, weight: 1 }],
        tier_club_melee: [
            { name: "machete_taiga", count: 1, weight: 0.9 },
            { name: "chest03", count: 1, weight: 0.1 }
        ],
        tier_guns: [
            { name: "famas", count: 1, weight: 1.2 },
            { name: "hk416", count: 1, weight: 4 },
            { name: "mk12", count: 1, weight: 2 },
            //{ name: "pkp", count: 1, weight: 0.005 },
            //{ name: "m249", count: 1, weight: 0.006 },
            { name: "ak47", count: 1, weight: 1.7 },
            { name: "scar", count: 1, weight: 0.03 },
            { name: "dp28", count: 1, weight: 0.5 },
            //{ name: "mosin", count: 1, weight: 0.1 },
            { name: "m39", count: 1, weight: 2 },
            { name: "mp5", count: 1, weight: 10 },
            { name: "mac10", count: 1, weight: 6 },
            { name: "ump9", count: 1, weight: 3 },
            { name: "m870", count: 1, weight: 7 },
            //{ name: "m1100", count: 1, weight: 6 },
            { name: "mp220", count: 1, weight: 2 },
            { name: "saiga", count: 1, weight: 0.1 },
            { name: "ot38", count: 1, weight: 8 },
            //{ name: "m9", count: 1, weight: 19 },
            { name: "m93r", count: 1, weight: 4 }, //4
            { name: "glock", count: 1, weight: 7 },
            { name: "deagle", count: 1, weight: 0.05 },
            { name: "vector", count: 1, weight: 0.005 },
            //{ name: "sv98", count: 1, weight: 0.01 },
            { name: "spas12", count: 1, weight: 0.7 },
            { name: "qbb97", count: 1, weight: 0.03 },
            { name: "flare_gun", count: 1, weight: 0.145 }, // !
            { name: "flare_gun_dual", count: 1, weight: 0.0025 }, // !
            { name: "groza", count: 1, weight: 0.8 },
            //{ name: "scout_elite", count: 1, weight: 0.05 },
            { name: "vss", count: 1, weight: 1.5 }, // !
        ],
        tier_police: [
            { name: "scar", count: 1, weight: 0.27 },
            { name: "svd", count: 1, weight: 0.16 },
            { name: "an94", count: 1, weight: 0.05 },
            { name: "helmet03", count: 1, weight: 0.29 },
            { name: "chest03", count: 1, weight: 0.21 },
            { name: "backpack03", count: 1, weight: 0.02 },
        ],
        tier_ring_case: [
            { name: "grozas", count: 1, weight: 0.67 }, 
            { name: "ots38_dual", count: 1, weight: 0.11 }, 
            { name: "pkp", count: 1, weight: 0.11 },
            { name: "sv98", count: 1, weight: 0.11 }, 
        ],
        tier_chest: [
            { name: "mk12", count: 1, weight: 0.45 },
            { name: "m249", count: 1, weight: 0.1 },
            { name: "scar", count: 1, weight: 0.26 },
            { name: "dp28", count: 1, weight: 0.45 },
            { name: "m39", count: 1, weight: 0.45 },
            { name: "saiga", count: 1, weight: 0.2165 },
            { name: "mp220", count: 1, weight: 1.5 },
            { name: "deagle", count: 1, weight: 0.15 },
            { name: "spas12", count: 1, weight: 0.8 },
            { name: "helmet02", count: 1, weight: 1 },
            { name: "helmet03", count: 1, weight: 0.2 },
            { name: "chest02", count: 1, weight: 4 },
            { name: "chest03", count: 1, weight: 0.2 },
            { name: "4xscope", count: 1, weight: 0.5 },
            //{ name: "pkm", count: 1, weight: 0.11 }, // ~1%
        ],
        tier_pirate_treasure: [
            { name: "tier_chest", count: 1, weight: 1 }, // ?
        ],
        tier_towel_rack: [
            { name: "tier_armor", count: 1, weight: 0.6 }, // ?
            { name: "tier_scopes", count: 1, weight: 0.2 },
            { name: "tier_guns", count: 1, weight: 0.1 },
            { name: "tier_medical", count: 1, weight: 0.1 },
        ],
        tier_ak_locker: [
            { name: "ak47", count: 1, weight: 0.4 }, // ?
            { name: "ak74", count: 1, weight: 0.2 },
            { name: "scar", count: 1, weight: 0.2 },
            { name: "bar", count: 1, weight: 0.2 },
        ],
        tier_grey_crate: [
            { name: "tier_weaker_lmgs", count: 1, weight: 0.25 }, // ?
            { name: "", count: 1, weight: 0.75 },
        ],
        /*
        tier_hawk: [
            { name: "hawk", count: 1, weight: 0.9999 },
            { name: "special_shotgun", count: 1, weight: 0.0001 },
        ],
        */
        tier_weaker_lmgs: [
            { name: "dp28", count: 1, weight: 0.4 }, // ?
            { name: "qbb97", count: 1, weight: 0.3 },
            { name: "bar", count: 1, weight: 0.23 },
            //{ name: "m134", count: 1, weight: 0.07 },
        ],
        tier_river_pirate: [
            { name: "m4a1", count: 1, weight: 0.4 }, // ?
            { name: "colt45_dual", count: 1, weight: 0.3 },
            { name: "m1911_dual", count: 1, weight: 0.3 },
        ],
        tier_utility: [
            { name: "tier_armor", count: 1, weight: 0.4 }, // ?
            { name: "healthkit", count: 1, weight: 0.25 },
            { name: "bandage", count: 5, weight: 0.2 },
            { name: "painkiller", count: 1, weight: 0.15 },
        ],
        tier_ot_military_crate: [
            { name: "ots38", count: 1, weight: 0.6 }, // ?
            { name: "ot38", count: 1, weight: 0.4 },
        ],
        tier_ak_military_crate: [
            { name: "groza", count: 1, weight: 0.2 }, 
            { name: "spas12", count: 1, weight: 0.1 },
            { name: "m870", count: 1, weight: 0.15 },
            { name: "mp220", count: 1, weight: 0.1 },
            { name: "ots38", count: 1, weight: 0.2 },
            { name: "saiga", count: 1, weight: 0.05 },
            //{ name: "tier_hawk", count: 1, weight: 0.05 },
            { name: "ak74", count: 1, weight: 0.05 }, 
            { name: "l86", count: 1, weight: 0.1 },
        ],
        tier_bank_vault_basic: [
            { name: "famas", count: 1, weight: 0.15 }, 
            { name: "qbb97", count: 1, weight: 0.03 },
            { name: "dp28", count: 1, weight: 0.1 },
            { name: "m870", count: 1, weight: 0.15 },
            { name: "mp220", count: 1, weight: 0.1 },
            { name: "hk416", count: 1, weight: 0.13 }, 
            { name: "ak47", count: 1, weight: 0.1 },
            { name: "m93r_dual", count: 1, weight: 0.09 },
            { name: "mkg45", count: 1, weight: 0.04 },
            { name: "m39", count: 1, weight: 0.05 }, 
            { name: "mk12", count: 1, weight: 0.05 }, 
            { name: "m4a1", count: 1, weight: 0.02 }, 
            { name: "scar", count: 1, weight: 0.01 },
            { name: "vector", count: 1, weight: 0.01 },
            { name: "saiga", count: 1, weight: 0.01 },
        ],
        tier_bank_vault_gold: [
            { name: "famas", count: 1, weight: 0.2 }, 
            { name: "qbb97", count: 1, weight: 0.13 },
            { name: "dp28", count: 1, weight: 0.06 },
            { name: "m870", count: 1, weight: 0.12 },
            { name: "mp220", count: 1, weight: 0.1 },
            { name: "hk416", count: 1, weight: 0.05 },
            { name: "mkg45", count: 1, weight: 0.08 },
            { name: "m39", count: 1, weight: 0.07 }, 
            { name: "mk12", count: 1, weight: 0.07 }, 
            { name: "m93r_dual", count: 1, weight: 0.05 },
            { name: "m4a1", count: 1, weight: 0.08 }, 
            { name: "scar", count: 1, weight: 0.03 },
            { name: "vector", count: 1, weight: 0.03 },
            { name: "saiga", count: 1, weight: 0.03 },
        ],
        tier_bank_vault_packs: [
            { name: "tier_packs", count: 1, weight: 0.66},
            { name: "", count: 1, weight: 0.33},
        ],
        tier_ak_bunker: [
            { name: "ak74", count: 1, weight: 0.6 },
            { name: "ak47", count: 1, weight: 0.4 }, 
        ],
        tier_chest_sniper_tea: [
            { name: "mosin", count: 1, weight: 0.16 },  // 8%
            //{ name: "sv98", count: 1, weight: 0.0662 },   // 1.75%
            { name: "scout_elite", count: 1, weight: 0.5 },
            { name: "saiga", count: 1, weight: 0.3 },
            { name: "blr", count: 1, weight: 0.45 },
            { name: "spas12", count: 1, weight: 0.7 },
            { name: "deagle", count: 1, weight: 0.15 },
            { name: "vector", count: 1, weight: 0.1 },
            // { name: "awc", count: 1, weight: 0.074 },
            { name: "", count: 1, weight: 0.4 },
        ],
        tier_chest_sniper: [
            { name: "garand", count: 1, weight: 0.25 },  // 8%
            //{ name: "sv98", count: 1, weight: 0.0662 },   // 1.75%
            { name: "scout_elite", count: 1, weight: 0.5 },
            { name: "saiga", count: 1, weight: 0.3 },
            { name: "blr", count: 1, weight: 0.45 },
            { name: "spas12", count: 1, weight: 1 },
            { name: "deagle", count: 1, weight: 0.15 },
            { name: "vector", count: 1, weight: 0.1 },
            //{ name: "awc", count: 1, weight: 0.074 },
        ],
        tier_chest_sniper_spec: [
            { name: "garand", count: 1, weight: 0.3 },  // 8%
            //{ name: "sv98", count: 1, weight: 0.0662 },   // 1.75%
            { name: "scout_elite", count: 1, weight: 0.5 },
            { name: "saiga", count: 1, weight: 0.3 },
            { name: "blr", count: 1, weight: 0.45 },
            { name: "spas12", count: 1, weight: 1 },
            { name: "deagle", count: 1, weight: 0.15 },
            { name: "vector", count: 1, weight: 0.1 },
            { name: "", count: 1, weight: 2 },
            //{ name: "awc", count: 1, weight: 0.074 },
        ],
        tier_chest_ar: [
            { name: "famas", count: 1, weight: 0.55 },
            { name: "mk12", count: 1, weight: 0.45 },
            { name: "m249", count: 1, weight: 0.12 },
            { name: "scar", count: 1, weight: 0.27 },
            { name: "dp28", count: 1, weight: 0.4 },
            { name: "m39", count: 1, weight: 0.45 },
            { name: "spas12", count: 1, weight: 0.4 },
            { name: "saiga", count: 1, weight: 0.26 },
            { name: "mp220", count: 1, weight: 0.8 },
            //{ name: "pkm", count: 1, weight: 0.05 }, // ~1%
        ],
        tier_chest_armor: [
            { name: "helmet02", count: 1, weight: 1 },
            { name: "helmet03", count: 1, weight: 0.2 },
            { name: "chest02", count: 1, weight: 2 },
            { name: "chest03", count: 1, weight: 0.2 },
            { name: "4xscope", count: 1, weight: 1 },
        ],
        tier_conch: [
            { name: "outfitAqua", count: 1, weight: 1 },
            { name: "outfitCoral", count: 1, weight: 1 },
        ],
        tier_noir_outfit: [{ name: "outfitNoir", count: 1, weight: 1 }],
        tier_khaki_outfit: [{ name: "outfitKhaki", count: 1, weight: 1 }],
        tier_pirate_melee: [{ name: "hook", count: 1, weight: 1 }],
        tier_hatchet: [
            { name: "vector", count: 1, weight: 0.7 },
            { name: "mosin", count: 1, weight: 0.03 },
            //{ name: "tier_hawk", count: 1, weight: 0.05 },
            { name: "saiga", count: 1, weight: 0.12 },
            { name: "pkp", count: 1, weight: 0.03 },
            { name: "m249", count: 1, weight: 0.04 },
            //{ name: "pkm", count: 1, weight: 0.03 },
        ],
        tier_crossing: [
            { name: "ots38", count: 1, weight: 0.2},
            { name: "ots38_dual", count: 1, weight: 0.3},
            { name: "p30l", count: 1, weight: 0.3},
            //{ name: "m134", count: 1, weight: 0.1},
        ],
        tier_lmgs: [
            { name: "dp28", count: 1, weight: 2 }, // ?
            { name: "bar", count: 1, weight: 1.5 }, // ?
            { name: "qbb97", count: 1, weight: 0.5 }, // ?
            { name: "m249", count: 1, weight: 0.05 }, // ?
            { name: "pkp", count: 1, weight: 0.05 }, // ?
        ],
        tier_shotguns: [
            { name: "spas12", count: 1, weight: 2 }, // ?
            { name: "mp220", count: 1, weight: 1.5 }, // ?
            //{ name: "m1100", count: 1, weight: 1 }, // ?
            { name: "m870", count: 1, weight: 1 }, // ?
            { name: "saiga", count: 1, weight: 0.15 }, // ?
            { name: "usas", count: 1, weight: 0.01 }, // ?
        ],
        tier_snipers: [
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
        tier_hatchet_melee: [
            { name: "fireaxe", count: 1, weight: 5 }, // ?
            { name: "tier_katanas", count: 1, weight: 3 }, // ?
            { name: "stonehammer", count: 1, weight: 1 }, // ?
        ],
        tier_pavilion: [
            { name: "naginata", count: 1, weight: 2 }, // ?
            { name: "pkp", count: 1, weight: 2 }, // ?
            { name: "dp28", count: 1, weight: 1 }, // ?
            { name: "bar", count: 1, weight: 1 }, // ?
            //{ name: "m9", count: 1, weight: 1 }, // ?
        ],
        tier_forest_helmet: [{ name: "helmet03_forest", count: 1, weight: 1 }],
        tier_outfits: [
            { name: "", count: 1, weight: 0.5},
            { name: "outfitCobaltShell", count: 1, weight: 0.2 }, // ?
            { name: "outfitKeyLime", count: 1, weight: 0.15 }, // ?
            { name: "outfitWoodland", count: 1, weight: 0.1 }, // ?
            { name: "outfitCamo", count: 1, weight: 0.1 }, // ?
            { name: "outfitGhillie", count: 1, weight: 0.01 }, // ?
        ],
        tier_egg_outfits: [
            { name: "outfitBarrel", count: 1, weight: 1 },
            { name: "outfitWoodBarrel", count: 1, weight: 1 },
            { name: "outfitStone", count: 1, weight: 1 },
            { name: "outfitSpringTree", count: 1, weight: 1 },
            { name: "outfitBush", count: 1, weight: 1 },
            { name: "outfitCrate", count: 1, weight: 1 },
            { name: "outfitTable", count: 1, weight: 1 },
            { name: "outfitSoviet", count: 1, weight: 1 },
            { name: "outfitOven", count: 1, weight: 1 },
            { name: "outfitRefrigerator", count: 1, weight: 1 },
            { name: "outfitVending", count: 1, weight: 1 },
            { name: "outfitToilet", count: 1, weight: 1 },
            { name: "outfitBushRiver", count: 1, weight: 1 },
            { name: "outfitCrab", count: 1, weight: 1 },
        ],
        tier_pirate_outfits: [{ name: "outfitRoyalFortune", count: 1, weight: 1 }],
        tier_shotgun_barrel: [
            //{ name: "tier_hawk", count: 1, weight: 0.30},
            { name: "bar", count: 1, weight: 0.4},
            { name: "usas", count: 1, weight: 0.30},
        ],
        tier_lvl3_chance: [
            { name: "chest03", count: 1, weight: 0.15},
            { name: "", count: 1, weight: 0.85},
        ],
        tier_islander_outfit: [{ name: "outfitIslander", count: 1, weight: 1 }],
        tier_imperial_outfit: [{ name: "outfitImperial", count: 1, weight: 1 }],
        tier_pineapple_outfit: [{ name: "outfitPineapple", count: 1, weight: 1 }],
        tier_tarkhany_outfit: [{ name: "outfitTarkhany", count: 1, weight: 1 }],
        tier_spetsnaz_outfit: [{ name: "outfitSpetsnaz", count: 1, weight: 1 }],
        tier_lumber_outfit: [{ name: "outfitLumber", count: 1, weight: 1 }],
        tier_verde_outfit: [{ name: "outfitVerde", count: 1, weight: 1 }],
        tier_coconut_outfit: [
            { name: "", count: 1, weight: 19 },
            { name: "outfitCoconut", count: 1, weight: 1 },
        ],
        //
        // Cobalt class pods
        //
        tier_guns_common_scout: [
            { name: "glock_dual", count: 1, weight: 1 },
            { name: "ot38_dual", count: 1, weight: 1 },
            { name: "m93r_dual", count: 1, weight: 1 },
            { name: "deagle", count: 1, weight: 0.2 },
        ],
        tier_guns_common_sniper: [
            { name: "blr", count: 1, weight: 1 },
            { name: "mosin", count: 1, weight: 0.2 },
            { name: "scout_elite", count: 1, weight: 1 },
        ],
        tier_guns_common_healer: [
            { name: "mk12", count: 1, weight: 1 },
            { name: "m39", count: 1, weight: 1 },
            { name: "vss", count: 1, weight: 1 },
        ],
        tier_guns_common_demo: [
            { name: "m870", count: 1, weight: 1 },
            { name: "spas12", count: 1, weight: 0.5 },
            { name: "mp220", count: 1, weight: 1 },
        ],
        tier_guns_common_assault: [
            { name: "hk416", count: 1, weight: 1 },
            { name: "ak47", count: 1, weight: 1 },
            { name: "groza", count: 1, weight: 1 },
            { name: "famas", count: 1, weight: 1 },
        ],
        tier_guns_common_tank: [
            { name: "dp28", count: 1, weight: 1 },
            { name: "qbb97", count: 1, weight: 0.2 },
            { name: "bar", count: 1, weight: 0.5 },
        ],
        tier_guns_rare_scout: [
            { name: "ots38_dual", count: 1, weight: 1 },
            { name: "p30l_dual", count: 1, weight: 0.5 },
            { name: "deagle_dual", count: 1, weight: 0.5 },
        ],
        tier_guns_rare_sniper: [
            { name: "mosin", count: 1, weight: 1 },
            { name: "sv98", count: 1, weight: 0.1 },
            { name: "awc", count: 1, weight: 0.05 },
        ],
        tier_guns_rare_demo: [
            { name: "saiga", count: 1, weight: 1 },
            { name: "usas", count: 1, weight: 0.1 },
            { name: "m1014", count: 1, weight: 0.1 },
        ],
        tier_guns_rare_healer: [
            { name: "svd", count: 1, weight: 1 },
            { name: "l86", count: 1, weight: 1 },
            { name: "garand", count: 1, weight: 0.5 },
            { name: "scarssr", count: 1, weight: 0.05 },
        ],
        tier_guns_rare_assault: [
            { name: "scar", count: 1, weight: 1 },
            { name: "grozas", count: 1, weight: 1 },
            { name: "m4a1", count: 1, weight: 1 },
            { name: "an94", count: 1, weight: 0.5 },
        ],
        tier_guns_rare_tank: [
            { name: "qbb97", count: 1, weight: 1.3 },
            { name: "pkp", count: 1, weight: 0.1 },
            { name: "m249", count: 1, weight: 0.2 },
        ],
        tier_class_crate_mythic: [
            { name: "scavenger_adv", count: 1, weight: 1 },
            { name: "explosive", count: 1, weight: 1 },
            { name: "splinter", count: 1, weight: 1 },
        ],
        tier_scavenger_adv: [
            { name: "m9", count: 1, weight: 1 },
            { name: "ots38_dual", count: 1, weight: 1 },
            { name: "p30l_dual", count: 1, weight: 1 },
            { name: "saiga", count: 1, weight: 1 },
            { name: "deagle_dual", count: 1, weight: 1 },
            { name: "vector", count: 1, weight: 1 },
            { name: "scorpion", count: 1, weight: 1 },
            { name: "m4a1", count: 1, weight: 1 },
            { name: "garand", count: 1, weight: 1 },
            { name: "grozas", count: 1, weight: 1 },
            { name: "flare_gun", count: 1, weight: 1 },
            { name: "awc", count: 1, weight: 1 },
            { name: "scarssr", count: 1, weight: 1 },
            { name: "pkp", count: 1, weight: 1 },
            { name: "m249", count: 1, weight: 1 },
            { name: "sv98", count: 1, weight: 1 },
            { name: "pan", count: 1, weight: 1 },
            { name: "8xscope", count: 1, weight: 1 },
            { name: "15xscope", count: 1, weight: 1 },
            { name: "mirv", count: 4, weight: 1 },
            { name: "outfitGhillie", count: 1, weight: 1 },
            { name: "painkiller", count: 2, weight: 1 },
            { name: "healthkit", count: 1, weight: 1 },
            { name: "helmet03", count: 1, weight: 1 },
            { name: "chest03", count: 1, weight: 1 },
            { name: "backpack03", count: 1, weight: 1 },
        ],
        tier_pirate: [
            { name: "tier_ammo", count: 1, weight: 0.1 },
            { name: "tier_scopes", count: 1, weight: 0.1 },
            { name: "tier_armor", count: 1, weight: 0.05 },
            { name: "tier_medical", count: 1, weight: 0.25 },
            { name: "tier_throwables", count: 1, weight: 0.15 },
            { name: "tier_packs", count: 1, weight: 0.05 },
        ],
        tier_pirate_rare: [
            { name: "m9", count: 1, weight: 0.5 },
            { name: "m4a1", count: 1, weight: 1 },
            { name: "scorpion", count: 1, weight: 1 },
            { name: "scar", count: 1, weight: 1 },
            { name: "flare", count: 1, weight: 1 },
            { name: "garand", count: 1, weight: 0.75 },
            { name: "mosin", count: 1, weight: 0.5 },
            { name: "deagle", count: 1, weight: 1 },
            { name: "saiga", count: 1, weight: 1 },
            { name: "p30l_dual", count: 1, weight: 0.5 },
            { name: "deagle_dual", count: 1, weight: 0.5 },
            { name: "sv98", count: 1, weight: 0.3 },
            { name: "awc", count: 1, weight: 0.3 },
            { name: "m249", count: 1, weight: 0.25 },
        ],
        tier_airdrop_uncommon: [
            { name: "l86", count: 1, weight: 2.5 },
            { name: "scar", count: 1, weight: 0.75 },
            { name: "mosin", count: 1, weight: 1.5 },
            { name: "svd", count: 1, weight: 2.5 },
            { name: "m1014", count: 1, weight: 1.5 },
            { name: "deagle", count: 1, weight: 1 },
            { name: "vector", count: 1, weight: 1 },
            //{ name: "tier_hawk", count: 1, weight: 1 },
            //{ name: "m9", count: 1, weight: 0.01 },
            { name: "flare_gun", count: 1, weight: 0.5 },
            { name: "scout_elite", count: 1, weight: 1 },
            { name: "an94", count: 1, weight: 2 }, // !
        ],
        tier_airdrop_rare: [
            { name: "garand", count: 1, weight: 0.18 }, // 18%
            { name: "scarssr", count: 1, weight: 0.18 }, // 18%
            { name: "pkp", count: 1, weight: 0.1 }, // 10%
            //{ name: "m134", count: 2, weight: 0.1 }, // 10%
            { name: "scorpion", count: 1, weight: 0.18 }, // 18%
            { name: "ots38_dual", count: 1, weight: 0.1 }, // 10%
            { name: "usas", count: 1, weight: 0.1 }, // 10%
            { name: "sv98", count: 1, weight: 0.06 }, // 6%
        ],
        tier_airdrop_mythic: [
            { name: "scarssr", count: 1, weight: 1 }, // ?
            { name: "usas", count: 1, weight: 1 }, // ?
            { name: "p30l_dual", count: 1, weight: 1 }, // ?
        ],
        tier_airdrop_ammo: [
            { name: "9mm", count: 30, weight: 3 },
            { name: "762mm", count: 30, weight: 3 },
            { name: "556mm", count: 30, weight: 3 },
            { name: "12gauge", count: 5, weight: 3 },
        ],
        tier_airdrop_outfits: [
            { name: "", count: 1, weight: 20 },
            { name: "outfitMeteor", count: 1, weight: 5 }, // !
            { name: "outfitHeaven", count: 1, weight: 1 }, // !
            { name: "outfitGhillie", count: 1, weight: 0.5 },
        ],
        tier_airdrop_throwables: [
            { name: "frag", count: 2, weight: 1 },
            { name: "mirv", count: 2, weight: 0.5 },
        ],
        tier_airdrop_melee: [
            { name: "", count: 1, weight: 19 },
            // { name: "pan", count: 1, weight: 1 },
        ],
        tier_airdrop_armor: [
            { name: "helmet03", count: 1, weight: 1 },
            { name: "chest03", count: 1, weight: 1 },
            { name: "backpack03", count: 1, weight: 1 },
        ],
        tier_airdrop_scopes: [
            { name: "", count: 1, weight: 24 }, // ?
            { name: "4xscope", count: 1, weight: 5 }, // ?
            //{ name: "8xscope", count: 1, weight: 1 }, // ?
            //{ name: "15xscope", count: 1, weight: 0.02 }, // ?
        ],
        tier_katanas: [
            { name: "katana", count: 1, weight: 4 }, // ?
            { name: "katana_rusted", count: 1, weight: 4 }, // ?
            { name: "katana_orchid", count: 1, weight: 1 }, // ?
        ],
        tier_stonehammer: [{ name: "stonehammer", count: 1, weight: 1 }],
        tier_saloon: [
            { name: "vector45", count: 1, weight: 1 },
            { name: "mkg45", count: 1, weight: 1 },
        ],
        tier_pumpkin_perks: [{ name: "halloween_mystery", count: 1, weight: 1 }],
        tier_playtest: [
            { name: "m1014", count: 1, weight: 1 },
            { name: "model94", count: 1, weight: 1 },
            { name: "vector45", count: 1, weight: 1 },
            { name: "mkg45", count: 1, weight: 1 },
        ],
        tier_xp_uncommon: [
            { name: "xp_book_tallow", count: 1, weight: 1 },
            { name: "xp_book_greene", count: 1, weight: 1 },
            { name: "xp_book_parma", count: 1, weight: 1 },
            { name: "xp_book_nevelskoy", count: 1, weight: 1 },
            { name: "xp_book_rinzo", count: 1, weight: 1 },
            { name: "xp_book_kuga", count: 1, weight: 1 },
        ],
        tier_xp_rare: [
            { name: "xp_glasses", count: 1, weight: 0.1 },
            { name: "xp_compass", count: 1, weight: 0.1 },
            { name: "xp_stump", count: 1, weight: 0.1 },
            { name: "xp_bone", count: 1, weight: 0.1 },
        ],
        tier_xp_mythic: [{ name: "xp_donut", count: 1, weight: 0.01 }],
        // xp and halloween perks guessed with no base on real data!
        tier_fruit_xp: [
            { name: "", count: 1, weight: 40 },
            /* commented until we have a pass so the xp artifacts do something
            { name: "tier_xp_uncommon", count: 1, weight: 1 },
            { name: "tier_xp_rare", count: 1, weight: 0.1 },
            { name: "tier_xp_mythic", count: 1, weight: 0.001 },
            */
        ],
        tier_airdrop_xp: [
            { name: "", count: 1, weight: 15 },
            /*
            { name: "tier_xp_uncommon", count: 1, weight: 1 },
            { name: "tier_xp_rare", count: 1, weight: 0.1 },
            { name: "tier_xp_mythic", count: 1, weight: 0.001 },
            */
        ],
        tier_halloween_mystery_perks: [
            { name: "trick_nothing", count: 1, weight: 1 },
            { name: "trick_size", count: 1, weight: 1 },
            { name: "trick_m9", count: 1, weight: 1 },
            { name: "trick_chatty", count: 1, weight: 1 },
            { name: "trick_drain", count: 1, weight: 1 },

            { name: "treat_9mm", count: 1, weight: 1 },
            { name: "treat_12g", count: 1, weight: 1 },
            { name: "treat_556", count: 1, weight: 1 },
            { name: "treat_762", count: 1, weight: 1 },
            { name: "treat_super", count: 1, weight: 0.1 },
        ],
        tier_supply_meds: [
            { name: "bandage", count: 5, weight: 0.25 },
            { name: "healthkit", count: 1, weight: 0.33 },
            { name: "tier_soda", count: 1, weight: 0.22 },
            { name: "painkiller", count: 1, weight: 0.2 },
        ],
        tier_supply_armor: [
            { name: "helmet02", count: 1, weight: 0.3 },
            { name: "chest02", count: 1, weight: 0.28 },
            { name: "backpack02", count: 1, weight: 0.17 },
            { name: "tier_armor_3", count: 1, weight: 0.25 },
        ],
        tier_armor_3: [
            { name: "backpack03", count: 1, weight: 0.28 },
            { name: "chest03", count: 1, weight: 0.25 },
            { name: "helmet03", count: 1, weight: 0.27 },
            { name: "", count: 1, weight: 0.2 },
        ],
        tier_supply_pistols: [
            { name: "p30l", count: 1, weight: 0.15 },
            { name: "p30l_dual", count: 1, weight: 0.03 },
            { name: "deagle", count: 1, weight: 0.11 },
            { name: "deagle_dual", count: 1, weight: 0.04 },
            { name: "colt45", count: 1, weight: 0.13 },
            { name: "colt45_dual", count: 1, weight: 0.16 },
            { name: "m1911", count: 1, weight: 0.13 },
            { name: "m1911_dual", count: 1, weight: 0.25 }, 
        ],
        tier_supply_scopes: [
            { name: "4xscope", count: 1, weight: 1 },
            { name: "", count: 1, weight: 0.2 },
        ],
        tier_supply_nades: [
            { name: "tier_better_throwables", count: 2, weight: 1 },
        ],
        tier_supply_ammo: [
            { name: "12gauge", count: 20, weight: 0.25 },
            { name: "50AE", count: 29, weight: 0.25 },
            { name: "flare", count: 1, weight: 0.25 },
            { name: "45acp", count: 60, weight: 0.25 },
        ],
    },
    mapGen: {
        map: {
            baseWidth: 190,
            baseHeight: 190,
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
                stone_01: 7,
                barrel_01: 3,
                tree_01: 10,
            },
        ],
        fixedSpawns: [
            {
                // small is spawn count for solos and duos, large is spawn count for squads
                stone_01: 30,
                barrel_01: 5,
                silo_01: 1,
                tree_01: 40,
                container_01: 1,
                container_02: 1,
                container_03: 1,
                container_04: 1,
                outhouse_01: 3,
            },
        ],
        randomSpawns: [
            {
                spawns: ["mansion_structure_01", "police_01", "club_complex_01", "warehouse_complex_01"],
                choose: 1,
            },
            {
                spawns: ["bank_01", "barn_01", "barn_02" ],
                choose: 1,
            },
            {
                spawns: ["warehouse_01", "house_red_01", "house_red_02" ],
                choose: 2,
            },
            {
                spawns: ["teahouse_complex_01su", "shack_01", "shack_01", "shack_01" ],
                choose: 3,
            }
        ],
        spawnReplacements: [{}],
        importantSpawns: ["club_complex_01"],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export type PartialMapDef = DeepPartial<MapDef>;
