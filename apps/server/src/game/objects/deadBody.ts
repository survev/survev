import { ObjectType } from "@survev/lib/net/objectSerializeFns";
import { collider } from "@survev/shared/utils/collider";
import { type Vec2, v2 } from "@survev/shared/utils/v2";
import type { Game } from "../game";
import { BaseGameObject } from "./gameObject";

export class DeadBodyBarn {
    deadBodies: DeadBody[] = [];

    constructor(readonly game: Game) {}

    update(dt: number) {
        for (let i = 0; i < this.deadBodies.length; i++) {
            const deadBody = this.deadBodies[i];
            deadBody.update(dt);
        }
    }

    addDeadBody(pos: Vec2, playerId: number, layer: number, dir: Vec2) {
        const deadBody = new DeadBody(this.game, pos, playerId, layer, dir);
        this.deadBodies.push(deadBody);
        this.game.objectRegister.register(deadBody);
    }
}

export class DeadBody extends BaseGameObject {
    bounds = collider.createAabbExtents(v2.create(0, 0), v2.create(2, 2));

    override readonly __type = ObjectType.DeadBody;

    layer: number;
    playerId: number;

    vel: Vec2;
    oldPos: Vec2;

    constructor(game: Game, pos: Vec2, playerId: number, layer: number, dir: Vec2) {
        super(game, pos);
        this.layer = layer;
        this.playerId = playerId;
        this.vel = v2.mul(dir, 10);
        this.oldPos = v2.copy(this.pos);
    }

    update(dt: number): void {
        const moving =
            Math.abs(this.vel.x) > 0.001 ||
            Math.abs(this.vel.y) > 0.001 ||
            !v2.eq(this.oldPos, this.pos);

        if (!moving) return;

        this.oldPos = v2.copy(this.pos);

        this.vel = v2.mul(this.vel, 0.95);

        v2.set(this.pos, v2.add(this.pos, v2.mul(this.vel, dt)));
        this.vel = v2.mul(this.vel, 1 / (1 + dt * 3));

        this.game.map.clampToMapBounds(this.pos);

        const originalLayer = this.layer;
        const objs = this.game.grid.intersectGameObject(this);
        this.checkStairs(objs, 2);

        this.game.map.clampToMapBounds(this.pos);

        if (this.layer !== originalLayer) {
            this.setDirty();
        }

        if (!v2.eq(this.oldPos, this.pos)) {
            this.setPartDirty();
            this.game.grid.updateObject(this);
        }
    }
}
