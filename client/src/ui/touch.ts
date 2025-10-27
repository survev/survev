import { GameObjectDefs } from "@survev/shared/defs/gameObjectDefs";
import { BulletDefs } from "@survev/shared/defs/gameObjects/bulletDefs";
import type { GunDef } from "@survev/shared/defs/gameObjects/gunDefs";
import type { ThrowableDef } from "@survev/shared/defs/gameObjects/throwableDefs";
import { GameConfig } from "@survev/shared/gameConfig";
import { collider } from "@survev/shared/utils/collider";
import { math } from "@survev/shared/utils/math";
import { util } from "@survev/shared/utils/util";
import { type Vec2, v2 } from "@survev/shared/utils/v2";
import $ from "jquery";
import * as PIXI from "pixi.js-legacy";
import type { Camera } from "../camera";
import type { ConfigManager } from "../config";
import { device } from "../device";
import type { InputHandler } from "./../input";
import type { Map } from "../map";
import type { Player } from "../objects/player";
import type { Renderer } from "../renderer";

interface Pad {
    touched: boolean;
    centerPos: {
        x: number;
        y: number;
    };
    touchPos: {
        x: number;
        y: number;
    };
    centerSprite: PIXI.Sprite;
    touchSprite: PIXI.Sprite;
}

const deadZone = 2;
const sensitivityThereshold = 0.00001;

export class Touch {
    container = new PIXI.Container();
    lineSprites = new LineSprites();
    padScaleBase = 1;
    padScaleDown = 0.6;
    padScalePos = 0.25;
    moveDetected = false;
    shotDetected = false;
    shotDetectedOld = false;
    touchingAim = false;
    display = true;
    moveStyle = "locked";
    aimStyle = "locked";
    touchAimLine = true;

    touchPads: [Pad, Pad];

    playerMovement = {
        left: false,
        right: false,
        up: false,
        down: false,
        moveLen: 0,
    };

    analogMovement = {
        toMoveDir: v2.create(1, 0),
        toMoveLen: 0,
    };

    aimMovement = {
        toAimDir: v2.create(1, 0),
        toAimLen: 0,
    };

    leftLockedPadCenter = v2.create(0, 0);
    rightLockedPadCenter = v2.create(0, 0);
    padPosBase = 48;
    padPosRange = 0;
    movePadDetectMult = 1;
    shotPadDetectMult = 1.075;
    turnDirCooldown = 0.5;
    turnDirTicker = 0;
    mobileOffsetLandscape = 25;
    mobileOffsetPortrait = 100;
    lockedPadOffsetLandscape = v2.create(126, 100);
    lockedPadOffsetPortrait = v2.create(96, 160);
    lockedPadOffsetYLandscapeSafari = 120;
    lockedPadOffsetYPortraitSafari = 240;

    constructor(
        public input: InputHandler,
        public config: ConfigManager,
    ) {
        const createPadSprite = function (parent: PIXI.Container, tint: number) {
            const pad = PIXI.Sprite.from("pad.img");
            pad.anchor.set(0.5, 0.5);
            pad.scale.set(1, 1);
            pad.alpha = 0.2;
            pad.visible = false;
            pad.tint = tint;
            parent.addChild(pad);
            return pad;
        };
        const createPad = () => {
            return {
                touched: false,
                centerPos: v2.create(0, 0),
                touchPos: v2.create(0, 0),
                centerSprite: createPadSprite(this.container, 0),
                touchSprite: createPadSprite(this.container, 0xffffff),
            };
        };
        this.touchPads = [createPad(), createPad()];
        const validateTouchStyle = function (style: "locked" | "anywhere") {
            if (!["locked", "anywhere"].includes(style)) {
                return "anywhere";
            }
            return style;
        };
        const moveStyle = validateTouchStyle(config.get("touchMoveStyle")!);
        const aimStyle = validateTouchStyle(config.get("touchAimStyle")!);
        this.setMoveStyle(moveStyle);
        this.setAimStyle(aimStyle);
        this.setTouchAimLine(!!config.get("touchAimLine"));
        this.init();
    }

    getTouchMovement(camera: Camera) {
        return this.getMovement(camera);
    }

