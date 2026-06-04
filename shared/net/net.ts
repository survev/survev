import { GameObjectDefs, MapObjectDefs } from "../defs/register.ts";
import { GameConfig } from "../gameConfig.ts";
import * as bb from "../lib/bitBuffer.ts";
import type { Collider } from "../utils/coldet.ts";
import { collider } from "../utils/collider.ts";
import { math } from "../utils/math.ts";
import { assert } from "../utils/util.ts";
import type { Vec2 } from "../utils/v2.ts";

export const Constants = {
    MaxPosition: 1024,
    MapNameMaxLen: 24,
    PlayerNameMaxLen: 16,
    MouseMaxDist: 64,
    SmokeMaxRad: 10,
    ActionMaxDuration: 8.5,
    AirstrikeZoneMaxRad: 256,
    AirstrikeZoneMaxDuration: 60,
    PlayerMinScale: 0.75,
    PlayerMaxScale: 2,
    MapObjectMinScale: 0.125,
    MapObjectMaxScale: 2.5,
    MaxPerks: 8,
    MaxMapIndicators: 16,
};

const getBits = (n: number) => Math.ceil(Math.log2(n));

export const BitSizes = {
    Action: getBits(GameConfig.Action.Count),
    Anim: getBits(GameConfig.Anim.Count),
    Haste: getBits(GameConfig.HasteType.Count),
    Perks: getBits(Constants.MaxPerks),
    MapIndicators: getBits(Constants.MaxMapIndicators),
};

export interface Msg {
    serialize: (s: BitStream) => void;
}

export abstract class AbstractMsg {
    abstract serialize(s: BitStream): void;
    abstract deserialize(s: BitStream): void;
}

export class BitStream extends bb.BitStream {
    writeString(str: string, len?: number) {
        this.writeASCIIString(str, len);
    }

    readString(len?: number) {
        return this.readASCIIString(len);
    }

    writeFloat(f: number, min: number, max: number, bits: number) {
        assert(bits > 0 && bits < 31);
        assert(
            f >= min && f <= max,
            `writeFloat: value out of range: ${f}, range: [${min}, ${max}]`,
        );
        const range = (1 << bits) - 1;
        const x = math.clamp(f, min, max);
        const t = (x - min) / (max - min);
        const v = t * range + 0.5;
        this.writeBits(v, bits);
    }

    readFloat(min: number, max: number, bits: number) {
        assert(bits > 0 && bits < 31);
        const range = (1 << bits) - 1;
        const x = this.readBits(bits);
        const t = x / range;
        const v = min + t * (max - min);
        return v;
    }

    writeVec(
        vec: Vec2,
        minX: number,
        minY: number,
        maxX: number,
        maxY: number,
        bitCount: number,
    ) {
        this.writeFloat(vec.x, minX, maxX, bitCount);
        this.writeFloat(vec.y, minY, maxY, bitCount);
    }

    readVec(minX: number, minY: number, maxX: number, maxY: number, bitCount: number) {
        return {
            x: this.readFloat(minX, maxX, bitCount),
            y: this.readFloat(minY, maxY, bitCount),
        };
    }

    writeMapPos(vec: Vec2, bitCount = 16) {
        this.writeVec(vec, 0, 0, Constants.MaxPosition, Constants.MaxPosition, bitCount);
    }

    readMapPos(bitCount = 16): Vec2 {
        return this.readVec(0, 0, Constants.MaxPosition, Constants.MaxPosition, bitCount);
    }

    writeUnitVec(vec: Vec2, bitCount: number) {
        this.writeVec(vec, -1.0001, -1.0001, 1.0001, 1.0001, bitCount);
    }

    readUnitVec(bitCount: number) {
        return this.readVec(-1.0001, -1.0001, 1.0001, 1.0001, bitCount);
    }

    writeVec32(vec: Vec2) {
        this.writeFloat32(vec.x);
        this.writeFloat32(vec.y);
    }

    readVec32() {
        return {
            x: this.readFloat32(),
            y: this.readFloat32(),
        };
    }

    writeBytes(src: BitStream, offset: number, length: number) {
        assert(this.index % 8 == 0);
        const data = new Uint8Array(src._view.view.buffer, offset, length);
        this._view.view.set(data, this.index / 8);
        this.index += length * 8;
    }

    writeAlignToNextByte() {
        const offset = 8 - (this.index % 8);
        if (offset < 8) this.writeBits(0, offset);
    }

    readAlignToNextByte() {
        const offset = 8 - (this.index % 8);
        if (offset < 8) this.readBits(offset);
    }

    writeGameType(type: string) {
        this.writeBits(GameObjectDefs.typeToId(type), 10);
    }

    readGameType() {
        return GameObjectDefs.idToType(this.readBits(10));
    }

    writeMapType(type: string) {
        this.writeBits(MapObjectDefs.typeToId(type), 12);
    }

    readMapType() {
        return MapObjectDefs.idToType(this.readBits(12));
    }

