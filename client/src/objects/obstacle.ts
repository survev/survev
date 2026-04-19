import * as PIXI from "pixi.js-legacy";
import { MapObjectDefs } from "../../../shared/defs/mapObjectDefs";
import type { ObstacleDef } from "../../../shared/defs/mapObjectsTyping";
import type { ObjectData, ObjectType } from "../../../shared/net/objectSerializeFns";
import type { Collider } from "../../../shared/utils/coldet";
import { collider } from "../../../shared/utils/collider";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { AudioManager } from "../audioManager";
import type { Camera } from "../camera";
import type { DebugRenderOpts } from "../config";
import { debugLines } from "../debug/debugLines";
import type { Ctx } from "../game";
import type { Map } from "../map";
import type { Renderer } from "../renderer";
import type { Emitter, ParticleBarn } from "./particles";
import type { AbstractObject, Player, PlayerBarn } from "./player";

interface ObstacleSprite extends PIXI.Sprite {
    zIdx: number;
    zOrd: number;
    imgAlpha: number;
    imgScale: number;
    alpha: number;
    posOffset: Vec2;
}

export class Obstacle implements AbstractObject {
    __id!: number;
    __type!: ObjectType.Obstacle;
    active!: boolean;

    sprite = new PIXI.Sprite() as ObstacleSprite;

    isNew!: boolean;
    smokeEmitter!: Emitter | null;
    img!: string;

    type!: string;
    layer!: number;
    healthT!: number;
    dead!: boolean;
    isSkin!: boolean;

    rot!: number;
    scale!: number;
    pos!: Vec2;
    imgMirrorX!: boolean;
    imgMirrorY!: boolean;

    exploded!: boolean;
    collidable!: boolean;
    destructible!: boolean;
    height!: number;
    isWall!: boolean;
    isWindow!: boolean;
    isBush!: boolean;
    isDoor!: boolean;
    isButton!: boolean;
    isPuzzlePiece!: boolean;
    parentBuildingId!: number;

    button!: {
        interactionRad: number;
        interactionText: string;
        seq: number;
        seqOld: number;
        useItem?: string;
        useId?: number;
        canUse?: boolean;
        onOff?: boolean;
    };

    door!: {
        openOneWay: boolean | number;
        closedPos: Vec2;
        autoOpen: boolean;
        interactionRad: number;
        interpSpeed: number;
        interpPos: Vec2;
        interpRot: number;
        seq: number;
        seqOld: number;
        open: boolean;
        wasOpen: boolean;
        locked: boolean;
        casingSprite: ObstacleSprite | null;
        canUse?: boolean;
    };

    imgScale!: number;
    explodeParticle!: string | string[];
    skinPlayerId!: number;

    // for skin interpolation
    visualPosOld!: Vec2;
    posInterpTicker!: number;

    collider!: Collider;

    constructor() {
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.visible = false;
    }

    m_init() {
        this.isNew = false;
        this.smokeEmitter = null;
        this.sprite.visible = false;
        this.img = "";
        this.visualPosOld = v2.create(0, 0);
    }

    m_free() {
        this.sprite.visible = false;
        this.sprite.parent?.removeChild(this.sprite);
        if (this.door?.casingSprite) {
            this.door.casingSprite.destroy();
            this.door.casingSprite = null;
        }
        if (this.smokeEmitter) {
            this.smokeEmitter.stop();
            this.smokeEmitter = null;
        }
    }

