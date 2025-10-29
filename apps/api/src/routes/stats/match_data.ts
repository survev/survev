import { type MatchDataResponse, zMatchDataRequest } from "@survev/types/stats";
import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { Context } from "../..";
import {
    databaseEnabledMiddleware,
    rateLimitMiddleware,
    validateParams,
} from "../../auth/middleware";
import { db } from "../../db";
import { matchDataTable, usersTable } from "../../db/schema";

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
            })
            .from(matchDataTable)
            .leftJoin(usersTable, eq(usersTable.id, matchDataTable.userId))
            .orderBy(asc(matchDataTable.rank))
            .where(eq(matchDataTable.gameId, gameId));

        return c.json<MatchDataResponse>(result);
    },
);
