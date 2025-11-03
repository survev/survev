import * as PIXI from "pixi.js-legacy";
import { GameObjectDefs } from "../../../shared/defs/gameObjectDefs";
import { BulletDefs } from "../../../shared/defs/gameObjects/bulletDefs";
import type { MeleeDef } from "../../../shared/defs/gameObjects/meleeDefs";
import { MapObjectDefs } from "../../../shared/defs/mapObjectDefs";
import type { ObstacleDef } from "../../../shared/defs/mapObjectsTyping";
import { GameConfig } from "../../../shared/gameConfig";
import type { Bullet } from "../../../shared/net/updateMsg";
import { coldet } from "../../../shared/utils/coldet";
import { collider } from "../../../shared/utils/collider";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { AudioManager } from "../audioManager";
import type { Camera } from "../camera";
import type { Map } from "../map";
import type { Renderer } from "../renderer";
import type { FlareBarn } from "./flare";
import type { ParticleBarn } from "./particles";
import type { Player, PlayerBarn } from "./player";

export function createBullet(
    bullet: Bullet,
    bulletBarn: BulletBarn,
    flareBarn: FlareBarn,
    playerBarn: PlayerBarn,
    renderer: Renderer,
) {
    if (BulletDefs[bullet.bulletType].addFlare) {
        flareBarn.addFlare(bullet, playerBarn);
    } else {
        bulletBarn.addBullet(bullet, playerBarn, renderer);
    }
}

export function playHitFx(
    particleName: string,
    soundName: string,
    pos: Vec2,
    dir: Vec2,
    layer: number,
    particleBarn: ParticleBarn,
    audioManager: AudioManager,
) {
    const numParticles = Math.floor(util.random(1, 2));
    let vel = v2.mul(dir, 9.5);
    for (let i = 0; i < numParticles; i++) {
        vel = v2.rotate(vel, ((Math.random() - 0.5) * Math.PI) / 3);
        particleBarn.addParticle(particleName, layer, pos, vel);
    }
    audioManager.playGroup(soundName, {
        channel: "hits",
        soundPos: pos,
        layer,
        filter: "muffled",
    });
}
export class BulletBarn {
    bullets: Array<{
        alive: boolean;
        container: PIXI.Container;
        bulletTrail: PIXI.Sprite;
        isNew: boolean;
        collided: boolean;
        scale: number;
        playerId: number;
        pos: Vec2;
        dir: Vec2;
        layer: number;
        speed: number;
        distance: number;
        damageSelf: boolean;
        reflectCount: number;
        reflectObjId: number;
        whizHeard: boolean;
        startPos: Vec2;
        tracerLength: number;
        suppressed: boolean;
        tracerAlphaRate: number;
        tracerAlphaMin: number;
    }> = [];

    tracerColors: Record<
        string,
        {
            regular: number;
            saturated: number;
            chambered: number;
            apSaturated: number;
            alphaRate: number;
            alphaMin: number;
        }
    > = {};

    onMapLoad(map: Map) {
        this.tracerColors = util.mergeDeep(
            GameConfig.tracerColors,
            map.getMapDef().biome.tracerColors,
        );
    }

