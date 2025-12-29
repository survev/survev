import type { AABB, Collider } from "../../utils/coldet";
import type { Vec2 } from "../../utils/v2";
import type { LootSpawnDef, TerrainSpawnDef } from "../mapObjectsTyping";

export interface ObstacleDef {
    readonly type: "obstacle";
    obstacleType?: string;
    scale: {
        createMin: number;
        createMax: number;
        destroy: number;
    };
    collision: Collider;
    height: number;
    collidable: boolean;
    destructible: boolean;
    explosion?: string;
    health: number;
    hitParticle: string;
    explodeParticle: string[] | string;
    reflectBullets: boolean;
    loot: Array<LootSpawnDef>;
    map?: {
        display: boolean;
        color?: number;
        scale?: number;
    };
    terrain?: TerrainSpawnDef;
    img: {
        sprite?: string;
        scale?: number;
        alpha?: number;
        tint?: number;
        zIdx?: number;
        residue?: string;
        mirrorY?: boolean;
        mirrorX?: boolean;
    };
    sound: {
        bullet?: string;
        punch?: string;
        explode?: string;
        enter?: string;
    };
    isWall?: boolean;
    material?: string;
    extents?: Vec2;
    mapObstacleBounds?: AABB[];
    door?: {
        interactionRad: number;
        canUse: boolean;
        openSpeed: number;
        openOneWay: number;
        openDelay: number;
        openOnce: boolean;
        autoOpen: boolean;
        autoClose: boolean;
        autoCloseDelay: number;
        slideToOpen: boolean;
        slideOffset: number;
        spriteAnchor: Vec2;
        sound: {
            open: string;
            close: string;
            change: string;
            error: string;
        };
        casingImg?: {
            sprite: string;
            pos: Vec2;
            scale: number;
            alpha: number;
            tint: number;
        };
        locked?: boolean;
    };
    hinge?: Vec2;
    isWindow?: boolean;
    destroyType?: string;
    stonePlated?: boolean;
    aabb?: AABB;
    isTree?: boolean;
    button?: {
        interactionRad: number;
        interactionText: string;
        useOnce: boolean;
        useType?: string;
        useDelay: number;
        useDir: Vec2;
        useImg: string;
        sound: {
            on: string;
            off: string;
        };
        destroyOnUse?: boolean;
        useParticle?: string;
        offImg?: string;
    };
    disableBuildingOccupied?: boolean;
    damageCeiling?: boolean;
    lootSpawn?: {
        offset: Vec2;
        speedMult: number;
    };
    dropCollision?: AABB;
    airdropCrate?: boolean;
    isBush?: boolean;
    isDecalAnchor?: boolean;
    swapWeaponOnDestroy?: boolean;
    regrow?: boolean;
    regrowTimer?: number;
    armorPlated?: boolean;
    smartLoot?: boolean;
    createSmoke?: boolean;
    teamId?: number;
}
