import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Cron } from "croner";
import { randomUUID } from "crypto";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { version } from "../../../package.json";
import {
    type FindGameResponse,
    type SiteInfoRes,
    zFindGameBody,
} from "../../../shared/types/api";
import { Config } from "../config";
import { GIT_VERSION } from "../utils/gitRevision";
import {
    getHonoIp,
    HTTPRateLimit,
    isBehindProxy,
    logErrorToWebhook,
    verifyTurnsStile,
} from "../utils/serverHelpers";
import { server } from "./apiServer";
import { deleteExpiredSessions, validateSessionToken } from "./auth";
import { rateLimitMiddleware, validateParams } from "./auth/middleware";
import type { SessionTableSelect, UsersTableSelect } from "./db/schema";
import { cleanupOldLogs, isBanned } from "./routes/private/ModerationRouter";
import { PrivateRouter } from "./routes/private/private";
import { StatsRouter } from "./routes/stats/StatsRouter";
import { AuthRouter } from "./routes/user/AuthRouter";
import { UserRouter } from "./routes/user/UserRouter";

export type Context = {
    Variables: {
        user: UsersTableSelect | null;
        session: SessionTableSelect | null;
    };
};

process.on("uncaughtException", async (err) => {
    console.error(err);

    await logErrorToWebhook("server", "API server error:", err);

    process.exit(1);
});

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.onError((err: unknown, c) => {
    server.logger.error(`${c.req.path} Error:`, err);
    if (err instanceof HTTPException) {
        return err.getResponse();
    }
    return c.text("Internal Server Error", 500);
});

app.use(
    "/api/*",
    cors({
        origin: "*",
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Origin", "Content-Type", "Accept", "X-Requested-With"],
        maxAge: 3600,
    }),
);

// @TODO: figure out the origins for this..
// app.use(csrf())

app.route("/api/user/", UserRouter);
app.route("/api/auth/", AuthRouter);
app.route("/api/", StatsRouter);
app.route("/private/", PrivateRouter);

server.init(app, upgradeWebSocket);

app.get("/api/site_info", (c) => {
    return c.json<SiteInfoRes>(server.getSiteInfo(), 200);
});

// not using the middleware here to not add extra indentation... smh
const findGameRateLimit = new HTTPRateLimit(5, 3000);

app.post("/api/find_game", validateParams(zFindGameBody), async (c) => {
    const ip = getHonoIp(c, Config.apiServer.proxyIPHeader);

    if (!ip) {
        return c.json<FindGameResponse>({ error: "invalid_ip" }, 500);
    }

    if (findGameRateLimit.isRateLimited(ip)) {
        return c.json<FindGameResponse>({ error: "rate_limited" }, 429);
    }

    const banData = await isBanned(ip);
    if (banData) {
        return c.json<FindGameResponse>({
            banned: true,
            reason: banData.reason,
            permanent: banData.permanent,
            expiresIn: banData.expiresIn,
        });
    }

    const token = randomUUID();
    let user: UsersTableSelect | null = null;

    const sessionId = getCookie(c, "session") ?? null;

    if (sessionId) {
        try {
            const account = await validateSessionToken(sessionId);
            user = account.user;

            if (account.user?.banned) {
                user = null;
            }
        } catch (err) {
            server.logger.error("/api/find_game: Failed to validate session", err);
            user = null;
        }
    }

    if (await isBehindProxy(ip, user ? 0 : 3)) {
        return c.json<FindGameResponse>({ error: "behind_proxy" });
    }

    const body = c.req.valid("json");
    if (server.captchaEnabled && !user) {
        if (!body.turnstileToken) {
            return c.json<FindGameResponse>({ error: "invalid_captcha" });
        }

        try {
            if (!(await verifyTurnsStile(body.turnstileToken, ip))) {
                return c.json<FindGameResponse>({ error: "invalid_captcha" });
            }
        } catch (err) {
            server.logger.error("/api/find_game: Failed verifying turnstile: ", err);
            return c.json<FindGameResponse>({ error: "invalid_captcha" }, 500);
        }
    }

    const mode = server.modes[body.gameModeIdx];
    if (!mode || !mode.enabled) {
        return c.json<FindGameResponse>({ error: "full" });
    }

    const data = await server.findGame({
        region: body.region,
        version: body.version,
        mapName: mode.mapName,
        teamMode: mode.teamMode,
        autoFill: true,
        playerData: [
            {
                token,
                userId: user?.id || null,
                ip,
                loadout: user?.loadout,
            },
        ],
    });

    if ("error" in data) {
        return c.json(data);
    }

    return c.json<FindGameResponse>({
        res: [
            {
                zone: "",
                data: token,
                useHttps: data.useHttps,
                hosts: data.hosts,
                addrs: data.addrs,
                gameId: data.gameId,
            },
        ],
    });
});

app.post(
    "/api/report_error",
    rateLimitMiddleware(5, 60 * 1000),
    validateParams(z.object({ loc: z.string(), error: z.any(), data: z.any() })),
    (c) => {
        const content = c.req.valid("json");
        if (content.error) {
            try {
                content.error = JSON.parse(content.error);
            } catch {}
        }

        let stackTrace: string | undefined;
        if (
            typeof content.error == "object" &&
            "stacktrace" in content.error &&
            typeof content.error.stacktrace == "string" &&
            content.error.stacktrace
        ) {
            stackTrace = `### Stacktrace:\n \`\`\`${content.error.stacktrace.replaceAll("`", "\\`")}\`\`\``;
            delete content.error.stacktrace;
        }

        logErrorToWebhook("client", content, stackTrace);

        return c.json({ success: true }, 200);
    },
);

// reset player count to 0 if region seems to be down
setInterval(() => {
    for (const regionId in server.regions) {
        const region = server.regions[regionId];
        if (Date.now() - region.lastUpdateTime > 60000) {
            server.logger.warn(
                `Region ${regionId} has not sent player count in more than 60 seconds`,
            );
            region.playerCount = 0;
        }
    }
}, 60000);

const honoServer = serve({
    fetch: app.fetch,
    port: Config.apiServer.port,
});
injectWebSocket(honoServer);

// run clean up scripts every midnight
new Cron("0 0 * * *", async () => {
    try {
        await cleanupOldLogs();
        await deleteExpiredSessions();
        server.logger.info("Deleted old logs and expired sessions");
    } catch (err) {
        server.logger.error("Failed to run cleanup script", err);
    }
});

server.logger.info(`Survev API Server v${version} - GIT ${GIT_VERSION}`);
server.logger.info(`Listening on ${Config.apiServer.host}:${Config.apiServer.port}`);
server.logger.info("Press Ctrl+C to exit.");
