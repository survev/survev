import * as PIXI from "pixi.js-legacy";
import { GameObjectDefs, type LootDef } from "../../../shared/defs/gameObjectDefs";
import type {
    BackpackDef,
    BoostDef,
    ChestDef,
    HealDef,
    HelmetDef,
} from "./../../../shared/defs/gameObjects/gearDefs";
import type { GunDef } from "../../../shared/defs/gameObjects/gunDefs";
import type { MeleeDef } from "../../../shared/defs/gameObjects/meleeDefs";
import type { OutfitDef } from "../../../shared/defs/gameObjects/outfitDefs";
import type { RoleDef } from "../../../shared/defs/gameObjects/roleDefs";
import type { ThrowableDef } from "../../../shared/defs/gameObjects/throwableDefs";
import { MapObjectDefs } from "../../../shared/defs/mapObjectDefs";
import type { ObstacleDef } from "../../../shared/defs/mapObjectsTyping";
import {
    Action,
    Anim,
    GameConfig,
    HasteType,
    Input,
    type WeaponSlot,
} from "../../../shared/gameConfig";
import type { ObjectData, ObjectType } from "../../../shared/net/objectSerializeFns";
import {
    type GroupStatus,
    getPlayerStatusUpdateRate,
    type LocalDataWithDirty,
    type PlayerInfo,
    type PlayerStatus,
} from "../../../shared/net/updateMsg";
import { coldet } from "../../../shared/utils/coldet";
import { collider } from "../../../shared/utils/collider";
import { collisionHelpers } from "../../../shared/utils/collisionHelpers";
import { math } from "../../../shared/utils/math";
import type { River } from "../../../shared/utils/river";
import { util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import { Animations, Bones, IdlePoses, Pose } from "../animData";
import type { AudioManager } from "../audioManager";
import type { Camera } from "../camera";
import type { DebugRenderOpts } from "../config";
import { debugLines } from "../debug/debugLines";
import { device } from "../device";
import { errorLogManager } from "../errorLogs";
import type { Ctx } from "../game";
import { helpers } from "../helpers";
import type { InputHandler } from "../input";
import type { InputBinds } from "./../inputBinds";
import type { SoundHandle } from "../lib/createJS";
import type { Map } from "../map";
import type { Renderer } from "../renderer";
import type { UiManager2 } from "../ui/ui2";
import { Pool } from "./objectPool";
import type { Obstacle } from "./obstacle";
import type { Emitter, ParticleBarn } from "./particles";
import { halloweenSpriteMap } from "./projectile";
import { createCasingParticle } from "./shot";

const submergeMaskScaleFactor = 0.1;

function perksEqual(a: Array<{ type: string }>, b: Array<{ type: string }>) {
    if (a.length != b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i].type != b[i].type) {
            return false;
        }
    }
    return true;
}
function createPlayerNameText() {
    const nameStyle = {
        fontFamily: "Arial",
        fontWeight: "bold",
        fontSize: device.pixelRatio > 1 ? 30 : 22,
        align: "center",
        fill: 65535,
        stroke: 0,
        strokeThickness: 0,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 1,
        dropShadowAngle: Math.PI / 3,
        dropShadowDistance: 1,
    } satisfies Partial<PIXI.ITextStyle>;
    const nameText = new PIXI.Text("", nameStyle);
    nameText.anchor.set(0.5, 0.5);
    nameText.scale.set(0.5, 0.5);
    nameText.position.set(0, 30);
    nameText.visible = false;
    return nameText;
}

function createSprite() {
    const sprite = new PIXI.Sprite();
    sprite.texture = PIXI.Texture.EMPTY;
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(1, 1);
    sprite.tint = 0xffffff;
    sprite.visible = false;
    return sprite;
}

const desktopZoomRads = Object.values(GameConfig.scopeZoomRadius.desktop);
const mobileZoomRads = Object.values(GameConfig.scopeZoomRadius.mobile);

class Gun {
    gunBarrel = createSprite();
    gunMag = createSprite();

    container = new PIXI.Container();
    magTop = false;

    constructor() {
        this.container.addChild(this.gunBarrel);
        this.container.addChild(this.gunMag);
        this.container.rotation = Math.PI * 0.5;
        this.container.visible = false;
    }

    setVisible(vis: boolean) {
        this.container.visible = vis;
    }

    setType(type: string, t: number) {
        const gunDef = GameObjectDefs[type] as GunDef;
        const imgDef = gunDef.worldImg;
        this.gunBarrel.texture = PIXI.Texture.from(imgDef.sprite);
        this.gunBarrel.anchor.set(0.5, 1);
        this.gunBarrel.position.set(0, 0);
        this.gunBarrel.scale.set((imgDef.scale.x * 0.5) / t, (imgDef.scale.y * 0.5) / t);

        this.gunBarrel.tint = imgDef.tint;
        this.gunBarrel.visible = true;
        if (imgDef.magImg) {
            const magDef = imgDef.magImg;
            this.gunMag.texture = PIXI.Texture.from(magDef.sprite);
            this.gunMag.anchor.set(0.5, 0.5);
            this.gunMag.position.set(magDef.pos.x / t, magDef.pos.y / t);
            this.gunMag.scale.set(0.25 / t, 0.25 / t);
            this.gunMag.tint = 0xffffff;
            this.gunMag.visible = true;
            if (magDef.top) {
                this.container.addChild(this.gunMag);
            } else {
                this.container.addChildAt(this.gunMag, 0);
            }
        } else {
            this.gunMag.visible = false;
        }

        this.magTop = imgDef.magImg?.top!;

        const handOffset = gunDef.isDual ? v2.create(-5.95, 0) : v2.create(-4.25, -1.75);
        if (imgDef.gunOffset) {
            handOffset.x += imgDef.gunOffset.x;
            handOffset.y += imgDef.gunOffset.y;
        }
        this.container.position.set(handOffset.x, handOffset.y);
    }
}

export interface AnimCtx {
    playerBarn: PlayerBarn;
    map: Map;
    audioManager: AudioManager;
    particleBarn: ParticleBarn;
}

export abstract class AbstractObject {
    abstract __id: number;
    abstract __type: ObjectType;
    abstract active: boolean;

    abstract m_init(): void;
    abstract m_free(): void;
    abstract m_updateData(
        data: ObjectData<ObjectType>,
        fullUpdate: boolean,
        isNew: boolean,
        ctx: Ctx,
    ): void;
}

export class Player implements AbstractObject {
    __id!: number;
    __type!: ObjectType.Player;
    active!: boolean;

    bodySprite = createSprite();
    chestSprite = createSprite();
    flakSprite = createSprite();
    steelskinSprite = createSprite();
    helmetSprite = createSprite();
    visorSprite = createSprite();
    backpackSprite = createSprite();
    handLSprite = createSprite();
    handRSprite = createSprite();
    footLSprite = createSprite();
    footRSprite = createSprite();
    hipSprite = createSprite();
    gunLSprites = new Gun();
    gunRSprites = new Gun();
    objectLSprite = createSprite();
    objectRSprite = createSprite();
    meleeSprite = createSprite();
    bodySubmergeSprite = createSprite();
    handLSubmergeSprite = createSprite();
    handRSubmergeSprite = createSprite();
    footLSubmergeSprite = createSprite();
    footRSubmergeSprite = createSprite();
    bodyEffectSprite = createSprite();
    patchSprite = createSprite();
    handLContainer = new PIXI.Container();
    handRContainer = new PIXI.Container();

    footLContainer = new PIXI.Container();
    footRContainer = new PIXI.Container();

    bodyContainer = new PIXI.Container();

    container = new PIXI.Container();
    nameText = createPlayerNameText();
    auraContainer = new PIXI.Container();
    auraCircle = createSprite();

    // Anim
    bones: Pose[] = [];
    anim = {
        type: Anim.None,
        data: {} as {
            type: string;
            mirror: boolean;
        },
        seq: -1,
        ticker: 0,
        bones: [] as Array<{
            weight: number;
            pose: Pose;
        }>,
    };

    perks: Array<{
        type: string;
        droppable: boolean;
        isNew: boolean;
    }> = [];

    // Maintain a list of just the perk types as a hasPerk() optimization
    perkTypes: string[] = [];
    perksDirty = false;
    surface: {
        type: string;
        data: {
            river?: River;
            waterColor?: number;
            isBright?: boolean;
            rippleColor?: number;
        };
    } | null = null;

    wasInWater = false;
    weapTypeOld = "";
    visualsDirty = false;
    stepDistance = 0;
    zoomFast = false;
    playedDryFire = false;
    lastSwapIdx = -1;
    hasteSeq = -1;
    cycleSoundInstance: SoundHandle | null = null;
    actionSoundInstance: SoundHandle | null = null;
    useItemEmitter: Emitter | null = null;
    hasteEmitter: Emitter | null = null;
    passiveHealEmitter: Emitter | null = null;
    downed = false;
    wasDowned = false;
    bleedTicker = 0;
    submersion = 0;
    gunRecoilL = 0;
    gunRecoilR = 0;
    fireDelay = 0;

    throwableState = "equip";
    lastThrowablePickupSfxTicker = 0;

    isNearDoorError = false;
    doorErrorTicker = 0;
    noCeilingRevealTicker = 0;
    frozenTicker = 0;
    updateFrozenImage = true;

    viewAabb = {
        min: v2.create(0, 0),
        max: v2.create(0, 0),
    };

    auraViewFade = 0;
    auraPulseTicker = 0;
    auraPulseDir = 1;

    renderLayer = 0;
    renderZOrd = 18;
    renderZIdx = 0;

    m_action!: {
        type: Action;
        seq: number;
        seqOld: number;
        item: string;
        skin: string;
        targetId: number;
        time: number;
        duration: number;
        throttleCount: number;
        throttleTicker: number;
    };

    m_netData!: {
        m_pos: Vec2;
        m_dir: Vec2;
        m_outfit: string;
        m_backpack: string;
        m_helmet: string;
        m_chest: string;
        m_activeWeapon: string;
        m_layer: number;
        m_dead: boolean;
        m_downed: boolean;
        m_animType: Anim;
        m_animSeq: number;
        m_actionType: Action;
        m_actionSeq: number;
        m_wearingPan: boolean;
        m_healEffect: boolean;
        m_frozen: boolean;
        m_frozenOri: number;
        m_hasteType: Exclude<HasteType, HasteType.Count>;
        m_hasteSeq: number;
        m_actionItem: string;
        m_scale: number;
        m_role: string;
        m_perks: Array<{
            type: string;
            droppable: boolean;
        }>;
    };

    m_localData!: {
        m_health: number;
        m_zoom: number;
        m_boost: number;
        m_scope: string;
        m_curWeapIdx: number;
        m_inventory: Record<string, number>;
        m_weapons: Array<{
            type: string;
            ammo: number;
        }>;
        m_spectatorCount: number;
    };

    throwableStatePrev!: string;

    m_rad: number = GameConfig.player.radius;
    m_bodyRad!: number;
    m_pos = v2.create(0, 0);
    m_posOld = v2.create(0, 0);
    m_dir = v2.create(1, 0);
    m_dirOld = v2.create(1, 0);
    m_visualPos = v2.create(0, 0);
    m_visualPosOld = v2.create(0, 0);
    m_visualDir = v2.create(0, 0);
    m_visualDirOld = v2.create(0, 0);
    posInterpTicker = 0;
    dirInterpolationTicker = 0;
    layer = 0;
    isLoadoutAvatar = false;
    playActionStartSfx = true;

    isNew!: boolean;
    wasInsideObstacle!: boolean;
    insideObstacleType!: string;
    lastInsideObstacleTime!: number;
    dead!: boolean;
    gunSwitchCooldown!: number;

