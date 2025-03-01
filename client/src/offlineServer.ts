import $ from "jquery";
import { ProcessMsgType } from "../../server/src/game/game";
import type {
    FindGamePrivateBody,
    GameData,
    ProcessMsg,
} from "../../server/src/utils/types";
import { type MapDef, MapDefs } from "../../shared/defs/mapDefs";
import type { TeamMode } from "../../shared/gameConfig";
import { math } from "../../shared/utils/math";
import { Bot } from "./bot";
import GameWorkerImport from "./gameWorker?worker";
import { helpers } from "./helpers";

interface ServerGameConfig {
    readonly mapName: keyof typeof MapDefs;
    readonly teamMode: TeamMode;
}

interface GameSocketData {
    gameId: string;
    id: string;
    closed: boolean;
}

export class Socket<T extends object = object> {
    data = {} as T;

    readyState = 1;
    binaryType = "";
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;

    send = (_data: ArrayBuffer | Uint8Array) => {};
    onmessage = (_e: { data: ArrayBuffer | Uint8Array }) => {};
    close = (_code?: number, _reason?: string) => {};
    onclose = (_code?: number, _reason?: string) => {};
    onerror = (_error: Error) => {};
    onopen = () => {};
}

function createSocketPair() {
    const clientSocket = new Socket();
    const serverSocket = new Socket<GameSocketData>();

    clientSocket.send = (data) => {
        serverSocket.onmessage({ data });
    };
    serverSocket.send = (data) => {
        clientSocket.onmessage({ data });
    };
    clientSocket.close = (code?: number, reason?: string) => {
        serverSocket.onclose(code, reason);
        clientSocket.onclose(code, reason);
        serverSocket.data.closed = true;
    };
    serverSocket.close = (code?: number, reason?: string) => {
        clientSocket.onclose(code, reason);
        serverSocket.onclose(code, reason);
        serverSocket.data.closed = true;
    };

    serverSocket.data.id = helpers.random64();

    return { clientSocket, serverSocket };
}

class GameWorker implements GameData {
    worker: Worker;

    canJoin = true;
    teamMode: TeamMode = 1;
    mapName = "";
    id = "";
    aliveCount = 0;
    startedTime = 0;
    stopped = true;

    manager: OfflineServer;

    onCreatedCbs: Array<(_proc: typeof this) => void> = [];

    lastMsgTime = Date.now();

    stoppedTime = Date.now();

    avaliableSlots = 0;

    constructor(manager: OfflineServer, id: string, config: ServerGameConfig) {
        this.manager = manager;
        this.worker = new GameWorkerImport();

        this.worker.addEventListener("message", (message) => {
            const msg = message.data;
            if (msg.type) {
                this.lastMsgTime = Date.now();
            }

            switch (msg.type) {
                case ProcessMsgType.Created:
                    for (const cb of this.onCreatedCbs) {
                        cb(this);
                    }
                    this.stopped = false;
                    this.onCreatedCbs.length = 0;
                    break;
                case ProcessMsgType.UpdateData:
                    this.canJoin = msg.canJoin;
                    this.teamMode = msg.teamMode;
                    this.mapName = msg.mapName;
                    if (this.id !== msg.id) {
                        this.manager.workerById.delete(this.id);
                        this.id = msg.id;
                        this.manager.workerById.set(this.id, this);
                    }
                    this.aliveCount = msg.aliveCount;
                    this.startedTime = msg.startedTime;
                    this.stopped = msg.stopped;
                    if (this.stopped) {
                        this.stoppedTime = Date.now();
                    }
                    break;
                case ProcessMsgType.SocketMsg:
                    for (let i = 0; i < msg.msgs.length; i++) {
                        const socketMsg = msg.msgs[i];
                        const socket = this.manager.sockets.get(socketMsg.socketId);

                        if (!socket) continue;
                        if (socket.data.closed) continue;
                        socket.send(socketMsg.data);
                    }
                    break;
                case ProcessMsgType.SocketClose:
                    const socket = this.manager.sockets.get(msg.socketId);
                    if (socket && !socket.data.closed) {
                        socket.close();
                    }
                    break;
            }
        });

        this.create(id, config);
    }

    send(msg: ProcessMsg) {
        this.worker.postMessage(msg);
    }

    create(id: string, config: ServerGameConfig) {
        this.send({
            type: ProcessMsgType.Create,
            id,
            config,
        });
        this.id = id;
        this.teamMode = config.teamMode;
        this.mapName = config.mapName;

        const mapDef = MapDefs[this.mapName as keyof typeof MapDefs] as MapDef;
        this.avaliableSlots = mapDef.gameMode.maxPlayers;
    }

    addJoinToken(tokens: FindGamePrivateBody["playerData"]) {
        this.send({
            type: ProcessMsgType.AddJoinToken,
            tokens,
            autoFill: false,
        });
        this.avaliableSlots--;
    }

    handleMsg(data: ArrayBuffer, socketId: string) {
        this.send({
            type: ProcessMsgType.SocketMsg,
            msgs: [
                {
                    socketId,
                    ip: "",
                    data,
                },
            ],
        });
    }

