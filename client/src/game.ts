import * as PIXI from "pixi.js-legacy";
import { GameObjectDefs } from "../../shared/defs/gameObjectDefs";
import { RoleDefs } from "../../shared/defs/gameObjects/roleDefs";
import { GameConfig, Input, TeamMode, WeaponSlot } from "../../shared/gameConfig";
import * as net from "../../shared/net/net";
import { ObjectType } from "../../shared/net/objectSerializeFns";
import { math } from "../../shared/utils/math";
import { v2 } from "../../shared/utils/v2";
import type { Ambiance } from "./ambiance";
import type { AudioManager } from "./audioManager";
import { Camera } from "./camera";
import type { ConfigManager, DebugRenderOpts } from "./config";
import { DebugHUD } from "./debug/debugHUD";
import { debugLines } from "./debug/debugLines";

/* STRIP_FROM_PROD_CLIENT:START */
import { Editor } from "./debug/editor";
/* STRIP_FROM_PROD_CLIENT:END */

import { device } from "./device";
import { EmoteBarn } from "./emote";
import { Gas } from "./gas";
import { helpers } from "./helpers";
import { type InputHandler, Key } from "./input";
import type { InputBinds, InputBindUi } from "./inputBinds";
import type { SoundHandle } from "./lib/createJS";
import { Map } from "./map";
import { AirdropBarn } from "./objects/airdrop";
import { BulletBarn, createBullet } from "./objects/bullet";
import { DeadBodyBarn } from "./objects/deadBody";
import { DecalBarn } from "./objects/decal";
import { ExplosionBarn } from "./objects/explosion";
import { FlareBarn } from "./objects/flare";
import { LootBarn } from "./objects/loot";
import { Creator } from "./objects/objectPool";
import { ParticleBarn } from "./objects/particles";
import { PlaneBarn } from "./objects/plane";
import { type Player, PlayerBarn } from "./objects/player";
import { ProjectileBarn } from "./objects/projectile";
import { ShotBarn } from "./objects/shot";
import { SmokeBarn } from "./objects/smoke";
import { Renderer } from "./renderer";
import type { ResourceManager } from "./resources";
import { SDK } from "./sdk";
import type { Localization } from "./ui/localization";
import { Touch } from "./ui/touch";
import { UiManager } from "./ui/ui";
import { UiManager2 } from "./ui/ui2";

export interface Ctx {
    audioManager: AudioManager;
    renderer: Renderer;
    particleBarn: ParticleBarn;
    map: Map;
    smokeBarn: SmokeBarn;
    decalBarn: DecalBarn;
}

export class Game {
    initialized = false;
    teamMode: TeamMode = TeamMode.Solo;

    victoryMusic: SoundHandle | null = null;
    m_ws: WebSocket | null = null;
    connecting = false;
    connected = false;

    m_touch!: Touch;
    m_camera!: Camera;
    m_renderer!: Renderer;
    m_particleBarn!: ParticleBarn;
    m_decalBarn!: DecalBarn;
    m_map!: Map;
    m_playerBarn!: PlayerBarn;
    m_bulletBarn!: BulletBarn;
    m_flareBarn!: FlareBarn;
    m_projectileBarn!: ProjectileBarn;
    m_explosionBarn!: ExplosionBarn;
    m_planeBarn!: PlaneBarn;
    m_airdropBarn!: AirdropBarn;
    m_smokeBarn!: SmokeBarn;
    m_deadBodyBarn!: DeadBodyBarn;
    m_lootBarn!: LootBarn;
    m_gas!: Gas;
    m_uiManager!: UiManager;
    m_ui2Manager!: UiManager2;
    m_emoteBarn!: EmoteBarn;
    m_shotBarn!: ShotBarn;
    m_objectCreator!: Creator;

    m_debugDisplay!: PIXI.Graphics;
    m_canvasMode!: boolean;

    m_updatePass!: boolean;
    m_updatePassDelay!: number;
    m_disconnectMsg!: string;
    m_playing!: boolean;
    m_gameOver!: boolean;
    m_spectating!: boolean;
    m_inputMsgTimeout!: number;
    m_prevInputMsg!: net.InputMsg;
    m_playingTicker!: number;
    m_updateRecvCount!: number;
    m_localId!: number;
    m_activeId!: number;
    m_activePlayer!: Player;
    m_validateAlpha!: boolean;
    m_targetZoom!: number;
    m_debugZoom!: number;
    m_useDebugZoom!: boolean;

    editor!: Editor;
    debugHUD!: DebugHUD;

    seq!: number;
    seqInFlight!: boolean;
    seqSendTime!: number;
    pings!: number[];
    debugPingTime!: number;
    lastUpdateTime!: number;
    updateIntervals!: number[];

    constructor(
        public m_pixi: PIXI.Application,
        public m_audioManager: AudioManager,
        public m_localization: Localization,
        public m_config: ConfigManager,
        public m_input: InputHandler,
        public m_inputBinds: InputBinds,
        public m_inputBindUi: InputBindUi,
        public m_ambience: Ambiance,
        public m_resourceManager: ResourceManager,
        public onJoin: () => void,
        public onQuit: (err?: string) => void,
    ) {
        this.m_pixi = m_pixi;
        this.m_audioManager = m_audioManager;
        this.m_ambience = m_ambience;
        this.m_localization = m_localization;
        this.m_config = m_config;
        this.m_input = m_input;
        this.m_inputBinds = m_inputBinds;
        this.m_inputBindUi = m_inputBindUi;
        this.m_resourceManager = m_resourceManager;

        if (IS_DEV) {
            this.editor = new Editor(this.m_config);
        }
    }

    tryJoinGame(
        url: string,
        matchPriv: string,
        questPriv: string,
        onConnectFail: () => void,
    ) {
        if (!this.connecting && !this.connected && !this.initialized) {
            if (this.m_ws) {
                this.m_ws.onerror = function () {};
                this.m_ws.onopen = function () {};
                this.m_ws.onmessage = function () {};
                this.m_ws.onclose = function () {};
                this.m_ws.close();
                this.m_ws = null;
            }
            this.connecting = true;
            this.connected = false;
            try {
                this.m_ws = new WebSocket(url);
                this.m_ws.binaryType = "arraybuffer";
                this.m_ws.onerror = (_err) => {
                    this.m_ws?.close();
                };
                this.m_ws.onopen = () => {
                    this.connecting = false;
                    this.connected = true;
                    const name = this.m_config.get("playerName")!;
                    const joinMessage = new net.JoinMsg();
                    joinMessage.protocol = GameConfig.protocolVersion;
                    joinMessage.matchPriv = matchPriv;
                    joinMessage.questPriv = questPriv;
                    joinMessage.name = name;
                    joinMessage.useTouch = device.touch;
                    joinMessage.isMobile = device.mobile || window.mobile!;
                    joinMessage.bot = false;
                    joinMessage.loadout = this.m_config.get("loadout")!;
                    this.m_sendMessage(net.MsgType.Join, joinMessage, 8192);
                };
                this.m_ws.onmessage = (e) => {
                    const msgStream = new net.MsgStream(e.data);
                    while (true) {
                        const type = msgStream.deserializeMsgType();
                        if (type == net.MsgType.None) {
                            break;
                        }
                        this.m_onMsg(type, msgStream.getStream());
                        msgStream.stream.readAlignToNextByte();
                    }
                    this.debugHUD?.netInGraph.addEntry(
                        msgStream.stream.buffer.byteLength,
                    );
                };
                this.m_ws.onclose = () => {
                    const displayingStats = this.m_uiManager?.displayingStats;
                    const connecting = this.connecting;
                    const connected = this.connected;
                    this.connecting = false;
                    this.connected = false;
                    if (connecting) {
                        onConnectFail();
                    } else if (connected && !this.m_gameOver && !displayingStats) {
                        const errMsg = this.m_disconnectMsg || "index-host-closed";
                        this.onQuit(errMsg);
                    }
                };
            } catch (err) {
                console.error(err);
                this.connecting = false;
                this.connected = false;
                onConnectFail();
            }
        }
    }

