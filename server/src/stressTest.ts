import { GameConfig } from "../../shared/gameConfig.ts";
import { WebsocketConnection } from "../../shared/net/connection.ts";
import type { FindGameBody, FindGameResponse } from "../../shared/types/api.ts";
import { Bot } from "../../shared/utils/bot.ts";
import { Config } from "./config.ts";

const config = {
    address: Config.gameServer.apiServerUrl,
    region: Config.gameServer.thisRegion,
    gameModeIdx: 0,
    botCount: 79,
    joinDelay: 100,
};
const bots = new Set<Bot>();
let allBotsJoined = false;

setInterval(() => {
    for (const bot of bots) {
        if (Math.random() < 0.02) bot.updateInputs();

        bot.sendInputs();

        if (bot.disconnect) {
            bots.delete(bot);
        }
    }

    if (bots.size === 0 && allBotsJoined) {
        console.log("All bots died or disconnected, exiting.");
        process.exit();
    }
}, 30);

for (let i = 1; i <= config.botCount; i++) {
    const response = (await (
        await fetch(`${config.address}/api/find_game_v2`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {
                    region: config.region,
                    autoFill: true,
                    gameModeIdx: config.gameModeIdx,
                    playerCount: 1,
                    version: GameConfig.protocolVersion,
                    zones: [config.region],
                } satisfies FindGameBody,
            ),
        })
    ).json()) as FindGameResponse;
    if (response.type !== "success") {
        console.log("Failed finding game, error:", response);
        continue;
    }
    const con = new WebsocketConnection(response.res.urls[0]);
    const bot = new Bot(i, con, response.res.joinToken);
    bots.add(bot);

    await Promise.all([
        new Promise(resolve => {
            setTimeout(resolve, config.joinDelay);
        }),
        bot.connectPromise,
    ]);
}

allBotsJoined = true;
