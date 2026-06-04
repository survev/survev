import { expect, test } from "vitest";
import { GameConfig, TeamMode } from "../../shared/gameConfig.ts";
import { createGame } from "./gameTestHelpers.ts";

// i kept fucking up the logic with less and greater than while refactoring boost logic
// so decided to write a test
// to make sure there's no wrong check

const healAmounts = GameConfig.player.boostHealAmounts;
const breakPoints = GameConfig.player.boostBreakpoints;

test("Boost values", () => {
    const game = createGame(TeamMode.Solo, "test_normal");

    const player = game.playerBarn.addTestPlayer({});

    const max = breakPoints.reduce((a, b) => a + b, 0);

    for (let i = 0, boost = 0; i < breakPoints.length; i++) {
        boost += (breakPoints[i] / max) * 100;
        player.health = 1;

        player.boost = boost - 1;
        player.update(1);
        expect(player.health).toBe(1 + healAmounts[i]);
    }
});

test("Leadership", () => {
    const game = createGame(TeamMode.Solo, "test_normal");

    const player = game.playerBarn.addTestPlayer({});
    player.addPerk("leadership");

    player.health = 1;
    player.update(1);
    expect(player.health).toBe(1 + healAmounts[3]);
});

test("Assume leadership", () => {
    const game = createGame(TeamMode.Solo, "test_normal");

    const player = game.playerBarn.addTestPlayer({});
    player.addPerk("assume_leadership");

    player.health = 1;
    player.update(1);
    expect(player.health).toBe(1 + healAmounts[2]);
});
