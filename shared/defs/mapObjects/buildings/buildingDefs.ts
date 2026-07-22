import type { FactionTeam } from "../../../gameConfig.ts";
import type { AABB, Collider } from "../../../utils/coldet.ts";
import type { Vec2 } from "../../../utils/v2.ts";
import type { TerrainSpawnDef } from "../../mapObjectsTyping.ts";
import { BaseBuildingDefs } from "./baseBuildingDefs.ts";
import { BunkerDefs } from "./bunkerDefs.ts";
import { CacheDefs } from "./cacheDefs.ts";
import { ModeBuildingDefs } from "./modeBuildingDefs.ts";

export interface BuildingDef {
    readonly type: "building";
    map?: {
        display?: boolean;
        color?: number;
        scale?: number;
        shapes?: Array<{
            collider: Collider;
            color: number;
        }>;
        displayType?: string;
    };
    terrain: TerrainSpawnDef;
    oris?: number[];
    ori?: number;
    teamId?: FactionTeam;
    zIdx?: number;
    scale?: {
        createMin: number;
        createMax: number;
        destroy: number;
    };
    mapObstacleBounds?: Collider[];
    floor: {
        surfaces: Array<{
            type: string;
            collision: AABB[];
            data?: {
                isBright: boolean;
            };
        }>;
        imgs: FloorImage[];
    };
    ceiling: {
        zoomRegions: Array<{
            zoomIn?: AABB;
            zoomOut?: AABB;
            zoom?: number;
            noZoom?: boolean;
        }>;
        vision?: {
            dist?: number;
            width?: number;
            linger?: number;
            fadeRate?: number;
        };
        imgs: FloorImage[];
        damage?: {
            obstacleCount: number;
        };
        destroy?: {
            wallCount: number;
            particle: string;
            particleCount: number;
            residue: string;
            sound?: string;
        };
        collision?: AABB[];
    };
    mapObjects: Array<{
        type?: string | Record<string, number>;
        pos: Vec2;
        scale: number;
        ori: number;
        ignoreMapSpawnReplacement?: boolean;
        inheritOri?: boolean;
        puzzlePiece?: string;
        layer?: number;
    }>;
    occupiedEmitters?: Array<{
        type: string;
        pos: Vec2;
        rot: number;
        scale: number;
        layer: number;
        parentToCeiling?: boolean;
        dir?: Vec2;
    }>;
    puzzle?: {
        name: string;
        completeUseType: string;
        completeOffDelay: number;
        completeUseDelay: number;
        errorResetDelay: number;
        pieceResetDelay: number;
        sound: {
            fail: string;
            complete: string;
        };
    };
    mapGroundPatches?: Array<{
        bound: Collider;
        color: number;
        order?: number;
        roughness?: number;
        offsetDist?: number;
        useAsMapShape?: boolean;
    }>;
    bridgeLandBounds?: AABB[];
    bridgeWaterBounds?: AABB[];
    goreRegion?: AABB;
    soundEmitters?: Array<{
        sound: string;
        channel: string;
        pos: Vec2;
        range: {
            min: number;
            max: number;
        };
        falloff: number;
        volume: number;
    }>;
    healRegions?: Array<{
        collision: Collider;
        healRate: number;
    }>;
}

export type BuildingChildObjType = BuildingDef["mapObjects"][0]["type"];

export interface FloorImage {
    sprite: string;
    scale: number;
    alpha: number;
    tint: number;
    rot?: number;
    pos?: Vec2;
    removeOnDamaged?: boolean;
    mirrorY?: boolean;
    mirrorX?: boolean;
}

export const BuildingDefs = {
    ...BaseBuildingDefs,
    ...ModeBuildingDefs,
    ...BunkerDefs,
    ...CacheDefs,
};
