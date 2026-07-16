import { ObjectType } from "../../../../shared/net/objectSerializeFns.ts";
import { type AABB, coldet } from "../../../../shared/utils/coldet.ts";
import { collider } from "../../../../shared/utils/collider.ts";
import { math } from "../../../../shared/utils/math.ts";
import { util } from "../../../../shared/utils/util.ts";
import { v2, type Vec2 } from "../../../../shared/utils/v2.ts";
import type { Game } from "../game.ts";
import { BaseGameObject } from "./gameObject.ts";

class SmokeEmitter {
    active = true;

    smokesSpawned = 0;
    spawnTicker = 0;
    activeTicker = 0;

    constructor(
        public smokeBarn: SmokeBarn,
        public pos: Vec2,
        public layer: number,
        public interior: number,
    ) {}

    update(dt: number) {
        this.spawnTicker -= dt;
        if (this.spawnTicker <= 0) {
            if (this.smokesSpawned < 8) {
                this.smokeBarn.addSmoke(this.pos, this.layer, this.interior, this, false);
                this.smokesSpawned++;
                this.spawnTicker = 1.75;
            }
        }
        this.activeTicker += dt;
        if (this.activeTicker >= 16) {
            this.active = false;
        }
    }

    addStartSmokes(amount: number) {
        for (let i = 0; i < amount; i++) {
            this.smokeBarn.addSmoke(this.pos, this.layer, this.interior, this, true);
        }
    }
}

export class SmokeBarn {
    smokes: Smoke[] = [];

    emitters: SmokeEmitter[] = [];

    constructor(readonly game: Game) {}

    update(dt: number) {
        for (let i = 0; i < this.smokes.length; i++) {
            const smoke = this.smokes[i];
            smoke.update(dt);

            if (smoke.destroyed) {
                this.smokes.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < this.emitters.length; i++) {
            const emitter = this.emitters[i];
            emitter.update(dt);
            if (!emitter.active) {
                this.emitters.splice(i, 1);
                i--;
            }
        }
    }

    addEmitter(pos: Vec2, layer: number) {
        let interior = 0;
        const coll = collider.createCircle(pos, 1);
        const objs = this.game.grid.intersectCollider(coll);

        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            if (obj.__type === ObjectType.Building && util.sameLayer(obj.layer, layer)) {
                for (const zoomRegion of obj.zoomRegions) {
                    if (zoomRegion.zoomIn && coldet.test(zoomRegion.zoomIn, coll)) {
                        interior = 1;
                        break;
                    }
                }
            }
        }

        const emitter = new SmokeEmitter(this, pos, layer, interior);
        emitter.addStartSmokes(3);

        this.emitters.push(emitter);
    }

    addSmoke(
        pos: Vec2,
        layer: number,
        interior: number,
        emitter: SmokeEmitter,
        startSmoke: boolean,
    ) {
        const smoke = new Smoke(this.game, pos, layer, interior, emitter, startSmoke);
        this.game.objectRegister.register(smoke);
        this.smokes.push(smoke);
    }
}

export class Smoke extends BaseGameObject {
    override readonly __type = ObjectType.Smoke;
    bounds: AABB;

    layer: number;

    rad = 0;

    lastClientPos = v2.create(0, 0);
    lastClientRad = 0;

    interior: number;

    maxSize = util.random(5.5, 6.5);
    vel: Vec2;
    growTime: number;
    drag: number;
    emitter: SmokeEmitter;

    constructor(
        game: Game,
        pos: Vec2,
        layer: number,
        interior: number,
        emitter: SmokeEmitter,
        startSmoke: boolean,
    ) {
        super(game, pos);
        this.layer = layer;
        this.interior = interior;
        this.emitter = emitter;
        if (startSmoke) {
            this.growTime = 0.1;
            this.vel = v2.randomUnit(util.random(0, 1.5));
            this.drag = 0.3;
        } else {
            this.growTime = 2;
            this.vel = v2.randomUnit(util.random(0.5, 1.5));
            this.drag = 0.1;
        }
        this.bounds = collider.createAabbExtents(
            v2.create(0, 0),
            v2.create(this.rad, this.rad),
        );
    }

    update(dt: number) {
        this.rad += (this.maxSize / this.growTime) * dt;
        this.rad = math.clamp(this.rad, 0, this.maxSize);

        v2.set(this.vel, v2.mul(this.vel, 1 / (1 + dt * this.drag)));
        v2.set(this.pos, v2.add(this.pos, v2.mul(this.vel, dt)));
        this.game.map.clampToMapBounds(this.pos, this.rad);

        if (
            !math.eqAbs(this.lastClientRad, this.rad, 0.05)
            || !v2.eq(this.lastClientPos, this.pos, 0.2)
        ) {
            this.setPartDirty();
            this.game.grid.updateObject(this);

            v2.set(this.lastClientPos, this.pos);
            this.lastClientRad = this.rad;
        }

        if (!this.emitter.active) {
            this.destroy();
        }
    }
}
