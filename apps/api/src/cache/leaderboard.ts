import { MapId, TeamModeToString } from "@survev/shared/defs/types/misc";
import type { LeaderboardRequest, LeaderboardResponse } from "@survev/types/stats";
import { server } from "../apiServer";
import { Config } from "../config";
import type { MatchDataTable } from "../db/schema";
import { getRedisClient } from ".";

const SIX_MINUTES_CACHE_TTL = 360;
const ONE_DAY_CACHE_TTL = 86400;

type Prefix = "leaderboard" | "lowestscore";

class LeaderBoardCache {
    async set(params: LeaderboardRequest, data: LeaderboardResponse[]) {
        if (!Config.cachingEnabled) return;

        const client = await getRedisClient();
        const cacheKey = this.getCacheKey("leaderboard", params);
        const cacheTTL = this._getCacheTTL(params.type);
        await client.setEx(cacheKey, cacheTTL, JSON.stringify(data));

        if (params.type !== "most_damage_dealt" && params.type !== "most_kills") return;
        const lowestValue = data[data.length - 1].val;
        await client.set(this.getCacheKey("lowestscore", params), lowestValue);
    }

    async get(params: LeaderboardRequest): Promise<LeaderboardResponse[] | null> {
        if (!Config.cachingEnabled) return null;

        const client = await getRedisClient();
        const cacheKey = this.getCacheKey("leaderboard", params);
        const data = await client.get(cacheKey);
        return data ? JSON.parse(data) : null;
    }

    async del(params: LeaderboardRequest): Promise<boolean> {
        if (!Config.cachingEnabled) return false;
        const client = await getRedisClient();
        const cacheKey = this.getCacheKey("leaderboard", params);
        await client.del(cacheKey);

        if (params.type === "most_damage_dealt" || params.type === "most_kills")
            await client.del(this.getCacheKey("lowestscore", params));

        return true;
    }

    getCacheKey(prefix: Prefix, params: LeaderboardRequest) {
        const { teamMode, mapId, type, interval } = params;
        const mapName = MapId[mapId].toLowerCase();
        return `${prefix}:${TeamModeToString[teamMode]}:${mapName}:${type}:${interval}`;
    }

    async invalidateCache(matchData: MatchDataTable[]) {
        if (!Config.cachingEnabled) return;
        const client = await getRedisClient();

        const maxValues = matchData.reduce(
            (obj, player) => ({
                most_kills: Math.max(obj.most_kills, player.kills),
                most_damage_dealt: Math.max(obj.most_damage_dealt, player.damageDealt),
            }),
            { most_kills: 0, most_damage_dealt: 0 },
        );

        const intervals = ["daily", "weekly", "alltime"] as const;

        for (const [type, maxGameValue] of Object.entries(maxValues)) {
            for (const interval of intervals) {
                if (type !== "most_damage_dealt" && type !== "most_kills") continue;

                const params: LeaderboardRequest = {
                    type,
                    teamMode: matchData[0].teamMode,
                    mapId: matchData[0].mapId,
                    interval,
                };

                const lowestLeaderboardValue = await client.get(
                    this.getCacheKey("lowestscore", params),
                );

                if (
                    lowestLeaderboardValue == null ||
                    maxGameValue < parseInt(lowestLeaderboardValue)
                )
                    continue;

                const leaderboardCacheKey = leaderboardCache.getCacheKey(
                    "leaderboard",
                    params,
                );
                server.logger.info(`[INVALIDATING CACHE] -> ${leaderboardCacheKey}`);

                await leaderboardCache.del(params);
            }
        }
    }

    private _getCacheTTL(type: LeaderboardRequest["type"]) {
        if (type === "most_kills" || type === "most_damage_dealt") {
            return ONE_DAY_CACHE_TTL;
        }
        return SIX_MINUTES_CACHE_TTL;
    }
}

export const leaderboardCache = new LeaderBoardCache();
