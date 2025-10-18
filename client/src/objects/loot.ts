import * as PIXI from "pixi.js-legacy";
import { GameObjectDefs, type LootDef } from "../../../shared/defs/gameObjectDefs";
import type { AmmoDef } from "../../../shared/defs/gameObjects/gearDefs";
import type { GunDef } from "../../../shared/defs/gameObjects/gunDefs";
import type { MeleeDef } from "../../../shared/defs/gameObjects/meleeDefs";
import type { XPDef } from "../../../shared/defs/gameObjects/xpDefs";
import { GameConfig } from "../../../shared/gameConfig";
import type { ObjectData, ObjectType } from "../../../shared/net/objectSerializeFns";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { AudioManager } from "../audioManager";
import type { Camera } from "../camera";
import type { DebugRenderOpts } from "../config";
import { debugLines } from "../debug/debugLines";
import { device } from "../device";
import type { Map } from "../map";
import type { Renderer } from "../renderer";
import { Pool } from "./objectPool";
import type { Emitter, ParticleBarn } from "./particles";
import type { AbstractObject, Player } from "./player";

export class Loot implements AbstractObject {
    __id!: number;
    __type!: ObjectType.Loot;
    active!: boolean;

    ticker = 0;
    playDropSfx = false;
    container = new PIXI.Sprite();
    sprite = new PIXI.Sprite();
    emitter: Emitter | null = null;

    updatedData!: boolean;
    pos!: Vec2;
    visualPosOld!: Vec2;
    posInterpTicker!: number;
    isOld!: boolean;

    layer!: number;
    type!: string;
    count!: number;
    isPreloadedGun!: boolean;
    ownerId!: number;
    rad!: number;
    imgScale!: number;

    constructor() {
        this.container.anchor.set(0.5, 0.5);
        this.container.scale.set(1, 1);
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.scale.set(0.8, 0.8);
        this.container.addChild(this.sprite);
    }

    m_init() {
        this.updatedData = false;
        this.visualPosOld = v2.create(0, 0);
    }

    m_free() {
        this.container.visible = false;
        if (this.emitter) {
            this.emitter.stop();
            this.emitter = null;
        }
    }

    m_updateData(
        data: ObjectData<ObjectType.Loot>,
        fullUpdate: boolean,
        isNew: boolean,
        ctx: {
            map: Map;
            renderer: Renderer;
            particleBarn: ParticleBarn;
        },
    ) {
        this.updatedData = true;

        if (!v2.eq(data.pos, this.visualPosOld)) {
            this.visualPosOld = v2.copy(isNew ? data.pos : this.pos);
            this.posInterpTicker = 0;
        }
        this.pos = v2.copy(data.pos);

        if (fullUpdate) {
            this.layer = data.layer;
            this.type = data.type;
            this.count = data.count;
            this.isOld = data.isOld;
            this.isPreloadedGun = data.isPreloadedGun;
            this.ownerId = data.hasOwner ? data.ownerId : 0;
        }

        if (isNew) {
            const itemDef = GameObjectDefs[this.type] as LootDef;
            this.ticker = 0;

            // Don't play the pop-in effect if this is an old piece of loot
            if (this.isOld) {
                this.ticker = 10;
            }

            if (
                !this.isOld &&
                (itemDef as XPDef).sound.drop &&
                !ctx.map.lootDropSfxIds.includes(this.__id)
            ) {
                this.playDropSfx = true;
            }

            this.rad =
                GameConfig.lootRadius[itemDef.type as keyof typeof GameConfig.lootRadius];
            this.imgScale = itemDef.lootImg?.scale * 1.25;

            const innerScale =
                (itemDef as { lootImg: { innerScale?: number } }).lootImg.innerScale ||
                0.8;
            this.sprite.scale.set(innerScale, innerScale);
            this.sprite.texture = PIXI.Texture.from(itemDef.lootImg?.sprite);
            this.sprite.tint = itemDef.lootImg?.tint;
            this.container.texture = itemDef.lootImg.border
                ? PIXI.Texture.from(itemDef.lootImg.border)
                : PIXI.Texture.EMPTY;
            if (this.isPreloadedGun) {
                this.container.texture = PIXI.Texture.from("loot-circle-outer-06.img");
            }
            const ammo = GameObjectDefs[(itemDef as GunDef).ammo] as AmmoDef;
            if (ammo) {
                this.container.tint = ammo.lootImg.tintDark!;
            } else if (itemDef.lootImg.borderTint) {
                this.container.tint = itemDef.lootImg.borderTint;
            } else {
                this.container.tint = 0;
            }

            if (itemDef.type == "xp" && itemDef.emitter) {
                this.emitter = ctx.particleBarn.addEmitter(itemDef.emitter, {
                    pos: this.pos,
                    layer: this.layer,
                });
            }

            this.sprite.rotation = (itemDef as MeleeDef)?.lootImg?.rot
                ? (itemDef as MeleeDef).lootImg.rot!
                : 0;
            this.sprite.scale.x = (itemDef as MeleeDef).lootImg.mirror
                ? -innerScale
                : innerScale;

            this.container.visible = true;
        }

        if (isNew || fullUpdate) {
            // Loot can change layers during a fullUpdate.
            // Should probably just readd it every frame.
            ctx.renderer.addPIXIObj(this.container, this.layer, 13, this.__id);
        }
    }
}

