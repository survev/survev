import { collider } from "../../../utils/collider";
import { util } from "../../../utils/util";
import { v2 } from "../../../utils/v2";
import { randomObstacleType } from "../mapObjectHelpers"
import type {
    BuildingDef,
    MapObjectDef,
} from "../../mapObjectsTyping";

function createBunkerStairs<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 1),
                        v2.create(2, 3.25),
                    ),
                    color: 0x3a3a3a,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 1), v2.create(2, 3.25)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-generic-floor-02.img",
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
                        v2.create(0, 0.75),
                        v2.create(2, 3.25),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-generic-ceiling-01.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_6",
                pos: v2.create(0, -2.2),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_7",
                pos: v2.create(-2.5, 1),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_7",
                pos: v2.create(2.5, 1),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

const BunkerDefs = {

    bunker_chrys_01: {
        type: "building",
        map: {
            display: false,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 10),
                        v2.create(3.6, 5.8),
                    ),
                    color: 0x665a4e,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 3.25)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-generic-floor-03.img",
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
                        v2.create(0, -0.25),
                        v2.create(1.5, 3.25),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-generic-ceiling-02.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_5",
                pos: v2.create(0, -3),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_7",
                pos: v2.create(-2, 0.1),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_7",
                pos: v2.create(2, 0.1),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_chrys_sublevel_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(11, -12),
                            v2.create(14.5, 9),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-chamber-floor-01a.img",
                    pos: v2.create(0, 1.85),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-chrys-chamber-floor-01b.img",
                    pos: v2.create(11, -10.75),
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
                        v2.create(11, -12),
                        v2.create(14.5, 9),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-chamber-ceiling-01.img",
                    pos: v2.create(11.5, -11),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
            ],
        },
        puzzle: {
            name: "bunker_chrys_01",
            completeUseType: "lab_door_chrys",
            completeOffDelay: 1,
            completeUseDelay: 2,
            errorResetDelay: 1,
            pieceResetDelay: 10,
            sound: {
                fail: "door_error_01",
                complete: "none",
            },
        },
        mapObjects: [
            {
                type: "concrete_wall_ext_5",
                pos: v2.create(0, 4),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_26",
                pos: v2.create(-3, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_9",
                pos: v2.create(3, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_19",
                pos: v2.create(14, -3),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_25",
                pos: v2.create(11, -20),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(25, -5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(25, -17.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_01",
                pos: v2.create(4.5, -4.15),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_03",
                pos: v2.create(8, -4.15),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(0.5, -16.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(12, -9.5),
                scale: 0.8,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(12, -13.5),
                scale: 0.8,
                ori: 0,
            },
            {
                type: "couch_01",
                pos: v2.create(15.5, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "screen_01",
                pos: v2.create(23, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "switch_01",
                pos: v2.create(18.5, -4.25),
                scale: 1,
                ori: 0,
                puzzlePiece: "ichi",
            },
            {
                type: "switch_01",
                pos: v2.create(21.5, -4.25),
                scale: 1,
                ori: 0,
                puzzlePiece: "shi",
            },
            {
                type: "switch_01",
                pos: v2.create(18.5, -18.75),
                scale: 1,
                ori: 2,
                puzzlePiece: "ni",
            },
            {
                type: "switch_01",
                pos: v2.create(21.5, -18.75),
                scale: 1,
                ori: 2,
                puzzlePiece: "san",
            },
            {
                type: "lab_door_chrys",
                pos: v2.create(25.5, -9.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "bunker_chrys_compartment_01",
                pos: v2.create(39.5, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_chrys_compartment_02",
                pos: v2.create(43.5, 19),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_chrys_compartment_03",
                pos: v2.create(43.5, 43),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_chrys_sublevel_01b: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(11, -12),
                            v2.create(14.5, 9),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-chamber-floor-01a.img",
                    pos: v2.create(0, 1.85),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-chrys-chamber-floor-01b.img",
                    pos: v2.create(11, -10.75),
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
                        v2.create(11, -12),
                        v2.create(14.5, 9),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-chamber-ceiling-01.img",
                    pos: v2.create(11.5, -11),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
            ],
        },
        mapObjects: [
            {
                type: "concrete_wall_ext_5",
                pos: v2.create(0, 4),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_26",
                pos: v2.create(-3, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_9",
                pos: v2.create(3, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_19",
                pos: v2.create(14, -3),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_25",
                pos: v2.create(11, -20),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(25, -5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(25, -17.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_01",
                pos: v2.create(4.5, -4.15),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(0.5, -16.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(12, -9.5),
                scale: 0.8,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(12, -13.5),
                scale: 0.8,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "couch_01",
                pos: v2.create(15.5, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "switch_02",
                pos: v2.create(18.5, -4.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "switch_02",
                pos: v2.create(21.5, -4.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "switch_02",
                pos: v2.create(18.5, -18.75),
                scale: 1,
                ori: 2,
            },
            {
                type: "switch_02",
                pos: v2.create(21.5, -18.75),
                scale: 1,
                ori: 2,
            },
            {
                type: "lab_door_01",
                pos: v2.create(25.5, -9.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "bunker_chrys_compartment_01b",
                pos: v2.create(39.5, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_chrys_compartment_02b",
                pos: v2.create(43.5, 19),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_chrys_compartment_03b",
                pos: v2.create(43.5, 43),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_chrys_compartment_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 2), v2.create(14, 13)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-floor-01a.img",
                    pos: v2.create(-12.5, -4.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-chrys-compartment-floor-01d.img",
                    pos: v2.create(3.5, 2),
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
                        v2.create(0, 2),
                        v2.create(14, 13),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-01a.img",
                    pos: v2.create(-10.5, -2.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-01b.img",
                    pos: v2.create(4, 3),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
            ],
        },
        puzzle: {
            name: "bunker_chrys_02",
            completeUseType: "vault_door_chrys_01",
            completeOffDelay: 1,
            completeUseDelay: 5.5,
            errorResetDelay: 1,
            pieceResetDelay: 10,
            sound: {
                fail: "door_error_01",
                complete: "vault_change_03",
            },
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-11, -2),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-11, 1),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_27",
                pos: v2.create(0.5, -9),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_42",
                pos: v2.create(15.5, 10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_34",
                pos: v2.create(-7.5, 17),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_column_4x8",
                pos: v2.create(-3.5, 14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_column_4x8",
                pos: v2.create(11.5, 14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ planter_07: 1, "": 1 }),
                pos: v2.create(-0.5, 7),
                scale: 1,
                ori: 0,
                // puzzlePiece: "rice",
            },
            {
                type: randomObstacleType({ planter_07: 1, "": 1 }),
                pos: v2.create(2.5, 7),
                scale: 1,
                ori: 0,
                // puzzlePiece: "priest",
            },
            {
                type: randomObstacleType({ planter_07: 1, "": 1 }),
                pos: v2.create(5.5, 7),
                scale: 1,
                ori: 0,
                // puzzlePiece: "harmony",
            },
            {
                type: "planter_04",
                pos: v2.create(8.5, 7),
                scale: 1,
                ori: 0,
                puzzlePiece: "leaves",
            },
            {
                type: randomObstacleType({ planter_07: 1, "": 1 }),
                pos: v2.create(-0.5, 4),
                scale: 1,
                ori: 0,
                // puzzlePiece: "gods",
            },
            {
                type: randomObstacleType({ planter_07: 1, "": 1 }),
                pos: v2.create(8.5, 4),
                scale: 1,
                ori: 0,
                // puzzlePiece: "growth",
            },
            {
                type: "planter_04",
                pos: v2.create(-0.5, 1),
                scale: 1,
                ori: 0,
                puzzlePiece: "frost",
            },
            {
                type: randomObstacleType({ planter_07: 1, "": 1 }),
                pos: v2.create(8.5, 1),
                scale: 1,
                ori: 0,
                // puzzlePiece: "book",
            },
            {
                type: randomObstacleType({ planter_07: 1, "": 1 }),
                pos: v2.create(-0.5, -2),
                scale: 1,
                ori: 0,
                // puzzlePiece: "water",
            },
            {
                type: "planter_04",
                pos: v2.create(2.5, -2),
                scale: 1,
                ori: 0,
                puzzlePiece: "flower",
            },
            {
                type: "planter_04",
                pos: v2.create(5.5, -2),
                scale: 1,
                ori: 0,
                puzzlePiece: "moon",
            },
            {
                type: randomObstacleType({ planter_07: 1, "": 1 }),
                pos: v2.create(8.5, -2),
                scale: 1,
                ori: 0,
                // puzzlePiece: "clothes",
            },
            {
                type: "vault_door_chrys_01",
                pos: v2.create(0.5, 15.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "recorder_05",
                pos: v2.create(-7.75, -1.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_chrys_01",
                pos: v2.create(12, -5.5),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_chrys_compartment_01b: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 2), v2.create(14, 13)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-floor-01a.img",
                    pos: v2.create(-12.5, -4.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-chrys-compartment-floor-01c.img",
                    pos: v2.create(3.5, 2),
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
                        v2.create(0, 2),
                        v2.create(14, 13),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-01a.img",
                    pos: v2.create(-10.5, -2.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-01b.img",
                    pos: v2.create(4, 3),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
            ],
        },
        puzzle: {
            name: "bunker_chrys_02",
            completeUseType: "vault_door_chrys_02",
            completeOffDelay: 1,
            completeUseDelay: 5.5,
            errorResetDelay: 1,
            pieceResetDelay: 10,
            sound: {
                fail: "door_error_01",
                complete: "vault_change_03",
            },
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-11, -2),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-11, 1),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_27",
                pos: v2.create(0.5, -9),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_42",
                pos: v2.create(15.5, 10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_34",
                pos: v2.create(-7.5, 17),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_column_4x8",
                pos: v2.create(-3.5, 14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_column_4x8",
                pos: v2.create(11.5, 14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(-0.5, 7),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(2.5, 7),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(5.5, 7),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(8.5, 7),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(-0.5, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(8.5, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(-0.5, 1),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(8.5, 1),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(-0.5, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(2.5, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(5.5, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ planter_07: 2, "": 1 }),
                pos: v2.create(8.5, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "vault_door_chrys_02",
                pos: v2.create(0.5, 15.5),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_chrys_compartment_02: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(10, 10)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-floor-02a.img",
                    pos: v2.create(0, -2.75),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-chrys-compartment-floor-02b.img",
                    pos: v2.create(0, 9.75),
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
                        v2.create(10, 11),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-02a.img",
                    pos: v2.create(0, 8.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-02b.img",
                    pos: v2.create(0, -2.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-8, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(8, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(-7.5, 10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(7.5, 10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-4, 12),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(4, 12),
                scale: 1,
                ori: 1,
            },
            {
                type: "loot_tier_chrys_02",
                pos: v2.create(8, -6.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_12",
                pos: v2.create(0, 5),
                scale: 1,
                ori: 1,
            },
            {
                type: "control_panel_06",
                pos: v2.create(-8.5, 1.5),
                scale: 1,
                ori: 1,
            },
        ],
    },
    bunker_chrys_compartment_02b: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(10, 10)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-floor-02a.img",
                    pos: v2.create(0, -2.75),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-chrys-compartment-floor-02c.img",
                    pos: v2.create(0, 9.75),
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
                        v2.create(10, 11),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-02a.img",
                    pos: v2.create(0, 8.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-02b.img",
                    pos: v2.create(0, -2.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-8, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(8, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(-7.5, 10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(7.5, 10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-4, 12),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(4, 12),
                scale: 1,
                ori: 1,
            },
            {
                type: "loot_tier_chrys_01",
                pos: v2.create(8, -6.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "control_panel_06",
                pos: v2.create(-8.5, 1.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "control_panel_06",
                pos: v2.create(8.5, 1.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "stone_wall_int_4",
                pos: v2.create(0, 10.9),
                scale: 1,
                ori: 1,
            },
        ],
    },
    bunker_chrys_compartment_03: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(0, -1), v2.create(10, 14)),
                    ],
                },
                {
                    type: "grass",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 11), v2.create(10, 4)),
                        collider.createAabbExtents(v2.create(-7, -3), v2.create(3, 3)),
                        collider.createAabbExtents(v2.create(8, -3), v2.create(2, 3)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-floor-03a.img",
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
                        v2.create(0, 0),
                        v2.create(10, 13),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-03a.img",
                    pos: v2.create(0, -9.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                    rot: 0,
                },
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-03b.img",
                    pos: v2.create(0, 3),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                    rot: 0,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(-7.5, -8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(7.5, -8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-11, -7),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(11, -7),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(-11.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(11.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(0, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "case_06",
                pos: v2.create(0, 4.75),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(3, 0.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-3, 0.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "wheel_03",
                pos: v2.create(0, 9.1),
                scale: 1,
                ori: 0,
            },
            {
                type: "wheel_03",
                pos: v2.create(-7.6, 1),
                scale: 1,
                ori: 1,
            },
            {
                type: "wheel_03",
                pos: v2.create(7.6, 1),
                scale: 1,
                ori: 3,
            },
            {
                type: "loot_tier_chrys_03",
                pos: v2.create(0, -5.5),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_chrys_compartment_03b: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(0, -1), v2.create(10, 14)),
                    ],
                },
                {
                    type: "grass",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 11), v2.create(10, 4)),
                        collider.createAabbExtents(v2.create(-7, -3), v2.create(3, 3)),
                        collider.createAabbExtents(v2.create(8, -3), v2.create(2, 3)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-floor-03a.img",
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
                        v2.create(0, 0),
                        v2.create(10, 13),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-03a.img",
                    pos: v2.create(0, -9.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                    rot: 0,
                },
                {
                    sprite: "map-bunker-chrys-compartment-ceiling-03b.img",
                    pos: v2.create(0, 3),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5e574b,
                    rot: 0,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(-7.5, -8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(7.5, -8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-11, -7),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(11, -7),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(-11.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(11.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(0, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(0, 4.75),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(3, 0.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-3, 0.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "wheel_03",
                pos: v2.create(0, 9.1),
                scale: 1,
                ori: 0,
            },
            {
                type: "wheel_03",
                pos: v2.create(-7.6, 1),
                scale: 1,
                ori: 1,
            },
            {
                type: "wheel_02",
                pos: v2.create(7.6, 1),
                scale: 1,
                ori: 3,
            },
            {
                type: "case_05",
                pos: v2.create(0, -5.5),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_egg_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 7.75),
                            v2.create(2, 3.25),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-generic-floor-01.img",
                    pos: v2.create(0, 7.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [],
            vision: {
                dist: 5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_short_6",
                pos: v2.create(0, 5.3),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(-2.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(2.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(5, 8),
                scale: 1.05,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(-5, 7.5),
                scale: 1.1,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(-1.25, 15.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_vent_01",
                pos: v2.create(-5, -0),
                scale: 1,
                ori: 0,
            },
            {
                type: "stone_01",
                pos: v2.create(-5.75, -1.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "decal_vent_02",
                pos: v2.create(4.5, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bush_01",
                pos: v2.create(5.75, -6.75),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_egg_sublevel_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(0, -4.5), v2.create(10, 9)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-egg-chamber-floor-01a.img",
                    pos: v2.create(-0.15, -4.6),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-egg-chamber-floor-01b.img",
                    pos: v2.create(0, 9.24),
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
                        v2.create(0, -4.5),
                        v2.create(10, 9),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-egg-chamber-ceiling-01.img",
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
                pos: v2.create(0, 11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-7, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(7, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(-10.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(10.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_24",
                pos: v2.create(0, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(-2, 5),
                scale: 1,
                ori: 3,
            },
            {
                type: "crate_07",
                pos: v2.create(0, -4.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(-7, -11),
                scale: 0.9,
                ori: 0,
            },
        ],
    },
    bunker_egg_sublevel_02: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(0, -4.5), v2.create(10, 9)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-egg-chamber-floor-01a.img",
                    pos: v2.create(-0.15, -4.6),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-egg-chamber-floor-01b.img",
                    pos: v2.create(0, 9.25),
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
                        v2.create(0, -4.5),
                        v2.create(10, 9),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-egg-chamber-ceiling-01.img",
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
                pos: v2.create(0, 11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-7, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(7, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(-10.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(10.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_24",
                pos: v2.create(0, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(-2, 5),
                scale: 1,
                ori: 3,
            },
            {
                type: "crate_07b",
                pos: v2.create(0, -4.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(-7, -11),
                scale: 0.9,
                ori: 0,
            },
        ],
    },
    bunker_egg_sublevel_01sv: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(0, -4.5), v2.create(10, 9)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-egg-chamber-floor-01a.img",
                    pos: v2.create(-0.15, -4.6),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-egg-chamber-floor-01b.img",
                    pos: v2.create(0, 9.25),
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
                        v2.create(0, -4.5),
                        v2.create(10, 9),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-egg-chamber-ceiling-01.img",
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
                pos: v2.create(0, 11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-7, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(7, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(-10.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(10.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_24",
                pos: v2.create(0, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(-2, 5),
                scale: 1,
                ori: 3,
            },
            {
                type: "crate_07sv",
                pos: v2.create(0, -4.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(-7, -11),
                scale: 0.9,
                ori: 0,
            },
        ],
    },
    bunker_hydra_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(20.25, 3.5),
                        v2.create(6.25, 5.5),
                    ),
                    color: 0x2c2c2c,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(32.25, 3.5),
                        v2.create(6.75, 9.25),
                    ),
                    color: 0x3a3a3a,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(20.25, 3.5),
                            v2.create(6.25, 5.5),
                        ),
                        collider.createAabbExtents(
                            v2.create(32.25, 3.5),
                            v2.create(6.75, 9.25),
                        ),
                    ],
                },
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(16.25, 3.5),
                            v2.create(3.25, 2),
                        ),
                        collider.createAabbExtents(
                            v2.create(-16.5, -90.75),
                            v2.create(2, 3.25),
                        ),
                        collider.createAabbExtents(
                            v2.create(40, -50.5),
                            v2.create(2, 3.25),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-floor-01.img",
                    pos: v2.create(25.75, 3.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-generic-floor-01.img",
                    pos: v2.create(-16.5, -90),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-bunker-generic-floor-01.img",
                    pos: v2.create(40, -51),
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
                        v2.create(19.25, 3.5),
                        v2.create(6.25, 5.5),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(32.25, 3.5),
                        v2.create(6.75, 9.25),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-ceiling-01.img",
                    pos: v2.create(25.75, 3.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
            vision: {
                dist: 5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
        },
        mapObjects: [
            {
                type: "concrete_wall_ext_13",
                pos: v2.create(18.75, 9.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_13",
                pos: v2.create(18.75, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_11",
                pos: v2.create(12.75, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_7",
                pos: v2.create(25.75, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_7",
                pos: v2.create(25.75, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_2",
                pos: v2.create(26.25, 12.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_2",
                pos: v2.create(26.25, -5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_8",
                pos: v2.create(35.25, 12.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_8",
                pos: v2.create(35.25, -5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_17",
                pos: v2.create(38.75, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "police_wall_int_7",
                pos: v2.create(32.75, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "police_wall_int_2",
                pos: v2.create(33.25, 4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(38.25, 4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ toilet_03: 5, toilet_04: 1 }),
                pos: v2.create(35.75, 10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_08",
                pos: v2.create(35.75, -2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_short_6",
                pos: v2.create(13, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(17, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(17, 1),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_vent_01",
                pos: v2.create(-1.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_vent_02",
                pos: v2.create(8, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_short_6",
                pos: v2.create(-16.5, -87.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(-19, -91),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(-14, -91),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_vent_01",
                pos: v2.create(-15.15, -79.55),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_short_6",
                pos: v2.create(40, -53.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(37.5, -50),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(42.5, -50),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_vent_02",
                pos: v2.create(40, -60.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(-11.5, -92),
                scale: 1.05,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(-21.5, -92.5),
                scale: 1.1,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(-17.5, -83.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(45, -50),
                scale: 1.05,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(35, -50.5),
                scale: 1.1,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(38.75, -42.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_hydra_01",
                pos: v2.create(3.5, -48.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
    },
    bunker_hydra_sublevel_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(3.5, 3), v2.create(9.5, 9)),
                    ],
                },
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(-15.5, -79.5),
                            v2.create(3, 8),
                        ),
                        collider.createAabbExtents(
                            v2.create(40.5, -62),
                            v2.create(9.5, 8),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-chamber-floor-01a.img",
                    pos: v2.create(17.5, 3.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hydra-chamber-floor-01b.img",
                    pos: v2.create(3.5, 2.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hydra-chamber-floor-02.img",
                    pos: v2.create(-15.5, -83),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hydra-chamber-floor-03.img",
                    pos: v2.create(40.5, -58.5),
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
                        v2.create(3.5, 2.25),
                        v2.create(10, 10),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-15, -77),
                        v2.create(5.5, 10.5),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(38, -62),
                        v2.create(11.5, 8),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-chamber-ceiling-01.img",
                    pos: v2.create(7, 2),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
                {
                    sprite: "map-bunker-hydra-chamber-ceiling-02.img",
                    pos: v2.create(-13.5, -76.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
                {
                    sprite: "map-bunker-hydra-chamber-ceiling-03.img",
                    pos: v2.create(38, -62),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
            vision: { dist: 10, width: 3 },
        },
        mapObjects: [
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(20, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(16.5, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(16.5, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(14, 12),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(14, -5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_21",
                pos: v2.create(2, 13.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_21",
                pos: v2.create(-7, 2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(-3, -6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(10, -6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(13.5, 5.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "lab_door_01",
                pos: v2.create(-0.5, -7.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "lab_door_01",
                pos: v2.create(7.5, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "sandbags_01",
                pos: v2.create(0, 7.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(10.25, -2.75),
                scale: 0.9,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(10.25, 9.75),
                scale: 0.9,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "barrel_01",
                pos: v2.create(-3.5, -3),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_23",
                pos: v2.create(-20, -83),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_19",
                pos: v2.create(-11, -79),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-13, -90.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(-16.5, -94),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(-18.5, -87.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "locker_01",
                pos: v2.create(-12.15, -79),
                scale: 1,
                ori: 3,
            },
            {
                type: "locker_01",
                pos: v2.create(-12.15, -74.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "locker_01",
                pos: v2.create(-12.15, -83.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(40, -47),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(36.5, -50.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(43.5, -50.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(33, -53),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(30, -55),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(30, -66),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_16",
                pos: v2.create(36.5, -71),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(48.25, -70),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_13",
                pos: v2.create(50, -62),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(48.25, -54),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(38, -53.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "crate_08",
                pos: v2.create(34, -67),
                scale: 1,
                ori: 2,
            },
            {
                type: "locker_01",
                pos: v2.create(46.5, -55.15),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_01",
                pos: v2.create(48.9, -57.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "locker_01",
                pos: v2.create(48.9, -62),
                scale: 1,
                ori: 3,
            },
            {
                type: "locker_01",
                pos: v2.create(48.9, -66.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "locker_01",
                pos: v2.create(46.5, -68.85),
                scale: 1,
                ori: 2,
            },
            {
                type: "bunker_hydra_compartment_01",
                pos: v2.create(3.5, -18.95),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_hydra_compartment_02",
                pos: v2.create(6, -50),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_hydra_compartment_03",
                pos: v2.create(10.5, -74.95),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_hydra_compartment_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 1.5),
                            v2.create(9.5, 12.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-compartment-floor-01.img",
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
                        v2.create(0, 1.25),
                        v2.create(10, 10),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-compartment-ceiling-01.img",
                    pos: v2.create(0, 1.25),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_17",
                pos: v2.create(-9.75, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(-6.5, 9.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(6.5, 10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_18",
                pos: v2.create(10.5, 1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(-7.5, -6.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(8, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_08",
                pos: v2.create(6.5, 6.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "sandbags_01",
                pos: v2.create(4.75, 1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "lab_door_01",
                pos: v2.create(-4, -8.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "lab_door_01",
                pos: v2.create(4, -8.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "locker_01",
                pos: v2.create(-6, 8.4),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_01",
                pos: v2.create(-8.35, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "locker_01",
                pos: v2.create(-8.35, 1.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "locker_01",
                pos: v2.create(-8.35, -3),
                scale: 1,
                ori: 1,
            },
            {
                type: "locker_01",
                pos: v2.create(-6, -5.4),
                scale: 1,
                ori: 2,
            },
        ],
    },
    bunker_hydra_compartment_02: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    data: { isBright: true },
                    collision: [
                        collider.createAabbExtents(v2.create(-2.5, 16), v2.create(22, 4)),
                        collider.createAabbExtents(
                            v2.create(-2.5, 9.5),
                            v2.create(6, 2.5),
                        ),
                        collider.createAabbExtents(v2.create(0, -4.5), v2.create(25, 17)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-compartment-floor-02.img",
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
                        v2.create(-2, 3),
                        v2.create(22.5, 19.5),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-compartment-ceiling-02.img",
                    pos: v2.create(0, 1),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_21",
                pos: v2.create(-17, 21.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_21",
                pos: v2.create(12, 21.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_42",
                pos: v2.create(-26, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_29",
                pos: v2.create(21, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(-19, -18.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-18.5, -14),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(-15, -15),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_9",
                pos: v2.create(-9, -16),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_9",
                pos: v2.create(4, -16),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(10, -15),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_11",
                pos: v2.create(17, -14),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_column_5x12",
                pos: v2.create(-14.5, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_column_5x12",
                pos: v2.create(9.5, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "control_panel_03",
                pos: v2.create(-7, 12),
                scale: 1,
                ori: 1,
            },
            {
                type: "control_panel_03",
                pos: v2.create(2, 12),
                scale: 1,
                ori: 3,
            },
            {
                type: "lab_window_01",
                pos: v2.create(-7, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_window_01",
                pos: v2.create(-4, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_window_01",
                pos: v2.create(-1, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_window_01",
                pos: v2.create(2, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_4",
                pos: v2.create(-9, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_4",
                pos: v2.create(4, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "lab_door_01",
                pos: v2.create(-20.5, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_door_01",
                pos: v2.create(15.5, 13),
                scale: 1,
                ori: 3,
            },
            {
                type: "crate_01",
                pos: v2.create(-17.5, 7.75),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "vat_01",
                pos: v2.create(-12.25, 7.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "vat_01",
                pos: v2.create(-12, -2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "vat_01",
                pos: v2.create(-18, -2.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "vat_02",
                pos: v2.create(-2.5, 1.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "power_box_01",
                pos: v2.create(-2.5, -3),
                scale: 1,
                ori: 2,
            },
            {
                type: "crate_01",
                pos: v2.create(12.5, 7.75),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "vat_01",
                pos: v2.create(7.25, 7.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "vat_01",
                pos: v2.create(7, -2.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "vat_01",
                pos: v2.create(13, -2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "vat_01",
                pos: v2.create(-10.75, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_door_01",
                pos: v2.create(-4.5, -16.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "vat_01",
                pos: v2.create(5.75, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "fire_ext_01",
                pos: v2.create(1.5, -14.15),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_door_03",
                pos: v2.create(-20.5, -16.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_door_02",
                pos: v2.create(20.5, -8.5),
                scale: 1,
                ori: 2,
            },
        ],
    },
    bunker_hydra_compartment_03: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 2), v2.create(9, 8.75)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-compartment-floor-03.img",
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
                        v2.create(0, 0.75),
                        v2.create(10, 7.75),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-compartment-ceiling-03.img",
                    pos: v2.create(0, 1),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_17",
                pos: v2.create(-10.5, -1),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_18",
                pos: v2.create(0, -8),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_18",
                pos: v2.create(10.5, -1),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_14",
                pos: v2.create(2, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(-6.5, -1.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(-1.75, 2),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "barrel_01",
                pos: v2.create(-2, -2),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "case_03",
                pos: v2.create(7, -4),
                scale: 1,
                ori: 3,
            },
        ],
    },
    bunker_storm_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 10),
                        v2.create(3.6, 5.8),
                    ),
                    color: 0x665a4e,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 7.75),
                            v2.create(2, 3.25),
                        ),
                    ],
                },
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 13.5),
                            v2.create(3.75, 2.5),
                        ),
                    ],
                },
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(5, 13.75),
                            v2.create(1.25, 2.25),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-storm-floor-02.img",
                    pos: v2.create(1.25, 10),
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
                        v2.create(0, 10),
                        v2.create(3.5, 5.6),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 10),
                        v2.create(3.8, 5.9),
                    ),
                },
            ],
            vision: {
                dist: 5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [
                {
                    sprite: "map-building-shack-ceiling-01.img",
                    pos: v2.create(-1, 10),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
            ],
            destroy: {
                wallCount: 2,
                particle: "shackBreak",
                particleCount: 25,
                residue: "none",
            },
        },
        mapObjects: [
            {
                type: "metal_wall_ext_short_6",
                pos: v2.create(0, 5.3),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(-2.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(2.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "shack_wall_bot",
                pos: v2.create(3.39, 8.6),
                scale: 1,
                ori: 1,
            },
            {
                type: "shack_wall_side_left",
                pos: v2.create(0.3, 4.52),
                scale: 1,
                ori: 1,
            },
            {
                type: "shack_wall_top",
                pos: v2.create(-3.39, 9.73),
                scale: 1,
                ori: 1,
            },
            {
                type: "shack_wall_side_right",
                pos: v2.create(0, 15.58),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(-2, 17.9),
                scale: 0.8,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(1.45, 17.7),
                scale: 0.85,
                ori: 0,
            },
            {
                type: "decal_vent_01",
                pos: v2.create(-5, -0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_vent_02",
                pos: v2.create(4.5, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "stone_01",
                pos: v2.create(-4.25, -1.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "bush_01",
                pos: v2.create(3.75, -6.75),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_storm_sublevel_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(1, -4.4),
                            v2.create(10.5, 9),
                        ),
                    ],
                },
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(19, -5.5),
                            v2.create(7.5, 8),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-storm-chamber-floor-01a.img",
                    pos: v2.create(8.5, -4.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-storm-chamber-floor-01b.img",
                    pos: v2.create(0, 9.25),
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
                        v2.create(8.5, -4.5),
                        v2.create(18, 9.5),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-storm-chamber-ceiling-01.img",
                    pos: v2.create(8.5, -1),
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
                pos: v2.create(0, 11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-7, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(7, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(-10.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_21",
                pos: v2.create(-1.5, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_10",
                pos: v2.create(10.5, -11),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_10",
                pos: v2.create(12.5, -11),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(21.5, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(27.5, -5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_17",
                pos: v2.create(20.5, 3.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_9",
                pos: v2.create(10.5, 2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(12.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_02",
                pos: v2.create(-2, 5),
                scale: 1,
                ori: 3,
            },
            {
                type: "crate_01",
                pos: v2.create(-6.5, 1.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_04",
                pos: v2.create(6, -1),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_04",
                pos: v2.create(3.9, -6.4),
                scale: 1,
                ori: 0,
            },
            {
                type: "control_panel_03",
                pos: v2.create(16, -11.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "control_panel_02",
                pos: v2.create(20, -11.25),
                scale: 1,
                ori: 2,
            },
            {
                type: "control_panel_03",
                pos: v2.create(24, -11.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "crate_08",
                pos: v2.create(23.5, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ case_03: 1, chest_02: 9 }),
                pos: v2.create(16.5, 0.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "lab_door_01",
                pos: v2.create(11.5, -2),
                scale: 1,
                ori: 2,
            },
            {
                type: "barrel_01",
                pos: v2.create(-7, -11),
                scale: 0.9,
                ori: 0,
            },
        ],
    },
    bunker_conch_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(20, 3.35),
                        v2.create(5.5, 2.5),
                    ),
                    color: 0x29414e,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(46.5, -32.55),
                        v2.create(5.5, 2.5),
                    ),
                    color: 0x29414e,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(16.25, 3.5),
                            v2.create(3.25, 2),
                        ),
                        collider.createAabbExtents(
                            v2.create(44.25, -32.5),
                            v2.create(3.25, 2),
                        ),
                        collider.createAabbExtents(
                            v2.create(22, 3.35),
                            v2.create(8, 2.5),
                        ),
                        collider.createAabbExtents(
                            v2.create(50.5, -32.55),
                            v2.create(8, 2.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-conch-floor-01.img",
                    pos: v2.create(20.75, 3.45),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-conch-floor-01.img",
                    pos: v2.create(48.75, -32.45),
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
                        v2.create(19, 3.35),
                        v2.create(5.5, 2.5),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(22, 3.35),
                        v2.create(8, 2.5),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(47.5, -32.55),
                        v2.create(5.5, 2.5),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(50.5, -32.55),
                        v2.create(8, 2.5),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-conch-ceiling-01.img",
                    pos: v2.create(19.25, 3.35),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-conch-ceiling-01.img",
                    pos: v2.create(47.25, -32.55),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
            vision: {},
        },
        mapObjects: [
            {
                type: "container_wall_top",
                pos: v2.create(13.7, 3.35),
                scale: 1,
                ori: 1,
            },
            {
                type: "container_wall_side",
                pos: v2.create(19.6, 5.7),
                scale: 1,
                ori: 1,
            },
            {
                type: "container_wall_side",
                pos: v2.create(19.6, 1),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(24, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(18, -2),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "container_wall_top",
                pos: v2.create(41.7, -32.55),
                scale: 1,
                ori: 1,
            },
            {
                type: "container_wall_side",
                pos: v2.create(47.6, -34.9),
                scale: 1,
                ori: 1,
            },
            {
                type: "container_wall_side",
                pos: v2.create(47.6, -30.2),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(47, -27),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "barrel_01",
                pos: v2.create(40, -37),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_vent_03",
                pos: v2.create(-2, -13.5),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_conch_sublevel_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(v2.create(1, 4), v2.create(12.5, 3.5)),
                        collider.createAabbExtents(
                            v2.create(28, -30),
                            v2.create(13.5, 4.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-conch-chamber-floor-01.img",
                    pos: v2.create(4, 5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-conch-chamber-floor-02.img",
                    pos: v2.create(34.86, -29.9),
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
                        v2.create(1, 3.5),
                        v2.create(12.5, 5),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(26.75, -30),
                        v2.create(15.25, 4.5),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-conch-chamber-ceiling-01.img",
                    pos: v2.create(-2, 3.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
                {
                    sprite: "map-bunker-conch-chamber-ceiling-02.img",
                    pos: v2.create(26.25, -29.9),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
            vision: { dist: 7, width: 3 },
        },
        occupiedEmitters: [
            {
                type: "bunker_bubbles_01",
                pos: v2.create(-2, -13.5),
                rot: 0,
                scale: 0.5,
                layer: 0,
            },
        ],
        mapObjects: [
            {
                type: "house_door_02",
                pos: v2.create(13.5, 1.35),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(20, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(16.5, 6.7),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_29",
                pos: v2.create(7, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_16",
                pos: v2.create(5.5, 9),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_9",
                pos: v2.create(-7, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_10",
                pos: v2.create(-13, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_01",
                pos: v2.create(9.5, 7.85),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_01",
                pos: v2.create(5, 7.85),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_01",
                pos: v2.create(0.5, 7.85),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_pipes_01",
                pos: v2.create(-4.5, 5),
                scale: 1,
                ori: 2,
            },
            {
                type: "house_door_02",
                pos: v2.create(41.5, -34.55),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(48, -32.4),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(38.5, -35.9),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_13",
                pos: v2.create(42, -29.2),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(34, -26.7),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(27, -33.4),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_11",
                pos: v2.create(20, -30.9),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_18",
                pos: v2.create(23.5, -23.9),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_pipes_04",
                pos: v2.create(22, -29.9),
                scale: 1,
                ori: 2,
            },
            {
                type: "loot_tier_2",
                pos: v2.create(31, -30),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_conch_compartment_01",
                pos: v2.create(-1.5, -12.4),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_conch_compartment_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "water",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(1, -2.5),
                            v2.create(15, 15.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-conch-compartment-floor-01a.img",
                    pos: v2.create(-3, -0.75),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-conch-compartment-floor-01b.img",
                    pos: v2.create(9.75, -17.5),
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
                        v2.create(-1.5, -1),
                        v2.create(12.5, 12),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(9.5, -14.5),
                        v2.create(4, 2.5),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-conch-compartment-ceiling-01.img",
                    pos: v2.create(-0.75, -5.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
            vision: { dist: 7, width: 3 },
        },
        occupiedEmitters: [
            {
                type: "bunker_bubbles_01",
                pos: v2.create(-0.5, -1),
                rot: 0,
                scale: 0.5,
                layer: 0,
            },
        ],
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(-11.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-15, 7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_11",
                pos: v2.create(-15.5, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(-13.5, -6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(-11.5, -11.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_13",
                pos: v2.create(-3.5, -13.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(4.5, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_13",
                pos: v2.create(9.5, -18.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(13.5, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_19",
                pos: v2.create(11.5, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_19",
                pos: v2.create(3.5, 10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_door_01",
                pos: v2.create(-10, 11),
                scale: 1,
                ori: 3,
            },
            {
                type: "control_panel_03",
                pos: v2.create(-12.25, 4.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "control_panel_02",
                pos: v2.create(-12, 0.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "fire_ext_01",
                pos: v2.create(-3, 8.75),
                scale: 1,
                ori: 3,
            },
            {
                type: "crate_09",
                pos: v2.create(2.75, 6.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(7.5, 6.25),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "decal_pipes_02",
                pos: v2.create(7.25, 7.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-3.75, -2),
                scale: 0.8,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(-1.25, -4.25),
                scale: 0.8,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(-7.5, -9.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(3.5, -9.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "decal_pipes_03",
                pos: v2.create(-5.25, -9.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "lab_door_01",
                pos: v2.create(13.5, -17),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_crossing_stairs_01: createBunkerStairs({}),
    bunker_crossing_stairs_01b: createBunkerStairs({
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0.75),
                        v2.create(2, 3.25),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-crossing-ceiling-01.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
    }),
    bunker_crossing_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(5, 5),
                    ),
                    color: 1984867,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [],
            imgs: [
                {
                    sprite: "map-bunker-crossing-floor-01.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "bunker_crossing_stairs_01b",
                pos: v2.create(34.5, 28.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "bunker_crossing_stairs_01b",
                pos: v2.create(-36, 20),
                scale: 1,
                ori: 2,
            },
            {
                type: "bunker_crossing_stairs_01b",
                pos: v2.create(36, -14),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_crossing_stairs_01",
                pos: v2.create(-34.5, -22.5),
                scale: 1,
                ori: 1,
            },
        ],
    },
    bunker_crossing_sublevel_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 3.25), v2.create(38, 28)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-crossing-chamber-floor-01a.img",
                    pos: v2.create(-11.44, 27),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-bunker-crossing-chamber-floor-01b.img",
                    pos: v2.create(-9.38, 18.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-bunker-crossing-chamber-floor-01c.img",
                    pos: v2.create(-36.44, 18.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-bunker-crossing-chamber-floor-03.img",
                    pos: v2.create(28.5, 23.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-bunker-crossing-chamber-floor-02.img",
                    pos: v2.create(-28.5, -17.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-bunker-crossing-chamber-floor-01a.img",
                    pos: v2.create(11.45, -21),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-bunker-crossing-chamber-floor-01b.img",
                    pos: v2.create(9.39, -12.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-bunker-crossing-chamber-floor-01c.img",
                    pos: v2.create(36.45, -12.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-3, 27.5),
                        v2.create(35.1, 5),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(3, -21.5),
                        v2.create(35.1, 5),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-4, 20.5),
                        v2.create(3, 3),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(4, -14.5),
                        v2.create(3, 3),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-crossing-chamber-ceiling-01.img",
                    pos: v2.create(-3.5, 24),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
                {
                    sprite: "map-bunker-crossing-chamber-ceiling-01.img",
                    pos: v2.create(3.5, -18),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                    rot: 2,
                },
            ],
            vision: { dist: 7, width: 3 },
        },
        mapObjects: [
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(38.5, 28.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_02",
                pos: v2.create(32, 30.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "decal_pipes_05",
                pos: v2.create(13, 28.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_48",
                pos: v2.create(15, 32),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_35",
                pos: v2.create(21.5, 25),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(2.5, 23.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(-0.5, 20.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(-7.5, 20.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_32",
                pos: v2.create(-22, 29),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(-39.5, 23),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(-36, 16),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(-38, 22.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-32.5, 19.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_22",
                pos: v2.create(-20, 22),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(-4.5, 29),
                scale: 0.8,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(-38.5, -22.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_02",
                pos: v2.create(-32, -20.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "decal_pipes_05",
                pos: v2.create(-12, -22.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "metal_wall_ext_thicker_48",
                pos: v2.create(-15, -26),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(-31.5, -19),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_16",
                pos: v2.create(-12, -19),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(-2.5, -17.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(0.5, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(7.5, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_32",
                pos: v2.create(22, -23),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(39.5, -17),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(36, -10),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(38, -16.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(32.5, -13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_22",
                pos: v2.create(20, -16),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(4.5, -23),
                scale: 0.8,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(-12.5, -22.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(-7, -22.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_crossing_compartment_01",
                pos: v2.create(1.5, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_crossing_bathroom: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "water",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(0, 0)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(3.75, 2),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-building-crossing-bathroom-ceiling.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: randomObstacleType({ toilet_03: 5, toilet_04: 1 }),
                pos: v2.create(2, 0),
                scale: 1,
                ori: 3,
            },
        ],
    },
    bunker_crossing_compartment_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "water",
                    collision: [
                        collider.createAabbExtents(v2.create(-1, 3), v2.create(17, 17.5)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-crossing-compartment-floor-02.img",
                    pos: v2.create(-22.5, -10),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-crossing-compartment-floor-01.img",
                    pos: v2.create(4, 3),
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
                        v2.create(4, 3),
                        v2.create(22, 14.5),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-22, -11),
                        v2.create(4.5, 9),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-crossing-compartment-ceiling-01a.img",
                    pos: v2.create(-22.475, -11),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
                {
                    sprite: "map-bunker-crossing-compartment-ceiling-01b.img",
                    pos: v2.create(3.975, 3),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
            vision: { dist: 7, width: 3 },
        },
        occupiedEmitters: [
            {
                type: "bunker_bubbles_02",
                pos: v2.create(-1.5, 0),
                rot: 0,
                scale: 0.5,
                layer: 0,
            },
        ],
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_13",
                pos: v2.create(-14, 16),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_door_01",
                pos: v2.create(-7.5, 17.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "metal_wall_ext_thicker_18",
                pos: v2.create(5.5, 16),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(16, 13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(22, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(27, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "lab_door_01",
                pos: v2.create(17.5, 6.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "bunker_crossing_bathroom",
                pos: v2.create(22, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(22, 1),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_11",
                pos: v2.create(16, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_10",
                pos: v2.create(9.5, -10),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_door_01",
                pos: v2.create(4.5, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_19",
                pos: v2.create(-9, -10),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-19.5, -8),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_10",
                pos: v2.create(-20, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_17",
                pos: v2.create(-27, -11),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_11",
                pos: v2.create(-23, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_14",
                pos: v2.create(-19, 7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "control_panel_04",
                pos: v2.create(-15.25, 8.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "control_panel_03",
                pos: v2.create(-15.5, 12.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "control_panel_03",
                pos: v2.create(-15.5, 4.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(-5, 10.25),
                scale: 0.8,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-3.25, 12.5),
                scale: 0.8,
                ori: 0,
            },
            {
                type: "locker_01",
                pos: v2.create(1.15, 14.85),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_03",
                pos: v2.create(4.5, 14.85),
                scale: 1,
                ori: 0,
            },
            {
                type: "bookshelf_01",
                pos: v2.create(10.5, 13),
                scale: 1,
                ori: 0,
            },
            {
                type: "bed_sm_01",
                pos: v2.create(10.5, 10),
                scale: 1,
                ori: 3,
            },
            {
                type: "crate_01",
                pos: v2.create(-5, -6.25),
                scale: 0.8,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "barrel_01",
                pos: v2.create(-3, -2.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "vending_01",
                pos: v2.create(-1.25, -6.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "fire_ext_01",
                pos: v2.create(14, -0.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "refrigerator_01",
                pos: v2.create(8.25, -6.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "oven_01",
                pos: v2.create(12.25, -6.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "crossing_door_01",
                pos: v2.create(-17.85, -2.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "couch_01",
                pos: v2.create(-12, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "screen_01",
                pos: v2.create(-12, -7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-23.5, -4.5),
                scale: 0.8,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "loot_tier_woodaxe",
                pos: v2.create(-23.5, -8.5),
                scale: 0.8,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-23.5, -14),
                scale: 0.8,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crossing_door_01",
                pos: v2.create(-21.5, -20.15),
                scale: 1,
                ori: 1,
            },
        ],
    },
    bunker_hatchet_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 10),
                        v2.create(3.6, 5.8),
                    ),
                    color: 0x665a4e,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 7.75),
                            v2.create(2, 3.25),
                        ),
                    ],
                },
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 13.5),
                            v2.create(3.75, 2.5),
                        ),
                        collider.createAabbExtents(
                            v2.create(5, 13.75),
                            v2.create(1.25, 2.25),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-storm-floor-02.img",
                    pos: v2.create(1.25, 10),
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
                        v2.create(0, 10),
                        v2.create(3.5, 5.6),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 10),
                        v2.create(3.8, 5.9),
                    ),
                },
            ],
            vision: {
                dist: 5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [
                {
                    sprite: "map-building-shack-ceiling-01.img",
                    pos: v2.create(-1, 10),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 1,
                },
            ],
            destroy: {
                wallCount: 2,
                particle: "shackBreak",
                particleCount: 25,
                residue: "none",
            },
        },
        mapObjects: [
            {
                type: "metal_wall_ext_short_6",
                pos: v2.create(0, 5.3),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(-2.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_short_7",
                pos: v2.create(2.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "shack_wall_bot",
                pos: v2.create(3.39, 8.6),
                scale: 1,
                ori: 1,
            },
            {
                type: "shack_wall_side_left",
                pos: v2.create(0.3, 4.52),
                scale: 1,
                ori: 1,
            },
            {
                type: "shack_wall_top",
                pos: v2.create(-3.39, 9.73),
                scale: 1,
                ori: 1,
            },
            {
                type: "shack_wall_side_right",
                pos: v2.create(0, 15.58),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(-2, 17.9),
                scale: 0.8,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(1.45, 17.7),
                scale: 0.85,
                ori: 0,
            },
            {
                type: "decal_vent_01",
                pos: v2.create(5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_vent_02",
                pos: v2.create(5, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_07",
                pos: v2.create(6.75, -4.5),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_hatchet_sublevel_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(-3, -4.4), v2.create(13, 9)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hatchet-chamber-floor-01a.img",
                    pos: v2.create(0, -4.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hatchet-chamber-floor-01b.img",
                    pos: v2.create(0, 9.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hatchet-chamber-floor-01c.img",
                    pos: v2.create(-15, -9.475),
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
                        v2.create(-3, -4.4),
                        v2.create(13, 9.25),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hatchet-chamber-ceiling-01.img",
                    pos: v2.create(-3, -4.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
            vision: { dist: 5, width: 3 },
        },
        mapObjects: [
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(0, 11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(-8.5, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(8.5, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(10.5, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_10",
                pos: v2.create(-10.5, -1),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_14",
                pos: v2.create(-16, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_25",
                pos: v2.create(-3.5, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(-2, 5),
                scale: 1,
                ori: 3,
            },
            {
                type: "barrel_01",
                pos: v2.create(-5, 0.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(6.75, -10.75),
                scale: 0.85,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_06",
                pos: v2.create(0, -11),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(7, -4),
                scale: 1,
                ori: 1,
            },
            {
                type: "bunker_hatchet_compartment_01",
                pos: v2.create(-32, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_hatchet_compartment_02",
                pos: v2.create(-63.5, -4),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_hatchet_compartment_03",
                pos: v2.create(-55, 20.5),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_hatchet_compartment_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(16, 13)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hatchet-compartment-floor-01.img",
                    pos: v2.create(0, 0.5),
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
                        v2.create(16, 12.5),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hatchet-compartment-ceiling-01.img",
                    pos: v2.create(0, 0),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_13",
                pos: v2.create(10.5, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_11",
                pos: v2.create(3.5, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_18",
                pos: v2.create(-3.5, 14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_21",
                pos: v2.create(-10.5, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_32",
                pos: v2.create(0, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_14",
                pos: v2.create(-16, -6),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_door_01",
                pos: v2.create(16, -7.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "lab_door_01",
                pos: v2.create(-16, -7.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "lab_door_01",
                pos: v2.create(-9, 12.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "metal_wall_ext_10",
                pos: v2.create(8.65, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_10",
                pos: v2.create(3, 5.15),
                scale: 1,
                ori: 1,
            },
            {
                type: "locker_01",
                pos: v2.create(0.5, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_01",
                pos: v2.create(5.5, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "locker_01",
                pos: v2.create(8.5, 2),
                scale: 1,
                ori: 3,
            },
            {
                type: "locker_01",
                pos: v2.create(8.5, -3),
                scale: 1,
                ori: 3,
            },
            {
                type: "barrel_01",
                pos: v2.create(1.5, -0.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "fire_ext_01",
                pos: v2.create(0.5, -11.25),
                scale: 0.9,
                ori: 1,
            },
            {
                type: "couch_01",
                pos: v2.create(-7.5, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(-7, 8.5),
                scale: 0.85,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
        ],
    },
    bunker_hatchet_compartment_02: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(16, 15)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hatchet-compartment-floor-02a.img",
                    pos: v2.create(4, -8.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hatchet-compartment-floor-02b.img",
                    pos: v2.create(0.75, 6),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hatchet-compartment-floor-02c.img",
                    pos: v2.create(-14, 0.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hatchet-compartment-floor-02d.img",
                    pos: v2.create(-6.27, 14.25),
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
                        v2.create(-0.5, 0),
                        v2.create(16, 15),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hatchet-compartment-ceiling-02.img",
                    pos: v2.create(-0.5, -0.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(11.5, -10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_13",
                pos: v2.create(10, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_11",
                pos: v2.create(3, 9.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(6, -13),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_12",
                pos: v2.create(-1.5, -16.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_7",
                pos: v2.create(-9, -13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_11",
                pos: v2.create(-13, -8.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(-17, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_6",
                pos: v2.create(-12.5, 6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_25",
                pos: v2.create(-11, 20.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_14",
                pos: v2.create(-4, 15),
                scale: 1,
                ori: 0,
            },
            {
                type: "lab_door_01",
                pos: v2.create(-5.5, 15),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(-1.25, 0.5),
                scale: 0.85,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(2.75, -1.75),
                scale: 0.85,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_04",
                pos: v2.create(3, 2.5),
                scale: 0.85,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-7.5, 11),
                scale: 0.85,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "control_panel_06",
                pos: v2.create(2, 6.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "control_panel_06",
                pos: v2.create(6.75, 1.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "loot_tier_hatchet_melee",
                pos: v2.create(6.75, 6.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_12_2",
                pos: v2.create(-10.5, -1),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_12_2",
                pos: v2.create(-1.5, -10),
                scale: 1,
                ori: 1,
            },
            {
                type: "loot_tier_imperial_outfit",
                pos: v2.create(-13.5, -4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_pineapple_outfit",
                pos: v2.create(-13.5, -1),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_tarkhany_outfit",
                pos: v2.create(-13.5, 2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_spetsnaz_outfit",
                pos: v2.create(-5, -13),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_lumber_outfit",
                pos: v2.create(-1.5, -13),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_verde_outfit",
                pos: v2.create(2, -13),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_hatchet_compartment_03: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(19, 10)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hatchet-compartment-floor-03a.img",
                    pos: v2.create(-14.5, -8.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hatchet-compartment-floor-03b.img",
                    pos: v2.create(-9, 3),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hatchet-compartment-floor-03c.img",
                    pos: v2.create(5.5, -0.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-hatchet-compartment-floor-03d.img",
                    pos: v2.create(14.5, -3.75),
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
                        v2.create(19, 9.5),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hatchet-compartment-ceiling-03.img",
                    pos: v2.create(0, 0),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_25",
                pos: v2.create(1.5, -4),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_18",
                pos: v2.create(12, 3),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_10",
                pos: v2.create(1.5, 6.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_21",
                pos: v2.create(-10.5, 10),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(-16, -5),
                scale: 0.85,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(3, -0.5),
                scale: 0.85,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_06",
                pos: v2.create(-11.75, -1.05),
                scale: 0.85,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(-7, -1.05),
                scale: 0.85,
                ori: 0,
            },
            {
                type: "case_03",
                pos: v2.create(-2.5, 6.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-7, 6.75),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-11, 5.5),
                scale: 0.9,
                ori: 0,
            },
        ],
    },
    bunker_eye_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 7.5),
                        v2.create(2, 3.25),
                    ),
                    color: 0x6a0000,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 7.75),
                            v2.create(2, 3.25),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-generic-floor-01.img",
                    pos: v2.create(0, 7.5),
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
                        v2.create(0, 8.25),
                        v2.create(2, 3.25),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-generic-ceiling-01.img",
                    pos: v2.create(0, 7.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
        puzzle: {
            name: "bunker_eye_01",
            completeUseType: "eye_door_01",
            completeOffDelay: 1,
            completeUseDelay: 2,
            errorResetDelay: 1,
            pieceResetDelay: 2,
            sound: { fail: "door_error_01", complete: "" },
        },
        mapObjects: [
            {
                type: "metal_wall_ext_6",
                pos: v2.create(0, 5.3),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_7",
                pos: v2.create(-2.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_7",
                pos: v2.create(2.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bush_01",
                pos: v2.create(5, 23),
                scale: 1.2,
                ori: 0,
            },
        ],
    },
    bunker_eye_sublevel_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(0, -12), v2.create(14, 17)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-eye-chamber-floor-01a.img",
                    pos: v2.create(0, -8.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-bunker-eye-chamber-floor-01b.img",
                    pos: v2.create(13, -23),
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
                        v2.create(0, -12),
                        v2.create(14, 17),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-eye-chamber-ceiling-01.img",
                    pos: v2.create(0, -12),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
            vision: { dist: 5, width: 3 },
        },
        puzzle: {
            name: "bunker_eye_02",
            completeUseType: "vault_door_eye",
            completeOffDelay: 1,
            completeUseDelay: 5.25,
            errorResetDelay: 1,
            pieceResetDelay: 10,
            sound: {
                fail: "door_error_01",
                complete: "vault_change_02",
            },
        },
        mapObjects: [
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(0, 11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(3.5, 8),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(-7, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(7, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_34",
                pos: v2.create(-10.5, -10),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(13, -26.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_4",
                pos: v2.create(15.5, -23),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(13, -19.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_24",
                pos: v2.create(10.5, -5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_column_4x8",
                pos: v2.create(-7.5, -29),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_column_4x8",
                pos: v2.create(7.5, -29),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(-2, 5),
                scale: 1,
                ori: 3,
            },
            {
                type: "stone_04",
                pos: v2.create(12, -23),
                scale: 1,
                ori: 2,
            },
            {
                type: "stone_wall_int_4",
                pos: v2.create(9.4, -23),
                scale: 1,
                ori: 0,
            },
            {
                type: "recorder_01",
                pos: v2.create(7.5, 2),
                scale: 1,
                ori: 2,
            },
            {
                type: "control_panel_02b",
                pos: v2.create(-7, 1),
                scale: 1,
                ori: 1,
                puzzlePiece: "swine",
            },
            {
                type: "control_panel_02b",
                pos: v2.create(-7, -4),
                scale: 1,
                ori: 1,
                puzzlePiece: "egg",
            },
            {
                type: "control_panel_02b",
                pos: v2.create(-7, -9),
                scale: 1,
                ori: 1,
                puzzlePiece: "storm",
            },
            {
                type: "control_panel_02b",
                pos: v2.create(-7, -14),
                scale: 1,
                ori: 1,
                puzzlePiece: "caduceus",
            },
            {
                type: "control_panel_02b",
                pos: v2.create(-7, -19),
                scale: 1,
                ori: 1,
                puzzlePiece: "crossing",
            },
            {
                type: "control_panel_02b",
                pos: v2.create(-7, -24),
                scale: 1,
                ori: 1,
                puzzlePiece: "conch",
            },
            {
                type: "control_panel_02b",
                pos: v2.create(7, -4),
                scale: 1,
                ori: 3,
                puzzlePiece: "cloud",
            },
            {
                type: "control_panel_02b",
                pos: v2.create(7, -9),
                scale: 1,
                ori: 3,
                puzzlePiece: "hydra",
            },
            {
                type: "control_panel_02b",
                pos: v2.create(7, -14),
                scale: 1,
                ori: 3,
                puzzlePiece: "hatchet",
            },
            {
                type: "control_panel_02b",
                pos: v2.create(7, -19),
                scale: 1,
                ori: 3,
                puzzlePiece: "harpsichord",
            },
            {
                type: "candle_lit_02",
                pos: v2.create(0, -1.5),
                scale: 0.75,
                ori: 0,
            },
            {
                type: "candle_lit_02",
                pos: v2.create(0, -11.5),
                scale: 0.75,
                ori: 0,
            },
            {
                type: "candle_lit_02",
                pos: v2.create(0, -21.5),
                scale: 0.75,
                ori: 0,
            },
            {
                type: "vault_door_eye",
                pos: v2.create(3.5, -30),
                scale: 1,
                ori: 1,
            },
            {
                type: "bunker_eye_compartment_01",
                pos: v2.create(0, -39),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_eye_compartment_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(10, 10)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-eye-compartment-floor-01.img",
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
                        v2.create(0, 0),
                        v2.create(10, 10),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-eye-compartment-ceiling-01.img",
                    pos: v2.create(0, 0),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(10.5, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_20",
                pos: v2.create(-10.5, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_18",
                pos: v2.create(0, -10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "loot_tier_eye_02",
                pos: v2.create(0, -3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "recorder_02",
                pos: v2.create(-7, -7),
                scale: 1,
                ori: 2,
            },
        ],
    },
    bunker_twins_stairs_01: createBunkerStairs({
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 1),
                        v2.create(2, 3.25),
                    ),
                    color: 0x9c5110,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0.75),
                        v2.create(2, 3.25),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-twins-ceiling-01.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
            ],
        },
    }),
    bunker_twins_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [],
            imgs: [
                {
                    sprite: "map-bunker-vent-02.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [],
            vision: {
                dist: 5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [],
        },
        mapObjects: [
            {
                type: "bunker_twins_stairs_01",
                pos: v2.create(1, 13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_twins_stairs_01",
                pos: v2.create(-1, -13.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "bunker_twins_stairs_01",
                pos: v2.create(-18.5, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "bunker_twins_stairs_01",
                pos: v2.create(18.5, 0),
                scale: 1,
                ori: 3,
            },
            {
                type: "tree_01cb",
                pos: v2.create(-14.5, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_01cb",
                pos: v2.create(10.5, -13.5),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bunker_twins_sublevel_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    data: { isBright: true },
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(16, 11)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-twins-chamber-floor-01.img",
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
                        v2.create(0, 0),
                        v2.create(15.5, 10.5),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-twins-chamber-ceiling-01.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        puzzle: {
            name: "bunker_twins",
            completeUseType: "cobalt_wall_int_4",
            completeOffDelay: 1,
            completeUseDelay: 2,
            errorResetDelay: 1,
            pieceResetDelay: 6,
            sound: {
                fail: "door_error_01",
                complete: "",
            },
        },
        mapObjects: [
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(1, 17.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-2.5, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(4.5, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(-11.5, 11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_1_5",
                pos: v2.create(-6.75, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(16.5, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-16.5, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(-1, -17.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(2.5, -14),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-4.5, -14),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(11.5, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_30",
                pos: v2.create(-6.75, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-16.5, -9),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(16.5, -9),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(22.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(19, 3.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(19, -3.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(-22.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-19, 3.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-19, -3.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_door_locked_01",
                pos: v2.create(-1, 10.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "lab_door_locked_01",
                pos: v2.create(1, -10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "lab_door_locked_01",
                pos: v2.create(15.5, 2),
                scale: 1,
                ori: 2,
            },
            {
                type: "lab_door_locked_01",
                pos: v2.create(-15.5, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "class_shell_03",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "vat_01",
                pos: v2.create(-6.75, 6.75),
                scale: 1,
                ori: 3,
            },
            {
                type: "vat_01",
                pos: v2.create(-12.175, 6.75),
                scale: 1,
                ori: 3,
            },
            {
                type: "vat_01",
                pos: v2.create(6.75, -6.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "vat_01",
                pos: v2.create(12.175, -6.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "control_panel_03",
                pos: v2.create(2.5, -8.25),
                scale: 1,
                ori: 2,
            },
            {
                type: "barrel_01",
                pos: v2.create(-10, -8),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-13, -6),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "recorder_14",
                pos: v2.create(-2.5, 8.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "cobalt_wall_int_4",
                pos: v2.create(-12.5, -10.385),
                scale: 1,
                ori: 3,
            },
            {
                type: "cobalt_wall_int_4",
                pos: v2.create(12.5, 10.385),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(10, 8),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(13, 6),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "bunker_twins_compartment_01",
                pos: v2.create(-19.5, -18.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_twins_compartment_01",
                pos: v2.create(19.5, 18.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "button_01b",
                pos: v2.create(-12, 8.5),
                scale: 1,
                ori: 0,
                layer: 0,
                puzzlePiece: "sniper",
            },
            {
                type: "button_01g",
                pos: v2.create(8, -12.25),
                scale: 1,
                ori: 1,
                layer: 0,
                puzzlePiece: "scout",
            },
            {
                type: "switch_01",
                pos: v2.create(18, 3),
                scale: 1,
                ori: 2,
                layer: 0,
                puzzlePiece: "demo",
            },
            {
                type: "switch_01y",
                pos: v2.create(-15, -8.25),
                scale: 1,
                ori: 1,
                puzzlePiece: "assault",
            },
            {
                type: "switch_01o",
                pos: v2.create(5.5, 10),
                scale: 1,
                ori: 0,
                puzzlePiece: "tank",
            },
            {
                type: "switch_01p",
                pos: v2.create(15, 8.25),
                scale: 1,
                ori: 3,
                puzzlePiece: "medic",
            },
        ],
    },
    bunker_twins_compartment_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "bunker",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 2), v2.create(9, 8.75)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-twins-compartment-floor-01.img",
                    pos: v2.create(0, -2),
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
                        v2.create(0, 0.75),
                        v2.create(10, 7.75),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-bunker-hydra-compartment-ceiling-03.img",
                    pos: v2.create(0, 0),
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                    rot: 0,
                    mirrorX: true,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thicker_17",
                pos: v2.create(-10.5, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_18",
                pos: v2.create(0, -9),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_18",
                pos: v2.create(10.5, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_49",
                pos: v2.create(-2, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "case_09",
                pos: v2.create(6.5, -5.65),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "control_panel_03",
                pos: v2.create(-6.75, -5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "vat_03",
                pos: v2.create(-5, -0.5),
                scale: 1.25,
                ori: 0,
            },
        ],
    },
} as const satisfies Record<string, MapObjectDef>;

export const Bunkers = BunkerDefs