    addBullet(bullet: Bullet, playerBarn: PlayerBarn, renderer: Renderer) {
        let b: (typeof this.bullets)[number] | null = null;

        for (let i = 0; i < this.bullets.length; i++) {
            if (!this.bullets[i].alive && !this.bullets[i].collided) {
                b = this.bullets[i];
                break;
            }
        }

        if (!b) {
            b = {} as (typeof this.bullets)[number];
            b.alive = false;
            b.container = new PIXI.Container();
            b.container.pivot.set(14.5, 0);
            b.container.visible = false;
            b.bulletTrail = PIXI.Sprite.from("player-bullet-trail-02.img");
            b.bulletTrail.anchor.set(0.5, 0.5);
            b.container.addChild(b.bulletTrail);
            this.bullets.push(b);
        }

        const bulletDef = BulletDefs[bullet.bulletType];

        const variance = 1 + bullet.varianceT * bulletDef.variance;
        const distAdj = math.remap(bullet.distAdjIdx, 0, 16, -1, 1);
        let distance =
            bulletDef.distance /
            Math.pow(GameConfig.bullet.reflectDistDecay, bullet.reflectCount);
        if (bullet.clipDistance) {
            distance = bullet.distance;
        }
        b.alive = true;
        b.isNew = true;
        b.collided = false;
        b.scale = 1;
        b.playerId = bullet.playerId;
        b.startPos = v2.copy(bullet.pos);
        b.pos = v2.copy(bullet.pos);
        b.dir = v2.copy(bullet.dir);
        b.layer = bullet.layer;
        b.speed = bulletDef.speed * variance;
        b.distance = distance * variance + distAdj;
        b.damageSelf = bulletDef.shrapnel || bullet.reflectCount > 0;
        b.reflectCount = bullet.reflectCount;
        b.reflectObjId = bullet.reflectObjId;
        b.whizHeard = false;

        const angleRadians = Math.atan2(b.dir.x, b.dir.y);
        b.container.rotation = angleRadians - Math.PI / 2;

        b.layer = bullet.layer;
        const player = playerBarn.getPlayerById(b.playerId);
        if (player && player.layer & 2) {
            b.layer |= 2;
        }

        // Set default scale.x to standard working length of 0.8
        let tracerWidth = bulletDef.tracerWidth;
        if (bullet.trailSmall) {
            tracerWidth *= 0.5;
        }
        if (bullet.trailThick) {
            tracerWidth *= 2;
        }
        b.bulletTrail.scale.set(0.8, tracerWidth);
        b.tracerLength = bulletDef.tracerLength;
        b.suppressed = !!bulletDef.suppressed;

        // Use saturated color if the player is on a bright surface
        const tracerColors = this.tracerColors[bulletDef.tracerColor];
        let tracerTint = tracerColors.regular;
        if (bullet.apRounds) {
            tracerTint = tracerColors.apSaturated;
        } else if (bullet.trailSaturated) {
            tracerTint = tracerColors.chambered || tracerColors.saturated;
        } else if (player?.surface?.data.isBright) {
            tracerTint = tracerColors.saturated;
        }
        b.bulletTrail.tint = tracerTint;
        b.tracerAlphaRate = tracerColors.alphaRate;
        b.tracerAlphaMin = tracerColors.alphaMin;
        b.bulletTrail.alpha = 1;
        if (b.reflectCount > 0) {
            b.bulletTrail.alpha *= 0.5;
        }
        b.container.visible = true;
        renderer.addPIXIObj(b.container, b.layer, 20);
    }

