import type { AbstractMsg, BitStream } from "./net";

export class ReportMsg implements AbstractMsg {
    start = false;
    end = false;

    serialize(s: BitStream) {
        s.writeBoolean(this.start);
        s.writeBoolean(this.end);
    }

    deserialize(s: BitStream) {
        this.start = s.readBoolean();
        this.end = s.readBoolean();
    }
}
