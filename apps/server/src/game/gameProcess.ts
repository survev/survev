import NanoTimer from "nanotimer";
import { platform } from "os";
import { Config } from "../config";
import { logErrorToWebhook } from "../utils/serverHelpers";
import { type ProcessMsg, ProcessMsgType } from "../utils/types";
import { Game } from "./game";

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

process.on("message", async (msg: ProcessMsg) => {
    if (msg.type) {
        lastMsgTime = Date.now();
    }

    if (msg.type === ProcessMsgType.Create && !game) {
        game = new Game(
            msg.id,
            msg.config,
            (id, data) => {
                socketMsgs.push({
                    socketId: id,
                    data,
                    ip: "",
                });
            },
            (id, reason) => {
                sendMsg({
                    type: ProcessMsgType.SocketClose,
                    socketId: id,
                    reason,
                });
            },
            (msg) => {
                sendMsg(msg);
                if (msg.stopped) {
                    game = undefined;
                }
            },
        );

        await game.init();
        sendMsg({
            type: ProcessMsgType.Created,
        });
    }

    if (!game) return;

    switch (msg.type) {
        case ProcessMsgType.AddJoinToken:
            game.addJoinTokens(msg.tokens, msg.autoFill);
            break;
        case ProcessMsgType.SocketMsg:
            const sMsg = msg.msgs[0];
            game.handleMsg(sMsg.data as ArrayBuffer, sMsg.socketId, sMsg.ip);
            break;
        case ProcessMsgType.SocketClose:
            game.handleSocketClose(msg.socketId);
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
