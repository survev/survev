import type { Vec2 } from "../utils/v2.ts";

export interface TerrainSpawnDef {
    grass?: boolean;
    beach?: boolean;
    riverShore?: boolean;
    spawnPriority?: number;
    bridge?: {
        nearbyWidthMult: number;
    };
    waterEdge?: {
        dir: Vec2;
        distMin: number;
        distMax: number;
    };
    river?: {
        centerWeight: number;
    };
    nearbyRiver?: {
        radMin: number;
        radMax: number;
        facingOri: number;
    };
    minDistanceFromSameType?: number;
}

export type SurfaceType =
    | "asphalt"
    | "brick"
    | "bunker"
    | "carpet"
    | "container"
    | "grass"
    | "shack"
    | "snow"
    | "stone"
    | "tile"
    | "warehouse"
    | "water"
    | "house"
    | "sand";

export interface SurfaceData {
    isBright?: boolean;
    waterColor?: number;
    rippleColor?: number;
}

export interface LootSpawnDef {
    tier?: string;
    min?: number;
    max?: number;
    props?: {
        preloadGuns?: boolean;
    };
    type?: string;
    count?: number;
}

export interface LootSpawnerDef {
    type: "loot_spawner";
    loot: Array<LootSpawnDef>;
    terrain?: TerrainSpawnDef;
}