    constructor() {
        this.bodySprite.addChild(this.bodySubmergeSprite);
        this.handLSprite.addChild(this.handLSubmergeSprite);
        this.handRSprite.addChild(this.handRSubmergeSprite);
        this.footLSprite.addChild(this.footLSubmergeSprite);
        this.footRSprite.addChild(this.footRSubmergeSprite);

        this.handLContainer.addChild(this.gunLSprites.container);
        this.handLContainer.addChild(this.handLSprite);
        this.handLContainer.addChild(this.objectLSprite);

        this.handRContainer.addChild(this.gunRSprites.container);
        this.handRContainer.addChild(this.meleeSprite);
        this.handRContainer.addChild(this.handRSprite);
        this.handRContainer.addChild(this.objectRSprite);

        this.footLContainer.addChild(this.footLSprite);
        this.footRContainer.addChild(this.footRSprite);

        this.bodyContainer.addChild(this.footLContainer);
        this.bodyContainer.addChild(this.footRContainer);
        this.bodyContainer.addChild(this.backpackSprite);
        this.bodyContainer.addChild(this.bodySprite);
        this.bodyContainer.addChild(this.chestSprite);
        this.bodyContainer.addChild(this.flakSprite);
        this.bodyContainer.addChild(this.steelskinSprite);
        this.bodyContainer.addChild(this.hipSprite);
        this.bodyContainer.addChild(this.patchSprite);
        this.bodyContainer.addChild(this.bodyEffectSprite);
        this.bodyContainer.addChild(this.handLContainer);
        this.bodyContainer.addChild(this.handRContainer);
        this.bodyContainer.addChild(this.visorSprite);
        this.bodyContainer.addChild(this.helmetSprite);

        this.container.addChild(this.bodyContainer);

        this.container.addChild(this.nameText);

        this.auraContainer.addChild(this.auraCircle);

        this.initSubmergeSprites();

        const boneCount = Object.keys(Bones).length;
        for (let i = 0; i < boneCount; i++) {
            this.bones.push(new Pose());
            this.anim.bones.push({
                weight: 0,
                pose: new Pose(),
            });
        }

        this.throwableStatePrev = this.throwableState;
        this.m_bodyRad = this.m_rad;

        this.m_visualPos = v2.create(0, 0);
        this.m_visualPosOld = v2.create(0, 0);
        this.m_visualDir = v2.create(0, 0);
        this.m_visualDirOld = v2.create(0, 0);
        this.posInterpTicker = 0;
        this.dirInterpolationTicker = 0;
    }

    m_init() {
        this.isNew = false;
        this.wasInsideObstacle = false;
        this.insideObstacleType = "";
        this.lastInsideObstacleTime = 0;
        this.lastSwapIdx = -1;
        this.hasteSeq = -1;
        this.actionSoundInstance = null;

        this.m_action = {
            type: Action.None,
            seq: -1,
            seqOld: -1,
            item: "",
            skin: "",
            targetId: 0,
            time: 0,
            duration: 0,
            throttleCount: 0,
            throttleTicker: 0,
        };

        this.m_netData = {
            m_pos: v2.create(0, 0),
            m_dir: v2.create(1, 0),
            m_outfit: "",
            m_backpack: "",
            m_helmet: "",
            m_chest: "",
            m_activeWeapon: "fists",
            m_layer: 0,
            m_dead: false,
            m_downed: false,
            m_animType: Anim.None,
            m_animSeq: 0,
            m_actionType: Action.None,
            m_actionSeq: 0,
            m_wearingPan: false,
            m_healEffect: false,
            m_frozen: false,
            m_frozenOri: 0,
            m_hasteType: HasteType.None,
            m_hasteSeq: 0,
            m_actionItem: "",
            m_scale: 1,
            m_role: "",
            m_perks: [],
        };

        this.m_localData = {
            m_health: GameConfig.player.health,
            m_zoom: 0,
            m_boost: 0,
            m_scope: "",
            m_curWeapIdx: 0,
            m_inventory: {},
            m_weapons: [],
            m_spectatorCount: 0,
        };

        this.playAnim(Anim.None, -1);
    }

    m_free() {
        this.container.visible = false;
        this.auraContainer.visible = false;
        if (this.useItemEmitter) {
            this.useItemEmitter.stop();
            this.useItemEmitter = null;
        }
        if (this.hasteEmitter) {
            this.hasteEmitter.stop();
            this.hasteEmitter = null;
        }
        if (this.passiveHealEmitter) {
            this.passiveHealEmitter.stop();
            this.passiveHealEmitter = null;
        }
    }

    m_updateData(
        data: ObjectData<ObjectType.Player>,
        fullUpdate: boolean,
        isNew: boolean,
        _ctx: Ctx,
    ) {
        if (!v2.eq(data.pos, this.m_visualPosOld)) {
            this.m_visualPosOld = v2.copy(isNew ? data.pos : this.m_pos);
            this.posInterpTicker = 0;
        }
        if (!v2.eq(data.dir, this.m_visualDirOld)) {
            this.m_visualDirOld = v2.copy(isNew ? data.dir : this.m_dir);
            this.dirInterpolationTicker = 0;
        }

        this.m_netData.m_pos = v2.copy(data.pos);
        this.m_netData.m_dir = v2.copy(data.dir);

        if (fullUpdate) {
            this.m_netData.m_outfit = data.outfit;
            this.m_netData.m_backpack = data.backpack;
            this.m_netData.m_helmet = data.helmet;
            this.m_netData.m_chest = data.chest;
            this.m_netData.m_activeWeapon = data.activeWeapon;
            this.m_netData.m_layer = data.layer;
            this.m_netData.m_dead = data.dead;
            this.m_netData.m_downed = data.downed;
            this.m_netData.m_animType = data.animType;
            this.m_netData.m_animSeq = data.animSeq;
            this.m_netData.m_actionType = data.actionType;
            this.m_netData.m_actionSeq = data.actionSeq;
            this.m_netData.m_wearingPan = data.wearingPan;
            this.m_netData.m_healEffect = data.healEffect;
            this.m_netData.m_frozen = data.frozen;
            this.m_netData.m_frozenOri = data.frozenOri;
            this.m_netData.m_hasteType = data.hasteType;
            this.m_netData.m_hasteSeq = data.hasteSeq;
            this.m_netData.m_actionItem = data.actionItem;
            this.m_netData.m_scale = data.scale;
            this.m_netData.m_role = data.role;

            if (!!isNew || !perksEqual(this.m_netData.m_perks, data.perks)) {
                this.perksDirty = true;
            }

            this.m_netData.m_perks = data.perks;
            if (data.animSeq != this.anim.seq) {
                this.playAnim(data.animType, data.animSeq);
            }
            this.m_action.type = data.actionType;
            this.m_action.seq = data.actionSeq;
            this.m_action.item = data.actionItem;
            this.visualsDirty = true;
        }

        if (isNew) {
            this.isNew = true;
            this.renderLayer = this.m_netData.m_layer;
            this.renderZOrd = 18;
            this.renderZIdx = this.__id;
        }
    }

    m_setLocalData(data: LocalDataWithDirty) {
        const scopeOld = this.m_localData.m_scope;

        if (data.healthDirty) {
            this.m_localData.m_health = data.health;
        }

        if (data.boostDirty) {
            this.m_localData.m_boost = data.boost;
        }

        if (data.zoomDirty) {
            this.m_localData.m_zoom = data.zoom;
            this.zoomFast = false;
        }

        if (data.actionDirty) {
            this.m_action.time = data.action.time;
            this.m_action.duration = data.action.duration;
            this.m_action.targetId = data.action.targetId;
        }

        if (data.inventoryDirty) {
            this.m_localData.m_scope = data.scope;
            this.m_localData.m_inventory = {};
            for (const item in GameConfig.bagSizes) {
                if (GameConfig.bagSizes.hasOwnProperty(item)) {
                    this.m_localData.m_inventory[item] = data.inventory[item];
                }
            }
        }
        if (data.weapsDirty) {
            this.m_localData.m_curWeapIdx = data.curWeapIdx;
            this.m_localData.m_weapons = [];
            for (let i = 0; i < GameConfig.WeaponSlot.Count; i++) {
                const w = {
                    type: data.weapons[i].type,
                    ammo: data.weapons[i].ammo,
                };
                this.m_localData.m_weapons.push(w);
            }
        }
        if (data.spectatorCountDirty) {
            this.m_localData.m_spectatorCount = data.spectatorCount;
        }

        // Zoom more quickly when changing scopes
        if (this.m_localData.m_scope != scopeOld) {
            this.zoomFast = true;
        }
    }

    m_getZoom() {
        let zoom = this.m_localData.m_zoom;

        if (device.mobile) {
            const stepIdx = desktopZoomRads.indexOf(zoom);
            if (stepIdx !== -1) {
                zoom = mobileZoomRads[stepIdx];
            }
        }

        return zoom;
    }

    m_getHelmetLevel() {
        if (this.m_netData.m_helmet) {
            return (GameObjectDefs[this.m_netData.m_helmet] as HelmetDef).level;
        }
        return 0;
    }

    m_getChestLevel() {
        if (this.m_netData.m_chest) {
            return (GameObjectDefs[this.m_netData.m_chest] as ChestDef).level;
        }
        return 0;
    }

    m_getBagLevel() {
        return (GameObjectDefs[this.m_netData.m_backpack] as BackpackDef).level;
    }

    m_equippedWeaponType() {
        return GameObjectDefs[this.m_netData.m_activeWeapon].type;
    }

    m_hasWeaponInSlot(slot: WeaponSlot) {
        return this.m_localData.m_weapons[slot].type !== "";
    }

    getMeleeCollider() {
        const meleeDef = GameObjectDefs[this.m_netData.m_activeWeapon] as MeleeDef;
        const ang = Math.atan2(this.m_dir.y, this.m_dir.x);
        const off = v2.add(
            meleeDef.attack.offset,
            v2.mul(v2.create(1, 0), this.m_netData.m_scale - 1),
        );
        const pos = v2.add(this.m_pos, v2.rotate(off, ang));
        const rad = meleeDef.attack.rad;
        return collider.createCircle(pos, rad);
    }

    m_hasActivePan() {
        return (
            this.m_netData.m_wearingPan ||
            (this.m_netData.m_activeWeapon == "pan" && this.currentAnim() != Anim.Melee)
        );
    }

    m_getPanSegment() {
        const panSurface = this.m_netData.m_wearingPan ? "unequipped" : "equipped";
        let surface = (GameObjectDefs.pan as MeleeDef).reflectSurface![panSurface];

        const scale = this.m_netData.m_scale;

        if (scale !== 1) {
            if (panSurface === "unequipped") {
                surface = {
                    p0: v2.mul(surface.p0, scale),
                    p1: v2.mul(surface.p1, scale),
                };
            } else {
                const s = (scale - 1) * 0.75;
                const off = v2.create(s, -s);
                surface = {
                    p0: v2.add(surface.p0, off),
                    p1: v2.add(surface.p1, off),
                };
            }
        }

        return surface;
    }

    canInteract(map: Map) {
        return !this.m_netData.m_dead && (!map.perkMode || this.m_netData.m_role);
    }

    m_updatePerks(
        isActivePlayer: boolean,
        isSpectating: boolean,
        ui2Manager: UiManager2,
    ) {
        for (let i = 0; i < this.perks.length; i++) {
            this.perks[i].isNew = false;
        }
        if (this.perksDirty) {
            if (isActivePlayer && !isSpectating) {
                // Create Ui notifications for newly added perks
                for (let i = 0; i < this.m_netData.m_perks.length; i++) {
                    const perk = this.m_netData.m_perks[i];
                    if (
                        this.perks.findIndex((x) => {
                            return x.type == perk.type;
                        }) === -1
                    ) {
                        ui2Manager.addRareLootMessage(perk.type);
                    }
                }

                // Remove active Ui messages for perks we no longer have
                for (let i = 0; i < this.perks.length; i++) {
                    const perk = this.perks[i];
                    if (
                        this.m_netData.m_perks.findIndex((x) => {
                            return x.type == perk.type;
                        }) === -1
                    ) {
                        ui2Manager.removeRareLootMessage(perk.type);
                    }
                }
            }

            // Update the internal perk list and calculate an 'isNew' property;
            // this is used by the Ui to animate the perk icon.
            const perks: typeof this.perks = [];
            for (let i = 0; i < this.m_netData.m_perks.length; i++) {
                const perk = this.m_netData.m_perks[i];
                const isNew =
                    this.perks.findIndex((x) => {
                        return x.type == perk.type;
                    }) === -1;
                perks.push({
                    type: perk.type,
                    droppable: perk.droppable,
                    isNew: isNew && !this.isNew,
                });
            }

            this.perks = perks;

            this.perkTypes = [];
            for (let i = 0; i < this.m_netData.m_perks.length; i++) {
                this.perkTypes.push(this.m_netData.m_perks[i].type);
            }
            this.perksDirty = false;
        }
    }

