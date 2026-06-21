import { TeamMode } from "@/shared/gameConfig.ts";
import type { LeaderboardRequest } from "@/shared/types/stats.ts";

export type TeamModeQuery = "solo" | "duo" | "squad";

export const TeamModeQueryToTranslationKey: Record<TeamModeQuery, string> = {
    solo: "stats-solo",
    duo: "stats-duo",
    squad: "stats-squad",
};

export const TeamModeToTranslationKey: Record<TeamMode, string> = {
    [TeamMode.Solo]: "stats-solo",
    [TeamMode.Duo]: "stats-duo",
    [TeamMode.Squad]: "stats-squad",
};

export const TypeToTranslationKey: Record<LeaderboardRequest["type"], string> = {
    most_kills: "stats-most-kills",
    most_damage_dealt: "stats-most-damage",
    kpg: "stats-kpg-full",
    kills: "stats-total-kills",
    wins: "stats-total-wins",
};

export const IntervalToTranslationKey: Record<LeaderboardRequest["interval"], string> = {
    daily: "stats-today",
    weekly: "stats-this-week",
    alltime: "stats-all-time",
};

export enum StatsAds {
    TopCenterLB = "survevio_728x90_leaderboard_top",
    TopRightLB = "survevio_300x250_leaderboard_top",
    BottomCenterLB = "survevio_300x250_leaderboard_bottom",
    TopCenterPlayer = "survevio_728x90_playerprofile_top",
    TopRightPlayer = "survevio_300x250_playerprofile_top",
    BottomCenterPlayer = "survevio_300x250_playerprofile_bottom",
}

export enum RequestState {
    Loading,
    Loaded,
    Error,
}

export enum StatsState {
    Loading,
    Leaderboard,
    Player,
}

export enum ExtraStatsTabs {
    MatchHistory,
    WeaponStats,
}
