import type { AbstractMsg, BitStream } from "./net";

export class ReportMsg implements AbstractMsg {
    startRecording = false;

    serialize(s: BitStream) {
        s.writeBoolean(this.startRecording);
    }

    deserialize(s: BitStream) {
        this.startRecording = s.readBoolean();
    }
}
