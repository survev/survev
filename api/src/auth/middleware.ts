import { zValidator } from "@hono/zod-validator";
import { HTTPRateLimit } from "@survev/shared/utils/ratelimit";
import type { Context, Next } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { z } from "zod";
import { server } from "../apiServer";
import { Config } from "../config";
import { cookieDomain, deleteSessionTokenCookie } from "../routes/user/auth/authUtils";
import { getHonoIp } from "../utils";
import { validateSessionToken } from ".";

export const authMiddleware = async (c: Context, next: Next) => {
    try {
        const sessionToken = getCookie(c, "session") ?? null;

        if (!sessionToken) {
            c.set("user", null);
            c.set("session", null);
            return c.json({ error: "Authentication failed" }, 401);
        }
        const { session, user } = await validateSessionToken(sessionToken);

        if (!user) {
            return c.json({ error: "Authentication failed" }, 401);
        }

        if (session) {
            setCookie(c, "session", sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                expires: session.expiresAt,
                domain: cookieDomain,
            });
        } else {
            deleteSessionTokenCookie(c);
            deleteCookie(c, "app-data");
        }

        c.set("user", user);
        c.set("session", session);
        return next();
    } catch (err) {
        server.logger.error("Error trying to authenticate user", err);
        return c.json({ error: "Authentication failed" }, 500);
    }
};

/**
 * middleware for validating JSON request parameters against a Zod schema.
 */
export function validateParams<Schema extends z.ZodSchema>(
    schema: Schema,
    response?: object,
) {
    return zValidator("json", schema, (result, c) => {
        if (!result.success) {
            return c.json(
                response ?? {
                    error: "Invalid params",
                },
                400,
            );
        }
    });
}

export async function databaseEnabledMiddleware(c: Context, next: Next) {
    if (!Config.database.enabled) {
        return c.json({ error: "Database is disabled" }, 403);
    }
    await next();
}

export async function privateMiddleware(c: Context, next: Next) {
    if (c.req.header("survev-api-key") !== Config.secrets.SURVEV_API_KEY) {
        return c.json({ error: "Forbidden" }, 403);
    }
    await next();
}

export function rateLimitMiddleware(limit: number, interval: number) {
    const rateLimit = new HTTPRateLimit(limit, interval);

    return async function (c: Context, next: Next) {
        const ip = getHonoIp(c, Config.apiServer.proxyIPHeader);

        if (!ip) {
            return c.json({ error: "invalid_ip" }, 500);
        }

        if (rateLimit.isRateLimited(ip)) {
            return c.json({ error: "rate_limited" }, 429);
        }

        await next();
    };
}
