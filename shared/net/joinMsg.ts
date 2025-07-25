import { type AbstractMsg, type BitStream, Constants } from "./net";

export class JoinMsg implements AbstractMsg {
    protocol = 0;
    matchPriv = "";
    loadoutPriv = "";
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

    deserialize(s: BitStream) {
        this.protocol = s.readUint32();
        this.matchPriv = s.readString();
        this.loadoutPriv = s.readString();
        this.questPriv = s.readString();

        this.name = s.readString(Constants.PlayerNameMaxLen);
        this.useTouch = s.readBoolean();
        this.isMobile = s.readBoolean();
        this.bot = s.readBoolean();

        this.loadout.outfit = s.readGameType();
        this.loadout.melee = s.readGameType();
        this.loadout.heal = s.readGameType();
        this.loadout.boost = s.readGameType();
        this.loadout.emotes = [];
        const count = s.readUint8();

        for (let i = 0; i < count; i++) {
            const emote = s.readGameType();
            this.loadout.emotes.push(emote);
        }
    }

    serialize(s: BitStream) {
        s.writeUint32(this.protocol);
        s.writeString(this.matchPriv);
        s.writeString(this.loadoutPriv);
        s.writeString(this.questPriv);

        s.writeString(this.name, Constants.PlayerNameMaxLen);
        s.writeBoolean(this.useTouch);
        s.writeBoolean(this.isMobile);
        s.writeBoolean(this.bot);

        s.writeGameType(this.loadout.outfit);
        s.writeGameType(this.loadout.melee);
        s.writeGameType(this.loadout.heal);
        s.writeGameType(this.loadout.boost);

        s.writeUint8(this.loadout.emotes.length);
        for (const emote of this.loadout.emotes) {
            s.writeGameType(emote);
        }
    }
}
