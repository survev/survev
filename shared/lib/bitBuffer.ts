/**
 * Patched BitView and BitBuffer
 * Original: https://github.com/inolen/bit-buffer/
 * Changes:
 * - Ported to typescript
 * - Custom min function for performance
 * - Removed big-endian support as we don't need it
 * - Better UTF-8 string handling using `TextDecoder` and `TextEncoder`
 */

// v8 Math.min performance SUCKS so use ternary instead
function min(a: number, b: number) {
    return a < b ? a : b;
}

declare class Buffer {
    byteLength: number;
    length: number;
}

/**********************************************************
 *
 * BitView
 *
 * BitView provides a similar interface to the standard
 * DataView, but with support for bit-level reads / writes.
 *
 **********************************************************/
export class BitView {
    // Used to massage fp values so we can operate on them
    // at the bit level.
    protected static _scratch = new DataView(new ArrayBuffer(8));

    protected _view: Uint8Array;

    constructor(source: ArrayBuffer | Buffer, byteOffset?: number, byteLength?: number) {
        const isBuffer =
            source instanceof ArrayBuffer ||
            (typeof Buffer !== "undefined" && source instanceof Buffer);

        if (!isBuffer) {
            throw new Error("Must specify a valid ArrayBuffer or Buffer.");
        }

        byteOffset = byteOffset || 0;
        byteLength =
            byteLength ||
            source.byteLength /* ArrayBuffer */ ||
            (source as Buffer).length /* Buffer */;

        this._view = new Uint8Array(source as ArrayBufferLike, byteOffset, byteLength);
    }

    get view() {
        return this._view;
    }

    get buffer() {
        return this._view.buffer;
    }

    get byteLength() {
        return this._view.length;
    }

    getBits(offset: number, bits: number, signed?: boolean) {
        const available = this._view.length * 8 - offset;

        if (bits > available) {
            throw new Error(
                `Cannot get ${bits} bit(s) from offset ${offset}, ${available} available`,
            );
        }

        let value = 0;
        for (let i = 0; i < bits; ) {
            const remaining = bits - i;
            const bitOffset = offset & 7;
            const currentByte = this._view[offset >> 3];

            // the max number of bits we can read from the current byte
            const read = min(remaining, 8 - bitOffset);

            // create a mask with the correct bit width
            const mask = (1 << read) - 1;
            // shift the bits we want to the start of the byte and mask of the rest
            const readBits = (currentByte >> bitOffset) & mask;
            value |= readBits << i;

            offset += read;
            i += read;
        }

        if (signed) {
            // If we're not working with a full 32 bits, check the
            // imaginary MSB for this bit count and convert to a
            // valid 32-bit signed value if set.
            if (bits !== 32 && value & (1 << (bits - 1))) {
                value |= -1 ^ ((1 << bits) - 1);
            }

            return value;
        }

        return value >>> 0;
    }

    setBits(offset: number, value: number, bits: number) {
        const available = this._view.length * 8 - offset;

        if (bits > available) {
            throw new Error(
                `Cannot set ${bits} bit(s) from offset ${offset}, ${available} available`,
            );
        }

        for (let i = 0; i < bits; ) {
            let wrote;

            // Write an entire byte if we can.
            if (bits - i >= 8 && (offset & 7) === 0) {
                this._view[offset >> 3] = value & 0xff;
                wrote = 8;
            } else {
                const remaining = bits - i;
                const bitOffset = offset & 7;
                const byteOffset = offset >> 3;
                wrote = min(remaining, 8 - bitOffset);
                // create a mask with the correct bit width
                const mask = ~(0xff << wrote);
                // shift the bits we want to the start of the byte and mask of the rest
                const writeBits = value & mask;

                // destination mask to zero all the bits we're changing first
                const destMask = ~(mask << bitOffset);

                this._view[byteOffset] =
                    (this._view[byteOffset] & destMask) | (writeBits << bitOffset);
            }

            value = value >> wrote;
            offset += wrote;
            i += wrote;
        }
    }

    getBoolean(offset: number) {
        return this.getBits(offset, 1, false) !== 0;
    }

    getInt8(offset: number) {
        return this.getBits(offset, 8, true);
    }

