import { expect, test } from "vitest";
import { GameConfig, TeamMode } from "../../shared/gameConfig.ts";
import { v2 } from "../../shared/utils/v2.ts";
import { createGame } from "./gameTestHelpers.ts";

test("Kill enemies inside building test", () => {
    const game = createGame(TeamMode.Solo, "test_normal");
    game.map.genBuilding("club_complex_01", game.map.center, 0, 0);

    const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
    playerA.questManager.quests = [
        {
            id: "quest_club_kills",
            delta: 0,
            totalDelta: 0,
        },
    ];
    const playerB = game.playerBarn.addTestPlayer({});
    game.step(0.1);

    // main building
    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
        gameSourceType: "fists",
    });
    game.step(0.1);
    expect(playerA.questManager.quests[0].totalDelta).toBe(1);

    // side rooms
    const bathHouseRock = game.map.obstacles.find((b) => b.type === "bathhouse_rocks_01");
    expect(bathHouseRock).toBeDefined();

    const playerC = game.playerBarn.addTestPlayer({
        pos: bathHouseRock!.pos,
    });
    v2.set(playerA.pos, bathHouseRock!.pos);
    playerA.layer = bathHouseRock!.layer;
    playerC.layer = bathHouseRock!.layer;
    game.step(0.1);

    playerC.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
        gameSourceType: "fists",
    });
    expect(playerA.questManager.quests[0].totalDelta).toBe(2);
});

test("Players shouldn't get placement progress for just disconnecting", () => {
    const game = createGame(TeamMode.Solo, "test_normal");

    const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
    playerA.questManager.quests = [
        {
            id: "quest_top_solo",
            delta: 0,
            totalDelta: 0,
        },
    ];

    expect(playerA.questManager.quests[0].delta).toBe(0);

    playerA.client.socket.close();

    // player leaving shouldn't count as progress
    expect(playerA.questManager.quests[0].totalDelta).toBe(0);
});

test("Solo placement success on win", () => {
    const game = createGame(TeamMode.Solo, "test_normal");

    const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
    playerA.questManager.quests = [
        {
            id: "quest_top_solo",
            delta: 0,
            totalDelta: 0,
        },
    ];
    const playerB = game.playerBarn.addTestPlayer({});

    // so the game starts
    playerA.timeAlive = 10;
    playerB.timeAlive = 10;
    game.step(0.1);
    expect(game.started).toBe(true);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Player,
        dir: v2.randomUnit(),
        source: playerA,
        gameSourceType: "fists",
    });

    expect(game.over).toBe(true);

    expect(playerA.questManager.quests[0].totalDelta).toBe(1);
});

test("Solo placement success on death", () => {
    const game = createGame(TeamMode.Solo, "test_normal");

    const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
    playerA.questManager.quests = [
        {
            id: "quest_top_solo",
            delta: 0,
            totalDelta: 0,
        },
    ];
    playerA.timeAlive = 10;

    for (let i = 0; i < 9; i++) {
        const p = game.playerBarn.addTestPlayer({});
        p.timeAlive = 10;
    }

    game.step(0.1);
    expect(game.started).toBe(true);

    playerA.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Gas,
        dir: v2.randomUnit(),
    });

    expect(playerA.questManager.quests[0].totalDelta).toBe(1);
});

// the same as above, but with one extra player so the rank doesn't fit the quest criteria
test("Solo placement test fail on death", () => {
    const game = createGame(TeamMode.Solo, "test_normal");

    const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
    playerA.questManager.quests = [
        {
            id: "quest_top_solo",
            delta: 0,
            totalDelta: 0,
        },
    ];
    playerA.timeAlive = 10;

    for (let i = 0; i < 10; i++) {
        const p = game.playerBarn.addTestPlayer({});
        p.timeAlive = 10;
    }

    game.step(0.1);
    expect(game.started).toBe(true);

    playerA.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Gas,
        dir: v2.randomUnit(),
    });

    expect(playerA.questManager.quests[0].totalDelta).toBe(0);
});