    writeArray<T>(array: T[], bits: number, writeFn: (item: T, index: number) => void) {
        assert(bits > 0 && bits < 31);

        let length = array.length;
        const maxSize = (1 << bits) - 1;
        if (length > maxSize) {
            console.trace(
                `writeArray: Array overflow, size: ${length} max size: ${maxSize}`,
            );
            length = maxSize;
        }

        this.writeBits(length, bits);

        for (let i = 0; i < length; i++) {
            const item = array[i];
            writeFn(item, i);
        }
    }

    readArray<T>(bits: number, readFn: (index: number) => T): T[] {
        assert(bits > 0 && bits < 31);

        const length = this.readBits(bits);
        const array = new Array(length);

        for (let i = 0; i < length; i++) {
            array[i] = readFn(i);
        }

        return array;
    }
    // thanks leia - hppig
    writeCollider(col: Collider) {
        this.writeUint8(col.type);
        if (col.type === collider.Type.Circle) {
            this.writeMapPos(col.pos);
            this.writeFloat(col.rad, 0, Constants.MaxPosition, 16);
        } else {
            this.writeMapPos(col.min);
            this.writeMapPos(col.max);
        }
    }

    readCollider(): Collider {
        const type = this.readUint8();
        if (type === collider.Type.Circle) {
            return collider.createCircle(
                this.readMapPos(),
                this.readFloat(0, Constants.MaxPosition, 16),
            );
        } else {
            return collider.createAabb(
                this.readMapPos(),
                this.readMapPos(),
            );
        }
    }
}

//
// MsgStream
//

export class MsgStream {
    stream: BitStream;
    arrayBuf: ArrayBuffer;

    constructor(buf: ArrayBuffer | Uint8Array) {
        const arrayBuf = buf instanceof ArrayBuffer
            ? buf
            : buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

        if (!(arrayBuf instanceof ArrayBuffer)) {
            throw new Error(
                `Invalid buf type ${typeof buf === "undefined" ? "undefined" : typeof buf}`,
            );
        }
        this.arrayBuf = arrayBuf;
        this.stream = new BitStream(arrayBuf);
    }

    getBuffer() {
        return new Uint8Array(this.arrayBuf, 0, this.stream.byteIndex);
    }

    getStream() {
        return this.stream;
    }

    serializeMsg(type: MsgType, msg: Msg) {
        assert(this.stream.index % 8 == 0);
        this.stream.writeUint8(type);
        msg.serialize(this.stream);
        this.stream.writeAlignToNextByte();
    }

    serializeMsgStream(type: number, stream: BitStream) {
        assert(this.stream.index % 8 == 0 && stream.index % 8 == 0);
        this.stream.writeUint8(type);
        this.stream.writeBytes(stream, 0, stream.index / 8);
    }

    deserializeMsgType() {
        if (this.stream.length - this.stream.byteIndex * 8 >= 1) {
            return this.stream.readUint8();
        }
        return MsgType.None;
    }
}

export enum MsgType {
    None,
    // DON'T EVEN THINK ABOUT REORDERING THINGS HERE!!!!
    // JoinMsg should always be ID 1 to not break protocol version check with old clients!
    // And DisconnectMsg should always be ID 2, so it receives errors from JoinMsg Properly
    // Please add new Msg Types always to the end of the enum to stay as safe as possible
    Join = 1,
    Disconnect = 2,
    Input,
    Edit,
    Joined,
    Update,
    Kill,
    GameOver,
    Pickup,
    Map,
    Spectate,
    DropItem,
    Emote,
    PlayerStats,
    AdStatus,
    /* used for anti-cheat */
    Loadout,
    RoleAnnouncement,
    /* used for anti-cheat */
    Stats,
    UpdatePass,
    AliveCounts,
    PerkModeRoleSelect,
}

export enum PickupMsgType {
    Full,
    AlreadyOwned,
    AlreadyEquipped,
    BetterItemEquipped,
    Success,
    GunCannotFire,
    MaxPerks,
}

export class UpdatePassMsg {
    serialize(_e: BitStream) {}
    deserialize(_e: BitStream) {}
}

export { AliveCountsMsg } from "./aliveCountsMsg.ts";
export { DisconnectMsg } from "./disconnectMsg.ts";
export { DropItemMsg } from "./dropItemMsg.ts";
export { EditMsg } from "./editMsg.ts";
export { EmoteMsg } from "./emoteMsg.ts";
export { GameOverMsg } from "./gameOverMsg.ts";
export { InputMsg } from "./inputMsg.ts";
export { JoinedMsg } from "./joinedMsg.ts";
export { JoinMsg } from "./joinMsg.ts";
export { KillMsg } from "./killMsg.ts";
export { MapMsg } from "./mapMsg.ts";
export { PerkModeRoleSelectMsg } from "./perkModeRoleSelectMsg.ts";
export { PickupMsg } from "./pickupMsg.ts";
export { PlayerStatsMsg } from "./playerStatsMsg.ts";
export { RoleAnnouncementMsg } from "./roleAnnouncementMsg.ts";
export { SpectateMsg } from "./spectateMsg.ts";
export { getPlayerStatusUpdateRate, UpdateMsg } from "./updateMsg.ts";
