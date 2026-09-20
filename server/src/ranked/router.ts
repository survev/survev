import { type Context, Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { DuelSize, RankedProfile } from "../../../shared/types/ranked.ts";
import { getHonoIp } from "../api/apiHelpers.ts";
import { validateSessionToken } from "../api/auth/index.ts";
import { isBanned } from "../api/routes/private/ModerationRouter.ts";
import { rankedStatsAccounts } from "../api/routes/stats/StatsRouter.ts";
import { Config } from "../config.ts";
import { ServerLogger } from "../utils/logger.ts";
import { isBehindProxy } from "../utils/proxyCheck.ts";
import { HTTPRateLimit } from "../utils/rateLimit.ts";
import type { RankedCoordinator } from "./coordinator.ts";
import { RankedRequestError, readRankedJson } from "./errors.ts";
import { LOCAL_SESSION_COOKIE } from "./localAccountRouter.ts";
import { rankedLeaderboard } from "./statsRouter.ts";
import type { RankedStore } from "./store.ts";

const sizeSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const combatSchema = z.object({
    seriesId: z.string(),
    roundId: z.string(),
    round: z.number().int().positive(),
    gameId: z.string(),
    players: z.array(
        z.object({
            profileId: z.string().min(1).max(120),
            kills: z.number().int().min(0).max(1000),
            damageDealt: z.number().finite().min(0).max(1e9),
            roundWins: z.number().int().min(0).max(1),
        }),
    ).max(8),
});
const reportSchema = z.object({
    seriesId: z.string(),
    roundId: z.string(),
    round: z.number().int().positive(),
    gameId: z.string(),
    winnerTeam: z.union([z.literal(0), z.literal(1)]).nullable(),
    reason: z.enum(["elimination", "disconnect", "connection_timeout", "draw"]),
    started: z.boolean(),
    missingTeams: z.array(z.union([z.literal(0), z.literal(1)])).max(2).optional(),
    missingProfileIds: z.array(z.string().min(1).max(120)).max(8).optional(),
    abandonedProfileIds: z.array(z.string().min(1).max(120)).max(8).optional(),
    combat: combatSchema.optional(),
});
type RankedContext = { Variables: { profile: RankedProfile } };

export function createRankedRouters(store: RankedStore, coordinator: RankedCoordinator) {
    const app = new Hono<RankedContext>();
    const privateApp = new Hono();
    const actionLimit = new HTTPRateLimit(60, 60000);
    const logger = new ServerLogger("Ranked");
    const accounts = rankedStatsAccounts(store);
    const nativeAccount = async (c: Context) => {
        if (!Config.database.enabled) return store.authenticate(getCookie(c, LOCAL_SESSION_COOKIE) ?? "") ?? null;
        const token = getCookie(c, "session");
        if (!token) return null;
        const account = await validateSessionToken(token);
        if (!account.user || account.user.banned) return null;
        return store.linkAccount(account.user.id, account.user.username);
    };
    const regionFor = (value: unknown) => {
        const region = value === undefined ? Object.keys(Config.regions)[0] : z.string().parse(value);
        if (!region || !Config.regions[region]) throw new RankedRequestError("Choose an available game region.");
        return region;
    };
    app.onError((error, c) => {
        if (error instanceof HTTPException) return error.getResponse();
        if (error instanceof z.ZodError) return c.json({ error: error.issues[0]?.message ?? "Invalid request." }, 400);
        if (error instanceof RankedRequestError) return c.json({ error: error.message }, 400);
        logger.error(c.req.path, error);
        return c.json({ error: "Unable to complete this request. Please try again." }, 500);
    });
    app.get(
        "/session",
        async c => c.json({ nativeAccounts: true, profile: await nativeAccount(c) }),
    );
    app.get("/leaderboard", async c => {
        const size = sizeSchema.parse(Number(c.req.query("size") ?? 1));
        return c.json({ entries: await rankedLeaderboard(store, accounts, size, "elo", 50) });
    });
    app.use("*", async (c, next) => {
        const profile = await nativeAccount(c);
        if (!profile) return c.json({ error: "Sign in from the main menu to play ranked." }, 401);
        c.set("profile", profile);
        coordinator.touch(profile.id, getHonoIp(c, Config.apiServer.proxyIPHeader) ?? "127.0.0.1");
        if (c.req.method !== "GET" && actionLimit.isRateLimited(profile.id)) {
            return c.json({ error: "Please wait a moment before trying again." }, 429);
        }
        await next();
    });
    app.get("/state", c => c.json(coordinator.state(c.get("profile").id)));
    app.get(
        "/history",
        c => c.json({
            entries: store.history(
                c.get("profile").id,
                c.req.query("size") ? sizeSchema.parse(Number(c.req.query("size"))) : undefined,
            ),
        }),
    );
    for (
        const action of [
            "queue/join",
            "queue/leave",
            "match/accept",
            "match/decline",
            "party/create",
            "party/join",
            "party/leave",
            "party/ready",
            "party/size",
            "party/disband",
            "series/ack",
            "series/forfeit",
        ] as const
    ) {
        app.post(`/${action}`, async c => {
            const id = c.get("profile").id;
            const body = z.record(z.string(), z.unknown()).parse(await readRankedJson(c));
            if (action === "queue/join" || (action === "party/ready" && body.ready === true)) {
                const ip = getHonoIp(c, Config.apiServer.proxyIPHeader);
                if (!ip) return c.json({ error: "Unable to determine your connection address." }, 400);
                if (await isBanned(ip)) return c.json({ error: "This connection is banned from playing." }, 403);
                if (await isBehindProxy(ip, false)) {
                    return c.json({ error: "This connection is not allowed by the game server." }, 403);
                }
            }
            switch (action) {
                case "queue/join":
                    coordinator.joinQueue(id, sizeSchema.parse(body.size) as DuelSize, regionFor(body.region));
                    break;
                case "queue/leave":
                    coordinator.leaveQueue(id);
                    break;
                case "match/accept":
                    coordinator.acceptMatch(id, z.string().uuid().parse(body.matchId));
                    break;
                case "match/decline":
                    coordinator.declineMatch(id, z.string().uuid().parse(body.matchId));
                    break;
                case "party/create":
                    coordinator.createParty(id, sizeSchema.parse(body.size), regionFor(body.region));
                    break;
                case "party/join":
                    coordinator.joinParty(id, z.string().min(1).max(10).parse(body.code));
                    break;
                case "party/leave":
                    coordinator.leaveParty(id);
                    break;
                case "party/ready":
                    coordinator.ready(id, z.boolean().parse(body.ready));
                    break;
                case "party/size":
                    coordinator.resizeParty(id, sizeSchema.parse(body.size));
                    break;
                case "party/disband":
                    coordinator.disbandParty(id);
                    break;
                case "series/ack":
                    coordinator.acknowledge(id);
                    break;
                case "series/forfeit":
                    await coordinator.tick();
                    await coordinator.forfeit(id);
                    break;
            }
            return c.json(coordinator.state(id));
        });
    }
    privateApp.use("*", async (c, next) => {
        if (!Config.secrets.SURVEV_API_KEY || c.req.header("survev-api-key") !== Config.secrets.SURVEV_API_KEY) {
            return c.json({ error: "Forbidden" }, 403);
        }
        await next();
    });
    privateApp.post("/round-result", async c => {
        const body = reportSchema.safeParse(await readRankedJson(c));
        if (!body.success) return c.json({ error: "Invalid round result" }, 400);
        return c.json({ accepted: coordinator.roundResult(body.data) });
    });
    privateApp.post("/player-abandoned", async c => {
        const body = z.object({
            seriesId: z.string(),
            roundId: z.string(),
            round: z.number().int().positive(),
            gameId: z.string(),
            profileId: z.string(),
            abandonedProfileIds: z.array(z.string().min(1).max(120)).max(8).optional(),
            combat: combatSchema.optional(),
        }).safeParse(await readRankedJson(c));
        if (!body.success) return c.json({ error: "Invalid abandoned player report" }, 400);
        return c.json({ accepted: coordinator.playerAbandoned(body.data) });
    });
    return { app, privateApp };
}
