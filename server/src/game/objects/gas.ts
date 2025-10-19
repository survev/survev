import { GameConfig, GasMode } from "../../../../shared/gameConfig";
import { math } from "../../../../shared/utils/math";
import { util } from "../../../../shared/utils/util";
import { type Vec2, v2 } from "../../../../shared/utils/v2";
import type { Game } from "../game";

interface StageData {
    mode: GasMode;
    duration: number;
    rad: number;
    damage: number;
}

const GasStages: StageData[] = [
    {
        mode: GasMode.Inactive,
        duration: 0,
        rad: 0.7425,
        damage: 0,
    },
    {
        mode: GasMode.Waiting,
        duration: 80,
        rad: 0.45,
        damage: 1.4,
    },
    {
        mode: GasMode.Moving,
        duration: 30,
        rad: 0.45,
        damage: 1.4,
    },
    {
        mode: GasMode.Waiting,
        duration: 65,
        rad: 0.3125,
        damage: 2.2,
    },
    {
        mode: GasMode.Moving,
        duration: 25,
        rad: 0.3125,
        damage: 2.2,
    },
    {
        mode: GasMode.Waiting,
        duration: 50,
        rad: 0.2125,
        damage: 3.5,
    },
    {
        mode: GasMode.Moving,
        duration: 20,
        rad: 0.2125,
        damage: 3.5,
    },
    {
        mode: GasMode.Waiting,
        duration: 40,
        rad: 0.1375,
        damage: 7.5,
    },
    {
        mode: GasMode.Moving,
        duration: 15,
        rad: 0.1375,
        damage: 7.5,
    },
    {
        mode: GasMode.Waiting,
        duration: 30,
        rad: 0.075,
        damage: 10,
    },
    {
        mode: GasMode.Moving,
        duration: 10,
        rad: 0.075,
        damage: 10,
    },
    {
        mode: GasMode.Waiting,
        duration: 25,
        rad: 0.045,
        damage: 14,
    },
    {
        mode: GasMode.Moving,
        duration: 5,
        rad: 0.045,
        damage: 14,
    },
    {
        mode: GasMode.Waiting,
        duration: 20,
        rad: 0.0225,
        damage: 22,
    },
    {
        mode: GasMode.Moving,
        duration: 6,
        rad: 0.0225,
        damage: 22,
    },
    {
        mode: GasMode.Waiting,
        duration: 15,
        rad: 0,
        damage: 22,
    },
    {
        mode: GasMode.Moving,
        duration: 15,
        rad: 0,
        damage: 22,
    },
];

export class Gas {
    /**
     * Current gas mode
     * Inactive: The gas is not active, used when only a single player is on the lobby
     * Waiting: The Gas has started and is waiting to advance to the next stage
     * Moving: The gas is moving between one stage and another
     */
    mode = GasMode.Inactive;

    /**
     * Current gas stage used to track the gas damage from `GameConfig.gas.damage`
     * Is incremented when gas mode changes
     */
    stage = 0;

    /**
     * Like stage but is incremented after gas goes through Waiting and Moving mode's
     */
    circleIdx = -1;

    /**
     * Current gas stage damage
     */
    damage: number;

    /**
     * Current gas duration
     * returns 0 if gas if inactive
     */
    duration: number;

    /**
     * Old gas radius
     * When gas mode is waiting this will be the same as `currentRad`
     * When gas mode is moving this will be the radius from the previous state
     * And will be used for lerping `currentRad`
     */
    radOld: number;
    /**
     * New gas radius
     * When gas mode is waiting this will be the radius for the new stage
     * When gas mode is moving this will be the radius at the end of the stage
     */
    radNew: number;
    /**
     * Current gas radius
     * When gas mode is waiting this and `radOld` will be the same
     * When gas mode is moving this will be a lerp between `radOld` and `radNew` using `gasT` as the interpolation factor
     */
    currentRad: number;

