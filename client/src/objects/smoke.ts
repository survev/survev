import * as PIXI from "pixi.js";
import type { ObjectData, ObjectType } from "../../../shared/net/objectSerializeFns";
import { collider } from "../../../shared/utils/collider";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { Camera } from "../camera";
import type { Ctx } from "../game";
import type { Map } from "../map";
import type { Renderer } from "../renderer";
import { Pool } from "./objectPool";
import type { AbstractObject, Player } from "./player";

class Smoke implements AbstractObject {
    __id!: number;
    __type!: ObjectType.Smoke;
    active!: boolean;

    m_particle!: SmokeParticle | null;
    m_pos!: Vec2;
    m_rad!: number;
    m_layer!: number;
    m_interior!: number;

    m_init() {}
    m_free() {
        this.m_particle!.fadeOut();
        this.m_particle = null;
    }

    m_updateData(
        data: ObjectData<ObjectType.Smoke>,
        fullUpdate: boolean,
        isNew: boolean,
        ctx: Ctx,
    ) {
        this.m_pos = v2.copy(data.pos);
        this.m_rad = data.rad;

        if (fullUpdate) {
            this.m_layer = data.layer;
            this.m_interior = data.interior;
        }

        if (isNew) {
            this.m_particle = ctx.smokeBarn.m_allocParticle();
            this.m_particle?.m_init(
                this.m_pos,
                this.m_rad,
                this.m_layer,
                this.m_interior,
            );
        }
        this.m_particle!.posTarget = v2.copy(this.m_pos);
        this.m_particle!.radTarget = this.m_rad;
    }
}

const particles = ["part-smoke-02.img", "part-smoke-03.img"];
export class SmokeParticle {
    active = false;
    zIdx = 0;
    sprite = PIXI.Sprite.from(particles[Math.floor(Math.random() * particles.length)]);

    pos!: Vec2;
    posTarget!: Vec2;
    rad!: number;
    radTarget!: number;

    rot!: number;
    rotVel!: number;
    fade!: boolean;
    fadeTicker!: number;
    fadeDuration!: number;
    tint!: number;
    layer!: number;
    interior!: number;

    constructor() {
        this.sprite.anchor = new PIXI.Point(0.5, 0.5) as PIXI.ObservablePoint;
        this.sprite.visible = false;
    }

    m_init(pos: Vec2, rad: number, layer: number, interior: number) {
        this.pos = v2.copy(pos);
        this.posTarget = v2.copy(this.pos);
        this.rad = rad;
        this.radTarget = this.rad;
        this.rot = util.random(0, Math.PI * 2);
        this.rotVel = Math.PI * util.random(0.25, 0.5) * (Math.random() < 0.5 ? -1 : 1);
        this.fade = false;
        this.fadeTicker = 0;
        this.fadeDuration = util.random(0.5, 0.75);
        this.tint = util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        this.layer = layer;
        this.interior = interior;
    }

    fadeOut() {
        this.fade = true;
    }
}
export class SmokeBarn {
    m_smokePool = new Pool(Smoke);
    m_particles: SmokeParticle[] = [];
    zIdx = 2147483647;

    m_allocParticle() {
        let particle = null;
        for (let i = 0; i < this.m_particles.length; i++) {
            if (!this.m_particles[i].active) {
                particle = this.m_particles[i];
                break;
            }
        }
        if (!particle) {
            particle = new SmokeParticle();
            this.m_particles.push(particle);
        }
        particle.active = true;
        particle.zIdx = this.zIdx--;
        return particle;
    }

    m_update(
        dt: number,
        camera: Camera,
        activePlayer: Player,
        map: Map,
        renderer: Renderer,
    ) {
        // why is this commented out?
        // for (let o = this.e.getPool(), s = 0; s < o.length; s++) {
        // o[s].active;
        // }

        // Update visual particles
        for (let m = 0; m < this.m_particles.length; m++) {
            const p = this.m_particles[m];
            if (p.active) {
                p.rad = math.lerp(dt * 3, p.rad, p.radTarget);
                p.pos = math.v2lerp(dt * 3, p.pos, p.posTarget);
                p.rotVel *= 1 / (1 + dt * 0.1);
                p.rot += p.rotVel * dt;
                p.fadeTicker += p.fade ? dt : 0;
                p.active = p.fadeTicker < p.fadeDuration;

                const alpha = math.clamp(1 - p.fadeTicker / p.fadeDuration, 0, 1) * 0.9;

                // Always add to the top layer if visible and not occluded by
                // the layer mask (fixes issue of smokes spawning on the ground
                // level but occluded by the cellar when on the stairs).
                let layer = p.layer;
                if (
                    (!!util.sameLayer(p.layer, activePlayer.layer) ||
                        !!(activePlayer.layer & 2)) &&
                    (p.layer == 1 ||
                        !(activePlayer.layer & 2) ||
                        !map.insideStructureMask(collider.createCircle(p.pos, 1)))
                ) {
                    layer |= 2;
                }
                const zOrd = p.interior ? 500 : 1000;
                renderer.addPIXIObj(p.sprite, layer, zOrd, p.zIdx);

                const screenPos = camera.m_pointToScreen(p.pos);
                const screenScale = camera.m_pixels((p.rad * 2) / camera.m_ppu);

                p.sprite.position.set(screenPos.x, screenPos.y);
                p.sprite.scale.set(screenScale, screenScale);
                p.sprite.rotation = p.rot;
                p.sprite.tint = p.tint;
                p.sprite.alpha = alpha;
                p.sprite.visible = p.active;
            }
        }
    }
}
