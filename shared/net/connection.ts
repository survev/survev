// matches WebSocket.readyState
export enum ConnectionState {
    Connecting = 0,
    Open = 1,
    Closing = 2,
    Closed = 3,
}

export abstract class Connection {
    onOpen = () => {};
    onMessage: (message: ArrayBuffer) => void = () => {};
    onError = () => {};
    onClose: (code: number, reason: string) => void = () => {};

    abstract readonly state: ConnectionState;

    abstract readonly bufferedAmount: number;

    abstract supportsUnreliable: boolean;

    resetAndClose() {
        this.onOpen = () => {};
        this.onMessage = () => {};
        this.onError = () => {};
        this.onClose = () => {};
        this.close();
    }

    abstract send(data: Uint8Array<ArrayBuffer>): void;
    abstract sendUnreliable(data: Uint8Array<ArrayBuffer>): void;
    abstract close(reason?: string): void;
}

export class WebsocketConnection extends Connection {
    ws: WebSocket;

    get state(): ConnectionState {
        return this.ws.readyState;
    }

    get bufferedAmount(): number {
        return this.ws.bufferedAmount;
    }

    supportsUnreliable = false;

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
            this.onClose(e.code, e.reason);
        };
        this.ws.onerror = () => {
            this.onError();
        };
    }

    send(data: Uint8Array<ArrayBuffer>) {
        this.ws.send(data);
    }

    sendUnreliable() {
        throw new Error("Websockets don't support unreliable messages");
    }

    close(reason?: string): void {
        if (reason) {
            this.ws.close(3000, reason);
        } else {
            this.ws.close();
        }
    }
}

export class ChunkReader {
    private readingChunks = false;
    private nextPacketFullSize = 0;
    private nextPacketIncrementingSize = 0;
    private nextPacketChunks: Uint8Array<ArrayBuffer>[] = [];

    private packets: Uint8Array<ArrayBuffer>[] = [];

    private readingHeader = false;
    private headerBuffer = new Uint8Array(4);
    private headerIdx = 0;

    addChunk(chunk: Uint8Array<ArrayBuffer>) {
        if (!this.readingChunks) {
            let headerSize = 4;
            let packetSize: number;
            if (chunk.length < headerSize || this.readingHeader) {
                const oldIdx = this.headerIdx;
                const toRead = Math.min(headerSize - this.headerIdx, chunk.length);
                for (let i = 0; i < toRead; i++) {
                    this.headerBuffer[this.headerIdx] = chunk[i];
                    this.headerIdx++;
                }
                if (this.headerIdx === headerSize) {
                    this.readingHeader = false;
                    packetSize = new DataView(this.headerBuffer.buffer).getUint32(0, true);
                    headerSize -= oldIdx;
                } else {
                    this.readingHeader = true;
                    return;
                }
            } else {
                const view = new DataView(chunk.buffer);
                packetSize = view.getUint32(chunk.byteOffset, true);
            }

            this.headerIdx = 0;

            const chunkSizeWithoutHeader = chunk.length - headerSize;

            if (chunkSizeWithoutHeader === packetSize) {
                this.packets.push(chunk.slice(headerSize, chunk.length));
            } else if (chunkSizeWithoutHeader < packetSize) {
                this.readingChunks = true;
                this.nextPacketFullSize = packetSize;
                this.nextPacketIncrementingSize = 0;
                this.nextPacketChunks.length = 0;

                if (chunkSizeWithoutHeader > 0) {
                    this.nextPacketChunks.push(chunk.slice(headerSize, chunk.length));
                    this.nextPacketIncrementingSize += chunkSizeWithoutHeader;
                }
            } else if (chunkSizeWithoutHeader > packetSize) {
                this.packets.push(chunk.slice(headerSize, headerSize + packetSize));
                this.addChunk(chunk.slice(headerSize + packetSize, chunk.length));
            }
        } else {
            const newSize = this.nextPacketIncrementingSize + chunk.length;
            if (newSize === this.nextPacketFullSize) {
                this.nextPacketChunks.push(chunk);
                this.nextPacketIncrementingSize += chunk.length;
                this.combineChunks();
            } else if (newSize < this.nextPacketFullSize) {
                this.nextPacketIncrementingSize += chunk.length;
                this.nextPacketChunks.push(chunk);
            } else if (newSize > this.nextPacketFullSize) {
                const missingBytes = this.nextPacketFullSize - this.nextPacketIncrementingSize;
                this.addChunk(chunk.slice(0, missingBytes));
                this.addChunk(chunk.slice(missingBytes, chunk.length));
            }
        }
    }

