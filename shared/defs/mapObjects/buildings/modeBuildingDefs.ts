import { collider } from "../../../utils/collider.ts";
import { type DeepPartial, util } from "../../../utils/util.ts";
import { v2 } from "../../../utils/v2.ts";
import { randomObstacleType } from "../mapObjectHelpers.ts";
import {
    createBank,
    createBankVault,
    createBarn,
    createBarnBasement,
    createBridgeLarge,
    createCabin,
    createContainer,
    createGreenhouse,
    createHouseRed,
    createHouseRed2,
    createHut,
    createMansion,
    createMansionCellar,
    createOutHouse,
    createPoliceStation,
    createShack,
    createShack2,
    createShack3,
    createTeahouse,
    createTeaHouseComplex,
    createWarehouse,
    createWarehouse2,
    createWarehouse3,
} from "./baseBuildingDefs.ts";
import type { BuildingChildObjType, BuildingDef } from "./buildingDefs.ts";

function createCamp(
    overrides: DeepPartial<BuildingDef>,
    params: { groundTintDk?: number; tree?: BuildingChildObjType },
): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [collider.createCircle(v2.create(0, 0), 22.5)],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(
                    v2.create(10.5, 10),
                    v2.create(5.75, 5.5),
                ),
                color: params.groundTintDk || 0x9e9e9e,
                roughness: 0.1,
                offsetDist: 0,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-1, -15),
                    v2.create(6.25, 4.5),
                ),
                color: params.groundTintDk || 0x9e9e9e,
                roughness: 0.1,
                offsetDist: 0,
            },
        ],
        floor: {
            surfaces: [{ type: "snow", collision: [] }],
            imgs: [],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(15, 15),
                    ),
                    noZoom: true,
                },
            ],
            imgs: [],
        },
        occupiedEmitters: [
            {
                type: "campfire_smoke",
                pos: v2.create(0, 0),
                rot: 0,
                scale: 1,
                layer: 0,
                parentToCeiling: true,
            },
        ],
        healRegions: [
            {
                collision: collider.createCircle(v2.create(0, 0), 15),
                healRate: 2,
            },
        ],
        mapObjects: [
            {
                type: randomObstacleType({ barrel_01: 1, crate_03: 1 }),
                pos: v2.create(3, -16.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ bush_01: 3, cache_06: 1 }),
                pos: v2.create(-14, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: "campfire_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(8, 12),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(13, 10),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_03x",
                pos: v2.create(8.5, 7.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ tree_09: 3, tree_02: 6, tree_02h: 1 }),
                pos: v2.create(-13.5, 7.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "tree_09",
                pos: v2.create(-7.5, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: params.tree || "tree_10",
                pos: v2.create(14, -6),
                scale: 1.1,
                ori: 0,
            },
            {
                type: params.tree || "tree_10",
                pos: v2.create(-9, 12.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "woodpile_03",
                pos: v2.create(-1, -13),
                scale: 1,
                ori: 0,
            },
            {
                type: "woodpile_03",
                pos: v2.create(-3, -17),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createGrassyCover(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(10, 10)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(8, 8)),
                color: 0x75721e,
                roughness: 0.1,
                offsetDist: 0.2,
            },
        ],
        floor: { surfaces: [], imgs: [] },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createLargeHut(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(-2.75, 2.25),
                        v2.create(12.5, 8.5),
                    ),
                    color: 0xe7a847,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-1.75, -8.5),
                        v2.create(11.5, 2.25),
                    ),
                    color: 0x5e2d03,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(12.5, -1),
                        v2.create(2.8, 9.75),
                    ),
                    color: 0x5e2d03,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, -22.5),
                        v2.create(2, 12),
                    ),
                    color: 0x5e2d03,
                },
            ],
        },
        terrain: {
            waterEdge: {
                dir: v2.create(0, 1),
                distMin: -12.5,
                distMax: 0,
            },
        },
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(-2.75, 2.25),
                            v2.create(12.5, 8.5),
                        ),
                        collider.createAabbExtents(
                            v2.create(-1.75, -8.5),
                            v2.create(11.5, 2.25),
                        ),
                        collider.createAabbExtents(
                            v2.create(12.5, -1),
                            v2.create(2.75, 9.75),
                        ),
                        collider.createAabbExtents(
                            v2.create(0, -22.75),
                            v2.create(2, 12),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-hut-floor-03.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-hut-floor-02.img",
                    pos: v2.create(0, -22.75),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-2.75, 2.25),
                        v2.create(11.5, 7.5),
                    ),
                },
            ],
            vision: { width: 4 },
            imgs: [
                {
                    pos: v2.create(-2, 2),
                    sprite: "map-building-hut-ceiling-04.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
            destroy: {
                wallCount: 5,
                particle: "hutBreak",
                particleCount: 25,
                residue: "map-hut-res-02.img",
            },
        },
        mapObjects: [
            {
                type: "hut_wall_int_10",
                pos: v2.create(-4.75, 4.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "hut_wall_int_14",
                pos: v2.create(-7.25, 10.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "hut_wall_int_7",
                pos: v2.create(-14.75, 7.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "hut_window_open_01",
                pos: v2.create(-15, 2.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "hut_wall_int_7",
                pos: v2.create(-14.75, -2.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "hut_wall_int_5",
                pos: v2.create(-11.75, -5.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "hut_wall_int_5",
                pos: v2.create(-2.75, -5.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "hut_window_open_01",
                pos: v2.create(1.25, -6),
                scale: 1,
                ori: 1,
            },
            {
                type: "hut_wall_int_6",
                pos: v2.create(5.75, -5.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "hut_wall_int_6",
                pos: v2.create(9.25, -3.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "hut_wall_int_7",
                pos: v2.create(9.25, 7.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "hut_wall_int_6",
                pos: v2.create(5.75, 10.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "hut_window_open_01",
                pos: v2.create(1.25, 10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "chest_01",
                pos: v2.create(6.25, -3.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "table_01",
                pos: v2.create(-2, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ barrel_02: 1, barrel_05: 1 }),
                pos: v2.create(4.25, 8),
                scale: 0.9,
                ori: 1,
            },
            {
                type: randomObstacleType({ barrel_02: 1, barrel_05: 1 }),
                pos: v2.create(7, 6.25),
                scale: 0.9,
                ori: 1,
            },
            {
                type: "pot_01",
                pos: v2.create(-7, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "pot_01",
                pos: v2.create(-12.5, -3.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bed_sm_01",
                pos: v2.create(-12.5, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "bollard_01",
                pos: v2.create(12.5, 7.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "gun_mount_06",
                pos: v2.create(-6.1, 3),
                scale: 1,
                ori: -1,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createLoggingComplex(
    overrides: DeepPartial<BuildingDef>,
    params: {
        groundTintLt?: number;
        groundTintDk?: number;
    },
): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false, spawnPriority: 10 },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, -4), v2.create(55, 50)),
        ],
        bridgeLandBounds: [
            collider.createAabbExtents(v2.create(0, -4), v2.create(55, 50)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(55, 55)),
                color: params.groundTintLt || 0x4f4810,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(v2.create(-28.5, 7), v2.create(7, 5)),
                color: params.groundTintDk || 0x5b5a0b,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-24.5, -35),
                    v2.create(5.5, 4.5),
                ),
                color: params.groundTintDk || 0x5b5a0b,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(v2.create(20, 10), v2.create(20, 30)),
                color: params.groundTintDk || 0x5b5a0b,
                roughness: 0.05,
                offsetDist: 0.5,
            },
        ],
        floor: {
            surfaces: [
                {
                    type: "grass",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(55, 55)),
                    ],
                },
            ],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "container_04",
                pos: v2.create(3.75, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(-1.35, 10.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(-6, 12.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(-2, 14.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "warehouse_02",
                pos: v2.create(20, 10),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(35, 24.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(35, 29),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(39.75, 27),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "tree_07",
                pos: v2.create(47, 13),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_02",
                pos: v2.create(50.5, 9.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bunker_structure_06",
                pos: v2.create(38, -12.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                }),
                pos: v2.create(21, -32),
                scale: 1,
                ori: 3,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                }),
                pos: v2.create(21, -37.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "tree_07",
                pos: v2.create(45.5, -31.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_07",
                pos: v2.create(40.5, -36.5),
                scale: 1.1,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(21.75, -50),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(26.75, -49),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "tree_02",
                pos: v2.create(44.5, -50.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "tree_09",
                pos: v2.create(-9, 34),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_02",
                pos: v2.create(-13.5, 35.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "tree_09",
                pos: v2.create(-16.5, 32),
                scale: 1,
                ori: 3,
            },
            {
                type: "tree_09",
                pos: v2.create(-20, 36),
                scale: 1,
                ori: 2,
            },
            {
                type: "tree_09",
                pos: v2.create(-24.5, 33),
                scale: 1,
                ori: 3,
            },
            {
                type: "tree_09",
                pos: v2.create(-31.5, 37),
                scale: 1,
                ori: 2,
            },
            {
                type: "tree_09",
                pos: v2.create(-32.5, 32),
                scale: 1,
                ori: 1,
            },
            {
                type: "tree_09",
                pos: v2.create(-40, 35.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "tree_09",
                pos: v2.create(-44.5, 32.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "woodpile_02",
                pos: v2.create(-33.5, 23.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "woodpile_02",
                pos: v2.create(-42.75, 21.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(-30.5, 9),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ chest_02: 1, case_04: 1 }),
                pos: v2.create(-30.5, 4.75),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(-25.75, 7),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "woodpile_02",
                pos: v2.create(-14.5, 0.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "woodpile_02",
                pos: v2.create(-21, -8.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-36.5, -9),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-34, -11.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "outhouse_01",
                pos: v2.create(-48.5, -5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ outhouse_01: 5, outhouse_02: 1 }),
                pos: v2.create(-48.5, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "woodpile_01",
                pos: v2.create(-51, -20.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(-26.75, -36),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(-22, -34),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "tree_09",
                pos: v2.create(-14.5, -20),
                scale: 1,
                ori: 1,
            },
            {
                type: "tree_09",
                pos: v2.create(-11.5, -23),
                scale: 1,
                ori: 2,
            },
            {
                type: "tree_09",
                pos: v2.create(-15.5, -24),
                scale: 1,
                ori: 0,
            },
            {
                type: "woodpile_02",
                pos: v2.create(-37, -34),
                scale: 1,
                ori: 1,
            },
            {
                type: "woodpile_02",
                pos: v2.create(-31, -47),
                scale: 1,
                ori: 0,
            },
            {
                type: "woodpile_02",
                pos: v2.create(-18.75, -45.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-2.5, -35.75),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(0.75, -37.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "tree_07",
                pos: v2.create(1, -33),
                scale: 1.2,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createLoggingComplex2(
    overrides: DeepPartial<BuildingDef>,
    params: {
        groundTintLt?: number;
        groundTintDk?: number;
        tree_08c?: BuildingChildObjType;
    },
): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false, spawnPriority: 10 },
        mapObstacleBounds: [collider.createCircle(v2.create(0, 0), 40)],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(5, 21.5), v2.create(5.5, 6)),
                color: params.groundTintDk || 0x736a22,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-17.75, -14),
                    v2.create(6, 4.5),
                ),
                color: params.groundTintDk || 0x736a22,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(21.5, -10),
                    v2.create(4.75, 3.5),
                ),
                color: params.groundTintDk || 0x736a22,
                roughness: 0.05,
                offsetDist: 0.5,
            },
        ],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: params.tree_08c || "tree_08c",
                pos: v2.create(0, 0),
                scale: 2,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(2.5, 19.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(7.5, 19),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(3.5, 24.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_04",
                pos: v2.create(-20.5, -13.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_04",
                pos: v2.create(-15, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(23.5, -9.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(20, -11),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createLoggingComplex3(
    overrides: DeepPartial<BuildingDef>,
    params: {
        groundTintLt?: number;
        groundTintDk?: number;
    },
): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: {
            grass: true,
            beach: false,
            spawnPriority: 10,
        },
        mapObstacleBounds: [collider.createCircle(v2.create(0, 0), 32)],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(6.5, 5.5)),
                color: params.groundTintDk || 0x736a22,
                roughness: 0.05,
                offsetDist: 0.5,
            },
        ],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(1.75, 2.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_19: 1 }),
                pos: v2.create(-1.75, -2.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "tree_09",
                pos: v2.create(2.75, -2.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-2.75, 2.25),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createOasis(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [collider.createCircle(v2.create(0, 0), 43)],
        mapGroundPatches: [
            {
                bound: collider.createCircle(v2.create(0, 0), 40),
                color: 0xa6af48,
                roughness: 0.3,
                offsetDist: 2,
            },
        ],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        soundEmitters: [
            {
                sound: "ambient_wind_01",
                channel: "ambient",
                pos: v2.create(0, 0),
                range: { min: 15, max: 35 },
                falloff: 1,
                volume: 1,
            },
        ],
        healRegions: [
            {
                collision: collider.createCircle(v2.create(0, 0), 20),
                healRate: 1,
            },
        ],
        mapObjects: [
            //
            // Central Island
            //

            {
                type: "tree_14d",
                pos: v2.create(-1, 0),
                scale: 1.75,
                ori: 0,
            },
            {
                type: "tree_02",
                pos: v2.create(-4.5, -4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_09de",
                pos: v2.create(5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_05",
                pos: v2.create(3, 5),
                scale: 1,
                ori: 0,
            },

            //
            // Outer Region
            //

            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(25, 25),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(20, 26),
                scale: 0.9,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(23, 12),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(22, 21),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-17, 25),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-14, -20),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-29, 14),
                scale: 1.2,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-32, 7),
                scale: 1,
                ori: 0,
            },
            {
                type: "bush_03",
                pos: v2.create(-33, -4),
                scale: 1.2,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-34, -9),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ barrel_02: 3, barrel_05: 1 }),
                pos: v2.create(-28, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-2, -25),
                scale: 1.2,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-7, -32),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(3, -34),
                scale: 1.1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(5, -28),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ barrel_02: 3, barrel_05: 1 }),
                pos: v2.create(32, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ barrel_02: 3, barrel_05: 1 }),
                pos: v2.create(30, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(30, -4),
                scale: 1.3,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-5, 30),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(3, 28),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-11, 28),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_02",
                pos: v2.create(25, -25),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(23.5, -18.5),
                scale: 1.15,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_01: 2, barrel_01: 1 }),
                pos: v2.create(20, -23),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-22.5, -16),
                scale: 1.15,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-20, -20),
                scale: 1,
                ori: 0,
            },
            {
                type: "bush_03",
                pos: v2.create(-24, -21),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createReserve(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 2.5),
                        v2.create(30, 21),
                    ),
                    color: 0x262220,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-44, 1.5),
                        v2.create(14, 25),
                    ),
                    color: 0x262220,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-22.5, 24.5),
                        v2.create(7.5, 2),
                    ),
                    color: 0x262220,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(44.5, 0),
                        v2.create(14.5, 23.5),
                    ),
                    color: 0x262220,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, -27.5),
                        v2.create(19, 9),
                    ),
                    color: 0x422e2a,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(49, 25.5),
                        v2.create(10, 2),
                    ),
                    color: 0x422e2a,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "house",
                    collision: [
                        // Lounge / Bar 1
                        collider.createAabbExtents(
                            v2.create(-36.75, 7.5),
                            v2.create(21.25, 12),
                        ),
                        // Lounge / Bar 2
                        collider.createAabbExtents(
                            v2.create(-42, 23.25),
                            v2.create(16, 3.75),
                        ),
                        // Meeting Room
                        collider.createAabbExtents(
                            v2.create(-44, -13.5),
                            v2.create(14, 9),
                        ),
                        // Employee / Bay Lounge
                        collider.createAabbExtents(
                            v2.create(44, -10.5),
                            v2.create(14.5, 13),
                        ),
                        // Hallway
                        collider.createAabbExtents(
                            v2.create(41.5, 9.5),
                            v2.create(2.5, 7),
                        ),
                        // Foyer
                        collider.createAabbExtents(
                            v2.create(7, 3),
                            v2.create(22.5, 20.5),
                        ),
                        // Entrance
                        collider.createAabbExtents(
                            v2.create(0, -25.5),
                            v2.create(18, 8),
                        ),
                    ],
                },
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(-22.5, -11),
                            v2.create(6.5, 6.5),
                        ),
                        collider.createAabbExtents(
                            v2.create(34, 12.5),
                            v2.create(4.5, 10.5),
                        ),
                    ],
                },
                {
                    type: "asphalt",
                    collision: [
                        // Loading Bay 1
                        collider.createAabbExtents(
                            v2.create(51.5, 16.5),
                            v2.create(6.5, 11),
                        ),
                        // Loading Bay 2
                        collider.createAabbExtents(
                            v2.create(42, 22),
                            v2.create(3, 5.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-reserve-floor-04.img",
                    pos: v2.create(0, -25.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-reserve-floor-01.img",
                    pos: v2.create(-37, 2),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-reserve-floor-02.img",
                    pos: v2.create(7, 2.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-reserve-floor-03.img",
                    pos: v2.create(44, 2),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 1), v2.create(68, 38)),
        ],
        ceiling: {
            zoomRegions: [
                // Meeting Room
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-44, -13.5),
                        v2.create(14, 9),
                    ),
                },
                // Bar / Lounge
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-37, 11),
                        v2.create(21, 15.5),
                    ),
                    zoom: 36,
                },
                // Greenery
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-22.5, -11),
                        v2.create(6.5, 6.5),
                    ),
                },
                // Main Foyer
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(7, 2.5),
                        v2.create(23, 20),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(9, 24.5),
                        v2.create(8, 2),
                    ),
                    zoom: 36,
                },
                // Right Wing
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(44, 0),
                        v2.create(14, 22.5),
                    ),
                },
                // Ramp / Loading Bay
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(46, 26.5),
                        v2.create(13, 4),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(46, 28),
                        v2.create(14.5, 4.5),
                    ),
                },
                // Main Entrance
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, -25.5),
                        v2.create(18, 8),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, -27),
                        v2.create(20, 8.5),
                    ),
                },
            ],
            vision: {
                dist: 5.5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [
                {
                    sprite: "map-building-reserve-ceiling-01.img",
                    pos: v2.create(-44, 2),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-reserve-ceiling-02.img",
                    pos: v2.create(0, 4.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-reserve-ceiling-03.img",
                    pos: v2.create(44, 2.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-reserve-ceiling-04.img",
                    pos: v2.create(0, -26.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-chimney-01.img",
                    pos: v2.create(-34.5, 11),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    removeOnDamaged: true,
                },
            ],
        },
        occupiedEmitters: [
            {
                type: "cabin_smoke_parent",
                pos: v2.create(0, 0),
                rot: 0,
                scale: 1,
                layer: 0,
                parentToCeiling: true,
            },
        ],
        mapObjects: [
            //
            // Unbreakable Walls
            //

            {
                type: "metal_wall_ext_7",
                pos: v2.create(30.5, -19.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_10",
                pos: v2.create(36, -22),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_1",
                pos: v2.create(39.5, 16),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_2",
                pos: v2.create(31, 2),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_2",
                pos: v2.create(37, 2),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_4",
                pos: v2.create(-28, 27),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_6",
                pos: v2.create(-15.5, 16.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_7",
                pos: v2.create(15.5, 17),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_8",
                pos: v2.create(-2.5, 18.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_8",
                pos: v2.create(2, 17),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_10",
                pos: v2.create(-15.5, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_10",
                pos: v2.create(-58.5, -18.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_10",
                pos: v2.create(-53, -4),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_10",
                pos: v2.create(-35, -4),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_10",
                pos: v2.create(29.5, -2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_11",
                pos: v2.create(-52.5, -23),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_11",
                pos: v2.create(52.5, -23),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_12",
                pos: v2.create(29.5, -17.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_14",
                pos: v2.create(37, -23),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_14",
                pos: v2.create(44.5, 9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_18",
                pos: v2.create(-6, 23),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_20",
                pos: v2.create(-29.5, -13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_20",
                pos: v2.create(58.5, -13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_22",
                pos: v2.create(38.5, 12.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_23",
                pos: v2.create(26.5, 23),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_25",
                pos: v2.create(-16.5, -18),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_25",
                pos: v2.create(58.5, 12),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_25",
                pos: v2.create(16.5, -18),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_25",
                pos: v2.create(-45.5, 27),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_11",
                pos: v2.create(-35.5, -23),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_38",
                pos: v2.create(-58.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_2x10",
                pos: v2.create(28, -2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_2x11",
                pos: v2.create(-20.5, 26.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_2x11",
                pos: v2.create(-20.5, 20.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_2x11",
                pos: v2.create(23.5, -16.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_perm_wall_ext_3x4",
                pos: v2.create(-16.5, 23.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_perm_wall_ext_3x13",
                pos: v2.create(51.5, 4),
                scale: 1,
                ori: 1,
            },

            //
            // Breakable Walls
            //

            {
                type: "reserve_wall_int_3",
                pos: v2.create(20.5, 9),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_wall_int_3",
                pos: v2.create(27.5, 9),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_wall_int_3",
                pos: v2.create(18.5, -14),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_wall_int_3",
                pos: v2.create(18.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_wall_int_4",
                pos: v2.create(-5, 15),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_wall_int_4",
                pos: v2.create(-13, 15),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_wall_int_5",
                pos: v2.create(18.5, 1),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_wall_int_5",
                pos: v2.create(18.5, -7),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_wall_int_6",
                pos: v2.create(29.5, 19.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_wall_int_8",
                pos: v2.create(34, 11),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_wall_int_9",
                pos: v2.create(53.5, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_wall_int_12",
                pos: v2.create(9, 23),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_wall_int_10",
                pos: v2.create(29.5, 7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_wall_int_13",
                pos: v2.create(-22.5, -4),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_wall_int_16",
                pos: v2.create(44.5, -5.5),
                scale: 1,
                ori: 0,
            },

            //
            // Windows
            //

            {
                type: "house_window_01",
                pos: v2.create(-31.5, 27.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "reserve_window_01",
                pos: v2.create(-44, -23.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(-58.75, -12),
                scale: 1,
                ori: 0,
            },

            //
            // Entrance
            //

            {
                type: "house_door_01",
                pos: v2.create(4, -18),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(-4, -18),
                scale: 1,
                ori: 3,
            },
            {
                type: "bathhouse_column_1",
                pos: v2.create(-13.5, -21),
                scale: 1,
                ori: 0,
            },
            {
                type: "bathhouse_column_1",
                pos: v2.create(-13.5, -29),
                scale: 1,
                ori: 0,
            },
            {
                type: "bathhouse_column_1",
                pos: v2.create(-6.5, -29),
                scale: 1,
                ori: 0,
            },
            {
                type: "bathhouse_column_1",
                pos: v2.create(13.5, -21),
                scale: 1,
                ori: 0,
            },
            {
                type: "bathhouse_column_1",
                pos: v2.create(13.5, -29),
                scale: 1,
                ori: 0,
            },
            {
                type: "bathhouse_column_1",
                pos: v2.create(6.5, -29),
                scale: 1,
                ori: 0,
            },

            //
            // Bar / Lounge
            //

            {
                type: "house_door_01",
                pos: v2.create(-15.5, 5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(-15.5, 13.5),
                scale: 1,
                ori: 2,
            },

            {
                type: "couch_03",
                pos: v2.create(-17.5, -2),
                scale: 1,
                ori: 1,
            },
            {
                type: "couch_02",
                pos: v2.create(-22, -2),
                scale: 1,
                ori: 2,
            },
            {
                type: "couch_03",
                pos: v2.create(-17.5, 1),
                scale: 1,
                ori: 2,
            },
            {
                type: "table_03",
                pos: v2.create(-22, 2.25),
                scale: 1,
                ori: 2,
            },
            {
                type: "chair_02",
                pos: v2.create(-49.5, 10),
                scale: 1,
                ori: 1,
            },
            {
                type: "chair_02",
                pos: v2.create(-50, 5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bush_02",
                pos: v2.create(-56, -1.25),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: randomObstacleType({ gun_mount_02: 4, gun_mount_01: 1 }),
                pos: v2.create(-52, -2.75),
                scale: 1,
                ori: 2,
            },
            {
                type: "reserve_bar_back",
                pos: v2.create(-57.25, 7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_1",
                pos: v2.create(-54.5, 8.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "bottle_01",
                pos: v2.create(-57.25, 11.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_04",
                pos: v2.create(-57.25, 10),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_05",
                pos: v2.create(-57.25, 9),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_05",
                pos: v2.create(-57.25, 6.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_04",
                pos: v2.create(-57.25, 4),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_05",
                pos: v2.create(-57.25, 3),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "reserve_bar_large",
                pos: v2.create(-51.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_bar_small",
                pos: v2.create(-54, 14),
                scale: 1,
                ori: 1,
            },
            {
                type: "bottle_04",
                pos: v2.create(-51.25, 13.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-51, 12.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-51.75, 9.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_04",
                pos: v2.create(-51, 6),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_05",
                pos: v2.create(-51.75, 5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-52, 2),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_04",
                pos: v2.create(-53.75, 14.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-55, 14),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "piano_01",
                pos: v2.create(-42.5, 25.15),
                scale: 1,
                ori: 0,
            },
            {
                type: "chair_01",
                pos: v2.create(-42.25, 16.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "chair_01",
                pos: v2.create(-39.5, 18.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "table_03",
                pos: v2.create(-42, 18.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "chair_01",
                pos: v2.create(-37, 5),
                scale: 1,
                ori: 2,
            },
            {
                type: "chair_01",
                pos: v2.create(-39.75, 3),
                scale: 1,
                ori: 3,
            },
            {
                type: "table_03",
                pos: v2.create(-37, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "stove_02",
                pos: v2.create(-34.5, 11),
                scale: 1,
                ori: 0,
            },
            {
                type: "bush_02",
                pos: v2.create(-18, 17.25),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ barrel_02: 1, barrel_05: 1 }),
                pos: v2.create(-22.75, 17.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ barrel_02: 1, barrel_05: 1 }),
                pos: v2.create(-32, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_03",
                pos: v2.create(-36.75, 24.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_14a",
                pos: v2.create(-55.5, 24),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_14",
                pos: v2.create(-50.5, 22),
                scale: 1,
                ori: 0,
            },
            {
                type: "rack_01",
                pos: v2.create(-55.5, 19),
                scale: 1,
                ori: 1,
            },
            {
                type: "loot_tier_1",
                pos: v2.create(-42, 9.5),
                scale: 1,
                ori: 0,
            },

            //
            // Greenery
            //

            {
                type: "tree_interior_01de",
                pos: v2.create(-22.5, -11),
                scale: 1.15,
                ori: 0,
            },
            {
                type: randomObstacleType({ "": 1, bush_02: 3, bush_03: 1, bush_07sp: 1 }),
                pos: v2.create(-19, -7.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: randomObstacleType({ bush_02: 1, bush_03: 1, bush_07sp: 1 }),
                pos: v2.create(-19, -14.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: randomObstacleType({ bush_02: 1, bush_03: 1, bush_07sp: 1 }),
                pos: v2.create(-26.25, -7.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(-26.25, -7.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(-19, -14.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "glass_wall_13",
                pos: v2.create(-15.5, -11),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_05",
                pos: v2.create(-27, -14),
                scale: 1,
                ori: 0,
            },

            //
            // Meeting Room
            //

            {
                type: "house_door_01",
                pos: v2.create(-40, -4),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(-48, -4),
                scale: 1,
                ori: 3,
            },
            {
                type: "refrigerator_01",
                pos: v2.create(-56.25, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: "rack_01",
                pos: v2.create(-52.5, -6.05),
                scale: 1,
                ori: 0,
            },
            {
                type: "screen_01",
                pos: v2.create(-31, -13.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "chair_01",
                pos: v2.create(-44.5, -17),
                scale: 1,
                ori: 0,
            },
            {
                type: "chair_01",
                pos: v2.create(-50, -16.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "chair_01",
                pos: v2.create(-38, -16),
                scale: 1,
                ori: 0,
            },
            {
                type: "chair_01",
                pos: v2.create(-37.25, -11),
                scale: 1,
                ori: 2,
            },
            {
                type: "chair_01",
                pos: v2.create(-42, -10.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "chair_01",
                pos: v2.create(-47, -11),
                scale: 1,
                ori: 2,
            },
            {
                type: "table_05",
                pos: v2.create(-45, -13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "chest_02",
                pos: v2.create(-32.4, -20.75),
                scale: 1,
                ori: 2,
            },
            {
                type: "bush_02",
                pos: v2.create(-55.75, -20.25),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: randomObstacleType({ bookshelf_01: 3, bookshelf_02: 1 }),
                pos: v2.create(-33.75, -5.75),
                scale: 1,
                ori: 0,
            },

            //
            // Bathrooms
            //

            {
                type: randomObstacleType({ toilet_01: 5, toilet_02: 1 }),
                pos: v2.create(35.75, 6.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_door_01",
                pos: v2.create(32, 2),
                scale: 1,
                ori: 3,
            },
            {
                type: randomObstacleType({ toilet_01: 5, toilet_02: 1 }),
                pos: v2.create(35.75, 14.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "stand_01",
                pos: v2.create(31.35, 21),
                scale: 1,
                ori: 0,
            },
            {
                type: "sink_01",
                pos: v2.create(36, 21),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(29.5, 12.5),
                scale: 1,
                ori: 0,
            },

            //
            // Supply Room
            //

            {
                type: "house_door_01",
                pos: v2.create(-11, 15),
                scale: 1,
                ori: 3,
            },
            {
                type: "rack_01",
                pos: v2.create(-13.4, 20.4),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_02",
                pos: v2.create(-5, 17.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_02",
                pos: v2.create(-7, 20.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_web_01",
                pos: v2.create(-5.1, 20.5),
                scale: 0.9,
                ori: 3,
            },

            //
            // Main Foyer
            //

            {
                type: "stairs_02",
                pos: v2.create(2, 20),
                scale: 1,
                ori: 3,
            },
            {
                type: "stairs_03",
                pos: v2.create(14.5, 20),
                scale: 1,
                ori: 3,
            },
            {
                type: "crate_03",
                pos: v2.create(0, 14.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "table_03",
                pos: v2.create(-10, -13),
                scale: 1,
                ori: 2,
            },
            {
                type: "chair_01",
                pos: v2.create(-10, -10.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "chair_01",
                pos: v2.create(-10, -15.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_02",
                pos: v2.create(-13, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-12.5, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "couch_01",
                pos: v2.create(11, -16),
                scale: 1,
                ori: 2,
            },
            {
                type: "table_03",
                pos: v2.create(8.5, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "chair_01",
                pos: v2.create(6, 1.75),
                scale: 1,
                ori: 3,
            },
            {
                type: "chair_01",
                pos: v2.create(8.75, 4),
                scale: 1,
                ori: 2,
            },
            {
                type: "table_03",
                pos: v2.create(9.5, -7),
                scale: 1,
                ori: 2,
            },
            {
                type: "crate_01",
                pos: v2.create(26.5, 20),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(21.5, 19.75),
                scale: 1,
                ori: 0,
            },

            //
            // Reception
            //

            {
                type: "house_door_01",
                pos: v2.create(22, 9),
                scale: 1,
                ori: 3,
            },
            {
                type: "bank_window_01",
                pos: v2.create(18.5, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bank_window_01",
                pos: v2.create(18.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "bank_window_01",
                pos: v2.create(18.5, -11),
                scale: 1,
                ori: 0,
            },
            {
                type: "chair_02",
                pos: v2.create(21, -3),
                scale: 1,
                ori: 1,
            },
            {
                type: "chair_01",
                pos: v2.create(21.5, -9.75),
                scale: 1,
                ori: 2,
            },
            {
                type: "rack_01",
                pos: v2.create(27.4, 4.6),
                scale: 1,
                ori: 3,
            },
            {
                type: randomObstacleType({ deposit_box_01: 7, deposit_box_02: 1 }),
                pos: v2.create(23.5, -16.25),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ deposit_box_01: 7, deposit_box_02: 1 }),
                pos: v2.create(27.75, -2),
                scale: 1,
                ori: 3,
            },

            //
            // Employee / Loading Lounge
            //

            {
                type: "house_door_01",
                pos: v2.create(29.5, -11.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(45, -13),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_door_01",
                pos: v2.create(40, 16),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_window_01",
                pos: v2.create(58.75, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(45.5, -23.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(41.5, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "table_03",
                pos: v2.create(38, -10),
                scale: 1,
                ori: 1,
            },
            {
                type: "chair_01",
                pos: v2.create(42, -10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "chair_01",
                pos: v2.create(37.5, -7.5),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ barrel_02: 1, barrel_05: 1 }),
                pos: v2.create(39, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ locker_01: 9, locker_02: 1 }),
                pos: v2.create(30.65, -18.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ locker_01: 9, locker_02: 1 }),
                pos: v2.create(33.5, -21.85),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ locker_01: 9, locker_02: 1 }),
                pos: v2.create(38.5, -21.85),
                scale: 1,
                ori: 2,
            },
            {
                type: "loot_tier_1",
                pos: v2.create(34, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "refrigerator_01",
                pos: v2.create(56.5, -15.75),
                scale: 1,
                ori: 3,
            },
            {
                type: "chest_02",
                pos: v2.create(56.35, -20),
                scale: 1,
                ori: 3,
            },
            {
                type: "table_01d",
                pos: v2.create(54, -9.85),
                scale: 1,
                ori: 0,
            },
            {
                type: "couch_01",
                pos: v2.create(53.5, -6.75),
                scale: 1,
                ori: 2,
            },
            {
                type: "rack_01",
                pos: v2.create(47.1, 0.9),
                scale: 1,
                ori: 0,
            },
            {
                type: "screen_01",
                pos: v2.create(53.5, 1.5),
                scale: 1,
                ori: 2,
            },

            //
            // Loading Bay Exterior
            //

            {
                type: "sandbags_02",
                pos: v2.create(47.5, 20),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_02",
                pos: v2.create(34.25, 28.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(33.75, 33.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(28, 29.75),
                scale: 1,
                ori: 1,
            },

            //
            // Exterior
            //

            {
                type: "decal_pipe_01",
                pos: v2.create(6, 27),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(13, 25.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(18, 25.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(-44, 30),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_06",
                pos: v2.create(-39.5, 30.5),
                scale: 1,
                ori: 1,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createReserveBasement(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(40, 30),
                    ),
                    color: 0x775529,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    // Main Room
                    collision: [
                        collider.createAabbExtents(
                            v2.create(-6.5, 1),
                            v2.create(9, 21.5),
                        ),
                        collider.createAabbExtents(
                            v2.create(10, -12.5),
                            v2.create(7.5, 8),
                        ),
                        collider.createAabbExtents(
                            v2.create(-21, -2.5),
                            v2.create(5.5, 10),
                        ),
                    ],
                },
                {
                    type: "asphalt",
                    collision: [
                        // Parking Lot Entrance
                        collider.createAabbExtents(
                            v2.create(37, 11.5),
                            v2.create(6.5, 7),
                        ),
                        // Parking Lot 1
                        collider.createAabbExtents(
                            v2.create(43.5, -8),
                            v2.create(13, 12.5),
                        ),
                        // Parking Lot 2
                        collider.createAabbExtents(
                            v2.create(24, -14.5),
                            v2.create(6.5, 6),
                        ),
                    ],
                },
                {
                    type: "brick",
                    collision: [
                        // Cellar / Lounge Entrance
                        collider.createAabbExtents(
                            v2.create(-18.5, 26.5),
                            v2.create(14, 4),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-reserve-basement-floor-02.img",
                    pos: v2.create(2, 1),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-reserve-basement-floor-01.img",
                    pos: v2.create(-21, 26.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-reserve-basement-floor-03.img",
                    pos: v2.create(-21, -2.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-reserve-basement-floor-04.img",
                    pos: v2.create(40.5, -8),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-reserve-basement-floor-05.img",
                    pos: v2.create(37, 11.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(70, 35)),
        ],
        ceiling: {
            zoomRegions: [
                // Music-required encompassing ceiling
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(60, 35),
                    ),
                },
                // Cellar Entrance
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-22, 27),
                        v2.create(17.5, 4),
                    ),
                },
                // Parking Lot Ramp
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(37, 11.5),
                        v2.create(6.5, 7),
                    ),
                },
                // Parking Lot
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(23.5, -14.5),
                        v2.create(7, 6),
                    ),
                    zoom: 36,
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(43.5, -8),
                        v2.create(13, 12.5),
                    ),
                    zoom: 36,
                },
                // Basement
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-11.75, 1),
                        v2.create(14.75, 22),
                    ),
                    zoom: 36,
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(9.75, -12.25),
                        v2.create(6.75, 8.75),
                    ),
                    zoom: 36,
                },
            ],
            vision: {
                dist: 5.5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [],
        },
        mapObjects: [
            //
            // Unbreakable Walls
            //

            {
                type: "metal_wall_ext_2",
                pos: v2.create(-14.5, 23),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_5",
                pos: v2.create(-7, 23),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_2x2",
                pos: v2.create(16.5, -9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_2x2",
                pos: v2.create(16.5, -19.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(17, -6.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(-3, 28),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(-1, 24),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-17, -19.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-36.5, 29),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_9",
                pos: v2.create(-20, -14),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_9",
                pos: v2.create(-20, 9),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_10",
                pos: v2.create(-17, 15.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_thicker_10",
                pos: v2.create(-41, 25.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_12",
                pos: v2.create(24.5, -7),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_13",
                pos: v2.create(53, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_14",
                pos: v2.create(-8.5, -22),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_14",
                pos: v2.create(45, 11.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_thicker_19",
                pos: v2.create(37, 20),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_24",
                pos: v2.create(29, 6.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_24",
                pos: v2.create(44.5, -22),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_25",
                pos: v2.create(-28, 22),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_27",
                pos: v2.create(58, -9),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_34",
                pos: v2.create(-18.5, 32),
                scale: 1,
                ori: 1,
            },

            //
            // Cellar / Lounge Entrance
            //
            {
                type: "house_door_02",
                pos: v2.create(-9.5, 23),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ barrel_03: 3, barrel_04: 1 }),
                pos: v2.create(-28.75, 30),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ barrel_03: 3, barrel_04: 1 }),
                pos: v2.create(-24.75, 30),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ barrel_03: 3, barrel_04: 1 }),
                pos: v2.create(-18.25, 30),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ barrel_03: 3, barrel_04: 1 }),
                pos: v2.create(-14.25, 30),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ barrel_02: 1, barrel_05: 1 }),
                pos: v2.create(-6.5, 28.75),
                scale: 0.9,
                ori: 1,
            },
            {
                type: randomObstacleType({ barrel_01: 1, barrel_02: 1 }),
                pos: v2.create(-6.5, 25.25),
                scale: 0.9,
                ori: 0,
                inheritOri: false,
            },

            //
            // Main Room
            //

            {
                type: "bathhouse_column_1",
                pos: v2.create(-6.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "bathhouse_column_1",
                pos: v2.create(-6.5, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: "bathhouse_column_1",
                pos: v2.create(-6.5, -14),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(1.5, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(4, -9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_05",
                pos: v2.create(6.5, -14.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(0.5, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_03",
                pos: v2.create(0.5, 0.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "power_box_01",
                pos: v2.create(-14.25, 10),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(-13.5, -18.5),
                scale: 1,
                ori: 0,
            },

            //
            // Parking Lot
            //

            {
                type: "house_door_02",
                pos: v2.create(16.5, -18.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_02",
                pos: v2.create(16.5, -10.5),
                scale: 1,
                ori: 2,
            },

            {
                type: "sandbags_01",
                pos: v2.create(47.5, -10),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(54, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(49.5, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_04",
                pos: v2.create(33.5, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(31, -18),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(49.5, -18.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(54, -18.5),
                scale: 1,
                ori: 1,
            },

            //
            // Room Structures
            //

            {
                type: "reserve_vault_01",
                pos: v2.create(-40.5, -2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_armory_01",
                pos: v2.create(11.5, 9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_security_01",
                pos: v2.create(15.5, -26.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "control_panel_07",
                pos: v2.create(18.5, -23.25),
                scale: 1,
                ori: 0,
            },

            //
            // Camera Decals
            //

            {
                type: "decal_camera_01",
                pos: v2.create(55.75, 3.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "decal_camera_01",
                pos: v2.create(19, -9.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_camera_01",
                pos: v2.create(1.75, 11),
                scale: 1,
                ori: 3,
            },
            {
                type: "decal_camera_01",
                pos: v2.create(-21.5, 29.75),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createReserveArmory(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 0),
                            v2.create(9, 14),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-reserve-sideroom-01.img",
                    pos: v2.create(0, -0.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(8.5, 13),
                    ),
                },
            ],
            vision: {
                dist: 5.5,
                width: 3.25,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [
                {
                    sprite: "map-building-reserve-sideroom-ceiling-01.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObjects: [
            // Walls
            {
                type: "metal_wall_ext_thick_5",
                pos: v2.create(-4.5, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thick_5",
                pos: v2.create(4.5, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thick_16",
                pos: v2.create(-1, 14),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thick_23",
                pos: v2.create(-8, -2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thick_28",
                pos: v2.create(8, 0),
                scale: 1,
                ori: 0,
            },

            // Objects
            {
                type: "lab_door_01",
                pos: v2.create(-2, -13),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_door_02",
                pos: v2.create(-8.5, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ locker_01: 9, locker_02: 1 }),
                pos: v2.create(-7.25, -7),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ locker_01: 9, locker_02: 1 }),
                pos: v2.create(-7.25, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ locker_01: 9, locker_02: 1 }),
                pos: v2.create(-7.25, 2),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ locker_01: 9, locker_02: 1 }),
                pos: v2.create(7.25, -1),
                scale: 1,
                ori: 3,
            },
            {
                type: randomObstacleType({ locker_01: 9, locker_02: 1 }),
                pos: v2.create(7.25, 3.5),
                scale: 1,
                ori: 3,
            },
            {
                type: randomObstacleType({ locker_01: 9, locker_02: 1 }),
                pos: v2.create(7.25, 8),
                scale: 1,
                ori: 3,
            },
            {
                type: "chest_02",
                pos: v2.create(0, 0.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "crate_06",
                pos: v2.create(0, -4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(0, 5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(5, -10),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "decal_camera_01",
                pos: v2.create(6.25, 12),
                scale: 1,
                ori: 3,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}
function createReserveSecurity(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 0.5),
                            v2.create(15, 5.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-reserve-sideroom-02.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0.5),
                        v2.create(14, 5),
                    ),
                },
            ],
            vision: {
                dist: 5.5,
                width: 3.25,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [
                {
                    sprite: "map-building-reserve-sideroom-ceiling-02.img",
                    pos: v2.create(0, 0.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObjects: [
            // Walls
            {
                type: "metal_wall_ext_2",
                pos: v2.create(13, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_16",
                pos: v2.create(-2, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_13",
                pos: v2.create(15.5, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_13",
                pos: v2.create(-15.5, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_28",
                pos: v2.create(0, -5.5),
                scale: 1,
                ori: 1,
            },

            // Objects
            {
                type: "house_door_02",
                pos: v2.create(-14, 5.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "reserve_window_01",
                pos: v2.create(9, 5.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "chair_01",
                pos: v2.create(12.5, 2.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "chair_01",
                pos: v2.create(-1.5, 1.5),
                scale: 1,
                ori: 0,
            },
            // {
            //     type: "control_panel_01",
            //     pos: v2.create(3, 3.25),
            //     scale: 1,
            //     ori: 0,
            // },
            {
                type: "control_panel_06",
                pos: v2.create(-2.5, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-11.5, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "refrigerator_01",
                pos: v2.create(8.75, -2.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "vending_01",
                pos: v2.create(12.25, -2.5),
                scale: 1,
                ori: 2,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}
function createReserveVault(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 0),
                            v2.create(14, 13),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-reserve-vault-01.img",
                    pos: v2.create(-1, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(14, 13),
                    ),
                },
            ],
            vision: {
                dist: 5.5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [
                {
                    sprite: "map-building-reserve-vault-ceiling-01.img",
                    pos: v2.create(-0.5, 0),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        puzzle: {
            name: "reserve_vault",
            completeUseType: "vault_door_reserve",
            completeOffDelay: 1,
            completeUseDelay: 4.1,
            errorResetDelay: 1,
            pieceResetDelay: 6,
            sound: {
                fail: "door_error_01",
                complete: "vault_change_01",
            },
        },
        mapObjects: [
            // Walls
            {
                type: "metal_wall_ext_thicker_32",
                pos: v2.create(-15.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_30",
                pos: v2.create(1, 14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_30",
                pos: v2.create(1, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thick_8",
                pos: v2.create(15, -9),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thick_8",
                pos: v2.create(15, 9),
                scale: 1,
                ori: 0,
            },

            // Doors
            {
                type: "vault_door_reserve",
                pos: v2.create(16, 5),
                scale: 1,
                ori: 2,
            },

            // Puzzle
            {
                type: "switch_01",
                pos: v2.create(17.5, 10),
                scale: 1,
                ori: 0,
                puzzlePiece: "3",
            },
            {
                type: "switch_01",
                pos: v2.create(20.5, 10),
                scale: 1,
                ori: 0,
                puzzlePiece: "2",
            },
            {
                type: "switch_01",
                pos: v2.create(23.5, 10),
                scale: 1,
                ori: 0,
                puzzlePiece: "5",
            },
            {
                type: "switch_01",
                pos: v2.create(17.5, -10),
                scale: 1,
                ori: 2,
                puzzlePiece: "1",
            },
            {
                type: "switch_01",
                pos: v2.create(20.5, -10),
                scale: 1,
                ori: 2,
                puzzlePiece: "2",
            },
            {
                type: "switch_01",
                pos: v2.create(23.5, -10),
                scale: 1,
                ori: 2,
                puzzlePiece: "4",
            },

            // Objects
            {
                type: randomObstacleType({ deposit_box_02: 4, deposit_box_03: 1 }),
                pos: v2.create(-14.75, 8.25),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ deposit_box_02: 4, deposit_box_03: 1 }),
                pos: v2.create(-14.75, -8.25),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ deposit_box_02: 4, deposit_box_03: 1 }),
                pos: v2.create(-10.25, -13.75),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ deposit_box_02: 4, deposit_box_03: 1 }),
                pos: v2.create(-5, -13.75),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ deposit_box_02: 4, deposit_box_03: 1 }),
                pos: v2.create(5, -13.75),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ deposit_box_02: 4, deposit_box_03: 1 }),
                pos: v2.create(10.25, -13.75),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ deposit_box_02: 4, deposit_box_03: 1 }),
                pos: v2.create(-10.25, 13.75),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ deposit_box_02: 4, deposit_box_03: 1 }),
                pos: v2.create(-5, 13.75),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ deposit_box_02: 4, deposit_box_03: 1 }),
                pos: v2.create(5, 13.75),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ deposit_box_02: 4, deposit_box_03: 1 }),
                pos: v2.create(10.25, 13.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_05",
                pos: v2.create(6.5, 6.25),
                scale: 1.1,
                ori: 0,
            },
            {
                type: "crate_05",
                pos: v2.create(1.5, 7),
                scale: 1.1,
                ori: 1,
            },
            {
                type: "crate_05",
                pos: v2.create(-7.75, -6.75),
                scale: 1.1,
                ori: 0,
            },
            {
                type: "case_07de",
                pos: v2.create(-7.25, 5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_05",
                pos: v2.create(8.5, -4.5),
                scale: 1.1,
                ori: 3,
            },
            {
                type: "crate_05",
                pos: v2.create(4, -7.5),
                scale: 1.1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "safe_01de",
                pos: v2.create(-3.75, -6.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "gun_mount_06",
                pos: v2.create(-13.25, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "toilet_05",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 1,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createStatue(overrides: DeepPartial<BuildingDef>, params: { statue?: BuildingChildObjType }): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        ori: 0,
        terrain: {},
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(-0.5, 0),
                            v2.create(3.25, 2),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-generic-floor-01.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "metal_wall_ext_short_6",
                pos: v2.create(2.2, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(-1, 2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(-1, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: params.statue,
                pos: v2.create(-1, 0),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createShilo(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, color: 0x317120, scale: 1 },
        terrain: { grass: true, beach: false },
        teamId: 2,
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, -1), v2.create(17, 15)),
        ],
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 0),
                            v2.create(15, 12),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-shilo-floor-01.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(0, -13),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(14.5, 11.5),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(14.5, 11.5),
                    ),
                },
            ],
            vision: { width: 4 },
            imgs: [
                {
                    sprite: "map-building-shilo-ceiling-01.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_12_5",
                pos: v2.create(7.75, 11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_12_5",
                pos: v2.create(-7.75, 11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_13",
                pos: v2.create(8.5, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_13",
                pos: v2.create(-8.5, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_23",
                pos: v2.create(-14.5, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_23",
                pos: v2.create(14.5, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "silo_01po",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(-2, -12),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_window_01",
                pos: v2.create(0, 11.75),
                scale: 1,
                ori: 1,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createStatueUnderground(overrides: DeepPartial<BuildingDef>, params: { crate: string }): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(6.5, 0), v2.create(4, 3)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-statue-chamber-floor-01.img",
                    pos: v2.create(3.5, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(6.5, 0),
                        v2.create(4, 3),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "",
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
            vision: { dist: 5, width: 3 },
        },
        mapObjects: [
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(-4, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(3, 3.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(3, -3.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_10",
                pos: v2.create(12, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: params.crate,
                pos: v2.create(8.5, 0),
                scale: 0.75,
                ori: 0,
                inheritOri: false,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createSavannahPatch(
    overrides: DeepPartial<BuildingDef>,
    params: {
        grass_color?: number;
        tree_large?: BuildingChildObjType;
        tree_small?: BuildingChildObjType;
    },
): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(20, 16)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(8, 15), v2.create(5, 4)),
                color: 0xc7a726,
                roughness: 0.1,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-6, -12),
                    v2.create(7, 3),
                ),
                color: 0xc7a726,
                roughness: 0.1,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(v2.create(-18, 8), v2.create(3, 4)),
                color: 0xc7a726,
                roughness: 0.1,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(v2.create(16, -8), v2.create(3, 6)),
                color: 0xc7a726,
                roughness: 0.1,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(16, 12)),
                color: params.grass_color || 0xffc600,
                roughness: 0.1,
                offsetDist: 0.5,
            },
        ],
        floor: {
            surfaces: [
                {
                    type: "grass",
                    data: { isBright: true },
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 0),
                            v2.create(16, 12),
                        ),
                    ],
                },
            ],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "crate_21",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: params.tree_large || "tree_12",
                pos: v2.create(-13, 5.5),
                scale: 1.1,
                ori: 0,
            },
            {
                type: params.tree_large || "tree_12",
                pos: v2.create(10.5, -5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: params.tree_small || "tree_01sv",
                pos: v2.create(7, 10),
                scale: 1,
                ori: 0,
            },
            {
                type: "bush_01sv",
                pos: v2.create(-8, -10),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createKopjePatch(overrides: DeepPartial<BuildingDef>, params: {
    grass_color?: number;
    tree_large?: BuildingChildObjType;
    tree_small?: BuildingChildObjType;
}): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(45, 35)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(40, 30)),
                color: params.grass_color || 0xffc600,
                roughness: 0.2,
                offsetDist: 3,
            },
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(16, 12)),
                color: 0x597312,
                roughness: 0.2,
                offsetDist: 1,
            },
        ],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "crate_21",
                pos: v2.create(-2.5, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_21",
                pos: v2.create(2.5, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(0, 5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(0, -5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 3, "": 1 }),
                pos: v2.create(-39.5, 30.5),
                scale: 0.95,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 3, "": 1 }),
                pos: v2.create(-41.5, 26),
                scale: 0.95,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 3, "": 1 }),
                pos: v2.create(39.5, -30.5),
                scale: 0.95,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_01: 3, "": 1 }),
                pos: v2.create(41.5, -26),
                scale: 0.95,
                ori: 0,
                inheritOri: false,
            },
            {
                type: params.tree_large || "tree_12",
                pos: v2.create(34, 22.5),
                scale: 1.05,
                ori: 0,
            },
            {
                type: params.tree_small || "tree_12",
                pos: v2.create(-34.5, -23),
                scale: 0.95,
                ori: 0,
            },
            {
                type: params.tree_small || "tree_12",
                pos: v2.create(22.5, -14),
                scale: 0.95,
                ori: 0,
            },
            {
                type: params.tree_small || "tree_01sv",
                pos: v2.create(21.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: params.tree_small || "tree_01sv",
                pos: v2.create(11, -15),
                scale: 1,
                ori: 0,
            },
            {
                type: params.tree_small || "tree_01sv",
                pos: v2.create(-19, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: params.tree_small || "tree_01sv",
                pos: v2.create(-10, 13),
                scale: 1,
                ori: 0,
            },
            {
                type: "stone_07",
                pos: v2.create(-20, 12),
                scale: 1,
                ori: 0,
            },
            {
                type: "stone_07",
                pos: v2.create(15.5, 10),
                scale: 1,
                ori: 1,
            },
            {
                type: "stone_07",
                pos: v2.create(-13.5, -12.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "kopje_brush_01",
                pos: v2.create(-40, -9),
                scale: 1,
                ori: 0,
            },
            {
                type: "kopje_brush_01",
                pos: v2.create(-40, 6),
                scale: 1,
                ori: 2,
            },
            {
                type: "kopje_brush_01",
                pos: v2.create(40, -9),
                scale: 1,
                ori: 0,
            },
            {
                type: "kopje_brush_01",
                pos: v2.create(40, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "kopje_brush_01",
                pos: v2.create(0, 28),
                scale: 1,
                ori: 1,
            },
            {
                type: "kopje_brush_01",
                pos: v2.create(0, -28),
                scale: 1,
                ori: 3,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createPerch(overrides: DeepPartial<BuildingDef>) {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, color: 0x1d3900, scale: 1 },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(7, 8)),
        ],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 0),
                            v2.create(4.25, 5),
                        ),
                        collider.createAabbExtents(
                            v2.create(5, 0),
                            v2.create(1.25, 2),
                        ),
                        collider.createAabbExtents(
                            v2.create(-5, 0),
                            v2.create(1.25, 2),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-perch-floor.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [],
            imgs: [
                {
                    sprite: "map-building-perch-ceiling.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
            destroy: {
                wallCount: 5,
                particleCount: 15,
                particle: "shackGreenBreak",
                residue: "map-perch-res-01.img",
            },
        },
        mapObjects: [
            {
                type: "loot_tier_1",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_2",
                pos: v2.create(3.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_2",
                pos: v2.create(-3.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_2",
                pos: v2.create(3.5, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_2",
                pos: v2.create(-3.5, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_2_5",
                pos: v2.create(2.75, -4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_2_5",
                pos: v2.create(-2.75, -4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_2_5",
                pos: v2.create(2.75, 4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_2_5",
                pos: v2.create(-2.75, 4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_broken_01",
                pos: v2.create(0, 4.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_broken_01",
                pos: v2.create(0, -4.75),
                scale: 1,
                ori: 1,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createTeaPavilion(overrides: DeepPartial<BuildingDef>, params: {
    left_loot?: BuildingChildObjType;
    right_loot?: BuildingChildObjType;
    center_loot?: BuildingChildObjType;
}): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(9, 9),
                    ),
                    color: 0xa11210,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(3.5, 3.5),
                    ),
                    color: 0xff3e3b,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, -10.15),
                        v2.create(2, 1.5),
                    ),
                    color: 0x70390b,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(11, 11)),
            collider.createAabbExtents(v2.create(0, -20), v2.create(4, 12)),
        ],
        ori: 0,
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(9, 9)),
                        collider.createAabbExtents(
                            v2.create(0, -10.15),
                            v2.create(2, 1.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-pavilion-floor-01.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-teahouse-floor-02.img",
                    pos: v2.create(0, -10.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(v2.create(0, 0), v2.create(7, 7)),
                    zoomOut: collider.createAabbExtents(v2.create(0, 0), v2.create(9, 9)),
                },
            ],
            vision: { width: 4 },
            imgs: [
                {
                    sprite: "map-building-pavilion-ceiling-01.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
            destroy: {
                wallCount: 3,
                particle: "teapavilionBreak",
                particleCount: 15,
                residue: "map-building-pavilion-res-01.img",
            },
        },
        mapObjects: [
            {
                type: "teahouse_wall_int_12",
                pos: v2.create(0, 6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "teahouse_wall_int_13",
                pos: v2.create(6.5, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "teahouse_wall_int_13",
                pos: v2.create(-6.5, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "teahouse_wall_int_5",
                pos: v2.create(-4.5, -6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "teahouse_wall_int_5",
                pos: v2.create(4.5, -6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "teahouse_door_01",
                pos: v2.create(-2, -6.5),
                scale: 1,
                ori: 3,
            },
            {
                type: params.left_loot || "pot_03",
                pos: v2.create(4.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: params.right_loot || "pot_03",
                pos: v2.create(-4.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: params.center_loot || "loot_tier_airdrop_armor",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createWorkshop(
    overrides: DeepPartial<BuildingDef>,
    params: {
        floor_loot?: BuildingChildObjType;
        left_loot?: BuildingChildObjType;
    },
): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    // main room
                    collider: collider.createAabbExtents(
                        v2.create(8, 0),
                        v2.create(16.5, 20.5),
                    ),
                    color: 0x11402b,
                },
                {
                    // entrance 1
                    collider: collider.createAabbExtents(
                        v2.create(8.5, 23.5),
                        v2.create(12, 3),
                    ),
                    color: 0x999999,
                },
                {
                    // entrance 2
                    collider: collider.createAabbExtents(
                        v2.create(8.5, -23.5),
                        v2.create(12, 3),
                    ),
                    color: 0x999999,
                },
                {
                    // secondary room
                    collider: collider.createAabbExtents(
                        v2.create(-17, 4.5),
                        v2.create(8.5, 16),
                    ),
                    color: 0x523927,
                },
            ],
        },
        zIdx: 1,
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(2, 0), v2.create(32.5, 32.5)),
        ],
        floor: {
            surfaces: [
                {
                    type: "warehouse",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(8, 0),
                            v2.create(15.5, 20.5),
                        ),
                    ],
                },
                {
                    type: "warehouse",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(8.5, 23.5),
                            v2.create(12, 3),
                        ),
                    ],
                },
                {
                    type: "warehouse",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(8.5, -23.5),
                            v2.create(12, 3),
                        ),
                    ],
                },
                {
                    type: "house",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(-16, 4.5),
                            v2.create(8.5, 15),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-workshop-floor-01.img",
                    pos: v2.create(8, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-workshop-floor-02.img",
                    pos: v2.create(-17, 4.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(8, 0),
                        v2.create(16, 20),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(8, 0),
                        v2.create(11.5, 26.5),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-16.5, 4.5),
                        v2.create(8.5, 15.5),
                    ),
                },
            ],
            vision: { dist: 8, width: 5 },
            imgs: [
                {
                    sprite: "map-building-workshop-ceiling-02.img",
                    pos: v2.create(-16.5, 4.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-workshop-ceiling-01.img",
                    pos: v2.create(8, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObjects: [
            {
                type: "workshop_wall_right",
                pos: v2.create(24, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "workshop_wall_edge",
                pos: v2.create(20.5, -20),
                scale: 1,
                ori: 0,
            },
            {
                type: "workshop_wall_edge",
                pos: v2.create(-4.5, -20),
                scale: 1,
                ori: 0,
            },
            {
                type: "workshop_wall_edge",
                pos: v2.create(20.5, 20),
                scale: 1,
                ori: 0,
            },
            {
                type: "workshop_wall_edge",
                pos: v2.create(-4.5, 20),
                scale: 1,
                ori: 0,
            },
            {
                type: "workshop_wall_mid_1",
                pos: v2.create(-8, -12.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "workshop_wall_mid_2",
                pos: v2.create(-8, 6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "workshop_wall_mid_3",
                pos: v2.create(-8, 18.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "workshop_wall_bot",
                pos: v2.create(-16.75, -11),
                scale: 1,
                ori: 0,
            },
            {
                type: "workshop_wall_room_1",
                pos: v2.create(-12.25, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "workshop_wall_room_2",
                pos: v2.create(-22.75, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "workshop_wall_room_3",
                pos: v2.create(-21, 20),
                scale: 1,
                ori: 0,
            },
            {
                type: "workshop_wall_room_4",
                pos: v2.create(-10.75, 20),
                scale: 1,
                ori: 0,
            },
            {
                type: "workshop_wall_left",
                pos: v2.create(-25, 4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(-8, -5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(-16.5, 9),
                scale: 1,
                ori: 1,
            },
            {
                type: "club_window_01",
                pos: v2.create(-7.75, 16),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-15, 20.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(-5.25, -11),
                scale: 1,
                ori: 0,
            },
            {
                type: "bed_sm_01",
                pos: v2.create(-20.5, 17.75),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ bookshelf_01: 6, bookshelf_02: 1 }),
                pos: v2.create(-12.5, 11),
                scale: 1,
                ori: 0,
            },
            {
                type: "chest_02",
                pos: v2.create(13, 0.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "couch_01",
                pos: v2.create(-10.5, 3.5),
                scale: 1,
                ori: 3,
            },

            {
                type: "crate_01",
                pos: v2.create(21, -11.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(-4.75, -15.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_03",
                pos: v2.create(-5.5, 1.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_04",
                pos: v2.create(20.5, 16.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(13, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_06",
                pos: v2.create(8, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_19",
                pos: v2.create(19.25, -16.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "decal_web_01",
                pos: v2.create(-5.25, -17.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "fire_ext_01",
                pos: v2.create(-9, -8.25),
                scale: 1,
                ori: 2,
            },
            {
                type: "gun_mount_07",
                pos: v2.create(-23.75, 12),
                scale: 1,
                ori: 1,
            },
            {
                type: params.floor_loot || "",
                pos: v2.create(2, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: params.left_loot || "",
                pos: v2.create(-17, -5),
                scale: 1,
                ori: 0,
            },
            {
                type: "oven_01",
                pos: v2.create(-23, -4.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "refrigerator_01",
                pos: v2.create(-23, -8.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "safe_01",
                pos: v2.create(-12, 17.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "screen_01",
                pos: v2.create(-23.5, 3.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "table_01",
                pos: v2.create(-14.5, 2.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "table_04",
                pos: v2.create(20.5, 8.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "woodpile_01",
                pos: v2.create(13, -4),
                scale: 1,
                ori: 1,
            },
            {
                type: "woodpile_02",
                pos: v2.create(8, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "woodpile_03",
                pos: v2.create(-5.25, 7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "woodpile_03",
                pos: v2.create(-1.5, 5.5),
                scale: 1,
                ori: 1,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

function createWorkshopComplex(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(2, 0), v2.create(35, 35)),
        ],
        // mapGroundPatches: [],
        floor: {
            surfaces: [],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: overrides.type || "workshop_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "outhouse_01",
                pos: v2.create(-16, -20),
                scale: 1,
                ori: 0,
            },
            {
                type: "container_02",
                pos: v2.create(28.5, 5),
                scale: 1,
                ori: 2,
            },
            {
                type: "barrel_01",
                pos: v2.create(22, -23),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_02",
                pos: v2.create(-23, -15.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "woodpile_03",
                pos: v2.create(-23, -22),
                scale: 1,
                ori: 1,
            },
            {
                type: "woodpile_03",
                pos: v2.create(26.75, -10.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "woodpile_03",
                pos: v2.create(30.5, -7.75),
                scale: 1,
                ori: 1,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

export const ModeBuildingDefs: Record<string, BuildingDef> = {
    // Beach

    hut_01bh: createHut({}, {
        specialLoot: randomObstacleType({ pot_01: 1, barrel_05: 2, "": 1 }),
    }),

    hut_04: createLargeHut({}),

    mansion_03: createMansion({}, {
        tree: "tree_interior_01bh",
        tree_scale: 0.9,
        porch_01: "bush_03",
        bush: "bush_03",
    }),

    mansion_cellar_03: createMansionCellar({}, {
        mid_obs_01: "barrel_05",
    }),

    // Cobalt

    teahouse_complex_01cb: createTeaHouseComplex({}, {
        grass_color: 0x414c58,
        tea_house: "teahouse_01",
        tree_small: "tree_01cb",
        tree_large: "tree_01cb",
    }),

    // Desert
    archway_01: {
        type: "building",
        map: { display: true, color: 0x773b1a, scale: 1 },
        terrain: { grass: true, beach: false },
        floor: {
            surfaces: [
                {
                    type: "grass",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(10, 1)),
                    ],
                },
            ],
            imgs: [],
        },
        ceiling: {
            zoomRegions: [],
            collision: [collider.createAabbExtents(v2.create(0, 0), v2.create(10.5, 2))],
            imgs: [
                {
                    sprite: "map-building-archway-ceiling-01.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
            destroy: {
                wallCount: 1,
                particle: "archwayBreak",
                particleCount: 15,
                residue: "map-archway-res-01.img",
            },
        },
        mapObjects: [
            {
                type: "archway_column_1",
                pos: v2.create(-10, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "archway_column_1",
                pos: v2.create(10, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_1",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bank_01b: createBank({}, { vault: "vault_01b" }),
    vault_01b: createBankVault({}, {
        gold_box: 9,
        floor_loot: "loot_tier_stonehammer",
    }),
    barn_basement_floor_01d: createBarnBasement({
        basement: "barn_basement_floor_02d",
    }),
    barn_basement_floor_02d: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(0, 0)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-barn-basement-floor-02.img",
                    pos: v2.create(-2, -0.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-1, -1),
                        v2.create(5, 6),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-building-barn-basement-ceiling-02.img",
                    pos: v2.create(-1.4, 0),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
            ],
        },
        mapObjects: [
            {
                type: "chest_04d",
                pos: v2.create(-1, -0.5),
                scale: 1,
                ori: 1,
            },
        ],
    },
    barn_02d: createBarn({
        map: { displayType: "barn_01" },
    }, {
        bonus_room: "barn_basement_structure_01d",
        bonus_door: "",
    }),
    desert_town_01: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(65, 102)),
            collider.createAabbExtents(v2.create(0, 0), v2.create(20, 120)),
            collider.createAabbExtents(v2.create(-60, 40), v2.create(10, 5)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(60, 95)),
                color: 0xc3842a,
                roughness: 0.1,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(10, 96)),
                color: 0x8f611f,
                roughness: 0.1,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(-33, 40), v2.create(27, 5)),
                color: 0x8f611f,
                roughness: 0.1,
                offsetDist: 1,
            },
        ],
        floor: {
            surfaces: [
                {
                    type: "grass",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(55, 25)),
                    ],
                },
            ],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "archway_01",
                pos: v2.create(0, 95),
                scale: 1,
                ori: 0,
            },
            {
                type: "archway_01",
                pos: v2.create(0, -95),
                scale: 1,
                ori: 0,
            },
            {
                type: "police_01",
                pos: v2.create(40, -50),
                scale: 1,
                ori: 3,
            },
            {
                type: "cabin_01",
                pos: v2.create(37, 20),
                scale: 1,
                ori: 3,
            },
            {
                type: "cabin_01",
                pos: v2.create(35, 70),
                scale: 1,
                ori: 3,
            },
            {
                type: "barn_01",
                pos: v2.create(-34, -60),
                scale: 1,
                ori: 3,
            },
            {
                type: "bank_01b",
                pos: v2.create(-35, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "saloon_structure_01",
                pos: v2.create(-35, 70),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(5, 76),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-6.75, 71),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(-6.75, 67),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(-50, 42),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-4, 44),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-1.5, 46.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_18",
                pos: v2.create(0.25, 42),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(-21, 31.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(-15, 31.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(13, 34),
                scale: 1,
                ori: 1,
            },
            {
                type: "sandbags_02",
                pos: v2.create(7, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(-7.25, -12.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(-7.25, -22),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_18",
                pos: v2.create(2.5, -56.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(-1.5, -59),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(1.5, -61),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(-5.5, -74),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(7.5, -82),
                scale: 1,
                ori: 0,
            },
        ],
    },
    desert_town_02: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, -3), v2.create(82, 60)),
            collider.createAabbExtents(v2.create(0, 0), v2.create(85, 15)),
            collider.createAabbExtents(v2.create(-7, -51), v2.create(68, 38)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(0, -3), v2.create(80, 55)),
                color: 0xc3842a,
                roughness: 0.075,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(81, 10)),
                color: 0x8f611f,
                roughness: 0.025,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(-7, -25), v2.create(7.5, 25)),
                color: 0x8f611f,
                roughness: 0.05,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(13, 25), v2.create(7.5, 27)),
                color: 0x8f611f,
                roughness: 0.05,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(67, -30), v2.create(5, 29)),
                color: 0x8f611f,
                roughness: 0.05,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(-51, -18), v2.create(14.5, 6.5)),
                color: 0x51321e,
                roughness: 0,
                offsetDist: 1,
                useAsMapShape: false,
            },
            {
                bound: collider.createAabbExtents(v2.create(-51, -18), v2.create(13.75, 5.75)),
                color: 0x7ba865,
                roughness: 0,
                offsetDist: 1,
            },
        ],
        floor: {
            surfaces: [
                {
                    type: "grass",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(0, 0)),
                    ],
                },
            ],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            // Large Structures
            {
                type: "archway_01",
                pos: v2.create(80, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "archway_01",
                pos: v2.create(-80, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "archway_01",
                pos: v2.create(13, 52),
                scale: 1,
                ori: 0,
            },
            {
                type: "reserve_structure_01",
                pos: v2.create(-7, -50),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ house_red_01: 1, house_red_02: 1, cabin_01: 1 }),
                pos: v2.create(-55, 29),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ house_red_01: 1, house_red_02: 1 }),
                pos: v2.create(-15, 33),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_01",
                pos: v2.create(50, 29),
                scale: 1,
                ori: 2,
            },

            // Reserve Accessories
            {
                type: "outhouse_01",
                pos: v2.create(60.5, -43),
                scale: 1,
                ori: 1,
            },
            {
                type: "outhouse_01",
                pos: v2.create(59, -53),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-60, -17),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-51, -18.75),
                scale: 1.1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_13: 1, tree_14: 1 }),
                pos: v2.create(-42, -17.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_05",
                pos: v2.create(-56, -21),
                scale: 1,
                ori: 0,
            },
            {
                type: "bush_03",
                pos: v2.create(-47, -15),
                scale: 1,
                ori: 0,
            },

            // Misc. Objects
            {
                type: "barrel_01",
                pos: v2.create(73, -26),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(73, -22),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(-32, 10),
                scale: 1,
                ori: 2,
            },
            {
                type: "barrel_01",
                pos: v2.create(-25.5, 10),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(50, -7),
                scale: 1,
                ori: 1,
            },
            {
                type: "sandbags_02",
                pos: v2.create(63, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(67.5, 8),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(3, 13),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(17.5, 38),
                scale: 1,
                ori: 1,
            },
            {
                type: "sandbags_02",
                pos: v2.create(-71, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "sandbags_02",
                pos: v2.create(-60, 7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-60, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_18",
                pos: v2.create(13.5, 1.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(9, -1),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(12.5, -3),
                scale: 0.9,
                ori: 0,
            },
        ],
    },
    oasis_01: createOasis({}),
    river_town_02: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        oris: [0, 1],
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(61, -3), v2.create(24, 21)),
            collider.createAabbExtents(v2.create(46, -36), v2.create(6, 14)),
            collider.createAabbExtents(v2.create(-68, 0), v2.create(27, 8)),
            collider.createAabbExtents(v2.create(0, 0), v2.create(14, 14)),
            collider.createAabbExtents(v2.create(-80, 32), v2.create(4, 4)),
            collider.createAabbExtents(v2.create(-16, 13), v2.create(5, 2.5)),
            collider.createAabbExtents(v2.create(16, -13), v2.create(5, 2.5)),
            collider.createAabbExtents(v2.create(-76.5, 19.5), v2.create(2.5, 2.5)),
            collider.createAabbExtents(v2.create(-62, -18), v2.create(2.5, 2.5)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(-5, 0), v2.create(70, 6)),
                color: 0x924514,
                roughness: 0.05,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(-71, 10), v2.create(2, 9)),
                color: 0x924514,
                roughness: 0.05,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(-76, 19), v2.create(10.5, 8)),
                color: 0x924514,
                roughness: 0.1,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(-57, -10), v2.create(2, 9)),
                color: 0x924514,
                roughness: 0.05,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-63, -19),
                    v2.create(11.5, 8.5),
                ),
                color: 0x924514,
                roughness: 0.1,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(14, 10)),
                color: 0x804018,
                roughness: 0.3,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(9, 22)),
                color: 0x804018,
                roughness: 0.3,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(4, 33)),
                color: 0x804018,
                roughness: 0.3,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(61, -3), v2.create(22, 19)),
                color: 0x3a3a3a,
                roughness: 0.15,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(45, -34),
                    v2.create(5.75, 14),
                ),
                color: 0x3a3a3a,
                roughness: 0.15,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(69, -10), v2.create(4, 3.75)),
                color: 0xdfa757,
                roughness: 0.2,
                offsetDist: 1,
            },
        ],
        floor: {
            surfaces: [
                {
                    type: "grass",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(0, 0)),
                    ],
                },
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(v2.create(61, -3), v2.create(22, 19)),
                        collider.createAabbExtents(
                            v2.create(45, -34),
                            v2.create(5.75, 14),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-complex-warehouse-floor-05.img",
                    pos: v2.create(81, 10),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "stone_06",
                pos: v2.create(-16, 13),
                scale: 1,
                ori: 0,
                inheritOri: true,
            },
            {
                type: "stone_06",
                pos: v2.create(16, -13),
                scale: 1,
                ori: 0,
                inheritOri: true,
            },
            {
                type: "sandbags_02",
                pos: v2.create(-68, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_02: 1, crate_01: 4 }),
                pos: v2.create(-85, 1),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_02: 1, crate_01: 4 }),
                pos: v2.create(-90, -1),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "statue_structure_03",
                pos: v2.create(-50, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-80, 32),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_02: 1, crate_01: 4 }),
                pos: v2.create(-76.5, 19.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_02: 1, crate_01: 4 }),
                pos: v2.create(-62, -18),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "statue_structure_04",
                pos: v2.create(50, 0),
                scale: 1,
                ori: 2,
            },
            {
                type: "tree_06",
                pos: v2.create(69, -10),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(74.5, -0.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(79.5, 0.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                }),
                pos: v2.create(45, -36),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_05c",
                pos: v2.create(0, 2),
                scale: 2,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "case_05",
                pos: v2.create(0, -2),
                scale: 1,
                ori: 0,
                inheritOri: true,
            },
        ],
    },
    reserve_01: createReserve({}),
    reserve_basement_01: createReserveBasement({}),
    reserve_armory_01: createReserveArmory({}),
    reserve_security_01: createReserveSecurity({}),
    reserve_vault_01: createReserveVault({}),
    saloon_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(20.5, 20.5),
                    ),
                    color: 0x50240e,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-1, 1),
                        v2.create(19, 19),
                    ),
                    color: 0x422e2a,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-3, 3),
                        v2.create(17, 17),
                    ),
                    color: 0x262220,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-23.5, 1),
                        v2.create(3, 2),
                    ),
                    color: 0x352f2b,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(22.5, 22.5)),
        ],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "house",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 0),
                            v2.create(20.5, 20.5),
                        ),
                        collider.createAabbExtents(v2.create(-23.5, 1), v2.create(3, 2)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-saloon-floor-01.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-saloon-ceiling-02.img",
                    pos: v2.create(-23.5, 1),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-1, 1),
                        v2.create(19, 19),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(1, -1),
                        v2.create(21.5, 21.5),
                    ),
                },
            ],
            vision: {
                dist: 5.5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            damage: { obstacleCount: 1 },
            imgs: [
                {
                    sprite: "map-building-saloon-ceiling-01.img",
                    pos: v2.create(0, 0),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-saloon-ceiling-02.img",
                    pos: v2.create(-23.5, 1),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-chimney-01.img",
                    pos: v2.create(-3, 3),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    removeOnDamaged: true,
                },
            ],
        },
        occupiedEmitters: [
            {
                type: "cabin_smoke_parent",
                pos: v2.create(0, 0),
                rot: 0,
                scale: 1,
                layer: 0,
                parentToCeiling: true,
            },
        ],
        puzzle: {
            name: "saloon",
            completeUseType: "saloon_door_secret",
            completeOffDelay: 1,
            completeUseDelay: 2,
            errorResetDelay: 1,
            pieceResetDelay: 10,
            sound: {
                fail: "door_error_01",
                complete: "piano_02",
            },
        },
        mapObjects: [
            {
                type: "wood_perm_wall_ext_17",
                pos: v2.create(-20, 11),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_5",
                pos: v2.create(-23, 3),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_5",
                pos: v2.create(-26, 1),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_5",
                pos: v2.create(-22, 1),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_5",
                pos: v2.create(-23, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_14",
                pos: v2.create(-20, -7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_35",
                pos: v2.create(-3, 20),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_6",
                pos: v2.create(-16.5, -14),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(-12, -14.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_7",
                pos: v2.create(-7, -14),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(-2, -14.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_7",
                pos: v2.create(3, -14),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_6",
                pos: v2.create(14, 16.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(14.25, 12),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_7",
                pos: v2.create(14, 7),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(14.25, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_7",
                pos: v2.create(14, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "saloon_bar_back_large",
                pos: v2.create(-18.75, 7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "saloon_door_secret",
                pos: v2.create(-18.75, 2.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "saloon_bar_back_small",
                pos: v2.create(-18.75, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "bottle_01",
                pos: v2.create(-18.75, 11.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-18.75, 10),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-18.75, 9),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-18.75, 6),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-18.75, 5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-18.75, 3.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_02v",
                pos: v2.create(-18.75, -1.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
                puzzlePiece: "violet",
            },
            {
                type: "saloon_bar_large",
                pos: v2.create(-11, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "saloon_bar_small",
                pos: v2.create(-14.5, -4),
                scale: 1,
                ori: 1,
            },
            {
                type: "bottle_01",
                pos: v2.create(-10.75, 11),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_02r",
                pos: v2.create(-11, 8),
                scale: 1,
                ori: 0,
                inheritOri: false,
                puzzlePiece: "red",
            },
            {
                type: "bottle_01",
                pos: v2.create(-11, 6.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-10.75, 5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-11, 1.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-10.75, -1),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_02b",
                pos: v2.create(-11, -2.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
                puzzlePiece: "blue",
            },
            {
                type: "bottle_01",
                pos: v2.create(-13, -4),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-15, -4.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bottle_01",
                pos: v2.create(-16.5, -4),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_02",
                pos: v2.create(-17.5, 17.5),
                scale: 1,
                ori: 0,
                puzzlePiece: "barrel",
            },
            {
                type: "piano_01",
                pos: v2.create(-18, -9.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "loot_tier_1",
                pos: v2.create(-16, -9.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    gun_mount_01: 100,
                    gun_mount_02: 10,
                }),
                pos: v2.create(-0.5, 18.75),
                scale: 1,
                ori: 0,
                puzzlePiece: "gun",
            },
            {
                type: "barrel_02",
                pos: v2.create(-3, -7),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_02",
                pos: v2.create(-0.5, -4.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "stove_02",
                pos: v2.create(-3, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "bottle_02g",
                pos: v2.create(7.25, 10.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
                puzzlePiece: "green",
            },
            {
                type: "table_03",
                pos: v2.create(7.25, 10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "table_03",
                pos: v2.create(7.25, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bottle_02i",
                pos: v2.create(12.5, 4.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
                puzzlePiece: "indigo",
            },
            {
                type: "crate_01",
                pos: v2.create(11, 17),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "bottle_02y",
                pos: v2.create(8, 18.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
                puzzlePiece: "yellow",
            },
            {
                type: "crate_01",
                pos: v2.create(-23, 11.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "bush_01",
                pos: v2.create(-23.5, 7),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-23, -5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "saloon_column_1",
                pos: v2.create(-19.5, -17.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_02",
                pos: v2.create(-10, -16.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "bottle_02o",
                pos: v2.create(3.75, -17.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
                puzzlePiece: "orange",
            },
            {
                type: "saloon_column_1",
                pos: v2.create(5.5, -17.5),
                scale: 1,
                ori: 0,
                puzzlePiece: "column",
            },
            {
                type: "saloon_column_1",
                pos: v2.create(17.5, 19.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_02",
                pos: v2.create(16.5, 9),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "saloon_column_1",
                pos: v2.create(17.5, -5.5),
                scale: 1,
                ori: 0,
            },
        ],
    },
    saloon_cellar_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "brick",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(15, 9)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-saloon-cellar-01.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(v2.create(0, 0), v2.create(15, 9)),
                },
            ],
            imgs: [
                {
                    sprite: "",
                    pos: v2.create(-2, 3.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
            vision: { dist: 7, width: 3 },
        },
        mapObjects: [
            {
                type: "wood_perm_wall_ext_thicker_18",
                pos: v2.create(-8, 10),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_5",
                pos: v2.create(1.5, 7),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_thicker_12",
                pos: v2.create(-4.5, 4),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_thicker_13",
                pos: v2.create(-16, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_thicker_8",
                pos: v2.create(-13.5, -6),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_thicker_7",
                pos: v2.create(-8, -8),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_thicker_13",
                pos: v2.create(0, -10),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_thicker_7",
                pos: v2.create(8, -8),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_thicker_8",
                pos: v2.create(13.5, -6),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_thicker_13",
                pos: v2.create(16, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_thicker_10",
                pos: v2.create(12.5, 10),
                scale: 1,
                ori: 1,
            },
            {
                type: "wood_perm_wall_ext_thicker_6",
                pos: v2.create(9, 5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "wood_perm_wall_ext_thicker_21",
                pos: v2.create(0, 1),
                scale: 1,
                ori: 1,
            },
            {
                type: "loot_tier_saloon",
                pos: v2.create(0, -4),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_04",
                pos: v2.create(-3, -8.03),
                scale: 1,
                ori: 2,
            },
            {
                type: "barrel_04",
                pos: v2.create(0, -8.03),
                scale: 1,
                ori: 2,
            },
            {
                type: "barrel_04",
                pos: v2.create(3, -8.03),
                scale: 1,
                ori: 2,
            },
            {
                type: "recorder_04",
                pos: v2.create(12.5, 6.5),
                scale: 1,
                ori: 0,
            },
        ],
    },
    statue_building_04: createStatue({}, { statue: "statue_04" }),
    statue_underground_04: createStatueUnderground({}, { crate: "crate_22d" }),
    statue_building_03: createStatue({}, { statue: "statue_03" }),
    statue_underground_03: createStatueUnderground({}, { crate: "crate_02d" }),

    // Faction

    river_town_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(70.75, 0.5),
                        v2.create(30, 54.5),
                    ),
                    color: 0x3a3a3a,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(77.5, 64),
                        v2.create(23, 10),
                    ),
                    color: 0x3a3a3a,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(111, -29.5),
                        v2.create(10.5, 24.5),
                    ),
                    color: 0x3a3a3a,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(50, 0),
                        v2.create(4.4, 4.4),
                    ),
                    color: 0x575757,
                },
            ],
        },
        terrain: {
            bridge: { nearbyWidthMult: 1 },
            spawnPriority: 100,
        },
        bridgeLandBounds: [
            collider.createAabbExtents(v2.create(-41, 0), v2.create(6, 10)),
            collider.createAabbExtents(v2.create(41, 0), v2.create(6, 10)),
            collider.createAabbExtents(v2.create(81, 0), v2.create(40, 54)),
            collider.createAabbExtents(v2.create(78, 64), v2.create(23, 10)),
            collider.createAabbExtents(v2.create(-76, -22), v2.create(36, 24)),
            collider.createAabbExtents(v2.create(-72, 22), v2.create(27, 25)),
        ],
        bridgeWaterBounds: [collider.createAabbExtents(v2.create(0, 0), v2.create(5, 5))],
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(71, 0), v2.create(31, 56)),
            collider.createAabbExtents(v2.create(77, 65), v2.create(24, 10)),
            collider.createAabbExtents(v2.create(112, -30), v2.create(10, 26)),
            collider.createAabbExtents(v2.create(106, 19.5), v2.create(8, 7.25)),
            collider.createAabbExtents(v2.create(-71, 32), v2.create(27, 15)),
            collider.createAabbExtents(v2.create(-71, 16), v2.create(8, 6)),
            collider.createAabbExtents(v2.create(-75, -34), v2.create(40, 19)),
            collider.createAabbExtents(v2.create(-57, -10), v2.create(5, 11)),
            collider.createAabbExtents(v2.create(-86, -10), v2.create(5, 11)),
            collider.createAabbExtents(v2.create(-21, 0), v2.create(100, 8)),
            collider.createAabbExtents(v2.create(-109, 30), v2.create(7, 7.25)),
            collider.createAabbExtents(v2.create(0, 0), v2.create(40, 15)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(-20, 0), v2.create(100, 6)),
                color: 0x653313,
                roughness: 0.05,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(-71, 10), v2.create(2, 9)),
                color: 0x653313,
                roughness: 0,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(-57, -10), v2.create(2, 9)),
                color: 0x653313,
                roughness: 0,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-109, 30),
                    v2.create(6, 6.25),
                ),
                color: 0x324319,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(v2.create(-86, -10), v2.create(2, 9)),
                color: 0x653313,
                roughness: 0,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(106, 19.5),
                    v2.create(7, 6.25),
                ),
                color: 0x324319,
                roughness: 0.05,
                offsetDist: 0.5,
            },
        ],
        floor: {
            surfaces: [
                {
                    type: "grass",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(0, 0)),
                    ],
                },
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(70.75, 0.5),
                            v2.create(30, 54.5),
                        ),
                        collider.createAabbExtents(
                            v2.create(77.5, 64),
                            v2.create(23, 10),
                        ),
                        collider.createAabbExtents(
                            v2.create(111, -29.5),
                            v2.create(10.5, 24.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-complex-warehouse-floor-04.img",
                    pos: v2.create(81, 10),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "bridge_xlg_structure_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_01",
                pos: v2.create(-71, 30),
                scale: 1,
                ori: 2,
            },
            {
                type: "house_red_01",
                pos: v2.create(-56, -30),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_red_02",
                pos: v2.create(-96, -30),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(-68, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_02: 1, crate_01: 3 }),
                pos: v2.create(-85, 1),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ crate_02: 1, crate_01: 3 }),
                pos: v2.create(-90, -1),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_02f",
                pos: v2.create(-106.5, 32.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(-111.25, 32.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-108, 27.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "statue_structure_01",
                pos: v2.create(-50, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                }),
                pos: v2.create(45, 36),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                }),
                pos: v2.create(51, 36),
                scale: 1,
                ori: 2,
            },
            {
                type: "shack_02",
                pos: v2.create(47, 20),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_02",
                pos: v2.create(78, 40),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                }),
                pos: v2.create(95, 44),
                scale: 1,
                ori: 0,
            },
            {
                type: "statue_structure_02",
                pos: v2.create(50, 0),
                scale: 1,
                ori: 2,
            },
            {
                type: "crate_01",
                pos: v2.create(74.5, -0.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(79.5, 0.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(106, 22),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(104.5, 17.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_22",
                pos: v2.create(109.25, 17.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                }),
                pos: v2.create(85, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                }),
                pos: v2.create(45, -36),
                scale: 1,
                ori: 0,
            },
            {
                type: "shack_02",
                pos: v2.create(47, -20),
                scale: 1,
                ori: 2,
            },
            {
                type: "warehouse_02",
                pos: v2.create(86, -30),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                }),
                pos: v2.create(72, -47),
                scale: 1,
                ori: 1,
            },
        ],
    },
    statue_structure_01: {
        type: "building",
        ori: 0,
        terrain: {},
        floor: {
            surfaces: [],
            imgs: [
                {
                    sprite: "",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "statue_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "statue_top_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    statue_structure_02: {
        type: "building",
        ori: 0,
        terrain: {},
        floor: {
            surfaces: [],
            imgs: [
                {
                    sprite: "",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "statue_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "statue_top_02",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    warehouse_01f: createWarehouse({}, {
        topLeftObs: "crate_01",
        topRightObs: "crate_01",
        botRightObs: "crate_01",
        ignoreMapSpawnReplacement: false,
    }),
    // Halloween

    barn_01h: createBarn({}, {
        porch_01: "cache_pumpkin_02",
        bonus_door: "house_door_02",
    }),
    warehouse_01h: createWarehouse({}, {
        topLeftObs: "crate_01",
        topRightObs: "crate_01",
        botRightObs: "crate_01",
        decoration_01: "candle_lit_01",
        ignoreMapSpawnReplacement: true,
    }),
    junkyard_01: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        ori: 0,
        mapObstacleBounds: [collider.createCircle(v2.create(0, 0), 37)],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(-8.5, 24), v2.create(13, 9)),
                color: 0x121401,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(26.75, 8.5),
                    v2.create(8, 5.5),
                ),
                color: 0x121401,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(23.75, -15.5),
                    v2.create(7, 5.5),
                ),
                color: 0x121401,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-23.5, -3),
                    v2.create(4.75, 3.5),
                ),
                color: 0x121401,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-3.5, -19.5),
                    v2.create(4, 6.5),
                ),
                color: 0x121401,
            },
        ],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "tree_05b",
                pos: v2.create(0, 0),
                scale: 1.5,
                ori: 0,
            },
            {
                type: "candle_lit_01",
                pos: v2.create(-9, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "candle_lit_01",
                pos: v2.create(9, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "candle_lit_01",
                pos: v2.create(-6.5, -7),
                scale: 1,
                ori: 0,
            },
            {
                type: "candle_lit_01",
                pos: v2.create(6.5, -7),
                scale: 1,
                ori: 0,
            },
            {
                type: "candle_lit_01",
                pos: v2.create(0, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-2.5, 29.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-6.5, 29),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-10.5, 29.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-14.5, 30),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(1.5, 23.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-2.5, 24.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-6.5, 24),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-10.5, 24),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-14.5, 23.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-18.5, 24.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-2.5, 18.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-6.5, 18),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-10.5, 18.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ refrigerator_01: 3, "": 1 }),
                pos: v2.create(-14.5, 19),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, table_01: 3 }),
                pos: v2.create(22.5, 6),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, table_01: 3 }),
                pos: v2.create(29, 6),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, table_01: 3 }),
                pos: v2.create(24.5, 11),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, table_01: 3 }),
                pos: v2.create(31, 11),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ oven_01: 3, "": 1 }),
                pos: v2.create(20, -13),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ oven_01: 3, "": 1 }),
                pos: v2.create(24, -12.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ oven_01: 3, "": 1 }),
                pos: v2.create(28, -13.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ oven_01: 3, "": 1 }),
                pos: v2.create(22, -18.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ oven_01: 3, "": 1 }),
                pos: v2.create(26, -18.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, toilet_01: 3 }),
                pos: v2.create(-1.5, -16),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, toilet_01: 3 }),
                pos: v2.create(-5, -22),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, toilet_01: 3 }),
                pos: v2.create(-5.5, -17.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, toilet_01: 3 }),
                pos: v2.create(-1.5, -23.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, vending_01: 3 }),
                pos: v2.create(-25.5, -4.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, vending_01: 3 }),
                pos: v2.create(-21.5, -2.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, cache_03: 3 }),
                pos: v2.create(-24, 7),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, cache_03: 3 }),
                pos: v2.create(14, 18),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, cache_03: 3 }),
                pos: v2.create(-18, -16),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, cache_03: 3 }),
                pos: v2.create(9.5, -16),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ "": 1, cache_03: 3 }),
                pos: v2.create(25.5, -2.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
    },
    house_red_01h: createHouseRed({}, {
        porch_01: "cache_pumpkin_02",
        stand: "stand_01",
    }),
    house_red_02h: createHouseRed2({}, {
        porch_01: "cache_pumpkin_02",
        stand: "stand_01",
    }),
    cabin_02: createCabin({}, {
        cabin_mount: "gun_mount_02",
        porch_01: "cache_pumpkin_02",
    }),
    mansion_02: createMansion({}, {
        decoration_01: "decal_web_01",
        decoration_02: "candle_lit_01",
        porch_01: "cache_pumpkin_02",
        entry_loot: "",
    }),
    mansion_cellar_02: createMansionCellar({}, {
        decoration_01: "decal_web_01",
        decoration_02: "candle_lit_01",
        mid_obs_01: "pumpkin_01",
    }),
    greenhouse_02: createGreenhouse({
        mapObjects: [
            {
                type: "glass_wall_10",
                pos: v2.create(-7, 19.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(-7, -19.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(-12.5, 15),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(-12.5, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(-12.5, -15),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(-12.5, -5),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(7, 19.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(7, -19.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(12.5, 15),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(12.5, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(12.5, -15),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(12.5, -5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_05",
                pos: v2.create(2, 19.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_05",
                pos: v2.create(-2, -19.75),
                scale: 1,
                ori: 3,
            },
            {
                type: randomObstacleType({ planter_06: 2, "": 1 }),
                pos: v2.create(-4.5, 14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_06: 2, "": 1 }),
                pos: v2.create(-7, 2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ planter_06: 2, "": 1 }),
                pos: v2.create(-7, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ planter_06: 2, "": 1 }),
                pos: v2.create(-4.5, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_06: 2, "": 1 }),
                pos: v2.create(4.5, 14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_06: 2, "": 1 }),
                pos: v2.create(7, 2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ planter_06: 2, "": 1 }),
                pos: v2.create(7, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ planter_06: 2, "": 1 }),
                pos: v2.create(4.5, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-15, 11),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(-15, 7),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(15.5, -7),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(19.5, -7),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "bunker_structure_08b",
                pos: v2.create(-9.5, -15.5),
                scale: 1,
                ori: 0,
            },
        ],
    }, {
        floor_images: [
            {
                sprite: "map-building-greenhouse-floor-02.img",
                pos: v2.create(0, 10),
                scale: 0.5,
                alpha: 1,
                tint: 0xffffff,
                rot: 2,
            },
            {
                sprite: "map-building-greenhouse-floor-02.img",
                pos: v2.create(0, -10),
                scale: 0.5,
                alpha: 1,
                tint: 0xffffff,
            },
            {
                sprite: "map-building-porch-01.img",
                pos: v2.create(0, 21),
                scale: 0.5,
                alpha: 1,
                tint: 0xffffff,
                rot: 0,
            },
            {
                sprite: "map-building-porch-01.img",
                pos: v2.create(0, -21),
                scale: 0.5,
                alpha: 1,
                tint: 0xffffff,
                rot: 2,
            },
        ],
        ceiling_images: [
            {
                sprite: "map-building-greenhouse-ceiling-02.img",
                scale: 1,
                alpha: 1,
                tint: 0xffffff,
            },
        ],
    }),
    // Potato

    shilo_01: createShilo({}),

    // Savannah

    warehouse_03sv: createWarehouse3({}, {
        specialLoot: "case_08sv",
    }),
    kopje_brush_01: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(18, 18)),
        ],
        mapGroundPatches: [],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: randomObstacleType({
                    loot_tier_1: 1,
                    loot_tier_2: 1,
                    loot_tier_surviv: 1,
                }),
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(0, 0),
                scale: 1.5,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(1, 6),
                scale: 1.5,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-4, 3),
                scale: 1.5,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-5, -2),
                scale: 1.5,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(2.5, -5),
                scale: 1.5,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-1, -8),
                scale: 1.5,
                ori: 0,
            },
        ],
    },
    grassy_cover_01: createGrassyCover({
        mapObjects: [
            {
                type: "loot_tier_1",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "grassy_wall_8",
                pos: v2.create(0, 4.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "grassy_wall_8",
                pos: v2.create(0, -4.75),
                scale: 1,
                ori: 3,
            },
            {
                type: "grassy_wall_3",
                pos: v2.create(0, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "grassy_wall_3",
                pos: v2.create(0, -3),
                scale: 1,
                ori: 2,
            },
        ],
    }),
    grassy_cover_02: createGrassyCover({
        mapObjects: [
            {
                type: "loot_tier_1",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "grassy_wall_8",
                pos: v2.create(0, 4.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "grassy_wall_8",
                pos: v2.create(0, -4.75),
                scale: 1,
                ori: 3,
            },
            {
                type: "grassy_wall_3",
                pos: v2.create(-3.5, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "grassy_wall_3",
                pos: v2.create(3.5, -3),
                scale: 1,
                ori: 2,
            },
        ],
    }),
    grassy_cover_03: createGrassyCover({
        mapObjects: [
            {
                type: "loot_tier_1",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "grassy_wall_8",
                pos: v2.create(-5, 1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "grassy_wall_8",
                pos: v2.create(1, -4.75),
                scale: 1,
                ori: 3,
            },
            {
                type: "grassy_wall_3",
                pos: v2.create(-3.25, 5),
                scale: 1,
                ori: 1,
            },
            {
                type: "grassy_wall_3",
                pos: v2.create(4.5, -3),
                scale: 1,
                ori: 2,
            },
        ],
    }),
    grassy_cover_complex_01: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(30, 10)),
        ],
        mapGroundPatches: [],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: randomObstacleType({
                    grassy_cover_01: 1,
                    grassy_cover_02: 1,
                    grassy_cover_03: 1,
                }),
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    grassy_cover_01: 1,
                    grassy_cover_02: 1,
                    grassy_cover_03: 1,
                }),
                pos: v2.create(-15, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    grassy_cover_01: 1,
                    grassy_cover_02: 1,
                    grassy_cover_03: 1,
                }),
                pos: v2.create(15, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    brush_clump_01: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(17, 17)),
        ],
        mapGroundPatches: [],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: randomObstacleType({
                    loot_tier_1: 1,
                    loot_tier_2: 1,
                    loot_tier_surviv: 1,
                }),
                pos: v2.create(-2, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    stone_01: 3,
                    barrel_01: 3,
                    "": 1,
                }),
                pos: v2.create(2, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-13, 0),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-6, 0),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(0, 0),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(7, 2),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(12, 0),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(0, -10),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(3, -5),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-3, 5),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-6, 10),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-4, -6),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(5, -13),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(5, 5),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(10, 9),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(10, -9),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-10, -9),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-8, 13),
                scale: 1.75,
                ori: 0,
            },
        ],
    },
    brush_clump_02: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(17, 17)),
        ],
        mapGroundPatches: [],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: randomObstacleType({
                    loot_tier_1: 1,
                    loot_tier_2: 1,
                    loot_tier_surviv: 1,
                }),
                pos: v2.create(2, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    stone_01: 3,
                    barrel_01: 3,
                    "": 1,
                }),
                pos: v2.create(-2, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-12, 4),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-6, 0),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(0, 0),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(7, -12),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(12, 2),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(1, -11),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(3, -4),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-3, 4),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(3, 11),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(11, 12),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(5, 5),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(9, 8),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(10, -9),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-8, 13),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-7, 9),
                scale: 1.75,
                ori: 0,
            },
        ],
    },
    brush_clump_03: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(17, 17)),
        ],
        mapGroundPatches: [],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: randomObstacleType({
                    loot_tier_1: 1,
                    loot_tier_2: 1,
                    loot_tier_surviv: 1,
                }),
                pos: v2.create(2, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    stone_01: 3,
                    barrel_01: 3,
                    "": 1,
                }),
                pos: v2.create(-2, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-12, 4),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-6, 0),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(0, 0),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(7, -11.5),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(1, -13.5),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(3, -4),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-3, 4),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(10, -9),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-3, 13),
                scale: 1.75,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    brush_01sv: 5,
                    brush_02sv: 5,
                    "": 1,
                }),
                pos: v2.create(-7, 9),
                scale: 1.75,
                ori: 0,
            },
        ],
    },
    savannah_patch_01: createSavannahPatch({
        terrain: { grass: true, beach: false, spawnPriority: 1 },
    }, {
        grass_color: 0xebc634,
    }),
    kopje_patch_01: createKopjePatch({
        terrain: { grass: true, beach: false, spawnPriority: 2 },
    }, {
        grass_color: 0x7a9e19,
    }),
    perch_01: createPerch({}),
    // Winter

    hut_01x: createHut({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-hut-ceiling-01.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-04.img",
                    pos: v2.create(4.5, 0.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-05.img",
                    pos: v2.create(-0.5, 5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
            ],
        },
    }, {}),

    hut_02x: createHut({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-hut-ceiling-02.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-04.img",
                    pos: v2.create(4.5, 0.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-05.img",
                    pos: v2.create(0.5, -4.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
            ],
        },
        map: { displayType: "hut_01x" },
    }, {
        specialLoot: "pot_02",
    }),

    warehouse_01x: createWarehouse({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-warehouse-ceiling-01.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-04.img",
                    pos: v2.create(7.5, 5),
                    scale: 0.9,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-05.img",
                    pos: v2.create(-8.5, 4),
                    scale: 0.9,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(22.25, 11.25),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(-22.25, -11.25),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
            ],
        },
    }, {
        topLeftObs: "crate_01",
        topRightObs: "crate_01",
        botRightObs: "crate_01",
        ignoreMapSpawnReplacement: true,
    }),

    warehouse_02x: createWarehouse2({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-warehouse-ceiling-02.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-04.img",
                    pos: v2.create(0, 4),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(20.25, -9.75),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(-20.25, 9.75),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
            ],
        },
    }),

    warehouse_03x: createWarehouse3({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-warehouse-ceiling-01.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-04.img",
                    pos: v2.create(7.5, 5),
                    scale: 0.9,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-05.img",
                    pos: v2.create(-8.5, 4),
                    scale: 0.9,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(22.25, 11.25),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(-22.25, -11.25),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
            ],
        },
    }, {
        crate: randomObstacleType({ crate_03: 3, crate_03x: 1 }),
    }),

    shack_01x: createShack2({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-shack-ceiling-01.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-05.img",
                    pos: v2.create(-4, 2.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-04.img",
                    pos: v2.create(3.5, -0.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
    }),

    shack_02x: createShack({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-shack-ceiling-02.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-05.img",
                    pos: v2.create(-2, 1),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
    }),
    shack_03x: createShack3({
        terrain: {
            bridge: { nearbyWidthMult: 1 },
            nearbyRiver: {
                radMin: 0.75,
                radMax: 1.5,
                facingOri: 1,
            },
        },
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-shack-ceiling-03.img",
                    pos: v2.create(0.5, 0.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0x9f9f9f,
                },
                {
                    sprite: "map-snow-01.img",
                    pos: v2.create(3.75, 1.75),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
            ],
        },
    }),
    outhouse_01x: createOutHouse({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-outhouse-ceiling.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-04.img",
                    pos: v2.create(2.25, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
    }, {}),
    outhouse_02: createOutHouse({
        map: { display: true, color: 0x9e4116, scale: 1 },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 1.45),
                        v2.create(3.6, 3.2),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 1.4),
                        v2.create(3.8, 3.4),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-building-outhouse-ceiling.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xd19698,
                },
            ],
            destroy: {
                wallCount: 2,
                particleCount: 15,
                particle: "outhouseBreak",
                residue: "map-outhouse-res.img",
            },
        },
    }, {
        obs: "toilet_02b",
    }),
    barn_01x: createBarn({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-barn-ceiling-01.img",
                    pos: v2.create(0, -2),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-barn-ceiling-02.img",
                    pos: v2.create(0, 13.2),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-01.img",
                    pos: v2.create(-14.5, 5.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-02.img",
                    pos: v2.create(-0.5, -9),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-03.img",
                    pos: v2.create(14.5, 5.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
    }, {
        bonus_door: "house_door_02",
    }),
    barn_02x: createBarn({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-barn-ceiling-01.img",
                    pos: v2.create(0, -2),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-barn-ceiling-02.img",
                    pos: v2.create(0, 13.2),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-01.img",
                    pos: v2.create(-14.5, 5.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-02.img",
                    pos: v2.create(-0.5, -9),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-03.img",
                    pos: v2.create(14.5, 5.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
        map: { displayType: "barn_01" },
    }, {
        bonus_room: "barn_basement_structure_01x",
        bonus_door: "",
    }),
    bank_01x: createBank({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-bank-ceiling-01.img",
                    pos: v2.create(-16, 7),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-bank-ceiling-02.img",
                    pos: v2.create(6, 0),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-bank-ceiling-03.img",
                    pos: v2.create(22, 8),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-02.img",
                    pos: v2.create(-13, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-04.img",
                    pos: v2.create(1.25, 9.25),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(13.75, 15.25),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(15.25, -15.75),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
            ],
        },
    }, {}),
    police_01x: createPoliceStation({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-police-ceiling-01.img",
                    pos: v2.create(-21.5, 8.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-police-ceiling-02.img",
                    pos: v2.create(10.5, 0),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-police-ceiling-03.img",
                    pos: v2.create(31.96, 12.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-01.img",
                    pos: v2.create(13, 17.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
                {
                    sprite: "map-snow-02.img",
                    pos: v2.create(-21, 14),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-03.img",
                    pos: v2.create(30.25, 6.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-snow-07.img",
                    pos: v2.create(4.5, -3.25),
                    scale: 0.6,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(-40.25, 14.75),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(-38.75, 0.75),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
            ],
        },
    }),
    house_red_01x: createHouseRed({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-house-ceiling.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-01.img",
                    pos: v2.create(-5.5, 8.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-02.img",
                    pos: v2.create(4.5, -7),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
    }, {
        plant: "tree_interior_11",
        plant_pos: v2.create(-10, -8.5),
        plant_loot: randomObstacleType({ loot_tier_surviv: 1 }),
    }),
    house_red_02x: createHouseRed2({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-house-ceiling.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xcfcfcf,
                    rot: 2,
                },
                {
                    sprite: "map-snow-02.img",
                    pos: v2.create(3.5, 6),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-snow-01.img",
                    pos: v2.create(-4.5, -8),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
            ],
        },
    }, {
        plant: "tree_interior_11",
        plant_pos: v2.create(4, 8.5),
        plant_loot: randomObstacleType({ loot_tier_surviv: 1 }),
    }),
    cabin_01x: createCabin({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-cabin-ceiling-01a.img",
                    pos: v2.create(0, 0.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-cabin-ceiling-01b.img",
                    pos: v2.create(4, -13),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-01.img",
                    pos: v2.create(-13, 6),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-02.img",
                    pos: v2.create(-3.5, -6.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-03.img",
                    pos: v2.create(10.75, 8.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-chimney-01.img",
                    pos: v2.create(13, 2),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    removeOnDamaged: true,
                },
            ],
        },
    }, {}),
    mansion_01x: createMansion({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-mansion-ceiling.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-01.img",
                    pos: v2.create(6, 19.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-02.img",
                    pos: v2.create(-16, 8),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-snow-03.img",
                    pos: v2.create(20.25, -1.75),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-04.img",
                    pos: v2.create(10.25, -13.25),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-05.img",
                    pos: v2.create(10.25, 6.25),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-07.img",
                    pos: v2.create(-21.25, -20.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(-29.75, 13.25),
                    scale: 0.75,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
            ],
        },
    }, {
        tree: "tree_11",
        tree_scale: 0.8,
        tree_loot: "loot_tier_1",
        bush_chance: 999,
    }),
    teahouse_01x: createTeahouse({}, {
        ceilingImgs: [
            {
                sprite: "map-snow-04.img",
                pos: v2.create(4, 0.5),
                scale: 1,
                alpha: 1,
                tint: 0xffffff,
                rot: 0,
            },
            {
                sprite: "map-snow-06.img",
                pos: v2.create(11.75, -5),
                scale: 0.75,
                alpha: 1,
                tint: 0xffffff,
                rot: 1,
            },
            {
                sprite: "map-snow-06.img",
                pos: v2.create(-11.75, 5),
                scale: 0.75,
                alpha: 1,
                tint: 0xffffff,
                rot: 3,
            },
        ],
    }),
    teahouse_complex_01x: createTeaHouseComplex({}, {
        grass_color: 0x9e9e9e,
        tea_house: "teahouse_01x",
        tree_small: "tree_10",
        tree_large: "tree_10",
    }),
    bridge_lg_01x: createBridgeLarge({
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-bridge-lg-ceiling.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-03.img",
                    pos: v2.create(-10, -4),
                    scale: 0.4,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-07.img",
                    pos: v2.create(8, 4),
                    scale: 0.4,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(15, -5.25),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(-15, 5.25),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
            ],
        },
    }),
    container_01x: createContainer({
        open: false,
        tint: 0x29414e,
        ceilingImgs: [
            {
                sprite: "map-building-container-ceiling-01.img",
                scale: 0.5,
                alpha: 1,
                tint: 0x29414e,
            },
            {
                sprite: "map-snow-05.img",
                pos: v2.create(0, 3),
                scale: 0.6,
                alpha: 1,
                tint: 0xffffff,
                rot: 0,
            },
        ],
    }),
    // Woods
    workshop_01: createWorkshop({}, {
        left_loot: "loot_tier_1",
        floor_loot: "loot_tier_2",
    }),
    workshop_complex_01: createWorkshopComplex({}),
    logging_complex_01: createLoggingComplex({}, {}),
    logging_complex_02: createLoggingComplex2({}, {}),
    logging_complex_03: createLoggingComplex3({}, {}),
    camp_01: createCamp({}, {}),
    teapavilion_01: createTeaPavilion({}, {}),
    teapavilion_complex_01: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(14, 14)),
            collider.createAabbExtents(v2.create(0, -20), v2.create(4, 12)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(12.5, 12.5)),
                color: 0x5c910a,
                roughness: 0.1,
                offsetDist: 0.25,
            },
        ],
        ori: 0,
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "teapavilion_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_02",
                pos: v2.create(11, -4),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_07sp: 2, "": 1 }),
                pos: v2.create(-3, 12),
                scale: 0.9,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_07sp: 2, "": 1 }),
                pos: v2.create(-12, -6),
                scale: 0.9,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_08sp: 2, "": 1 }),
                pos: v2.create(-12.5, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ tree_07sp: 2, "": 1 }),
                pos: v2.create(12, 4),
                scale: 0.9,
                ori: 0,
            },
        ],
    },
    // Woods Spring/Spring

    logging_complex_01sp: createLoggingComplex({}, {
        groundTintLt: 0x334a0e,
        groundTintDk: 0x253210,
    }),
    logging_complex_02sp: createLoggingComplex2({}, {
        groundTintDk: 0x253210,
        tree_08c: "tree_08spc",
    }),
    logging_complex_03sp: createLoggingComplex3({}, { groundTintDk: 0x253210 }),

    // Woods Winter

    workshop_01w: createWorkshop({
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(8, 0),
                        v2.create(16, 20),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(8, 0),
                        v2.create(11.5, 26.5),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-16.5, 4.5),
                        v2.create(8.5, 15.5),
                    ),
                },
            ],
            vision: { dist: 8, width: 5 },
            imgs: [
                {
                    sprite: "map-building-workshop-ceiling-02.img",
                    pos: v2.create(-16.5, 4.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-workshop-ceiling-01.img",
                    pos: v2.create(8, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-snow-01.img",
                    pos: v2.create(1, 2),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
                {
                    sprite: "map-snow-02.img",
                    pos: v2.create(17.5, 16),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-snow-05.img",
                    pos: v2.create(-12, -7),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(21.5, -17.15),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
                {
                    sprite: "map-snow-06.img",
                    pos: v2.create(-22.75, 15.9),
                    scale: 0.925,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 3,
                },
            ],
        },
    }, {
        left_loot: "loot_tier_1",
        floor_loot: "loot_tier_2",
    }),
    workshop_complex_01w: createWorkshopComplex({
        mapObjects: [
            {
                type: "workshop_01w",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "outhouse_01",
                pos: v2.create(-16, -20),
                scale: 1,
                ori: 0,
            },
            {
                type: "container_02",
                pos: v2.create(28.5, 5),
                scale: 1,
                ori: 2,
            },
            {
                type: "barrel_01",
                pos: v2.create(22, -23),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_02",
                pos: v2.create(-23, -15.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "woodpile_03",
                pos: v2.create(-23, -22),
                scale: 1,
                ori: 1,
            },
            {
                type: "woodpile_03",
                pos: v2.create(26.75, -10.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "woodpile_03",
                pos: v2.create(30.5, -7.75),
                scale: 1,
                ori: 1,
            },
        ],
    }),
    logging_complex_02x: createLoggingComplex2({}, { groundTintDk: 0x9e9e9e }),
    logging_complex_03x: createLoggingComplex3({}, { groundTintDk: 0x9e9e9e }),
    camp_01w: createCamp({}, {
        tree: randomObstacleType({ tree_07: 1, tree_08: 1 }),
    }),
    teapavilion_01w: createTeaPavilion({}, {
        center_loot: "loot_tier_helmet_forest",
        left_loot: "pot_03b",
        right_loot: "pot_03c",
    }),

    // Woods Summer/Summer

    logging_complex_01su: createLoggingComplex({}, {
        groundTintLt: 0x77ad32,
        groundTintDk: 0x4e7d13,
    }),
    logging_complex_02su: createLoggingComplex2({}, { groundTintDk: 0x4e7d13 }),
    logging_complex_03su: createLoggingComplex3({}, { groundTintDk: 0x4e7d13 }),
    teahouse_complex_01su: createTeaHouseComplex({}, {
        grass_color: 0x629522,
        tree_small: "tree_08su",
        tree_large: "tree_08su",
    }),
};
