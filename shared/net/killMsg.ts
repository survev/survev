import { DamageType } from "../gameConfig";
import type { AbstractMsg, BitStream } from "./net";

export class KillMsg implements AbstractMsg {
    itemSourceType = "";
    mapSourceType = "";
    damageType = DamageType.Player;
    targetId = 0;
    killerId = 0;
    killCreditId = 0;
    killerKills = 0;
    downed = false;
    killed = false;

    serialize(s: BitStream) {
        s.writeUint8(this.damageType);
        s.writeGameType(this.itemSourceType);
        s.writeMapType(this.mapSourceType);
        s.writeUint16(this.targetId);
        s.writeUint16(this.killerId);
        s.writeUint16(this.killCreditId);
        s.writeUint8(this.killerKills);
        s.writeBoolean(this.downed);
        s.writeBoolean(this.killed);
    }

    deserialize(s: BitStream) {
        this.damageType = s.readUint8();
        this.itemSourceType = s.readGameType();
        this.mapSourceType = s.readMapType();
        this.targetId = s.readUint16();
        this.killerId = s.readUint16();
        this.killCreditId = s.readUint16();
        this.killerKills = s.readUint8();
        this.downed = s.readBoolean();
        this.killed = s.readBoolean();
    }
}
