import { type AbstractClientMsg, ClientMsgType } from "../constants.ts";
import type { BitStream } from "../stream.ts";

export class DropItemMsg implements AbstractClientMsg {
    readonly type = ClientMsgType.DropItem;

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
