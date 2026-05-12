import { GameObjectDefs } from "../../../../shared/defs/register.ts";
import { DamageType, GameConfig } from "../../../../shared/gameConfig.ts";
import { ObjectType } from "../../../../shared/net/objectSerializeFns.ts";
import { type AABB, coldet } from "../../../../shared/utils/coldet.ts";
import { collider } from "../../../../shared/utils/collider.ts";
import { math } from "../../../../shared/utils/math.ts";
import { util } from "../../../../shared/utils/util.ts";
import { v2, type Vec2 } from "../../../../shared/utils/v2.ts";
import type { Game } from "../game.ts";
import { BaseGameObject } from "./gameObject.ts";

// 10.5 is based on the distance a potato cannon projectile traveled before hitting the floor
// and exploding, from recorded packets from the original game
const gravity = 10.5;

export class ProjectileBarn {
    projectiles: Projectile[] = [];
    constructor(readonly game: Game) {}

    update(dt: number) {
        for (let i = 0; i < this.projectiles.length; i++) {
            const proj = this.projectiles[i];
            if (proj.destroyed) {
                this.projectiles.splice(i, 1);
                i--;
                continue;
            }
            proj.update(dt);
        }
    }

    addProjectile(
        playerId: number,
        type: string,
        pos: Vec2,
        posZ: number,
        layer: number,
        vel: Vec2,
        fuseTime: number,
        damageType: DamageType,
        throwDir?: Vec2,
        weaponSourceType?: string,
    ): Projectile {
        const proj = new Projectile(
            this.game,
            type,
            pos,
            layer,
            posZ,
            playerId,
            vel,
            fuseTime,
            damageType,
            throwDir,
            weaponSourceType,
        );

        this.projectiles.push(proj);
        this.game.objectRegister.register(proj);
        return proj;
    }

    addSplitProjectiles(
        playerId: number,
        type: string,
        pos: Vec2,
        layer: number,
        initialVel: Vec2,
        count: number,
        maxVel: number,
        weaponSourceType?: string,
    ) {
        for (let i = 0; i < count; i++) {
            const def = GameObjectDefs.typeToDef(type, "throwable");

            const vel = util.randomPointInCircle(maxVel);
            const velocity = v2.add(v2.mul(initialVel, 0.6), vel);

            this.game.projectileBarn.addProjectile(
                playerId,
                type,
                pos,
                1,
                layer,
                velocity,
                def.fuseTime,
                DamageType.Player,
                undefined,
                weaponSourceType,
            );
        }
    }
}

export class Projectile extends BaseGameObject {
    override readonly __type = ObjectType.Projectile;
    bounds: AABB;

    layer: number;

    posZ: number;
    dir: Vec2;
    throwDir: Vec2;

    type: string;
    // used for "heavy" potatos and snowballs
    // so the kill source is still the regular potato
    weaponSourceType: string;

    rad: number;

    playerId: number;
    fuseTime: number;
    damageType: DamageType;

    vel: Vec2;
    velZ: number;
    dead = false;

    obstacleBellowId = 0;
    /**
     * 0 if not on top of an obstacle
     * aka on the ground
     */
    obstacleBellowHeight = 0;

    strobe?: {
        timeToPing: number;
        airstrikesTotal: number;
        airstrikesLeft: number;
        airstrikeTicker: number;
        airstrikeDelay: number;
        airstrikeOffset: number;
        rotAngle: number;
    };

    constructor(
        game: Game,
        type: string,
        pos: Vec2,
        layer: number,
        posZ: number,
        playerId: number,
        vel: Vec2,
        fuseTime: number,
        damageType: DamageType,
        throwDir?: Vec2,
        weaponSourceType?: string,
    ) {
        super(game, pos);
        this.layer = layer;
        this.type = type;
        this.posZ = posZ;
        this.playerId = playerId;
        this.vel = vel;
        this.fuseTime = fuseTime;
        this.damageType = damageType;
        this.dir = v2.normalizeSafe(vel);
        this.throwDir = throwDir ?? v2.copy(this.dir);
        this.weaponSourceType = weaponSourceType || this.type;

        const def = GameObjectDefs.typeToDef(type, "throwable");
        this.velZ = def.throwPhysics.velZ;
        this.rad = def.rad * 0.5;
        this.bounds = collider.createAabbExtents(
            v2.create(0, 0),
            v2.create(this.rad, this.rad),
        );

        if (def.fuseVariance) {
            this.fuseTime += util.random(0, def.fuseVariance);
        }
    }

