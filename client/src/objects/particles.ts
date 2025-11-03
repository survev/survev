import * as PIXI from "pixi.js-legacy";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { Camera } from "../camera";
import type { Map } from "../map";
import type { Renderer } from "../renderer";
import { SDK } from "../sdk";

class Range {
    constructor(
        public min: number,
        public max: number,
    ) {}

    getRandom() {
        return util.random(this.min, this.max);
    }
}

function getRangeValue(val: number | Range) {
    if (val instanceof Range) {
        return val.getRandom();
    }
    return val;
}

function getColorValue(val: (() => number) | number) {
    return val instanceof Function ? val() : val;
}

export class Particle {
    active = false;
    ticker = 0;
    def = {} as ParticleDef;
    sprite = new PIXI.Sprite();
    hasParent = false;

    pos!: Vec2;
    vel!: Vec2;
    rot!: number;
    delay!: number;
    life!: number;
    drag!: number;
    rotVel!: number;
    rotDrag!: number;
    scaleUseExp!: boolean;
    scale!: number;
    scaleEnd!: number;
    scaleExp!: number;

    alphaUseExp!: boolean;
    alpha!: number;
    alphaEnd!: number;
    alphaExp!: number;

    alphaIn!: boolean;
    alphaInStart!: number;
    alphaInEnd!: number;

    emitterIdx!: number;
    valueAdjust!: number;

    constructor() {
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.scale.set(1, 1);
        this.sprite.visible = false;
    }

    init(
        renderer: Renderer,
        type: string,
        layer: number,
        pos: Vec2,
        vel: Vec2,
        scale: number,
        rot: number,
        parent: PIXI.Container | null,
        zOrd: number,
        valueAdjust: number,
    ) {
        const def = ParticleDefs[type];
        this.active = true;
        this.ticker = 0;
        if (parent) {
            this.hasParent = true;
            parent.addChild(this.sprite);
        } else {
            this.hasParent = false;
            renderer.addPIXIObj(this.sprite, layer, zOrd);
        }
        this.pos = v2.copy(pos);
        this.vel = v2.copy(vel);
        this.rot = rot;
        this.def = def;
        this.delay = 0;
        this.life = getRangeValue(def.life);
        this.drag = getRangeValue(def.drag);
        this.rotVel = getRangeValue(def.rotVel) * (Math.random() < 0.5 ? -1 : 1);
        this.rotDrag = getRangeValue(def.drag) / 2;
        this.scaleUseExp = def.scale.exp !== undefined;
        this.scale = getRangeValue(def.scale.start) * scale;
        this.scaleEnd = this.scaleUseExp ? 0 : getRangeValue(def.scale?.end!) * scale;
        this.scaleExp = this.scaleUseExp ? def.scale.exp! : 0;
        this.alphaUseExp = def.alpha.exp !== undefined;
        this.alpha = getRangeValue(def.alpha.start);
        this.alphaEnd = this.alphaUseExp ? 0 : getRangeValue(def.alpha?.end!);
        this.alphaExp = this.alphaUseExp ? def.alpha.exp! : 0;
        this.alphaIn = def.alphaIn !== undefined;
        this.alphaInStart = this.alphaIn ? getRangeValue(def.alphaIn?.start!) : 0;
        this.alphaInEnd = this.alphaIn ? getRangeValue(def.alphaIn?.end!) : 0;
        this.emitterIdx = -1;
        const tex = Array.isArray(def.image)
            ? def.image[Math.floor(Math.random() * def.image.length)]
            : def.image;
        this.sprite.texture = PIXI.Texture.from(tex);
        this.sprite.visible = false;
        this.valueAdjust = def.ignoreValueAdjust ? 1 : valueAdjust;
        this.setColor(getColorValue(def.color!));

        if (SDK.disableBloodParticles() && type == "bloodSplat") {
            this.sprite.renderable = false;
        } else {
            this.sprite.renderable = true;
        }
    }

    free() {
        this.active = false;
        this.sprite.visible = false;
    }

    setDelay(delay: number) {
        this.delay = delay;
    }

    setColor(color: number) {
        if (this.valueAdjust < 1) {
            color = util.adjustValue(color, this.valueAdjust);
        }
        this.sprite.tint = color;
    }
}

interface EmitterOptions {
    pos?: Vec2;
    dir?: Vec2;
    scale?: number;
    layer?: number;
    duration?: number;
    radius?: number;
    rateMult?: number;
    parent?: PIXI.Container | null;
}

export class Emitter {
    active = false;
    enabled!: boolean;
    type!: string;
    pos!: Vec2;
    dir!: Vec2;
    scale!: number;
    layer!: number;
    duration!: number;
    radius!: number;
    ticker!: number;
    nextSpawn!: number;
    spawnCount!: number;
    parent!: PIXI.Container | null;
    alpha!: number;
    rateMult!: number;
    zOrd!: number;

    init(type: string, options = {} as EmitterOptions) {
        const def = EmitterDefs[type];
        this.active = true;
        this.enabled = true;
        this.type = type;
        this.pos = options.pos ? v2.copy(options.pos) : v2.create(0, 0);
        this.dir = options.dir ? v2.copy(options.dir) : v2.create(0, 1);
        this.scale = options.scale !== undefined ? options.scale : 1;
        this.layer = options.layer || 0;
        this.duration =
            options.duration !== undefined ? options.duration : Number.MAX_VALUE;
        this.radius = options.radius !== undefined ? options.radius : def.radius;
        this.ticker = 0;
        this.nextSpawn = 0;
        this.spawnCount = 0;
        this.parent = options.parent || null;
        this.alpha = 1;
        this.rateMult = options.rateMult !== undefined ? options.rateMult : 1;
        const partDef = ParticleDefs[def.particle];
        this.zOrd =
            def.zOrd !== undefined
                ? def.zOrd
                : partDef.zOrd !== undefined
                  ? partDef.zOrd
                  : 20;
    }

