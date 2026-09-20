import ejs from "ejs";
import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getRankedTier } from "../../shared/defs/rankedDefs.ts";
import { RankedPlacementSeries } from "../../shared/types/ranked.ts";
import type { RankedStatsEntry, RankedStatsProfile } from "../../shared/types/rankedStats.ts";

vi.mock("../../client/src/api.ts", () => ({ api: { resolveUrl: (path: string) => path } }));

function template(name: string) {
    const source = fs.readFileSync(new URL(`../../client/src/stats/js/templates/${name}`, import.meta.url), "utf8");
    return ejs.compile(source, { client: true, strict: true, rmWhitespace: true, localsName: "env" });
}

const cards = template("rankedCards.ejs");
const leaderboard = template("rankedLeaderboard.ejs");

function data(): RankedStatsProfile {
    const rating = { elo: 1000, wins: 0, losses: 0, played: 0, streak: 0, tier: "Silver", placementsRemaining: 5 };
    return {
        profile: {
            id: "player",
            name: "Player",
            ratings: { 1: { ...rating }, 2: { ...rating }, 3: { ...rating }, 4: { ...rating } },
        },
        slug: "player",
        history: [],
    };
}

function environment(profile = data()) {
    return {
        data: profile,
        loading: false,
        error: false,
        historySize: 0,
        getRankedTier,
        placementSeries: RankedPlacementSeries,
        statsLink: (params: Record<string, string>) => `/stats/?${new URLSearchParams(params)}`,
    };
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe("ranked stats templates", () => {
    it("shows independent placement progress and no earned badge before five series", () => {
        const profile = data();
        profile.profile.ratings[2] = {
            ...profile.profile.ratings[2],
            played: 2,
            wins: 1,
            losses: 1,
            placementsRemaining: 3,
        };
        const html = cards(environment(profile));
        expect(html.match(/aria-label="Unranked"/g)).toHaveLength(4);
        expect(html).toContain("Placements 2/5");
        expect(html).toContain("3 to join the ladder");
        expect(html).not.toContain("silver.svg");
    });

    it("shows an earned badge after placement and never renders a negative win streak", () => {
        const profile = data();
        profile.profile.ratings[1] = {
            ...profile.profile.ratings[1],
            played: 5,
            wins: 3,
            losses: 2,
            placementsRemaining: 0,
            streak: -2,
        };
        const html = cards(environment(profile));
        expect(html).toContain("silver.svg");
        expect(html).not.toContain("<strong>-2</strong>");
        expect(html.match(/aria-label="Unranked"/g)).toHaveLength(3);
    });

    it("escapes opponent names, labels a personal forfeit, and filters history by selected mode", () => {
        const profile = data();
        profile.history.push({
            seriesId: "series",
            size: 2,
            at: 1,
            score: [1, 5],
            won: false,
            forfeited: true,
            before: 1000,
            after: 936,
            delta: -64,
            opponents: ["<script>alert(1)</script>"],
            reason: "player_forfeit",
        });
        const html = cards(environment(profile));
        expect(html).toContain("Forfeit 1–5");
        expect(html).toContain("&lt;script&gt;");
        expect(html).not.toContain("<script>");
        expect(cards({ ...environment(profile), historySize: 1 })).not.toContain("&lt;script&gt;");
    });

    it("renders loading, unavailable and empty states without showing stale stats", () => {
        const env = environment();
        expect(cards({ ...env, loading: true })).toContain("Loading ranked stats");
        const failed = cards({ ...env, error: true });
        expect(failed).toContain("Ranked stats are unavailable");
        expect(failed).not.toContain("Provisional Elo");
        expect(cards(env)).toContain("No recent ranked series");
    });

    it("escapes leaderboard names and URLs and displays the chosen metric", () => {
        const entry: RankedStatsEntry = {
            id: "player",
            slug: "player\" onclick=\"alert(1)",
            name: "<img src=x onerror=alert(1)>",
            rank: 1,
            rating: { ...data().profile.ratings[1], played: 8, wins: 6, losses: 2, placementsRemaining: 0 },
        };
        const env = { ...environment(), entries: [entry], metric: "Series wins" };
        const html = leaderboard(env);
        expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
        expect(html).toContain("slug=player%22");
        expect(html).toContain("<td>6</td>");
        expect(html).not.toContain("onclick=\"");
        expect(leaderboard({ ...env, entries: [] })).toContain("No placed players yet");
    });
});

describe("ranked stats preview isolation", () => {
    async function api(development: boolean) {
        vi.resetModules();
        vi.stubEnv("DEV", development);
        vi.stubGlobal("location", { search: "?preview=1" });
        return vi.importActual<{
            statsPreview: boolean;
            statsUrl: (path: string) => string;
            statsLink: (params?: Record<string, string>) => string;
        }>("../../client/src/stats/js/statsApi.ts");
    }

    it("ignores the preview query in production", async () => {
        const stats = await api(false);
        expect(stats.statsPreview).toBe(false);
        expect(stats.statsUrl("/api/ranked_stats/profile")).toBe("/api/ranked_stats/profile");
        expect(stats.statsLink({ slug: "real-player" })).not.toContain("preview");
    });

    it("keeps an explicit development preview on its sample routes and links", async () => {
        const stats = await api(true);
        expect(stats.statsPreview).toBe(true);
        expect(stats.statsUrl("/api/ranked_stats/profile")).toBe("/api/stats_preview/ranked_profile");
        expect(stats.statsUrl("/api/leaderboard")).toBe("/api/stats_preview/leaderboard");
        expect(stats.statsUrl("/api/auth/providers")).toBe("/api/auth/providers");
        expect(stats.statsLink({ slug: "demo-player" })).toContain("preview=1");
    });
});
