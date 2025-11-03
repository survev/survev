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
    }

    delayedToggle(delay: number, player?: Player, dir?: Vec2) {
        this.toggleTicker = delay;
        this.togglePlayer = player;
        this.toggleDir = dir;
    }

    updateCollider() {
        const def = MapObjectDefs[this.type] as ObstacleDef;
        this.collider = collider.transform(def.collision, this.pos, this.rot, this.scale);

        this.bounds = collider.toAabb(
            collider.transform(def.collision, v2.create(0, 0), this.rot, this.scale),
        );

        const margin = v2.create(this.interactionRad, this.interactionRad);
        v2.set(this.bounds.min, v2.sub(this.bounds.min, margin));
        v2.set(this.bounds.max, v2.add(this.bounds.max, margin));
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
            if (obj.dead) return false;
            if (!util.sameLayer(this.layer, obj.layer)) return false;

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

        this.scale = this.minScale;
        this.updateCollider();

        if (def.destroyType) {
            let destroyType: string;
            // in cobalt, class shells need to spawn a pod that corresponds to the player's class (role)
            if (
                def.smartLoot &&
                this.interactedBy &&
                this.game.map.mapDef.gameMode.perkModeRoles?.includes(
                    this.interactedBy.role,
                )
            ) {
                destroyType = `${def.destroyType}_${this.interactedBy.role}`;
            } else {
                destroyType = def.destroyType;
            }
            this.game.map.genAuto(destroyType, this.pos, this.layer, this.ori);
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

        const loot = [...def.loot];

        if (
            params.source?.__type === ObjectType.Player &&
            params.source.hasPerk("scavenger")
        ) {
            loot.push({
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
            loot.push({
                tier: "tier_scavenger_adv",
                min: 1,
                max: 1,
                props: {},
            });
        }

        for (const lootTierOrItem of loot) {
            if ("tier" in lootTierOrItem) {
                const count = util.randomInt(lootTierOrItem.min!, lootTierOrItem.max!);

                for (let i = 0; i < count; i++) {
                    const items = this.game.lootBarn.getLootTable(lootTierOrItem.tier!);

                    for (const item of items) {
                        this.game.lootBarn.addLoot(
                            item.name,
                            v2.add(lootPos, v2.mul(v2.randomUnit(), 0.2)),
                            this.layer,
                            item.count,
                            undefined,
                            undefined, // undefined to use default push speed value
                            params.dir,
                            lootTierOrItem.props?.preloadGuns || item.preload,
                            "obstacle",
                        );
                    }
                }
            } else {
                this.game.lootBarn.addLoot(
                    lootTierOrItem.type!,
                    v2.add(lootPos, v2.mul(v2.randomUnit(), 0.2)),
                    this.layer,
                    lootTierOrItem.count!,
                    undefined,
                    undefined,
                    params.dir,
                    lootTierOrItem.props?.preloadGuns,
                );
            }
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
                } else if (obj.type.includes("window_open")) {
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

        this.interactedBy = player;

        if (this.isDoor && this.door) {
            if (!this.door.canUse) return;
            if (this.door.autoOpen && !auto) return;
            if (this.door.autoOpen && this.door.open) return;

            this.door.seq++;
            if (this.door.openOnce) {
                this.door.canUse = false;
            }

            this.setDirty();
            if (this.door.openDelay > 0) {
                this.delayedToggle(this.door.openDelay, player);
                this.toggleTicker = this.door.openDelay;
            } else {
                this.toggleDoor(player);
            }
        }

        if (this.isButton && this.button.canUse) {
            this.useButton();
        }
    }

    unlock(): void {
        this.interact(undefined, true);
        this.game.playerBarn.addMapPing("ping_unlock", this.pos);
    }

    useButton(): void {
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
        if (this.button.onOff && this.isPuzzlePiece) {
            this.parentBuilding?.puzzlePieceToggled(this);
        }
        const def = MapObjectDefs[this.type] as ObstacleDef;
        if (def.button?.destroyOnUse && def.destroyType) {
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
