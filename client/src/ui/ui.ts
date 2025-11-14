import $ from "jquery";
import * as PIXI from "pixi.js-legacy";
import { GameObjectDefs } from "../../../shared/defs/gameObjectDefs";
import { PingDefs } from "../../../shared/defs/gameObjects/pingDefs";
import { type RoleDef, RoleDefs } from "../../../shared/defs/gameObjects/roleDefs";
import type { MapDef } from "../../../shared/defs/mapDefs";
import { Action, GameConfig, GasMode, TeamMode } from "../../../shared/gameConfig";
import type { PlayerStatsMsg } from "../../../shared/net/playerStatsMsg";
import type { MapIndicator, PlayerStatus } from "../../../shared/net/updateMsg";
import { coldet } from "../../../shared/utils/coldet";
import { math } from "../../../shared/utils/math";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { AudioManager } from "../audioManager";
import type { Camera } from "../camera";
import { device } from "../device";
import { errorLogManager } from "../errorLogs";
import type { Game } from "../game";
import { type Gas, GasRenderer, GasSafeZoneRenderer } from "../gas";
import { helpers } from "../helpers";
import type { InputBinds, InputBindUi } from "./../inputBinds";
import type { SoundHandle } from "../lib/createJS";
import type { Map } from "../map";
import { MapIndicatorBarn } from "../objects/mapIndicator";
import { type MapSprite, MapSpriteBarn } from "../objects/mapSprite";
import type { ParticleBarn } from "../objects/particles";
import type { PlaneBarn } from "../objects/plane";
import type { Player, PlayerBarn } from "../objects/player";
import { SDK } from "../sdk";
import type { Localization } from "./localization";
import { PieTimer } from "./pieTimer";
import type { Touch } from "./touch";
import type { UiManager2 } from "./ui2";

function humanizeTime(time: number) {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor(time / 60) % 60;
    const seconds = Math.floor(time) % 60;
    let timeText = "";
    if (hours > 0) {
        timeText += `${hours}h `;
    }
    if (hours > 0 || minutes > 0) {
        timeText += `${minutes}m `;
    }
    return (timeText += `${seconds}s`);
}

function Interpolate(start: number, end: number, steps: number, count: number) {
    const f = start + ((end - start) / steps) * count;
    return Math.floor(f);
}

class Color {
    constructor(
        public r: number,
        public g: number,
        public b: number,
    ) {}

    getColors() {
        return {
            r: this.r,
            g: this.g,
            b: this.b,
        };
    }
}

interface ContainerWithMask extends PIXI.Container {
    mask: PIXI.Graphics;
}

type PrevStatus = Pick<PlayerStatus, "downed" | "dead" | "disconnected" | "role">;
export class UiManager {
    m_pieTimer = new PieTimer();
    gameElem = $("#ui-game");
    statsMain = $("#ui-stats");
    statsElem = $("#ui-stats-bg");
    statsContentsContainer = $("#ui-stats-contents");
    statsContents = $("#ui-stats-contents-inner");
    statsHeader = $("#ui-stats-header");
    statsInfoBox = $("#ui-stats-info-box");
    statsOptions = $("#ui-stats-options");
    statsAds = $(".ui-stats-ad-container");
    statsLogo = $("#ui-stats-logo");
    escMenuElem = $("#ui-game-menu");
    escMenuDisplayed = false;
    roleMenuElemWrapper = $("#ui-role-menu-wrapper");
    roleMenuElem = $("#ui-role-menu");
    roleMenuFooterEnterElem = $("#ui-role-footer-enter");
    roleMenuFooterHtml = "";
    roleMenuActive = false;
    roleMenuDisplayed = false;
    roleMenuTicker = 0;
    roleDisplayed = "";
    roleSelected = "";
    roleMenuConfirm = $("#ui-role-footer-enter");

    roleMenuInst: SoundHandle | null = null;
    topLeft = $("#ui-top-left");
    waitingForPlayers = true;
    waitingText = $("#ui-waiting-text");
    spectating = false;
    prevSpectatorCount = 0;
    spectatorCount = 0;
    spectatorCounterDisplayed = false;
    spectatorCounterContainer = $("#ui-spec-counter");
    spectatorCounter = $("#ui-spec-counter-number");
    spectateMode = $(".ui-spectate-mode");
    spectatedPlayerText = $("#ui-spectate-text");
    spectatedPlayerName = "";
    spectatedPlayerId = 0;
    spectateModeStats = $("#ui-spectate-stats");
    spectateModeStatsData = $("#ui-spectate-stats-data");
    spectateOptionsWrapper = $("#ui-spectate-options-wrapper");
    rightCenter = $("#ui-right-center");
    leaderboardAlive = $("#ui-leaderboard-alive");
    playersAlive = $(".js-ui-players-alive");
    leaderboardAliveFaction = $("#ui-leaderboard-alive-faction");
    playersAliveRed = $(".js-ui-players-alive-red");
    playersAliveBlue = $(".js-ui-players-alive-blue");
    playersAliveRedCounter = 0;
    playersAliveBlueCounter = 0;
    playerKills = $(".js-ui-player-kills");
    announcement = $("#ui-announcement");
    killLeaderName = $("#ui-kill-leader-name");
    killLeaderCount = $("#ui-kill-leader-count");
    mapContainer = $("#ui-map-container");
    mapContainerBottom = 52;
    mapInfo = $("#ui-map-info");
    mapInfoBottom = 218;
    gasState = {} as {
        mode: number;
        time: number;
    };

    gasIcon = $("#ui-gas-icon");
    gasTimer = $("#ui-gas-timer");
    mapMinimizeButton = $("#ui-map-minimize");
    menuDisplayButton = $("#ui-menu-display");
    bottomCenterRight = $("#ui-bottom-center-right");

    actionSeq = -1;
    displayMapDirty = false;
    displayMapClear = false;

    // In-game menu
    gameTabs = $(".ui-game-tab");
    gameTabBtns = $(".btn-game-tab-select");
    gameKeybindBtns = $(".btn-keybind-desc");
    currentGameTab = "settings";

    onTouchScreen!: (e: any) => void;

    bigmap = $("#big-map");
    bigmapCollision = $("#big-map-collision");
    bigmapClose = $("#big-map-close");
    moveStyleButton = $("#btn-game-move-style");
    aimLineButton = $("#btn-game-aim-line");
    aimStyleButton = $("#btn-game-aim-style");

    fullScreenButton = $("#btn-game-fullscreen");
    resumeButton = $("#btn-game-resume");

    specStatsButton = $("#btn-spectate-view-stats");
    specBegin = false;
    specNext = false;
    specPrev = false;
    specNextButton = $("#btn-spectate-next-player");
    specPrevButton = $("#btn-spectate-prev-player");

    // Touch specific buttons
    interactionElems = $("#ui-interaction-press, #ui-interaction");
    interactionTouched = false;

    reloadElems = $("#ui-current-clip, #ui-remaining-ammo, #ui-reload-button-container");

    reloadTouched = false;

    // Faction flair display
    flairElems = $(".ui-health-flair");
    flairId = 0;

    // Health bar values
    healthRed = new Color(255, 0, 0);
    healthDarkpink = new Color(255, 45, 45);
    healthLightpink = new Color(255, 112, 112);
    healthWhite = new Color(255, 255, 255);
    healthGrey = new Color(179, 179, 179);

    // Store minimap hidden
    minimapDisplayed = true;

    // Store UI visiblity mode
    visibilityMode = 0;
    hudVisible = true;

    gasRenderer!: GasRenderer;
    gasSafeZoneRenderer = new GasSafeZoneRenderer();
    sentAdStatus = false;
    frame = 0;
    weapsDirty = false;
    weapSwitches = $("#ui-weapon-id-1, #ui-weapon-id-2");
    weapNoSwitches = $("#ui-weapon-id-3, #ui-weapon-id-4");
    weapDraggedId = 0;
    swapWeapSlots = false;
    weapDraggedDiv: JQuery<HTMLElement> | null = null;
    weapDragging = false;
    weapDropped = false;

    mapSpriteBarn = new MapSpriteBarn();
    mapIndicatorBarn!: MapIndicatorBarn;
    playerMapSprites: MapSprite[] = [];
    playerPingSprites = {} as Record<number, MapSprite[]>;
    container = new PIXI.Container() as ContainerWithMask;

    resetWeapSlotStyling!: () => void;
    display: {
        gas: PIXI.DisplayObject;
        gasSafeZone: PIXI.Container;
        airstrikeZones: PIXI.Container;
        mapSprites: PIXI.Container;
        teammates: PIXI.Container;
        player: PIXI.Container;
        border: PIXI.Graphics;
    };

    mapSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    bigmapDisplayed = false;
    screenScaleFactor = 1;
    minimapPos!: Vec2;

    dead = false;

    // Audio
    muteButton = $("#ui-mute-ingame");
    muteButtonImage!: JQuery<HTMLImageElement>;
    muteOffImg = "audio-off.img";
    muteOnImg = "audio-on.img";

    displayingStats = false;
    teamMemberHealthBarWidth!: number;

    teamMemberHeight = 48;
    groupPlayerCount = 0;
    teamSelectors: Array<{
        teamNameHtml: string;
        groupId: JQuery<HTMLElement>;
        groupIdDisplayed: boolean;
        teamName: JQuery<HTMLElement>;
        teamIcon: JQuery<HTMLElement>;
        teamStatus: JQuery<HTMLElement>;
        teamHealthInner: JQuery<HTMLElement>;
        teamColor: JQuery<HTMLElement>;
        playerId: number;
        prevHealth: number;
        prevStatus: PrevStatus;
        indicators: Record<
            string,
            {
                elem: JQuery<HTMLElement>;
                displayed: boolean;
                displayAll?: boolean;
            }
        >;
    }> = [];

    displayOldMapSprites = false;

