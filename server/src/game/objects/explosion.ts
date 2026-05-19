import { GameObjectDefs } from "../../../../shared/defs/gameObjectDefs";
import type { ExplosionDef } from "../../../../shared/defs/gameObjects/explosionsDefs";
import { PerkProperties } from "../../../../shared/defs/gameObjects/perkDefs";
import { ObjectType } from "../../../../shared/net/objectSerializeFns";
import { coldet } from "../../../../shared/utils/coldet";
import { collider } from "../../../../shared/utils/collider";
import { math } from "../../../../shared/utils/math";
import { assert, util } from "../../../../shared/utils/util";
import { type Vec2, v2 } from "../../../../shared/utils/v2";
import type { Game } from "../game";
import type { DamageParams, GameObject } from "./gameObject";
import type { Loot } from "./loot";
import type { Obstacle } from "./obstacle";
import type { Player } from "./player";

interface LineCollision {
    obj: GameObject;
    pos: Vec2;
    distance: number;
    dir: Vec2;
}

export class ExplosionBarn {
    explosions: Explosion[] = [];
    newExplosions: Explosion[] = [];

    constructor(readonly game: Game) {}

    update() {
        for (let i = 0; i < this.explosions.length; i++) {
            this.explode(this.explosions[i]);
        }
        this.explosions.length = 0;
    }

    explode(explosion: Explosion) {
        const def = GameObjectDefs[explosion.type] as ExplosionDef;

        if (def.decalType) {
            this.game.decalBarn.addDecal(
                def.decalType,
                explosion.pos,
                explosion.layer,
                0,
                1,
            );
        }

        if (explosion.type === "explosion_smoke") {
            this.game.smokeBarn.addEmitter(explosion.pos, explosion.layer);
            return;
        }

        const coll = collider.createCircle(explosion.pos, explosion.rad);

        // List of all near objects
        // filter it first, we iterate over that list many many times...
        // so filtering first will mean way less iterations when doing the raycasts
        // specially useful for airstrikes so it doesn't iterate over all the explosion decals
        const objects = this.game.grid.intersectCollider(coll).filter((obj) => {
            if (!util.sameLayer(obj.layer, explosion.layer)) return false;
            if ((obj as { dead?: boolean }).dead) return false;
            if (
                !(
                    obj.__type === ObjectType.Player ||
                    obj.__type === ObjectType.Obstacle ||
                    obj.__type === ObjectType.Loot
                )
            ) {
                return false;
            }

            return true;
        }) as Array<Player | Obstacle | Loot>;

        const damagedObjects = new Map<number, boolean>();

        const centerCircle = collider.createCircle(explosion.pos, 0.01);

        // this make the amount of raycasts increase with the explosion radius
        // the 0.75 is the maximum gap between the raycasts
        const step = math.min(Math.acos(1 - (0.75 / def.rad.max) ** 2 / 2), 0.3);

        for (let angle = -Math.PI; angle < Math.PI; angle += step) {
            // All objects that collided with this line
            const lineCollisions: Array<LineCollision> = [];

            const lineEnd = v2.add(
                explosion.pos,
                v2.rotate(v2.create(explosion.rad, 0), angle),
            );

            for (let i = 0; i < objects.length; i++) {
                const obj = objects[i];
                // if the explosion center is inside the object deal max damage
                if (coldet.test(obj.collider, centerCircle)) {
                    lineCollisions.push({
                        pos: explosion.pos,
                        obj,
                        distance: 0,
                        dir: v2.neg(v2.normalize(v2.sub(explosion.pos, obj.pos))),
                    });
                    continue;
                }
                // check if the object hitbox collides with a line from the explosion center to the explosion max distance
                const intersection = collider.intersectSegment(
                    obj.collider,
                    explosion.pos,
                    lineEnd,
                );
                if (intersection) {
                    lineCollisions.push({
                        pos: intersection.point,
                        obj,
                        distance: v2.distance(explosion.pos, intersection.point),
                        dir: v2.neg(v2.normalize(v2.sub(explosion.pos, obj.pos))),
                    });
                }
            }

            // sort by closest to the explosion center to prevent damaging objects through walls
            lineCollisions.sort((a, b) => a.distance - b.distance);

            for (const collision of lineCollisions) {
                const obj = collision.obj;

                if (!damagedObjects.has(obj.__id)) {
                    damagedObjects.set(obj.__id, true);
                    this.damageObject(explosion, collision);
                }

                if (
                    obj.__type === ObjectType.Obstacle &&
                    obj.collidable &&
                    obj.height > 0.5
                )
                    break;
            }
        }

        const sourcePlayer =
            explosion.damageParams.source &&
            explosion.damageParams.source.__type === ObjectType.Player
                ? explosion.damageParams.source
                : undefined;

        const hasAmped = sourcePlayer?.hasPerk?.("amped_explosives");

        const shrapnelSpeedMult = hasAmped
            ? PerkProperties.amped_explosives.shrapnelSpeedMult
            : 1;
        const shrapnelDamageMult = hasAmped
            ? PerkProperties.amped_explosives.shrapnelDamageMult
            : 1;
        const shrapnelCountMult = hasAmped
            ? PerkProperties.amped_explosives.shrapnelCountMult
            : 1;

        const shrapnelCount = Math.ceil((def.shrapnelCount ?? 0) * shrapnelCountMult);

        const bulletDef = GameObjectDefs[def.shrapnelType];
        if (bulletDef && bulletDef.type === "bullet") {
            for (let i = 0, count = shrapnelCount; i < count; i++) {
                this.game.bulletBarn.fireBullet({
                    bulletType: def.shrapnelType,
                    pos: explosion.pos,
                    layer: explosion.layer,
                    damageType: explosion.damageParams.damageType,
                    playerId: explosion.damageParams.source?.__id ?? 0,
                    shotFx: false,
                    damageMult: shrapnelDamageMult,
                    speedMult: shrapnelSpeedMult,
                    trailSaturated: hasAmped,
                    varianceT: Math.random(),
                    gameSourceType: explosion.damageParams.gameSourceType!,
                    mapSourceType: explosion.damageParams.mapSourceType,
                    dir: v2.randomUnit(),
                });
            }
        }
    }