    getAimMovement(activePlayer: Player, camera: Camera) {
        const isHoldingThrowable =
            activePlayer.m_localData.m_curWeapIdx == GameConfig.WeaponSlot.Throwable;
        return this.getAim(isHoldingThrowable, camera);
    }

    setAimDir(dir: Vec2) {
        this.aimMovement.toAimDir = v2.copy(dir);
    }

    getMovement(camera: Camera) {
        let posDown: Vec2 | null = null;
        let pos: Vec2 | null = null;
        let touched = false;
        let toMoveDir;
        this.moveDetected = false;
        for (let i = 0; i < this.input.touches.length; i++) {
            const t = this.input.touches[i];
            if (!t.isDead && this.isLeftSideTouch(t.posDown.x, camera)) {
                const center =
                    this.moveStyle == "anywhere" ? t.posDown : this.leftLockedPadCenter;
                const pull = v2.sub(t.pos, center);
                const dist = v2.length(pull);

                if (dist > deadZone) {
                    const toMoveLen =
                        (dist - deadZone) /
                        (this.padPosRange / this.movePadDetectMult - deadZone);
                    toMoveDir =
                        toMoveLen > sensitivityThereshold
                            ? v2.div(pull, toMoveLen)
                            : this.analogMovement.toMoveDir;
                    this.analogMovement = {
                        toMoveDir: v2.create(toMoveDir.x, toMoveDir.y * -1),
                        toMoveLen,
                    };
                    this.moveDetected = true;
                }
                pos = this.getConstrainedPos(center, t.pos, dist);
                posDown = center;
                touched = true;
                break;
            }
        }

        const pad = this.touchPads[0];
        pad.touched = touched;

        if (touched && this.moveStyle == "anywhere") {
            pad.centerPos = v2.copy(posDown!);
        } else {
            pad.centerPos = v2.copy(this.leftLockedPadCenter);
        }

        pad.touchPos.x = touched ? pos!.x : this.leftLockedPadCenter.x;
        pad.touchPos.y = touched ? pos!.y : this.leftLockedPadCenter.y;
        return this.analogMovement;
    }

    getAim(isHoldingThrowable: boolean, camera: Camera) {
        let touched = false;
        let posDown: Vec2 | null = null;
        let pos: Vec2 | null = null;
        let toAimDir;
        for (let i = 0; i < this.input.touches.length; i++) {
            const t = this.input.touches[i];
            if (!t.isDead && !this.isLeftSideTouch(t.posDown.x, camera)) {
                const center =
                    this.aimStyle == "anywhere" ? t.posDown : this.rightLockedPadCenter;
                const pull = v2.sub(t.pos, center);
                const dist = v2.length(pull);

                if (dist > deadZone) {
                    const toAimPos = v2.sub(t.pos, center);
                    const toAimLen = v2.length(toAimPos);
                    toAimDir =
                        toAimLen > sensitivityThereshold
                            ? v2.div(toAimPos, toAimLen)
                            : this.aimMovement.toAimDir;
                    this.aimMovement = {
                        toAimDir: v2.create(toAimDir.x, toAimDir.y * -1),
                        toAimLen,
                    };
                } else {
                    this.aimMovement.toAimLen = 0;
                }

                pos = this.getConstrainedPos(center, t.pos, dist);
                posDown = center;
                touched = true;
                break;
            }
        }

        // Detect if user has moved far enough from center to shoot
        this.shotDetectedOld = this.shotDetected;
        this.shotDetected =
            this.aimMovement.toAimLen > this.padPosRange / this.shotPadDetectMult &&
            touched;
        this.touchingAim = touched;

        // Special-case throwable logic: once the player begins priming
        // the grenade, dragging back into aim circle will not release
        // it. Only lifting the finger will throw the grenade.
        if (isHoldingThrowable && this.shotDetectedOld && touched) {
            this.shotDetected = true;
        }

        const pad = this.touchPads[1];

        pad.touched = touched;
        if (touched && this.aimStyle == "anywhere") {
            pad.centerPos = v2.copy(posDown!);
        } else {
            pad.centerPos = v2.copy(this.rightLockedPadCenter);
        }
        pad.touchPos.x = touched ? pos!.x : this.rightLockedPadCenter.x;
        pad.touchPos.y = touched ? pos!.y : this.rightLockedPadCenter.y;

        return {
            aimMovement: this.aimMovement,
            touched: pad.touched,
        };
    }

