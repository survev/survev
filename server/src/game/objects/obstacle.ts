import { GameObjectDefs } from "../../../../shared/defs/gameObjectDefs";
import { MapObjectDefs } from "../../../../shared/defs/mapObjectDefs";
import type { ObstacleDef } from "../../../../shared/defs/mapObjectsTyping";
import { DamageType, GameConfig } from "../../../../shared/gameConfig";
import { ObjectType } from "../../../../shared/net/objectSerializeFns";
import { type AABB, type Collider, coldet } from "../../../../shared/utils/coldet";
import { collider } from "../../../../shared/utils/collider";
import { math } from "../../../../shared/utils/math";
import { util } from "../../../../shared/utils/util";
import { type Vec2, v2 } from "../../../../shared/utils/v2";
import type { Game } from "../game";
import type { Building } from "./building";
import { BaseGameObject, type DamageParams } from "./gameObject";
import type { Player } from "./player";

export class Obstacle extends BaseGameObject {
    override readonly __type = ObjectType.Obstacle;
    bounds: AABB;

    // just to cope with shared client function typing
    active = true;

    dead = false;

    type: string;
    ori: number;
    rot: number;

    layer: number;
    originalLayer: number;

    collider!: Collider;
    mapObstacleBounds: Collider[];
    collidable: boolean;
    destructible: boolean;

    health: number;
    maxHealth: number;
    healthT = 1;

    scale: number;
    minScale: number;
    maxScale: number;

    height: number;

    interactionRad = 0;
    interactedBy?: Player;
    interactCooldown = 0;

    obstacleAABB?: AABB = undefined;

    get interactable() {
        return this.button?.canUse ?? this.door?.canUse;
    }

    isDoor: boolean;
    door?: {
        open: boolean;
        canUse: boolean;
        locked: boolean;
        hinge: Vec2;
        closedOri: number;
        closedPos: Vec2;
        openOneWay: number;
        openDelay: number;
        seq: number;
        openOnce: boolean;
        autoOpen: boolean;
        autoClose: boolean;
        autoCloseDelay: number;
        slideToOpen: boolean;
        slideOffset: number;
    };

    isButton: boolean;
    button!: {
        onOff: boolean;
        canUse: boolean;
        seq: number;
        useOnce: boolean;
        useType: string;
        isVat?: boolean;
        roleToPromote?: string;
        useDelay: number;
        useDir: Vec2;
    };

    isPuzzlePiece: boolean;
    puzzlePiece?: string;

    isSkin: boolean;
    skinPlayerId?: number;

    isWindow: boolean;
    isWall: boolean;
    isTree: boolean;

    // auto opening / closing doors, regrowing potatos etc
    isDynamic: boolean;

    parentBuildingId?: number;
    parentBuilding?: Building;

    toggleTicker = 0;
    togglePlayer: Player | undefined = undefined;
    toggleDir: Vec2 | undefined = undefined;

    killTicker = 0;
    regrowTicker = 0;

    // for cobalt class pods, its the ID of the player that opened the class pod
    shouldApplyLootOwner = false;
    ownerId = 0;