    m_updateData(
        data: ObjectData<ObjectType.Obstacle>,
        fullUpdate: boolean,
        isNew: boolean,
        ctx: Ctx,
    ) {
        if (fullUpdate) {
            this.type = data.type;
            this.layer = data.layer;
            this.healthT = data.healthT;
            this.dead = data.dead;
            this.isSkin = data.isSkin;
            if (this.isSkin) {
                this.skinPlayerId = data.skinPlayerId!;
            }
        }
        const def = MapObjectDefs[this.type] as ObstacleDef;

        if (!v2.eq(data.pos, this.visualPosOld)) {
            this.visualPosOld = v2.copy(isNew ? data.pos : this.pos);
            this.posInterpTicker = 0;
        }

        this.pos = v2.copy(data.pos);
        this.rot = math.oriToRad(data.ori);
        this.scale = data.scale;

        this.imgScale = def.img.scale!;
        this.imgMirrorY = def.img.mirrorY!;
        this.imgMirrorX = def.img.mirrorX!;
        this.collider = collider.transform(def.collision, this.pos, this.rot, this.scale);
        if (isNew) {
            this.isNew = true;
            this.exploded = ctx.map.deadObstacleIds.includes(this.__id);
            this.explodeParticle = def.explodeParticle;
            this.collidable = def.collidable && !this.isSkin;
            this.destructible = def.destructible;
            this.height = def.height;
            this.isWall = !!def.isWall;
            this.isWindow = !!def.isWindow;
            this.isBush = !!def.isBush;
            this.isDoor = def.door !== undefined;
            if (this.isDoor) {
                this.door = {
                    openOneWay: def.door?.openOneWay!,
                    closedPos: v2.copy(data.pos),
                    autoOpen: def.door?.autoOpen!,
                    interactionRad: def.door?.interactionRad!,
                    interpSpeed: def.door?.openSpeed!,
                    interpPos: v2.copy(data.pos),
                    interpRot: math.oriToRad(data.ori),
                    seq: data.door?.seq!,
                    seqOld: data.door?.seq!,
                    open: data.door?.open!,
                    wasOpen: data.door?.open!,
                    locked: data.door?.locked!,
                    casingSprite: null,
                };
                const casingImgDef = def.door?.casingImg;
                if (casingImgDef !== undefined) {
                    let posOffset = casingImgDef.pos || v2.create(0, 0);
                    posOffset = v2.rotate(posOffset, this.rot + Math.PI * 0.5);
                    const sprite = new PIXI.Sprite() as ObstacleSprite;
                    sprite.texture = PIXI.Texture.from(casingImgDef.sprite);
                    sprite.anchor.set(0.5, 0.5);
                    sprite.posOffset = posOffset;
                    sprite.imgScale = casingImgDef.scale;
                    sprite.tint = casingImgDef.tint;
                    sprite.alpha = casingImgDef.alpha;
                    sprite.visible = true;
                    this.door.casingSprite = sprite;
                }
            }
            this.isButton = def.button !== undefined;
            if (this.isButton) {
                this.button = {
                    interactionRad: def.button?.interactionRad!,
                    interactionText: def.button?.interactionText || "game-use",
                    seq: data.button?.seq!,
                    seqOld: data.button?.seq!,
                };
            }
            this.isPuzzlePiece = data.isPuzzlePiece;
            this.parentBuildingId = this.isPuzzlePiece ? data.parentBuildingId! : 0;
        }
        if (this.isDoor && fullUpdate) {
            this.door.canUse = data.door?.canUse;
            this.door.open = data.door?.open!;
            this.door.seq = data.door?.seq!;
            const u = v2.rotate(
                v2.create(def.door?.slideOffset!, 0),
                this.rot + Math.PI * 0.5,
            );
            this.door.closedPos = data.door?.open
                ? v2.add(data.pos, u)
                : v2.copy(data.pos);
        }
        if (this.isButton && fullUpdate) {
            this.button.onOff = data.button?.onOff;
            this.button.canUse = data.button?.canUse;
            this.button.seq = data.button?.seq!;
        }
        if (
            def.explosion !== undefined &&
            !this.smokeEmitter &&
            data.healthT < 0.5 &&
            !data.dead
        ) {
            const g = v2.normalize(v2.create(1, 1));
            this.smokeEmitter = ctx.particleBarn.addEmitter("smoke_barrel", {
                pos: this.pos,
                dir: g,
                layer: this.layer,
            });
        }
        let y = false;
        let w = this.dead ? def.img.residue! : def.img.sprite!;
        if (this.isButton && this.button.onOff && !this.dead && def.button?.useImg) {
            w = def.button.useImg;
        } else if (this.isButton && !this.button.canUse && def.button?.offImg) {
            w = def.button.offImg;
        }
        if (w != this.img) {
            let f = v2.create(0.5, 0.5);
            if (this.isDoor) {
                f = def.door?.spriteAnchor!;
            }
            const _ = w !== undefined;
            if (!_) {
                this.sprite.parent?.removeChild(this.sprite);
            }
            if (_) {
                this.sprite.texture =
                    w == "none" || !w ? PIXI.Texture.EMPTY : PIXI.Texture.from(w);
                this.sprite.anchor.set(f.x, f.y);
                this.sprite.tint = def.img.tint!;
                this.sprite.imgAlpha = this.dead ? 0.75 : def.img.alpha!;
                this.sprite.zOrd = def.img.zIdx!;
                this.sprite.zIdx = Math.floor(this.scale * 1000) * 65535 + this.__id;
                this.sprite.alpha = this.sprite.imgAlpha;
                y = true;
            }
            this.sprite.visible = _;
            this.img = w;
        }
        const b = ctx.map.getMapDef().biome.valueAdjust;
        if (y && b < 1) {
            this.sprite.tint = util.adjustValue(this.sprite.tint as number, b);
        }
    }