    /**
     * Old gas position
     * When gas mode is waiting this will be the same as `currentPos`
     * When gas mode is moving this will be the position from the previous state
     * And will be used for lerping `currentPos`
     */
    posOld: Vec2;
    /**
     * New gas position
     * When gas mode is waiting this will be the position for the new stage
     * When gas mode is moving this will be the position at the end of the stage
     */
    posNew: Vec2;
    /**
     * Current gas position
     * When gas mode is waiting this and `posOld` will be the same
     * When gas mode is moving this will be a lerp between `posOld` and `posNew` using `gasT` as the interpolation factor
     */
    currentPos: Vec2;

    /**
     * Gas Timer
     * in a range between 0 and 1
     */
    gasT = 0;

    /**
     * Current duration ticker
     */
    private _gasTicker = 0;

    /**
     * If the gas full state needs to be sent to clients
     */
    dirty = true;
    /**
     * If the gas time needs to be sent to clients
     */
    timeDirty = true;

    private _damageTicker = 0;
    private _running = false;

    doDamage = false;

    mapSize: number;

    constructor(readonly game: Game) {
        const map = game.map;
        this.mapSize = (map.width + map.height) / 2;
        this.posOld = v2.create(map.width / 2, map.height / 2);
        this.posNew = v2.copy(this.posOld);
        this.currentPos = v2.copy(this.posOld);

        const stage = this._getStageData();
        this.radOld = 0.85 * this.mapSize;
        this.radNew = this.currentRad = stage.rad * this.mapSize;
        this.duration = stage.duration;
        this.damage = stage.damage;
    }

    update(dt: number) {
        this._gasTicker += dt;

        if (this._running) {
            this.gasT = math.clamp(this._gasTicker / this.duration, 0, 1);
            this.timeDirty = true;

            if (this.mode === GasMode.Moving) {
                this.currentPos = v2.lerp(this.gasT, this.posOld, this.posNew);
                this.currentRad = math.lerp(this.gasT, this.radOld, this.radNew);
            }

            if (this.gasT >= 1) {
                this.advanceGasStage();
            }
        }

        this.doDamage = false;
        this._damageTicker += dt;

        if (this._damageTicker >= GameConfig.gas.damageTickRate) {
            this._damageTicker = 0;
            this.doDamage = true;
        }
    }

    advanceGasStage() {
        this.stage++;
        this._running = true;

        const stage = this._getStageData();

        if (!stage) {
            this._running = false;
            return;
        }

        this.mode = stage.mode;
        this.radOld = this.currentRad;
        this.radNew = stage.rad * this.mapSize;
        this.duration = stage.duration;
        this.damage = stage.damage;

        const circleIdxOld = this.circleIdx;

        if (this.mode === GasMode.Waiting) {
            this.posOld = v2.copy(this.posNew);

            this.posNew = v2.add(
                this.posNew,
                util.randomPointInCircle(this.radOld - this.radNew),
            );

            const rad = this.radNew * 0.75; // ensure at least 75% of the safe zone will be inside map bounds
            this.posNew = math.v2Clamp(
                this.posNew,
                v2.create(rad, rad),
                v2.create(this.game.map.width - rad, this.game.map.height - rad),
            );

            this.currentPos = this.posOld;
            this.currentRad = this.radOld;
            this.circleIdx++;
        }

        if (this.circleIdx !== circleIdxOld) {
            if (this.game.map.mapDef.gameConfig.roles) {
                this.game.playerBarn.scheduleRoleAssignments();
            }

            if (this.game.map.mapDef.gameConfig.unlocks) {
                this.game.map.scheduleUnlocks();
            }

            for (const plane of this.game.map.mapDef.gameConfig.planes.timings) {
                if (plane.circleIdx === this.circleIdx) {
                    this.game.planeBarn.schedulePlane(plane.wait, plane.options);
                }
            }
        }

        this._gasTicker = 0;
        this.gasT = 0;
        this.dirty = true;
        this.timeDirty = true;

        this.game.updateData();
    }

    private _getStageData() {
        return GasStages[this.stage];
    }

    isInGas(pos: Vec2) {
        return v2.distance(pos, this.currentPos) >= this.currentRad;
    }

    isOutSideSafeZone(pos: Vec2) {
        return v2.distance(pos, this.posNew) >= this.radNew;
    }

    flush() {
        this.dirty = false;
        this.timeDirty = false;
    }
}