    constructor(
        public game: Game,
        public audioManager: AudioManager,
        public particleBarn: ParticleBarn,
        public planeBarn: PlaneBarn,
        public localization: Localization,
        public canvasMode: boolean,
        public touch: Touch,
        public inputBinds: InputBinds,
        public inputBindUi: InputBindUi,
    ) {
        this.game = game;
        this.particleBarn = particleBarn;
        this.localization = localization;
        this.touch = touch;
        this.inputBinds = inputBinds;
        this.inputBindUi = inputBindUi;

        this.roleMenuConfirm.on("click", (e) => {
            e.stopPropagation();
            this.roleSelected = this.roleDisplayed;
            this.setRoleMenuActive(false);
        });

        $("#ui-map-wrapper").css("display", "block");
        $("#ui-team").css("display", "block");

        $(".ui-map-expand").on("mousedown", (e) => {
            e.stopPropagation();
        });
        $(".ui-map-expand").on("click", (_e) => {
            if (device.touch) {
                if (!this.bigmapDisplayed) {
                    this.displayMapLarge();
                }
            } else if (device.uiLayout == device.UiLayout.Lg) {
                this.displayMapLarge(this.bigmapDisplayed);
            }
        });
        $("#ui-map-minimize").on("mousedown", (e) => {
            e.stopPropagation();
        });
        $("#ui-map-minimize").on("click", (e) => {
            e.stopPropagation();
            this.toggleMiniMap();
        });
        $("#ui-menu-display").on("click", (e) => {
            e.stopPropagation();
            this.toggleEscMenu();
        });

        this.moveStyleButton.on("touchstart", () => {
            touch.toggleMoveStyle();
        });
        this.aimStyleButton.on("touchstart", () => {
            touch.toggleAimStyle();
        });
        this.aimLineButton.on("touchstart", () => {
            touch.toggleAimLine();
        });
        this.onTouchScreen = (e: Event) => {
            if ((e.target as HTMLElement)?.id == "cvs") {
                this.toggleEscMenu(true);
            }
        };
        $(document).on("touchstart", this.onTouchScreen);
        this.bigmapClose = $("#big-map-close");
        this.bigmapClose.on("touchend", (e) => {
            e.stopPropagation();
            this.displayMapLarge(true);
        });
        this.bigmapClose.on("mousedown", (e) => {
            e.stopPropagation();
        });
        this.bigmapClose.on("click", (e) => {
            e.stopPropagation();
            this.displayMapLarge(true);
        });

        this.gameTabBtns.on("click", (e) => {
            this.setCurrentGameTab($(e.target).data("tab"));
        });
        this.setCurrentGameTab(this.currentGameTab);

        this.fullScreenButton.on("mousedown", (e) => {
            e.stopPropagation();
        });
        this.fullScreenButton.on("click", () => {
            helpers.toggleFullScreen();
            this.toggleEscMenu();
        });

        // Display full screen
        $("#btn-game-fullscreen").css("display", SDK.isAnySDK ? "none" : "block");

        this.resumeButton.on("mousedown", (e) => {
            e.stopPropagation();
        });
        this.resumeButton.on("click", () => {
            this.toggleEscMenu();
        });
        if (device.touch) {
            this.resumeButton.css("display", "none");
        }
        $("#btn-spectate-quit").on("click", () => {
            this.quitGame();
        });
        $("#btn-game-quit").on("mousedown", (e) => {
            e.stopPropagation();
        });
        $("#btn-game-quit").on("click", () => {
            this.game.m_updatePass = true;
            this.game.m_updatePassDelay = 1;
            this.quitGame();
        });
        this.specStatsButton.on("click", () => {
            this.toggleLocalStats();
        });

        this.specNextButton.on("click", () => {
            this.specNext = true;
        });
        this.specPrevButton.on("click", () => {
            this.specPrev = true;
        });

        // Touch specific buttons
        this.interactionElems.css("pointer-events", "auto");
        this.interactionElems.on("touchstart", (e) => {
            e.stopPropagation();
            this.interactionTouched = true;
        });

        this.reloadElems.css("pointer-events", "auto");
        this.reloadElems.on("touchstart", (e) => {
            e.stopPropagation();
            this.reloadTouched = true;
        });

        this.gasRenderer = new GasRenderer(canvasMode, 0x000000);

        this.resetWeapSlotStyling = () => {
            if (this.weapDraggedDiv) {
                this.weapSwitches.css({
                    left: "",
                    top: "",
                });
                $("#ui-game").css({
                    "pointer-events": "",
                });
            }
            this.weapDraggedDiv = null;
            this.weapDragging = false;
            this.weapDropped = false;
            if (this.weapSwitches.hasClass("ui-weapon-dragged")) {
                this.weapSwitches.removeClass("ui-weapon-dragged");
            }
            if (!this.weapNoSwitches.hasClass("ui-outline-hover")) {
                this.weapNoSwitches.addClass("ui-outline-hover");
            }
        };
        if (!device.touch) {
            this.weapSwitches.on("mousedown", (e) => {
                const elem = e.currentTarget;
                if (e.button == 0) {
                    this.weapDraggedDiv = $(elem);
                    this.weapDraggedId = $(elem).data("slot");
                }
            });
            $("#ui-game").on("mousemove", (e) => {
                if (this.weapDraggedDiv && !this.weapDropped) {
                    if (this.weapDragging) {
                        this.weapDraggedDiv.css({
                            left: e.pageX - 80,
                            top: e.pageY - 30,
                        });
                        this.weapDraggedDiv.addClass("ui-weapon-dragged");
                    } else {
                        $("#ui-game").css({
                            "pointer-events": "initial",
                        });
                        this.weapNoSwitches.removeClass("ui-outline-hover");
                        this.weapDragging = true;
                    }
                }
            });
            $("#ui-game, #ui-weapon-id-1, #ui-weapon-id-2").on("mouseup", (e) => {
                if (e.button == 0 && this.weapDraggedDiv != null) {
                    this.weapSwitches.each(() => {
                        const id = $(e.currentTarget).data("slot");
                        if ($(e.currentTarget).is(":hover") && this.weapDraggedId != id) {
                            this.swapWeapSlots = true;
                            this.weapDropped = true;
                        }
                    });
                    if (!this.swapWeapSlots) {
                        this.resetWeapSlotStyling();
                    }
                }
            });
        }
        this.mapIndicatorBarn = new MapIndicatorBarn(this.mapSpriteBarn);

        this.container.mask = new PIXI.Graphics();

        this.display = {
            gas: this.gasRenderer.display!,
            gasSafeZone: this.gasSafeZoneRenderer.display,
            airstrikeZones: planeBarn.airstrikeZoneContainer,
            mapSprites: this.mapSpriteBarn.container,
            teammates: new PIXI.Container(),
            player: new PIXI.Container(),
            border: new PIXI.Graphics(),
        };

        this.mapSprite.anchor = new PIXI.Point(0.5, 0.5) as PIXI.ObservablePoint;
        this.container.addChild(this.mapSprite);
        this.container.addChild(this.display.gas);
        this.container.addChild(this.display.gasSafeZone);
        this.container.addChild(this.display.airstrikeZones);
        this.container.addChild(this.display.mapSprites);
        this.container.addChild(this.display.teammates);
        this.container.addChild(this.display.player);
        this.container.addChild(this.display.border);

        const minimapMargin = this.getMinimapMargin();
        const minimapSize = this.getMinimapSize();
        this.minimapPos = v2.create(
            minimapMargin + minimapSize / 2,
            game.m_camera.m_screenHeight - minimapSize / 2 - minimapMargin,
        );

        // Audio
        this.muteButtonImage = this.muteButton.find("img");
        const muteAudio = this.audioManager.mute;
        this.muteButtonImage.attr("src", muteAudio ? this.muteOffImg : this.muteOnImg);
        this.muteButton.on("mousedown", (e) => {
            e.stopPropagation();
        });

        this.muteButton.on("click", (_e) => {
            let muteAudio = this.audioManager.muteToggle();
            this.muteButtonImage.attr(
                "src",
                muteAudio ? this.muteOffImg : this.muteOnImg,
            );
            // @ts-expect-error why assing it to null?
            muteAudio = null;
        });
        this.teamMemberHealthBarWidth = parseInt(
            $(".ui-team-member-health").find(".ui-bar-inner").css("width"),
        );

        for (let i = 0; i < 4; i++) {
            const parent = this.topLeft;
            const slotIdx = i;
            this.teamSelectors.push({
                teamNameHtml: "",
                groupId: $(parent).find(`[data-id=${slotIdx}]`),
                groupIdDisplayed: false,
                teamName: $(parent)
                    .find(`[data-id=${slotIdx}]`)
                    .find(".ui-team-member-name"),
                teamIcon: $(parent)
                    .find(`[data-id=${slotIdx}]`)
                    .find(".ui-team-member-icon"),
                teamStatus: $(parent)
                    .find(`[data-id=${slotIdx}]`)
                    .find(".ui-team-member-status"),
                teamHealthInner: $(parent)
                    .find(`[data-id=${slotIdx}]`)
                    .find(".ui-health-actual"),
                teamColor: $(parent)
                    .find(`[data-id=${slotIdx}]`)
                    .find(".ui-team-member-color"),
                playerId: 0,
                prevHealth: 0,
                prevStatus: {
                    disconnected: false,
                    dead: false,
                    downed: false,
                    role: "",
                },
                indicators: {
                    main: {
                        elem: $("#ui-team-indicators").find(
                            `.ui-indicator-main[data-id=${slotIdx}]`,
                        ),
                        displayed: false,
                    },
                },
            });
        }
        this.init();
    }

    m_free() {
        this.gasRenderer.free();

        this.clearUI();

        this.roleMenuConfirm.off("click");
        $(".ui-role-option").off("click");
        $(".ui-map-expand").off("mousedown");
        $(".ui-map-expand").off("click");
        $("#ui-map-minimize").off("mousedown");
        $("#ui-map-minimize").off("click");
        $("#ui-menu-display").off("click");
        this.moveStyleButton.off("touchstart");
        this.aimStyleButton.off("touchstart");
        this.aimLineButton.off("touchstart");
        $(document).off("touchstart", this.onTouchScreen);
        this.bigmapClose.off("touchend");
        this.bigmapClose.off("mousedown");
        this.bigmapClose.off("click");
        this.gameTabBtns.off("click");
        this.fullScreenButton.off("mousedown");
        this.fullScreenButton.off("click");
        this.resumeButton.off("mousedown");
        this.resumeButton.off("click");
        $("#btn-spectate-quit").off("click");
        $("#btn-game-quit").off("mousedown");
        $("#btn-game-quit").off("click");
        this.specStatsButton.off("click");
        this.specNextButton.off("click");
        this.specPrevButton.off("click");
        this.interactionElems.off("touchstart");
        this.reloadElems.off("touchstart");
        this.weapSwitches.off("mousedown");
        $("#ui-game").off("mousemove");
        $("#ui-game").off("mouseup");
        $("#ui-weapon-id-1").off("mouseup");
        $("#ui-weapon-id-2").off("mouseup");
        this.muteButton.off("mousedown");
        this.muteButton.off("click");

        // Reset team member health bar widths
        $(".ui-team-member-health")
            .find(".ui-bar-inner")
            .css("width", this.teamMemberHealthBarWidth);

        $("#ui-center").off("mouseenter mouseleave");
        this.inputBinds.menuHovered = false;

        if (!this.hudVisible) {
            this.cycleHud();
        }

        this.m_pieTimer.destroy();
        this.clearStatsElems();
        this.setRoleMenuActive(false);
        this.init();
    }

