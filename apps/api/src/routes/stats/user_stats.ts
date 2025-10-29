import {
    ALL_MAPS,
    type UserStatsRequest,
    type UserStatsResponse,
    zUserStatsRequest,
} from "@survev/types/stats";
import { and, eq, gte, max, type SQL, sql, sum } from "drizzle-orm";
import { Hono } from "hono";
import type { Context } from "../..";
import {
    databaseEnabledMiddleware,
    rateLimitMiddleware,
    validateParams,
} from "../../auth/middleware";
import { db } from "../../db";
import { matchDataTable, usersTable } from "../../db/schema";

export const UserStatsRouter = new Hono<Context>();

/*
 * minimum data required for the ui to show the user doesn't exist
 */
const emptyState = {
    slug: "",
    username: "",
    modes: [],
};

UserStatsRouter.post(
    "/",
    databaseEnabledMiddleware,
    rateLimitMiddleware(40, 60 * 1000),
    validateParams(zUserStatsRequest),
    async (c) => {
        const { interval, mapIdFilter, slug } = c.req.valid("json");

        const result = await db.query.usersTable.findFirst({
            where: eq(usersTable.slug, slug),
            columns: {
                id: true,
                banned: true,
            },
        });

        if (!result) {
            return c.json(emptyState, 200);
        }

        const { id: userId } = result;

        const data = await userStatsSqlQuery(userId, mapIdFilter, interval);

        return c.json<UserStatsResponse>(data, 200);
    },
);

const intervalFilter: Record<string, SQL<unknown>> = {
    daily: gte(matchDataTable.createdAt, sql`NOW() - INTERVAL '1 day'`),
    weekly: gte(matchDataTable.createdAt, sql`NOW() - INTERVAL '7 days'`),
};

async function userStatsSqlQuery(
    userId: string,
    mapIdFilter: string,
    interval: UserStatsRequest["interval"],
): Promise<UserStatsResponse> {
    const withSelect = db.$with("mode_stats").as(
        db
            .select({
                team_mode: matchDataTable.teamMode,
                games: sql`COUNT(*)`.as("games"),
                wins: sql`SUM(CASE WHEN ${matchDataTable.rank} = 1 THEN 1 ELSE 0 END)`.as(
                    "wins",
                ),
                kills: sum(matchDataTable.kills).as("kills"),
                winPct: sql`ROUND(SUM(CASE WHEN ${matchDataTable.rank} = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1)`.as(
                    "winpct",
                ),
                most_kills: max(matchDataTable.kills).as("most_kills"),
                most_damage: max(matchDataTable.damageDealt).as("most_damage"),
                kpg: sql`ROUND(SUM(${matchDataTable.kills}) * 1.0 / COUNT(*), 1)`.as(
                    "kpg",
                ),
                avg_damage: sql`ROUND(AVG(${matchDataTable.damageDealt}))`.as(
                    "avg_damage",
                ),
                avg_time_alive: sql`ROUND(AVG(${matchDataTable.timeAlive}))`.as(
                    "avg_time_alive",
                ),
            })
            .from(matchDataTable)
            .where(
                and(
                    eq(matchDataTable.userId, userId),
                    mapIdFilter !== ALL_MAPS
                        ? eq(matchDataTable.mapId, parseInt(mapIdFilter))
                        : undefined,
                    interval in intervalFilter ? intervalFilter[interval] : undefined,
                ),
            )
            .groupBy(matchDataTable.teamMode),
    );

    const res = await db
        .with(withSelect)
        .select({
            slug: usersTable.slug,
            username: usersTable.username,
            banned: usersTable.banned,
            player_icon: sql`JSON_EXTRACT_PATH(ANY_VALUE(${usersTable.loadout}), 'player_icon')`,
            games: sql`COALESCE(SUM("mode_stats".games), 0)`,
            wins: sql`COALESCE(SUM("mode_stats".wins), 0)`,
            kills: sql`COALESCE(SUM("mode_stats".kills), 0)`,
            kpg: sql`COALESCE(ROUND(SUM("mode_stats".kills) * 1.0 / NULLIF(SUM("mode_stats".games), 0), 1), 0)`,
            modes: sql`
        COALESCE(JSON_AGG(
            CASE WHEN "mode_stats".team_mode IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                    'wins', "mode_stats".wins,
                    'kills', "mode_stats".kills,
                    'teamMode', "mode_stats".team_mode,
                    'avgDamage', "mode_stats".avg_damage,
                    'avgTimeAlive', "mode_stats".avg_time_alive,
                    'mostDamage', "mode_stats".most_damage,
                    'kpg', "mode_stats".kpg,
                    'winPct', "mode_stats".winPct,
                    'mostKills', "mode_stats".most_kills,
                    'games', "mode_stats".games
                )
            END
        ), '[]')`,
        })
        .from(usersTable)
        .leftJoin(withSelect, eq(sql`1`, 1))
        .where(eq(usersTable.id, userId))
        .groupBy(usersTable.slug, usersTable.username, usersTable.banned)
        .limit(1);

    const userStats = res[0] as UserStatsResponse;

    if (!userStats || !userStats.slug) return emptyState as unknown as UserStatsResponse;

    const modes = userStats?.modes;
    const formatedData: UserStatsResponse = {
        ...userStats,
        // sql fuckery, it returns [null] where no result
        modes: modes[0] === null ? [] : modes,
    };
    return formatedData;
}
