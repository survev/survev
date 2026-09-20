/** Shared by rating assignment and the ranked menu's tier overview. */
export const RankedTiers = [
    { id: "bronze", name: "Bronze", minElo: null },
    { id: "silver", name: "Silver", minElo: 900 },
    { id: "gold", name: "Gold", minElo: 1100 },
    { id: "platinum", name: "Platinum", minElo: 1300 },
    { id: "diamond", name: "Diamond", minElo: 1500 },
    { id: "master", name: "Master", minElo: 1700 },
] as const;

export function getRankedTier(elo: number) {
    for (let i = RankedTiers.length - 1; i >= 0; i--) {
        const tier = RankedTiers[i];
        if (tier.minElo === null || elo >= tier.minElo) return tier;
    }
    return RankedTiers[0];
}