    constructor(
        game: Game,
        pos: Vec2,
        type: string,
        layer: number,
        ori = 0,
        scale = 1,
        parentBuildingId?: number,
        puzzlePiece?: string,
        isSkin?: boolean,
    ) {
        super(game, pos);
        this.type = type;
        this.ori = ori;
        this.scale = scale;
        this.layer = layer;
        this.originalLayer = layer;
        this.parentBuildingId = parentBuildingId;

        const building = this.game.objectRegister.getById(this.parentBuildingId ?? 0);
        if (building?.__type === ObjectType.Building) {
            this.parentBuilding = building;
        }

        this.isPuzzlePiece = !!puzzlePiece;
        this.puzzlePiece = puzzlePiece;
        const def = MapObjectDefs[type];

        this.rot = math.oriToRad(ori);

        if (def.type !== "obstacle") {
            throw new Error(`Invalid obstacle with type ${type}`);
        }
        this.bounds = collider.toAabb(
            collider.transform(def.collision, v2.create(0, 0), this.rot, this.scale),
        );

        this.height = def.height;

        this.isSkin = isSkin ?? false;
        this.collidable = (def.collidable && !this.isSkin) ?? true;
        this.isWindow = def.isWindow ?? false;
        this.isWall = def.isWall ?? false;
        this.isTree = def.isTree ?? false;

        this.maxHealth = def.health;
        this.health = def.health;

        this.maxScale = scale;
        this.minScale = def.scale.destroy;

        this.updateCollider();

        this.mapObstacleBounds = [this.collider];

        this.destructible = !!def.destructible;

        this.isDoor = !!def.door;
        if (def.door) {
            this.door = {
                open: false,
                canUse: def.door.canUse,
                hinge: def.hinge!,
                closedPos: v2.copy(this.pos),
                closedOri: this.ori,
                openDelay: def.door.openDelay ?? 0,
                seq: 1,
                locked: def.door.locked ?? false,
                openOneWay: def.door.openOneWay ?? false,
                openOnce: def.door.openOnce ?? false,
                autoOpen: def.door.autoOpen ?? false,
                autoClose: def.door.autoClose ?? false,
                autoCloseDelay: def.door.autoCloseDelay ?? 0,
                slideToOpen: def.door.slideToOpen ?? false,
                slideOffset: def.door.slideOffset ?? 0,
            };

            this.interactionRad = def.door.interactionRad;
            this.checkLayer();
        }

        this.isButton = !!def.button;
        if (def.button) {
            this.button = {
                onOff: false,
                canUse: true,
                seq: 1,
                useOnce: def.button.useOnce,
                useType: def.button.useType!,
                isVat: def.button.isVat,
                roleToPromote: def.button.roleToPromote,
                useDelay: def.button.useDelay,
                useDir: def.button.useDir,
            };
            this.interactionRad = def.button.interactionRad;
        }

        this.isDynamic = def.regrow || this.isDoor || this.isButton;
    }

    update(dt: number): void {
        if (this.toggleTicker > 0) {
            this.toggleTicker -= dt;

            if (this.toggleTicker < 0) {
                // for auto closing doors
                // check if theres a player near by before closing
                // to avoid it closing for a single tick to open again
                if (
                    !(
                        this.door &&
                        this.door.open &&
                        this.door.autoClose &&
                        this.checkNearByPlayers()
                    )
                ) {
                    this.toggleDoor(this.togglePlayer, this.toggleDir);
                }
            }
        }

        if (this.killTicker > 0) {
            this.killTicker -= dt;
            if (this.killTicker < 0) {
                this.kill({
                    dir: v2.create(0, 0),
                    // obstacles that can kill themselves are airdrops being opened ig
                    damageType: GameConfig.DamageType.Airdrop,
                    source: this.interactedBy,
                });
            }
        }

        if (this.regrowTicker > 0) {
            this.regrowTicker -= dt;
            if (this.regrowTicker < 0) {
                this.regrow();
            }
        }

        if (this.interactCooldown > 0) {
            this.interactCooldown -= dt;
        }
    }

    delayedToggle(delay: number, player?: Player, dir?: Vec2) {
        this.toggleTicker = delay;
        this.togglePlayer = player;
        this.toggleDir = dir;
    }

    updateCollider() {
        const def = MapObjectDefs[this.type] as ObstacleDef;
        this.collider = collider.transform(def.collision, this.pos, this.rot, this.scale);

        if (def.aabb) {
            this.bounds = collider.transform(
                def.aabb,
                v2.create(0, 0),
                this.rot,
                this.scale,
            ) as AABB;
            this.obstacleAABB = collider.transform(
                def.aabb,
                this.pos,
                this.rot,
                this.scale,
            ) as AABB;
        } else {
            this.bounds = collider.toAabb(
                collider.transform(def.collision, v2.create(0, 0), this.rot, this.scale),
            );

            const margin = v2.create(this.interactionRad, this.interactionRad);
            v2.set(this.bounds.min, v2.sub(this.bounds.min, margin));
            v2.set(this.bounds.max, v2.add(this.bounds.max, margin));
        }

        this.game.grid.updateObject(this);
    }