    updateStrobe(dt: number): void {
        if (!this.strobe) return;

        if (this.strobe.timeToPing > 0) {
            this.strobe.timeToPing -= dt;

            if (this.strobe.timeToPing <= 0) {
                this.game.playerBarn.addMapPing("ping_airstrike", this.pos);
                this.strobe.airstrikeTicker = 1;
            }
        }

        if (this.strobe.airstrikesLeft == 0) return;

        // airstrikes cannot drop until the strobe ticker is finished
        if (this.strobe.timeToPing >= 0) return;

        if (this.strobe.airstrikeTicker > 0) {
            this.strobe.airstrikeTicker -= dt;

            if (this.strobe.airstrikeTicker <= 0) {
                let rotAngle = this.strobe.rotAngle;
                if (this.strobe.airstrikesLeft % 2) {
                    rotAngle *= -1;
                }
                const nextDir = v2.rotate(this.throwDir, rotAngle);
                const newOffset = Math.ceil(
                    (this.strobe.airstrikesTotal - this.strobe.airstrikesLeft) / 2,
                ) * this.strobe.airstrikeOffset;
                const pos = v2.add(this.pos, v2.mul(nextDir, newOffset));
                this.game.planeBarn.addAirStrike(pos, this.throwDir, this.playerId);
                this.strobe.airstrikesLeft--;
                this.strobe.airstrikeTicker = this.strobe.airstrikeDelay;
            }
        }
    }

