import { App, SSLApp, type WebSocket } from "uWebSockets.js";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { Cron } from "croner";
import { randomUUID } from "crypto";
import { version } from "../../package.json";
import { GameConfig } from "../../shared/gameConfig";
import * as net from "../../shared/net/net";
import { Config } from "./config";
import { SingleThreadGameManager } from "./game/gameManager";
import { GameProcessManager } from "./game/gameProcessManager";
import { GIT_VERSION } from "./utils/gitRevision";
import { ServerLogger } from "./utils/logger";
import {
    apiPrivateRouter,
    cors,
    forbidden,
    getIp,
    HTTPRateLimit,
    logErrorToWebhook,
    readPostedJSON,
    returnJson,
    WebSocketRateLimit,
} from "./utils/serverHelpers";
import {
    type FindGamePrivateBody,
    type FindGamePrivateRes,
    type GameSocketData,
    type SaveGameBody,
    zFindGamePrivateBody,
} from "./utils/types";

process.on("uncaughtException", async (err) => {
    console.error(err);

    await logErrorToWebhook("server", "Game server error:", err);

    process.exit(1);
});

class GameServer {
    readonly logger = new ServerLogger("GameServer");

    readonly region = Config.regions[Config.gameServer.thisRegion];
    readonly regionId = Config.gameServer.thisRegion;

    readonly manager =
        Config.processMode === "single"
            ? new SingleThreadGameManager()
            : new GameProcessManager();

    async findGame(body: FindGamePrivateBody): Promise<FindGamePrivateRes> {
        const parsed = zFindGamePrivateBody.safeParse(body);

        if (!parsed.success || !parsed.data) {
            this.logger.warn("/api/find_game: Invalid body");
            return {
                error: "failed_to_parse_body",
            };
        }
        const data = parsed.data;

        if (data.version !== GameConfig.protocolVersion) {
            return {
                error: "invalid_protocol",
            };
        }

        if (data.region !== this.regionId) {
            return {
                error: "invalid_region",
            };
        }

        const gameId = await this.manager.findGame({
            region: data.region,
            version: data.version,
            autoFill: data.autoFill,
            mapName: data.mapName,
            teamMode: data.teamMode,
            playerData: data.playerData,
        });

        return {
            gameId,
            useHttps: this.region.https,
            hosts: [this.region.address],
            addrs: [this.region.address],
        };
    }

    async sendData() {
        try {
            await apiPrivateRouter.update_region.$post({
                json: {
                    data: {
                        playerCount: this.manager.getPlayerCount(),
                    },
                    regionId: Config.gameServer.thisRegion,
                },
            });
        } catch (err) {
            this.logger.error(`Failed to update region: `, err);
        }
    }

    async checkIp(ip: string) {
        try {
            const apiRes = await apiPrivateRouter.check_ip.$post({
                json: {
                    ip,
                },
            });

            if (apiRes.ok) {
                const body = await apiRes.json();
                return body;
            }
        } catch (err) {
            this.logger.error(`Failed request API fetch_ip: `, err);
        }

        return undefined;
    }

    async tryToSaveLostGames() {
        const games: SaveGameBody["matchData"] = [];

        const dir = path.resolve("lost_game_data");

        if (!existsSync(dir)) return;

        const files = await fs.readdir(dir);

        for (const fileName of files) {
            const filePath = path.resolve(dir, fileName);
            const data = JSON.parse(await fs.readFile(filePath, "utf8"));
            games.push(...data);
        }

        if (games.length < 2) return;

        this.logger.info(`${games.length} lost games found, trying to save...`);

        let res: Response | undefined = undefined;
        try {
            res = await apiPrivateRouter.save_game.$post({
                json: {
                    matchData: games,
                },
            });
        } catch (err) {
            this.logger.error(`Failed to fetch API save game:`, err);
        }

        if (res?.ok) {
            this.logger.info(`successfully saved lost games!`);
            // if we successfully saved the games we can remove them
            for (const fileName of files) {
                const filePath = path.resolve(dir, fileName);
                await fs.rm(filePath);
            }
        }
    }
}

const server = new GameServer();

if (process.env.NODE_ENV !== "production") {
    server.manager.newGame(Config.modes[0]);
}

const app = Config.gameServer.ssl
    ? SSLApp({
          key_file_name: Config.gameServer.ssl.keyFile,
          cert_file_name: Config.gameServer.ssl.certFile,
      })
    : App();

app.get("/health", (res) => {
    res.writeStatus("200 OK");
    res.write("OK");
    res.end();
});

app.options("/api/find_game", (res) => {
    cors(res);
    res.end();
});

