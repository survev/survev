import type { DeepPartial } from "../../utils/util.ts";
import type { LootSpawnDef } from "../mapObjectsTyping.ts";
import type { ObstacleDef } from "./obstacles/obstacleDefs.ts";

//
// Common helpers useful across many object def files
//

export function randomObstacleType(types: Record<string, number>) {
    return types;
}

export function tierLoot(tier: string, min: number, max: number, props?: LootSpawnDef["props"]) {
    props = props || {};
    return {
        tier,
        min,
        max,
        props,
    };
}

export function autoLoot(type: string, count: number, props?: LootSpawnDef["props"]) {
    props = props || {};
    return { type, count, props };
}

export const MaterialDefs = {
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
} satisfies Record<string, DeepPartial<ObstacleDef>>;

export type Material = keyof typeof MaterialDefs;
