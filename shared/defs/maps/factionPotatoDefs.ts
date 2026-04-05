import { util } from "../../utils/util";
import { getTeamWeapon } from "../gameObjects/roleDefs";
import type { MapDef } from "../mapDefs";
import { MapId } from "../types/misc";
import type { PartialMapDef } from "./baseDefs";
import { Faction } from "./factionDefs";

export enum TeamColor {
    Red = 1,
    Blue = 2,
}

const mapDef: PartialMapDef = {
    mapId: MapId.Faction,
    desc: {
        name: "Potato vs Tomato",
        icon: "img/gui/star.svg",
        buttonCss: "btn-mode-faction-potato",
        buttonText: "50v50",
        backgroundImg: "img/main_splash_0_7_0.png",
    },
    assets: {
        audio: [
            { name: "pumpkin_break_01", channel: "sfx" },
            { name: "tomato_break_01", channel: "sfx" },
            { name: "tomato_break_02", channel: "sfx" },
            { name: "potato_01", channel: "sfx" },
            { name: "potato_02", channel: "sfx" },
            { name: "tomato_01", channel: "sfx" },
            { name: "potato_pickup_01", channel: "ui" },
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
        ],
        atlases: ["gradient", "loadout", "shared", "faction", "potato"],
    },
    biome: {
        particles: { camera: "falling_pvt" },
    },
    gameMode: {
        maxPlayers: 100,
        factionMode: true,
        potatoMode: true,
        factions: 2,
    },
    /* STRIP_FROM_PROD_CLIENT:START */
    gameConfig: {
        planes: {
            crates: [
                { name: "airdrop_crate_03po", weight: 110 },
                { name: "airdrop_crate_03dev", weight: 1 },
            ],
        },
        roles: {
            roleOverrides: {
                lieutenant: {
                    defaultItems: {
                        weapons: [
                            { type: "", ammo: 0 },
                            (teamcolor: TeamColor) =>
                                getTeamWeapon(
                                    {
                                        [TeamColor.Red]: util.weightedRandom([
                                            {
                                                type: "m4a1",
                                                ammo: 40,
                                                fillInv: true,
                                                weight: 0.8,
                                            },
                                            {
                                                type: "potato_smg",
                                                ammo: 40,
                                                fillInv: false,
                                                weight: 0.2,
                                            },
                                        ]),
                                        [TeamColor.Blue]: util.weightedRandom([
                                            {
                                                type: "grozas",
                                                ammo: 40,
                                                fillInv: true,
                                                weight: 0.8,
                                            },
                                            {
                                                type: "potato_smg",
                                                ammo: 40,
                                                fillInv: false,
                                                weight: 0.2,
                                            },
                                        ]),
                                    },
                                    teamcolor,
                                ),
                            { type: "spade_assault", ammo: 0 },
                            { type: "", ammo: 0 },
                        ],
                    },
                },
                grenadier: {
                    defaultItems: {
                        weapons: [
                            { type: "", ammo: 0 },
                            util.weightedRandom([
                                { type: "saiga", ammo: 5, fillInv: true, weight: 0.8 },
                                {
                                    type: "potato_cannon",
                                    ammo: 4,
                                    fillInv: false,
                                    weight: 0.2,
                                },
                            ]),
                            { type: "katana", ammo: 0 },
                            { type: "mirv", ammo: 8 },
                        ],
                    },
                },
                last_man: {
                    defaultItems: {
                        weapons: [
                            { type: "", ammo: 0 },
                            (teamcolor: TeamColor) =>
                                getTeamWeapon(
                                    {
                                        [TeamColor.Red]: util.weightedRandom([
                                            {
                                                type: "m249",
                                                ammo: 100,
                                                fillInv: true,
                                                weight: 0.3,
                                            },
                                            {
                                                type: "pkp",
                                                ammo: 200,
                                                fillInv: true,
                                                weight: 0.3,
                                            },
                                            {
                                                type: "potato_lmg",
                                                ammo: 150,
                                                fillInv: false,
                                                weight: 0.4,
                                            },
                                        ]),
                                        [TeamColor.Blue]: util.weightedRandom([
                                            {
                                                type: "m249",
                                                ammo: 100,
                                                fillInv: true,
                                                weight: 0.3,
                                            },
                                            {
                                                type: "pkp",
                                                ammo: 200,
                                                fillInv: true,
                                                weight: 0.3,
                                            },
                                            {
                                                type: "potato_lmg",
                                                ammo: 150,
                                                fillInv: false,
                                                weight: 0.4,
                                            },
                                        ]),
                                    },
                                    teamcolor,
                                ),
                            { type: "", ammo: 0 },
                            { type: "mirv", ammo: 8 },
                        ],
                    },
                },
            },
        },
    },
    lootTable: {
        tier_throwables: [
            { name: "frag", count: 2, weight: 1 },
            { name: "smoke", count: 1, weight: 1 },
            { name: "mirv", count: 2, weight: 0.1 },
            { name: "potato", count: 10, weight: 1 },
            { name: "tomato", count: 10, weight: 1 },
        ],
        tier_ammo: [
            { name: "9mm", count: 60, weight: 1 },
            { name: "762mm", count: 60, weight: 3 },
            { name: "556mm", count: 60, weight: 3 },
            { name: "12gauge", count: 10, weight: 3 },
            { name: "45acp", count: 60, weight: 3 },
        ],
        tier_ammo_crate: [
            { name: "9mm", count: 60, weight: 3 },
            { name: "762mm", count: 60, weight: 3 },
            { name: "556mm", count: 60, weight: 3 },
            { name: "12gauge", count: 10, weight: 3 },
            { name: "45acp", count: 10, weight: 3 },
            { name: "50AE", count: 21, weight: 1 },
            { name: "308sub", count: 5, weight: 1 },
        ],
        tier_airdrop_ammo: [
            { name: "9mm", count: 60, weight: 1 },
            { name: "762mm", count: 60, weight: 3 },
            { name: "556mm", count: 60, weight: 3 },
            { name: "12gauge", count: 10, weight: 3 },
            { name: "45acp", count: 60, weight: 3 },
        ],
        tier_armor: [
            { name: "helmet01", count: 1, weight: 9 },
            { name: "helmet02", count: 1, weight: 6 },
            { name: "helmet03", count: 1, weight: 0.2 },
            {
                name: "helmet03_potato",
                count: 1,
                weight: 0.1,
            },
            { name: "chest01", count: 1, weight: 15 },
            { name: "chest02", count: 1, weight: 6 },
            { name: "chest03", count: 1, weight: 0.2 },
        ],
        tier_police: [
            { name: "scar", count: 1, weight: 0.5 },
            { name: "helmet03", count: 1, weight: 0.15 },
            {
                name: "helmet03_potato",
                count: 1,
                weight: 0.1,
            },
            { name: "chest03", count: 1, weight: 0.1 },
            { name: "backpack03", count: 1, weight: 0.25 },
        ],
        tier_airdrop_armor: [
            { name: "helmet03", count: 1, weight: 1 },
            {
                name: "helmet03_potato",
                count: 1,
                weight: 0.1,
            },
            { name: "chest03", count: 1, weight: 1 },
            { name: "backpack03", count: 1, weight: 1 },
        ],
        tier_airdrop_rare: [
            { name: "scorpion", count: 1, weight: 3 },
            { name: "m4a1", count: 1, weight: 3 },
            { name: "grozas", count: 1, weight: 3 },
            { name: "awc", count: 1, weight: 2.25 },
            { name: "tier_airdrop_potato", weight: 2.25 },
            { name: "garand", count: 1, weight: 2 },
            { name: "ots38_dual", count: 1, weight: 2 },
            { name: "spas16", count: 1, weight: 2 },
            { name: "sv98", count: 1, weight: 2 },
            { name: "p30l_dual", count: 1, weight: 0.3 },
            { name: "deagle_dual", count: 1, weight: 0.3 },
            { name: "pkp", count: 1, weight: 0.1 },
            { name: "m249", count: 1, weight: 0.1 },
        ],
        tier_airdrop_throwables: [
            { name: "frag", count: 2, weight: 1 },
            { name: "mirv", count: 2, weight: 0.5 },
            { name: "potato", count: 30, weight: 0.5 },
            { name: "tomato", count: 30, weight: 0.5 },
        ],
    },
    mapGen: {
        densitySpawns: [
            {
                stone_01: 350,
                barrel_01: 76,
                silo_01: 8,
                crate_01: 38,
                crate_02f: 5,
                crate_22: 5,
                crate_03: 8,
                bush_01: 78,
                tree_08f: 320,
                hedgehog_01: 24,
                container_01: 5,
                container_02: 5,
                container_03: 5,
                container_04: 5,
                shack_01: 7,
                outhouse_01: 5,
                loot_tier_1: 24,
                loot_tier_beach: 4,
                potato_01f: 40,
                potato_02f: 40,
                potato_03f: 40,
                tomato_01: 40,
                tomato_02: 40,
                tomato_03: 40,
            },
        ],
        fixedSpawns: [
            {
                warehouse_01f: 6,
                house_red_01: 4,
                house_red_02: 4,
                barn_01: 4,
                bank_01: 1,
                police_01: 1,
                hut_01: 4,
                hut_02: 1,
                shack_03a: 2,
                shack_03b: 3,
                greenhouse_01: 1,
                cache_01f: 1,
                cache_02f: 1,
                cache_07f: 1,
                shilo_01: 1,
                mansion_structure_01: 1,
                bunker_structure_01: { odds: 1 },
                bunker_structure_03: 1,
                bunker_structure_04: 1,
                warehouse_complex_01: 1,
                chest_01: 1,
                chest_03f: 1,
                mil_crate_02: { odds: 1 },
                tree_02: 3,
            },
        ],
        importantSpawns: [
            "river_town_01",
            "police_01",
            "bank_01",
            "mansion_structure_01",
            "warehouse_complex_01",
            "shilo_01",
        ],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const factionPotato = util.mergeDeep({}, Faction, mapDef) as MapDef;
