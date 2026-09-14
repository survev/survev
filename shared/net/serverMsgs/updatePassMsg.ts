import { type AbstractServerMsg, ServerMsgType } from "../constants.ts";
import type { BitStream } from "../stream.ts";

export class UpdatePassMsg implements AbstractServerMsg {
    readonly type = ServerMsgType.UpdatePass;

    serialize(_e: BitStream) {}
    deserialize(_e: BitStream) {}
}
