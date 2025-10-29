import type { ObjectData, ObjectType } from "@survev/lib/net/objectSerializeFns";
import { collider } from "@survev/shared/utils/collider";
import { util } from "@survev/shared/utils/util";
import { v2 } from "@survev/shared/utils/v2";
import * as PIXI from "pixi.js-legacy";
import type { Camera } from "../camera";
import { device } from "../device";
import type { Ctx } from "../game";
import type { Map } from "../map";
import type { Renderer } from "../renderer";
import { Pool } from "./objectPool";
import type { AbstractObject, Player, PlayerBarn } from "./player";

function createDeadBodyText() {
    const nameStyle: Partial<PIXI.TextStyle> = {
        fontFamily: "Arial",
        fontWeight: "bold",
        fontSize: device.pixelRatio > 1 ? 30 : 24,
        align: "center",
        fill: 0xffffff,
        stroke: 0,
        strokeThickness: 0,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 1,
        dropShadowAngle: Math.PI / 3,
        dropShadowDistance: 1,
    };
    const nameText = new PIXI.Text("", nameStyle);
    nameText.anchor.set(0.5, 0.5);
    nameText.scale.set(0.5, 0.5);
    return nameText;
}

class DeadBody implements AbstractObject {
    __id!: number;
    __type!: ObjectType.DeadBody;
    active = false;

    pos = v2.create(0, 0);
    container = new PIXI.Container();
    sprite = PIXI.Sprite.from("skull.img");
    nameText = createDeadBodyText();

    nameTextSet!: boolean;
    layer!: number;
    playerId!: number;

    constructor() {
        this.container.addChild(this.sprite);
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.scale.set(0.4, 0.4);
        this.sprite.tint = 5921370;
        this.nameText.anchor.set(0.5, -1);
        this.nameText.tint = util.rgbToInt(util.hsvToRgb(0, 0, 0.5));
        this.container.addChild(this.nameText);
        // @ts-expect-error sigh
        this.container.visible = this.sprite;
    }

    m_init() {}
    m_free() {
        this.container.visible = false;
    }

    m_updateData(
        data: ObjectData<ObjectType.DeadBody>,
        fullUpdate: boolean,
        isNew: boolean,
        _ctx: Ctx,
    ) {
        this.pos = v2.copy(data.pos);
        if (fullUpdate) {
            this.layer = data.layer;
            this.playerId = data.playerId;
        }
        if (isNew) {
            this.nameTextSet = false;
            this.container.visible = true;
        }
    }
}

export class DeadBodyBarn {
    deadBodyPool = new Pool(DeadBody);

    m_update(
        _dt: number,
        playerBarn: PlayerBarn,
        activePlayer: Player,
        map: Map,
        camera: Camera,
        renderer: Renderer,
    ) {
        const deadBodies = this.deadBodyPool.m_getPool();
        for (let i = 0; i < deadBodies.length; i++) {
            const d = deadBodies[i];
            if (d.active) {
                if (!d.nameTextSet) {
                    d.nameText.text = playerBarn.getPlayerName(
                        d.playerId,
                        activePlayer.__id,
                        false,
                    );
                    d.nameTextSet = true;
                }
                const col = collider.createCircle(d.pos, 1);
                const onStairs = map.insideStructureStairs(col);

                let layer = d.layer;
                let zOrd = 12;
                if (d.layer == 0 && activePlayer.layer == 0 && onStairs) {
                    layer |= 2;
                    zOrd += 100;
                }

                renderer.addPIXIObj(d.container, layer, zOrd, d.__id);

                const screenPos = camera.m_pointToScreen(d.pos);
                const screenScale = camera.m_pixels(1);
                d.container.position.set(screenPos.x, screenPos.y);
                d.container.scale.set(screenScale, screenScale);
            }
        }
    }

    getDeadBodyById(playerId: number) {
        const deadBodies = this.deadBodyPool.m_getPool();
        for (let i = 0; i < deadBodies.length; i++) {
            const d = deadBodies[i];
            if (d.active && d.playerId == playerId) {
                return d;
            }
        }
        return null;
    }
}
