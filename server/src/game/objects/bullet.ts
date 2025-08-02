import { GameObjectDefs } from "../../../../shared/defs/gameObjectDefs";
import {
    type BulletDef,
    BulletDefs,
} from "../../../../shared/defs/gameObjects/bulletDefs";
import { PerkProperties } from "../../../../shared/defs/gameObjects/perkDefs";
import { MapObjectDefs } from "../../../../shared/defs/mapObjectDefs";
import type { ObstacleDef } from "../../../../shared/defs/mapObjectsTyping";
import { GameConfig } from "../../../../shared/gameConfig";
import { Constants } from "../../../../shared/net/net";
import { ObjectType } from "../../../../shared/net/objectSerializeFns";
import { coldet } from "../../../../shared/utils/coldet";
import { collider } from "../../../../shared/utils/collider";
import { math } from "../../../../shared/utils/math";
import { util } from "../../../../shared/utils/util";
import { type Vec2, v2 } from "../../../../shared/utils/v2";
import type { Game } from "../game";
import type { DamageParams, GameObject } from "./gameObject";
import type { Obstacle } from "./obstacle";
import { Player } from "./player";

// NOTE: most of this code was copied from surviv client and bit heroes arena client
// to get bullet collision the most accurate possible

interface BulletCollision {
    type: "obstacle" | "player" | "pan";
    obj?: Player | Obstacle;
    obstacleType?: string;
    collidable: boolean;
    point: Vec2;
    normal: Vec2;
    dist: number;
    player?: Player;
    layer?: number;
}

export interface BulletParams {
    bulletType: string;
    gameSourceType: string;
    mapSourceType?: string;
    pos: Vec2;
    dir: Vec2;
    layer: number;
    damageMult: number;
    damageType: number;
    shotFx?: boolean;
    shotOffhand?: boolean;
    lastShot?: boolean;
    splinter?: boolean;
    apRounds?: boolean;
    shotAlt?: boolean;
    trailSaturated?: boolean;
    trailSmall?: boolean;
    trailThick?: boolean;
    varianceT?: number;
    playerId: number;
    reflectCount?: number;
    reflectObjId?: number;
    onHitFx?: string;
    clipDistance?: boolean;
    distance?: number;
}

export class BulletBarn {
    bullets: Bullet[] = [];
    newBullets: Bullet[] = [];

    constructor(public game: Game) {}

    damages: Array<DamageParams & { obj: GameObject }> = [];

    update(dt: number): void {
        let activeCount = 0;
        for (let i = 0; i < this.bullets.length; i++) {
            const bullet = this.bullets[i];
            if (bullet.active) {
                bullet.update(dt);
                activeCount++;
            }
        }

        for (let i = 0; i < this.damages.length; i++) {
            const damageRecord = this.damages[i];
            damageRecord.obj.damage(damageRecord);
        }
        this.damages.length = 0;

        // free some bullets if pool is too big
        if (this.bullets.length > 512 && activeCount < this.bullets.length / 2) {
            this.bullets = this.bullets.filter((b) => b.active);
        }

        // console.log("allocated:", this.bullets.length, "active:", activeCount)
    }

    flush(): void {
        for (let i = 0; i < this.newBullets.length; i++) {
            this.newBullets[i].sentToClient = true;
        }
        this.newBullets.length = 0;
    }

    fireBullet(params: BulletParams): Bullet {
        this.game.map.clampToMapBounds(params.pos);

        // sentToClient check to make sure bullets that are created and die immediatly
        // go through a net-tick first, so their data is not overwritten by the init call
        let bullet = this.bullets.find((b) => !b.active && b.sentToClient);
        if (!bullet) {
            bullet = new Bullet(this);
            this.bullets.push(bullet);
        }
        bullet.init(params);

        this.newBullets.push(bullet);

        const bulletDef = GameObjectDefs[params.bulletType] as BulletDef;
        if (bulletDef.addFlare) {
            this.game.planeBarn.addAirdrop(params.pos);
        }

        return bullet;
    }
}

export class Bullet {
    alive = false;
    active = false;