    m_hasPerk(type: string) {
        return this.perkTypes.includes(type);
    }

    m_update(
        dt: number,
        playerBarn: PlayerBarn,
        map: Map,
        audioManager: AudioManager,
        particleBarn: ParticleBarn,
        inputBinds: InputBinds,
        camera: Camera,
        renderer: Renderer,
        ui2Manager: UiManager2,
        activeId: number,
        preventInput: boolean,
        displayingStats: boolean,
        isSpectating: boolean,
    ) {
        const curWeapDef = GameObjectDefs[this.m_netData.m_activeWeapon];
        const isActivePlayer = this.__id == activeId;
        const activePlayer = playerBarn.getPlayerById(activeId)!;
        this.m_posOld = v2.copy(this.m_pos);
        this.m_dirOld = v2.copy(this.m_dir);
        this.m_pos = v2.copy(this.m_netData.m_pos);
        this.m_dir = v2.copy(this.m_netData.m_dir);
        this.layer = this.m_netData.m_layer;
        this.downed = this.m_netData.m_downed;
        this.m_rad = this.m_netData.m_scale * GameConfig.player.radius;

        // interpolation
        if (camera.m_interpEnabled) {
            this.posInterpTicker += dt;
            const posT = math.clamp(this.posInterpTicker / camera.m_interpInterval, 0, 1);
            this.m_visualPos = v2.lerp(posT, this.m_visualPosOld, this.m_pos);
            if (
                !camera.m_localRotationEnabled ||
                !isActivePlayer ||
                isSpectating ||
                displayingStats
            ) {
                this.dirInterpolationTicker += dt;
                const dirT = math.clamp(
                    this.dirInterpolationTicker / camera.m_interpInterval,
                    0,
                    1,
                );
                this.m_visualDir = v2.lerp(dirT, this.m_visualDirOld, this.m_dir);
            }
        } else {
            this.m_visualPos = v2.copy(this.m_pos);
            this.m_visualDir = v2.copy(this.m_dir);
        }

        // Ease radius transitions
        if (!math.eqAbs(this.m_rad, this.m_bodyRad)) {
            const bodyRadDist = this.m_rad - this.m_bodyRad;
            let bodyRadStep =
                Math.abs(bodyRadDist) > 0.0001 ? bodyRadDist * dt * 6 : bodyRadDist;
            if (this.isNew) {
                bodyRadStep = bodyRadDist;
            }
            this.m_bodyRad += bodyRadStep;
            this.visualsDirty = true;
        }

        // Calculate an aabb that fits the camera view
        if (isActivePlayer) {
            const viewEdge = camera.m_screenToPoint(v2.create(camera.m_screenWidth, 0));
            const viewExtent = v2.sub(viewEdge, camera.m_pos);
            this.viewAabb.min = v2.sub(camera.m_pos, viewExtent);
            this.viewAabb.max = v2.add(camera.m_pos, viewExtent);
        }

        // Should happen early in the frame so the rest of the update will have
        // accurate hasPerk() calls
        this.m_updatePerks(isActivePlayer, isSpectating, ui2Manager);

        const weapTypeDirty = this.weapTypeOld != this.m_netData.m_activeWeapon;
        this.weapTypeOld = this.m_netData.m_activeWeapon;

        this.lastThrowablePickupSfxTicker -= dt;
        this.noCeilingRevealTicker -= dt;

        // Update nameTex
        const activeGroupId = playerBarn.getPlayerInfo(activeId).groupId;
        const playerInfo = playerBarn.getPlayerInfo(this.__id);
        const inSameGroup = playerInfo.groupId == activeGroupId;
        this.nameText.text = playerInfo.name;
        this.nameText.visible = !isActivePlayer && inSameGroup;

        // Locate nearby obstacles that may play interaction effects
        let insideObstacle: Obstacle | null = null;
        let doorErrorObstacle = null;
        const obstacles = map.m_obstaclePool.m_getPool();
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            if (
                obstacle.active &&
                !obstacle.dead &&
                obstacle.layer == this.m_netData.m_layer
            ) {
                if (obstacle.isBush) {
                    const rad = this.m_rad * 0.25;
                    if (collider.intersectCircle(obstacle.collider, this.m_pos, rad)) {
                        insideObstacle = obstacle;
                    }
                } else if (obstacle.isDoor) {
                    const rad = this.m_rad + 0.25;
                    const toDoor = v2.sub(obstacle.pos, this.m_pos);
                    const doorDir = v2.rotate(v2.create(1, 0), obstacle.rot);
                    const res = collider.intersectCircle(
                        obstacle.collider,
                        this.m_pos,
                        rad,
                    );
                    if (
                        res &&
                        (obstacle.door.locked ||
                            (obstacle.door.openOneWay && v2.dot(toDoor, doorDir) < 0))
                    ) {
                        doorErrorObstacle = obstacle;
                    }
                }
            }
        }

        // Enter/exit bush effects
        const isInside = insideObstacle != null;
        if (isInside) {
            this.insideObstacleType = insideObstacle?.type!;
        }
        this.lastInsideObstacleTime -= dt;
        if (
            this.wasInsideObstacle != isInside &&
            this.lastInsideObstacleTime < 0 &&
            !this.isNew
        ) {
            const obstacleDef = MapObjectDefs[this.insideObstacleType] as ObstacleDef;
            this.lastInsideObstacleTime = 0.2;
            audioManager.playSound(obstacleDef?.sound.enter!, {
                channel: "sfx",
                soundPos: this.m_pos,
                fallOff: 1,
                layer: this.layer,
                filter: "muffled",
            });

            const moveDir = v2.normalizeSafe(
                v2.sub(this.m_posOld, this.m_pos),
                v2.create(1, 0),
            );
            const partDir = isInside ? 1 : -1;
            const numParticles = Math.floor(util.random(3, 5));
            for (let i = 0; i < numParticles; i++) {
                const vel = v2.mul(
                    v2.rotate(
                        v2.mul(moveDir, partDir),
                        ((Math.random() - 0.5) * Math.PI) / 1.5,
                    ),
                    util.random(6, 8),
                );
                particleBarn.addParticle(
                    obstacleDef.hitParticle,
                    this.layer,
                    this.m_pos,
                    vel,
                );
            }
        }
        this.wasInsideObstacle = isInside;

        // Play a sound effect when touching a one-way door from the wrong side
        const wasNearDoorError = this.isNearDoorError;
        this.isNearDoorError = doorErrorObstacle != null;
        this.doorErrorTicker -= dt;
        if (this.isNearDoorError && !wasNearDoorError && this.doorErrorTicker <= 0) {
            this.doorErrorTicker = 0.5;

            const doorDef = MapObjectDefs[doorErrorObstacle?.type!] as ObstacleDef;
            const doorSfx = doorDef.door?.sound.error!;
            audioManager.playSound(doorSfx, {
                channel: "sfx",
                soundPos: this.m_pos,
                fallOff: 1,
                layer: this.layer,
                filter: "muffled",
            });
        }
        this.surface = map.getGroundSurface(this.m_pos, this.layer);
        // SOUND

        const inWater = this.surface.type == "water";
        this.updateSubmersion(dt, map);
        this.updateFrozenState(dt);

        // Play a footstep if we've moved enough
        if (!this.m_netData.m_dead) {
            this.stepDistance += v2.length(v2.sub(this.m_posOld, this.m_pos));
            if ((this.stepDistance > 5 && inWater) || (inWater && !this.wasInWater)) {
                this.stepDistance = 0;
                particleBarn.addRippleParticle(
                    this.m_pos,
                    this.layer,
                    this.surface?.data.rippleColor!,
                );
                audioManager.playGroup("footstep_water", {
                    soundPos: this.m_pos,
                    fallOff: 3,
                    layer: this.layer,
                    filter: "muffled",
                });
            } else if (this.stepDistance > 4 && !inWater) {
                this.stepDistance = 0;
                audioManager.playGroup(`footstep_${this.surface.type}`, {
                    soundPos: this.m_pos,
                    fallOff: 3,
                    layer: this.layer,
                    filter: "muffled",
                });
            }
            this.wasInWater = inWater;
        }

        // Take bleeding damage
        this.bleedTicker -= dt;
        if (
            !this.m_netData.m_dead &&
            ((this.m_netData.m_downed && this.m_action.type == Action.None) ||
                this.m_hasPerk("trick_drain")) &&
            this.bleedTicker < 0
        ) {
            this.bleedTicker = this.m_hasPerk("trick_drain")
                ? GameConfig.player.bleedTickRate * 3
                : GameConfig.player.bleedTickRate;
            const vel = v2.rotate(
                v2.mul(this.m_dir, -1),
                ((Math.random() - 0.5) * Math.PI) / 3,
            );
            vel.y *= -1;
            particleBarn.addParticle(
                "bloodSplat",
                this.renderLayer,
                v2.create(0, 0),
                v2.mul(vel, camera.m_ppu),
                1,
                Math.random() * Math.PI * 2,
                this.container,
                this.renderZOrd + 1,
            );
            if (!displayingStats) {
                audioManager.playSound("player_bullet_hit_02", {
                    channel: "hits",
                    soundPos: this.m_pos,
                    fallOff: 3,
                    layer: this.layer,
                    filter: "muffled",
                });
            }
        }

        // Only play swaps for local players.
        this.gunSwitchCooldown -= dt;
        this.fireDelay -= dt;
        if (
            isActivePlayer &&
            (weapTypeDirty || this.lastSwapIdx != this.m_localData.m_curWeapIdx)
        ) {
            const lastWeapIdx = this.lastSwapIdx;
            this.lastSwapIdx = this.m_localData.m_curWeapIdx;
            const itemDef = GameObjectDefs[this.m_netData.m_activeWeapon] as
                | GunDef
                | MeleeDef
                | ThrowableDef;
            if (itemDef.type == "melee" || itemDef.type == "throwable") {
                // @HACK: Equipping a throwable currently plays
                // the same SFX as picking up a throwable, leading
                // to an echo effect
                if (
                    itemDef.type != "throwable" ||
                    this.lastThrowablePickupSfxTicker <= 0
                ) {
                    // Fixes issue with melee equip sounds being offset in the loadoutMenu
                    const soundPos = this.isLoadoutAvatar ? camera.m_pos : this.m_pos;
                    audioManager.playSound(itemDef.sound.deploy, {
                        channel: "sfx",
                        soundPos,
                        fallOff: 3,
                    });
                }
            } else if (itemDef.type == "gun") {
                let switchSound = "gun_switch_01";
                let deployFull = false;
                // Check if we're using 2 guns in the same group
                if (
                    (lastWeapIdx == 0 || lastWeapIdx == 1) &&
                    (this.lastSwapIdx == 0 || this.lastSwapIdx == 1) &&
                    this.fireDelay > 0
                ) {
                    const lastWeapDef = GameObjectDefs[
                        this.m_localData.m_weapons[lastWeapIdx].type
                    ] as GunDef;
                    if (
                        itemDef &&
                        lastWeapDef &&
                        itemDef.deployGroup !== undefined &&
                        lastWeapDef.deployGroup !== undefined &&
                        itemDef.deployGroup == lastWeapDef.deployGroup
                    ) {
                        deployFull = true;
                    }
                }
                if (this.gunSwitchCooldown > 0 || deployFull) {
                    switchSound = itemDef.sound.deploy;
                } else {
                    this.gunSwitchCooldown = GameConfig.player.freeSwitchCooldown;
                }
                audioManager.stopSound(this.cycleSoundInstance!);
                this.cycleSoundInstance = audioManager.playSound(switchSound, {
                    channel: "activePlayer",
                });
                this.fireDelay = 0;
            }
        }
        if (!audioManager.isSoundPlaying(this.cycleSoundInstance!)) {
            this.cycleSoundInstance = null;
        }

        // Action effect
        if (this.m_action.seq != this.m_action.seqOld && !this.isNew) {
            // Throttle effects for other players if they repeatedly cancel and
            // start new actions
            let playEffect = true;
            if (!isActivePlayer && this.m_action.type != Action.None) {
                this.m_action.throttleTicker = 0.5;
                if (this.m_action.throttleCount < 5) {
                    this.m_action.throttleCount++;
                } else {
                    playEffect = false;
                }
            }
            if (playEffect) {
                this.playActionStartEffect(isActivePlayer, particleBarn, audioManager);
            }
        }
        this.m_action.seqOld = this.m_action.seq;
        this.updateActionEffect(isActivePlayer, playerInfo, particleBarn, audioManager);
        this.m_action.throttleTicker -= dt;
        if (this.m_action.throttleTicker < 0 && this.m_action.throttleCount > 0) {
            this.m_action.throttleCount--;
            this.m_action.throttleTicker = 0.25;
        }