    init() {
        this.m_canvasMode = this.m_pixi.renderer.type == PIXI.RENDERER_TYPE.CANVAS;

        // Modules
        this.m_touch = new Touch(this.m_input, this.m_config);
        this.m_camera = new Camera();
        this.m_renderer = new Renderer(this, this.m_canvasMode);
        this.m_particleBarn = new ParticleBarn(this.m_renderer);
        this.m_decalBarn = new DecalBarn();
        this.m_map = new Map(this.m_decalBarn);
        this.m_playerBarn = new PlayerBarn();
        this.m_bulletBarn = new BulletBarn();
        this.m_flareBarn = new FlareBarn();
        this.m_projectileBarn = new ProjectileBarn();
        this.m_explosionBarn = new ExplosionBarn();
        this.m_planeBarn = new PlaneBarn(this.m_audioManager);
        this.m_airdropBarn = new AirdropBarn();
        this.m_smokeBarn = new SmokeBarn();
        this.m_deadBodyBarn = new DeadBodyBarn();
        this.m_lootBarn = new LootBarn();
        this.m_gas = new Gas(this.m_canvasMode);
        this.m_uiManager = new UiManager(
            this,
            this.m_audioManager,
            this.m_particleBarn,
            this.m_planeBarn,
            this.m_localization,
            this.m_canvasMode,
            this.m_touch,
            this.m_inputBinds,
            this.m_inputBindUi,
        );
        this.m_ui2Manager = new UiManager2(this.m_localization, this.m_inputBinds);
        this.m_emoteBarn = new EmoteBarn(
            this.m_audioManager,
            this.m_uiManager,
            this.m_playerBarn,
            this.m_camera,
            this.m_map,
        );
        this.m_shotBarn = new ShotBarn();
        this.debugHUD = new DebugHUD(this.m_config);

        // this.particleBarn,
        // this.audioManager,
        // this.uiManager

        // Register types
        const TypeToPool = {
            [ObjectType.Player]: this.m_playerBarn.playerPool,
            [ObjectType.Obstacle]: this.m_map.m_obstaclePool,
            [ObjectType.Loot]: this.m_lootBarn.lootPool,
            [ObjectType.DeadBody]: this.m_deadBodyBarn.deadBodyPool,
            [ObjectType.Building]: this.m_map.m_buildingPool,
            [ObjectType.Structure]: this.m_map.m_structurePool,
            [ObjectType.Decal]: this.m_decalBarn.decalPool,
            [ObjectType.Projectile]: this.m_projectileBarn.projectilePool,
            [ObjectType.Smoke]: this.m_smokeBarn.m_smokePool,
            [ObjectType.Airdrop]: this.m_airdropBarn.airdropPool,
        };

        this.m_objectCreator = new Creator();
        for (const type in TypeToPool) {
            if (TypeToPool.hasOwnProperty(type)) {
                this.m_objectCreator.m_registerType(
                    type,
                    TypeToPool[type as unknown as keyof typeof TypeToPool],
                );
            }
        }
        // Render ordering
        this.m_debugDisplay = new PIXI.Graphics();
        const pixiContainers = [
            this.m_map.display.ground,
            this.m_renderer.layers[0],
            this.m_renderer.ground,
            this.m_renderer.layers[1],
            this.m_renderer.layers[2],
            this.m_renderer.layers[3],
            this.m_debugDisplay,
            this.m_gas.gasRenderer.display,
            this.m_touch.container,
            this.m_emoteBarn.container,
            this.m_uiManager.container,
            this.m_uiManager.m_pieTimer.container,
            this.m_emoteBarn.indContainer,
            this.debugHUD.container,
        ];
        for (let i = 0; i < pixiContainers.length; i++) {
            const container = pixiContainers[i];
            if (container) {
                container.interactiveChildren = false;
                this.m_pixi.stage.addChild(container);
            }
        }
        // Local vars
        this.m_disconnectMsg = "";
        this.m_playing = false;
        this.m_gameOver = false;
        this.m_spectating = false;
        this.m_inputMsgTimeout = 0;
        this.m_prevInputMsg = new net.InputMsg();
        this.m_playingTicker = 0;
        this.m_updateRecvCount = 0;
        this.m_updatePass = false;
        this.m_updatePassDelay = 0;
        this.m_localId = 0;
        this.m_activeId = 0;
        this.m_activePlayer = null as unknown as Player;
        this.m_validateAlpha = false;
        this.m_targetZoom = 1;
        this.m_debugZoom = 1;
        this.m_useDebugZoom = false;

        // Latency determination

        this.seq = 0;
        this.seqInFlight = false;
        this.seqSendTime = 0;
        this.pings = [];
        this.updateIntervals = [];
        this.lastUpdateTime = 0;
        this.debugPingTime = 0;

        // Process config
        this.m_camera.m_setShakeEnabled(this.m_config.get("screenShake")!);
        this.m_camera.m_setInterpEnabled(this.m_config.get("interpolation")!);
        this.m_camera.m_setRotationEnabled(this.m_config.get("localRotation")!);
        this.m_playerBarn.anonPlayerNames = this.m_config.get("anonPlayerNames")!;
        this.initialized = true;
    }

    free() {
        if (this.m_ws) {
            this.m_ws.onmessage = function () {};
            this.m_ws.close();
            this.m_ws = null;
        }
        this.connecting = false;
        this.connected = false;
        if (this.initialized) {
            this.initialized = false;
            this.m_updatePass = false;
            this.m_updatePassDelay = 0;
            this.m_emoteBarn.m_free();
            this.m_ui2Manager.m_free();
            this.m_uiManager.m_free();
            this.m_gas.m_free();
            this.m_airdropBarn.m_free();
            this.m_planeBarn.m_free();
            this.m_map.m_free();
            this.m_particleBarn.m_free();
            this.m_renderer.m_free();
            this.m_input.m_free();
            this.m_audioManager.stopAll();

            while (this.m_pixi.stage.children.length > 0) {
                const c = this.m_pixi.stage.children[0];
                this.m_pixi.stage.removeChild(c);
                c.destroy({
                    children: true,
                });
            }
        }
    }

    warnPageReload() {
        return (
            import.meta.env.PROD &&
            this.initialized &&
            this.m_playing &&
            !this.m_spectating &&
            !this.m_uiManager.displayingStats
        );
    }

