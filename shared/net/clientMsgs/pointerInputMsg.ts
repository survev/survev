import { v2 } from "../../utils/v2.ts";
import { type AbstractClientMsg, ClientMsgType, Constants } from "../constants.ts";
import type { BitStream } from "../stream.ts";

export class PointerInputMsg implements AbstractClientMsg {
    readonly type = ClientMsgType.PointerInput;

    seq = 0;
    toMouseDir = v2.create(1, 0);
    toMouseLen = 0;

    serialize(s: BitStream) {
        s.writeUint8(this.seq);
        s.writeUnitVec(this.toMouseDir, 10);
        s.writeFloat(this.toMouseLen, 0, Constants.MouseMaxDist, 8);
    }

    deserialize(s: BitStream) {
        this.seq = s.readUint8();
        this.toMouseDir = s.readUnitVec(10);
        this.toMouseLen = s.readFloat(0, Constants.MouseMaxDist, 8);
    }
}
