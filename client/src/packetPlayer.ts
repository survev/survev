import {
    type Packet,
    PacketRecorder,
    PacketType,
} from "../../shared/utils/packetRecorder";
import type { GameWebSocket } from "./game";

export class PlayerSocket implements GameWebSocket {
    readonly binaryType = "arraybuffer";

    onclose: GameWebSocket["onclose"] = null;
    onerror: GameWebSocket["onerror"] = null;
    onmessage: GameWebSocket["onmessage"] = null;
    onopen: GameWebSocket["onopen"] = null;

    readonly readyState = 0;

    close(_code?: number, _reason?: string) {}
    send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {}

    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;
}

export class PacketPlayer {
    recorder: PacketRecorder;
    packets: Packet[];

    socket = new PlayerSocket();

    private sendOpenEvent = false;
    private stopped = false;
    private closed = false;
    private timeouts: Array<ReturnType<typeof setTimeout>> = [];

    constructor(buff: ArrayBuffer) {
        this.recorder = PacketRecorder.fromBuffer(buff);

        const data = this.recorder.readEverything();

        this.packets = data.packets;
    }

    start() {
        if (!this.sendOpenEvent) {
            this.sendOpenEvent = true;
            this.socket.onopen?.(new Event("open"));
        }

        if (this.closed) return;

        for (let i = 0, totalTime = 0; i < this.packets.length; i++) {
            const packet = this.packets[i];
            totalTime += packet.delay;
            const timeout = setTimeout(() => {
                if (this.stopped) return;
                if (packet.type !== PacketType.Server) return;

                const event = new MessageEvent("message", {
                    data: packet.data,
                });

                this.socket.onmessage?.(event);
            }, totalTime);

            this.timeouts.push(timeout);
        }

        const closeTimeout = setTimeout(() => {
            if (this.stopped) return;
            this.emitClose();
        }, this.getPlaybackDuration());

        this.timeouts.push(closeTimeout);
    }

    stop() {
        this.stopped = true;
        for (const timeout of this.timeouts) {
            clearTimeout(timeout);
        }
        this.timeouts = [];
    }

    private getPlaybackDuration() {
        let totalTime = 0;
        for (const packet of this.packets) {
            totalTime += packet.delay;
        }

        return totalTime;
    }

    private emitClose() {
        if (this.closed) return;

        this.closed = true;
        this.socket.onclose?.(new CloseEvent("close"));
    }
}
