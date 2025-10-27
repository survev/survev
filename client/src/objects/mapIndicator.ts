import { GameObjectDefs } from "@survev/shared/defs/gameObjectDefs";
import type { RoleDef } from "@survev/shared/defs/gameObjects/roleDefs";
import type { MapIndicator } from "@survev/shared/net/updateMsg";
import { math } from "@survev/shared/utils/math";
import { type Vec2, v2 } from "@survev/shared/utils/v2";
import * as PIXI from "pixi.js-legacy";
import { device } from "../device";
import type { MapSprite, MapSpriteBarn } from "./mapSprite";

interface Indicator {
    id: number;
    type: string;
    pos: Vec2;
    equipped: boolean;
    mapSprite: MapSprite;
    pulseSprite: MapSprite;
    pulseScale: number;
    pulseScaleMin: number;
    pulseScaleMax: number;
    pulseTicker: number;
    pulseDir: number;
    pulseSpeed: number;
}

export class MapIndicatorBarn {
    mapIndicators: Indicator[] = [];
    idToMapIdicator: Record<number, Indicator> = {};

    constructor(public mapSpriteBarn: MapSpriteBarn) {}

    updateIndicatorData(indicatorData: MapIndicator[]) {
        for (let i = 0; i < indicatorData.length; i++) {
            const data = indicatorData[i];
            if (data.dead) {
                this.removeIndicator(data.id);
            } else {
                this.updateIndicator(data);
            }
        }
    }

    addIndicator(data: MapIndicator) {
        const indicator: Indicator = {
            id: data.id,
            type: data.type,
            pos: v2.copy(data.pos),
            equipped: data.equipped,
            mapSprite: this.mapSpriteBarn.addSprite(),
            pulseSprite: this.mapSpriteBarn.addSprite(),
            pulseScale: 0.5,
            pulseScaleMin: 0.5,
            pulseScaleMax: 1,
            pulseTicker: 0,
            pulseDir: 1,
            pulseSpeed: 0.3,
        };
        this.mapIndicators.push(indicator);
        this.idToMapIdicator[data.id] = indicator;
        return indicator;
    }

    removeIndicator(id: number) {
        for (let i = 0; i < this.mapIndicators.length; i++) {
            const indicator = this.mapIndicators[i];
            if (indicator.id == id) {
                indicator.mapSprite.free();
                indicator.pulseSprite.free();
                this.mapIndicators.splice(i, 1);
                delete this.idToMapIdicator[id];
                break;
            }
        }
    }

    updateIndicator(data: MapIndicator) {
        let indicator = this.idToMapIdicator[data.id];
        indicator ||= this.addIndicator(data);

        indicator.pos = v2.copy(data.pos);
        indicator.equipped = data.equipped;

        const objDef = GameObjectDefs[indicator.type] as RoleDef;
        const scale = (device.uiLayout == device.UiLayout.Sm ? 0.15 : 0.2) * 1.25;
        const zOrder = indicator.equipped ? 655350 : 1;

        const mapSprite = indicator.mapSprite;
        mapSprite.pos = v2.copy(indicator.pos);
        mapSprite.scale = scale;
        mapSprite.alpha = 1;
        mapSprite.zOrder = zOrder;
        mapSprite.visible = true;
        mapSprite.sprite.texture = PIXI.Texture.from(objDef.mapIndicator?.sprite!);

        mapSprite.sprite.tint = objDef.mapIndicator?.tint ?? 0xffffff;
        if (objDef.mapIndicator?.pulse) {
            const pulseSprite = indicator.pulseSprite;
            pulseSprite.pos = v2.copy(indicator.pos);
            pulseSprite.scale = 1;
            pulseSprite.zOrder = zOrder - 1;
            pulseSprite.visible = true;
            pulseSprite.sprite.texture = PIXI.Texture.from("part-pulse-01.img");
            pulseSprite.sprite.tint = objDef.mapIndicator.pulseTint;
        }
    }

    updateIndicatorPulses(dt: number) {
        for (let i = 0; i < this.mapIndicators.length; i++) {
            const indicator = this.mapIndicators[i];
            indicator.pulseTicker = math.clamp(
                indicator.pulseTicker + dt * indicator.pulseDir * indicator.pulseSpeed,
                indicator.pulseScaleMin,
                1,
            );

            // Ease up and down
            indicator.pulseScale = indicator.pulseTicker * indicator.pulseScaleMax;
            if (
                indicator.pulseScale >= indicator.pulseScaleMax ||
                indicator.pulseTicker <= indicator.pulseScaleMin
            ) {
                indicator.pulseDir *= -1;
            }
            indicator.pulseSprite.scale = indicator.pulseScale;
            indicator.pulseSprite.visible = indicator.equipped;
        }
    }
}