    checkNearByPlayers() {
        if (!this.door) return false;

        const coll = collider.createCircle(
            this.door.closedPos,
            this.interactionRad + GameConfig.player.maxInteractionRad,
        );
        const objs = this.game.grid.intersectCollider(coll);

        const def = MapObjectDefs[this.type] as ObstacleDef;
        const closedColl = collider.transform(
            def.collision,
            this.door.closedPos,
            this.rot,
            this.scale,
        );

        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            if (obj.__type !== ObjectType.Player) continue;
            if (obj.dead) continue;
            if (!util.sameLayer(this.layer, obj.layer)) continue;

            const res = collider.intersectCircle(
                closedColl,
                obj.pos,
                this.interactionRad + obj.rad,
            );

            if (res) {
                this.delayedToggle(this.door.autoCloseDelay);
                return true;
            }
        }
        return false;
    }

    regrow() {
        this.dead = false;
        this.scale = this.maxScale;

        this.health = this.maxHealth;
        this.healthT = 1;

        this.updateCollider();

        this.setDirty();
    }

    checkLayer(): void {
        // @hack this door shouldn't switch layers
        if (this.type === "saloon_door_secret" || this.type === "house_door_01") return;
        let newLayer = this.originalLayer;
        const def = MapObjectDefs[this.type] as ObstacleDef;
        const coll = collider.createCircle(this.pos, def.door!.interactionRad + 1);
        const objs = this.game.grid.intersectCollider(coll);
        for (const obj of objs) {
            if (obj.__type === ObjectType.Structure) {
                for (const stair of obj.stairs) {
                    if (coldet.test(coll, stair.downAabb)) {
                        newLayer = 3;
                    } else if (coldet.test(coll, stair.upAabb)) {
                        newLayer = 2;
                    }
                }
            }
        }
        if (newLayer !== this.layer) {
            this.layer = newLayer;
            this.setDirty();
        }
    }

    damage(params: DamageParams): void {
        if (this.isSkin) return;

        const def = MapObjectDefs[this.type] as ObstacleDef;
        if (this.health === 0 || !this.destructible) return;

        if (params.damageType === DamageType.Player) {
            let armorPiercing = false;
            let stonePiercing = false;

            if (params.gameSourceType) {
                const sourceDef = GameObjectDefs[params.gameSourceType] as
                    | {
                          armorPiercing?: boolean;
                          stonePiercing?: boolean;
                      }
                    | undefined;
                armorPiercing = sourceDef?.armorPiercing ?? false;
                stonePiercing = sourceDef?.stonePiercing ?? false;
            }

            if (def.armorPlated && !armorPiercing) return;
            if (def.stonePlated && !stonePiercing) return;
        }

        this.health -= params.amount!;
        this.health = math.max(0, this.health);

        this.healthT = math.clamp(this.health / this.maxHealth, 0, 1);

        if (this.minScale < 1) {
            this.scale = math.lerp(this.healthT, this.minScale, this.maxScale);
            this.updateCollider();
        }

        // need to send full object for obstacles with explosions
        // so smoke particles work on the client
        // since they depend on healthT
        if (def.explosion) this.setDirty();
        else this.setPartDirty();

        if (this.health <= 0) {
            this.kill(params);
        }
    }

    kill(params: DamageParams) {
        const def = MapObjectDefs[this.type] as ObstacleDef;
        this.health = this.healthT = 0;
        this.dead = true;
        this.setDirty();

        if (params.source?.__type === ObjectType.Player) {
            params.source.questManager.trackEvent("destruction", {
                objectType: this.type,
            });
        }

        if (def.airdropCrate && this.interactedBy) {
            this.interactedBy.questManager.trackEvent("item_used", {
                itemType: "airdrop_crate",
            });
        }

        this.scale = this.minScale;
        this.updateCollider();

        if (def.destroyType) {
            let destroyType: string;
            // in cobalt, class shells need to spawn a pod that corresponds to the player's class (role)
            if (def.smartLoot && this.interactedBy) {
                destroyType = `${def.destroyType}_${this.interactedBy.role}`;
            } else {
                destroyType = def.destroyType;
            }
            const obj = this.game.map.genAuto(
                destroyType,
                this.pos,
                this.layer,
                this.ori,
            );

            if (obj?.__type === ObjectType.Obstacle) {
                obj.shouldApplyLootOwner = !!def.smartLoot;
                if (def.smartLoot && params.source?.__type === ObjectType.Player) {
                    obj.ownerId = params.source.__id;
                }
            }
        }

        // potatos in potato mode
        if (def.swapWeaponOnDestroy && params.source?.__type === ObjectType.Player) {
            params.source.randomWeaponSwap(params);
        }

        if (def.regrow && def.regrowTimer) {
            this.regrowTicker = def.regrowTimer;
        }

        const lootPos = v2.copy(this.pos);
        if (def.lootSpawn) {
            v2.set(lootPos, v2.add(this.pos, v2.rotate(def.lootSpawn.offset, this.rot)));
        }

        const lootTablesOrItems = [...def.loot];

        if (
            params.source?.__type === ObjectType.Player &&
            params.source.hasPerk("scavenger")
        ) {
            lootTablesOrItems.push({
                tier: "tier_world",
                min: 1,
                max: 1,
                props: {},
            });
        }

        if (
            params.source?.__type === ObjectType.Player &&
            params.source.hasPerk("scavenger_adv")
        ) {
            lootTablesOrItems.push({
                tier: "tier_scavenger_adv",
                min: 1,
                max: 1,
                props: {},
            });
        }

        // cobalt class pod logic
        let ownerId = 0;
        if (this.shouldApplyLootOwner) {
            // default to whoever broke the class pod
            ownerId =
                params.source?.__type === ObjectType.Player ? params.source.__id : 0;

            // but then check for the player who unlocked this class pod
            // if they are still alive and close give it to them instead
            const podUnlocker = this.game.objectRegister.getById(this.ownerId);
            if (
                podUnlocker &&
                podUnlocker.__type === ObjectType.Player &&
                !podUnlocker.dead &&
                util.sameLayer(podUnlocker.layer, this.layer)
            ) {
                const distance = v2.distance(this.pos, podUnlocker.pos);
                if (distance <= 8) {
                    ownerId = this.ownerId;
                }
            }
        }

        const items: Array<{
            type: string;
            preload?: boolean;
            count: number;
        }> = [];

        // collect all the items we are spawning into a single array
        // so we can determine the spawn radius based on it

        for (const lootTierOrItem of lootTablesOrItems) {
            if ("tier" in lootTierOrItem) {
                const count = util.randomInt(lootTierOrItem.min!, lootTierOrItem.max!);
                for (let i = 0; i < count; i++) {
                    const item = this.game.lootBarn.getLootTable(lootTierOrItem.tier!);
                    if (!item) continue;
                    items.push({
                        type: item.name,
                        preload: lootTierOrItem.props?.preloadGuns || item.preload,
                        count: item.count,
                    });
                }
            } else {
                items.push({
                    type: lootTierOrItem.type!,
                    preload: lootTierOrItem.props?.preloadGuns,
                    count: lootTierOrItem.count ?? 1,
                });
            }
        }

        const colliderRad =
            def.collision.type === collider.Type.Aabb
                ? coldet.aabbToCircle(def.collision.min, def.collision.max).rad / 2
                : def.collision.rad;

        // max items before it changes from pushing in hit direction to
        // the direction between obstacle center and loot (so it spreads better)
        const shouldSpreadItems = items.length > 3;

        let rad: number;
        let pushSpeed;

        if (shouldSpreadItems) {
            // calculate a radius based on amount of loot and obstacle size
            rad = math.remap(items.length, 2, 10, 0, colliderRad);
            pushSpeed = math.remap(items.length, 8, 20, 4, 14);
        } else if (items.length === 1) {
            // for exactly 1 loot we just spawn it in the perfect center with a high push speed
            rad = 0;
            pushSpeed = 7;
        } else {
            // for between 1 and the `shouldSpreadItems` threshold we just have a small radius
            // and a smaller speed (because the loot will push eachother)
            rad = 0.1;
            pushSpeed = 4;
        }

        for (const item of items) {
            const pos = v2.add(lootPos, util.randomPointInCircle(rad));

            const dir = shouldSpreadItems
                ? v2.normalize(v2.sub(pos, lootPos))
                : params.dir;

            this.game.lootBarn.addLoot(
                item.type,
                pos,
                this.layer,
                item.count,
                undefined,
                pushSpeed,
                dir,
                undefined,
                item.preload,
                "obstacle",
                ownerId,
            );
        }

        if (def.createSmoke) {
            this.game.smokeBarn.addEmitter(this.pos, this.layer);
        }

        if (def.explosion) {
            this.game.explosionBarn.addExplosion(def.explosion, this.pos, this.layer, {
                ...params,
                gameSourceType: "",
                mapSourceType: this.type,
            });
        }

        this.parentBuilding?.obstacleDestroyed(this);

        if (this.isWall) {
            const objs = this.game.grid.intersectGameObject(this);

            for (let i = 0; i < objs.length; i++) {
                const obj = objs[i];
                if (obj.__type !== ObjectType.Obstacle) continue;
                if (obj.dead) continue;
                if (!util.sameLayer(this.layer, obj.layer)) continue;

                let collision: Collider | undefined = undefined;
                if (obj.isDoor) {
                    collision = collider.createCircle(obj.pos, 0.5);
                } else if (obj.height == 0.2 && obj.isWall && !obj.destructible) {
                    // broken windows
                    collision = obj.collider;
                }
                if (!collision) continue;

                if (coldet.test(this.collider, collision)) {
                    obj.kill(params);
                }
            }
        }
    }

    interact(player?: Player, auto = false): void {
        if (this.dead) return;

        if (player && !auto) {
            if (this.interactCooldown > 0) return;
            this.interactCooldown = 0.1;
        }

        if (
            player &&
            this.isButton &&
            this.button.roleToPromote &&
            player.role === this.button.roleToPromote
        ) {
            return;
        }

        if (this.isDoor && this.door) {
            if (!this.door.canUse) return;
            if (this.door.autoOpen && !auto) return;
            if (this.door.autoOpen && this.door.open) return;

            this.door.seq++;
            if (this.door.openOnce) {
                this.door.canUse = false;
            }
            this.interactedBy = player;
            this.setDirty();
            if (this.door.openDelay > 0) {
                this.delayedToggle(this.door.openDelay, player);
                this.toggleTicker = this.door.openDelay;
            } else {
                this.toggleDoor(player);
            }
        }

        if (this.isButton && this.button.canUse) {
            this.interactedBy = player;
            this.useButton(player);
        }
    }

    unlock(): void {
        this.interact(undefined, true);
        this.game.playerBarn.addMapPing("ping_unlock", this.pos);
    }

    useButton(player?: Player): void {
        if (!this.button.canUse) return;

        this.button.onOff = !this.button.onOff;
        this.button.seq++;

        if (this.button.useOnce) {
            this.button.canUse = false;
        }

        if (this.button.useType && this.parentBuilding) {
            for (const obj of this.parentBuilding.childObjects) {
                if (
                    obj.__type === ObjectType.Obstacle &&
                    obj.type === this.button.useType &&
                    obj.isDoor
                ) {
                    obj.delayedToggle(
                        this.button.useDelay,
                        undefined,
                        this.button.useDir,
                    );
                }
            }
        }

        // Promotion from buttons, checks for a "roleToPromote" field in the button def.
        if (this.button.roleToPromote && player) {
            player.promoteToRole(this.button.roleToPromote);
        }

        if (this.button.onOff && this.isPuzzlePiece) {
            this.parentBuilding?.puzzlePieceToggled(this);
        }
        const def = MapObjectDefs[this.type] as ObstacleDef;
        if (def.button?.destroyOnUse) {
            this.killTicker = this.button.useDelay;
        }
        this.setDirty();
    }

    getPlayerSide(player: Player) {
        const toDoor = v2.sub(this.pos, player.pos);
        const doorDir = v2.rotate(v2.create(1, 0), this.rot);
        return v2.dot(toDoor, doorDir) < 0 ? -1 : 1;
    }

    toggleDoor(player?: Player, useDir?: Vec2): void {
        if (!this.door) return;

        const door = this.door;

        door.open = !door.open;

        if (door.autoClose && door.open) {
            this.delayedToggle(door.autoCloseDelay, player);
        }

        if (door.slideToOpen) {
            const offSet = v2.create(0, door.slideOffset * (door.open ? -1 : 1));
            this.pos = v2.add(this.pos, v2.rotate(offSet, this.rot));
        } else if (!door.open) {
            // if not a sliding door and closed, reset the orientation to the original one
            this.ori = door.closedOri;
        } else {
            // otherwise calculate it based on some factors
            let side = -1;

            // useDir is used by buttons that toggle doors
            if (useDir?.x) {
                side = useDir.x;
            } else if (door.openOneWay) {
                // doors that can only open on one way ignore player position
                // eg: bank vault door
                side = door.openOneWay;
            } else if (player) {
                // otherwise base it on player position
                side = this.getPlayerSide(player);
            }

            this.ori -= side;
        }

        this.rot = math.oriToRad(this.ori);

        this.updateCollider();

        this.checkLayer();
        this.setDirty();
    }

    updatePos(newPos: Vec2) {
        this.pos = v2.copy(newPos);
        this.game.map.clampToMapBounds(this.pos);
        this.setPartDirty();
    }

    refresh(): void {
        const newObstacle = this.game.map.genObstacle(
            this.type,
            v2.copy(this.pos),
            this.layer,
            this.ori,
            this.scale,
            this.parentBuildingId,
            this.puzzlePiece,
        );
        if (newObstacle.parentBuilding)
            newObstacle.parentBuilding.childObjects.push(newObstacle);
        this.destroy();
    }
}
