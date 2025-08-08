import { GameObjectDefs } from "../../../../shared/defs/gameObjectDefs";
import type { ThrowableDef } from "../../../../shared/defs/gameObjects/throwableDefs";
import { DamageType, GameConfig } from "../../../../shared/gameConfig";
import { ObjectType } from "../../../../shared/net/objectSerializeFns";
import { type AABB, coldet } from "../../../../shared/utils/coldet";
import { collider } from "../../../../shared/utils/collider";
import { math } from "../../../../shared/utils/math";
import { util } from "../../../../shared/utils/util";
import { type Vec2, v2 } from "../../../../shared/utils/v2";
import type { Game } from "../game";
import { BaseGameObject } from "./gameObject";

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
        damageType: number,
        throwDir?: Vec2,
        gameSourceType?: string,
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
            gameSourceType,
        );

        this.projectiles.push(proj);
        this.game.objectRegister.register(proj);
        return proj;
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
    gameSourceType: string;

    rad: number;

    playerId: number;
    fuseTime: number;
    damageType: DamageType;

    vel: Vec2;
    velZ: number;
    dead = false;

    obstacleBellowId = 0;

    strobe?: {
        strobeTicker: number;
        airstrikesLeft: number;
        airstrikeTicker: number;
        airstrikeDelay: number;
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
        gameSourceType?: string,
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
        this.gameSourceType = gameSourceType || this.type;

        const def = GameObjectDefs[type] as ThrowableDef;
        this.velZ = def.throwPhysics.velZ;
        this.rad = def.rad * 0.5;
        this.bounds = collider.createAabbExtents(
            v2.create(0, 0),
            v2.create(this.rad, this.rad),
        );
    }

    updateStrobe(dt: number): void {
        if (!this.strobe) return;

        if (this.strobe.strobeTicker > 0) {
            this.strobe.strobeTicker -= dt;

            if (this.strobe.strobeTicker <= 0) {
                this.game.playerBarn.addMapPing("ping_airstrike", this.pos);
                this.strobe.airstrikeTicker = 1;
            }
        }

        if (this.strobe.airstrikesLeft == 0) return;

        // airstrikes cannot drop until the strobe ticker is finished
        if (this.strobe.strobeTicker >= 0) return;

        if (this.strobe.airstrikeTicker > 0) {
            this.strobe.airstrikeTicker -= dt;

            if (this.strobe.airstrikeTicker <= 0) {
                // the position can only be "past" the strobe
                // meaning that the random direction can be a MAX of 90 degrees offset from the regular direction so it doesnt go backwards
                const randomDir = v2.rotate(
                    this.throwDir,
                    util.random(-Math.PI / 2, Math.PI / 2),
                );
                const pos = v2.add(this.pos, v2.mul(randomDir, 7));
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

        const def = GameObjectDefs[this.type] as ThrowableDef;
        //
        // Velocity
        //
        if (!def.forceMaxThrowDistance) {
            // velocity needs to stay constant to reach max throw dist
            this.vel = v2.mul(this.vel, 1 / (1 + dt * (this.posZ != 0 ? 1.2 : 2)));
        }
        const posOld = v2.copy(this.pos);
        this.pos = v2.add(this.pos, v2.mul(this.vel, dt));

        //
        // Height / posZ
        //
        this.velZ -= gravity * dt;
        this.posZ += this.velZ * dt;
        this.posZ = math.clamp(this.posZ, 0, GameConfig.projectile.maxHeight);
        let height = this.posZ;
        if (def.throwPhysics.fixedCollisionHeight) {
            height = def.throwPhysics.fixedCollisionHeight;
        }

        //
        // Collision and changing layers on stair
        //
        const objs = this.game.grid.intersectGameObject(this);

        for (const obj of objs) {
            if (
                obj.__type === ObjectType.Obstacle &&
                util.sameLayer(this.layer, obj.layer) &&
                !obj.dead
            ) {
                const intersection = collider.intersectCircle(
                    obj.collider,
                    this.pos,
                    this.rad,
                );
                const lineIntersection = collider.intersectSegment(
                    obj.collider,
                    posOld,
                    this.pos,
                );

                if (intersection || lineIntersection) {
                    if (obj.height >= height && obj.__id !== this.obstacleBellowId) {
                        let damage = 1;
                        if (def.destroyNonCollidables && !obj.collidable) {
                            damage = 999;
                        }

                        obj.damage({
                            amount: damage,
                            damageType: this.damageType,
                            gameSourceType: this.gameSourceType,
                            source: this.game.objectRegister.getById(this.playerId),
                            mapSourceType: "",
                            dir: this.vel,
                        });

                        if (obj.dead || !obj.collidable) continue;

                        if (lineIntersection) {
                            this.pos = v2.add(
                                lineIntersection.point,
                                v2.mul(lineIntersection.normal, this.rad + 0.1),
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
                            const len = v2.length(this.vel);
                            const dir = v2.div(this.vel, len);
                            const normal = intersection
                                ? intersection.dir
                                : lineIntersection!.normal;
                            const dot = v2.dot(dir, normal);
                            const newDir = v2.add(v2.mul(normal, dot * -2), dir);
                            this.vel = v2.mul(newDir, len * 0.3);
                            this.dir = v2.normalizeSafe(this.vel);
                        }
                    } else if (obj.collidable) {
                        this.obstacleBellowId = obj.__id;
                    }
                }
            } else if (
                obj.__type === ObjectType.Player &&
                def.playerCollision &&
                !obj.dead &&
                obj.__id !== this.playerId
            ) {
                if (coldet.testCircleCircle(this.pos, this.rad, obj.pos, obj.rad)) {
                    this.explode();
                }
            }
        }

        this.game.map.clampToMapBounds(this.pos, this.rad);

        if (this.destroyed) return;

        const originalLayer = this.layer;
        this.checkStairs(objs, this.rad);

        if (!this.dead) {
            if (this.layer !== originalLayer) {
                this.setDirty();
            } else {
                this.setPartDirty();
            }

            this.game.grid.updateObject(this);

            if (this.posZ === 0 && def.explodeOnImpact) {
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
                    zoomRegion.zoomIn &&
                    coldet.testCircleAabb(
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
        const def = GameObjectDefs[this.type] as ThrowableDef;

        // courtesy of kaklik
        if (def.splitType && def.numSplit) {
            for (let i = 0; i < def.numSplit; i++) {
                const splitDef = GameObjectDefs[def.splitType] as ThrowableDef;
                const velocity = v2.add(this.vel, v2.mul(v2.randomUnit(), 5));
                this.game.projectileBarn.addProjectile(
                    this.playerId,
                    def.splitType,
                    this.pos,
                    1,
                    this.layer,
                    velocity,
                    splitDef.fuseTime,
                    DamageType.Player,
                    undefined,
                    this.gameSourceType,
                );
            }
        }

        if (this.type == "bomb_iron" && !this.canBombIronExplode()) {
            this.destroy();
            return;
        }

        const explosionType = def.explosionType;
        if (explosionType) {
            const source = this.game.objectRegister.getById(this.playerId);
            this.game.explosionBarn.addExplosion(
                explosionType,
                this.pos,
                this.layer,
                {
                    gameSourceType: this.gameSourceType,
                    damageType: this.damageType,
                    source,
                },
                this.obstacleBellowId,
            );
        }
        this.destroy();
    }
}