    getUint8(offset: number) {
        return this.getBits(offset, 8, false);
    }

    getInt16(offset: number) {
        return this.getBits(offset, 16, true);
    }

    getUint16(offset: number) {
        return this.getBits(offset, 16, false);
    }

    getInt32(offset: number) {
        return this.getBits(offset, 32, true);
    }

    getUint32(offset: number) {
        return this.getBits(offset, 32, false);
    }

    getFloat32(offset: number) {
        BitView._scratch.setUint32(0, this.getUint32(offset));
        return BitView._scratch.getFloat32(0);
    }

    getFloat64(offset: number) {
        BitView._scratch.setUint32(0, this.getUint32(offset));
        // DataView offset is in bytes.
        BitView._scratch.setUint32(4, this.getUint32(offset + 32));
        return BitView._scratch.getFloat64(0);
    }

    setBoolean(offset: number, value: boolean) {
        this.setBits(offset, value ? 1 : 0, 1);
    }

    setInt8(offset: number, value: number) {
        this.setBits(offset, value, 8);
    }

    setUint8(offset: number, value: number) {
        this.setBits(offset, value, 8);
    }

    setInt16(offset: number, value: number) {
        this.setBits(offset, value, 16);
    }

    setUint16(offset: number, value: number) {
        this.setBits(offset, value, 16);
    }

    setInt32(offset: number, value: number) {
        this.setBits(offset, value, 32);
    }

    setUint32(offset: number, value: number) {
        this.setBits(offset, value, 32);
    }

    setFloat32(offset: number, value: number) {
        BitView._scratch.setFloat32(0, value);
        this.setBits(offset, BitView._scratch.getUint32(0), 32);
    }

    setFloat64(offset: number, value: number) {
        BitView._scratch.setFloat64(0, value);
        this.setBits(offset, BitView._scratch.getUint32(0), 32);
        this.setBits(offset + 32, BitView._scratch.getUint32(4), 32);
    }
}

/**
 * Bit stream helpers
 */

type StreamTypes =
    | "Boolean"
    | "Int8"
    | "Uint8"
    | "Int16"
    | "Uint16"
    | "Int32"
    | "Uint32"
    | "Float32"
    | "Float64";

type GetFn = `get${StreamTypes}`;
type SetFn = `set${StreamTypes}`;

function reader<Name extends GetFn>(name: Name, size: number) {
    return function (this: BitStream) {
        if (this._index + size > this._length) {
            throw new Error("Trying to read past the end of the stream");
        }
        const val = this._view[name](this._index);
        this._index += size;
        return val as ReturnType<BitView[Name]>;
    };
}

