import { Hono } from "hono";
import { leaderboardRouter } from "./leaderboard.ts";
import { matchDataRouter } from "./match_data.ts";
import { matchHistoryRouter } from "./match_history.ts";
import { UserStatsRouter } from "./user_stats.ts";

export const StatsRouter = new Hono();

StatsRouter.route("/user_stats", UserStatsRouter);
StatsRouter.route("/match_history", matchHistoryRouter);
StatsRouter.route("/match_data", matchDataRouter);
StatsRouter.route("/leaderboard", leaderboardRouter);
