import type { LeaderboardRequest } from "./types/stats.ts";

export const MinGames = {
    kpg: {
        daily: 15,
        weekly: 50,
        alltime: 100,
    },
} as Record<LeaderboardRequest["type"], Record<LeaderboardRequest["interval"], number>>;
