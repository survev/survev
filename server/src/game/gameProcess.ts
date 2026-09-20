import fs from "node:fs";
import { platform } from "node:os";
import path from "node:path";
import { App, SSLApp, type WebSocket } from "uWebSockets.js";
import type { GameWsDisconnectReason } from "../../../shared/types/api.ts";
import { Logger } from "../../../shared/utils/logger.ts";
import { Config } from "../config.ts";
import { apiPrivateRouter, checkIp } from "../utils/apiRouter.ts";
import { logErrorToWebhook } from "../utils/logger.ts";
import type { DuelPlayerAbandoned, DuelRoundResult, SaveGameBody } from "../utils/types.ts";
import { uwsHelpers } from "../utils/uwsHelpers.ts";
import type { Client } from "./client.ts";
import { Game } from "./game.ts";
import { type GameSocketRateLease, GameSocketRateLimits } from "./gameSocketRateLimits.ts";
import { type ProcessMsg, ProcessMsgType } from "./ipcTypes.ts";
import { ClientSocket } from "./socket.ts";

function sendMsg(msg: ProcessMsg) {
    process.send!(msg);
}

let game: ServerGame | undefined;
let gameWeakRef: WeakRef<ServerGame> | undefined;

const procLogger = new Logger(Config.logging, `GameProc-${process.pid}`);

function broadcastDisconnect(reason: GameWsDisconnectReason) {
    if (game) {
        for (const client of game.clientBarn.clients) {
            client.socket.close(reason);
        }
    }
}
process.on("disconnect", () => {
    broadcastDisconnect("server_restart");
    process.exit();
});

process.on("uncaughtException", async (err) => {
    console.error(err);
    broadcastDisconnect("server_crashed");

    game = undefined;
    await logErrorToWebhook("server", "Game process error", err);

    process.exit(1);
});

function stopGame() {
    game = undefined;

    // make sure game is properly free'd
    // we expose the gc on dev builds
    if (global.gc) {
        setImmediate(async () => {
            await global.gc!({
                execution: "async",
            });
            if (gameWeakRef?.deref()) {
                procLogger.warn("Possible memory leak found, something is keeping a reference to the game object!");
            }
        });
    }
}

//
// Keep saveGame and sendQuestProgress separated from the game class
// This ensures that waiting for the network request doesn't prevent the game instance from being GC'd
//

async function saveGame(gameId: string, values: SaveGameBody["matchData"]) {
    let res: Response | undefined = undefined;
    try {
        res = await apiPrivateRouter.save_game.$post({
            json: {
                matchData: values,
            },
        });
    } catch (err) {
        procLogger.error(`Failed to fetch API save game:`, err);
    }

    if (!res || !res.ok) {
        const region = Config.gameServer.thisRegion.toUpperCase();
        procLogger.error(
            `[${region}] Failed to save game data, saving locally instead`,
        );

        const dir = path.resolve("lost_game_data");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(
            path.join(dir, `${gameId}.json`),
            JSON.stringify(values),
            "utf8",
        );
    }
}

async function sendQuestProgress(userId: string, progress: Array<{ id: string; delta: number }>) {
    try {
        const req = await apiPrivateRouter.quest_progress.$post({
            json: {
                userId,
                progress,
            },
        });
        const res = await req.json();
        if (!req.ok || !(res as { success: boolean }).success) {
            procLogger.error(`Failed to save quest progress`, res);
        }
    } catch (err) {
        procLogger.error(`Failed to save quest progress:`, err);
    }
}

