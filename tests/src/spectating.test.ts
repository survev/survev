import { expect, test } from "vitest";
import { GameConfig, TeamMode } from "../../shared/gameConfig.ts";
import { MsgType, SpectateMsg } from "../../shared/net/net.ts";
import { SpectateAction } from "../../shared/net/spectateMsg.ts";
import { v2 } from "../../shared/utils/v2.ts";
import { createGame } from "./gameTestHelpers.ts";
import "./testHelpers.ts";

const specBegin = new SpectateMsg();
specBegin.action = SpectateAction.Begin;

const specNext = new SpectateMsg();
specNext.action = SpectateAction.Next;

const specPrev = new SpectateMsg();
specPrev.action = SpectateAction.Prev;

const spectateDeathCooldown = 2;
const spectateTeammateCooldown = 0.1;
const spectateSoloCooldown = 1;

test("Spectate killer", () => {
    const game = createGame(TeamMode.Solo, "test_normal");
    game.preventStart = true;

    const playerA = game.playerBarn.addTestPlayer({});
    const playerB = game.playerBarn.addTestPlayer({});
    const playerC = game.playerBarn.addTestPlayer({});
    const playerD = game.playerBarn.addTestPlayer({});

    playerA.damage({
        damageType: GameConfig.DamageType.Player,
        source: playerB,
        amount: 999,
        dir: v2.randomUnit(),
    });
    playerA.client.handleMsg(MsgType.Spectate, specBegin);
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    playerB.damage({
        damageType: GameConfig.DamageType.Player,
        source: playerC,
        amount: 999,
        dir: v2.randomUnit(),
    });
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    game.step(spectateDeathCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerC);

    playerC.damage({
        damageType: GameConfig.DamageType.Player,
        source: playerC,
        amount: 999,
        dir: v2.randomUnit(),
    });

    game.step(spectateDeathCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerD);
});

test("Spectate solo", () => {
    const game = createGame(TeamMode.Solo, "test_normal");
    game.preventStart = true;

    const playerA = game.playerBarn.addTestPlayer({});
    const playerB = game.playerBarn.addTestPlayer({});
    const playerC = game.playerBarn.addTestPlayer({});
    const playerD = game.playerBarn.addTestPlayer({});

    playerA.damage({
        damageType: GameConfig.DamageType.Player,
        source: playerB,
        amount: 999,
        dir: v2.randomUnit(),
    });
    playerA.client.handleMsg(MsgType.Spectate, specBegin);
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    playerA.client.handleMsg(MsgType.Spectate, specNext);
    game.step(spectateSoloCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerC);

    playerA.client.handleMsg(MsgType.Spectate, specNext);
    game.step(spectateSoloCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerD);

    playerA.client.handleMsg(MsgType.Spectate, specNext);
    game.step(spectateSoloCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    playerA.client.handleMsg(MsgType.Spectate, specPrev);
    game.step(spectateSoloCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerD);

    // test the cooldown
    playerA.client.handleMsg(MsgType.Spectate, specNext);
    game.step(0.4);
    expect(playerA.client.spectating).toBeSamePlayer(playerD);
    game.step(1);
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    // test manually switching while killer is dead
    playerB.damage({
        damageType: GameConfig.DamageType.Player,
        source: playerC,
        amount: 999,
        dir: v2.randomUnit(),
    });
    game.step(0.1);
    // we stay spectating playerB until the 2 seconds timer is over or manually switching
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    playerA.client.handleMsg(MsgType.Spectate, specNext);
    game.step(0.4);
    expect(playerA.client.spectating).toBeSamePlayer(playerC);

    playerA.client.handleMsg(MsgType.Spectate, specPrev);
    game.step(spectateSoloCooldown);
    // we shouldn't be able to go back to the playerB since they are dead
    expect(playerA.client.spectating).toBeSamePlayer(playerD);
});

test("Spectate teammates", () => {
    const game = createGame(TeamMode.Squad, "test_normal");
    game.preventStart = true;

    const group = game.playerBarn.addGroup(false);

    const playerA = game.playerBarn.addTestPlayer({ group });
    const playerB = game.playerBarn.addTestPlayer({ group });
    const playerC = game.playerBarn.addTestPlayer({ group });
    const playerD = game.playerBarn.addTestPlayer({ group });

    const playerE = game.playerBarn.addTestPlayer({});

    playerA.kill({
        damageType: GameConfig.DamageType.Player,
        source: playerE,
        amount: 999,
        dir: v2.randomUnit(),
    });

    // test wrap around
    playerA.client.handleMsg(MsgType.Spectate, specBegin);
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    playerA.client.handleMsg(MsgType.Spectate, specNext);
    game.step(spectateTeammateCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerC);

    playerA.client.handleMsg(MsgType.Spectate, specPrev);
    game.step(spectateTeammateCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    playerA.client.handleMsg(MsgType.Spectate, specPrev);
    game.step(spectateTeammateCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerD);

    for (const player of [playerB, playerC, playerD]) {
        // "are their heads all going to explode"
        // - Noelle seeing me write this

        player.kill({
            damageType: GameConfig.DamageType.Player,
            source: playerE,
            amount: 999,
            dir: v2.randomUnit(),
        });
    }
    // now that all teammates are dead we should be able to spectate non teammates :)
    game.step(spectateDeathCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerE);
});

test("Spectate faction teammtes", () => {
    const game = createGame(TeamMode.Squad, "test_faction");
    game.preventStart = true;

    const teamA = game.playerBarn.addTeam(1);
    const group = game.playerBarn.addGroup(false);

    const playerA = game.playerBarn.addTestPlayer({ team: teamA, group });
    const playerB = game.playerBarn.addTestPlayer({ team: teamA, group });
    const playerC = game.playerBarn.addTestPlayer({ team: teamA, group });
    const playerD = game.playerBarn.addTestPlayer({ team: teamA, group });
    const playerE = game.playerBarn.addTestPlayer({ team: teamA, group });
    const playerF = game.playerBarn.addTestPlayer({ team: teamA, group });

    const teamB = game.playerBarn.addTeam(2);
    game.playerBarn.addTestPlayer({ team: teamB });

    playerA.kill({
        damageType: GameConfig.DamageType.Player,
        source: playerE,
        amount: 999,
        dir: v2.randomUnit(),
    });

    playerA.client.handleMsg(MsgType.Spectate, specBegin);
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    playerA.client.handleMsg(MsgType.Spectate, specNext);
    game.step(spectateTeammateCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerC);

    playerA.client.handleMsg(MsgType.Spectate, specPrev);
    game.step(spectateTeammateCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    playerA.client.handleMsg(MsgType.Spectate, specPrev);
    game.step(spectateTeammateCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerF);

    playerA.client.handleMsg(MsgType.Spectate, specNext);
    game.step(spectateTeammateCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerB);

    for (const player of [playerB, playerC, playerD]) {
        player.kill({
            damageType: GameConfig.DamageType.Player,
            source: playerE,
            amount: 999,
            dir: v2.randomUnit(),
        });
    }

    // now that all group teammates are dead we should spectate another faction team member
    game.step(spectateDeathCooldown);
    expect(playerA.client.spectating).toBeSamePlayer(playerE);
});
