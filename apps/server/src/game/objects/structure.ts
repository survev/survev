import { ObjectType } from "@survev/lib/net/objectSerializeFns";
import { MapObjectDefs } from "@survev/shared/defs/mapObjectDefs";
import type { StructureDef } from "@survev/shared/defs/mapObjectsTyping";
import { type AABB, coldet } from "@survev/shared/utils/coldet";
import { collider } from "@survev/shared/utils/collider";
import { mapHelpers } from "@survev/shared/utils/mapHelpers";
import { math } from "@survev/shared/utils/math";
import { type Vec2, v2 } from "@survev/shared/utils/v2";
import type { Game } from "../game";
import { BaseGameObject } from "./gameObject";

interface Stair {
    collision: AABB;
    center: Vec2;
    downDir: Vec2;
    downOri: number;
    upOri: number;
    downAabb: AABB;
    upAabb: AABB;
    noCeilingReveal: boolean;
    lootOnly: boolean;
}

export class Structure extends BaseGameObject {
    override readonly __type = ObjectType.Structure;
    bounds: AABB;
    layer: number;

    ori: number;
    type: string;
    layerObjIds: number[] = [];
    interiorSoundAlt = false;
    interiorSoundEnabled = true;

    stairs: Stair[];

    scale = 1;
    rot: number;

    constructor(game: Game, type: string, pos: Vec2, layer: number, ori: number) {
        super(game, pos);
        this.layer = layer;
        this.type = type;
        this.ori = ori;

        this.rot = math.oriToRad(ori);

        this.bounds = collider.transform(
            mapHelpers.getBoundingCollider(type),
            v2.create(0, 0),
            this.rot,
            1,
        ) as AABB;

        const def = MapObjectDefs[type] as StructureDef;

        this.stairs = [];
        for (let i = 0; i < def.stairs.length; i++) {
            const stairsDef = def.stairs[i];
            const stairsCol = collider.transform(
                stairsDef.collision,
                this.pos,
                this.rot,
                this.scale,
            ) as AABB;
            const downDir = v2.rotate(stairsDef.downDir, this.rot);

            const downRot = Math.atan2(downDir.y, downDir.x);
            const downOri = math.radToOri(downRot);

            const childAabbs = coldet.splitAabb(stairsCol, downDir);
            this.stairs.push({
                collision: stairsCol,
                center: v2.add(
                    stairsCol.min,
                    v2.mul(v2.sub(stairsCol.max, stairsCol.min), 0.5),
                ),
                downDir,
                downOri,
                upOri: (downOri + 2) % 4,
                downAabb: collider.createAabb(childAabbs[0].min, childAabbs[0].max),
                upAabb: collider.createAabb(childAabbs[1].min, childAabbs[1].max),
                noCeilingReveal: !!stairsDef.noCeilingReveal,
                lootOnly: !!stairsDef.lootOnly,
            });
        }
    }
}