app.post("/api/find_game", (res, req) => {
    res.onAborted(() => {
        res.aborted = true;
    });

    if (req.getHeader("survev-api-key") !== Config.secrets.SURVEV_API_KEY) {
        forbidden(res);
        return;
    }

    readPostedJSON(
        res,
        async (body: FindGamePrivateBody) => {
            try {
                if (res.aborted) return;

                const parsed = zFindGamePrivateBody.safeParse(body);
                if (!parsed.success || !parsed.data) {
                    returnJson(res, { error: "failed_to_parse_body" });
                    return;
                }

                returnJson(res, await server.findGame(parsed.data));
            } catch (error) {
                server.logger.warn("API find_game error: ", error);
            }
        },
        () => {
            if (res.aborted) return;
            res.cork(() => {
                if (res.aborted) return;
                res.writeStatus("500 Internal Server Error");
                res.write("500 Internal Server Error");
                res.end();
            });
            server.logger.warn("/api/find_game: Error retrieving body");
        },
    );
});

app.post("/api/find_game_by_id", async (res, req) => {
    res.onAborted(() => {
        res.aborted = true;
    });

    cors(res);

    // Accept BOTH header auth (new) and body apiKey (legacy via API server)
    const headerKey = req.getHeader("survev-api-key");
    if (headerKey && headerKey !== Config.secrets.SURVEV_API_KEY) {
        forbidden(res);
        return;
    }

    readPostedJSON(
        res,
        async (body: any) => {
            try {
                if (res.aborted) return;

                if (!headerKey) {
                    if (body?.apiKey !== Config.secrets.SURVEV_API_KEY) {
                        forbidden(res);
                        return;
                    }
                }

                const region = body?.region;
                const gameId = body?.gameId;

                if (typeof region !== "string" || typeof gameId !== "string") {
                    returnJson(res, { err: "failed_to_parse_body" });
                    return;
                }

                if (region !== server.regionId) {
                    returnJson(res, { err: "Invalid Region" });
                    return;
                }

                const g = server.manager.getById(gameId);
                if (!g) {
                    returnJson(res, { err: "Invalid gameId" });
                    return;
                }

                const token = randomUUID();
                const ip = getIp(res, req, Config.gameServer.proxyIPHeader) ?? "";

                const playerData = [
                {
                    token,
                    ip,
                },
                ];

                const game = await server.manager.findGameById(
                gameId,
                playerData,
                false,
                );

                if (!game) {
                returnJson(res, { err: "Invalid gameId" });
                return;
                }

                returnJson(res, {
                res: [
                    {
                    zone: "",
                    data: token, // 👈 DAS ist matchPriv
                    gameId,
                    useHttps: server.region.https,
                    hosts: [server.region.address],
                    addrs: [server.region.address],
                    },
                ],
                });


                
                

                returnJson(res, {
                    res: [
                        {
                            zone: "",
                            data: (g as any).data ?? "",
                            gameId,
                            useHttps: server.region.https,
                            hosts: [server.region.address],
                            addrs: [server.region.address],
                        },
                    ],
                });
            } catch (error) {
                server.logger.warn("API find_game_by_id error: ", error);
            }
        },
        () => {
            if (res.aborted) return;
            res.cork(() => {
                if (res.aborted) return;
                res.writeStatus("500 Internal Server Error");
                res.write("500 Internal Server Error");
                res.end();
            });
            server.logger.warn("/api/find_game_by_id: Error retrieving body");
        },
    );
});

app.post("/api/game_infos", async (res, req) => {
    res.onAborted(() => {
        res.aborted = true;
    });

    cors(res);

    const headerKey = req.getHeader("survev-api-key");
    if (headerKey && headerKey !== Config.secrets.SURVEV_API_KEY) {
        forbidden(res);
        return;
    }

    readPostedJSON(
        res,
        async (body: any) => {
            try {
                if (res.aborted) return;

                if (!headerKey) {
                    if (body?.apiKey !== Config.secrets.SURVEV_API_KEY) {
                        forbidden(res);
                        return;
                    }
                }

                const region = body?.region;
                if (typeof region !== "string") {
                    returnJson(res, { err: "failed_to_parse_body", data: [] });
                    return;
                }

                if (region !== server.regionId) {
                    returnJson(res, { err: "Invalid Region", data: [] });
                    return;
                }

                // Expected by client: { data: [{id, teamMode, playerCount, playerNames, runtime, stopped}] }
                const games = await server.manager.getGames();
                const now = Date.now();

                const data = (Array.isArray(games) ? games : []).map((g: any) => ({
                    id: g.id,
                    teamMode: g.teamMode,
                    playerCount: g.aliveCount,
                    playerNames: "",
                    runtime: g.startedTime,
                    stopped: g.stopped ?? false,
                })).filter((g: any) => g.id);

                returnJson(res, { data });
            } catch (error) {
                server.logger.warn("API game_infos error: ", error);
            }
        },
        () => {
            if (res.aborted) return;
            res.cork(() => {
                if (res.aborted) return;
                res.writeStatus("500 Internal Server Error");
                res.write("500 Internal Server Error");
                res.end();
            });
            server.logger.warn("/api/game_infos: Error retrieving body");
        },
    );
});