        // Haste effect
        if (this.m_netData.m_hasteType && this.m_netData.m_hasteSeq != this.hasteSeq) {
            const hasteEffects = {
                [HasteType.None]: {
                    particle: "",
                    sound: "",
                },
                [HasteType.Windwalk]: {
                    particle: "windwalk",
                    sound: "ability_stim_01",
                },
                [HasteType.Takedown]: {
                    particle: "takedown",
                    sound: "ability_stim_01",
                },
                [HasteType.Inspire]: {
                    particle: "inspire",
                    sound: "ability_stim_01",
                },
            };
            const fx = hasteEffects[this.m_netData.m_hasteType];

            if (!this.isNew) {
                audioManager.playSound(fx.sound, {
                    channel: "sfx",
                    soundPos: this.m_pos,
                    fallOff: 1,
                    layer: this.layer,
                    filter: "muffled",
                });
            }

            this.hasteEmitter?.stop();
            this.hasteEmitter = particleBarn.addEmitter(fx.particle, {
                pos: this.m_pos,
                layer: this.layer,
            });
            this.hasteSeq = this.m_netData.m_hasteSeq;
        } else if (!this.m_netData.m_hasteType && this.hasteEmitter) {
            this.hasteEmitter.stop();
            this.hasteEmitter = null;
        }
        if (this.hasteEmitter) {
            this.hasteEmitter.pos = v2.add(this.m_pos, v2.create(0, 0.1));
            this.hasteEmitter.layer = this.renderLayer;
            this.hasteEmitter.zOrd = this.renderZOrd + 1;
        }

        // Passive heal effect
        if (this.m_netData.m_healEffect && !this.passiveHealEmitter) {
            this.passiveHealEmitter = particleBarn.addEmitter("heal_basic", {
                pos: this.m_pos,
                layer: this.layer,
            });
        } else if (!this.m_netData.m_healEffect && this.passiveHealEmitter) {
            this.passiveHealEmitter.stop();
            this.passiveHealEmitter = null;
        }
        if (this.passiveHealEmitter) {
            this.passiveHealEmitter.pos = v2.add(this.m_pos, v2.create(0, 0.1));
            this.passiveHealEmitter.layer = this.renderLayer;
            this.passiveHealEmitter.zOrd = this.renderZOrd + 1;
        }
        if (isActivePlayer && !isSpectating) {
            const curWeapIdx = this.m_localData.m_curWeapIdx;
            const curWeap = this.m_localData.m_weapons[curWeapIdx];
            const itemDef = GameObjectDefs[curWeap.type] as GunDef;

            // Play dry fire sound when empty
            if (
                !this.playedDryFire &&
                this.m_equippedWeaponType() == "gun" &&
                (inputBinds.isBindPressed(Input.Fire) ||
                    (inputBinds.isBindDown(Input.Fire) && itemDef.fireMode == "auto")) &&
                this.m_action.type == Action.None &&
                !preventInput &&
                !itemDef.ammoInfinite
            ) {
                const ammoLeft = this.m_localData.m_inventory[itemDef.ammo] || 0;
                const currentClip = curWeap.ammo;
                if (ammoLeft == 0 && currentClip == 0) {
                    audioManager.playSound(itemDef.sound.empty);
                    this.playedDryFire = true;
                }
            }
            if (!inputBinds.isBindDown(Input.Fire)) {
                this.playedDryFire = false;
            }
        }

        // Decay gun recoil
        this.gunRecoilL = math.max(0, this.gunRecoilL - this.gunRecoilL * dt * 5 - dt);
        this.gunRecoilR = math.max(0, this.gunRecoilR - this.gunRecoilR * dt * 5 - dt);

        const xe: AnimCtx = {
            playerBarn,
            map,
            audioManager,
            particleBarn,
        };
        this.updateAnim(dt, xe);
        if (this.currentAnim() == Anim.None) {
            this.throwableState = "equip";
        }
        if (
            (this.currentAnim() == Anim.Cook || this.currentAnim() == Anim.Throw) &&
            curWeapDef.type != "throwable"
        ) {
            this.playAnim(Anim.None, this.anim.seq);
        }

        // Compute blended bone positions
        const idlePose = this.selectIdlePose();
        const idlePoseData = IdlePoses[idlePose];
        for (let boneIdx = 0; boneIdx < this.bones.length; boneIdx++) {
            const idleBonePose =
                idlePoseData[boneIdx as keyof typeof idlePoseData] || Pose.identity;
            const animBone = this.anim.bones[boneIdx];
            if (animBone.weight > 0) {
                this.bones[boneIdx].copy(
                    Pose.lerp(animBone.weight, idleBonePose, animBone.pose),
                );
            } else {
                this.bones[boneIdx].copy(idleBonePose);
            }
        }

        // Update sprite components
        if (this.throwableStatePrev != this.throwableState) {
            this.visualsDirty = true;
        }
        this.throwableStatePrev = this.throwableState;

        if (this.visualsDirty) {
            this.updateVisuals(playerBarn, map);
        }
        this.visualsDirty = false;

        this.updateAura(dt, isActivePlayer, activePlayer);

        this.updateRotation(
            inputBinds.input,
            camera,
            isActivePlayer,
            isSpectating,
            displayingStats,
        );

        // @NOTE: There's an off-by-one frame issue for effects spawned earlier
        // in this frame that reference renderLayer / zOrd / zIdx. This issue is
        // prevalent for other effects that reference the player outside of
        // update, like shot shell particle creation.
        this.updateRenderLayer(isActivePlayer, activePlayer, map);

        renderer.addPIXIObj(
            this.auraContainer,
            this.renderLayer,
            this.renderZOrd - 1,
            this.renderZIdx,
        );

        // Special visibility rules for the aura since it doesn't clip well with
        // the bunker mask system
        const auraLayerMatch =
            activePlayer.layer & 2 ||
            (activePlayer.layer & 1) == 1 ||
            (this.layer & 1) == 0;

        this.auraContainer.visible = Boolean(!this.m_netData.m_dead && auraLayerMatch);

        renderer.addPIXIObj(
            this.container,
            this.renderLayer,
            this.renderZOrd,
            this.renderZIdx,
        );

