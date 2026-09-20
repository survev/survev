/** Authoritative counters for one reserved player within a single ranked round. */
export interface DuelCombatStats {
    profileId: string;
    kills: number;
    damageDealt: number;
    roundWins: number;
}

/** Counters are cumulative within this round, so retries replace rather than add them. */
export interface DuelCombatSnapshot {
    seriesId: string;
    roundId: string;
    round: number;
    gameId: string;
    players: DuelCombatStats[];
}
