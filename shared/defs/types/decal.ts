import type { Collider } from "../../utils/coldet";
import type { TerrainSpawnDef } from "../mapObjectsTyping";

export interface DecalDef {
    readonly type: "decal";
    collision: Collider;
    // ! terrain doesn't exist
    terrain?: TerrainSpawnDef;
    height: number;
    img: {
        sprite: string;
        scale: number;
        alpha: number;
        tint: number;
        zIdx: number;
        flicker?: boolean;
        flickerMin?: number;
        flickerMax?: number;
        flickerRate?: number;
        ignoreAdjust?: boolean;
    };
    lifetime?:
        | {
              min: number;
              max: number;
          }
        | number;
    fadeChance?: number;
    surface?: {
        type: string;
        data: {
            waterColor: number;
            rippleColor: number;
        };
    };
    gore?: {
        fade: {
            start: number;
            end: number;
            pow: number;
            speed: number;
        };
        tint?: number;
        alpha: number;
        waterColor?: number;
        rippleColor?: number;
    };
}
