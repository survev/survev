import { Game, ProcessMsgType } from "../../server/src/game/game";
import type { ProcessMsg } from "../../server/src/utils/types";

let game: Game | undefined;

function sendMsg(msg: ProcessMsg) {
    postMessage(msg);
}

const socketMsgs: Array<{
    socketId: string;
    ip: string;
    data: ArrayBuffer | Uint8Array;
}> = [];

addEventListener("message", async (message) => {
    const msg = message.data as ProcessMsg;

    if (msg.type === ProcessMsgType.Create && !game) {
        game = new Game(
            msg.id,
            msg.config,
            (id, data) => {
                socketMsgs.push({
                    socketId: id,
                    ip: "",
                    data,
                });
            },
            (id) => {
                sendMsg({
                    type: ProcessMsgType.SocketClose,
                    socketId: id,
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
            game.addJoinTokens(msg.tokens, false);
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
    if (game) {
        game?.updateData();
    } else {
        sendMsg({
            type: ProcessMsgType.KeepAlive,
        });
    }
}, 5000);

setInterval(() => {
    game?.update();
    game?.netSync();
    sendMsg({
        type: ProcessMsgType.SocketMsg,
        msgs: socketMsgs,
    });
    socketMsgs.length = 0;
}, 1000 / 120);
