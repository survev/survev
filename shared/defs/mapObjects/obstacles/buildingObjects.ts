import { collider } from "../../../utils/collider";
import { util } from "../../../utils/util";
import { v2 } from "../../../utils/v2";
import type { MapObjectDef, ObstacleDef } from "../../mapObjectsTyping";
import { MaterialDefs } from "../mapObjectHelpers";

//
// Walls, Doors, and other building-only obstacles
//

function wallImg(img: string, tint = 0xffffff, alpha = 1, zIdx = 10) {
    return {
        sprite: img,
        scale: 0.5,
        alpha,
        tint,
        zIdx,
    };
}

function createDoor<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createAabbExtents(e.hinge!, e.extents!),
        height: 10,
        collidable: true,
        destructible: true,
        health: 150,
        hitParticle: "whiteChip",
        explodeParticle: "whitePlank",
        reflectBullets: false,
        door: {
            interactionRad: 0.75,
            canUse: true,
            openSpeed: 2,
            openOneWay: 0,
            openDelay: 0,
            openOnce: false,
            autoOpen: false,
            autoClose: false,
            autoCloseDelay: 1,
            slideToOpen: false,
            slideOffset: 3.5,
            spriteAnchor: v2.create(0.5, 1),
            sound: {
                // @ts-expect-error can't find any reference to this
                open: e.soundOpen || "door_open_01",
                // @ts-expect-error can't find any reference to this
                close: e.soundClose || "door_close_01",
                change: "",
                error: "",
            },
        },
        loot: [],
        img: {
            sprite: "map-door-01.img",
            residue: "none",
            scale: 0.5,
            alpha: 1,
            tint: 0xdfdfdf,
            zIdx: 15,
        },
        sound: {
            bullet: "wall_wood_bullet",
            punch: "wall_wood_bullet",
            explode: "wall_break_01",
            enter: "none",
        },
    };
    const material = e.material as keyof typeof MaterialDefs;
    if (!MaterialDefs[material]) {
        throw new Error(`Invalid material ${e.material}`);
    }
    return util.mergeDeep(t, MaterialDefs[material], e || {});
}

function createLabDoor<T extends ObstacleDef>(e: Partial<T>): T {
    const t = createDoor({
        material: "concrete",
        hinge: v2.create(0, 2),
        extents: v2.create(0.3, 2),
        door: {
            interactionRad: 2,
            openOneWay: 0,
            openSpeed: 7,
            autoOpen: true,
            autoClose: true,
            autoCloseDelay: 1,
            slideToOpen: true,
            slideOffset: 3.75,
            sound: {
                open: "door_open_03",
                close: "door_close_03",
                error: "door_error_01",
            },
            casingImg: {
                sprite: "map-door-slot-01.img",
                pos: v2.create(-2, 0),
                scale: 0.5,
                alpha: 1,
                tint: 1316379,
            },
        },
        img: { tint: 5373952 },
    } as unknown as Partial<ObstacleDef>);
    return util.mergeDeep(t, e || {});
}

function createWall<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.copy(e.extents!)),
        height: 10,
        isWall: true,
        collidable: true,
        destructible: true,
        health: e.health || 150,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [],
        map: { display: false },
        img: {},
        sound: {
            bullet: "wall_bullet",
            punch: "wall_bullet",
            explode: "barrel_break_01",
            enter: "none",
        },
    };
    const material = e.material as keyof typeof MaterialDefs;
    if (!MaterialDefs[material]) {
        throw new Error(`Invalid material ${e.material}`);
    }
    return util.mergeDeep(t, MaterialDefs[material], e || {});
}

