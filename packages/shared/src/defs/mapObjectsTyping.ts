import type { Vec2 } from "../utils/v2";
import type { BuildingDef } from "./types/building";
import type { DecalDef } from "./types/decal";
import type { ObstacleDef } from "./types/obstacle";
import type { StructureDef } from "./types/structure";

interface TerrainSpawnDef {
    grass?: boolean;
    beach?: boolean;
    riverShore?: boolean;
    lakeCenter?: boolean;
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
    readonly type: "loot_spawner";
    loot: Array<LootSpawnDef>;
    terrain?: TerrainSpawnDef;
}

export type { BuildingDef, DecalDef, ObstacleDef, StructureDef, TerrainSpawnDef };

export type MapObjectDef =
    | ObstacleDef
    | BuildingDef
    | StructureDef
    | DecalDef
    | LootSpawnerDef;