    handleSocketClose(socketId: string) {
        this.send({
            type: ProcessMsgType.SocketClose,
            socketId,
        });
    }
}

export class OfflineServer {
    readonly sockets = new Map<string, Socket<GameSocketData>>();

    readonly workerById = new Map<string, GameWorker>();
    readonly workers: GameWorker[] = [];

    readonly bots = new Set<Bot>();

    constructor() {
        setInterval(() => {
            for (const gameWorker of this.workers) {
                gameWorker.send({
                    type: ProcessMsgType.KeepAlive,
                });

                if (Date.now() - gameWorker.lastMsgTime > 10000) {
                    console.log(
                        `Game ${gameWorker.id} did not send a message in more 10 seconds, killing`,
                    );
                    this.killWorker(gameWorker);
                } else if (
                    gameWorker.stopped &&
                    Date.now() - gameWorker.stoppedTime > 60000
                ) {
                    console.log(
                        `Game ${gameWorker.id} stopped more than a minute ago, killing`,
                    );
                    this.killWorker(gameWorker);
                }
            }
        }, 5000);
    }

    update() {
        for (const bot of this.bots) {
            if (Math.random() < 0.02) {
                bot.updateInputs();
                bot.sendInputs();
                if (bot.disconnected) {
                    this.bots.delete(bot);
                }
            }
        }
    }

    newGame(config: ServerGameConfig): GameWorker {
        // FIXME: running 2 games at the same time seems to be laggy as fuck
        for (const worker of this.workers) {
            this.killWorker(worker);
        }

        let gameProc: GameWorker | undefined;

        for (let i = 0; i < this.workers.length; i++) {
            const p = this.workers[i];
            if (p.stopped) {
                gameProc = p;
                break;
            }
        }

        const id = helpers.random64();
        if (!gameProc) {
            gameProc = new GameWorker(this, id, config);
            this.workers.push(gameProc);
        } else {
            this.workerById.delete(gameProc.id);
            gameProc.create(id, config);
        }

        const countInput = $("#offline-bot-count");
        const count = math.clamp(countInput.val() as number, 0, 79);
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const bot = new Bot(i);
                const token = helpers.random64();
                gameProc.addJoinToken([{ token, ip: "", userId: null }]);
                const socket = this.connect(id);
                bot.connect(socket, token);
                this.bots.add(bot);
            }, 100 * i);
        }

        this.workerById.set(id, gameProc);

        return gameProc;
    }

    killWorker(gameProc: GameWorker): void {
        for (const [, socket] of this.sockets) {
            const data = socket.data;
            if (data.closed) continue;
            if (data.gameId !== gameProc.id) continue;
            socket.close();
        }

        gameProc.worker.terminate();

        const idx = this.workers.indexOf(gameProc);
        if (idx !== -1) {
            this.workers.splice(idx, 1);
        }
        this.workerById.delete(gameProc.id);
    }

    findGame(mapName: keyof typeof MapDefs) {
        let game = this.workers
            .filter((worker) => {
                return (
                    worker.canJoin &&
                    worker.avaliableSlots > 0 &&
                    worker.mapName === mapName
                );
            })
            .sort((a, b) => {
                return a.startedTime - b.startedTime;
            })[0];

        const joinToken = helpers.random64();

        if (!game) {
            game = this.newGame({
                teamMode: 1,
                mapName: mapName,
            });
        }

        // if the game is not running
        // wait for it to be created to send the find game response
        if (game.stopped) {
            return new Promise<{ gameId: string; data: string }>((resolve) => {
                game.onCreatedCbs.push((game) => {
                    game.addJoinToken([{ token: joinToken, userId: "", ip: "" }]);
                    resolve({
                        gameId: game.id,
                        data: joinToken,
                    });
                });
            });
        }

        game.addJoinToken([{ token: joinToken, userId: "", ip: "" }]);

        return {
            gameId: game.id,
            data: joinToken,
        };
    }

    connect(gameId: string) {
        const { clientSocket, serverSocket } = createSocketPair();

        serverSocket.onmessage = (event) => {
            this.onMsg(
                serverSocket.data.id,
                event.data instanceof Uint8Array
                    ? (event.data.buffer as ArrayBuffer)
                    : event.data,
            );
        };
        serverSocket.onclose = () => {
            this.onClose(serverSocket.data.id);
        };

        serverSocket.data.gameId = gameId;
        setTimeout(() => {
            this.onOpen(serverSocket.data.id, serverSocket);
            clientSocket.onopen();
        }, 250);

        return clientSocket;
    }

    onOpen(socketId: string, socket: Socket<GameSocketData>): void {
        const data = socket.data;
        const proc = this.workerById.get(data.gameId);
        if (proc === undefined) {
            socket.close();
            return;
        }
        this.sockets.set(socketId, socket);
    }

    onMsg(socketId: string, msg: ArrayBuffer): void {
        const data = this.sockets.get(socketId)?.data;
        if (!data) return;
        this.workerById.get(data.gameId)?.handleMsg(msg, socketId);
    }

    onClose(socketId: string) {
        const data = this.sockets.get(socketId)?.data;
        this.sockets.delete(socketId);
        if (!data) return;
        this.workerById.get(data.gameId)?.handleSocketClose(socketId);
    }
}
