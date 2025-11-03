import * as PIXI from "pixi.js-legacy";
import { type BulletDef, BulletDefs } from "../../../shared/defs/gameObjects/bulletDefs";
import { GameConfig } from "../../../shared/gameConfig";
import type { Bullet } from "../../../shared/net/updateMsg";
import { collider } from "../../../shared/utils/collider";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { Camera } from "../camera";
import type { Map } from "../map";
import type { Renderer } from "../renderer";
import type { Player, PlayerBarn } from "./player";

interface FlareBullet extends BulletDef {
    flareContainer: PIXI.Container;
    flare: PIXI.Sprite;
    trailContainer: PIXI.Container;
    bulletTrail: PIXI.Sprite;
    alive: boolean;
    isNew: boolean;
    collided: boolean;
    flareScale: number;
    trailScale: number;
    timeAlive: number;
    maxTimeAlive: number;
    startPos: Vec2;
    pos: Vec2;
    dir: Vec2;
    layer: number;
    speed: number;
    tracerAlphaRate: number;
    tracerAlphaMin: number;
    smokeThrottle: number;
    playerId?: number;
}

export class FlareBarn {
    bullets: FlareBullet[] = [];

    addFlare(bullet: Bullet, playerBarn: PlayerBarn) {
        let b: FlareBullet | null = null;
        for (let i = 0; i < this.bullets.length; i++) {
            if (!this.bullets[i].alive && !this.bullets[i].collided) {
                b = this.bullets[i];
                break;
            }
        }
        if (!b) {
            b = {} as FlareBullet;
            b.alive = false;
            b.flareContainer = new PIXI.Container();
            b.flareContainer.visible = false;
            b.flare = PIXI.Sprite.from("part-flare-01.img");
            b.flare.anchor.set(0.5, 0.5);
            b.flareContainer.addChild(b.flare);
            b.trailContainer = new PIXI.Container();
            b.trailContainer.visible = false;
            b.trailContainer.pivot.set(14.5, 0);
            b.bulletTrail = PIXI.Sprite.from("player-bullet-trail-02.img");
            b.bulletTrail.anchor.set(0.5, 0.5);
            b.trailContainer.addChild(b.bulletTrail);
            this.bullets.push(b);
        }
        const bulletDef = BulletDefs[bullet.bulletType];
        const variance = 1 + bullet.varianceT * bulletDef.variance;
        const distAdj = math.remap(bullet.distAdjIdx, 0, 32, -1, 1);
        const distance =
            bulletDef.distance /
            Math.pow(GameConfig.bullet.reflectDistDecay, bullet.reflectCount);
        b.alive = true;
        b.isNew = true;
        b.collided = false;
        b.flareScale = 0.01;
        b.trailScale = 1;
        b.timeAlive = 0;
        b.maxTimeAlive = 2.5;
        b.startPos = v2.copy(bullet.pos);
        b.pos = v2.copy(bullet.pos);
        b.dir = v2.copy(bullet.dir);
        b.layer = bullet.layer;
        b.speed = bulletDef.speed * variance;
        b.distance = distance * variance + distAdj;

        const angleRadians = Math.atan2(b.dir.x, b.dir.y);
        b.flareContainer.rotation = angleRadians - Math.PI / 2;
        b.trailContainer.rotation = angleRadians - Math.PI / 2;
        b.layer = bullet.layer;

        const player = playerBarn.getPlayerById(b.playerId!);
        if (player && player.layer & 2) {
            b.layer |= 2;
        }
        // ~~ readonly L
        const tracerColorDefs = GameConfig.tracerColors[
            bulletDef.tracerColor as keyof typeof GameConfig.tracerColors
        ] as Record<string, number>;
        let tracerColor = tracerColorDefs.regular;
        // @ts-expect-error isOnBrightSurface has no reference elsewhere
        if (player?.isOnBrightSurface) {
            tracerColor = tracerColorDefs.saturated;
        }
        b.bulletTrail.scale.set(0.8, bulletDef.tracerWidth);
        b.tracerLength = bulletDef.tracerLength;
        b.bulletTrail.tint = tracerColor;
        b.tracerAlphaRate = tracerColorDefs.alphaRate;
        b.tracerAlphaMin = tracerColorDefs.alphaMin;
        b.bulletTrail.alpha = 1;
        b.flare.scale.set(1, 1);
        b.flare.tint = bulletDef.flareColor!;
        b.flare.alpha = 0.8;
        b.maxFlareScale = bulletDef.maxFlareScale;
        b.smokeThrottle = 0;
        b.flareContainer.visible = true;
        b.trailContainer.visible = true;
    }

