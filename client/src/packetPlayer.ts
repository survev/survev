import { type Packet, PacketRecorder } from "../../shared/utils/packetRecorder";
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

    private currentPacketIdx = 0;
    private sendOpenEvent = false;
    private stopped = false;

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

        for (let i = 0, totalTime = 0; i < this.packets.length; i++) {
            const packet = this.packets[i];
            totalTime += packet.delay;
            setTimeout(() => {
                if (this.stopped) return;

                const event = new MessageEvent("message", {
                    data: packet.data,
                });

                this.socket.onmessage?.(event);
            }, totalTime);
        }
    }

    stop() {
        this.stopped = true;
    }
}
