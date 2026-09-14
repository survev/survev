import { webtHelpers } from "../../../shared/net/connection.ts";
import type { GameWsDisconnectReason } from "../../../shared/types/api.ts";

export abstract class ClientSocket<T extends object> {
    private _userData?: WeakRef<T>;
    setUserData(data: T) {
        this._userData = new WeakRef(data);
    }
    getUserData(): T | undefined {
        return this._userData?.deref();
    }
    supportsUnreliable = false;
    abstract ip(): string;
    abstract closed(): boolean;
    abstract send(data: Uint8Array<ArrayBuffer>): void;
    abstract sendUnreliable(data: Uint8Array<ArrayBuffer>): void;
    abstract close(reason?: GameWsDisconnectReason): void;
}

export class NoOpSocket<T extends object> extends ClientSocket<T> {
    private _closed = false;
    ip(): string {
        return "";
    }
    closed(): boolean {
        return this._closed;
    }
    send(): void {}
    sendUnreliable(): void {}
    close(): void {
        this._closed = true;
    }
}

import type { WebTransportSession } from "../../node_modules/@fails-components/webtransport/dist/lib/index.node.d.ts";
export class WebTransportSocket<T extends object> extends ClientSocket<T> {
    transport!: WebTransportSession;

    _closed = false;
    override closed() {
        return this._closed;
    }

    private _ip: string;
    override ip() {
        return this._ip;
    }

    override supportsUnreliable = true;

    private _sendOrder = 0;

    private _datagramWriter: WritableStreamDefaultWriter;
    private _nextDatagramOutSeq = 0;

    constructor(transport: WebTransportSession, ip: string) {
        super();
        this._ip = ip;
        this.transport = transport;

        this.supportsUnreliable = transport.reliability === "supports-unreliable";
        this._datagramWriter = this.transport.datagrams.createWritable().getWriter();
    }

    override async send(data: Uint8Array<ArrayBuffer>) {
        try {
            const stream = await this.transport.createUnidirectionalStream({
                sendOrder: this._sendOrder++,
                sendGroup: null,
            });
            const writer = stream.getWriter();
            await writer.write(data);
            writer.releaseLock();
            await stream.close();
        } catch (e) {
            console.error("Webtransport send error:", e);
            this.close();
        }
    }

    async sendUnreliable(data: Uint8Array<ArrayBuffer>) {
        try {
            const seq = this._nextDatagramOutSeq++;
            const buff = webtHelpers.writeDatagram(seq, data);

            await this._datagramWriter.write(buff);
        } catch (e) {
            console.error("Webtransport datagram send error:", e);
            this.close();
        }
    }

    override async close(reason?: GameWsDisconnectReason) {
        this._closed = true;
        this.transport.close({
            reason: reason ?? "",
            closeCode: 0,
        });
    }
}
