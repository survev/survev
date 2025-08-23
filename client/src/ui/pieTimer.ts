import * as PIXI from "pixi.js";
import { math } from "../../../shared/utils/math";
import type { Camera } from "../camera";
import { device } from "../device";
import type { Touch } from "./touch";

const fontWidth = 24;

export class PieTimer {
    container = new PIXI.Container();
    timerBackground = PIXI.Sprite.from("timer-background.img");

    counterText = new PIXI.Text();
    gfx = new PIXI.Graphics();
    labelText = new PIXI.Text();

    screenScaleFactor = 1;
    mobileOffset = 0;
    active = false;
    label = "";
    elapsed = 0;
    duration = 0;

    constructor() {
        this.container.visible = false;

        this.timerBackground.anchor.set(0.5, 0.5);
        this.timerBackground.scale.set(1, 1);
        this.container.addChild(this.timerBackground);
        this.container.addChild(this.gfx);
        this.counterText.anchor.set(0.5, 0.5);
        this.counterText.style = {
            fontFamily: "Roboto Condensed, Arial, sans-serif",
            fontWeight: "bold",
            fontSize: fontWidth,
            align: "center",
            fill: 0xffffff,
            stroke: {
                color: 0,
                width: 3,
            },
        };
        this.container.addChild(this.counterText);
        this.labelText.anchor.set(0.5, 0.5);
        this.labelText.style = {
            fontFamily: "Roboto Condensed, Arial, sans-serif",
            fontWeight: "100",
            fontSize: fontWidth,
            align: "center",
            fill: 0xffffff,
        };
        this.container.addChild(this.labelText);
    }

    destroy() {
        // Don't destroy the texture being used by timerBackground
        this.container.removeChild(this.timerBackground);
        this.timerBackground.destroy({
            children: true,
        });
        this.container.destroy({
            children: true,
            texture: true,
        });
    }

    start(label: string, elapsed: number, duration: number) {
        this.active = true;
        this.label = label;
        this.elapsed = elapsed;
        this.duration = duration;
    }

    stop() {
        this.active = false;
    }

    resize(touch: Touch, screenScaleFactor: number) {
        this.screenScaleFactor = screenScaleFactor;

        if (device.uiLayout == device.UiLayout.Sm) {
            if (!device.tablet) {
                this.container.scale.set(0.5, 0.5);
            }
            this.mobileOffset = device.isLandscape
                ? touch.mobileOffsetLandscape
                : touch.mobileOffsetPortrait;
        } else {
            this.container.scale.set(1, 1);
            this.mobileOffset = 0;
        }
    }

    update(dt: number, camera: Camera) {
        if (!this.active) {
            this.container.visible = false;
            return;
        }

        this.elapsed = math.min(this.elapsed + dt, this.duration);

        const labelWidth = 56 + this.label.length * fontWidth * 0.45;
        const labelHeight = fontWidth * 1.5;
        const rectX = 0 - labelWidth / 2;
        const rectY = 87.5 - labelHeight / 2;
        const l = math.min(this.elapsed / this.duration, 1) * Math.PI * 2 - Math.PI * 0.5;
        this.gfx.clear();
        this.gfx.roundRect(rectX, rectY, labelWidth, labelHeight, 5);
        this.gfx.fill({ color: 0, alpha: 0.5 });
        this.gfx.beginPath();
        this.gfx.arc(0, 0, 35, -Math.PI * 0.5, l, false);
        this.gfx.stroke({ width: 6, color: 0xffffff });
        this.counterText.text = math.max(0, this.duration - this.elapsed).toFixed(1);
        this.labelText.position.y = 87.5;
        this.labelText.text = this.label;
        this.container.position.set(
            camera.m_screenWidth / 2,
            (camera.m_screenHeight / 3) * this.screenScaleFactor + this.mobileOffset,
        );
        this.container.visible = true;
    }
}
