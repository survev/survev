import type { AbstractMsg, BitStream } from "./net";

export class DropItemMsg implements AbstractMsg {
    item = "";
    weapIdx = 0;

    serialize(s: BitStream) {
        s.writeGameType(this.item);
        s.writeUint8(this.weapIdx);
    }

    deserialize(s: BitStream) {
        this.item = s.readGameType();
        this.weapIdx = s.readUint8();
    }
}
