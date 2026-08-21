import type { AABB } from "../../utils/coldet.ts";
import { collider } from "../../utils/collider.ts";
import { v2, type Vec2 } from "../../utils/v2.ts";
import type { TerrainSpawnDef } from "../mapObjectsTyping.ts";

export interface StructureDef {
    readonly type: "structure";
    terrain: TerrainSpawnDef;
    ori?: number;
    mapObstacleBounds?: AABB[];
    layers: Array<{
        type: string;
        pos: Vec2;
        ori: number;
        underground?: boolean;
        inheritOri?: number;
    }>;
    stairs: Array<{
        collision: AABB;
        downDir: Vec2;
        noCeilingReveal?: boolean;
        lootOnly?: boolean;
    }>;
    mask: AABB[];
    category?: string;
    interiorSound?: {
        sound: string;
        soundAlt: string;
        filter?: string;
        transitionTime: number;
        soundAltPlayTime?: number;
        outsideMaxDist: number;
        outsideVolume: number;
        undergroundVolume?: number;
        puzzle: string;
    };
    bridgeLandBounds?: AABB[];
    bridgeWaterBounds?: AABB[];
    teamId?: number;
}

function createBunkerChrys(params?: { bunkerType?: string }): StructureDef {
    const baseDef: StructureDef = {
        type: "structure",
        terrain: { grass: true, beach: false },
        ori: 0,
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(5, 5), v2.create(15, 15)),
        ],
        layers: [
            {
                type: "bunker_chrys_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: params?.bunkerType || "bunker_chrys_sublevel_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(0, 0),
                    v2.create(1.5, 2.6),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(10.5, -12.25), v2.create(15, 9.5)),
            collider.createAabbExtents(v2.create(40, 20), v2.create(14.45, 35)),
        ],
    };
    return baseDef;
}

