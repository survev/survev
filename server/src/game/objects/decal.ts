import { MapObjectDefs } from "../../../../shared/defs/register.ts";
import { ObjectType } from "../../../../shared/net/objectSerializeFns.ts";
import type { AABB, Circle } from "../../../../shared/utils/coldet.ts";
import { collider } from "../../../../shared/utils/collider.ts";
import { mapHelpers } from "../../../../shared/utils/mapHelpers.ts";
import { math } from "../../../../shared/utils/math.ts";
import { util } from "../../../../shared/utils/util.ts";
import { v2, type Vec2 } from "../../../../shared/utils/v2.ts";
import type { Game } from "../game.ts";
import { BaseGameObject } from "./gameObject.ts";

export class DecalBarn {
    decals: Decal[] = [];

    constructor(readonly game: Game) {}

    update(dt: number) {
        for (let i = 0; i < this.decals.length; i++) {
            const decal = this.decals[i];
            decal.lifeTime -= dt;
            if (decal.lifeTime <= 0) {
                this.decals.splice(i, 1);
                i--;
                decal.destroy();
            }
        }
    }

    addDecal(type: string, pos: Vec2, layer: number, ori?: number, scale?: number) {
        const decal = new Decal(this.game, type, pos, layer, ori, scale);
        this.decals.push(decal);
        this.game.objectRegister.register(decal);
        return decal;
    }
}

export class Decal extends BaseGameObject {
    override readonly __type = ObjectType.Decal;
    bounds: AABB;

    layer: number;
    type: string;
    scale: number;
    goreKills = 0;
    ori: number;
    rot: number;
    collider?: Circle;
    surface?: string;

    lifeTime = Infinity;

    constructor(
        game: Game,
        type: string,
        pos: Vec2,
        layer: number,
        ori?: number,
        scale?: number,
    ) {
        super(game, pos);
        this.layer = layer;
        this.type = type;
        this.scale = scale ?? 1;
        this.ori = ori ?? 0;
        this.rot = math.oriToRad(this.ori);

        const def = MapObjectDefs.typeToDef(type, "decal");

        this.collider = collider.transform(
            def.collision,
            this.pos,
            this.rot,
            this.scale,
        ) as Circle;
        this.surface = def.surface?.type;

        this.bounds = collider.toAabb(
            collider.transform(
                mapHelpers.getBoundingCollider(type),
                v2.create(0, 0),
                this.rot,
                1,
            ),
        );

        const fadeChance = def.fadeChance ?? 1;

        if (def.lifetime && Math.random() < fadeChance) {
            this.lifeTime = typeof def.lifetime === "number"
                ? def.lifetime
                : util.random(def.lifetime.min, def.lifetime.max);
        }
    }
}
