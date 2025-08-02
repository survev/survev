import { Constants } from "../../../../shared/net/net";
import { type Vec2, v2 } from "../../../../shared/utils/v2";

export class MapIndicator {
    oldPosition = v2.create(0, 0);
    pos = v2.create(0, 0);
    dead = false;
    dirty = true;

    constructor(
        public id: number,
        public type: string,
        public equipped: boolean,
    ) {}

    updatePosition(newPos: Vec2) {
        this.pos = v2.copy(newPos);
        // only set to dirty if position changed enough from the last one sent to clients
        if (v2.distance(this.pos, this.oldPosition) > 0.1) {
            this.oldPosition = v2.copy(this.pos);
            this.dirty = true;
        }
    }

    kill() {
        this.dead = true;
        this.dirty = true;
    }
}

export class MapIndicatorBarn {
    mapIndicators: MapIndicator[] = [];

    freeIds: number[] = [];

    constructor() {
        for (let i = 0; i < Constants.MaxMapIndicators; i++) {
            this.freeIds.push(i);
        }
    }

    allocIndicator(type: string, equipped: boolean) {
        const id = this.freeIds.shift();
        if (id === undefined) return undefined;

        const indicator = new MapIndicator(id, type, equipped);
        this.mapIndicators.push(indicator);

        return indicator;
    }

    flush() {
        for (let i = 0; i < this.mapIndicators.length; i++) {
            const indicator = this.mapIndicators[i];
            if (indicator.dead) {
                this.mapIndicators.splice(i, 1);
                this.freeIds.push(indicator.id);
                i--;
                continue;
            }
            indicator.dirty = false;
        }
    }
}
