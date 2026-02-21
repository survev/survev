import { TeamMode } from "../../gameConfig";

export enum MapId {
    Main = 0,
    Desert = 1,
    Woods = 2,
    Faction = 3,
    Potato = 4,
    Savannah = 5,
    Halloween = 6,
    Cobalt = 7,
    Birthday = 8,
    Beach = 9,
    Comp = 10,
    Local = 11,
    TwoVsTwo = 12,
    FourVsFour = 13,
    CompSolo = 14,
    CompDuo = 15,
}

export const TeamModeToString = {
    [TeamMode.Solo]: "solo",
    [TeamMode.Duo]: "duo",
    [TeamMode.Squad]: "squad",
};