    damageObject(explosion: Explosion, collision: LineCollision) {
        const dist = collision.distance;
        const obj = collision.obj;
        const def = GameObjectDefs[explosion.type] as ExplosionDef;

        if (
            obj.__type !== ObjectType.Player &&
            obj.__type !== ObjectType.Obstacle &&
            obj.__type !== ObjectType.Loot
        ) {
            return;
        }

        let damage = def.damage;
        const coll = collider.createCircle(explosion.pos, def.rad.min);

        if (dist > def.rad.min && !coldet.test(coll, obj.collider)) {
            damage = math.remap(dist, 0, def.rad.max, damage, 0);
        }

        if (obj.__type === ObjectType.Loot) {
            const pushForce = damage * util.random(0.15, 0.4);

            obj.pushLoot(v2.normalize(v2.sub(obj.pos, explosion.pos)), pushForce);
            return;
        }

        if (obj.__type == ObjectType.Player) {
            const isSourceTeammate =
                explosion.damageParams.source &&
                explosion.damageParams.source.__type == ObjectType.Player &&
                explosion.damageParams.source.teamId == obj.teamId;

            if (def.healTeam && isSourceTeammate) {
                const healAmount = def.healAmount ?? 5; // default to 5 if healValue is not defined
                obj.health += healAmount;
                obj.healEffectTicker = 0.5;
                obj.setDirty();
                return;
            }
            if (!isSourceTeammate) {
                if (def.freezeDuration) {
                    const playerRot = Math.atan2(obj.dir.y, obj.dir.x);
                    const collRot = -Math.atan2(collision.dir.y, collision.dir.x);

                    const ori =
                        (math.radToOri(playerRot) + math.radToOri(collRot) + 2) % 4;

                    obj.freeze(explosion.type, ori, def.freezeDuration);
                }
                if (def.dropRandomLoot) {
                    for (let i = 0; i < def.dropRandomLoot; i++) {
                        obj.dropRandomLoot();
                    }
                }

                if (explosion.type === "explosion_potato_smgshot") {
                    obj.incrementFat();
                }

                if (explosion.type === "explosion_potato_lmgshot") {
                    obj.decrementViewDistance();
                }
            }
        }

        if (obj.__type === ObjectType.Obstacle) {
            damage *= def.obstacleDamage;
        }

        obj.damage({
            ...explosion.damageParams,
            amount: damage,
            dir: collision.dir,
            isExplosion: true,
        });
    }

    flush() {
        this.newExplosions.length = 0;
    }

    addExplosion(
        type: string,
        pos: Vec2,
        layer: number,
        damageParams: Omit<DamageParams, "damage" | "dir">,
    ) {
        const def = GameObjectDefs[type];
        assert(def.type === "explosion", `Invalid explosion with type ${type}`);

        const explosion: Explosion = {
            rad: def.rad.max,
            type,
            pos,
            layer,
            damageParams,
        };
        this.explosions.push(explosion);
        this.newExplosions.push(explosion);
    }
}

interface Explosion {
    rad: number;
    type: string;
    pos: Vec2;
    layer: number;
    damageParams: Omit<DamageParams, "damage" | "dir">;
}
