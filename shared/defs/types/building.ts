import type { AABB, Collider } from "../../utils/coldet";
import type { Vec2 } from "../../utils/v2";
import type { TerrainSpawnDef } from "../mapObjectsTyping";

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
    mapObstacleBounds?: Collider[];
    zIdx?: number;
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
    }>;
    porch_01?: string;
    stand?: string;
    tree?: string;
    tree_scale?: number;
    tree_loot?: string;
    bush_chance?: number;
    decoration_01?: string;
    decoration_02?: string;
    mid_obs_01?: string;
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
    ori?: number;
    topLeftObs?: string;
    topRightObs?: string;
    botRightObs?: string;
    ignoreMapSpawnReplacement?: boolean;
    mapGroundPatches?: Array<{
        bound: AABB;
        color: number;
        order?: number;
        roughness?: number;
        offsetDist?: number;
        useAsMapShape?: boolean;
    }>;
    bridgeLandBounds?: AABB[];
    groundTintLt?: number;
    groundTintDk?: number;
    bridgeWaterBounds?: AABB[];
    bonus_room?: string;
    bonus_door?: string;
    goreRegion?: AABB;
    tree_08c?: string;
    crate?: string;
    oris?: number[];
    vault?: string;
    scale?: {
        createMin: number;
        createMax: number;
        destroy: number;
    };
    statue?: string;
    gold_box?: number;
    floor_loot?: string;
    cabin_mount?: string;
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
        collision: AABB;
        healRate: number;
    }>;
    center_loot?: string;
    left_loot?: string;
    right_loot?: string;
    entry_loot?: string;
    obs?: string;
    ceilingImg?: string;
    specialLoot?: string;
    basement?: string;
    grass_color?: number;
    tree_small?: string;
    tree_large?: string;
    floor_images?: FloorImage[];
    ceiling_images?: Array<{
        sprite: string;
        pos?: Vec2;
        rot?: number;
        scale: number;
        alpha: number;
        tint: number;
    }>;
    teamId?: number;
}

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
