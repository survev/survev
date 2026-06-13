import { Config } from "../../server/src/config.ts";
import { Game } from "../../server/src/game/game.ts";
import type { MapDefKey } from "../../shared/defs/mapDefs.ts";
import type { TeamMode } from "../../shared/gameConfig.ts";

export function createGame(teamMode: TeamMode, mapName: MapDefKey) {
    // we dont want vitest spammed with stdout logs so only log warns and errors
    Config.logging.logDate = false;
    Config.logging.debugLogs = false;
    Config.logging.infoLogs = false;
    Config.logging.warnLogs = true;
    Config.logging.errorLogs = true;

    const game = new Game("test", { mapName, teamMode });
    return game;
}
