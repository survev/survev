import z from "zod";
import type { MatchDataTable } from "../../api/src/db/schema";
import { loadoutSchema } from "../utils/loadout";
import type { FindGameError } from "./api";

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