    init() {
        $(".js-ui-map-hidden").css("display", "block");
        $("#ui-map-counter-default").css("display", "inline-block");
        $("#ui-map-counter-faction").css("display", "none");
        this.flairElems.css("display", "none");
        this.clearStatsElems();
        this.setSpectating(false);
        this.updateSpectatorCountDisplay(true);
        this.resetWeapSlotStyling();
        this.dead = false;

        // Reset team selector colors
        for (let i = 0; i < this.teamSelectors.length; i++) {
            this.teamSelectors[i].teamColor.removeAttr("style");
        }
    }

    onMapLoad(map: Map, camera: Camera) {
        this.resize(map, camera);
        const displayLeader = map.getMapDef().gameMode.killLeaderEnabled;

        $("#ui-kill-leader-container").css("display", displayLeader ? "block" : "none");

        if (!device.mobile) {
            $("#ui-killfeed-wrapper").css("top", displayLeader ? "60px" : "12px");
        }
    }

    m_update(
        dt: number,
        player: Player,
        map: Map,
        gas: Gas,
        playerBarn: PlayerBarn,
        camera: Camera,
        teamMode: TeamMode,
        factionMode: boolean,
    ) {
        const localPlayer = player;

        if (this.weapsDirty) {
            this.resetWeapSlotStyling();
        }

        this.weapsDirty = false;
        this.mapIndicatorBarn.updateIndicatorPulses(dt);

        // Gas timer display
        const timeLeft = math.max(Math.floor(gas.duration * (1 - gas.circleT)), 0);
        const gasState = {
            mode: gas.mode,
            time: timeLeft,
        };
        if (this.gasState.mode != gasState.mode || this.gasState.time != gasState.time) {
            this.gasState = gasState;
            const gasMoving = this.gasState.mode == GasMode.Moving;
            this.mapInfo.removeClass("icon-pulse");
            this.gasIcon.removeClass("gas-icon");
            this.gasIcon.removeClass("danger-icon");

            if (gasMoving) {
                this.mapInfo.addClass("icon-pulse");
            }
            this.gasIcon.addClass(gasMoving ? "danger-icon" : "gas-icon");

            const minutes = Math.floor(this.gasState.time / 60);
            const seconds = this.gasState.time % 60;
            const strSeconds = `0${seconds}`.slice(-2);
            this.gasTimer.html(`${minutes}:${strSeconds}`);
        }

        // Spectator count display
        this.spectatorCount = player.m_localData.m_spectatorCount;
        this.updateSpectatorCountDisplay(false);

        if (player.m_netData.m_dead && !this.dead) {
            this.dead = true;
            this.m_pieTimer.stop();
        }

        if (localPlayer.downed || this.dead) {
            this.resetWeapSlotStyling();
        }

        // Action pie timer
        if (
            this.actionSeq != player.m_action.seq &&
            ((this.actionSeq = player.m_action.seq),
            this.m_pieTimer.stop(),
            player.m_action.type != Action.None && !this.displayingStats)
        ) {
            let desc = "";
            let actionTxt1 = "";
            let actionTxt2 = "";
            switch (player.m_action.type) {
                case Action.Reload:
                case Action.ReloadAlt:
                    if (GameObjectDefs[player.m_action.item]) {
                        actionTxt1 = this.localization.translate("game-reloading");
                    }
                    break;
                case Action.UseItem:
                    if (GameObjectDefs[player.m_action.item]) {
                        actionTxt1 = this.localization.translate("game-using");
                        actionTxt2 = this.localization.translate(
                            `game-${player.m_action.item}`,
                        );
                    }
                    break;
                case Action.Revive: {
                    const targetName = playerBarn.getPlayerInfo(
                        player.m_action.targetId,
                    ).name;
                    actionTxt1 = this.localization.translate("game-reviving");
                    actionTxt2 = localPlayer.downed ? "" : targetName;
                    break;
                }
            }

            if (actionTxt1 != "" || actionTxt2 != "") {
                // Change subject/verb/object order
                if (this.localization.translate("word-order") == "svo") {
                    desc += actionTxt1 || "";
                    desc += actionTxt2 ? ` ${actionTxt2}` : "";
                } else if (this.localization.translate("word-order") == "sov") {
                    desc += actionTxt2 ? `${actionTxt2} ` : "";
                    desc += actionTxt1 ? ` ${actionTxt1}` : "";
                }
                this.m_pieTimer.start(
                    desc,
                    player.m_action.time,
                    player.m_action.duration,
                );
            }
        }

        if (!this.bigmapDisplayed) {
            this.mapSprite.x =
                this.minimapPos.x +
                this.mapSprite.width / 2 -
                (player.m_visualPos.x / map.width) * this.mapSprite.width;
            this.mapSprite.y =
                this.minimapPos.y -
                this.mapSprite.height / 2 +
                (player.m_visualPos.y / map.height) * this.mapSprite.height;
        }

        const camExtents = v2.create(
            (camera.m_screenWidth * 0.5) / camera.m_z(),
            (camera.m_screenHeight * 0.5) / camera.m_z(),
        );
        const camAabb = {
            min: v2.sub(camera.m_pos, camExtents),
            max: v2.add(camera.m_pos, camExtents),
        };

        // Update team UI elements
        const groupId = playerBarn.getPlayerInfo(player.__id).groupId;
        const groupInfo = playerBarn.getGroupInfo(groupId);

        if (!groupInfo) {
            const err = {
                playerId: player.__id,
                groupId,
                spectating: this.spectating,
                playing: this.game.m_playingTicker,
                groupInfo: playerBarn.groupInfo,
            };
            errorLogManager.logError(`badTeamInfo_1: ${JSON.stringify(err)}`);
        }

        const layoutSm = device.uiLayout == device.UiLayout.Sm;
        const groupPlayerCount = groupInfo.playerIds.length;

        for (let i = 0; i < groupPlayerCount; i++) {
            const teamElems = this.teamSelectors[i];
            const playerId = groupInfo.playerIds[i];
            const playerInfo = playerBarn.getPlayerInfo(playerId);
            const isLocalPlayer = playerId == localPlayer.__id;
            const playerStatus = playerBarn.getPlayerStatus(playerId);
            if (playerStatus && teamMode > TeamMode.Solo) {
                if (!teamElems.groupIdDisplayed) {
                    teamElems.groupId.css("display", "block");
                    teamElems.groupIdDisplayed = true;
                }

                // Team UI
                this.updateTeam(
                    i,
                    helpers.htmlEscape(playerInfo.name),
                    playerStatus.health!,
                    {
                        disconnected: playerStatus.disconnected,
                        dead: playerStatus.dead,
                        downed: playerStatus.downed,
                        role: playerStatus.role,
                    },
                    playerInfo.playerId,
                );

                // Team indicators
                for (const key in teamElems.indicators) {
                    if (teamElems.indicators.hasOwnProperty(key)) {
                        const indicator = teamElems.indicators[key];
                        const elem = indicator.elem;
                        let hideIndicator = true;

                        if ((!isLocalPlayer || indicator.displayAll) && !factionMode) {
                            const playerPos = playerStatus.pos;
                            const dir = v2.normalizeSafe(
                                v2.sub(playerPos, camera.m_pos),
                                v2.create(1, 0),
                            );
                            const edge = coldet.intersectRayAabb(
                                camera.m_pos,
                                dir,
                                camAabb.min,
                                camAabb.max,
                            )!;
                            // fixme: find actual cause for the indicator rotation facing backwards
                            const rot = Math.atan2(dir.y, -dir.x) - Math.PI * 0.5;
                            const screenEdge = camera.m_pointToScreen(edge);
                            const onscreen = coldet.testCircleAabb(
                                playerPos,
                                GameConfig.player.radius,
                                camAabb.min,
                                camAabb.max,
                            );
                            if (!playerStatus.dead && !onscreen) {
                                let off = 32;
                                let transform = `translate(-50%, -50%) rotate(${rot}rad)`;
                                if (layoutSm) {
                                    off = 16;
                                    transform += " scale(0.5)";
                                }
                                hideIndicator = false;
                                const heightAdjust = 0;
                                elem.css({
                                    left: math.clamp(
                                        screenEdge.x,
                                        off,
                                        camera.m_screenWidth - off,
                                    ),
                                    top: math.clamp(
                                        screenEdge.y,
                                        off,
                                        camera.m_screenHeight - off - heightAdjust,
                                    ),
                                    transform,
                                });
                                if (!indicator.displayed) {
                                    elem.css("display", "block");
                                    indicator.displayed = true;
                                }
                            }
                        }
                        if (hideIndicator && indicator.displayed) {
                            elem.css("display", "none");
                            indicator.displayed = false;
                        }
                    }
                }
            }
        }
        // Hide unused elements
        for (let i = groupPlayerCount; i < this.teamSelectors.length; i++) {
            const teamElems = this.teamSelectors[i];
            for (const key in teamElems.indicators) {
                if (teamElems.indicators.hasOwnProperty(key)) {
                    const indicator = teamElems.indicators[key];
                    if (indicator.displayed) {
                        indicator.elem.css("display", "none");
                        indicator.displayed = false;
                    }
                }
            }
            if (teamElems.groupIdDisplayed) {
                teamElems.groupId.css("display", "none");
                teamElems.groupIdDisplayed = false;
            }
        }

        // Faction specific rendering
        if (map.factionMode) {
            const localPlayerInfo = playerBarn.getPlayerInfo(localPlayer.__id);
            if (this.flairId != localPlayerInfo.teamId) {
                this.flairId = localPlayerInfo.teamId;
                // Assume red or blue for now
                const flairColor = this.flairId == 1 ? "red" : "blue";
                this.flairElems.css({
                    display: "block",
                    "background-image": `url(../img/gui/player-patch-${flairColor}.svg)`,
                });
            }
        }

        // Set the spectate options height if player count changed
        if (
            teamMode > TeamMode.Solo &&
            this.groupPlayerCount != groupPlayerCount &&
            device.uiLayout == device.UiLayout.Lg
        ) {
            this.groupPlayerCount = groupPlayerCount;
            this.spectateOptionsWrapper.css({
                top: this.groupPlayerCount * this.teamMemberHeight + 12,
            });
        } else if (teamMode == TeamMode.Solo) {
            this.spectateOptionsWrapper.css({
                top: 12,
            });
        }
        this.updatePlayerMapSprites(player, playerBarn, map);
        this.mapSpriteBarn.update(dt, this, map);
        this.m_pieTimer.update(dt, camera);

        // Update role selection menu
        if (this.roleMenuActive) {
            this.roleMenuTicker -= dt;

            const seconds = Math.ceil(this.roleMenuTicker);
            const html = `${this.localization.translate("game-enter-game")} (${seconds})`;
            if (html != this.roleMenuFooterHtml) {
                this.roleMenuFooterEnterElem.html(html);
                this.roleMenuFooterHtml = html;
            }
            if (
                !this.roleMenuInst &&
                this.audioManager.isSoundLoaded("ambient_lab_01", "ambient")
            ) {
                this.roleMenuInst = this.audioManager.playSound("ambient_lab_01", {
                    channel: "ambient",
                });
            }
            if (this.roleMenuTicker <= 0) {
                this.roleSelected = this.roleDisplayed;
                this.setRoleMenuActive(false);
            }
        }
    }

