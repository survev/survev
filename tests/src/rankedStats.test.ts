import { afterEach, describe, expect, it, vi } from "vitest";
import { createLocalStatsRouter } from "../../server/src/ranked/localStatsRouter.ts";
import { createStatsPreviewRouter } from "../../server/src/ranked/statsPreview.ts";
import {
    createRankedStatsRouter,
    localStatsAccounts,
    type RankedStatsAccounts,
} from "../../server/src/ranked/statsRouter.ts";
import { RankedStore } from "../../server/src/ranked/store.ts";

const stores: RankedStore[] = [];
afterEach(() => {
    for (const store of stores.splice(0)) store.close();
});
function setup() {
    const store = new RankedStore(":memory:");
    stores.push(store);
    store.linkAccount("p1", "Player One");
    store.linkAccount("p2", "Player Two");
    store.settleSeries("series-1", 1, [["p1"], ["p2"]], 0, [5, 3], "completed");
    return { store, app: createRankedStatsRouter(store, localStatsAccounts(store)) };
}

describe("ranked stats website integration", () => {
    it("exposes account ratings and series history through public profile slugs without a login", async () => {
        const { app, store } = setup();
        const before = store.getProfile("p1");
        const response = await app.request("/profile?slug=player%20one");
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.slug).toBe("p1");
        expect(result.profile.ratings[1]).toMatchObject({ elo: 1032, wins: 1, losses: 0 });
        expect(result.history[0]).toMatchObject({ score: [5, 3], delta: 32 });
        expect(store.getProfile("p1")).toEqual(before);
        expect((await (await app.request("/profile?slug=p1&size=2")).json()).history).toEqual([]);
    });

    it("resolves original account IDs and current native names without creating ranked accounts on reads", async () => {
        const { store } = setup();
        const identities = [{ id: "p1", name: "Renamed Native", slug: "renamed-native-42" }, {
            id: "native-new",
            name: "New Player",
            slug: "new-player",
        }];
        const accounts: RankedStatsAccounts = {
            async find(slug) {
                return identities.find(user => user.slug === slug);
            },
            async list(ids) {
                return identities.filter(user => ids.includes(user.id));
            },
        };
        const app = createRankedStatsRouter(store, accounts);
        const existing = await (await app.request("/profile?slug=renamed-native-42")).json();
        expect(existing.profile).toMatchObject({ id: "p1", name: "Renamed Native", ratings: { 1: { elo: 1032 } } });
        const fresh = await (await app.request("/profile?slug=new-player")).json();
        expect(fresh.profile.ratings[1]).toMatchObject({ played: 0, placementsRemaining: 5 });
        expect(store.getProfile("native-new")).toBeUndefined();
        expect((await (await app.request("/leaderboard?size=1")).json()).entries).toEqual([]);
        for (let index = 2; index <= 5; index++) {
            store.settleSeries(`placement-${index}`, 1, [["p1"], ["p2"]], 0, [5, 3], "completed");
        }
        const board = await (await app.request("/leaderboard?size=1")).json();
        expect(board.entries).toHaveLength(1);
        expect(board.entries[0]).toMatchObject({ name: "Renamed Native", slug: "renamed-native-42" });
    });

    it("rejects unknown players, invalid modes and metrics and hides deleted accounts", async () => {
        const { app, store } = setup();
        expect((await app.request("/profile?slug=missing")).status).toBe(404);
        expect((await app.request("/profile?slug=p1&size=9")).status).toBe(400);
        expect((await app.request("/leaderboard?size=9")).status).toBe(400);
        expect((await app.request("/leaderboard?metric=password")).status).toBe(400);
        for (let index = 2; index <= 5; index++) {
            store.settleSeries(`placement-${index}`, 1, [["p1"], ["p2"]], 0, [5, 3], "completed");
        }
        store.anonymizeAccount("p1");
        expect((await app.request("/profile?slug=p1")).status).toBe(404);
        const board = await (await app.request("/leaderboard?size=1&metric=wins")).json();
        expect(board.entries.map((entry: { id: string }) => entry.id)).toEqual(["p2"]);
    });

    it("fills gaps from native account exclusions while preserving store tiebreak order", async () => {
        const { store } = setup();
        const candidates = Array.from({ length: 120 }, (_, index) => ({
            id: `candidate-${index}`,
            name: `Player ${index}`,
            rank: index + 1,
            rating: store.getProfile("p1")!.ratings[1],
        }));
        const leaderboard = vi.spyOn(store, "leaderboard").mockImplementation((
            _size,
            limit = 50,
            _metric,
            offset = 0,
        ) => candidates.slice(offset, offset + limit));
        const app = createRankedStatsRouter(store, {
            async find() {
                return undefined;
            },
            async list(ids) {
                return candidates.filter((candidate, index) => index >= 10 && ids.includes(candidate.id)).map(
                    candidate => ({ id: candidate.id, slug: candidate.id, name: candidate.name }),
                );
            },
        });
        const result = await (await app.request("/leaderboard?size=1&metric=wins")).json();
        expect(result.entries).toHaveLength(100);
        expect(result.entries[0]).toMatchObject({ id: "candidate-10", rank: 1 });
        expect(result.entries[99]).toMatchObject({ id: "candidate-109", rank: 100 });
        expect(leaderboard).toHaveBeenNthCalledWith(2, 1, 100, "wins", 100);
    });

    it("shows empty normal stats for a real local account rather than made-up results", async () => {
        const { store } = setup();
        const app = createLocalStatsRouter(store);
        const response = await app.request("/user_stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "p1", interval: "alltime", mapIdFilter: "-1" }),
        });
        expect(await response.json()).toMatchObject({ username: "Player One", games: 0, kills: 0, modes: [] });
        expect(await (await app.request("/match_history", { method: "POST" })).json()).toEqual([]);
    });

    it("only serves made-up data when the development preview route is explicitly enabled", async () => {
        expect((await createStatsPreviewRouter(false).request("/ranked_profile?slug=demo-demosurvevr")).status).toBe(
            404,
        );
        const app = createStatsPreviewRouter(true);
        const response = await app.request("/ranked_profile?slug=demo-demosurvevr");
        const profile = await response.json();
        expect(profile.profile.name).toBe("DemoSurvevr");
        expect(Object.keys(profile.profile.ratings)).toEqual(["1", "2", "3", "4"]);
        expect(profile.history).toHaveLength(12);
        for (const size of [1, 2, 3, 4]) {
            const { entries } = await (await app.request(`/ranked_leaderboard?size=${size}`)).json();
            expect(entries).toHaveLength(12);
            expect(entries[0].rating.elo).toBeGreaterThan(entries[1].rating.elo);
        }
    });
});
