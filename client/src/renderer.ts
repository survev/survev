import * as PIXI from "pixi.js-legacy";
import { Constants } from "../../shared/net/net";
import { v2 } from "../../shared/utils/v2";
import type { Camera } from "./camera";
import { errorLogManager } from "./errorLogs";
import type { Game } from "./game";
import type { Map } from "./map";

//
// Helpers
//
function step(cur: number, target: number, rate: number) {
    const delta = target - cur;
    const step = delta * rate;
    return Math.abs(step) < 0.01 ? delta : step;
}

function createLayerMask() {
    const mask = new PIXI.Graphics();
    mask.position.set(0.0, 0.0);
    mask.scale.set(1.0, 1.0);
    mask.__zOrd = 0;
    mask.__zIdx = 0;
    return mask;
}

function drawRect(gfx: PIXI.Graphics, x: number, y: number, w: number, h: number) {
    gfx.moveTo(x, y);
    gfx.lineTo(x, y + h);
    gfx.lineTo(x + w, y + h);
    gfx.lineTo(x + w, y);
    gfx.lineTo(x, y);
    gfx.closePath();
}

export class Renderer {
    zIdx = 0;
    layer = 0;
    layerAlpha = 0;
    groundAlpha = 0;
    underground = false;
    layers: RenderGroup[] = [];

    ground = new PIXI.Graphics();
    layerMask = createLayerMask();
    debugLayerMask = null as null | PIXI.Graphics;
    layerMaskDirty = true;
    layerMaskActive = false;

    constructor(
        public game: Game,
        public canvasMode: boolean,
    ) {
        for (let i = 0; i < 4; i++) {
            this.layers.push(new RenderGroup(`layer_${i}`));
        }
        this.ground.alpha = 0;
    }

    m_free() {
        this.layerMask.parent?.removeChild(this.layerMask);
        this.layerMask.destroy(true);
    }

    addPIXIObj(obj: PIXI.Container, layer: number, zOrd: number, zIdx?: number) {
        if (!obj.transform) {
            const err = new Error();
            const str = JSON.stringify({
                type: "addChild",
                stack: err.stack,
                browser: navigator.userAgent,
                playing: this.game.m_playing,
                gameOver: this.game.m_gameOver,
                spectating: this.game.m_spectating,
                time: this.game.m_playingTicker,
                mode: this.game.teamMode,
                layer,
                zOrd,
                zIdx,
            });
            errorLogManager.logError(str);
        }
        if (obj.__layerIdx === undefined) {
            obj.__layerIdx = -1;
            obj.__zOrd = -1;
            obj.__zIdx = -1;
        }
        let layerIdx = layer;
        const onStairs = layer & 0x2;
        // Hack to render large/high objects (trees, smokes) on
        // a separate layer that isn't masked off by the bunkers.
        if (onStairs) {
            layerIdx = zOrd >= 100 ? 3 : 2;
        }

        if (
            obj.parent == this.layers[layerIdx] &&
            obj.__zOrd == zOrd &&
            (zIdx === undefined || obj.__zIdx == zIdx)
        ) {
            return;
        }

        obj.__layerIdx = layerIdx;
        obj.__zOrd = zOrd;
        obj.__zIdx = zIdx !== undefined ? zIdx : this.zIdx++;

        this.layers[layerIdx].addSortedChild(obj);
    }

    setActiveLayer(layer: number) {
        this.layer = layer;
    }

    setUnderground(underground: boolean) {
        this.underground = underground;
    }

    resize(map: Map, camera: Camera) {
        const undergroundColor = map.mapLoaded
            ? map.getMapDef().biome.colors.underground
            : 1772803;

        this.ground.clear();
        this.ground.beginFill(undergroundColor);
        this.ground.drawRect(0, 0, camera.m_screenWidth, camera.m_screenHeight);
        this.ground.endFill();

        this.layerMaskDirty = true;
    }