async function reportDuelEvent(
    event: "round-result" | "player-abandoned",
    result: DuelRoundResult | DuelPlayerAbandoned,
) {
    // The coordinator deduplicates round results and individual abandonments.
    for (let attempt = 0; attempt < 8; attempt++) {
        try {
            const response = await fetch(`${Config.gameServer.apiServerUrl}/private/ranked/${event}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "survev-api-key": Config.secrets.SURVEV_API_KEY },
                body: JSON.stringify(result),
                signal: AbortSignal.timeout(5000),
            });
            if (response.ok) return;
            throw new Error(`Result endpoint returned ${response.status}`);
        } catch (error) {
            if (attempt === 7) {
                procLogger.error(
                    "Could not report ranked event",
                    event,
                    result.roundId,
                    error,
                );
                return;
            }
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * (attempt + 1), 5000)));
        }
    }
}

/**
 * Implements methods only used when the game is actually running on a server
 */
class ServerGame extends Game {
    override updateData() {
        sendMsg({
            type: ProcessMsgType.UpdateData,
            id: this.id,
            teamMode: this.teamMode,
            mapName: this.mapName,
            canJoin: this.canJoin,
            aliveCount: this.aliveCount,
            startedTime: this.startedTime,
            stopped: this.stopped,
            timeRunning: this.timeRunning,
            duel: this.duelStatus,
            duelCombat: this.getDuelCombatSnapshot(),
            livingPlayers: this.playerBarn.livingPlayers.map(p => {
                return {
                    id: p.__id,
                    userId: p.userId,
                    name: p.name,
                    disconnected: p.disconnected,
                };
            }),
        });
        if (this.stopped) {
            stopGame();
        }
    }

    override _saveGameToDatabase() {
        // Ranked series have their own persistent records and must not alter public BR stats.
        if (this.config.duel) return;
        // don't save games that never started
        if (!this.started) return;

        const players = this.modeManager.getPlayersSortedByRank();
        /**
         * teamTotal is for total teams that started the match, i hope?
         *
         * it also seems to be unused by the client so we could also remove it?
         */
        const teamTotal = new Set(players.map(({ player }) => player.teamId)).size;

        const teamKills = players.reduce(
            (acc, curr) => {
                acc[curr.player.teamId] = (acc[curr.player.teamId] ?? 0) + curr.player.kills;
                return acc;
            },
            {} as Record<string, number>,
        );

        const values: SaveGameBody["matchData"] = players.map(({ player, rank }) => {
            return {
                // *NOTE: userId is optional; we save the game stats for non logged users too
                userId: player.userId,
                region: Config.gameServer.thisRegion,
                username: player.name,
                playerId: player.matchDataId,
                teamMode: this.teamMode,
                teamCount: player.group?.players.length ?? 1,
                teamTotal: teamTotal,
                teamId: player.teamId,
                timeAlive: Math.round(player.timeAlive),
                died: player.dead,
                kills: player.kills,
                team_kills: teamKills[player.groupId] ?? 0,
                damageDealt: Math.round(player.damageDealt),
                damageTaken: Math.round(player.damageTaken),
                killerId: player.killedBy?.matchDataId || 0,
                gameId: this.id,
                mapId: this.map.mapId,
                mapSeed: this.map.seed,
                killedIds: player.killedIds,
                rank: rank,
                ip: player.client.ip,
                findGameIp: player.client.findGameIp,
                role: player.role,
            };
        });

        // only save the game if it has more than 2 players lol
        if (values.length < 2) return;
        saveGame(this.id, values);
    }

    override sendQuestProgress(userId: string, progress: Array<{ id: string; delta: number }>) {
        sendQuestProgress(userId, progress);
    }

    override _reportDuelResult(result: DuelRoundResult) {
        void reportDuelEvent("round-result", result);
    }

    override _reportDuelPlayerAbandoned(result: DuelPlayerAbandoned) {
        void reportDuelEvent("player-abandoned", result);
    }
}

let lastMsgTime = Date.now();
process.on("message", (msg: ProcessMsg) => {
    lastMsgTime = Date.now();

    if (msg.type === ProcessMsgType.Create && !game) {
        game = new ServerGame(msg.id, msg.config);
        gameWeakRef = new WeakRef(game);
    }

    if (msg.type === ProcessMsgType.RemoveDuelPlayer) {
        const removed = game?.removeDuelPlayer(msg.seriesId, msg.roundId, msg.profileId);
        sendMsg({
            type: ProcessMsgType.DuelPlayerRemoved,
            requestId: msg.requestId,
            combat: removed ? game?.getDuelCombatSnapshot() : undefined,
        });
        return;
    }
    if (!game) return;

    switch (msg.type) {
        case ProcessMsgType.AddJoinToken:
            game.addJoinTokens(msg.tokens, msg.autoFill);
            break;
        case ProcessMsgType.AddSpectateToken:
            game.addSpectateToken(msg.token, msg.data);
            break;
        case ProcessMsgType.CancelDuel:
            game.cancelDuel(msg.seriesId, msg.roundId);
            break;
    }
});

setInterval(() => {
    if (Date.now() - lastMsgTime > 10000) {
        console.log("Game process has not received a message in 10 seconds, exiting");
        process.exit();
    }

    if (game) {
        game?.updateData();
    } else {
        sendMsg({
            type: ProcessMsgType.KeepAlive,
        });
    }
}, 5000);

let setGameInterval: (cb: () => void, time: number) => void = setInterval;
if (platform() === "win32") {
    const NanoTimer = (await import("nanotimer")).default;
    // setInterval on windows sucks
    // and doesn't give accurate timings
    setGameInterval = (cb: () => void, time: number) => {
        new NanoTimer().setInterval(cb, [], `${time}m`);
    };
}

setGameInterval(() => {
    game?.update();
}, 1000 / Config.gameTps);

setGameInterval(() => {
    game?.netSync();
}, 1000 / Config.netSyncTps);

interface GameSocketData {
    ip: string;
    rateLimit: Record<symbol, number>;
    rateLease: GameSocketRateLease;
    disconnectReason?: GameWsDisconnectReason;
    clientSocket?: UwsSocket;
}

class UwsSocket extends ClientSocket<Client> {
    private _socket: WebSocket<GameSocketData>;
    private _ip: string;

    _closed = false;
    constructor(socket: WebSocket<GameSocketData>, ip: string) {
        super();
        this._socket = socket;
        this._ip = ip;
    }

    ip(): string {
        return this._ip;
    }

    closed(): boolean {
        return this._closed;
    }

    send(data: Uint8Array<ArrayBuffer>): void {
        if (this._closed) return;
        this._socket.send(data, true, false);
    }

    close(reason?: GameWsDisconnectReason): void {
        if (this._closed) return;
        this._closed = true;
        this._socket.end(reason ? 3000 : 0, reason);
    }
}

const app = Config.gameServer.ssl
    ? SSLApp({
        key_file_name: Config.gameServer.ssl.keyFile,
        cert_file_name: Config.gameServer.ssl.certFile,
    })
    : App();

const gameSocketRateLimits = new GameSocketRateLimits();

app.ws<GameSocketData>("/play", {
    idleTimeout: 30,
    maxPayloadLength: 1024,

    async upgrade(res, req, context): Promise<void> {
        let rateLease: GameSocketRateLease | undefined;
        res.onAborted((): void => {
            res.aborted = true;
            rateLease?.release();
        });
        const wskey = req.getHeader("sec-websocket-key");
        const wsProtocol = req.getHeader("sec-websocket-protocol");
        const wsExtensions = req.getHeader("sec-websocket-extensions");

        if (!game) {
            procLogger.warn("Websocket upgrade closed: process not running a game");
            res.end();
            return;
        }

        const ip = uwsHelpers.getIp(res, req, Config.gameServer.proxyIPHeader);

        if (!ip) {
            game.logger.warn("Invalid IP Found");
            res.end();
            return;
        }

        const upgradingGame = game;
        rateLease = gameSocketRateLimits.reserve(ip, !!upgradingGame.config.duel);
        if (!rateLease) {
            res.cork(() => {
                game!.logger.warn("Websocket upgrade closed: Rate limited");
                res.writeStatus("429 Too Many Requests");
                res.write("429 Too Many Requests");
                res.end();
            });
            return;
        }

        let upgraded = false;
        try {
            let disconnectReason: GameWsDisconnectReason | undefined;
            const ipData = await checkIp(ip);
            if (ipData?.banned) disconnectReason = "ip_banned";
            else if (ipData?.behindProxy) disconnectReason = "behind_proxy";
            if (res.aborted) return;
            if (game !== upgradingGame || upgradingGame.stopped) {
                res.end();
                return;
            }
            res.cork(() => {
                if (res.aborted) return;
                res.upgrade<GameSocketData>(
                    { rateLimit: {}, rateLease: rateLease!, ip, disconnectReason },
                    wskey,
                    wsProtocol,
                    wsExtensions,
                    context,
                );
                upgraded = true;
            });
        } finally {
            // Aborted/failed upgrades have no websocket close event to release their slot.
            if (!upgraded) rateLease.release();
        }
    },

    open(socket: WebSocket<GameSocketData>) {
        const data = socket.getUserData();

        if (data.disconnectReason) {
            socket.end(3000, data.disconnectReason);
            return;
        }

        data.clientSocket = new UwsSocket(socket, data.ip);
    },

    message(socket: WebSocket<GameSocketData>, message) {
        const data = socket.getUserData();
        if (!game || !data.clientSocket) {
            if (data.clientSocket) {
                data.clientSocket.close();
            } else {
                socket.close();
            }
            return;
        }
        if (data.rateLease.isRateLimited(data.rateLimit)) {
            procLogger.warn("Game websocket rate limited, closing socket.");
            socket.end(3000, "rate_limited");
            return;
        }
        game.clientBarn.handleMsg(message, data.clientSocket);
    },

    close(socket: WebSocket<GameSocketData>) {
        const data = socket.getUserData();
        data.rateLease.release();
        if (data.clientSocket) {
            data.clientSocket._closed = true;
            game?.clientBarn?.handleSocketClose(data.clientSocket);
        }
    },
});

const port = parseInt(process.argv[2]);

app.listen(Config.gameServer.host, port, 1, (socket) => {
    if (!socket) {
        throw new Error(`Port ${port} is already in use`);
    }

    procLogger.info(
        `Listening on ${Config.gameServer.host}:${port}`,
    );
});