    combineChunks() {
        const merged = new Uint8Array(this.nextPacketFullSize);
        for (let i = 0, offset = 0; i < this.nextPacketChunks.length; i++) {
            const buff = this.nextPacketChunks[i];
            merged.set(buff, offset);
            offset += buff.length;
        }
        this.packets.push(merged);

        this.nextPacketChunks.length = 0;
        this.readingChunks = false;
        this.nextPacketIncrementingSize = 0;
        this.nextPacketFullSize = 0;
    }

    getPackets(): ArrayBuffer[] {
        const packets = this.packets;
        this.packets = [];
        return packets.map(p => p.buffer.slice(p.byteOffset, p.byteLength));
    }
}

type Uint8RS = ReadableStream<Uint8Array<ArrayBuffer>>;
export const webtHelpers = {
    async readIcomingStream(stream: Uint8RS, maxSize: number) {
        const buffers: Uint8Array[] = [];
        let size = 0;
        for await (const data of stream) {
            buffers.push(data);
            if (size + data.byteLength > maxSize) {
                break;
            }
            size += data.byteLength;
        }
        const bigBuff = new Uint8Array(size);
        for (let i = 0, offset = 0; i < buffers.length; i++) {
            bigBuff.set(buffers[i], offset);
            offset += buffers[i].byteLength;
        }
        return bigBuff.buffer;
    },

    writeDatagram(seq: number, data: Uint8Array<ArrayBuffer>) {
        const buff = new Uint8Array(data.byteLength + 4);
        const view = new DataView(buff.buffer);
        view.setUint32(0, seq, true);
        buff.set(data, 4);
        return buff;
    },

    readDatagram(data: Uint8Array<ArrayBuffer>) {
        const view = new DataView(data.buffer);
        const seq = view.getUint32(0, true);
        const contents = data.slice(4, data.byteLength);
        return {
            seq,
            contents,
        };
    },
};

export class WebTransportConnection extends Connection {
    transport!: WebTransport;

    private _state = ConnectionState.Connecting;
    get state(): ConnectionState {
        return this._state;
    }

    get bufferedAmount(): number {
        return 0;
    }

    override supportsUnreliable = true;

    private _sendOrder = 0;

    writableUniStream!: WritableStream;
    private _datagramWriter!: WritableStreamDefaultWriter;
    private _nextDatagramOutSeq = 0;

    constructor(address: string, hashes: WebTransportHash[]) {
        super();
        this.transport = new WebTransport(address, {
            serverCertificateHashes: hashes,
            congestionControl: "low-latency",
        });

        // this.transport.datagrams.incomingMaxAge = 100;

        this.transport.ready.then(() => {
            // datagrams.writable.getWriter() is deprecated
            // need to use `datagrams.createWritable()` instead
            // but chrome doesn't support that yet!
            // so we fallback to the deprecated version
            // const writable = this.writableDatagram ?? this.transport.datagrams.writable;
            if ("createWritable" in this.transport.datagrams) {
                // @ts-expect-error no types for this...
                const writable = this.transport.datagrams.createWritable();
                this._datagramWriter = writable.getWriter();
            } else {
                this._datagramWriter = this.transport.datagrams.writable.getWriter();
            }

            (async () => {
                for await (const stream of this.transport.incomingUnidirectionalStreams) {
                    const chunkReader = new ChunkReader();
                    for await (const data of stream) {
                        chunkReader.addChunk(data);
                        for (const packet of chunkReader.getPackets()) {
                            this.onMessage?.(packet);
                        }
                    }
                }
            })();

            (async () => {
                let lastSeq = -1;
                for await (const data of this.transport.datagrams.readable as Uint8RS) {
                    const { seq, contents } = webtHelpers.readDatagram(data);
                    if (seq <= lastSeq) continue;
                    lastSeq = seq;
                    this.onMessage?.(contents.buffer);
                }
            })();

            if ("reliability" in this.transport) {
                this.supportsUnreliable = this.transport.reliability === "supports-unreliable";
            }

            this.transport.createUnidirectionalStream().then((s) => {
                this.writableUniStream = s;
                this._state = ConnectionState.Open;
                this.onOpen();
            });
        }).catch(err => {
            console.error(err);
            this.onError();
        });

        this.transport.closed.then((e) => {
            this._state = ConnectionState.Closed;
            this.onClose?.(e.closeCode || 0, e.reason || "");
        }).catch(e => {
            console.error("web transport error:", e);
            this._state = ConnectionState.Closed;
            this.onClose?.(e.closeCode || 0, e.reason || "");
        });
    }

    override send(data: Uint8Array<ArrayBuffer>) {
        try {
            const stream = this.writableUniStream;
            if (stream.locked) {
                console.error("Writable stream is locked");
                return;
            }

            const writer = stream.getWriter();
            const view = new DataView(new ArrayBuffer(4));
            view.setUint32(0, data.length, true);
            writer.write(view.buffer);
            writer.write(data);
            writer.releaseLock();
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

    override async close() {
        this.transport.close();
        this._state = ConnectionState.Closed;
    }
}