    distanceTraveled!: number;
    sentToClient!: boolean;
    collided!: boolean;
    playerId!: number;
    player?: Player;
    pos!: Vec2;
    endPos!: Vec2;
    clientEndPos!: Vec2;
    dir!: Vec2;
    bulletType!: string;
    layer!: number;
    varianceT!: number;
    distAdjIdx!: number;
    clipDistance!: boolean;
    distance!: number;
    maxDistance!: number;
    shotFx!: boolean;
    shotSourceType!: string;
    mapSourceType!: string;
    shotOffhand!: boolean;
    lastShot!: boolean;
    reflectCount!: number;
    reflectObjId!: number;
    hasSpecialFx!: boolean;
    shotAlt!: boolean;
    splinter!: boolean;
    apRounds!: boolean;
    trailSaturated!: boolean;
    trailSmall!: boolean;
    trailThick!: boolean;
    startPos!: Vec2;
    speed!: number;
    damageSelf!: boolean;
    damage!: number;
    damageMult!: number;
    onHitFx?: string;
    hasOnHitFx!: boolean;
    damageType!: number;
    isShrapnel!: boolean;
    skipCollision!: boolean;
    reflected!: boolean;
    canReflect!: boolean;

    constructor(public bulletManager: BulletBarn) {}

    init(params: BulletParams) {
        this.alive = true;
        this.active = true;
        this.collided = false;
        this.distanceTraveled = 0;
        this.sentToClient = false;
        // this.serialized = false; // TODO: cache bullet serialization?

        const bulletDef = GameObjectDefs[params.bulletType] as BulletDef;

        const variance = 1 + (params.varianceT ?? 1) * bulletDef.variance;

        this.layer = params.layer;
        this.pos = v2.copy(params.pos);
        this.dir = v2.normalize(params.dir);
        this.playerId = params.playerId;
        this.startPos = v2.copy(params.pos);
        this.bulletType = params.bulletType;
        this.reflectCount = params.reflectCount ?? 0;
        this.reflectObjId = params.reflectObjId ?? 0;
        this.reflected = false;
        this.lastShot = params.lastShot ?? false;
        this.speed = bulletDef.speed * variance;
        this.onHitFx = bulletDef.onHit ?? params.onHitFx;
        this.canReflect = this.onHitFx !== "explosion_rounds";

        this.hasOnHitFx = !!this.onHitFx;

        const player = this.bulletManager.game.objectRegister.getById(this.playerId);
        if (player instanceof Player) {
            this.player = player;
        } else {
            this.player = undefined;
        }

        // Add random jitter to the bullet distance. This makes spray patterns
        // for low spread, high rate-of-fire guns like the vector look better.
        //
        // Don't apply the jitter on shotguns as they have inherent jitter
        // due to how the player computes the shot start position.
        const distAdjIdxMax = 16;
        const distAdjIdx = !bulletDef.noDistAdj
            ? util.randomInt(0, distAdjIdxMax)
            : distAdjIdxMax / 2;
        const distAdj = math.remap(distAdjIdx, 0, distAdjIdxMax, -1.0, 1.0);

        let distance =
            bulletDef.distance /
            Math.pow(GameConfig.bullet.reflectDistDecay, this.reflectCount);
        if (params.clipDistance) {
            distance = math.min(bulletDef.distance, params.distance!);
        }

        this.shotSourceType = params.gameSourceType;
        this.mapSourceType = params.mapSourceType ?? "";
        this.damageType = params.damageType;
        this.damageMult = params.damageMult;
        this.shotFx = params.shotFx ?? false;
        this.shotOffhand = params.shotOffhand ?? false;
        this.shotAlt = params.shotAlt ?? false;
        this.splinter = params.splinter ?? false;
        this.apRounds = params.apRounds ?? false;
        this.trailSaturated = params.trailSaturated ?? false;
        this.trailSmall = params.trailSmall ?? false;
        this.trailThick = params.trailThick ?? false;
        this.varianceT = params.varianceT ?? 1;
        this.distAdjIdx = distAdjIdx;
        this.distance = this.maxDistance = math.clamp(
            distance * variance + distAdj,
            0,
            Constants.MaxPosition,
        );
        this.clipDistance = !!params.clipDistance;
        this.endPos = v2.add(params.pos, v2.mul(this.dir, this.distance));
        this.clientEndPos = v2.copy(this.endPos);
        this.damage = bulletDef.damage * this.damageMult;
        this.skipCollision = !!bulletDef.skipCollision;
        this.isShrapnel = bulletDef.shrapnel;

        this.damageSelf = this.reflectCount > 0 || this.isShrapnel;
        this.hasSpecialFx =
            this.shotAlt ||
            this.splinter ||
            this.apRounds ||
            this.trailSaturated ||
            this.trailSmall ||
            this.trailThick;

        const nearbyObjs = this.bulletManager.game.grid.intersectLineSegment(
            this.pos,
            this.endPos,
        );
        const colIds: Array<{
            obj: Obstacle;
            pos: Vec2;
            nrm: Vec2;
            dist: number;
        }> = [];

        for (let i = 0; i < nearbyObjs.length; i++) {
            const obj = nearbyObjs[i] as Obstacle;

            if (
                obj.__type !== ObjectType.Obstacle ||
                obj.dead ||
                obj.height < GameConfig.bullet.height ||
                !util.sameLayer(obj.layer, this.layer) ||
                obj.__id === this.reflectObjId
            ) {
                continue;
            }

            const res = collider.intersectSegment(obj.collider, this.pos, this.endPos);

            if (res) {
                const dist = v2.lengthSqr(v2.sub(res.point, this.pos));
                colIds.push({
                    obj,
                    pos: res.point,
                    nrm: res.normal,
                    dist,
                });
            }
        }

        colIds.sort((a, b) => a.dist - b.dist);

        // Clamp end pos to the map boundaries if the bullet
        // has an onHit effect
        if (this.hasOnHitFx) {
            const res = coldet.intersectSegmentAabb2(
                this.startPos,
                this.endPos,
                this.bulletManager.game.map.bounds.min,
                this.bulletManager.game.map.bounds.max,
            );
            if (res) {
                const dist = v2.length(v2.sub(res.point, this.startPos));
                this.endPos = res.point;
                this.clientEndPos = res.point;
                this.distance = dist;
                this.maxDistance = dist;
                this.clipDistance = true;
            }
        }

        // Store furthest possible travel distance to
        // an indestructible obstacle for the client.
        let maxDistance = this.distance;
        for (let i = 0; i < colIds.length; i++) {
            const col = colIds[i];
            const obj = col.obj;
            if (obj && !obj.destructible) {
                maxDistance = Math.sqrt(col.dist);
                break;
            }
        }
        this.clientEndPos = v2.add(this.startPos, v2.mul(this.dir, maxDistance));
    }