    update(dt: number) {
        this.debugHUD.m_update(dt, this);

        if (IS_DEV) {
            if (this.m_input.keyPressed(Key.Tilde)) {
                this.editor.setEnabled(!this.editor.enabled);
            }
            if (this.editor.enabled) {
                this.editor.m_update(this.m_input);
            }
        }

        let debug: DebugRenderOpts;
        if (IS_DEV) {
            debug = this.m_config.get("debugRenderer")!;
        } else {
            debug = {} as DebugRenderOpts;
        }

        const smokeParticles = this.m_smokeBarn.m_particles;

        if (this.m_playing) {
            this.m_playingTicker += dt;
        }
        this.m_playerBarn.m_update(
            dt,
            this.m_activeId,
            this.m_renderer,
            this.m_particleBarn,
            this.m_camera,
            this.m_map,
            this.m_inputBinds,
            this.m_audioManager,
            this.m_ui2Manager,
            this.m_emoteBarn.wheelKeyTriggered,
            this.m_uiManager.displayingStats,
            this.m_spectating,
        );
        this.updateAmbience();

        this.m_camera.m_pos = v2.copy(this.m_activePlayer.m_visualPos);
        this.m_camera.m_applyShake();
        const zoom = this.m_activePlayer.m_getZoom();

        const minDim = math.min(
            this.m_camera.m_screenWidth,
            this.m_camera.m_screenHeight,
        );
        const maxDim = math.max(
            this.m_camera.m_screenWidth,
            this.m_camera.m_screenHeight,
        );
        const maxScreenDim = math.max(minDim * (16 / 9), maxDim);
        this.m_camera.m_targetZoom = (maxScreenDim * 0.5) / (zoom * this.m_camera.m_ppu);
        const zoomLerpIn = this.m_activePlayer.zoomFast ? 3 : 2;
        const zoomLerpOut = this.m_activePlayer.zoomFast ? 3 : 1.4;
        const zoomLerp =
            this.m_camera.m_targetZoom > this.m_camera.m_zoom ? zoomLerpIn : zoomLerpOut;
        this.m_camera.m_zoom = math.lerp(
            dt * zoomLerp,
            this.m_camera.m_zoom,
            this.m_camera.m_targetZoom,
        );
        this.m_audioManager.cameraPos = v2.copy(this.m_camera.m_pos);
        if (this.m_input.keyPressed(Key.Escape)) {
            this.m_uiManager.toggleEscMenu();
        }
        // Large Map
        if (
            this.m_inputBinds.isBindPressed(Input.ToggleMap) ||
            (this.m_input.keyPressed(Key.G) && !this.m_inputBinds.isKeyBound(Key.G))
        ) {
            this.m_uiManager.displayMapLarge(false);
        }
        // Minimap
        if (this.m_inputBinds.isBindPressed(Input.CycleUIMode)) {
            this.m_uiManager.cycleVisibilityMode();
        }
        // Hide UI
        if (
            this.m_inputBinds.isBindPressed(Input.HideUI) ||
            (this.m_input.keyPressed(Key.Escape) && !this.m_uiManager.hudVisible)
        ) {
            this.m_uiManager.cycleHud();
        }
        // Update facing direction
        const playerPos = this.m_activePlayer.m_pos;
        const mousePos = v2.create(
            this.m_activePlayer.m_pos.x +
                (this.m_input.mousePos.x - this.m_camera.m_screenWidth * 0.5) /
                    this.m_camera.m_z(),
            this.m_activePlayer.m_pos.y +
                (this.m_camera.m_screenHeight * 0.5 - this.m_input.mousePos.y) /
                    this.m_camera.m_z(),
        );
        // const mousePos = this.m_camera.m_screenToPoint(this.m_input.mousePos);
        const toMousePos = v2.sub(mousePos, playerPos);
        let toMouseLen = v2.length(toMousePos);
        let toMouseDir =
            toMouseLen > 0.00001 ? v2.div(toMousePos, toMouseLen) : v2.create(1, 0);

        if (this.m_emoteBarn.wheelDisplayed) {
            toMouseLen = this.m_prevInputMsg.toMouseLen;
            toMouseDir = this.m_prevInputMsg.toMouseDir;
        }

        // Input
        const inputMsg = new net.InputMsg();
        inputMsg.seq = this.seq;
        if (!this.m_spectating) {
            if (device.touch) {
                const touchPlayerMovement = this.m_touch.getTouchMovement(this.m_camera);
                const touchAimMovement = this.m_touch.getAimMovement(
                    this.m_activePlayer,
                    this.m_camera,
                );
                let aimDir = v2.copy(touchAimMovement.aimMovement.toAimDir);
                this.m_touch.turnDirTicker -= dt;
                if (this.m_touch.moveDetected && !touchAimMovement.touched) {
                    // Keep looking in the old aimDir while waiting for the ticker
                    const touchDir = v2.normalizeSafe(
                        touchPlayerMovement.toMoveDir,
                        v2.create(1, 0),
                    );
                    const modifiedAimDir =
                        this.m_touch.turnDirTicker < 0
                            ? touchDir
                            : touchAimMovement.aimMovement.toAimDir;
                    this.m_touch.setAimDir(modifiedAimDir);
                    aimDir = modifiedAimDir;
                }
                if (touchAimMovement.touched) {
                    this.m_touch.turnDirTicker = this.m_touch.turnDirCooldown;
                }
                if (this.m_touch.moveDetected) {
                    inputMsg.touchMoveDir = v2.normalizeSafe(
                        touchPlayerMovement.toMoveDir,
                        v2.create(1, 0),
                    );
                    inputMsg.touchMoveLen = Math.round(
                        math.clamp(touchPlayerMovement.toMoveLen, 0, 1) * 255,
                    );
                } else {
                    inputMsg.touchMoveLen = 0;
                }
                inputMsg.touchMoveActive = true;
                const aimLen = touchAimMovement.aimMovement.toAimLen;
                const toTouchLenAdjusted =
                    math.clamp(aimLen / this.m_touch.padPosRange, 0, 1) *
                    GameConfig.player.throwableMaxMouseDist;
                inputMsg.toMouseLen = toTouchLenAdjusted;
                inputMsg.toMouseDir = aimDir;
            } else {
                // Only use arrow keys if they are unbound
                inputMsg.moveLeft =
                    this.m_inputBinds.isBindDown(Input.MoveLeft) ||
                    (this.m_input.keyDown(Key.Left) &&
                        !this.m_inputBinds.isKeyBound(Key.Left));
                inputMsg.moveRight =
                    this.m_inputBinds.isBindDown(Input.MoveRight) ||
                    (this.m_input.keyDown(Key.Right) &&
                        !this.m_inputBinds.isKeyBound(Key.Right));
                inputMsg.moveUp =
                    this.m_inputBinds.isBindDown(Input.MoveUp) ||
                    (this.m_input.keyDown(Key.Up) &&
                        !this.m_inputBinds.isKeyBound(Key.Up));
                inputMsg.moveDown =
                    this.m_inputBinds.isBindDown(Input.MoveDown) ||
                    (this.m_input.keyDown(Key.Down) &&
                        !this.m_inputBinds.isKeyBound(Key.Down));
                inputMsg.toMouseDir = v2.copy(toMouseDir);
                inputMsg.toMouseLen = toMouseLen;
            }
            inputMsg.touchMoveDir = v2.normalizeSafe(
                inputMsg.touchMoveDir,
                v2.create(1, 0),
            );
            inputMsg.touchMoveLen = math.clamp(inputMsg.touchMoveLen, 0, 255);
            inputMsg.toMouseDir = v2.normalizeSafe(inputMsg.toMouseDir, v2.create(1, 0));
            inputMsg.toMouseLen = math.clamp(
                inputMsg.toMouseLen,
                0,
                net.Constants.MouseMaxDist,
            );
            inputMsg.shootStart =
                this.m_inputBinds.isBindPressed(Input.Fire) || this.m_touch.shotDetected;
            inputMsg.shootHold =
                this.m_inputBinds.isBindDown(Input.Fire) || this.m_touch.shotDetected;
            inputMsg.portrait =
                this.m_camera.m_screenWidth < this.m_camera.m_screenHeight;
            const checkInputs = [
                Input.Reload,
                Input.Revive,
                Input.Use,
                Input.Loot,
                Input.Cancel,
                Input.EquipPrimary,
                Input.EquipSecondary,
                Input.EquipThrowable,
                Input.EquipMelee,
                Input.EquipNextWeap,
                Input.EquipPrevWeap,
                Input.EquipLastWeap,
                Input.EquipOtherGun,
                Input.EquipPrevScope,
                Input.EquipNextScope,
                Input.StowWeapons,
            ];
            for (let i = 0; i < checkInputs.length; i++) {
                const input = checkInputs[i];
                if (this.m_inputBinds.isBindPressed(input)) {
                    inputMsg.addInput(input);
                }
            }

            // Handle Interact
            // Interact should not activate Revive, Use, or Loot if those inputs are bound separately.
            if (this.m_inputBinds.isBindPressed(Input.Interact)) {
                const inputs = [];
                const interactBinds = [Input.Revive, Input.Use, Input.Loot];
                for (let i = 0; i < interactBinds.length; i++) {
                    const b = interactBinds[i];
                    if (!this.m_inputBinds.getBind(b)) {
                        inputs.push(b);
                    }
                }
                if (inputs.length == interactBinds.length) {
                    inputMsg.addInput(Input.Interact);
                } else {
                    for (let i = 0; i < inputs.length; i++) {
                        inputMsg.addInput(inputs[i]);
                    }
                }
            }

            // Swap weapon slots
            if (
                this.m_inputBinds.isBindPressed(Input.SwapWeapSlots) ||
                this.m_uiManager.swapWeapSlots
            ) {
                inputMsg.addInput(Input.SwapWeapSlots);
                this.m_activePlayer.gunSwitchCooldown = 0;
            }

            // Handle touch inputs
            if (this.m_uiManager.reloadTouched) {
                inputMsg.addInput(Input.Reload);
            }
            if (this.m_uiManager.interactionTouched) {
                inputMsg.addInput(Input.Interact);
                inputMsg.addInput(Input.Cancel);
            }

            // Process 'use' actions trigger from the ui
            for (let i = 0; i < this.m_ui2Manager.uiEvents.length; i++) {
                const e = this.m_ui2Manager.uiEvents[i];
                if (e.action == "use") {
                    if (e.type == "weapon") {
                        const weapIdxToInput = {
                            [WeaponSlot.Primary]: Input.EquipPrimary,
                            [WeaponSlot.Secondary]: Input.EquipSecondary,
                            [WeaponSlot.Melee]: Input.EquipMelee,
                            [WeaponSlot.Throwable]: Input.EquipThrowable,
                        };
                        const input =
                            weapIdxToInput[e.data as keyof typeof weapIdxToInput];
                        if (input) {
                            inputMsg.addInput(input);
                        }
                    } else {
                        inputMsg.useItem = e.data as string;
                    }
                }
            }
            if (this.m_inputBinds.isBindPressed(Input.UseBandage)) {
                inputMsg.useItem = "bandage";
            } else if (this.m_inputBinds.isBindPressed(Input.UseHealthKit)) {
                inputMsg.useItem = "healthkit";
            } else if (this.m_inputBinds.isBindPressed(Input.UseSoda)) {
                inputMsg.useItem = "soda";
            } else if (this.m_inputBinds.isBindPressed(Input.UsePainkiller)) {
                inputMsg.useItem = "painkiller";
            }

            // Process 'drop' actions triggered from the ui
            let playDropSound = false;
            for (let X = 0; X < this.m_ui2Manager.uiEvents.length; X++) {
                const uiEvent = this.m_ui2Manager.uiEvents[X];
                if (uiEvent.action == "drop") {
                    const dropMsg = new net.DropItemMsg();
                    if (uiEvent.type == "weapon") {
                        const eventData = uiEvent.data as number;
                        const Y = this.m_activePlayer.m_localData.m_weapons;
                        dropMsg.item = Y[eventData].type;
                        dropMsg.weapIdx = eventData;
                    } else if (uiEvent.type == "perk") {
                        const eventData = uiEvent.data as number;
                        const J = this.m_activePlayer.m_netData.m_perks;
                        const Q = J.length > eventData ? J[eventData] : null;
                        if (Q?.droppable) {
                            dropMsg.item = Q.type;
                        }
                    } else {
                        const item =
                            uiEvent.data == "helmet"
                                ? this.m_activePlayer.m_netData.m_helmet
                                : uiEvent.data == "chest"
                                  ? this.m_activePlayer.m_netData.m_chest
                                  : uiEvent.data;
                        dropMsg.item = item as string;
                    }
                    if (dropMsg.item != "") {
                        this.m_sendMessage(net.MsgType.DropItem, dropMsg, 128);
                        if (dropMsg.item != "fists") {
                            playDropSound = true;
                        }
                    }
                }
            }
            if (playDropSound) {
                this.m_audioManager.playSound("loot_drop_01", {
                    channel: "ui",
                });
            }
            if (this.m_uiManager.roleSelected) {
                const roleSelectMessage = new net.PerkModeRoleSelectMsg();
                roleSelectMessage.role = this.m_uiManager.roleSelected;
                this.m_sendMessage(
                    net.MsgType.PerkModeRoleSelect,
                    roleSelectMessage,
                    128,
                );
                this.m_config.set("perkModeRole", roleSelectMessage.role);
            }
        }
        const specBegin = this.m_uiManager.specBegin;
        const specNext =
            this.m_uiManager.specNext ||
            (this.m_spectating && this.m_input.keyPressed(Key.Right));
        const specPrev =
            this.m_uiManager.specPrev ||
            (this.m_spectating && this.m_input.keyPressed(Key.Left));
        const specForce =
            this.m_input.keyPressed(Key.Right) || this.m_input.keyPressed(Key.Left);
        if (specBegin || (this.m_spectating && specNext) || specPrev) {
            const specMsg = new net.SpectateMsg();
            specMsg.specBegin = specBegin;
            specMsg.specNext = specNext;
            specMsg.specPrev = specPrev;
            specMsg.specForce = specForce;
            this.m_sendMessage(net.MsgType.Spectate, specMsg, 128);
        }
        this.m_uiManager.specBegin = false;
        this.m_uiManager.specNext = false;
        this.m_uiManager.specPrev = false;
        this.m_uiManager.reloadTouched = false;
        this.m_uiManager.interactionTouched = false;
        this.m_uiManager.swapWeapSlots = false;
        this.m_uiManager.roleSelected = "";

        // Only send a InputMsg if the new data has changed from the previously sent data. For the look direction, we need to determine if the angle difference is large enough.
        let diff = false;
        for (const k in inputMsg) {
            if (inputMsg.hasOwnProperty(k)) {
                if (k == "inputs") {
                    diff = inputMsg[k].length > 0;
                } else if (k == "toMouseDir" || k == "touchMoveDir") {
                    const dot = math.clamp(
                        v2.dot(inputMsg[k], this.m_prevInputMsg[k]),
                        -1,
                        1,
                    );
                    const angle = math.rad2deg(Math.acos(dot));
                    diff = angle > 0.1;
                } else if (k == "toMouseLen") {
                    diff = Math.abs(this.m_prevInputMsg[k] - inputMsg[k]) > 0.5;
                } else if (k == "shootStart") {
                    diff = inputMsg[k] || inputMsg[k] != this.m_prevInputMsg[k];
                } else if (
                    this.m_prevInputMsg[k as keyof typeof this.m_prevInputMsg] !=
                    inputMsg[k as keyof typeof inputMsg]
                ) {
                    diff = true;
                }
                if (diff) {
                    break;
                }
            }
        }
        this.m_inputMsgTimeout -= dt;
        if (diff || this.m_inputMsgTimeout < 0) {
            if (!this.seqInFlight) {
                this.seq = (this.seq + 1) % 256;
                this.seqSendTime = Date.now();
                this.seqInFlight = true;
                inputMsg.seq = this.seq;
            }
            this.m_sendMessage(net.MsgType.Input, inputMsg, 128);
            this.m_inputMsgTimeout = 1;
            this.m_prevInputMsg = inputMsg;
        }

        // Clear cached data
        this.m_ui2Manager.flushInput();

        if (IS_DEV && this.editor.enabled && this.editor.sendMsg) {
            var msg = this.editor.getMsg();
            this.m_sendMessage(net.MsgType.Edit, msg);
            this.editor.postSerialization();
        }

        this.m_map.m_update(
            dt,
            this.m_activePlayer,
            this.m_playerBarn,
            this.m_particleBarn,
            this.m_audioManager,
            this.m_ambience,
            this.m_renderer,
            this.m_camera,
            smokeParticles,
            debug,
        );
        this.m_lootBarn.m_update(
            dt,
            this.m_activePlayer,
            this.m_map,
            this.m_audioManager,
            this.m_camera,
            debug,
        );
        this.m_bulletBarn.m_update(
            dt,
            this.m_playerBarn,
            this.m_map,
            this.m_camera,
            this.m_activePlayer,
            this.m_renderer,
            this.m_particleBarn,
            this.m_audioManager,
        );
        this.m_flareBarn.m_update(dt, this.m_map, this.m_activePlayer, this.m_renderer);
        this.m_projectileBarn.m_update(
            dt,
            this.m_particleBarn,
            this.m_audioManager,
            this.m_activePlayer,
            this.m_map,
            this.m_renderer,
            this.m_camera,
        );
        this.m_explosionBarn.m_update(
            dt,
            this.m_map,
            this.m_playerBarn,
            this.m_camera,
            this.m_particleBarn,
            this.m_audioManager,
            debug,
        );
        this.m_airdropBarn.m_update(
            dt,
            this.m_activePlayer,
            this.m_camera,
            this.m_map,
            this.m_particleBarn,
            this.m_renderer,
            this.m_audioManager,
        );
        this.m_planeBarn.m_update(
            dt,
            this.m_camera,
            this.m_activePlayer,
            this.m_map,
            this.m_renderer,
        );
        this.m_smokeBarn.m_update(
            dt,
            this.m_camera,
            this.m_activePlayer,
            this.m_map,
            this.m_renderer,
        );
        this.m_shotBarn.m_update(
            dt,
            this.m_activeId,
            this.m_playerBarn,
            this.m_particleBarn,
            this.m_audioManager,
        );
        this.m_particleBarn.m_update(dt, this.m_camera);
        this.m_deadBodyBarn.m_update(
            dt,
            this.m_playerBarn,
            this.m_activePlayer,
            this.m_map,
            this.m_camera,
            this.m_renderer,
        );
        this.m_decalBarn.m_update(dt, this.m_camera, this.m_renderer);
        this.m_uiManager.m_update(
            dt,
            this.m_activePlayer,
            this.m_map,
            this.m_gas,
            this.m_playerBarn,
            this.m_camera,
            this.teamMode,
            this.m_map.factionMode,
        );
        this.m_ui2Manager.m_update(
            dt,
            this.m_activePlayer,
            this.m_spectating,
            this.m_playerBarn,
            this.m_lootBarn,
            this.m_map,
            this.m_inputBinds,
        );
        this.m_emoteBarn.m_update(
            dt,
            this.m_localId,
            this.m_activePlayer,
            this.teamMode,
            this.m_deadBodyBarn,
            this.m_map,
            this.m_renderer,
            this.m_input,
            this.m_inputBinds,
            this.m_spectating,
        );
        this.m_touch.m_update(
            dt,
            this.m_activePlayer,
            this.m_map,
            this.m_camera,
            this.m_renderer,
        );
        this.m_renderer.m_update(dt, this.m_camera, this.m_map);

        for (let i = 0; i < this.m_emoteBarn.newPings.length; i++) {
            const ping = this.m_emoteBarn.newPings[i];
            const msg = new net.EmoteMsg();
            msg.type = ping.type;
            msg.pos = ping.pos;
            msg.isPing = true;
            this.m_sendMessage(net.MsgType.Emote, msg, 128);
        }
        this.m_emoteBarn.newPings = [];
        for (let i = 0; i < this.m_emoteBarn.newEmotes.length; i++) {
            const emote = this.m_emoteBarn.newEmotes[i];
            const msg = new net.EmoteMsg();
            msg.type = emote.type;
            msg.pos = emote.pos;
            msg.isPing = false;
            this.m_sendMessage(net.MsgType.Emote, msg, 128);
        }
        this.m_emoteBarn.newEmotes = [];

        const now = Date.now();
        if (now > this.debugPingTime) {
            this.debugPingTime = now + 20000;
            function format(str: string, len: number) {
                return (" ".repeat(len) + str).slice(-len);
            }
            const pings = this.pings.sort((a, b) => {
                return a - b;
            });
            const pLen = pings.length;
            if (pLen > 0) {
                const med = pings[Math.floor(pLen * 0.5)];
                const p95 = pings[Math.floor(pLen * 0.95)];
                const max = pings[pLen - 1];
                console.log(
                    "Ping     min:",
                    format(pings[0].toFixed(2), 7),
                    "med:",
                    format(med.toFixed(2), 7),
                    "p95:",
                    format(p95.toFixed(2), 7),
                    "max:",
                    format(max.toFixed(2), 7),
                );
            }
            this.pings = [];

            const intervals = this.updateIntervals.sort((a, b) => {
                return a - b;
            });
            const inteLen = intervals.length;
            if (inteLen > 0) {
                const med = intervals[Math.floor(inteLen * 0.5)];
                const p95 = intervals[Math.floor(inteLen * 0.95)];
                const max = intervals[inteLen - 1];
                console.log(
                    "Interval min:",
                    format(intervals[0].toFixed(2), 7),
                    "med:",
                    format(med.toFixed(2), 7),
                    "p95:",
                    format(p95.toFixed(2), 7),
                    "max:",
                    format(max.toFixed(2), 7),
                );
            }
            this.updateIntervals = [];
        }

        this.m_render(dt, debug);
    }

