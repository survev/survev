import { DamageType } from "../gameConfig";
import type { AbstractMsg, BitStream } from "./net";

export class AssistMsg implements AbstractMsg {
    targetId = 0;
    assisterId = 0;
    damageAmount = 0;
    assists = 0;
    

    serialize(s: BitStream) {
        /* STRIP_FROM_PROD_CLIENT:START */
        s.writeUint16(this.targetId);
        s.writeUint16(this.assisterId);
        s.writeUint16(this.damageAmount);
        s.writeUint16(this.assists);
        /* STRIP_FROM_PROD_CLIENT:END */
    }

    deserialize(s: BitStream) {
        this.targetId = s.readUint16();
        this.assisterId = s.readUint16();
        this.damageAmount = s.readUint16();
        this.assists = s.readUint16();
    }
}