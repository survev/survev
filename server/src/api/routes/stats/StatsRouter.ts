import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { Config } from "../../../config.ts";
import { createLocalStatsRouter } from "../../../ranked/localStatsRouter.ts";
import { createStatsPreviewRouter } from "../../../ranked/statsPreview.ts";
import { createRankedStatsRouter, localStatsAccounts, type RankedStatsAccounts } from "../../../ranked/statsRouter.ts";
import type { RankedStore } from "../../../ranked/store.ts";
import { rateLimitMiddleware } from "../../auth/middleware.ts";
import { db } from "../../db/index.ts";
import { usersTable } from "../../db/schema.ts";
import { leaderboardRouter } from "./leaderboard.ts";
import { matchDataRouter } from "./match_data.ts";
import { matchHistoryRouter } from "./match_history.ts";
import { UserStatsRouter } from "./user_stats.ts";

export function rankedStatsAccounts(store: RankedStore): RankedStatsAccounts {
    if (!Config.database.enabled) return localStatsAccounts(store);
    return {
        async find(slug) {
            const user = await db.query.usersTable.findFirst({
                where: and(eq(usersTable.slug, slug), eq(usersTable.banned, false)),
                columns: { id: true, slug: true, username: true },
            });
            return user ? { id: user.id, slug: user.slug, name: user.username } : undefined;
        },
        async list(ids) {
            if (!ids.length) return [];
            return db.select({ id: usersTable.id, slug: usersTable.slug, name: usersTable.username })
                .from(usersTable).where(and(inArray(usersTable.id, ids), eq(usersTable.banned, false)));
        },
    };
}

export function createStatsRouter(store: RankedStore) {
    const app = new Hono();
    app.use("/ranked_stats/*", rateLimitMiddleware(80, 60 * 1000));
    app.route(
        "/ranked_stats",
        createRankedStatsRouter(store, rankedStatsAccounts(store)),
    );
    app.route(
        "/stats_preview",
        createStatsPreviewRouter(!Config.database.enabled && process.env.NODE_ENV === "development"),
    );
    if (!Config.database.enabled) app.route("/", createLocalStatsRouter(store));
    app.route("/user_stats", UserStatsRouter);
    app.route("/match_history", matchHistoryRouter);
    app.route("/match_data", matchDataRouter);
    app.route("/leaderboard", leaderboardRouter);
    return app;
}
