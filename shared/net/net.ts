import { GameObjectDefs } from "../defs/gameObjectDefs";
import { MapObjectDefs } from "../defs/mapObjectDefs";
import * as bb from "../lib/bitBuffer";
import { math } from "../utils/math";
import { assert } from "../utils/util";
import type { Vec2 } from "../utils/v2";

const DEV_MODE = false;

export interface Msg {
    serialize: (s: BitStream) => void;
}

export abstract class AbstractMsg {
    abstract serialize(s: BitStream): void;
    abstract deserialize(s: BitStream): void;
}

/**
 * Map type strings to integers for more efficient serialization.
 */
class ConfigTypeMap {
    _typeToId: Record<string, number> = {};
    _idToType: Record<number, string> = {};
    nextId = 0;
    maxId: number;

    constructor(typeBits: number) {
        this.maxId = 2 ** typeBits;
        this.addType("");
    }

    addType(type: string) {
        assert(
            this._typeToId[type] === undefined,
            `Type ${type} has already been defined!`,
        );
        assert(this.nextId < this.maxId);
        this._typeToId[type] = this.nextId;
        this._idToType[this.nextId] = type;
        this.nextId++;
    }

    typeToId(type: string) {
        const id = this._typeToId[type];
        assert(id !== undefined, `Invalid type ${type}`);
        return id;
    }

    idToType(id: number) {
        const type = this._idToType[id];
        if (type === undefined) {
            console.error(
                "Invalid id given to idToType",
                id,
                "max",
                Object.keys(this._idToType).length,
            );
        }
        return type;
    }
}

function createTypeSerialization(
    type: string,
    typeList: Record<string, unknown>,
    bitsPerType: number,
) {
    const typeMap = new ConfigTypeMap(bitsPerType);

    const types = Object.keys(typeList);
    assert(
        types.length <= typeMap.maxId,
        `${type} contains ${types.length} types, max ${typeMap.maxId}`,
    );
    for (let i = 0; i < types.length; i++) {
        typeMap.addType(types[i]);
    }

    if (DEV_MODE) {
        console.log(`Used ${typeMap.nextId} / ${typeMap.maxId} ${type} types`);
    }

    // Create serialization functions
    /* bb.BitStream.prototype[`write${type}Type`] = function(v) {
        this.writeBits(typeMap.typeToId(v), bitsPerType);
    };
    bb.BitStream.prototype[`read${type}Type`] = function() {
        return typeMap.idToType(this.readBits(bitsPerType));
    }; */

    return typeMap;
}

const gameTypeSerialization = createTypeSerialization("Game", GameObjectDefs, 10);
const mapTypeSerialization = createTypeSerialization("Map", MapObjectDefs, 12);

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
        this.writeBits(gameTypeSerialization.typeToId(type), 10);
    }

    readGameType() {
        return gameTypeSerialization.idToType(this.readBits(10));
    }

    writeMapType(type: string) {
        this.writeBits(mapTypeSerialization.typeToId(type), 12);
    }

    readMapType() {
        return mapTypeSerialization.idToType(this.readBits(12));
    }
}

//
// MsgStream
//

export class MsgStream {
    stream: BitStream;
    arrayBuf: ArrayBuffer;

    constructor(buf: ArrayBuffer | Uint8Array) {
        const arrayBuf =
            buf instanceof ArrayBuffer
                ? buf
                : buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

        if (!(arrayBuf instanceof ArrayBuffer)) {
            throw new Error(
                `Invalid buf type ${
                    typeof buf === "undefined" ? "undefined" : typeof buf
                }`,
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

export const Constants = {
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

export enum MsgType {
    None,
    Join,
    Disconnect,
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
}

export class UpdatePassMsg {
    serialize(_e: BitStream) {}
    deserialize(_e: BitStream) {}
}

export { AliveCountsMsg } from "./aliveCountsMsg";
export { DisconnectMsg } from "./disconnectMsg";
export { DropItemMsg } from "./dropItemMsg";
export { EditMsg } from "./editMsg";
export { EmoteMsg } from "./emoteMsg";
export { GameOverMsg } from "./gameOverMsg";
export { InputMsg } from "./inputMsg";
export { JoinedMsg } from "./joinedMsg";
export { JoinMsg } from "./joinMsg";
export { KillMsg } from "./killMsg";
export { MapMsg } from "./mapMsg";
export { PerkModeRoleSelectMsg } from "./perkModeRoleSelectMsg";
export { PickupMsg } from "./pickupMsg";
export { PlayerStatsMsg } from "./playerStatsMsg";
export { RoleAnnouncementMsg } from "./roleAnnouncementMsg";
export { SpectateMsg } from "./spectateMsg";
export { getPlayerStatusUpdateRate, UpdateMsg } from "./updateMsg";