    updatePlayerMapSprites(activePlayer: Player, playerBarn: PlayerBarn, map: Map) {
        const activePlayerInfo = playerBarn.getPlayerInfo(activePlayer.__id);

        let spriteIdx = 0;
        const addSprite = (
            pos: Vec2,
            scale: number,
            alpha: number,
            visible: boolean,
            zOrder: number,
            texture: string,
            tint: number,
        ) => {
            if (spriteIdx >= this.playerMapSprites.length) {
                const m = this.mapSpriteBarn.addSprite();
                this.playerMapSprites.push(m);
            }
            const mapSprite = this.playerMapSprites[spriteIdx++];
            mapSprite.pos = v2.copy(pos);
            mapSprite.scale = scale;
            mapSprite.alpha = alpha;
            mapSprite.visible = visible;
            mapSprite.zOrder = zOrder;
            mapSprite.sprite.texture = PIXI.Texture.from(texture);
            mapSprite.sprite.tint = tint;
        };
        const keys = Object.keys(playerBarn.playerStatus);
        for (let i = 0; i < keys.length; i++) {
            const playerStatus = playerBarn.playerStatus[keys[i] as unknown as number];
            const playerId = playerStatus.playerId!;
            const playerInfo = playerBarn.getPlayerInfo(playerId);
            const sameGroup = playerInfo.groupId == activePlayerInfo.groupId;
            let zOrder = 65535 + playerId * 2;
            if (playerId == activePlayerInfo.playerId) {
                zOrder += 65535 * 2;
            }
            const roleDef = RoleDefs[playerStatus.role];
            const customMapIcon = roleDef?.mapIcon;
            if (customMapIcon) {
                zOrder += 65535;
            }

            // Add the inner dot sprite
            let texture = "player-map-inner.img";
            if (customMapIcon && roleDef.mapIcon?.alive) {
                texture = roleDef.mapIcon.alive;
            }
            if (playerStatus.dead) {
                texture = "skull-outlined.img";
                if (roleDef?.mapIcon?.dead) {
                    texture = roleDef.mapIcon!.dead;
                }
            } else if (playerStatus.downed) {
                texture = sameGroup ? "player-map-inner.img" : "player-map-downed.img";
            }
            let tint = sameGroup
                ? playerBarn.getGroupColor(playerId)
                : playerBarn.getTeamColor(playerInfo.teamId);
            if (map.factionMode && customMapIcon) {
                tint = playerBarn.getTeamColor(playerInfo.teamId);
            }
            const dotScale = device.uiLayout == device.UiLayout.Sm ? 0.15 : 0.2;
            let scale = dotScale;

            scale = sameGroup
                ? playerStatus.dead
                    ? dotScale * 1.5
                    : customMapIcon
                      ? dotScale * 1.25
                      : dotScale * 1
                : playerStatus.dead || playerStatus.downed || customMapIcon
                  ? dotScale * 1.25
                  : dotScale * 0.75;

            addSprite(
                playerStatus.pos,
                scale,
                playerStatus.minimapAlpha!,
                playerStatus.minimapVisible!,
                zOrder,
                texture,
                tint,
            );

            // Add an outer sprite if this player is in our group
            if (sameGroup) {
                const scale = device.uiLayout == device.UiLayout.Sm ? 0.25 : 0.3;
                const visible = playerStatus.minimapVisible! && !customMapIcon;

                addSprite(
                    playerStatus.pos,
                    scale,
                    playerStatus.minimapAlpha!,
                    visible,
                    zOrder - 1,
                    "player-map-outer.img",
                    0xffffff,
                );
            }
        }

        // Hide any sprites that weren't used
        for (let i = this.playerMapSprites.length - 1; i >= spriteIdx; i--) {
            this.playerMapSprites[i].visible = false;
        }
    }

    getMinimapMargin() {
        if (device.uiLayout == device.UiLayout.Sm) {
            return 4;
        }
        return 16;
    }

    getMinimapSize() {
        if (device.uiLayout == device.UiLayout.Sm) {
            return 192;
        }
        return 256;
    }

    getMinimapBorderWidth() {
        if (device.uiLayout == device.UiLayout.Sm) {
            return 1;
        }
        return 4;
    }

    createPing(
        pingType: string,
        pos: Vec2,
        playerId: number,
        activePlayerId: number,
        playerBarn: PlayerBarn,
        _factionMode: unknown,
    ) {
        const pingDef = PingDefs[pingType];
        if (pingDef) {
            const createPingSprite = (scale: number, tint: number) => {
                const s = this.mapSpriteBarn.addSprite();
                s.pos = v2.copy(pos);
                s.scale = scale;
                s.lifetime = pingDef.mapLife!;
                s.pulse = false;
                s.zOrder = 100;
                s.sprite.texture = PIXI.Texture.from(pingDef.mapTexture!);
                s.sprite.tint = tint;
                return s;
            };
            const createPulseSprite = (tint: number) => {
                const s = this.mapSpriteBarn.addSprite();
                s.pos = v2.copy(pos);
                s.scale = 0;
                s.lifetime = pingDef.pingLife!;
                s.pulse = true;
                s.zOrder = 99;
                s.sprite.texture = PIXI.Texture.from("ping-map-pulse.img");
                s.sprite.tint = tint;
                return s;
            };
            if (pingDef.mapEvent) {
                // Map-event pings free themselves after they are finished;
                // there's no limit to the number that an occur simultaneously.
                const scale = (device.uiLayout == device.UiLayout.Sm ? 0.15 : 0.2) * 1.5;
                createPingSprite(scale, pingDef.tint!).release();

                createPulseSprite(pingDef.tint!).release();
            } else {
                //
                // Player pings
                //

                // Figure out which tint to use by determining if this player
                // is in our group; if they are use their group color.
                // Otherwise, use their team color.
                // Faction leaders get a special color.
                let tint = 0xffffff;
                const activePlayerInfo = playerBarn.getPlayerInfo(activePlayerId);
                const playerInfo = playerBarn.getPlayerInfo(playerId);
                const playerStatus = playerBarn.getPlayerStatus(playerId);
                if (activePlayerInfo && playerInfo && playerStatus) {
                    if (playerStatus.role == "leader") {
                        // Use a special color if they are a faction leader
                        tint = 0x00ff00;
                    } else if (activePlayerInfo.groupId == playerInfo.groupId) {
                        // Use group color
                        tint = playerBarn.getGroupColor(playerId);
                    } else {
                        // Use the team color
                        tint = playerBarn.getTeamColor(playerInfo.teamId);
                    }
                }

                // Store ping sprites per-player so we can cancel the most recent
                if (!this.playerPingSprites[playerId]) {
                    this.playerPingSprites[playerId] = [];
                }

                // Free the most recently created ping sprites
                const pingSprites = this.playerPingSprites[playerId];
                for (let i = 0; i < pingSprites.length; i++) {
                    pingSprites[i].free();
                }

                // Create new ping sprites for this player
                const scale = device.uiLayout == device.UiLayout.Sm ? 0.15 : 0.2;
                const pingSprite = createPingSprite(scale, tint);
                const pulseSprite = createPulseSprite(tint);
                pingSprites.push(pingSprite);
                pingSprites.push(pulseSprite);
            }
        }
    }

    /* not used? */
    updateMapSprite(
        mapSprite: any,
        sprite: PIXI.Sprite,
        spriteVisible: boolean,
        dt: number,
    ) {
        if (mapSprite.displayed) {
            if (mapSprite.life != undefined) {
                mapSprite.life -= dt;
                mapSprite.displayed = mapSprite.life > 0;
                // Quickfades
                if (mapSprite.maxLife - mapSprite.life < 0.1) {
                    sprite.alpha = (mapSprite.maxLife - mapSprite.life) / 0.1;
                } else if (mapSprite.life < 0.5) {
                    sprite.alpha = math.max(mapSprite.life / 0.5, 0);
                } else {
                    sprite.alpha = 1;
                }
            }
            if (mapSprite.pulse && mapSprite.displayed) {
                mapSprite.scale = mapSprite.scale + dt / 2.5;
                sprite.scale.set(mapSprite.scale, mapSprite.scale);
            }
            sprite.visible = spriteVisible && sprite.alpha > 0;
        }
    }

