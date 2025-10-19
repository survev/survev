import { GameConfig } from "../gameConfig";
import { assert } from "../utils/util";

/**
 * The recording data uses the following format:
 *
 * Recording header:
 * - Uint32 Recorder version
 * - Uint32 Game Protocol version
 *
 * Then it will read packets until there's no more data left on the buffer
 *
 * The packet format is:
 * - Uint16 Delta timestamp: the time between the last packet and the one we are reading, 0 for the first packet
 * - Uint8 Packet type: if its a packet the client sent or the server sent
 * - Uint16 Packet size: The size of the packet in bytes
 * - Packet data: The data of the packet, with the length being the size we just read
 */

export enum PacketType {
    Server,
    Client,
}

export interface Packet {
    delay: number;
    type: PacketType;
    data: Uint8Array;
}

export class PacketRecorder {
    static VERSION = 1;

    private uint8Buff: Uint8Array;
    private view: DataView;

    private index = 0;
    recording = false;

    private lastPacketTime = 0;

    private constructor(buff: ArrayBuffer) {
        this.uint8Buff = new Uint8Array(buff);
        this.view = new DataView(buff);
    }

    /**
     * @param maxSize Max size in bytes the recording buffer can be, defaults to 1 megabyte (1 << 20)
     */
    static create(maxSize = 1 << 20) {
        return new PacketRecorder(new ArrayBuffer(maxSize));
    }

    static fromBuffer(buff: ArrayBuffer) {
        return new PacketRecorder(buff);
    }

    startRecording() {
        if (this.recording) {
            console.error(`Already recording!`);
            return;
        }

        this.recording = true;

        this.writeHeader();

        this.lastPacketTime = Date.now();
    }

    stopRecording() {
        if (!this.recording) return;

        this.recording = false;
        console.log("Stopped recording.");
    }

    addPacket(type: PacketType, data: Uint8Array) {
        if (!this.recording) {
            console.error("Must call `startRecording` first!");
            return;
        }

        // new index after the writes are done
        const newIndex =
            this.index +
            2 + // timestamp
            1 + // type
            2 + // size
            data.byteLength;

        // forcefully stop recording if we ran out of space
        // todo: maybe just resize the buffer?
        if (newIndex > this.view.byteLength) {
            this.stopRecording();
            return;
        }

        this.writePacket(type, data);

        // make sure the numbers hardcoded for newIndex are in sync with the actual packet size :)
        assert(
            this.index === newIndex,
            "Packet size and new index calculation out of sync",
        );
    }

    readEverything() {
        assert(!this.recording, "Can't read while still recording!");

        this.index = 0;

        const header = this.readHeader();

        const packets: Packet[] = [];

        while (this.index < this.view.byteLength) {
            const packet = this.readPacket();
            packets.push(packet);
        }

        return {
            header,
            packets,
        };
    }

    getData() {
        return this.uint8Buff.slice(0, this.index);
    }

    private writeUint8(value: number): void {
        this.view.setUint8(this.index, value);
        this.index += 1;
    }

    private writeUint16(value: number): void {
        this.view.setUint16(this.index, value);
        this.index += 2;
    }

    private writeUint32(value: number): void {
        this.view.setUint32(this.index, value);
        this.index += 4;
    }

    private readUint8(): number {
        const value = this.view.getUint8(this.index);
        this.index += 1;
        return value;
    }

    private readUint16(): number {
        const value = this.view.getUint16(this.index);
        this.index += 2;
        return value;
    }

    private readUint32(): number {
        const value = this.view.getUint32(this.index);
        this.index += 4;
        return value;
    }

    private writeHeader() {
        this.writeUint32(PacketRecorder.VERSION);
        this.writeUint32(GameConfig.protocolVersion);
    }

    private readHeader() {
        const recordingVersion = this.readUint32();
        const protocolVersion = this.readUint32();

        return {
            recordingVersion,
            protocolVersion,
        };
    }

    private writeBuffer(buff: Uint8Array) {
        assert(buff.byteLength < 1 << 16, "Buffer is too big!");

        this.writeUint16(buff.byteLength);

        this.uint8Buff.set(buff, this.index);
        this.index += buff.byteLength;
    }

    private readBuffer() {
        const length = this.readUint16();
        // const buff = new Uint8Array(this.uint8Buff, this.index, length);

        const buff = this.uint8Buff.slice(this.index, this.index + length);

        this.index += length;
        return buff;
    }

    private writePacket(type: PacketType, data: Uint8Array) {
        const now = Date.now();
        this.writeUint16(now - this.lastPacketTime);
        this.writeUint8(type);

        this.writeBuffer(data);

        this.lastPacketTime = now;
    }

    private readPacket(): Packet {
        const timeStamp = this.readUint16();
        const type = this.readUint8() as PacketType;

        const data = this.readBuffer();

        return {
            delay: timeStamp,
            type,
            data,
        };
    }
}