    m_render(dt: number, debug: DebugRenderOpts) {
        const grassColor = this.m_map.mapLoaded
            ? this.m_map.getMapDef().biome.colors.grass
            : 8433481;
        this.m_pixi.renderer.background.color = grassColor;
        // Module rendering
        this.m_playerBarn.m_render(this.m_camera, debug);
        this.m_bulletBarn.m_render(this.m_camera);
        this.m_flareBarn.m_render(this.m_camera);
        this.m_decalBarn.m_render(this.m_camera, debug, this.m_activePlayer.layer);
        this.m_map.m_render(this.m_camera);
        this.m_gas.m_render(dt, this.m_camera);
        this.m_uiManager.m_render(
            this.m_activePlayer.m_pos,
            this.m_gas,
            this.m_map,
            this.m_planeBarn,
        );
        this.m_emoteBarn.m_render(this.m_camera);
        if (IS_DEV) {
            this.m_debugDisplay.clear();
            if (debug.enabled) {
                debugLines.m_render(this.m_camera, this.m_debugDisplay);
            }
            debugLines.flush();
        }
    }

    updateAmbience() {
        const playerPos = this.m_activePlayer.m_pos;
        let wavesWeight = 0;
        let riverWeight = 0;
        let windWeight = 1;
        if (this.m_map.isInOcean(playerPos)) {
            wavesWeight = 1;
            riverWeight = 0;
            windWeight = 0;
        } else {
            const dist = this.m_map.distanceToShore(playerPos);
            wavesWeight = math.delerp(dist, 50, 0);
            riverWeight = 0;
            for (let i = 0; i < this.m_map.terrain!.rivers.length; i++) {
                const river = this.m_map.terrain?.rivers[i]!;
                const closestPointT = river.spline.getClosestTtoPoint(playerPos);
                const closestPoint = river.spline.getPos(closestPointT);
                const distanceToRiver = v2.length(v2.sub(closestPoint, playerPos));
                const riverWidth = river.waterWidth + 2;
                const normalizedDistance = math.delerp(
                    distanceToRiver,
                    30 + riverWidth,
                    riverWidth,
                );
                const riverStrength = math.clamp(river.waterWidth / 8, 0.25, 1);
                riverWeight = math.max(normalizedDistance * riverStrength, riverWeight);
            }
            if (this.m_activePlayer.layer == 1) {
                riverWeight = 0;
            }
            windWeight = 1;
        }
        this.m_ambience.getTrack("wind").weight = windWeight;
        this.m_ambience.getTrack("river").weight = riverWeight;
        this.m_ambience.getTrack("waves").weight = wavesWeight;
    }