        this.isNew = false;
    }

    render(camera: Camera, debug: DebugRenderOpts) {
        const screenPos = camera.m_pointToScreen(this.m_visualPos);
        const screenScale = camera.m_pixels(1);
        this.container.position.set(screenPos.x, screenPos.y);
        this.container.scale.set(screenScale, screenScale);
        this.container.visible = !this.m_netData.m_dead;
        this.auraContainer.position.set(screenPos.x, screenPos.y);
        this.auraContainer.scale.set(screenScale, screenScale);

        if (IS_DEV && debug.players) {
            debugLines.addCircle(this.m_pos, this.m_rad, 0xff0000, 0);

            const weapDef = GameObjectDefs[this.m_netData.m_activeWeapon];
            const renderGun = (offHand: boolean) => {
                if (weapDef.type !== "gun") return;

                const gunOff = weapDef.isDual
                    ? weapDef.dualOffset! * (offHand ? 1.0 : -1.0)
                    : weapDef.barrelOffset;
                const gunPos = v2.add(this.m_pos, v2.mul(v2.perp(this.m_dir), gunOff));

                debugLines.addRay(gunPos, this.m_dir, weapDef.barrelLength, 0xff0000, 0);
            };
            if (weapDef.type === "gun") {
                renderGun(false);
                if (weapDef.isDual) {
                    renderGun(true);
                }
            } else if (weapDef.type === "melee") {
                const coll = this.getMeleeCollider();
                debugLines.addCollider(coll, 0xff0000, 0.1);
            }
            if (this.m_netData.m_wearingPan || this.m_netData.m_activeWeapon == "pan") {
                const pan = this.m_getPanSegment();
                const { p1, p0 } = math.transformSegment(
                    pan.p0,
                    pan.p1,
                    this.m_pos,
                    this.m_dir,
                );
                debugLines.addLine(p0, p1, 0xff00ff);
            }
        }
    }

    updateRenderLayer(isActivePlayer: boolean, activePlayer: Player, map: Map) {
        // Give the player a larger stairs collision radius.
        // This is a hack to reduce popping when emerging from below,
        // and to fix sorting issues with decals and loot when near
        // the bottom and top of stairs
        const visualCol = collider.createCircle(
            this.m_pos,
            GameConfig.player.maxVisualRadius,
        );
        let onMask = false;
        let onStairs = false;
        let occluded = false;
        const structures = map.m_structurePool.m_getPool();
        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            if (structure.active) {
                for (let j = 0; j < structure.stairs.length; j++) {
                    const stairs = structure.stairs[j]!;
                    const col = collider.intersect(stairs.collision, visualCol);
                    if (col) {
                        onStairs = true;

                        const stairTop = v2.add(
                            stairs.center,
                            v2.mul(stairs.downDir, -2.5),
                        );
                        let dir = v2.sub(stairTop, this.m_pos);
                        const dist = v2.length(dir);
                        dir = dist > 0.0001 ? v2.div(dir, dist) : v2.create(1, 0);
                        occluded =
                            collisionHelpers.intersectSegmentDist(
                                map.m_obstaclePool.m_getPool(),
                                this.m_pos,
                                dir,
                                dist,
                                0.5,
                                this.layer,
                                false,
                            ) < dist;
                    }

                    // Disable ceiling reveals if we're near certain types
                    // of stairs. This lets the player enter cellars from an
                    // exterior entrance without peeking inside the building
                    // when passing through the exterior walls via the stairs.
                    if (
                        isActivePlayer &&
                        stairs.noCeilingReveal &&
                        col &&
                        this.layer != 0
                    ) {
                        this.noCeilingRevealTicker = 0.25;
                    }
                }
                for (let j = 0; j < structure.mask.length; j++) {
                    if (collider.intersect(structure.mask[j], visualCol)) {
                        onMask = true;
                        break;
                    }
                }
            }
        }
        let renderLayer = this.layer;
        let renderZOrd = 18;
        if (
            onStairs &&
            ((renderLayer & 1 && (activePlayer.layer & 1 || !occluded)) ||
                (activePlayer.layer & 2 && !onMask))
        ) {
            renderLayer |= 2;
        }
        if (
            !!onStairs &&
            (renderLayer & 1) == (activePlayer.layer & 1) &&
            (!onMask || activePlayer.layer == 0)
        ) {
            renderLayer |= 2;
            renderZOrd += 100;
        }
        const renderZIdx =
            this.__id +
            (this.m_netData.m_downed ? 0 : 262144) +
            (isActivePlayer ? 65536 : 0) +
            (this.m_rad > 1 ? 131072 : 0);

        this.renderLayer = renderLayer;
        this.renderZOrd = renderZOrd;
        this.renderZIdx = renderZIdx;
    }

    updateVisuals(playerBarn: PlayerBarn, map: Map) {
        const outfitDef = GameObjectDefs[this.m_netData.m_outfit] as OutfitDef;
        const outfitImg = outfitDef.skinImg;
        const bodyScale = this.m_bodyRad / GameConfig.player.radius;

        this.bodySprite.texture = PIXI.Texture.from(outfitImg.baseSprite);
        this.bodySprite.tint = outfitDef.ghillie
            ? map.getMapDef().biome.colors.playerGhillie
            : outfitImg.baseTint;
        this.bodySprite.scale.set(0.25, 0.25);
        this.bodySprite.visible = true;

        if (this.m_netData.m_frozen && this.updateFrozenImage) {
            const frozenSprites = map.getMapDef().biome.frozenSprites || [];
            if (frozenSprites.length > 0) {
                const sprite =
                    frozenSprites[Math.floor(Math.random() * frozenSprites.length)];
                const n =
                    math.oriToRad(this.m_netData.m_frozenOri) +
                    Math.PI * 0.5 +
                    (Math.random() - 0.5) * Math.PI * 0.25;
                this.bodyEffectSprite.texture = PIXI.Texture.from(sprite);
                this.bodyEffectSprite.rotation = n;
                this.bodyEffectSprite.tint = 0xffffff;
                this.bodyEffectSprite.scale.set(0.25, 0.25);
            }
            this.updateFrozenImage = false;
        }

        if (map.factionMode && !outfitDef.ghillie) {
            const playerInfo = playerBarn.getPlayerInfo(this.__id);
            const teamId = playerInfo.teamId;
            const teamSprites = ["player-patch-01.img", "player-patch-02.img"];
            const teamIdx = (teamId - 1) % teamSprites.length;
            const sprite = teamSprites[teamIdx];
            const tint = GameConfig.teamColors[teamIdx];
            const rot = math.oriToRad(3) + Math.PI * 0.5;
            this.patchSprite.texture = PIXI.Texture.from(sprite);
            this.patchSprite.rotation = rot;
            this.patchSprite.tint = tint;
            this.patchSprite.scale.set(0.25, 0.25);
            this.patchSprite.visible = true;
        } else {
            this.patchSprite.visible = false;
        }

        // Hands
        const setHandSprite = function (sprite: PIXI.Sprite, img: string, tint: number) {
            sprite.texture = PIXI.Texture.from(img);
            sprite.scale.set(0.175, 0.175);
            sprite.tint = tint;
            sprite.visible = true;
        };
        const handTint = outfitDef.ghillie
            ? map.getMapDef().biome.colors.playerGhillie
            : outfitImg.handTint;
        setHandSprite(this.handLSprite, outfitImg.handSprite, handTint);
        setHandSprite(this.handRSprite, outfitImg.handSprite, handTint);

        // Feet
        const setFootSprite = function (
            sprite: PIXI.Sprite,
            tint: number,
            downed: boolean,
        ) {
            sprite.texture = PIXI.Texture.from("player-feet-01.img");
            sprite.scale.set(0.45, 0.45);
            sprite.rotation = Math.PI * 0.5;
            sprite.tint = tint;
            sprite.visible = downed;
        };

        const footTint = outfitDef.ghillie
            ? map.getMapDef().biome.colors.playerGhillie
            : outfitImg.footTint;
        setFootSprite(this.footLSprite, footTint, this.downed);
        setFootSprite(this.footRSprite, footTint, this.downed);

        // Flak Jacket
        if (this.m_hasPerk("flak_jacket") && !outfitDef.ghillie) {
            this.flakSprite.texture = PIXI.Texture.from("player-armor-base-01.img");
            this.flakSprite.scale.set(0.215, 0.215);
            this.flakSprite.tint = 3671558;
            this.flakSprite.alpha = 0.7;
            this.flakSprite.visible = true;
        } else {
            this.flakSprite.visible = false;
        }

        // Chest
        if (this.m_netData.m_chest == "" || outfitDef.ghillie) {
            this.chestSprite.visible = false;
        } else {
            const chestDef = GameObjectDefs[this.m_netData.m_chest] as ChestDef;
            const chestSkin = chestDef.skinImg;
            this.chestSprite.texture = PIXI.Texture.from(chestSkin.baseSprite);
            this.chestSprite.scale.set(0.25, 0.25);
            this.chestSprite.tint = chestSkin.baseTint;
            this.chestSprite.visible = true;
        }

        // Steelskin
        if (this.m_hasPerk("steelskin") && !outfitDef.ghillie) {
            this.steelskinSprite.texture = PIXI.Texture.from("loot-melee-pan-black.img");
            this.steelskinSprite.scale.set(0.4, 0.4);
            this.steelskinSprite.anchor.set(0.575, 0.5);
            this.steelskinSprite.tint = 0xffffff;
            this.steelskinSprite.visible = true;
        } else {
            this.steelskinSprite.visible = false;
        }

        // Helmet
        if (this.m_netData.m_helmet == "" || outfitDef.ghillie) {
            this.helmetSprite.visible = false;
        } else {
            const helmetDef = GameObjectDefs[this.m_netData.m_helmet] as HelmetDef;
            const helmetSkin = helmetDef.skinImg;
            const helmetOffset = (this.downed ? 1 : -1) * 3.33;
            this.helmetSprite.texture = PIXI.Texture.from(helmetSkin.baseSprite);
            this.helmetSprite.position.set(helmetOffset, 0);
            if (helmetSkin.spriteScale) {
                this.helmetSprite.scale.set(
                    helmetSkin.spriteScale,
                    helmetSkin.spriteScale,
                );
            } else {
                this.helmetSprite.scale.set(0.15, 0.15);
            }
            let helmetTint = helmetSkin.baseTint;
            if (map.factionMode) {
                helmetTint =
                    playerBarn.getPlayerInfo(this.__id).teamId == 1
                        ? helmetSkin.baseTintRed
                        : helmetSkin.baseTintBlue;
            }
            this.helmetSprite.tint = helmetTint;
            this.helmetSprite.visible = true;
        }

        // Backpack
        if (this.m_getBagLevel() > 0 && !outfitDef.ghillie && !this.downed) {
            const bagOffsets = [10.25, 11.5, 12.75];
            const bagLevel = this.m_getBagLevel();
            const bagOffset = bagOffsets[math.min(bagLevel - 1, bagOffsets.length - 1)];
            const scale = (0.4 + bagLevel * 0.03) * 0.5;

            this.backpackSprite.texture = PIXI.Texture.from("player-circle-base-01.img");
            this.backpackSprite.position.set(-bagOffset, 0);
            this.backpackSprite.scale.set(scale, scale);
            this.backpackSprite.tint = outfitImg.backpackTint;
            this.backpackSprite.visible = true;
            (function (sprite, img, tint) {
                sprite.texture = PIXI.Texture.from(img);
                sprite.tint = tint;
            })(this.backpackSprite, outfitImg.backpackSprite, outfitImg.backpackTint);
        } else {
            this.backpackSprite.visible = false;
        }

        // Hip
        if (this.m_netData.m_wearingPan) {
            const imgDef = (GameObjectDefs.pan as MeleeDef).hipImg!;
            this.hipSprite.texture = PIXI.Texture.from(imgDef.sprite);
            this.hipSprite.position.set(imgDef.pos.x, imgDef.pos.y);
            this.hipSprite.scale.set(imgDef.scale.x, imgDef.scale.y);
            this.hipSprite.rotation = imgDef.rot;
            this.hipSprite.tint = imgDef.tint;
            this.hipSprite.visible = true;
        } else {
            this.hipSprite.visible = false;
        }

        const R = GameObjectDefs[this.m_netData.m_activeWeapon] as
            | GunDef
            | MeleeDef
            | ThrowableDef;
        if (R.type == "gun") {
            this.gunRSprites.setType(this.m_netData.m_activeWeapon, bodyScale);
            this.gunRSprites.setVisible(true);
            if (R.isDual) {
                this.gunLSprites.setType(this.m_netData.m_activeWeapon, bodyScale);
                this.gunLSprites.setVisible(true);
            } else {
                this.gunLSprites.setVisible(false);
            }
            const L = this.bodyContainer.getChildIndex(this.handRContainer);
            const q = this.bodyContainer.getChildIndex(this.handRContainer);
            let F = L + 1;
            if (this.gunRSprites.magTop || R.worldImg.handsBelow) {
                F = L - 1;
            }
            F = math.max(F, 0);
            if (q != F) {
                this.bodyContainer.addChildAt(this.handLContainer, F);
            }
            const j = this.handRContainer.getChildIndex(this.gunRSprites.container);
            const N = R.worldImg.handsBelow ? this.handRContainer.children.length : 0;
            if (j != N) {
                this.handRContainer.addChildAt(this.gunRSprites.container, N);
            }
        } else {
            this.gunLSprites.setVisible(false);
            this.gunRSprites.setVisible(false);
        }
        if (this.downed != this.wasDowned) {
            this.wasDowned = this.downed;
            if (this.downed) {
                const H = this.bodyContainer.getChildIndex(this.footLContainer);
                this.bodyContainer.addChildAt(this.handLContainer, H);
                this.bodyContainer.addChildAt(this.handRContainer, H);
            } else {
                this.bodyContainer.addChild(this.handLContainer);
                this.bodyContainer.addChild(this.handRContainer);
            }
        }
        if (R.type == "melee" && this.m_netData.m_activeWeapon != "fists") {
            const V = R.worldImg!;
            this.meleeSprite.texture = PIXI.Texture.from(V.sprite);
            this.meleeSprite.pivot.set(-V.pos.x, -V.pos.y);
            this.meleeSprite.scale.set(V.scale.x / bodyScale, V.scale.y / bodyScale);
            this.meleeSprite.rotation = V.rot;
            this.meleeSprite.tint = V.tint;
            this.meleeSprite.visible = true;
            const U = this.handRContainer.getChildIndex(this.handRSprite);
            const W = math.max(V.renderOnHand ? U + 1 : U - 1, 0);
            if (this.handRContainer.getChildIndex(this.meleeSprite) != W) {
                this.handRContainer.addChildAt(this.meleeSprite, W);
            }
            const G = this.bodyContainer.getChildIndex(this.handRContainer);
            const X = math.max(V.leftHandOntop ? G + 1 : G - 1, 0);
            if (this.bodyContainer.getChildIndex(this.handLContainer) != X) {
                this.bodyContainer.addChildAt(this.handLContainer, X);
            }
        } else {
            this.meleeSprite.visible = false;
        }
        if (R.type == "throwable") {
            const K = function (
                e: PIXI.Sprite,
                t: {
                    sprite: string;
                    pos?: Vec2;
                    scale?: number;
                },
            ) {
                if (t.sprite && t.sprite != "none") {
                    // Setup sprite
                    let sprite = t.sprite;
                    // @HACK: halloween sprites
                    if (map.mapDef.gameMode.spookyKillSounds) {
                        sprite = halloweenSpriteMap[sprite] || sprite;
                    }
                    e.texture = PIXI.Texture.from(sprite);
                    e.position.set(t.pos?.x, t.pos?.y);
                    e.scale.set(t.scale, t.scale);
                    e.rotation = Math.PI * 0.5;
                    e.visible = true;
                } else {
                    e.visible = false;
                }
            };
            const Z = R.handImg?.[this.throwableState]!;
            K(this.objectLSprite, Z.left);
            K(this.objectRSprite, Z.right);
        } else {
            this.objectLSprite.visible = false;
            this.objectRSprite.visible = false;
        }

        // Hide weapons when reviving or downed
        if (this.downed || this.currentAnim() == Anim.Revive) {
            this.gunLSprites.setVisible(false);
            this.gunRSprites.setVisible(false);
            this.meleeSprite.visible = false;
            this.objectLSprite.visible = false;
            this.objectRSprite.visible = false;
        }

        // Hide additional gear when downed
        if (this.downed) {
            this.backpackSprite.visible = false;
        }

        // Role specific visuals
        if (
            (this.m_action.type != Action.UseItem &&
                this.m_action.type != Action.Revive) ||
            this.m_netData.m_dead ||
            (this.m_netData.m_downed && !this.m_hasPerk("self_revive")) ||
            !this.m_hasPerk("aoe_heal")
        ) {
            this.auraPulseTicker = 0;
            this.auraPulseDir = 1;
            this.auraCircle.visible = false;
        } else {
            const actionItemDef = GameObjectDefs[this.m_action.item] as
                | HealDef
                | BoostDef;
            // Assume if there's no item defined, it's a revive circle
            const sprite = actionItemDef?.aura
                ? actionItemDef.aura.sprite
                : "part-aura-circle-01.img";
            const tint = actionItemDef?.aura ? actionItemDef.aura.tint : 0xff00ff;
            const auraScale = 0.125;
            let auraRad = actionItemDef
                ? GameConfig.player.medicHealRange
                : GameConfig.player.medicReviveRange;
            auraRad *= auraScale;
            this.auraCircle.texture = PIXI.Texture.from(sprite);
            this.auraCircle.scale.set(auraRad, auraRad);
            this.auraCircle.tint = tint;
            this.auraCircle.visible = true;
        }

        // Class visors
        if (
            this.m_netData.m_role != "" &&
            (GameObjectDefs[this.m_netData.m_role] as RoleDef)?.visorImg &&
            this.m_netData.m_helmet != "" &&
            !outfitDef.ghillie
        ) {
            const roleDef = GameObjectDefs[this.m_netData.m_role] as RoleDef;
            const visorSkin = roleDef.visorImg!;
            if (visorSkin) {
                const helmetOffset = (this.downed ? 1 : -1) * 3.33;
                this.visorSprite.texture = PIXI.Texture.from(visorSkin.baseSprite);
                this.visorSprite.position.set(helmetOffset, 0);
            }
            if (visorSkin.spriteScale) {
                this.visorSprite.scale.set(visorSkin.spriteScale, visorSkin.spriteScale);
            } else {
                this.visorSprite.scale.set(0.15, 0.15);
            }
            this.visorSprite.visible = true;
        } else {
            this.visorSprite.visible = false;
        }
        this.bodyContainer.scale.set(bodyScale, bodyScale);
    }

    updateAura(dt: number, isActivePlayer: boolean, activePlayer: Player) {
        // Fade in/out when entering/exiting the screen edge of the active player.
        // This fixes popping caused by the player being culled before the aura
        // is off screen.
        let inView = true;
        if (!isActivePlayer) {
            inView = coldet.testCircleAabb(
                this.m_pos,
                this.m_rad,
                activePlayer.viewAabb.min,
                activePlayer.viewAabb.max,
            );
        }
        this.auraViewFade = math.lerp(dt * 6, this.auraViewFade, inView ? 1 : 0);

        // Pulse healing circle
        if (this.auraCircle.visible) {
            this.auraPulseTicker = math.clamp(
                this.auraPulseTicker + dt * this.auraPulseDir * 1.5,
                0,
                1,
            );
            const pulseAlpha = math.easeOutExpo(this.auraPulseTicker) * 0.75 + 0.25;
            if (this.auraPulseTicker >= 1 || this.auraPulseTicker <= 0) {
                this.auraPulseDir *= -1;
            }

            this.auraCircle.alpha = pulseAlpha * this.auraViewFade;
        }
    }

    updateRotation(
        inputManager: InputHandler,
        camera: Camera,
        isActivePlayer: boolean,
        isSpectating: boolean,
        displayingStats: boolean,
    ) {
        const e = function (e: PIXI.Container, t: Pose) {
            e.position.set(t.pos.x, t.pos.y);
            e.pivot.set(-t.pivot.x, -t.pivot.y);
            e.rotation = t.rot;
        };
        e(this.handLContainer, this.bones[Bones.HandL]);
        e(this.handRContainer, this.bones[Bones.HandR]);
        e(this.footLContainer, this.bones[Bones.FootL]);
        e(this.footRContainer, this.bones[Bones.FootR]);
        const t = GameObjectDefs[this.m_netData.m_activeWeapon] as GunDef;
        if (!this.downed && this.currentAnim() != Anim.Revive && t.type == "gun") {
            if (t.worldImg.leftHandOffset) {
                this.handLContainer.position.x += t.worldImg.leftHandOffset.x;
                this.handLContainer.position.y += t.worldImg.leftHandOffset.y;
            }
        }
        this.handLContainer.position.x -= this.gunRecoilL * 1.125;
        this.handRContainer.position.x -= this.gunRecoilR * 1.125;

        // Local Rotation
        const mouseY = inputManager.mousePos.y;
        const mouseX = inputManager.mousePos.x;
        if (
            !device.mobile &&
            camera.m_localRotationEnabled &&
            isActivePlayer &&
            !isSpectating &&
            !displayingStats
        ) {
            this.bodyContainer.rotation = Math.atan2(
                mouseY - window.innerHeight / 2,
                mouseX - window.innerWidth / 2,
            );
        } else {
            this.bodyContainer.rotation = -Math.atan2(
                this.m_visualDir.y,
                this.m_visualDir.x,
            );
        }
    }

    playActionStartEffect(
        isActivePlayer: boolean,
        particleBarn: ParticleBarn,
        audioManager: AudioManager,
    ) {
        // Play action sound
        let actionSound = null;
        switch (this.m_action.type) {
            case Action.Reload:
            case Action.ReloadAlt:
                {
                    const actionItemDef = GameObjectDefs[this.m_action.item] as GunDef;
                    if (actionItemDef) {
                        actionSound = {
                            sound:
                                this.m_action.type == Action.ReloadAlt
                                    ? actionItemDef.sound.reloadAlt
                                    : actionItemDef.sound.reload,
                            channel: isActivePlayer ? "activePlayer" : "otherPlayers",
                        };
                    }
                }
                break;
            case Action.UseItem: {
                const actionItemDef = GameObjectDefs[this.m_action.item] as
                    | HealDef
                    | BoostDef;
                if (actionItemDef) {
                    actionSound = {
                        sound: actionItemDef.sound.use,
                        channel: isActivePlayer ? "activePlayer" : "otherPlayers",
                    };
                }
            }
        }

        audioManager.stopSound(this.actionSoundInstance!);

        if (actionSound && this.playActionStartSfx) {
            this.actionSoundInstance = audioManager.playSound(actionSound.sound!, {
                channel: actionSound.channel,
                soundPos: this.m_pos,
                fallOff: 2,
                layer: this.layer,
                filter: "muffled",
            });
        }

        // Create a casing shell if reloading certain types of weapons
        if (
            this.m_action.type == Action.Reload ||
            this.m_action.type == Action.ReloadAlt
        ) {
            const actionItemDef = GameObjectDefs[this.m_action.item] as GunDef;
            if (actionItemDef && actionItemDef.caseTiming == "reload") {
                for (let n = 0; n < actionItemDef.maxReload; n++) {
                    const shellDir = n % 2 == 0 ? -1 : 1;
                    const shellAngle = Math.PI + (Math.PI / 4) * shellDir;
                    const shellSpeedMult =
                        actionItemDef.maxReload <= 2
                            ? 1
                            : math.lerp(Math.random(), 0.8, 1.2);
                    createCasingParticle(
                        this.m_action.item,
                        shellAngle,
                        shellSpeedMult,
                        this.m_pos,
                        this.m_dir,
                        this.renderLayer,
                        this.renderZOrd + 1,
                        particleBarn,
                    );
                }
            }
        }
    }

    updateActionEffect(
        isActivePlayer: boolean,
        playerInfo: PlayerInfo,
        particleBarn: ParticleBarn,
        audioManager: AudioManager,
    ) {
        // Determine if we should have an emitter
        let emitterType = "";
        const emitterProps = {} as {
            scale: number;
            radius: number;
            rateMult: number;
            layer: number;
            pos: Vec2;
        };

        switch (this.m_action.type) {
            case Action.UseItem: {
                const actionItemDef = GameObjectDefs[this.m_action.item];
                const loadout = playerInfo.loadout;
                if (actionItemDef.type == "heal") {
                    emitterType = (GameObjectDefs[loadout.heal] as HealDef).emitter;
                } else if (actionItemDef.type == "boost") {
                    emitterType = (GameObjectDefs[loadout.boost] as BoostDef).emitter;
                }
                if (this.m_hasPerk("aoe_heal")) {
                    emitterProps.scale = 1.5;
                    emitterProps.radius =
                        GameConfig.player.medicHealRange / emitterProps.scale;
                    emitterProps.rateMult = 0.25;
                }
                break;
            }
            case Action.Revive: {
                if (this.m_netData.m_downed) {
                    emitterType = "revive_basic";
                }
                break;
            }
        }

        // Add emitter
        if (
            !!emitterType &&
            (!this.useItemEmitter || this.useItemEmitter.type != emitterType)
        ) {
            this.useItemEmitter?.stop();
            emitterProps.pos = this.m_pos;
            emitterProps.layer = this.layer;
            this.useItemEmitter = particleBarn.addEmitter(emitterType, emitterProps);
        }

        // Update existing emitter
        if (this.useItemEmitter) {
            this.useItemEmitter.pos = v2.add(this.m_pos, v2.create(0, 0.1));
            this.useItemEmitter.layer = this.renderLayer;
            this.useItemEmitter.zOrd = this.renderZOrd + 1;
        }

        // Stop emitter
        if (this.useItemEmitter && !emitterType) {
            this.useItemEmitter.stop();
            this.useItemEmitter = null;
        }

        // Update action sound effect position
        if (!audioManager.isSoundPlaying(this.actionSoundInstance!)) {
            this.actionSoundInstance = null;
        }

        if (this.actionSoundInstance && !isActivePlayer) {
            audioManager.updateSound(
                this.actionSoundInstance,
                "otherPlayers",
                this.m_pos,
                {
                    layer: this.layer,
                    fallOff: 2,
                    filter: "muffled",
                },
            );
        }
    }

    playItemPickupSound(item: string, audioManager: AudioManager) {
        const itemDef = GameObjectDefs[item] as LootDef;
        if (itemDef) {
            audioManager.playSound(itemDef.sound?.pickup, {
                channel: "ui",
            });
            if (itemDef.type == "throwable") {
                this.lastThrowablePickupSfxTicker = 0.3;
            }
        }
    }

    selectIdlePose() {
        const curWeapDef = GameObjectDefs[this.m_netData.m_activeWeapon] as
            | GunDef
            | MeleeDef
            | ThrowableDef;

        let idlePose = "fists";

        if (this.downed) {
            idlePose = "downed";
        } else if ("anim" in curWeapDef && curWeapDef.anim.idlePose) {
            idlePose = curWeapDef.anim.idlePose;
        } else if (curWeapDef.type == "gun") {
            if (curWeapDef.pistol) {
                idlePose = curWeapDef.isDual ? "dualPistol" : "pistol";
            } else if (curWeapDef.isBullpup) {
                idlePose = "bullpup";
            } else if (curWeapDef.isLauncher) {
                idlePose = "launcher";
            } else {
                idlePose = curWeapDef.isDual ? "dualRifle" : "rifle";
            }
        } else if (curWeapDef.type == "throwable") {
            idlePose = "throwable";
        } else {
            idlePose = "fists";
        }
        return IdlePoses[idlePose] ? idlePose : "fists";
    }

    selectAnim(type: Anim) {
        const t = function (e: string, t: boolean) {
            return {
                type: e,
                mirror: !!t && Math.random() < 0.5,
            };
        };
        switch (type) {
            case Anim.None:
                return t("none", false);
            case Anim.Cook:
                return t("cook", false);
            case Anim.Throw:
                return t("throw", false);
            case Anim.Revive:
                return t("revive", false);
            case Anim.CrawlForward:
                return t("crawl_forward", true);
            case Anim.CrawlBackward:
                return t("crawl_backward", true);
            case Anim.Melee: {
                const r = GameObjectDefs[this.m_netData.m_activeWeapon] as MeleeDef;
                if (!r.anim?.attackAnims) {
                    return t("fists", true);
                }
                const a = r.anim.attackAnims;
                const i = Math.floor(Math.random() * a.length);
                const o = a[i];
                return t(o, o == "fists" && a.length == 1);
            }
            default:
                return t("none", false);
        }
    }

    currentAnim() {
        return this.anim.type;
    }

    playAnim(type: Anim, seq: number) {
        this.anim.type = type;
        this.anim.data = this.selectAnim(type);
        this.anim.seq = seq;
        this.anim.ticker = 0;
        for (let i = 0; i < this.bones.length; i++) {
            const a = this.anim.bones[i];
            a.weight = 0;
            a.pose.copy(this.bones[i]);
        }
    }

    updateAnim(dt: number, AnimCtx: AnimCtx) {
        if (this.anim.data.type == "none") {
            this.playAnim(Anim.None, this.anim.seq);
        }
        if (this.currentAnim() != Anim.None) {
            const ticker = this.anim.ticker;
            this.anim.ticker += dt * 1;
            const anim = Animations[this.anim.data.type];

            const frames = anim.keyframes;
            let frameAIdx = -1;
            let frameBIdx = 0;
            for (
                ;
                this.anim.ticker >= frames[frameBIdx].time &&
                frameBIdx < frames.length - 1;
            ) {
                frameAIdx++;
                frameBIdx++;
            }
            frameAIdx = math.max(frameAIdx, 0);
            const frameATime = frames[frameAIdx].time;
            const frameBTime = frames[frameBIdx].time;
            const t = math.min(
                (this.anim.ticker - frameATime) / (frameBTime - frameATime),
                1,
            );
            const frameABones = frames[frameAIdx].bones;
            const frameBBones = frames[frameBIdx].bones;
            const mirror = this.anim.data.mirror;
            for (let i = 0; i < this.anim.bones.length; i++) {
                const bones = this.anim.bones[i];
                let bone: Bones = i;
                if (mirror) {
                    bone = i % 2 == 0 ? i + 1 : i - 1;
                }
                if (frameABones[bone] !== undefined && frameBBones[bone] !== undefined) {
                    bones.weight = frameAIdx == frameBIdx ? t : 1;
                    bones.pose.copy(Pose.lerp(t, frameABones[bone]!, frameBBones[bone]!));
                    if (mirror) {
                        bones.pose.pos.y *= -1;
                        bones.pose.pivot.y *= -1;
                        bones.pose.rot *= -1;
                    }
                }
            }
            const w = frameBIdx == frames.length - 1 && math.eqAbs(t, 1);
            let f = this.anim.ticker;
            if (w) {
                f += 1;
            }
            for (let i = 0; i < anim.effects.length; i++) {
                const effect = anim.effects[i];
                if (effect.time >= ticker && effect.time < f) {
                    (this[effect.fn] as (ctx: AnimCtx, args: unknown) => void)(
                        AnimCtx,
                        effect.args,
                    );
                }
            }
            if (w) {
                this.playAnim(Anim.None, this.anim.seq);
            }
        }
    }

    animPlaySound(animCtx: Partial<AnimCtx>, args: { sound: string }) {
        const itemDef = GameObjectDefs[this.m_netData.m_activeWeapon] as MeleeDef;
        const sound = itemDef.sound[args.sound];
        if (sound) {
            animCtx.audioManager?.playSound(sound, {
                channel: "sfx",
                soundPos: this.m_pos,
                fallOff: 3,
                layer: this.layer,
                filter: "muffled",
            });
        }
    }

    animSetThrowableState(_animCtx: Partial<AnimCtx>, args: { state: string }) {
        this.throwableState = args.state;
    }

    animThrowableParticles(animCtx: Partial<AnimCtx>, _args: unknown) {
        if (
            (GameObjectDefs[this.m_netData.m_activeWeapon] as ThrowableDef)
                .useThrowParticles
        ) {
            // Pin
            const pinOff = v2.rotate(
                v2.create(0.75, 0.75),
                Math.atan2(this.m_dir.y, this.m_dir.x),
            );
            animCtx.particleBarn?.addParticle(
                "fragPin",
                this.renderLayer,
                v2.add(this.m_pos, pinOff),
                v2.mul(v2.rotate(this.m_dir, Math.PI * 0.5), 4.5),
                1,
                Math.random() * Math.PI * 2,
                null,
                this.renderZOrd + 1,
            );
            const leverOff = v2.rotate(
                v2.create(0.75, -0.75),
                Math.atan2(this.m_dir.y, this.m_dir.x),
            );
            animCtx.particleBarn?.addParticle(
                "fragLever",
                this.renderLayer,
                v2.add(this.m_pos, leverOff),
                v2.mul(v2.rotate(this.m_dir, -Math.PI * 0.25), 3.5),
                1,
                Math.random() * Math.PI * 2,
                null,
                this.renderZOrd + 1,
            );
        }
    }

    animMeleeCollision(animCtx: Partial<AnimCtx>, args: { playerHit?: string }) {
        const meleeDef = GameObjectDefs[this.m_netData.m_activeWeapon] as MeleeDef;
        if (meleeDef && meleeDef.type == "melee") {
            const meleeCol = this.getMeleeCollider();
            const meleeDist = meleeCol.rad + v2.length(v2.sub(this.m_pos, meleeCol.pos));
            const hits = [];

            // Obstacles
            const obstacles = animCtx.map?.m_obstaclePool.m_getPool()!;
            for (let i = 0; i < obstacles.length; i++) {
                const obstacle = obstacles[i];
                if (
                    !!obstacle.active &&
                    !obstacle.dead &&
                    !obstacle.isSkin &&
                    obstacle.height >= GameConfig.player.meleeHeight &&
                    util.sameLayer(obstacle.layer, this.layer & 1)
                ) {
                    let res = collider.intersectCircle(
                        obstacle.collider,
                        meleeCol.pos,
                        meleeCol.rad,
                    );

                    // Certain melee weapons should perform a more expensive wall check
                    // to not hit obstacles behind walls.
                    // @ts-expect-error wallcheck not defined on meleeDefs
                    if (meleeDef.cleave || meleeDef.wallCheck) {
                        const meleeDir = v2.normalizeSafe(
                            v2.sub(obstacle.pos, this.m_pos),
                            v2.create(1, 0),
                        );
                        const wallCheck = collisionHelpers.intersectSegment(
                            animCtx.map?.m_obstaclePool.m_getPool()!,
                            this.m_pos,
                            meleeDir,
                            meleeDist,
                            GameConfig.player.meleeHeight,
                            this.layer,
                            false,
                        );
                        if (wallCheck && wallCheck.id !== obstacle.__id) {
                            res = null;
                        }
                    }
                    if (res) {
                        const def = MapObjectDefs[obstacle.type] as ObstacleDef;
                        const closestPt = v2.add(
                            meleeCol.pos,
                            v2.mul(v2.neg(res.dir), meleeCol.rad - res.pen),
                        );
                        const vel = v2.rotate(
                            v2.mul(res.dir, 7.5),
                            ((Math.random() - 0.5) * Math.PI) / 3,
                        );
                        hits.push({
                            pen: res.pen,
                            prio: 1,
                            pos: closestPt,
                            vel,
                            layer: this.renderLayer,
                            zOrd: this.renderZOrd,
                            particle: def.hitParticle,
                            sound: def.sound.punch,
                            soundFn: "playGroup",
                        });
                    }
                }
            }
            const ourTeamId = animCtx.playerBarn?.getPlayerInfo(this.__id).teamId;
            const players = animCtx.playerBarn?.playerPool.m_getPool()!;
            for (let i = 0; i < players.length; i++) {
                const playerCol = players[i];
                if (
                    playerCol.active &&
                    playerCol.__id != this.__id &&
                    !playerCol.m_netData.m_dead &&
                    util.sameLayer(playerCol.layer, this.layer)
                ) {
                    const meleeDir = v2.normalizeSafe(
                        v2.sub(playerCol.m_pos, this.m_pos),
                        v2.create(1, 0),
                    );
                    const col = coldet.intersectCircleCircle(
                        meleeCol.pos,
                        meleeCol.rad,
                        playerCol.m_pos,
                        playerCol.m_rad,
                    );
                    if (
                        col &&
                        math.eqAbs(
                            meleeDist,
                            collisionHelpers.intersectSegmentDist(
                                animCtx.map?.m_obstaclePool.m_getPool()!,
                                this.m_pos,
                                meleeDir,
                                meleeDist,
                                GameConfig.player.meleeHeight,
                                this.layer,
                                false,
                            ),
                        )
                    ) {
                        const teamId = animCtx.playerBarn?.getPlayerInfo(
                            playerCol.__id,
                        ).teamId;
                        const vel = v2.rotate(
                            meleeDir,
                            ((Math.random() - 0.5) * Math.PI) / 3,
                        );
                        const hitSound =
                            meleeDef.sound[args.playerHit!] || meleeDef.sound.playerHit;
                        hits.push({
                            pen: col.pen,
                            prio: teamId == ourTeamId ? 2 : 0,
                            pos: v2.copy(playerCol.m_pos),
                            vel,
                            layer: playerCol.renderLayer,
                            zOrd: playerCol.renderZOrd,
                            particle: "bloodSplat",
                            sound: hitSound,
                            soundFn: "playSound",
                        });
                    }
                }
            }

            hits.sort((a, b) => {
                if (a.prio == b.prio) {
                    return b.pen - a.pen;
                }
                return a.prio - b.prio;
            });

            let hitCount = hits.length;
            if (!meleeDef.cleave) {
                hitCount = math.min(hitCount, 1);
            }

            for (let i = 0; i < hitCount; i++) {
                const hit = hits[i];
                animCtx.particleBarn?.addParticle(
                    hit.particle,
                    hit.layer,
                    hit.pos,
                    hit.vel,
                    1,
                    Math.random() * Math.PI * 2,
                    null,
                    hit.zOrd + 1,
                );
                // @ts-expect-error go away
                animCtx.audioManager?.[hit.soundFn](hit.sound, {
                    channel: "hits",
                    soundPos: hit.pos,
                    layer: this.layer,
                    filter: "muffled",
                });
            }
        }
    }

    initSubmergeSprites() {
        const initSprite = function (sprite: PIXI.Sprite, img: string) {
            sprite.texture = PIXI.Texture.from(img);
            sprite.anchor.set(0.5, 0.5);
            sprite.tint = 0xffffff;
            sprite.alpha = 0;
            sprite.visible = false;
        };
        initSprite(this.bodySubmergeSprite, "player-wading-01.img");
        initSprite(this.handLSubmergeSprite, "player-hands-01.img");
        initSprite(this.handRSubmergeSprite, "player-hands-01.img");
        initSprite(this.footLSubmergeSprite, "player-feet-01.img");
        initSprite(this.footRSubmergeSprite, "player-feet-01.img");

        // submergeMaskScaleFactor reduces the number of verts generated
        // by PIXI.Graphics; we scale it back up to the world size remains
        // the same
        const mask = new PIXI.Graphics();
        mask.beginFill(0xff0000, 0.5);
        mask.drawCircle(0, 0, 38.0 * 2.0 * submergeMaskScaleFactor);
        mask.position.set(0, 0);
        this.bodySubmergeSprite.addChild(mask);
        this.bodySubmergeSprite.mask = mask;
        this.bodySubmergeSprite.scale.set(0.5, 0.5);
    }

    updateSubmersion(dt: number, map: Map) {
        const inWater = this.surface?.type == "water";

        // Compute submersion
        let submersionAmount = 0;
        if (inWater) {
            const river = this.surface?.data.river;
            const inRiver = river && !map.isInOcean(this.m_pos);
            const dist = inRiver
                ? river.distanceToShore(this.m_pos)
                : map.distanceToShore(this.m_pos);
            const maxDist = inRiver ? 12 : 16;
            submersionAmount = math.remap(dist, 0, maxDist, 0.6, 1);
        }
        this.submersion = math.lerp(dt * 4, this.submersion, submersionAmount);

        // Update sprites
        const submersionAlpha = this.submersion * 0.8;
        const submersionScale = (0.9 - this.submersion * 0.4) * 2;
        const maskScale = 1 / (submersionScale * submergeMaskScaleFactor);
        this.bodySubmergeSprite.scale.set(submersionScale, submersionScale);
        (this.bodySubmergeSprite.mask as PIXI.Sprite).scale.set(maskScale, maskScale);
        this.bodySubmergeSprite.alpha = submersionAlpha;
        this.bodySubmergeSprite.visible = submersionAlpha > 0.001;
        if (inWater) {
            this.bodySubmergeSprite.tint = this.surface?.data.waterColor!;
        }

        const limbs = [
            this.handLSubmergeSprite,
            this.handRSubmergeSprite,
            this.footLSubmergeSprite,
            this.footRSubmergeSprite,
        ];
        for (let i = 0; i < limbs.length; i++) {
            const limb = limbs[i];
            limb.alpha = this.downed ? submersionAlpha : 0;
            limb.visible = limb.alpha > 0.001;
            if (inWater) {
                limb.tint = this.surface?.data.waterColor!;
            }
        }
    }

    updateFrozenState(dt: number) {
        const fadeDuration = 0.25;
        if (this.m_netData.m_frozen) {
            this.frozenTicker = fadeDuration;
        } else {
            this.frozenTicker -= dt;
            this.updateFrozenImage = true;
        }
        this.bodyEffectSprite.alpha = this.m_netData.m_frozen
            ? 1
            : math.remap(this.frozenTicker, 0, fadeDuration, 0, 1);
        this.bodyEffectSprite.visible = this.frozenTicker > 0;
    }

    addRecoil(amount: number, leftHand: boolean, rightHand: boolean) {
        if (leftHand) {
            this.gunRecoilL += amount;
        }
        if (rightHand) {
            this.gunRecoilR += amount;
        }
    }

    isUnderground(map: Map) {
        if (this.layer != 1) {
            return false;
        }
        const structures = map.m_structurePool.m_getPool();

        for (let i = 0; i < structures.length; i++) {
            const s = structures[i];
            if (s.layers.length >= 2) {
                const layer = s.layers[1];
                if (collider.intersectCircle(layer.collision, this.m_pos, this.m_rad)) {
                    return layer.underground;
                }
            }
        }
        return true;
    }
}

