import { expect, test } from "vitest";
import { GameConfig, TeamMode } from "../../shared/gameConfig";
import { InputMsg } from "../../shared/net/inputMsg";
import { v2 } from "../../shared/utils/v2";
import { createGame } from "./gameTestHelpers";

// + 0.1 to account for off by one tick on the timer system lol
const reviveDur = GameConfig.player.reviveDuration + 0.1;

test("Solo self revive", async () => {
    const game = await createGame(TeamMode.Solo, "test_normal");

    const player = game.playerBarn.addTestPlayer({});
    player.addPerk("self_revive");

    player.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(player.downed).toBeTruthy();

    const msg = new InputMsg();
    msg.addInput(GameConfig.Input.Interact);
    player.handleInput(msg);

    game.step(reviveDur);

    expect(player.downed).toBeFalsy();
    expect(player.dead).toBeFalsy();
});

//
// Normal mode squad tests
//

test("Normal 2 players successful revive", async () => {
    const game = await createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);
    const playerA = game.playerBarn.addTestPlayer({ group });
    const playerB = game.playerBarn.addTestPlayer({ group });

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerB.downed).toBeTruthy();

    const msg = new InputMsg();
    msg.addInput(GameConfig.Input.Interact);
    playerA.handleInput(msg);
    expect(playerA.playerBeingRevived).toBe(playerB);

    game.step(reviveDur);

    expect(playerB.downed).toBeFalsy();
    expect(playerB.dead).toBeFalsy();
});

test("Normal player bleed out", async () => {
    const game = await createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);
    game.playerBarn.addTestPlayer({ group });
    const playerB = game.playerBarn.addTestPlayer({ group });

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerB.downed).toBeTruthy();

    // surely takes a while for players to bleed out
    game.step(60);

    expect(playerB.downed).toBeFalsy();
    expect(playerB.dead).toBeTruthy();
});

test("Normal all teammates should die", async () => {
    const game = await createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);
    const playerA = game.playerBarn.addTestPlayer({ group });
    const playerB = game.playerBarn.addTestPlayer({ group });
    const playerC = game.playerBarn.addTestPlayer({ group });

    playerA.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerA.downed).toBeTruthy();

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerB.downed).toBeTruthy();

    playerC.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });

    expect(playerB.dead).toBeTruthy();
    expect(playerA.dead).toBeTruthy();
    expect(playerC.dead).toBeTruthy();
});

test("Normal medic reviving multiple players", async () => {
    const game = await createGame(TeamMode.Squad, "test_normal");

    const group = game.playerBarn.addGroup(false);
    const medic = game.playerBarn.addTestPlayer({ group });
    medic.promoteToRole("medic");

    const playerB = game.playerBarn.addTestPlayer({ group });
    const playerC = game.playerBarn.addTestPlayer({ group });

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerB.downed).toBeTruthy();

    playerC.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerC.downed).toBeTruthy();

    const msg = new InputMsg();
    msg.addInput(GameConfig.Input.Interact);
    medic.handleInput(msg);
    expect(medic.playerBeingRevived).toBe(playerB);

    game.step(reviveDur);

    expect(playerB.downed).toBeFalsy();
    expect(playerB.dead).toBeFalsy();

    expect(playerC.downed).toBeFalsy();
    expect(playerC.dead).toBeFalsy();
});

//
// Faction mode tests
//

test("Faction 2 players successful revive", async () => {
    const game = await createGame(TeamMode.Squad, "test_faction");

    const team = game.playerBarn.addTeam(1);
    const playerA = game.playerBarn.addTestPlayer({ team });
    const playerB = game.playerBarn.addTestPlayer({ team });

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerB.downed).toBeTruthy();

    const msg = new InputMsg();
    msg.addInput(GameConfig.Input.Interact);
    playerA.handleInput(msg);
    expect(playerA.playerBeingRevived).toBe(playerB);

    game.step(reviveDur);

    expect(playerB.downed).toBeFalsy();
    expect(playerB.dead).toBeFalsy();
});

test("Faction player bleed out", async () => {
    const game = await createGame(TeamMode.Squad, "test_faction");

    const team = game.playerBarn.addTeam(1);
    game.playerBarn.addTestPlayer({ team });
    const playerB = game.playerBarn.addTestPlayer({ team });

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerB.downed).toBeTruthy();

    game.step(60);

    expect(playerB.downed).toBeFalsy();
    expect(playerB.dead).toBeTruthy();
});

test("Faction all teammates should die", async () => {
    const game = await createGame(TeamMode.Squad, "test_faction");

    const team = game.playerBarn.addTeam(1);
    const playerA = game.playerBarn.addTestPlayer({ team });
    const playerB = game.playerBarn.addTestPlayer({ team });
    const playerC = game.playerBarn.addTestPlayer({ team });

    playerA.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerA.downed).toBeTruthy();

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerB.downed).toBeTruthy();

    playerC.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });

    expect(playerB.dead).toBeTruthy();
    expect(playerA.dead).toBeTruthy();
    expect(playerC.dead).toBeTruthy();
});

test("Faction self revive tests", async () => {
    const game = await createGame(TeamMode.Squad, "test_faction");

    const team = game.playerBarn.addTeam(1);
    const playerA = game.playerBarn.addTestPlayer({ team });
    const playerB = game.playerBarn.addTestPlayer({ team });
    const playerC = game.playerBarn.addTestPlayer({ team });

    playerA.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerA.downed).toBeTruthy();

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerB.downed).toBeTruthy();

    // teammates must not die if one player has self revive
    playerC.promoteToRole("medic");
    playerC.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });

    expect(playerB.downed).toBeTruthy();
    expect(playerA.downed).toBeTruthy();
    expect(playerC.downed).toBeTruthy();
    expect(playerB.dead).toBeFalsy();
    expect(playerA.dead).toBeFalsy();
    expect(playerC.dead).toBeFalsy();

    // step a tiny bit because of the downed damage ticker
    game.step(0.1);

    // but if that player does die then they should all die
    playerC.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerB.dead).toBeTruthy();
    expect(playerA.dead).toBeTruthy();
    expect(playerC.dead).toBeTruthy();
});

test("Faction medic reviving multiple players", async () => {
    const game = await createGame(TeamMode.Squad, "test_faction");

    const team = game.playerBarn.addTeam(1);
    const medic = game.playerBarn.addTestPlayer({ team });
    medic.promoteToRole("medic");

    const playerB = game.playerBarn.addTestPlayer({ team });
    const playerC = game.playerBarn.addTestPlayer({ team });

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerB.downed).toBeTruthy();

    playerC.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerC.downed).toBeTruthy();

    const msg = new InputMsg();
    msg.addInput(GameConfig.Input.Interact);
    medic.handleInput(msg);
    expect(medic.playerBeingRevived).toBe(playerB);

    game.step(reviveDur);

    expect(playerB.downed).toBeFalsy();
    expect(playerB.dead).toBeFalsy();

    expect(playerC.downed).toBeFalsy();
    expect(playerC.dead).toBeFalsy();
});