function createLowWall<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.4, 2)),
        height: 0.2,
        isWall: true,
        collidable: true,
        destructible: false,
        health: 100,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [],
        img: {
            sprite: "map-building-house-window-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
        sound: {
            bullet: "wall_wood_bullet",
            punch: "wall_wood_bullet",
            explode: "",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}

function createStairs<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2)),
        height: 0.5,
        collidable: false,
        destructible: true,
        health: 100,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [],
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-stairs-broken-01.img",
            residue: "map-table-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 60,
        },
        sound: {
            bullet: "wood_prop_bullet",
            punch: "wood_prop_bullet",
            explode: "crate_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}

function createWindow<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.4, 2)),
        height: 10,
        collidable: true,
        destructible: true,
        isWindow: true,
        health: 1,
        hitParticle: "glassChip",
        explodeParticle: "windowBreak",
        reflectBullets: false,
        loot: [],
        destroyType: "house_window_broken_01",
        img: {
            sprite: "map-building-house-window-01.img",
            residue: "none",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "glass_bullet",
            punch: "glass_bullet",
            explode: "window_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}

const BuildingObjectDefs = {
    house_door_01: createDoor({
        material: "wood",
        hinge: v2.create(0, 2),
        extents: v2.create(0.3, 2),
    }),
    house_door_02: createDoor({
        material: "metal",
        hinge: v2.create(0, 2),
        extents: v2.create(0.3, 2),
        door: {
            sound: {
                open: "door_open_02",
                close: "door_close_02",
            },
        },
        img: { tint: 4934475 },
    } as unknown as Partial<ObstacleDef>),
    house_door_03: createDoor({
        material: "wood",
        hinge: v2.create(0, 2),
        extents: v2.create(0.5, 1.75),
        img: { sprite: "map-door-03.img" },
    }),
    house_door_05: createDoor({
        material: "glass",
        hinge: v2.create(0, 2),
        extents: v2.create(0.3, 2),
        img: { sprite: "map-door-05.img" },
    }),
    crossing_door_01: createDoor({
        material: "metal",
        hinge: v2.create(0, 2),
        extents: v2.create(0.3, 2),
        door: {
            canUse: false,
            openOnce: true,
            sound: {
                open: "door_open_02",
                close: "door_close_02",
            },
        },
        img: { tint: 0x303542 },
    } as unknown as Partial<ObstacleDef>),
    cell_door_01: createDoor({
        material: "metal",
        hinge: v2.create(0, 2),
        extents: v2.create(0.3, 2),
        door: {
            canUse: false,
            openOnce: true,
            sound: {
                open: "door_open_02",
                close: "door_close_02",
            },
        },
        img: { tint: 0x1b1b1b },
    } as unknown as Partial<ObstacleDef>),
    eye_door_01: createDoor({
        material: "metal",
        hinge: v2.create(0, 2),
        extents: v2.create(0.3, 2),
        door: {
            canUse: false,
            openOnce: true,
            openOneWay: -1,
            sound: {
                open: "door_open_02",
                close: "door_close_02",
            },
        },
        img: { tint: 0xe0e0e },
    } as unknown as Partial<ObstacleDef>),
    lab_door_01: createLabDoor({ img: { tint: 0x520000 } }),
    lab_door_02: createLabDoor({
        door: {
            openOneWay: 1,
            slideOffset: -3.75,
            casingImg: { pos: v2.create(6, 0) },
        },
        img: { tint: 0x520000 },
    } as unknown as Partial<ObstacleDef>),
    lab_door_03: createLabDoor({
        door: { openOneWay: 1 },
        img: { tint: 0x520000 },
    } as unknown as Partial<ObstacleDef>),
    lab_door_locked_01: createLabDoor({
        door: {
            locked: true,
            openOnce: true,
            autoClose: false,
            sound: { error: "" },
        },
        img: { tint: 0x520000 },
    } as unknown as Partial<ObstacleDef>),
    lab_door_chrys: createDoor({
        destructible: false,
        material: "concrete",
        hinge: v2.create(0, 2),
        extents: v2.create(0.3, 2),
        door: {
            canUse: false,
            openOnce: true,
            openOneWay: 0,
            openSpeed: 7,
            autoOpen: false,
            autoClose: false,
            slideToOpen: true,
            slideOffset: 3.75,
            sound: {
                open: "door_open_03",
                close: "door_close_03",
                error: "door_error_01",
            },
            casingImg: {
                sprite: "map-door-slot-01.img",
                pos: v2.create(-2, 0),
                scale: 0.5,
                alpha: 1,
                tint: 0x14161b,
            },
        },
        img: { tint: 0x520000 },
    } as unknown as Partial<ObstacleDef>),
    vault_door_main: createDoor({
        material: "metal",
        hinge: v2.create(1, 3.5),
        extents: v2.create(1, 3.5),
        img: { sprite: "map-door-02.img" },
        door: {
            interactionRad: 1.5,
            openSpeed: 0.23,
            openOneWay: -1,
            openDelay: 4.1,
            openOnce: true,
            spriteAnchor: v2.create(0.2, 1),
            sound: {
                open: "none",
                close: "none",
                change: "vault_change_01",
            },
        },
    } as unknown as Partial<ObstacleDef>),
    vault_door_chrys_01: createDoor({
        material: "metal",
        hinge: v2.create(1, 3.5),
        extents: v2.create(1, 3.5),
        img: { sprite: "map-door-02.img" },
        door: {
            interactionRad: 1.5,
            openSpeed: 0.23,
            openOneWay: -1,
            openDelay: 4.1,
            openOnce: true,
            spriteAnchor: v2.create(0.2, 1),
            sound: {
                open: "none",
                close: "none",
                change: "vault_change_01",
            },
        },
    } as unknown as Partial<ObstacleDef>),
    vault_door_chrys_02: createDoor({
        material: "metal",
        hinge: v2.create(1, 3.5),
        extents: v2.create(1, 3.5),
        img: { sprite: "map-door-02.img" },
        door: {
            canUse: false,
            spriteAnchor: v2.create(0.2, 1),
        },
    } as unknown as Partial<ObstacleDef>),
    vault_door_reserve: createDoor({
        material: "metal",
        hinge: v2.create(1, 5),
        extents: v2.create(1, 5),
        img: { sprite: "map-door-06.img" },
        door: {
            interactionRad: 1.5,
            openSpeed: 0.23,
            openOneWay: -1,
            openDelay: 4.1,
            openOnce: true,
            canUse: false,
            spriteAnchor: v2.create(0.2, 1),
            sound: {
                open: "none",
                close: "none",
                change: "vault_change_01",
            },
        },
    } as unknown as Partial<ObstacleDef>),
    vault_door_eye: createDoor({
        material: "metal",
        hinge: v2.create(1, 3.5),
        extents: v2.create(1, 3.5),
        img: { sprite: "map-door-02.img" },
        door: {
            interactionRad: 1.5,
            openSpeed: 10,
            openOneWay: -1,
            openDelay: 0.1,
            openOnce: true,
            canUse: false,
            spriteAnchor: v2.create(0.2, 1),
            sound: {
                open: "none",
                close: "none",
                change: "none",
            },
        },
    } as unknown as Partial<ObstacleDef>),
    saloon_door_secret: createDoor({
        destructible: false,
        material: "wood",
        hitParticle: "woodChip",
        hinge: v2.create(0, 2),
        extents: v2.create(0.75, 2),
        door: {
            canUse: false,
            openOnce: true,
            openOneWay: 0,
            openSpeed: 36,
            autoOpen: false,
            autoClose: false,
            slideToOpen: true,
            slideOffset: 4.5,
            sound: { open: "" },
        },
        img: {
            sprite: "map-door-04.img",
            residue: "map-drawers-res.img",
            scale: 0.5,
            tint: 0xffffff,
            zIdx: 9,
        },
    } as unknown as Partial<ObstacleDef>),
    teahouse_door_01: createLabDoor({
        img: { tint: 0xddd1b5, alpha: 0.95 },
        door: {
            interactionRad: 2,
            openOneWay: 0,
            openSpeed: 7,
            autoOpen: false,
            autoClose: false,
            autoCloseDelay: 1,
            slideToOpen: true,
            slideOffset: 3.75,
            sound: {
                open: "door_open_04",
                close: "door_open_04",
                error: "door_error_01",
            },
            casingImg: {
                sprite: "map-door-slot-02.img",
                pos: v2.create(-2, 0),
                scale: 0.5,
                alpha: 1,
                tint: 0x310000,
            },
        },
    } as unknown as Partial<ObstacleDef>),
    secret_door_club: createDoor({
        destructible: false,
        material: "concrete",
        hinge: v2.create(0, 2),
        extents: v2.create(0.3, 2),
        door: {
            canUse: false,
            openOnce: true,
            openOneWay: 0,
            openSpeed: 7,
            autoOpen: false,
            autoClose: false,
            slideToOpen: true,
            slideOffset: 3.75,
            sound: {
                open: "door_open_03",
                close: "door_close_03",
                error: "door_error_01",
            },
            casingImg: {
                sprite: "map-door-slot-01.img",
                pos: v2.create(-2, 0),
                scale: 0.5,
                alpha: 1,
                tint: 0x14161b,
            },
        },
        img: { tint: 0x520000 },
    } as unknown as Partial<ObstacleDef>),
    vault_door_bathhouse: createDoor({
        destructible: false,
        material: "metal",
        hinge: v2.create(0, 2),
        extents: v2.create(0.3, 2),
        door: {
            canUse: false,
            openOnce: true,
            openOneWay: 0,
            openSpeed: 7,
            autoOpen: false,
            autoClose: false,
            slideToOpen: true,
            slideOffset: 3.75,
            sound: {
                open: "door_open_03",
                close: "door_close_03",
                error: "door_error_01",
            },
            casingImg: {
                sprite: "map-door-slot-01.img",
                pos: v2.create(-2, 0),
                scale: 0.5,
                alpha: 1,
                tint: 0x14161b,
            },
        },
        img: { tint: 0x4b4b4b },
    } as unknown as Partial<ObstacleDef>),
    house_window_01: createWindow({}),

    house_window_broken_01: createLowWall({}),

    lab_window_01: createWindow({
        destroyType: "lab_window_broken_01",
    }),
    lab_window_broken_01: createLowWall({ img: { tint: 0x14161b } }),
    stairs_01: createStairs({}),
    stairs_02: createStairs({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 4)),
        img: { sprite: "map-stairs-broken-02.img" },
    }),
    stairs_03: createStairs({
        health: 150,
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2)),
        img: { sprite: "map-stairs-broken-03.img" },
    }),
    club_window_01: createWindow({
        isWindow: false,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        destroyType: "club_window_broken_01",
        img: {
            sprite: "map-building-boarded-window-01.img",
        },
        sound: {
            bullet: "wood_prop_bullet",
            punch: "wood_prop_bullet",
            explode: "barrel_break_02",
            enter: "none",
        },
    }),
    club_window_broken_01: createLowWall({ img: { tint: 0x78552f } }),

    bank_window_01: {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.4, 2)),
        height: 10,
        collidable: true,
        destructible: true,
        isWindow: true,
        health: 75,
        hitParticle: "glassChip",
        explodeParticle: ["windowBreak", "redPlank"],
        reflectBullets: false,
        loot: [],
        img: {
            sprite: "map-building-bank-window-01.img",
            residue: "map-building-bank-window-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "glass_bullet",
            punch: "glass_bullet",
            explode: "window_break_02",
            enter: "none",
        },
    },
    reserve_window_01: createWindow({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.4, 3.5)),
        destroyType: "reserve_window_broken_01",
        img: { sprite: "map-building-reserve-window-01.img" },
    }),
    reserve_window_broken_01: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.4, 4)),
        img: {
            sprite: "map-building-reserve-window-res-01.img",
            tint: 0x14161b,
        },
    }),

    // Walls

    container_05_collider: createWall({
        material: "metal",
        extents: v2.create(2.75, 6),
    }),
    hedgehog_wall: createWall({
        material: "metal",
        extents: v2.create(3, 0.5),
        height: 0.5,
        map: { display: true, color: 0x59544d, scale: 1 },
    }),
    hut_wall_int_4: createWall({
        material: "wood",
        extents: v2.create(0.5, 2),
        hitParticle: "tanChip",
        img: wallImg("map-wall-04.img", 0x465000),
    }),
    hut_wall_int_5: createWall({
        material: "wood",
        extents: v2.create(0.5, 2.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-05.img", 0x465000),
    }),
    hut_wall_int_6: createWall({
        material: "wood",
        extents: v2.create(0.5, 3),
        hitParticle: "tanChip",
        img: wallImg("map-wall-06.img", 0x465000),
    }),
    hut_wall_int_7: createWall({
        material: "wood",
        extents: v2.create(0.5, 3.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-07.img", 0x465000),
    }),
    hut_wall_int_10: createWall({
        material: "wood",
        extents: v2.create(0.5, 5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-10.img", 0x465000),
    }),
    hut_wall_int_12: createWall({
        material: "wood",
        extents: v2.create(0.5, 6),
        hitParticle: "tanChip",
        img: wallImg("map-wall-12.img", 0x465000),
    }),
    hut_wall_int_14: createWall({
        material: "wood",
        extents: v2.create(0.5, 7),
        hitParticle: "tanChip",
        img: wallImg("map-wall-14.img", 0x465000),
    }),
    hut_window_open_01: createLowWall({ img: { tint: 0x753402 } }),
    warehouse_wall_side: createWall({
        material: "metal",
        extents: v2.create(25, 0.6),
    }),
    warehouse_wall_edge: createWall({
        material: "metal",
        extents: v2.create(0.6, 3.2),
    }),
    warehouse_wall_edge_2: createWall({
        material: "metal",
        extents: v2.create(0.6, 6.5),
    }),
    warehouse_wall_int: createWall({
        material: "metal",
        extents: v2.create(0.6, 1),
    }),
    warehouse_column: createWall({
        material: "metal",
        extents: v2.create(0.6, 0.6),
    }),
    workshop_wall_right: createWall({
        material: "metal",
        extents: v2.create(20, 0.5),
    }),
    workshop_wall_edge: createWall({
        material: "metal",
        extents: v2.create(4, 0.5),
    }),
    workshop_wall_mid_1: createWall({
        material: "metal",
        extents: v2.create(7.25, 0.5),
    }),
    workshop_wall_mid_2: createWall({
        material: "metal",
        extents: v2.create(8, 0.5),
    }),
    workshop_wall_mid_3: createWall({
        material: "metal",
        extents: v2.create(1.25, 0.5),
    }),
    workshop_wall_bot: createWall({
        material: "brick",
        extents: v2.create(8.75, 0.5),
    }),
    workshop_wall_room_1: createWall({
        material: "brick",
        extents: v2.create(4.25, 0.5),
    }),
    workshop_wall_room_2: createWall({
        material: "brick",
        extents: v2.create(2.25, 0.5),
    }),
    workshop_wall_room_3: createWall({
        material: "brick",
        extents: v2.create(4.5, 0.5),
    }),
    workshop_wall_room_4: createWall({
        material: "brick",
        extents: v2.create(2.75, 0.5),
    }),
    workshop_wall_left: createWall({
        material: "brick",
        extents: v2.create(15.5, 0.5),
    }),
    archway_column_1: createWall({
        material: "wood",
        extents: v2.create(1, 1),
        img: Object.assign(wallImg("map-column-01.img", 0x6f3f14), {
            residue: "map-drawers-res.img",
        }),
    }),
    shack_wall_top: createWall({
        material: "wood",
        extents: v2.create(5.6, 0.35),
        height: 10,
        img: wallImg("map-wall-shack-top.img"),
    }),
    shack_wall_side_left: createWall({
        material: "wood",
        extents: v2.create(0.35, 3.43),
        height: 10,
        img: wallImg("map-wall-shack-left.img"),
    }),
    shack_wall_side_right: createWall({
        material: "wood",
        extents: v2.create(0.35, 3.8),
        height: 10,
        img: wallImg("map-wall-shack-right.img"),
    }),
    shack_wall_bot: createWall({
        material: "wood",
        extents: v2.create(3.75, 0.35),
        height: 10,
        img: wallImg("map-wall-shack-bot.img"),
    }),
    shack_wall_ext_2: createWall({
        material: "wood",
        extents: v2.create(0.5, 1),
        hitParticle: "tanChip",
        img: wallImg("map-wall-02.img", 0xbf995f),
    }),
    shack_wall_ext_5: createWall({
        material: "wood",
        extents: v2.create(0.5, 2.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-05.img", 0xbf995f),
    }),
    shack_wall_ext_9: createWall({
        material: "wood",
        extents: v2.create(0.5, 4.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-09.img", 0xbf995f),
    }),
    shack_wall_ext_10: createWall({
        material: "wood",
        extents: v2.create(0.5, 5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-10.img", 0xbf995f),
    }),
    shack_wall_ext_14: createWall({
        material: "wood",
        extents: v2.create(0.5, 7),
        hitParticle: "tanChip",
        img: wallImg("map-wall-14.img", 0xbf995f),
    }),
    outhouse_wall_top: createWall({
        material: "wood",
        extents: v2.create(3.2, 0.35),
        height: 10,
        hitParticle: "outhouseChip",
        explodeParticle: "outhousePlank",
        health: 100,
        img: wallImg("map-wall-outhouse-top.img"),
    }),
    outhouse_wall_side: createWall({
        material: "wood",
        extents: v2.create(0.35, 3.1),
        height: 10,
        hitParticle: "outhouseChip",
        explodeParticle: "outhousePlank",
        health: 100,
        img: wallImg("map-wall-outhouse-side.img"),
    }),
    outhouse_wall_bot: createWall({
        material: "wood",
        extents: v2.create(1.15, 0.35),
        height: 10,
        hitParticle: "outhouseChip",
        explodeParticle: "outhousePlank",
        health: 100,
        img: wallImg("map-wall-outhouse-bot.img"),
    }),
    brick_wall_ext_1: createWall({
        material: "brick",
        extents: v2.create(0.5, 0.5),
    }),
    brick_wall_ext_2: createWall({
        material: "brick",
        extents: v2.create(0.5, 1),
    }),
    brick_wall_ext_3: createWall({
        material: "brick",
        extents: v2.create(0.5, 1.5),
    }),
    brick_wall_ext_4: createWall({
        material: "brick",
        extents: v2.create(0.5, 2),
    }),
    brick_wall_ext_5: createWall({
        material: "brick",
        extents: v2.create(0.5, 2.5),
    }),
    brick_wall_ext_6: createWall({
        material: "brick",
        extents: v2.create(0.5, 3),
    }),
    brick_wall_ext_7: createWall({
        material: "brick",
        extents: v2.create(0.5, 3.5),
    }),
    brick_wall_ext_8: createWall({
        material: "brick",
        extents: v2.create(0.5, 4),
    }),
    brick_wall_ext_9: createWall({
        material: "brick",
        extents: v2.create(0.5, 4.5),
    }),
    brick_wall_ext_10: createWall({
        material: "brick",
        extents: v2.create(0.5, 5),
    }),
    brick_wall_ext_11: createWall({
        material: "brick",
        extents: v2.create(0.5, 5.5),
    }),
    brick_wall_ext_12: createWall({
        material: "brick",
        extents: v2.create(0.5, 6),
    }),
    brick_wall_ext_12_5: createWall({
        material: "brick",
        extents: v2.create(0.5, 6.25),
    }),
    brick_wall_ext_13: createWall({
        material: "brick",
        extents: v2.create(0.5, 6.5),
    }),
    brick_wall_ext_14: createWall({
        material: "brick",
        extents: v2.create(0.5, 7),
    }),
    brick_wall_ext_15: createWall({
        material: "brick",
        extents: v2.create(0.5, 7.5),
    }),
    brick_wall_ext_16: createWall({
        material: "brick",
        extents: v2.create(0.5, 8),
    }),
    brick_wall_ext_17: createWall({
        material: "brick",
        extents: v2.create(0.5, 8.5),
    }),
    brick_wall_ext_18: createWall({
        material: "brick",
        extents: v2.create(0.5, 9),
    }),
    brick_wall_ext_19: createWall({
        material: "brick",
        extents: v2.create(0.5, 9.5),
    }),
    brick_wall_ext_20: createWall({
        material: "brick",
        extents: v2.create(0.5, 10),
    }),
    brick_wall_ext_21: createWall({
        material: "brick",
        extents: v2.create(0.5, 10.5),
    }),
    brick_wall_ext_23: createWall({
        material: "brick",
        extents: v2.create(0.5, 11.5),
    }),
    brick_wall_ext_33: createWall({
        material: "brick",
        extents: v2.create(0.5, 16.5),
    }),
    brick_wall_ext_41: createWall({
        material: "brick",
        extents: v2.create(0.5, 20.5),
    }),
    brick_wall_ext_short_7: createWall({
        material: "brick",
        extents: v2.create(0.5, 3.5),
        height: 0.5,
    }),
    brick_wall_ext_thicker_4: createWall({
        material: "brick",
        extents: v2.create(1.5, 2),
    }),
    brick_wall_ext_thicker_5: createWall({
        material: "brick",
        extents: v2.create(1.5, 2.5),
    }),
    brick_wall_ext_thicker_6: createWall({
        material: "brick",
        extents: v2.create(1.5, 3),
    }),
    brick_wall_ext_thicker_7: createWall({
        material: "brick",
        extents: v2.create(1.5, 3.5),
    }),
    brick_wall_ext_thicker_8: createWall({
        material: "brick",
        extents: v2.create(1.5, 4),
    }),
    brick_wall_ext_thicker_9: createWall({
        material: "brick",
        extents: v2.create(1.5, 4.5),
    }),
    brick_wall_ext_thicker_15: createWall({
        material: "brick",
        extents: v2.create(1.5, 7.5),
    }),
    brick_wall_ext_thicker_16: createWall({
        material: "brick",
        extents: v2.create(1.5, 8),
    }),
    brick_wall_ext_thicker_24: createWall({
        material: "brick",
        extents: v2.create(1.5, 12),
    }),
    concrete_wall_ext_thin_6: createWall({
        material: "concrete",
        extents: v2.create(0.375, 3),
    }),
    concrete_wall_ext_1_5: createWall({
        material: "concrete",
        extents: v2.create(0.5, 0.75),
    }),
    concrete_wall_ext_2: createWall({
        material: "concrete",
        extents: v2.create(0.5, 1),
    }),
    cobalt_wall_int_4: createWall({
        material: "cobalt",
        extents: v2.create(0.6, 2),
        img: wallImg("map-wall-04-cobalt.img", 0xffffff),
        explosion: "explosion_cobalt",
    }),
    concrete_wall_ext_3: createWall({
        material: "concrete",
        extents: v2.create(0.5, 1.5),
    }),
    concrete_wall_ext_4: createWall({
        material: "concrete",
        extents: v2.create(0.5, 2),
    }),
    concrete_wall_ext_5: createWall({
        material: "concrete",
        extents: v2.create(0.5, 2.5),
    }),
    concrete_wall_ext_6: createWall({
        material: "concrete",
        extents: v2.create(0.5, 3),
    }),
    concrete_wall_ext_7: createWall({
        material: "concrete",
        extents: v2.create(0.5, 3.5),
    }),
    concrete_wall_ext_8: createWall({
        material: "concrete",
        extents: v2.create(0.5, 4),
    }),
    concrete_wall_ext_9: createWall({
        material: "concrete",
        extents: v2.create(0.5, 4.5),
    }),
    concrete_wall_ext_9_5: createWall({
        material: "concrete",
        extents: v2.create(0.5, 4.75),
    }),
    concrete_wall_ext_10_5: createWall({
        material: "concrete",
        extents: v2.create(0.5, 5.25),
    }),
    concrete_wall_ext_11: createWall({
        material: "concrete",
        extents: v2.create(0.5, 5.5),
    }),
    concrete_wall_ext_11_5: createWall({
        material: "concrete",
        extents: v2.create(0.5, 5.75),
    }),
    concrete_wall_ext_13: createWall({
        material: "concrete",
        extents: v2.create(0.5, 6.5),
    }),
    concrete_wall_ext_14: createWall({
        material: "concrete",
        extents: v2.create(0.5, 7),
    }),
    concrete_wall_ext_15: createWall({
        material: "concrete",
        extents: v2.create(0.5, 7.5),
    }),
    concrete_wall_ext_16: createWall({
        material: "concrete",
        extents: v2.create(0.5, 8),
    }),
    concrete_wall_ext_17: createWall({
        material: "concrete",
        extents: v2.create(0.5, 8.5),
    }),
    concrete_wall_ext_23: createWall({
        material: "concrete",
        extents: v2.create(0.5, 11.5),
    }),
    concrete_wall_ext_24: createWall({
        material: "concrete",
        extents: v2.create(0.5, 12),
    }),
    concrete_wall_ext_25: createWall({
        material: "concrete",
        extents: v2.create(0.5, 12.5),
    }),
    concrete_wall_column_2x8: createWall({
        material: "concrete",
        extents: v2.create(1, 4),
    }),
    concrete_wall_column_4x8: createWall({
        material: "concrete",
        extents: v2.create(2, 4),
    }),
    concrete_wall_column_4x9: createWall({
        material: "concrete",
        extents: v2.create(2, 4.5),
    }),
    concrete_wall_column_4x24: createWall({
        material: "concrete",
        extents: v2.create(2, 12),
    }),
    concrete_wall_column_5x10: createWall({
        material: "concrete",
        extents: v2.create(2.5, 5),
    }),
    concrete_wall_column_7x10: createWall({
        material: "concrete",
        extents: v2.create(3.5, 5),
    }),
    concrete_wall_column_8x3: createWall({
        material: "concrete",
        extents: v2.create(4, 1.5),
    }),
    concrete_wall_ext_thick_11: createWall({
        material: "concrete",
        extents: v2.create(1, 5.5),
    }),
    concrete_wall_ext_thicker_4: createWall({
        material: "concrete",
        extents: v2.create(1.5, 2),
    }),
    concrete_wall_ext_thicker_5: createWall({
        material: "concrete",
        extents: v2.create(1.5, 2.5),
    }),
    concrete_wall_ext_thicker_6: createWall({
        material: "concrete",
        extents: v2.create(1.5, 3),
    }),
    concrete_wall_ext_thicker_8: createWall({
        material: "concrete",
        extents: v2.create(1.5, 4),
    }),
    concrete_wall_ext_thicker_9: createWall({
        material: "concrete",
        extents: v2.create(1.5, 4.5),
    }),
    concrete_wall_ext_thicker_10: createWall({
        material: "concrete",
        extents: v2.create(1.5, 5),
    }),
    concrete_wall_ext_thicker_11: createWall({
        material: "concrete",
        extents: v2.create(1.5, 5.5),
    }),
    concrete_wall_ext_thicker_12: createWall({
        material: "concrete",
        extents: v2.create(1.5, 6),
    }),
    concrete_wall_ext_thicker_13: createWall({
        material: "concrete",
        extents: v2.create(1.5, 6.5),
    }),
    concrete_wall_ext_thicker_14: createWall({
        material: "concrete",
        extents: v2.create(1.5, 7),
    }),
    concrete_wall_ext_thicker_15: createWall({
        material: "concrete",
        extents: v2.create(1.5, 7.5),
    }),
    concrete_wall_ext_thicker_17: createWall({
        material: "concrete",
        extents: v2.create(1.5, 8.5),
    }),
    concrete_wall_ext_thicker_19: createWall({
        material: "concrete",
        extents: v2.create(1.5, 9.5),
    }),
    concrete_wall_ext_thicker_21: createWall({
        material: "concrete",
        extents: v2.create(1.5, 10.5),
    }),
    concrete_wall_ext_thicker_22: createWall({
        material: "concrete",
        extents: v2.create(1.5, 11),
    }),
    concrete_wall_ext_thicker_27: createWall({
        material: "concrete",
        extents: v2.create(1.5, 13.5),
    }),
    concrete_wall_ext_thicker_30: createWall({
        material: "concrete",
        extents: v2.create(1.5, 15),
    }),
    concrete_wall_ext_thicker_31: createWall({
        material: "concrete",
        extents: v2.create(1.5, 15.5),
    }),
    concrete_wall_ext_thicker_42: createWall({
        material: "concrete",
        extents: v2.create(1.5, 21),
    }),
    concrete_wall_ext_thicker_54: createWall({
        material: "concrete",
        extents: v2.create(1.5, 27),
    }),
    metal_wall_ext_2x2: createWall({
        material: "metal",
        extents: v2.create(1, 1),
    }),
    metal_wall_ext_2: createWall({
        material: "metal",
        extents: v2.create(0.5, 1),
    }),
    metal_wall_ext_3: createWall({
        material: "metal",
        extents: v2.create(0.5, 1.5),
    }),
    metal_wall_ext_4: createWall({
        material: "metal",
        extents: v2.create(0.5, 2),
    }),
    metal_wall_ext_5: createWall({
        material: "metal",
        extents: v2.create(0.5, 2.5),
    }),
    metal_wall_ext_6: createWall({
        material: "metal",
        extents: v2.create(0.5, 3),
    }),
    metal_wall_ext_7: createWall({
        material: "metal",
        extents: v2.create(0.5, 3.5),
    }),
    metal_wall_ext_8: createWall({
        material: "metal",
        extents: v2.create(0.5, 4),
    }),
    metal_wall_ext_9: createWall({
        material: "metal",
        extents: v2.create(0.5, 4.5),
    }),
    metal_wall_ext_10: createWall({
        material: "metal",
        extents: v2.create(0.5, 5),
    }),
    metal_wall_ext_12: createWall({
        material: "metal",
        extents: v2.create(0.5, 6),
    }),
    metal_wall_ext_12_5: createWall({
        material: "metal",
        extents: v2.create(0.5, 6.25),
    }),
    metal_wall_ext_13: createWall({
        material: "metal",
        extents: v2.create(0.5, 6.5),
    }),
    metal_wall_ext_16: createWall({
        material: "metal",
        extents: v2.create(0.5, 8),
    }),
    metal_wall_ext_18: createWall({
        material: "metal",
        extents: v2.create(0.5, 9),
    }),
    metal_wall_ext_23: createWall({
        material: "metal",
        extents: v2.create(0.5, 11.5),
    }),
    metal_wall_ext_43: createWall({
        material: "metal",
        extents: v2.create(0.5, 21.5),
    }),
    metal_wall_ext_short_6: createWall({
        material: "metal",
        extents: v2.create(0.5, 3),
        height: 0.5,
    }),
    metal_wall_ext_short_7: createWall({
        material: "metal",
        extents: v2.create(0.5, 3.5),
        height: 0.5,
    }),
    metal_wall_ext_thick_5: createWall({
        material: "metal",
        extents: v2.create(1, 2.5),
    }),
    metal_wall_ext_thick_6: createWall({
        material: "metal",
        extents: v2.create(1, 3),
    }),
    metal_wall_ext_thick_8: createWall({
        material: "metal",
        extents: v2.create(1, 4),
    }),
    metal_wall_ext_thick_12: createWall({
        material: "metal",
        extents: v2.create(1, 6),
    }),
    metal_wall_ext_thick_16: createWall({
        material: "metal",
        extents: v2.create(1, 8),
    }),
    metal_wall_ext_thick_20: createWall({
        material: "metal",
        extents: v2.create(1, 10),
    }),
    metal_wall_ext_thicker_4: createWall({
        material: "metal",
        extents: v2.create(1.5, 2),
    }),
    metal_wall_ext_thick_23: createWall({
        material: "metal",
        extents: v2.create(1, 11.5),
    }),
    metal_wall_ext_thick_28: createWall({
        material: "metal",
        extents: v2.create(1, 14),
    }),
    metal_wall_ext_thicker_1_5: createWall({
        material: "metal",
        extents: v2.create(1.5, 0.75),
    }),
    metal_wall_ext_thicker_5: createWall({
        material: "metal",
        extents: v2.create(1.5, 2.5),
    }),
    metal_wall_ext_thicker_6: createWall({
        material: "metal",
        extents: v2.create(1.5, 3),
    }),
    metal_wall_ext_thicker_7: createWall({
        material: "metal",
        extents: v2.create(1.5, 3.5),
    }),
    metal_wall_ext_thicker_8: createWall({
        material: "metal",
        extents: v2.create(1.5, 4),
    }),
    metal_wall_ext_thicker_9: createWall({
        material: "metal",
        extents: v2.create(1.5, 4.5),
    }),
    metal_wall_ext_thicker_10: createWall({
        material: "metal",
        extents: v2.create(1.5, 5),
    }),
    metal_wall_ext_thicker_11: createWall({
        material: "metal",
        extents: v2.create(1.5, 5.5),
    }),
    metal_wall_ext_thicker_12: createWall({
        material: "metal",
        extents: v2.create(1.5, 6),
    }),
    metal_wall_ext_thicker_13: createWall({
        material: "metal",
        extents: v2.create(1.5, 6.5),
    }),
    metal_wall_ext_thicker_14: createWall({
        material: "metal",
        extents: v2.create(1.5, 7),
    }),
    metal_wall_ext_thicker_15: createWall({
        material: "metal",
        extents: v2.create(1.5, 7.5),
    }),
    metal_wall_ext_thicker_16: createWall({
        material: "metal",
        extents: v2.create(1.5, 8),
    }),
    metal_wall_ext_thicker_17: createWall({
        material: "metal",
        extents: v2.create(1.5, 8.5),
    }),
    metal_wall_ext_thicker_18: createWall({
        material: "metal",
        extents: v2.create(1.5, 9),
    }),
    metal_wall_ext_thicker_19: createWall({
        material: "metal",
        extents: v2.create(1.5, 9.5),
    }),
    metal_wall_ext_thicker_20: createWall({
        material: "metal",
        extents: v2.create(1.5, 10),
    }),
    metal_wall_ext_thicker_21: createWall({
        material: "metal",
        extents: v2.create(1.5, 10.5),
    }),
    metal_wall_ext_thicker_22: createWall({
        material: "metal",
        extents: v2.create(1.5, 11),
    }),
    metal_wall_ext_thicker_23: createWall({
        material: "metal",
        extents: v2.create(1.5, 11.5),
    }),
    metal_wall_ext_thicker_24: createWall({
        material: "metal",
        extents: v2.create(1.5, 12),
    }),
    metal_wall_ext_thicker_25: createWall({
        material: "metal",
        extents: v2.create(1.5, 12.5),
    }),
    metal_wall_ext_thicker_26: createWall({
        material: "metal",
        extents: v2.create(1.5, 13),
    }),
    metal_wall_ext_thicker_27: createWall({
        material: "metal",
        extents: v2.create(1.5, 13.5),
    }),
    metal_wall_ext_thicker_28: createWall({
        material: "metal",
        extents: v2.create(1.5, 14.5),
    }),
    metal_wall_ext_thicker_29: createWall({
        material: "metal",
        extents: v2.create(1.5, 14.5),
    }),
    metal_wall_ext_thicker_30: createWall({
        material: "metal",
        extents: v2.create(1.5, 15),
    }),
    metal_wall_ext_thicker_32: createWall({
        material: "metal",
        extents: v2.create(1.5, 16),
    }),
    metal_wall_ext_thicker_34: createWall({
        material: "metal",
        extents: v2.create(1.5, 17),
    }),
    metal_wall_ext_thicker_35: createWall({
        material: "metal",
        extents: v2.create(1.5, 17.5),
    }),
    metal_wall_ext_thicker_42: createWall({
        material: "metal",
        extents: v2.create(1.5, 21),
    }),
    metal_wall_ext_thicker_48: createWall({
        material: "metal",
        extents: v2.create(1.5, 24),
    }),
    metal_wall_ext_thicker_49: createWall({
        material: "metal",
        extents: v2.create(2.5, 7),
    }),
    glass_wall_9: createWall({
        material: "glass",
        extents: v2.create(0.5, 4.5),
        health: 100,
        img: wallImg("map-wall-glass-9.img"),
    }),
    glass_wall_10: createWall({
        material: "glass",
        extents: v2.create(0.5, 5),
        health: 50,
        img: wallImg("map-wall-glass-10.img"),
    }),
    glass_wall_12: createWall({
        material: "glass",
        extents: v2.create(0.5, 6),
        health: 50,
        img: wallImg("map-wall-glass-12.img"),
    }),
    glass_wall_12_2: createWall({
        material: "glass",
        extents: v2.create(1, 6),
        health: 5e3,
        img: wallImg("map-wall-glass-12-2.img"),
    }),
    glass_wall_13: createWall({
        material: "glass",
        extents: v2.create(0.5, 6.5),
        health: 75,
        img: wallImg("map-wall-glass-13.img"),
    }),
    glass_wall_18: createWall({
        material: "glass",
        extents: v2.create(0.5, 9),
        health: 150,
        img: wallImg("map-wall-glass-18.img"),
    }),
    barn_wall_int_2: createWall({
        material: "wood",
        extents: v2.create(0.5, 1),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-02-rounded.img", 0x6d7645),
    }),
    barn_wall_int_2_5: createWall({
        material: "wood",
        extents: v2.create(0.5, 1.25),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-02-5-rounded.img", 0x6d7645),
    }),
    barn_wall_int_4: createWall({
        material: "wood",
        extents: v2.create(0.5, 2),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-04-rounded.img", 0x6d7645),
    }),
    barn_wall_int_5: createWall({
        material: "wood",
        extents: v2.create(0.5, 2.5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-05-rounded.img", 0x6d7645),
    }),
    barn_wall_int_6: createWall({
        material: "wood",
        extents: v2.create(0.5, 3),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-06-rounded.img", 0x6d7645),
    }),
    barn_wall_int_7: createWall({
        material: "wood",
        extents: v2.create(0.5, 3.5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-07-rounded.img", 0x6d7645),
    }),
    barn_wall_int_8: createWall({
        material: "wood",
        extents: v2.create(0.5, 4),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-08-rounded.img", 0x6d7645),
    }),
    barn_wall_int_11: createWall({
        material: "wood",
        extents: v2.create(0.5, 5.5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-11-rounded.img", 0x6d7645),
    }),
    barn_wall_int_13: createWall({
        material: "wood",
        extents: v2.create(0.5, 6.5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-13-rounded.img", 0x6d7645),
    }),
    barn_column_1: createWall({
        material: "concrete",
        extents: v2.create(1, 1),
        hitParticle: "ltgreenChip",
        img: wallImg("map-column-01.img", 0x2a2d1c),
    }),
    bank_wall_int_3: createWall({
        material: "wood",
        extents: v2.create(0.5, 1.5),
        img: wallImg("map-wall-03-rounded.img", 0x79563e),
    }),
    bank_wall_int_4: createWall({
        material: "wood",
        extents: v2.create(0.5, 2),
        img: wallImg("map-wall-04-rounded.img", 0x79563e),
    }),
    bank_wall_int_5: createWall({
        material: "wood",
        extents: v2.create(0.5, 2.5),
        img: wallImg("map-wall-05-rounded.img", 0x79563e),
    }),
    bank_wall_int_8: createWall({
        material: "wood",
        extents: v2.create(0.5, 4),
        img: wallImg("map-wall-08-rounded.img", 0x79563e),
    }),
    reserve_perm_wall_ext_1: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 0.5),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_2: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 1),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_4: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 2),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_6: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 3),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_7: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 3.5),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_8: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 4),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_10: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 5),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_11: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 5.5),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_12: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 6),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_14: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 7),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_18: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 9),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_20: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 10),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_22: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 11),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_23: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 11.5),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_25: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 12.5),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_38: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 19),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_2x11: createWall({
        material: "woodPerm",
        extents: v2.create(1, 5.5),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_2x10: createWall({
        material: "woodPerm",
        extents: v2.create(1, 5),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_3x4: createWall({
        material: "woodPerm",
        extents: v2.create(1.5, 2),
        hitParticle: "blackChip",
    }),
    reserve_perm_wall_ext_3x13: createWall({ // -256, -232.467
        material: "woodPerm",
        extents: v2.create(1.5, 6.5),
        hitParticle: "blackChip",
    }),
    reserve_wall_int_3: createWall({
        material: "wood",
        health: 100,
        extents: v2.create(0.5, 1.5),
        img: wallImg("map-wall-03-rounded.img", 0x4f240d),
    }),
    reserve_wall_int_4: createWall({
        material: "wood",
        health: 100,
        extents: v2.create(0.5, 2),
        img: wallImg("map-wall-04-rounded.img", 0x4f240d),
    }),
    reserve_wall_int_5: createWall({
        material: "wood",
        extents: v2.create(0.5, 2.5),
        img: wallImg("map-wall-05-rounded.img", 0x4f240d),
    }),
    reserve_wall_int_6: createWall({
        material: "wood",
        extents: v2.create(0.5, 3),
        img: wallImg("map-wall-06-rounded.img", 0x4f240d),
    }),
    reserve_wall_int_8: createWall({
        material: "wood",
        extents: v2.create(0.5, 4),
        img: wallImg("map-wall-08-rounded.img", 0x4f240d),
    }),
    reserve_wall_int_9: createWall({
        material: "wood",
        extents: v2.create(0.5, 4.5),
        img: wallImg("map-wall-09-rounded.img", 0x4f240d),
    }),
    reserve_wall_int_10: createWall({
        material: "wood",
        extents: v2.create(0.5, 5),
        img: wallImg("map-wall-10-rounded.img", 0x4f240d),
    }),
    reserve_wall_int_12: createWall({
        material: "wood",
        health: 125,
        extents: v2.create(0.5, 6),
        img: wallImg("map-wall-12-rounded.img", 0x4f240d),
    }),
    reserve_wall_int_13: createWall({
        material: "wood",
        health: 200,
        extents: v2.create(0.5, 6.5),
        img: wallImg("map-wall-13-rounded.img", 0x4f240d),
    }),
    reserve_wall_int_16: createWall({
        material: "wood",
        health: 200,
        extents: v2.create(0.5, 8),
        img: wallImg("map-wall-16-rounded.img", 0x4f240d),
    }),
    reserve_bar_small: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 4)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
    }),
    reserve_bar_large: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 7.5)),
        img: {
            sprite: "map-reserve-bar-large.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
    }),
    reserve_bar_back: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 6.5)),
        img: {
            sprite: "map-reserve-bar-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
    }),
    police_wall_int_2: createWall({
        material: "wood",
        extents: v2.create(0.5, 1),
        img: wallImg("map-wall-02-rounded.img", 0x1b1f27),
    }),
    police_wall_int_3: createWall({
        material: "wood",
        extents: v2.create(0.5, 1.5),
        img: wallImg("map-wall-03-rounded.img", 0x1b1f27),
    }),
    police_wall_int_4: createWall({
        material: "wood",
        extents: v2.create(0.5, 2),
        img: wallImg("map-wall-04-rounded.img", 0x1b1f27),
    }),
    police_wall_int_6: createWall({
        material: "wood",
        extents: v2.create(0.5, 3),
        img: wallImg("map-wall-06-rounded.img", 0x1b1f27),
    }),
    police_wall_int_7: createWall({
        material: "wood",
        extents: v2.create(0.5, 3.5),
        img: wallImg("map-wall-07-rounded.img", 0x1b1f27),
    }),
    police_wall_int_8: createWall({
        material: "wood",
        extents: v2.create(0.5, 4),
        img: wallImg("map-wall-08-rounded.img", 0x1b1f27),
    }),
    police_wall_int_10: createWall({
        material: "wood",
        extents: v2.create(0.5, 5),
        img: wallImg("map-wall-10-rounded.img", 0x1b1f27),
    }),
    house_wall_int_4: createWall({
        material: "wood",
        extents: v2.create(0.5, 2),
        hitParticle: "tanChip",
        img: wallImg("map-wall-04-rounded.img", 0xa18168),
    }),
    house_wall_int_5: createWall({
        material: "wood",
        extents: v2.create(0.5, 2.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-05-rounded.img", 0xa18168),
    }),
    house_wall_int_8: createWall({
        material: "wood",
        extents: v2.create(0.5, 4),
        hitParticle: "tanChip",
        img: wallImg("map-wall-08-rounded.img", 0xa18168),
    }),
    house_wall_int_9: createWall({
        material: "wood",
        extents: v2.create(0.5, 4.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-09-rounded.img", 0xa18168),
    }),
    house_wall_int_11: createWall({
        material: "wood",
        extents: v2.create(0.5, 5.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-11-rounded.img", 0xa18168),
    }),
    house_wall_int_14: createWall({
        material: "wood",
        extents: v2.create(0.5, 7),
        hitParticle: "tanChip",
        img: wallImg("map-wall-14-rounded.img", 0xa18168),
    }),
    house_column_1: createWall({
        material: "concrete",
        extents: v2.create(1, 1),
        hitParticle: "tanChip",
        img: wallImg("map-column-01.img", 0x554232),
    }),
    cabin_wall_int_5: createWall({
        material: "wood",
        extents: v2.create(0.5, 2.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-05-rounded.img", 0xa18168),
    }),
    cabin_wall_int_10: createWall({
        material: "wood",
        extents: v2.create(0.5, 5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-10-rounded.img", 0xa18168),
    }),
    cabin_wall_int_13: createWall({
        material: "wood",
        extents: v2.create(0.5, 6.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-13-rounded.img", 0xa18168),
    }),
    mansion_wall_int_1: createWall({
        material: "wood",
        extents: v2.create(0.5, 0.5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-01-rounded.img", 0xffdf95),
    }),
    mansion_wall_int_5: createWall({
        material: "wood",
        extents: v2.create(0.5, 2.5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-05-rounded.img", 0xffdf95),
    }),
    mansion_wall_int_6: createWall({
        material: "wood",
        extents: v2.create(0.5, 3),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-06-rounded.img", 0xffdf95),
    }),
    mansion_wall_int_7: createWall({
        material: "wood",
        extents: v2.create(0.5, 3.5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-07-rounded.img", 0xffdf95),
    }),
    mansion_wall_int_8: createWall({
        material: "wood",
        extents: v2.create(0.5, 4),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-08-rounded.img", 0xffdf95),
    }),
    mansion_wall_int_9: createWall({
        material: "wood",
        extents: v2.create(0.5, 4.5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-09-rounded.img", 0xffdf95),
    }),
    mansion_wall_int_10: createWall({
        material: "wood",
        extents: v2.create(0.5, 5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-10-rounded.img", 0xffdf95),
    }),
    mansion_wall_int_11: createWall({
        material: "wood",
        extents: v2.create(0.5, 5.5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-11-rounded.img", 0xffdf95),
    }),
    mansion_wall_int_12: createWall({
        material: "wood",
        extents: v2.create(0.5, 6),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-12-rounded.img", 0xffdf95),
    }),
    mansion_wall_int_13: createWall({
        material: "wood",
        extents: v2.create(0.5, 6.5),
        hitParticle: "ltgreenChip",
        img: wallImg("map-wall-13-rounded.img", 0xffdf95),
    }),
    mansion_column_1: createWall({
        material: "concrete",
        extents: v2.create(1, 1),
        hitParticle: "tanChip",
        img: wallImg("map-column-01.img", 0x716750),
    }),
    saloon_column_1: createWall({
        material: "woodPerm",
        extents: v2.create(1, 1),
        hitParticle: "blackChip",
        img: wallImg("map-column-01.img", 0x1a1a1a),
    }),
    saloon_bar_small: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 5)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
    }),
    saloon_bar_large: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 7.5)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
    }),
    saloon_bar_back_large: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 5)),
        img: {
            sprite: "map-saloon-bar-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
    }),
    saloon_bar_back_small: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 1.5)),
        img: {
            sprite: "map-saloon-bar-02.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
    }),
    stone_wall_int_4: createWall({
        material: "stone",
        extents: v2.create(0.6, 2),
        img: wallImg("map-wall-04-stone.img", 0xffffff),
    }),
    metal_wall_column_4x8: createWall({
        material: "metal",
        extents: v2.create(2, 4),
    }),
    metal_wall_column_5x12: createWall({
        material: "metal",
        extents: v2.create(2.5, 6),
    }),
    wood_perm_wall_ext_5: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 2.5),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_6: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 3),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_7: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 3.5),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_14: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 7),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_17: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 8.5),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_35: createWall({
        material: "woodPerm",
        extents: v2.create(0.5, 17.5),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_thicker_6: createWall({
        material: "woodPerm",
        extents: v2.create(1.5, 3),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_thicker_7: createWall({
        material: "woodPerm",
        extents: v2.create(1.5, 3.5),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_thicker_8: createWall({
        material: "woodPerm",
        extents: v2.create(1.5, 4),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_thicker_10: createWall({
        material: "woodPerm",
        extents: v2.create(1.5, 5),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_thicker_12: createWall({
        material: "woodPerm",
        extents: v2.create(1.5, 6),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_thicker_13: createWall({
        material: "woodPerm",
        extents: v2.create(1.5, 6.5),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_thicker_18: createWall({
        material: "woodPerm",
        extents: v2.create(1.5, 9),
        hitParticle: "blackChip",
    }),
    wood_perm_wall_ext_thicker_21: createWall({
        material: "woodPerm",
        extents: v2.create(1.5, 10.5),
        hitParticle: "blackChip",
    }),
    teahouse_wall_int_3: createWall({
        material: "wood",
        extents: v2.create(0.5, 1.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-03.img", 0x540000, 0.95),
    }),
    teahouse_wall_int_4: createWall({
        material: "wood",
        extents: v2.create(0.5, 2),
        hitParticle: "tanChip",
        img: wallImg("map-wall-04.img", 0x540000, 0.95),
    }),
    teahouse_wall_int_5: createWall({
        material: "wood",
        extents: v2.create(0.5, 2.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-05.img", 0x540000, 0.95),
    }),
    teahouse_wall_int_7: createWall({
        material: "wood",
        extents: v2.create(0.5, 3.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-07.img", 0x540000, 0.95),
    }),
    teahouse_wall_int_12: createWall({
        material: "wood",
        extents: v2.create(0.5, 6),
        hitParticle: "tanChip",
        img: wallImg("map-wall-12.img", 0x540000, 0.95),
    }),
    teahouse_wall_int_13: createWall({
        material: "wood",
        extents: v2.create(0.5, 6.5),
        hitParticle: "tanChip",
        img: wallImg("map-wall-13.img", 0x540000, 0.95),
    }),
    teahouse_wall_int_14: createWall({
        material: "wood",
        extents: v2.create(0.5, 7),
        hitParticle: "tanChip",
        img: wallImg("map-wall-14.img", 0x540000, 0.95),
    }),
    teahouse_wall_int_18: createWall({
        material: "wood",
        extents: v2.create(0.5, 9),
        hitParticle: "tanChip",
        img: wallImg("map-wall-18.img", 0x540000, 0.95),
    }),
    teahouse_window_open_01: createLowWall({
        img: { tint: 0xba692b },
    }),
    grassy_wall_3: createWall({
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        material: "wood",
        extents: v2.create(0.375, 1.5),
        hitParticle: "tanChip",
        img: {
            sprite: "map-wall-03-grassy.img",
            residue: "map-wall-03-grassy-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        map: { display: true, color: 0x6f1e00, scale: 1 },
        health: 300,
    }),
    grassy_wall_8: createWall({
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        material: "wood",
        extents: v2.create(0.375, 4),
        hitParticle: "tanChip",
        img: {
            sprite: "map-wall-08-grassy.img",
            residue: "map-wall-08-grassy-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        map: { display: true, color: 0x6f1e00, scale: 1 },
        health: 300,
    }),
    club_wall_int_6: createWall({
        material: "wood",
        extents: v2.create(0.5, 3),
        hitParticle: "tanChip",
        img: wallImg("map-wall-06-rounded.img", 0xa18168),
    }),
    club_wall_int_10: createWall({
        material: "wood",
        extents: v2.create(0.5, 5),
        hitParticle: "redChip",
        img: wallImg("map-wall-10-rounded.img", 0x6e272c),
    }),
    club_bar_small: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 4.5)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
    }),
    club_bar_large: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 7)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
    }),
    club_bar_back_large: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 7.5)),
        img: {
            sprite: "map-club-bar-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
    }),
    bathhouse_column_1: createWall({
        material: "concrete",
        extents: v2.create(2, 2),
        hitParticle: "whiteChip",
        img: wallImg("map-bathhouse-column-01.img", 0xcdb579),
    }),
    bathhouse_column_2: createWall({
        material: "concrete",
        extents: v2.create(1, 1),
        hitParticle: "whiteChip",
        img: wallImg("map-bathhouse-column-02.img", 0xcdb579),
    }),
    bridge_lg_under_column: createWall({
        material: "concrete",
        extents: v2.create(2.5, 10),
    }),
    concrete_wall_column_5x4: createWall({
        material: "concrete",
        extents: v2.create(2.5, 2),
    }),
    bridge_rail_3: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.4, 2)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
    }),
    rail_4: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.4, 2.5)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
    }),
    bridge_rail_12: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.4, 6.5)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
    }),
    bridge_xlg_under_column: createWall({
        material: "concrete",
        extents: v2.create(2.5, 14),
    }),
    concrete_wall_column_9x4: createWall({
        material: "concrete",
        extents: v2.create(4.5, 2),
    }),
    bridge_rail_20: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.4, 10)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
    }),
    bridge_rail_28: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.4, 14)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
    }),
    brick_wall_ext_3_0_low: createLowWall({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.5, 1.5)),
        img: {
            sprite: "",
            scale: 0.5,
            alpha: 1,
            tint: 0x440000,
            zIdx: 10,
        },
    }),
    brick_wall_ext_11_5: createWall({
        material: "brick",
        extents: v2.create(0.5, 5.75),
    }),
    container_wall_top: createWall({
        material: "metal",
        extents: v2.create(2.75, 0.4),
    }),
    container_wall_side: createWall({
        material: "metal",
        extents: v2.create(0.4, 5.5),
    }),
    container_wall_side_open: createWall({
        material: "metal",
        extents: v2.create(0.4, 6),
    }),
} as const satisfies Record<string, MapObjectDef>;

export const BuildingObjects = BuildingObjectDefs;