export class LootBarn {
    lootPool = new Pool(Loot);
    closestLoot: Loot | null = null;

    m_update(
        dt: number,
        activePlayer: Player,
        map: Map,
        audioManager: AudioManager,
        camera: Camera,
        debug: DebugRenderOpts,
    ) {
        this.closestLoot = null;
        let closestDist = Number.MAX_VALUE;
        const loots = this.lootPool.m_getPool();
        for (let i = 0; i < loots.length; i++) {
            const loot = loots[i];
            if (loot.active) {
                if (
                    util.sameLayer(loot.layer, activePlayer.layer) &&
                    !activePlayer.m_netData.m_dead &&
                    (loot.ownerId == 0 || loot.ownerId == activePlayer.__id)
                ) {
                    const pos = loot.pos;
                    const rad = device.touch
                        ? activePlayer.m_rad +
                          loot.rad * GameConfig.player.touchLootRadMult
                        : loot.rad;
                    const toPlayer = v2.sub(activePlayer.m_pos, pos);
                    const distSq = v2.lengthSqr(toPlayer);
                    if (distSq < rad * rad && distSq < closestDist) {
                        closestDist = distSq;
                        this.closestLoot = loot;
                    }
                }

                loot.ticker += dt;

                // Drop sound
                if (loot.playDropSfx) {
                    map.lootDropSfxIds.push(loot.__id);
                    loot.playDropSfx = false;
                    const itemDef = GameObjectDefs[loot.type];
                    audioManager.playSound((itemDef as XPDef).sound?.drop, {
                        channel: "sfx",
                        soundPos: loot.pos,
                        layer: loot.layer,
                        filter: "muffled",
                    });
                }

                // Passive particle effect
                if (loot.emitter) {
                    loot.emitter.pos = v2.add(loot.pos, v2.create(0, 0.1));
                    loot.emitter.layer = loot.layer;
                }

                const scaleIn = math.delerp(loot.ticker, 0, 1);
                const scale = math.easeOutElastic(scaleIn, 0.75);
                let pos = loot.pos;
                if (camera.m_interpEnabled) {
                    loot.posInterpTicker += dt;
                    const posT = math.clamp(
                        loot.posInterpTicker / camera.m_interpInterval,
                        0,
                        1,
                    );
                    pos = v2.lerp(posT, loot.visualPosOld, loot.pos);
                }
                const screenPos = camera.m_pointToScreen(pos);
                const screenScale = camera.m_pixels(loot.imgScale * scale);

                loot.container.position.set(screenPos.x, screenPos.y);
                loot.container.scale.set(screenScale, screenScale);

                if (IS_DEV && debug.loot && activePlayer.layer === loot.layer) {
                    debugLines.addCircle(loot.pos, loot.rad, 0xff0000, 0);
                }
            }
        }
    }

    getClosestLoot() {
        return this.closestLoot;
    }
}
