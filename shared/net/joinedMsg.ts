import type { TeamMode } from "../gameConfig";
import type { AbstractMsg, BitStream } from "./net";

export class JoinedMsg implements AbstractMsg {
    teamMode!: TeamMode;
    playerId = 0;
    started = false;
    emotes: string[] = [];
    isAdmin = false;

    serialize(s: BitStream) {
        /* STRIP_FROM_PROD_CLIENT:START */
        s.writeUint8(this.teamMode);
        s.writeUint16(this.playerId);
        s.writeBoolean(this.started);
        s.writeBoolean(this.isAdmin);

        s.writeArray(this.emotes, 8, (emote) => {
            s.writeGameType(emote);
        });
        /* STRIP_FROM_PROD_CLIENT:END */
    }

    deserialize(s: BitStream) {
        this.teamMode = s.readUint8();
        this.playerId = s.readUint16();
        this.started = s.readBoolean();
        this.isAdmin = s.readBoolean();

        this.emotes = s.readArray(8, () => {
            return s.readGameType();
        });
    }
}