    redrawLayerMask(camera: Camera, map: Map) {
        const mask = this.layerMask;
        if (this.canvasMode) {
            mask.clear();
            if (this.layerMaskActive) {
                mask.beginFill(0xffffff, 1.0);
                mask.drawRect(0.0, 0.0, camera.m_screenWidth, camera.m_screenHeight);
                const structures = map.m_structurePool.m_getPool();
                for (let i = 0; i < structures.length; i++) {
                    const structure = structures[i];
                    if (!structure.active) {
                        continue;
                    }
                    for (let j = 0; j < structure.mask.length; j++) {
                        const m = structure.mask[j];
                        const e = v2.mul(v2.sub(m.max, m.min), 0.5);
                        const c = v2.add(m.min, e);
                        const ll = camera.m_pointToScreen(v2.sub(c, e));
                        const tr = camera.m_pointToScreen(v2.add(c, e));
                        mask.drawRect(ll.x, ll.y, tr.x - ll.x, tr.y - ll.y);
                    }
                }
                mask.endFill();
            }
        } else {
            // Redraw mask
            if (this.layerMaskDirty) {
                this.layerMaskDirty = false;
                mask.clear();
                mask.beginFill(0xffffff, 1.0);
                drawRect(mask, 0.0, 0.0, Constants.MaxPosition, Constants.MaxPosition);
                const structures = map.m_structurePool.m_getPool();
                for (let i = 0; i < structures.length; i++) {
                    const structure = structures[i];
                    if (!structure.active) {
                        continue;
                    }
                    for (let j = 0; j < structure.mask.length; j++) {
                        const m = structure.mask[j];
                        const e = v2.mul(v2.sub(m.max, m.min), 0.5);
                        const c = v2.add(m.min, e);

                        const x = c.x - e.x;
                        const y = c.y - e.y;
                        const w = e.x * 2.0;
                        const h = e.y * 2.0;
                        mask.beginHole();
                        drawRect(mask, x, y, w, h);
                        mask.endHole();
                    }
                }
                mask.endFill();
            }
            // Position layer mask
            const p0 = camera.m_pointToScreen(v2.create(0.0, 0.0));
            const s = camera.m_scaleToScreen(1.0);
            mask.position.set(p0.x, p0.y);
            mask.scale.set(s, -s);
        }
    }

    redrawDebugLayerMask(camera: Camera, map: Map) {
        const mask = this.debugLayerMask as PIXI.Graphics;
        mask.clear();
        mask.beginFill(16711935, 1);
        const structures = map.m_structurePool.m_getPool();
        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            if (structure.active) {
                for (let s = 0; s < structure.mask.length; s++) {
                    const n = structure.mask[s];
                    const c = v2.mul(v2.sub(n.max, n.min), 0.5);
                    const m = v2.add(n.min, c);
                    const p = m.x - c.x;
                    const h = m.y - c.y;
                    const u = c.x * 2;
                    const g = c.y * 2;
                    drawRect(mask, p, h, u, g);
                }
            }
        }
        mask.endFill();
        const p0 = camera.m_pointToScreen(v2.create(0, 0));
        const s = camera.m_scaleToScreen(1);
        mask.position.set(p0.x, p0.y);
        mask.scale.set(s, -s);
    }

    m_update(dt: number, camera: Camera, map: Map) {
        // Adjust layer alpha
        const alphaTarget = this.layer > 0 ? 1.0 : 0.0;
        this.layerAlpha += step(this.layerAlpha, alphaTarget, dt * 12.0);
        const groundTarget = this.layer == 1 && this.underground ? 1.0 : 0.0;
        this.groundAlpha += step(this.groundAlpha, groundTarget, dt * 12.0);

        this.layers[0].alpha = 1.0;
        this.layers[1].alpha = this.layerAlpha;
        this.layers[2].alpha = 1.0;
        this.layers[3].alpha = 1.0;
        this.ground.alpha = this.groundAlpha;

        this.layers[0].visible = this.groundAlpha < 1.0;
        this.layers[1].visible = this.layerAlpha > 0.0;
        this.ground.visible = this.groundAlpha > 0.0;

        // Set stairs mask
        this.redrawLayerMask(camera, map);

        const maskActive = this.layer == 0;
        if (maskActive && !this.layerMaskActive) {
            this.layers[2].mask = this.layerMask;
            this.layers[2].addChild(this.layerMask);
            this.layerMaskActive = true;
        } else if (!maskActive && this.layerMaskActive) {
            this.layers[2].mask = null;
            this.layers[2].removeChild(this.layerMask);
            this.layerMaskActive = false;
        }

        // Sort layers
        // let sortCount = 0;
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].checkSort();
            /* if (this.layers[i].checkSort()) {
                sortCount++;
            } */
        }
    }
}

class RenderGroup extends PIXI.Container {
    dirty = true;

    constructor(public debugName = "") {
        super();
    }

    addSortedChild(child: PIXI.Container) {
        this.addChild(child);
        this.dirty = true;
    }

    checkSort() {
        if (this.dirty) {
            this.children.sort((a, b) =>
                a.__zOrd == b.__zOrd ? a.__zIdx - b.__zIdx : a.__zOrd - b.__zOrd,
            );
            this.dirty = false;
            return true;
        }
        return false;
    }
}