    getInteraction() {
        if (this.isButton && this.button.canUse) {
            return {
                rad: this.button.interactionRad,
                action: this.button.interactionText,
                object: `game-${this.type}`,
            };
        }
        if (this.isDoor && this.door.canUse && !this.door.autoOpen) {
            return {
                rad: this.door.interactionRad,
                action: this.door.open ? "game-close-door" : "game-open-door",
                object: "",
            };
        }
        return null;
    }

    update(
        dt: number,
        map: Map,
        playerBarn: PlayerBarn,
        particleBarn: ParticleBarn,
        audioManager: AudioManager,
        activePlayer: Player,
        renderer: Renderer,
    ) {
        if (this.isButton) {
            const button = this.button;
            if (button.seq != button.seqOld) {
                const def = MapObjectDefs[this.type] as ObstacleDef;
                if (def.button?.useParticle) {
                    const aabb = collider.toAabb(this.collider);
                    const extent = v2.mul(v2.sub(aabb.max, aabb.min), 0.5);
                    const center = v2.add(aabb.min, extent);
                    const vel = v2.mul(v2.randomUnit(), util.random(5, 15));
                    particleBarn.addParticle(
                        def.button.useParticle,
                        this.layer,
                        center,
                        vel,
                    );
                }
                const sound = this.button.onOff
                    ? def.button?.sound.on
                    : def.button?.sound.off;
                if (sound) {
                    audioManager.playSound(sound, {
                        channel: "sfx",
                        soundPos: this.pos,
                        layer: this.layer,
                        filter: "muffled",
                    });
                }
            }
            button.seqOld = button.seq;
        }

        // Door
        if (this.isDoor) {
            const door = this.door;

            // Interpolate position
            const moveSpd = door.interpSpeed;
            const posDiff = v2.sub(this.pos, door.interpPos);
            const diffLen = v2.length(posDiff);
            let posMove = moveSpd * dt;
            if (diffLen < posMove) {
                posMove = diffLen;
            }
            const moveDir = diffLen > 0.0001 ? v2.div(posDiff, diffLen) : v2.create(1, 0);
            door.interpPos = v2.add(door.interpPos, v2.mul(moveDir, posMove));

            // Interpolate rotation
            const rotSpd = Math.PI * door.interpSpeed;
            const angDiff = math.angleDiff(door.interpRot, this.rot);
            let angMove = math.sign(angDiff) * rotSpd * dt;
            if (Math.abs(angDiff) < Math.abs(angMove)) {
                angMove = angDiff;
            }
            door.interpRot += angMove;

            // Door begin state change sound
            if (door.seq != door.seqOld) {
                const def = MapObjectDefs[this.type] as ObstacleDef;
                const sound = def.door?.sound.change || "";
                if (sound != "") {
                    audioManager.playSound(sound, {
                        channel: "sfx",
                        soundPos: this.pos,
                        layer: this.layer,
                        filter: "muffled",
                    });
                }
                door.seqOld = door.seq;
            }

            // Open/close sounds
            if (door.open != door.wasOpen) {
                const C = MapObjectDefs[this.type] as ObstacleDef;
                const A = door.open ? C.door?.sound.open! : C.door?.sound.close!;
                audioManager.playSound(A, {
                    channel: "sfx",
                    soundPos: this.pos,
                    layer: this.layer,
                    filter: "muffled",
                });
                door.wasOpen = door.open;
            }
        }
        if (
            this.dead &&
            !this.exploded &&
            (map.deadObstacleIds.push(this.__id),
            (this.exploded = true),
            this.smokeEmitter && (this.smokeEmitter.stop(), (this.smokeEmitter = null)),
            !this.isNew)
        ) {
            const def = MapObjectDefs[this.type] as ObstacleDef;

            // Destroy effect
            const aabb = collider.toAabb(this.collider);
            const extent = v2.mul(v2.sub(aabb.max, aabb.min), 0.5);
            const center = v2.add(aabb.min, extent);
            const numParticles = Math.floor(util.random(5, 11));
            for (let i = 0; i < numParticles; i++) {
                const vel = v2.mul(v2.randomUnit(), util.random(5, 15));
                const particle = Array.isArray(this.explodeParticle)
                    ? this.explodeParticle[
                          Math.floor(Math.random() * this.explodeParticle.length)
                      ]
                    : this.explodeParticle;
                particleBarn.addParticle(particle, this.layer, center, vel);
            }
            audioManager.playSound(def.sound?.explode!, {
                channel: "sfx",
                soundPos: center,
                layer: this.layer,
                filter: "muffled",
            });
        }

        if (this.smokeEmitter) {
            const healthT = this.isSkin ? 0.3 : 0.5;

            this.smokeEmitter.pos = v2.copy(this.pos);
            this.smokeEmitter.enabled = !this.dead && this.healthT < healthT;
        }

        if (this.sprite.visible && this.img) {
            let zOrd = this.dead ? 5 : this.sprite.zOrd;
            let zIdx = this.sprite.zIdx;
            let layer = this.layer;

            // Render trees, bushes, etc above stair elements when
            // viewing only the ground level
            if (!this.dead && zOrd >= 50 && this.layer == 0 && activePlayer.layer == 0) {
                zOrd += 100;
                layer |= 2;
            }

            if (!this.dead && this.isSkin) {
                const skinPlayer = playerBarn.getPlayerById(this.skinPlayerId);
                if (skinPlayer) {
                    zOrd = math.max(math.max(zOrd, skinPlayer.renderZOrd), 21);
                    if (skinPlayer.renderLayer != 0) {
                        layer = skinPlayer.renderLayer;
                        zOrd = skinPlayer.renderZOrd;
                    }
                    zIdx = skinPlayer.renderZIdx + 262144;
                }
            }

            renderer.addPIXIObj(this.sprite, layer, zOrd, zIdx);

            if (this.isDoor && this.door.casingSprite) {
                renderer.addPIXIObj(this.door.casingSprite, layer, zOrd + 1, zIdx);
            }
        }
        this.isNew = false;
    }