    updateMapIndicators(data: MapIndicator[]) {
        this.mapIndicatorBarn.updateIndicatorData(data);
    }

    getMapPosFromWorldPos(worldPos: Vec2, map: Map) {
        const xPos =
            this.mapSprite.x -
            this.mapSprite.width / 2 +
            (worldPos.x / map.width) * this.mapSprite.width;
        const yPos =
            this.mapSprite.y +
            this.mapSprite.height / 2 -
            (worldPos.y / map.height) * this.mapSprite.height;
        return v2.create(xPos, yPos);
    }

    getWorldPosFromMapPos(screenPos: Vec2, map: Map, camera: Camera): Vec2 {
        let insideMap = false;
        if (this.bigmapDisplayed) {
            const xBuffer = (camera.m_screenWidth - this.mapSprite.width) / 2;
            let yBuffer = (camera.m_screenHeight - this.mapSprite.height) / 2;
            if (device.uiLayout == device.UiLayout.Sm && !device.isLandscape) {
                yBuffer = 0;
            }
            insideMap =
                screenPos.x > xBuffer &&
                screenPos.x < camera.m_screenWidth - xBuffer &&
                screenPos.y > yBuffer &&
                screenPos.y < camera.m_screenHeight - yBuffer;
        } else if (this.minimapDisplayed) {
            const thisMinimapSize = this.getMinimapSize();
            const thisMinimapMargin = this.getMinimapMargin();
            const minimapSize = thisMinimapSize * this.screenScaleFactor;
            const halfSize = (minimapSize + thisMinimapMargin) * 0.5;
            insideMap =
                screenPos.x > this.minimapPos.x - halfSize &&
                screenPos.x < this.minimapPos.x + halfSize &&
                screenPos.y > this.minimapPos.y - halfSize &&
                screenPos.y < this.minimapPos.y + halfSize;
        }
        if (insideMap) {
            const mapOrigin = v2.create(
                this.mapSprite.x - this.mapSprite.width / 2,
                this.mapSprite.y + this.mapSprite.height / 2,
            );
            const xWorldPos =
                ((screenPos.x - mapOrigin.x) / this.mapSprite.width) * map.width;
            const yWorldPos =
                ((mapOrigin.y - screenPos.y) / this.mapSprite.height) * map.height;
            return v2.create(xWorldPos, yWorldPos);
        }
        // @ts-expect-error why? just why?
        return false;
    }

    hideAll() {
        this.gameElem.css("display", "none");
    }

    showAll() {
        this.gameElem.css("display", "block");
    }

    setLocalKills(kills: number) {
        this.playerKills.html(kills);
    }

    removeAds() {
        SDK.removeAllAds();

        if (!window.aiptag) return;
        const ads = ["728x90", "300x250_2"];
        for (let i = 0; i < ads.length; i++) {
            const ad = ads[i];
            window.aiptag.cmd.display.push(() => {
                window.aipDisplayTag!.destroy(`${AIP_PLACEMENT_ID}_${ad}`);
            });
        }
    }

    refreshMainPageAds() {
        const ads = ["728x90"];

        if (SDK.isCrazyGames) {
            for (let i = 0; i < ads.length; i++) {
                SDK.requestAd(ads[i]);
            }
        }

        if (!window.aiptag) return;
        for (let i = 0; i < ads.length; i++) {
            const ad = ads[i];
            window.aiptag.cmd.display.push(() => {
                window.aipDisplayTag!.display(`${AIP_PLACEMENT_ID}_${ad}`);
            });
        }
    }

    clearUI() {
        this.m_pieTimer.stop();
        // @ts-expect-error not used anywhere, should be removed, I think.
        this.curAction = {
            type: Action.None,
        };
        this.displayMapLarge(true);
        this.displayMiniMap();
        this.clearStatsElems();
        this.clearTeamUI();
        this.toggleEscMenu(true);
        this.toggleLocalStats(true);
        this.visibilityMode = 0;
        this.spectatorCount = 0;
        this.setLocalKills(0);
    }

    beginSpectating() {
        this.specBegin = true;
    }

    hideStats() {
        this.displayingStats = false;
        this.statsMain.css("display", "none");
        this.statsElem.stop().css({
            display: "none",
            opacity: 0,
        });
        this.statsContents.stop().hide();
    }

    teamModeToString(teamMode: TeamMode) {
        const l10nMap = {
            unknown: "game-rank",
            [TeamMode.Solo]: "game-solo-rank",
            [TeamMode.Duo]: "game-duo-rank",
            [TeamMode.Squad]: "game-squad-rank",
        };
        const val = l10nMap[teamMode] || l10nMap.unknown;
        return this.localization.translate(val);
    }

    getTitleVictoryText(spectatingAnotherTeam: boolean, gameMode: MapDef["gameMode"]) {
        if (spectatingAnotherTeam) {
            return `${this.spectatedPlayerName} ${this.localization.translate(
                "game-won-the-game",
            )}`;
        }
        let chickenTxt = "game-chicken";
        if (gameMode.turkeyMode) {
            chickenTxt = "game-turkey";
        }
        return this.localization.translate(chickenTxt);
    }

    getTitleDefeatText(teamMode: TeamMode, spectatingAnotherTeam: boolean) {
        if (spectatingAnotherTeam) {
            return `${this.spectatedPlayerName} ${this.localization.translate(
                "game-player-died",
            )}.`;
        }
        if (teamMode > TeamMode.Solo) {
            return this.localization.translate("game-team-eliminated");
        }
        return `${this.localization.translate(
            "game-You",
        )} ${this.localization.translate("game-you-died")}.`;
    }

    getOverviewElems(
        teamMode: TeamMode,
        teamRank: number,
        teamKills: number,
        factionMode: boolean,
    ) {
        if (factionMode) {
            const redTeamTxt = this.localization.translate("game-red-team");
            const blueTeamTxt = this.localization.translate("game-blue-team");
            return `<div class="ui-stats-header-right ui-stats-header-red-team"><span class="ui-stats-header-stat">${redTeamTxt} </span><span class="ui-stats-header-value">${this.playersAliveRedCounter}</span></div><div class="ui-stats-header-left ui-stats-header-blue-team"><span class="ui-stats-header-stat">${blueTeamTxt} </span><span class="ui-stats-header-value">${this.playersAliveBlueCounter}</span></div>`;
        }
        if (teamMode == TeamMode.Solo) {
            return `<div><span class="ui-stats-header-stat">${this.teamModeToString(
                teamMode,
            )} </span><span class="ui-stats-header-value">#${teamRank}</span></div>`;
        }
        return `<div class="ui-stats-header-right"><span class="ui-stats-header-stat">${this.teamModeToString(
            teamMode,
        )} </span><span class="ui-stats-header-value">#${teamRank}</span></div><div class="ui-stats-header-left"><span class="ui-stats-header-stat">${this.localization.translate(
            "game-team-kills",
        )} </span><span class="ui-stats-header-value">${teamKills}</span></div>`;
    }

    quitGame() {
        this.game.m_gameOver = true;
        this.refreshMainPageAds();
        this.game.onQuit();
    }

