import { FactionTeam } from "../../gameConfig.ts";
import { util } from "../../utils/util.ts";
import { getTeamWeapon } from "../gameObjects/roleDefs.ts";
import type { MapDef } from "../mapDefs.ts";
import type { PartialMapDef } from "./baseDefs.ts";
import { Faction } from "./factionDefs.ts";

const mapDef: PartialMapDef = {
    desc: {
        buttonCss: "btn-mode-snow",
    },
    assets: {
        audio: [
            {
                name: "lt_assigned_01",
                channel: "ui",
            },
            {
                name: "captain_assigned_01",
                channel: "ui",
            },
            {
                name: "medic_assigned_01",
                channel: "ui",
            },
            {
                name: "marksman_assigned_01",
                channel: "ui",
            },
            {
                name: "recon_assigned_01",
                channel: "ui",
            },
            {
                name: "grenadier_assigned_01",
                channel: "ui",
            },
            {
                name: "bugler_assigned_01",
                channel: "ui",
            },
            {
                name: "last_man_assigned_01",
                channel: "ui",
            },
            {
                name: "ping_leader_01",
                channel: "ui",
            },
            {
                name: "bugle_01",
                channel: "activePlayer",
            },
            {
                name: "bugle_02",
                channel: "activePlayer",
            },
            {
                name: "bugle_03",
                channel: "activePlayer",
            },
            {
                name: "bugle_01",
                channel: "otherPlayers",
            },
            {
                name: "bugle_02",
                channel: "otherPlayers",
            },
            {
                name: "bugle_03",
                channel: "otherPlayers",
            },
            { name: "log_05", channel: "sfx" },
            { name: "vault_change_03", channel: "sfx" },
            { name: "watering_01", channel: "sfx" },
        ],
        atlases: ["loadout", "shared", "faction", "snow"],
    },
    biome: {
        colors: {
            background: 0x041617,
            water: 0x71b36,
            waterRipple: 0xb3f0ff,
            beach: 0x524824,
            riverbank: 0x3a260e,
            grass: 0x4c4c4c,
            underground: 0x0b0501,
            playerSubmerge: 0x113842,
            playerGhillie: 0x4b4b4b,
        },
        valueAdjust: 0.4,
        particles: { camera: "falling_snowstorm" },
    },
    gameMode: {
        maxPlayers: 100,
        factionMode: true,
        factions: 2,
    },
    /* STRIP_FROM_PROD_CLIENT:START */
    gameConfig: {
        roles: {
            roleOverrides: {
                leader: {
                    defaultItems: {
                        weapons: [
                            (teamcolor: FactionTeam) =>
                                getTeamWeapon(
                                    {
                                        [FactionTeam.Red]: { type: "m1014_winter", ammo: 8, fillInv: true },
                                        [FactionTeam.Blue]: { type: "an94_winter", ammo: 45, fillInv: true },
                                    },
                                    teamcolor,
                                ),
                            { type: "flare_gun", ammo: 1 },
                            (teamcolor: FactionTeam) =>
                                getTeamWeapon(
                                    {
                                        [FactionTeam.Red]: { type: "machete_taiga", ammo: 0 },
                                        [FactionTeam.Blue]: { type: "kukri_trad", ammo: 0 },
                                    },
                                    teamcolor,
                                ),
                            { type: "", ammo: 0 },
                        ],
                    },
                },
                marksman: {
                    defaultItems: {
                        weapons: [
                            { type: "", ammo: 0 },
                            (teamcolor: FactionTeam) =>
                                getTeamWeapon(
                                    {
                                        [FactionTeam.Red]: util.weightedRandom([
                                            { type: "l86", ammo: 30, fillInv: true, weight: 0.9 },
                                            { type: "scarssr", ammo: 10, fillInv: true, weight: 0.1 },
                                        ]),
                                        [FactionTeam.Blue]: util.weightedRandom([
                                            { type: "svd_winter", ammo: 10, fillInv: true, weight: 0.9 },
                                            { type: "scarssr", ammo: 10, fillInv: true, weight: 0.1 },
                                        ]),
                                    },
                                    teamcolor,
                                ),
                            { type: "kukri_sniper", ammo: 0 },
                            { type: "", ammo: 0 },
                        ],
                    },
                },
            },
        },
    },
    lootTable: {
        tier_guns: [
            { name: "famas", count: 1, weight: 0.9 },
            { name: "hk416", count: 1, weight: 4 },
            { name: "mk12", count: 1, weight: 0.1 },
            { name: "pkp", count: 1, weight: 0.005 },
            { name: "m249", count: 1, weight: 0.006 },
            { name: "ak47", count: 1, weight: 2.7 },
            { name: "scar", count: 1, weight: 0.01 },
            { name: "dp28", count: 1, weight: 0.5 },
            { name: "bar", count: 1, weight: 0.05 },
            { name: "mosin", count: 1, weight: 0.05 },
            { name: "m39", count: 1, weight: 0.1 },
            { name: "mp5", count: 1, weight: 10 },
            { name: "mac10", count: 1, weight: 6 },
            { name: "ump9", count: 1, weight: 3 },
            { name: "m870", count: 1, weight: 9 },
            { name: "m1100", count: 1, weight: 6 },
            { name: "mp220", count: 1, weight: 2 },
            { name: "saiga", count: 1, weight: 0.1 },
            { name: "ot38", count: 1, weight: 8 },
            { name: "m9", count: 1, weight: 19 },
            { name: "m93r", count: 1, weight: 5 },
            { name: "glock", count: 1, weight: 7 },
            { name: "deagle", count: 1, weight: 0.05, preload: true },
            { name: "vector", count: 1, weight: 0.01 },
            { name: "sv98_winter", count: 1, weight: 0.01 },
            { name: "spas12", count: 1, weight: 1 },
            { name: "qbb97", count: 1, weight: 0.01 },
            { name: "flare_gun", count: 1, weight: 0.1, preload: true },
            { name: "groza", count: 1, weight: 0.8 },
            { name: "scout_elite", count: 1, weight: 0.1 },
            { name: "vss", count: 1, weight: 0.1 }, // ?
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
            {
                name: "tier_faction_outfits",
                count: 1,
                weight: 0.025,
            },
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
            {
                name: "tier_faction_outfits",
                count: 1,
                weight: 0.035,
            },
        ],
        tier_medical: [
            { name: "bandage", count: 5, weight: 16 },
            { name: "healthkit", count: 1, weight: 4 },
            { name: "soda", count: 1, weight: 15 },
            { name: "painkiller", count: 1, weight: 5 },
            { name: "frag", count: 1, weight: 2 },
        ],
        tier_airdrop_uncommon: [
            { name: "vector", count: 1, weight: 2 },
            { name: "vss", count: 1, weight: 2 },
            { name: "m39", count: 1, weight: 2 },
            { name: "mk12", count: 1, weight: 2 },
            { name: "saiga", count: 1, weight: 2 },
            { name: "scout_elite", count: 1, weight: 2 },
            { name: "bar", count: 1, weight: 2 },
            { name: "scar", count: 1, weight: 1.5 },
            { name: "mosin", count: 1, weight: 1 },
            { name: "qbb97", count: 1, weight: 1 },
            { name: "deagle", count: 1, weight: 1 },
            { name: "ots38_dual", count: 1, weight: 1 },
            { name: "garand", count: 1, weight: 0.5 },
            { name: "sv98_winter", count: 1, weight: 0.5 },
            { name: "m9", count: 1, weight: 0.01 },
        ],
        tier_airdrop_rare: [
            { name: "scorpion", count: 1, weight: 3 },
            { name: "m4a1", count: 1, weight: 3 },
            { name: "grozas", count: 1, weight: 3 },
            { name: "awc", count: 1, weight: 2.25 },
            { name: "garand", count: 1, weight: 2 },
            { name: "ots38_dual", count: 1, weight: 2 },
            { name: "spas16", count: 1, weight: 2 },
            { name: "sv98", count: 1, weight: 2 },
            { name: "barrett", count: 1, weight: 0.5 },
            { name: "ash12", count: 1, weight: 0.5 },
            { name: "p30l_dual", count: 1, weight: 0.3 },
            { name: "deagle_dual", count: 1, weight: 0.3 },
            { name: "pkp", count: 1, weight: 0.1 },
            { name: "m249", count: 1, weight: 0.1 },
        ],
        tier_airdrop_melee: [
            { name: "", count: 1, weight: 2 },
            { name: "tier_katanas", count: 1, weight: 3 },
            { name: "naginata", count: 1, weight: 1 },
            { name: "fireaxe", count: 1, weight: 1 },
            { name: "sledgehammer", count: 1, weight: 1 },
            { name: "pan", count: 1, weight: 0.5 },
        ],
        tier_airdrop_outfits: [
            { name: "", count: 1, weight: 25 },
            { name: "outfitHeaven", count: 1, weight: 1 },
            {
                name: "outfitGhillie",
                count: 1,
                weight: 0.5,
            },
        ],
        tier_airdrop_scopes: [
            { name: "", count: 1, weight: 12 },
            { name: "4xscope", count: 1, weight: 5 },
            { name: "8xscope", count: 1, weight: 1 },
            { name: "15xscope", count: 1, weight: 0.01 },
        ],
        tier_ammo_crate: [
            { name: "9mm", count: 60, weight: 3 },
            { name: "762mm", count: 60, weight: 3 },
            { name: "556mm", count: 60, weight: 3 },
            { name: "12gauge", count: 10, weight: 3 },
            { name: "50AE", count: 21, weight: 1 },
            { name: "308sub", count: 5, weight: 1 },
        ],
        tier_mansion_floor: [{ name: "outfitCamo", count: 1, weight: 1 }],
        tier_conch: [{ name: "outfitKeyLime", count: 1, weight: 1 }],
        tier_chrys_01: [
            {
                name: "outfitCarbonFiber",
                count: 1,
                weight: 1,
            },
        ],
    },
    mapGen: {
        densitySpawns: [
            {
                stone_01x: 350,
                barrel_01: 76,
                silo_01: 8,
                crate_01: 38,
                crate_02f: 5,
                crate_22: 5,
                crate_03: 8,
                bush_01x: 78,
                tree_15: 320,
                tree_16: 40,
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
        fixedSpawns: [
            {
                warehouse_01fx: 6,
                house_red_01x: 4,
                house_red_02x: 4,
                barn_01x: 4,
                bank_01x: 1,
                police_01x: 1,
                hut_01x: 4,
                hut_02x: 1,
                shack_03a: 2,
                shack_03x: 3,
                greenhouse_02: 1,
                cache_01f: 1,
                cache_02f: 1,
                cache_07f: 1,
                mansion_structure_01x: 1,
                bunker_structure_01: { odds: 1 },
                bunker_structure_03: 1,
                bunker_structure_04: 1,
                bunker_structure_05: 1,
                warehouse_complex_01: 1,
                chest_01: 1,
                chest_03f: 1,
                mil_crate_02: { odds: 1 },
                tree_02: 3,
                camp_01f_red: 4,
                camp_01f_blue: 4,
            },
        ],
        importantSpawns: [
            "river_town_01",
            "police_01",
            "bank_01",
            "mansion_structure_01",
            "warehouse_complex_01",
        ],
        spawnReplacements: [
            {
                bridge_lg_01: "bridge_lg_01x",
                bush_07: "bush_07x",
                cabin_01: "cabin_01x",
                container_01: "container_01x",
                crate_01: "crate_01x",
                mil_crate_02: "mil_crate_03",
                shack_01: "shack_01x",
                shack_02: "shack_02x",
                stone_03: "stone_03x",
                warehouse_02: "warehouse_02x",
            },
        ],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const FactionSnow = util.mergeDeep({}, Faction, mapDef) as MapDef;
