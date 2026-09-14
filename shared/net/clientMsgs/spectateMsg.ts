import { type AbstractClientMsg, ClientMsgType } from "../constants.ts";
import type { BitStream } from "../stream.ts";

export enum SpectateAction {
    None,
    Begin,
    Next,
    Prev,
}

export class SpectateMsg implements AbstractClientMsg {
    readonly type = ClientMsgType.Spectate;

    action: SpectateAction = SpectateAction.None;

    serialize(s: BitStream) {
        s.writeUint8(this.action);
    }

    deserialize(s: BitStream) {
        this.action = s.readUint8();
    }
}