function writer<Name extends SetFn>(name: SetFn, size: number) {
    return function (this: BitStream, value: Parameters<BitView[Name]>[1]) {
        (this._view[name] as (index: number, v: typeof value) => void)(
            this._index,
            value,
        );
        this._index += size;
    };
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();

function readString(stream: BitStream, bytes?: number, utf8?: boolean) {
    if (bytes === 0) {
        return "";
    }
    let i = 0;
    const chars: number[] = [];
    let append = true;
    const fixedLength = !!bytes;
    if (!bytes) {
        bytes = Math.floor((stream.length - stream.index) / 8);
    }

    // Read while we still have space available, or until we've
    // hit the fixed byte length passed in.
    while (i < bytes) {
        const c = stream.readUint8();

        // Stop appending chars once we hit 0x00
        if (c === 0x00) {
            append = false;

            // If we don't have a fixed length to read, break out now.
            if (!fixedLength) {
                break;
            }
        }
        if (append) {
            chars.push(c);
        }

        i++;
    }

    if (utf8) {
        return decoder.decode(new Uint8Array(chars));
    }
    return String.fromCharCode.apply(null, chars);
}

/**********************************************************
 *
 * BitStream
 *
 * Small wrapper for a BitView to maintain your position,
 * as well as to handle reading / writing of string data
 * to the underlying buffer.
 *
 **********************************************************/
export class BitStream {
    protected _view: BitView;
    protected _index = 0;
    protected _startIndex = 0;
    protected _length: number;

    constructor(
        source: ArrayBuffer | Buffer | BitView,
        byteOffset?: number,
        byteLength?: number,
    ) {
        const isBuffer =
            source instanceof ArrayBuffer ||
            (typeof Buffer !== "undefined" && source instanceof Buffer);

        if (!(source instanceof BitView) && !isBuffer) {
            throw new Error("Must specify a valid BitView, ArrayBuffer or Buffer");
        }

        if (isBuffer) {
            this._view = new BitView(source as ArrayBuffer, byteOffset, byteLength);
        } else {
            this._view = source as BitView;
        }

        this._length = this._view.byteLength * 8;
    }

    get index() {
        return this._index - this._startIndex;
    }
    set index(val: number) {
        this._index = val + this._startIndex;
    }

    get length() {
        return this._length - this._startIndex;
    }

    set length(val: number) {
        this._length = val + this._startIndex;
    }

    get bitsLeft() {
        return this._length - this._index;
    }

    get byteIndex() {
        // Ceil the returned value, over compensating for the amount of
        // bits written to the stream.
        return Math.ceil(this._index / 8);
    }

    set byteIndex(val: number) {
        this._index = val * 8;
    }

    get buffer() {
        return this._view.buffer;
    }

    get view() {
        return this._view;
    }

    readBits(bits: number, signed?: boolean) {
        const val = this._view.getBits(this._index, bits, signed);
        this._index += bits;
        return val;
    }

    writeBits(value: number, bits: number) {
        this._view.setBits(this._index, value, bits);
        this._index += bits;
    }

    declare readBoolean: () => boolean;
    declare readInt8: () => number;
    declare readUint8: () => number;
    declare readInt16: () => number;
    declare readUint16: () => number;
    declare readInt32: () => number;
    declare readUint32: () => number;
    declare readFloat32: () => number;
    declare readFloat64: () => number;

    declare writeBoolean: (value: boolean) => void;
    declare writeInt8: (value: number) => void;
    declare writeUint8: (value: number) => void;
    declare writeInt16: (value: number) => void;
    declare writeUint16: (value: number) => void;
    declare writeInt32: (value: number) => void;
    declare writeUint32: (value: number) => void;
    declare writeFloat32: (value: number) => void;
    declare writeFloat64: (value: number) => void;

    readASCIIString(bytes?: number) {
        return readString(this, bytes, false);
    }

    readUTF8String(bytes?: number) {
        return readString(this, bytes, true);
    }

    writeASCIIString(string: string, bytes?: number) {
        const length = bytes || string.length + 1; // + 1 for NULL

        for (let i = 0; i < length; i++) {
            this.writeUint8(i < string.length ? string.charCodeAt(i) : 0x00);
        }
    }

    writeUTF8String(string: string, bytes?: number) {
        const byteArray = encoder.encode(string);

        const length = bytes || byteArray.length + 1; // + 1 for NULL
        for (let i = 0; i < length; i++) {
            this.writeUint8(i < byteArray.length ? byteArray[i] : 0x00);
        }
    }
}

BitStream.prototype.readBoolean = reader("getBoolean", 1);
BitStream.prototype.readInt8 = reader("getInt8", 8);
BitStream.prototype.readUint8 = reader("getUint8", 8);
BitStream.prototype.readInt16 = reader("getInt16", 16);
BitStream.prototype.readUint16 = reader("getUint16", 16);
BitStream.prototype.readInt32 = reader("getInt32", 32);
BitStream.prototype.readUint32 = reader("getUint32", 32);
BitStream.prototype.readFloat32 = reader("getFloat32", 32);
BitStream.prototype.readFloat64 = reader("getFloat64", 64);

BitStream.prototype.writeBoolean = writer("setBoolean", 1);
BitStream.prototype.writeInt8 = writer("setInt8", 8);
BitStream.prototype.writeUint8 = writer("setUint8", 8);
BitStream.prototype.writeInt16 = writer("setInt16", 16);
BitStream.prototype.writeUint16 = writer("setUint16", 16);
BitStream.prototype.writeInt32 = writer("setInt32", 32);
BitStream.prototype.writeUint32 = writer("setUint32", 32);
BitStream.prototype.writeFloat32 = writer("setFloat32", 32);
BitStream.prototype.writeFloat64 = writer("setFloat64", 64);
