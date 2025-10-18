import * as PIXI from "pixi.js-legacy";
import { GameConfig } from "../../shared/gameConfig";
import { Constants } from "../../shared/net/net";
import type { GasData } from "../../shared/net/updateMsg";
import { math } from "../../shared/utils/math";
import { type Vec2, v2 } from "../../shared/utils/v2";
import type { Camera } from "./camera";
import { helpers } from "./helpers";
import type { UiManager } from "./ui/ui";

const gasMode = GameConfig.GasMode;

const overdraw = 100 * 1000;
const segments = 512;

export class GasRenderer {
    gasColorDOMString = "";
    display: PIXI.DisplayObject | null = null;
    canvas: HTMLCanvasElement | null = null;

    constructor(
        public canvasMode: boolean,
        public gasColor: number,
    ) {
        if (canvasMode) {
            this.canvas = document.createElement("canvas");
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.display = new PIXI.Sprite(PIXI.Texture.from(this.canvas));
            this.gasColorDOMString = helpers.colorToDOMString(gasColor, 0.6);
        } else {
            this.display = new PIXI.Graphics();
            const ctx = this.display as PIXI.Graphics;
            ctx.clear();
            ctx.beginFill(gasColor, 0.6);
            ctx.moveTo(-overdraw, -overdraw);
            ctx.lineTo(overdraw, -overdraw);
            ctx.lineTo(overdraw, overdraw);
            ctx.lineTo(-overdraw, overdraw);
            ctx.closePath();
            ctx.beginHole();
            ctx.moveTo(0, 1);
            for (let i = 1; i < segments; i++) {
                const theta = i / segments;
                const s = Math.sin(Math.PI * 2 * theta);
                const c = Math.cos(Math.PI * 2 * theta);
                ctx.lineTo(s, c);
            }
            ctx.endHole();
            ctx.closePath();
        }
        this.display.visible = false;
    }

    free() {
        this.display!.destroy(true);
    }

    resize() {
        if (this.canvas != null) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            (this.display as PIXI.Sprite).texture.update();
        }
    }

    render(gasPos: Vec2, gasRad: number, active: boolean) {
        if (this.canvas != null) {
            const canvas = this.canvas;
            const ctx = canvas.getContext("2d")!;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.fillStyle = this.gasColorDOMString;
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.arc(gasPos.x, gasPos.y, gasRad, 0, Math.PI * 2, true);
            ctx.fill();
        } else {
            const center = v2.copy(gasPos);
            // Once the hole gets small enough, just fill the entire
            // screen with some random part of the geometry
            let rad = gasRad;
            if (rad < 0.1) {
                rad = 1;
                center.x += overdraw * 0.5;
            }
            const ctx = this.display!;
            ctx.position.set(center.x, center.y);
            ctx.scale.set(rad, rad);
        }
        this.display!.visible = active;
    }
}

export class GasSafeZoneRenderer {
    display = new PIXI.Container();
    circleGfx = new PIXI.Graphics();
    lineGfx = new PIXI.Graphics();
    safePos = v2.create(0, 0);
    safeRad = 0;
    playerPos = v2.create(0, 0);

    constructor() {
        this.display.addChild(this.circleGfx);
        this.display.addChild(this.lineGfx);
        this.circleGfx.visible = false;
        this.lineGfx.visible = false;
    }