export const StructureDefs: Record<string, StructureDef> = {
    bridge_lg_structure_01: {
        type: "structure",
        terrain: { bridge: { nearbyWidthMult: 5 } },
        layers: [
            {
                type: "bridge_lg_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bridge_lg_under_01",
                pos: v2.create(0, 0),
                ori: 0,
                underground: false,
            },
        ],
        bridgeLandBounds: [
            collider.createAabbExtents(v2.create(-34, 0), v2.create(6, 9)),
            collider.createAabbExtents(v2.create(34, 0), v2.create(6, 9)),
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(0, -9.5),
                    v2.create(11.5, 1.5),
                ),
                downDir: v2.create(0, 1),
                lootOnly: true,
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(0, 9.5),
                    v2.create(11.5, 1.5),
                ),
                downDir: v2.create(0, -1),
                lootOnly: true,
            },
        ],
        mask: [collider.createAabbExtents(v2.create(0, 0), v2.create(12, 8))],
    },
    bridge_xlg_structure_01: {
        type: "structure",
        terrain: { bridge: { nearbyWidthMult: 5 } },
        layers: [
            {
                type: "bridge_xlg_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bridge_xlg_under_01",
                pos: v2.create(0, 0),
                ori: 0,
                underground: false,
            },
        ],
        bridgeLandBounds: [
            collider.createAabbExtents(v2.create(-41, 0), v2.create(5, 10)),
            collider.createAabbExtents(v2.create(41, 0), v2.create(5, 10)),
        ],
        bridgeWaterBounds: [collider.createAabbExtents(v2.create(0, 0), v2.create(5, 5))],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(0, -13.5),
                    v2.create(11.5, 1.5),
                ),
                downDir: v2.create(0, 1),
                lootOnly: true,
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(0, 13.5),
                    v2.create(11.5, 1.5),
                ),
                downDir: v2.create(0, -1),
                lootOnly: true,
            },
        ],
        mask: [collider.createAabbExtents(v2.create(0, 0), v2.create(12, 12))],
    },
    bridge_md_structure_01: {
        type: "structure",
        terrain: { bridge: { nearbyWidthMult: 8 } },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(23, 7)),
        ],
        layers: [
            {
                type: "bridge_md_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bridge_md_under_01",
                pos: v2.create(0, 0),
                ori: 0,
                underground: false,
            },
        ],
        bridgeLandBounds: [
            collider.createAabbExtents(v2.create(-15.5, 0), v2.create(3, 5)),
            collider.createAabbExtents(v2.create(15.5, 0), v2.create(3, 5)),
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(0, -4.75),
                    v2.create(5.5, 1.25),
                ),
                downDir: v2.create(0, 1),
                lootOnly: true,
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(0, 4.75),
                    v2.create(5.5, 1.25),
                ),
                downDir: v2.create(0, -1),
                lootOnly: true,
            },
        ],
        mask: [collider.createAabbExtents(v2.create(0, 0), v2.create(6.5, 3.6))],
    },
    statue_structure_03: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 5), v2.create(7.5, 12.5)),
        ],
        layers: [
            {
                type: "statue_building_03",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "statue_underground_03",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(-1, 0),
                    v2.create(2.6, 2),
                ),
                downDir: v2.create(1, 0),
            },
        ],
        mask: [collider.createAabbExtents(v2.create(5.7, 0), v2.create(4, 4))],
    },
    statue_structure_04: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 5), v2.create(7.5, 12.5)),
        ],
        layers: [
            {
                type: "statue_building_04",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "statue_underground_04",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(-1, 0),
                    v2.create(2.6, 2),
                ),
                downDir: v2.create(1, 0),
            },
        ],
        mask: [collider.createAabbExtents(v2.create(5.7, 0), v2.create(4, 4))],
    },
    barn_basement_structure_01: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(30, 30)),
        ],
        layers: [
            {
                type: "barn_basement_stairs_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "barn_basement_floor_01",
                pos: v2.create(-10, -0.5),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(1.5, 1.5),
                    v2.create(2, 3.5),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(-12.5, -1), v2.create(12, 8.5)),
            collider.createAabbExtents(v2.create(3.51, -6), v2.create(4, 4)),
        ],
    },
    barn_basement_structure_01d: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(30, 30)),
        ],
        layers: [
            {
                type: "barn_basement_stairs_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "barn_basement_floor_01d",
                pos: v2.create(-10, -0.5),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(1.5, 1.5),
                    v2.create(2, 3.5),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(-12.5, -1), v2.create(12, 8.5)),
            collider.createAabbExtents(v2.create(3.51, -6), v2.create(4, 4)),
        ],
    },
    barn_basement_structure_01x: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(30, 30)),
        ],
        layers: [
            {
                type: "barn_basement_stairs_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "barn_basement_floor_01",
                pos: v2.create(-10, -0.5),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(1.5, 1.5),
                    v2.create(2, 3.5),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(-12.5, -1), v2.create(12, 8.5)),
            collider.createAabbExtents(v2.create(3.51, -6), v2.create(4, 4)),
        ],
    },
    mansion_structure_01: {
        type: "structure",
        terrain: { grass: true, beach: false },
        layers: [
            {
                type: "mansion_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "mansion_cellar_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(28, 1.5),
                    v2.create(3, 2.55),
                ),
                downDir: v2.create(-1, 0),
                noCeilingReveal: true,
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(1, 13.5),
                    v2.create(2, 3.5),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(10, -0.1), v2.create(15, 10.1)),
            collider.createAabbExtents(v2.create(17.5, 13.5), v2.create(7.49, 3.49)),
        ],
        teamId: 1,
    },
    mansion_structure_01x: {
        type: "structure",
        terrain: { grass: true, beach: false },
        layers: [
            {
                type: "mansion_01x",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "mansion_cellar_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(28, 1.5),
                    v2.create(3, 2.55),
                ),
                downDir: v2.create(-1, 0),
                noCeilingReveal: true,
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(1, 13.5),
                    v2.create(2, 3.5),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(10, -0.1), v2.create(15, 10.1)),
            collider.createAabbExtents(v2.create(17.5, 13.5), v2.create(7.49, 3.49)),
        ],
        teamId: 1,
    },
    mansion_structure_02: {
        type: "structure",
        terrain: { grass: true, beach: false },
        layers: [
            {
                type: "mansion_02",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "mansion_cellar_02",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(28, 1.5),
                    v2.create(3, 2.55),
                ),
                downDir: v2.create(-1, 0),
                noCeilingReveal: true,
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(1, 13.5),
                    v2.create(2, 3.5),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(10, -0.1), v2.create(15, 10.1)),
            collider.createAabbExtents(v2.create(17.5, 13.5), v2.create(7.49, 3.49)),
        ],
    },
    mansion_structure_03: {
        // beach mansion
        type: "structure",
        terrain: { grass: true, beach: true },
        layers: [
            {
                type: "mansion_03",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "mansion_cellar_03",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(28, 1.5),
                    v2.create(3, 2.55),
                ),
                downDir: v2.create(-1, 0),
                noCeilingReveal: true,
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(1, 13.5),
                    v2.create(2, 3.5),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(10, -0.1), v2.create(15, 10.1)),
            collider.createAabbExtents(v2.create(17.5, 13.5), v2.create(7.49, 3.49)),
        ],
    },
    reserve_structure_01: {
        type: "structure",
        terrain: {
            grass: true,
            beach: false,
            spawnPriority: 10,
        },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 1), v2.create(68, 38)),
        ],
        layers: [
            {
                type: "reserve_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "reserve_basement_01",
                pos: v2.create(14.5, -2),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(51.5, 11),
                    v2.create(6.5, 5.5),
                ),
                downDir: v2.create(0, -1),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(-21.5, 23.5),
                    v2.create(3.5, 2),
                ),
                downDir: v2.create(1, 0),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(15, -14.5), v2.create(60, 20)),
            collider.createAabbExtents(v2.create(10, 19.5), v2.create(28, 14)),
            collider.createAabbExtents(v2.create(-31.5, 9.5), v2.create(13.5, 4)),
        ],
        interiorSound: {
            sound: "reserve_music_01",
            soundAlt: "reserve_music_02",
            filter: "club",
            transitionTime: 1,
            soundAltPlayTime: 90,
            outsideMaxDist: 20,
            outsideVolume: 0.25,
            undergroundVolume: 0.707,
            puzzle: "reserve_vault",
        },
    },
    saloon_structure_01: {
        type: "structure",
        terrain: { grass: true, beach: false },
        layers: [
            {
                type: "saloon_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "saloon_cellar_01",
                pos: v2.create(-19, -6),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(-19.5, 0.75),
                    v2.create(1.5, 2),
                ),
                downDir: v2.create(-1, 0),
            },
        ],
        mask: [collider.createAabbExtents(v2.create(-30, 0.75), v2.create(10, 5))],
        interiorSound: {
            sound: "piano_music_01",
            soundAlt: "",
            transitionTime: 5,
            outsideMaxDist: 10,
            outsideVolume: 0.25,
            puzzle: "saloon",
        },
    },
    club_structure_01: {
        type: "structure",
        category: "club",
        terrain: {
            grass: true,
            beach: false,
            spawnPriority: 10,
        },
        mapObstacleBounds: [],
        layers: [
            {
                type: "club_01",
                pos: v2.create(-3.5, -17.5),
                ori: 0,
            },
            {
                type: "bathhouse_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(-33, -26),
                    v2.create(3, 2.55),
                ),
                downDir: v2.create(1, 0),
                noCeilingReveal: true,
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(23, -28.5),
                    v2.create(2, 3),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(-5, 8), v2.create(25, 50)),
            collider.createAabbExtents(v2.create(23.01, -35.5), v2.create(3, 4)),
        ],
        interiorSound: {
            sound: "club_music_01",
            soundAlt: "club_music_02",
            filter: "club",
            transitionTime: 1,
            soundAltPlayTime: 90,
            outsideMaxDist: 10,
            outsideVolume: 0.25,
            undergroundVolume: 0.707,
            puzzle: "club_02",
        },
    },
    // Bunkers
    bunker_structure_01: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 5), v2.create(7.5, 12.5)),
        ],
        layers: [
            {
                type: "bunker_egg_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bunker_egg_sublevel_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(0, 8.4),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [collider.createAabbExtents(v2.create(0, -3.7), v2.create(10, 9.5))],
    },
    bunker_structure_01b: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 5), v2.create(7.5, 12.5)),
        ],
        layers: [
            {
                type: "bunker_egg_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bunker_egg_sublevel_02",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(0, 8.4),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [collider.createAabbExtents(v2.create(0, -3.7), v2.create(10, 9.5))],
    },
    bunker_structure_01sv: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 5), v2.create(7.5, 12.5)),
        ],
        layers: [
            {
                type: "bunker_egg_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bunker_egg_sublevel_01sv",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(0, 8.4),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [collider.createAabbExtents(v2.create(0, -3.7), v2.create(10, 9.5))],
    },
    bunker_structure_02: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(25.5, 3.5), v2.create(16, 11.5)),
            collider.createAabbExtents(v2.create(-16.5, -89.5), v2.create(7, 7.5)),
            collider.createAabbExtents(v2.create(40, -47.25), v2.create(6.5, 7.25)),
            collider.createAabbExtents(v2.create(3.5, -48.5), v2.create(3, 3)),
        ],
        layers: [
            {
                type: "bunker_hydra_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bunker_hydra_sublevel_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(16.4, 3.5),
                    v2.create(2.6, 2),
                ),
                downDir: v2.create(-1, 0),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(-16.5, -90.75),
                    v2.create(2, 2.5),
                ),
                downDir: v2.create(0, 1),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(40, -50.35),
                    v2.create(2, 2.5),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(3.5, -7.2), v2.create(10.75, 20)),
            collider.createAabbExtents(v2.create(-15, -79.75), v2.create(5, 8.5)),
            collider.createAabbExtents(v2.create(39, -61.85), v2.create(12, 9)),
            collider.createAabbExtents(v2.create(3.5, -49.2), v2.create(23.49, 21.99)),
            collider.createAabbExtents(v2.create(10.5, -76.7), v2.create(10, 5.5)),
        ],
    },
    bunker_structure_03: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 6), v2.create(7, 16.5)),
        ],
        layers: [
            {
                type: "bunker_storm_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bunker_storm_sublevel_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(0, 8.4),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [collider.createAabbExtents(v2.create(8.5, -3.7), v2.create(18, 9.5))],
    },
    bunker_structure_04: {
        type: "structure",
        terrain: {
            waterEdge: {
                dir: v2.create(-1, 0),
                distMin: 15,
                distMax: 16,
            },
        },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(21, 3.5), v2.create(9.5, 8)),
            collider.createAabbExtents(v2.create(48, -32.5), v2.create(10, 8)),
        ],
        layers: [
            {
                type: "bunker_conch_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bunker_conch_sublevel_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(16.9, 3.5),
                    v2.create(2.6, 2),
                ),
                downDir: v2.create(-1, 0),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(44.9, -32.5),
                    v2.create(2.6, 2),
                ),
                downDir: v2.create(-1, 0),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(-1.5, -9.2), v2.create(15.7, 22)),
            collider.createAabbExtents(v2.create(28.25, -32), v2.create(14, 8)),
        ],
    },
    bunker_structure_05: {
        type: "structure",
        terrain: {
            grass: true,
            beach: false,
            bridge: { nearbyWidthMult: 1.2 },
            spawnPriority: 100,
        },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(35.5, 28.5), v2.create(6, 6)),
            collider.createAabbExtents(v2.create(-36, 19), v2.create(6, 6)),
            collider.createAabbExtents(v2.create(36, -13), v2.create(6, 6)),
            collider.createAabbExtents(v2.create(-35.5, -22.5), v2.create(6, 6)),
            collider.createAabbExtents(v2.create(0, 0), v2.create(6, 6)),
        ],
        bridgeLandBounds: [
            collider.createAabbExtents(v2.create(35.5, 28.5), v2.create(5, 5)),
            collider.createAabbExtents(v2.create(-36, 19), v2.create(5, 5)),
            collider.createAabbExtents(v2.create(36, -13), v2.create(5, 5)),
            collider.createAabbExtents(v2.create(-35.5, -22.5), v2.create(5, 5)),
        ],
        bridgeWaterBounds: [collider.createAabbExtents(v2.create(0, 0), v2.create(5, 5))],
        layers: [
            {
                type: "bunker_crossing_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bunker_crossing_sublevel_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(35.6, 28.5),
                    v2.create(2.6, 2),
                ),
                downDir: v2.create(-1, 0),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(-36, 19),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, 1),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(36, -13),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, -1),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(-35.5, -22.5),
                    v2.create(2.6, 2),
                ),
                downDir: v2.create(1, 0),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(-3.7, 27), v2.create(36.5, 5)),
            collider.createAabbExtents(v2.create(3.7, -21), v2.create(36.5, 5)),
            collider.createAabbExtents(v2.create(0, 3), v2.create(30, 18.95)),
        ],
    },
    bunker_structure_06: {
        type: "structure",
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(1, 6), v2.create(7, 13.5)),
        ],
        layers: [
            {
                type: "bunker_hatchet_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bunker_hatchet_sublevel_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(0, 8.4),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [
            collider.createAabbExtents(v2.create(-3, -3.7), v2.create(13, 9.5)),
            collider.createAabbExtents(v2.create(-48.025, 6), v2.create(32, 24.95)),
        ],
    },
    bunker_structure_07: {
        type: "structure",
        terrain: { grass: true, beach: false },
        ori: 2,
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(-1, 8), v2.create(7, 6)),
            collider.createAabbExtents(v2.create(-40, -70), v2.create(2, 2)),
            collider.createAabbExtents(v2.create(40, -70), v2.create(2, 2)),
            collider.createAabbExtents(v2.create(0, -30), v2.create(2, 2)),
            collider.createAabbExtents(v2.create(5, 23), v2.create(2, 2)),
        ],
        layers: [
            {
                type: "bunker_eye_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bunker_eye_sublevel_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(0, 8.4),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, -1),
            },
        ],
        mask: [collider.createAabbExtents(v2.create(0, -22.2), v2.create(13.5, 28))],
    },
    bunker_structure_08: createBunkerChrys({
        bunkerType: "bunker_chrys_sublevel_01",
    }),
    bunker_structure_08b: createBunkerChrys({
        bunkerType: "bunker_chrys_sublevel_01b",
    }),
    bunker_structure_09: {
        type: "structure",
        terrain: { grass: true, beach: false },
        ori: 0,
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(1, 15.4), v2.create(3.5, 6)),
            collider.createAabbExtents(v2.create(-1, -15.4), v2.create(3.5, 6)),
            collider.createAabbExtents(v2.create(20.5, 2.5), v2.create(6, 6)),
            collider.createAabbExtents(v2.create(-20.5, 0), v2.create(6, 3.5)),
            collider.createAabbExtents(v2.create(8, -12.25), v2.create(6, 6)),
            collider.createAabbExtents(v2.create(-12, 8.5), v2.create(6, 6)),
            collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2.5)),
        ],
        layers: [
            {
                type: "bunker_twins_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
            {
                type: "bunker_twins_sublevel_01",
                pos: v2.create(0, 0),
                ori: 0,
            },
        ],
        stairs: [
            {
                collision: collider.createAabbExtents(
                    v2.create(1, 14.4),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, -1),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(-1, -14.4),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, 1),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(19.5, 0),
                    v2.create(2.6, 2),
                ),
                downDir: v2.create(-1, 0),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(-19.5, 0),
                    v2.create(2.6, 2),
                ),
                downDir: v2.create(1, 0),
            },
        ],
        mask: [collider.createAabbExtents(v2.create(0, 0), v2.create(16.75, 11.75))],
    },
};
