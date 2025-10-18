import * as PIXI from "pixi.js-legacy";
import { util } from "../../../shared/utils/util";

export const defaultLabelTextOptions: Partial<PIXI.ITextStyle> = {
    fontFamily: "monospace",
    fill: "white",
    fontSize: 13,
    dropShadow: true,
    dropShadowAlpha: 0.5,
    dropShadowAngle: 0,
    dropShadowBlur: 5,
    dropShadowColor: "black",
    dropShadowDistance: 0,
};

export interface GraphOptions {
    width: number;
    height: number;
    x: number;
    y: number;
    maxHistory: number;
    fill: string;
    stroke: string;
    background: {
        fill: string;
        stroke: string;
    };
    titleTextStyle: Partial<PIXI.ITextStyle>;
}

export type GraphKey = "fps" | "ping" | "netIn";

const defaultOptions: GraphOptions = {
    width: 350,
    height: 100,
    x: 0,
    y: 0,
    maxHistory: 150,
    fill: "rgba(255, 0, 0, 0.1)",
    stroke: "red",
    background: {
        fill: "rgba(0, 0, 0, 0.2)",
        stroke: "rgba(0, 0, 0, 0)",
    },
    titleTextStyle: {
        ...defaultLabelTextOptions,
        fontSize: 16,
    },
};

interface GraphLabel {
    readonly text: PIXI.Text;
    updateText: (graph: Graph) => string;
}

export class Graph {
    readonly key: GraphKey;
    readonly container = new PIXI.Container();
    readonly gfx = new PIXI.Graphics();

    fill: string;
    stroke: string;
    background: GraphOptions["background"];

    protected _graphEnabled = true;
    protected _labelsEnabled = true;

    get visible() {
        return this._graphEnabled || this._labelsEnabled;
    }

    toggleGraph(state: boolean) {
        this._graphEnabled = state;
        this.gfx.visible = state;

        this.container.visible = this._graphEnabled || this._labelsEnabled;
        this.updateLabels();
    }

    toggleLabels(state: boolean) {
        this._labelsEnabled = state;
        for (const label of this.labels) {
            label.text.visible = state;
        }

        this.container.visible = this._graphEnabled || this._labelsEnabled;
        this.updateLabels();
    }

    protected readonly _labels: Array<GraphLabel> = [];

    get labels(): ReadonlyArray<GraphLabel> {
        return this._labels;
    }

    get x(): number {
        return this.container.x;
    }
    set x(x: number) {
        this.container.x = x;
    }

    get y(): number {
        return this.container.y;
    }
    set y(y: number) {
        this.container.y = y;
    }

    protected _width: number;
    get width(): number {
        return this._width;
    }
    set width(w: number) {
        this._width = w;
        this.update();
    }

    protected _height: number;
    get height(): number {
        return this._height;
    }
    set height(h: number) {
        this._height = h;
        this.update();
    }

    protected readonly _history: number[] = [];
    get history(): ReadonlyArray<number> {
        return this._history;
    }

    protected _maxHistory: number;
    set maxHistory(history: number) {
        this._maxHistory = history;
        this.update();
    }
    get maxHistory(): number {
        return this._maxHistory;
    }

    protected _maxValue = 0;
    /** Biggest value in the current history */
    get maxValue(): number {
        return this._maxValue;
    }

    protected _minValue = 0;
    /** Smallest value in the current history */
    get minValue(): number {
        return this._minValue;
    }

    protected _sum = 0;
    /** Sum of all values in the current history */
    get sum(): number {
        return this._sum;
    }

    protected _averageValue = 0;
    /** Rounded average value in the history (sum / history size) */
    get averageValue(): number {
        return this._averageValue;
    }

    constructor(key: GraphKey, options: Partial<GraphOptions> = {}) {
        this.key = key;
        const merged = util.mergeDeep({}, defaultOptions, options) as GraphOptions;

        this._width = merged.width;
        this._height = merged.height;
        this.x = merged.x;
        this.y = merged.y;

        this._maxHistory = merged.maxHistory;

        this.fill = merged.fill;
        this.stroke = merged.stroke;
        this.background = merged.background;

        this.container.addChild(this.gfx);

        this.update();
    }

    addEntry(data: number): void {
        if (!this._graphEnabled && !this._labelsEnabled) return;

        this._history.push(data);
        if (this._history.length > this.maxHistory) {
            this._history.shift();
        }

        this._maxValue = -Number.MAX_VALUE;
        this._minValue = Number.MAX_VALUE;
        this._sum = 0;

        for (let i = 0; i < this._history.length; i++) {
            const item = this._history[i];
            this._maxValue = this._maxValue > item ? this._maxValue : item;
            this._minValue = this._minValue < item ? this._minValue : item;
            this._sum += item;
        }
        this._averageValue = Math.round(this._sum / this._history.length);

        this.update();
    }

    addLabel(
        updateText: (graph: Graph) => string,
        textOptions: Partial<PIXI.ITextStyle> = {},
    ) {
        const text = new PIXI.Text();
        text.style = util.mergeDeep({}, defaultLabelTextOptions, textOptions);
        this.container.addChild(text);
        this._labels.push({
            text,
            updateText,
        });
        return this;
    }

    update(): void {
        this.updateLabels();
        this.renderGraph();
    }

    updateLabels(): void {
        if (!this._labelsEnabled) return;

        for (let i = 0, x = 0; i < this._labels.length; i++) {
            const label = this._labels[i];
            label.text.text = label.updateText(this);
            label.text.x = x;
            label.text.y = this.gfx.visible ? this.gfx.height : 0;
            x += label.text.width + parseInt(label.text.style.fontSize as string);
        }
    }

    renderGraph(): void {
        if (!this._graphEnabled) return;

        this.gfx
            .clear()
            .beginFill(this.background.fill)
            .lineStyle(2, this.background.stroke)
            .drawRect(0, 0, this.width, this.height)
            .endFill()
            .beginFill(this.fill)
            .lineStyle({
                width: 2,
                color: this.stroke,
                join: PIXI.LINE_JOIN.ROUND,
            })
            .moveTo(0, this.height);

        const spaceBetween = this.width / (this.maxHistory - 1);

        let x = 0;
        for (let i = 0; i < this._history.length; i++) {
            const height = (this._history[i] / this._maxValue) * this.height;
            x = spaceBetween * i;
            this.gfx.lineTo(x, this.height - height);
        }

        this.gfx.lineTo(x, this.height).closePath().endFill();
    }
}
