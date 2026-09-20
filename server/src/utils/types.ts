import { z } from "zod";
import type { MapDefKey } from "../../../shared/defs/mapDefs.ts";
import { TeamMode } from "../../../shared/gameConfig.ts";
import { type FindGameMatchData, type FindGamePrivateError, loadoutSchema } from "../../../shared/types/api.ts";
import { zSpectateFilter } from "../../../shared/types/moderation.ts";
import type { DuelCombatSnapshot } from "../../../shared/types/rankedCombat.ts";
import type { MatchDataTable } from "../api/db/schema.ts";

export const zUpdateRegionBody = z.object({
    regionId: z.string(),
    data: z.object({
        playerCount: z.number(),
    }),
});
export type UpdateRegionBody = z.infer<typeof zUpdateRegionBody>;

export const zSetGameModeBody = z.object({
    index: z.number(),
    team_mode: z.enum(TeamMode).optional(),
    map_name: z.string().optional(),
    enabled: z.boolean().optional(),
});

export const zSetClientThemeBody = z.object({
    theme: z.string(),
});

export interface SaveGameBody {
    matchData: (MatchDataTable & { ip: string; findGameIp: string })[];
}

export interface ServerGameConfig {
    readonly mapName: MapDefKey;
    readonly teamMode: TeamMode;
    readonly duel?: DuelRoundConfig;
}

export const zDuelRound = z.object({
    seriesId: z.string().min(1).max(100),
    roundId: z.string().min(1).max(100),
    round: z.number().int().positive(),
    teamSize: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export const zCancelDuelBody = z.object({
    seriesId: z.string().min(1).max(100),
    roundId: z.string().min(1).max(100),
});

export const zRemoveDuelPlayerBody = zCancelDuelBody.extend({
    profileId: z.string().min(1).max(100),
});

export interface DuelPlayerAbandoned {
    seriesId: string;
    roundId: string;
    round: number;
    gameId: string;
    profileId: string;
    abandonedProfileIds?: string[];
    combat?: DuelCombatSnapshot;
}

export interface DuelRoundConfig extends z.infer<typeof zDuelRound> {
    roster: Array<{ profileId: string; team: 0 | 1; name: string }>;
}

export interface DuelRoundResult {
    seriesId: string;
    roundId: string;
    round: number;
    gameId: string;
    winnerTeam: 0 | 1 | null;
    reason: "elimination" | "disconnect" | "connection_timeout" | "draw";
    started: boolean;
    missingTeams?: Array<0 | 1>;
    missingProfileIds?: string[];
    abandonedProfileIds?: string[];
    combat?: DuelCombatSnapshot;
}

export interface DuelRoundStatus {
    seriesId: string;
    roundId: string;
    round: number;
    phase: "connecting" | "countdown" | "playing" | "finished";
    connected: number;
    expected: number;
    countdownEndsAt?: number;
}

export const zFindGamePrivateBody = z.object({
    region: z.string(),
    version: z.number(),
    autoFill: z.boolean(),
    mapName: z.string(),
    teamMode: z.number(),
    duel: zDuelRound.optional(),
    playerData: z.array(
        z.object({
            joinToken: z.string(),
            userId: z.string().nullable(),
            ip: z.string(),
            loadout: loadoutSchema.optional(),
            quests: z.array(z.string()).optional(),
            duelProfileId: z.string().min(1).max(100).optional(),
            duelTeam: z.union([z.literal(0), z.literal(1)]).optional(),
            duelName: z.string().min(1).max(32).optional(),
        }),
    ),
});

export type FindGamePrivateBody = z.infer<typeof zFindGamePrivateBody>;

export type FindGamePrivateRes =
    | {
        urls: string[];
        gameId?: string;
    }
    | { error: FindGamePrivateError };

export type SpectateGamePrivateRes = {
    players: Array<{
        gameId: string;
        mapName: MapDefKey;
        teamMode: TeamMode;
        data: FindGameMatchData;
    }>;
};

export type ModRouterSpectateGameRes = SpectateGamePrivateRes & {
    region: string;
    done: boolean;
};

export const zSpectateGamePrivateBody = z.object({
    filter: zSpectateFilter,
});

export type SpectateGamePrivateBody = z.infer<typeof zSpectateGamePrivateBody>;
