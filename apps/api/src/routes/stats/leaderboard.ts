import { MinGames } from "@survev/shared/constants";
import { TeamMode } from "@survev/shared/gameConfig";
import {
    type LeaderboardRequest,
    type LeaderboardResponse,
    zLeaderboardsRequest,
} from "@survev/types/stats";
import { and, count, eq, gte, inArray, ne, type SQL, sql } from "drizzle-orm";
import { Hono } from "hono";
import type { Context } from "../..";
import { server } from "../../apiServer";
import {
    databaseEnabledMiddleware,
    rateLimitMiddleware,
    validateParams,
} from "../../auth/middleware";
import { leaderboardCache } from "../../cache/leaderboard";
import { db } from "../../db";
import { matchDataTable, usersTable } from "../../db/schema";

export const leaderboardRouter = new Hono<Context>();

leaderboardRouter.post(
    "/",
    databaseEnabledMiddleware,
    rateLimitMiddleware(40, 60 * 1000),
    validateParams(zLeaderboardsRequest),
    async (c) => {
        const params = c.req.valid("json");
        const { type, teamMode } = params;
        const cachedResult = await leaderboardCache.get(params);

        if (cachedResult) {
            server.logger.debug(
                `[CACHE HIT] -> ${leaderboardCache.getCacheKey("leaderboard", params)}`,
            );
            return c.json(cachedResult, 200);
        }

        const startTime = performance.now();
        const data =
            type === "most_kills" && teamMode != TeamMode.Solo
                ? await multiplePlayersQuery(params)
                : await soloLeaderboardQuery(params);
        logQueryPerformance(startTime, params);

        // TODO: decide if we should cache empty results;
        if (data.length != 0) {
            await leaderboardCache.set(params, data);
        }

        return c.json<LeaderboardResponse[]>(data, 200);
    },
);

// we don't use the one sent by the client lol.
const MAX_RESULT_COUNT = 100;

const typeToQuery: Record<LeaderboardRequest["type"], string> = {
    kills: "SUM(match_data.kills)",
    most_damage_dealt: "MAX(match_data.damage_dealt)",
    kpg: "ROUND(SUM(match_data.kills) * 1.0 / COUNT(*), 1)",
    most_kills: "match_data.kills",
    wins: "COUNT(CASE WHEN match_data.rank = 1 THEN 1 END)",
};

const intervalFilter = {
    daily: gte(matchDataTable.createdAt, sql`NOW() - INTERVAL '1 day'`),
    weekly: gte(matchDataTable.createdAt, sql`NOW() - INTERVAL '7 days'`),
};

async function soloLeaderboardQuery(params: LeaderboardRequest) {
    const { interval, mapId, teamMode, type } = params;
    const minGames = type === "kpg" ? MinGames[type][interval] : 1;

    const usernameQuery =
        type === "most_kills" ? matchDataTable.username : usersTable.username;

    const result = await db
        .select({
            username: usernameQuery,
            mapId: matchDataTable.mapId,
            region: matchDataTable.region,
            teamMode: matchDataTable.teamMode,
            games: count(sql`DISTINCT(match_data.game_id)`),
            slug: usersTable.slug,
            val: sql.raw(`${typeToQuery[type]} as val`) as SQL<number>,
        })
        .from(matchDataTable)
        .leftJoin(usersTable, eq(usersTable.id, matchDataTable.userId))
        .where(
            and(
                eq(matchDataTable.teamMode, teamMode),
                eq(usersTable.banned, false),
                interval === "alltime" ? undefined : intervalFilter[interval],
                ne(matchDataTable.userId, ""),
                eq(matchDataTable.mapId, mapId),
            ),
        )
        .groupBy(
            matchDataTable.mapId,
            usersTable.slug,
            matchDataTable.region,
            matchDataTable.teamMode,
            usernameQuery,
            sql`${type === "most_kills" ? matchDataTable.kills : ""}`,
        )
        .having(gte(count(sql`DISTINCT(match_data.game_id)`), minGames))
        .orderBy(sql`val DESC`)
        .limit(MAX_RESULT_COUNT);

    return result as LeaderboardResponse[];
}

async function multiplePlayersQuery({
    interval,
    mapId,
    teamMode,
}: LeaderboardRequest): Promise<LeaderboardResponse[]> {
    const data = await db
        .select({
            matchedUsers: sql<
                {
                    username: string;
                    userId: string | null;
                }[]
            >`json_agg(
                json_build_object(
                    'username', ${matchDataTable.username},
                    'userId', ${matchDataTable.userId}
                )
            )`,
            region: matchDataTable.region,
            val: sql<number>`SUM(${matchDataTable.kills}) as val`,
        })
        .from(matchDataTable)
        .where(
            and(
                interval === "alltime" ? undefined : intervalFilter[interval],
                eq(matchDataTable.userBanned, false),
                eq(matchDataTable.teamMode, teamMode),
                eq(matchDataTable.mapId, mapId),
            ),
        )
        .groupBy(matchDataTable.gameId, matchDataTable.teamId, matchDataTable.region)
        // make sure at least one member of the duo / squad is logged in
        .having(sql`count(case when user_id!='' then 1 end) >= 1`)
        .orderBy(sql`val DESC`)
        .limit(MAX_RESULT_COUNT);

    // get slugs using userIds
    // @NOTE: previously this was done in SQL using a join
    // but performance degraded significantly with larger table
    // splitting it into two separate queries is much faster

    const userIds: string[] = [];
    for (const row of data) {
        for (const { userId } of row.matchedUsers) {
            if (!userId) continue;
            userIds.push(userId);
        }
    }

    const slugsFromUserIds = await db
        .select({
            slug: usersTable.slug,
            id: usersTable.id,
        })
        .from(usersTable)
        .where(and(inArray(usersTable.id, userIds), eq(usersTable.banned, false)));

    const slugMap = Object.fromEntries(
        slugsFromUserIds.map(({ id, slug }) => [id, slug]),
    );

    return data.map((row) => {
        const usernames = [];
        const slugs = [];
        for (const { userId, username } of row.matchedUsers) {
            usernames.push(username);
            slugs.push(userId ? slugMap[userId] || null : null);
        }

        return {
            region: row.region,
            slugs,
            usernames,
            val: row.val,
        };
    }) satisfies LeaderboardResponse[];
}

function logQueryPerformance(startTime: number, params: LeaderboardRequest) {
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    const timeString =
        executionTime > 1000
            ? `${(executionTime / 1000).toFixed(2)}s`
            : `${executionTime.toFixed(2)}ms`;
    server.logger[executionTime > 1000 ? "warn" : "debug"](
        `leaderboard | Execution time: ${timeString} | ${leaderboardCache.getCacheKey("debug" as any, params)}`,
    );
}
