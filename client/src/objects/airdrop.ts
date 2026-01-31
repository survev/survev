import * as PIXI from "pixi.js-legacy";
import { GameConfig } from "../../../shared/gameConfig";
import type { ObjectData, ObjectType } from "../../../shared/net/objectSerializeFns";
import { collider } from "../../../shared/utils/collider";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { AudioManager } from "../audioManager";
import type { Camera } from "../camera";
import type { Ctx } from "../game";
import type { SoundHandle } from "../lib/createJS";
import type { Map } from "../map";
import type { Renderer } from "../renderer";
import { Pool } from "./objectPool";
import type { ParticleBarn } from "./particles";
import type { AbstractObject, Player } from "./player";

class AirDrop implements AbstractObject {
    __id!: number;
    __type!: ObjectType.Airdrop;
    active!: boolean;

    sprite = new PIXI.Sprite();

    playedLandFx!: boolean;
    landed!: boolean;
    fallInstance!: SoundHandle | null;
    chuteDeployed!: boolean;
    soundUpdateThrottle!: number;
    pos!: Vec2;
    isNew!: boolean;
    fallTicker!: number;
    rad!: number;

    constructor() {
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.visible = false;
    }

    m_init() {
        this.playedLandFx = false;
        this.landed = false;
        this.fallInstance = null;
        this.chuteDeployed = false;
        this.soundUpdateThrottle = 0;
        this.pos = v2.create(0, 0);
        this.isNew = false;
        this.fallTicker = 0;
    }

    m_free() {
        this.fallInstance?.stop();
        this.fallInstance = null;
        this.sprite.visible = false;
    }

    m_updateData(
        data: ObjectData<ObjectType.Airdrop>,
        fullUpdate: boolean,
        isNew: boolean,
        ctx: Ctx,
    ) {
        if (isNew) {
            this.isNew = true;
            this.fallTicker = data.fallT * GameConfig.airdrop.fallTime;
            const img = ctx.map.getMapDef().biome.airdrop.airdropImg;
            this.sprite.texture = PIXI.Texture.from(img);
        }
        if (fullUpdate) {
            this.pos = v2.copy(data.pos);
        }
        this.landed = data.landed;
    }
}
export class AirdropBarn {
    m_airdropPool = new Pool(AirDrop);

    m_free() {
        const airdrops = this.m_airdropPool.m_getPool();
        for (let i = 0; i < airdrops.length; i++) {
            airdrops[i].m_free();
        }
    }

    m_update(
        dt: number,
        activePlayer: Player,
        camera: Camera,
        map: Map,
        particleBarn: ParticleBarn,
        renderer: Renderer,
        audioManager: AudioManager,
    ) {
        const airdrops = this.m_airdropPool.m_getPool();
        for (let i = 0; i < airdrops.length; i++) {
            const airdrop = airdrops[i];
            if (!airdrop.active) {
                continue;
            }

            airdrop.fallTicker += dt;
            const fallT = math.clamp(
                airdrop.fallTicker / GameConfig.airdrop.fallTime,
                0.0,
                1.0,
            );

            let layer = 0;
            if (
                (util.sameLayer(layer, activePlayer.layer) || activePlayer.layer & 0x2) &&
                (!(activePlayer.layer & 0x2) ||
                    !map.insideStructureMask(collider.createCircle(airdrop.pos, 1.0)))
            ) {
                layer |= 0x2;
            }

            if (airdrop.landed && !airdrop.playedLandFx) {
                airdrop.playedLandFx = true;

                if (!airdrop.isNew) {
                    // Make some crate particles?
                    for (let j = 0; j < 10; j++) {
                        const vel = v2.randomUnit();
                        particleBarn.addParticle("airdropSmoke", layer, airdrop.pos, vel);
                    }

                    // Water landing effects
                    const surface = map.getGroundSurface(airdrop.pos, layer);
                    if (surface.type == "water") {
                        for (let j = 0; j < 12; j++) {
                            const ripplePos = v2.add(
                                airdrop.pos,
                                v2.mul(v2.randomUnit(), util.random(4.5, 6.0)),
                            );
                            const part = particleBarn.addRippleParticle(
                                ripplePos,
                                layer,
                                surface.data.rippleColor,
                            );
                            part.setDelay(j * 0.075);
                        }
                    }

                    // Play the crate hitting ground sound
                    const crashSound =
                        surface.type == "water" ? "airdrop_crash_02" : "airdrop_crash_01";
                    audioManager.playSound(crashSound, {
                        channel: "sfx",
                        soundPos: airdrop.pos,
                        layer,
                        filter: "muffled",
                    });
                    audioManager.stopSound(airdrop.fallInstance!);
                    airdrop.fallInstance = null;
                }
            }

            // Play airdrop chute and falling sounds once
            if (!airdrop.chuteDeployed && fallT <= 0.1) {
                audioManager.playSound("airdrop_chute_01", {
                    channel: "sfx",
                    soundPos: airdrop.pos,
                    layer,
                    rangeMult: 1.75,
                });
                airdrop.chuteDeployed = true;
            }

            if (!airdrop.landed && !airdrop.fallInstance) {
                airdrop.fallInstance = audioManager.playSound("airdrop_fall_01", {
                    channel: "sfx",
                    soundPos: airdrop.pos,
                    layer,
                    rangeMult: 1.75,
                    ignoreMinAllowable: true,
                    offset: airdrop.fallTicker,
                });
            }

            if (airdrop.fallInstance && airdrop.soundUpdateThrottle < 0.0) {
                airdrop.soundUpdateThrottle = 0.1;
                audioManager.updateSound(airdrop.fallInstance, "sfx", airdrop.pos, {
                    layer,
                    rangeMult: 1.75,
                    ignoreMinAllowable: true,
                });
            } else {
                airdrop.soundUpdateThrottle -= dt;
            }

            airdrop.rad = math.lerp((1.0 - fallT) ** 1.1, 5.0, 12.0);
            renderer.addPIXIObj(airdrop.sprite, layer, 1500, airdrop.__id);

            const screenPos = camera.m_pointToScreen(airdrop.pos);
            const screenScale = camera.m_pixels((2.0 * airdrop.rad) / camera.m_ppu);
            airdrop.sprite.position.set(screenPos.x, screenPos.y);
            airdrop.sprite.scale.set(screenScale, screenScale);
            airdrop.sprite.tint = 0xffff00;
            airdrop.sprite.alpha = 1.0;
            airdrop.sprite.visible = !airdrop.landed;

            airdrop.isNew = false;
        }
    }
}
