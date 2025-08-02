import type { AbstractMsg, BitStream } from "./net";

export class AliveCountsMsg implements AbstractMsg {
    teamAliveCounts: number[] = [];

    serialize(s: BitStream) {
        s.writeArray(this.teamAliveCounts, 8, (count) => {
            s.writeUint8(count);
        });
    }

    deserialize(s: BitStream) {
        this.teamAliveCounts = s.readArray(8, () => {
            return s.readUint8();
        });
    }
}
