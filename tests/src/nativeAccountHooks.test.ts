import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUserRouter } from "../../server/src/api/routes/user/UserRouter.ts";

const observed = vi.hoisted(() => ({
    events: [] as string[],
    busy: false,
    cleanupFails: false,
    intentFails: false,
    commitFails: false,
    renameSyncFails: false,
}));

vi.mock("../../server/src/api/apiServer.ts", () => ({ server: { logger: { error: vi.fn() } } }));
vi.mock("../../server/src/api/routes/user/auth/authUtils.ts", () => ({
    getTimeUntilNextUsernameChange: () => 0,
    sanitizeSlug: (name: string) => name.toLowerCase(),
    logoutUser: async () => {
        observed.events.push("logout-session");
    },
}));
vi.mock("../../server/src/api/auth/middleware.ts", () => {
    const passthrough = async (_context: unknown, next: () => Promise<void>) => next();
    return {
        databaseEnabledMiddleware: passthrough,
        rateLimitMiddleware: () => passthrough,
        authMiddleware: async (c: any, next: () => Promise<void>) => {
            c.set("user", { id: "native-player", username: "Before", lastUsernameChangeTime: new Date(0) });
            c.set("session", { id: "native-session" });
            await next();
        },
        validateParams: () => async (c: any, next: () => Promise<void>) => {
            c.req.addValidatedData("json", await c.req.json());
            await next();
        },
    };
});
vi.mock("../../server/src/api/db/index.ts", () => {
    const db = {
        query: { usersTable: { findFirst: async () => undefined } },
        delete: () => ({
            where: async () => {
                observed.events.push("delete-native");
            },
        }),
        update: () => ({
            set: () => ({
                where: async () => {
                    observed.events.push("update-native");
                },
            }),
        }),
        transaction: async (action: (tx: unknown) => Promise<void>) => {
            observed.events.push("begin");
            try {
                await action(db);
                if (observed.commitFails) throw new Error("PostgreSQL commit failed.");
                observed.events.push("commit");
            } catch (error) {
                observed.events.push("rollback");
                throw error;
            }
        },
    };
    return { db };
});

function setup() {
    const idleGuard = () => {
        observed.events.push("guard");
        if (observed.busy) throw new Error("Finish the ranked series first.");
    };
    const app = createUserRouter({
        beforeLogout: idleGuard,
        beforeRename: idleGuard,
        afterRename: (_id, name) => {
            observed.events.push(`ranked-name:${name}`);
            if (observed.renameSyncFails) throw new Error("Ranked name write failed.");
        },
        beforeDelete: () => {
            observed.events.push("ranked-intent");
            if (observed.intentFails) throw new Error("Ranked intent write failed.");
        },
        onDelete: () => {
            observed.events.push("ranked-cleanup");
            if (observed.cleanupFails) throw new Error("Ranked database write failed.");
        },
    });
    app.onError((error, c) => c.json({ error: error.message }, 409));
    return app;
}

beforeEach(() => {
    observed.events.length = 0;
    observed.busy = false;
    observed.cleanupFails = false;
    observed.intentFails = false;
    observed.commitFails = false;
    observed.renameSyncFails = false;
});

describe("native account ranked hooks", () => {
    it("keeps a committed native rename successful when the linked name needs resynchronization", async () => {
        observed.renameSyncFails = true;
        const response = await setup().request("/username", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ username: "Changed" }),
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ result: "success" });
        expect(observed.events).toEqual(["guard", "update-native", "ranked-name:Changed"]);
    });

    it("guards logout, rename and deletion before mutating the original account", async () => {
        observed.busy = true;
        const app = setup();
        for (const path of ["logout", "username", "delete"]) {
            const response = await app.request(`/${path}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ username: "Changed" }),
            });
            expect(response.status).toBe(409);
        }
        expect(observed.events).toEqual(["guard", "guard", "guard"]);
    });

    it("records intent before native deletion and only cleans ranked data after PostgreSQL commits", async () => {
        const response = await setup().request("/delete", { method: "POST" });
        expect(response.status).toBe(200);
        expect(observed.events).toEqual([
            "guard",
            "ranked-intent",
            "begin",
            "delete-native",
            "update-native",
            "commit",
            "ranked-cleanup",
            "logout-session",
        ]);
    });

    it("still logs out after native commit when linked cleanup fails and needs retry", async () => {
        observed.cleanupFails = true;
        const response = await setup().request("/delete", { method: "POST" });
        expect(response.status).toBe(200);
        expect(observed.events).toEqual([
            "guard",
            "ranked-intent",
            "begin",
            "delete-native",
            "update-native",
            "commit",
            "ranked-cleanup",
            "logout-session",
        ]);
    });

    it("does not start PostgreSQL deletion if the durable cleanup intent cannot be written", async () => {
        observed.intentFails = true;
        const response = await setup().request("/delete", { method: "POST" });
        expect(response.status).toBe(409);
        expect(observed.events).toEqual(["guard", "ranked-intent"]);
    });

    it("does not anonymize ranked data or end the session when PostgreSQL fails at commit", async () => {
        observed.commitFails = true;
        const response = await setup().request("/delete", { method: "POST" });
        expect(response.status).toBe(409);
        expect(observed.events).toEqual([
            "guard",
            "ranked-intent",
            "begin",
            "delete-native",
            "update-native",
            "rollback",
        ]);
    });

    it("updates the linked ranked name after a successful main account rename", async () => {
        const response = await setup().request("/username", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ username: "Changed" }),
        });
        expect(await response.json()).toEqual({ result: "success" });
        expect(observed.events).toEqual(["guard", "update-native", "ranked-name:Changed"]);
    });
});
