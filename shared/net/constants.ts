import { GameConfig } from "../gameConfig.ts";
import type { BitStream } from "./stream.ts";

export const Constants = {
    MaxPosition: 1024,
    MapNameMaxLen: 24,
    PlayerNameMaxLen: 16,
    MouseMaxDist: 64,
    SmokeMaxRad: 10,
    ActionMaxDuration: 8.5,
    AirstrikeZoneMaxRad: 256,
    AirstrikeZoneMaxDuration: 60,
    PlayerMinScale: 0.75,
    PlayerMaxScale: 2,
    MapObjectMinScale: 0.125,
    MapObjectMaxScale: 2.5,
    MaxPerks: 8,
    MaxMapIndicators: 16,
};

const getBits = (n: number) => Math.ceil(Math.log2(n));

export const BitSizes = {
    Action: getBits(GameConfig.Action.Count),
    Anim: getBits(GameConfig.Anim.Count),
    Haste: getBits(GameConfig.HasteType.Count),
    Perks: getBits(Constants.MaxPerks),
    MapIndicators: getBits(Constants.MaxMapIndicators),
};

export enum ClientMsgType {
    None = 0,
    Join = 1, // JoinMsg should always be ID 1 to not break protocol version check with old clients!
    Input,
    PointerInput,
    Emote,
    DropItem,
    Spectate,
    PerkModeRoleSelect,
    Edit,
}
export type ValidClientMsgType = Exclude<ClientMsgType, ClientMsgType.None>;

export abstract class AbstractClientMsg {
    abstract readonly type: ValidClientMsgType;
    abstract serialize(s: BitStream): void;
    abstract deserialize(s: BitStream): void;
}

export enum ServerMsgType {
    None = 0,
    Joined = 1,
    Map,
    Update,
    AliveCounts,
    Pickup,
    Kill,
    RoleAnnouncement,
    UpdatePass,
    PlayerStats,
    GameOver,
}
export type ValidServerMsgType = Exclude<ServerMsgType, ServerMsgType.None>;

export abstract class AbstractServerMsg {
    abstract readonly type: ValidServerMsgType;
    abstract serialize(s: BitStream): void;
    abstract deserialize(s: BitStream): void;
}
