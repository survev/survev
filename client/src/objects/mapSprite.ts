import { math } from "@survev/shared/utils/math";
import { v2 } from "@survev/shared/utils/v2";
import * as PIXI from "pixi.js-legacy";
import type { Map } from "../map";
import type { UiManager } from "../ui/ui";

class SortableSprite extends PIXI.Sprite {
    /**
     *  zindex: A higher value will mean it will be rendered on top of other displayObjects within the same container.
     */
    __zOrder = -1;

    constructor() {
        super();
    }
}

export class MapSprite {
    active = false;
    retained = true;
    sprite = new SortableSprite();
    pos = v2.create(0, 0);
    scale = 1;
    alpha = 1;
    visible = true;
    pulse = false;
    lifetime = 0;
    ticker = 0;
    zOrder = 0;

    constructor() {
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.scale.set(1, 1);
        this.sprite.visible = false;
    }

    init() {
        this.active = true;
        this.retained = true;
        this.pos = v2.create(0, 0);
        this.scale = 1;
        this.alpha = 1;
        this.pulse = false;
        this.visible = true;
        this.lifetime = Number.MAX_VALUE;
        this.ticker = 0;
        this.zOrder = 0;
    }

    free() {
        this.active = false;
        this.sprite.visible = false;
    }

    release() {
        this.retained = false;
    }
}

export class MapSpriteBarn {
    container = new PIXI.Container<SortableSprite>();
    mapSprites: MapSprite[] = [];

    free() {
        for (let i = 0; i < this.mapSprites.length; i++) {
            const sprite = this.mapSprites[i].sprite;
            sprite.parent?.removeChild(sprite);
            sprite.destroy({
                children: true,
            });
        }
    }

    addSprite() {
        let mapSprite = null;
        for (let i = 0; i < this.mapSprites.length; i++) {
            if (!this.mapSprites[i].active) {
                mapSprite = this.mapSprites[i];
                break;
            }
        }
        if (!mapSprite) {
            mapSprite = new MapSprite();
            this.mapSprites.push(mapSprite);
            this.container.addChild(mapSprite.sprite);
        }
        mapSprite.init();
        return mapSprite;
    }

    update(dt: number, uiManager: UiManager, map: Map) {
        let doSort = false;
        for (let i = 0; i < this.mapSprites.length; i++) {
            const m = this.mapSprites[i];
            if (m.active) {
                if (m.zOrder != m.sprite.__zOrder) {
                    m.sprite.__zOrder = m.zOrder;
                    doSort = true;
                }
                m.ticker += dt;
                if (m.pulse) {
                    m.scale += dt / 2.5;
                }
                const pos = uiManager.getMapPosFromWorldPos(m.pos, map);
                const scale = m.scale;
                const fade =
                    math.smoothstep(m.ticker, 0, 0.1) *
                    (1 - math.smoothstep(m.ticker, m.lifetime - 0.5, m.lifetime));
                m.sprite.position.set(pos.x, pos.y);
                m.sprite.scale.set(scale, scale);
                m.sprite.alpha = m.alpha * fade;
                m.sprite.visible = m.visible && m.sprite.alpha > 0.0001;
                if (m.ticker >= m.lifetime && !m.retained) {
                    m.free();
                }
            }
        }
        if (doSort) {
            this.container.children.sort((a, b) => {
                return a.__zOrder - b.__zOrder;
            });
        }
    }
}
