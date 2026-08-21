// matches WebSocket.readyState
export enum ConnectionState {
    Connecting = 0,
    Open = 1,
    Closing = 2,
    Closed = 3,
}

export abstract class Connection {
    onOpen = () => {};
    onMessage = (_message: ArrayBuffer) => {};
    onError = () => {};
    onClose = (_reason?: string) => {};

    abstract readonly state: ConnectionState;

    resetAndClose() {
        this.onOpen = () => {};
        this.onMessage = () => {};
        this.onError = () => {};
        this.onClose = () => {};
        this.close();
    }

    abstract send(data: BufferSource): void;
    abstract close(reason?: string): void;
}

export class WebsocketConnection extends Connection {
    ws: WebSocket;

    get state(): ConnectionState {
        return this.ws.readyState;
    }

    constructor(address: string) {
        super();

        this.ws = new WebSocket(address);
        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = () => {
            this.onOpen();
        };
        this.ws.onmessage = (e) => {
            this.onMessage(e.data);
        };
        this.ws.onclose = (e) => {
            this.onClose(e.reason);
        };
        this.ws.onerror = () => {
            this.onError();
        };
    }

    send(data: BufferSource) {
        this.ws.send(data);
    }

    close(reason?: string): void {
        if (reason) {
            this.ws.close(3000, reason);
        } else {
            this.ws.close();
        }
    }
}