    m_update(
        _dt: number,
        activePlayer: Player,
        map: Map,
        camera: Camera,
        renderer: Renderer,
    ) {
        for (let i = 0; i < this.touchPads.length; i++) {
            const pad = this.touchPads[i];
            pad.centerSprite.position.x = pad.centerPos.x;
            pad.centerSprite.position.y = pad.centerPos.y;
            pad.centerSprite.scale.x = this.padScaleBase * this.padScaleDown;
            pad.centerSprite.scale.y = this.padScaleBase * this.padScaleDown;
            pad.centerSprite.visible = device.touch && this.display;
            pad.touchSprite.position.x = pad.touchPos.x;
            pad.touchSprite.position.y = pad.touchPos.y;
            pad.touchSprite.scale.x = this.padScaleBase * this.padScalePos;
            pad.touchSprite.scale.y = this.padScaleBase * this.padScalePos;
            pad.touchSprite.visible = device.touch && this.display;
        }

        this.lineSprites.update(this, activePlayer, map, camera, renderer);
    }

    isLeftSideTouch(posX: number, camera: Camera) {
        return posX < camera.m_screenWidth * 0.5;
    }

    getConstrainedPos(posDown: Vec2, pos: Vec2, dist: number) {
        if (dist <= this.padPosRange) {
            return pos;
        }
        const x = pos.x - posDown.x;
        const y = pos.y - posDown.y;
        const radians = Math.atan2(y, x);
        return v2.create(
            Math.cos(radians) * this.padPosRange + posDown.x,
            Math.sin(radians) * this.padPosRange + posDown.y,
        );
    }

    getConstrainedPosDown(posDown: Vec2, dir: Vec2, dist: number) {
        const normalDir = v2.normalizeSafe(dir);
        return v2.add(posDown, v2.mul(normalDir, Math.max(0, dist - this.padPosRange)));
    }

    toggleMoveStyle() {
        this.setMoveStyle(this.moveStyle == "locked" ? "anywhere" : "locked");
    }

    setMoveStyle(style: "locked" | "anywhere") {
        this.moveStyle = style;
        this.config.set("touchMoveStyle", style);
        const elem = document.getElementById("btn-game-move-style");

        if (elem) {
            if (this.moveStyle == "locked") {
                elem.classList.remove("unlocked-on-icon");
                elem.classList.add("locked-on-icon");
            } else {
                elem.classList.remove("locked-on-icon");
                elem.classList.add("unlocked-on-icon");
            }
        }
    }

    toggleAimStyle() {
        this.setAimStyle(this.aimStyle == "locked" ? "anywhere" : "locked");
    }

    setAimStyle(style: "locked" | "anywhere") {
        this.aimStyle = style;
        this.config.set("touchAimStyle", style);

        const elem = document.getElementById("btn-game-aim-style")!;
        if (this.aimStyle == "locked") {
            elem.classList.remove("unlocked-on-icon");
            elem.classList.add("locked-on-icon");
        } else {
            elem.classList.remove("locked-on-icon");
            elem.classList.add("unlocked-on-icon");
        }
    }

    toggleAimLine() {
        this.setTouchAimLine(!this.touchAimLine);
    }

    setTouchAimLine(isOn: boolean) {
        this.touchAimLine = isOn;
        this.config.set("touchAimLine", this.touchAimLine);
        const elem = document.getElementById("btn-game-aim-line")!;
        if (this.touchAimLine) {
            elem.classList.remove("aim-line-off-icon");
            elem.classList.add("aim-line-on-icon");
        } else {
            elem.classList.remove("aim-line-on-icon");
            elem.classList.add("aim-line-off-icon");
        }
    }

    init() {
        this.resize();
    }