    free() {
        this.active = false;
    }

    stop() {
        this.duration = this.ticker;
    }
}

export class ParticleBarn {
    particles: Particle[] = [];
    emitters: Emitter[] = [];
    valueAdjust = 1;

    constructor(public renderer: Renderer) {
        for (let i = 0; i < 256; i++) {
            this.particles[i] = new Particle();
        }
    }

    onMapLoad(map: Map) {
        this.valueAdjust = map.getMapDef().biome.valueAdjust;
    }

    m_free() {
        for (let i = 0; i < this.particles.length; i++) {
            const sprite = this.particles[i].sprite;
            sprite.parent?.removeChild(sprite);
            sprite.destroy({
                children: true,
            });
        }
    }

    addParticle(
        type: string,
        layer: number,
        pos: Vec2,
        vel: Vec2,
        scale?: number,
        rot?: number,
        parent?: PIXI.Container | null,
        zOrd?: number,
    ) {
        let particle = null;
        for (let i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].active) {
                particle = this.particles[i];
                break;
            }
        }
        if (!particle) {
            particle = new Particle();
            this.particles.push(particle);
        }
        scale = scale !== undefined ? scale : 1;
        rot = rot !== undefined ? rot : Math.random() * Math.PI * 2;
        zOrd = zOrd !== undefined ? zOrd : ParticleDefs[type].zOrd || 20;

        particle.init(
            this.renderer,
            type,
            layer,
            pos,
            vel,
            scale,
            rot,
            parent!,
            zOrd,
            this.valueAdjust,
        );
        return particle;
    }

    addRippleParticle(pos: Vec2, layer: number, color: number) {
        const particle = this.addParticle(
            "waterRipple",
            layer,
            pos,
            v2.create(0, 0),
            1,
            0,
            null,
        );
        particle.setColor(color);
        return particle;
    }

    addEmitter(type: string, options = {} as Partial<EmitterOptions>) {
        let emitter = null;

        for (let i = 0; i < this.emitters.length; i++) {
            if (!this.emitters[i].active) {
                emitter = this.emitters[i];
                break;
            }
        }

        if (!emitter) {
            emitter = new Emitter();
            this.emitters.push(emitter);
        }

        emitter.init(type, options);
        return emitter;
    }

    m_update(dt: number, camera: Camera) {
        // Update emitters
        for (let i = 0; i < this.emitters.length; i++) {
            const e = this.emitters[i];
            if (e.active && e.enabled) {
                e.ticker += dt;
                e.nextSpawn -= dt;
                const def = EmitterDefs[e.type];
                while (e.nextSpawn <= 0 && e.spawnCount < def.maxCount) {
                    const rad = e.scale * e.radius;
                    const pos = v2.add(e.pos, util.randomPointInCircle(rad));
                    const dir = v2.rotate(e.dir, (Math.random() - 0.5) * def.angle);
                    const vel = v2.mul(dir, getRangeValue(def.speed));
                    const rot = getRangeValue(def.rot!);
                    const particle = this.addParticle(
                        def.particle,
                        e.layer,
                        pos,
                        vel,
                        e.scale,
                        rot,
                        e.parent,
                        e.zOrd,
                    );
                    particle.emitterIdx = i;
                    let rate = getRangeValue(def.rate);
                    if (def.maxRate) {
                        const w = math.easeInExpo(
                            math.min(1, e.ticker / def.maxElapsed!),
                        );
                        const maxRate = getRangeValue(def.maxRate);
                        rate = math.lerp(w, rate, maxRate);
                    }
                    e.nextSpawn += rate * e.rateMult;
                    e.spawnCount++;
                }
                if (e.ticker >= e.duration) {
                    e.free();
                }
            }
        }

        // Update particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (p.active && ((p.ticker += dt), p.ticker >= p.delay)) {
                const t = math.min((p.ticker - p.delay) / p.life, 1);
                p.vel = v2.mul(p.vel, 1 / (1 + dt * p.drag));
                p.pos = v2.add(p.pos, v2.mul(p.vel, dt));
                p.rotVel *= 1 / (1 + dt * p.rotDrag);
                p.rot += p.rotVel * dt;
                if (p.scaleUseExp) {
                    p.scale += dt * p.scaleExp;
                }
                if (p.alphaUseExp) {
                    p.alpha = math.max(p.alpha + dt * p.alphaExp, 0);
                }
                const pos = p.hasParent ? p.pos : camera.m_pointToScreen(p.pos);
                let scale = p.scaleUseExp
                    ? p.scale
                    : math.remap(
                          t,
                          (p.def.scale.lerp as Range)?.min,
                          (p.def.scale.lerp as Range)?.max,
                          p.scale,
                          p.scaleEnd,
                      );
                let alpha = p.alphaUseExp
                    ? p.alpha
                    : math.remap(
                          t,
                          p.def.alpha.lerp?.min!,
                          p.def.alpha.lerp?.max!,
                          p.alpha,
                          p.alphaEnd,
                      );
                if (p.alphaIn && t < p.def.alphaIn?.lerp?.max!) {
                    alpha = math.remap(
                        t,
                        p.def.alphaIn?.lerp?.min!,
                        p.def.alphaIn?.lerp?.max!,
                        p.alphaInStart,
                        p.alphaInEnd,
                    );
                }

                // @HACK
                if (p.emitterIdx >= 0) {
                    alpha *= this.emitters[p.emitterIdx].alpha;
                }
                if (!p.hasParent) {
                    scale = camera.m_pixels(scale);
                }
                p.sprite.position.set(pos.x, pos.y);
                p.sprite.scale.set(scale, scale);
                p.sprite.rotation = p.rot;
                p.sprite.alpha = alpha;
                p.sprite.visible = true;

                // Die if it's time
                if (t >= 1) {
                    p.free();
                }
            }
        }
    }
}

