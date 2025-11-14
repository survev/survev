import * as PIXI from "pixi.js-legacy";
import { MapObjectDefs } from "../../../shared/defs/mapObjectDefs";
import type { DecalDef } from "../../../shared/defs/mapObjectsTyping";
import type { ObjectData, ObjectType } from "../../../shared/net/objectSerializeFns";
import type { Collider } from "../../../shared/utils/coldet";
import { collider } from "../../../shared/utils/collider";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { Camera } from "../camera";
import type { DebugRenderOpts } from "../config";
import type { Ctx } from "../game";
import type { Map } from "../map";
import type { Renderer } from "../renderer";
import { Pool } from "./objectPool";
import type { AbstractObject } from "./player";

function lerpColor(t: number, a: number, b: number) {
    // util.lerpColor is relatively expensive; avoid if it possible
    return t == 0.0 ? a : t == 1.0 ? b : util.lerpColor(t, a, b);
}

class Decal implements AbstractObject {
    __id!: number;
    __type!: ObjectType.Decal;
    active!: boolean;

    decalRender: DecalRender | null = null;

    isNew!: boolean;
    goreT!: number;
    hasGore!: boolean;

    type!: string;
    pos!: Vec2;
    rot!: number;
    scale!: number;
    layer!: number;
    goreKills!: number;
    collider!: Collider;
    surface!: DecalDef["surface"] | null;

    m_init() {
        this.isNew = false;
        this.goreT = 0;
    }

    m_free() {
        if (this.decalRender) {
            this.decalRender.free();
            this.decalRender = null;
        }
    }

    m_updateData(
        data: ObjectData<ObjectType.Decal>,
        fullUpdate: boolean,
        isNew: boolean,
        ctx: Ctx,
    ) {
        if (fullUpdate) {
            const def = MapObjectDefs[data.type] as DecalDef;

            // Copy data
            this.type = data.type;
            this.pos = v2.copy(data.pos);
            this.rot = math.oriToRad(data.ori);
            this.scale = data.scale;
            this.layer = data.layer;
            this.goreKills = data.goreKills;
            this.collider = collider.transform(
                def.collision,
                this.pos,
                this.rot,
                this.scale,
            );
            this.surface = def.surface ? util.cloneDeep(def.surface) : null;
            this.hasGore = def.gore !== undefined;

            // Setup render
            // The separate DecalRender object lets decals fade out
            // over time after the underlying GameObject has been deleted.
            this.isNew = isNew;
            if (this.isNew) {
                this.decalRender = ctx.decalBarn.allocDecalRender();
                this.decalRender.init(this, ctx.map);
            }
        }
    }

    update(dt: number) {
        if (this.hasGore) {
            const def = MapObjectDefs[this.type] as DecalDef;
            let goreTarget = math.delerp(
                this.goreKills,
                def.gore?.fade.start!,
                def.gore?.fade.end!,
            );
            goreTarget = Math.pow(goreTarget, def.gore?.fade.pow!);
            this.goreT = this.isNew
                ? goreTarget
                : math.lerp(dt * def.gore?.fade.speed!, this.goreT, goreTarget);

            // Adjust properties based on the gore level
            if (def.gore?.tint !== undefined) {
                const tint = lerpColor(this.goreT, def.img.tint, def.gore.tint);
                this.decalRender!.setTint(tint);
            }
            if (def.gore?.alpha !== undefined) {
                this.decalRender!.spriteAlpha = math.lerp(
                    this.goreT,
                    def.img.alpha,
                    def.gore.alpha,
                );
            }
            if (def.gore?.waterColor !== undefined && this.surface) {
                this.surface.data.waterColor = lerpColor(
                    this.goreT,
                    def.surface?.data.waterColor!,
                    def.gore.waterColor,
                );
            }
            if (def.gore?.rippleColor !== undefined && this.surface) {
                this.surface.data.rippleColor = lerpColor(
                    this.goreT,
                    def.surface?.data.rippleColor!,
                    def.gore.rippleColor,
                );
            }
        }
        this.isNew = false;
    }
}

class DecalRender {
    sprite = new PIXI.Sprite();

    pos!: Vec2;
    rot!: number;
    scale!: number;
    layer!: number;
    zIdx!: number;
    zOrd!: number;

    imgScale!: number;
    spriteAlpha!: number;
    valueAdjust!: number;
    inWater!: boolean;

