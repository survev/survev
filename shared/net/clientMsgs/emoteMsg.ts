import { v2 } from "../../utils/v2.ts";
import { type AbstractClientMsg, ClientMsgType } from "../constants.ts";
import type { BitStream } from "../stream.ts";

export class EmoteMsg implements AbstractClientMsg {
    readonly type = ClientMsgType.Emote;

    pos = v2.create(0, 0);
    emoteType = "";
    isPing = false;

    serialize(s: BitStream) {
        s.writeVec(this.pos, 0, 0, 1024, 1024, 16);
        s.writeGameType(this.emoteType);
        s.writeBoolean(this.isPing);
    }

    deserialize(s: BitStream) {
        this.pos = s.readVec(0, 0, 1024, 1024, 16);
        this.emoteType = s.readGameType();
        this.isPing = s.readBoolean();
    }
}
