import type { AbstractMsg, BitStream } from "./net";

export class PickupMsg implements AbstractMsg {
    type = 0;
    item = "";
    count = 0;

    serialize(s: BitStream) {
        s.writeUint8(this.type);
        s.writeGameType(this.item);
        s.writeUint8(this.count);
    }

    deserialize(s: BitStream) {
        this.type = s.readUint8();
        this.item = s.readGameType();
        this.count = s.readUint8();
    }
}
