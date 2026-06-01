import { expect, test } from "vitest";
import { GameConfig, TeamMode } from "../../shared/gameConfig";
import { v2 } from "../../shared/utils/v2";
import { createGame } from "./gameTestHelpers";

test("Kill enemies inside building test", async () => {
    const game = await createGame(TeamMode.Solo, "test_normal");
    game.map.genBuilding("club_complex_01", game.map.center, 0, 0);

    const playerA = game.playerBarn.addTestPlayer({});
    playerA.userId = "meow";
    playerA.questManager.quests = [
        {
            id: "quest_club_kills",
            delta: 0,
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
    expect(playerA.questManager.quests[0].delta).toBe(1);

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
    expect(playerA.questManager.quests[0].delta).toBe(2);
});
