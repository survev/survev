import { DisconnectMsg } from "../../../shared/net/disconnectMsg.ts";
import { MsgStream, MsgType } from "../../../shared/net/net.ts";

export abstract class ClientSocket<T extends object> {
    private _userData?: WeakRef<T>;
    setUserData(data: T) {
        this._userData = new WeakRef(data);
    }
    getUserData(): T | undefined {
        return this._userData?.deref();
    }
    abstract ip(): string;
    abstract closed(): boolean;
    abstract send(data: Uint8Array<ArrayBuffer>): void;
    abstract close(): void;

    closeWithReason(reason: string) {
        const msg = new DisconnectMsg();
        msg.reason = reason;
        const buff = new ArrayBuffer(128);
        const stream = new MsgStream(buff);
        stream.serializeMsg(MsgType.Disconnect, msg);
        this.send(stream.getBuffer());
        this.close();
    }
}

export class NoOpSocket<T extends object> extends ClientSocket<T> {
    private _closed = false;
    ip(): string {
        return "";
    }
    closed(): boolean {
        return this._closed;
    }
    send(_data: Uint8Array<ArrayBuffer>): void {
        // womp
    }
    close(): void {
        this._closed = true;
    }
}
