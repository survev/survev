import { aliasedTable, and, desc, eq, gt, sum } from "drizzle-orm";
import { Hono } from "hono";
import type { TeamMode } from "../../../../../shared/gameConfig";
import {
    ALL_TEAM_MODES,
    type MatchHistoryResponse,
    zMatchHistoryRequest,
} from "../../../../../shared/types/stats";
import { util } from "../../../../../shared/utils/util";
import type { Context } from "../..";
import {
    databaseEnabledMiddleware,
    rateLimitMiddleware,
    validateParams,
} from "../../auth/middleware";
import { db } from "../../db";
import { matchDataTable, usersTable } from "../../db/schema";

export const matchHistoryRouter = new Hono<Context>();

const aliased = aliasedTable(matchDataTable, "aliased");

matchHistoryRouter.post(
    "/",
    databaseEnabledMiddleware,
    rateLimitMiddleware(40, 60 * 1000),
    validateParams(zMatchHistoryRequest),
    async (c) => {
        const { slug, offset, teamModeFilter } = c.req.valid("json");

        const result = await db.query.usersTable.findFirst({
            where: eq(usersTable.slug, slug),
            columns: {
                id: true,
            },
        });

        if (result?.id == undefined) {
            return c.json({}, 200);
        }

        const { id: userId } = result;
        const data = await db
            .select({
                guid: matchDataTable.gameId,
                region: matchDataTable.region,
                map_id: matchDataTable.mapId,
                team_mode: matchDataTable.teamMode,
                team_count: matchDataTable.teamCount,
                team_total: matchDataTable.teamTotal,
                end_time: matchDataTable.createdAt,
                time_alive: matchDataTable.timeAlive,
                rank: matchDataTable.rank,
                kills: matchDataTable.kills,
                team_kills: sum(aliased.kills).mapWith(Number),
                damage_dealt: matchDataTable.damageDealt,
                damage_taken: matchDataTable.damageTaken,
                slug: usersTable.slug,
            })
            .from(matchDataTable)
            .groupBy(
                matchDataTable.gameId,
                matchDataTable.region,
                matchDataTable.mapId,
                matchDataTable.teamMode,
                matchDataTable.teamCount,
                matchDataTable.teamTotal,
                matchDataTable.createdAt,
                matchDataTable.timeAlive,
                matchDataTable.rank,
                matchDataTable.kills,
                matchDataTable.damageDealt,
                matchDataTable.damageTaken,
                usersTable.slug,
            )
            .leftJoin(
                aliased,
                and(
                    eq(aliased.gameId, matchDataTable.gameId),
                    eq(aliased.teamId, matchDataTable.teamId),
                ),
            )
            .innerJoin(usersTable, eq(usersTable.id, matchDataTable.userId))
            .where(
                and(
                    eq(usersTable.id, userId),
                    eq(matchDataTable.teamMode, teamModeFilter as TeamMode).if(
                        teamModeFilter != ALL_TEAM_MODES,
                    ),
                    gt(matchDataTable.createdAt, new Date(Date.now() - util.daysToMs(7))),
                ),
            )
            .orderBy(desc(matchDataTable.createdAt))
            .offset(offset)
            .limit(10);

        return c.json<MatchHistoryResponse>(data);
    },
);