    update(dt: number): void {
        const posOld = v2.copy(this.pos);
        const distLeft = this.distance - v2.length(v2.sub(this.startPos, this.pos));
        const moveDist = math.min(distLeft, dt * this.speed);
        this.distanceTraveled += moveDist;

        v2.set(this.pos, v2.add(this.pos, v2.mul(this.dir, moveDist)));

        const map = this.bulletManager.game.map;
        if (!coldet.testPointAabb(this.pos, map.bounds.min, map.bounds.max)) {
            this.alive = false;
            map.clampToMapBounds(this.pos);
        }

        this.checkForCollisions(posOld);

        // Check if bullet has reached the maximun distance
        if (math.eqAbs(this.distanceTraveled, this.distance, 0.001)) {
            this.alive = false;
            // Explosive rounds peter out
            if (this.onHitFx === "explosion_rounds") {
                this.onHitFx = "";
            }
        }

        if (!this.alive && !this.reflected && this.onHitFx) {
            const def = GameObjectDefs[this.bulletType] as BulletDef;
            // explosion_rounds_sg has lower volume and is used for shotguns
            // since they spawn a bunch of explosions at once
            if (this.onHitFx === "explosion_rounds" && def.useExplosiveRoundsAlt) {
                this.onHitFx = "explosion_rounds_sg";
            }
            this.bulletManager.game.explosionBarn.addExplosion(
                this.onHitFx,
                // spawn the explosion a bit behind the bullet so it won't spawn inside obstacles
                v2.sub(this.pos, v2.mul(this.dir, 0.01)),
                this.layer,
                {
                    source: this.player,
                    gameSourceType: this.shotSourceType,
                    weaponSourceType: this.shotSourceType,
                    mapSourceType: this.mapSourceType,
                    damageType: this.damageType,
                },
            );
        }

        // set active at the end of the update because:
        // new bullets may be created inside this update call from the `reflect` method
        // so if we check for alive instead of active, the new bullet may be the one we are
        // currently updating
        if (!this.alive) {
            this.active = false;
        }
    }

