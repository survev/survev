import { collider } from "../../../utils/collider";
import { util } from "../../../utils/util";
import { v2 } from "../../../utils/v2";
import { randomObstacleType } from "../mapObjectHelpers"
import type {
    BuildingDef,
    MapObjectDef,
} from "../../mapObjectsTyping";

export function createBank<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(-16, 7),
                        v2.create(10.75, 11),
                    ),
                    color: 0x775529,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(6, 0),
                        v2.create(11.5, 18.25),
                    ),
                    color: 0x986d33,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(22, 4),
                        v2.create(4.5, 7.5),
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
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(6, -1),
                            v2.create(11.25, 18.25),
                        ),
                        collider.createAabbExtents(
                            v2.create(21.5, 4),
                            v2.create(4.75, 7.25),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-bank-floor-01.img",
                    pos: v2.create(0, 6.96),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-bank-floor-02.img",
                    pos: v2.create(9.5, -12.5),
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
                        v2.create(6, -1),
                        v2.create(11.25, 18.25),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(21.5, 4),
                        v2.create(4.75, 7.25),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-15, 6),
                        v2.create(10.75, 11),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(6, 1.25),
                        v2.create(15.25, 20),
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
            ],
        },
        mapObjects: [
            {
                type: "brick_wall_ext_23",
                pos: v2.create(-14, 17),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_23",
                pos: v2.create(-25.9, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_20",
                pos: v2.create(-15.5, -5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(-5, -7),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(-5, -16.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(-2.5, -19),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_7",
                pos: v2.create(6, -19),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(14.5, -19),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(17, -16.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_7",
                pos: v2.create(17, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(1, -19.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(11, -19.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(-5.25, -13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(17.25, -13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_9",
                pos: v2.create(22, -3),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_15",
                pos: v2.create(26, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_9",
                pos: v2.create(22, 11),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_7",
                pos: v2.create(17, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(14.5, 17),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_8",
                pos: v2.create(4.5, 17),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(-1, 17.25),
                scale: 1,
                ori: 1,
            },
            {
                type: e.vault || "vault_01",
                pos: v2.create(-12, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "bank_wall_int_4",
                pos: v2.create(-2.5, -5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bank_window_01",
                pos: v2.create(1, -5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bank_wall_int_3",
                pos: v2.create(4, -5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bank_wall_int_4",
                pos: v2.create(6, -3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bank_window_01",
                pos: v2.create(6, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "bank_wall_int_4",
                pos: v2.create(6, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bank_wall_int_4",
                pos: v2.create(8.5, 5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bank_window_01",
                pos: v2.create(12, 5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bank_wall_int_3",
                pos: v2.create(15, 5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bank_wall_int_5",
                pos: v2.create(17, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: "bank_wall_int_8",
                pos: v2.create(21.5, 4),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(17, -2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(17, 10.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "house_door_01",
                pos: v2.create(12.5, 17.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "vending_01",
                pos: v2.create(4.5, -16.9),
                scale: 1,
                ori: 2,
            },
            {
                type: "stand_01",
                pos: v2.create(7.65, -17),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ toilet_01: 5, toilet_02: 1 }),
                pos: v2.create(23.5, 0.5),
                scale: 1,
                ori: 3,
            },
            {
                type: randomObstacleType({ toilet_01: 5, toilet_02: 1 }),
                pos: v2.create(23.5, 7.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "stand_01",
                pos: v2.create(15, 15),
                scale: 1,
                ori: 3,
            },
            {
                type: "fire_ext_01",
                pos: v2.create(4.5, 16.15),
                scale: 1,
                ori: 3,
            },
            {
                type: "bush_02",
                pos: v2.create(-2.5, -16.25),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "bush_02",
                pos: v2.create(14.5, -16.25),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(19.75, 13.75),
                scale: 0.9,
                ori: 0,
                inheritOri: false,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1 }),
                pos: v2.create(12, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1, "": 1 }),
                pos: v2.create(1, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(-16.5, -12.5),
                scale: 1.1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-7.5, -7.25),
                scale: 0.85,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(21, -7),
                scale: 0.55,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(21, -16.25),
                scale: 0.55,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
export function createBankVault<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
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
                            v2.create(-3.5, 0),
                            v2.create(10, 10.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "",
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
                        v2.create(-3.5, 0),
                        v2.create(9.25, 10.5),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(-3.5, 0),
                        v2.create(10, 10.5),
                    ),
                },
            ],
            vision: {
                dist: 7.25,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [
                {
                    sprite: "map-building-vault-ceiling.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_thick_20",
                pos: v2.create(-12.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thick_20",
                pos: v2.create(-3.5, -9.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thick_20",
                pos: v2.create(-3.5, 9.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thick_6",
                pos: v2.create(5.5, -6.45),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thick_6",
                pos: v2.create(5.5, 6.45),
                scale: 1,
                ori: 0,
            },
            {
                type: "vault_door_main",
                pos: v2.create(6.5, 3.5),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({
                    deposit_box_01: 3,
                    deposit_box_02: e.gold_box || 1,
                }),
                pos: v2.create(-12.3, 5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    deposit_box_01: 3,
                    deposit_box_02: e.gold_box || 1,
                }),
                pos: v2.create(-12.3, -5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    deposit_box_01: 3,
                    deposit_box_02: e.gold_box || 1,
                }),
                pos: v2.create(-8, 9.3),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    deposit_box_01: 3,
                    deposit_box_02: e.gold_box || 1,
                }),
                pos: v2.create(-8, -9.3),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({
                    deposit_box_01: 3,
                    deposit_box_02: e.gold_box || 1,
                }),
                pos: v2.create(1, 9.3),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    deposit_box_01: 3,
                    deposit_box_02: e.gold_box || 1,
                }),
                pos: v2.create(1, -9.3),
                scale: 1,
                ori: 2,
            },
            {
                type: "crate_05",
                pos: v2.create(-3.5, 6.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_05",
                pos: v2.create(-3.5, -6.5),
                scale: 1,
                ori: 2,
            },
            {
                type: e.floor_loot || randomObstacleType({ loot_tier_vault_floor: 1 }),
                pos: v2.create(-3.5, 0),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
export function createBarn<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 12),
                        v2.create(5, 2),
                    ),
                    color: 0xbbb287,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, -2),
                        v2.create(24.5, 12.8),
                    ),
                    color: 0x3a3d23,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, -2), v2.create(28, 16.5)),
            collider.createAabbExtents(v2.create(0, 14), v2.create(7, 5)),
        ],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "house",
                    collision: [
                        collider.createAabbExtents(v2.create(0, -2), v2.create(25, 13.2)),
                        collider.createAabbExtents(v2.create(0, 12), v2.create(5.5, 2.5)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-barn-floor-01.img",
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
                        v2.create(0, -2),
                        v2.create(24.5, 12.8),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 12),
                        v2.create(5.5, 2.5),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(5.5, 18.5),
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
            ],
        },
        mapObjects: [
            {
                type: "brick_wall_ext_4",
                pos: v2.create(-24.5, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_3",
                pos: v2.create(-22.5, 10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_12",
                pos: v2.create(-24.5, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(-24.5, -13),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_3",
                pos: v2.create(-22.5, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(-24.75, 5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-24.75, -9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-19.5, 10.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(-19.5, -14.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_16",
                pos: v2.create(-10, 10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_16",
                pos: v2.create(10, 10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_16",
                pos: v2.create(-10, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(5, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(-5.5, 13),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(5.5, 13),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_3",
                pos: v2.create(-3.5, 14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_3",
                pos: v2.create(3.5, 14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(9.5, -14.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(2, 14.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(-2, -14.75),
                scale: 1,
                ori: 3,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(24.5, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_3",
                pos: v2.create(22.5, 10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_13",
                pos: v2.create(17.5, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_19",
                pos: v2.create(24.5, -5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_1",
                pos: v2.create(23.5, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(24.75, 5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(19.5, 10.75),
                scale: 1,
                ori: 1,
            },
            {
                type: e.bonus_room || "panicroom_01",
                pos: v2.create(19.5, -8),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_6",
                pos: v2.create(-21, 0.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_6",
                pos: v2.create(-21, -4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_5",
                pos: v2.create(-11.5, 0.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_2",
                pos: v2.create(-13, -4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_7",
                pos: v2.create(-6.5, -4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_8",
                pos: v2.create(-11.5, -10),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_8",
                pos: v2.create(-7.5, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_5",
                pos: v2.create(-3.5, -11.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_7",
                pos: v2.create(10.5, 0.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_5",
                pos: v2.create(14.5, 7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_13",
                pos: v2.create(14.5, -7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_4",
                pos: v2.create(17, -1.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(-18, -4.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_door_01",
                pos: v2.create(-18, 0.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_door_01",
                pos: v2.create(-3.5, -5),
                scale: 1,
                ori: 2,
            },
            {
                type: "house_door_01",
                pos: v2.create(14.5, 1),
                scale: 1,
                ori: 0,
            },
            {
                type: e.bonus_door,
                pos: v2.create(23, -1.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_column_1",
                pos: v2.create(-8, 1),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_column_1",
                pos: v2.create(-11, -5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_column_1",
                pos: v2.create(15, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ toilet_01: 5, toilet_02: 1 }),
                pos: v2.create(-7.5, -12),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ drawers_01: 7, drawers_02: 1 }),
                pos: v2.create(-12.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ drawers_01: 7, drawers_02: 1 }),
                pos: v2.create(-5.5, 7.25),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ drawers_01: 7, drawers_02: 1 }),
                pos: v2.create(-13.5, -9.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "stand_01",
                pos: v2.create(16.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "stand_01",
                pos: v2.create(3.5, 12.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "table_01",
                pos: v2.create(8, -8),
                scale: 1,
                ori: 0,
            },
            {
                type: "oven_01",
                pos: v2.create(12.25, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "refrigerator_01",
                pos: v2.create(8.75, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bush_02",
                pos: v2.create(-22, -2),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "bush_02",
                pos: v2.create(12, 8),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1, "": 1 }),
                pos: v2.create(-19, -9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1, "": 1 }),
                pos: v2.create(-19, 5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_1",
                pos: v2.create(0, 5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.porch_01 || "",
                pos: v2.create(-4, 17),
                scale: 0.9,
                ori: 2,
            },
            {
                type: e.porch_01 || "",
                pos: v2.create(4, 17),
                scale: 0.9,
                ori: 2,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
export function createBarnBasement<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(v2.create(-3, 0), v2.create(12, 7)),
                        collider.createAabbExtents(v2.create(12, -3.5), v2.create(3, 2)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-barn-basement-floor-01.img",
                    pos: v2.create(5.5, -0.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(v2.create(2, 0), v2.create(6, 7)),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(11, -3.5),
                        v2.create(3.5, 2),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-building-barn-basement-ceiling-01.img",
                    pos: v2.create(5, 0),
                    scale: 1,
                    alpha: 1,
                    tint: 6182731,
                },
            ],
        },
        mapObjects: [
            {
                type: "house_door_02",
                pos: v2.create(13.5, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(12.5, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_thicker_11",
                pos: v2.create(15, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_column_5x10",
                pos: v2.create(7, 2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_thicker_21",
                pos: v2.create(-6, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_thicker_13",
                pos: v2.create(-15, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_thicker_30",
                pos: v2.create(1.5, -7),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_3",
                pos: v2.create(-4, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "stone_wall_int_4",
                pos: v2.create(-4, -0.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "concrete_wall_ext_3",
                pos: v2.create(-4, -4),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_barn_melee",
                pos: v2.create(0.5, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bookshelf_01",
                pos: v2.create(1, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.basement || "barn_basement_floor_02",
                pos: v2.create(-8, 0),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
export function createBridgeLarge<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(31.5, 8),
                    ),
                    color: 0x4f4f4f,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-14, -9.5),
                        v2.create(2.5, 1.5),
                    ),
                    color: 0x373737,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(14, -9.5),
                        v2.create(2.5, 1.5),
                    ),
                    color: 0x373737,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-14, 9.5),
                        v2.create(2.5, 1.5),
                    ),
                    color: 0x373737,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(14, 9.5),
                        v2.create(2.5, 1.5),
                    ),
                    color: 0x373737,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(31.5, 8)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-bridge-lg-floor.img",
                    pos: v2.create(-15.75, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-bridge-lg-floor.img",
                    pos: v2.create(15.75, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                    mirrorY: true,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(16.5, 7),
                    ),
                },
            ],
            vision: { dist: 10 },
            imgs: [
                {
                    sprite: "map-building-bridge-lg-ceiling.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObjects: [
            {
                type: "bridge_rail_12",
                pos: v2.create(-22.5, 7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bridge_rail_12",
                pos: v2.create(-22.5, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bridge_rail_12",
                pos: v2.create(22.5, 7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bridge_rail_12",
                pos: v2.create(22.5, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_column_5x4",
                pos: v2.create(-14, -9),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_column_5x4",
                pos: v2.create(-14, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_column_5x4",
                pos: v2.create(14, -9),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_column_5x4",
                pos: v2.create(14, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_ext_5",
                pos: v2.create(-9, 7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_5",
                pos: v2.create(-9, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_5",
                pos: v2.create(9, 7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_5",
                pos: v2.create(9, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bridge_rail_3",
                pos: v2.create(-5, 7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bridge_rail_3",
                pos: v2.create(-5, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bridge_rail_3",
                pos: v2.create(5, 7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bridge_rail_3",
                pos: v2.create(5, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_7",
                pos: v2.create(0, 7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_7",
                pos: v2.create(0, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ loot_tier_1: 2, "": 1 }),
                pos: v2.create(-22, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 2, "": 1 }),
                pos: v2.create(22, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(-14, 2.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(-10, 5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(0, 4.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(0, -4.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "barrel_01",
                pos: v2.create(10, -5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(14, -2.75),
                scale: 1,
                ori: 1,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
export function createContainer(props: {
    tint?: number;
    loot_spawner_01?: string;
    loot_spawner_02?: string;
    mapTint?: number;
    mapDisplayType?: string;
    open?: boolean;
    ceilingImgs?: BuildingDef["ceiling_images"];
    ceilingSprite?: string;
}) {
    const t = [
        {
            type: "container_wall_top",
            pos: v2.create(0, 7.95),
            scale: 1,
            ori: 0,
        },
        {
            type: "container_wall_side",
            pos: v2.create(2.35, 2.1),
            scale: 1,
            ori: 0,
        },
        {
            type: "container_wall_side",
            pos: v2.create(-2.35, 2.1),
            scale: 1,
            ori: 0,
        },
        {
            type: props.loot_spawner_01 || "loot_tier_2",
            pos: v2.create(0, 3.25),
            scale: 1,
            ori: 0,
        },
        {
            type: props.loot_spawner_02 || randomObstacleType({ loot_tier_1: 2, "": 1 }),
            pos: v2.create(0, 0.05),
            scale: 1,
            ori: 0,
        },
    ];
    const r = [
        {
            type: "container_wall_side_open",
            pos: v2.create(2.35, 0),
            scale: 1,
            ori: 0,
        },
        {
            type: "container_wall_side_open",
            pos: v2.create(-2.35, 0),
            scale: 1,
            ori: 0,
        },
        {
            type: "loot_tier_2",
            pos: v2.create(0, -0.05),
            scale: 1,
            ori: 0,
        },
        {
            type: randomObstacleType({ loot_tier_1: 1, "": 1 }),
            pos: v2.create(0, 0.05),
            scale: 1,
            ori: 0,
        },
    ];
    return {
        type: "building",
        map: {
            display: true,
            color: props.mapTint || 0x29414e,
            scale: 1,
            displayType: props.mapDisplayType,
        },
        terrain: { grass: true, beach: true, riverShore: true },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        props.open
                            ? collider.createAabbExtents(
                                  v2.create(0, 0),
                                  v2.create(2.5, 11),
                              )
                            : collider.createAabbExtents(
                                  v2.create(0, 0),
                                  v2.create(2.5, 8),
                              ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: props.open
                        ? "map-building-container-open-floor.img"
                        : "map-building-container-floor-01.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: props.tint!,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: props.open
                        ? collider.createAabbExtents(
                              v2.create(0, 0),
                              v2.create(2.5, 5.75),
                          )
                        : collider.createAabbExtents(
                              v2.create(0, 2.25),
                              v2.create(2.5, 5.5),
                          ),
                    zoomOut: props.open
                        ? collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 11))
                        : collider.createAabbExtents(
                              v2.create(0, -0.5),
                              v2.create(2.5, 8.75),
                          ),
                },
            ],
            imgs: props.ceilingImgs! || [
                {
                    sprite: props.ceilingSprite!,
                    scale: 0.5,
                    alpha: 1,
                    tint: props.tint,
                },
            ],
        },
        mapObjects: props.open ? r : t,
    } satisfies BuildingDef;
}
// @HACK:
type ExtendedBuildingDef = BuildingDef & Record<string, string>;
export function createCabin<T extends ExtendedBuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0.5),
                        v2.create(18, 12),
                    ),
                    color: 0x3a5618,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, -13),
                        v2.create(17, 2),
                    ),
                    color: 0x612d10,
                },
            ],
        },
        terrain: {
            grass: true,
            beach: false,
            riverShore: true,
            nearbyRiver: {
                radMin: 0.75,
                radMax: 1.5,
                facingOri: 1,
            },
        },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "house",
                    collision: [
                        collider.createAabbExtents(v2.create(0, -1.5), v2.create(18, 14)),
                    ],
                },
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(v2.create(4, -14), v2.create(3, 2.5)),
                        collider.createAabbExtents(v2.create(-4, 13.5), v2.create(2, 1)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-cabin-floor.img",
                    pos: v2.create(0, -1),
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
                        v2.create(19, 12),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0.5),
                        v2.create(21, 14),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(4, -13),
                        v2.create(3, 2),
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
                    sprite: "map-chimney-01.img",
                    pos: v2.create(13, 2),
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
            {
                type: "brick_wall_ext_12",
                pos: v2.create(-12, 12),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(-2, 12.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_12",
                pos: v2.create(4, 12),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(11.5, 12.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(15.5, 12),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(-18.5, 9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-18.75, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(-18.5, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-18.75, -4),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(-18.5, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(-15.5, -11),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(-11.5, -11.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_12",
                pos: v2.create(-4, -11),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(2, -11.25),
                scale: 1,
                ori: 3,
            },
            {
                type: "brick_wall_ext_12",
                pos: v2.create(12, -11),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_15",
                pos: v2.create(18.5, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(18.75, -4),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(18.5, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.cabin_wall_int_5 || "cabin_wall_int_5",
                pos: v2.create(-10.5, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: e.cabin_wall_int_10 || "cabin_wall_int_10",
                pos: v2.create(-13, 2),
                scale: 1,
                ori: 1,
            },
            {
                type: e.cabin_wall_int_13 || "cabin_wall_int_13",
                pos: v2.create(-3.5, -4),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(-10.5, 2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(-4, 2),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ toilet_01: 5, toilet_02: 1 }),
                pos: v2.create(-16, 9),
                scale: 1,
                ori: 0,
            },
            {
                type: "stand_01",
                pos: v2.create(-12.5, 9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ drawers_01: 7, drawers_02: 1 }),
                pos: v2.create(-15, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "pot_01",
                pos: v2.create(-16, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bed_lg_01",
                pos: v2.create(-7, -6.75),
                scale: 1,
                ori: 2,
            },
            {
                type:
                    e.cabin_mount ||
                    randomObstacleType({
                        gun_mount_01: 50,
                        gun_mount_05: 50,
                        gun_mount_04: 10,
                        gun_mount_02: 10,
                        gun_mount_03: 1,
                    }),
                pos: v2.create(4, 10.65),
                scale: 1,
                ori: 0,
            },
            {
                type: "table_01",
                pos: v2.create(4, 6.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "stove_01",
                pos: v2.create(13, 2),
                scale: 1,
                ori: 3,
            },
            {
                type: "woodpile_01",
                pos: v2.create(13, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "pot_01",
                pos: v2.create(16, 9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "pot_01",
                pos: v2.create(16, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.porch_01 || "",
                pos: v2.create(-1, -13.5),
                scale: 0.9,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
export function createHut<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(7, 7),
                    ),
                    color: 0xe7a847,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, -18.9),
                        v2.create(2, 12),
                    ),
                    color: 0x5e2d03,
                },
            ],
        },
        terrain: {
            waterEdge: {
                dir: v2.create(0, 1),
                distMin: -8.5,
                distMax: 0,
            },
        },
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(7, 7)),
                        collider.createAabbExtents(v2.create(0, -18.9), v2.create(2, 12)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-hut-floor-01.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-hut-floor-02.img",
                    pos: v2.create(0, -18.9),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(v2.create(0, 0), v2.create(6, 6)),
                },
            ],
            vision: { width: 4 },
            imgs: [
                {
                    sprite: e.ceilingImg || "map-building-hut-ceiling-01.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
            destroy: {
                wallCount: 2,
                particle: "hutBreak",
                particleCount: 25,
                residue: "map-hut-res-01.img",
            },
        },
        mapObjects: [
            {
                type: "hut_wall_int_4",
                pos: v2.create(-4, -6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "hut_wall_int_4",
                pos: v2.create(4, -6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "hut_wall_int_5",
                pos: v2.create(-6.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "hut_window_open_01",
                pos: v2.create(-6.75, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "hut_wall_int_6",
                pos: v2.create(-6.5, -4),
                scale: 1,
                ori: 0,
            },
            {
                type: "hut_wall_int_12",
                pos: v2.create(0, 6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "hut_wall_int_14",
                pos: v2.create(6.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ pot_01: 2, "": 1 }),
                pos: v2.create(4.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ pot_01: 2, "": 1 }),
                pos: v2.create(4.5, -4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ pot_01: 2, "": 1 }),
                pos: v2.create(-4.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ pot_01: 2, "": 1 }),
                pos: v2.create(-4.5, -4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.specialLoot || "pot_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
export function createGreenhouse<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: { display: true, color: 0x1e737c, scale: 1 },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(15, 25)),
            collider.createAabbExtents(v2.create(-15, 9), v2.create(2.5, 4.5)),
            collider.createAabbExtents(v2.create(17.5, -7), v2.create(4.5, 2.5)),
        ],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(13, 20)),
                    ],
                },
                {
                    type: "house",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(2, 20)),
                    ],
                },
            ],
            imgs: e.floor_images || [
                {
                    sprite: "map-building-greenhouse-floor-01.img",
                    pos: v2.create(0, 10),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-building-greenhouse-floor-01.img",
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
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(12.5, 19.5),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(14, 22),
                    ),
                },
            ],
            vision: {
                dist: 7.5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: e.ceiling_images || [
                {
                    sprite: "map-building-greenhouse-ceiling-01.img",
                    pos: v2.create(0, -9.85),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-greenhouse-ceiling-01.img",
                    pos: v2.create(0, 9.85),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                    mirrorY: true,
                },
            ],
            destroy: {
                wallCount: 7,
                particle: "greenhouseBreak",
                particleCount: 60,
                residue: "",
                sound: "ceiling_break_02",
            },
        },
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
                type: randomObstacleType({
                    planter_01: 1,
                    planter_02: 1,
                    planter_03: 1,
                }),
                pos: v2.create(-4.5, 14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    planter_01: 1,
                    planter_02: 1,
                    planter_03: 1,
                }),
                pos: v2.create(-7, 2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    planter_01: 1,
                    planter_02: 1,
                    planter_03: 1,
                }),
                pos: v2.create(-7, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    planter_01: 1,
                    planter_02: 1,
                    planter_03: 1,
                }),
                pos: v2.create(-4.5, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    planter_01: 1,
                    planter_02: 1,
                    planter_03: 1,
                }),
                pos: v2.create(4.5, 14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    planter_01: 1,
                    planter_02: 1,
                    planter_03: 1,
                }),
                pos: v2.create(7, 2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    planter_01: 1,
                    planter_02: 1,
                    planter_03: 1,
                }),
                pos: v2.create(7, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    planter_01: 1,
                    planter_02: 1,
                    planter_03: 1,
                }),
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
                type: "bunker_structure_08",
                pos: v2.create(-9.5, -15.5),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
export function createMansion<T extends ExtendedBuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(-1.5, 20.5),
                        v2.create(12.5, 4.5),
                    ),
                    color: 0x845142,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-2, -23),
                        v2.create(3, 2.5),
                    ),
                    color: 0x845142,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-20.5, -22.5),
                        v2.create(10, 2),
                    ),
                    color: 0x764339,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(28, 1.5),
                        v2.create(3.75, 3),
                    ),
                    color: 0x6e6e6e,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-3.5, -2),
                        v2.create(28, 18.5),
                    ),
                    color: 0x5e392f,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(-3.5, -2),
                            v2.create(28, 18.5),
                        ),
                        collider.createAabbExtents(
                            v2.create(-1.5, 20.5),
                            v2.create(12.5, 4.5),
                        ),
                        collider.createAabbExtents(v2.create(0, 0), v2.create(20, 20)),
                    ],
                },
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(v2.create(-21, -17), v2.create(11, 8)),
                        collider.createAabbExtents(v2.create(-23, -6), v2.create(8, 3)),
                        collider.createAabbExtents(v2.create(-2, -24), v2.create(2, 3)),
                        collider.createAabbExtents(v2.create(28, 1.5), v2.create(3, 3)),
                    ],
                },
                {
                    type: "grass",
                    collision: [
                        collider.createAabbExtents(v2.create(-2, 4), v2.create(5, 5)),
                    ],
                },
                {
                    type: "house",
                    collision: [
                        collider.createAabbExtents(v2.create(1, 13), v2.create(2, 3.25)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-mansion-floor-01a.img",
                    pos: v2.create(-1.5, 22),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-mansion-floor-01b.img",
                    pos: v2.create(-3.5, -2),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-mansion-floor-01c.img",
                    pos: v2.create(28.5, 1.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-mansion-floor-01d.img",
                    pos: v2.create(-15, -24),
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
                        v2.create(-15, -22.4),
                        v2.create(17, 2.2),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(-15, -24.4),
                        v2.create(21, 4.2),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-3.5, -2),
                        v2.create(28, 18.5),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(-3.5, -2),
                        v2.create(28, 18.5),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-1.5, 20.6),
                        v2.create(12, 4.2),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(-9, 23.1),
                        v2.create(5, 6.7),
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
                    sprite: "map-building-mansion-ceiling.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObjects: [
            {
                type: "brick_wall_ext_9",
                pos: v2.create(-31.5, -16.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-31.75, -10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_19",
                pos: v2.create(-31.5, 0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-31.75, 11.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(-31.5, 15),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_17",
                pos: v2.create(-22.5, 16.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_9",
                pos: v2.create(-13.5, 20.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(-13, 24.9),
                scale: 1,
                ori: 3,
            },
            {
                type: "brick_wall_ext_19",
                pos: v2.create(0.5, 24.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_9",
                pos: v2.create(10.5, 20.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_13",
                pos: v2.create(17.5, 16.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(24.5, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(24.75, 9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_18",
                pos: v2.create(24.5, -1),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(24.75, -11.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_8",
                pos: v2.create(24.5, -17),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_7",
                pos: v2.create(20.5, -20.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(15.5, -20.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_14",
                pos: v2.create(7, -20.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(-4, -21),
                scale: 1,
                ori: 3,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(-7, -20.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_short_7",
                pos: v2.create(28.5, 4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_short_7",
                pos: v2.create(28.5, -1.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(-7, -20.5),
                scale: 1,
                ori: 1,
            },
            {
                type: e.mansion_column_1 || "mansion_column_1",
                pos: v2.create(-5, -24),
                scale: 1,
                ori: 1,
            },
            {
                type: e.mansion_column_1 || "mansion_column_1",
                pos: v2.create(1, -24),
                scale: 1,
                ori: 1,
            },
            {
                type: "saferoom_01",
                pos: v2.create(-25.5, 1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.mansion_wall_int_12 || "mansion_wall_int_12",
                pos: v2.create(-25, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(-19, -2.5),
                scale: 1,
                ori: 3,
            },
            {
                type: e.mansion_wall_int_1 || "mansion_wall_int_1",
                pos: v2.create(-30.5, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_03",
                pos: v2.create(-30.25, 5.5),
                scale: 1,
                ori: 3,
            },
            {
                type: e.mansion_wall_int_13 || "mansion_wall_int_13",
                pos: v2.create(-20.5, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: e.mansion_wall_int_7 || "mansion_wall_int_7",
                pos: v2.create(-19.5, 1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(-14.5, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: e.mansion_wall_int_6 || "mansion_wall_int_6",
                pos: v2.create(-14.5, 13),
                scale: 1,
                ori: 0,
            },
            {
                type: e.mansion_wall_int_6 || "mansion_wall_int_6",
                pos: v2.create(-14.5, -5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.mansion_wall_int_10 || "mansion_wall_int_10",
                pos: v2.create(-10, -8.5),
                scale: 1,
                ori: 1,
            },
            {
                type: e.mansion_wall_int_11 || "mansion_wall_int_11",
                pos: v2.create(-9.5, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_8",
                pos: v2.create(-7.5, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_8",
                pos: v2.create(-1.5, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_8",
                pos: v2.create(3.5, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_12",
                pos: v2.create(-2, 9.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "stairs_01",
                pos: v2.create(-4.5, 12),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(-7.5, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_10",
                pos: v2.create(3.5, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: "glass_wall_12",
                pos: v2.create(-2, -1.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(10.5, 16),
                scale: 1,
                ori: 2,
            },
            {
                type: e.mansion_wall_int_9 || "mansion_wall_int_9",
                pos: v2.create(10.5, 7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(10.5, -1),
                scale: 1,
                ori: 0,
            },
            {
                type: e.mansion_wall_int_8 || "mansion_wall_int_8",
                pos: v2.create(10.5, -5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.mansion_wall_int_9 || "mansion_wall_int_9",
                pos: v2.create(15.5, 4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: e.mansion_wall_int_9 || "mansion_wall_int_9",
                pos: v2.create(15.5, -1.5),
                scale: 1,
                ori: 1,
            },
            {
                type: e.mansion_wall_int_5 || "mansion_wall_int_5",
                pos: v2.create(19.5, 1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(24, 1.5),
                scale: 1,
                ori: 1,
            },
            {
                type: e.mansion_wall_int_5 || "mansion_wall_int_5",
                pos: v2.create(3.5, -8.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(6, -8.5),
                scale: 1,
                ori: 3,
            },
            {
                type: e.mansion_wall_int_11 || "mansion_wall_int_11",
                pos: v2.create(5.5, -14.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ bookshelf_01: 6, bookshelf_02: 1 }),
                pos: v2.create(-27.25, 7.15),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ bookshelf_01: 6, bookshelf_02: 1 }),
                pos: v2.create(-27.25, 14.85),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ drawers_01: 7, drawers_02: 1 }),
                pos: v2.create(-11.5, -11.75),
                scale: 1,
                ori: 3,
            },
            {
                type: "stand_01",
                pos: v2.create(-7.5, -10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "stand_01",
                pos: v2.create(3.5, -10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ bookshelf_01: 6, bookshelf_02: 1 }),
                pos: v2.create(7.25, -16.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "piano_01",
                pos: v2.create(14.9, -3.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "toilet_01",
                pos: v2.create(17, 1.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "refrigerator_01",
                pos: v2.create(22.15, 14.4),
                scale: 1,
                ori: 0,
            },
            {
                type: "oven_01",
                pos: v2.create(12.75, 6.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "oven_01",
                pos: v2.create(12.75, 10.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "table_02",
                pos: v2.create(15.75, -14.25),
                scale: 1,
                ori: 0,
            },
            {
                type: e.entry_loot || "",
                pos: v2.create(-2, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.decoration_02 || "loot_tier_mansion_floor",
                pos: v2.create(-2, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.decoration_02 || "",
                pos: v2.create(-21, 9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.decoration_02 || "",
                pos: v2.create(18, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.decoration_02 || "",
                pos: v2.create(6, 20.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.decoration_01 || "",
                pos: v2.create(-30.15, 15),
                scale: 0.8,
                ori: 0,
            },
            {
                type: e.decoration_01 || "",
                pos: v2.create(1.5, 11.5),
                scale: 1,
                ori: 2,
            },
            {
                type: e.decoration_01 || "",
                pos: v2.create(8.5, 22.5),
                scale: 1,
                ori: 3,
            },
            {
                type: e.decoration_01 || "",
                pos: v2.create(22.5, 14.5),
                scale: 1,
                ori: 3,
            },
            {
                type: e.decoration_01 || "",
                pos: v2.create(22.5, -18.5),
                scale: 1,
                ori: 2,
            },
            {
                type: e.tree || "tree_interior_01",
                pos: v2.create(-2, 4),
                scale: e.tree_scale || 0.6,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: e.tree_loot || "",
                pos: v2.create(-2.25, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: e.tree_loot || "",
                pos: v2.create(-1.75, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: e.tree_loot || "",
                pos: v2.create(-2, 4.25),
                scale: 1,
                ori: 0,
            },
            {
                type: e.tree_loot || "",
                pos: v2.create(-2, 3.75),
                scale: 1,
                ori: 0,
            },
            {
                type:
                    e.bush ||
                    randomObstacleType({
                        bush_01: 25,
                        bush_03: 1,
                        "": e.bush_chance || 0,
                    }),
                pos: v2.create(-4.75, 1.25),
                scale: 0.9,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type:
                    e.bush ||
                    randomObstacleType({
                        bush_01: 25,
                        bush_03: 1,
                        "": e.bush_chance || 0,
                    }),
                pos: v2.create(0.75, 1.25),
                scale: 0.9,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type:
                    e.bush ||
                    randomObstacleType({
                        bush_01: 25,
                        bush_03: 1,
                        "": e.bush_chance || 0,
                    }),
                pos: v2.create(-4.75, 6.75),
                scale: 0.9,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type:
                    e.bush ||
                    randomObstacleType({
                        bush_01: 25,
                        bush_03: 1,
                        "": e.bush_chance || 0,
                    }),
                pos: v2.create(0.75, 6.75),
                scale: 0.9,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: e.porch_01 || "bush_01",
                pos: v2.create(-8, -23),
                scale: 0.95,
                ori: 0,
            },
            {
                type: e.porch_01 || "bush_01",
                pos: v2.create(4, -23),
                scale: 0.95,
                ori: 0,
            },
            {
                type: "shack_01",
                pos: v2.create(-20.75, 22.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "crate_01",
                pos: v2.create(13.25, 19.25),
                scale: 0.9,
                ori: 0,
                inheritOri: false,
            },
            {
                type: e.tree || "tree_01",
                pos: v2.create(24, 24),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_02",
                pos: v2.create(27, -4),
                scale: 1,
                ori: 0,
            },
            {
                type: e.tree || "tree_01",
                pos: v2.create(29, -17.25),
                scale: 0.7,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
export function createMansionCellar<T extends BuildingDef>(
    e: Partial<
        T & {
            mansion_column_1?: string;
        }
    >,
): T {
    const t = {
        type: "building",
        map: { display: false },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: {
            surfaces: [
                {
                    type: "brick",
                    collision: [
                        collider.createAabbExtents(v2.create(18, 3), v2.create(7, 13)),
                        collider.createAabbExtents(v2.create(5, 0), v2.create(6, 10)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-mansion-gradient-01.img",
                    pos: v2.create(-3.75, 0.25),
                    scale: 4,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-mansion-cellar-01a.img",
                    pos: v2.create(11.5, 5.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-mansion-cellar-01b.img",
                    pos: v2.create(28.5, 1.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-mansion-cellar-01c.img",
                    pos: v2.create(11.5, -9),
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
                        v2.create(18, 3),
                        v2.create(7, 13),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(5, 1.5),
                        v2.create(6, 12),
                    ),
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
            {
                type: "brick_wall_ext_thicker_24",
                pos: v2.create(-2.5, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_thicker_8",
                pos: v2.create(0, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_thicker_7",
                pos: v2.create(5.5, -9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_thicker_9",
                pos: v2.create(11.5, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_thicker_7",
                pos: v2.create(17.5, -9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_thicker_5",
                pos: v2.create(21.5, -7.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_thicker_8",
                pos: v2.create(25.5, -5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_thicker_15",
                pos: v2.create(25.5, 11.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_thicker_16",
                pos: v2.create(16, 17.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_thicker_7",
                pos: v2.create(9.5, 12.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_thicker_5",
                pos: v2.create(5.5, 10.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_thicker_5",
                pos: v2.create(29.5, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_thicker_5",
                pos: v2.create(29.5, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "concrete_wall_ext_7",
                pos: v2.create(31.5, 1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_thicker_6",
                pos: v2.create(4.5, 15),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(1, 17.6),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ barrel_03: 9, barrel_04: 1 }),
                pos: v2.create(8.5, -9.53),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ barrel_03: 9, barrel_04: 1 }),
                pos: v2.create(11.5, -9.53),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ barrel_03: 9, barrel_04: 1 }),
                pos: v2.create(14.5, -9.53),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ barrel_03: 9, barrel_04: 1 }),
                pos: v2.create(12.75, 15.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ barrel_03: 9, barrel_04: 1 }),
                pos: v2.create(15.75, 15.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ barrel_03: 9, barrel_04: 1 }),
                pos: v2.create(18.75, 15.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(22.25, 14.25),
                scale: 0.75,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: randomObstacleType({ bookshelf_01: 7, bookshelf_02: 1 }),
                pos: v2.create(22.75, 8),
                scale: 1,
                ori: 3,
            },
            {
                type: e.mansion_column_1 || "mansion_column_1",
                pos: v2.create(5.5, 1.5),
                scale: 1,
                ori: 1,
            },
            {
                type: e.mansion_column_1 || "mansion_column_1",
                pos: v2.create(17.5, 1.5),
                scale: 1,
                ori: 1,
            },
            {
                type: e.mid_obs_01 || "barrel_02",
                pos: v2.create(8.5, 1.5),
                scale: 0.8,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(11.5, 1.5),
                scale: 0.8,
                ori: 0,
            },
            {
                type: e.mid_obs_01 || "barrel_02",
                pos: v2.create(14.5, 1.5),
                scale: 0.8,
                ori: 0,
            },
            {
                type: e.decoration_02 || "",
                pos: v2.create(16.5, 7.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.decoration_02 || "",
                pos: v2.create(11.5, -5.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.decoration_01 || "",
                pos: v2.create(0.5, -4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: e.decoration_01 || "",
                pos: v2.create(22.5, 14.5),
                scale: 1,
                ori: 3,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
export function createOutHouse<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: { display: true, color: 0x7c4c38, scale: 1 },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 1.4), v2.create(5.5, 6.5)),
        ],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 0.15),
                            v2.create(3.75, 4.75),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-outhouse-floor.img",
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
                    tint: 0xffffff,
                },
            ],
            destroy: {
                wallCount: 2,
                particleCount: 15,
                particle: "outhouseBreak",
                residue: "map-outhouse-res.img",
            },
        },
        mapObjects: [
            {
                type: "outhouse_wall_top",
                pos: v2.create(0, 4.46),
                scale: 1,
                ori: 0,
            },
            {
                type: "outhouse_wall_side",
                pos: v2.create(3.4, 1.73),
                scale: 1,
                ori: 0,
            },
            {
                type: "outhouse_wall_side",
                pos: v2.create(-3.4, 1.73),
                scale: 1,
                ori: 0,
            },
            {
                type: "outhouse_wall_bot",
                pos: v2.create(-2.65, -1.52),
                scale: 1,
                ori: 0,
            },
            {
                type: "outhouse_wall_bot",
                pos: v2.create(2.65, -1.52),
                scale: 1,
                ori: 0,
            },
            {
                type: e.obs || randomObstacleType({ toilet_01: 5, toilet_02: 1 }),
                pos: v2.create(0, 2),
                scale: 0.95,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

export function createTeahouse(params: { ceilingImgs?: BuildingDef["ceiling_images"] }) {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(14, 9),
                    ),
                    color: 0x465164,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(7.5, 3.75),
                    ),
                    color: 0x586881,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(9, -10.15),
                        v2.create(2, 1.5),
                    ),
                    color: 0x70390b,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-9, 10.15),
                        v2.create(2, 1.5),
                    ),
                    color: 0x70390b,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(14, 9)),
                        collider.createAabbExtents(
                            v2.create(9, -10.15),
                            v2.create(2, 1.5),
                        ),
                        collider.createAabbExtents(
                            v2.create(-9, 10.15),
                            v2.create(2, 1.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-teahouse-floor-01.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-teahouse-floor-02.img",
                    pos: v2.create(9, -10.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-teahouse-floor-02.img",
                    pos: v2.create(-9, 10.25),
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
                    zoomIn: collider.createAabbExtents(v2.create(0, 0), v2.create(12, 7)),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(14, 9),
                    ),
                },
            ],
            vision: { width: 4 },
            imgs: [
                {
                    sprite: "map-building-teahouse-ceiling-01.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                ...(params.ceilingImgs || []),
            ],
            destroy: {
                wallCount: 3,
                particle: "teahouseBreak",
                particleCount: 25,
                residue: "map-building-teahouse-res-01.img",
            },
        },
        mapObjects: [
            {
                type: "teahouse_window_open_01",
                pos: v2.create(-6.5, -6.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "teahouse_window_open_01",
                pos: v2.create(11.75, 1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "teahouse_wall_int_7",
                pos: v2.create(11.5, -3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "teahouse_wall_int_4",
                pos: v2.create(11.5, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "teahouse_door_01",
                pos: v2.create(-7, 6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "teahouse_wall_int_18",
                pos: v2.create(2, 6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "teahouse_wall_int_3",
                pos: v2.create(-9.5, -6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "teahouse_wall_int_12",
                pos: v2.create(1, -6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "teahouse_wall_int_14",
                pos: v2.create(-11.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "teahouse_door_01",
                pos: v2.create(7, -6.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "pot_03",
                pos: v2.create(9.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "pot_03",
                pos: v2.create(-9.5, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "pot_03",
                pos: v2.create(-9.5, -4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "case_06",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, params || {});
}

export function createTeaHouseComplex<T extends BuildingDef>(
    e: Partial<T> & { tea_house?: string },
): T {
    const t = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(24, 18)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(21, 15)),
                color: e.grass_color || 0x5c910a,
                roughness: 0.05,
                offsetDist: 0.25,
            },
        ],
        floor: {
            surfaces: [{ type: "grass", collision: [] }],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: e.tea_house || "teahouse_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_02",
                pos: v2.create(12, 11),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_02",
                pos: v2.create(-16, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: e.tree_small || "tree_07sp",
                pos: v2.create(-3, 12),
                scale: 0.9,
                ori: 0,
            },
            {
                type: e.tree_small || "tree_07sp",
                pos: v2.create(-15, 12),
                scale: 0.9,
                ori: 0,
            },
            {
                type: e.tree_large || randomObstacleType({ tree_08sp: 2, "": 1 }),
                pos: v2.create(-10, -13),
                scale: 1,
                ori: 0,
            },
            {
                type: e.tree_large || randomObstacleType({ tree_08sp: 2, "": 1 }),
                pos: v2.create(-17.5, 2.5),
                scale: 1.2,
                ori: 0,
            },
            {
                type: e.tree_large || randomObstacleType({ tree_08sp: 2, "": 1 }),
                pos: v2.create(18, -6.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.tree_large || randomObstacleType({ tree_08sp: 2, "": 1 }),
                pos: v2.create(17.5, 5),
                scale: 1.2,
                ori: 0,
            },
            {
                type: e.tree_small || "tree_07sp",
                pos: v2.create(3, -12),
                scale: 0.9,
                ori: 0,
            },
            {
                type: e.tree_small || "tree_07sp",
                pos: v2.create(15, -12),
                scale: 0.9,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

export function createPoliceStation<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(-21, -8),
                        v2.create(21.25, 14),
                    ),
                    color: 0x595959,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-24.5, 8.5),
                        v2.create(17.75, 9.75),
                    ),
                    color: 0x333542,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-3.5, 12),
                        v2.create(3.5, 6.25),
                    ),
                    color: 0x41495c,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(10.35, 0),
                        v2.create(10.5, 22),
                    ),
                    color: 0x333542,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(31.25, 12.5),
                        v2.create(10.75, 9.5),
                    ),
                    color: 0x333542,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-3.5, 2.5),
                        v2.create(2.25, 2.25),
                    ),
                    color: 0x604a40,
                },
                {
                    collider: collider.createCircle(v2.create(-30.5, -18), 1.5),
                    color: 0x7a7a7a,
                },
                {
                    collider: collider.createCircle(v2.create(-20.5, -10.5), 1.5),
                    color: 0x7a7a7a,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-38.5, -7),
                        v2.create(1.4, 3.1),
                    ),
                    color: 0xca9c63,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-7.5, -19.5),
                        v2.create(3.1, 1.4),
                    ),
                    color: 0xca9c63,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "tile",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(-24.5, 8.5),
                            v2.create(17.75, 9.75),
                        ),
                        collider.createAabbExtents(
                            v2.create(-3.5, 12),
                            v2.create(3.5, 6.25),
                        ),
                        collider.createAabbExtents(
                            v2.create(10.35, 0),
                            v2.create(10.5, 22),
                        ),
                        collider.createAabbExtents(
                            v2.create(31.25, 12.5),
                            v2.create(10.75, 9.5),
                        ),
                    ],
                },
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(-21.5, -13),
                            v2.create(21, 11.5),
                        ),
                        collider.createAabbExtents(v2.create(-3.5, 2), v2.create(3, 3.5)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-police-floor-01.img",
                    pos: v2.create(-9.5, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-police-floor-02.img",
                    pos: v2.create(33, 0),
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
                        v2.create(-24.5, 8.5),
                        v2.create(17.75, 9.75),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(-3.5, 12),
                        v2.create(3.5, 6.25),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(10.35, 0),
                        v2.create(10.5, 22),
                    ),
                },
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(31.25, 12.5),
                        v2.create(10.75, 9.5),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(12, 0),
                        v2.create(12.75, 26),
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
            ],
        },
        mapObjects: [
            {
                type: "brick_wall_ext_20",
                pos: v2.create(-42, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_41",
                pos: v2.create(-21, 18),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_7",
                pos: v2.create(-38, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_21",
                pos: v2.create(-18, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_7",
                pos: v2.create(-7, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_7",
                pos: v2.create(-4, 6),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_16",
                pos: v2.create(0, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-0.5, -11),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_10",
                pos: v2.create(0, -17.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(3.5, -22),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(6.5, -22.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_door_01",
                pos: v2.create(14.5, -22.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_6",
                pos: v2.create(17.5, -22),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_11",
                pos: v2.create(21, -17),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(21.5, -11.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_11",
                pos: v2.create(21, -2),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_20",
                pos: v2.create(31.5, 3),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_20",
                pos: v2.create(42, 12.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_33",
                pos: v2.create(25, 22),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(4.5, 22.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(2.5, 22),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(0, 20),
                scale: 1,
                ori: 0,
            },
            {
                type: "police_wall_int_2",
                pos: v2.create(-40.5, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "police_wall_int_3",
                pos: v2.create(-34, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "cell_door_01",
                pos: v2.create(-35.5, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "police_wall_int_8",
                pos: v2.create(-35, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "police_wall_int_3",
                pos: v2.create(-27, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "police_wall_int_8",
                pos: v2.create(-28, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "cell_door_01",
                pos: v2.create(-21.5, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "police_wall_int_3",
                pos: v2.create(-20, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "police_wall_int_8",
                pos: v2.create(-21, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "cell_door_01",
                pos: v2.create(-14.5, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "police_wall_int_3",
                pos: v2.create(-13, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "police_wall_int_8",
                pos: v2.create(-14, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "cell_door_01",
                pos: v2.create(-7.5, 8),
                scale: 1,
                ori: 1,
            },
            {
                type: "police_wall_int_6",
                pos: v2.create(-7, 9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "police_wall_int_7",
                pos: v2.create(-4, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_02",
                pos: v2.create(-7, 17.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "police_wall_int_4",
                pos: v2.create(2.5, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: "bank_window_01",
                pos: v2.create(6, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: "police_wall_int_6",
                pos: v2.create(10.5, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: "bank_window_01",
                pos: v2.create(15, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: "police_wall_int_4",
                pos: v2.create(18.5, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(21, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "police_wall_int_10",
                pos: v2.create(21, 12.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(21, 21.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "metal_wall_ext_10",
                pos: v2.create(35.5, 4),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ locker_01: 8, locker_02: 1 }),
                pos: v2.create(33, 4.15),
                scale: 1,
                ori: 2,
            },
            {
                type: "metal_wall_ext_10",
                pos: v2.create(35.5, 21),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ locker_01: 8, locker_02: 1 }),
                pos: v2.create(33, 20.85),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ locker_01: 8, locker_02: 1 }),
                pos: v2.create(38, 20.85),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_18",
                pos: v2.create(41, 12.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ locker_01: 8, locker_02: 1 }),
                pos: v2.create(40.85, 7.5),
                scale: 1,
                ori: 3,
            },
            {
                type: randomObstacleType({ locker_01: 8, locker_02: 1 }),
                pos: v2.create(40.85, 17.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "metal_wall_ext_thicker_10",
                pos: v2.create(35.5, 12.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({ locker_01: 8, locker_02: 1 }),
                pos: v2.create(38, 11.35),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ locker_01: 8, locker_02: 1 }),
                pos: v2.create(33, 13.65),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ toilet_03: 5, toilet_04: 1 }),
                pos: v2.create(-37, 1),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ toilet_03: 5, toilet_04: 1 }),
                pos: v2.create(-23, 1),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ toilet_03: 5, toilet_04: 1 }),
                pos: v2.create(-16, 1),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({ toilet_03: 5, toilet_04: 1 }),
                pos: v2.create(-9, 1),
                scale: 1,
                ori: 2,
            },
            {
                type: "control_panel_01",
                pos: v2.create(-4.5, 9.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_06",
                pos: v2.create(-24.5, 20.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(14.5, 12.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(18.75, 12.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "fire_ext_01",
                pos: v2.create(21.85, 12.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(10.5, 1.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "vending_01",
                pos: v2.create(2, -6.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "stand_01",
                pos: v2.create(2, -14.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "bush_01",
                pos: v2.create(2.5, -19.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "bush_01",
                pos: v2.create(18.5, -19.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: randomObstacleType({ loot_tier_police_floor: 1 }),
                pos: v2.create(-38.5, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1 }),
                pos: v2.create(-31.5, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1 }),
                pos: v2.create(-24.5, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1 }),
                pos: v2.create(-17.5, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1 }),
                pos: v2.create(-10.5, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-3.5, 2.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "sandbags_01",
                pos: v2.create(-38.5, -7),
                scale: 1,
                ori: 3,
            },
            {
                type: "sandbags_01",
                pos: v2.create(-7.5, -19.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-30.5, -18),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-20.5, -10.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(39, -6),
                scale: 0.8,
                ori: 0,
            },
            {
                type: "tree_01",
                pos: v2.create(28, -17.5),
                scale: 0.8,
                ori: 0,
            },
            {
                type: "hedgehog_01",
                pos: v2.create(39, -17.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(24.5, -0.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: true,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

export function createHouseRed<T extends ExtendedBuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: { display: true, color: 0x621c1c, scale: 1 },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(19, 17.5)),
        ],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "house",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(14.5, 13)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-house-floor-01.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(-1, 14.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(0, -14.5),
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
                        v2.create(14.5, 13),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(16.5, 15),
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
                    sprite: "map-building-house-ceiling.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObjects: [
            {
                type: "brick_wall_ext_12",
                pos: v2.create(-9, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_14",
                pos: v2.create(8, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(1, 13.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(-14.5, 10),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_10",
                pos: v2.create(-14.5, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(-14.5, -10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-14.75, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-14.75, -7),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(-12.5, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(-4.5, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(4.5, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(12.5, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(-8.5, -13.25),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_window_01",
                pos: v2.create(8.5, -13.25),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_door_01",
                pos: v2.create(-2, -13.25),
                scale: 1,
                ori: 3,
            },
            {
                type: "brick_wall_ext_8",
                pos: v2.create(14.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_9",
                pos: v2.create(14.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_2",
                pos: v2.create(14.5, -11.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(14.75, -9),
                scale: 1,
                ori: 2,
            },
            {
                type: "house_window_01",
                pos: v2.create(14.75, 3),
                scale: 1,
                ori: 2,
            },
            {
                type: e.house_wall_int_9 || "house_wall_int_9",
                pos: v2.create(-9.5, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: e.house_wall_int_5 || "house_wall_int_5",
                pos: v2.create(4.5, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: e.house_wall_int_9 || "house_wall_int_9",
                pos: v2.create(9.5, -4),
                scale: 1,
                ori: 1,
            },
            {
                type: e.house_wall_int_8 || "house_wall_int_8",
                pos: v2.create(5.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.house_wall_int_4 || "house_wall_int_4",
                pos: v2.create(8, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(4.5, -12.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(6, 2.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "house_door_01",
                pos: v2.create(14, 7),
                scale: 1,
                ori: 1,
            },
            {
                type: e.house_column_1 || "house_column_1",
                pos: v2.create(6, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.house_column_1 || "house_column_1",
                pos: v2.create(6, -2.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ toilet_01: 5, toilet_02: 1 }),
                pos: v2.create(8, 10),
                scale: 1,
                ori: 1,
            },
            {
                type: "stand_01",
                pos: v2.create(12.25, -2),
                scale: 1,
                ori: 3,
            },
            {
                type: randomObstacleType({ drawers_01: 7, drawers_02: 1 }),
                pos: v2.create(7.75, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: e.stand || "",
                pos: v2.create(-12.25, -3),
                scale: 1,
                ori: 1,
            },
            {
                type: "table_01",
                pos: v2.create(-11.25, 1.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "oven_01",
                pos: v2.create(-7, 11),
                scale: 1,
                ori: 0,
            },
            {
                type: "refrigerator_01",
                pos: v2.create(-7, 1),
                scale: 1,
                ori: 2,
            },
            {
                type: e.plant || "bush_02",
                pos: e.plant_pos || v2.create(-12, -10.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: e.porch_01 || "",
                pos: v2.create(4.5, -15.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: e.porch_01 || "",
                pos: v2.create(-5.25, 15.5),
                scale: 0.9,
                ori: 2,
            },
            {
                type: "loot_tier_1",
                pos: v2.create(0, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.plant_loot || "",
                pos: v2.create(-10.25, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.plant_loot || "",
                pos: v2.create(-10, -8.75),
                scale: 1,
                ori: 0,
            },
            {
                type: e.plant_loot || "",
                pos: v2.create(-9.75, -8.25),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

export function createHouseRed2<T extends ExtendedBuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: { display: true, color: 0x470f0f, scale: 1 },
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, -1), v2.create(19, 18.5)),
        ],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "house",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(14.5, 13)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-house-floor-02.img",
                    pos: v2.create(0, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(10, 14.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(0, -14.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(2.6, -14.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(5.2, -14.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(7.8, -14.5),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(0, -16.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(2.6, -16.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(5.2, -16.25),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 2,
                },
                {
                    sprite: "map-building-porch-01.img",
                    pos: v2.create(7.8, -16.25),
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
                        v2.create(14.5, 13),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(16.5, 15),
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
                    sprite: "map-building-house-ceiling.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xcfcfcf,
                    rot: 2,
                },
            ],
        },
        mapObjects: [
            {
                type: "brick_wall_ext_5",
                pos: v2.create(-12.5, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(-8.5, 13.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_15",
                pos: v2.create(0.5, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_3",
                pos: v2.create(13.5, 13),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(12, 13.25),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(-14.5, 10),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_10",
                pos: v2.create(-14.5, -0.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_4",
                pos: v2.create(-14.5, -10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-14.75, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(-14.75, -7),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(-12.5, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_5",
                pos: v2.create(-4.5, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_13",
                pos: v2.create(8.5, -13),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_window_01",
                pos: v2.create(-8.5, -13.25),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_door_01",
                pos: v2.create(-2, -13.25),
                scale: 1,
                ori: 3,
            },
            {
                type: "brick_wall_ext_8",
                pos: v2.create(14.5, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_9",
                pos: v2.create(14.5, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_2",
                pos: v2.create(14.5, -11.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_window_01",
                pos: v2.create(14.75, -9),
                scale: 1,
                ori: 2,
            },
            {
                type: "house_window_01",
                pos: v2.create(14.75, 3),
                scale: 1,
                ori: 2,
            },
            {
                type: e.house_wall_int_5 || "house_wall_int_5",
                pos: v2.create(-0.5, 10),
                scale: 1,
                ori: 0,
            },
            {
                type: e.house_wall_int_14 || "house_wall_int_14",
                pos: v2.create(-7, 3),
                scale: 1,
                ori: 1,
            },
            {
                type: e.house_wall_int_11 || "house_wall_int_11",
                pos: v2.create(-8.5, -2),
                scale: 1,
                ori: 1,
            },
            {
                type: e.house_wall_int_4 || "house_wall_int_4",
                pos: v2.create(12, 1),
                scale: 1,
                ori: 1,
            },
            {
                type: e.house_wall_int_4 || "house_wall_int_4",
                pos: v2.create(12, -7),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_door_01",
                pos: v2.create(-0.5, 3.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "house_door_01",
                pos: v2.create(-3.5, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.house_column_1 || "house_column_1",
                pos: v2.create(4, -3),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ toilet_01: 5, toilet_02: 1 }),
                pos: v2.create(-11.75, 0.5),
                scale: 1,
                ori: 1,
            },
            {
                type: e.stand || "",
                pos: v2.create(-12.5, 11),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ drawers_01: 7, drawers_02: 1 }),
                pos: v2.create(-3.75, 11),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ bookshelf_01: 7, bookshelf_02: 1 }),
                pos: v2.create(13, -3),
                scale: 1,
                ori: 3,
            },
            {
                type: "table_03",
                pos: v2.create(-8.5, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: "oven_01",
                pos: v2.create(-12.25, -11),
                scale: 1,
                ori: 2,
            },
            {
                type: "refrigerator_01",
                pos: v2.create(-4.5, -11),
                scale: 1,
                ori: 2,
            },
            {
                type: e.plant || "bush_02",
                pos: e.plant_pos || v2.create(2, 10.5),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: e.porch_01 || "",
                pos: v2.create(-4.5, -15.5),
                scale: 0.9,
                ori: 0,
            },
            {
                type: e.porch_01 || "",
                pos: v2.create(5.75, 15.5),
                scale: 0.9,
                ori: 2,
            },
            {
                type: "loot_tier_1",
                pos: v2.create(0, -4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.plant_loot || "",
                pos: v2.create(4.25, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.plant_loot || "",
                pos: v2.create(3.75, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.plant_loot || "",
                pos: v2.create(4, 8.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "grill_01",
                pos: v2.create(6, -15.25),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

export function createShack3<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(-7.75, 3),
                        v2.create(1, 2),
                    ),
                    color: 0x5e2d03,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(5, -4.75),
                        v2.create(2, 1),
                    ),
                    color: 0x5e2d03,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(1, 1.5),
                        v2.create(8, 5.5),
                    ),
                    color: 0x394842,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-10.65, 7),
                        v2.create(2, 12),
                    ),
                    color: 0x5e2d03,
                },
            ],
        },
        terrain: {},
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(v2.create(1, 1.5), v2.create(8, 5.5)),
                        collider.createAabbExtents(
                            v2.create(-10.65, 7),
                            v2.create(2, 12),
                        ),
                        collider.createAabbExtents(v2.create(-7.75, 3), v2.create(1, 2)),
                        collider.createAabbExtents(v2.create(5, -4.75), v2.create(2, 1)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-shack-floor-03.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-hut-floor-02.img",
                    pos: v2.create(-10.65, 7),
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
                        v2.create(1, 1.5),
                        v2.create(7.75, 5.25),
                    ),
                },
            ],
            vision: { width: 4 },
            imgs: [
                {
                    sprite: "map-building-shack-ceiling-03.img",
                    pos: v2.create(0.5, 0.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0x9f9f9f,
                },
            ],
            destroy: {
                wallCount: 3,
                particle: "shackGreenBreak",
                particleCount: 30,
                residue: "map-shack-res-03.img",
            },
        },
        bridgeLandBounds: [
            collider.createAabbExtents(v2.create(-1.75, -4.25), v2.create(11.25, 4.75)),
        ],
        bridgeWaterBounds: [
            collider.createAabbExtents(v2.create(-10.5, 15.5), v2.create(3.5, 6)),
        ],
        mapObjects: [
            {
                type: "shack_wall_ext_2",
                pos: v2.create(-6.5, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: "shack_wall_ext_14",
                pos: v2.create(1, 6.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "shack_wall_ext_10",
                pos: v2.create(8.5, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "shack_wall_ext_2",
                pos: v2.create(8, -3.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "shack_wall_ext_9",
                pos: v2.create(-1.5, -3.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "shack_wall_ext_5",
                pos: v2.create(-6.5, -1.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "pot_01",
                pos: v2.create(-4.25, -1.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "pot_01",
                pos: v2.create(-1.25, -1.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "table_01",
                pos: v2.create(5.5, 4),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-4.75, -5.75),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_20",
                pos: v2.create(-1, -5.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(-10.65, 16),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

export function createShack2<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: { display: true, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 0.9),
                            v2.create(5.6, 3.5),
                        ),
                    ],
                },
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(3.75, -4),
                            v2.create(2.25, 1.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-shack-floor-01.img",
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
                        v2.create(0, 0.9),
                        v2.create(5.6, 3.5),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0.8),
                        v2.create(5.9, 3.8),
                    ),
                },
            ],
            vision: { width: 4 },
            imgs: [
                {
                    sprite: "map-building-shack-ceiling-01.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
            destroy: {
                wallCount: 2,
                particle: "shackBreak",
                particleCount: 25,
                residue: "map-shack-res-01.img",
            },
        },
        mapObjects: [
            {
                type: "shack_wall_bot",
                pos: v2.create(-1.49, -2.4),
                scale: 1,
                ori: 0,
            },
            {
                type: "shack_wall_side_left",
                pos: v2.create(-5.55, 0.69),
                scale: 1,
                ori: 0,
            },
            {
                type: "shack_wall_top",
                pos: v2.create(-0.3, 4.33),
                scale: 1,
                ori: 0,
            },
            {
                type: "shack_wall_side_right",
                pos: v2.create(5.55, 0.95),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(7.9, 2.85),
                scale: 0.8,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(7.45, -0.9),
                scale: 0.85,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_2: 1 }),
                pos: v2.create(-2, 0.8),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1, "": 1 }),
                pos: v2.create(2, 0.8),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

export function createShack<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: { display: true, color: 0x3d432e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 1), v2.create(5, 4)),
                    ],
                },
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(v2.create(0, -4), v2.create(2, 1)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-shack-floor-02.img",
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
                        v2.create(0, 1),
                        v2.create(4.75, 3.75),
                    ),
                },
            ],
            vision: { width: 4 },
            imgs: [
                {
                    sprite: "map-building-shack-ceiling-02.img",
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
            destroy: {
                wallCount: 2,
                particle: "shackBreak",
                particleCount: 25,
                residue: "map-shack-res-02.img",
            },
        },
        mapObjects: [
            {
                type: "barn_wall_int_2",
                pos: v2.create(-3, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_2",
                pos: v2.create(3, -2.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barn_wall_int_8",
                pos: v2.create(-4.5, 1),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_8",
                pos: v2.create(4.5, 1),
                scale: 1,
                ori: 0,
            },
            {
                type: "barn_wall_int_8",
                pos: v2.create(0, 4.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(4, -4.5),
                scale: 0.8,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1 }),
                pos: v2.create(0, 1),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

export function createWarehouse<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(27, 0),
                        v2.create(3, 12.25),
                    ),
                    color: 0x999999,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-27, 0),
                        v2.create(3, 12.25),
                    ),
                    color: 0x999999,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(24.5, 12.25),
                    ),
                    color: 0x5a433a,
                },
            ],
        },
        zIdx: 1,
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(35, 16)),
        ],
        floor: {
            surfaces: [
                {
                    type: "warehouse",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(32, 12.5)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-warehouse-floor-01.img",
                    pos: v2.create(-15.615, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-warehouse-floor-01.img",
                    pos: v2.create(15.615, 0),
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
                        v2.create(24.5, 12.25),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(32, 12.5),
                    ),
                },
            ],
            vision: { dist: 8, width: 5 },
            imgs: [
                {
                    sprite: "map-building-warehouse-ceiling-01.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObjects: [
            {
                type: "warehouse_wall_side",
                pos: v2.create(0, 11.9),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_wall_edge",
                pos: v2.create(-24.4, 8.2),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_wall_edge",
                pos: v2.create(24.4, 8.2),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_wall_side",
                pos: v2.create(0, -11.9),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_wall_edge",
                pos: v2.create(-24.4, -8.2),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_wall_edge",
                pos: v2.create(24.4, -8.2),
                scale: 1,
                ori: 0,
            },
            {
                type: e.topLeftObs,
                pos: v2.create(-21.25, 8.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: e.ignoreMapSpawnReplacement,
            },
            {
                type: "crate_04",
                pos: v2.create(-16.25, 8.75),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(-21.25, -8.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: e.ignoreMapSpawnReplacement,
            },
            {
                type: "barrel_01",
                pos: v2.create(-16.5, -8.75),
                scale: 0.9,
                ori: 0,
            },
            {
                type: e.topRightObs,
                pos: v2.create(21.25, 8.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: e.ignoreMapSpawnReplacement,
            },
            {
                type: "barrel_01",
                pos: v2.create(16.5, 8.75),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_04",
                pos: v2.create(16.25, -8.75),
                scale: 1,
                ori: 1,
            },
            {
                type: e.botRightObs,
                pos: v2.create(21.25, -8.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: e.ignoreMapSpawnReplacement,
            },
            {
                type: randomObstacleType({ crate_02: 1, crate_01: 3 }),
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: e.ignoreMapSpawnReplacement,
            },
            {
                type: "crate_01",
                pos: v2.create(5, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: e.ignoreMapSpawnReplacement,
            },
            {
                type: "crate_01",
                pos: v2.create(-5, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: e.ignoreMapSpawnReplacement,
            },
            {
                type: "crate_04",
                pos: v2.create(0, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_04",
                pos: v2.create(0, -5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.decoration_01 || "",
                pos: v2.create(-9, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: e.decoration_01 || "",
                pos: v2.create(9, -6),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

export function createWarehouse2<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(25, 0),
                        v2.create(3, 12.25),
                    ),
                    color: 0x999999,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-25, 0),
                        v2.create(3, 12.25),
                    ),
                    color: 0x999999,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(22.5, 12.25),
                    ),
                    color: 2240064,
                },
            ],
        },
        zIdx: 1,
        terrain: { grass: true, beach: false },
        floor: {
            surfaces: [
                {
                    type: "warehouse",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(0, 0),
                            v2.create(27.5, 12.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-warehouse-floor-02.img",
                    pos: v2.create(-13.72, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                    rot: 0,
                },
                {
                    sprite: "map-building-warehouse-floor-02.img",
                    pos: v2.create(13.72, 0),
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
                        v2.create(22, 12.25),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(27.5, 12.5),
                    ),
                },
            ],
            vision: { dist: 8, width: 5 },
            imgs: [
                {
                    sprite: "map-building-warehouse-ceiling-02.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_43",
                pos: v2.create(0, 12),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_8",
                pos: v2.create(-21.9, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_8",
                pos: v2.create(21.9, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_43",
                pos: v2.create(0, -12),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_8",
                pos: v2.create(-21.9, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_8",
                pos: v2.create(21.9, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(-18.75, 8.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "barrel_01",
                pos: v2.create(-14, 8.75),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(-18.75, -6),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1, "": 1 }),
                pos: v2.create(-19.5, -9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(18.75, 6),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1, "": 1 }),
                pos: v2.create(19.5, 9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(18.75, -8.75),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "barrel_01",
                pos: v2.create(14, -8.75),
                scale: 0.9,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_08: 24, crate_09: 1 }),
                pos: v2.create(0, 0),
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
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(0, -5),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_06",
                pos: v2.create(4, -5),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_06",
                pos: v2.create(-4, 5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(4.5, 0),
                scale: 0.9,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(-4.5, 0),
                scale: 0.9,
                ori: 0,
                inheritOri: false,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

export function createWarehouse3<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(27, 0),
                        v2.create(3, 12.25),
                    ),
                    color: 0x999999,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-27, 0),
                        v2.create(3, 12.25),
                    ),
                    color: 0x999999,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(24.5, 12.25),
                    ),
                    color: 0x5a433a,
                },
            ],
        },
        zIdx: 1,
        terrain: { grass: true, beach: false },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0), v2.create(35, 16)),
        ],
        floor: {
            surfaces: [
                {
                    type: "warehouse",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(32, 12.5)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-warehouse-floor-03.img",
                    pos: v2.create(-15.615, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-warehouse-floor-01.img",
                    pos: v2.create(15.615, 0),
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
                        v2.create(24.5, 12.25),
                    ),
                    zoomOut: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(32, 12.5),
                    ),
                },
            ],
            vision: { dist: 8, width: 5 },
            imgs: [
                {
                    sprite: "map-building-warehouse-ceiling-01.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        mapObjects: [
            {
                type: "house_door_02",
                pos: v2.create(-11.5, 9.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "warehouse_wall_side",
                pos: v2.create(0, 11.9),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_wall_edge_2",
                pos: v2.create(-24.4, 5.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_wall_edge",
                pos: v2.create(24.4, 8.2),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_wall_side",
                pos: v2.create(0, -11.9),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_wall_edge",
                pos: v2.create(24.4, -8.2),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_wall_int",
                pos: v2.create(-11.5, 10.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_column",
                pos: v2.create(-11.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_column",
                pos: v2.create(-11.5, 4.9),
                scale: 1,
                ori: 0,
            },
            {
                type: "rail_4",
                pos: v2.create(-11.5, 3),
                scale: 1,
                ori: 0,
            },
            {
                type: "bridge_rail_12",
                pos: v2.create(-18, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(17, 9.25),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(4.5, 4),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-27, 3),
                scale: 0.9,
                ori: 0,
            },
            {
                type: e.specialLoot || "case_08",
                pos: v2.create(-21.75, 8.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_01",
                pos: v2.create(21.25, 8.75),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: randomObstacleType({ crate_01: 4, crate_02: 1 }),
                pos: v2.create(16, -8.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(-3, 8.75),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(-8.25, -8.75),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: "crate_01",
                pos: v2.create(-13, -8.75),
                scale: 1,
                ori: 0,
                ignoreMapSpawnReplacement: true,
            },
            {
                type: e.crate || "crate_03",
                pos: v2.create(6.5, 9.25),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_04",
                pos: v2.create(2, 8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_04",
                pos: v2.create(10.75, -8.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_06",
                pos: v2.create(12.75, -1),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_06",
                pos: v2.create(1, 3),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_06",
                pos: v2.create(-17, -8.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "crate_06",
                pos: v2.create(-21, 2.25),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

const BaseBuildingDefs = {
    bank_01: createBank({ teamId: 1 }),
    barn_basement_stairs_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [],
            imgs: [
                {
                    sprite: "map-building-barn-basement-stairs.img",
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
                type: "concrete_wall_ext_8",
                pos: v2.create(4, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_column_4x8",
                pos: v2.create(-2.5, 2),
                scale: 1,
                ori: 0,
            },
            {
                type: "concrete_wall_column_4x9",
                pos: v2.create(0, -4),
                scale: 1,
                ori: 1,
            },
        ],
    },
    barn_basement_floor_01: createBarnBasement({}),
    barn_basement_floor_02: {
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
                type: "chest_04",
                pos: v2.create(-1, -0.5),
                scale: 1,
                ori: 1,
            },
        ],
    },
    barn_01: createBarn({ bonus_door: "house_door_02" }),
    barn_02: createBarn({
        bonus_room: "barn_basement_structure_01",
        bonus_door: "",
        map: { displayType: "barn_01" },
    }),
    bathhouse_01: (function (e) {
        const t = {
            type: "building",
            map: { display: false },
            terrain: { grass: true, beach: false },
            mapObstacleBounds: [],
            zIdx: 0,
            floor: {
                surfaces: [
                    {
                        type: "tile",
                        collision: [
                            collider.createAabbExtents(
                                v2.create(2, 9.5),
                                v2.create(20, 22),
                            ),
                            collider.createAabbExtents(
                                v2.create(0, 7.5),
                                v2.create(26, 48),
                            ),
                            collider.createAabbExtents(
                                v2.create(-26, -26),
                                v2.create(4, 3),
                            ),
                        ],
                    },
                ],
                imgs: [
                    {
                        sprite: "map-building-club-gradient-01.img",
                        pos: v2.create(-3.5, -13.5),
                        scale: 4,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-bathhouse-basement-01a.img",
                        pos: v2.create(-33.5, -26),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-bathhouse-basement-01b.img",
                        pos: v2.create(-10, -26.5),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-bathhouse-basement-01c.img",
                        pos: v2.create(18.5, -35.5),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-bathhouse-basement-01d.img",
                        pos: v2.create(23.02, -27.5),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-bathhouse-basement-01e.img",
                        pos: v2.create(2, 9),
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
                            v2.create(2, 9.5),
                            v2.create(20, 22),
                        ),
                        zoomOut: collider.createAabbExtents(
                            v2.create(2, 9.5),
                            v2.create(22, 24),
                        ),
                        zoom: 48,
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(0, 7.5),
                            v2.create(26, 48),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(-26, -26),
                            v2.create(4, 3),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(30, 0.5),
                            v2.create(7.5, 6.5),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(-26, 16.5),
                            v2.create(7.5, 6.5),
                        ),
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
            occupiedEmitters: [
                {
                    type: "bathhouse_steam",
                    pos: v2.create(30, 0.5),
                    dir: v2.create(-1, 0),
                    rot: 0,
                    scale: 1,
                    layer: 1,
                    parentToCeiling: false,
                },
                {
                    type: "bathhouse_steam",
                    pos: v2.create(-26, 16.5),
                    dir: v2.create(1, 0),
                    rot: 0,
                    scale: 1,
                    layer: 1,
                    parentToCeiling: false,
                },
            ],
            goreRegion: collider.createAabbExtents(v2.create(2, 8.5), v2.create(20, 23)),
            puzzle: {
                name: "club_02",
                completeUseType: "vault_door_bathhouse",
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
                    pos: v2.create(-36.5, -26),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_7",
                    pos: v2.create(-33.5, -23),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_7",
                    pos: v2.create(-33.5, -29),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_4",
                    pos: v2.create(-28, -22),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_6",
                    pos: v2.create(-27.5, -17.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_thicker_11",
                    pos: v2.create(-23.5, -13),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_11",
                    pos: v2.create(-24.5, -30),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_6",
                    pos: v2.create(-20.5, -34.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "club_wall_int_6",
                    pos: v2.create(-14.5, -34.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "club_wall_int_6",
                    pos: v2.create(-9.5, -34.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_column_4x24",
                    pos: v2.create(-8, -22.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_column_4x9",
                    pos: v2.create(2, -29),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_thicker_54",
                    pos: v2.create(5, -39),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_14",
                    pos: v2.create(26.5, -30.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_4",
                    pos: v2.create(23, -25),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_6",
                    pos: v2.create(19.5, -26.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_thicker_10",
                    pos: v2.create(16, -31),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_19",
                    pos: v2.create(9.5, -23),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_thicker_14",
                    pos: v2.create(18, -15),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_21",
                    pos: v2.create(23.5, 20),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_thicker_5",
                    pos: v2.create(23.5, -11),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_thicker_19",
                    pos: v2.create(15.5, 32),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_19",
                    pos: v2.create(-11.5, 32),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_5",
                    pos: v2.create(-19.5, 28),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_thicker_19",
                    pos: v2.create(-19.5, -2),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "house_door_05",
                    pos: v2.create(-18, -14),
                    scale: 1,
                    ori: 3,
                },
                {
                    type: "glass_wall_9",
                    pos: v2.create(-0.5, -14),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "glass_wall_9",
                    pos: v2.create(-9.5, -14),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "house_door_05",
                    pos: v2.create(8, -14),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "vault_door_bathhouse",
                    pos: v2.create(6, 34.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "vault_door_bathhouse",
                    pos: v2.create(-2, 34.5),
                    scale: 1,
                    ori: 3,
                },
                {
                    type: "switch_03",
                    pos: v2.create(8, 30.75),
                    scale: 1,
                    ori: 0,
                    puzzlePiece: "1",
                },
                {
                    type: "house_door_01",
                    pos: v2.create(2, -37.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "house_door_01",
                    pos: v2.create(-19.5, -24.5),
                    scale: 1,
                    ori: 2,
                },
                {
                    type: randomObstacleType({ toilet_01: 9, toilet_02: 1 }),
                    pos: v2.create(-17, -35.25),
                    scale: 1,
                    ori: 2,
                },
                {
                    type: randomObstacleType({ toilet_01: 9, toilet_02: 1 }),
                    pos: v2.create(-12, -35.25),
                    scale: 1,
                    ori: 2,
                },
                {
                    type: "towelrack_01",
                    pos: v2.create(-12, -25.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "bathhouse_column_1",
                    pos: v2.create(-13, -7.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "pot_04",
                    pos: v2.create(-13, -3),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "towelrack_01",
                    pos: v2.create(-13, 2.25),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bathhouse_column_1",
                    pos: v2.create(-13, 8.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "towelrack_01",
                    pos: v2.create(-13, 14.75),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "pot_04",
                    pos: v2.create(-13, 20),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "bathhouse_column_1",
                    pos: v2.create(-13, 24.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bathhouse_column_1",
                    pos: v2.create(17, -7.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "pot_04",
                    pos: v2.create(17, -3),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "towelrack_01",
                    pos: v2.create(17, 2.25),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bathhouse_column_1",
                    pos: v2.create(17, 8.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "towelrack_01",
                    pos: v2.create(17, 14.75),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "pot_04",
                    pos: v2.create(17, 20),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "bathhouse_column_1",
                    pos: v2.create(17, 24.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "locker_01",
                    pos: v2.create(-27.5, -28.85),
                    scale: 1,
                    ori: 2,
                },
                {
                    type: "locker_01",
                    pos: v2.create(-23.5, -28.85),
                    scale: 1,
                    ori: 2,
                },
                {
                    type: "locker_01",
                    pos: v2.create(10.5, -37.85),
                    scale: 1,
                    ori: 2,
                },
                {
                    type: "locker_01",
                    pos: v2.create(14.5, -37.85),
                    scale: 1,
                    ori: 2,
                },
                {
                    type: "locker_01",
                    pos: v2.create(18.5, -37.85),
                    scale: 1,
                    ori: 2,
                },
                {
                    type: "decal_bathhouse_pool_01",
                    pos: v2.create(2, 8.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "decal_club_01",
                    pos: v2.create(2, 8.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "decal_club_02",
                    pos: v2.create(2, 8.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "bathhouse_sideroom_01",
                    pos: v2.create(-26, 16.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "bathhouse_sideroom_01",
                    pos: v2.create(30, 0.5),
                    scale: 1,
                    ori: 2,
                },
                {
                    type: "bathhouse_sideroom_02",
                    pos: v2.create(2, 44),
                    scale: 1,
                    ori: 0,
                },
            ],
        };
        return util.mergeDeep(t, e || {});
    })({}),
    bathhouse_sideroom_01: (function (e) {
        const t = {
            type: "building",
            map: { display: true, shapes: [] },
            terrain: { grass: true, beach: false },
            mapObstacleBounds: [],
            zIdx: 1,
            floor: {
                surfaces: [
                    {
                        type: "shack",
                        collision: [
                            collider.createAabbExtents(
                                v2.create(0, 0),
                                v2.create(7.5, 6.5),
                            ),
                        ],
                    },
                ],
                imgs: [
                    {
                        sprite: "map-building-bathhouse-sideroom-01.img",
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
                            v2.create(7.5, 6.5),
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
                        sprite: "map-building-bathhouse-sideroom-ceiling-01.img",
                        scale: 1,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                ],
            },
            soundEmitters: [
                {
                    sound: "ambient_steam_01",
                    channel: "ambient",
                    pos: v2.create(0, 0),
                    range: { min: 9, max: 16 },
                    falloff: 1,
                    volume: 0.2,
                },
            ],
            healRegions: [
                {
                    collision: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(7.5, 6.5),
                    ),
                    healRate: 3,
                },
            ],
            mapObjects: [
                {
                    type: "concrete_wall_ext_thicker_15",
                    pos: v2.create(0.5, 7.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_15",
                    pos: v2.create(0.5, -7.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_19",
                    pos: v2.create(-8.5, 0),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_4",
                    pos: v2.create(7.5, 4),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_4",
                    pos: v2.create(7.5, -4),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "house_door_05",
                    pos: v2.create(7.5, -2),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "bathhouse_rocks_01",
                    pos: v2.create(0, 0),
                    scale: 1,
                    ori: 0,
                },
            ],
        };
        return util.mergeDeep(t, e || {});
    })({}),
    bathhouse_sideroom_02: (function (e) {
        const t = {
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
                                v2.create(14, 10),
                            ),
                        ],
                    },
                ],
                imgs: [
                    {
                        sprite: "map-building-bathhouse-sideroom-02.img",
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
                            v2.create(14, 9.5),
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
                        sprite: "map-building-bathhouse-sideroom-ceiling-02.img",
                        scale: 1,
                        alpha: 1,
                        tint: 0x4b3e2c,
                    },
                ],
            },
            mapObjects: [
                {
                    type: "metal_wall_ext_thick_12",
                    pos: v2.create(10, -9.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "metal_wall_ext_thick_12",
                    pos: v2.create(-10, -9.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "metal_wall_ext_thicker_19",
                    pos: v2.create(14.5, 1),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "metal_wall_ext_thicker_19",
                    pos: v2.create(-14.5, 1),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "metal_wall_ext_thicker_26",
                    pos: v2.create(0, 9),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "crate_05",
                    pos: v2.create(-2.5, -2.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "crate_05",
                    pos: v2.create(2.5, -1.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "crate_04",
                    pos: v2.create(-10.75, 5.25),
                    scale: 0.8,
                    ori: 0,
                },
                {
                    type: "crate_04",
                    pos: v2.create(10.75, 5.25),
                    scale: 0.8,
                    ori: 0,
                },
                {
                    type: "mil_crate_04",
                    pos: v2.create(-5.75, 5.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "mil_crate_04",
                    pos: v2.create(5.75, 5.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "case_07",
                    pos: v2.create(0, 5.25),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: randomObstacleType({
                        deposit_box_01: 3,
                        deposit_box_02: 1,
                    }),
                    pos: v2.create(-13.75, -4.8),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: randomObstacleType({
                        deposit_box_01: 3,
                        deposit_box_02: 1,
                    }),
                    pos: v2.create(-13.75, 0.45),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: randomObstacleType({
                        deposit_box_01: 3,
                        deposit_box_02: 1,
                    }),
                    pos: v2.create(13.75, -4.8),
                    scale: 1,
                    ori: 3,
                },
                {
                    type: randomObstacleType({
                        deposit_box_01: 3,
                        deposit_box_02: 1,
                    }),
                    pos: v2.create(13.75, 0.45),
                    scale: 1,
                    ori: 3,
                },
            ],
        };
        return util.mergeDeep(t, e || {});
    })({}),
    bridge_lg_01: createBridgeLarge({}),
    bridge_lg_under_01: {
        type: "building",
        map: { display: false },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: { surfaces: [], imgs: [] },
        ceiling: {
            zoomRegions: [],
            vision: {
                dist: 5.5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [],
        },
        mapObjects: [
            {
                type: "bridge_lg_under_column",
                pos: v2.create(-14, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "bridge_lg_under_column",
                pos: v2.create(14, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bridge_xlg_01: (function (e) {
        const t = {
            type: "building",
            map: {
                display: true,
                shapes: [
                    {
                        collider: collider.createAabbExtents(
                            v2.create(0, 0),
                            v2.create(38.5, 12),
                        ),
                        color: 0x2c292c,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(-16, -13),
                            v2.create(3, 1.5),
                        ),
                        color: 0x373737,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(16, -13),
                            v2.create(3, 1.5),
                        ),
                        color: 0x373737,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(-16, 13),
                            v2.create(3, 1.5),
                        ),
                        color: 0x373737,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(16, 13),
                            v2.create(3, 1.5),
                        ),
                        color: 0x373737,
                    },
                ],
            },
            terrain: { grass: true, beach: false },
            zIdx: 1,
            floor: {
                surfaces: [
                    {
                        type: "asphalt",
                        collision: [
                            collider.createAabbExtents(
                                v2.create(0, 0),
                                v2.create(38.5, 12),
                            ),
                        ],
                    },
                ],
                imgs: [
                    {
                        sprite: "map-building-bridge-xlg-floor.img",
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                ],
            },
            ceiling: { zoomRegions: [], imgs: [] },
            mapObjects: [
                {
                    type: "bridge_rail_20",
                    pos: v2.create(-26, 11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bridge_rail_20",
                    pos: v2.create(-26, -11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bridge_rail_20",
                    pos: v2.create(26, 11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bridge_rail_20",
                    pos: v2.create(26, -11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_column_9x4",
                    pos: v2.create(-16, -13),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_column_9x4",
                    pos: v2.create(-16, 13),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_column_9x4",
                    pos: v2.create(16, -13),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_column_9x4",
                    pos: v2.create(16, 13),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_5",
                    pos: v2.create(-9, 11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_5",
                    pos: v2.create(-9, -11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_5",
                    pos: v2.create(9, 11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_5",
                    pos: v2.create(9, -11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bridge_rail_3",
                    pos: v2.create(-5, 11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bridge_rail_3",
                    pos: v2.create(-5, -11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bridge_rail_3",
                    pos: v2.create(5, 11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bridge_rail_3",
                    pos: v2.create(5, -11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_7",
                    pos: v2.create(0, 11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_7",
                    pos: v2.create(0, -11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "loot_tier_1",
                    pos: v2.create(-25, 3),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "loot_tier_1",
                    pos: v2.create(25, 3),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "sandbags_01",
                    pos: v2.create(-14, 6.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "sandbags_01",
                    pos: v2.create(-20, -8),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "barrel_01",
                    pos: v2.create(-14, -8),
                    scale: 0.9,
                    ori: 0,
                },
                {
                    type: "crate_01",
                    pos: v2.create(0, 2.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "crate_01",
                    pos: v2.create(0, -2.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "crate_04",
                    pos: v2.create(0, 7.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "crate_04",
                    pos: v2.create(0, -7.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "crate_01",
                    pos: v2.create(-5, 0),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "crate_01",
                    pos: v2.create(5, 0),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "crate_01",
                    pos: v2.create(-27, -8),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "crate_01",
                    pos: v2.create(27, -8),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "sandbags_01",
                    pos: v2.create(14, 6.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "sandbags_01",
                    pos: v2.create(20, -8),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "barrel_01",
                    pos: v2.create(14, -8),
                    scale: 0.9,
                    ori: 0,
                },
            ],
        };
        return util.mergeDeep(t, e || {});
    })({}),
    bridge_xlg_under_01: {
        type: "building",
        map: { display: false },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: { surfaces: [], imgs: [] },
        ceiling: {
            zoomRegions: [],
            vision: {
                dist: 5.5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [],
        },
        mapObjects: [
            {
                type: "bridge_xlg_under_column",
                pos: v2.create(-14, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "bridge_xlg_under_column",
                pos: v2.create(14, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bridge_md_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(14, 3.5),
                    ),
                    color: 9322264,
                },
            ],
        },
        terrain: { grass: true, beach: false },
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(13.5, 3.5)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-bridge-md-floor.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "bridge_rail_28",
                pos: v2.create(0, 3),
                scale: 1,
                ori: 1,
            },
            {
                type: "bridge_rail_28",
                pos: v2.create(0, -3),
                scale: 1,
                ori: 1,
            },
            {
                type: "brick_wall_ext_3_0_low",
                pos: v2.create(-6, 4.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_3_0_low",
                pos: v2.create(6, 4.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_3_0_low",
                pos: v2.create(-6, -4.25),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_3_0_low",
                pos: v2.create(6, -4.25),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1, loot_tier_2: 1 }),
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    bridge_md_under_01: {
        type: "building",
        map: { display: false },
        terrain: { grass: true, beach: false },
        zIdx: 0,
        floor: { surfaces: [], imgs: [] },
        ceiling: {
            zoomRegions: [],
            vision: {
                dist: 5.5,
                width: 2.75,
                linger: 0.5,
                fadeRate: 6,
            },
            imgs: [],
        },
        mapObjects: [
            {
                type: "brick_wall_ext_11_5",
                pos: v2.create(-6, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "brick_wall_ext_11_5",
                pos: v2.create(6, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    cabin_01: createCabin({}),
    club_01: (function (e) {
        const t = {
            type: "building",
            map: {
                display: true,
                shapes: [
                    {
                        collider: collider.createAabbExtents(
                            v2.create(-29.25, -8.5),
                            v2.create(3.25, 2.5),
                        ),
                        color: 0xc6b392,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(-4, -8.5),
                            v2.create(22, 13.25),
                        ),
                        color: 0x5a070e,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(6, 18),
                            v2.create(12, 8.25),
                        ),
                        color: 0x5a070e,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(16, 16.5),
                            v2.create(2, 6.5),
                        ),
                        color: 0x5a070e,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(6.5, 7),
                            v2.create(2.5, 3),
                        ),
                        color: 0x5a070e,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(23.5, -7.5),
                            v2.create(5.75, 7),
                        ),
                        color: 0x5a070e,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(1.5, -24.5),
                            v2.create(8, 3.5),
                        ),
                        color: 0x5a070e,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(-1.5, 30.75),
                            v2.create(4.5, 4.5),
                        ),
                        color: 0x5a070e,
                    },
                    {
                        collider: collider.createAabbExtents(
                            v2.create(-21.5, 7),
                            v2.create(2.5, 3),
                        ),
                        color: 0x5a070e,
                    },
                ],
            },
            terrain: { grass: true, beach: false },
            zIdx: 1,
            mapGroundPatches: [
                {
                    bound: collider.createAabbExtents(
                        v2.create(-13.5, 11.5),
                        v2.create(16, 24.5),
                    ),
                    color: 0x8e8573,
                    order: 1,
                },
                {
                    bound: collider.createAabbExtents(
                        v2.create(-13.5, 11.5),
                        v2.create(15, 23.5),
                    ),
                    color: 0x595959,
                    order: 1,
                },
                {
                    bound: collider.createAabbExtents(v2.create(1.5, 7), v2.create(3, 3)),
                    color: 0x595959,
                    order: 1,
                },
                {
                    bound: collider.createAabbExtents(
                        v2.create(-12, 14.5),
                        v2.create(7.5, 0.25),
                    ),
                    color: 0xd7d7d7,
                    order: 1,
                    useAsMapShape: false,
                },
                {
                    bound: collider.createAabbExtents(
                        v2.create(-12, 21.5),
                        v2.create(7.5, 0.25),
                    ),
                    color: 0xd7d7d7,
                    order: 1,
                    useAsMapShape: false,
                },
                {
                    bound: collider.createAabbExtents(
                        v2.create(-12, 28.5),
                        v2.create(7.5, 0.25),
                    ),
                    color: 0xd7d7d7,
                    order: 1,
                    useAsMapShape: false,
                },
                {
                    bound: collider.createAabbExtents(
                        v2.create(15, 5),
                        v2.create(20, 30),
                    ),
                    color: 0x733818,
                    roughness: 0.05,
                    offsetDist: 0.5,
                },
            ],
            mapObstacleBounds: [],
            floor: {
                surfaces: [
                    {
                        type: "asphalt",
                        collision: [
                            collider.createAabbExtents(
                                v2.create(1.5, -24.5),
                                v2.create(5, 3.5),
                            ),
                            collider.createAabbExtents(
                                v2.create(-13, 20.25),
                                v2.create(16.5, 15.5),
                            ),
                            collider.createAabbExtents(
                                v2.create(-28, 0),
                                v2.create(1.5, 5.25),
                            ),
                        ],
                    },
                    {
                        type: "stone",
                        collision: [
                            collider.createAabbExtents(
                                v2.create(-29.5, -8.5),
                                v2.create(3, 2.5),
                            ),
                        ],
                    },
                    {
                        type: "carpet",
                        collision: [
                            collider.createAabbExtents(
                                v2.create(-4, -8.5),
                                v2.create(22, 13.25),
                            ),
                            collider.createAabbExtents(
                                v2.create(4.5, 18),
                                v2.create(10.5, 8.25),
                            ),
                            collider.createAabbExtents(
                                v2.create(16, 16.5),
                                v2.create(2, 6.5),
                            ),
                            collider.createAabbExtents(
                                v2.create(6.5, 7),
                                v2.create(2.5, 3),
                            ),
                            collider.createAabbExtents(
                                v2.create(23.5, -3),
                                v2.create(5.75, 2.5),
                            ),
                            collider.createAabbExtents(
                                v2.create(26.5, -7.5),
                                v2.create(2.5, 7),
                            ),
                        ],
                    },
                ],
                imgs: [
                    {
                        sprite: "map-building-club-floor-01a.img",
                        pos: v2.create(-30, -8.5),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-club-floor-01b.img",
                        pos: v2.create(-21.5, 8),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-club-floor-01c.img",
                        pos: v2.create(-4, -8.5),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-club-floor-01d.img",
                        pos: v2.create(1.5, -25),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-club-floor-01e.img",
                        pos: v2.create(24, -7.5),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-club-floor-01f.img",
                        pos: v2.create(6.5, 7),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-club-floor-01g.img",
                        pos: v2.create(6, 18),
                        scale: 0.5,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-club-floor-01h.img",
                        pos: v2.create(-1.5, 31.5),
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
                            v2.create(-4, -8.5),
                            v2.create(22, 13.25),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(4.5, 18),
                            v2.create(10.5, 8.25),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(16, 16.5),
                            v2.create(2, 6.75),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(6.5, 7),
                            v2.create(2.5, 3),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(-1.5, 30),
                            v2.create(3, 4),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(23.5, -3),
                            v2.create(5.75, 2.5),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(26.5, -7.5),
                            v2.create(2.5, 7),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(1.5, -24),
                            v2.create(5, 3),
                        ),
                    },
                    {
                        zoomIn: collider.createAabbExtents(
                            v2.create(-21.5, 7),
                            v2.create(2.5, 3),
                        ),
                    },
                    {
                        zoomOut: collider.createAabbExtents(
                            v2.create(1.5, -28),
                            v2.create(5.5, 2),
                        ),
                    },
                    {
                        zoomOut: collider.createAabbExtents(
                            v2.create(-21.5, 11),
                            v2.create(3.5, 2),
                        ),
                    },
                    {
                        zoomOut: collider.createAabbExtents(
                            v2.create(17, 25),
                            v2.create(3, 3),
                        ),
                    },
                    {
                        zoomOut: collider.createAabbExtents(
                            v2.create(17, 25),
                            v2.create(3, 3),
                        ),
                    },
                ],
                vision: {
                    dist: 7.5,
                    width: 2.5,
                    linger: 0.5,
                    fadeRate: 6,
                },
                imgs: [
                    {
                        sprite: "map-building-club-ceiling-01a.img",
                        pos: v2.create(-4.5, -8.5),
                        scale: 1,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-club-ceiling-01b.img",
                        pos: v2.create(24, -7.5),
                        scale: 1,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                    {
                        sprite: "map-building-club-ceiling-01c.img",
                        pos: v2.create(6, 22.5),
                        scale: 1,
                        alpha: 1,
                        tint: 0xffffff,
                    },
                ],
            },
            puzzle: {
                name: "club_01",
                completeUseType: "secret_door_club",
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
                    type: "concrete_wall_ext_7",
                    pos: v2.create(-30, -11.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_7",
                    pos: v2.create(-30, -5.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_5",
                    pos: v2.create(-24, 7.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_5",
                    pos: v2.create(-19, 7.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_3",
                    pos: v2.create(-25, 4.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_25",
                    pos: v2.create(-26, -8.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_9_5",
                    pos: v2.create(-21.75, -21.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "club_window_01",
                    pos: v2.create(-15.5, -21.75),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_11_5",
                    pos: v2.create(-8.25, -21.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_5",
                    pos: v2.create(-3, -24.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_5",
                    pos: v2.create(6, -24.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_13",
                    pos: v2.create(12, -21.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_13",
                    pos: v2.create(12, -21.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_6",
                    pos: v2.create(18, -18),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_column_7x10",
                    pos: v2.create(21, -10),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_4",
                    pos: v2.create(26.5, -14.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_10_5",
                    pos: v2.create(29, -9.75),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "club_window_01",
                    pos: v2.create(29.25, -3),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_1_5",
                    pos: v2.create(29, -0.75),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_11",
                    pos: v2.create(23, -0.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_5",
                    pos: v2.create(18, 2.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_8",
                    pos: v2.create(13.5, 4.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_6",
                    pos: v2.create(9, 7),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_8",
                    pos: v2.create(13.5, 9.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_13",
                    pos: v2.create(18, 15.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_thick_11",
                    pos: v2.create(9, 26),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_thicker_11",
                    pos: v2.create(2, 30.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_thicker_11",
                    pos: v2.create(-5, 30.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_thicker_4",
                    pos: v2.create(-1.5, 34.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "secret_door_club",
                    pos: v2.create(0.5, 26),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_16",
                    pos: v2.create(-6, 17),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_9",
                    pos: v2.create(-1, 9.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "concrete_wall_ext_6",
                    pos: v2.create(4, 7),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "concrete_wall_ext_23",
                    pos: v2.create(-8, 4.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "house_door_01",
                    pos: v2.create(-23.5, 4.5),
                    scale: 1,
                    ori: 3,
                },
                {
                    type: "house_door_01",
                    pos: v2.create(-2.5, -21.5),
                    scale: 1,
                    ori: 3,
                },
                {
                    type: "house_door_01",
                    pos: v2.create(5.5, -21.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "club_bar_small",
                    pos: v2.create(-16, -0.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "club_bar_large",
                    pos: v2.create(-7.5, -3.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "club_bar_back_large",
                    pos: v2.create(-8, 3.3),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "bottle_05",
                    pos: v2.create(-16.25, 1.25),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_04",
                    pos: v2.create(-16, -0.5),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_04",
                    pos: v2.create(-16, -2.25),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_05",
                    pos: v2.create(-14.5, -4),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_04",
                    pos: v2.create(-12.25, -3.5),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_04",
                    pos: v2.create(-9.5, -3.75),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_05",
                    pos: v2.create(-5.25, -2.75),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_04",
                    pos: v2.create(-5.5, -4.25),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "bottle_04",
                    pos: v2.create(-2.25, -3.5),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_05",
                    pos: v2.create(-3.25, 3.3),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_05",
                    pos: v2.create(-4.25, 3.3),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_04",
                    pos: v2.create(-6.5, 3.3),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_04",
                    pos: v2.create(-7.5, 3.3),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_04",
                    pos: v2.create(-8.5, 3.3),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_05",
                    pos: v2.create(-12.25, 3.3),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bottle_05",
                    pos: v2.create(-13.25, 3.3),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: randomObstacleType({ crate_14: 1, crate_14a: 1 }),
                    pos: v2.create(-12, 0.25),
                    scale: 0.85,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: randomObstacleType({ crate_14: 1, crate_14a: 1 }),
                    pos: v2.create(-7.75, 0.25),
                    scale: 0.85,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: randomObstacleType({ crate_14: 1, crate_14a: 1 }),
                    pos: v2.create(-3.5, 0.25),
                    scale: 0.85,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "couch_02",
                    pos: v2.create(-24, -15),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "couch_03",
                    pos: v2.create(-24, -19.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "couch_02b",
                    pos: v2.create(-19.5, -19.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "table_03",
                    pos: v2.create(-19, -14.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "decal_flyer_01",
                    pos: v2.create(-17.5, -13.25),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "couch_02b",
                    pos: v2.create(-7, -15),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "couch_03",
                    pos: v2.create(-7, -19.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "couch_02",
                    pos: v2.create(-11.5, -19.5),
                    scale: 1,
                    ori: 2,
                },
                {
                    type: "table_03",
                    pos: v2.create(-12, -14.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "club_wall_int_10",
                    pos: v2.create(12.5, -7.5),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "club_wall_int_10",
                    pos: v2.create(8, -13),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "couch_01",
                    pos: v2.create(13, -9.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: randomObstacleType({
                        crate_01: 1,
                        crate_14: 1,
                        crate_14a: 1,
                    }),
                    pos: v2.create(11, -13.5),
                    scale: 0.85,
                    ori: 0,
                    inheritOri: false,
                    ignoreMapSpawnReplacement: true,
                },
                {
                    type: randomObstacleType({
                        crate_01: 1,
                        crate_14: 1,
                        crate_14a: 1,
                    }),
                    pos: v2.create(15.25, -15.5),
                    scale: 0.85,
                    ori: 0,
                    inheritOri: false,
                    ignoreMapSpawnReplacement: true,
                },
                {
                    type: randomObstacleType({
                        crate_01: 1,
                        crate_14: 1,
                        crate_14a: 1,
                    }),
                    pos: v2.create(15.25, 1.75),
                    scale: 0.85,
                    ori: 0,
                    inheritOri: false,
                    ignoreMapSpawnReplacement: true,
                },
                {
                    type: "club_vault",
                    pos: v2.create(-1.5, 30.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "switch_01",
                    pos: v2.create(-5.5, 11.5),
                    scale: 1,
                    ori: 1,
                    puzzlePiece: "1",
                },
                {
                    type: "switch_01",
                    pos: v2.create(-5.5, 14.5),
                    scale: 1,
                    ori: 1,
                    puzzlePiece: "4",
                },
                {
                    type: "switch_01",
                    pos: v2.create(-5.5, 17.5),
                    scale: 1,
                    ori: 1,
                    puzzlePiece: "2",
                },
                {
                    type: "switch_01",
                    pos: v2.create(-5.5, 20.5),
                    scale: 1,
                    ori: 1,
                    puzzlePiece: "3",
                },
                {
                    type: "bookshelf_01",
                    pos: v2.create(-1.5, 24),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "crate_02",
                    pos: v2.create(10.75, 23),
                    scale: 0.75,
                    ori: 0,
                    inheritOri: false,
                    ignoreMapSpawnReplacement: true,
                },
                {
                    type: "decal_barrel_explosion",
                    pos: v2.create(17.5, 26.25),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "decal_plank_01",
                    pos: v2.create(17.25, 27.25),
                    scale: 0.5,
                    ori: 0,
                },
                {
                    type: "decal_plank_01",
                    pos: v2.create(17.5, 27.5),
                    scale: 0.5,
                    ori: 1,
                },
                {
                    type: "decal_plank_01",
                    pos: v2.create(19.5, 25.75),
                    scale: 0.5,
                    ori: 1,
                },
                {
                    type: "decal_plank_01",
                    pos: v2.create(18.75, 25.5),
                    scale: 0.5,
                    ori: 3,
                },
                {
                    type: "couch_01",
                    pos: v2.create(6.5, 11.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: randomObstacleType({
                        deposit_box_01: 3,
                        deposit_box_02: 1,
                    }),
                    pos: v2.create(-4.25, 29.55),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: randomObstacleType({
                        deposit_box_01: 3,
                        deposit_box_02: 1,
                    }),
                    pos: v2.create(1.25, 29.55),
                    scale: 1,
                    ori: 3,
                },
                {
                    type: "bathhouse_column_1",
                    pos: v2.create(-5.5, -24),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "bathhouse_column_1",
                    pos: v2.create(8.5, -24),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: randomObstacleType({
                        crate_03: 1,
                        barrel_01: 1,
                        barrel_02: 1,
                    }),
                    pos: v2.create(1.5, 7),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bush_01",
                    pos: v2.create(11.5, 7),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "barrel_01",
                    pos: v2.create(-13.75, 17),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "barrel_01",
                    pos: v2.create(-10.25, 18.25),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: randomObstacleType({
                        crate_01: 1,
                        crate_14: 1,
                        crate_14a: 1,
                    }),
                    pos: v2.create(-25, 30),
                    scale: 1,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "bush_01",
                    pos: v2.create(-28.5, -14),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "tree_01",
                    pos: v2.create(26.5, -18),
                    scale: 0.75,
                    ori: 0,
                },
                {
                    type: randomObstacleType({
                        crate_01: 1,
                        crate_14: 1,
                        crate_14a: 1,
                    }),
                    pos: v2.create(21, -17.5),
                    scale: 0.9,
                    ori: 0,
                    inheritOri: false,
                },
                {
                    type: "decal_oil_04",
                    pos: v2.create(-12, 26.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "decal_oil_03",
                    pos: v2.create(-18, 32),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "decal_oil_02",
                    pos: v2.create(-24, 23),
                    scale: 0.75,
                    ori: 0,
                },
                {
                    type: "decal_oil_06",
                    pos: v2.create(-11, 16.5),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: "decal_oil_05",
                    pos: v2.create(-9.5, 8),
                    scale: 1,
                    ori: 1,
                },
                {
                    type: "decal_oil_03",
                    pos: v2.create(-26, 11.5),
                    scale: 0.5,
                    ori: 1,
                },
            ],
        };
        return util.mergeDeep(t, e || {});
    })({}),
    club_vault: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(3, 4)),
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
                    zoomIn: collider.createAabbExtents(v2.create(0, 0), v2.create(3, 4)),
                },
            ],
            imgs: [
                {
                    sprite: "map-building-club-vault-ceiling.img",
                    scale: 1,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "loot_tier_club_melee",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    club_complex_01: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: {
            grass: true,
            beach: false,
            spawnPriority: 10,
        },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(-16, 15), v2.create(19, 6)),
            collider.createAabbExtents(v2.create(-8, -15.5), v2.create(26.5, 27.5)),
            collider.createAabbExtents(v2.create(-2, -47), v2.create(10, 5)),
            collider.createAabbExtents(v2.create(-37, -26), v2.create(4, 5)),
            collider.createAabbExtents(v2.create(23, -7), v2.create(8, 10)),
            collider.createAabbExtents(v2.create(22, -29), v2.create(6, 12)),
            collider.createAabbExtents(v2.create(-8, -23), v2.create(28, 21)),
            collider.createAabbExtents(v2.create(2, 0), v2.create(16, 12)),
            collider.createAabbExtents(v2.create(-16, 0), v2.create(4, 4)),
            collider.createAabbExtents(v2.create(-28.5, 12.5), v2.create(3.5, 3.5)),
        ],
        mapGroundPatches: [],
        floor: { surfaces: [], imgs: [] },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "club_structure_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "shack_01",
                pos: v2.create(22, -10),
                scale: 1,
                ori: 1,
            },
        ],
    },
    container_01: createContainer({
        open: false,
        tint: 0x29414e,
        ceilingSprite: "map-building-container-ceiling-01.img",
    }),
    container_02: createContainer({
        open: false,
        tint: 0x29414e,
        ceilingSprite: "map-building-container-ceiling-02.img",
    }),
    container_03: createContainer({
        open: false,
        tint: 0x29414e,
        ceilingSprite: "map-building-container-ceiling-03.img",
    }),
    container_04: createContainer({
        open: true,
        tint: 0x365567,
        ceilingSprite: "map-building-container-open-ceiling-01.img",
    }),
    container_05: {
        type: "building",
        scale: { createMin: 1, createMax: 1, destroy: 0.5 },
        zIdx: 1,
        map: { display: true, color: 0xaf4242, scale: 1 },
        terrain: { grass: false, beach: false },
        floor: {
            surfaces: [
                {
                    type: "container",
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
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(
                        v2.create(0, 2.4),
                        v2.create(2.5, 5.75),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-building-container-ceiling-05.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xaf4242,
                },
            ],
        },
        mapObjects: [
            {
                type: "container_05_collider",
                pos: v2.create(0, 2.4),
                scale: 1,
                ori: 0,
            },
        ],
    },
    container_06: createContainer({
        open: false,
        tint: 0xba9500,
        ceilingSprite: "map-building-container-ceiling-01.img",
        loot_spawner_01: "loot_tier_sv98",
        loot_spawner_02: "loot_tier_scopes_sniper",
        mapDisplayType: "container_01",
    }),
    dock_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(2.5, 0),
                        v2.create(2.4, 10.25),
                    ),
                    color: 0x873b16,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-2.45, 7.75),
                        v2.create(2.6, 2.5),
                    ),
                    color: 0x873b16,
                },
            ],
        },
        terrain: {
            grass: true,
            beach: false,
            bridge: { nearbyWidthMult: 0.75 },
        },
        bridgeLandBounds: [
            collider.createAabbExtents(v2.create(2.5, -10.5), v2.create(2.5, 1.5)),
        ],
        bridgeWaterBounds: [
            collider.createAabbExtents(v2.create(0, 7.75), v2.create(5.5, 3.5)),
        ],
        zIdx: 1,
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(
                            v2.create(2.5, 0),
                            v2.create(2.4, 10.25),
                        ),
                        collider.createAabbExtents(
                            v2.create(-2.45, 7.75),
                            v2.create(2.6, 2.5),
                        ),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-dock-floor-01a.img",
                    pos: v2.create(-2.5, 7.85),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-dock-floor-01b.img",
                    pos: v2.create(2.5, 0),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "bollard_01",
                pos: v2.create(-4.25, 7.75),
                scale: 0.8,
                ori: 2,
            },
            {
                type: randomObstacleType({ barrel_01: 1, crate_01: 1 }),
                pos: v2.create(3, 8.25),
                scale: 0.75,
                ori: 0,
            },
        ],
    },
    greenhouse_01: createGreenhouse({}),
    hut_01: createHut({}),
    hut_02: createHut({
        ceilingImg: "map-building-hut-ceiling-02.img",
        specialLoot: "pot_02",
        map: { displayType: "hut_01" },
    }),
    hut_03: createHut({
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, 0),
                        v2.create(7, 7),
                    ),
                    color: 0x769441,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(0, -18.9),
                        v2.create(2, 12),
                    ),
                    color: 0x5e2d03,
                },
            ],
        },
        ceilingImg: "map-building-hut-ceiling-03.img",
        specialLoot: "pot_05",
    }),
    house_red_01: createHouseRed({ stand: "stand_01" }),
    house_red_02: createHouseRed2({ stand: "stand_01" }),
    mansion_01: createMansion({}),
    mansion_cellar_01: createMansionCellar({}),
    outhouse_01: createOutHouse({}),
    panicroom_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(4.5, 6)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-panicroom-floor.img",
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
                        v2.create(4.5, 6),
                    ),
                },
            ],
            imgs: [
                {
                    sprite: "map-building-panicroom-ceiling.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_12",
                pos: v2.create(-4, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_3",
                pos: v2.create(-2, 5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_7",
                pos: v2.create(0, -5.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_12",
                pos: v2.create(4, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_2",
                pos: v2.create(0, -0.05),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ loot_tier_1: 1, "": 1 }),
                pos: v2.create(0, 0.05),
                scale: 1,
                ori: 0,
            },
        ],
    },
    police_01: createPoliceStation({ teamId: 2 }),
    saferoom_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: true, beach: false },
        zIdx: 2,
        floor: {
            surfaces: [
                {
                    type: "container",
                    collision: [
                        collider.createAabbExtents(v2.create(0, 0), v2.create(6, 4)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-saferoom-floor.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        ceiling: {
            zoomRegions: [
                {
                    zoomIn: collider.createAabbExtents(v2.create(0, 0), v2.create(5, 3)),
                },
            ],
            imgs: [
                {
                    sprite: "map-building-saferoom-ceiling.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0x5f5f5f,
                },
            ],
        },
        mapObjects: [
            {
                type: "metal_wall_ext_7",
                pos: v2.create(-5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_6",
                pos: v2.create(1.5, 3),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_9",
                pos: v2.create(0, -3),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_7",
                pos: v2.create(5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    case_01: 1,
                    case_02: 0.025,
                    chest_02: 1,
                }),
                pos: v2.create(2.5, 0),
                scale: 1,
                ori: 3,
            },
        ],
    },
    shack_01: createShack2({}),
    shack_02: createShack({}),
    shack_03a: createShack3({
        terrain: {
            bridge: { nearbyWidthMult: 1 },
            nearbyRiver: {
                radMin: 0.75,
                radMax: 1.5,
                facingOri: 1,
            },
        },
    }),
    shack_03b: createShack3({
        terrain: {
            waterEdge: {
                dir: v2.create(0, 1),
                distMin: 4,
                distMax: 5,
            },
        },
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(-7.75, 3),
                        v2.create(1, 2),
                    ),
                    color: 0x5e2d03,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(5, -4.75),
                        v2.create(2, 1),
                    ),
                    color: 0x5e2d03,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(1, 1.5),
                        v2.create(8, 5.5),
                    ),
                    color: 0x577066,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-10.65, 9),
                        v2.create(2, 12),
                    ),
                    color: 0x5e2d03,
                },
            ],
        },
        floor: {
            surfaces: [
                {
                    type: "shack",
                    collision: [
                        collider.createAabbExtents(v2.create(1, 1.5), v2.create(8, 5.5)),
                        collider.createAabbExtents(
                            v2.create(-10.65, 9),
                            v2.create(2, 12),
                        ),
                        collider.createAabbExtents(v2.create(-7.75, 3), v2.create(1, 2)),
                        collider.createAabbExtents(v2.create(5, -4.75), v2.create(2, 1)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-building-shack-floor-03.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-building-hut-floor-02.img",
                    pos: v2.create(-10.65, 9),
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: {
            imgs: [
                {
                    sprite: "map-building-shack-ceiling-03.img",
                    pos: v2.create(0.5, 0.5),
                    scale: 0.667,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
    } as unknown as Partial<BuildingDef>),
    teahouse_01: createTeahouse({}),
    teahouse_complex_01s: createTeaHouseComplex({}),
    warehouse_01: createWarehouse({
        topLeftObs: "crate_01",
        topRightObs: "crate_01",
        botRightObs: "crate_01",
        ignoreMapSpawnReplacement: true,
    }),
    warehouse_02: createWarehouse2({}),
    warehouse_03: createWarehouse3({}),
    warehouse_complex_01: {
        type: "building",
        map: {
            display: true,
            shapes: [
                {
                    collider: collider.createAabbExtents(
                        v2.create(26, 70.5),
                        v2.create(47, 7.5),
                    ),
                    color: 0x595959,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(15.5, 52.5),
                        v2.create(57.5, 10.5),
                    ),
                    color: 0x595959,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(33, 11),
                        v2.create(75, 31),
                    ),
                    color: 0x595959,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(5, -30),
                        v2.create(47, 10),
                    ),
                    color: 0x595959,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-39.75, 11.25),
                        v2.create(2, 51),
                    ),
                    color: 0xf5d000,
                },
                {
                    collider: collider.createCircle(v2.create(-39, 55), 1.25),
                    color: 0x604a40,
                },
                {
                    collider: collider.createCircle(v2.create(-39, 20.5), 1.25),
                    color: 0x604a40,
                },
                {
                    collider: collider.createCircle(v2.create(-39, 2), 1.25),
                    color: 0x604a40,
                },
                {
                    collider: collider.createCircle(v2.create(-39, -31.5), 1.25),
                    color: 0x604a40,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-28, -30),
                        v2.create(2, 2),
                    ),
                    color: 0x663300,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(-23, -33),
                        v2.create(2, 2),
                    ),
                    color: 0x663300,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(7, 70),
                        v2.create(2, 2),
                    ),
                    color: 0x663300,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(12, 72),
                        v2.create(2, 2),
                    ),
                    color: 0x663300,
                },
                {
                    collider: collider.createCircle(v2.create(-26.5, 54.75), 1.75),
                    color: 0x7a7a7a,
                },
                {
                    collider: collider.createCircle(v2.create(-23.5, 57), 1.75),
                    color: 0x7a7a7a,
                },
                {
                    collider: collider.createCircle(v2.create(84, -15.5), 1.75),
                    color: 0x7a7a7a,
                },
                {
                    collider: collider.createCircle(v2.create(40, -35), 1.5),
                    color: 0x7a7a7a,
                },
                {
                    collider: collider.createCircle(v2.create(65, 61), 1.5),
                    color: 0x7a7a7a,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(44.5, -25),
                        v2.create(1.4, 3.1),
                    ),
                    color: 0xca9c63,
                },
                {
                    collider: collider.createAabbExtents(
                        v2.create(58, 47.5),
                        v2.create(1.4, 3.1),
                    ),
                    color: 0xca9c63,
                },
            ],
        },
        terrain: {
            waterEdge: {
                dir: v2.create(-1, 0),
                distMin: 72,
                distMax: 72,
            },
        },
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(26, 70.5), v2.create(47, 7.5)),
            collider.createAabbExtents(v2.create(15.5, 52.5), v2.create(57.5, 10.5)),
            collider.createAabbExtents(v2.create(33, 11), v2.create(75, 31)),
            collider.createAabbExtents(v2.create(5, -30), v2.create(47, 10)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(26, 60), v2.create(47, 18)),
                color: 0x8e8573,
                order: 1,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(5, 11.5),
                    v2.create(47, 51.5),
                ),
                color: 0x8e8573,
                order: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(80, 11), v2.create(28, 31)),
                color: 0x8e8573,
                order: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(26, 58), v2.create(46, 19)),
                color: 0x595959,
                order: 1,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(5, 11.5),
                    v2.create(46, 50.5),
                ),
                color: 0x595959,
                order: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(78, 11), v2.create(29, 30)),
                color: 0x595959,
                order: 1,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-37.5, 38),
                    v2.create(4.5, 10),
                ),
                color: 0x8e8573,
                order: 1,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-37.5, -15),
                    v2.create(4.5, 10),
                ),
                color: 0x8e8573,
                order: 1,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-37.5, 38),
                    v2.create(3.5, 9),
                ),
                color: 0x595959,
                order: 1,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-37.5, -15),
                    v2.create(3.5, 9),
                ),
                color: 0x595959,
                order: 1,
            },
        ],
        floor: {
            surfaces: [
                {
                    type: "asphalt",
                    collision: [
                        collider.createAabbExtents(v2.create(26, 60), v2.create(47, 18)),
                        collider.createAabbExtents(
                            v2.create(5, 11.5),
                            v2.create(47, 51.5),
                        ),
                        collider.createAabbExtents(v2.create(80, 11), v2.create(28, 31)),
                    ],
                },
            ],
            imgs: [
                {
                    sprite: "map-complex-warehouse-floor-01.img",
                    pos: v2.create(-39.2, 55),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-complex-warehouse-floor-02.img",
                    pos: v2.create(-39.2, 11.5),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
                {
                    sprite: "map-complex-warehouse-floor-03.img",
                    pos: v2.create(-39.2, -32),
                    scale: 1,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "warehouse_02",
                pos: v2.create(5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_02",
                pos: v2.create(70, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "warehouse_02",
                pos: v2.create(18, 55),
                scale: 1,
                ori: 0,
            },
            {
                type: "bollard_01",
                pos: v2.create(-39, 55),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                    container_06: 0.08,
                }),
                pos: v2.create(-37.5, 38),
                scale: 1,
                ori: 0,
            },
            {
                type: "bollard_01",
                pos: v2.create(-39, 20.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "bollard_01",
                pos: v2.create(-39, 2),
                scale: 1,
                ori: 2,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                    container_06: 0.08,
                }),
                pos: v2.create(-37.5, -15),
                scale: 1,
                ori: 2,
            },
            {
                type: "bollard_01",
                pos: v2.create(-39, -31.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "crate_01",
                pos: v2.create(-28, -30),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(-23, -33),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "container_04",
                pos: v2.create(-11.5, -26.575),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                    container_05: 2,
                    container_06: 0.08,
                    "": 0.75,
                }),
                pos: v2.create(-6, -29),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                    container_05: 2,
                    container_06: 0.08,
                    "": 0.75,
                }),
                pos: v2.create(9.5, -29),
                scale: 1,
                ori: 0,
            },
            {
                type: "container_04",
                pos: v2.create(15, -26.575),
                scale: 1,
                ori: 0,
            },
            {
                type: "shack_02",
                pos: v2.create(37, -30),
                scale: 1,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(44.5, -25),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(84, -15.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                    container_05: 2,
                    container_06: 0.08,
                    "": 0.75,
                }),
                pos: v2.create(-3, 22),
                scale: 1,
                ori: 1,
            },
            {
                type: "container_04",
                pos: v2.create(-5.425, 27.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                    container_05: 2,
                    container_06: 0.08,
                    "": 0.75,
                }),
                pos: v2.create(-3, 33),
                scale: 1,
                ori: 1,
            },
            {
                type: "container_04",
                pos: v2.create(28, 22),
                scale: 1,
                ori: 1,
            },
            {
                type: "container_04",
                pos: v2.create(28, 27.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "container_04",
                pos: v2.create(28, 33),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                    container_05: 2,
                    container_06: 0.08,
                    "": 0.75,
                }),
                pos: v2.create(53, 22),
                scale: 1,
                ori: 3,
            },
            {
                type: "container_04",
                pos: v2.create(55.425, 27.5),
                scale: 1,
                ori: 1,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                    container_05: 2,
                    container_06: 0.08,
                    "": 0.75,
                }),
                pos: v2.create(53, 33),
                scale: 1,
                ori: 3,
            },
            {
                type: "container_04",
                pos: v2.create(84, 22),
                scale: 1,
                ori: 3,
            },
            {
                type: randomObstacleType({
                    container_01: 1,
                    container_02: 1,
                    container_03: 1,
                    container_05: 2,
                    container_06: 0.08,
                    "": 0.75,
                }),
                pos: v2.create(86.425, 27.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "barrel_01",
                pos: v2.create(-26.5, 54.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-23.5, 57),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_01",
                pos: v2.create(7, 70),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "crate_01",
                pos: v2.create(12, 72),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "shack_02",
                pos: v2.create(60, 58),
                scale: 1,
                ori: 1,
            },
            {
                type: "sandbags_01",
                pos: v2.create(58, 47.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_oil_01",
                pos: v2.create(-37.5, 59.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_02",
                pos: v2.create(-29.5, 52.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_03",
                pos: v2.create(-16.5, 61.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_04",
                pos: v2.create(-15.5, 73.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_05",
                pos: v2.create(2.5, 72.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_04",
                pos: v2.create(33.5, 74),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_oil_06",
                pos: v2.create(62.5, 69),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_04",
                pos: v2.create(105, 34),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_05",
                pos: v2.create(101.5, 23),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_01",
                pos: v2.create(84.5, 36),
                scale: 1,
                ori: 3,
            },
            {
                type: "decal_oil_03",
                pos: v2.create(73.5, 30),
                scale: 1,
                ori: 3,
            },
            {
                type: "decal_oil_03",
                pos: v2.create(56.5, 39),
                scale: 1,
                ori: 3,
            },
            {
                type: "decal_oil_06",
                pos: v2.create(60.5, 14),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_oil_02",
                pos: v2.create(40, 42),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_oil_05",
                pos: v2.create(41.5, 20),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_01",
                pos: v2.create(35.5, 9),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_oil_02",
                pos: v2.create(38.5, -5),
                scale: 1,
                ori: 2,
            },
            {
                type: "decal_oil_05",
                pos: v2.create(36.5, -22),
                scale: 1,
                ori: 3,
            },
            {
                type: "decal_oil_03",
                pos: v2.create(83, -16),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_04",
                pos: v2.create(28.5, -37),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_01",
                pos: v2.create(22.5, -24),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_03",
                pos: v2.create(7.5, -13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_04",
                pos: v2.create(6.5, -21),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_06",
                pos: v2.create(-2.5, -32),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_05",
                pos: v2.create(-22.5, -24),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_oil_03",
                pos: v2.create(-37.5, -29.75),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_oil_04",
                pos: v2.create(-37.25, 9.5),
                scale: 0.75,
                ori: 1,
            },
            {
                type: "decal_oil_02",
                pos: v2.create(-25.5, 15.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_oil_04",
                pos: v2.create(-12.5, 22.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_oil_05",
                pos: v2.create(-14.5, 33.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_oil_03",
                pos: v2.create(-26.5, 40.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "decal_oil_06",
                pos: v2.create(3.5, 28.5),
                scale: 1,
                ori: 2,
            },
            {
                type: "decal_oil_02",
                pos: v2.create(15.5, 38.5),
                scale: 1,
                ori: 2,
            },
        ],
        teamId: 2,
    }, 
    vault_01: createBankVault({}),
} as const satisfies Record<string, MapObjectDef>;

export const BaseBuildings = BaseBuildingDefs