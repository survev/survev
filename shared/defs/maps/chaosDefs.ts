import { util } from "../../utils/util";
import { v2 } from "../../utils/v2";
import type { MapDef } from "../mapDefs";
import { MapId } from "../types/misc";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    /*
    Chaos Perk Mode. Core Idea: Give players a set of random perks.
     */
    mapId: MapId.Chaos,
    desc: {
        name: "Chaos",
        icon: "img/gui/bullets.svg",
        buttonCss: "btn-mode-chaos",
    },
    biome: {
        colors: {
            background: 0x20536e,
            water: 0x63bac9,
            waterRipple: 0xb3f0ff,
            beach: 0xd9c5cf,
            riverbank: 0xa6929c,
            grass: 0x53a382,
            underground: 0x1b0d03,
            playerSubmerge: 0x4293a1,
            playerGhillie: 0x52a180,
        },
        valueAdjust: 1,
        sound: { riverShore: "sand" },
        particles: { camera: "falling_leaf_spring" },
        tracerColors: {},
        airdrop: {
            planeImg: "map-plane-01.img",
            planeSound: "plane_01",
            airdropImg: "map-chute-01.img",
        },
    },
    mapGen: {
        map: {
            rivers: {
                lakes: [
                    {odds: 1, innerRad: 22, outerRad: 64, spawnBound: {pos: v2.create(0.5, 0.5), rad: 200,},},
                    {odds: 1, innerRad: 22, outerRad: 64, spawnBound: {pos: v2.create(0.5, 0.5), rad: 200,},},
                    {odds: 1, innerRad: 22, outerRad: 64, spawnBound: {pos: v2.create(0.5, 0.5), rad: 200,},},
                ],
                weights: [
                    { weight: 1, widths: [12, 8, 8, 8, 4] },
                ],
            }
        },
        spawnReplacements: [
            {
                bush_01: "bush_07sp",
                tree_01: "tree_07sp"
            },
        ]
    },
    gameMode: {
        autoPerkCount: 4,
        autoPerkTable: [
            { name: "firepower", count: 1, weight: 1 },
            { name: "windwalk", count: 1, weight: 1 },
            { name: "endless_ammo", count: 1, weight: 1 },
            { name: "steelskin", count: 1, weight: 1 },
            { name: "small_arms", count: 1, weight: 1 },
            { name: "takedown", count: 1, weight: 1 },
            { name: "field_medic", count: 1, weight: 1 },
            { name: "tree_climbing", count: 1, weight: 1 },
            { name: "scavenger", count: 1, weight: 1 },
            { name: "chambered", count: 1, weight: 1 },
            { name: "martyrdom", count: 1, weight: 1 },
            { name: "self_revive", count: 1, weight: 1 },
            { name: "flak_jacket", count: 1, weight: 1 },
            { name: "bonus_9mm", count: 1, weight: 0.5 },
            { name: "bonus_762", count: 1, weight: 0.5 },
            { name: "bonus_556", count: 1, weight: 0.5 },
            { name: "bonus_12g", count: 1, weight: 0.5 },
            { name: "bonus_assault", count: 1, weight: 0.5 },
            { name: "splinter", count: 1, weight: 0.5 },
            { name: "explosive_rounds", count: 1, weight: 0.2 },
            { name: "ap_rounds", count: 1, weight: 0.2 },
            { name: "scavenger_adv", count: 1, weight: 0.2 }
        ]
    }
};

export const Chaos = util.mergeDeep({}, Main, mapDef) as MapDef;
