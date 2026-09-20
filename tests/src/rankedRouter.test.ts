import { afterEach, describe, expect, it, vi } from "vitest";
import { RankedCoordinator } from "../../server/src/ranked/coordinator.ts";
import { LOCAL_SESSION_COOKIE } from "../../server/src/ranked/localAccountRouter.ts";
import { createRankedRouters } from "../../server/src/ranked/router.ts";
import { RankedStore } from "../../server/src/ranked/store.ts";

vi.mock("../../server/src/config.ts", () => ({
    Config: {
        database: { enabled: false },
        regions: { local: {} },
        apiServer: {},
        logging: {},
        secrets: { SURVEV_API_KEY: "test-key" },
    },
}));
vi.mock("../../server/src/api/apiHelpers.ts", () => ({ getHonoIp: () => "127.0.0.1" }));
vi.mock("../../server/src/api/auth/index.ts", () => ({ validateSessionToken: vi.fn() }));
vi.mock("../../server/src/api/routes/private/ModerationRouter.ts", () => ({ isBanned: async () => false }));
vi.mock("../../server/src/utils/proxyCheck.ts", () => ({ isBehindProxy: async () => false }));
vi.mock("../../server/src/api/routes/stats/StatsRouter.ts", () => ({
    rankedStatsAccounts: () => ({
        list: async (ids: string[]) =>
            ids.filter(id => id !== "banned").map(id => ({ id, slug: id, name: "Current Name" })),
    }),
}));
const stores: RankedStore[] = [];
afterEach(() => {
    for (const store of stores.splice(0)) store.close();
});
function setup() {
    const store = new RankedStore(":memory:");
    stores.push(store);
    const account = store.register("Main Player", "testing-password");
    const coordinator = new RankedCoordinator(store, { create: vi.fn(), progress: async () => [] });
    const { app } = createRankedRouters(store, coordinator);
    const request = (path: string, body?: string) =>
        app.request(path, {
            method: body === undefined ? "GET" : "POST",
            headers: { cookie: `${LOCAL_SESSION_COOKIE}=${account.token}`, "content-type": "application/json" },
            ...(body === undefined ? {} : { body }),
        });
    return { app, store, account, request };
}

describe("ranked HTTP boundaries", () => {
    it("distinguishes bad requests and missing authentication from private storage failures", async () => {
        const { app, store, request } = setup();
        expect((await app.request("/state")).status).toBe(401);
        expect((await request("/queue/join", "{broken")).status).toBe(400);
        expect((await request("/queue/join", "null")).status).toBe(400);
        expect((await request("/queue/join", JSON.stringify({ size: 5 }))).status).toBe(400);
        expect((await request("/queue/join", JSON.stringify({ size: 1, region: "missing" }))).status).toBe(400);
        expect((await request("/queue/join", JSON.stringify({ size: 1 }))).status).toBe(200);
        vi.spyOn(store, "history").mockImplementation(() => {
            throw new Error("SQLITE private/database/path");
        });
        const response = await request("/state");
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: "Unable to complete this request. Please try again." });
    });

    it("uses the public stats identity filter and current names for the menu ladder", async () => {
        const { store, account, request } = setup();
        vi.spyOn(store, "leaderboard").mockReturnValue([
            { id: "banned", name: "Banned Player", rank: 1, rating: account.profile.ratings[1] },
            { id: account.profile.id, name: "Old Name", rank: 2, rating: account.profile.ratings[1] },
        ]);
        const response = await request("/leaderboard?size=1");
        expect(response.status).toBe(200);
        const { entries } = await response.json();
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({ id: account.profile.id, rank: 1, name: "Current Name" });
    });
});
