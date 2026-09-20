import { Hono } from "hono";
import type { DuelSize, RankedProfile } from "../../../shared/types/ranked.ts";
import type { RankedStatsEntry, RankedStatsProfile } from "../../../shared/types/rankedStats.ts";
import type { RankedStore } from "./store.ts";

export interface StatsIdentity {
    id: string;
    slug: string;
    name: string;
}

export interface RankedStatsAccounts {
    find: (slug: string) => Promise<StatsIdentity | undefined>;
    list: (ids: string[]) => Promise<StatsIdentity[]>;
}

export function emptyRankedProfile(id: string, name: string): RankedProfile {
    const rating = { elo: 1000, wins: 0, losses: 0, played: 0, streak: 0, tier: "Silver", placementsRemaining: 5 };
    return { id, name, ratings: { 1: { ...rating }, 2: { ...rating }, 3: { ...rating }, 4: { ...rating } } };
}

export function localStatsAccounts(store: RankedStore): RankedStatsAccounts {
    return {
        async find(slug) {
            const profile = store.getProfile(slug) ?? store.getProfileByName(slug);
            return profile ? { id: profile.id, slug: profile.id, name: profile.name } : undefined;
        },
        async list(ids) {
            return ids.flatMap(id => {
                const profile = store.getProfile(id);
                return profile ? [{ id, slug: id, name: profile.name }] : [];
            });
        },
    };
}

export async function rankedLeaderboard(
    store: RankedStore,
    accounts: RankedStatsAccounts,
    size: DuelSize,
    metric: "elo" | "wins" = "elo",
    limit = 100,
): Promise<RankedStatsEntry[]> {
    const entries: RankedStatsEntry[] = [];
    // Keep store tiebreaks, filling gaps left by deleted or banned native accounts.
    for (let offset = 0; entries.length < limit; offset += 100) {
        const ratings = store.leaderboard(size, 100, metric, offset);
        if (!ratings.length) break;
        const identities = new Map(
            (await accounts.list(ratings.map(entry => entry.id))).map(identity => [identity.id, identity]),
        );
        for (const entry of ratings) {
            const identity = identities.get(entry.id);
            if (identity) entries.push({ ...entry, name: identity.name, slug: identity.slug });
        }
        if (ratings.length < 100) break;
    }
    return entries.slice(0, limit).map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** Read-only bridge; viewing stats never creates accounts or changes ratings. */
export function createRankedStatsRouter(store: RankedStore, accounts: RankedStatsAccounts) {
    const app = new Hono();
    app.get("/profile", async c => {
        const slug = c.req.query("slug") ?? "";
        const size = Number(c.req.query("size") ?? 0);
        if (![0, 1, 2, 3, 4].includes(size)) return c.json({ error: "Invalid mode." }, 400);
        if (!slug || slug.length > 120) return c.json({ error: "Invalid player." }, 400);
        const account = await accounts.find(slug);
        if (!account) return c.json({ error: "Player not found." }, 404);
        const profile = store.getProfile(account.id) ?? emptyRankedProfile(account.id, account.name);
        return c.json<RankedStatsProfile>({
            slug: account.slug,
            profile: { ...profile, name: account.name },
            history: store.history(account.id, size ? size as DuelSize : undefined),
        });
    });
    app.get("/leaderboard", async c => {
        const size = Number(c.req.query("size") ?? 1);
        const metric = c.req.query("metric") ?? "elo";
        if (![1, 2, 3, 4].includes(size) || !["elo", "wins"].includes(metric)) {
            return c.json({ error: "Invalid leaderboard." }, 400);
        }
        return c.json({
            entries: await rankedLeaderboard(store, accounts, size as DuelSize, metric as "elo" | "wins"),
        });
    });
    return app;
}