    showStats(
        playerStats: Array<PlayerStatsMsg["playerStats"]>,
        teamId: number,
        teamRank: number,
        winningTeamId: number,
        gameOver: boolean,
        localTeamId: number,
        teamMode: TeamMode,
        spectating: boolean,
        playerBarn: PlayerBarn,
        _audioManager: AudioManager,
        map: Map,
        ui2: UiManager2,
    ) {
        // If we're spectating a team that's not our own, and the game isn't over yet,
        // don't display the stats screen again.
        if (!spectating || teamId == localTeamId || gameOver) {
            this.toggleEscMenu(true);
            this.displayingStats = true;
            this.m_pieTimer.stop();
            this.displayMapLarge(true);
            this.clearStatsElems();
            this.setSpectating(false, teamMode);

            this.removeAds();
            this.statsMain.css("display", "block");
            this.statsLogo.css("display", "block");

            this.statsContentsContainer.css({
                top: "",
            });
            this.statsInfoBox.css({
                height: "",
            });

            const victory = localTeamId == winningTeamId;
            const statsDelay = victory ? 1750 : 2500;

            this.setBannerAd(statsDelay, ui2);

            const isLocalTeamWinner =
                localTeamId == winningTeamId || (spectating && winningTeamId == teamId);
            const spectatingAnotherTeam = spectating && localTeamId != teamId;
            const S = isLocalTeamWinner
                ? this.getTitleVictoryText(
                      spectatingAnotherTeam,
                      map.getMapDef().gameMode,
                  )
                : this.getTitleDefeatText(teamMode, spectatingAnotherTeam);
            let teamKills = 0;
            for (let i = 0; i < playerStats.length; i++) {
                teamKills += playerStats[i].kills;
            }
            const z = this.getOverviewElems(
                teamMode,
                teamRank,
                teamKills,
                map.getMapDef().gameMode.factionMode!,
            );
            const I = $("<div/>")
                .append(
                    $("<div/>", {
                        class: "ui-stats-header-title",
                        html: S,
                    }),
                )
                .append(
                    $("<div/>", {
                        class: "ui-stats-header-overview",
                        html: z,
                    }),
                );
            this.statsHeader.html(I as unknown as HTMLElement);
            const T = (e: string, t: string | number) =>
                $("<div/>", {
                    class: "ui-stats-info",
                })
                    .append(
                        $("<div/>", {
                            html: e,
                        }),
                    )
                    .append(
                        $("<div/>", {
                            html: t,
                        }),
                    );
            const M = device.uiLayout != device.UiLayout.Sm || device.tablet ? 250 : 125;
            let P = 0;
            P -= ((playerStats.length - 1) * M) / 2;
            P -= (playerStats.length - 1) * 10;
            for (let C = 0; C < playerStats.length; C++) {
                const stats = playerStats[C];
                const playerInfo = playerBarn.getPlayerInfo(stats.playerId);
                const D = humanizeTime(stats.timeAlive);
                let E = "ui-stats-info-player";
                E += stats.dead ? " ui-stats-info-status" : "";
                const B = ((e) =>
                    $("<div/>", {
                        class: e,
                    }))(E);
                B.css("left", P);
                B.append(
                    $("<div/>", {
                        class: "ui-stats-info-player-name",
                        html: helpers.htmlEscape(playerInfo.name),
                    }),
                );
                B.append(T(this.localization.translate("game-kills"), `${stats.kills}`))
                    .append(
                        T(
                            this.localization.translate("game-damage-dealt"),
                            stats.damageDealt,
                        ),
                    )
                    .append(
                        T(
                            this.localization.translate("game-damage-taken"),
                            stats.damageTaken,
                        ),
                    )
                    .append(T(this.localization.translate("game-survived"), D));
                if (map.getMapDef().gameMode.factionMode && gameOver) {
                    switch (C) {
                        case 1:
                            B.append(
                                $("<div/>", {
                                    class: "ui-stats-info-player-badge ui-stats-info-player-red-leader",
                                }),
                            );
                            break;
                        case 2:
                            B.append(
                                $("<div/>", {
                                    class: "ui-stats-info-player-badge ui-stats-info-player-blue-leader",
                                }),
                            );
                            break;
                        case 3: {
                            const R =
                                playerInfo.teamId == 1
                                    ? "ui-stats-info-player-red-ribbon"
                                    : "ui-stats-info-player-blue-ribbon";
                            B.append(
                                $("<div/>", {
                                    class: `ui-stats-info-player-badge ${R}`,
                                }),
                            );
                        }
                    }
                }
                this.statsInfoBox.append(B);
                P += 10;
            }
            const restartButton = $("<a/>", {
                class: "ui-stats-restart btn-green btn-darken menu-option",
                html: this.localization.translate("game-play-new-game"),
            });
            restartButton.on("click", () => {
                this.quitGame();
            });
            this.statsOptions.append(restartButton);
            if (gameOver || this.waitingForPlayers) {
                restartButton.css({
                    width:
                        device.uiLayout != device.UiLayout.Sm || device.tablet
                            ? 225
                            : 130,
                });
            } else {
                restartButton.css({
                    left:
                        device.uiLayout != device.UiLayout.Sm || device.tablet
                            ? -72
                            : -46,
                });
                const q = $("<a/>", {
                    class: "btn-green btn-darken menu-option ui-stats-spectate",
                    html: this.localization.translate("game-spectate"),
                });
                q.on("click", this.beginSpectating.bind(this));
                this.statsOptions.append(q);
            }

            let elemIdx = 0;
            const elemFadeTime = 500;
            const elemDelay = 250 / math.max(1, playerStats.length);
            const baseDelay = 750 / math.max(1, playerStats.length);
            this.statsInfoBox.children().each((idx, elem) => {
                const e = $(elem);
                e.css("opacity", 0);
                e.delay(statsDelay + baseDelay + (elemIdx + idx) * elemDelay).animate(
                    {
                        opacity: 1,
                    },
                    elemFadeTime,
                    () => {
                        e.children().each((idx, elem) => {
                            $(elem)
                                .delay(idx * elemDelay)
                                .animate(
                                    {
                                        opacity: 1,
                                    },
                                    elemFadeTime,
                                );
                        });
                    },
                );
                e.children().each((_idx, elem) => {
                    $(elem).css("opacity", 0);
                    elemIdx++;
                });
                elemIdx++;
            });

            this.statsOptions.children().each((idx, elem) => {
                const e = $(elem);
                e.hide();
                const delay = statsDelay + baseDelay + (elemIdx + idx) * elemDelay + 500;
                e.delay(delay).fadeIn(elemFadeTime);
                elemIdx++;
            });

            this.statsElem.stop();
            this.statsElem.css("display", "block");
            this.statsElem.delay(statsDelay).animate(
                {
                    opacity: 1,
                },
                1000,
            );

            this.statsContents.stop();
            this.statsContents.css("display", "block");
            this.statsContents.delay(statsDelay).animate(
                {
                    opacity: 1,
                },
                1000,
            );
        }
    }

    clearStatsElems() {
        this.statsHeader.empty();
        this.statsInfoBox.empty();
        this.statsOptions.empty();
        this.statsAds.css("display", "none");
        this.statsContents.stop();
        this.statsContents.css({
            display: "none",
            opacity: 0,
        });
        this.statsElem.stop();
        this.statsElem.css({
            display: "none",
            opacity: 0,
        });
        this.statsMain.css("display", "none");
    }

    showTeamAd(playerStats: PlayerStatsMsg["playerStats"], _ui2Manager: unknown) {
        this.toggleEscMenu(true);
        this.displayMapLarge(true);
        this.clearStatsElems();
        this.statsMain.css("display", "block");
        this.statsLogo.css("display", "none");
        this.m_pieTimer.stop();
        this.displayingStats = true;
        this.statsHeader.html(
            (() => {
                let t = this.localization.translate("game-You");
                t += " ";
                t += this.localization.translate("game-you-died");
                t += ".";
                let a = `<div><span class="ui-stats-header-stat">${this.localization.translate(
                    "game-kills",
                )} </span>`;
                a += `<span class="ui-stats-header-value">${playerStats.kills}</span></div>`;
                return $("<div/>", {
                    class: "",
                })
                    .append(
                        $("<div/>", {
                            class: "ui-stats-header-title",
                            html: t,
                        }),
                    )
                    .append(
                        $("<div/>", {
                            class: "ui-stats-header-overview",
                            html: a,
                        }),
                    ) as unknown as HTMLElement;
            })(),
        );
        this.statsContentsContainer.css({
            top: "10%",
        });
        this.statsInfoBox.css({
            height: 0,
        });
        const a = $("<a/>", {
            class: "ui-stats-restart btn-green btn-darken menu-option",
            html: this.localization.translate("game-play-new-game"),
        });
        a.on("click", () => {
            this.quitGame();
        });
        this.statsOptions.append(a);
        a.css({
            left: device.uiLayout != device.UiLayout.Sm || device.tablet ? -72 : -46,
        });
        const i = $("<a/>", {
            class: "btn-green btn-darken menu-option ui-stats-spectate",
            html: this.localization.translate("game-spectate"),
        });
        i.on("click", this.beginSpectating.bind(this));
        this.statsOptions.append(i);
        let elemIdx = 0;

        this.statsOptions.children().each((idx, elem) => {
            const e = $(elem);
            e.hide();
            const delay = 4100 + (elemIdx + idx) * 300 + 300;
            e.delay(delay).fadeIn(750);
            elemIdx++;
        });

        this.statsElem.stop();
        this.statsElem.css("display", "block");
        this.statsElem.delay(2500).animate(
            {
                opacity: 1,
            },
            1000,
        );
        this.statsContents.stop();
        this.statsContents.css("display", "block");
        this.statsContents.delay(2500).animate(
            {
                opacity: 1,
            },
            1000,
        );
    }

    setBannerAd(time: number, ui2: UiManager2) {
        if (!window.aiptag) return;
        let delay = Math.max(time - 150, 0);
        setTimeout(() => {
            const bannerAd = $("#ui-stats-ad-container-desktop");
            bannerAd.css("display", "inline-block");

            window.aiptag!.cmd.display.push(() => {
                window.aipDisplayTag!.display(`${AIP_PLACEMENT_ID}_300x250_2`);
            });

            ui2.hideKillMessage();
        }, delay);
    }

    setSpectateTarget(
        targetId: number,
        localId: number,
        teamMode: TeamMode,
        playerBarn: PlayerBarn,
    ) {
        if (targetId != this.spectatedPlayerId) {
            this.setSpectating(true, teamMode);
            const name = playerBarn.getPlayerName(targetId, localId, false);
            this.spectatedPlayerId = targetId;
            this.spectatedPlayerName = helpers.htmlEscape(name);
            this.spectatedPlayerText
                .find("#spectate-player")
                .html(this.spectatedPlayerName);
            this.actionSeq = -1;
            this.m_pieTimer.stop();
        }
    }

    setSpectating(spectating: boolean, teamMode?: TeamMode) {
        if (this.spectating != spectating) {
            this.spectating = spectating;
            if (this.spectating) {
                this.spectateMode.css("display", "block");
                $(".ui-zoom").removeClass("ui-zoom-hover");
                const hideSpec = teamMode == TeamMode.Solo;
                this.specPrevButton.css("display", hideSpec ? "none" : "block");
                this.specNextButton.css("display", hideSpec ? "none" : "block");
                this.hideStats();
            } else {
                this.spectateMode.css("display", "none");
                $(".ui-zoom").addClass("ui-zoom-hover");
            }
        }
    }

    setLocalStats(stats: PlayerStatsMsg["playerStats"]) {
        const displayStats = {
            kills: this.localization.translate("game-kills"),
            damageDealt: this.localization.translate("game-damage-dealt"),
            damageTaken: this.localization.translate("game-damage-taken"),
            timeAlive: this.localization.translate("game-survived"),
        };

        this.spectateModeStatsData.empty();
        for (const k in displayStats) {
            if (displayStats.hasOwnProperty(k)) {
                const text = displayStats[k as keyof typeof displayStats];
                const stat =
                    k == "timeAlive"
                        ? humanizeTime(stats[k])
                        : stats[k as keyof typeof displayStats];
                const html = `<tr><td class="ui-spectate-stats-category">${text}</td><td class="ui-spectate-stats-value">${stat}</td></tr>`;
                this.spectateModeStatsData.append(html);
            }
        }
    }

    toggleLocalStats(hide = false) {
        const display = this.spectateModeStats.css("display") == "none" && !hide;
        this.spectateModeStats.css("display", display ? "inline-block" : "none");
        this.specStatsButton.html(
            display
                ? this.localization.translate("game-hide-match-stats")
                : this.localization.translate("game-view-match-stats"),
        );
    }

    updatePlayersAlive(alive: number) {
        this.playersAlive.html(alive);

        this.leaderboardAlive.css("display", "block");
        this.leaderboardAliveFaction.css("display", "none");
    }

    updatePlayersAliveRed(alive: number) {
        this.playersAliveRed.html(alive);
        this.playersAliveRedCounter = alive;

        this.leaderboardAlive.css("display", "none");
        this.leaderboardAliveFaction.css("display", "block");

        $("#ui-map-counter-default").css("display", "none");
        $("#ui-map-counter-faction").css("display", "inline-block");
    }