    resize() {
        const isLandscape = device.isLandscape;
        const lockedPadOffsetLandscape = this.lockedPadOffsetLandscape;
        const lockedPadOffsetPortrait = this.lockedPadOffsetPortrait;

        // Scale the x offsets on all tablets to bring them closer to the middle
        if (device.tablet) {
            lockedPadOffsetLandscape.x = lockedPadOffsetLandscape.x * 1;
            lockedPadOffsetPortrait.x = lockedPadOffsetPortrait.x * 1.25;
        }
        const leftLockedPadOffsetLandscape = v2.create(
            lockedPadOffsetLandscape.x,
            lockedPadOffsetLandscape.y,
        );
        const leftLockedPadOffsetPortrait = v2.create(
            lockedPadOffsetPortrait.x,
            lockedPadOffsetPortrait.y,
        );
        const rightLockedPadOffsetLandscape = v2.create(
            device.screenWidth - lockedPadOffsetLandscape.x,
            lockedPadOffsetLandscape.y,
        );
        const rightLockedPadOffsetPortrait = v2.create(
            device.screenWidth - lockedPadOffsetPortrait.x,
            lockedPadOffsetPortrait.y,
        );

        if (device.os == "ios") {
            // Adjust the bottom offset on iPhoneX (web app and native app)
            if (device.model == "iphonex") {
                leftLockedPadOffsetLandscape.x = leftLockedPadOffsetLandscape.x + 56;
                rightLockedPadOffsetLandscape.x = rightLockedPadOffsetLandscape.x - 56;
                leftLockedPadOffsetLandscape.y = leftLockedPadOffsetLandscape.y * 0.9;
                rightLockedPadOffsetLandscape.y = rightLockedPadOffsetLandscape.y * 0.9;
            } else {
                let lockedPadOffsetYLandscapeSafari =
                    this.lockedPadOffsetYLandscapeSafari;
                let lockedPadOffsetYPortraitSafari = this.lockedPadOffsetYPortraitSafari;

                if (device.tablet) {
                    lockedPadOffsetYLandscapeSafari *= 1;
                    lockedPadOffsetYPortraitSafari *= 1;
                }

                leftLockedPadOffsetLandscape.y = lockedPadOffsetYLandscapeSafari;
                leftLockedPadOffsetPortrait.y = lockedPadOffsetYPortraitSafari;
                rightLockedPadOffsetLandscape.y = lockedPadOffsetYLandscapeSafari;
                rightLockedPadOffsetPortrait.y = lockedPadOffsetYPortraitSafari;
            }
        }
        this.padScaleBase = isLandscape ? 1 : 0.8;
        this.padPosRange = this.padPosBase * this.padScaleBase;
        const leftOffset = isLandscape
            ? leftLockedPadOffsetLandscape
            : leftLockedPadOffsetPortrait;
        this.leftLockedPadCenter = v2.create(
            leftOffset.x,
            device.screenHeight - leftOffset.y,
        );
        const rightOffset = isLandscape
            ? rightLockedPadOffsetLandscape
            : rightLockedPadOffsetPortrait;
        this.rightLockedPadCenter = v2.create(
            rightOffset.x,
            device.screenHeight - rightOffset.y,
        );

        this.setMobileStyling(isLandscape);
    }

