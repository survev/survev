import { type ChildProcess, fork } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { WebSocket } from "uWebSockets.js";
import { type MapDef, MapDefs } from "../../../shared/defs/mapDefs.ts";
import type { TeamMode } from "../../../shared/gameConfig.ts";
import * as net from "../../../shared/net/net.ts";
import { util } from "../../../shared/utils/util.ts";
import { ServerLogger } from "../utils/logger.ts";
import {
    type FindGamePrivateBody,
    type GameData,
    type GameSocketData,
    type ProcessMsg,
    ProcessMsgType,
    type ServerGameConfig,
} from "../utils/types.ts";

let procFile: string;
if (process.env.NODE_ENV === "production") {
    procFile = "dist/gameProcess.js";
} else {
    procFile = "src/game/gameProcess.ts";
}

enum ProcState {
    Idle,
    CreatingGame,
    Running,
}

class GameProcess {
    process: ChildProcess;

    gameData: GameData = {
        id: "",
        teamMode: 0 as TeamMode,
        mapName: "",
        canJoin: false,
        aliveCount: 0,
        startedTime: 0,
        stopped: false,
    };

    state = ProcState.Idle;

    stoppedTime = Date.now();
    lastMsgTime = Date.now();

    manager: GameProcessManager;

    onCreatedCbs: Array<(_proc: typeof this) => void> = [];

    avaliableSlots = 0;

    constructor(manager: GameProcessManager, id: string, config: ServerGameConfig) {
        this.manager = manager;
        this.process = fork(procFile, [], {
            serialization: "advanced",
        });

        this.process.on("message", (msg: ProcessMsg) => {
            this._onProcessMsg(msg);
        });

        this.create(id, config);
    }

    private _onProcessMsg(msg: ProcessMsg) {
        if (msg.type) {
            this.lastMsgTime = Date.now();
        }

        switch (msg.type) {
            case ProcessMsgType.Created:
                this.state = ProcState.Running;
                for (const cb of this.onCreatedCbs) {
                    cb(this);
                }
                this.onCreatedCbs.length = 0;
                break;
            case ProcessMsgType.UpdateData:
                if (this.gameData.id !== msg.id) {
                    this.manager.processById.delete(this.gameData.id);
                    this.gameData.id = msg.id;
                    this.manager.processById.set(this.gameData.id, this);
                }
                this.gameData = msg;
                if (this.gameData.stopped) {
                    this.stoppedTime = Date.now();
                    this.state = ProcState.Idle;
                }
                break;
            case ProcessMsgType.ServerSocketMsg:
                for (let i = 0; i < msg.msgs.length; i++) {
                    const socketMsg = msg.msgs[i];
                    const socket = this.manager.sockets.get(socketMsg.socketId);

                    if (!socket) continue;
                    if (socket.getUserData().closed) continue;
                    socket.send(socketMsg.data, true, false);
                }
                break;
            case ProcessMsgType.SocketClose:
                const socket = this.manager.sockets.get(msg.socketId);
                if (socket && !socket.getUserData().closed) {
                    if (msg.reason) {
                        const disconnectMsg = new net.DisconnectMsg();
                        disconnectMsg.reason = msg.reason;
                        const stream = new net.MsgStream(new ArrayBuffer(128));
                        stream.serializeMsg(net.MsgType.Disconnect, disconnectMsg);
                        socket.send(stream.getBuffer(), true, false);
                    }

                    socket.close();
                }
                break;
        }
    }

    send(msg: ProcessMsg) {
        if (this.process.killed || !this.process.channel) return;
        this.process.send(msg);
    }

    create(id: string, config: ServerGameConfig) {
        this.send({
            type: ProcessMsgType.Create,
            id,
            config,
        });
        this.gameData.id = id;
        this.gameData.teamMode = config.teamMode;
        this.gameData.mapName = config.mapName;
        this.gameData.stopped = false;
        this.state = ProcState.CreatingGame;

        const mapDef = MapDefs[this.gameData.mapName as keyof typeof MapDefs] as MapDef;
        this.avaliableSlots = mapDef.gameMode.maxPlayers;
    }

    addJoinTokens(tokens: FindGamePrivateBody["playerData"], autoFill: boolean) {
        this.send({
            type: ProcessMsgType.AddJoinToken,
            autoFill,
            tokens,
        });
        this.avaliableSlots--;
    }

    handleSocketOpen(socketId: string, ip: string) {
        this.send({
            type: ProcessMsgType.SocketOpen,
            socketId,
            ip,
        });
    }

    handleMsg(data: ArrayBuffer, socketId: string) {
        this.send({
            type: ProcessMsgType.ClientSocketMsg,
            socketId,
            data,
        });
    }

    handleSocketClose(socketId: string) {
        this.send({
            type: ProcessMsgType.SocketClose,
            socketId,
        });
    }
}

export class GameProcessManager {
    readonly sockets = new Map<string, WebSocket<GameSocketData>>();

    readonly processById = new Map<string, GameProcess>();
    readonly processes: GameProcess[] = [];

