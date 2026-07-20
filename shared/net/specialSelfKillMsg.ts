// now while yes inputMsg.ts does exist it doesn't seem like the right file to add this in...
// then again what do I know :p
// anyway so that's why this exists now...

import type { AbstractMsg, BitStream } from "./net";

export class SpecialSelfKillMsg implements AbstractMsg {
    enabled = true;

    serialize(s: BitStream): void {
        s.writeBoolean(this.enabled);
    }

    deserialize(s: BitStream): void {
        this.enabled = s.readBoolean();
    }
}
