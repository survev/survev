import { z } from "zod";
import { MapId } from "../defs/types/misc";
import { TeamMode } from "../gameConfig";

//
// Match History
//

/**
 * sent by the client when to teammode filter is selected
 */
export const ALL_TEAM_MODES = 7;
export const zMatchHistoryRequest = z.object({
    slug: z.string(),
    offset: z.number(),
    count: z.number(),
    teamModeFilter: z.union([
        z.literal(TeamMode.Solo),
        z.literal(TeamMode.Duo),
        z.literal(TeamMode.Squad),
        z.literal(ALL_TEAM_MODES),
    ]),
});

export type MatchHistoryParams = z.infer<typeof zMatchHistoryRequest>;

export type MatchHistory = {
    guid: string;
    region: string;
    map_id: number;
    team_mode: TeamMode;
    team_count: number;
    team_total: number;
    end_time: string | Date;
    time_alive: number;
    rank: number;
    kills: number;
    team_kills: number;
    damage_dealt: number;
    damage_taken: number;
};
export type MatchHistoryResponse = MatchHistory[];

//
// Match Data
//
export const zMatchDataRequest = z.object({
    gameId: z.string(),
});

export type MatchDataRequest = z.infer<typeof zMatchDataRequest>;
export type MatchDataResponse = MatchData[];

export type MatchData = {
    slug: string | null;
    username: string;
    player_id: number;
    team_id: number;
    time_alive: number;
    rank: number;
    died: boolean;
    kills: number;
    damage_dealt: number;
    damage_taken: number;
    killer_id: number;
    killed_ids: number[];
};

//
// User Stats
//
export const ALL_MAPS = "-1";
const VALID_MAP_IDS = Object.values(MapId)
    .filter((id) => typeof id === "number")
    .map((id) => id.toString()) as [string, ...string[]];

export const zUserStatsRequest = z.object({
    interval: z.enum(["daily", "weekly", "alltime"]),
    slug: z.string().min(1),
    mapIdFilter: z.enum([ALL_MAPS, ...VALID_MAP_IDS]),
});

export type UserStatsRequest = z.infer<typeof zUserStatsRequest>;

export type UserStatsResponse = {
    slug: string;
    username: string;
    player_icon: string;
    banned: boolean;
    wins: number;
    kills: number;
    games: number;
    kpg: string;
    modes: Mode[];
};

export interface Mode {
    teamMode: number;
    games: number;
    wins: number;
    kills: number;
    winPct: string;
    mostKills: number;
    mostDamage: number;
    kpg: string;
    avgDamage: number;
    avgTimeAlive: number;
}

//
// Leaderboard
//
const teamModeMap = {
    solo: TeamMode.Solo,
    duo: TeamMode.Duo,
    squad: TeamMode.Squad,
};

export const zLeaderboardsRequest = z.object({
    interval: z.enum(["daily", "weekly", "alltime"]),
    mapId: z
        .string()
        .or(z.number())
        .refine((mapId) => VALID_MAP_IDS.includes(mapId.toString()), {
            message: "Invalid map ID",
        })
        .transform((mapId) => Number(mapId)),
    type: z.enum(["most_kills", "most_damage_dealt", "kpg", "kills", "wins"]),
    teamMode: z.enum(["solo", "duo", "squad"]).transform((mode) => teamModeMap[mode]),
});

export type LeaderboardResponse = {
    val: number;
    region: string;
    /**
     * not used
     */
    active?: boolean;
    /**
     * required for all types except most_kills & win_streak
     */
    games?: number;
} & (
    | {
          slug: string | null;
          username: string;
      }
    | {
          slugs: (string | null)[];
          usernames: string[];
      }
);

export type LeaderboardRequest = z.input<typeof zLeaderboardsRequest>;
