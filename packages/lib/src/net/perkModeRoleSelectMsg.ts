import type { AbstractMsg, BitStream } from ".";

export class PerkModeRoleSelectMsg implements AbstractMsg {
    role = "";

    serialize(s: BitStream) {
        s.writeGameType(this.role);
        s.writeBits(0, 6);
    }

    deserialize(s: BitStream) {
        this.role = s.readGameType();
        s.readBits(6);
    }
}
