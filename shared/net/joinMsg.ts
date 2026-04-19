import { type AbstractMsg, type BitStream, Constants } from "./net";

export class JoinMsg implements AbstractMsg {
    protocol = 0;
    matchPriv = "";
    questPriv = "";
    name = "";
    useTouch = false;
    isMobile = false;
    bot = false;
    loadout = {
        outfit: "",
        melee: "",
        heal: "",
        boost: "",
        emotes: [] as string[],
    };

    serialize(s: BitStream) {
        s.writeUint32(this.protocol);
        s.writeString(this.matchPriv);
        s.writeString(this.questPriv);

        s.writeString(this.name, Constants.PlayerNameMaxLen);
        s.writeBoolean(this.useTouch);
        s.writeBoolean(this.isMobile);
        s.writeBoolean(this.bot);

        s.writeGameType(this.loadout.outfit);
        s.writeGameType(this.loadout.melee);
        s.writeGameType(this.loadout.heal);
        s.writeGameType(this.loadout.boost);

        s.writeArray(this.loadout.emotes, 8, (emote) => {
            s.writeGameType(emote);
        });
    }

    deserialize(s: BitStream) {
        this.protocol = s.readUint32();
        this.matchPriv = s.readString();
        this.questPriv = s.readString();

        this.name = s.readString(Constants.PlayerNameMaxLen);
        this.useTouch = s.readBoolean();
        this.isMobile = s.readBoolean();
        this.bot = s.readBoolean();

        this.loadout.outfit = s.readGameType();
        this.loadout.melee = s.readGameType();
        this.loadout.heal = s.readGameType();
        this.loadout.boost = s.readGameType();

        this.loadout.emotes = s.readArray(8, () => {
            return s.readGameType();
        });
    }
}
