import { TeamMode } from "@survev/shared/gameConfig";
import { loadoutSchema } from "@survev/shared/utils/loadout";
import z from "zod";
import type { MatchDataTable } from "../../../apps/api/src/db/schema";
import type { FindGameError } from "./api";

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
}

export const TeamModeToString = {
    [TeamMode.Solo]: "solo",
    [TeamMode.Duo]: "duo",
    [TeamMode.Squad]: "squad",
};

export const zFindGamePrivateBody = z.object({
    region: z.string(),
    version: z.number(),
    autoFill: z.boolean(),
    mapName: z.string(),
    teamMode: z.number(),
    playerData: z.array(
        z.object({
            token: z.string(),
            userId: z.string().nullable(),
            ip: z.string(),
            loadout: loadoutSchema.optional(),
        }),
    ),
});

export type FindGamePrivateBody = z.infer<typeof zFindGamePrivateBody>;

export type FindGamePrivateRes =
    | {
          gameId: string;
          useHttps: boolean;
          hosts: string[];
          addrs: string[];
      }
    | { error: FindGameError };

export interface SaveGameBody {
    matchData: (MatchDataTable & { ip: string; findGameIp: string })[];
}
