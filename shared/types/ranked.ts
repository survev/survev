import type { FindGameMatchData } from "./api.ts";

export type DuelSize = 1 | 2 | 3 | 4;
export type DuelTeam = 0 | 1;
export const RankedPlacementSeries = 5;
export interface RankedRating {
    elo: number;
    wins: number;
    losses: number;
    played: number;
    streak: number;
    tier: string;
    placementsRemaining: number;
}
export interface RankedProfile {
    id: string;
    name: string;
    ratings: Record<DuelSize, RankedRating>;
}
export interface RankedMember {
    id: string;
    name: string;
}
export interface RankedHistory {
    seriesId: string;
    size: DuelSize;
    at: number;
    score: [number, number];
    won: boolean;
    before: number;
    after: number;
    delta: number;
    opponents: string[];
    reason: string;
    forfeited?: boolean;
}
export interface RankedLeaderboardEntry extends RankedMember {
    rank: number;
    rating: RankedRating;
}
export interface RankedCooldown {
    until: number;
    seconds: number;
    reason: string;
}
export interface RankedScoreboardEntry extends RankedMember {
    team: DuelTeam;
    kills: number;
    damage: number;
    roundsWon: number;
    before: number;
    after: number;
    delta: number;
    forfeited: boolean;
}
export interface RankedState {
    profile: RankedProfile;
    history: RankedHistory[];
    notice: string | null;
    cooldown: RankedCooldown | null;
    match: null | {
        id: string;
        size: DuelSize;
        region: string;
        accepted: boolean;
        acceptedCount: number;
        total: number;
        deadline: number;
    };
    party: null | {
        code: string;
        region: string;
        size: DuelSize;
        leaderId: string;
        members: (RankedMember & { ready: boolean; rating: RankedRating; cooldown: RankedCooldown | null })[];
    };
    queue: null | {
        size: DuelSize;
        players: number;
        region: string;
        total: number;
        joinedAt: number;
        ratingRange: number;
    };
    series: null | {
        id: string;
        size: DuelSize;
        region: string;
        firstTo: 5;
        teamIndex: DuelTeam;
        teams: [RankedMember[], RankedMember[]];
        forfeitedIds: string[];
        personalForfeit: boolean;
        scoreboard: RankedScoreboardEntry[] | null;
        score: [number, number];
        round: number;
        status: "connecting" | "countdown" | "playing" | "intermission" | "complete" | "cancelled";
        connected: number;
        total: number;
        startsAt: number | null;
        nextRoundAt: number | null;
        join: FindGameMatchData | null;
        result: null | {
            winnerTeam: DuelTeam | null;
            before: number;
            after: number;
            delta: number;
            reason: string;
        };
    };
}
