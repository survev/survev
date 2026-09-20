import { afterEach, describe, expect, it, vi } from "vitest";
import { createRankedAccountHooks } from "../../server/src/ranked/accountHooks.ts";
import { RankedCoordinator } from "../../server/src/ranked/coordinator.ts";
import { RankedRequestError } from "../../server/src/ranked/errors.ts";
import { createLocalAccountRouter, LOCAL_SESSION_COOKIE } from "../../server/src/ranked/localAccountRouter.ts";
import { RankedStore } from "../../server/src/ranked/store.ts";
import { loadout } from "../../shared/utils/loadout.ts";

vi.mock("../../server/src/config.ts", () => ({ Config: { passType: "pass_survivr2", apiServer: {}, logging: {} } }));
const stores: RankedStore[] = [];
const password = "local-game-password";

function setup(hooks: Parameters<typeof createLocalAccountRouter>[1] = {}) {
    const store = new RankedStore(":memory:");
    stores.push(store);
    const app = createLocalAccountRouter(store, hooks);
    return { app, store };
}

function cookies(response: Response) {
    return response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
}

function post(app: ReturnType<typeof setup>["app"], path: string, body?: unknown, cookie?: string) {
    return app.request(`/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
        body: JSON.stringify(body ?? {}),
    });
}

afterEach(() => {
    for (const store of stores.splice(0)) store.close();
});

describe("local fallback for the main Survev account UI", () => {
    it("uses one HttpOnly session for the main profile and ranked identity", async () => {
        const { app, store } = setup();
        const signup = await post(app, "auth/local/register", { name: "Main Player", password });
        expect(signup.status).toBe(200);
        const created = await signup.json();
        expect(created.success).toBe(true);
        expect(created.token).toBeUndefined();
        const sessionCookie = signup.headers.getSetCookie().find(value =>
            value.startsWith(`${LOCAL_SESSION_COOKIE}=`)
        )!;
        expect(sessionCookie).toContain("HttpOnly");
        expect(sessionCookie).toContain("SameSite=Lax");
        expect(signup.headers.getSetCookie().some(value => value.startsWith("app-data="))).toBe(true);
        expect(signup.headers.getSetCookie().some(value => value.startsWith("session="))).toBe(false);
        const token = sessionCookie.split(";")[0].split("=")[1];
        expect(store.authenticate(token)?.id).toBe(created.profile.id);
        const profile = await post(app, "user/profile", {}, cookies(signup));
        expect(await profile.json()).toMatchObject({
            success: true,
            profile: { username: "Main Player", slug: created.profile.id, linked: true, usernameSet: true },
            items: [],
        });
        const pass = await post(app, "user/get_pass", { tryRefreshQuests: true }, cookies(signup));
        expect(await pass.json()).toMatchObject({
            success: true,
            pass: { type: "pass_survivr2", level: 1 },
            quests: [],
        });
        const forged = await app.request("/user/profile", {
            method: "POST",
            headers: { authorization: `Bearer ${token}` },
        });
        expect(forged.status).toBe(401);
    });

    it("logs out and restores the same account and Elo through the main login API", async () => {
        const { app, store } = setup();
        const signup = await post(app, "auth/local/register", { name: "Main Player", password });
        const created = await signup.json();
        const other = store.register("Opponent", password).profile;
        store.settleSeries("one-series", 1, [[created.profile.id], [other.id]], 0, [5, 2], "completed");
        const cookie = cookies(signup);
        expect((await post(app, "user/reset_stats", {}, cookie)).status).toBe(200);
        expect(store.getProfile(created.profile.id)?.ratings[1].elo).toBe(1032);
        expect((await post(app, "user/logout", {}, cookie)).status).toBe(200);
        expect((await post(app, "user/profile", {}, cookie)).status).toBe(401);
        expect((await post(app, "auth/local/login", { name: "Main Player", password: "incorrect password" })).status)
            .toBe(400);
        const login = await post(app, "auth/local/login", { name: "main player", password });
        expect(await login.json()).toMatchObject({
            success: true,
            profile: { id: created.profile.id, ratings: { 1: { elo: 1032 } } },
        });
        expect((await post(app, "user/profile", {}, cookies(login))).status).toBe(200);
    });

    it("saves normal account loadout choices and renames the same ranked identity", async () => {
        const { app, store } = setup();
        const signup = await post(app, "auth/local/register", { name: "Main Player", password });
        const created = await signup.json();
        const cookie = cookies(signup);
        const customized = loadout.defaultLoadout();
        customized.crosshair.color = 0x88ff44;
        expect((await post(app, "user/loadout", { loadout: customized }, cookie)).status).toBe(200);
        expect((await (await post(app, "user/profile", {}, cookie)).json()).loadout.crosshair.color).toBe(0x88ff44);
        expect(await (await post(app, "user/username", { username: "Renamed Player" }, cookie)).json()).toEqual({
            result: "success",
        });
        expect(store.getProfile(created.profile.id)?.name).toBe("Renamed Player");
        expect(await (await post(app, "user/username", { username: "<unsafe>" }, cookie)).json()).toEqual({
            result: "invalid",
        });
    });

    it("does not bypass active ranked account mutation guards", async () => {
        const guard = () => {
            throw new RankedRequestError("Finish the current ranked series first.");
        };
        const { app, store } = setup({ beforeLogout: guard, beforeRename: guard });
        const signup = await post(app, "auth/local/register", { name: "Main Player", password });
        const created = await signup.json();
        const cookie = cookies(signup);
        for (const path of ["user/logout", "user/delete", "user/username"]) {
            const response = await post(app, path, { username: "Changed Name" }, cookie);
            expect(response.status).toBe(400);
            expect(await response.json()).toMatchObject({ error: "Finish the current ranked series first." });
        }
        expect(store.getProfile(created.profile.id)?.name).toBe("Main Player");
        expect((await post(app, "user/profile", {}, cookie)).status).toBe(200);
    });

    it("deletes credentials while preserving opponents' results", async () => {
        const { app, store } = setup();
        const signup = await post(app, "auth/local/register", { name: "Main Player", password });
        const created = await signup.json();
        const other = store.register("Opponent", password).profile;
        store.settleSeries("one-series", 1, [[created.profile.id], [other.id]], 0, [5, 2], "completed");
        expect((await post(app, "user/delete", {}, cookies(signup))).status).toBe(200);
        expect(store.getProfile(created.profile.id)).toBeUndefined();
        expect(store.getProfile(other.id)?.ratings[1].elo).toBe(968);
        expect(store.history(other.id)[0].opponents).toEqual(["Deleted Player"]);
        expect(store.leaderboard(1)).toEqual([]);
        expect((await post(app, "auth/local/login", { name: "Main Player", password })).status).toBe(400);
    });

    it("preserves a busy guard status and never reports storage failures as invalid usernames", async () => {
        const hooks: Parameters<typeof createLocalAccountRouter>[1] = {};
        const { app, store } = setup(hooks);
        const signup = await post(app, "auth/local/register", { name: "Main Player", password });
        const cookie = cookies(signup);
        const { profile } = await signup.json();
        const coordinator = new RankedCoordinator(store, { create: vi.fn(), progress: async () => [] });
        coordinator.touch(profile.id);
        coordinator.joinQueue(profile.id, 1);
        hooks.beforeLogout = createRankedAccountHooks(store, coordinator).beforeLogout;
        expect((await post(app, "user/logout", {}, cookie)).status).toBe(409);
        vi.spyOn(store, "rename").mockImplementation(() => {
            throw new Error("SQLITE private/database/path");
        });
        const response = await post(app, "user/username", { username: "New Player" }, cookie);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            success: false,
            error: "Unable to complete this request. Please try again.",
        });
        expect(await (await post(app, "user/set_pass_unlock", {}, cookie)).json()).toMatchObject({ success: false });
    });
});
