import { collider } from "../../../utils/collider.ts";
import { type DeepPartial, util } from "../../../utils/util.ts";
import { v2 } from "../../../utils/v2.ts";
import { autoLoot, tierLoot } from "../mapObjectHelpers.ts";
import type { ObstacleDef } from "./obstacleDefs.ts";

//
// Mostly exterior, map spawned objects such as stones and trees
//

function createBarrel(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
        type: "obstacle",
        category: "barrel",
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
    return util.mergeDeep(baseDef, overrides);
}
function createBush(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
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
    return util.mergeDeep(baseDef, overrides);
}
function createCampfire(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
        type: "obstacle",
        scale: { createMin: 0.5, createMax: 0.5, destroy: 0.8 },
        collision: collider.createCircle(v2.create(0, 0), 2.75),
        height: 0.5,
        collidable: true,
        destructible: false,
        health: 100,
        hitParticle: "rockChip",
        explodeParticle: "rockBreak",
        reflectBullets: false,
        loot: [],
        map: { display: true, color: 6447714, scale: 1 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-campfire-01.img",
            scale: 0.375,
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
    return util.mergeDeep(baseDef, overrides);
}

function createPotato(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
        type: "obstacle",
        category: "potato",
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
    return util.mergeDeep(baseDef, overrides);
}
function createTomato(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createCircle(v2.create(0, 0), 1.1),
        height: 0.5,
        collidable: true,
        destructible: true,
        health: 100,
        hitParticle: "tomatoChip_01",
        explodeParticle: "tomatoBreak_01",
        reflectBullets: false,
        swapWeaponOnDestroy: true,
        regrow: true,
        regrowTimer: 60,
        loot: [tierLoot("tier_potato_perks", 1, 1)],
        map: { display: false, color: 0x907155, scale: 1 },
        terrain: { grass: true, beach: true, riverShore: true },
        img: {
            sprite: "map-tomato-01.img",
            residue: "map-tomato-res-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "organic_hit",
            punch: "organic_hit",
            explode: "tomato_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(baseDef, overrides);
}
function createEgg(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
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
    return util.mergeDeep(baseDef, overrides);
}
function createPumpkin(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
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
    return util.mergeDeep(baseDef, overrides);
}
function createSandBags(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
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
    return util.mergeDeep(baseDef, overrides);
}
function createSilo(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
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
    return util.mergeDeep(baseDef, overrides);
}
function createStone(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
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
    return util.mergeDeep(baseDef, overrides);
}
function createRiverStone(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
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
    return util.mergeDeep(baseDef, overrides);
}
function createTree(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
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
    return util.mergeDeep(baseDef, overrides);
}
function createWoodPile(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
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
    return util.mergeDeep(baseDef, overrides);
}

export const MapObstacleDefs: Record<string, ObstacleDef> = {
    barrel_01: createBarrel({}),
    barrel_01b: createBarrel({
        img: { tint: 0xc9c9c9 },
        loot: [
            tierLoot("tier_surviv", 2, 3),
            autoLoot("mirv", 1),
            autoLoot("mirv", 1),
            autoLoot("mirv", 1),
        ],
    }),
    barrel_01w: createBarrel({
        img: { tint: 0xc9c9c9 },
        loot: [
            tierLoot("tier_surviv", 1, 1),
            autoLoot("chest03", 1),
            autoLoot("mirv", 1),
            autoLoot("strobe", 1),
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
    barrel_01f: createBarrel({
        img: { tint: 0xc9c9c9 },
        loot: [
            tierLoot("tier_surviv", 2, 3),
            autoLoot("chest02", 1),
            autoLoot("mirv", 2),
            autoLoot("mirv", 2),
            autoLoot("frag", 6),
        ],
    }),
    barrel_01bd: createBarrel({
        explosion: "",
    }),
    propane_01: createBarrel({
        collision: collider.createCircle(v2.create(0, 0), 1.25),
        health: 50,
        map: { display: true, color: 0x5fc4, scale: 1 },
        img: { sprite: "map-propane-01.img", scale: 0.4 },
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
    bush_01: createBush({}),
    bush_01b: createBush({ img: { alpha: 1 } }),
    bush_01cb: createBush({
        img: { sprite: "map-bush-01cb.img" },
        map: { color: 0x266f59 },
    }),
    bush_01f: createBush({
        img: { sprite: "map-bush-01f.img" },
        map: { color: 0x1b5c08 },
    }),
    bush_01sv: createBush({
        hitParticle: "leafPrickly",
        explodeParticle: "leafPrickly",
        img: {
            sprite: "map-bush-01sv.img",
            residue: "map-bush-res-01sv.img",
        },
        map: { color: 0x73802f },
    }),
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
    }),
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
    }),
    bush_01x: createBush({
        map: { color: 0x455d30 },
        img: { sprite: "map-bush-01x.img" },
    }),
    bush_02: createBush({ img: { residue: "map-bush-res-02.img" } }),
    bush_03: createBush({
        img: { sprite: "map-bush-03.img", alpha: 1 },
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
    }),
    bush_05: createBush({
        img: {
            sprite: "map-bush-05.img",
            residue: "map-bush-res-05.img",
        },
        map: { color: 0x6a623d },
    }),
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
    }),
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
    bush_07cb: createBush({ img: { sprite: "map-bush-07cb.img" } }),

    campfire_01: createCampfire({}),

    potato_01: createPotato({}),
    potato_01f: createPotato({
        category: "pvt_swapper",
        terrain: { grass: true, beach: true, riverShore: false },
        teamId: 2,
    }),
    potato_02: createPotato({ img: { sprite: "map-potato-02.img" } }),
    potato_02f: createPotato({
        category: "pvt_swapper",
        terrain: { grass: true, beach: true, riverShore: false },
        img: { sprite: "map-potato-02.img" },
        teamId: 2,
    }),
    potato_03: createPotato({ img: { sprite: "map-potato-03.img" } }),
    potato_03f: createPotato({
        category: "pvt_swapper",
        terrain: { grass: true, beach: true, riverShore: false },
        img: { sprite: "map-potato-03.img" },
        teamId: 2,
    }),
    tomato_01: createTomato({
        category: "pvt_swapper",
        terrain: { grass: true, beach: true, riverShore: false },
        teamId: 1,
    }),
    tomato_02: createTomato({
        category: "pvt_swapper",
        terrain: { grass: true, beach: true, riverShore: false },
        img: { sprite: "map-tomato-02.img" },
        sound: { explode: "tomato_break_02" },
        teamId: 1,
    }),
    tomato_03: createTomato({
        category: "pvt_swapper",
        hitParticle: "tomatoChip_02",
        explodeParticle: "tomatoBreak_02",
        terrain: { grass: true, beach: true, riverShore: false },
        img: {
            sprite: "map-tomato-03.img",
            residue: "map-tomato-res-02.img",
        },
        teamId: 1,
    }),
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
            // tierLoot("tier_fruit_xp", 1, 1)], // TODO: enable with artifacts
            tierLoot("tier_world", 0, 1),
        ],
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
            // tierLoot("tier_fruit_xp", 1, 1)], // TODO: enable with artifacts
            tierLoot("tier_soviet", 1, 2),
        ],
    }),
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
    stone_02: createStone({
        map: { display: false },
        img: { tint: 0xe5e5e5 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("ak47", 1)],
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
    stone_02w: createStone({
        map: { display: false },
        img: { tint: 0xe5e5e5 },
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
    stone_02f: createStone({
        map: { display: false },
        img: { tint: 0xe5e5e5 },
        loot: [
            tierLoot("tier_surviv", 1, 1),
            autoLoot("ak47", 1),
            autoLoot("helmet02", 1),
            autoLoot("chest02", 1),
            autoLoot("bandage", 5),
            autoLoot("2xscope", 1),
        ],
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
    stone_04: createStone({
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
    }),
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
    stone_08: createRiverStone({
        loot: [
            tierLoot("tier_medical", 2, 3),
            tierLoot("tier_surviv", 1, 2),
            autoLoot("vss", 1),
        ],
        img: {
            sprite: "map-stone-03.img",
            residue: "",
            tint: 0xe6e6e6,
        },
    }),
    stone_08x: createRiverStone({
        loot: [
            tierLoot("tier_medical", 2, 3),
            tierLoot("tier_surviv", 1, 2),
            autoLoot("m39", 1),
        ],
        img: {
            sprite: "map-stone-03x.img",
            residue: "",
            tint: 0xe6e6e6,
        },
    }),
    stone_08cb: createRiverStone({
        loot: [
            tierLoot("tier_medical", 2, 3),
            tierLoot("tier_surviv", 1, 2),
            autoLoot("svd", 1),
            autoLoot("helmet02", 1),
        ],
        img: {
            sprite: "map-stone-03cb.img",
            residue: "",
            tint: 0xe6e6e6,
        },
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
    }),
    tree_01sv: createTree({
        map: { color: 0x435119 },
        img: { sprite: "map-tree-03sv.img" },
    }),
    tree_interior_01: createTree({ img: { zIdx: 200 } }),
    tree_interior_01bh: createTree({
        img: {
            sprite: "map-tree-13.img",
            scale: 0.35,
            zIdx: 200,
        },
    }),
    tree_interior_01de: createTree({
        loot: [tierLoot("tier_coconut_outfit", 1, 1), autoLoot("coconut", 3)],
        img: {
            sprite: "map-tree-14.img",
            scale: 0.35,
            zIdx: 200,
            randomRotation: true,
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
    // summer cache
    tree_03su: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { display: false, color: 0x215906, scale: 2.5 },
        img: { sprite: "map-tree-07su.img", tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    }),
    // spring cache
    tree_03sp: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { display: false, color: 0xfec6e1, scale: 2.5 },
        img: { sprite: "map-tree-07sp.img", tint: 0xb1b1b1 },
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
    }),
    // desert cache
    tree_03d: createTree({
        map: { display: false, color: 0x758028 },
        img: { sprite: "map-tree-06.img", tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    }),
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
        loot: [
            tierLoot("tier_surviv", 2, 3),
            autoLoot("mosin", 1),
            autoLoot("4xscope", 1),
            autoLoot("helmet02", 1),
        ],
    }),
    // woods cache
    tree_03w: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { display: false, color: 0x4f5715, scale: 2.5 },
        img: { sprite: "map-tree-07.img", tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    }),
    // halloween cache
    tree_03h: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { display: false, color: 0x4f5715, scale: 2.5 },
        img: { sprite: "map-tree-07.img", tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("mosin", 1)],
    }),
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
    }),
    // beach cache
    tree_03bh: createTree({
        scale: { createMin: 1.2, createMax: 1.25, destroy: 0.5 },
        collision: collider.createCircle(v2.create(0, 0), 1.1),
        map: { display: false },
        img: { sprite: "map-tree-13.img", scale: 0.35, tint: 0xb1b1b1 },
        loot: [tierLoot("tier_surviv", 2, 3), autoLoot("scout_elite", 1)],
    }),
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
    }),
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
    }),
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
    }),
    tree_06: createTree({
        img: { sprite: "map-tree-06.img" },
        map: { color: 0x758028 },
    }),
    tree_07: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { color: 0x4f5715, scale: 2.5 },
        img: { sprite: "map-tree-07.img" },
    }),
    tree_07sp: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { color: 0xfec6e1, scale: 2.5 },
        img: { sprite: "map-tree-07sp.img" },
        terrain: { grass: true, beach: false, riverShore: true },
    }),
    tree_07spr: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { color: 0xfec6e1, scale: 2.5 },
        img: { sprite: "map-tree-07sp.img" },
        terrain: { grass: false, beach: false, riverShore: true },
    }),
    tree_07su: createTree({
        scale: { createMin: 1, createMax: 1.2 },
        map: { color: 0x215906, scale: 2.5 },
        img: { sprite: "map-tree-07su.img" },
    }),
    tree_08: createTree({
        scale: { createMin: 1.2, createMax: 1.4 },
        health: 225,
        map: { color: 0xa85d0c, scale: 2.5 },
        img: {
            sprite: "map-tree-08.img",
            residue: "map-tree-res-02.img",
            scale: 0.35,
        },
    }),
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
    }),
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
    }),
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
    }),
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
    }),
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
    }),
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
    }),
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
    }),
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
    }),
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
    }),
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
    }),
    tree_11: createTree({
        collision: collider.createCircle(v2.create(0, 0), 1.25),
        scale: { createMin: 1, createMax: 1 },
        img: {
            sprite: "map-tree-11.img",
            scale: 0.75,
            alpha: 0.92,
            zIdx: 201,
        },
    }),
    tree_interior_11: createTree({
        collision: collider.createCircle(v2.create(0, 0), 1.25),
        scale: { createMin: 1, createMax: 1 },
        img: {
            sprite: "map-tree-11.img",
            scale: 0.5,
            alpha: 0.92,
            zIdx: 200,
        },
    }),
    tree_12: createTree({
        map: { color: 0x7a9024, scale: 7 },
        img: {
            sprite: "map-tree-12.img",
            residue: "map-tree-res-12.img",
            tint: 0xffffff,
            zIdx: 801,
        },
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(11, 11)),
    }),
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
    }),
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
    }),
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
    }),
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
    }),
    // Big Palm
    tree_14d: createTree({
        health: 250,
        scale: { createMin: 1.5, createMax: 1.7, destroy: 0.95 },
        collision: collider.createCircle(v2.create(0, 0), 1),
        loot: [autoLoot("coconut", 3), autoLoot("coconut", 3), autoLoot("coconut", 3)],
        img: {
            sprite: "map-tree-14.img",
            scale: 0.35,
            tint: 0xffffff,
            zIdx: 801,
            randomRotation: true,
        },
        terrain: { grass: true, beach: true },
    }),
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
    }),
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
    woodpile_03: createWoodPile({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3, 1.75)),
        health: 175,
        destructible: true,
        map: { display: true, color: 0x663300, scale: 0.8 },
        img: {
            sprite: "map-woodpile-03.img",
            residue: "map-woodpile-res-03.img",
        },
    }),
};