test("Squad placement success on win", () => {
    const game = createGame(TeamMode.Squad, "test_normal");

    const groupA = game.playerBarn.addGroup(false);
    const playerA = game.playerBarn.addTestPlayer({ group: groupA, userId: "meow" });
    playerA.questManager.quests = [
        {
            id: "quest_top_squad",
            delta: 0,
            totalDelta: 0,
        },
    ];
    const playerB = game.playerBarn.addTestPlayer({ group: groupA });
    playerA.timeAlive = 10;
    playerB.timeAlive = 10;

    const groupB = game.playerBarn.addGroup(false);
    const playerC = game.playerBarn.addTestPlayer({ group: groupB });
    playerC.timeAlive = 10;

    game.step(0.1);
    expect(game.started).toBe(true);

    playerC.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });

    expect(game.over).toBe(true);

    expect(playerA.questManager.quests[0].totalDelta).toBe(1);
});

test("Squad placement success on death", () => {
    const game = createGame(TeamMode.Squad, "test_normal");

    const groupA = game.playerBarn.addGroup(false);
    const playerA = game.playerBarn.addTestPlayer({ group: groupA, userId: "meow" });
    playerA.questManager.quests = [
        {
            id: "quest_top_squad",
            delta: 0,
            totalDelta: 0,
        },
    ];
    const playerB = game.playerBarn.addTestPlayer({ group: groupA });
    playerA.timeAlive = 10;
    playerB.timeAlive = 10;

    for (let i = 0; i < 4; i++) {
        const group = game.playerBarn.addGroup(false);
        const player = game.playerBarn.addTestPlayer({ group: group });
        player.timeAlive = 10;
    }

    game.step(0.1);
    expect(game.started).toBe(true);

    playerA.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerA.questManager.quests[0].totalDelta).toBe(0);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });

    expect(playerA.questManager.quests[0].totalDelta).toBe(1);
});

// the same as above, but with one extra group so the rank doesn't fit the quest criteria
test("Squad placement fail on death", () => {
    const game = createGame(TeamMode.Squad, "test_normal");

    const groupA = game.playerBarn.addGroup(false);
    const playerA = game.playerBarn.addTestPlayer({ group: groupA, userId: "meow" });
    playerA.questManager.quests = [
        {
            id: "quest_top_squad",
            delta: 0,
            totalDelta: 0,
        },
    ];
    const playerB = game.playerBarn.addTestPlayer({ group: groupA });
    playerA.timeAlive = 10;
    playerB.timeAlive = 10;

    for (let i = 0; i < 5; i++) {
        const group = game.playerBarn.addGroup(false);
        const player = game.playerBarn.addTestPlayer({ group: group });
        player.timeAlive = 10;
    }

    game.step(0.1);
    expect(game.started).toBe(true);

    playerA.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });
    expect(playerA.questManager.quests[0].totalDelta).toBe(0);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });

    expect(playerA.questManager.quests[0].totalDelta).toBe(0);
});

test("Survived time on death", () => {
    const game = createGame(TeamMode.Solo, "test_normal");

    const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
    playerA.questManager.quests = [
        {
            id: "quest_survived",
            delta: 0,
            totalDelta: 0,
        },
    ];

    expect(playerA.questManager.quests[0].delta).toBe(0);

    game.step(10);
    playerA.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });

    expect(playerA.questManager.quests[0].totalDelta).toBeCloseTo(10);
});

test("Survived time on win", () => {
    const game = createGame(TeamMode.Solo, "test_normal");

    const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
    playerA.questManager.quests = [
        {
            id: "quest_survived",
            delta: 0,
            totalDelta: 0,
        },
    ];
    const playerB = game.playerBarn.addTestPlayer({});

    game.step(15);
    expect(game.started).toBe(true);
    expect(playerA.questManager.quests[0].delta).toBe(0);

    playerB.damage({
        amount: 999,
        damageType: GameConfig.DamageType.Airdrop,
        dir: v2.randomUnit(),
    });

    expect(game.over).toBe(true);
    expect(playerA.questManager.quests[0].totalDelta).toBeCloseTo(15);
});