    flicker!: boolean;
    flickerMin!: number;
    flickerMax!: number;
    flickerTarget!: number;
    flickerRate!: number;
    flickerCooldown!: number;

    active!: boolean;
    deactivated!: boolean;
    fadeout!: boolean;
    fadeAlpha!: number;

    constructor() {
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.visible = false;
    }

    init(decal: Decal, map: Map) {
        const def = MapObjectDefs[decal.type] as DecalDef;

        this.pos = v2.copy(decal.pos);
        this.rot = decal.rot;
        this.scale = decal.scale;
        this.layer = decal.layer;
        this.zIdx = def.img.zIdx;
        this.zOrd = decal.__id;

        const imgDef = def.img;
        this.sprite.texture = PIXI.Texture.from(imgDef.sprite);
        this.sprite.alpha = 1;
        this.sprite.visible = true;

        this.imgScale = def.img.scale;
        this.spriteAlpha = imgDef.alpha;
        this.valueAdjust = imgDef.ignoreAdjust ? 1 : map.getMapDef().biome.valueAdjust;
        this.setTint(imgDef.tint);

        this.inWater = false;
        if (def.height < 0.25) {
            const surface = map.getGroundSurface(decal.pos, decal.layer);
            this.inWater = surface.type == "water";
        }

        this.flicker = def.img.flicker!;
        if (this.flicker) {
            this.flickerMin = def.img.flickerMin!;
            this.flickerMax = def.img.flickerMax!;
            this.flickerTarget = this.imgScale;
            this.flickerRate = def.img.flickerRate!;
            this.flickerCooldown = 0;
        }

        this.active = true;
        this.deactivated = false;
        this.fadeout = def.lifetime !== undefined;
        this.fadeAlpha = 1;
    }

    free() {
        this.deactivated = true;
    }

    setTint(color: number) {
        if (this.valueAdjust < 1) {
            color = util.adjustValue(color, this.valueAdjust);
        }
        this.sprite.tint = color;
    }

    update(dt: number, camera: Camera, renderer: Renderer) {
        if (this.deactivated && this.fadeout) {
            this.fadeAlpha = math.lerp(dt * 3, this.fadeAlpha, 0);
            if (this.fadeAlpha < 0.01) {
                this.fadeAlpha = 0;
            }
        }
        if (!!this.deactivated && (!this.fadeout || !!math.eqAbs(this.fadeAlpha, 0))) {
            this.sprite.visible = false;
            this.active = false;
        }

        if (this.flicker) {
            if (this.flickerCooldown < 0) {
                this.flickerTarget = util.random(this.flickerMin, this.flickerMax);
                this.flickerCooldown = util.random(0.05, this.flickerRate);
            } else {
                // Lerp towards the last target flicker
                this.imgScale = math.lerp(
                    this.flickerRate - this.flickerCooldown,
                    this.imgScale,
                    this.flickerTarget,
                );
                this.flickerCooldown -= dt;
            }
        }
        const screenPos = camera.m_pointToScreen(this.pos);
        const screenScale = camera.m_pixels(this.scale * this.imgScale);
        this.sprite.position.set(screenPos.x, screenPos.y);
        this.sprite.scale.set(screenScale, screenScale);
        this.sprite.rotation = -this.rot;
        this.sprite.alpha = this.spriteAlpha * (this.inWater ? 0.3 : 1) * this.fadeAlpha;
        renderer.addPIXIObj(this.sprite, this.layer, this.zIdx, this.zOrd);
    }
}
export class DecalBarn {
    decalPool = new Pool(Decal);
    decalRenders: DecalRender[] = [];

    allocDecalRender() {
        let decalRender = null;
        for (let i = 0; i < this.decalRenders.length; i++) {
            const d = this.decalRenders[i];
            if (!d.active) {
                decalRender = d;
                break;
            }
        }
        if (!decalRender) {
            decalRender = new DecalRender();
            this.decalRenders.push(decalRender);
        }
        return decalRender;
    }

    m_update(dt: number, camera: Camera, renderer: Renderer) {
        const decals = this.decalPool.m_getPool();
        for (let i = 0; i < decals.length; i++) {
            const decal = decals[i];
            if (decal.active) {
                decal.update(dt);
            }
        }
        for (let i = 0; i < this.decalRenders.length; i++) {
            const decalRender = this.decalRenders[i];
            if (decalRender.active) {
                decalRender.update(dt, camera, renderer);
            }
        }
    }

    m_render(_camera: Camera, _debug: DebugRenderOpts, _layer: number) {}
}