app.options("/api/find_spectator_game", (res) => {
    cors(res);
    res.end();
});

app.post("/api/find_spectator_game", (res, req) => {
    res.onAborted(() => {
        res.aborted = true;
    });

    cors(res);

    const headerKey = req.getHeader("survev-api-key");
    if (headerKey && headerKey !== Config.secrets.SURVEV_API_KEY) {
        forbidden(res);
        return;
    }

    readPostedJSON(
        res,
        async (body: any) => {
            try {
                if (res.aborted) return;

                if (!headerKey) {
                    if (body?.apiKey !== Config.secrets.SURVEV_API_KEY) {
                        forbidden(res);
                        return;
                    }
                }

                const region = body?.region;
                const gameId = body?.gameId;

                if (typeof region !== "string") {
                    returnJson(res, { err: "failed_to_parse_body" });
                    return;
                }

                if (region !== server.regionId) {
                    returnJson(res, { err: "Invalid Region" });
                    return;
                }

                // If a specific gameId is provided, return it if it exists
                if (typeof gameId === "string" && gameId.length > 0) {
                    const g = server.manager.getById(gameId);
                    if (!g) {
                        returnJson(res, { err: "Invalid gameId" });
                        return;
                    }
                    returnJson(res, {
                        res: [
                            {
                                zone: "",
                                data: (g as any).data ?? "",
                                gameId,
                                useHttps: server.region.https,
                                hosts: [server.region.address],
                                addrs: [server.region.address],
                            },
                        ],
                    });
                    return;
                }

                // Otherwise, pick any running game (simple heuristic)
                const games = (server.manager as any).getGames?.() ?? (server.manager as any).games ?? [];
                const pick = (Array.isArray(games) ? games : []).find((g: any) => !g.stopped && (g.playerCount ?? g.players?.length ?? 0) > 0)
                    ?? (Array.isArray(games) ? games : [])[0];

                if (!pick?.id) {
                    returnJson(res, { err: "No Spectatable game" });
                    return;
                }

                const pickedId = String(pick.id);

                returnJson(res, {
                    res: [
                        {
                            zone: "",
                            data: pick.data ?? "",
                            gameId: pickedId,
                            useHttps: server.region.https,
                            hosts: [server.region.address],
                            addrs: [server.region.address],
                        },
                    ],
                });
            } catch (error) {
                server.logger.warn("API find_spectator_game error: ", error);
            }
        },
        () => {
            if (res.aborted) return;
            res.cork(() => {
                if (res.aborted) return;
                res.writeStatus("500 Internal Server Error");
                res.write("500 Internal Server Error");
                res.end();
            });
            server.logger.warn("/api/find_spectator_game: Error retrieving body");
        },
    );
});

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

        const ip = getIp(res, req, Config.gameServer.proxyIPHeader);

        if (!ip) {
            server.logger.warn(`Invalid IP Found`);
            res.end();
            return;
        }

        if (gameHTTPRateLimit.isRateLimited(ip) || gameWsRateLimit.isIpRateLimited(ip)) {
            res.cork(() => {
                res.writeStatus("429 Too Many Requests");
                res.write("429 Too Many Requests");
                res.end();
            });
            return;
        }

        const searchParams = new URLSearchParams(req.getQuery());
        const gameId = searchParams.get("gameId");

        if (!gameId) {
            server.logger.warn("game_id_missing");
            forbidden(res);
            return;
        }
        const gameData = server.manager.getById(gameId);

        if (!gameData) {
            server.logger.warn("invalid_game_id");
            forbidden(res);
            return;
        }

        if (!gameData.canJoin) {
            server.logger.warn("game_started");
            forbidden(res);
            return;
        }

        gameWsRateLimit.ipConnected(ip);

        const socketId = randomUUID();
        let disconnectReason = "";

        const ipData = await server.checkIp(ip);

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

        server.manager.onOpen(data.id, socket);
    },

    message(socket: WebSocket<GameSocketData>, message) {
        if (gameWsRateLimit.isRateLimited(socket.getUserData().rateLimit)) {
            server.logger.warn("Game websocket rate limited, closing socket.");
            socket.close();
            return;
        }
        server.manager.onMsg(socket.getUserData().id, message);
    },

    close(socket: WebSocket<GameSocketData>) {
        const data = socket.getUserData();
        data.closed = true;
        server.manager.onClose(data.id);
        gameWsRateLimit.ipDisconnected(data.ip);
    },
});

