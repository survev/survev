import { expect, test } from "vitest";
import { GameConfig, TeamMode } from "../../shared/gameConfig.ts";
import { v2 } from "../../shared/utils/v2.ts";
import { createGame } from "./gameTestHelpers.ts";

test("Killed by enemy", () => {
    const game = createGame(TeamMode.Solo, "test_normal");

    const playerA = game.playerBarn.addTestPlayer({});
    const playerB = game.playerBarn.addTestPlayer({});

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.dead).toBeTruthy();

    expect(playerA.kills).toBe(1);
});

test("Downed by enemy, killed by enemy", () => {
    const game = createGame(TeamMode.Squad, "test_normal");
    const group = game.playerBarn.addGroup(false);
    // playerC exists so that the player doesn't instantly die due to lacking teammates
    const playerA = game.playerBarn.addTestPlayer({});
    const playerB = game.playerBarn.addTestPlayer({ group });
    const _playerC = game.playerBarn.addTestPlayer({ group });

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.downed).toBeTruthy();

    game.step(0.1);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.dead).toBeTruthy();
    expect(playerA.kills).toBe(1);
});

test("Downed by enemy, killed by bleeding", () => {
    const game = createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);
    // playerC exists so that the player doesn't instantly die due to lacking teammates
    const playerA = game.playerBarn.addTestPlayer({});
    const playerB = game.playerBarn.addTestPlayer({ group });
    const _playerC = game.playerBarn.addTestPlayer({ group });

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.downed).toBeTruthy();

    game.step(0.1);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Bleeding,
        dir: v2.randomUnit(),
    });

    expect(playerB.dead).toBeTruthy();
    expect(playerA.kills).toBe(1);
});

test("Downed by enemy, killed by gas", () => {
    const game = createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);
    // playerC exists so that the player doesn't instantly die due to lacking teammates
    const playerA = game.playerBarn.addTestPlayer({});
    const playerB = game.playerBarn.addTestPlayer({ group });
    const _playerC = game.playerBarn.addTestPlayer({ group });

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.downed).toBeTruthy();

    game.step(0.1);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Gas,
        dir: v2.randomUnit(),
    });

    expect(playerB.dead).toBeTruthy();
    expect(playerA.kills).toBe(1);
});

test("Downed by enemy, killed by teammate", () => {
    const game = createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);

    const playerA = game.playerBarn.addTestPlayer({});
    const playerB = game.playerBarn.addTestPlayer({ group });
    const playerC = game.playerBarn.addTestPlayer({ group });

    playerB.client.disconnected = true;

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.downed).toBeTruthy();

    game.step(0.1);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerC,
    });

    expect(playerB.dead).toBeTruthy();
    expect(playerA.kills).toBe(1);
    expect(playerC.kills).toBe(0);
});

test("Downed by teammate, killed by teammate", () => {
    const game = createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);

    const playerA = game.playerBarn.addTestPlayer({ group });
    const playerB = game.playerBarn.addTestPlayer({ group });

    playerB.client.disconnected = true;

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.downed).toBeTruthy();

    game.step(0.1);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.dead).toBeTruthy();
    expect(playerA.kills).toBe(0);
});

test("Downed by teammate, killed by enemy", () => {
    const game = createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);

    const playerA = game.playerBarn.addTestPlayer({});
    const playerB = game.playerBarn.addTestPlayer({ group });
    const playerC = game.playerBarn.addTestPlayer({ group });

    playerB.client.disconnected = true;

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerC,
    });

    expect(playerB.downed).toBeTruthy();

    game.step(0.1);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.dead).toBeTruthy();
    expect(playerA.kills).toBe(1);
    expect(playerC.kills).toBe(0);
});

test("Downed by teammate, killed by bleeding", () => {
    const game = createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);

    const playerA = game.playerBarn.addTestPlayer({ group });
    const playerB = game.playerBarn.addTestPlayer({ group });

    playerB.client.disconnected = true;

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.downed).toBeTruthy();

    game.step(0.1);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Bleeding,
        dir: v2.randomUnit(),
    });

    expect(playerB.dead).toBeTruthy();
    expect(playerA.kills).toBe(0);
});

test("Downed by teammate, killed by gas", () => {
    const game = createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);

    const playerA = game.playerBarn.addTestPlayer({ group });
    const playerB = game.playerBarn.addTestPlayer({ group });

    playerB.client.disconnected = true;

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.downed).toBeTruthy();

    game.step(0.1);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Gas,
        dir: v2.randomUnit(),
    });

    expect(playerB.dead).toBeTruthy();
    expect(playerA.kills).toBe(0);
});

test("Teammates can't damage non-disconnected teammates", () => {
    const game = createGame(TeamMode.Squad, "test_normal");
    const group = game.playerBarn.addGroup(false);

    const playerA = game.playerBarn.addTestPlayer({ group });
    const playerB = game.playerBarn.addTestPlayer({ group });

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.downed).toBeFalsy();

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Gas,
        dir: v2.randomUnit(),
    });

    expect(playerB.downed).toBeTruthy();

    game.step(0.1);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
    });

    expect(playerB.dead).toBeFalsy();
});