    setMobileStyling(isLandscape: boolean) {
        if (device.touch) {
            $("#btn-touch-styles")
                .find(".btn-game-container")
                .css("display", "inline-block");
            $("#ui-emote-button").css("display", "block");
        }
        if (device.uiLayout == device.UiLayout.Sm) {
            $("#ui-map-wrapper")
                .addClass("ui-map-wrapper-mobile")
                .removeClass("ui-map-wrapper-desktop");
            $("#ui-settings-container-mobile").css("display", "block");
            $("#ui-settings-container-desktop").css("display", "none");
            $("#ui-right-center")
                .addClass("ui-right-center-mobile")
                .removeClass("ui-right-center-desktop");
            $("#ui-leaderboard-wrapper").css("display", "none");
            $("#big-map-close").css("display", "block");
            $("#ui-game-menu").removeClass("ui-game-menu-desktop");
            $("#btn-game-tabs").css("display", "none");
            $("#ui-game-tab-settings").removeClass("ui-game-tab-settings-desktop");
            $(".ui-ability-key").css("display", "none");
        } else {
            $("#ui-map-wrapper")
                .removeClass("ui-map-wrapper-mobile")
                .addClass("ui-map-wrapper-desktop");
            $("#ui-settings-container-mobile").css("display", "none");
            $("#ui-settings-container-desktop").css("display", "block");
            $("#ui-right-center")
                .removeClass("ui-right-center-mobile")
                .addClass("ui-right-center-desktop");
            $("#ui-leaderboard-wrapper").css("display", "block");
            $("#big-map-close").css("display", "none");
            $("#ui-game-menu").addClass("ui-game-menu-desktop");
            $("#btn-game-tabs").css("display", "flex");
            $("#ui-game-tab-settings").addClass("ui-game-tab-settings-desktop");
            $(".ui-ability-key").css("display", "block");
        }
        if (device.tablet) {
            if (isLandscape) {
                if (device.os == "ios") {
                    $("#ui-bottom-right").addClass("ui-bottom-right-tablet-ipad-browser");
                    $("#ui-right-center").addClass("ui-right-center-tablet-ipad-browser");
                } else {
                    $("#ui-bottom-right").addClass("ui-bottom-right-tablet");
                    $("#ui-right-center").addClass("ui-right-center-tablet");
                }
                $("#ui-bottom-center-left").addClass("ui-bottom-center-left-tablet");
                $("#ui-bottom-center-right").addClass("ui-bottom-center-right-tablet");
                $("#ui-top-left").addClass("ui-top-left-tablet");
                $("#ui-spectate-options-wrapper").addClass(
                    "ui-spectate-options-wrapper-tablet",
                );
                $("#ui-killfeed-wrapper").addClass("ui-killfeed-wrapper-tablet");
                $("#ui-kill-leader-wrapper").css("right", 144);
            } else {
                $("#ui-bottom-left").removeClass("ui-bottom-left-tablet");
                $("#ui-bottom-right").removeClass("ui-bottom-right-tablet");
                $("#ui-right-center").removeClass("ui-right-center-tablet");
                $("#ui-bottom-center-right").removeClass("ui-bottom-center-right-tablet");
                $("#ui-top-left").removeClass("ui-top-left-tablet");
                $("#ui-spectate-options-wrapper").removeClass(
                    "ui-spectate-options-wrapper-tablet",
                );
                $("#ui-killfeed-wrapper-wrapper").removeClass(
                    "ui-killfeed-wrapper-tablet",
                );
            }
        }
        if (device.os == "ios") {
            if (device.model == "iphonex") {
                const gameHeight = device.isLandscape ? "99%" : "90%";
                const topOffset = device.isLandscape ? 0 : 32;
                $("#ui-game").css({
                    height: gameHeight,
                    top: topOffset,
                });
                $("#ui-stats-contents").css({
                    transform: "translate(-50%) scale(0.95)",
                    "transform-origin": "top",
                });
                if (isLandscape) {
                    $("#ui-game").css({
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "93%",
                    });
                } else {
                    $("#ui-game").css({
                        left: "",
                        transform: "",
                        width: "",
                    });
                }
            } else if (window.navigator.standalone && !device.tablet) {
                $("#ui-game").css({
                    height: "95%",
                });
            } else {
                let marginBottom = device.isLandscape ? "86%" : "82%";
                if (device.tablet) {
                    marginBottom = "100%";
                }
                $("#ui-game").css({
                    height: marginBottom,
                });
                const gameMarginTop = 6;
                const gameMarginElems = $(
                    "#ui-right-center, #ui-top-center-scopes-wrapper, #ui-top-center, #ui-menu-display",
                );
                gameMarginElems.css({
                    "margin-top": gameMarginTop,
                });
            }
        }

        // Reorder ammo for mobile
        if (device.tablet || isLandscape) {
            $("#ui-loot-50AE").insertBefore("#ui-loot-556mm");
            $("#ui-loot-9mm").insertBefore("#ui-loot-556mm");
            $("#ui-loot-308sub").insertBefore("#ui-loot-556mm");
            $("#ui-loot-12gauge").insertBefore("#ui-loot-556mm");
            $("#ui-loot-flare").insertBefore("#ui-loot-556mm");
            $("#ui-loot-762mm").insertBefore("#ui-loot-556mm");
            $("#ui-loot-45acp").insertBefore("#ui-loot-556mm");
        } else {
            $("#ui-loot-9mm").insertBefore("#ui-loot-45acp");
            $("#ui-loot-12gauge").insertBefore("#ui-loot-45acp");
            $("#ui-loot-762mm").insertBefore("#ui-loot-45acp");
            $("#ui-loot-556mm").insertBefore("#ui-loot-45acp");
            $("#ui-loot-50AE").insertBefore("#ui-loot-45acp");
            $("#ui-loot-308sub").insertBefore("#ui-loot-45acp");
            $("#ui-loot-flare").insertBefore("#ui-loot-45acp");
        }
    }