export class PlayerBarn {
    playerPool = new Pool(Player);
    playerInfo: Record<number, PlayerInfo & { nameTruncated: string; anonName: string }> =
        {};

    playerIds: number[] = [];
    teamInfo: Record<
        number,
        {
            teamId: number;
            playerIds: number[];
        }
    > = {};

    groupInfo: Record<
        number,
        {
            groupId: number;
            playerIds: number[];
        }
    > = {};

    playerStatus: Record<number, PlayerStatus> = {};
    anonPlayerNames = false;

    m_update(
        dt: number,
        activeId: number,
        renderer: Renderer,
        particleBarn: ParticleBarn,
        camera: Camera,
        map: Map,
        inputBinds: InputBinds,
        audioManager: AudioManager,
        ui2Manager: UiManager2,
        preventInput: boolean,
        displayingStats: boolean,
        isSpectating?: boolean,
    ) {
        // Update players
        const players = this.playerPool.m_getPool();
        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            if (p.active) {
                p.m_update(
                    dt,
                    this,
                    map,
                    audioManager,
                    particleBarn,
                    inputBinds,
                    camera,
                    renderer,
                    ui2Manager,
                    activeId,
                    preventInput,
                    displayingStats,
                    isSpectating!,
                );
            }
        }

        //
        // Update player status data
        //
        // @HACK: Set the local player data; the server will only
        // send status updates when not in solo-mode. We may also
        // have not yet received an update for ourselves yet, but
        // we always expect the local data to be available.
        const activeInfo = this.getPlayerInfo(activeId);
        const activePlayer = this.getPlayerById(activeId)!;