    readonly logger = new ServerLogger("Game Process Manager");

    constructor() {
        process.on("beforeExit", () => {
            for (const gameProc of this.processes) {
                gameProc.process.kill();
            }
        });

        setInterval(() => {
            for (const gameProc of this.processes) {
                gameProc.send({
                    type: ProcessMsgType.KeepAlive,
                });

                if (Date.now() - gameProc.lastMsgTime > 10000) {
                    this.logger.warn(
                        `Process ${gameProc.process.pid} - #${
                            gameProc.gameData.id.substring(0, 4)
                        } did not send a message in more 10 seconds, killing`,
                    );
                    // sigquit can dump a core of the process
                    // useful for debugging infinite loops
                    this.killProcess(gameProc, "SIGQUIT");
                } else if (
                    gameProc.gameData.stopped
                    && Date.now() - gameProc.stoppedTime > 60000
                ) {
                    this.logger.warn(
                        `Process ${gameProc.process.pid} - #${
                            gameProc.gameData.id.substring(0, 4)
                        } stopped more than a minute ago, killing`,
                    );
                    this.killProcess(gameProc);
                }
            }
        }, 5000);
    }

    getPlayerCount(): number {
        return this.processes.reduce((a, b) => {
            return a + b.gameData.aliveCount;
        }, 0);
    }

    newGame(config: ServerGameConfig): GameProcess {
        let gameProc: GameProcess | undefined;

        for (let i = 0; i < this.processes.length; i++) {
            const p = this.processes[i];
            if (p.gameData.stopped) {
                gameProc = p;
                break;
            }
        }

        const id = randomUUID();
        if (!gameProc) {
            gameProc = new GameProcess(this, id, config);

            this.processes.push(gameProc);

            gameProc.process.on("exit", () => {
                this.killProcess(gameProc!);
            });
            gameProc.process.on("close", () => {
                this.killProcess(gameProc!);
            });
            gameProc.process.on("disconnect", () => {
                this.killProcess(gameProc!);
            });
            this.logger.info("Created new process with PID", gameProc.process.pid);
        } else {
            this.processById.delete(gameProc.gameData.id);
            gameProc.create(id, config);
        }

        this.processById.set(id, gameProc);

        return gameProc;
    }

    killProcess(gameProc: GameProcess, signal: NodeJS.Signals = "SIGTERM"): void {
        for (const [, socket] of this.sockets) {
            const data = socket.getUserData();
            if (data.closed) continue;
            if (data.gameId !== gameProc.gameData.id) continue;
            socket.close();
        }

        // send SIGTERM, if still hasn't terminated after 5 seconds, send SIGKILL >:3
        gameProc.process.kill(signal);
        setTimeout(() => {
            if (!gameProc.process.killed) {
                gameProc.process.kill("SIGKILL");
            }
        }, 5000);

        util.removeFrom(this.processes, gameProc);
        this.processById.delete(gameProc.gameData.id);
    }

    getById(id: string): GameProcess | undefined {
        return this.processById.get(id);
    }

    async findGame(body: FindGamePrivateBody): Promise<GameProcess> {
        let proc = this.processes
            .filter((proc) => {
                const game = proc.gameData;
                return (
                    (game.canJoin || proc.state === ProcState.CreatingGame)
                    && proc.avaliableSlots > 0
                    && game.teamMode === body.teamMode
                    && game.mapName === body.mapName
                );
            })
            .sort((a, b) => {
                return a.gameData.startedTime - b.gameData.startedTime;
            })[0];

        if (!proc) {
            proc = this.newGame({
                teamMode: body.teamMode,
                mapName: body.mapName as keyof typeof MapDefs,
            });
        }

        // if the game has not finished creating
        // wait for it to be created to send the find game response
        if (proc.state !== ProcState.Running) {
            return await new Promise((resolve) => {
                proc.onCreatedCbs.push((proc) => {
                    proc.addJoinTokens(body.playerData, body.autoFill);
                    resolve(proc);
                });
            });
        }

        proc.addJoinTokens(body.playerData, body.autoFill);

        return proc;
    }

    onOpen(socketId: string, socket: WebSocket<GameSocketData>): void {
        const data = socket.getUserData();
        const proc = this.processById.get(data.gameId);
        if (proc === undefined) {
            this.logger.warn("prcoess not found, closing socket.");
            socket.close();
            return;
        }
        this.sockets.set(socketId, socket);
        this.processById.get(data.gameId)?.handleSocketOpen(socketId, data.ip);
    }

    onMsg(socketId: string, msg: ArrayBuffer): void {
        const data = this.sockets.get(socketId)?.getUserData();
        if (!data) return;
        this.processById.get(data.gameId)?.handleMsg(msg, socketId);
    }

    onClose(socketId: string) {
        const data = this.sockets.get(socketId)?.getUserData();
        this.sockets.delete(socketId);
        if (!data) return;
        this.processById.get(data.gameId)?.handleSocketClose(socketId);
    }
}