    render(
        safePos: Vec2,
        safeRad: number,
        playerPos: Vec2,
        drawCircle: boolean,
        drawLine: boolean,
    ) {
        // Render a circle showing the safe zone, and a line pointing from
        // the player to the center. Only update geometry if relevant data
        // has changed.
        this.circleGfx.visible = drawCircle;
        this.lineGfx.visible = drawLine;
        if (drawCircle || drawLine) {
            const safePosChanged = !v2.eq(this.safePos, safePos, 0.0001);
            const safeRadChanged = Math.abs(this.safeRad - safeRad) > 0.0001;
            const playerPosChanged = !v2.eq(this.playerPos, playerPos, 0.0001);

            if (safePosChanged) {
                this.safePos.x = safePos.x;
                this.safePos.y = safePos.y;
            }
            if (safeRadChanged) {
                this.safeRad = safeRad;
            }
            if (playerPosChanged) {
                this.playerPos.x = playerPos.x;
                this.playerPos.y = playerPos.y;
            }

            // Update circle?
            if (safePosChanged) {
                this.circleGfx.position.set(this.safePos.x, this.safePos.y);
            }
            if (safeRadChanged) {
                this.circleGfx.clear();
                this.circleGfx.lineStyle(1.5, 0xffffff);
                this.circleGfx.drawCircle(0, 0, safeRad);
            }
            // Update line?
            if (safePosChanged || safeRadChanged || playerPosChanged) {
                const isSafe = v2.length(v2.sub(playerPos, safePos)) < safeRad;
                const alpha = isSafe ? 0.5 : 1;
                this.lineGfx.clear();
                this.lineGfx.lineStyle(2, 0xff00, alpha);
                this.lineGfx.moveTo(playerPos.x, playerPos.y);
                this.lineGfx.lineTo(safePos.x, safePos.y);
            }
        }
    }
}

export class Gas {
    mode: number = gasMode.Inactive;
    circleT = 0;
    circleTOld = 0;
    duration = 0;
    interpolationT = 0;

    gasRenderer!: GasRenderer;
    circleOld: {
        pos: Vec2;
        rad: number;
    };

    circleNew: {
        pos: Vec2;
        rad: number;
    };

    constructor(canvasMode: boolean) {
        const startRad = (Math.sqrt(2) + 0.01) * Constants.MaxPosition;
        this.circleOld = {
            pos: v2.create(0, 0),
            rad: startRad,
        };
        this.circleNew = {
            pos: v2.create(0, 0),
            rad: startRad,
        };
        this.gasRenderer = new GasRenderer(canvasMode, 16711680);
    }

    m_free() {
        this.gasRenderer.free();
    }

    resize() {
        this.gasRenderer.resize();
    }

    isActive() {
        return this.mode != gasMode.Inactive;
    }

    getCircle(interpT: number) {
        const t =
            this.mode == gasMode.Moving
                ? math.lerp(interpT, this.circleTOld, this.circleT)
                : 0;
        return {
            pos: v2.lerp(t, this.circleOld.pos, this.circleNew.pos),
            rad: math.lerp(t, this.circleOld.rad, this.circleNew.rad),
        };
    }

    setProgress(circleT: number) {
        this.circleTOld = this.circleT;
        this.circleT = circleT;
        this.interpolationT = 0;
    }

    setFullState(circleT: number, data: GasData, ui: UiManager) {
        // Update Ui
        if (data.mode != this.mode) {
            const timeLeft = Math.ceil(data.duration * (1 - circleT));
            ui.setWaitingForPlayers(false);
            ui.displayGasAnnouncement(data.mode, timeLeft);
        }

        // Update state
        this.mode = data.mode;
        this.duration = data.duration;
        this.setProgress(circleT);

        // Update circles
        this.circleOld.pos = v2.copy(data.posOld);
        this.circleOld.rad = data.radOld;
        this.circleNew.pos = v2.copy(data.posNew);
        this.circleNew.rad = data.radNew;
    }

    m_render(dt: number, camera: Camera) {
        this.interpolationT += dt;
        let interpT = 1;
        if (camera.m_interpEnabled) {
            interpT = math.clamp(this.interpolationT / camera.m_interpInterval, 0, 1);
        }
        const circle = this.getCircle(interpT);
        const pos = camera.m_pointToScreen(circle.pos);
        const scale = camera.m_scaleToScreen(circle.rad);
        this.gasRenderer.render(pos, scale, this.isActive());
    }
}