    resize() {
        this.m_camera.m_screenWidth = device.screenWidth;
        this.m_camera.m_screenHeight = device.screenHeight;
        this.m_map.resize(this.m_pixi.renderer, this.m_canvasMode);
        this.m_gas.resize();
        this.m_uiManager.resize(this.m_map, this.m_camera);
        this.m_touch.resize();
        this.m_renderer.resize(this.m_map, this.m_camera);
    }

    m_processGameUpdate(msg: net.UpdateMsg) {
        const ctx: Ctx = {
            audioManager: this.m_audioManager,
            renderer: this.m_renderer,
            particleBarn: this.m_particleBarn,
            map: this.m_map,
            smokeBarn: this.m_smokeBarn,
            decalBarn: this.m_decalBarn,
        };
        // Update active playerId
        if (msg.activePlayerIdDirty) {
            this.m_activeId = msg.activePlayerId;
        }
        // Update player infos
        for (let i = 0; i < msg.playerInfos.length; i++) {
            this.m_playerBarn.setPlayerInfo(msg.playerInfos[i]);
        }
        // Delete player infos
        for (let i = 0; i < msg.deletedPlayerIds.length; i++) {
            const playerId = msg.deletedPlayerIds[i];
            this.m_playerBarn.deletePlayerInfo(playerId);
        }
        if (msg.playerInfos.length > 0 || msg.deletedPlayerIds.length > 0) {
            this.m_playerBarn.recomputeTeamData();
        }
        // Update player status
        if (msg.playerStatusDirty) {
            const teamId = this.m_playerBarn.getPlayerInfo(this.m_activeId).teamId;
            this.m_playerBarn.updatePlayerStatus(
                teamId,
                msg.playerStatus,
                this.m_map.factionMode,
            );
        }

        // Update group status
        if (msg.groupStatusDirty) {
            const groupId = this.m_playerBarn.getPlayerInfo(this.m_activeId).groupId;
            this.m_playerBarn.updateGroupStatus(groupId, msg.groupStatus);
        }

        // Delete objects
        for (let i = 0; i < msg.delObjIds.length; i++) {
            this.m_objectCreator.m_deleteObj(msg.delObjIds[i]);
        }

        // Update full objects
        for (let i = 0; i < msg.fullObjects.length; i++) {
            const obj = msg.fullObjects[i];
            this.m_objectCreator.m_updateObjFull(obj.__type, obj.__id, obj, ctx);
        }

        // Update partial objects
        for (let i = 0; i < msg.partObjects.length; i++) {
            const obj = msg.partObjects[i];
            this.m_objectCreator.m_updateObjPart(obj.__id, obj, ctx);
        }
        this.m_spectating = this.m_activeId != this.m_localId;
        this.m_activePlayer = this.m_playerBarn.getPlayerById(this.m_activeId)!;
        this.m_activePlayer.m_setLocalData(msg.activePlayerData);
        if (msg.activePlayerData.weapsDirty) {
            this.m_uiManager.weapsDirty = true;
        }
        if (this.m_spectating) {
            this.m_uiManager.setSpectateTarget(
                this.m_activeId,
                this.m_localId,
                this.teamMode,
                this.m_playerBarn,
            );
            this.m_touch.hideAll();
        }
        this.m_activePlayer.layer = this.m_activePlayer.m_netData.m_layer;
        this.m_renderer.setActiveLayer(this.m_activePlayer.layer);
        this.m_audioManager.activeLayer = this.m_activePlayer.layer;
        const underground = this.m_activePlayer.isUnderground(this.m_map);
        this.m_renderer.setUnderground(underground);
        this.m_audioManager.underground = underground;

        // Gas data
        if (msg.gasDirty) {
            this.m_gas.setFullState(msg.gasT, msg.gasData, this.m_uiManager);
        }
        if (msg.gasTDirty) {
            this.m_gas.setProgress(msg.gasT);
        }

        // Create bullets
        for (let i = 0; i < msg.bullets.length; i++) {
            const b = msg.bullets[i];
            createBullet(
                b,
                this.m_bulletBarn,
                this.m_flareBarn,
                this.m_playerBarn,
                this.m_renderer,
            );
            if (b.shotFx) {
                this.m_shotBarn.addShot(b);
            }
        }
        // Create explosions
        for (let i = 0; i < msg.explosions.length; i++) {
            const e = msg.explosions[i];
            this.m_explosionBarn.addExplosion(e.type, e.pos, e.layer);
        }

        // Create emotes and pings
        for (let i = 0; i < msg.emotes.length; i++) {
            const e = msg.emotes[i];
            if (e.isPing) {
                this.m_emoteBarn.addPing(e, this.m_map.factionMode);
            } else {
                this.m_emoteBarn.addEmote(e);
            }
        }

        // Update planes
        this.m_planeBarn.updatePlanes(msg.planes, this.m_map);

        // Create airstrike zones
        for (let x = 0; x < msg.airstrikeZones.length; x++) {
            this.m_planeBarn.createAirstrikeZone(msg.airstrikeZones[x]);
        }

        // Update map indicators
        this.m_uiManager.updateMapIndicators(msg.mapIndicators);

        // Update kill leader
        if (msg.killLeaderDirty) {
            const leaderNameText = helpers.htmlEscape(
                this.m_playerBarn.getPlayerName(msg.killLeaderId, this.m_activeId, true),
            );
            this.m_uiManager.updateKillLeader(
                msg.killLeaderId,
                leaderNameText,
                msg.killLeaderKills,
                this.m_map.getMapDef().gameMode,
            );
        }

        // Latency determination
        const now = Date.now();
        this.m_updateRecvCount++;
        if (msg.ack == this.seq && this.seqInFlight) {
            this.seqInFlight = false;
            const ping = now - this.seqSendTime;
            this.debugHUD.pingGraph.addEntry(ping);
            this.pings.push(ping);
        }
        if (this.lastUpdateTime > 0) {
            const interval = now - this.lastUpdateTime;
            this.m_camera.m_interpInterval = interval / 1000;
            this.updateIntervals.push(interval);
        }
        this.lastUpdateTime = now;
    }

