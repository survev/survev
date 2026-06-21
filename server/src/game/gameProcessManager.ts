import { type ChildProcess, fork } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { WebSocket } from "uWebSockets.js";
import { type MapDefKey, MapDefs } from "../../../shared/defs/mapDefs.ts";
import type { TeamMode } from "../../../shared/gameConfig.ts";
import * as net from "../../../shared/net/net.ts";
import { util } from "../../../shared/utils/util.ts";
import { ServerLogger } from "../utils/logger.ts";
import {
    getParticipantKeys,
    hasParticipantConflict,
    type ParticipantRecord,
} from "../utils/matchmaking.ts";
import { type FindGamePrivateBody, type ServerGameConfig } from "../utils/types.ts";
import { type GameData, type ProcessMsg, ProcessMsgType } from "./ipcTypes.ts";

let procFile: string;
if (process.env.NODE_ENV === "production") {
    procFile = "dist/gameProcess.js";
} else {
    procFile = "src/game/gameProcess.ts";
}

export enum ProcState {
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
        participantRecords: [],
    };

    state = ProcState.Idle;

    createdTime = Date.now();

    stoppedTime = Date.now();
    lastMsgTime = Date.now();

    manager: GameProcessManager;

    onCreatedCbs: Array<(_proc: typeof this) => void> = [];

    pendingReservations = new Map<
        string,
        {
            expiresAt: number;
            reservationId: string;
            keys: string[];
        }
    >();

    reusedCount = 0;

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
                if (this.reusedCount === 1) {
                    this.manager.logger.info(
                        `Process ${this.process.pid} created in ${Date.now() - this.createdTime}ms`,
                    );
                }
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
            case ProcessMsgType.JoinTokenConsumed:
                this.pendingReservations.delete(msg.token);
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
                    socket.end();
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
        this.gameData.canJoin = false;
        this.gameData.aliveCount = 0;
        this.gameData.startedTime = 0;
        this.gameData.stopped = false;
        this.gameData.participantRecords = [];
        this.pendingReservations.clear();
        this.state = ProcState.CreatingGame;

        this.reusedCount++;
    }

    get maxPlayers(): number {
        const mapDef = MapDefs[this.gameData.mapName as MapDefKey];
        return mapDef.gameMode.maxPlayers;
    }

    cleanupPendingReservations(now = Date.now()) {
        for (const [token, reservation] of this.pendingReservations) {
            if (reservation.expiresAt <= now) {
                this.pendingReservations.delete(token);
            }
        }
    }

    get activePendingReservations(): number {
        this.cleanupPendingReservations();
        return this.pendingReservations.size;
    }

    get availableSlots(): number {
        return this.maxPlayers - this.gameData.aliveCount - this.activePendingReservations;
    }

    get effectivePopulation(): number {
        return this.gameData.aliveCount + this.activePendingReservations;
    }

    get participantAndPendingRecords(): ParticipantRecord[] {
        this.cleanupPendingReservations();
        const records = [...this.gameData.participantRecords];
        for (const reservation of this.pendingReservations.values()) {
            for (const key of reservation.keys) {
                records.push({
                    key,
                    reservationId: reservation.reservationId,
                });
            }
        }
        return records;
    }

    hasParticipantConflict(body: FindGamePrivateBody & { reservationId: string }): boolean {
        const records = this.participantAndPendingRecords;
        const seenNonIpKeys = new Set<string>();

        for (const player of body.playerData) {
            const keys = getParticipantKeys(player);

            for (const key of keys) {
                if (key.startsWith("ip:")) continue;
                if (seenNonIpKeys.has(key)) return true;
                seenNonIpKeys.add(key);
            }

            if (hasParticipantConflict(records, keys, body.reservationId)) {
                return true;
            }
        }

        return false;
    }

    addJoinTokens(
        tokens: FindGamePrivateBody["playerData"],
        autoFill: boolean,
        reservationId: string,
    ) {
        const expiresAt = Date.now() + 12000;
        for (const token of tokens) {
            this.pendingReservations.set(token.token, {
                expiresAt,
                reservationId,
                keys: getParticipantKeys(token),
            });
        }

        this.send({
            type: ProcessMsgType.AddJoinToken,
            autoFill,
            tokens,
            reservationId,
        });
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

export interface GameSocketData {
    gameId: string;
    id: string;
    closed: boolean;
    rateLimit: Record<symbol, number>;
    ip: string;
    disconnectReason: string;
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

        // always keep some processes running even if theres no active games on them
        // creating a new proc is more expensive than reusing one
        const minIdleProcs = 3;

        setInterval(() => {
            for (const proc of this.processes) {
                proc.send({
                    type: ProcessMsgType.KeepAlive,
                });

                // kill processes that didn't send a keep alive msg in 10 seconds
                // because this usually means they are frozen in an infinite loop
                if (Date.now() - proc.lastMsgTime > 10000) {
                    const id = proc.gameData.id.substring(0, 4);
                    this.logger.warn(
                        `Process ${proc.process.pid} - #${id} did not send a message in more 10 seconds, killing`,
                    );
                    // sigquit can dump a core of the process
                    // useful for debugging infinite loops
                    this.killProcess(proc, "SIGQUIT");
                    continue;
                }
            }

            const idleProcs = this.processes.filter(p => {
                return p.gameData.stopped && (Date.now() - p.stoppedTime) > 60000;
            });

            // kill stale processes if there's too many
            if (idleProcs.length > minIdleProcs) {
                idleProcs.sort((a, b) => a.createdTime - b.createdTime);

                const procsToKill = Math.abs(minIdleProcs - idleProcs.length);
                for (let i = 0; i < procsToKill; i++) {
                    const proc = idleProcs[i];
                    this.logger.info(`Killing ${proc.process.pid} because we have too many stale processes`);
                    this.killProcess(proc);
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
            socket.end();
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
        const request = {
            ...body,
            reservationId: body.reservationId ?? randomUUID(),
        };

        let proc = this.processes
            .filter((proc) => {
                const game = proc.gameData;
                const excluded = request.excludeGameIds?.includes(game.id);
                return (
                    !excluded
                    &&
                    (game.canJoin || proc.state === ProcState.CreatingGame)
                    && proc.availableSlots >= request.playerData.length
                    && !proc.hasParticipantConflict(request)
                    && game.teamMode === request.teamMode
                    && game.mapName === request.mapName
                );
            })
            .sort((a, b) => {
                const populationDiff = b.effectivePopulation - a.effectivePopulation;
                if (populationDiff) return populationDiff;

                const startedDiff = a.gameData.startedTime - b.gameData.startedTime;
                if (startedDiff) return startedDiff;

                return a.gameData.id.localeCompare(b.gameData.id);
            })[0];

        if (!proc) {
            proc = this.newGame({
                teamMode: request.teamMode,
                mapName: request.mapName as MapDefKey,
            });
        }

        // if the game has not finished creating
        // wait for it to be created to send the find game response
        if (proc.state !== ProcState.Running) {
            return await new Promise((resolve) => {
                proc.onCreatedCbs.push((proc) => {
                    proc.addJoinTokens(
                        request.playerData,
                        request.autoFill,
                        request.reservationId,
                    );
                    resolve(proc);
                });
            });
        }

        proc.addJoinTokens(request.playerData, request.autoFill, request.reservationId);

        return proc;
    }

    onOpen(socketId: string, socket: WebSocket<GameSocketData>): void {
        const data = socket.getUserData();
        const proc = this.processById.get(data.gameId);
        if (proc === undefined) {
            this.logger.warn("process not found, closing socket.");
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