    m_update(dt: number, map: Map, activePlayer: Player, renderer: Renderer) {
        for (let h = 0; h < this.bullets.length; h++) {
            const d = this.bullets[h];
            if (d.collided) {
                d.flareScale = math.max(d.flareScale - dt * 0.5, 0);
                d.flare.alpha = math.max(d.flare.alpha - dt, 0);
                d.trailScale = math.max(d.trailScale - dt * 6, 0);
                d.bulletTrail.alpha = math.max(d.bulletTrail.alpha - dt, 0);
                d.pos = v2.add(d.pos, v2.mul(d.dir, dt * d.speed));
                if (d.flare.alpha <= 0) {
                    d.collided = false;
                    d.flareContainer.visible = false;
                    d.trailContainer.visible = false;
                }
            }
            if (d.alive) {
                // Trail alpha
                if (d.tracerAlphaRate) {
                    const rate =
                        activePlayer.__id == d.playerId
                            ? d.tracerAlphaRate
                            : d.tracerAlphaRate * 0.9;
                    d.bulletTrail.alpha = math.max(
                        d.tracerAlphaMin,
                        d.bulletTrail.alpha * rate,
                    );
                }

                // Grow the flare size over time
                d.timeAlive += dt;
                d.flareScale =
                    math.easeOutExpo(d.timeAlive / d.maxTimeAlive) * d?.maxFlareScale!;

                // Make a smoke trail
                if (d.smokeThrottle <= 0) {
                    d.smokeThrottle = 0.05;
                } else {
                    d.smokeThrottle -= dt;
                }

                const distLeft = d.distance - v2.length(v2.sub(d.startPos, d.pos));
                const distTravel = math.min(distLeft, dt * d.speed);
                // v2.copy(d.pos);
                d.pos = v2.add(d.pos, v2.mul(d.dir, distTravel));
                if (math.eqAbs(distLeft, distTravel)) {
                    d.collided = true;
                    d.alive = false;
                }
                let layer = 0;
                if (
                    (!!util.sameLayer(layer, activePlayer.layer) ||
                        !!(activePlayer.layer & 2)) &&
                    (!(activePlayer.layer & 2) ||
                        !map.insideStructureMask(collider.createCircle(d.pos, 1)))
                ) {
                    layer |= 2;
                }
                renderer.addPIXIObj(d.trailContainer, layer, 1000, 0);
                renderer.addPIXIObj(d.flareContainer, layer, 1000, 1);
                d.isNew = false;
            }
        }
    }

    m_render(camera: Camera) {
        for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            if (b.alive || b.collided) {
                const screenPos = camera.m_pointToScreen(b.pos);
                b.flareContainer.position.set(screenPos.x, screenPos.y);
                const screenScale = camera.m_pixels(1);
                b.flareContainer.scale.set(
                    screenScale * b.flareScale,
                    screenScale * b.flareScale,
                );
                const dist = v2.length(v2.sub(b.pos, b.startPos));
                b.trailContainer.position.set(screenPos.x, screenPos.y);
                const trailLength = math.min(b.tracerLength * 15, dist / 2);
                b.trailContainer.scale.set(
                    screenScale * trailLength * b.trailScale,
                    screenScale,
                );
            }
        }
    }
}
