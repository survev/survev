import { GameObjectDefs, MapObjectDefs } from "../defs/register.ts";
import * as bb from "../lib/bitBuffer.ts";
import type { Collider } from "../utils/coldet.ts";
import { collider } from "../utils/collider.ts";
import { math } from "../utils/math.ts";
import { assert } from "../utils/util.ts";
import type { Vec2 } from "../utils/v2.ts";
import { Constants } from "./constants.ts";

export class BitStream extends bb.BitStream {
    writeString(str: string, len?: number) {
        this.writeASCIIString(str, len);
    }

    readString(len?: number) {
        return this.readASCIIString(len);
    }

    writeFloat(f: number, min: number, max: number, bits: number) {
        /* STRIP_FROM_PROD_SERVER:START */
        assert(bits > 0 && bits < 31);
        assert(
            f >= min && f <= max,
            `writeFloat: value out of range: ${f}, range: [${min}, ${max}]`,
        );
        /* STRIP_FROM_PROD_SERVER:END */
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
