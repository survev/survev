import { Config } from "../../server/src/config";
import { Game } from "../../server/src/game/game";
import type { MapDefs } from "../../shared/defs/mapDefs";
import type { TeamMode } from "../../shared/gameConfig";

export async function createGame(teamMode: TeamMode, mapName: keyof typeof MapDefs) {
    // we dont want vitest spammed with stdout logs so only log warns and errors
    Config.logging.logDate = false;
    Config.logging.debugLogs = false;
    Config.logging.infoLogs = false;
    Config.logging.warnLogs = true;
    Config.logging.errorLogs = true;

    const game = new Game(
        "test",
        {
            mapName,
            teamMode,
        },
        () => {},
        () => {},
        () => {},
    );
    await game.init();
    return game;
}