    updatePlayersAliveBlue(alive: number) {
        this.playersAliveBlue.html(alive);
        this.playersAliveBlueCounter = alive;

        this.leaderboardAlive.css("display", "none");
        this.leaderboardAliveFaction.css("display", "block");

        $("#ui-map-counter-default").css("display", "none");
        $("#ui-map-counter-faction").css("display", "inline-block");
    }

    updateKillLeader(
        playerId: number,
        playerName: string,
        kills: number,
        gameMode: MapDef["gameMode"],
    ) {
        const valid = playerId != 0;
        const waitTxt = gameMode?.sniperMode
            ? this.localization.translate("game-waiting-for-hunted")
            : this.localization.translate("game-waiting-for-new-leader");
        this.killLeaderName.html(valid ? playerName : waitTxt);
        this.killLeaderCount.html(valid ? kills : 0);
    }

    displayMapLarge(clear?: boolean) {
        this.bigmapDisplayed = !clear && !this.bigmapDisplayed;
        if (this.bigmapDisplayed) {
            this.container.alpha = 1;
        } else {
            this.container.alpha = this.minimapDisplayed ? 1 : 0;
        }
        let mapHidden =
            device.uiLayout == device.UiLayout.Sm
                ? ".js-ui-mobile-map-hidden"
                : "js-ui-desktop-map-hidden";
        mapHidden += ", .js-ui-map-hidden";
        $(this.visibilityMode == 2 ? ".js-ui-hud-show" : mapHidden).css(
            "display",
            this.bigmapDisplayed ? "none" : "block",
        );
        $(".js-ui-map-show").css("display", this.bigmapDisplayed ? "block" : "none");
        this.updateSpectatorCountDisplay(true);
        this.redraw(this.game.m_camera);
    }

    updateSpectatorCountDisplay(dirty: boolean) {
        const displayCounter = !this.bigmapDisplayed && this.spectatorCount > 0;
        dirty =
            dirty ||
            (this.spectatorCount > 0 && !this.spectatorCounterDisplayed) ||
            (this.spectatorCount == 0 && this.spectatorCounterDisplayed);

        if (this.spectatorCount != this.prevSpectatorCount) {
            this.spectatorCounter.html(this.spectatorCount as unknown as string);
            this.prevSpectatorCount = this.spectatorCount;
        }
        if (dirty) {
            this.spectatorCounterContainer.css(
                "display",
                displayCounter ? "block" : "none",
            );
            this.spectatorCounterDisplayed = displayCounter;
        }
    }

    toggleMiniMap() {
        if (this.minimapDisplayed) {
            this.hideMiniMap();
        } else {
            this.displayMiniMap();
        }
    }

    cycleVisibilityMode() {
        if (!this.bigmapDisplayed) {
            switch (this.visibilityMode) {
                case 0:
                    this.hideMiniMap();
                    this.visibilityMode = 1;
                    break;
                case 1:
                    this.displayMiniMap();
                    this.visibilityMode = 0;
            }
        }
    }

    cycleHud() {
        if (this.gameElem.css("display") == "none") {
            this.gameElem.css("display", "block");
            this.displayMiniMap();
            this.hudVisible = true;
        } else {
            this.gameElem.css("display", "none");
            this.hideMiniMap();
            this.hudVisible = false;
        }
    }

    hideMiniMap() {
        if (!this.bigmapDisplayed) {
            this.minimapDisplayed = false;
            this.container.alpha = 0;
            this.mapInfo.css("bottom", "auto");
            this.spectatorCounterContainer.css({
                bottom: 6,
                left: 98,
            });
        }
    }

    displayMiniMap() {
        if (!this.bigmapDisplayed) {
            const layoutSm = device.uiLayout == device.UiLayout.Sm;
            this.minimapDisplayed = true;
            this.container.alpha = 1;
            this.mapInfo.css("bottom", this.mapInfoBottom);
            this.spectatorCounterContainer.css({
                bottom: layoutSm ? 0 : 218,
                left: layoutSm ? 0 : 6,
            });
        }
    }

    displayAnnouncement(message: string) {
        if (message) {
            this.announcement.html(message);
            this.announcement.fadeIn(400, () => {
                setTimeout(() => {
                    this.announcement.fadeOut(800);
                }, 3000);
            });
        }
    }

    displayGasAnnouncement(type: GasMode, timeLeft: number) {
        let message = "";
        switch (type) {
            case GasMode.Waiting: {
                message = this.localization.translate("game-red-zone-advances");
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft - minutes * 60;
                message +=
                    minutes > 1
                        ? ` ${minutes} ${this.localization.translate("game-minutes")}`
                        : "";
                message +=
                    minutes == 1
                        ? ` ${minutes} ${this.localization.translate("game-minute")}`
                        : "";
                message +=
                    seconds > 0
                        ? ` ${Math.floor(seconds)} ${this.localization.translate(
                              "game-seconds",
                          )}`
                        : "";
                break;
            }
            case GasMode.Moving:
                message = this.localization.translate("game-red-zone-advancing");
                break;
        }
        this.displayAnnouncement(message);
    }

    setWaitingForPlayers(waiting: boolean) {
        this.waitingForPlayers = waiting;
        this.waitingText.css("display", waiting ? "block" : "none");
    }

    m_render(playerPos: Vec2, gas: Gas, map: Map, planeBarn: PlaneBarn) {
        // Gas
        const circle = gas.getCircle(1);
        const gasPos = this.getMapPosFromWorldPos(circle.pos, map);
        const gasEdge = this.getMapPosFromWorldPos(
            v2.add(circle.pos, v2.create(circle.rad, 0)),
            map,
        );
        const gasRad = v2.length(v2.sub(gasEdge, gasPos));
        this.gasRenderer.render(gasPos, gasRad, gas.isActive());

        // Gas safe zone
        const circleSafe = gas.circleNew;
        const safePos = this.getMapPosFromWorldPos(circleSafe.pos, map);
        const safeEdge = this.getMapPosFromWorldPos(
            v2.add(circleSafe.pos, v2.create(circleSafe.rad, 0)),
            map,
        );
        const safeRad = v2.length(v2.sub(safeEdge, safePos));
        const playerMapPos = this.getMapPosFromWorldPos(playerPos, map);
        const drawCircle = gas.isActive();
        const drawLine = gas.isActive() && !this.bigmapDisplayed;
        this.gasSafeZoneRenderer.render(
            safePos,
            safeRad,
            playerMapPos,
            drawCircle,
            drawLine,
        );

        planeBarn.renderAirstrikeZones(this, map);
    }

    updateHealthBar(
        innerWidth: number,
        selectorInner: JQuery<HTMLElement>,
        selectorDepleted: JQuery<HTMLElement> | null,
        status: {
            health: number;
            dead: boolean;
            downed: boolean;
        },
    ) {
        const healthBarWidth = innerWidth;
        let uiHealth = status.health * 0.01 * healthBarWidth;
        uiHealth = status.dead ? 0 : math.max(uiHealth, 1);

        selectorInner.css("width", uiHealth);
        if (uiHealth > 0) {
            selectorDepleted?.css("width", uiHealth);
        }

        const val = status.health;
        let l = this.healthRed;
        let c = this.healthDarkpink;
        if (val > 25) {
            if (status.downed) {
                selectorInner.css({
                    backgroundColor: "red",
                });
            } else {
                if (math.eqAbs(val, 100, 0.2)) {
                    l = this.healthGrey;
                    c = this.healthGrey;
                } else if (math.eqAbs(val, 75, 0.2) || val >= 75) {
                    l = this.healthWhite;
                    c = this.healthWhite;
                } else {
                    l = this.healthDarkpink;
                    c = this.healthLightpink;
                }
                const m = l.getColors();
                const p = c.getColors();
                const h = Interpolate(m.r, p.r, 45, val);
                const d = Interpolate(m.g, p.g, 45, val);
                const u = Interpolate(m.b, p.b, 45, val);
                selectorInner.css({
                    backgroundColor: `rgba(${h},${d},${u},1)`,
                });
            }
            selectorInner.removeClass("ui-bar-danger");
        } else {
            selectorInner.addClass("ui-bar-danger");
        }
    }

    updateTeam(
        slotIdx: number,
        name: string,
        health: number,
        status: PrevStatus,
        playerId: number,
    ) {
        const groupId = this.teamSelectors[slotIdx].groupId;
        const teamName = this.teamSelectors[slotIdx].teamName;
        const prevHealth = this.teamSelectors[slotIdx].prevHealth;
        const prevStatus = this.teamSelectors[slotIdx].prevStatus;

        const statusChange =
            status.dead != prevStatus.dead ||
            status.disconnected != prevStatus.disconnected ||
            status.downed != prevStatus.downed ||
            status.role != prevStatus.role;
        if (
            this.teamSelectors[slotIdx].playerId != playerId ||
            health != prevHealth ||
            statusChange
        ) {
            const teamStatus = this.teamSelectors[slotIdx].teamStatus;
            const teamHealthInner = this.teamSelectors[slotIdx].teamHealthInner;
            this.teamSelectors[slotIdx].playerId = playerId;
            this.teamSelectors[slotIdx].teamNameHtml = name;
            teamName.html(name);
            this.updateHealthBar(this.teamMemberHealthBarWidth, teamHealthInner, null, {
                health,
                dead: status.dead,
                downed: status.downed,
            });
            if (statusChange) {
                teamStatus.attr("class", "ui-team-member-status");
                if (status.disconnected) {
                    teamStatus.addClass("ui-team-member-status-disconnected");
                } else if (status.dead) {
                    teamStatus.addClass("ui-team-member-status-dead");
                } else if (status.downed) {
                    teamStatus
                        .addClass("ui-team-member-status-downed")
                        .addClass("icon-pulse");
                }
                teamName.css("opacity", status.disconnected || status.dead ? 0.3 : 1);
            }
            groupId.css("display", "block");
            this.teamSelectors[slotIdx].prevStatus =
                status as this["teamSelectors"][number]["prevStatus"];
            this.teamSelectors[slotIdx].prevHealth = health;
        }
    }

    clearTeamUI() {
        $(".ui-team-member").css("display", "none");
        $(".ui-team-indicator").css("display", "none");
        $(".ui-team-member-name").removeAttr("style");
        $(".ui-team-member-status").removeAttr("style");
        $(".ui-team-member-status").removeClass(
            "ui-team-member-status-downed ui-team-member-status-dead ui-team-member-status-disconnected icon-pulse",
        );
        this.teamSelectors = [];
    }