    hideAll() {
        this.display = false;
    }
}

class LineSprites {
    container = new PIXI.Container();
    dots: PIXI.Sprite[] = [];

    constructor() {
        this.container.visible = false;
    }

    createDot() {
        const dotSprite = new PIXI.Sprite();
        dotSprite.texture = PIXI.Texture.from("dot.img");
        dotSprite.anchor.set(0.5, 0.5);
        dotSprite.position.set(0, 0);
        dotSprite.scale.set(1, 1);
        dotSprite.tint = 0xffffff;
        dotSprite.alpha = 1;
        dotSprite.visible = false;
        return dotSprite;
    }

    update(
        touch: Touch,
        activePlayer: Player,
        map: Map,
        camera: Camera,
        renderer: Renderer,
    ) {
        const visible = device.touch && touch.touchingAim && touch.touchAimLine;

        if (visible) {
            const curWeap = activePlayer.m_netData.m_activeWeapon;
            const curWeapDef = GameObjectDefs[curWeap] as GunDef | ThrowableDef;

            // Determine max range of the aim line
            let maxRange = 30;
            if (curWeapDef.type == "gun") {
                const bulletDist = BulletDefs[curWeapDef.bulletType].distance;
                maxRange = curWeapDef.barrelLength + bulletDist;
            }

            // Clamp max range to be within the camera radius
            const cameraZoom = activePlayer.m_getZoom();
            const cameraRad = Math.sqrt(cameraZoom * 1.414 * cameraZoom);
            maxRange = math.min(maxRange, cameraRad);

            const start = v2.copy(activePlayer.m_pos);
            let end = v2.add(start, v2.mul(activePlayer.m_dir, maxRange));

            // Compute the nearest intersecting obstacle
            const obstacles = map.m_obstaclePool.m_getPool();
            for (let i = 0; i < obstacles.length; i++) {
                const obstacle = obstacles[i];
                if (
                    !!obstacle.active &&
                    !obstacle.dead &&
                    obstacle.height >= GameConfig.bullet.height &&
                    !!obstacle.collidable &&
                    !obstacle.isWindow &&
                    util.sameLayer(activePlayer.layer, obstacle.layer) &&
                    (curWeapDef.type != "throwable" ||
                        obstacle.height > GameConfig.projectile.maxHeight)
                ) {
                    const res = collider.intersectSegment(obstacle.collider, start, end);

                    if (res) {
                        const dist = v2.length(v2.sub(res.point, start));
                        if (dist < maxRange) {
                            maxRange = dist;
                            end = res.point;
                        }
                    }
                }
            }

            const startOffset = 3.5;
            const increment = 1.5;
            // Allocate enough dots
            const dist = v2.length(v2.sub(end, start));
            const dotCount = Math.max(Math.ceil((dist - startOffset) / increment), 0);

            while (this.dots.length < dotCount) {
                const dot = this.createDot();
                this.container.addChild(dot);
                this.dots.push(dot);
            }

            // Position dots
            for (let i = 0; i < this.dots.length; i++) {
                const dot = this.dots[i];
                const offset = startOffset + i * increment;
                const pos = v2.add(
                    activePlayer.m_pos,
                    v2.mul(activePlayer.m_dir, offset),
                );
                const scale = (1.0 / 32.0) * 0.375;
                dot.position.set(pos.x, pos.y);
                dot.scale.set(scale, scale);
                dot.visible = i < dotCount;
            }

            const p0 = camera.m_pointToScreen(v2.create(0, 0));
            const p1 = camera.m_pointToScreen(v2.create(1, 1));
            const R = v2.sub(p1, p0);
            this.container.position.set(p0.x, p0.y);
            this.container.scale.set(R.x, R.y);
            this.container.alpha = 0.3;
            renderer.addPIXIObj(this.container, activePlayer.layer, 19, 0);
        }
        this.container.visible = visible;
    }
}
