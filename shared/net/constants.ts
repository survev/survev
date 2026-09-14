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

export abstract class AbstractMsg {
    abstract serialize(s: BitStream): void;
    abstract deserialize(s: BitStream): void;
}
