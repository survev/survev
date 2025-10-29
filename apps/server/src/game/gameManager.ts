import type { WebSocket } from "uWebSockets.js";
import * as net from "@survev/lib/net";
import type { MapDefs } from "@survev/shared/defs/mapDefs";
import { randomUUID } from "crypto";
import NanoTimer from "nanotimer";
import { platform } from "os";
import { Config } from "../config";
import type {
    FindGamePrivateBody,
    GameData,
    GameSocketData,
    ServerGameConfig,
} from "../utils/types";
import { Game } from "./game";

export abstract class GameManager {
    abstract sockets: Map<string, WebSocket<GameSocketData>>;

    abstract getPlayerCount(): number;

    abstract getById(id: string): GameData | undefined;

    abstract findGame(body: FindGamePrivateBody): Promise<string>;

    abstract onOpen(socketId: string, socket: WebSocket<GameSocketData>): void;

    abstract onMsg(socketId: string, msg: ArrayBuffer): void;

    abstract onClose(socketId: string): void;
}

/**
 * Game manager that runs all game in the same process
 * Used for dev server
 */
export class SingleThreadGameManager implements GameManager {
    readonly sockets = new Map<string, WebSocket<GameSocketData>>();

    readonly gamesById = new Map<string, Game>();
    readonly games: Game[] = [];

    constructor() {
        // setInterval on windows sucks
        // and doesn't give accurate timings
        if (platform() === "win32") {
            new NanoTimer().setInterval(
                () => {
                    this.update();
                },
                "",
                `${1000 / Config.gameTps}m`,
            );

            new NanoTimer().setInterval(
                () => {
                    this.netSync();
                },
                "",
                `${1000 / Config.netSyncTps}m`,
            );
        } else {
            setInterval(() => {
                this.update();
            }, 1000 / Config.gameTps);

            setInterval(() => {
                this.netSync();
            }, 1000 / Config.netSyncTps);
        }
    }

    update(): void {
        for (let i = 0; i < this.games.length; i++) {
            const game = this.games[i];
            if (game.stopped) {
                this.games.splice(i, 1);
                i--;
                this.gamesById.delete(game.id);
                continue;
            }
            game.update();
        }
    }

    netSync(): void {
        for (let i = 0; i < this.games.length; i++) {
            this.games[i].netSync();
        }
    }

    getPlayerCount(): number {
        return this.games.reduce((a, b) => {
            return (
                a +
                (b ? b.playerBarn.livingPlayers.filter((p) => !p.disconnected).length : 0)
            );
        }, 0);
    }

    async newGame(config: ServerGameConfig): Promise<Game> {
        const id = randomUUID();
        const game = new Game(
            id,
            config,
            (id, data) => {
                this.sockets.get(id)?.send(data, true, false);
            },
            (id, reason) => {
                const socket = this.sockets.get(id);
                if (socket && !socket.getUserData().closed) {
                    if (reason) {
                        const disconnectMsg = new net.DisconnectMsg();
                        disconnectMsg.reason = reason;
                        const stream = new net.MsgStream(new ArrayBuffer(128));
                        stream.serializeMsg(net.MsgType.Disconnect, disconnectMsg);
                        socket.send(stream.getBuffer(), true, false);
                    }
                    socket.close();
                }
            },
        );
        await game.init();
        this.games.push(game);
        this.gamesById.set(id, game);
        return game;
    }

    getById(id: string): GameData | undefined {
        return this.gamesById.get(id);
    }

    async findGame(body: FindGamePrivateBody): Promise<string> {
        let game = this.games
            .filter((game) => {
                return (
                    game.canJoin &&
                    game.teamMode === body.teamMode &&
                    game.mapName === body.mapName
                );
            })
            .sort((a, b) => {
                return a.startedTime - b.startedTime;
            })[0];

        if (!game) {
            game = await this.newGame({
                teamMode: body.teamMode,
                mapName: body.mapName as keyof typeof MapDefs,
            });
        }

        game.addJoinTokens(body.playerData, body.autoFill);

        return game.id;
    }

    onOpen(socketId: string, socket: WebSocket<GameSocketData>): void {
        const data = socket.getUserData();
        const game = this.gamesById.get(data.gameId);
        if (game === undefined) {
            console.log(`Game ${data.gameId} not found, closing socket.`);
            socket.close();
            return;
        }
        this.sockets.set(socketId, socket);
    }

    onMsg(socketId: string, msg: ArrayBuffer): void {
        const data = this.sockets.get(socketId)?.getUserData();
        if (!data) return;
        this.gamesById.get(data.gameId)?.handleMsg(msg, socketId, data.ip);
    }

    onClose(socketId: string) {
        const data = this.sockets.get(socketId)?.getUserData();
        if (!data) return;
        this.gamesById.get(data.gameId)?.handleSocketClose(socketId);
        this.sockets.delete(socketId);
    }
}