    m_update(
        dt: number,
        playerBarn: PlayerBarn,
        map: Map,
        camera: Camera,
        activePlayer: Player,
        renderer: Renderer,
        particleBarn: ParticleBarn,
        audioManager: AudioManager,
    ) {
        const players = playerBarn.playerPool.m_getPool();
        for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            if (b.collided) {
                b.scale = math.max(b.scale - dt * 6, 0);
                if (b.scale <= 0) {
                    b.collided = false;
                    b.container.visible = false;
                }
            }
            if (b.alive) {
                const distLeft = b.distance - v2.length(v2.sub(b.startPos, b.pos));
                const distTravel = math.min(distLeft, dt * b.speed);
                const posOld = v2.copy(b.pos);
                b.pos = v2.add(b.pos, v2.mul(b.dir, distTravel));

                if (
                    !activePlayer.m_netData.m_dead &&
                    util.sameAudioLayer(activePlayer.layer, b.layer) &&
                    v2.length(v2.sub(camera.m_pos, b.pos)) < 7.5 &&
                    !b.whizHeard &&
                    b.playerId != activePlayer.__id
                ) {
                    audioManager.playGroup("bullet_whiz", {
                        soundPos: b.pos,
                        fallOff: 4,
                    });
                    b.whizHeard = true;
                }

                // Trail alpha
                if (b.tracerAlphaRate && b.suppressed) {
                    const rate = b.tracerAlphaRate;
                    b.bulletTrail.alpha = math.max(
                        b.tracerAlphaMin,
                        b.bulletTrail.alpha * rate,
                    );
                }

                // Gather colliding obstacles and players
                const colObjs: Array<{
                    type: string;
                    obstacleType?: string;
                    collidable: boolean;
                    point: Vec2;
                    normal: Vec2;
                    dist?: number;
                    player?: Player;
                    layer?: number;
                }> = [];

                // Obstacles
                const obstacles = map.m_obstaclePool.m_getPool();
                for (let i = 0; i < obstacles.length; i++) {
                    const obstacle = obstacles[i];
                    if (
                        !!obstacle.active &&
                        !obstacle.dead &&
                        !!util.sameLayer(obstacle.layer, b.layer) &&
                        obstacle.height >= GameConfig.bullet.height &&
                        (b.reflectCount <= 0 || obstacle.__id != b.reflectObjId)
                    ) {
                        const res = collider.intersectSegment(
                            obstacle.collider,
                            posOld,
                            b.pos,
                        );
                        if (res) {
                            colObjs.push({
                                type: "obstacle",
                                obstacleType: obstacle.type,
                                collidable: obstacle.collidable,
                                point: res.point,
                                normal: res.normal,
                            });
                        }
                    }
                }
                for (let C = 0; C < players.length; C++) {
                    const player = players[C];
                    if (
                        player.active &&
                        !player.m_netData.m_dead &&
                        (util.sameLayer(player.m_netData.m_layer, b.layer) ||
                            player.m_netData.m_layer & 2) &&
                        (player.__id != b.playerId || b.damageSelf)
                    ) {
                        let panCollision = null;
                        if (player.m_hasActivePan()) {
                            const p = player;
                            const panSeg = p.m_getPanSegment()!;
                            const oldSegment = math.transformSegment(
                                panSeg.p0,
                                panSeg.p1,
                                p.m_posOld,
                                p.m_dirOld,
                            );
                            const newSegment = math.transformSegment(
                                panSeg.p0,
                                panSeg.p1,
                                p.m_pos,
                                p.m_dir,
                            );
                            const newIntersection = coldet.intersectSegmentSegment(
                                posOld,
                                b.pos,
                                oldSegment.p0,
                                oldSegment.p1,
                            );
                            const oldIntersection = coldet.intersectSegmentSegment(
                                posOld,
                                b.pos,
                                newSegment.p0,
                                newSegment.p1,
                            );
                            const finalIntersection = oldIntersection || newIntersection;
                            if (finalIntersection) {
                                const normal = v2.normalize(
                                    v2.perp(v2.sub(newSegment.p1, newSegment.p0)),
                                );
                                panCollision = {
                                    point: finalIntersection.point,
                                    normal: normal,
                                };
                            }
                        }
                        const collision = coldet.intersectSegmentCircle(
                            posOld,
                            b.pos,
                            player.m_pos,
                            player.m_rad,
                        );
                        if (
                            collision &&
                            (!panCollision ||
                                v2.length(v2.sub(collision.point, b.startPos)) <
                                    v2.length(v2.sub(panCollision.point, b.startPos)))
                        ) {
                            colObjs.push({
                                type: "player",
                                player,
                                point: collision.point,
                                normal: collision.normal,
                                layer: player.layer,
                                collidable: true,
                            });
                            if (player.m_hasPerk("steelskin")) {
                                colObjs.push({
                                    type: "pan",
                                    point: v2.add(
                                        collision.point,
                                        v2.mul(collision.normal, 0.1),
                                    ),
                                    normal: collision.normal,
                                    layer: player.layer,
                                    collidable: false,
                                });
                            }
                        } else if (panCollision) {
                            colObjs.push({
                                type: "pan",
                                point: panCollision.point,
                                normal: panCollision.normal,
                                layer: player.layer,
                                collidable: true,
                            });
                        }
                        if (collision || panCollision) {
                            break;
                        }
                    }
                }

                for (let i = 0; i < colObjs.length; i++) {
                    const col = colObjs[i];
                    col.dist = v2.length(v2.sub(col.point, posOld));
                }

                colObjs.sort((a, b) => {
                    return a.dist! - b.dist!;
                });

                let shooterDead = false;
                const W = playerBarn.getPlayerById(b.playerId);
                if (W && (W.m_netData.m_dead || W.m_netData.m_downed)) {
                    shooterDead = true;
                }
                let hit = false;
                for (let i = 0; i < colObjs.length; i++) {
                    const col = colObjs[i];
                    if (col.type == "obstacle") {
                        const mapDef = MapObjectDefs[col?.obstacleType!] as ObstacleDef;
                        playHitFx(
                            mapDef.hitParticle,
                            mapDef.sound.bullet!,
                            col.point,
                            col.normal,
                            b.layer,
                            particleBarn,
                            audioManager,
                        );

                        // Continue travelling if non-collidable
                        hit = col.collidable;
                    } else if (col.type == "player") {
                        // Don't create a hit particle if the shooting
                        // player is dead; this helps avoid confusion around
                        // bullets being inactivated when a player dies.
                        if (!shooterDead) {
                            const Y = col.player!;
                            if (map.turkeyMode && W?.m_hasPerk("turkey_shoot")) {
                                const J = v2.mul(v2.randomUnit(), util.random(3, 6));
                                particleBarn.addParticle(
                                    "turkeyFeathersHit",
                                    Y.layer,
                                    Y.m_pos,
                                    J,
                                );
                            }
                            const Q = v2.sub(col.point, Y?.m_pos);
                            Q.y *= -1;
                            particleBarn.addParticle(
                                "bloodSplat",
                                Y.layer,
                                v2.mul(Q, camera.m_ppu),
                                v2.create(0, 0),
                                1,
                                1,
                                Y.container,
                            );
                            audioManager.playGroup("player_bullet_hit", {
                                soundPos: Y.m_pos,
                                fallOff: 1,
                                layer: Y.layer,
                                filter: "muffled",
                            });
                        }
                        hit = col.collidable;
                    } else if (col.type == "pan") {
                        playHitFx(
                            "barrelChip",
                            (GameObjectDefs.pan as MeleeDef).sound.bullet!,
                            col.point,
                            col.normal,
                            col.layer!,
                            particleBarn,
                            audioManager,
                        );
                        hit = col.collidable;
                    }
                    if (hit) {
                        b.pos = col.point;
                        break;
                    }
                }
                if (!(b.layer & 2)) {
                    const $ = map.m_structurePool.m_getPool();
                    let ee = b.layer;
                    for (let te = 0; te < $.length; te++) {
                        const re = $[te];
                        if (re.active) {
                            let ae = false;
                            let ie = false;
                            for (let oe = 0; oe < re.stairs.length; oe++) {
                                const se = re.stairs[oe];
                                if (
                                    !se?.lootOnly &&
                                    collider.intersectSegment(
                                        se?.collision!,
                                        b.pos,
                                        posOld,
                                    )
                                ) {
                                    ae = true;
                                    break;
                                }
                            }
                            for (let ne = 0; ne < re.mask.length; ne++) {
                                if (
                                    collider.intersectSegment(re.mask[ne], b.pos, posOld)
                                ) {
                                    ie = true;
                                    break;
                                }
                            }
                            if (ae && !ie) {
                                ee |= 2;
                            }
                        }
                    }
                    if (ee != b.layer) {
                        b.layer = ee;
                        renderer.addPIXIObj(b.container, b.layer, 20);
                    }
                }
                if (hit || math.eqAbs(distLeft, distTravel)) {
                    b.collided = true;
                    b.alive = false;
                }
                b.isNew = false;
            }
        }
    }

    createBulletHit(
        playerBarn: PlayerBarn,
        targetId: number,
        audioManager: AudioManager,
    ) {
        const player = playerBarn.getPlayerById(targetId);
        if (player) {
            audioManager.playGroup("player_bullet_hit", {
                soundPos: player.m_pos,
                fallOff: 1,
                layer: player.layer,
                filter: "muffled",
            });
        }
    }

    m_render(camera: Camera) {
        for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            if (b.alive || b.collided) {
                const dist = v2.length(v2.sub(b.pos, b.startPos));
                const screenPos = camera.m_pointToScreen(b.pos);
                b.container.position.set(screenPos.x, screenPos.y);
                const screenScale = camera.m_pixels(1);
                const trailLength = math.min(b.tracerLength * 15, dist / 2);
                b.container.scale.set(screenScale * trailLength * b.scale, screenScale);
            }
        }
    }
}
