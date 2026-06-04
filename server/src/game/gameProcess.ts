import NanoTimer from "nanotimer";
import { platform } from "node:os";
import { Config } from "../config.ts";
import { logErrorToWebhook } from "../utils/serverHelpers.ts";
import { type ProcessMsg, ProcessMsgType } from "../utils/types.ts";
import { Game } from "./game.ts";
import type { Player } from "./objects/player.ts";
import { ClientSocket } from "./socket.ts";

let game: Game | undefined;

function sendMsg(msg: ProcessMsg) {
    process.send!(msg);
}

process.on("disconnect", () => {
    process.exit();
});

const socketMsgs: Array<{
    socketId: string;
    data: Uint8Array;
    ip: string;
}> = [];

let lastMsgTime = Date.now();

const socketIdToSocket = new Map<string, ProcessSocket<Player | undefined>>();
class ProcessSocket<T> extends ClientSocket<T> {
    private _id: string;
    private _ip: string;
    private _closed = false;
    constructor(id: string, ip: string) {
        super();
        this._id = id;
        this._ip = ip;
    }

    ip(): string {
        return this._ip;
    }

    closed(): boolean {
        return this._closed;
    }

    send(data: Uint8Array<ArrayBuffer>): void {
        if (this.closed()) return;

        socketMsgs.push({
            socketId: this._id,
            data,
            ip: "",
        });
    }
    close(): void {
        this._closed = true;
        sendMsg({
            type: ProcessMsgType.SocketClose,
            socketId: this._id,
            reason: undefined,
        });
    }

    closeWithReason(reason: string): void {
        sendMsg({
            type: ProcessMsgType.SocketClose,
            socketId: this._id,
            reason: reason,
        });
    }
}

process.on("message", (msg: ProcessMsg) => {
    if (msg.type) {
        lastMsgTime = Date.now();
    }

    if (msg.type === ProcessMsgType.Create && !game) {
        game = new Game(
            msg.id,
            msg.config,
            (msg) => {
                sendMsg(msg);
                if (msg.stopped) {
                    game = undefined;
                }
            },
        );

        sendMsg({
            type: ProcessMsgType.Created,
        });
    }

    if (!game) return;

    switch (msg.type) {
        case ProcessMsgType.AddJoinToken:
            game.addJoinTokens(msg.tokens, msg.autoFill);
            break;
        case ProcessMsgType.SocketMsg: {
            const sMsg = msg.msgs[0];
            let socket = socketIdToSocket.get(sMsg.socketId);
            if (!socket) {
                socket = new ProcessSocket(sMsg.socketId, sMsg.ip);
                socketIdToSocket.set(sMsg.socketId, socket);
            }
            game.handleMsg(sMsg.data as ArrayBuffer, socket);
            break;
        }
        case ProcessMsgType.SocketClose: {
            const socket = socketIdToSocket.get(msg.socketId);
            if (socket) {
                game.handleSocketClose(socket);
            }
            socketIdToSocket.delete(msg.socketId);
            break;
        }
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

// setInterval on windows sucks
// and doesn't give accurate timings
if (platform() === "win32") {
    new NanoTimer().setInterval(
        () => {
            game?.update();
        },
        "",
        `${1000 / Config.gameTps}m`,
    );

    new NanoTimer().setInterval(
        () => {
            game?.netSync();
            sendMsg({
                type: ProcessMsgType.SocketMsg,
                msgs: socketMsgs,
            });
            socketMsgs.length = 0;
        },
        "",
        `${1000 / Config.netSyncTps}m`,
    );
} else {
    setInterval(() => {
        game?.update();
    }, 1000 / Config.gameTps);

    setInterval(() => {
        game?.netSync();
        sendMsg({
            type: ProcessMsgType.SocketMsg,
            msgs: socketMsgs,
        });
        socketMsgs.length = 0;
    }, 1000 / Config.netSyncTps);
}

process.on("uncaughtException", async (err) => {
    console.error(err);
    game = undefined;

    await logErrorToWebhook("server", "Game process error", err);

    process.exit(1);
});
