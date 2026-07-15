import type { AABB, Collider } from "../../utils/coldet.ts";
import type { Vec2 } from "../../utils/v2.ts";
import type { LootSpawnDef, TerrainSpawnDef } from "../mapObjectsTyping.ts";

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
        randomRotation?: boolean;
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
            unlock?: string;
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
    /**
     * Configure intractability for this obstacle (used for buttons, control panels, etc).
     *
     * When interacted with, obstacles trigger an 'activation effect'; either a door opening,
     * many doors opening, etc. Which obstacles are affected, how they are affected, and after
     * how much time is all controlled by the properties on this object
     */
    button?: {
        interactionRad: number;
        interactionText: string;
        /**
         * Whether the obstacle can only be interacted with once
         */
        useOnce: boolean;
        /**
         * The type of obstacle to 'activate' when this obstacle is interacted with
         *
         * The definition of 'activate' depends on the obstacle in question and the
         * other properties
         */
        useType?: string;
        /**
         * What to do to doors which are triggered by this obstacle's interaction.
         *
         * @default "toggle"
         */
        useStyle?: "toggle" | "close" | "open";
        /**
         * Whether to lock or unlock doors triggered by this obstacle's interaction. `undefined`
         * makes the interaction not touch the door's lock state.
         *
         * @default undefined
         */
        useLock?: "lock" | "unlock";
        /**
         * Will make interactions require the player to be completely inside the interactionRad
         */
        isVat?: boolean;
        roleToPromote?: string;
        /**
         * After the obstacle is interacted with, wait this many seconds before triggering the
         * activation effect
         */
        useDelay: number;
        /**
         * When simulating an interaction with a direction-sensitive obstacle (like a door),
         * from what direction should the interaction pretend to come from?
         */
        useDir: Vec2;
        /**
         * If specified, a period of time (in seconds) during which this obstacle cannot be
         * interacted with again
         */
        useCooldown?: number;
        /**
         * If specified, indicates that obstacles should be 'deactivated' after this many seconds.
         * Specifically, obstacles will return to the state they held before the activation caused
         * by the interaction. The countdown starts after the use delay
         */
        useExpiration?: number;
        /**
         * If set to true, the obstacle is reset after its use cooldown expires. If there is
         * no use cooldown, this property does nothing
         *
         * @default true
         */
        resetAfterCooldown?: boolean;
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