    // Socket functions
    m_onMsg(type: net.MsgType, stream: net.BitStream) {
        switch (type) {
            case net.MsgType.Joined: {
                const msg = new net.JoinedMsg();
                msg.deserialize(stream);
                this.onJoin();
                this.teamMode = msg.teamMode;
                this.m_localId = msg.playerId;
                this.m_validateAlpha = true;
                this.m_emoteBarn.updateEmoteWheel(msg.emotes);
                if (!msg.started) {
                    this.m_uiManager.setWaitingForPlayers(true);
                }
                this.m_uiManager.removeAds();
                if (this.victoryMusic) {
                    this.victoryMusic.stop();
                    this.victoryMusic = null;
                }
                // Play a sound if the user in another windows or tab
                if (!document.hasFocus()) {
                    this.m_audioManager.playSound("notification_start_01", {
                        channel: "ui",
                    });
                }

                SDK.gamePlayStart();
                break;
            }
            case net.MsgType.Map: {
                const msg = new net.MapMsg();
                msg.deserialize(stream);
                this.m_map.loadMap(
                    msg,
                    this.m_camera,
                    this.m_canvasMode,
                    this.m_particleBarn,
                );
                this.m_resourceManager.loadMapAssets(this.m_map.mapName);
                this.m_map.renderMap(this.m_pixi.renderer, this.m_canvasMode);
                this.m_bulletBarn.onMapLoad(this.m_map);
                this.m_particleBarn.onMapLoad(this.m_map);
                this.m_uiManager.onMapLoad(this.m_map, this.m_camera);
                if (this.m_map.perkMode) {
                    const role = this.m_config.get("perkModeRole")!;
                    this.m_uiManager.setRoleMenuOptions(
                        role,
                        this.m_map.getMapDef().gameMode.perkModeRoles!,
                    );
                    this.m_uiManager.setRoleMenuActive(true);
                } else {
                    this.m_uiManager.setRoleMenuActive(false);
                }

                if (IS_DEV) {
                    this.editor.toolParams.mapSeed = msg.seed;
                    this.editor.pane.refresh();
                }
                break;
            }
            case net.MsgType.Update: {
                const msg = new net.UpdateMsg();
                msg.deserialize(stream, this.m_objectCreator);
                this.m_playing = true;
                this.m_processGameUpdate(msg);
                break;
            }
            case net.MsgType.Kill: {
                const msg = new net.KillMsg();
                msg.deserialize(stream);
                const sourceType = msg.itemSourceType || msg.mapSourceType;
                const activeTeamId = this.m_playerBarn.getPlayerInfo(
                    this.m_activeId,
                ).teamId;
                const useKillerInfoInFeed =
                    (msg.downed && !msg.killed) ||
                    msg.damageType == GameConfig.DamageType.Gas ||
                    msg.damageType == GameConfig.DamageType.Bleeding ||
                    msg.damageType == GameConfig.DamageType.Airdrop;
                const targetInfo = this.m_playerBarn.getPlayerInfo(msg.targetId);
                const killerInfo = this.m_playerBarn.getPlayerInfo(msg.killCreditId);
                const killfeedKillerInfo = useKillerInfoInFeed
                    ? killerInfo
                    : this.m_playerBarn.getPlayerInfo(msg.killerId);
                let targetName = this.m_playerBarn.getPlayerName(
                    targetInfo.playerId,
                    this.m_activeId,
                    true,
                );
                let killerName = this.m_playerBarn.getPlayerName(
                    killerInfo.playerId,
                    this.m_activeId,
                    true,
                );
                let killfeedKillerName = this.m_playerBarn.getPlayerName(
                    killfeedKillerInfo.playerId,
                    this.m_activeId,
                    true,
                );
                targetName = helpers.htmlEscape(targetName);
                killerName = helpers.htmlEscape(killerName);
                killfeedKillerName = helpers.htmlEscape(killfeedKillerName);
                // Display the kill / downed notification for the active player
                if (msg.killCreditId == this.m_activeId) {
                    const completeKill = msg.killerId == this.m_activeId;
                    const suicide =
                        msg.killerId == msg.targetId || msg.killCreditId == msg.targetId;
                    const killText = this.m_ui2Manager.getKillText(
                        killerName,
                        targetName,
                        completeKill,
                        msg.downed,
                        msg.killed,
                        suicide,
                        sourceType,
                        msg.damageType,
                        this.m_spectating,
                    );
                    const killCountText =
                        msg.killed && !suicide
                            ? this.m_ui2Manager.getKillCountText(msg.killerKills)
                            : "";
                    this.m_ui2Manager.displayKillMessage(killText, killCountText);
                } else if (msg.targetId == this.m_activeId && msg.downed && !msg.killed) {
                    const downedText = this.m_ui2Manager.getDownedText(
                        killerName,
                        targetName,
                        sourceType,
                        msg.damageType,
                        this.m_spectating,
                    );
                    this.m_ui2Manager.displayKillMessage(downedText, "");
                }

                // Update local kill counter
                if (msg.killCreditId == this.m_localId && msg.killed) {
                    this.m_uiManager.setLocalKills(msg.killerKills);
                }

                // Add killfeed entry for this kill
                const killText = this.m_ui2Manager.getKillFeedText(
                    targetName,
                    killfeedKillerInfo.teamId ? killfeedKillerName : "",
                    sourceType,
                    msg.damageType,
                    msg.downed && !msg.killed,
                );
                const killColor = this.m_ui2Manager.getKillFeedColor(
                    activeTeamId,
                    targetInfo.teamId,
                    killerInfo.teamId,
                    this.m_map.factionMode,
                );
                this.m_ui2Manager.addKillFeedMessage(killText, killColor);
                if (msg.killed) {
                    this.m_playerBarn.addDeathEffect(
                        msg.targetId,
                        msg.killerId,
                        this.m_audioManager,
                        this.m_particleBarn,
                    );
                }

                // Bullets often don't play hit sounds on the frame that a player dies
                if (msg.damageType == GameConfig.DamageType.Player) {
                    this.m_bulletBarn.createBulletHit(
                        this.m_playerBarn,
                        msg.targetId,
                        this.m_audioManager,
                    );
                }

                break;
            }
            case net.MsgType.RoleAnnouncement: {
                const msg = new net.RoleAnnouncementMsg();
                msg.deserialize(stream);
                const roleDef = RoleDefs[msg.role];
                if (!roleDef) {
                    break;
                }
                const playerInfo = this.m_playerBarn.getPlayerInfo(msg.playerId);
                const nameText = helpers.htmlEscape(
                    this.m_playerBarn.getPlayerName(msg.playerId, this.m_activeId, true),
                );
                if (msg.assigned) {
                    if (roleDef.sound?.assign) {
                        if (
                            msg.role == "kill_leader" &&
                            this.m_map.getMapDef().gameMode.spookyKillSounds
                        ) {
                            // Halloween map has special logic for the kill leader sounds
                            this.m_audioManager.playGroup("kill_leader_assigned", {
                                channel: "ui",
                            });
                        } else if (
                            // The intent here is to not play the role-specific assignment sounds in perkMode unless you're the player selecting a role.
                            msg.role == "kill_leader" ||
                            !this.m_map.perkMode ||
                            this.m_localId == msg.playerId
                        ) {
                            this.m_audioManager.playSound(roleDef.sound.assign, {
                                channel: "ui",
                            });
                        }
                    }
                    if (this.m_map.perkMode && this.m_localId == msg.playerId) {
                        this.m_uiManager.setRoleMenuActive(false);
                    }
                    if (roleDef.killFeed?.assign) {
                        // In addition to playing a sound, display a notification on the killfeed
                        const killText = this.m_ui2Manager.getRoleAssignedKillFeedText(
                            msg.role,
                            playerInfo.teamId,
                            nameText,
                        );
                        const killColor = this.m_ui2Manager.getRoleKillFeedColor(
                            msg.role,
                            playerInfo.teamId,
                            this.m_playerBarn,
                        );
                        this.m_ui2Manager.addKillFeedMessage(killText, killColor);
                    }
                    // Show an announcement if you've been assigned a role
                    if (roleDef.announce && this.m_localId == msg.playerId) {
                        const assignText = this.m_ui2Manager.getRoleAnnouncementText(
                            msg.role,
                            playerInfo.teamId,
                        );
                        this.m_uiManager.displayAnnouncement(assignText.toUpperCase());
                    }
                } else if (msg.killed) {
                    if (roleDef.killFeed?.dead) {
                        let killerName = helpers.htmlEscape(
                            this.m_playerBarn.getPlayerName(
                                msg.killerId,
                                this.m_activeId,
                                true,
                            ),
                        );

                        if (msg.playerId == msg.killerId) {
                            killerName = "";
                        }
                        const killText = this.m_ui2Manager.getRoleKilledKillFeedText(
                            msg.role,
                            playerInfo.teamId,
                            killerName,
                        );
                        const killColor = this.m_ui2Manager.getRoleKillFeedColor(
                            msg.role,
                            playerInfo.teamId,
                            this.m_playerBarn,
                        );
                        this.m_ui2Manager.addKillFeedMessage(killText, killColor);
                    }
                    if (roleDef.sound?.dead) {
                        if (this.m_map.getMapDef().gameMode.spookyKillSounds) {
                            this.m_audioManager.playGroup("kill_leader_dead", {
                                channel: "ui",
                            });
                        } else {
                            this.m_audioManager.playSound(roleDef.sound.dead, {
                                channel: "ui",
                            });
                        }
                    }
                }
                break;
            }
            case net.MsgType.PlayerStats: {
                const msg = new net.PlayerStatsMsg();
                msg.deserialize(stream);
                this.m_uiManager.setLocalStats(msg.playerStats);
                this.m_uiManager.showTeamAd(msg.playerStats, this.m_ui2Manager);
                break;
            }
            case net.MsgType.Stats: {
                stream.readString();
                break;
            }
            case net.MsgType.GameOver: {
                const msg = new net.GameOverMsg();
                msg.deserialize(stream);
                this.m_gameOver = msg.gameOver;
                const localTeamId = this.m_playerBarn.getPlayerInfo(
                    this.m_localId,
                ).teamId;

                // Set local stats based on final results.
                // This is necessary because the last person on a team to die
                // will not receive a PlayerStats message, they will only receive
                // the GameOver message.
                for (let j = 0; j < msg.playerStats.length; j++) {
                    const stats = msg.playerStats[j];
                    if (stats.playerId == this.m_localId) {
                        this.m_uiManager.setLocalStats(stats);
                        break;
                    }
                }
                this.m_uiManager.showStats(
                    msg.playerStats,
                    msg.teamId,
                    msg.teamRank,
                    msg.winningTeamId,
                    msg.gameOver,
                    localTeamId,
                    this.teamMode,
                    this.m_spectating,
                    this.m_playerBarn,
                    this.m_audioManager,
                    this.m_map,
                    this.m_ui2Manager,
                );
                if (localTeamId == msg.winningTeamId) {
                    this.victoryMusic = this.m_audioManager.playSound("menu_music", {
                        channel: "music",
                        delay: 1300,
                        forceStart: true,
                    });
                }
                this.m_touch.hideAll();
                break;
            }
            case net.MsgType.Pickup: {
                const msg = new net.PickupMsg();
                msg.deserialize(stream);
                if (msg.type == net.PickupMsgType.Success && msg.item) {
                    this.m_activePlayer.playItemPickupSound(
                        msg.item,
                        this.m_audioManager,
                    );
                    const itemDef = GameObjectDefs[msg.item];
                    if (itemDef && itemDef.type == "xp") {
                        this.m_ui2Manager.addRareLootMessage(msg.item, true);
                    }
                } else {
                    this.m_ui2Manager.displayPickupMessage(msg.type);
                }
                break;
            }
            case net.MsgType.UpdatePass: {
                new net.UpdatePassMsg().deserialize(stream);
                this.m_updatePass = true;
                this.m_updatePassDelay = 0;
                break;
            }
            case net.MsgType.AliveCounts: {
                const msg = new net.AliveCountsMsg();
                msg.deserialize(stream);
                if (msg.teamAliveCounts.length == 1) {
                    this.m_uiManager.updatePlayersAlive(msg.teamAliveCounts[0]);
                } else if (msg.teamAliveCounts.length >= 2) {
                    this.m_uiManager.updatePlayersAliveRed(msg.teamAliveCounts[0]);
                    this.m_uiManager.updatePlayersAliveBlue(msg.teamAliveCounts[1]);
                }
                break;
            }
            case net.MsgType.Disconnect: {
                const msg = new net.DisconnectMsg();
                msg.deserialize(stream);
                this.m_disconnectMsg = msg.reason;
            }
        }
    }

    m_sendMessage(type: net.MsgType, data: net.Msg, maxLen?: number) {
        const bufSz = maxLen || 128;
        const msgStream = new net.MsgStream(new ArrayBuffer(bufSz));
        msgStream.serializeMsg(type, data);
        this.m_sendMessageImpl(msgStream);
    }

    m_sendMessageImpl(msgStream: net.MsgStream) {
        // Separate function call so sendMessage can be optimized;
        // v8 won't optimize functions containing a try/catch
        if (this.m_ws && this.m_ws.readyState == this.m_ws.OPEN) {
            try {
                this.m_ws.send(msgStream.getBuffer());
            } catch (e) {
                console.error("sendMessageException", e);
                this.m_ws.close();
            }
        }
    }
}