    resize(map: Map, camera: Camera) {
        this.screenScaleFactor =
            device.uiLayout == device.UiLayout.Sm
                ? 0.5626
                : math.min(
                      1,
                      math.clamp(camera.m_screenWidth / 1280, 0.75, 1) *
                          math.clamp(camera.m_screenHeight / 1024, 0.75, 1),
                  );
        this.m_pieTimer.resize(this.touch, this.screenScaleFactor);

        this.gasRenderer.resize();

        this.mapSprite.texture = map.getMapTexture()!;

        const roleMenuScale = math.min(
            1,
            math.min(camera.m_screenWidth / 1200, camera.m_screenHeight / 900),
        );

        this.roleMenuElem.css(
            "transform",
            `translateX(-50%) translateY(-50%) scale(${roleMenuScale})`,
        );

        this.redraw(camera);
    }

    redraw(camera: Camera) {
        const screenWidth = camera.m_screenWidth;
        const screenHeight = camera.m_screenHeight;

        const thisMinimapMargin = this.getMinimapMargin();

        let thisMinimapMarginXAdjust = 0;
        let thisMinimapMarginYAdjust = 0;

        // Squeeze in thisMinimapMarginXAdjust on iPhoneX+
        if (device.model == "iphonex") {
            if (device.isLandscape) {
                thisMinimapMarginXAdjust += 28;
            } else {
                thisMinimapMarginYAdjust += 32;
            }
        }
        const thisMinimapSize = this.getMinimapSize();
        const thisMinimapBorderWidth = this.getMinimapBorderWidth();
        const layoutSm = device.uiLayout == device.UiLayout.Sm;

        this.display.border.clear();
        this.container.mask?.clear();

        if (this.bigmapDisplayed) {
            const smallestDim = math.min(screenWidth, screenHeight);
            this.mapSprite.width = smallestDim;
            this.mapSprite.height = smallestDim;
            this.mapSprite.x = screenWidth / 2;
            this.mapSprite.y = screenHeight / 2;
            this.mapSprite.alpha = 1;
            this.container.mask.beginFill(0xffffff, 1);
            this.container.mask.drawRect(
                this.mapSprite.x - this.mapSprite.width / 2,
                this.mapSprite.y - this.mapSprite.height / 2,
                this.mapSprite.width,
                this.mapSprite.height,
            );
            this.container.mask.endFill();
            if (device.touch) {
                this.bigmapCollision.css({
                    width: screenHeight,
                    height: screenWidth,
                });
            }
        } else {
            const minimapScale = (this.screenScaleFactor * 1600) / 1.2;
            const minimapSize = thisMinimapSize * this.screenScaleFactor;

            this.mapSprite.width = minimapScale;
            this.mapSprite.height = minimapScale;
            this.mapSprite.alpha = 0.8;

            // Start with a fall back
            let scaleCss: Record<string, number | string> = {
                zoom: this.screenScaleFactor,
            };
            if (document.body) {
                if ("WebkitTransform" in document.body.style) {
                    scaleCss = {
                        "-webkit-transform": `scale(${this.screenScaleFactor})`,
                    };
                } else if ("transform" in document.body.style) {
                    scaleCss = {
                        transform: `scale(${this.screenScaleFactor})`,
                    };
                }
            }
            this.mapContainer.css(scaleCss);
            this.mapContainer.css(
                "bottom",
                this.mapContainerBottom * this.screenScaleFactor,
            );
            const minimapPosY = layoutSm
                ? minimapSize / 2 + thisMinimapMargin
                : screenHeight - minimapSize / 2 - thisMinimapMargin;
            this.minimapPos.x =
                thisMinimapMargin + minimapSize / 2 + thisMinimapMarginXAdjust;
            this.minimapPos.y = minimapPosY + thisMinimapMarginYAdjust;
            this.display.border.lineStyle(thisMinimapBorderWidth, 0);
            this.display.border.beginFill(0, 0);
            const u = layoutSm
                ? thisMinimapMargin + thisMinimapBorderWidth / 2
                : screenHeight -
                  minimapSize -
                  thisMinimapMargin +
                  thisMinimapBorderWidth / 2;
            this.display.border.drawRect(
                thisMinimapMargin + thisMinimapBorderWidth / 2 + thisMinimapMarginXAdjust,
                u + thisMinimapMarginYAdjust,
                minimapSize - thisMinimapBorderWidth,
                minimapSize - thisMinimapBorderWidth,
            );
            this.display.border.endFill();

            const minimapMaskAnchorY = layoutSm
                ? thisMinimapMargin
                : screenHeight - minimapSize - thisMinimapMargin;
            this.container.mask.beginFill(0xffffff, 1);
            this.container.mask.drawRect(
                thisMinimapMargin + thisMinimapMarginXAdjust,
                minimapMaskAnchorY - 0.5 + thisMinimapMarginYAdjust,
                minimapSize,
                minimapSize,
            );
            this.container.mask.endFill();
        }
    }

    toggleEscMenu(clear = false) {
        if (!this.displayingStats) {
            if (this.escMenuDisplayed || clear) {
                this.escMenuDisplayed = false;
                this.escMenuElem.css("display", "none");
                this.setCurrentGameTab("settings");
                $("#ui-center").off("mouseenter mouseleave");
                this.inputBinds.menuHovered = false;
                if (this.roleMenuActive) {
                    this.displayRoleMenu();
                }
            } else if (this.bigmapDisplayed) {
                this.displayMapLarge(true);
            } else {
                if (this.visibilityMode == 2) {
                    this.cycleVisibilityMode();
                }
                this.escMenuDisplayed = true;
                this.escMenuElem.css("display", "block");
                $("#ui-center")
                    .on("mouseenter", () => {
                        this.inputBinds.menuHovered = true;
                    })
                    .on("mouseleave", () => {
                        this.inputBinds.menuHovered = false;
                    });
                this.inputBinds.menuHovered = false;
                if (this.roleMenuActive) {
                    this.hideRoleMenu();
                }
            }
        }
    }

    setCurrentGameTab(tab: string) {
        this.currentGameTab = tab;
        this.gameTabs.css("display", "none");
        this.gameTabBtns.removeClass("btn-game-menu-selected");
        $(`#ui-game-tab-${this.currentGameTab}`).css("display", "block");
        $(`#btn-game-${this.currentGameTab}`).addClass("btn-game-menu-selected");
        if (this.currentGameTab == "keybinds") {
            this.inputBindUi.refresh();
        } else {
            this.inputBindUi.cancelBind();
        }
    }

    setRoleMenuActive(active: boolean) {
        this.roleMenuActive = active;
        if (this.roleMenuActive) {
            this.roleMenuTicker = GameConfig.player.perkModeRoleSelectDuration;
            this.displayRoleMenu();
        } else {
            if (this.roleMenuInst) {
                this.audioManager.stopSound(this.roleMenuInst);
                this.roleMenuInst = null;
            }
            this.hideRoleMenu();
        }
    }

    displayRoleMenu() {
        this.roleMenuElemWrapper.css("display", "block");
    }

    hideRoleMenu() {
        this.roleMenuElemWrapper.css("display", "none");
    }

    setRoleMenuOptions(role: string, roles: string[]) {
        $("#ui-role-header").html("");

        for (let a = 0; a < roles.length; a++) {
            const role = roles[a];
            const roleDef = GameObjectDefs[role] as RoleDef;
            const roleOption = $("<div/>", {
                class: "ui-role-option",
                "data-role": role,
            });
            roleOption.css({
                "background-image": `url('${roleDef.guiImg}')`,
            });
            $("#ui-role-header").append(roleOption);
        }

        $(".ui-role-option").on("click", (e) => {
            e.stopPropagation();
            const el = $(e.currentTarget);
            this.setRoleMenuInfo(el.data("role"));
        });

        let selectedRole = roles[0];
        if (roles.includes(role)) {
            selectedRole = role;
        }
        this.setRoleMenuInfo(selectedRole);
    }

    setRoleMenuInfo(role: string) {
        const roleDef = GameObjectDefs[role] as RoleDef;
        $(".ui-role-option").css({
            "background-size": 132,
            opacity: 0.5,
        });
        $("#ui-role-header").find(`[data-role=${role}]`).css({
            "background-size": 164,
            opacity: 1,
        });
        const roleBodyLeft = $("<div/>", {
            class: "ui-role-body-left",
        });
        const roleBodyName = $("<div/>", {
            class: "ui-role-body-name",
        });
        const roleBodyImg = $("<div/>", {
            class: "ui-role-body-image",
        });

        const roleName = this.localization.translate(`game-${role}`);
        roleBodyName.html(roleName);
        roleBodyImg.css({
            "background-image": `url('${roleDef.guiImg}')`,
        });
        const borderColor = roleDef.color
            ? helpers.colorToHexString(roleDef.color)
            : "default";
        this.roleMenuElem.css("border-color", borderColor);

        roleBodyLeft.append(roleBodyName).append(roleBodyImg);

        const roleBodyRight = $("<div/>", {
            class: "ui-role-body-right",
        });
        const rolePerks = roleDef.perks!;
        for (let i = 0; i < rolePerks.length; i++) {
            const perk = rolePerks[i];
            const perkElem = $("<div/>", {
                class: "ui-role-body-perk",
            });
            const perkElemImg = $("<div/>", {
                class: "ui-role-body-perk-image-wrapper",
            }).append(
                $("<div/>", {
                    class: "ui-role-body-perk-image-icon",
                }),
            );
            const perkElemName = $("<div/>", {
                class: "ui-role-body-perk-name",
            });

            const perkImg = helpers.getSvgFromGameType(
                perk instanceof Function ? perk() : perk,
            );
            perkElemImg.find(".ui-role-body-perk-image-icon").css({
                "background-image": `url('${perkImg}')`,
            });

            const perkName = this.localization.translate(`game-${perk}`);
            perkElemName.html(perkName);
            perkElem.append(perkElemImg).append(perkElemName);
            roleBodyRight.append(perkElem);
        }
        $("#ui-role-body").html("").append(roleBodyLeft).append(roleBodyRight);
        this.roleDisplayed = role;
    }
}
