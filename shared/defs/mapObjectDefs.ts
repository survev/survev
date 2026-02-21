import { collider } from "../utils/collider";
import { util } from "../utils/util";
import { v2 } from "../utils/v2";
import type {
    BuildingDef,
    LootSpawnDef,
    MapObjectDef,
    ObstacleDef,
    StructureDef,
} from "./mapObjectsTyping";
import { GameConfig, BuildingGroups, MinDistance, NoSpawnRadius } from "../gameConfig";

// some errors could be fixed by this but opted to using Partial and casting instead to avoid choking the lsp server
// type DeepPartial<T> = T extends object ? {
//     [P in keyof T]?: DeepPartial<T[P]>;
// } : T;

// Helpers
function tierLoot(tier: string, min: number, max: number, props?: LootSpawnDef["props"]) {
    props = props || {};
    return {
        tier,
        min,
        max,
        props,
    };
}
function autoLoot(type: string, count: number, props?: LootSpawnDef["props"]) {
    props = props || {};
    return { type, count, props };
}

function randomObstacleType(types: Record<string, number>) {
    return types;
}

function wallImg(img: string, tint = 0xffffff, alpha = 1, zIdx = 10) {
    return {
        sprite: img,
        scale: 0.5,
        alpha,
        tint,
        zIdx,
    };
}

function createBarrel<T extends ObstacleDef>(params: Partial<T>): T {
    const baseDef = {
        type: "obstacle",
        obstacleType: "barrel",
        scale: { createMin: 1, createMax: 1, destroy: 0.6 },
        collision: collider.createCircle(v2.create(0, 0), 1.75),
        height: 0.5,
        collidable: true,
        destructible: true,
        explosion: "explosion_barrel",
        health: 150,
        hitParticle: "barrelChip",
        explodeParticle: "barrelBreak",
        reflectBullets: true,
        loot: [],
        map: { display: true, color: 6447714, scale: 1 },
        terrain: { grass: true, beach: true },
        img: {
            sprite: "map-barrel-01.img",
            scale: 0.4,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "barrel_bullet",
            punch: "barrel_bullet",
            explode: "barrel_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(baseDef, params || {});
}
function createWoodBarrel<T extends ObstacleDef>(params: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "barrel",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createCircle(v2.create(0, 0), 1.75),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 20,
        hitParticle: "outhouseChip",
        explodeParticle: "barrelPlank",
        reflectBullets: false,
        loot: [tierLoot("tier_world", 1, 1)],
        map: { display: true, color: 0xab6f22, scale: 1 },
        terrain: { grass: true, beach: true },
        img: {
            sprite: "map-barrel-02.img",
            residue: "map-barrel-res-02.img",
            scale: 0.4,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wood_crate_bullet",
            punch: "wood_crate_bullet",
            explode: "barrel_break_02",
            enter: "none",
        },
    };
    return util.mergeDeep(t, params || {});
}
function createBed<T extends ObstacleDef>(params: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "furniture",
        scale: { createMin: 1, createMax: 1, destroy: 0.9 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.8, 3.4)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 100,
        hitParticle: "clothHit",
        explodeParticle: ["woodPlank", "clothBreak"],
        reflectBullets: false,
        loot: [],
        map: { display: true, color: 0x663300, scale: 0.875 },
        terrain: { grass: true, beach: true },
        img: {
            sprite: "map-bed-02.img",
            residue: "map-bed-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "cloth_bullet",
            punch: "cloth_punch",
            explode: "cloth_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, params || {});
}
function createBookShelf<T extends ObstacleDef>(params: Partial<T>): T {
    const ObstacleDef = {
        type: "obstacle",
        obstacleType: "furniture",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3.5, 1)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 75,
        hitParticle: "woodChip",
        explodeParticle: ["woodPlank", "book"],
        reflectBullets: false,
        loot: [tierLoot("tier_world", 1, 1)],
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-bookshelf-01.img",
            residue: "map-drawers-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wood_prop_bullet",
            punch: "wood_prop_bullet",
            explode: "drawers_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(ObstacleDef, params || {});
}
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
function createStatue<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
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
                type: e.statue,
                pos: v2.create(-1, 0),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
function createStatueUnderground<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
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
                type: e.crate,
                pos: v2.create(8.5, 0),
                scale: 0.75,
                ori: 0,
                inheritOri: false,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
function createBush<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1.05, createMax: 1.2, destroy: 1 },
        collision: collider.createCircle(v2.create(0, 0), 1.4),
        height: 10,
        collidable: false,
        destructible: true,
        health: 100,
        hitParticle: "leaf",
        explodeParticle: "leaf",
        reflectBullets: false,
        isBush: true,
        loot: [],
        map: { display: true, color: 0x5f00, scale: 1.5 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-bush-01.img",
            residue: "map-bush-res-01.img",
            scale: 0.5,
            alpha: 0.97,
            tint: 0xffffff,
            zIdx: 60,
        },
        sound: {
            bullet: "bush_bullet",
            punch: "bush_bullet",
            explode: "bush_break_01",
            enter: "bush_enter_01",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createCache<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: { display: true, displayType: "stone_01" },
        terrain: { grass: true, beach: false },
        ori: 0,
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
                type: "stone_02",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
function createCase<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "crate",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.6)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 75,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [],
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-case-deagle-01.img",
            residue: "map-crate-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wood_crate_bullet",
            punch: "wood_crate_bullet",
            explode: "crate_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createChest<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "crate",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.6)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 140,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [tierLoot("tier_pirate_treasure", 3, 4)],
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-chest-01.img",
            residue: "map-crate-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wood_crate_bullet",
            punch: "wood_crate_bullet",
            explode: "crate_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createRiverChest<T extends ObstacleDef>(e: Partial<T>): T {
    const t = createChest({
        collision: collider.createAabbExtents(v2.create(0, 0.8), v2.create(2.25, 0.8)),
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(0, 0.8), v2.create(2.25, 1.6)),
        ],
        terrain: { river: { centerWeight: 1 } },
    });
    return util.mergeDeep(t, e || {});
}
// !
function createContainer(props: {
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
function createCouch<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "furniture",
        scale: { createMin: 1, createMax: 1, destroy: 0.85 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4.5, 1.5)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 125,
        hitParticle: "clothHit",
        explodeParticle: ["woodPlank", "clothBreak"],
        reflectBullets: false,
        loot: [],
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-couch-01.img",
            residue: "map-couch-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "cloth_bullet",
            punch: "cloth_punch",
            explode: "cloth_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createCrate<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "crate",
        scale: { createMin: 1, createMax: 1, destroy: 0.5 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 2.25)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 75,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [tierLoot("tier_world", 1, 1)],
        map: { display: true, color: 0x663300, scale: 0.875 },
        terrain: { grass: true, beach: true, riverShore: true },
        img: {
            sprite: "map-crate-01.img",
            residue: "map-crate-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wood_crate_bullet",
            punch: "wood_crate_bullet",
            explode: "crate_break_02",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createAirdrop<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        obstacleType: "airdrop",
        dropCollision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2.5)),
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2.5)),
        airdropCrate: true,
        scale: { destroy: 1 },
        destructible: false,
        health: 200,
        hitParticle: "barrelChip",
        explodeParticle: "airdropCrate02",
        reflectBullets: true,
        loot: [],
        map: { display: false },
        button: {
            interactionRad: 1,
            interactionText: "game-unlock",
            useOnce: true,
            destroyOnUse: true,
            useDelay: 2.5,
            useDir: v2.create(-1, 0),
            useImg: "map-airdrop-04.img",
            useParticle: "airdropCrate03",
            sound: { on: "airdrop_open_01", off: "" },
        },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "airdrop_open_02",
        },
    } as unknown as Partial<ObstacleDef>;
    return util.mergeDeep(createCrate(t), e || {});
}
function createClassCrate<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "crate",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
        collision: collider.createCircle(v2.create(0, 0), 2.1),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 150,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [tierLoot("tier_world", 1, 1)],
        map: { display: false },
        terrain: { grass: true, beach: true, riverShore: true },
        img: {
            sprite: "map-class-crate-01.img",
            residue: "map-class-crate-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wood_crate_bullet",
            punch: "wood_crate_bullet",
            explode: "crate_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createDepositBox<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "locker",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createAabbExtents(v2.create(0, 0.15), v2.create(2.5, 1)),
        height: 10,
        collidable: true,
        destructible: true,
        health: 20,
        hitParticle: "barrelChip",
        explodeParticle: "depositBoxGreyBreak",
        reflectBullets: true,
        loot: [tierLoot("tier_bank_vault_basic", 1, 1), tierLoot("tier_armor", 0, 1), tierLoot("tier_bank_vault_packs", 0, 1)],
        lootSpawn: { offset: v2.create(0, -1), speedMult: 0 },
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-deposit-box-01.img",
            residue: "none",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "deposit_box_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
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
function createDrawer<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "furniture",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
        collision: collider.createAabbExtents(v2.create(0, 0.15), v2.create(2.5, 1.25)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 75,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [tierLoot("tier_container", 1, 1)],
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-drawers-01.img",
            residue: "map-drawers-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wood_prop_bullet",
            punch: "wood_prop_bullet",
            explode: "drawers_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createGunMount<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "furniture",
        scale: { createMin: 1, createMax: 1, destroy: 0.9 },
        collision: collider.createAabbExtents(v2.create(0, 0.2), v2.create(2.25, 0.7)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 50,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [tierLoot("tier_world", 1, 1)],
        lootSpawn: { offset: v2.create(0, -1), speedMult: 0 },
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-gun-mount-01.img",
            residue: "map-drawers-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wood_prop_bullet",
            punch: "wood_prop_bullet",
            explode: "barrel_break_02",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createLocker<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "locker",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createAabbExtents(v2.create(0, 0.15), v2.create(1.5, 0.6)),
        height: 10,
        collidable: true,
        destructible: true,
        health: 20,
        hitParticle: "barrelChip",
        explodeParticle: "lockerBreak",
        reflectBullets: true,
        loot: [tierLoot("tier_world", 1, 1)],
        lootSpawn: { offset: v2.create(0, -1), speedMult: 0 },
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-locker-01.img",
            residue: "",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "deposit_box_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createControlPanel<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1, 1)),
        height: 0.5,
        collidable: true,
        destructible: true,
        explosion: "explosion_barrel",
        health: 250,
        hitParticle: "barrelChip",
        explodeParticle: "depositBoxGreyBreak",
        reflectBullets: true,
        loot: [],
        map: { display: false },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-power-box-01.img",
            residue: "",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "deposit_box_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createOven<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "furniture",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
        collision: collider.createAabbExtents(v2.create(0, 0.15), v2.create(1.7, 1.3)),
        height: 0.5,
        collidable: true,
        destructible: true,
        explosion: "explosion_barrel",
        health: 200,
        hitParticle: "barrelChip",
        explodeParticle: "barrelBreak",
        reflectBullets: true,
        loot: [],
        map: { display: false, color: 0xe3e3e3, scale: 0.875 },
        terrain: { grass: true, beach: true },
        img: {
            sprite: "map-oven-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "barrel_bullet",
            punch: "barrel_bullet",
            explode: "oven_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createPlanter<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "pot",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 4.25)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 100,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [tierLoot("tier_world", 1, 1)],
        map: { display: true, color: 0x663300, scale: 0.875 },
        terrain: { grass: true, beach: true, riverShore: true },
        img: {
            sprite: "map-planter-01.img",
            residue: "map-planter-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "toilet_porc_bullet",
            punch: "toilet_porc_bullet",
            explode: "ceramic_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createBottle<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "pot",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createCircle(v2.create(0, 0), 1.5),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 50,
        hitParticle: "potChip",
        explodeParticle: "potBreak",
        reflectBullets: false,
        loot: [tierLoot("tier_world", 1, 1)],
        map: { display: true, color: 0x663300, scale: 1 },
        terrain: { grass: true, beach: true },
        img: {
            sprite: "map-pot-01.img",
            residue: "map-pot-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "toilet_porc_bullet",
            punch: "toilet_porc_bullet",
            explode: "toilet_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createBottle2<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.5, 0.5)),
        height: 0.3,
        collidable: true,
        destructible: false,
        health: 50,
        hitParticle: "bottleBlueChip",
        explodeParticle: "bottleBlueBreak",
        reflectBullets: false,
        loot: [],
        map: { display: true, color: 0x663300, scale: 1 },
        terrain: { grass: true, beach: true },
        img: {
            sprite: "map-bottle-02.img",
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
        button: {
            interactionRad: 1.25,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-bottle-03.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
    };
    return util.mergeDeep(t, e || {});
}
function createPotato<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createCircle(v2.create(0, 0), 1.1),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 100,
        hitParticle: "potatoChip",
        explodeParticle: "potatoBreak",
        reflectBullets: false,
        swapWeaponOnDestroy: true,
        regrow: true,
        regrowTimer: 60,
        loot: [tierLoot("tier_potato_perks", 1, 1)],
        map: { display: false, color: 0x907155, scale: 1 },
        terrain: { grass: true, beach: true, riverShore: true },
        img: {
            sprite: "map-potato-01.img",
            residue: "map-potato-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "organic_hit",
            punch: "organic_hit",
            explode: "pumpkin_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}

function createEgg<T extends ObstacleDef>(e: Partial<T>): T {
    const def: ObstacleDef = {
        type: "obstacle",
        scale: {
            createMin: 1,
            createMax: 1,
            destroy: 0.75,
        },
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 80,
        hitParticle: "woodChip",
        explodeParticle: "woodShard",
        reflectBullets: false,
        loot: [tierLoot("tier_egg_outfits", 1, 1)],
        map: {
            display: false,
            color: 0x663300,
            scale: 0.875,
        },
        terrain: {
            grass: true,
            beach: true,
        },
        img: {
            sprite: "map-egg-01.img",
            residue: "map-egg-res-01.img",
            scale: 0.35,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "egg_hit",
            punch: "egg_hit",
            explode: "egg_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(def, e || {});
}

function createPumpkin<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createCircle(v2.create(0, 0), 1.9),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 100,
        reflectBullets: false,
        isDecalAnchor: true,
        hitParticle: "pumpkinChip",
        explodeParticle: "pumpkinBreak",
        loot: [tierLoot("tier_outfits", 1, 1)],
        map: { display: true, color: 0xf27503, scale: 1 },
        terrain: { grass: true, beach: false, riverShore: true },
        img: {
            sprite: "map-pumpkin-01.img",
            residue: "map-pumpkin-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "organic_hit",
            punch: "organic_hit",
            explode: "pumpkin_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createRecorder<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.9, 1.5)),
        height: 0.5,
        collidable: true,
        destructible: false,
        explosion: "explosion_barrel",
        health: 250,
        hitParticle: "barrelChip",
        explodeParticle: "depositBoxGreyBreak",
        reflectBullets: true,
        loot: [],
        map: { display: false },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-recorder-01.img",
            residue: "",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 9,
        },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "deposit_box_break_01",
            enter: "none",
        },
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-recorder-02.img",
            sound: { on: "", off: "" },
        },
    };
    return util.mergeDeep(t, e || {});
}
function createRefrigerator<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
        collision: collider.createAabbExtents(v2.create(0, 0.15), v2.create(1.7, 1.25)),
        height: 0.5,
        collidable: true,
        destructible: false,
        health: 100,
        hitParticle: "redChip",
        explodeParticle: "woodPlank",
        reflectBullets: true,
        loot: [],
        map: { display: false, color: 0x76000b, scale: 0.875 },
        terrain: { grass: true, beach: true },
        img: {
            sprite: "map-refrigerator-01.img",
            residue: "map-crate-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "barrel_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createSandBags<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        map: { display: true, color: 0xca9c63, scale: 1 },
        scale: { createMin: 1, createMax: 1, destroy: 0.5 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3.1, 1.4)),
        height: 0.5,
        collidable: true,
        destructible: false,
        health: 150,
        hitParticle: "goldChip",
        explodeParticle: "barrelBreak",
        reflectBullets: false,
        loot: [],
        img: {
            sprite: "map-sandbags-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wall_brick_bullet",
            punch: "wall_brick_bullet",
            explode: "crate_break_02",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createSilo<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createCircle(v2.create(0, 0), 7.75),
        height: 10,
        collidable: true,
        destructible: false,
        health: 300,
        hitParticle: "barrelChip",
        explodeParticle: "barrelBreak",
        reflectBullets: true,
        loot: [],
        map: { display: true, color: 0x3e3e3e, scale: 1 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-silo-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "silo_bullet",
            punch: "silo_bullet",
            explode: "barrel_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createStone<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1.2, destroy: 0.5 },
        collision: collider.createCircle(v2.create(0, 0), 1.6),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 250,
        reflectBullets: false,
        hitParticle: "rockChip",
        explodeParticle: "rockBreak",
        loot: [],
        map: { display: true, color: 0xb3b3b3, scale: 1 },
        terrain: { grass: true, beach: false, riverShore: true },
        img: {
            sprite: "map-stone-01.img",
            residue: "map-stone-res-01.img",
            scale: 0.4,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "stone_bullet",
            punch: "stone_bullet",
            explode: "stone_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createRiverStone<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 0.8, createMax: 1.2, destroy: 0.5 },
        collision: collider.createCircle(v2.create(0, 0), 2.9),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 500,
        reflectBullets: false,
        hitParticle: "rockChip",
        explodeParticle: "rockBreak",
        loot: [],
        map: { display: true, color: 0x4f4f4f, scale: 1 },
        terrain: {
            grass: false,
            beach: false,
            river: { centerWeight: 0.5 },
            riverShore: false,
        },
        img: {
            sprite: "map-stone-03.img",
            residue: "map-stone-res-02.img",
            scale: 0.4,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "stone_bullet",
            punch: "stone_bullet",
            explode: "stone_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createTable<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "furniture",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
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
        terrain: { grass: true, beach: true },
        img: {
            sprite: "map-table-01.img",
            residue: "map-table-res.img",
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
function createToilet<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        obstacleType: "toilet",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createCircle(v2.create(0, 0.25), 1.18),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 100,
        reflectBullets: false,
        hitParticle: "whiteChip",
        explodeParticle: "toiletBreak",
        loot: [tierLoot("tier_toilet", 2, 3), tierLoot("tier_outfits", 0, 1)],
        map: { display: false, color: 0xb3b3b3, scale: 1 },
        img: {
            sprite: "map-toilet-01.img",
            residue: "map-toilet-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "toilet_porc_bullet",
            punch: "toilet_porc_bullet",
            explode: "toilet_break_01",
            enter: "none",
        },
        terrain: { grass: true, beach: false },
    };
    return util.mergeDeep(t, e || {});
}
function createTree<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 0.8, createMax: 1, destroy: 0.5 },
        collision: collider.createCircle(v2.create(0, 0), 1.55),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(5.75, 5.75)),
        height: 10,
        collidable: true,
        destructible: true,
        health: 175,
        hitParticle: "woodChip",
        explodeParticle: "woodLog",
        reflectBullets: false,
        isTree: true,
        loot: [],
        map: { display: true, color: 0x3e502e, scale: 2.5 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-tree-03.img",
            residue: "map-tree-res-01.img",
            scale: 0.7,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 800,
        },
        sound: {
            bullet: "tree_bullet",
            punch: "tree_bullet",
            explode: "tree_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createTreeSwitch<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
        collision: collider.createCircle(v2.create(0, 0), 1.6),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(5.75, 5.75)),
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-tree-switch-04.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
        height: 0.5,
        collidable: true,
        destructible: false,
        health: 175,
        hitParticle: "woodChip",
        explodeParticle: "woodLog",
        reflectBullets: false,
        loot: [],
        map: { display: false, color: 0x834400, scale: 1 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-tree-switch-01.img",
            residue: "map-tree-res-01.img",
            scale: 0.5,
            alpha: 1,
            zIdx: 10,
            tint: 0xffffff,
        },
        sound: {
            bullet: "tree_bullet",
            punch: "tree_bullet",
            explode: "tree_break_01",
            enter: "none",
        },
    };
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
function createWheel<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createCircle(v2.create(0, 2.3), 4.6),
        height: 10,
        collidable: true,
        destructible: false,
        health: 300,
        hitParticle: "barrelChip",
        explodeParticle: "barrelBreak",
        reflectBullets: true,
        loot: [],
        map: { display: false, color: 0x604a40, scale: 1 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-wheel-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "silo_bullet",
            punch: "silo_bullet",
            explode: "barrel_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}
function createWoodPile<T extends ObstacleDef>(e: Partial<T>): T {
    const t = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 150,
        hitParticle: "woodChip",
        explodeParticle: "woodLog",
        reflectBullets: false,
        loot: [],
        map: { display: false, color: 0x904800, scale: 0.875 },
        terrain: {},
        img: {
            sprite: "map-woodpile-01.img",
            residue: "map-woodpile-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "tree_bullet",
            punch: "tree_bullet",
            explode: "tree_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(t, e || {});
}

//
// Buildings
//

function createBank<T extends BuildingDef>(e: Partial<T>): T {
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
        group: { id: BuildingGroups.POIs, minDistance: MinDistance.POIs, noSpawnRadius: NoSpawnRadius.POIs },
    };
    return util.mergeDeep(t, e || {});
}
function createBankVault<T extends BuildingDef>(e: Partial<T>): T {
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
function createBarn<T extends BuildingDef>(e: Partial<T>): T {
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
function createBarnBasement<T extends BuildingDef>(e: Partial<T>): T {
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
function createBridgeLarge<T extends BuildingDef>(e: Partial<T>): T {
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

// @HACK:
type ExtendedBuildingDef = BuildingDef & Record<string, string>;
function createCabin<T extends ExtendedBuildingDef>(e: Partial<T>): T {
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
                type: randomObstacleType({ pot_01: 24, pot_01purple : 1 }),
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
                type: randomObstacleType({ pot_01: 24, pot_01purple : 1 }),
                pos: v2.create(16, 9.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ pot_01: 24, pot_01purple : 1 }),
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
function createHut<T extends BuildingDef>(e: Partial<T>): T {
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
                type: randomObstacleType({ pot_01: 20, "": 4, pot_01purple : 1 }),
                pos: v2.create(4.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ pot_01: 20, "": 4, pot_01purple : 1 }),
                pos: v2.create(4.5, -4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ pot_01: 20, "": 4, pot_01purple : 1 }),
                pos: v2.create(-4.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ pot_01: 20, "": 4, pot_01purple : 1 }),
                pos: v2.create(-4.5, -4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.specialLoot || randomObstacleType({ pot_01: 20, "": 4, pot_01purple : 1 }),
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}
function createLargeHut<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
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
                    sprite: e.ceilingImg || "map-building-hut-ceiling-04.img",
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
    return util.mergeDeep(t, e || {});
}
function createShack3<T extends BuildingDef>(e: Partial<T>): T {
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
                type: randomObstacleType({ pot_01: 24, pot_01purple : 1 }),
                pos: v2.create(-4.25, -1.25),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ pot_01: 24, pot_01purple : 1 }),
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
function createGreenhouse<T extends BuildingDef>(e: Partial<T>): T {
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
        group: { id: BuildingGroups.BunkerSpawns, minDistance: MinDistance.BunkerSpawns, noSpawnRadius: NoSpawnRadius.BunkerSpawns },
    };
    return util.mergeDeep(t, e || {});
}
function createBunkerChrys<T extends StructureDef>(e: Partial<T>): T {
    const t = {
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
                type: e.bunkerType || "bunker_chrys_sublevel_01",
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
    return util.mergeDeep(t, e || {});
}
function createLoggingComplex<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
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
                color: e.groundTintLt || 0x4f4810,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(v2.create(-28.5, 7), v2.create(7, 5)),
                color: e.groundTintDk || 0x5b5a0b,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-24.5, -35),
                    v2.create(5.5, 4.5),
                ),
                color: e.groundTintDk || 0x5b5a0b,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(v2.create(20, 10), v2.create(20, 30)),
                color: e.groundTintDk || 0x5b5a0b,
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
    return util.mergeDeep(t, e || {});
}
function createLoggingComplex2<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { grass: true, beach: false, spawnPriority: 10 },
        mapObstacleBounds: [collider.createCircle(v2.create(0, 0), 40)],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(5, 21.5), v2.create(5.5, 6)),
                color: e.groundTintDk || 0x736a22,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(-17.75, -14),
                    v2.create(6, 4.5),
                ),
                color: e.groundTintDk || 0x736a22,
                roughness: 0.05,
                offsetDist: 0.5,
            },
            {
                bound: collider.createAabbExtents(
                    v2.create(21.5, -10),
                    v2.create(4.75, 3.5),
                ),
                color: e.groundTintDk || 0x736a22,
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
                type: e.tree_08c || "tree_08c",
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
    return util.mergeDeep(t, e || {});
}

