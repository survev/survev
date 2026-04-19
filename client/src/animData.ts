import { GameObjectDefs } from "../../shared/defs/gameObjectDefs";
import type { MeleeDef } from "../../shared/defs/gameObjects/meleeDefs";
import { GameConfig } from "../../shared/gameConfig";
import { math } from "../../shared/utils/math";
import { assert } from "../../shared/utils/util";
import { type Vec2, v2 } from "../../shared/utils/v2";
import type { AnimCtx, Player } from "./objects/player";

function frame(time: number, bones: Partial<Record<Bones, Pose>>) {
    return {
        time,
        bones,
    };
}

type AnimKeys = {
    [K in keyof Player]: ((
        this: Player,
        ctx: AnimCtx,
        arg: Record<string, unknown>,
    ) => void) extends Player[K]
        ? K
        : never;
}[keyof Player];

function effect<K extends AnimKeys>(
    time: number,
    fn: K,
    args?: Parameters<Player[K]>[1],
) {
    return {
        time,
        fn,
        args,
    };
}

export class Pose {
    constructor(
        public pivot = v2.create(0, 0),
        public rot = 0,
        public pos = v2.create(0, 0),
    ) {
        this.pivot = v2.copy(pivot);
        this.rot = 0;
        this.pos = v2.copy(pos);
    }

    copy(pose: Pose) {
        v2.set(this.pivot, pose.pivot);
        this.rot = pose.rot;
        v2.set(this.pos, pose.pos);
    }

    rotate(angle: number) {
        this.rot = angle;
        return this;
    }

    offset(pos: Vec2) {
        this.pos = v2.copy(pos);
        return this;
    }

    static identity = new Pose(v2.create(0, 0));

    static lerp(t: number, poseA: Pose, poseB: Pose) {
        const result: Pose = new Pose();
        result.pos = v2.lerp(t, poseA.pos, poseB.pos);
        result.rot = math.lerp(t, poseA.rot, poseB.rot);
        result.pivot = v2.lerp(t, poseA.pivot, poseB.pivot);
        return result;
    }
}

export enum Bones {
    HandL,
    HandR,
    FootL,
    FootR,
}
assert(Object.keys(Bones).length % 2 == 0);

export const IdlePoses: Record<string, Partial<Record<Bones, Pose>>> = {
    fists: {
        [Bones.HandL]: new Pose(v2.create(14, -12.25)),
        [Bones.HandR]: new Pose(v2.create(14, 12.25)),
    },
    slash: {
        [Bones.HandL]: new Pose(v2.create(18, -8.25)),
        [Bones.HandR]: new Pose(v2.create(6, 20.25)),
    },
    meleeTwoHanded: {
        [Bones.HandL]: new Pose(v2.create(10.5, -14.25)),
        [Bones.HandR]: new Pose(v2.create(18, 6.25)),
    },
    meleeKatana: {
        [Bones.HandL]: new Pose(v2.create(8.5, 13.25)),
        [Bones.HandR]: new Pose(v2.create(-3, 17.75)),
    },
    meleeNaginata: {
        [Bones.HandL]: new Pose(v2.create(19, -7.25)),
        [Bones.HandR]: new Pose(v2.create(8.5, 24.25)),
    },
    machete: {
        [Bones.HandL]: new Pose(v2.create(14, -12.25)),
        [Bones.HandR]: new Pose(v2.create(1, 17.75)),
    },
    rifle: {
        [Bones.HandL]: new Pose(v2.create(28, 5.25)),
        [Bones.HandR]: new Pose(v2.create(14, 1.75)),
    },
    dualRifle: {
        [Bones.HandL]: new Pose(v2.create(5.75, -16)),
        [Bones.HandR]: new Pose(v2.create(5.75, 16)),
    },
    bullpup: {
        [Bones.HandL]: new Pose(v2.create(28, 5.25)),
        [Bones.HandR]: new Pose(v2.create(24, 1.75)),
    },
    launcher: {
        [Bones.HandL]: new Pose(v2.create(20, 10)),
        [Bones.HandR]: new Pose(v2.create(2, 22)),
    },
    pistol: {
        [Bones.HandL]: new Pose(v2.create(14, 1.75)),
        [Bones.HandR]: new Pose(v2.create(14, 1.75)),
    },
    dualPistol: {
        [Bones.HandL]: new Pose(v2.create(15.75, -8.75)),
        [Bones.HandR]: new Pose(v2.create(15.75, 8.75)),
    },
    throwable: {
        [Bones.HandL]: new Pose(v2.create(15.75, -9.625)),
        [Bones.HandR]: new Pose(v2.create(15.75, 9.625)),
    },
    downed: {
        [Bones.HandL]: new Pose(v2.create(14, -12.25)),
        [Bones.HandR]: new Pose(v2.create(14, 12.25)),
        [Bones.FootL]: new Pose(v2.create(-15.75, -9)),
        [Bones.FootR]: new Pose(v2.create(-15.75, 9)),
    },
};

