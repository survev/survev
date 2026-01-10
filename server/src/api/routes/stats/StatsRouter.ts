import { Hono } from "hono";
import { leaderboardRouter } from "./leaderboard";
import { matchDataRouter } from "./match_data";
import { matchHistoryRouter } from "./match_history";
import { UserStatsRouter } from "./user_stats";
import { weaponsStatsRouter } from "./weapons_stats";

export const StatsRouter = new Hono();

StatsRouter.route("/user_stats", UserStatsRouter);
StatsRouter.route("/match_history", matchHistoryRouter);
StatsRouter.route("/match_data", matchDataRouter);
StatsRouter.route("/leaderboard", leaderboardRouter);
StatsRouter.route("/weapon_stats", weaponsStatsRouter);