function createLoggingComplex3<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
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
                color: e.groundTintDk || 0x736a22,
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
    return util.mergeDeep(t, e || {});
}

function createMansion<T extends ExtendedBuildingDef>(e: Partial<T>): T {
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
                        bush_01: 9,
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
                        bush_01: 9,
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
                        bush_01: 9,
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
                        bush_01: 9,
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
        group: { id: BuildingGroups.POIs, minDistance: MinDistance.POIs, noSpawnRadius: NoSpawnRadius.POIs },
    };
    return util.mergeDeep(t, e || {});
}
function createMansionCellar<T extends BuildingDef>(
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
function createOutHouse<T extends BuildingDef>(e: Partial<T>): T {
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
function createTeaPavilion<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
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
                type: e.left_loot || "pot_03",
                pos: v2.create(4.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.right_loot || "pot_03",
                pos: v2.create(-4.5, 4.5),
                scale: 1,
                ori: 0,
            },
            {
                type: e.center_loot || "loot_tier_airdrop_armor",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    };
    return util.mergeDeep(t, e || {});
}

function createTeahouse(params: { ceilingImgs?: BuildingDef["ceiling_images"] }) {
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

function createTeaHouseComplex<T extends BuildingDef>(
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
        group: { id: BuildingGroups.SniperSpawns, minDistance: MinDistance.SniperSpawns, noSpawnRadius: NoSpawnRadius.SniperSpawns },
    };
    return util.mergeDeep(t, e || {});
}
function createGrassyCover<T extends BuildingDef>(e: Partial<T>): T {
    const t = {
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
    return util.mergeDeep(t, e || {});
}
function createPoliceStation<T extends BuildingDef>(e: Partial<T>): T {
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
                type: "locker_02",
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
                type: randomObstacleType({ crate_06: 2, crate_06red: 1 }), // super90 crate implementation
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
        group: { id: BuildingGroups.POIs, minDistance: MinDistance.POIs, noSpawnRadius: NoSpawnRadius.POIs }
    };
    return util.mergeDeep(t, e || {});
}
function createHouseRed<T extends ExtendedBuildingDef>(e: Partial<T>): T {
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
function createHouseRed2<T extends ExtendedBuildingDef>(e: Partial<T>): T {
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
function createShack2<T extends BuildingDef>(e: Partial<T>): T {
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
function createShack<T extends BuildingDef>(e: Partial<T>): T {
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
function createWarehouse<T extends BuildingDef>(e: Partial<T>): T {
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
                type: "crate_02",
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
function createWarehouse2<T extends BuildingDef>(e: Partial<T>): T {
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
                type: randomObstacleType({ crate_08: 3, crate_09: 1 }),
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
function createWarehouse3<T extends BuildingDef>(e: Partial<T>): T {
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

const MaterialDefs = {
    metal: {
        destructible: false,
        reflectBullets: true,
        hitParticle: "barrelChip",
        explodeParticle: "barrelBreak",
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "barrel_break_01",
            enter: "none",
        },
    },
    wood: {
        destructible: true,
        reflectBullets: false,
        sound: {
            bullet: "wall_wood_bullet",
            punch: "wall_wood_bullet",
            explode: "wall_break_01",
            enter: "none",
        },
    },
    woodPerm: {
        destructible: false,
        reflectBullets: false,
        sound: {
            bullet: "wall_wood_bullet",
            punch: "wall_wood_bullet",
            explode: "wall_break_01",
            enter: "none",
        },
    },
    brick: {
        destructible: false,
        reflectBullets: false,
        hitParticle: "brickChip",
        sound: {
            bullet: "wall_brick_bullet",
            punch: "wall_brick_bullet",
            explode: "wall_break_01",
            enter: "none",
        },
    },
    concrete: {
        destructible: false,
        reflectBullets: false,
        hitParticle: "barrelChip",
        sound: {
            bullet: "concrete_hit",
            punch: "concrete_hit",
            explode: "wall_break_01",
            enter: "none",
        },
    },
    stone: {
        destructible: true,
        stonePlated: true,
        reflectBullets: false,
        hitParticle: "rockChip",
        explodeParticle: "rockBreak",
        sound: {
            bullet: "concrete_hit",
            punch: "concrete_hit",
            explode: "stone_break_01",
            enter: "none",
        },
    },
    glass: {
        destructible: true,
        reflectBullets: false,
        hitParticle: "glassChip",
        explodeParticle: "windowBreak",
        sound: {
            bullet: "glass_bullet",
            punch: "glass_bullet",
            explode: "window_break_01",
            enter: "none",
        },
    },
    cobalt: {
        destructible: false,
        reflectBullets: true,
        hitParticle: "barrelChip",
        explodeParticle: "barrelBreak",
        sound: {
            bullet: "cobalt_bullet",
            punch: "cobalt_bullet",
            explode: "barrel_break_01",
            enter: "none",
        },
    },
};

export const MapObjectDefs: Record<string, MapObjectDef> = {
    barrel_01: createBarrel({}),
    barrel_01b: createBarrel({
        img: { tint: 0xc9c9c9 },
        loot: [
            tierLoot("tier_shotgun_barrel", 1, 1),
            autoLoot("mirv", 1),
            tierLoot("tier_lvl3_chance", 1, 1),
            autoLoot("mirv", 1),
            autoLoot("mirv", 1),
        ],
    }),
    barrel_01bh: createBarrel({
        img: { tint: 0xc9c9c9 },
        loot: [
            tierLoot("tier_surviv", 1, 2),
            autoLoot("coconut", 4),
            autoLoot("coconut", 4),
            autoLoot("coconut", 4),
            autoLoot("mirv", 1),
        ],
    }),
    barrel_01bd: createBarrel({
        explosion: "",
    }),
    barrel_02: createWoodBarrel({ health: 60 }),
    barrel_03: createWoodBarrel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.25, 0.5)),
        health: 20,
        img: {
            sprite: "map-barrel-03.img",
            residue: "map-barrel-res-03.img",
            scale: 0.45,
        },
    }),
    barrel_04: createWoodBarrel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.25, 0.5)),
        health: 20,
        loot: [tierLoot("tier_soviet", 2, 4)],
        img: {
            sprite: "map-barrel-04.img",
            residue: "map-barrel-res-03.img",
            scale: 0.45,
        },
    }),
    barrel_05: createWoodBarrel({
        // coconut barrel
        health: 80,
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-barrel-05.img",
        },
        loot: [
            tierLoot("tier_surviv", 0, 2),
            tierLoot("tier_coconut_outfit", 1, 1),
            autoLoot("coconut", 4),
        ],
    }),
    propane_01: createBarrel({
        collision: collider.createCircle(v2.create(0, 0), 1.25),
        health: 50,
        map: { display: true, color: 0x5fc4, scale: 1 },
        img: { sprite: "map-propane-01.img", scale: 0.4 },
    }),
    bed_sm_01: createBed({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.4, 3.4)),
        img: { sprite: "map-bed-01.img" },
    }),
    bed_lg_01: createBed({
        img: { residue: "map-bed-res-02.img" },
    }),
    bollard_01: {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        collision: collider.createCircle(v2.create(0, 0), 1.25),
        height: 0.5,
        collidable: true,
        destructible: false,
        health: 300,
        hitParticle: "barrelChip",
        explodeParticle: "barrelBreak",
        reflectBullets: true,
        loot: [],
        map: { display: true, color: 0x604a40, scale: 1 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-bollard-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "silo_bullet",
            punch: "silo_bullet",
            explode: "barrel_break_01",
            enter: "none",
        },
    },
    bookshelf_01: createBookShelf({
        img: { sprite: "map-bookshelf-01.img" },
        loot: [tierLoot("tier_world", 1, 1)],
    }),
    bookshelf_02: createBookShelf({
        img: { sprite: "map-bookshelf-02.img" },
        loot: [tierLoot("tier_soviet", 2, 3)],
    }),
    bush_01: createBush({}),
    bush_01b: createBush({ img: { alpha: 1 } }),
    bush_01cb: createBush({
        img: { sprite: "map-bush-01cb.img" },
        map: { color: 0x266f59 },
    } as unknown as Partial<ObstacleDef>),
    bush_01f: createBush({
        img: { sprite: "map-bush-01f.img" },
        map: { color: 0x1b5c08 },
    } as unknown as Partial<ObstacleDef>),
    bush_01sv: createBush({
        hitParticle: "leafPrickly",
        explodeParticle: "leafPrickly",
        img: {
            sprite: "map-bush-01sv.img",
            residue: "map-bush-res-01sv.img",
        },
        map: { color: 0x73802f },
    } as unknown as Partial<ObstacleDef>),
    brush_01sv: createBush({
        scale: {
            createMin: 1.5,
            createMax: 1.75,
            destroy: 0.75,
        },
        health: 150,
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.75, 1.75)),
        hitParticle: "leaf",
        explodeParticle: "leaf",
        img: {
            sprite: "map-brush-01sv.img",
            residue: "map-brush-res-02sv.img",
        },
        map: { color: 0x4f7624 },
    } as unknown as Partial<ObstacleDef>),
    brush_02sv: createBush({
        scale: {
            createMin: 1.5,
            createMax: 1.75,
            destroy: 0.75,
        },
        health: 150,
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.75, 1.75)),
        hitParticle: "leaf",
        explodeParticle: "leaf",
        img: {
            sprite: "map-brush-02sv.img",
            residue: "map-brush-res-02sv.img",
        },
        map: { color: 0x4f7624 },
    } as unknown as Partial<ObstacleDef>),
    bush_01x: createBush({
        map: { color: 0x455d30 },
        img: { sprite: "map-bush-01x.img" },
    } as unknown as Partial<ObstacleDef>),
    bush_02: createBush({ img: { residue: "map-bush-res-02.img" } }),
    bush_03: createBush({
        img: { sprite: "map-bush-03.img", alpha: 1 },
        loot: [tierLoot("tier_pink_bush", 1, 1)],
    }),
    bush_04: createBush({
        hitParticle: "leafRiver",
        explodeParticle: "leafRiver",
        img: {
            sprite: "map-bush-04.img",
            residue: "map-bush-res-04.img",
            alpha: 1,
            scale: 0.5,
        },
        terrain: {
            grass: true,
            river: { centerWeight: 0.3 },
            riverShore: true,
        },
        sound: { enter: "bush_enter_02" },
    }),
    bush_04cb: createBush({
        hitParticle: "leafRiver",
        explodeParticle: "leafRiver",
        img: {
            sprite: "map-bush-04cb.img",
            residue: "map-bush-res-04.img",
            alpha: 1,
            scale: 0.5,
        },
        terrain: {
            grass: true,
            river: { centerWeight: 0.3 },
            riverShore: true,
        },
        sound: { enter: "bush_enter_02" },
        map: { color: 0x2a7b63 },
    } as unknown as Partial<ObstacleDef>),
    bush_05: createBush({
        img: {
            sprite: "map-bush-05.img",
            residue: "map-bush-res-05.img",
        },
        map: { color: 0x6a623d },
    } as unknown as Partial<ObstacleDef>),
    bush_06: createBush({
        collision: collider.createCircle(v2.create(0, 0), 1.75),
        map: { display: true, color: 0xfb9c01, scale: 1.5 },
        img: {
            sprite: "map-bush-06.img",
            residue: "map-bush-res-06.img",
        },
    }),
    bush_06tr: createBush({
        collision: collider.createCircle(v2.create(0, 0), 2.5),
        map: { display: true, color: 0xe2a51a, scale: 1 },
        img: {
            sprite: "map-bush-06tr.img",
            residue: "map-bush-res-06.img",
        },
    }),
    bush_06b: createBush({
        scale: { createMin: 1, createMax: 1 },
        collision: collider.createCircle(v2.create(0, 0), 1.75),
        img: {
            sprite: "map-bush-06.img",
            residue: "map-bush-res-06.img",
            alpha: 1,
        },
        map: { display: true, color: 0xd64100, scale: 1.5 },
    } as unknown as Partial<ObstacleDef>),
    bush_07: createBush({
        hitParticle: "leafRiver",
        explodeParticle: "leafRiver",
        img: {
            sprite: "map-bush-07.img",
            alpha: 1,
            scale: 0.5,
        },
        sound: { enter: "bush_enter_02" },
    }),
    bush_07sp: createBush({
        hitParticle: "leafRiver",
        explodeParticle: "leafRiver",
        map: { display: true, color: 0xa3e0a, scale: 1.5 },
        img: {
            sprite: "map-bush-07sp.img",
            alpha: 1,
            scale: 0.5,
        },
        sound: { enter: "bush_enter_02" },
    }),
    bush_07x: createBush({ img: { sprite: "map-bush-07x.img" } }),
    case_01: createCase({ loot: [autoLoot("deagle", 1, { preloadGuns: true })] }),
    case_02: createCase({
        img: { sprite: "map-case-deagle-02.img" },
        loot: [autoLoot("deagle_dual", 1, { preloadGuns: true })],
    }),
    case_03: createCase({
        health: 140,
        img: {
            sprite: "map-case-hatchet-01.img",
            residue: "map-case-hatchet-res-01.img",
        },
        loot: [tierLoot("tier_hatchet", 1, 1)],
        hitParticle: "blackChip",
    }),
    case_04: createCase({
        health: 140,
        img: {
            sprite: "map-case-flare-01.img",
            residue: "map-case-flare-res-01.img",
        },
        loot: [autoLoot("flare_gun", 1)],
        hitParticle: "blackChip",
        map: { display: true, color: 0x6b3500, scale: 0.85 },
    }),
    case_05: createCase({
        health: 140,
        img: {
            sprite: "map-case-meteor-01.img",
            residue: "map-case-meteor-res-01.img",
        },
        loot: [
            autoLoot("flare_gun", 1),
            autoLoot("strobe", 1),
            autoLoot("strobe", 1),
            autoLoot("strobe", 1),
            autoLoot("strobe", 1),
        ],
        hitParticle: "blackChip",
        map: { display: false, color: 0x6b3500, scale: 0.85 },
    }),
    case_06: createCase({
        health: 140,
        img: { sprite: "map-case-chrys-01.img" },
        loot: [tierLoot("tier_chest_sniper_tea", 1, 1), tierLoot("tier_chest_ar", 1, 2), tierLoot("tier_chest_armor", 0 , 2), 
            tierLoot("tier_chrys_case", 1, 1)],
        hitParticle: "blackChip",
        map: { display: false, color: 0x6b3500, scale: 0.85 },
    }),
    case_07: createCase({
        health: 200,
        img: { sprite: "map-case-ring-01.img" },
        loot: [tierLoot("tier_ring_case", 1, 1)],
        hitParticle: "blackChip",
        map: { display: false, color: 0x6b3500, scale: 0.85 },
    }),
    case_08: createCase({
        health: 140,
        img: { sprite: "map-case-crow-01.img" },
        loot: [
            tierLoot("tier_armor", 1, 1),
            tierLoot("tier_medical", 1, 2),
            tierLoot("tier_crow_case_melee", 1, 1),
            tierLoot("tier_crow_case_skin", 1, 1),
        ],
        hitParticle: "blackChip",
        map: { display: false, color: 0x6b3500, scale: 0.85 },
    }),
    case_08sv: createCase({
        health: 140,
        img: { sprite: "map-case-crow-01.img" },
        loot: [
            tierLoot("tier_armor", 1, 1),
            tierLoot("tier_medical", 1, 2),
            tierLoot("tier_perks", 1, 1),
            tierLoot("tier_crow_case_melee", 1, 1),
            tierLoot("tier_crow_case_skin", 1, 1),
        ],
        hitParticle: "blackChip",
        map: { display: false, color: 0x6b3500, scale: 0.85 },
    }),
    chest_01: createChest({
        loot: [
            tierLoot("tier_chest_sniper", 0, 1),
            tierLoot("tier_chest_ar", 1, 1),
            tierLoot("tier_chest_armor", 1, 2),
            tierLoot("tier_pirate_melee", 1, 1),
            autoLoot("outfitRoyalFortune", 1),
            tierLoot("tier_river_pirate", 1, 1),
        ],
    }),
    chest_01cb: createChest({
        loot: [tierLoot("tier_chest_sniper", 0, 1),
            tierLoot("tier_chest_ar", 2, 2),
            tierLoot("tier_chest_armor", 1, 2), tierLoot("tier_pirate_melee", 1, 1)],
        }),
    chest_02: createChest({
        img: { sprite: "map-chest-02.img" },
        loot: [tierLoot("tier_chest_sniper", 0, 1), 
            tierLoot("tier_chest_ar", 1, 2),
            tierLoot("tier_chest_armor", 1, 1),],
        map: { display: true, color: 7025920, scale: 0.85 },
    }),
    chest_03: createRiverChest({
        img: { sprite: "map-chest-03.img" },
        loot: [tierLoot("tier_chest_sniper", 0, 1),
            tierLoot("tier_chest_ar", 1, 2),
            tierLoot("tier_chest_armor", 1, 2), autoLoot("outfitWaterElem", 1),
            tierLoot("tier_river_pirate", 1, 1)],
        }),
    chest_03cb: createRiverChest({
        img: { sprite: "map-chest-03.img" },
        loot: [tierLoot("tier_chest_sniper", 0, 1),
            tierLoot("tier_chest_ar", 2, 3),
            tierLoot("tier_chest_armor", 1, 2),],
    }),
    chest_03d: createRiverChest({
        img: { sprite: "map-chest-03d.img" },
        loot: [tierLoot("tier_chest_sniper", 0, 1),   
            tierLoot("tier_chest_ar", 2, 3),
            tierLoot("tier_chest_armor", 1, 2), autoLoot("outfitWaterElem", 1)],
    }),
    chest_03f: createRiverChest({
        img: { sprite: "map-chest-03f.img" },
        loot: [tierLoot("tier_chest_sniper", 0, 1),
            tierLoot("tier_chest_ar", 2, 3),
            tierLoot("tier_chest_armor", 1, 2), autoLoot("outfitKhaki", 1)],
    }),
    chest_03sv: createRiverChest({
        img: { sprite: "map-chest-03sv.img" },
        loot: [tierLoot("tier_chest", 3, 5), autoLoot("outfitWaterElem", 1)],
    }),
    chest_03x: createRiverChest({
        img: { sprite: "map-chest-03x.img" },
        loot: [tierLoot("tier_chest_sniper", 0, 1),
            tierLoot("tier_chest_ar", 2, 3),
            tierLoot("tier_chest_armor", 1, 2), autoLoot("outfitWaterElem", 1)],
    }),
    chest_03tr: createRiverChest({
        img: { sprite: "map-chest-03tr.img" },
        loot: [tierLoot("tier_chest", 3, 5), autoLoot("outfitWaterElem", 1)],
    }),
    chest_04: createChest({
        health: 200,
        img: { sprite: "map-case-basement-01.img" },
        loot: [
            tierLoot("tier_noir_outfit", 1, 1),
            tierLoot("tier_chest_04", 1, 1),
            autoLoot("glock_dual", 1),
            autoLoot("smoke", 4),
        ],
        map: { display: false, color: 7025920, scale: 0.85 },
    }),
    chest_04d: createChest({
        health: 200,
        img: { sprite: "map-case-basement-01.img" },
        loot: [
            tierLoot("tier_noir_outfit", 1, 1),
            tierLoot("tier_chest_04", 1, 1),
            autoLoot("9mm", 300),
            autoLoot("smoke", 4),
            autoLoot("backpack02", 1),
        ],
        map: { display: false, color: 7025920, scale: 0.85 },
    }),
    control_panel_01: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.7)),
        button: {
            interactionRad: 0.75,
            interactionText: "game-use",
            useOnce: true,
            useType: "cell_door_01",
            useDelay: 1.1,
            useDir: v2.create(-1, 0),
            useImg: "map-control-panel-02.img",
            sound: { on: "cell_control_01", off: "" },
        },
        img: { sprite: "map-control-panel-01.img" },
    }),
    control_panel_02: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.7)),
        health: 175,
        img: { sprite: "map-control-panel-02.img" },
    }),
    control_panel_02b: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.7)),
        destructible: false,
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-control-panel-01.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
        img: { sprite: "map-control-panel-02.img" },
    }),
    control_panel_03: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.25, 1.2)),
        health: 150,
        img: { sprite: "map-control-panel-03.img" },
    }),
    control_panel_04: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.7)),
        button: {
            interactionRad: 0.75,
            interactionText: "game-use",
            useOnce: true,
            useType: "crossing_door_01",
            useDelay: 4.25,
            useDir: v2.create(1, 0),
            useImg: "map-control-panel-05.img",
            sound: { on: "cell_control_02", off: "" },
        },
        img: { sprite: "map-control-panel-04.img" },
    }),
    control_panel_06: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 1.2)),
        health: 200,
        img: { sprite: "map-control-panel-06.img" },
    }),
    switch_01: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.45, 0.55)),
        destructible: false,
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-switch-02.img",
            offImg: "map-switch-03.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
        img: { sprite: "map-switch-01.img" },
    }),
    switch_02: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.45, 0.55)),
        destructible: false,
        img: { sprite: "map-switch-02.img" },
    }),
    switch_03: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.45, 0.55)),
        destructible: false,
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-switch-02.img",
            offImg: "map-switch-02.img",
            sound: { on: "button_press_01", off: "" },
        },
        img: { sprite: "map-switch-01.img" },
    }),
    couch_01: createCouch({}),
    couch_02: createCouch({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3, 1.5)),
        img: { sprite: "map-couch-02.img" },
    }),
    couch_02b: createCouch({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3, 1.5)),
        img: { sprite: "map-couch-02.img", mirrorY: true },
    }),
    couch_03: createCouch({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        img: { sprite: "map-couch-03.img" },
    }),
    crate_01: createCrate({}),
    crate_01x: createCrate({ img: { sprite: "map-crate-01x.img" } }),
    crate_02: createCrate({
        health: 140,
        loot: [tierLoot("tier_soviet", 3, 5)],
        map: { display: false },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-02.img" },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_02sv: createCrate({
        health: 140,
        loot: [
            tierLoot("tier_soviet", 4, 5),
            tierLoot("tier_world", 1, 1),
            tierLoot("tier_medical", 1, 1),
        ],
        map: { display: true, color: 0xffc000 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-02sv.img" },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_02sv_lake: createCrate({
        health: 140,
        loot: [tierLoot("tier_soviet", 5, 6), tierLoot("tier_medical", 1, 1)],
        map: { display: true, color: 0xffc000 },
        terrain: { lakeCenter: true },
        img: { sprite: "map-crate-02sv.img" },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_02x: createCrate({
        health: 140,
        loot: [tierLoot("tier_soviet", 3, 5)],
        map: { display: false },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-02x.img" },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_02f: createCrate({
        health: 140,
        loot: [
            tierLoot("tier_guns", 3, 3, { preloadGuns: true }),
            tierLoot("tier_armor", 2, 2),
            tierLoot("tier_packs", 1, 1),
        ],
        map: { display: true, color: 0xcc0000 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-02f.img" },
        sound: { explode: "crate_break_01" },
        teamId: 1,
    } as unknown as Partial<ObstacleDef>),
    crate_02d: createCrate({
        health: 140,
        loot: [
            autoLoot("m1014", 1),
            autoLoot("helmet03_lt_aged", 1),
            autoLoot("outfitRedLeaderAged", 1),
            autoLoot("machete_taiga", 1),
        ],
        map: { display: true, color: 0xcc0000 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-02f.img" },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_03: createCrate({
        health: 100,
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.575, 1.575)),
        loot: [tierLoot("tier_throwables", 2, 4), tierLoot("tier_fragtastic", 1, 1)],
        map: { color: 0x4d4d1e, scale: 0.875 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-03.img", scale: 0.35 },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_03x: createCrate({
        health: 100,
        hitParticle: "glassChip",
        explodeParticle: ["glassPlank"],
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.575, 1.575)),
        loot: [autoLoot("snowball", 4), autoLoot("snowball", 4), autoLoot("snowball", 4)],
        map: { color: 0x7c77, scale: 0.875 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-03x.img", scale: 0.35 },
        sound: { explode: "crate_break_02" },
    } as unknown as Partial<ObstacleDef>),
    crate_04: createCrate({
        health: 225,
        destructible: true,
        armorPlated: true,
        hitParticle: "greenChip",
        loot: [tierLoot("tier_ammo_crate", 1, 2)],
        map: { display: true, color: 0x537054, scale: 0.875 },
        img: { sprite: "map-crate-04.img" },
        sound: {
            bullet: "ammo_crate_bullet",
            punch: "ammo_crate_bullet",
            explode: "crate_break_01",
        },
    }),
    crate_05: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2, 2)),
        destructible: false,
        hitParticle: "goldChip",
        loot: [],
        map: { display: false },
        img: { sprite: "map-crate-05.img" },
        sound: {
            bullet: "wall_brick_bullet",
            punch: "wall_brick_bullet",
        },
    }),
    crate_06: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.1)),
        health: 175,
        destructible: true,
        armorPlated: true,
        hitParticle: "greenChip",
        loot: [tierLoot("tier_ammo", 1, 1)],
        map: { display: false },
        img: { sprite: "map-crate-06.img" },
        sound: {
            bullet: "ammo_crate_bullet",
            punch: "ammo_crate_bullet",
        },
    }),
    crate_06s: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.1)),
        health: 175,
        destructible: true,
        armorPlated: true,
        hitParticle: "greenChip",
        loot: [autoLoot("m1014", 1)],
        map: { display: false },
        img: { sprite: "map-crate-06.img" },
        sound: {
            bullet: "ammo_crate_bullet",
            punch: "ammo_crate_bullet",
        },
    }),
    crate_07: createCrate({
        health: 140,
        loot: [
            tierLoot("tier_surviv", 4, 5),
            tierLoot("tier_ak_bunker", 4, 4),
            tierLoot("tier_khaki_outfit", 1, 1),
            tierLoot("tier_khaki_outfit", 1, 1),
            tierLoot("tier_khaki_outfit", 1, 1),
            tierLoot("tier_khaki_outfit", 1, 1),
        ],
        img: { sprite: "map-crate-07.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_07b: createCrate({
        health: 140,
        loot: [
            tierLoot("tier_armor", 4, 5),
            autoLoot("mp220", 1),
            autoLoot("mp220", 1),
            autoLoot("bar", 1),
            autoLoot("bar", 1),
            tierLoot("tier_khaki_outfit", 1, 1),
            tierLoot("tier_khaki_outfit", 1, 1),
            tierLoot("tier_khaki_outfit", 1, 1),
            tierLoot("tier_khaki_outfit", 1, 1),
        ],
        img: { sprite: "map-crate-07.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_07sv: createCrate({
        health: 140,
        loot: [
            tierLoot("tier_surviv", 4, 5),
            autoLoot("svd", 1),
            autoLoot("svd", 1),
            autoLoot("blr", 1),
            autoLoot("blr", 1),
            tierLoot("tier_khaki_outfit", 1, 1),
            tierLoot("tier_khaki_outfit", 1, 1),
            tierLoot("tier_khaki_outfit", 1, 1),
            tierLoot("tier_khaki_outfit", 1, 1),
        ],
        img: { sprite: "map-crate-07.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_08: createCrate({
        health: 140,
        loot: [tierLoot("tier_utility", 2, 3), tierLoot("tier_grey_crate", 1, 1)],
        map: { display: false },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-08.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_09: createCrate({
        health: 140,
        loot: [tierLoot("tier_chest_sniper", 0, 1),
            tierLoot("tier_chest_ar", 2, 2),
            tierLoot("tier_chest_armor", 1, 2), tierLoot("tier_conch", 1, 1)],
        map: { display: false },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-09.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_09bh: createCrate({
        health: 140,
        loot: [tierLoot("tier_soviet", 3, 5), tierLoot("tier_outfits", 1, 1)],
        map: { display: false },
        img: { sprite: "map-crate-09.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_10: createCrate({
        health: 200,
        scale: { destroy: 0.75 },
        loot: [
            tierLoot("tier_airdrop_uncommon", 1, 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 2, 2),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_outfits", 1, 1),
            tierLoot("tier_airdrop_melee", 1, 1),
            tierLoot("tier_airdrop_ammo", 3, 3),
            tierLoot("tier_airdrop_throwables", 1, 1),
        ],
        map: { display: false },
        img: {
            sprite: "map-crate-10.img",
            residue: "map-crate-res-03.img",
        },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    /*EU-Comp Special Supply Drop
    crate_supply_01: createCrate({
        health: 100,
        scale: { destroy: 0.75 },
        loot: [
            tierLoot("tier_supply_meds", 4, 5),
            tierLoot("tier_supply_armor", 3, 5),
            tierLoot("tier_supply_pistols", 1, 1),
            tierLoot("tier_supply_scopes", 1, 2),
            tierLoot("tier_supply_nades", 1, 2),            
            tierLoot("tier_supply_ammo", 1, 1),
        ],
        map: { display: true },
        img: {
            sprite: "map-supply-03.img",
            residue: "map-supply-res-03.img",
        },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
     */
    crate_11: createCrate({
        scale: { destroy: 0.75 },
        health: 200,
        loot: [
            tierLoot("tier_airdrop_rare", 1, 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 2, 2),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_outfits", 1, 1),
            tierLoot("tier_airdrop_melee", 1, 1),
            tierLoot("tier_airdrop_ammo", 3, 3),
            tierLoot("tier_airdrop_throwables", 1, 1),
        ],
        map: { display: false },
        img: {
            sprite: "map-crate-11.img",
            residue: "map-crate-res-03.img",
        },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_11h: createCrate({
        collision: collider.createCircle(v2.create(0, 0), 2.25),
        isDecalAnchor: true,
        scale: { destroy: 0.75 },
        health: 200,
        loot: [
            tierLoot("tier_airdrop_rare", 1, 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 2, 2),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_outfits", 1, 1),
            tierLoot("tier_outfits", 1, 1),
            tierLoot("tier_airdrop_melee", 1, 1),
            tierLoot("tier_airdrop_ammo", 3, 3),
            tierLoot("tier_airdrop_throwables", 1, 1),
            tierLoot("tier_airdrop_xp", 2, 2),
        ],
        map: { display: false },
        img: {
            sprite: "map-crate-11h.img",
            residue: "map-crate-res-03.img",
        },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_10sv: createCrate({
        health: 200,
        scale: { destroy: 0.75 },
        loot: [
            tierLoot("tier_airdrop_uncommon", 1, 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 2, 2),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_outfits", 1, 1),
            tierLoot("tier_airdrop_melee", 1, 1),
            tierLoot("tier_airdrop_ammo", 3, 3),
            tierLoot("tier_airdrop_throwables", 1, 1),
            tierLoot("tier_perks", 1, 1),
        ],
        map: { display: false },
        img: {
            sprite: "map-crate-10.img",
            residue: "map-crate-res-03.img",
        },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_11sv: createCrate({
        scale: { destroy: 0.75 },
        health: 200,
        loot: [
            tierLoot("tier_airdrop_rare", 1, 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 2, 2),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_outfits", 1, 1),
            tierLoot("tier_airdrop_melee", 1, 1),
            tierLoot("tier_airdrop_ammo", 3, 3),
            tierLoot("tier_airdrop_throwables", 1, 1),
            tierLoot("tier_perks", 2, 2),
        ],
        map: { display: false },
        img: {
            sprite: "map-crate-11.img",
            residue: "map-crate-res-03.img",
        },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_11de: createCrate({
        scale: { destroy: 0.75 },
        health: 200,
        loot: [
            tierLoot("tier_airdrop_rare", 1, 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 2, 2),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_outfits", 1, 1),
            tierLoot("tier_airdrop_melee", 1, 1),
            tierLoot("tier_airdrop_ammo", 3, 3),
            tierLoot("tier_airdrop_throwables", 1, 1),
            tierLoot("tier_perks", 1, 1),
        ],
        map: { display: false },
        img: {
            sprite: "map-crate-11.img",
            residue: "map-crate-res-03.img",
        },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_11tr: createCrate({
        scale: { destroy: 0.75 },
        health: 200,
        loot: [
            tierLoot("tier_airdrop_rare", 1, 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 2, 2),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_outfits", 1, 1),
            tierLoot("tier_airdrop_melee", 1, 1),
            tierLoot("tier_airdrop_ammo", 3, 3),
            tierLoot("tier_airdrop_throwables", 1, 1),
            tierLoot("tier_airdrop_xp", 2, 2),
        ],
        map: { display: false },
        img: {
            sprite: "map-crate-11.img",
            residue: "map-crate-res-03.img",
        },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_12: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3.5, 3.5)),
        scale: { destroy: 0.75 },
        health: 500,
        loot: [
            tierLoot("tier_airdrop_rare", 2, 2, {
                preloadGuns: true,
            }),
            tierLoot("tier_airdrop_uncommon", 4, 6, {
                preloadGuns: true,
            }),
            tierLoot("tier_airdrop_armor", 4, 5),
            tierLoot("tier_medical", 12, 15),
            tierLoot("tier_airdrop_scopes", 6, 8),
            tierLoot("tier_airdrop_outfits", 3, 4),
            tierLoot("tier_airdrop_melee", 5, 7),
            tierLoot("tier_airdrop_ammo", 10, 12),
            tierLoot("tier_airdrop_throwables", 6, 8),
            tierLoot("tier_katanas", 1, 1),
        ],
        map: { display: false },
        img: {
            sprite: "map-crate-12.img",
            residue: "map-crate-res-03.img",
        },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_13: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3.5, 3.5)),
        scale: { destroy: 0.75 },
        health: 200,
        loot: [
            tierLoot("tier_airdrop_mythic", 3, 4, {
                preloadGuns: true,
            }),
            tierLoot("tier_airdrop_rare", 3, 4, {
                preloadGuns: true,
            }),
            tierLoot("tier_airdrop_armor", 6, 8),
            tierLoot("tier_medical", 12, 15),
            tierLoot("tier_airdrop_scopes", 6, 8),
            tierLoot("tier_airdrop_faction_outfits", 1, 2),
            tierLoot("tier_airdrop_faction_melee", 3, 4),
            tierLoot("tier_airdrop_ammo", 10, 12),
            tierLoot("tier_airdrop_throwables", 6, 8),
            tierLoot("tier_katanas", 1, 1),
            autoLoot("strobe", 1),
            autoLoot("strobe", 1),
            autoLoot("strobe", 1),
        ],
        map: { display: false },
        img: {
            sprite: "map-crate-13.img",
            residue: "map-crate-res-03.img",
        },
        sound: { explode: "crate_break_01" },
    } as unknown as Partial<ObstacleDef>),
    crate_14: createCrate({
        explodeParticle: ["windowBreak", "woodPlank"],
        loot: [tierLoot("tier_beverage_crate", 1, 1), tierLoot("tier_better_throwables", 0, 1)],
        img: { sprite: "map-crate-14.img" },
        sound: { explode: "window_break_02" },
    }),
    crate_14a: createCrate({
        explodeParticle: ["windowBreak", "woodPlank"],
        loot: [tierLoot("tier_beverage_crate", 1, 1), tierLoot("tier_better_throwables", 0, 1)],
        img: { sprite: "map-crate-14a.img" },
        sound: { explode: "window_break_02" },
    }),
    crate_15: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.7, 1.25)),
        health: 100,
        loot: [tierLoot("tier_beverage_crate", 1, 1), tierLoot("tier_better_throwables", 0, 1)],
        map: { display: false },
        terrain: { grass: true, beach: true },
        img: { sprite: "map-crate-14.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_16: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.7, 1.25)),
        health: 100,
        loot: [tierLoot("tier_knives", 4, 4)],
        map: { display: false },
        terrain: { grass: true, beach: true },
        img: { sprite: "map-crate-14.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_18: createCrate({
        health: 140,
        loot: [tierLoot("tier_cattle_crate", 2, 3), tierLoot("tier_soviet", 1, 2)],
        map: { display: true, color: 0xc45900, scale: 0.875 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-18.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_19: createCrate({
        health: 140,
        loot: [tierLoot("tier_guns", 1, 3), tierLoot("tier_surviv", 2, 3)],
        map: { display: true, color: 0x44ab00, scale: 0.875 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-19.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_20: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.7, 1.7)),
        health: 75,
        hitParticle: "greenChip",
        explodeParticle: "greenPlank",
        loot: [tierLoot("tier_armor", 1, 1), tierLoot("tier_medical", 1, 1), tierLoot("tier_crab", 1, 1)],
        map: { display: true, color: 0x3b452f, scale: 1 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-20.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_21: createCrate({
        health: 140,
        loot: [
            tierLoot("tier_guns", 1, 2),
            tierLoot("tier_snipers", 1, 1),
            tierLoot("tier_cloud_02", 1, 1),
            tierLoot("tier_perks", 1, 1),
        ],
        map: { display: true, color: 0x496f, scale: 0.875 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-21.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_21b: createCrate({
        health: 140,
        loot: [
            tierLoot("tier_guns", 1, 2),
            tierLoot("tier_snipers", 1, 1),
            tierLoot("tier_cloud_02", 1, 1),
            tierLoot("tier_perks", 1, 1),
        ],
        map: { display: false, color: 0x496f, scale: 0.875 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-21.img" },
        sound: { explode: "crate_break_01" },
    }),
    crate_22: createCrate({
        health: 140,
        loot: [
            tierLoot("tier_guns", 3, 3, { preloadGuns: true }),
            tierLoot("tier_armor", 2, 2),
            tierLoot("tier_packs", 1, 1),
        ],
        map: { display: true, color: 32511 },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-22.img" },
        sound: { explode: "crate_break_01" },
        teamId: 2,
    }),
    crate_22d: createCrate({
        health: 140,
        loot: [
            autoLoot("an94", 1),
            autoLoot("helmet03_lt_aged", 1),
            autoLoot("outfitBlueLeaderAged", 1),
            autoLoot("kukri_trad", 1),
        ],
        map: { display: true, color: 0x7eff },
        terrain: { grass: true, beach: false },
        img: { sprite: "map-crate-22.img" },
        sound: { explode: "crate_break_01" },
    }),
    // Survev.de crates
    case_03purple: createCase({
        health: 140,
        img: {
            sprite: "map-case-hatchet-01purple.img",
            residue: "map-case-hatchet-res-01.img",
        },
        loot: [autoLoot("vector45", 1)],
        hitParticle: "blackChip",
    }),
    crate_06red: createCrate({ // super90 crate
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.1)),
        health: 175,
        destructible: true,
        armorPlated: true,
        hitParticle: "greenChip",
        loot: [autoLoot("m1014", 1)],
        map: { display: false },
        img: { sprite: "map-crate-06red.img" },
        sound: {
            bullet: "ammo_crate_bullet",
            punch: "ammo_crate_bullet",
        },
    }),
    airdrop_crate_01: createAirdrop({
        button: {
            useImg: "map-airdrop-02.img",
            useParticle: "airdropCrate01",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-01.img",
            residue: "none",
        },
        destroyType: "crate_10",
        explodeParticle: "airdropCrate02",
    } as unknown as Partial<ObstacleDef>),
    airdrop_crate_02: createAirdrop({
        button: {
            useImg: "map-airdrop-02.img",
            useParticle: "airdropCrate01",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-01.img",
            residue: "none",
        },
        destroyType: "crate_11",
        explodeParticle: "airdropCrate02",
    } as unknown as Partial<ObstacleDef>),
    airdrop_crate_03: createAirdrop({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4, 4)),
        button: {
            useImg: "map-airdrop-04.img",
            useParticle: "airdropCrate03",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-03.img",
            residue: "none",
        },
        destroyType: "crate_12",
        explodeParticle: "airdropCrate04",
    } as unknown as Partial<ObstacleDef>),
    airdrop_crate_04: createAirdrop({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4, 4)),
        button: {
            useImg: "map-airdrop-04.img",
            useParticle: "airdropCrate03",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-03.img",
            residue: "none",
        },
        destroyType: "crate_13",
        explodeParticle: "airdropCrate04",
    } as unknown as Partial<ObstacleDef>),
    airdrop_crate_01sv: createAirdrop({
        button: {
            useImg: "map-airdrop-02.img",
            useParticle: "airdropCrate01",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-01.img",
            residue: "none",
        },
        destroyType: "crate_10sv",
        explodeParticle: "airdropCrate02",
    } as unknown as Partial<ObstacleDef>),
    airdrop_crate_02sv: createAirdrop({
        button: {
            useImg: "map-airdrop-02.img",
            useParticle: "airdropCrate01",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-01.img",
            residue: "none",
        },
        destroyType: "crate_11sv",
        explodeParticle: "airdropCrate02",
    } as unknown as Partial<ObstacleDef>),
    airdrop_crate_02de: createAirdrop({
        button: {
            useImg: "map-airdrop-02.img",
            useParticle: "airdropCrate01",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-01.img",
            residue: "none",
        },
        destroyType: "crate_11de",
        explodeParticle: "airdropCrate02",
    } as unknown as Partial<ObstacleDef>),
    airdrop_crate_02h: createAirdrop({
        collision: collider.createCircle(v2.create(0, 0), 2.5),
        button: {
            useImg: "map-airdrop-02h.img",
            useParticle: "airdropCrate01h",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-01h.img",
            residue: "none",
        },
        destroyType: "cache_pumpkin_airdrop_02",
        explodeParticle: "airdropCrate02h",
    } as unknown as Partial<ObstacleDef>),
    airdrop_crate_02tr: createAirdrop({
        button: {
            useImg: "map-airdrop-02.img",
            useParticle: "airdropCrate01",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-01.img",
            residue: "none",
        },
        destroyType: "crate_11tr",
        explodeParticle: "airdropCrate02",
    } as unknown as Partial<ObstacleDef>),
    airdrop_crate_01x: createAirdrop({
        button: {
            useImg: "map-airdrop-02x.img",
            useParticle: "airdropCrate01x",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-01x.img",
            residue: "none",
        },
        destroyType: "crate_10",
        explodeParticle: "airdropCrate02x",
    } as unknown as Partial<ObstacleDef>),
    airdrop_crate_02x: createAirdrop({
        button: {
            useImg: "map-airdrop-02x.img",
            useParticle: "airdropCrate01x",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-airdrop-01x.img",
            residue: "none",
        },
        destroyType: "crate_11",
        explodeParticle: "airdropCrate02x",
    } as unknown as Partial<ObstacleDef>),
    class_shell_01: createAirdrop({
        collision: collider.createCircle(v2.create(0, 0), 2.25),
        button: {
            useImg: "map-class-shell-01b.img",
            useParticle: "classShell01a",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-class-shell-01a.img",
            residue: "none",
        },
        destroyType: "class_crate_common",
        smartLoot: true,
        explodeParticle: "classShell01b",
    } as unknown as Partial<ObstacleDef>),
    class_shell_02: createAirdrop({
        collision: collider.createCircle(v2.create(0, 0), 2.25),
        button: {
            useImg: "map-class-shell-02b.img",
            useParticle: "classShell02a",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-class-shell-02a.img",
            residue: "none",
        },
        destroyType: "class_crate_rare",
        smartLoot: true,
        explodeParticle: "classShell02b",
    } as unknown as Partial<ObstacleDef>),
    class_shell_03: createAirdrop({
        collision: collider.createCircle(v2.create(0, 0), 2.25),
        button: {
            useImg: "map-class-shell-03b.img",
            useParticle: "classShell03a",
            sound: { on: "airdrop_open_01", off: "" },
        },
        img: {
            sprite: "map-class-shell-03a.img",
            residue: "none",
            zIdx: 20,
        },
        destroyType: "class_crate_mythic",
        explodeParticle: "classShell03b",
    } as unknown as Partial<ObstacleDef>),
    class_crate_common_scout: createClassCrate({
        loot: [
            tierLoot("tier_guns_common_scout", 1, 1),
            autoLoot("crowbar_scout", 1),
            autoLoot("helmet01", 1),
            autoLoot("backpack01", 1),
            autoLoot("soda", 1),
            autoLoot("soda", 1),
            autoLoot("soda", 1),
        ],
        img: { sprite: "map-class-crate-scout.img" },
    }),
    class_crate_common_sniper: createClassCrate({
        loot: [
            tierLoot("tier_guns_common_sniper", 1, 1),
            autoLoot("kukri_sniper", 1),
            autoLoot("helmet01", 1),
            autoLoot("backpack01", 1),
            autoLoot("4xscope", 1),
        ],
        img: { sprite: "map-class-crate-sniper.img" },
    }),
    class_crate_common_healer: createClassCrate({
        loot: [
            tierLoot("tier_guns_common_healer", 1, 1),
            autoLoot("bonesaw_healer", 1),
            autoLoot("helmet01", 1),
            autoLoot("backpack01", 1),
            autoLoot("healthkit", 1),
            autoLoot("painkiller", 1),
            autoLoot("smoke", 3),
        ],
        img: { sprite: "map-class-crate-healer.img" },
    }),
    class_crate_common_demo: createClassCrate({
        loot: [
            tierLoot("tier_guns_common_demo", 1, 1),
            autoLoot("katana_demo", 1),
            autoLoot("helmet01", 1),
            autoLoot("backpack02", 1),
            autoLoot("mirv", 1),
            autoLoot("mirv", 1),
            autoLoot("mirv", 1),
            autoLoot("mirv", 1),
            autoLoot("mirv", 1),
            autoLoot("mirv", 1),
        ],
        img: { sprite: "map-class-crate-demo.img" },
    }),
    class_crate_common_assault: createClassCrate({
        loot: [
            tierLoot("tier_guns_common_assault", 2, 2),
            autoLoot("spade_assault", 1),
            autoLoot("helmet01", 1),
            autoLoot("backpack01", 1),
        ],
        img: { sprite: "map-class-crate-assault.img" },
    }),
    class_crate_common_tank: createClassCrate({
        loot: [
            tierLoot("tier_guns_common_tank", 1, 1),
            autoLoot("warhammer_tank", 1),
            autoLoot("helmet02", 1),
            autoLoot("chest02", 1),
            autoLoot("backpack01", 1),
        ],
        img: { sprite: "map-class-crate-tank.img" },
    }),
    class_crate_rare_scout: createClassCrate({
        loot: [
            tierLoot("tier_guns_rare_scout", 1, 1),
            autoLoot("crowbar_scout", 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 1, 1),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_ammo", 2, 2),
            tierLoot("tier_airdrop_throwables", 1, 1),
        ],
        img: { sprite: "map-class-crate-scout.img" },
    }),
    class_crate_rare_sniper: createClassCrate({
        loot: [
            tierLoot("tier_guns_rare_sniper", 1, 1),
            autoLoot("kukri_sniper", 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 1, 1),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_ammo", 2, 2),
            tierLoot("tier_airdrop_throwables", 1, 1),
        ],
        img: { sprite: "map-class-crate-sniper.img" },
    }),
    class_crate_rare_healer: createClassCrate({
        loot: [
            tierLoot("tier_guns_rare_healer", 1, 1),
            autoLoot("bonesaw_healer", 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 1, 1),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_ammo", 2, 2),
            tierLoot("tier_airdrop_throwables", 1, 1),
        ],
        img: { sprite: "map-class-crate-healer.img" },
    }),
    class_crate_rare_demo: createClassCrate({
        loot: [
            tierLoot("tier_guns_rare_demo", 1, 1),
            autoLoot("katana_demo", 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 1, 1),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_ammo", 2, 2),
            tierLoot("tier_airdrop_throwables", 1, 1),
        ],
        img: { sprite: "map-class-crate-demo.img" },
    }),
    class_crate_rare_assault: createClassCrate({
        loot: [
            tierLoot("tier_guns_rare_assault", 2, 2),
            autoLoot("spade_assault", 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 1, 1),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_ammo", 2, 2),
            tierLoot("tier_airdrop_throwables", 1, 1),
        ],
        img: { sprite: "map-class-crate-assault.img" },
    }),
    class_crate_rare_tank: createClassCrate({
        loot: [
            tierLoot("tier_guns_rare_tank", 1, 1),
            autoLoot("warhammer_tank", 1),
            tierLoot("tier_airdrop_armor", 1, 1),
            tierLoot("tier_medical", 1, 1),
            tierLoot("tier_airdrop_scopes", 1, 1),
            tierLoot("tier_airdrop_ammo", 2, 2),
            tierLoot("tier_airdrop_throwables", 1, 1),
        ],
        img: { sprite: "map-class-crate-tank.img" },
    }),
    class_crate_mythic: createClassCrate({
        loot: [tierLoot("tier_class_crate_mythic", 1, 1)],
        img: { sprite: "map-class-crate-03.img" },
    }),
    mil_crate_01: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.7, 1.25)),
        health: 100,
        loot: [tierLoot("tier_knives", 1, 1)],
        map: { display: false },
        terrain: { grass: true, beach: true },
        img: { sprite: "map-crate-mil-01.img" },
        sound: { explode: "crate_break_01" },
    }),
    mil_crate_02: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.7, 1.25)),
        health: 100,
                loot: [tierLoot("tier_ot_military_crate", 4, 4),],
        map: { display: false },
        terrain: { grass: true, beach: true },
        img: { sprite: "map-crate-mil-02.img" },
        sound: { explode: "crate_break_01" },
    }),
    mil_crate_03: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.7, 1.25)),
        health: 100,
        loot: [autoLoot("ots38_dual", 1), autoLoot("outfitWhite", 1)], // TODO: Remove Arctic Avenger when the survevr pass is added.
        map: { display: false },
        terrain: { grass: true, beach: true },
        img: { sprite: "map-crate-mil-03.img" },
        sound: { explode: "crate_break_01" },
    }),
    // club mil crate
    mil_crate_04: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.7, 1.25)),
        health: 100,
        loot: [tierLoot("tier_ak_military_crate", 1, 1), tierLoot("tier_better_throwables", 1, 2)],
        map: { display: false },
        terrain: { grass: true, beach: true },
        img: { sprite: "map-crate-mil-04.img" },
        sound: { explode: "crate_break_01" },
    }),
    mil_crate_05: createCrate({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.7, 1.25)),
        health: 100,
        loot: [tierLoot("tier_guns", 1, 2), tierLoot("tier_snipers", 1, 2)],
        map: { display: true, color: 0x374626 },
        terrain: { grass: true, beach: true },
        img: { sprite: "map-crate-mil-05.img" },
        sound: { explode: "crate_break_01" },
    }),
    bottle_01: createBottle({
        collision: collider.createCircle(v2.create(0, 0), 0.5),
        health: 12,
        hitParticle: "bottleBrownChip",
        explodeParticle: "bottleBrownBreak",
        img: {
            sprite: "map-bottle-01.img",
            residue: "none",
        },
        loot: [],
        sound: {
            bullet: "glass_bullet",
            punch: "glass_bullet",
            explode: "window_break_01",
            enter: "none",
        },
    }),
    bottle_02: createBottle({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.5, 0.5)),
        health: 20,
        hitParticle: "bottleBlueChip",
        explodeParticle: "bottleBlueBreak",
        img: {
            sprite: "map-bottle-02.img",
            residue: "none",
        },
        loot: [],
        sound: {
            bullet: "glass_bullet",
            punch: "glass_bullet",
            explode: "window_break_01",
            enter: "none",
        },
    }),
    bottle_02r: createBottle2({ img: { tint: 0xc90000 } }),
    bottle_02o: createBottle2({
        collidable: false,
        img: { tint: 0xff5a00 },
    }),
    bottle_02y: createBottle2({
        collidable: false,
        img: { tint: 0xffff00 },
    }),
    bottle_02g: createBottle2({ collidable: false, img: { tint: 0x8000 } }),
    bottle_02b: createBottle2({ img: { tint: 0x6cff } }),
    bottle_02i: createBottle2({
        collidable: false,
        img: { tint: 0x4b0082 },
    }),
    bottle_02v: createBottle2({ img: { tint: 0xee82ee } }),
    bottle_04: createBottle({
        collision: collider.createCircle(v2.create(0, 0), 0.5),
        health: 20,
        hitParticle: "bottleWhiteChip",
        explodeParticle: "bottleWhiteBreak",
        img: {
            sprite: "map-bottle-04.img",
            residue: "none",
        },
        loot: [],
        sound: {
            bullet: "glass_bullet",
            punch: "glass_bullet",
            explode: "window_break_01",
            enter: "none",
        },
    }),
    bottle_05: createBottle({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.5, 0.5)),
        health: 20,
        hitParticle: "bottleWhiteChip",
        explodeParticle: "bottleWhiteBreak",
        img: {
            sprite: "map-bottle-05.img",
            residue: "none",
        },
        loot: [],
        sound: {
            bullet: "glass_bullet",
            punch: "glass_bullet",
            explode: "window_break_01",
            enter: "none",
        },
    }),
    candle_01: {
        type: "obstacle",
        map: { display: false, color: 0xffffff, scale: 1 },
        scale: { createMin: 1, createMax: 1, destroy: 0.5 },
        collision: collider.createCircle(v2.create(0, 0), 0.5),
        height: 0.5,
        collidable: false,
        destructible: false,
        health: 150,
        hitParticle: "goldChip",
        explodeParticle: "barrelBreak",
        reflectBullets: false,
        loot: [],
        img: {
            sprite: "map-candle-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "none",
            punch: "none",
            explode: "none",
            enter: "none",
        },
    },
    deposit_box_01: createDepositBox({
        img: { sprite: "map-deposit-box-01.img" },
        loot: [tierLoot("tier_bank_vault_basic", 1, 1), tierLoot("tier_armor", 0, 1), tierLoot("tier_bank_vault_packs", 0, 1)],
    }),
    deposit_box_02: createDepositBox({
        explodeParticle: "depositBoxGoldBreak",
        img: { sprite: "map-deposit-box-02.img" },
        loot: [tierLoot("tier_bank_vault_gold", 1, 1), tierLoot("tier_armor", 1, 2), tierLoot("tier_bank_vault_packs", 0, 1)],
    }),
    drawers_01: createDrawer({
        img: { sprite: "map-drawers-01.img" },
        loot: [tierLoot("tier_container", 1, 1)],
    }),
    drawers_02: createDrawer({
        img: { sprite: "map-drawers-02.img" },
        loot: [tierLoot("tier_soviet", 2, 3)],
    }),
    fire_ext_01: {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createCircle(v2.create(0.35, 0), 1),
        height: 0.5,
        collidable: true,
        destructible: true,
        createSmoke: true,
        health: 75,
        hitParticle: "redChip",
        explodeParticle: "redBreak",
        reflectBullets: true,
        loot: [],
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-fire-ext-01.img",
            residue: "map-fire-ext-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "barrel_bullet",
            punch: "barrel_bullet",
            explode: "explosion_smoke_01",
            enter: "none",
        },
    },
    grill_01: createOven({
        collision: collider.createCircle(v2.create(0, 0), 1.55),
        img: { sprite: "map-grill-01.img" },
    }),
    gun_mount_01: createGunMount({
        loot: [autoLoot("m870", 1)],
        img: { sprite: "map-gun-mount-01.img" },
    }),
    gun_mount_02: createGunMount({
        loot: [autoLoot("mp220", 1)],
        img: { sprite: "map-gun-mount-02.img" },
    }),
    gun_mount_03: createGunMount({
        loot: [autoLoot("qbb97", 1)],
        img: { sprite: "map-gun-mount-03.img" },
    }),
    gun_mount_04: createGunMount({
        loot: [autoLoot("woodaxe_bloody", 1)],
        img: { sprite: "map-gun-mount-04.img" },
    }),
    gun_mount_05: createGunMount({
        loot: [autoLoot("spas12", 1)],
        img: { sprite: "map-gun-mount-05.img" },
    }),
    gun_mount_06: createGunMount({
        loot: [autoLoot("cutlass_gold", 1)],
        img: { sprite: "map-gun-mount-06.img" },
    }),
    locker_01: createLocker({
        img: { sprite: "map-locker-01.img" },
        loot: [tierLoot("tier_world", 1, 1)],
    }),
    locker_02: createLocker({
        img: { sprite: "map-locker-02.img" },
        loot: [tierLoot("tier_police", 1, 1)],
    }),
    locker_03: createLocker({
        img: { sprite: "map-locker-03.img" },
                loot: [tierLoot("tier_ak_locker", 1, 1), 
                    autoLoot("backpack02", 1), 
                    tierLoot("tier_scopes", 1, 1)],
    }),
    oven_01: createOven({}),
    piano_01: {
        type: "obstacle",
        scale: {
            createMin: 1,
            createMax: 1,
            destroy: 0.75,
        },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3.75, 1)),
        height: 0.5,
        collidable: true,
        destructible: false,
        health: 75,
        hitParticle: "woodChip",
        explodeParticle: ["woodPlank", "book"],
        reflectBullets: false,
        loot: [tierLoot("tier_world", 1, 1)],
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-piano-01.img",
            residue: "map-drawers-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "piano_hit",
            punch: "piano_hit",
            explode: "drawers_break_01",
            enter: "none",
        },
    },
    planter_01: createPlanter({}),
    planter_02: createPlanter({
        img: { sprite: "map-planter-02.img" },
    }),
    planter_03: createPlanter({
        img: { sprite: "map-planter-03.img" },
    }),
    planter_04: createPlanter({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        img: { sprite: "map-planter-04.img" },
        destructible: false,
        button: {
            interactionRad: 0.1,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(1, 0),
            useImg: "map-planter-05.img",
            sound: {
                on: "watering_01",
                off: "watering_01",
            },
        },
    }),
    planter_06: createPlanter({
        img: {
            sprite: "map-planter-06.img",
            residue: "map-planter-res-02.img",
        },
    }),
    planter_07: createPlanter({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        img: {
            sprite: "map-planter-07.img",
            residue: "map-planter-res-03.img",
        },
        destructible: true,
    }),
    pot_01: createBottle({}),
    pot_01purple: createBottle({ // purple pots, mk45g pot
        img: { sprite: "map-pot-01purple.img" },
        loot: [autoLoot("mkg45", 1)],
    }),
    pot_02: createBottle({
        img: { sprite: "map-pot-02.img" },
        loot: [autoLoot("spas12", 1)],
    }),
    pot_03: createBottle({ img: { sprite: "map-pot-03.img" } }),
    pot_03b: createBottle({
        img: { sprite: "map-pot-03.img" },
        loot: [autoLoot("outfitWoodsCloak", 1), autoLoot("backpack03", 1)],
    }),
    pot_03c: createBottle({
        img: { sprite: "map-pot-03.img" },
        loot: [tierLoot("tier_pavilion", 1, 1)],
    }),
    pot_04: createBottle({ img: { sprite: "map-pot-04.img" } }),
    pot_05: createBottle({
        img: { sprite: "map-pot-05.img" },
        loot: [autoLoot("scout_elite", 1), tierLoot("tier_islander_outfit", 1, 1)],
    }),
    potato_01: createPotato({}),
    potato_02: createPotato({ img: { sprite: "map-potato-02.img" } }),
    potato_03: createPotato({ img: { sprite: "map-potato-03.img" } }),
    egg_01: createEgg({
        img: { sprite: "map-egg-01.img" },
        hitParticle: "pinkChip",
    }),
    egg_02: createEgg({
        img: { sprite: "map-egg-02.img" },
        hitParticle: "ltblueChip",
    }),
    egg_03: createEgg({
        img: { sprite: "map-egg-03.img" },
        hitParticle: "yellowChip",
    }),
    egg_04: createEgg({
        img: { sprite: "map-egg-04.img" },
        hitParticle: "greenChip",
    }),
    power_box_01: createControlPanel({}),
    pumpkin_01: createPumpkin({
        loot: [tierLoot("tier_outfits", 1, 1), tierLoot("tier_pumpkin_candy", 1, 1)],
    }),
    pumpkin_02: createPumpkin({
        health: 140,
        img: { sprite: "map-pumpkin-02.img" },
        loot: [
            tierLoot("tier_guns", 1, 2),
            tierLoot("tier_pumpkin_candy", 1, 2),
            tierLoot("tier_outfits", 1, 1),
        ],
    }),
    pumpkin_03: createPumpkin({
        collision: collider.createCircle(v2.create(0, 0), 1.25),
        map: { display: false },
        img: {
            sprite: "map-pumpkin-04.img",
            residue: "map-pumpkin-res-04.img",
        },
        loot: [tierLoot("tier_pumpkin_perks", 1, 1), tierLoot("tier_fruit_xp", 1, 1)],
    }),
    squash_01: createPumpkin({
        collision: collider.createCircle(v2.create(0, 0), 1),
        map: { display: true, color: 0x627344, scale: 1.25 },
        img: {
            sprite: "map-squash-03.img",
            residue: "map-squash-res-03.img",
        },
        hitParticle: "squashChip",
        explodeParticle: "squashBreak",
        loot: [
            autoLoot("turkey_shoot", 1),
            tierLoot("tier_turkey_outfit", 0, 1),
            tierLoot("tier_world", 0, 1),
        ], // tierLoot("tier_fruit_xp", 1, 1)], i replaced it with fowl facade %
    }),
    squash_02: createPumpkin({
        collision: collider.createCircle(v2.create(0, 0), 1.5),
        map: { display: true, color: 0xfcd4b1, scale: 1.25 },
        health: 200,
        img: {
            sprite: "map-squash-02.img",
            residue: "map-squash-res-02.img",
        },
        hitParticle: "squashChip",
        explodeParticle: "squashBreak",
        loot: [
            autoLoot("turkey_shoot", 1),
            autoLoot("turkey_shoot", 1),
            tierLoot("tier_turkey_outfit", 1, 2),
            tierLoot("tier_soviet", 1, 2),
        ], // tierLoot("tier_fruit_xp", 1, 1)], i replaced it with fowl facade %
    }),
    refrigerator_01: createRefrigerator({}),
    refrigerator_01b: createRefrigerator({
        scale: { createMin: 1, createMax: 1, destroy: 1 },
        health: 250,
    }),
    recorder_01: createRecorder({
        button: { sound: { on: "log_01" } },
    } as unknown as Partial<ObstacleDef>),
    recorder_02: createRecorder({
        button: { sound: { on: "log_02" } },
    } as unknown as Partial<ObstacleDef>),
    recorder_03: createRecorder({
        button: { sound: { on: "log_03" } },
    } as unknown as Partial<ObstacleDef>),
    recorder_04: createRecorder({
        button: { sound: { on: "log_04" } },
    } as unknown as Partial<ObstacleDef>),
    recorder_05: createRecorder({
        button: { sound: { on: "log_05" } },
    } as unknown as Partial<ObstacleDef>),
    recorder_06: createRecorder({
        button: { sound: { on: "log_06" } },
    } as unknown as Partial<ObstacleDef>),
    recorder_07: createRecorder({
        button: { sound: { on: "footstep_07" } },
    } as unknown as Partial<ObstacleDef>),
    recorder_08: createRecorder({
        button: { sound: { on: "footstep_08" } },
    } as unknown as Partial<ObstacleDef>),
    recorder_09: createRecorder({
        button: { sound: { on: "footstep_09" } },
    } as unknown as Partial<ObstacleDef>),
    recorder_10: createRecorder({
        button: { sound: { on: "cell_control_03" } },
    } as unknown as Partial<ObstacleDef>),
    recorder_11: createRecorder({
        button: {
            sound: { on: "log_11" },
            useImg: "map-recorder-04.img",
        },
        img: { sprite: "map-recorder-03.img" },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 1.25)),
    } as unknown as Partial<ObstacleDef>),
    recorder_12: createRecorder({
        button: {
            sound: { on: "log_12" },
            useImg: "map-recorder-04.img",
        },
        img: { sprite: "map-recorder-03.img" },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 1.25)),
    } as unknown as Partial<ObstacleDef>),
    recorder_13: createRecorder({
        button: {
            sound: { on: "log_13" },
            useImg: "map-recorder-04.img",
        },
        img: { sprite: "map-recorder-03.img" },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 1.25)),
    } as unknown as Partial<ObstacleDef>),
    recorder_14: createRecorder({
        button: {
            sound: { on: "log_14" },
            useImg: "map-recorder-04.img",
        },
        img: { sprite: "map-recorder-03.img" },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 1.25)),
    } as unknown as Partial<ObstacleDef>),
    screen_01: {
        type: "obstacle",
        obstacleType: "furniture",
        scale: {
            createMin: 1,
            createMax: 1,
            destroy: 0.85,
        },
        collision: collider.createAabbExtents(v2.create(0, 0.05), v2.create(4, 0.2)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 25,
        hitParticle: "clothHit",
        explodeParticle: "barrelBreak",
        reflectBullets: false,
        loot: [],
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-screen-01.img",
            residue: "map-screen-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "cloth_bullet",
            punch: "cloth_punch",
            explode: "screen_break_01",
            enter: "none",
        },
    },
    sandbags_01: createSandBags({}),
    sandbags_02: createSandBags({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.1, 1.4)),
        img: { sprite: "map-sandbags-02.img" },
    }),
    silo_01: createSilo({}),
    silo_01po: createSilo({
        scale: { createMin: 1, createMax: 1, destroy: 0.9 },
        destructible: true,
        health: 2500,
        loot: [autoLoot("potato_smg", 1)],
        img: {
            residue: "map-smoke-res.img",
            tint: 0xff944d,
        },
    }),
    stairs_01: {
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
            residue: "map-table-res.img",
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
    },
    stand_01: {
        type: "obstacle",
        obstacleType: "furniture",
        scale: {
            createMin: 1,
            createMax: 1,
            destroy: 0.75,
        },
        collision: collider.createAabbExtents(v2.create(0, 0.15), v2.create(1.25, 1.25)),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 75,
        hitParticle: "woodChip",
        explodeParticle: "woodPlank",
        reflectBullets: false,
        loot: [tierLoot("tier_world", 1, 1)],
        map: { display: false, color: 0x663300, scale: 0.875 },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-stand-01.img",
            residue: "map-drawers-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wood_prop_bullet",
            punch: "wood_prop_bullet",
            explode: "drawers_break_01",
            enter: "none",
        },
    },
    stone_01: createStone({}),
    stone_01b: createStone({
        img: { residue: "map-stone-res-01b.img" },
    }),
    stone_01cb: createStone({
        map: { display: true, color: 0x9ca2a8, scale: 1 },
        img: {
            sprite: "map-stone-01cb.img",
            residue: "map-stone-res-01cb.img",
        },
    }),
    stone_01f: createStone({
        map: { display: true, color: 0x7d7d7d, scale: 1 },
    }),
    stone_01sv: createStone({
        scale: {
            createMin: 1.2,
            createMax: 1.5,
            destroy: 0.5,
        },
    }),
    stone_01x: createStone({
        map: { display: true, color: 0x5c5c5c, scale: 1 },
        img: {
            sprite: "map-stone-01x.img",
            residue: "map-stone-res-01x.img",
        },
    }),
    stone_02: createStone({ //ak stone
        map: { display: false },
        img: { tint: 0xe5e5e5 },
        loot: [tierLoot("tier_surviv", 2, 3), tierLoot("tier_medical", 1, 1), autoLoot("flare_gun", 1)],
    }),
    stone_02sv: createStone({
        map: { display: false },
        img: { tint: 0xe5e5e5 },
        loot: [
            tierLoot("tier_surviv", 2, 3),
            autoLoot("m39", 1),
            tierLoot("tier_perks", 1, 1),
        ],
    }),
    stone_02cb: createStone({
        map: { display: false, color: 0x9ca2a8, scale: 1 },
        img: {
            sprite: "map-stone-01cb.img",
            residue: "map-stone-res-01cb.img",
            tint: 0xe5e5e5,
        },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("ak47", 1)],
    }),
    stone_02x: createStone({
        map: { display: false, color: 0x9ca2a8, scale: 1 },
        img: {
            sprite: "map-stone-01x.img",
            residue: "map-stone-res-01x.img",
            tint: 0xe5e5e5,
        },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("ak47", 1)],
    }),
    stone_02bh: createStone({
        map: { display: false },
        img: { tint: 0xe5e5e5 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("groza", 1)],
    }),
    stone_03: createRiverStone({}),
    stone_03b: createRiverStone({
        img: {
            sprite: "map-stone-03b.img",
            residue: "map-stone-res-01.img",
        },
    }),
    stone_03cb: createRiverStone({
        img: {
            sprite: "map-stone-03cb.img",
            residue: "map-stone-res-02cb.img",
        },
    }),
    stone_03f: createRiverStone({
        img: {
            sprite: "map-stone-03f.img",
            residue: "map-stone-res-02f.img",
        },
    }),
    stone_03sv: createRiverStone({
        img: {
            sprite: "map-stone-03sv.img",
            residue: "map-stone-res-02sv.img",
        },
    }),
    stone_03x: createRiverStone({
        img: {
            sprite: "map-stone-03x.img",
            residue: "map-stone-res-02x.img",
        },
    }),
    stone_03tr: createRiverStone({
        img: {
            sprite: "map-stone-03tr.img",
            residue: "map-stone-res-02x.img",
        },
    }),
    stone_03bh: createRiverStone({
        img: {
            sprite: "map-stone-03bh.img",
        },
    }),
    stone_04: createStone({ //eye stone
        stonePlated: true,
        scale: {
            createMin: 0.8,
            createMax: 0.8,
            destroy: 0.75,
        },
        hitParticle: "rockEyeChip",
        explodeParticle: "rockEyeBreak",
        loot: [tierLoot("tier_eye_block", 1, 1)],
        terrain: { grass: true, beach: true, riverShore: true },
        map: { display: true, color: 0x171412, scale: 1 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.8, 1.8)),
        img: {
            sprite: "map-stone-04.img",
            residue: "map-stone-res-04.img",
        },
    }),
    stone_04x: createStone({
        stonePlated: true,
        scale: {
            createMin: 0.8,
            createMax: 0.8,
            destroy: 0.75,
        },
        hitParticle: "rockEyeChip",
        explodeParticle: "rockEyeBreak",
        loot: [tierLoot("tier_eye_block", 1, 1)],
        terrain: { grass: true, beach: true, riverShore: true },
        map: { display: true, color: 0xb2eaff, scale: 1 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.8, 1.8)),
        img: {
            sprite: "map-stone-04x.img",
            residue: "map-stone-res-04.img",
        },
    } as unknown as Partial<ObstacleDef>),
    stone_05: createStone({
        stonePlated: true,
        hitParticle: "rockEyeChip",
        explodeParticle: "rockEyeBreak",
        loot: [tierLoot("tier_eye_stone", 1, 1)],
        terrain: { grass: true, beach: true, riverShore: true },
        map: { display: true, color: 0x171412, scale: 1 },
        collision: collider.createCircle(v2.create(0, 0), 1.7),
        img: {
            sprite: "map-stone-05.img",
            residue: "map-stone-res-01b.img",
        },
    }),
    stone_06: createStone({
        stonePlated: true,
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        height: 10,
        terrain: { grass: true, beach: true, riverShore: true },
        map: { display: true, color: 0x373737, scale: 1 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4.5, 2)),
        img: {
            sprite: "map-stone-06.img",
            scale: 0.5,
            residue: "map-stone-res-06.img",
        },
    }),
    stone_07: createStone({
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createCircle(v2.create(0, 0), 7.75),
        health: 500,
        map: { display: true, color: 0x978c84, scale: 1 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-stone-07.img",
            residue: "map-stone-res-07.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
    }),
    stove_01: createControlPanel({
        obstacleType: "furniture",
        scale: {
            createMin: 1,
            createMax: 1,
            destroy: 0.85,
        },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3, 2.25)),
        disableBuildingOccupied: true,
        damageCeiling: true,
        explosion: "explosion_stove",
        height: 10,
        health: 500,
        img: { sprite: "map-stove-01.img" },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "oven_break_01",
            enter: "none",
        },
    }),
    stove_02: createControlPanel({
        obstacleType: "furniture",
        collision: collider.createCircle(v2.create(0, 0), 1.5),
        disableBuildingOccupied: true,
        damageCeiling: true,
        explosion: "explosion_stove",
        height: 10,
        health: 400,
        img: { sprite: "map-stove-02.img" },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "oven_break_01",
            enter: "none",
        },
    }),
    table_01: createTable({}),
    table_01x: createTable({ img: { sprite: "map-table-01x.img" } }),
    table_02: createTable({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4.5, 2.5)),
        health: 125,
        img: {
            sprite: "map-table-02.img",
            residue: "map-table-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 60,
        },
    }),
    table_02x: createTable({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4.5, 2.5)),
        health: 125,
        img: {
            sprite: "map-table-02x.img",
            residue: "map-table-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 60,
        },
    }),
    table_03: createTable({
        collision: collider.createCircle(v2.create(0, 0), 2.5),
        health: 125,
        img: {
            sprite: "map-table-03.img",
            residue: "map-table-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 60,
        },
    }),
    table_03x: createTable({
        collision: collider.createCircle(v2.create(0, 0), 2.5),
        health: 125,
        img: {
            sprite: "map-table-03x.img",
            residue: "map-table-res.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 60,
        },
    }),
    tire_01: (function <T extends ObstacleDef>(e: Partial<T>): T {
        const t = {
            type: "obstacle",
            scale: {
                createMin: 1,
                createMax: 1,
                destroy: 0.8,
            },
            collision: collider.createCircle(v2.create(0, 0), 1.75),
            height: 0.5,
            collidable: true,
            destructible: true,
            health: 1500,
            hitParticle: "blackChip",
            explodeParticle: "barrelBreak",
            reflectBullets: false,
            loot: [],
            map: { display: true, color: 0x665e66, scale: 1 },
            terrain: { grass: true, beach: true },
            img: {
                sprite: "map-tire-01.img",
                scale: 0.4,
                alpha: 1,
                tint: 0xffffff,
                zIdx: 10,
            },
            sound: {
                bullet: "cloth_bullet",
                punch: "cloth_punch",
                explode: "cloth_break_01",
                enter: "none",
            },
        };
        return util.mergeDeep(t, e || {});
    })({}),
    toilet_01: createToilet({
        img: { sprite: "map-toilet-01.img" },
        loot: [tierLoot("tier_toilet", 2, 3), tierLoot("tier_outfits", 0, 1), tierLoot("tier_playtest", 0, 0)], // checkpoint testing
    }),
    toilet_02: createToilet({
        img: { sprite: "map-toilet-02.img" }, 
        loot: [tierLoot("tier_soviet", 4, 5)],
    }),
    toilet_02b: createToilet({
        img: {
            sprite: "map-toilet-02.img",
            tint: 11842740,
        },
        loot: [autoLoot("fireaxe", 1)],
    }),
    toilet_03: createToilet({
        reflectBullets: true,
        hitParticle: "barrelChip",
        explodeParticle: "toiletMetalBreak",
        img: {
            sprite: "map-toilet-03.img",
            residue: "map-toilet-res-02.img",
        },
        loot: [tierLoot("tier_metal_toilet", 1, 1)],
        sound: {
            bullet: "toilet_metal_bullet",
            punch: "toilet_metal_bullet",
            explode: "toilet_break_02",
        },
    }),
    toilet_04: createToilet({
        reflectBullets: true,
        hitParticle: "barrelChip",
        explodeParticle: "toiletMetalBreak",
        img: {
            sprite: "map-toilet-04.img",
            residue: "map-toilet-res-02.img",
        },
        loot: [tierLoot("tier_metal_toilet", 2, 2)],
        sound: {
            bullet: "toilet_metal_bullet",
            punch: "toilet_metal_bullet",
            explode: "toilet_break_02",
        },
    }),
    towelrack_01: createBookShelf({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3, 1)),
        img: { sprite: "map-towelrack-01.img" },
        explodeParticle: ["woodPlank", "clothBreak"],
        loot: [tierLoot("tier_towel_rack", 1, 2)],
    }),
    tree_01: createTree({}),
    tree_01cb: createTree({
        scale: {
            createMin: 1.1,
            createMax: 1.3,
            destroy: 0.5,
        },
        collision: collider.createCircle(v2.create(0, 0), 1.2),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(7.75, 7.75)),
        map: { color: 0x2c4362 },
        img: { sprite: "map-tree-03cb.img" },
    } as unknown as Partial<ObstacleDef>),
    tree_01sv: createTree({
        map: { color: 0x435119 },
        img: { sprite: "map-tree-03sv.img" },
    } as unknown as Partial<ObstacleDef>),
    tree_interior_01: createTree({ img: { zIdx: 200 } }),
    tree_interior_01bh: createTree({
        img: {
            sprite: "map-tree-13.img",
            scale: 0.35,
            zIdx: 200,
        },
    }),
    tree_01x: createTree({
        img: {
            sprite: "map-tree-01x.img",
            scale: 0.35,
        },
    }),
    tree_02: createTree({
        health: 120,
        collision: collider.createCircle(v2.create(0, 0), 1.6),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(1.6, 1.6)),
        height: 0.5,
        loot: [autoLoot("woodaxe", 1)],
        map: { display: false },
        scale: { createMin: 1, createMax: 1, destroy: 0.9 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-tree-04.img",
            scale: 0.5,
            zIdx: 10,
        },
    }),
    tree_02h: createTree({
        health: 120,
        collision: collider.createCircle(v2.create(0, 0), 1.6),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(1.6, 1.6)),
        height: 0.5,
        loot: [autoLoot("woodaxe_bloody", 1)],
        map: { display: false },
        scale: { createMin: 1, createMax: 1, destroy: 0.9 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-tree-04h.img",
            scale: 0.5,
            zIdx: 10,
        },
    }),
    tree_03: createTree({
        map: { display: false },
        img: { tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    }),
    tree_03x: createTree({
        map: { display: false },
        img: { sprite: "map-tree-10.img", tint: 0xc8c8c8 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    }),
    // savannah cache
    tree_03sv: createTree({
        map: { display: false, color: 0x435119 },
        img: {
            sprite: "map-tree-03sv.img",
            tint: 0xb1b1b1,
        },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    } as unknown as Partial<ObstacleDef>),
    // desert cache
    tree_03d: createTree({
        map: { display: false, color: 0x758028 },
        img: { sprite: "map-tree-06.img", tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    } as unknown as Partial<ObstacleDef>),
    // faction cache
    tree_03f: createTree({
        scale: { createMin: 1.2, createMax: 1.6 },
        health: 200,
        map: { display: false, color: 0xf3204, scale: 3 },
        img: {
            sprite: "map-tree-08f.img",
            residue: "map-tree-res-01.img",
            scale: 0.35,
            zIdx: 801,
            tint: 0xb1b1b1,
        },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    } as unknown as Partial<ObstacleDef>),
    // woods cache
    tree_03w: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { display: false, color: 0x4f5715, scale: 2.5 },
        img: { sprite: "map-tree-07.img", tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    } as unknown as Partial<ObstacleDef>),
    // halloween cache
    tree_03h: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { display: false, color: 0x4f5715, scale: 2.5 },
        img: { sprite: "map-tree-07.img", tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    } as unknown as Partial<ObstacleDef>),
    // spring cache
    tree_03sp: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { display: false, color: 0xfec6e1, scale: 2.5 },
        img: { sprite: "map-tree-07sp.img", tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    } as unknown as Partial<ObstacleDef>),
    // summer cache
    tree_03su: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { display: false, color: 0x215906, scale: 2.5 },
        img: { sprite: "map-tree-07su.img", tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    } as unknown as Partial<ObstacleDef>),
    // cobalt cache
    tree_03cb: createTree({
        scale: {
            createMin: 1.1,
            createMax: 1.3,
            destroy: 0.5,
        },
        collision: collider.createCircle(v2.create(0, 0), 1.2),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(7.75, 7.75)),
        map: { display: false, color: 0x2c4362 },
        img: { sprite: "map-tree-03cb.img", tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    } as unknown as Partial<ObstacleDef>),
    // beach cache
    tree_03bh: createTree({
        scale: { createMin: 1.2, createMax: 1.25, destroy: 0.5 },
        collision: collider.createCircle(v2.create(0, 0), 1.1),
        map: { display: false },
        img: { sprite: "map-tree-13.img", scale: 0.35, tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("scout_elite", 1)],
    } as unknown as Partial<ObstacleDef>),
    tree_05: createTree({
        collision: collider.createCircle(v2.create(0, 0), 2.3),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(12, 12)),
        scale: { createMin: 1.2, createMax: 1.3 },
        health: 400,
        map: { color: 0x5a3517, scale: 3 },
        img: {
            sprite: "map-tree-05.img",
            residue: "map-tree-res-02.img",
            tint: 0xffffff,
            scale: 0.7,
            zIdx: 801,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_05b: createTree({
        collision: collider.createCircle(v2.create(0, 0), 2.3),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(12, 12)),
        scale: { createMin: 1, createMax: 1 },
        health: 500,
        loot: [
            tierLoot("tier_shotguns", 1, 1),
            tierLoot("tier_lmgs", 1, 1),
            autoLoot("outfitTreeSpooky", 1),
        ],
        map: { color: 0x5a3517, scale: 3 },
        img: {
            sprite: "map-tree-05.img",
            residue: "map-tree-res-02.img",
            tint: 0xffffff,
            scale: 0.7,
            zIdx: 801,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_05c: createTree({
        collision: collider.createCircle(v2.create(0, 0), 1.05),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(4, 4)),
        scale: { createMin: 1.6, createMax: 1.6 },
        health: 200,
        map: { color: 0x8a5123, scale: 3 },
        img: {
            sprite: "map-tree-05c.img",
            residue: "map-tree-res-02.img",
            tint: 0xffffff,
            scale: 0.35,
            zIdx: 801,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_06: createTree({
        img: { sprite: "map-tree-06.img" },
        map: { color: 0x758028 },
    } as unknown as Partial<ObstacleDef>),
    tree_07: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { color: 0x4f5715, scale: 2.5 },
        img: { sprite: "map-tree-07.img" },
    } as unknown as Partial<ObstacleDef>),
    tree_07sp: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { color: 0xfec6e1, scale: 2.5 },
        img: { sprite: "map-tree-07sp.img" },
        terrain: { grass: true, beach: false, riverShore: true },
    } as unknown as Partial<ObstacleDef>),
    tree_07spr: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { color: 0xfec6e1, scale: 2.5 },
        img: { sprite: "map-tree-07sp.img" },
        terrain: { grass: false, beach: false, riverShore: true },
    } as unknown as Partial<ObstacleDef>),
    tree_07su: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { color: 0x215906, scale: 2.5 },
        img: { sprite: "map-tree-07su.img" },
    } as unknown as Partial<ObstacleDef>),
    tree_08: createTree({
        scale: { createMin: 1.2, createMax: 1.4 },
        health: 225,
        map: { color: 0xa85d0c, scale: 2.5 },
        img: {
            sprite: "map-tree-08.img",
            residue: "map-tree-res-02.img",
            scale: 0.35,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_08b: createTree({
        scale: { createMin: 1.75, createMax: 2 },
        health: 300,
        map: { color: 0x933610, scale: 3 },
        img: {
            sprite: "map-tree-08.img",
            residue: "map-tree-res-02.img",
            tint: 0xdb7878,
            scale: 0.35,
            zIdx: 801,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_08c: createTree({
        scale: { createMin: 1.75, createMax: 2 },
        health: 500,
        loot: [
            tierLoot("tier_shotguns", 2, 3),
            tierLoot("tier_lmgs", 2, 3),
            autoLoot("outfitWoodland", 1),
        ],
        map: { color: 0x774a15, scale: 3 },
        img: {
            sprite: "map-tree-08.img",
            residue: "map-tree-res-02.img",
            tint: 0xb1b1b1,
            scale: 0.35,
            zIdx: 801,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_08f: createTree({
        scale: { createMin: 1.2, createMax: 1.6 },
        health: 200,
        map: { color: 0xf3204, scale: 3 },
        img: {
            sprite: "map-tree-08f.img",
            residue: "map-tree-res-01.img",
            scale: 0.35,
            zIdx: 801,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_08sp: createTree({
        scale: { createMin: 1.2, createMax: 1.4 },
        health: 225,
        map: { color: 0xff89b8, scale: 2.5 },
        img: {
            sprite: "map-tree-08sp.img",
            residue: "map-tree-res-02.img",
            scale: 0.35,
        },
        terrain: { grass: true, beach: false, riverShore: true },
    } as unknown as Partial<ObstacleDef>),
    tree_08spb: createTree({
        scale: { createMin: 1.75, createMax: 2 },
        health: 300,
        map: { color: 0xff599b, scale: 3 },
        img: {
            sprite: "map-tree-08sp.img",
            residue: "map-tree-res-02.img",
            tint: 0xdb7878,
            scale: 0.35,
            zIdx: 801,
        },
        terrain: { grass: true, beach: false, riverShore: true },
    } as unknown as Partial<ObstacleDef>),
    tree_08spc: createTree({
        scale: { createMin: 1.75, createMax: 2 },
        health: 500,
        loot: [
            tierLoot("tier_shotguns", 2, 3),
            tierLoot("tier_lmgs", 2, 3),
            autoLoot("outfitWoodland", 1),
        ],
        map: { color: 0x7e294b, scale: 3 },
        img: {
            sprite: "map-tree-08sp.img",
            residue: "map-tree-res-02.img",
            tint: 0xb1b1b1,
            scale: 0.35,
            zIdx: 801,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_08spr: createTree({
        scale: { createMin: 1.2, createMax: 1.4 },
        health: 225,
        map: { color: 0xff89b8, scale: 2.5 },
        img: {
            sprite: "map-tree-08sp.img",
            residue: "map-tree-res-02.img",
            scale: 0.35,
        },
        terrain: { grass: false, beach: false, riverShore: true },
    } as unknown as Partial<ObstacleDef>),
    tree_08su: createTree({
        scale: { createMin: 1.2, createMax: 1.4 },
        health: 225,
        map: { color: 0x21500d, scale: 2.5 },
        img: {
            sprite: "map-tree-08su.img",
            residue: "map-tree-res-01.img",
            scale: 0.35,
            zIdx: 801,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_08sub: createTree({
        scale: { createMin: 1.75, createMax: 2 },
        health: 300,
        map: { color: 0x1b4008, scale: 3 },
        img: {
            sprite: "map-tree-08su.img",
            residue: "map-tree-res-02.img",
            tint: 0x8c8d4a,
            scale: 0.35,
            zIdx: 801,
        },
        terrain: { grass: true, beach: false, riverShore: true },
    } as unknown as Partial<ObstacleDef>),
    tree_09: createTree({
        health: 120,
        collision: collider.createCircle(v2.create(0, 0), 1.6),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(5.75, 5.75)),
        height: 0.5,
        map: { display: true, color: 0x834400, scale: 1 },
        scale: {
            createMin: 1,
            createMax: 1,
            destroy: 0.75,
        },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-tree-09.img",
            scale: 0.5,
            zIdx: 10,
        },
    }),
    tree_10: createTree({
        collision: collider.createCircle(v2.create(0, 0), 1.25),
        scale: { createMin: 0.9, createMax: 1.1 },
        map: { color: 0x73895f, scale: 2.5 },
        img: { sprite: "map-tree-10.img" },
    } as unknown as Partial<ObstacleDef>),
    tree_11: createTree({
        collision: collider.createCircle(v2.create(0, 0), 1.25),
        scale: { createMin: 1, createMax: 1 },
        img: {
            sprite: "map-tree-11.img",
            scale: 0.75,
            alpha: 0.92,
            zIdx: 201,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_interior_11: createTree({
        collision: collider.createCircle(v2.create(0, 0), 1.25),
        scale: { createMin: 1, createMax: 1 },
        img: {
            sprite: "map-tree-11.img",
            scale: 0.5,
            alpha: 0.92,
            zIdx: 200,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_12: createTree({
        map: { color: 0x7a9024, scale: 7 },
        img: {
            sprite: "map-tree-12.img",
            residue: "map-tree-res-12.img",
            tint: 0xffffff,
            zIdx: 801,
        },
    } as unknown as Partial<ObstacleDef>),
    // Palm Tree
    tree_13: createTree({
        scale: { createMin: 1.15, createMax: 1.3, destroy: 0.75 },
        collision: collider.createCircle(v2.create(0, 0), 1),
        img: {
            sprite: "map-tree-13.img",
            scale: 0.35,
            tint: 0xffffff,
            zIdx: 801,
            randomRotation: true,
        },
        terrain: { grass: false, beach: true },
    } as unknown as Partial<ObstacleDef>),
    tree_13bh: createTree({
        scale: { createMin: 1.15, createMax: 1.3, destroy: 0.75 },
        collision: collider.createCircle(v2.create(0, 0), 1),
        img: {
            sprite: "map-tree-13.img",
            scale: 0.35,
            tint: 0xffffff,
            zIdx: 801,
            randomRotation: true,
        },
        terrain: { grass: true, beach: true },
    } as unknown as Partial<ObstacleDef>),
    tree_13x: createTree({
        scale: { createMin: 1.2, createMax: 1.4, destroy: 0.75 },
        collision: collider.createCircle(v2.create(0, 0), 1),
        img: {
            sprite: "map-tree-13x.img",
            scale: 0.35,
            tint: 0xffffff,
            zIdx: 801,
            randomRotation: true,
        },
    } as unknown as Partial<ObstacleDef>),
    // Coconut Palm
    tree_14: createTree({
        scale: { createMin: 1.15, createMax: 1.3, destroy: 0.85 },
        collision: collider.createCircle(v2.create(0, 0), 1),
        loot: [tierLoot("tier_coconut_outfit", 1, 1), autoLoot("coconut", 3)],
        img: {
            sprite: "map-tree-14.img",
            scale: 0.35,
            tint: 0xffffff,
            zIdx: 801,
            randomRotation: true,
        },
        terrain: { grass: true, beach: true },
    } as unknown as Partial<ObstacleDef>),
    // Christmas Coconut Palm
    tree_14x: createTree({
        scale: { createMin: 1.15, createMax: 1.3, destroy: 0.85 },
        collision: collider.createCircle(v2.create(0, 0), 1),
        loot: [tierLoot("tier_coconut_outfit", 1, 3), autoLoot("coconut", 3)],
        img: {
            sprite: "map-tree-14x.img",
            scale: 0.35,
            tint: 0xffffff,
            zIdx: 801,
            randomRotation: true,
        },
    } as unknown as Partial<ObstacleDef>),
    tree_switch_01: createTreeSwitch({
        img: { sprite: "map-tree-switch-01.img" },
    }),
    tree_switch_02: createTreeSwitch({
        img: { sprite: "map-tree-switch-02.img" },
    }),
    tree_switch_03: createTreeSwitch({
        img: { sprite: "map-tree-switch-03.img" },
    }),
    vat_01: {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.9 },
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 250,
        reflectBullets: false,
        hitParticle: "glassChip",
        explodeParticle: "windowBreak",
        loot: [],
        map: { display: true, color: 0xb3b3b3, scale: 1 },
        terrain: { grass: false, beach: false },
        img: {
            sprite: "map-vat-01.img",
            residue: "map-vat-res.img",
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
    },
    vat_02: {
        type: "obstacle",
        scale: {
            createMin: 1,
            createMax: 1,
            destroy: 0.95,
        },
        collision: collider.createCircle(v2.create(0, 0), 3.1),
        height: 0.5,
        collidable: true,
        destructible: false,
        health: 1e3,
        reflectBullets: false,
        hitParticle: "glassChip",
        explodeParticle: "windowBreak",
        loot: [],
        map: { display: true, color: 0xb3b3b3, scale: 1 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-vat-02.img",
            residue: "map-vat-res.img",
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
    },
    vending_01: (function () {
        const t = {
            type: "obstacle",
            obstacleType: "vending",
            scale: {
                createMin: 1,
                createMax: 1,
                destroy: 0.75,
            },
            collision: collider.createAabbExtents(
                v2.create(0, 0.15),
                v2.create(1.7, 1.25),
            ),
            height: 0.5,
            collidable: true,
            destructible: true,
            health: 150,
            hitParticle: "blueChip",
            explodeParticle: ["windowBreak", "lockerBreak"],
            reflectBullets: true,
            loot: [tierLoot("tier_vending_soda", 1, 3), autoLoot("soda", 1)],
            map: {
                display: false,
                color: 0x2aad,
                scale: 0.875,
            },
            terrain: { grass: true, beach: true },
            img: {
                sprite: "map-vending-soda-01.img",
                residue: "map-vending-res.img",
                scale: 0.5,
                alpha: 1,
                tint: 0xffffff,
                zIdx: 10,
            },
            sound: {
                bullet: "wall_bullet",
                punch: "metal_punch",
                explode: "vending_break_01",
                enter: "none",
            },
        };
        return util.mergeDeep(t, {});
    })(),
    wheel_01: createWheel({
        button: {
            interactionRad: 1,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 2.5,
            useDir: v2.create(-1, 0),
            useImg: "map-wheel-02.img",
            sound: { on: "wheel_control_01", off: "" },
        },
    }),
    wheel_02: createWheel({ img: { sprite: "map-wheel-02.img" } }),
    wheel_03: createWheel({ img: { sprite: "map-wheel-03.img" } }),
    woodpile_01: createWoodPile({}),
    woodpile_02: createWoodPile({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(6, 3)),
        health: 400,
        destructible: true,
        map: { display: true, color: 0x663300, scale: 0.8 },
        img: {
            sprite: "map-woodpile-02.img",
            residue: "map-woodpile-res-02.img",
        },
    }),
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
    house_door_06: createDoor({
        material: "wood",
        hinge: v2.create(0, 1.25),
        extents: v2.create(0.3, 1.25),
        img: { sprite: "map-door-06.img" },
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
    house_window_01: createWindow({}),
    house_window_broken_01: createLowWall({}),
    lab_window_01: createWindow({
        destroyType: "lab_window_broken_01",
    }),
    lab_window_broken_01: createLowWall({ img: { tint: 0x14161b } }),
    container_05_collider: createWall({
        material: "metal",
        extents: v2.create(2.75, 6),
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
    greenhouse_01: createGreenhouse({
        group: { id: BuildingGroups.SniperSpawns, minDistance: MinDistance.SniperSpawns, noSpawnRadius: NoSpawnRadius.SniperSpawns },
    }),
    greenhouse_02: createGreenhouse({
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
    }),
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
                    sprite: "map-bunker-chrys-compartment-floor-01b.img",
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
                type: randomObstacleType({ crate_01: 2, crate_04: 1 }),
                pos: v2.create(1.5, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_01: 2, crate_04: 1 }),
                pos: v2.create(1.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_01: 2, crate_04: 1 }),
                pos: v2.create(6.5, 5),
                scale: 1,
                ori: 0,
            },
            {
                type: randomObstacleType({ crate_01: 2, crate_04: 1 }),
                pos: v2.create(6.5, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "vault_door_chrys_01",
                pos: v2.create(0.5, 15.5),
                scale: 1,
                ori: 3,
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
    bunker_structure_08: createBunkerChrys({
        bunkerType: "bunker_chrys_sublevel_01",
    }),
    bunker_structure_08b: createBunkerChrys({
        bunkerType: "bunker_chrys_sublevel_01b",
    }),
    hedgehog_wall: createWall({
        material: "metal",
        extents: v2.create(3, 0.5),
        height: 0.5,
        map: { display: true, color: 0x59544d, scale: 1 },
    }),
    hedgehog_01: {
        type: "building",
        map: { display: false, color: 0x665a4e, scale: 1 },
        terrain: { grass: false, beach: true },
        floor: {
            surfaces: [],
            imgs: [
                {
                    sprite: "map-hedgehog-01.img",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "hedgehog_wall",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "hedgehog_wall",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    },
    cache_01: createCache({}),
    cache_01x: createCache({
        mapObjects: [
            {
                type: "stone_02x",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "stone_01x" },
    }),
    cache_01sv: createCache({
        mapObjects: [
            {
                type: "stone_02sv",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "stone_01" },
    }),
    cache_01cb: createCache({
        mapObjects: [
            {
                type: "stone_02cb",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "stone_01cb" },
    }),
    cache_01bh: createCache({
        mapObjects: [
            {
                type: "stone_02bh",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "stone_01" },
    }),
    cache_02: createCache({
        mapObjects: [
            {
                type: "tree_03",
                pos: v2.create(0, 0),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_01" },
    }),
    cache_02x: createCache({
        mapObjects: [
            {
                type: "tree_03x",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_10" },
    }),
    cache_02sv: createCache({
        mapObjects: [
            {
                type: "tree_03sv",
                pos: v2.create(0, 0),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_03sv" },
    }),
    cache_02w: createCache({
        mapObjects: [
            {
                type: "tree_03w",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_07" },
    }),
    cache_02sp: createCache({
        mapObjects: [
            {
                type: "tree_03sp",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.3,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_07sp" },
    }),
    cache_02su: createCache({
        mapObjects: [
            {
                type: "tree_03su",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.3,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_07su" },
    }),
    cache_02cb: createCache({
        mapObjects: [
            {
                type: "tree_03cb",
                pos: v2.create(0, 0),
                scale: 1.3,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.3,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_01cb" },
    }),
    cache_02d: createCache({
        mapObjects: [
            {
                type: "tree_03d",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_06" },
    }),
    cache_02f: createCache({
        mapObjects: [
            {
                type: "tree_03f",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.3,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_08f" },
    }),
    cache_02h: createCache({
        mapObjects: [
            {
                type: "tree_03h",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_07" },
    }),
    cache_02bh: createCache({
        mapObjects: [
            {
                type: "tree_03bh",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 0.9,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_14" },
    }),
    cache_03: createCache({
        mapObjects: [
            {
                type: "bush_06",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "bush_06" },
    }),
    cache_03tr: createCache({
        mapObjects: [
            {
                type: "bush_06tr",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "bush_06" },
    }),
    cache_06: createCache({
        mapObjects: [
            {
                type: "bush_07",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "bush_07" },
    }),
    cache_06bh: createCache({
        mapObjects: [
            {
                type: "bush_07x",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "bush_07x" },
    }),
    cache_07: createCache({
        mapObjects: [
            {
                type: "barrel_01b",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "barrel_01" },
    }),
    cache_07bh: createCache({
        mapObjects: [
            {
                type: "barrel_01bh",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    }),
    cache_log_13: createCache({
        terrain: { grass: false, beach: true },
        mapObjects: [
            {
                type: "crate_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "recorder_13",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "crate_01" },
    }),
    cache_pumpkin_01: createCache({
        mapObjects: [
            {
                type: "pumpkin_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_01",
                pos: v2.create(0, 0),
                scale: 1.5,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
    cache_pumpkin_02: createCache({
        mapObjects: [
            {
                type: "pumpkin_02",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_01",
                pos: v2.create(0, 0),
                scale: 1.5,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
    cache_pumpkin_03: createCache({
        mapObjects: [
            {
                type: "pumpkin_03",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_04",
                pos: v2.create(0, 0),
                scale: 1.5,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
    cache_pumpkin_airdrop_02: createCache({
        mapObjects: [
            {
                type: "crate_11h",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_01",
                pos: v2.create(0, 0),
                scale: 1.5,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
    candle_lit_01: createCache({
        mapObjects: [
            {
                type: "candle_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_02",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
    candle_lit_02: createCache({
        mapObjects: [
            {
                type: "candle_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_03",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
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
    hut_01: createHut({}),
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
    } as unknown as Partial<BuildingDef>),
    hut_01bh: createHut({
        specialLoot: randomObstacleType({ pot_01: 1, barrel_05: 2, "": 1 }),
    }),
    hut_02: createHut({
        ceilingImg: "map-building-hut-ceiling-02.img",
        specialLoot: "pot_02",
        map: { displayType: "hut_01" },
    }),
    hut_02x: createHut({
        specialLoot: "pot_02",
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
    } as unknown as Partial<BuildingDef>),
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
    hut_04: createLargeHut({}),
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
    warehouse_01: createWarehouse({
        topLeftObs: "crate_01",
        topRightObs: "crate_01",
        botRightObs: "crate_01",
        ignoreMapSpawnReplacement: true,
    }),
    warehouse_01h: createWarehouse({
        topLeftObs: "crate_01",
        topRightObs: "crate_01",
        botRightObs: "crate_01",
        decoration_01: "candle_lit_01",
        ignoreMapSpawnReplacement: true,
    }),
    warehouse_01f: createWarehouse({
        topLeftObs: "crate_01",
        topRightObs: "crate_01",
        botRightObs: "crate_01",
        ignoreMapSpawnReplacement: false,
    }),
    warehouse_01x: createWarehouse({
        topLeftObs: "crate_01",
        topRightObs: "crate_01",
        botRightObs: "crate_01",
        ignoreMapSpawnReplacement: true,
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
    } as unknown as Partial<BuildingDef>),
    warehouse_02: createWarehouse2({}),
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
    } as unknown as Partial<BuildingDef>),
    warehouse_03: createWarehouse3({}),
    warehouse_03sv: createWarehouse3({
        specialLoot: "case_08sv",
    }),
    warehouse_03x: createWarehouse3({
        crate: randomObstacleType({ crate_03: 3, crate_03x: 1 }),
        ignoreMapSpawnReplacement: true,

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
    } as unknown as Partial<BuildingDef>),
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
                    container_01: 0.2967,
                    container_02: 0.2967,
                    container_03: 0.2967,
                    container_06: 0.11,
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
                    //container_06: 0.08,
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
                    //container_06: 0.08,
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
                    //container_06: 0.08,
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
                    //container_06: 0.08,
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
                    //container_06: 0.08,
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
                    //container_06: 0.08,
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
                    //container_06: 0.08,
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
                    //container_06: 0.08,
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
        group: { id: BuildingGroups.SVSpawns, minDistance: MinDistance.SVSpawns, noSpawnRadius: 300 },
    },
    logging_complex_01: createLoggingComplex({}),
    logging_complex_01sp: createLoggingComplex({
        groundTintLt: 0x334a0e,
        groundTintDk: 0x253210,
    }),
    logging_complex_01su: createLoggingComplex({
        groundTintLt: 0x77ad32,
        groundTintDk: 0x4e7d13,
    }),
    logging_complex_02: createLoggingComplex2({}),
    logging_complex_02sp: createLoggingComplex2({
        groundTintDk: 0x253210,
        tree_08c: "tree_08spc",
    }),
    logging_complex_02su: createLoggingComplex2({ groundTintDk: 0x4e7d13 }),
    logging_complex_03: createLoggingComplex3({}),
    logging_complex_03sp: createLoggingComplex3({ groundTintDk: 0x253210 }),
    logging_complex_03su: createLoggingComplex3({ groundTintDk: 0x4e7d13 }),
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
    archway_column_1: createWall({
        material: "wood",
        extents: v2.create(1, 1),
        img: Object.assign(wallImg("map-column-01.img", 0x6f3f14), {
            residue: "map-drawers-res.img",
        }),
    }),
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
            collider.createAabbExtents(v2.create(0, -3), v2.create(50, 60)),
            collider.createAabbExtents(v2.create(0, 0), v2.create(60, 15)),
        ],
        mapGroundPatches: [
            {
                bound: collider.createAabbExtents(v2.create(0, -3), v2.create(45, 55)),
                color: 0xc3842a,
                roughness: 0.1,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(0, 0), v2.create(46, 10)),
                color: 0x8f611f,
                roughness: 0.1,
                offsetDist: 1,
            },
            {
                bound: collider.createAabbExtents(v2.create(0, 2), v2.create(5, 50.5)),
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
                        collider.createAabbExtents(v2.create(0, 0), v2.create(0, 0)),
                    ],
                },
            ],
            imgs: [],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "archway_01",
                pos: v2.create(45, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "archway_01",
                pos: v2.create(-45, 0),
                scale: 1,
                ori: 1,
            },
            {
                type: "house_red_01",
                pos: v2.create(24, 30),
                scale: 1,
                ori: 3,
            },
            {
                type: "house_red_02",
                pos: v2.create(-24, 30),
                scale: 1,
                ori: 3,
            },
            {
                type: "bank_01b",
                pos: v2.create(-10, -34),
                scale: 1,
                ori: 2,
            },
            {
                type: "shack_01",
                pos: v2.create(31, -26),
                scale: 1,
                ori: 2,
            },
            {
                type: "outhouse_01",
                pos: v2.create(28, -46),
                scale: 1,
                ori: 0,
            },
            {
                type: "tree_06",
                pos: v2.create(29, -36),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(-4.75, 34),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "sandbags_02",
                pos: v2.create(-4.75, 30),
                scale: 1,
                ori: 1,
            },
            {
                type: "sandbags_01",
                pos: v2.create(-9, 10),
                scale: 1,
                ori: 0,
            },
            {
                type: "crate_18",
                pos: v2.create(2.5, 1.5),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
            {
                type: "barrel_01",
                pos: v2.create(-2, -1),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "barrel_01",
                pos: v2.create(1.5, -3),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "sandbags_01",
                pos: v2.create(16, -10),
                scale: 1,
                ori: 1,
            },
        ],
    },
    statue_01: createStone({
        scale: { createMin: 1, createMax: 1, destroy: 0.5 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4.4, 4.4)),
        destructible: false,
        map: { display: true, color: 0x575757, scale: 1 },
        img: { sprite: "map-statue-01.img", scale: 0.5 },
    }),
    statue_03: createStone({
        stonePlated: true,
        health: 500,
        height: 10,
        scale: {
            createMin: 1,
            createMax: 1,
            destroy: 0.85,
        },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4.4, 4.4)),
        destructible: true,
        map: { display: true, color: 0x575757, scale: 1 },
        img: {
            sprite: "map-statue-03.img",
            scale: 0.5,
            residue: "",
        },
    }),
    statue_04: createStone({
        stonePlated: true,
        health: 500,
        height: 10,
        scale: {
            createMin: 1,
            createMax: 1,
            destroy: 0.85,
        },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4.4, 4.4)),
        destructible: true,
        map: { display: true, color: 0x575757, scale: 1 },
        img: {
            sprite: "map-statue-04.img",
            scale: 0.5,
            residue: "",
        },
    }),
    statue_top_01: createStone({
        health: 500,
        height: 10,
        collision: collider.createCircle(v2.create(0, 0), 2.45),
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        destructible: true,
        map: { display: false, color: 0x575757, scale: 1 },
        img: {
            sprite: "map-statue-top-01.img",
            residue: "",
            scale: 0.5,
            zIdx: 60,
        },
    }),
    statue_top_02: createStone({
        health: 500,
        height: 10,
        collision: collider.createCircle(v2.create(0, 0), 2.45),
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        destructible: true,
        map: { display: false, color: 0x575757, scale: 1 },
        img: {
            sprite: "map-statue-top-02.img",
            residue: "",
            scale: 0.5,
            zIdx: 60,
        },
    }),
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
    statue_building_03: createStatue({ statue: "statue_03" }),
    statue_underground_03: createStatueUnderground({ crate: "crate_02d" }),
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
    statue_building_04: createStatue({ statue: "statue_04" }),
    statue_underground_04: createStatueUnderground({ crate: "crate_22d" }),
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
    shack_01: createShack2({}),
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
    } as unknown as Partial<BuildingDef>),
    shack_02: createShack({}),
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
    } as unknown as Partial<BuildingDef>),
    shilo_01: (function <T extends BuildingDef>(e: Partial<T>): T {
        const t = {
            type: "building",
            map: { display: true, color: 0x317120, scale: 1 },
            terrain: { grass: true, beach: false },
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
        return util.mergeDeep(t, e || {});
    })({}),
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
    } as unknown as Partial<BuildingDef>),
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
    outhouse_01: createOutHouse({}),
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
    } as unknown as Partial<BuildingDef>),
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
        obs: "toilet_02b",
    }),
    perch_01: (function (e) {
        const t = {
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
                    residue: "map-perch-res.img",
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
        return util.mergeDeep(t, e || {});
    })({}),
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
    metal_wall_ext_thick_6: createWall({
        material: "metal",
        extents: v2.create(1, 3),
    }),
    metal_wall_ext_thick_12: createWall({
        material: "metal",
        extents: v2.create(1, 6),
    }),
    metal_wall_ext_thick_20: createWall({
        material: "metal",
        extents: v2.create(1, 10),
    }),
    metal_wall_ext_thicker_4: createWall({
        material: "metal",
        extents: v2.create(1.5, 2),
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
    glass_wall_18: createWall({
        material: "glass",
        extents: v2.create(0.5, 9),
        health: 150,
        img: wallImg("map-wall-glass-18.img"),
    }),
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
    barn_basement_floor_01d: createBarnBasement({
        basement: "barn_basement_floor_02d",
    }),
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
    barn_01: createBarn({ bonus_door: "house_door_02" }),
    barn_01h: createBarn({
        porch_01: "cache_pumpkin_02",
        bonus_door: "house_door_02",
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
        bonus_door: "house_door_02",
    } as unknown as Partial<BuildingDef>),
    barn_02: createBarn({
        bonus_room: "barn_basement_structure_01",
        bonus_door: "",
        map: { displayType: "barn_01" },
    }),
    barn_02d: createBarn({
        bonus_room: "barn_basement_structure_01d",
        bonus_door: "",
        map: { displayType: "barn_01" },
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
        bonus_room: "barn_basement_structure_01x",
        bonus_door: "",
        map: { displayType: "barn_01" },
    } as unknown as Partial<BuildingDef>),
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
    bank_01: createBank({ teamId: 1 }),
    bank_01b: createBank({ vault: "vault_01b" }),
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
    } as unknown as Partial<BuildingDef>),
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
    vault_01: createBankVault({}),
    vault_01b: createBankVault({
        gold_box: 9,
        floor_loot: "loot_tier_stonehammer",
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
    police_01: createPoliceStation({ teamId: 2 }),
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
    } as unknown as Partial<BuildingDef>),
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
    house_red_01: createHouseRed({ stand: "stand_01" }),
    house_red_01h: createHouseRed({
        porch_01: "cache_pumpkin_02",
        stand: "stand_01",
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
        plant: "tree_interior_11",
        plant_pos: v2.create(-10, -8.5),
        plant_loot: randomObstacleType({ loot_tier_surviv: 1 }),
    } as unknown as Partial<ExtendedBuildingDef>),
    house_red_02: createHouseRed2({ stand: "stand_01" }),
    house_red_02h: createHouseRed2({
        porch_01: "cache_pumpkin_02",
        stand: "stand_01",
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
        plant: "tree_interior_11",
        plant_pos: v2.create(4, 8.5),
        plant_loot: randomObstacleType({ loot_tier_surviv: 1 }),
    } as unknown as Partial<ExtendedBuildingDef>),
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
    cabin_01: createCabin({}),
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
    } as unknown as ExtendedBuildingDef),
    cabin_02: createCabin({
        cabin_mount: "gun_mount_02",
        porch_01: "cache_pumpkin_02",
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
    mansion_01: createMansion({}),
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
        tree: "tree_11",
        tree_scale: 0.8,
        tree_loot: "loot_tier_1",
        bush_chance: 999,
    } as unknown as Partial<ExtendedBuildingDef>),
    mansion_02: createMansion({
        decoration_01: "decal_web_01",
        decoration_02: "candle_lit_01",
        porch_01: "cache_pumpkin_02",
        entry_loot: "",
    }),
    mansion_03: createMansion({
        tree: "tree_interior_01bh",
        tree_scale: 0.9,
        porch_01: "bush_03",
        bush: "bush_03",
    } as unknown as Partial<ExtendedBuildingDef>),
    mansion_cellar_01: createMansionCellar({}),
    mansion_cellar_02: createMansionCellar({
        decoration_01: "decal_web_01",
        decoration_02: "candle_lit_01",
        mid_obs_01: "pumpkin_01",
    }),
    mansion_cellar_03: createMansionCellar({
        mid_obs_01: "barrel_05",
    }),
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
    teahouse_window_open_01: createLowWall({
        img: { tint: 0xba692b },
    }),
    teahouse_01: createTeahouse({}),
    teahouse_01x: createTeahouse({
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
    teapavilion_01: createTeaPavilion({ terrain: { lakeCenter: true } }),
    teapavilion_01w: createTeaPavilion({
        center_loot: "loot_tier_helmet_forest",
        left_loot: "pot_03b",
        right_loot: "pot_03c",
        terrain: { lakeCenter: true },
    }),
    teahouse_complex_01s: createTeaHouseComplex({}),
    teahouse_complex_01su: createTeaHouseComplex({
        grass_color: 0x629522,
        tree_small: "tree_08su",
        tree_large: "tree_08su",
    }),
    teahouse_complex_01x: createTeaHouseComplex({
        grass_color: 0x9e9e9e,
        tea_house: "teahouse_01x",
        tree_small: "tree_10",
        tree_large: "tree_10",
    }),
    savannah_patch_01: (function <T extends BuildingDef>(e: Partial<T>): T {
        const t = {
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
                    color: e.grass_color || 0xffc600,
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
                    type: e.tree_large || "tree_12",
                    pos: v2.create(-13, 5.5),
                    scale: 1.1,
                    ori: 0,
                },
                {
                    type: e.tree_large || "tree_12",
                    pos: v2.create(10.5, -5),
                    scale: 0.9,
                    ori: 0,
                },
                {
                    type: e.tree_small || "tree_01sv",
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
        return util.mergeDeep(t, e || {});
    })({
        grass_color: 0xebc634,
        terrain: { grass: true, beach: false, spawnPriority: 1 },
    }),
    kopje_patch_01: (function <T extends BuildingDef>(e: Partial<T>): T {
        const t = {
            type: "building",
            map: { display: true, shapes: [] },
            terrain: { grass: true, beach: false },
            mapObstacleBounds: [
                collider.createAabbExtents(v2.create(0, 0), v2.create(45, 35)),
            ],
            mapGroundPatches: [
                {
                    bound: collider.createAabbExtents(v2.create(0, 0), v2.create(40, 30)),
                    color: e.grass_color || 0xffc600,
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
                    type: e.tree_large || "tree_12",
                    pos: v2.create(34, 22.5),
                    scale: 1.05,
                    ori: 0,
                },
                {
                    type: e.tree_small || "tree_12",
                    pos: v2.create(-34.5, -23),
                    scale: 0.95,
                    ori: 0,
                },
                {
                    type: e.tree_small || "tree_12",
                    pos: v2.create(22.5, -14),
                    scale: 0.95,
                    ori: 0,
                },
                {
                    type: e.tree_small || "tree_01sv",
                    pos: v2.create(21.5, -3),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: e.tree_small || "tree_01sv",
                    pos: v2.create(11, -15),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: e.tree_small || "tree_01sv",
                    pos: v2.create(-19, 2),
                    scale: 1,
                    ori: 0,
                },
                {
                    type: e.tree_small || "tree_01sv",
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
        return util.mergeDeep(t, e || {});
    })({
        grass_color: 0x7a9e19,
        terrain: { grass: true, beach: false, spawnPriority: 2 },
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
    teapavilion_complex_01: {
        type: "building",
        map: { display: true, shapes: [] },
        terrain: { lakeCenter: true },
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
    bathhouse_rocks_01: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.55, 1.55)),
        destructible: false,
        img: { sprite: "map-bathrocks-01.img" },
    }),
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
    club_structure_01: {
        type: "structure",
        structureType: "club",
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
        group: { id: BuildingGroups.SVSpawns, minDistance: 200, noSpawnRadius: NoSpawnRadius.SniperSpawns },
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
        group: { id: BuildingGroups.BunkerSpawns, minDistance: MinDistance.BunkerSpawns, noSpawnRadius: 0 },
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
                type: "loot_tier_hydra_floor",
                pos: v2.create(39.95, -60.45),
                scale: 1,
                ori: 0,
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
    metal_wall_column_5x12: createWall({
        material: "metal",
        extents: v2.create(2.5, 6),
    }),
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
                type: randomObstacleType({ case_03: 4, case_03purple: 1 }), //vector crate / hatchet crate
                pos: v2.create(7, -4),
                scale: 1,
                ori: 3,
            },
        ],
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
        group: { id: BuildingGroups.BunkerSpawns, minDistance: MinDistance.BunkerSpawns, noSpawnRadius: NoSpawnRadius.BunkerSpawns },
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
        group: { id: BuildingGroups.BunkerSpawns, minDistance: MinDistance.BunkerSpawns, noSpawnRadius: NoSpawnRadius.BunkerSpawns },
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
                type: "loot_tier_crossing",
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
                type: randomObstacleType({ case_03: 4, case_03purple: 1 }),
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
    metal_wall_column_4x8: createWall({
        material: "metal",
        extents: v2.create(2, 4),
    }),
    stone_wall_int_4: createWall({
        material: "stone",
        extents: v2.create(0.6, 2),
        img: wallImg("map-wall-04-stone.img", 0xffffff),
    }),
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
                pos: v2.create(5, 13.5),
                scale: 1,
                ori: 0,
            },
            {
                type: "bunker_twins_stairs_01",
                pos: v2.create(-5, -13.5),
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
        ],
    },
    cobalt_wall_int_4: createWall({
        material: "cobalt",
        extents: v2.create(0.6, 2),
        img: wallImg("map-wall-04-cobalt.img", 0xffffff),
    }),
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
        mapObjects: [
            {
                type: "concrete_wall_ext_6",
                pos: v2.create(5, 17.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(1.5, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(8.5, 14),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(-7.5, 11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(12.5, 11.5),
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
                pos: v2.create(-5, -17.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-1.5, -14),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_8",
                pos: v2.create(-8.5, -14),
                scale: 1,
                ori: 0,
            },
            {
                type: "metal_wall_ext_thicker_15",
                pos: v2.create(7.5, -11.5),
                scale: 1,
                ori: 1,
            },
            {
                type: "metal_wall_ext_thicker_5",
                pos: v2.create(-12.5, -11.5),
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
                pos: v2.create(3, 10.5),
                scale: 1,
                ori: 3,
            },
            {
                type: "lab_door_locked_01",
                pos: v2.create(-3, -10.5),
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
                type: "cobalt_wall_int_4",
                pos: v2.create(-12.5, -10.385),
                scale: 1,
                ori: 3,
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
                pos: v2.create(-13.5, -8.75),
                scale: 1,
                ori: 1,
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
                        collider.createAabbExtents(v2.create(0, 0), v2.create(0, 0)),
                    ],
                },
            ],
            imgs: [],
        },
        ceiling: {
            zoomRegions: [],
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
        mapObjects: [],
    },
    bunker_structure_09: {
        type: "structure",
        terrain: { grass: true, beach: false },
        ori: 0,
        mapObstacleBounds: [
            collider.createAabbExtents(v2.create(5, 15.4), v2.create(3.5, 6)),
            collider.createAabbExtents(v2.create(-5, -15.4), v2.create(3.5, 6)),
            collider.createAabbExtents(v2.create(20.5, 0), v2.create(6, 3.5)),
            collider.createAabbExtents(v2.create(-20.5, 0), v2.create(6, 3.5)),
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
                    v2.create(5, 14.4),
                    v2.create(2, 2.6),
                ),
                downDir: v2.create(0, -1),
            },
            {
                collision: collider.createAabbExtents(
                    v2.create(-5, -14.4),
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
    bridge_lg_01: createBridgeLarge({}),
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
    } as unknown as Partial<BuildingDef>),
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
    container_06: createContainer({ //sv container
        open: false,
        tint: 0xba9500,
        ceilingSprite: "map-building-container-ceiling-01.img",
        loot_spawner_01: "loot_tier_sv98",
        loot_spawner_02: "loot_tier_scopes_sniper",
        mapDisplayType: "container_01",
    }),
    loot_tier_1: {
        type: "loot_spawner",
        loot: [tierLoot("tier_world", 1, 1)],
        terrain: { grass: true, beach: true, riverShore: true },
    },
    loot_tier_2: {
        type: "loot_spawner",
        loot: [tierLoot("tier_container", 1, 1)],
        terrain: { grass: true, beach: true, riverShore: true },
    },
    loot_tier_beach: {
        type: "loot_spawner",
        loot: [tierLoot("tier_world", 1, 1)],
        terrain: { grass: false, beach: true },
    },
    loot_tier_surviv: {
        type: "loot_spawner",
        loot: [tierLoot("tier_surviv", 1, 1)],
        terrain: { grass: true, beach: true, riverShore: true },
    },
    loot_tier_vault_floor: {
        type: "loot_spawner",
        loot: [tierLoot("tier_vault_floor", 1, 1)],
    },
    loot_tier_police_floor: {
        type: "loot_spawner",
        loot: [tierLoot("tier_police_floor", 1, 1)],
    },
    loot_tier_mansion_floor: {
        type: "loot_spawner",
        loot: [tierLoot("tier_mansion_floor", 1, 1)],
    },
    loot_tier_hydra_floor: {
            type: "loot_spawner",
            loot: [tierLoot("tier_hydra_floor", 1, 1)],
        },
    loot_tier_sv98: {
        type: "loot_spawner",
        loot: [tierLoot("tier_sv98", 1, 1)],
    },
    loot_tier_scopes_sniper: {
        type: "loot_spawner",
        loot: [tierLoot("tier_scopes_sniper", 1, 1)],
    },
    loot_tier_woodaxe: {
        type: "loot_spawner",
        loot: [tierLoot("tier_woodaxe", 1, 1)],
    },
    loot_tier_crossing: {
        type: "loot_spawner",
        loot: [
            tierLoot("tier_crossing", 1, 1),
            tierLoot("tier_fireaxe", 1, 1)
        ],
    },
    loot_tier_fireaxe: {
         type: "loot_spawner",
         loot: [tierLoot("tier_fireaxe", 1, 1)],
    },
    loot_tier_stonehammer: {
        type: "loot_spawner",
        loot: [tierLoot("tier_stonehammer", 1, 1)],
    },
    loot_tier_sledgehammer: {
        type: "loot_spawner",
        loot: [tierLoot("tier_sledgehammer", 1, 1)],
    },
    loot_tier_barn_melee: {
        type: "loot_spawner",
        loot: [tierLoot("tier_barn_melee", 1, 1)],
    },
    loot_tier_hatchet_melee: {
        type: "loot_spawner",
        loot: [tierLoot("tier_hatchet_melee", 1, 1)],
    },
    loot_tier_club_melee: {
        type: "loot_spawner",
        loot: [tierLoot("tier_club_melee", 1, 1)],
    },
    loot_tier_leaf_pile: {
        type: "loot_spawner",
        loot: [tierLoot("tier_leaf_pile", 1, 1)],
    },
    loot_tier_islander_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_islander_outfit", 1, 1)],
    },
    loot_tier_verde_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_verde_outfit", 1, 1)],
    },
    loot_tier_lumber_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_lumber_outfit", 1, 1)],
    },
    loot_tier_imperial_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_imperial_outfit", 1, 1)],
    },
    loot_tier_pineapple_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_pineapple_outfit", 1, 1)],
    },
    loot_tier_tarkhany_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_tarkhany_outfit", 1, 1)],
    },
    loot_tier_spetsnaz_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_spetsnaz_outfit", 1, 1)],
    },
    loot_tier_eye_01: {
         type: "loot_spawner",
         loot: [tierLoot("tier_eye_01", 1, 1)],
    },
    loot_tier_eye_02: {
        type: "loot_spawner",
        loot: [tierLoot("tier_eye_02", 1, 1)],
    },
    loot_tier_saloon: {
        type: "loot_spawner",
        loot: [tierLoot("tier_saloon", 1, 1)],
    },
    loot_tier_chrys_01: {
        type: "loot_spawner",
        loot: [tierLoot("tier_chrys_01", 1, 1)],
    },
    loot_tier_chrys_02: {
        type: "loot_spawner",
        loot: [tierLoot("tier_chrys_02", 1, 1)],
    },
    // loot_tier_chrys_02b: {
    //     type: "loot_spawner",
    //     loot: [tierLoot("tier_chrys_02b", 1, 1)],
    // },
    loot_tier_chrys_03: {
        type: "loot_spawner",
        loot: [tierLoot("tier_chrys_03", 1, 1)],
    },
    loot_tier_airdrop_armor: {
        type: "loot_spawner",
        loot: [tierLoot("tier_airdrop_armor", 1, 1)],
    },
    loot_tier_helmet_forest: {
        type: "loot_spawner",
        loot: [tierLoot("tier_forest_helmet", 1, 1)],
        terrain: { grass: true, beach: false },
    },
    // loot_tier_helmet_potato: {
    //     type: "loot_spawner",
    //     loot: [tierLoot("tier_potato_helmet", 1, 1)],
    //     terrain: { grass: true, beach: false },
    // },
    loot_tier_perk_test: {
        type: "loot_spawner",
        loot: [
            autoLoot("explosive", 1),
            autoLoot("splinter", 1),
            autoLoot("scavenger_adv", 1),
        ],
        terrain: { grass: true, beach: false },
    },
    loot_tier_sniper_test: {
        type: "loot_spawner",
        loot: [
            autoLoot("l86", 1),
            autoLoot("svd", 1),
            autoLoot("vss", 1),
            autoLoot("blr", 1),
            autoLoot("scarssr", 1),
        ],
        terrain: { grass: true, beach: false },
    },
    loot_tier_loot_test: {
        type: "loot_spawner",
        loot: [
            autoLoot("explosive", 1),
            autoLoot("backpack03", 1),
            autoLoot("chest03", 1),
            autoLoot("helmet03", 1),
            autoLoot("scavenger_adv", 1),
            autoLoot("explosive", 1),
            autoLoot("splinter", 1),
            autoLoot("p30l", 1),
            autoLoot("p30l", 1),
            autoLoot("p30l", 1),
            autoLoot("p30l", 1),
            autoLoot("deagle", 1),
            autoLoot("deagle", 1),
            autoLoot("deagle", 1),
            autoLoot("ots38_dual", 1),
        ],
        terrain: { grass: true, beach: false },
    },
    decal_barrel_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-barrel-res-01.img",
            scale: 0.24,
            alpha: 1,
            tint: 0,
            zIdx: 9,
        },
    },
    decal_frag_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-barrel-res-01.img",
            scale: 0.2,
            alpha: 0.8,
            tint: 0,
            zIdx: 11,
        },
    },
    decal_frag_small_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-barrel-res-01.img",
            scale: 0.12,
            alpha: 0.8,
            tint: 0x202020,
            zIdx: 11,
        },
    },
    decal_rounds_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        lifetime: { min: 2, max: 2.5 },
        img: {
            sprite: "map-barrel-res-01.img",
            scale: 0.1,
            alpha: 0.8,
            tint: 0x30120a,
            zIdx: 11,
        },
    },
    decal_bomb_iron_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        lifetime: { min: 6, max: 10 },
        fadeChance: 0.6,
        img: {
            sprite: "map-barrel-res-01.img",
            scale: 0.2,
            alpha: 0.8,
            tint: 0,
            zIdx: 11,
        },
    },
    decal_smoke_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-smoke-res.img",
            scale: 0.2,
            alpha: 0.5,
            tint: 0xffffff,
            zIdx: 11,
        },
    },
    decal_snowball_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        lifetime: 5,
        fadeChance: 1,
        img: {
            sprite: "map-snowball-res.img",
            scale: 0.2,
            alpha: 0.25,
            tint: 0xffffff,
            zIdx: 11,
        },
    },
    decal_potato_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        lifetime: 5,
        fadeChance: 1,
        img: {
            sprite: "map-potato-res.img",
            scale: 0.2,
            alpha: 0.25,
            tint: 0xffffff,
            zIdx: 11,
        },
    },
    decal_vent_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-bunker-vent-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_vent_02: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-bunker-vent-02.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_vent_03: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-bunker-vent-03.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_hydra_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 3),
        height: 0,
        img: {
            sprite: "map-bunker-hydra-floor-04.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_pipes_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1, 4.5)),
        height: 1,
        img: {
            sprite: "map-pipes-01.img",
            scale: 0.5,
            alpha: 0.96,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_pipes_02: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4, 3)),
        height: 1,
        img: {
            sprite: "map-pipes-02.img",
            scale: 0.5,
            alpha: 0.96,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_pipes_03: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(10.5, 4)),
        height: 1,
        img: {
            sprite: "map-pipes-03.img",
            scale: 0.5,
            alpha: 0.96,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_pipes_04: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1, 5.5)),
        height: 1,
        img: {
            sprite: "map-pipes-04.img",
            scale: 0.5,
            alpha: 0.96,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_pipes_05: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1, 3.5)),
        height: 1,
        img: {
            sprite: "map-pipes-05.img",
            scale: 0.5,
            alpha: 0.96,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_initiative_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 3),
        height: 0,
        img: {
            sprite: "map-decal-initiative.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_web_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        height: 1,
        img: {
            sprite: "map-web-01.img",
            scale: 0.5,
            alpha: 0.75,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_light_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3.25, 3.25)),
        height: 1,
        lifetime: 1e10,
        img: {
            sprite: "map-light-01.img",
            scale: 1,
            alpha: 0.5,
            tint: 0xff9c00,
            zIdx: 60,
            flicker: true,
            flickerMin: 0.9,
            flickerMax: 1.1,
            flickerRate: 0.5,
            ignoreAdjust: true,
        },
    },
    decal_light_02: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2.5)),
        height: 1,
        lifetime: 1e10,
        img: {
            sprite: "map-light-01.img",
            scale: 0.75,
            alpha: 0.5,
            tint: 0xffbe4d,
            zIdx: 60,
            flicker: true,
            flickerMin: 0.8,
            flickerMax: 1.2,
            flickerRate: 0.2,
            ignoreAdjust: true,
        },
    },
    decal_light_03: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2.5)),
        height: 1,
        lifetime: 1e10,
        img: {
            sprite: "map-light-01.img",
            scale: 0.75,
            alpha: 0.5,
            tint: 0x830000,
            zIdx: 60,
            flicker: true,
            flickerMin: 0.8,
            flickerMax: 1.2,
            flickerRate: 0.2,
            ignoreAdjust: true,
        },
    },
    decal_light_04: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2.5)),
        height: 1,
        lifetime: 1e10,
        img: {
            sprite: "map-light-01.img",
            scale: 0.75,
            alpha: 0.5,
            tint: 0xff5824,
            zIdx: 60,
            flicker: true,
            flickerMin: 0.5,
            flickerMax: 0.75,
            flickerRate: 0.4,
            ignoreAdjust: true,
        },
    },
    decal_blood_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        height: 0,
        img: {
            sprite: "part-splat-01.img",
            scale: 0.25,
            alpha: 0.95,
            tint: 0x3d0e0e,
            zIdx: 0,
        },
    },
    decal_blood_02: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        height: 0,
        img: {
            sprite: "part-splat-02.img",
            scale: 0.25,
            alpha: 0.95,
            tint: 0x3d0e0e,
            zIdx: 0,
        },
    },
    decal_blood_03: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        height: 0,
        img: {
            sprite: "part-splat-03.img",
            scale: 0.25,
            alpha: 0.95,
            tint: 0x3d0e0e,
            zIdx: 0,
        },
    },
    decal_chrys_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 1,
        img: {
            sprite: "map-bunker-vent-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 3,
        },
    },
    decal_oil_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-decal-oil-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_oil_02: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-decal-oil-02.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_oil_03: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-decal-oil-03.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_oil_04: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-decal-oil-04.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_oil_05: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-decal-oil-05.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_oil_06: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-decal-oil-06.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_bathhouse_pool_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(9, 15)),
        height: 1,
        surface: {
            type: "water",
            data: {
                waterColor: 0x4eb2c4,
                rippleColor: 0x9fe2ef,
            },
        },
        img: {
            sprite: "map-bathhouse-pool-01.img",
            scale: 8,
            alpha: 0.5,
            tint: 0xcdf1,
            zIdx: 5,
        },
        gore: {
            fade: { start: 0, end: 4, pow: 0.5, speed: 2 },
            tint: 0x75000f,
            alpha: 0.85,
            waterColor: 0x822531,
            rippleColor: 0xaf545f,
        },
    },
    decal_club_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 4),
        height: 0,
        img: {
            sprite: "map-decal-club-01.img",
            scale: 1,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 4,
        },
    },
    decal_club_02: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4, 10.5)),
        height: 1,
        img: {
            sprite: "map-decal-club-02.img",
            scale: 1,
            alpha: 0,
            tint: 0xffffff,
            zIdx: 4,
        },
        gore: {
            fade: {
                start: 4,
                end: 6,
                pow: 3.25,
                speed: 0.5,
            },
            alpha: 1,
        },
    },
    decal_plank_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 2.25)),
        height: 0,
        img: {
            sprite: "part-plank-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0x42080c,
            zIdx: 9,
        },
    },
    decal_flyer_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.5, 1)),
        height: 0,
        img: {
            sprite: "map-decal-flyer-01.img",
            scale: 0.6,
            alpha: 0.667,
            tint: 0xffffff,
            zIdx: 4,
        },
    },
};
