import fs from "node:fs";
import { platform } from "node:os";
import path from "node:path";
import { App, SSLApp, type WebSocket } from "uWebSockets.js";
import * as net from "../../../shared/net/net.ts";
import { Logger } from "../../../shared/utils/logger.ts";
import { Config } from "../config.ts";
import { apiPrivateRouter, checkIp } from "../utils/apiRouter.ts";
import { logErrorToWebhook } from "../utils/logger.ts";
import { HTTPRateLimit, WebSocketRateLimit } from "../utils/rateLimit.ts";
import type { SaveGameBody } from "../utils/types.ts";
import { uwsHelpers } from "../utils/uwsHelpers.ts";
import type { Client } from "./client.ts";
import { Game } from "./game.ts";
import { type ProcessMsg, ProcessMsgType } from "./ipcTypes.ts";
import { ClientSocket } from "./socket.ts";

let game: ServerGame | undefined;

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
        });
        if (this.stopped) {
            game = undefined;
        }
    }

    override async sendQuestProgress(userId: string, progress: Array<{ id: string; delta: number }>) {
        try {
            const req = await apiPrivateRouter.quest_progress.$post({
                json: {
                    userId,
                    progress,
                },
            });
            const res = await req.json();
            if (!req.ok || !(res as { success: boolean }).success) {
                this.logger.error(`Failed to save quest progress`, res);
            }
        } catch (err) {
            this.logger.error(`Failed to save quest progress:`, err);
        }
    }

    override async _saveGameToDatabase() {
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

        // FIXME: maybe move this to the parent game server process?
        // to avoid blocking the game from being GC'd until this request is done
        // and opening a database in each process if it fails
        // etc
        let res: Response | undefined = undefined;
        try {
            res = await apiPrivateRouter.save_game.$post({
                json: {
                    matchData: values,
                },
            });
        } catch (err) {
            this.logger.error(`Failed to fetch API save game:`, err);
        }

        if (!res || !res.ok) {
            const region = Config.gameServer.thisRegion.toUpperCase();
            this.logger.error(
                `[${region}] Failed to save game data, saving locally instead`,
            );

            const dir = path.resolve("lost_game_data");
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            fs.writeFileSync(
                path.join(dir, `${this.id}.json`),
                JSON.stringify(values),
                "utf8",
            );
        }
    }
}

function sendMsg(msg: ProcessMsg) {
    process.send!(msg);
}

process.on("disconnect", () => {
    process.exit();
});

let lastMsgTime = Date.now();

process.on("message", (msg: ProcessMsg) => {
    lastMsgTime = Date.now();

    if (msg.type === ProcessMsgType.Create && !game) {
        game = new ServerGame(msg.id, msg.config);

        sendMsg({
            type: ProcessMsgType.Created,
        });
    }

    if (!game) return;

    switch (msg.type) {
        case ProcessMsgType.AddJoinToken:
            game.addJoinTokens(msg.tokens, msg.autoFill);
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

process.on("uncaughtException", async (err) => {
    console.error(err);
    game = undefined;

    await logErrorToWebhook("server", "Game process error", err);

    process.exit(1);
});

interface GameSocketData {
    ip: string;
    rateLimit: Record<symbol, number>;
    disconnectReason: string;
    clientSocket: UwsSocket;
}

class UwsSocket extends ClientSocket<Client | undefined> {
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

    close(): void {
        if (this._closed) return;
        this._closed = true;
        this._socket.close();
    }
}

const procLogger = new Logger(Config.logging, `Proc ${process.pid}`);

const app = Config.gameServer.ssl
    ? SSLApp({
        key_file_name: Config.gameServer.ssl.keyFile,
        cert_file_name: Config.gameServer.ssl.certFile,
    })
    : App();

const gameHTTPRateLimit = new HTTPRateLimit(5, 1000);
const gameWsRateLimit = new WebSocketRateLimit(500, 1000, 5);

app.ws<GameSocketData>("/play", {
    idleTimeout: 30,
    maxPayloadLength: 1024,

    async upgrade(res, req, context): Promise<void> {
        res.onAborted((): void => {
            res.aborted = true;
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

        if (gameHTTPRateLimit.isRateLimited(ip) || gameWsRateLimit.isIpRateLimited(ip)) {
            res.cork(() => {
                game!.logger.warn("Websocket upgrade closed: Rate limited");
                res.writeStatus("429 Too Many Requests");
                res.write("429 Too Many Requests");
                res.end();
            });
            return;
        }

        const searchParams = new URLSearchParams(req.getQuery());
        const gameId = searchParams.get("gameId");

        if (!gameId) {
            game.logger.warn("Websocket upgrade closed: no game ID");
            uwsHelpers.forbidden(res);
            return;
        }

        if (game.id !== gameId) {
            game.logger.warn("Websocket upgrade closed: invalid game ID");
            uwsHelpers.forbidden(res);
            return;
        }

        if (!game.canJoin) {
            game.logger.warn("Websocket upgrade closed: game already started");
            uwsHelpers.forbidden(res);
            return;
        }

        gameWsRateLimit.ipConnected(ip);

        const socketId = crypto.randomUUID();
        let disconnectReason = "";

        const ipData = await checkIp(ip);

        if (ipData?.banned) {
            disconnectReason = "ip_banned";
        } else if (ipData?.behindProxy) {
            disconnectReason = "behind_proxy";
        }

        if (res.aborted) return;
        res.cork(() => {
            if (res.aborted) return;
            res.upgrade(
                {
                    gameId,
                    id: socketId,
                    closed: false,
                    rateLimit: {},
                    ip,
                    disconnectReason,
                },
                wskey,
                wsProtocol,
                wsExtensions,
                context,
            );
        });
    },

    open(socket: WebSocket<GameSocketData>) {
        const data = socket.getUserData();

        if (data.disconnectReason) {
            const disconnectMsg = new net.DisconnectMsg();
            disconnectMsg.reason = data.disconnectReason;
            const stream = new net.MsgStream(new ArrayBuffer(128));
            stream.serializeMsg(net.MsgType.Disconnect, disconnectMsg);
            socket.send(stream.getBuffer(), true, false);
            socket.end();
            return;
        }
        data.clientSocket = new UwsSocket(socket, data.ip);
    },

    message(socket: WebSocket<GameSocketData>, message) {
        const data = socket.getUserData();
        if (!game) {
            data.clientSocket.close();
            return;
        }
        if (gameWsRateLimit.isRateLimited(data.rateLimit)) {
            game.logger.warn("Game websocket rate limited, closing socket.");
            data.clientSocket.close();
            return;
        }
        game.clientBarn.handleMsg(message, data.clientSocket);
    },

    close(socket: WebSocket<GameSocketData>) {
        const data = socket.getUserData();
        data.clientSocket._closed = true;
        gameWsRateLimit.ipDisconnected(data.ip);
        game?.clientBarn?.handleSocketClose(data.clientSocket);
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
