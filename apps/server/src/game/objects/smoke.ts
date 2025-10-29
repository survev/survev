import { ObjectType } from "@survev/lib/net/objectSerializeFns";
import { type AABB, coldet } from "@survev/shared/utils/coldet";
import { collider } from "@survev/shared/utils/collider";
import { math } from "@survev/shared/utils/math";
import { util } from "@survev/shared/utils/util";
import { type Vec2, v2 } from "@survev/shared/utils/v2";
import type { Game } from "../game";
import { BaseGameObject } from "./gameObject";

// max smokes an emitter can spawn
const MAX_SMOKES = 10;
// delay between smokes the emitter spawns
const SPAWN_DELAY = 0.1;
const LIFE_TIME = 15;
// min and max radius a smoke can reach
const RAD_MIN = 5;
const RAD_MAX = 6.5;
// speed which the radius increases (in radius/second)
const RAD_SPEED = 10;
// speed drag
const SPEED_DRAG = 2;
// min speed it can have
const SPEED_MIN = 0.1;
// min / max spawn speed
const SPAWN_MIN_SPEED = 3;
const SPAWN_MAX_SPEED = 5;

class SmokeEmitter {
    active = true;

    smokesSpawned = 0;
    spawnTicker = 0;

    constructor(
        public smokeBarn: SmokeBarn,
        public pos: Vec2,
        public layer: number,
        public interior: number,
    ) {}

    update(dt: number) {
        this.spawnTicker += dt;
        if (this.spawnTicker > SPAWN_DELAY) {
            this.smokeBarn.addSmoke(this.pos, this.layer, this.interior);
            this.smokesSpawned++;
            this.spawnTicker = 0;
        }
        if (this.smokesSpawned > MAX_SMOKES) {
            this.active = false;
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

        this.emitters.push(emitter);
    }

    addSmoke(pos: Vec2, layer: number, interior: number) {
        const smoke = new Smoke(this.game, pos, layer, interior);
        this.game.objectRegister.register(smoke);
        this.smokes.push(smoke);
    }
}

export class Smoke extends BaseGameObject {
    override readonly __type = ObjectType.Smoke;
    bounds: AABB;

    layer: number;

    life = LIFE_TIME;
    rad = util.random(0.5, 1);
    interior: number;

    maxSize = util.random(RAD_MIN, RAD_MAX);
    dir = v2.randomUnit();
    speed = util.random(SPAWN_MIN_SPEED, SPAWN_MAX_SPEED);

    constructor(game: Game, pos: Vec2, layer: number, interior: number) {
        super(game, pos);
        this.layer = layer;
        this.interior = interior;
        this.bounds = collider.createAabbExtents(
            v2.create(0, 0),
            v2.create(this.rad, this.rad),
        );
    }

    update(dt: number) {
        this.life -= dt;

        const radOld = this.rad;
        this.rad += RAD_SPEED * dt;
        this.rad = math.clamp(this.rad, 0, this.maxSize);

        this.speed -= SPEED_DRAG * dt;
        this.speed = math.max(this.speed, SPEED_MIN);
        const posOld = v2.copy(this.pos);
        v2.set(this.pos, v2.add(this.pos, v2.mul(this.dir, this.speed * dt)));

        if (!v2.eq(posOld, this.pos) || !math.eqAbs(radOld, this.rad)) {
            this.setPartDirty();
            this.game.grid.updateObject(this);
            this.game.map.clampToMapBounds(this.pos, this.rad);
        }

        if (this.life <= 0) {
            this.destroy();
        }
    }
}
