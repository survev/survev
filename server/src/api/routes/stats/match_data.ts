import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import {
    type MatchDataResponse,
    zMatchDataRequest,
} from "../../../../../shared/types/stats.ts";
import {
    databaseEnabledMiddleware,
    rateLimitMiddleware,
    validateParams,
} from "../../auth/middleware.ts";
import { db } from "../../db/index.ts";
import { matchDataTable, usersTable } from "../../db/schema.ts";
import type { Context } from "../../index.ts";

export const matchDataRouter = new Hono<Context>();

matchDataRouter.post(
    "/",
    databaseEnabledMiddleware,
    rateLimitMiddleware(40, 60 * 1000),
    validateParams(zMatchDataRequest),
    async (c) => {
        const { gameId } = c.req.valid("json");

        const result = await db
            .select({
                slug: usersTable.slug,
                username: matchDataTable.username,
                player_id: matchDataTable.playerId,
                team_id: matchDataTable.teamId,
                time_alive: matchDataTable.timeAlive,
                rank: matchDataTable.rank,
                died: matchDataTable.died,
                kills: matchDataTable.kills,
                damage_dealt: matchDataTable.damageDealt,
                damage_taken: matchDataTable.damageTaken,
                killer_id: matchDataTable.killerId,
                killed_ids: matchDataTable.killedIds,
                role: matchDataTable.role,
            })
            .from(matchDataTable)
            .leftJoin(usersTable, eq(usersTable.id, matchDataTable.userId))
            .orderBy(asc(matchDataTable.rank))
            .where(eq(matchDataTable.gameId, gameId));

        return c.json<MatchDataResponse>(result);
    },
);