const def = GameObjectDefs as unknown as Record<string, MeleeDef>;

interface Effect<K extends AnimKeys = AnimKeys> {
    time: number;
    fn: K;
    args?: Parameters<Player[K]>[1];
}

export const Animations: Record<
    string,
    {
        keyframes: Array<{
            time: number;
            bones: Partial<Record<Bones, Pose>>;
        }>;
        effects: Effect[];
    }
> = {
    none: {
        keyframes: [],
        effects: [],
    },
    fists: {
        keyframes: [
            frame(0, { [Bones.HandR]: new Pose(v2.create(14, 12.25)) }),
            frame(def.fists.attack.damageTimes[0], {
                [Bones.HandR]: new Pose(v2.create(29.75, 1.75)),
            }),
            frame(def.fists.attack.cooldownTime, {
                [Bones.HandR]: new Pose(v2.create(14, 12.25)),
            }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "swing" }),
            effect(def.fists.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    cut: {
        keyframes: [
            frame(0, { [Bones.HandR]: new Pose(v2.create(14, 12.25)) }),
            frame(def.fists.attack.damageTimes[0] * 0.25, {
                [Bones.HandR]: new Pose(v2.create(14, 12.25)).rotate(-Math.PI * 0.35),
            }),
            frame(def.fists.attack.damageTimes[0] * 1.25, {
                [Bones.HandR]: new Pose(v2.create(14, 12.25)).rotate(Math.PI * 0.35),
            }),
            frame(def.fists.attack.cooldownTime, {
                [Bones.HandR]: new Pose(v2.create(14, 12.25)),
            }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "swing" }),
            effect(def.fists.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    cutReverse: {
        keyframes: [
            frame(0, { [Bones.HandR]: new Pose(v2.create(1, 17.75)) }),
            frame(def.fists.attack.damageTimes[0] * 0.4, {
                [Bones.HandR]: new Pose(v2.create(25, 6.25)).rotate(Math.PI * 0.3),
            }),
            frame(def.fists.attack.damageTimes[0] * 1.4, {
                [Bones.HandR]: new Pose(v2.create(25, 6.25)).rotate(-Math.PI * 0.5),
            }),
            frame(def.fists.attack.cooldownTime, {
                [Bones.HandR]: new Pose(v2.create(1, 17.75)),
            }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "swing" }),
            effect(def.fists.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    thrust: {
        keyframes: [
            frame(0, { [Bones.HandR]: new Pose(v2.create(14, 12.25)) }),
            frame(def.fists.attack.damageTimes[0] * 0.4, {
                [Bones.HandR]: new Pose(v2.create(5, 12.25)).rotate(Math.PI * 0.1),
            }),
            frame(def.fists.attack.damageTimes[0] * 1.4, {
                [Bones.HandR]: new Pose(v2.create(25, 6.25)).rotate(-Math.PI * 0),
            }),
            frame(def.fists.attack.cooldownTime, {
                [Bones.HandR]: new Pose(v2.create(14, 12.25)),
            }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "swing" }),
            effect(def.fists.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    slash: {
        keyframes: [
            frame(0, {
                [Bones.HandL]: new Pose(v2.create(18, -8.25)),
                [Bones.HandR]: new Pose(v2.create(6, 20.25)),
            }),
            frame(def.fists.attack.damageTimes[0], {
                [Bones.HandL]: new Pose(v2.create(6, -22.25)),
                [Bones.HandR]: new Pose(v2.create(6, 20.25)).rotate(-Math.PI * 0.6),
            }),
            frame(def.fists.attack.cooldownTime, {
                [Bones.HandL]: new Pose(v2.create(18, -8.25)),
                [Bones.HandR]: new Pose(v2.create(6, 20.25)).rotate(0),
            }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "swing" }),
            effect(def.fists.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    hook: {
        keyframes: [
            frame(0, { [Bones.HandR]: new Pose(v2.create(14, 12.25)) }),
            frame(def.hook.attack.damageTimes[0] * 0.25, {
                [Bones.HandR]: new Pose(v2.create(14, 12.25)).rotate(Math.PI * 0.1),
            }),
            frame(def.hook.attack.damageTimes[0], {
                [Bones.HandR]: new Pose(v2.create(24, 1.75)),
            }),
            frame(def.hook.attack.damageTimes[0] + 0.05, {
                [Bones.HandR]: new Pose(v2.create(14, 12.25)).rotate(Math.PI * -0.3),
            }),
            frame(def.hook.attack.damageTimes[0] + 0.1, {
                [Bones.HandR]: new Pose(v2.create(14, 12.25)),
            }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "swing" }),
            effect(def.hook.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    pan: {
        keyframes: [
            frame(0, { [Bones.HandR]: new Pose(v2.create(14, 12.25)) }),
            frame(0.15, {
                [Bones.HandR]: new Pose(v2.create(22, -8.25)).rotate(-Math.PI * 0.2),
            }),
            frame(0.25, {
                [Bones.HandR]: new Pose(v2.create(28, -8.25)).rotate(Math.PI * 0.5),
            }),
            frame(0.55, { [Bones.HandR]: new Pose(v2.create(14, 12.25)) }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "swing" }),
            effect(def.pan.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    axeSwing: {
        keyframes: [
            frame(0, {
                [Bones.HandL]: new Pose(v2.create(10.5, -14.25)),
                [Bones.HandR]: new Pose(v2.create(18, 6.25)),
            }),
            frame(def.woodaxe.attack.damageTimes[0] * 0.4, {
                [Bones.HandL]: new Pose(v2.create(9, -14.25)).rotate(Math.PI * 0.4),
                [Bones.HandR]: new Pose(v2.create(18, 6.25)).rotate(Math.PI * 0.4),
            }),
            frame(def.woodaxe.attack.damageTimes[0], {
                [Bones.HandL]: new Pose(v2.create(9, -14.25)).rotate(-Math.PI * 0.4),
                [Bones.HandR]: new Pose(v2.create(18, 6.25)).rotate(-Math.PI * 0.4),
            }),
            frame(def.woodaxe.attack.cooldownTime, {
                [Bones.HandL]: new Pose(v2.create(10.5, -14.25)),
                [Bones.HandR]: new Pose(v2.create(18, 6.25)),
            }),
        ],
        effects: [
            effect(def.woodaxe.attack.damageTimes[0], "animPlaySound", {
                sound: "swing",
            }),
            effect(def.woodaxe.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    hammerSwing: {
        keyframes: [
            frame(0, {
                [Bones.HandL]: new Pose(v2.create(10.5, -14.25)),
                [Bones.HandR]: new Pose(v2.create(18, 6.25)),
            }),
            frame(def.stonehammer.attack.damageTimes[0] * 0.4, {
                [Bones.HandL]: new Pose(v2.create(9, -14.25)).rotate(Math.PI * 0.4),
                [Bones.HandR]: new Pose(v2.create(18, 6.25)).rotate(Math.PI * 0.4),
            }),
            frame(def.stonehammer.attack.damageTimes[0], {
                [Bones.HandL]: new Pose(v2.create(9, -14.25)).rotate(-Math.PI * 0.4),
                [Bones.HandR]: new Pose(v2.create(18, 6.25)).rotate(-Math.PI * 0.4),
            }),
            frame(def.stonehammer.attack.cooldownTime, {
                [Bones.HandL]: new Pose(v2.create(10.5, -14.25)),
                [Bones.HandR]: new Pose(v2.create(18, 6.25)),
            }),
        ],
        effects: [
            effect(def.stonehammer.attack.damageTimes[0], "animPlaySound", {
                sound: "swing",
            }),
            effect(def.stonehammer.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    katanaSwing: {
        keyframes: [
            frame(0, {
                [Bones.HandL]: new Pose(v2.create(8.5, 13.25)),
                [Bones.HandR]: new Pose(v2.create(-3, 17.75)),
            }),
            frame(def.katana.attack.damageTimes[0] * 0.3, {
                [Bones.HandL]: new Pose(v2.create(8.5, 13.25)).rotate(Math.PI * 0.2),
                [Bones.HandR]: new Pose(v2.create(-3, 17.75)).rotate(Math.PI * 0.2),
            }),
            frame(def.katana.attack.damageTimes[0] * 0.9, {
                [Bones.HandL]: new Pose(v2.create(8.5, 13.25)).rotate(-Math.PI * 1.2),
                [Bones.HandR]: new Pose(v2.create(-3, 17.75)).rotate(-Math.PI * 1.2),
            }),
            frame(def.katana.attack.cooldownTime, {
                [Bones.HandL]: new Pose(v2.create(8.5, 13.25)),
                [Bones.HandR]: new Pose(v2.create(-3, 17.75)),
            }),
        ],
        effects: [
            effect(def.katana.attack.damageTimes[0], "animPlaySound", {
                sound: "swing",
            }),
            effect(def.katana.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    naginataSwing: {
        keyframes: [
            frame(0, {
                [Bones.HandL]: new Pose(v2.create(19, -7.25)),
                [Bones.HandR]: new Pose(v2.create(8.5, 24.25)),
            }),
            frame(def.naginata.attack.damageTimes[0] * 0.3, {
                [Bones.HandL]: new Pose(v2.create(19, -7.25)).rotate(Math.PI * 0.3),
                [Bones.HandR]: new Pose(v2.create(8.5, 24.25)).rotate(Math.PI * 0.3),
            }),
            frame(def.naginata.attack.damageTimes[0] * 0.9, {
                [Bones.HandL]: new Pose(v2.create(19, -7.25)).rotate(-Math.PI * 0.85),
                [Bones.HandR]: new Pose(v2.create(8.5, 24.25)).rotate(-Math.PI * 0.85),
            }),
            frame(def.naginata.attack.cooldownTime, {
                [Bones.HandL]: new Pose(v2.create(19, -7.25)),
                [Bones.HandR]: new Pose(v2.create(8.5, 24.25)),
            }),
        ],
        effects: [
            effect(def.naginata.attack.damageTimes[0], "animPlaySound", {
                sound: "swing",
            }),
            effect(def.naginata.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    sawSwing: {
        keyframes: [
            frame(0, { [Bones.HandR]: new Pose(v2.create(1, 17.75)) }),
            frame(def.saw.attack.damageTimes[0] * 0.4, {
                [Bones.HandR]: new Pose(v2.create(25, 6.25)).rotate(Math.PI * 0.3),
            }),
            frame(def.saw.attack.damageTimes[0], {
                [Bones.HandR]: new Pose(v2.create(25, 6.25)).rotate(-Math.PI * 0.3),
            }),
            frame(def.saw.attack.damageTimes[1] - 0.1, {
                [Bones.HandR]: new Pose(v2.create(25, 17.75)).rotate(-Math.PI * 0.25),
            }),
            frame(def.saw.attack.damageTimes[1] * 0.6, {
                [Bones.HandR]: new Pose(v2.create(-36, 7.75)).rotate(-Math.PI * 0.25),
            }),
            frame(def.saw.attack.damageTimes[1] + 0.2, {
                [Bones.HandR]: new Pose(v2.create(1, 17.75)),
            }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "swing" }),
            effect(0.4, "animPlaySound", { sound: "swing" }),
            effect(def.saw.attack.damageTimes[0], "animMeleeCollision", {}),
            effect(def.saw.attack.damageTimes[1], "animMeleeCollision", {
                playerHit: "playerHit2",
            }),
        ],
    },
    cutReverseShort: {
        keyframes: [
            frame(0, { [Bones.HandR]: new Pose(v2.create(1, 17.75)) }),
            frame(def.saw.attack.damageTimes[0] * 0.4, {
                [Bones.HandR]: new Pose(v2.create(25, 6.25)).rotate(Math.PI * 0.3),
            }),
            frame(def.saw.attack.damageTimes[0], {
                [Bones.HandR]: new Pose(v2.create(25, 6.25)).rotate(-Math.PI * 0.3),
            }),
            frame(def.fists.attack.cooldownTime, {
                [Bones.HandR]: new Pose(v2.create(14, 17.75)),
            }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "swing" }),
            effect(def.fists.attack.damageTimes[0], "animMeleeCollision", {}),
        ],
    },
    cook: {
        keyframes: [
            frame(0, {
                [Bones.HandL]: new Pose(v2.create(15.75, -9.625)),
                [Bones.HandR]: new Pose(v2.create(15.75, 9.625)),
            }),
            frame(0.1, {
                [Bones.HandL]: new Pose(v2.create(14, -1.75)),
                [Bones.HandR]: new Pose(v2.create(14, 1.75)),
            }),
            frame(0.3, {
                [Bones.HandL]: new Pose(v2.create(14, -1.75)),
                [Bones.HandR]: new Pose(v2.create(14, 1.75)),
            }),
            frame(0.4, {
                [Bones.HandL]: new Pose(v2.create(22.75, -1.75)),
                [Bones.HandR]: new Pose(v2.create(1.75, 14)),
            }),
            frame(99999, {
                [Bones.HandL]: new Pose(v2.create(22.75, -1.75)),
                [Bones.HandR]: new Pose(v2.create(1.75, 14)),
            }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "pullPin" }),
            effect(0.1, "animSetThrowableState", { state: "cook" }),
        ],
    },
    throw: {
        keyframes: [
            frame(0, {
                [Bones.HandL]: new Pose(v2.create(22.75, -1.75)),
                [Bones.HandR]: new Pose(v2.create(1.75, 14.175)),
            }),
            frame(0.15, {
                [Bones.HandL]: new Pose(v2.create(5.25, -15.75)),
                [Bones.HandR]: new Pose(v2.create(29.75, 1.75)),
            }),
            frame(0.15 + GameConfig.player.throwTime, {
                [Bones.HandL]: new Pose(v2.create(15.75, -9.625)),
                [Bones.HandR]: new Pose(v2.create(15.75, 9.625)),
            }),
        ],
        effects: [
            effect(0, "animPlaySound", { sound: "throwing" }),
            effect(0, "animSetThrowableState", { state: "throwing" }),
            effect(0, "animThrowableParticles", {}),
        ],
    },
    crawl_forward: {
        keyframes: [
            frame(0, {
                [Bones.HandL]: new Pose(v2.create(14, -12.25)),
                [Bones.FootL]: new Pose(v2.create(-15.75, -9)),
            }),
            frame(GameConfig.player.crawlTime * 0.33, {
                [Bones.HandL]: new Pose(v2.create(19.25, -10.5)),
                [Bones.FootL]: new Pose(v2.create(-20.25, -9)),
            }),
            frame(GameConfig.player.crawlTime * 0.66, {
                [Bones.HandL]: new Pose(v2.create(5.25, -15.75)),
                [Bones.FootL]: new Pose(v2.create(-11.25, -9)),
            }),
            frame(GameConfig.player.crawlTime * 1, {
                [Bones.HandL]: new Pose(v2.create(14, -12.25)),
                [Bones.FootL]: new Pose(v2.create(-15.75, -9)),
            }),
        ],
        effects: [],
    },
    crawl_backward: {
        keyframes: [
            frame(0, {
                [Bones.HandL]: new Pose(v2.create(14, -12.25)),
                [Bones.FootL]: new Pose(v2.create(-15.75, -9)),
            }),
            frame(GameConfig.player.crawlTime * 0.33, {
                [Bones.HandL]: new Pose(v2.create(5.25, -15.75)),
                [Bones.FootL]: new Pose(v2.create(-11.25, -9)),
            }),
            frame(GameConfig.player.crawlTime * 0.66, {
                [Bones.HandL]: new Pose(v2.create(19.25, -10.5)),
                [Bones.FootL]: new Pose(v2.create(-20.25, -9)),
            }),
            frame(GameConfig.player.crawlTime * 1, {
                [Bones.HandL]: new Pose(v2.create(14, -12.25)),
                [Bones.FootL]: new Pose(v2.create(-15.75, -9)),
            }),
        ],
        effects: [],
    },
    revive: {
        keyframes: [
            frame(0, {
                [Bones.HandL]: new Pose(v2.create(14, -12.25)),
                [Bones.HandR]: new Pose(v2.create(14, 12.25)),
            }),
            frame(0.2, {
                [Bones.HandL]: new Pose(v2.create(24.5, -8.75)),
                [Bones.HandR]: new Pose(v2.create(5.25, 21)),
            }),
            frame(0.2 + GameConfig.player.reviveDuration, {
                [Bones.HandL]: new Pose(v2.create(24.5, -8.75)),
                [Bones.HandR]: new Pose(v2.create(5.25, 21)),
            }),
        ],
        effects: [],
    },
};