    render(dt: number, camera: Camera, debug: DebugRenderOpts, layer: number) {
        let pos = this.isDoor ? this.door.interpPos : this.pos;

        if (this.isSkin && camera.m_interpEnabled) {
            this.posInterpTicker += dt;
            const posT = math.clamp(this.posInterpTicker / camera.m_interpInterval, 0, 1);
            pos = v2.lerp(posT, this.visualPosOld, this.pos);
        }

        const rot = this.isDoor ? this.door.interpRot : this.rot;
        const scale = this.scale;

        const screenPos = camera.m_pointToScreen(pos);
        const screenScale = camera.m_pixels(scale * this.imgScale);

        this.sprite.position.set(screenPos.x, screenPos.y);
        this.sprite.scale.set(screenScale, screenScale);
        if (this.imgMirrorY) {
            this.sprite.scale.y *= -1;
        }
        if (this.imgMirrorX) {
            this.sprite.scale.x *= -1;
        }
        this.sprite.rotation = -rot;

        if (this.isDoor && this.door?.casingSprite) {
            const casingPos = camera.m_pointToScreen(
                v2.add(this.door.closedPos, this.door.casingSprite.posOffset),
            );
            const casingScale = camera.m_pixels(scale * this.door.casingSprite.imgScale);
            this.door.casingSprite.position.set(casingPos.x, casingPos.y);
            this.door.casingSprite.scale.set(casingScale, casingScale);
            this.door.casingSprite.rotation = -rot;
            this.door.casingSprite.visible = !this.dead;
        }

        if (IS_DEV && debug.obstacles && util.sameLayer(layer, this.layer)) {
            const def = MapObjectDefs[this.type] as ObstacleDef;

            const color = def.collidable ? 0xff0000 : 0xffff00;
            debugLines.addCollider(this.collider, color, 0.1);
        }
    }
}