        this.setPlayerStatus(activeId, {
            pos: v2.copy(activePlayer.m_netData.m_pos),
            health: activePlayer.m_localData.m_health,
            disconnected: false,
            dead: activePlayer.m_netData.m_dead,
            downed: activePlayer.m_netData.m_downed,
            role: activePlayer.m_netData.m_role,
            visible: true,
        });

        const statusUpdateRate = getPlayerStatusUpdateRate(map.factionMode);
        const keys = Object.keys(this.playerStatus);
        for (let i = 0; i < keys.length; i++) {
            const status = this.playerStatus[keys[i] as unknown as number];
            const playerId = status.playerId!;
            const playerInfo = this.getPlayerInfo(playerId);

            const player = this.getPlayerById(playerId);
            if (player) {
                // Update data with latest position if on screen
                status.posDelta = v2.length(v2.sub(player.m_netData.m_pos, status.pos));
                status.posTarget = v2.copy(player.m_netData.m_pos);
                status.posInterp = math.clamp(
                    status.posInterp! + dt * 0.2,
                    dt / statusUpdateRate,
                    1,
                );
                status.dead = player.m_netData.m_dead;
                status.downed = player.m_netData.m_downed;
            } else {
                status.posInterp = dt / statusUpdateRate;
            }

            // Interpolate position
            const move = v2.sub(status.posTarget!, status.pos);
            const moveLen = v2.length(move);
            const moveDir = moveLen > 0.0001 ? v2.div(move, moveLen) : v2.create(1, 0);
            const moveAmt = math.min(moveLen, status.posDelta! * status.posInterp);
            status.pos = v2.add(status.pos, v2.mul(moveDir, moveAmt));

            status.timeSinceVisible! += dt;
            status.timeSinceUpdate! += dt;

            const fade =
                !status.dead ||
                (playerInfo.teamId != activeInfo.teamId && status.role != "leader")
                    ? 0
                    : 0.6;

            status.minimapAlpha =
                math.smoothstep(status.timeSinceVisible!, 0, 0.1) *
                math.lerp(math.smoothstep(status.timeSinceUpdate!, 2, 2.5), 1, fade);

            // @HACK: Fix issue in non-faction mode when spectating and swapping
            // between teams. We don't want the old player indicators to fade out
            // after moving to the new team
            if (!map.factionMode && playerInfo.teamId != activeInfo.teamId) {
                status.minimapAlpha = 0;
            }
            status.minimapVisible = status.minimapAlpha > 0.01;
        }
    }

    m_render(camera: Camera, debug: DebugRenderOpts) {
        const players = this.playerPool.m_getPool();
        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            if (p.active) {
                p.render(camera, debug);
            }
        }
    }

    getPlayerById(id: number) {
        const pool = this.playerPool.m_getPool();
        for (let i = 0; i < pool.length; i++) {
            const p = pool[i];
            if (p.active && p.__id === id) {
                return p;
            }
        }
        return null;
    }

    setPlayerInfo(info: PlayerInfo) {
        this.playerInfo[info.playerId] = {
            playerId: info.playerId,
            teamId: info.teamId,
            groupId: info.groupId,
            name: info.name,
            nameTruncated: helpers.truncateString(
                info.name || "",
                "bold 16px arial",
                180,
            ),
            anonName: `Player${info.playerId - 2750}`,
            loadout: util.cloneDeep(info.loadout),
        };
        this.playerIds.push(info.playerId);
        this.playerIds.sort((a, b) => {
            return a - b;
        });
    }

    deletePlayerInfo(id: number) {
        const idx = this.playerIds.indexOf(id);
        if (idx !== -1) {
            this.playerIds.splice(idx, 1);
        }
        delete this.playerInfo[id];
        delete this.playerStatus[id];
    }

    getPlayerInfo(id: number) {
        return (
            this.playerInfo[id] || {
                playerId: 0,
                group: 0,
                teamId: 0,
                name: "",
                nameTruncated: "",
                anonName: "",
                loadout: {},
            }
        );
    }

    recomputeTeamData() {
        this.teamInfo = {};
        this.groupInfo = {};

        const keys = Object.keys(this.playerInfo);
        for (let i = 0; i < keys.length; i++) {
            const playerInfo = this.playerInfo[keys[i] as unknown as number];
            const playerId = playerInfo.playerId;

            const teamId = playerInfo.teamId;
            this.teamInfo[teamId] = this.teamInfo[teamId] || {
                teamId,
                playerIds: [],
            };
            this.teamInfo[teamId].playerIds.push(playerId);

            const groupId = playerInfo.groupId;
            this.groupInfo[groupId] = this.groupInfo[groupId] || {
                groupId,
                playerIds: [],
            };
            this.groupInfo[groupId].playerIds.push(playerId);
        }

        const teams = Object.keys(this.teamInfo);
        for (let i = 0; i < teams.length; i++) {
            this.teamInfo[teams[i] as unknown as number].playerIds.sort((a, b) => {
                return a - b;
            });
        }

        const groups = Object.keys(this.groupInfo);
        for (let i = 0; i < groups.length; i++) {
            this.groupInfo[groups[i] as unknown as number].playerIds.sort((a, b) => {
                return a - b;
            });
        }
    }

    getTeamInfo(teamId: number) {
        return this.teamInfo[teamId];
    }

    getGroupInfo(groupId: number) {
        return this.groupInfo[groupId];
    }

    updatePlayerStatus(
        teamId: number,
        playerStatus: PlayerStatus[],
        factionMode: boolean,
    ) {
        // In factionMode, playerStatus refers to all playerIds in the game.
        // In all other modes, playerStatus refers to only playerIds in our team.
        const team = this.getTeamInfo(teamId);
        const playerIds = factionMode ? this.playerIds : team.playerIds;

        if (playerIds.length != playerStatus.length) {
            errorLogManager.logError(
                `PlayerIds and playerStatus out of sync. OurLen: ${playerIds.length} MsgLen: ${playerStatus.length} FactionMode: ${factionMode}`,
            );
            return;
        }

        for (let i = 0; i < playerIds.length; i++) {
            const playerId = playerIds[i];
            const status = playerStatus[i];
            if (status.hasData) {
                this.setPlayerStatus(playerId, status);
            }
        }
    }

    setPlayerStatus(playerId: number, newStatus: Partial<PlayerStatus>) {
        const status = this.playerStatus[playerId] || {
            playerId,
            pos: v2.copy(newStatus.pos!),
            posTarget: v2.copy(newStatus.pos!),
            posDelta: v2.create(0, 0),
            health: 100,
            posInterp: 0,
            visible: false,
            dead: false,
            downed: false,
            disconnected: false,
            role: "",
            timeSinceUpdate: 0,
            timeSinceVisible: 0,
            minimapAlpha: 0,
            minimapVisible: false,
        };

        if (!status.minimapVisible) {
            status.pos = v2.copy(newStatus.pos!);
            if (!status.visible && newStatus.visible) {
                status.timeSinceVisible = 0;
            }
        }

        status.visible = newStatus.visible!;
        if (status.visible) {
            status.timeSinceUpdate = 0;
        }

        status.posTarget = v2.copy(newStatus.pos!);
        status.posDelta = v2.length(v2.sub(newStatus.pos!, status.pos));
        status.dead = newStatus.dead!;
        status.downed = newStatus.downed!;
        status.role = newStatus.role!;
        if (newStatus.health !== undefined) {
            status.health = newStatus.health;
        }
        if (newStatus.disconnected !== undefined) {
            status.disconnected = newStatus.disconnected;
        }
        this.playerStatus[playerId] = status;
    }

    getPlayerStatus(playerId: number) {
        return this.playerStatus[playerId];
    }

    updateGroupStatus(groupId: number, groupStatus: GroupStatus[]) {
        const info = this.getGroupInfo(groupId);
        if (info.playerIds.length != groupStatus.length) {
            errorLogManager.logError("PlayerIds and groupStatus out of sync");
            return;
        }
        for (let i = 0; i < info.playerIds.length; i++) {
            const playerId = info.playerIds[i];
            const playerStatus = groupStatus[i];

            // Stash groupStatus values into playerStatus
            const status = this.getPlayerStatus(playerId);
            if (status) {
                status.health = playerStatus.health;
                status.disconnected = playerStatus.disconnected;
            }
        }
    }

    getGroupColor(playerId: number) {
        const playerInfo = this.getPlayerInfo(playerId);
        const group = this.getGroupInfo(playerInfo.groupId);
        const groupIdx = group ? group.playerIds.indexOf(playerId) : 0;
        if (groupIdx >= 0 && groupIdx < GameConfig.groupColors.length) {
            return GameConfig.groupColors[groupIdx];
        }
        return 0xffffff;
    }

    getTeamColor(teamId: number) {
        const teamIdx = teamId - 1;
        if (teamIdx >= 0 && teamIdx < GameConfig.teamColors.length) {
            return GameConfig.teamColors[teamIdx];
        }
        return 0xffffff;
    }

    getPlayerName(
        playerId: number,
        activePlayerId: number,
        truncateForKillfeed: boolean,
    ) {
        const info = this.getPlayerInfo(playerId);
        if (!info) {
            return "";
        }
        let name = info.name;

        if (truncateForKillfeed) {
            name = info.nameTruncated;
        }

        // Anonymize player name if they aren't in the active player's group
        if (
            this.anonPlayerNames &&
            this.getPlayerInfo(activePlayerId).groupId != info.groupId
        ) {
            name = info.anonName;
        }
        return name;
    }

    addDeathEffect(
        targetId: number,
        killerId: number,
        audioManager: AudioManager,
        particleBarn: ParticleBarn,
    ) {
        const target = this.getPlayerById(targetId);
        const killer = this.getPlayerById(killerId);
        if (target && killer?.m_hasPerk("turkey_shoot")) {
            audioManager.playGroup("cluck", {
                soundPos: target.m_pos,
                layer: target.layer,
                muffled: true,
            });
            audioManager.playSound("feather_01", {
                channel: "sfx",
                soundPos: target.m_pos,
                layer: target.layer,
                muffled: true,
            });
            const numParticles = Math.floor(util.random(30, 35));
            for (let i = 0; i < numParticles; i++) {
                const vel = v2.mul(v2.randomUnit(), util.random(5, 15));
                particleBarn.addParticle(
                    "turkeyFeathersDeath",
                    target.layer,
                    target.m_pos,
                    vel,
                );
            }
        }
    }
}
