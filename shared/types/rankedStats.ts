import type { RankedHistory, RankedLeaderboardEntry, RankedProfile } from "./ranked.ts";

/** Public stats use the same account slug as the original stats website. */
export interface RankedStatsProfile {
    slug: string;
    profile: RankedProfile;
    history: RankedHistory[];
}

export interface RankedStatsEntry extends RankedLeaderboardEntry {
    slug: string;
}

export type RankedStatsMetric = "elo" | "wins";
