import type { AbstractMsg, BitStream } from "./net.ts";

export class SpectateMsg implements AbstractMsg {
    specBegin = false;
    specNext = false;
    specPrev = false;
    specForce = false;
    specAnon = false;

    serialize(s: BitStream) {
        s.writeBoolean(this.specBegin);
        s.writeBoolean(this.specNext);
        s.writeBoolean(this.specPrev);
        s.writeBoolean(this.specForce);
        s.writeBoolean(this.specAnon);
    }

    deserialize(s: BitStream) {
        this.specBegin = s.readBoolean();
        this.specNext = s.readBoolean();
        this.specPrev = s.readBoolean();
        this.specForce = s.readBoolean();
        this.specAnon = s.readBoolean();
    }
}
