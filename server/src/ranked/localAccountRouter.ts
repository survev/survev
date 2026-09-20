import { type Context, Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { loadoutSchema } from "../../../shared/types/api.ts";
import type { RankedProfile } from "../../../shared/types/ranked.ts";
import type { GetPassResponse, ProfileResponse, UsernameResponse } from "../../../shared/types/user.ts";
import { loadout } from "../../../shared/utils/loadout.ts";
import { Config } from "../config.ts";
import { ServerLogger } from "../utils/logger.ts";
import { RankedRequestError, readRankedJson } from "./errors.ts";
import type { RankedStore } from "./store.ts";

export const LOCAL_SESSION_COOKIE = "survev_local_session";
const sessionMaxAge = 30 * 24 * 60 * 60;
const credentialsSchema = z.object({ name: z.string().min(2).max(40), password: z.string().min(8).max(128) });
type AccountContext = {
    Variables: { profile: RankedProfile; token: string };
    Bindings: { incoming?: { socket?: { remoteAddress?: string } } };
};

export interface LocalAccountHooks {
    beforeLogout?: (id: string) => void | Promise<void>;
    beforeRename?: (id: string) => void | Promise<void>;
}

function setLocalCookies(c: Context, token: string): void {
    const secure = new URL(c.req.url).protocol === "https:";
    setCookie(c, LOCAL_SESSION_COOKIE, token, {
        httpOnly: true,
        secure,
        sameSite: "Lax",
        path: "/",
        maxAge: sessionMaxAge,
    });
    // The existing Account controller uses this non-secret marker to restore login after a reload.
    setCookie(c, "app-data", String(Date.now()), { secure, sameSite: "Lax", path: "/", maxAge: sessionMaxAge });
}

function clearLocalCookies(c: Context): void {
    deleteCookie(c, LOCAL_SESSION_COOKIE, { path: "/", httpOnly: true });
    deleteCookie(c, "app-data", { path: "/" });
}

/** Mount at /api before UserRouter only when the original PostgreSQL account backend is disabled. */
export function createLocalAccountRouter(store: RankedStore, hooks: LocalAccountHooks = {}) {
    const app = new Hono<AccountContext>();
    const attempts = new Map<string, { start: number; count: number }>();
    const logger = new ServerLogger("Local accounts");
    app.onError((error, c) => {
        if (error instanceof HTTPException) return error.getResponse();
        if (error instanceof z.ZodError || error instanceof RankedRequestError) {
            const message = error instanceof z.ZodError ? error.issues[0]?.message : error.message;
            return c.json({ success: false, error: message || "Invalid request." }, 400);
        }
        logger.error(c.req.path, error);
        return c.json({ success: false, error: "Unable to complete this request. Please try again." }, 500);
    });

    for (const action of ["register", "login"] as const) {
        app.post(`/auth/local/${action}`, async c => {
            if (!c.req.header("content-type")?.toLowerCase().startsWith("application/json")) {
                return c.json({ success: false, error: "Send account details as JSON." }, 415);
            }
            const ip = (Config.apiServer.proxyIPHeader
                ? c.req.header(Config.apiServer.proxyIPHeader)
                : c.env?.incoming?.socket?.remoteAddress) ?? "local";
            const now = Date.now();
            for (const [key, entry] of attempts) {
                if (now - entry.start >= 60000) attempts.delete(key);
            }
            const attempt = attempts.get(ip) ?? { start: now, count: 0 };
            attempts.set(ip, attempt);
            if (++attempt.count > 20) {
                return c.json({ success: false, error: "Too many sign-in attempts. Please wait a minute." }, 429);
            }
            const body = credentialsSchema.parse(await readRankedJson(c));
            const result = action === "register"
                ? store.register(body.name, body.password)
                : store.login(body.name, body.password);
            setLocalCookies(c, result.token);
            return c.json({ success: true, profile: result.profile });
        });
    }

    app.use("/user/*", async (c, next) => {
        const token = getCookie(c, LOCAL_SESSION_COOKIE) ?? "";
        const profile = store.authenticate(token);
        if (!profile) {
            clearLocalCookies(c);
            return c.json({ success: false, error: "Please sign in to your Survev account." }, 401);
        }
        c.set("profile", profile);
        c.set("token", token);
        await next();
    });

    app.post("/user/profile", c => {
        const profile = c.get("profile");
        const saved = loadoutSchema.safeParse(store.getSavedLoadout(profile.id));
        return c.json<ProfileResponse>({
            success: true,
            profile: {
                slug: profile.id,
                username: profile.name,
                usernameSet: true,
                linked: true,
                usernameChangeTime: 0,
            },
            loadout: saved.success ? loadout.validateWithAvailableItems(saved.data, []) : loadout.defaultLoadout(),
            items: [],
        });
    });

    app.post("/user/get_pass", c =>
        c.json<GetPassResponse>({
            success: true,
            pass: { type: Config.passType, level: 1, xp: 0, unlocks: {}, newItems: false },
            quests: [],
        }));

    app.post("/user/username", async c => {
        const body = z.object({ username: z.string() }).parse(await readRankedJson(c));
        await hooks.beforeRename?.(c.get("profile").id);
        try {
            store.rename(c.get("profile").id, body.username);
            return c.json<UsernameResponse>({ result: "success" });
        } catch (error) {
            if (!(error instanceof RankedRequestError)) throw error;
            const message = error.message;
            return c.json<UsernameResponse>({ result: message.includes("already taken") ? "taken" : "invalid" });
        }
    });

    app.post("/user/loadout", async c => {
        const body = z.object({ loadout: loadoutSchema }).parse(await readRankedJson(c));
        const validated = loadout.validateWithAvailableItems(body.loadout, []);
        store.saveLoadout(c.get("profile").id, validated);
        return c.json({ loadout: validated });
    });

    app.post("/user/logout", async c => {
        await hooks.beforeLogout?.(c.get("profile").id);
        store.logout(c.get("token"));
        clearLocalCookies(c);
        return c.json({});
    });

    app.post("/user/delete", async c => {
        await hooks.beforeLogout?.(c.get("profile").id);
        store.deleteLocalAccount(c.get("profile").id);
        clearLocalCookies(c);
        return c.json({});
    });

    // This local backend does not record normal-match stats or pass progression. Ranked records stay intact.
    app.post("/user/reset_stats", c => c.json({}));
    app.post("/user/set_item_status", c => c.json({}));
    app.post(
        "/user/set_pass_unlock",
        c => c.json({ success: false, error: "Pass progression is unavailable locally." }),
    );
    app.post("/user/refresh_quest", c => c.json({ success: false }));
    return app;
}
