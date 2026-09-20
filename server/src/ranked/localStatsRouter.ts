import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type UserStatsResponse, zUserStatsRequest } from "../../../shared/types/stats.ts";
import { localStatsAccounts } from "./statsRouter.ts";
import type { RankedStore } from "./store.ts";

/** Without PostgreSQL normal match statistics are unavailable; ranked results still use SQLite. */
export function createLocalStatsRouter(store: RankedStore) {
    const app = new Hono();
    app.post("/user_stats", zValidator("json", zUserStatsRequest), async c => {
        const account = await localStatsAccounts(store).find(c.req.valid("json").slug);
        return c.json<UserStatsResponse>({
            slug: account?.slug ?? "",
            username: account?.name ?? "",
            player_icon: "",
            banned: false,
            wins: 0,
            kills: 0,
            games: 0,
            kpg: "0.0",
            modes: [],
        });
    });
    app.post("/match_history", c => c.json([]));
    app.post("/match_data", c => c.json([]));
    app.post("/leaderboard", c => c.json([]));
    return app;
}