    checkForCollisions(posOld: Vec2): void {
        if (this.skipCollision) return;

        const collisions: BulletCollision[] = [];

        const objects = this.bulletManager.game.grid.intersectLineSegment(
            posOld,
            this.pos,
        );

        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];

            if (obj.__type === ObjectType.Obstacle) {
                if (
                    obj.dead ||
                    !util.sameLayer(obj.layer, this.layer) ||
                    obj.height < GameConfig.bullet.height ||
                    obj.__id === this.reflectObjId
                ) {
                    continue;
                }

                const res = collider.intersectSegment(obj.collider, posOld, this.pos);
                if (res) {
                    collisions.push({
                        type: "obstacle",
                        obj: obj,
                        obstacleType: obj.type,
                        collidable: obj.collidable,
                        point: res.point,
                        normal: res.normal,
                        dist: v2.lengthSqr(v2.sub(res.point, this.startPos)),
                    });
                }
            } else if (obj.__type === ObjectType.Player) {
                if (
                    !(
                        !obj.dead &&
                        (util.sameLayer(obj.layer, this.layer) || 2 & obj.layer) &&
                        (obj.__id !== this.playerId || this.damageSelf) &&
                        obj.__id !== this.reflectObjId
                    )
                ) {
                    continue;
                }

                if (
                    obj.hasPerk("windwalk") &&
                    obj.hasteType != GameConfig.HasteType.Windwalk && // can't stack windwalk
                    v2.distance(this.pos, obj.pos) <= 5 &&
                    this.player?.teamId !== obj.teamId // bullet shooter or its teammates cant give the shooter winwalk
                ) {
                    obj.giveHaste(GameConfig.HasteType.Windwalk, 3);
                }

                let panCollision = null;
                if (obj.hasActivePan()) {
                    const p = obj;
                    const panSeg = p.getPanSegment()!;
                    const oldSegment = math.transformSegment(
                        panSeg.p0,
                        panSeg.p1,
                        p.posOld,
                        p.dirOld,
                    );
                    const newSegment = math.transformSegment(
                        panSeg.p0,
                        panSeg.p1,
                        p.pos,
                        p.dir,
                    );
                    const newIntersection = coldet.intersectSegmentSegment(
                        posOld,
                        this.pos,
                        oldSegment.p0,
                        oldSegment.p1,
                    );
                    const oldIntersection = coldet.intersectSegmentSegment(
                        posOld,
                        this.pos,
                        newSegment.p0,
                        newSegment.p1,
                    );
                    const finalIntersection = oldIntersection || newIntersection;
                    if (finalIntersection) {
                        const segment = newIntersection ? newSegment : oldSegment;
                        const normal = v2.normalize(
                            v2.perp(v2.sub(segment.p1, segment.p0)),
                        );
                        panCollision = {
                            point: v2.add(
                                finalIntersection.point,
                                v2.mul(v2.neg(this.dir), 0.2),
                            ),
                            normal: normal,
                        };
                    }
                }
                const collision = coldet.intersectSegmentCircle(
                    posOld,
                    this.pos,
                    obj.pos,
                    obj.rad,
                );
                if (
                    collision &&
                    (!panCollision ||
                        v2.lengthSqr(v2.sub(collision.point, this.startPos)) <
                            v2.lengthSqr(v2.sub(panCollision.point, this.startPos)))
                ) {
                    collisions.push({
                        type: "player",
                        player: obj,
                        point: collision.point,
                        normal: collision.normal,
                        layer: obj.layer,
                        collidable: true,
                        dist: v2.lengthSqr(v2.sub(collision.point, this.startPos)),
                    });
                    if (obj.hasPerk("steelskin")) {
                        const point = v2.add(
                            collision.point,
                            v2.mul(collision.normal, 0.1),
                        );
                        collisions.push({
                            type: "pan",
                            point,
                            normal: collision.normal,
                            layer: obj.layer,
                            collidable: false,
                            obj: obj,
                            dist: v2.lengthSqr(v2.sub(point, this.startPos)),
                        });
                    }
                } else if (panCollision) {
                    collisions.push({
                        type: "pan",
                        point: panCollision.point,
                        normal: panCollision.normal,
                        layer: obj.layer,
                        collidable: true,
                        dist: v2.lengthSqr(v2.sub(panCollision.point, this.startPos)),
                    });
                }
                if (collision || panCollision) {
                    break;
                }
            }
        }

        if (!collisions.length) return;

        collisions.sort((a, b) => {
            return a.dist - b.dist;
        });

        let shooterDead = false;
        const player = this.player;
        if (player && (player.dead || player.downed)) {
            shooterDead = true;
        }
        let hit = false;

        let finalDamage = this.damage;
        finalDamage *= 1 / (this.reflectCount + 1);

        if (GameConfig.bullet.falloff) {
            const def = BulletDefs[this.bulletType];
            const distT = math.clamp(this.distanceTraveled / this.distance, 0, 1);
            const falloff = math.remap(distT, 0, 1, 1, def.falloff);
            finalDamage *= falloff;
        }

        for (let i = 0; i < collisions.length; i++) {
            const col = collisions[i];

            if (col.type == "obstacle") {
                const mapDef = MapObjectDefs[col.obstacleType!] as ObstacleDef;

                const def = GameObjectDefs[this.bulletType] as BulletDef;
                // AP Obstacle Multiplier Buff
                let obstacleMult = def.obstacleDamage;
                if (this.apRounds) {
                    obstacleMult *= PerkProperties.ap_rounds.obstacleMult;
                }

                this.bulletManager.damages.push({
                    obj: col.obj!,
                    gameSourceType: this.shotSourceType,
                    weaponSourceType: this.shotSourceType,
                    mapSourceType: this.mapSourceType,
                    damageType: this.damageType,
                    source: this.player,
                    amount: finalDamage * obstacleMult,
                    dir: this.dir,
                });

                if (mapDef.reflectBullets) {
                    this.reflect(col.point, col.normal, col.obj!.__id);
                }

                // Continue travelling if non-collidable
                hit = col.collidable;
            } else if (col.type == "player") {
                if (!shooterDead) {
                    const isHighValueTarget =
                        this.player?.hasPerk("targeting") && col.player!.perks.length;

                    let multiplier = 1;
                    if (isHighValueTarget) {
                        multiplier *= 1.25;
                    }

                    this.bulletManager.damages.push({
                        obj: col.player!,
                        gameSourceType: this.shotSourceType,
                        weaponSourceType: this.shotSourceType,
                        mapSourceType: this.mapSourceType,
                        source: this.player,
                        damageType: this.damageType,
                        amount: multiplier * finalDamage,
                        dir: this.dir,
                        isExplosion: this.isShrapnel,
                        armorPenetration: this.apRounds
                            ? PerkProperties.ap_rounds.armorPenetration
                            : undefined,
                    });
                }
                hit = col.collidable;
            } else if (col.type == "pan") {
                hit = col.collidable;
                this.reflect(col.point, col.normal, col.obj?.__id ?? 0);
            }
            if (hit) {
                this.pos = col.point;
                this.alive = false;
                break;
            }
        }
    }

    reflect(pos: Vec2, normal: Vec2, objId: number) {
        if (!this.canReflect) return;
        if (this.reflectCount >= GameConfig.bullet.maxReflect) return;
        if (this.reflected) return;
        this.reflected = true;

        const dot = v2.dot(this.dir, normal);
        const dir = v2.add(v2.mul(normal, dot * -2), this.dir);

        let distance = this.distance;
        if (this.clipDistance) {
            distance =
                math.max(1, this.distance - this.distanceTraveled) /
                Math.pow(GameConfig.bullet.reflectDistDecay, this.reflectCount);
        }

        this.bulletManager.fireBullet({
            bulletType: this.bulletType,
            gameSourceType: this.shotSourceType,
            mapSourceType: this.mapSourceType,
            pos,
            dir,
            layer: this.layer,
            damageMult: this.damageMult,
            shotFx: false,
            reflectCount: this.reflectCount + 1,
            reflectObjId: objId,
            playerId: this.playerId,
            damageType: this.damageType,
            shotAlt: this.shotAlt,
            splinter: this.splinter,
            apRounds: this.apRounds,
            trailSaturated: this.trailSaturated,
            trailSmall: this.trailSmall,
            trailThick: this.trailThick,
            onHitFx: this.onHitFx,
            varianceT: this.varianceT,
            clipDistance: this.clipDistance,
            distance: distance,
        });
    }
}
