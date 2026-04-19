import type { TeamMode } from "../gameConfig";
import type { AbstractMsg, BitStream } from "./net";

export class JoinedMsg implements AbstractMsg {
    teamMode!: TeamMode;
    playerId = 0;
    started = false;
    emotes: string[] = [];

    serialize(s: BitStream) {
        s.writeUint8(this.teamMode);
        s.writeUint16(this.playerId);
        s.writeBoolean(this.started);

        s.writeArray(this.emotes, 8, (emote) => {
            s.writeGameType(emote);
        });
    }

    deserialize(s: BitStream) {
        this.teamMode = s.readUint8();
        this.playerId = s.readUint16();
        this.started = s.readBoolean();

        this.emotes = s.readArray(8, () => {
            return s.readGameType();
        });
    }
}
