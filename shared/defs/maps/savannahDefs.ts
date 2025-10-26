import { GameConfig } from "../../gameConfig";
import { util } from "../../utils/util";
import { MapId } from "../types/misc";
import { v2 } from "../../utils/v2";
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
    gameConfig: {
        /* STRIP_FROM_PROD_CLIENT:START */
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
                    options: { type: GameConfig.Plane.Airdrop },
                },
            ],
            crates: [
                { name: "airdrop_crate_01", weight: 10 },
                { name: "airdrop_crate_02", weight: 1 },
            ],
        },
        /* STRIP_FROM_PROD_CLIENT:END */
        bagSizes: {
            frag: [6, 12, 15, 18],
            smoke: [6, 12, 15, 18],
        },
    },
    mapGen: {
        map: {
            shoreInset: 8,
            grassInset: 12,
            rivers: {
                lakes: [
                    // TODO: small lakes look janky or lose their island when scaled down.
                    // also need to add two more smaller islands once that’s fixed.
                    {
                        odds: 1,
                        innerRad: 26,
                        outerRad: 55,
                        spawnBound: {
                            pos: v2.create(0.5, 0.5),
                            rad: 100,
                        },
                    },
                ],
                weights: [
                    { weight: 0.1, widths: [4] },
                    {
                        weight: 1e-4,
                        widths: [8, 8, 8, 6, 4],
                    },
                ],
                smoothness: 0.7,
                masks: [],
            },
        },
        
        fixedSpawns: [
            {
                kopje_patch_01: { small: 2, large: 3 },
                savannah_patch_01: { small: 3, large: 4 },
                grassy_cover_complex_01: 2,
                propane_01: 38,
                warehouse_01: 4,
                perch_01: 11,
                mansion_structure_01: 1,
                stone_07: 10,
                tree_12: 34,
                shack_01: 11,
                crate_02sv_lake: 3,
            },
        ],
        densitySpawns: [
            {
                tree_01: 50,
                bush_01: 20,
                crate_01: 50,
                brush_clump_01: 10,
                brush_clump_02: 10,
                brush_clump_03: 10,
                grassy_cover_01: 8,
                grassy_cover_02: 8,
                grassy_cover_03: 8,
            },
        ],
        randomSpawns: [{spawns: [],choose: 0,},],
        spawnReplacements: [
            {
                tree_01: "tree_01sv",
                bush_01: "bush_01sv",
            },
        ],
        importantSpawns: [],customSpawnRules: {locationSpawns: [],},
    },
};

export const Savannah = util.mergeDeep({}, Main, mapDef);
