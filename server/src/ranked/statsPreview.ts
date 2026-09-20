import { Hono } from "hono";
import { getRankedTier } from "../../../shared/defs/rankedDefs.ts";
import type { DuelSize, RankedHistory, RankedRating } from "../../../shared/types/ranked.ts";
import type { RankedStatsEntry, RankedStatsProfile } from "../../../shared/types/rankedStats.ts";
import type { UserStatsResponse } from "../../../shared/types/stats.ts";

const names = [
    "IslandAce",
    "PanMaster",
    "RiverRat",
    "CrateHunter",
    "DemoSurvevr",
    "BushScout",
    "RedZone",
    "LastHelmet",
    "Mango",
    "DockRunner",
    "ScopeSeeker",
    "Potato",
];
const slugFor = (index: number) => `demo-${names[index].toLowerCase()}`;

function rating(index: number, size: DuelSize): RankedRating {
    const elo = 1850 - index * 91 + (size - 1) * 27;
    const wins = 96 - index * 6 + size * 3;
    const losses = 26 + index * 2 + size;
    return {
        elo,
        wins,
        losses,
        played: wins + losses,
        streak: (index + size) % 5,
        tier: getRankedTier(elo).name,
        placementsRemaining: 0,
    };
}

function rankedProfile(index: number): RankedStatsProfile {
    const current = {
        1: rating(index, 1).elo,
        2: rating(index, 2).elo,
        3: rating(index, 3).elo,
        4: rating(index, 4).elo,
    };
    const opponents = names.filter((_, i) => i !== index);
    const history: RankedHistory[] = Array.from({ length: 12 }, (_, i) => {
        const size = (i % 4 + 1) as DuelSize;
        const won = i % 3 !== 1;
        const after = current[size];
        const delta = won ? 16 : i === 4 ? -32 : i === 1 ? -8 : -16;
        current[size] -= delta;
        return {
            seriesId: `demo-series-${i}`,
            size,
            at: Date.now() - (i + 1) * 3_600_000,
            score: won ? [5, i % 5] : [i % 5, 5],
            won,
            before: after - delta,
            after,
            delta,
            opponents: Array.from({ length: size }, (_, member) => opponents[(i + member) % opponents.length]),
            forfeited: i === 4,
            reason: i === 4 ? "Personal forfeit" : "elimination",
        };
    });
    return {
        slug: slugFor(index),
        profile: {
            id: slugFor(index),
            name: names[index],
            ratings: { 1: rating(index, 1), 2: rating(index, 2), 3: rating(index, 3), 4: rating(index, 4) },
        },
        history,
    };
}

/** Explicit, read-only development fixtures. Never mounted on a production or PostgreSQL API. */
export function createStatsPreviewRouter(enabled: boolean) {
    const app = new Hono();
    if (!enabled) return app;
    app.post("/user_stats", async c => {
        const body = await c.req.json();
        const index = names.findIndex((_, i) => slugFor(i) === body.slug);
        if (index < 0) return c.json({ slug: "", username: "", modes: [] });
        const scale = body.interval === "daily" ? 0.01 : body.interval === "weekly" ? 0.08 : 1;
        const modes: UserStatsResponse["modes"] = [1, 2, 4].map((teamMode, i) => {
            const games = Math.max(1, Math.round((1144 + i * 481) * scale));
            const wins = Math.round(games * (0.16 + i * 0.04));
            const kills = Math.round(games * (3.5 - i * 0.2));
            return {
                teamMode,
                games,
                wins,
                kills,
                winPct: (wins / games * 100).toFixed(1),
                mostKills: 16 + i,
                mostDamage: 1514 + i * 594,
                kpg: (kills / games).toFixed(1),
                avgDamage: 397 + i * 50,
                avgTimeAlive: 151 - i * 8,
            };
        });
        const total = (key: "wins" | "kills" | "games") => modes.reduce((sum, mode) => sum + mode[key], 0);
        return c.json<UserStatsResponse>({
            slug: slugFor(index),
            username: names[index],
            player_icon: "emote_fish",
            banned: false,
            wins: total("wins"),
            kills: total("kills"),
            games: total("games"),
            kpg: (total("kills") / total("games")).toFixed(1),
            modes,
        });
    });
    app.post("/leaderboard", async c => {
        const { type, interval, teamMode, mapId } = await c.req.json();
        const factor = interval === "daily" ? 1 : interval === "weekly" ? 7 : 30;
        return c.json(names.map((username, i) => ({
            username,
            slug: slugFor(i),
            region: ["eu", "na", "as"][i % 3],
            games: (80 - i * 3) * factor,
            val: type === "kpg"
                ? (4.5 - i * 0.2).toFixed(1)
                : type === "most_damage_dealt"
                ? 2100 - i * 71
                : type === "most_kills"
                ? 21 - i + (teamMode === "squad" ? 2 : 0) + Number(mapId !== "0")
                : (70 - i * 4) * factor,
        })));
    });
    app.post("/match_history", c => c.json([]));
    app.post("/match_data", c => c.json([]));
    app.get("/ranked_profile", c => {
        const index = names.findIndex((_, i) => slugFor(i) === c.req.query("slug"));
        return index < 0 ? c.json({ error: "Demo player not found." }, 404) : c.json(rankedProfile(index));
    });
    app.get("/ranked_leaderboard", c => {
        const size = Number(c.req.query("size") ?? 1) as DuelSize;
        const metric = c.req.query("metric") ?? "elo";
        if (![1, 2, 3, 4].includes(size) || !["elo", "wins"].includes(metric)) {
            return c.json({ error: "Invalid leaderboard." }, 400);
        }
        const entries: RankedStatsEntry[] = names.map((name, i) => ({
            id: slugFor(i),
            slug: slugFor(i),
            name,
            rank: i + 1,
            rating: rating(i, size),
        }));
        entries.sort((a, b) => b.rating[metric as "elo" | "wins"] - a.rating[metric as "elo" | "wins"]);
        return c.json({ entries: entries.map((entry, i) => ({ ...entry, rank: i + 1 })) });
    });
    return app;
}