const ParticleDefs: Record<string, ParticleDef> = {
    archwayBreak: {
        image: ["part-panel-01.img"],
        life: new Range(0.5, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.2, 0.35),
            end: new Range(0.08, 0.12),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.06, 0.84, util.random(0.46, 0.48)));
        },
    },
    bloodSplat: {
        image: ["part-splat-01.img", "part-splat-02.img", "part-splat-03.img"],
        life: 0.5,
        drag: 1,
        rotVel: 0,
        scale: {
            start: 0.04,
            end: new Range(0.15, 0.2),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0xff0000, 1, util.random(0.45, 0.8)));
        },
    },
    barrelPlank: {
        image: ["part-plank-01.img"],
        life: new Range(1, 1.5),
        drag: new Range(3, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.08, 0.18),
            end: new Range(0.07, 0.17),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.09, 0.8, util.random(0.66, 0.68)));
        },
    },
    barrelChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.01, 0.02, util.random(0.38, 0.41)));
        },
    },
    barrelBreak: {
        image: ["part-spark-02.img"],
        life: new Range(0.8, 1),
        drag: new Range(1, 5),
        rotVel: 0,
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.01, 0.02, util.random(0.38, 0.41)));
        },
    },
    blackChip: {
        image: ["part-woodchip-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0.08, util.random(0.16, 0.18)));
        },
    },
    blueChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.64, 1, util.random(0.83, 0.85)));
        },
    },
    book: {
        image: ["part-book-01.img"],
        life: new Range(1, 1.5),
        drag: new Range(3, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.09, 0.19),
            end: new Range(0.07, 0.17),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.08, 0.42, util.random(0.72, 0.74)));
        },
    },
    bottleBrownChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 1, Math.PI * 6),
        scale: {
            start: new Range(0.02, 0.04),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: 0x783808,
    },
    bottleBrownBreak: {
        image: ["part-spark-02.img"],
        life: new Range(0.4, 0.8),
        drag: new Range(1, 4),
        rotVel: new Range(Math.PI * 1, Math.PI * 6),
        scale: {
            start: new Range(0.03, 0.06),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 0.8,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: 0x783808,
    },
    bottleBlueChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 1, Math.PI * 6),
        scale: {
            start: new Range(0.02, 0.04),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: 0x4c58,
    },
    bottleWhiteBreak: {
        image: ["part-spark-02.img"],
        life: new Range(0.4, 0.8),
        drag: new Range(1, 4),
        rotVel: new Range(Math.PI * 1, Math.PI * 6),
        scale: {
            start: new Range(0.03, 0.06),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 0.75,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: 0xffffff,
    },
    bottleWhiteChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 1, Math.PI * 6),
        scale: {
            start: new Range(0.02, 0.04),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 0.75,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: 0xffffff,
    },
    bottleBlueBreak: {
        image: ["part-spark-02.img"],
        life: new Range(0.4, 0.8),
        drag: new Range(1, 4),
        rotVel: new Range(Math.PI * 1, Math.PI * 6),
        scale: {
            start: new Range(0.03, 0.06),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 0.8,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: 0x4c58,
    },
    brickChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0.71, util.random(0.32, 0.34)));
        },
    },
    clothBreak: {
        image: ["part-cloth-01.img"],
        life: new Range(0.8, 1),
        drag: new Range(1, 5),
        rotVel: 0,
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.95, 1)));
        },
    },
    clothHit: {
        image: ["part-cloth-01.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.95, 1)));
        },
    },
    depositBoxGreyBreak: {
        image: ["part-plate-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(7, 8),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.15, 0.25),
            end: new Range(0.12, 0.2),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.36, 0.38)));
        },
    },
    depositBoxGoldBreak: {
        image: ["part-plate-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(6, 8),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.2, 0.35),
            end: new Range(0.18, 0.25),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.11, 0.84, util.random(0.64, 0.66)));
        },
    },
    glassChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 1, Math.PI * 6),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: 0x80d9ff,
    },
    glassPlank: {
        image: ["part-plank-01.img"],
        life: new Range(1, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.1, 0.2),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0x80d9ff,
    },
    goldChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.11, 0.84, util.random(0.88, 0.9)));
        },
    },
    pinkChip: {
        image: ["part-spark-02.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0.52, util.random(0.98, 1)));
        },
    },
    ltblueChip: {
        image: ["part-spark-02.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.5, 0.65, util.random(0.98, 1)));
        },
    },
    yellowChip: {
        image: ["part-spark-02.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.16, 0.73, util.random(0.98, 1)));
        },
    },
    greenChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.4, 0.18, util.random(0.5, 0.62)));
        },
    },
    greenPlank: {
        image: ["part-plank-01.img"],
        life: new Range(1, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.08, 0.16),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0x3b452f,
    },
    greenhouseBreak: {
        image: ["part-spark-02.img", "part-plate-01.img", "part-panel-01.img"],
        life: new Range(0.5, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 1, Math.PI * 6),
        scale: {
            start: new Range(0.25, 0.55),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 0.8,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: 0x80d9ff,
    },
    hutBreak: {
        image: ["part-panel-01.img"],
        life: new Range(0.5, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.25, 0.55),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.1, 0.81, util.random(0.78, 0.82)));
        },
    },
    leaf: {
        image: ["part-leaf-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.5, 0.75)));
        },
    },
    leafPrickly: {
        image: ["part-leaf-01sv.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.8, 0.85)));
        },
    },
    leafRiver: {
        image: ["part-leaf-02.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.5, 0.75)));
        },
    },
    lockerBreak: {
        image: ["part-plate-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(7, 8),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.15, 0.2),
            end: new Range(0.12, 0.15),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.1, 0.23, util.random(0.51, 0.53)));
        },
    },
    ltgreenChip: {
        image: ["part-woodchip-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.2, 0.42, util.random(0.38, 0.42)));
        },
    },
    outhouseChip: {
        image: ["part-woodchip-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.08, 0.57, util.random(0.4, 0.46)));
        },
    },
    outhouseBreak: {
        image: ["part-panel-01.img"],
        life: new Range(0.5, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.25, 0.55),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.08, 0.79, util.random(0.52, 0.54)));
        },
    },
    outhousePlank: {
        image: ["part-plank-01.img"],
        life: new Range(1, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.1, 0.2),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.08, 0.57, util.random(0.4, 0.46)));
        },
    },
    potChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.06, 0.84, util.random(0.73, 0.77)));
        },
    },
    potBreak: {
        image: ["part-pot-01.img"],
        life: new Range(0.8, 1),
        drag: new Range(1, 5),
        rotVel: 0,
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.06, 0.84, util.random(0.73, 0.77)));
        },
    },
    potatoChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.075, 0.43, util.random(0.48, 0.5)));
        },
    },
    potatoBreak: {
        image: ["part-pumpkin-01.img"],
        life: new Range(0.8, 1),
        drag: new Range(1, 5),
        rotVel: 0,
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.075, 0.43, util.random(0.48, 0.5)));
        },
    },
    pumpkinChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.07, 1, util.random(0.98, 1)));
        },
    },
    pumpkinBreak: {
        image: ["part-pumpkin-01.img"],
        life: new Range(0.8, 1),
        drag: new Range(1, 5),
        rotVel: 0,
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.08, 1, util.random(0.95, 0.97)));
        },
    },
    squashChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.31, 0.86, util.random(0.35, 0.36)));
        },
    },
    squashBreak: {
        image: ["part-pumpkin-01.img"],
        life: new Range(0.8, 1),
        drag: new Range(1, 5),
        rotVel: 0,
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.31, 0.86, util.random(0.35, 0.36)));
        },
    },
    redChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.98, 1, util.random(0.52, 0.54)));
        },
    },
    redBreak: {
        image: ["part-spark-02.img"],
        life: new Range(0.8, 1),
        drag: new Range(1, 5),
        rotVel: 0,
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.98, 1, util.random(0.52, 0.54)));
        },
    },
    redPlank: {
        image: ["part-plank-01.img"],
        life: new Range(1, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.1, 0.2),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.02, 1, util.random(0.26, 0.28)));
        },
    },
    rockChip: {
        image: ["map-stone-01.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.5, 0.75)));
        },
    },
    rockBreak: {
        image: ["map-stone-01.img"],
        life: new Range(0.8, 1),
        drag: new Range(1, 5),
        rotVel: 0,
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.5, 0.75)));
        },
    },
    rockEyeChip: {
        image: ["map-stone-01.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.03, 0.06),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: 0x292421,
    },
    rockEyeBreak: {
        image: ["map-stone-01.img"],
        life: new Range(0.8, 1),
        drag: new Range(4, 12),
        rotVel: 0,
        scale: {
            start: new Range(0.05, 0.1),
            end: new Range(0.03, 0.06),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0x292421,
    },
    shackBreak: {
        image: ["part-panel-01.img"],
        life: new Range(0.5, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.25, 0.55),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.1, 0.24, util.random(0.38, 0.41)));
        },
    },
    shackGreenBreak: {
        image: ["part-panel-01.img"],
        life: new Range(0.5, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.25, 0.55),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0x577066,
    },
    tanChip: {
        image: ["part-woodchip-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.1, 0.35, util.random(0.48, 0.52)));
        },
    },
    teahouseBreak: {
        image: ["part-panel-01.img"],
        life: new Range(0.5, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.25, 0.55),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.6, 0.31, util.random(0.42, 0.45)));
        },
    },
    teapavilionBreak: {
        image: ["part-panel-01.img"],
        life: new Range(0.5, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.25, 0.55),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0.8, util.random(0.6, 0.62)));
        },
    },
    toiletBreak: {
        image: ["part-spark-02.img"],
        life: new Range(0.8, 1),
        drag: new Range(1, 5),
        rotVel: 0,
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.97, 0, util.random(0.95, 0.97)));
        },
    },
    toiletMetalBreak: {
        image: ["part-spark-02.img"],
        life: new Range(0.8, 1),
        drag: new Range(4, 5),
        rotVel: 0,
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.01, 0.02, util.random(0.38, 0.41)));
        },
    },
    turkeyFeathersHit: {
        image: ["part-feather-01.img", "part-feather-02.img"],
        life: new Range(1, 1.5),
        drag: new Range(1, 10),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.1, 0.2),
            end: new Range(0.08, 0.12),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return 0xffffff;
        },
    },
    turkeyFeathersDeath: {
        image: ["part-feather-01.img", "part-feather-02.img"],
        life: new Range(1, 1.5),
        drag: new Range(1, 10),
        rotVel: new Range(0, Math.PI * 3),
        scale: {
            start: new Range(0.15, 0.25),
            end: new Range(0.12, 0.2),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return 0xffffff;
        },
    },
    whiteChip: {
        image: ["part-spark-02.img"],
        life: 0.5,
        drag: new Range(1, 10),
        rotVel: 0,
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.97, 0, util.random(0.95, 0.97)));
        },
    },
    whitePlank: {
        image: ["part-plank-01.img"],
        life: new Range(1, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.1, 0.2),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.97, 0, util.random(0.95, 0.97)));
        },
    },
    windowBreak: {
        image: ["part-spark-02.img"],
        life: new Range(0.4, 0.8),
        drag: new Range(1, 4),
        rotVel: new Range(Math.PI * 1, Math.PI * 6),
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 0.8,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: 8444415,
    },
    woodChip: {
        image: ["part-woodchip-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.04, 0.08),
            end: new Range(0.01, 0.02),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.05, 1, util.random(0.35, 0.45)));
        },
    },
    woodLog: {
        image: ["part-log-01.img"],
        life: new Range(1, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.1, 0.2),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.05, 1, util.random(0.35, 0.45)));
        },
    },
    woodPlank: {
        image: ["part-plank-01.img"],
        life: new Range(1, 1.5),
        drag: new Range(1, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.1, 0.2),
            end: new Range(0.08, 0.18),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.05, 1, util.random(0.25, 0.35)));
        },
    },
    woodShard: {
        image: ["part-spark-02.img"],
        life: new Range(1, 1.5),
        drag: new Range(3, 5),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: new Range(0.06, 0.15),
            end: new Range(0.02, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.05, 1, util.random(0.25, 0.35)));
        },
    },
    "9mm": {
        image: ["part-shell-01.img"],
        life: new Range(0.5, 0.75),
        drag: new Range(3, 4),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: 0.0625,
            end: 0.0325,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    "9mm_cursed": {
        image: ["part-shell-01.img"],
        life: new Range(0.5, 0.75),
        drag: new Range(3, 4),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: 0.0625,
            end: 0.0325,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    "762mm": {
        image: ["part-shell-02.img"],
        life: new Range(0.75, 1),
        drag: new Range(1.5, 2.5),
        rotVel: new Range(Math.PI * 2.5, Math.PI * 2.5),
        scale: {
            start: 0.075,
            end: 0.045,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.925, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    "556mm": {
        image: ["part-shell-04.img"],
        life: new Range(0.75, 1),
        drag: new Range(1.5, 2.5),
        rotVel: new Range(Math.PI * 2.5, Math.PI * 2.5),
        scale: {
            start: 0.075,
            end: 0.045,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.925, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    "12gauge": {
        image: ["part-shell-03.img"],
        life: new Range(0.5, 0.75),
        drag: new Range(1, 2),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: 0.1,
            end: 0.05,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    "50AE": {
        image: ["part-shell-01.img"],
        life: new Range(0.5, 0.75),
        drag: new Range(3, 4),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: 0.0625,
            end: 0.0325,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    "308sub": {
        image: ["part-shell-05.img"],
        life: new Range(0.5, 0.75),
        drag: new Range(3, 4),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: 0.0625,
            end: 0.0325,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    flare: {
        image: ["part-shell-03.img"],
        life: new Range(0.5, 0.75),
        drag: new Range(1, 2),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: 0.1,
            end: 0.05,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    "45acp": {
        image: ["part-shell-01.img"],
        life: new Range(0.5, 0.75),
        drag: new Range(3, 4),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: 0.07,
            end: 0.04,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    potato_ammo: {
        image: ["part-wedge-01.img"],
        life: new Range(0.5, 0.75),
        drag: new Range(3, 4),
        rotVel: new Range(Math.PI * 3, Math.PI * 3),
        scale: {
            start: 0.07,
            end: 0.04,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.95, 1),
        },
        color: 0xffffff,
    },
    bugle_ammo: {
        image: ["part-note-02.img"],
        life: new Range(1.25, 1.3),
        drag: new Range(3, 4),
        rotVel: new Range(Math.PI * 1, Math.PI * 1),
        scale: {
            start: 0.1,
            end: 0.14,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.5, 1),
        },
        color: 0xffda00,
    },
    fragPin: {
        image: ["part-frag-pin-01.img"],
        life: new Range(0.5, 0.5),
        drag: new Range(0.9, 1),
        rotVel: 0,
        scale: {
            start: 0.18,
            end: 0.14,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.5, 1),
        },
        color: 0xffffff,
    },
    fragLever: {
        image: ["part-frag-lever-01.img"],
        life: new Range(0.5, 0.5),
        drag: new Range(0.9, 1),
        rotVel: Math.PI * 9,
        scale: {
            start: 0.18,
            end: 0.14,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.5, 1),
        },
        color: 0xffffff,
    },
    explosionBurst: {
        image: ["part-frag-burst-01.img"],
        life: 0.5,
        drag: 0,
        rotVel: 0,
        scale: {
            start: 1,
            end: 4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.065, 1, util.random(0.98, 0.99)));
        },
    },
    explosionMIRV: {
        image: ["part-frag-burst-01.img"],
        life: 0.5,
        drag: 0,
        rotVel: 0,
        scale: {
            start: 1,
            end: 4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 1, util.random(0.82, 0.84)));
        },
    },
    explosionSmoke: {
        image: ["part-smoke-01.img"],
        life: new Range(2, 3),
        drag: 0,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    explosionUSAS: {
        image: ["part-frag-burst-01.img"],
        life: 0.5,
        drag: 0,
        rotVel: 0,
        scale: {
            start: 1,
            end: 4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.08, 1, util.random(0.98, 0.99)));
        },
    },
    explosionRounds: {
        image: ["part-frag-burst-03.img"],
        life: 0.5,
        drag: 0,
        rotVel: 0,
        scale: {
            start: 1,
            end: 4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.08, 0.7, util.random(0.75, 0.8)));
        },
    },
    explosionBomb: {
        image: ["part-frag-burst-02.img"],
        life: 0.5,
        drag: 0,
        rotVel: 0,
        scale: {
            start: 1,
            end: 4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: 0xffffff,
    },
    explosionPotato: {
        image: ["part-frag-burst-01.img"],
        life: 0.5,
        drag: 0,
        rotVel: 0,
        scale: {
            start: 1,
            end: 4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: 0xad661a,
    },
    explosionPotatoSMG: {
        image: ["part-frag-burst-01.img"],
        life: 0.5,
        drag: 0,
        rotVel: 0,
        scale: {
            start: 1,
            end: 4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.75, 1),
        },
        color: 0xc4a80a,
    },
    airdropSmoke: {
        image: ["part-smoke-02.img", "part-smoke-03.img"],
        zOrd: 499,
        life: new Range(1, 1.5),
        drag: 0,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.67, 0.72),
            end: new Range(0.55, 0.61),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    airdropCrate01: {
        image: ["part-airdrop-01.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(2, 2.25),
        rotVel: new Range(Math.PI * 1, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    airdropCrate01h: {
        image: ["part-airdrop-01h.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(2, 2.25),
        rotVel: new Range(Math.PI * 1, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    airdropCrate01x: {
        image: ["part-airdrop-01x.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(2, 2.25),
        rotVel: new Range(Math.PI * 1, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    airdropCrate02: {
        image: ["part-airdrop-02.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(1.85, 2.15),
        rotVel: new Range(0, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    airdropCrate02h: {
        image: ["part-airdrop-02h.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(1.85, 2.15),
        rotVel: new Range(0, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    airdropCrate02x: {
        image: ["part-airdrop-02x.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(1.85, 2.15),
        rotVel: new Range(0, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    airdropCrate03: {
        image: ["part-airdrop-03.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(2, 2.25),
        rotVel: new Range(Math.PI * 1, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    airdropCrate04: {
        image: ["part-airdrop-04.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(1.85, 2.15),
        rotVel: new Range(0, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    classShell01a: {
        image: ["part-class-shell-01a.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(2, 2.25),
        rotVel: new Range(Math.PI * 1, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    classShell01b: {
        image: ["part-class-shell-01b.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(1.85, 2.15),
        rotVel: new Range(0, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    classShell02a: {
        image: ["part-class-shell-02a.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(2, 2.25),
        rotVel: new Range(Math.PI * 1, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    classShell02b: {
        image: ["part-class-shell-02b.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(1.85, 2.15),
        rotVel: new Range(0, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    classShell03a: {
        image: ["part-class-shell-03a.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(2, 2.25),
        rotVel: new Range(Math.PI * 1, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    classShell03b: {
        image: ["part-class-shell-03b.img"],
        life: new Range(0.85, 1.15),
        drag: new Range(1.85, 2.15),
        rotVel: new Range(0, Math.PI * 2),
        scale: {
            start: 0.5,
            end: 0.4,
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 0xffffff,
    },
    cabinSmoke: {
        image: ["part-smoke-02.img", "part-smoke-03.img"],
        life: new Range(3, 3.25),
        drag: new Range(0.2, 0.22),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.2, 0.25),
            end: new Range(0.6, 0.65),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 0.7,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        alphaIn: {
            start: 0,
            end: 0.7,
            lerp: new Range(0, 0.1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.69, 0.695)));
        },
    },
    bathhouseSteam: {
        image: ["part-smoke-02.img", "part-smoke-03.img"],
        life: new Range(10, 12),
        drag: new Range(0.04, 0.06),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.2, 0.25),
            end: new Range(0.9, 0.95),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 0.5,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        alphaIn: {
            start: 0,
            end: 0.5,
            lerp: new Range(0, 0.1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.99, 0.995)));
        },
    },
    bunkerBubbles: {
        image: ["player-ripple-01.img"],
        zOrd: 10,
        life: new Range(2.25, 2.5),
        drag: new Range(1.85, 2.15),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.2, 0.25),
            end: new Range(0.65, 0.7),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 0.25,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.95, 1)));
        },
    },
    waterRipple: {
        image: ["player-ripple-01.img"],
        zOrd: 10,
        life: 1.75,
        drag: 0,
        rotVel: 0,
        scale: {
            start: 0.15,
            exp: 0.5,
        },
        alpha: {
            start: 1,
            exp: -1,
        },
        color: 0xb3f0ff,
    },
    leafAutumn: {
        image: [
            "part-leaf-03.img",
            "part-leaf-04.img",
            "part-leaf-05.img",
            "part-leaf-06.img",
        ],
        life: new Range(10, 15),
        drag: new Range(0, 0),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.15),
            end: new Range(0.08, 0.11),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    leafHalloween: {
        image: [
            "part-leaf-03.img",
            "part-leaf-04.img",
            "part-leaf-05.img",
            "part-leaf-06.img",
        ],
        life: new Range(10, 15),
        drag: new Range(0, 0),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.15),
            end: new Range(0.08, 0.11),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.5, 0.55)));
        },
        ignoreValueAdjust: true,
    },
    leafSpring: {
        image: [
            "part-blossom-01.img",
            "part-blossom-02.img",
            "part-blossom-03.img",
            "part-blossom-04.img",
        ],
        life: new Range(10, 15),
        drag: new Range(0, 0),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.13, 0.15),
            end: new Range(0.08, 0.11),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    leafSummer: {
        image: ["part-leaf-06.img"],
        life: new Range(10, 15),
        drag: new Range(0, 0),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.15),
            end: new Range(0.08, 0.11),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.7, 0.95)));
        },
        ignoreValueAdjust: true,
    },
    leafPotato: {
        image: [
            "part-blossom-01.img",
            "part-blossom-02.img",
            "part-blossom-03.img",
            "part-blossom-04.img",
            "part-potato-02.img",
        ],
        life: new Range(10, 15),
        drag: new Range(0, 0),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.13, 0.15),
            end: new Range(0.08, 0.11),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    potato: {
        image: ["part-potato-02.img"],
        life: new Range(10, 15),
        drag: new Range(0, 0),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.13, 0.15),
            end: new Range(0.08, 0.11),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    snow: {
        image: ["part-snow-01.img"],
        life: new Range(10, 15),
        drag: new Range(0, 0),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.07, 0.12),
            end: new Range(0.05, 0.1),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    snowball_impact: {
        image: ["part-snow-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(0, 0),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.13, 0.23),
            end: new Range(0.07, 0.14),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    potato_impact: {
        image: ["part-potato-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(0, 0),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.13, 0.23),
            end: new Range(0.07, 0.14),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 0, util.random(0.9, 0.95)));
        },
    },
    potato_smg_impact: {
        image: ["part-potato-01.img"],
        life: new Range(0.5, 1),
        drag: new Range(0, 0),
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.13, 0.23),
            end: new Range(0.07, 0.14),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.9, 1),
        },
        color: 16770437,
    },
    heal_basic: {
        image: ["part-heal-basic.img"],
        life: new Range(0.75, 1),
        drag: 0.25,
        rotVel: 0,
        scale: {
            start: new Range(0.1, 0.12),
            end: new Range(0.05, 0.07),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 1, util.random(0.7, 1)));
        },
        ignoreValueAdjust: true,
    },
    heal_heart: {
        image: ["part-heal-heart.img"],
        life: new Range(0.75, 1),
        drag: 0.25,
        rotVel: 0,
        scale: {
            start: new Range(0.1, 0.12),
            end: new Range(0.05, 0.07),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 1, util.random(0.7, 1)));
        },
        ignoreValueAdjust: true,
    },
    heal_moon: {
        image: ["part-heal-moon.img"],
        life: new Range(0.75, 1),
        drag: 0.25,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.1, 0.12),
            end: new Range(0.05, 0.07),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 1, util.random(0.7, 1)));
        },
        ignoreValueAdjust: true,
    },
    heal_tomoe: {
        image: ["part-heal-tomoe.img"],
        life: new Range(0.75, 1),
        drag: 0.25,
        rotVel: new Range(Math.PI * 0.5, Math.PI * 1),
        scale: {
            start: new Range(0.1, 0.12),
            end: new Range(0.05, 0.07),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0, 1, util.random(0.7, 1)));
        },
        ignoreValueAdjust: true,
    },
    boost_basic: {
        image: ["part-boost-basic.img"],
        life: new Range(0.75, 1),
        drag: 0,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.14),
            end: new Range(0.06, 0.08),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.3, 1, util.random(0.7, 1)));
        },
        ignoreValueAdjust: true,
    },
    boost_star: {
        image: ["part-boost-star.img"],
        life: new Range(0.75, 1),
        drag: 0,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.14),
            end: new Range(0.06, 0.08),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.3, 1, util.random(0.7, 1)));
        },
        ignoreValueAdjust: true,
    },
    boost_naturalize: {
        image: ["part-boost-naturalize.img"],
        life: new Range(0.75, 1),
        drag: 0,
        rotVel: new Range(Math.PI * 0.35, Math.PI * 0.7),
        scale: {
            start: new Range(0.12, 0.14),
            end: new Range(0.06, 0.08),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.3, 1, util.random(0.7, 1)));
        },
        ignoreValueAdjust: true,
    },
    boost_shuriken: {
        image: ["part-boost-shuriken.img"],
        life: new Range(0.75, 1),
        drag: 0,
        rotVel: new Range(Math.PI * 1, Math.PI * 2),
        scale: {
            start: new Range(0.12, 0.14),
            end: new Range(0.06, 0.08),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.3, 1, util.random(0.7, 1)));
        },
        ignoreValueAdjust: true,
    },
    revive_basic: {
        image: ["part-heal-basic.img"],
        life: new Range(0.75, 1),
        drag: 0.25,
        rotVel: 0,
        scale: {
            start: new Range(0.1, 0.12),
            end: new Range(0.05, 0.07),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.83, 1, util.random(0.7, 1)));
        },
        ignoreValueAdjust: true,
    },
    leafStim: {
        image: [
            "part-blossom-01.img",
            "part-blossom-02.img",
            "part-blossom-03.img",
            "part-blossom-04.img",
        ],
        life: new Range(4, 5),
        drag: 0,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.14),
            end: new Range(0.06, 0.08),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.37, 1, util.random(0.95, 1)));
        },
    },
    takedownStim: {
        image: ["part-takedown-01.img"],
        life: new Range(4, 5),
        drag: 0,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.14),
            end: new Range(0.06, 0.08),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: 13107200,
    },
    inspireStim: {
        image: ["part-note-01.img"],
        life: new Range(4, 5),
        drag: 0,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.14),
            end: new Range(0.06, 0.08),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            return util.rgbToInt(util.hsvToRgb(0.13, 1, util.random(0.98, 1)));
        },
    },
    xp_common: {
        image: ["part-boost-basic.img"],
        life: new Range(0.75, 1),
        drag: 0,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.14),
            end: new Range(0.06, 0.08),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            if (Math.random() > 0.5) {
                return util.rgbToInt(util.hsvToRgb(0.12, 0.97, util.random(0.95, 1)));
            }
            return util.rgbToInt(util.hsvToRgb(0.16, 1, util.random(0.95, 1)));
        },
        ignoreValueAdjust: true,
    },
    xp_rare: {
        image: ["part-boost-basic.img"],
        life: new Range(0.75, 1),
        drag: 0,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.14),
            end: new Range(0.06, 0.08),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            if (Math.random() > 0.5) {
                return util.rgbToInt(util.hsvToRgb(0.05, 0.94, util.random(0.85, 0.88)));
            }
            return util.rgbToInt(util.hsvToRgb(0.06, 0.95, util.random(0.95, 1)));
        },
        ignoreValueAdjust: true,
    },
    xp_mythic: {
        image: ["part-boost-basic.img"],
        life: new Range(0.75, 1),
        drag: 0,
        rotVel: new Range(Math.PI * 0.25, Math.PI * 0.5),
        scale: {
            start: new Range(0.12, 0.14),
            end: new Range(0.06, 0.08),
            lerp: new Range(0, 1),
        },
        alpha: {
            start: 1,
            end: 0,
            lerp: new Range(0.7, 1),
        },
        alphaIn: {
            start: 0,
            end: 1,
            lerp: new Range(0, 0.05),
        },
        color: function () {
            if (Math.random() > 0.5) {
                return util.rgbToInt(util.hsvToRgb(0, 0.96, util.random(0.91, 0.94)));
            }
            return util.rgbToInt(util.hsvToRgb(0.03, 0.95, util.random(0.92, 0.95)));
        },
        ignoreValueAdjust: true,
    },
};
const EmitterDefs: Record<string, EmitterDef> = {
    smoke_barrel: {
        particle: "explosionSmoke",
        rate: new Range(0.2, 0.3),
        radius: 0,
        speed: new Range(2, 3),
        angle: Math.PI * 0.1,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
    },
    cabin_smoke_parent: {
        particle: "cabinSmoke",
        rate: new Range(0.72, 0.83),
        radius: 0,
        speed: new Range(64, 96),
        angle: Math.PI * 0.1,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
    },
    bathhouse_steam: {
        particle: "bathhouseSteam",
        rate: new Range(2, 3),
        radius: 1,
        speed: new Range(1.5, 2),
        angle: Math.PI * 0.1,
        maxCount: Number.MAX_VALUE,
    },
    bunker_bubbles_01: {
        particle: "bunkerBubbles",
        rate: new Range(0.3, 0.325),
        radius: 0,
        speed: new Range(1.6, 1.8),
        angle: Math.PI * -2.2,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
    },
    bunker_bubbles_02: {
        particle: "bunkerBubbles",
        rate: new Range(0.4, 0.425),
        radius: 0,
        speed: new Range(1.6, 1.8),
        angle: Math.PI * -2.2,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
    },
    falling_leaf: {
        particle: "leafAutumn",
        rate: new Range(0.08, 0.12),
        radius: 120,
        speed: new Range(2, 3),
        angle: Math.PI * 0.2,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
        zOrd: 999,
    },
    falling_leaf_halloween: {
        particle: "leafHalloween",
        rate: new Range(0.08, 0.12),
        radius: 120,
        speed: new Range(2, 3),
        angle: Math.PI * 0.2,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
        zOrd: 999,
    },
    falling_leaf_spring: {
        particle: "leafSpring",
        rate: new Range(0.1, 0.14),
        radius: 120,
        speed: new Range(2, 3),
        angle: Math.PI * 0.2,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
        zOrd: 999,
    },
    falling_leaf_summer: {
        particle: "leafSummer",
        rate: new Range(0.18, 0.24),
        radius: 120,
        speed: new Range(1.4, 2.4),
        angle: Math.PI * 0.2,
        maxCount: Number.MAX_VALUE,
        zOrd: 999,
    },
    falling_leaf_potato: {
        particle: "leafPotato",
        rate: new Range(0.1, 0.14),
        radius: 120,
        speed: new Range(2, 3),
        angle: Math.PI * 0.2,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
        zOrd: 999,
    },
    falling_potato: {
        particle: "potato",
        rate: new Range(0.2, 0.24),
        radius: 120,
        speed: new Range(2, 3),
        angle: Math.PI * 0.2,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
        zOrd: 999,
    },
    falling_snow_fast: {
        particle: "snow",
        rate: new Range(0.12, 0.17),
        maxRate: new Range(0.05, 0.07),
        maxElapsed: 240,
        radius: 70,
        speed: new Range(1, 1.5),
        angle: Math.PI * 0.2,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
        zOrd: 999,
    },
    falling_snow_slow: {
        particle: "snow",
        rate: new Range(0.08, 0.12),
        radius: 70,
        speed: new Range(1, 1.5),
        angle: Math.PI * 0.2,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
        zOrd: 999,
    },
    heal_basic: {
        particle: "heal_basic",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
    heal_heart: {
        particle: "heal_heart",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
    heal_moon: {
        particle: "heal_moon",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
    heal_tomoe: {
        particle: "heal_tomoe",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
    boost_basic: {
        particle: "boost_basic",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
    },
    boost_star: {
        particle: "boost_star",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
    },
    boost_naturalize: {
        particle: "boost_naturalize",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
    },
    boost_shuriken: {
        particle: "boost_shuriken",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: new Range(0, Math.PI * 2),
        maxCount: Number.MAX_VALUE,
    },
    revive_basic: {
        particle: "revive_basic",
        rate: new Range(0.5, 0.55),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
    windwalk: {
        particle: "leafStim",
        rate: new Range(0.1, 0.12),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
    takedown: {
        particle: "takedownStim",
        rate: new Range(0.1, 0.12),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
    inspire: {
        particle: "inspireStim",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
    xp_common: {
        particle: "xp_common",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
    xp_rare: {
        particle: "xp_rare",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
    xp_mythic: {
        particle: "xp_mythic",
        rate: new Range(0.3, 0.35),
        radius: 1.5,
        speed: new Range(1, 1.5),
        angle: 0,
        rot: 0,
        maxCount: Number.MAX_VALUE,
    },
};

export interface ParticleDef {
    image: string[];
    zOrd?: number;
    life: RangeNumber;
    drag: RangeNumber;
    rotVel: RangeNumber;
    scale: {
        start: RangeNumber;
        end?: RangeNumber;
        lerp?: RangeNumber;
        exp?: number;
    };
    alpha: {
        start: number;
        end?: number;
        lerp?: Range;
        exp?: number;
    };
    alphaIn?: {
        start: number;
        end?: number;
        lerp?: Range;
        exp?: number;
    };
    color?: number | (() => number);
    ignoreValueAdjust?: boolean;
}
type RangeNumber = Range | number;

export interface EmitterDef {
    particle: string;
    rate: Range;
    radius: number;
    speed: Range;
    angle: number;
    rot?: RangeNumber;
    maxCount: number;
    maxRate?: Range;
    maxElapsed?: number;
    zOrd?: number;
}
