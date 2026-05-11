import type { AbstractMsg, BitStream } from "./net.ts";

export class RoleAnnouncementMsg implements AbstractMsg {
    playerId = 0;
    killerId = 0;
    role = "";
    assigned = false;
    killed = false;

    serialize(s: BitStream) {
        /* STRIP_FROM_PROD_CLIENT:START */
        s.writeUint16(this.playerId);
        s.writeUint16(this.killerId);
        s.writeGameType(this.role);
        s.writeBoolean(this.assigned);
        s.writeBoolean(this.killed);
        /* STRIP_FROM_PROD_CLIENT:END */
    }

    deserialize(s: BitStream) {
        this.playerId = s.readUint16();
        this.killerId = s.readUint16();
        this.role = s.readGameType();
        this.assigned = s.readBoolean();
        this.killed = s.readBoolean();
    }
}
