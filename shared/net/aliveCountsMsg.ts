import type { AbstractMsg, BitStream } from "./net.ts";

export class AliveCountsMsg implements AbstractMsg {
    teamAliveCounts: number[] = [];

    serialize(s: BitStream) {
        /* STRIP_FROM_PROD_CLIENT:START */
        s.writeArray(this.teamAliveCounts, 8, (count) => {
            s.writeUint8(count);
        });
        /* STRIP_FROM_PROD_CLIENT:END */
    }

    deserialize(s: BitStream) {
        this.teamAliveCounts = s.readArray(8, () => {
            return s.readUint8();
        });
    }
}