    update(dt: number) {
        if (this.strobe) {
            this.updateStrobe(dt);
        }

        const def = GameObjectDefs.typeToDef(this.type, "throwable");
        //
        // Velocity
        //

        if (this.posZ <= this.obstacleBellowHeight) {
            const isOnWater = this.game.map.isOnWater(this.pos, this.layer);
            // drag values based on plotted data from surviv
            const drag = isOnWater ? 5 : 2.3;
            this.vel = v2.mul(this.vel, 1 / (1 + dt * drag));
        }

        const posOld = v2.copy(this.pos);
        this.pos = v2.add(this.pos, v2.mul(this.vel, dt));

        //
        // Height / posZ
        //
        this.velZ -= gravity * dt;
        this.posZ += this.velZ * dt;
        this.posZ = math.clamp(
            this.posZ,
            this.obstacleBellowHeight,
            GameConfig.projectile.maxHeight,
        );
        let height = this.posZ;
        if (def.throwPhysics.fixedCollisionHeight) {
            height = def.throwPhysics.fixedCollisionHeight;
        }

        //
        // Collision and changing layers on stair
        //
        const objs = this.game.grid.intersectGameObject(this);

        const rad = this.rad / 2;

        let insideObstacle = false;

        for (const obj of objs) {
            if (
                obj.__type === ObjectType.Obstacle
                && util.sameLayer(this.layer, obj.layer)
                && !obj.dead
            ) {
                const intersection = collider.intersectCircle(
                    obj.collider,
                    this.pos,
                    rad,
                );
                const lineIntersection = collider.intersectSegment(
                    obj.collider,
                    posOld,
                    this.pos,
                );

                if (intersection || lineIntersection) {
                    if (obj.height > height) {
                        let damage = 1;
                        if (def.destroyNonCollidables && !obj.collidable) {
                            damage = 999;
                        }

                        obj.damage({
                            amount: damage,
                            damageType: this.damageType,
                            gameSourceType: this.type,
                            weaponSourceType: this.weaponSourceType,
                            source: this.game.objectRegister.getById(this.playerId),
                            mapSourceType: "",
                            dir: this.dir,
                        });

                        if (obj.dead || !obj.collidable) continue;

                        if (lineIntersection) {
                            this.pos = v2.add(
                                lineIntersection.point,
                                v2.mul(lineIntersection.normal, rad + 0.1),
                            );
                        } else if (intersection) {
                            this.pos = v2.add(
                                this.pos,
                                v2.mul(intersection.dir, intersection.pen + 0.1),
                            );
                        }

                        if (def.explodeOnImpact) {
                            this.explode();
                        } else {
                            const len = math.max(v2.length(this.vel), 0.000001);
                            const dir = v2.div(this.vel, len);
                            const normal = intersection
                                ? intersection.dir
                                : lineIntersection!.normal;
                            const dot = v2.dot(dir, normal);
                            const newDir = v2.add(v2.mul(normal, dot * -2), dir);

                            const velocityScale = math.max(1 + dot, 0.15);

                            this.vel = v2.mul(newDir, len * velocityScale);
                            this.dir = v2.normalizeSafe(this.vel);
                        }
                    } else if (obj.collidable) {
                        this.obstacleBellowId = obj.__id;
                        this.obstacleBellowHeight = math.max(
                            this.obstacleBellowHeight,
                            obj.height,
                        );
                        insideObstacle = true;
                    }
                }
            } else if (
                obj.__type === ObjectType.Player
                && def.playerCollision
                && !obj.dead
                && util.sameLayer(this.layer, obj.layer)
                && obj.__id !== this.playerId
            ) {
                if (coldet.testCircleCircle(this.pos, rad, obj.pos, obj.rad)) {
                    this.explode();
                }
            }
        }

        if (!insideObstacle) {
            this.obstacleBellowId = 0;
            this.obstacleBellowHeight = 0;
        }

        this.game.map.clampToMapBounds(this.pos, this.rad);

        if (this.destroyed) return;

        const originalLayer = this.layer;
        this.checkStairs(objs, 0.01);

        if (!this.dead) {
            if (this.layer !== originalLayer) {
                this.setDirty();
            } else {
                this.setPartDirty();
            }

            this.game.grid.updateObject(this);

            if (this.posZ === this.obstacleBellowHeight && def.explodeOnImpact) {
                this.explode();
            }

            //
            // Fuse time
            //

            this.fuseTime -= dt;
            if (this.fuseTime <= 0) {
                this.explode();
            }
        }
    }

    /**
     * only used for bomb_iron projectiles, they CANNOT explode inside indestructable buildings
     */
    canBombIronExplode(): boolean {
        const objs = this.game.grid.intersectGameObject(this);

        for (const obj of objs) {
            if (obj.__type != ObjectType.Building) continue;
            if (!util.sameLayer(obj.layer, this.layer)) continue;
            if (obj.wallsToDestroy < Infinity) continue; // building is destructable and bomb irons can explode on it
            for (let i = 0; i < obj.zoomRegions.length; i++) {
                const zoomRegion = obj.zoomRegions[i];

                if (
                    zoomRegion.zoomIn
                    && coldet.testCircleAabb(
                        this.pos,
                        this.rad,
                        zoomRegion.zoomIn.min,
                        zoomRegion.zoomIn.max,
                    )
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    explode() {
        if (this.dead) return;
        this.dead = true;
        const def = GameObjectDefs.typeToDef(this.type, "throwable");

        if (def.splitType && def.numSplit) {
            this.game.projectileBarn.addSplitProjectiles(
                this.playerId,
                def.splitType,
                this.pos,
                this.layer,
                this.vel,
                def.numSplit,
                4,
                this.weaponSourceType,
            );
        }

        if (this.type == "bomb_iron" && !this.canBombIronExplode()) {
            this.destroy();
            return;
        }

        const explosionType = def.explosionType;
        if (explosionType) {
            const source = this.game.objectRegister.getById(this.playerId);
            this.game.explosionBarn.addExplosion(explosionType, this.pos, this.layer, {
                gameSourceType: this.type,
                weaponSourceType: this.weaponSourceType,
                damageType: this.damageType,
                source,
            });
        }
        this.destroy();
    }
}
