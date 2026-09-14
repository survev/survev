import { type AbstractClientMsg, ClientMsgType } from "../constants.ts";
import type { BitStream } from "../stream.ts";

export class PerkModeRoleSelectMsg implements AbstractClientMsg {
    readonly type = ClientMsgType.PerkModeRoleSelect;

    role = "";

    serialize(s: BitStream) {
        s.writeGameType(this.role);
    }

    deserialize(s: BitStream) {
        this.role = s.readGameType();
    }
}
