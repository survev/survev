import type { AABB } from "../../utils/coldet.ts";
import type { Vec2 } from "../../utils/v2.ts";
import type { TerrainSpawnDef } from "../mapObjectsTyping.ts";

export interface StructureDef {
    readonly type: "structure";
    terrain: TerrainSpawnDef;
    ori?: number;
    mapObstacleBounds?: AABB[];
    layers: Array<{
        type: string;
        pos: Vec2;
        ori: number;
        underground?: boolean;
        inheritOri?: number;
    }>;
    stairs: Array<{
        collision: AABB;
        downDir: Vec2;
        noCeilingReveal?: boolean;
        lootOnly?: boolean;
    }>;
    mask: AABB[];
    bunkerType?: string;
    structureType?: string;
    interiorSound?: {
        sound: string;
        soundAlt: string;
        filter?: string;
        transitionTime: number;
        soundAltPlayTime?: number;
        outsideMaxDist: number;
        outsideVolume: number;
        undergroundVolume?: number;
        puzzle: string;
    };
    bridgeLandBounds?: AABB[];
    bridgeWaterBounds?: AABB[];
    teamId?: number;
}
