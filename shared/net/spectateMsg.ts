import type { AbstractMsg, BitStream } from "./net.ts";

export enum SpectateAction {
    None,
    Begin,
    Next,
    Prev,
}

export class SpectateMsg implements AbstractMsg {
    action: SpectateAction = SpectateAction.None;

    serialize(s: BitStream) {
        s.writeUint8(this.action);
    }

    deserialize(s: BitStream) {
        this.action = s.readUint8();
    }
}