app.ws<GameSocketData & { spectator?: boolean }>("/spectate", {
    idleTimeout: 30,
    maxPayloadLength: 1024,
    

    async upgrade(res, req, context): Promise<void> {
        res.onAborted((): void => {
            res.aborted = true;
        });

        const wskey = req.getHeader("sec-websocket-key");
        const wsProtocol = req.getHeader("sec-websocket-protocol");
        const wsExtensions = req.getHeader("sec-websocket-extensions");

        const ip = getIp(res, req, Config.gameServer.proxyIPHeader);

        if (!ip) {
            server.logger.warn(`Invalid IP Found`);
            res.end();
            return;
        }

        if (gameHTTPRateLimit.isRateLimited(ip) || gameWsRateLimit.isIpRateLimited(ip)) {
            res.cork(() => {
                res.writeStatus("429 Too Many Requests");
                res.write("429 Too Many Requests");
                res.end();
            });
            return;
        }

        const searchParams = new URLSearchParams(req.getQuery());
        const gameId = searchParams.get("gameId");

        if (!gameId) {
            server.logger.warn("spectate_game_id_missing");
            forbidden(res);
            return;
        }

        const gameData = server.manager.getById(gameId);
        if (!gameData) {
            server.logger.warn("spectate_invalid_game_id");
            forbidden(res);
            return;
        }

        gameWsRateLimit.ipConnected(ip);

        const socketId = randomUUID();
        let disconnectReason = "";

        const ipData = await server.checkIp(ip);
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
                    spectator: true,
                },
                wskey,
                wsProtocol,
                wsExtensions,
                context,
            );
        });
    },

    open(socket) {
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

        server.manager.onOpen(data.id, socket as any);
    },

    message(socket, message: ArrayBuffer, _isBinary: boolean) {
        if (gameWsRateLimit.isRateLimited(socket.getUserData().rateLimit)) {
            server.logger.warn("Spectate websocket rate limited, closing socket.");
            socket.close();
            return;
        }
        server.manager.onMsg(socket.getUserData().id, message);
    },

    close(socket) {
        const data = socket.getUserData();
        data.closed = true;
        server.manager.onClose(data.id);
        gameWsRateLimit.ipDisconnected(data.ip);
    },
});

const pingHTTPRateLimit = new HTTPRateLimit(1, 3000);
const pingWsRateLimit = new WebSocketRateLimit(50, 1000, 10);

interface pingSocketData {
    rateLimit: Record<symbol, number>;
    ip: string;
}

// ping test
app.ws<pingSocketData>("/ptc", {
    idleTimeout: 10,
    maxPayloadLength: 2,

    upgrade(res, req, context) {
        res.onAborted((): void => {});

        const ip = getIp(res, req, Config.gameServer.proxyIPHeader);

        if (!ip) {
            server.logger.warn(`Invalid IP Found`);
            res.end();
            return;
        }

        if (pingHTTPRateLimit.isRateLimited(ip) || pingWsRateLimit.isIpRateLimited(ip)) {
            res.writeStatus("429 Too Many Requests");
            res.write("429 Too Many Requests");
            res.end();
            return;
        }
        pingWsRateLimit.ipConnected(ip);

        res.upgrade(
            {
                rateLimit: {},
                ip,
            },
            req.getHeader("sec-websocket-key"),
            req.getHeader("sec-websocket-protocol"),
            req.getHeader("sec-websocket-extensions"),
            context,
        );
    },

    message(socket: WebSocket<pingSocketData>, message) {
        if (pingWsRateLimit.isRateLimited(socket.getUserData().rateLimit)) {
            server.logger.warn("Ping websocket rate limited, closing socket.");
            socket.close();
            return;
        }
        socket.send(message, true, false);
    },

    close(ws) {
        pingWsRateLimit.ipDisconnected(ws.getUserData().ip);
    },
});

server.sendData();
setInterval(() => {
    server.sendData();
}, 20 * 1000);

app.listen(Config.gameServer.host, Config.gameServer.port, () => {
    server.logger.info(`Survev Game Server v${version} - GIT ${GIT_VERSION}`);
    server.logger.info(
        `Listening on ${Config.gameServer.host}:${Config.gameServer.port}`,
    );
    server.logger.info("Press Ctrl+C to exit.");
});

// try to save lost games every hour
new Cron("0 * * * *", async () => {
    try {
        await server.tryToSaveLostGames();
    } catch (err) {
        server.logger.error("Failed to save lost games", err);
    }
});
