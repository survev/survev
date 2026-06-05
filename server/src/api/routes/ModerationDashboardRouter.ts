/**
 * Moderation Dashboard Router
 *
 * All routes require an active session with admin=true.
 * Non-admin or unauthenticated requests are redirected to Discord OAuth
 * which will send the user back here after login.
 *
 * Route overview:
 *   GET  /moderation                               → serve the dashboard SPA
 *   GET  /moderation/api/me                        → current admin user info
 *   GET  /moderation/api/bans                      → all IP, account, and chat bans
 *   POST /moderation/api/ban/ip                    → create an IP ban
 *   POST /moderation/api/ban/account               → create an account ban
 *   POST /moderation/api/ban/chat                  → create a chat ban
 *   POST /moderation/api/unban/ip                  → remove an IP ban
 *   POST /moderation/api/unban/account             → remove an account ban
 *   POST /moderation/api/unban/chat                → remove a chat ban
 *   GET  /moderation/api/ip/:hash                  → IP details: accounts + ISP
 *   GET  /moderation/api/player/:name              → player details: IPs used + ISP
 *   GET  /moderation/api/events                    → SSE stream for live updates
 *   GET  /moderation/api/game/:region/:id/players  → live player list for a game
 *   POST /moderation/api/game/:region/:id/cmd      → execute admin command on a game
 */

import { desc, eq, ne, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { streamSSE, type SSEStreamingApi } from "hono/streaming";
import { util } from "../../../../shared/utils/util";
import { validateSessionToken } from "../auth";
import { validateParams } from "../auth/middleware";
import { db } from "../db";
import { bannedIpsTable, chatBannedIpsTable, chatLogsTable, ipLogsTable, matchDataTable, usersTable } from "../db/schema";
import { server } from "../apiServer";
import type { Context } from "..";
import { z } from "zod";
import { dashboardHtml } from "./moderationDashboard.html";

// ─── Admin guard middleware ────────────────────────────────────────────────────

/**
 * Checks for a valid session with admin=true.
 * If not authenticated → redirect to Discord OAuth with a return-to cookie.
 * If authenticated but not admin → 403.
 */
async function adminGuard(c: any, next: () => Promise<void>) {
    const sessionToken = getCookie(c, "session") ?? null;

    if (!sessionToken) {
        return c.redirect(`/api/auth/discord?redirect=/moderation`);
    }

    const { user } = await validateSessionToken(sessionToken);

    if (!user) {
        return c.redirect(`/api/auth/discord?redirect=/moderation`);
    }

    // Allow mock auth in non-production environments
    if (!user.admin) {
        return c.text("Forbidden: admin access required", 403);
    }

    c.set("user", user);
    return next();
}

// ─── SSE broadcast state ───────────────────────────────────────────────────────

/** All currently open SSE streams from connected admin browsers. */
const activeSseStreams = new Set<SSEStreamingApi>();

/** Fetches all bans from the DB and returns a serialisable payload. */
async function fetchAllBans() {
    const [ipBans, accountBans, chatBans] = await Promise.all([
        db.query.bannedIpsTable.findMany({ orderBy: [desc(bannedIpsTable.createdAt)] }),
        db.query.usersTable.findMany({
            where: eq(usersTable.banned, true),
            columns: { id: true, slug: true, username: true, banReason: true, bannedBy: true, userCreated: true },
        }),
        db.query.chatBannedIpsTable.findMany({ orderBy: [desc(chatBannedIpsTable.createdAt)] }),
    ]);
    return { ipBans, accountBans, chatBans };
}

/**
 * Pushes the current ban list to every connected admin browser.
 * Called after any ban or unban operation so all open dashboards update instantly.
 */
async function broadcastBans() {
    if (activeSseStreams.size === 0) return;
    const bans = await fetchAllBans();
    const data = JSON.stringify(bans);
    for (const stream of activeSseStreams) {
        try { await stream.writeSSE({ event: "bans", data }); } catch { /* client gone */ }
    }
}

/** Fetches the server/game list from all regions. */
async function fetchServers() {
    const regions = await Promise.all(
        Object.entries(server.regions).map(async ([regionId, region]) => {
            const infos = await region.collectGameInfos().catch(() => null);
            const games = Array.isArray(infos?.data) ? infos.data : [];
            return { regionId, games, verifiedOnly: region.verifiedOnly };
        }),
    );
    return { regions };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const ModerationDashboardRouter = new Hono<Context>()
    .use(adminGuard)

    // ── Serve the SPA HTML (auth already checked by adminGuard above) ──────
    .get("/", (c) => {
        return c.html(dashboardHtml);
    })

    // ── Current user info (for the frontend to display "logged in as ...") ─
    .get("/api/me", (c) => {
        const user = c.get("user")!;
        return c.json({ id: user.id, username: user.username, slug: user.slug });
    })

    // ─────────────────────────────────────────────────────────────────────────
    // BAN MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /** Returns all IP bans, account bans, and chat bans. */
    .get("/api/bans", async (c) => {
        return c.json(await fetchAllBans());
    })

    /** Creates an IP ban. Also bans any account linked to this IP. Broadcasts to all admins. */
    .post(
        "/api/ban/ip",
        validateParams(z.object({
            ip: z.string(),
            reason: z.string().default(""),
            duration: z.number().default(7),
            permanent: z.boolean().default(false),
        })),
        async (c) => {
            const admin = c.get("user")!;
            const { ip, reason, duration, permanent } = c.req.valid("json");
            const expiresIn = new Date(Date.now() + util.daysToMs(duration));

            await db
                .insert(bannedIpsTable)
                .values({ encodedIp: ip, reason, expiresIn, permanent, bannedBy: admin.slug })
                .onConflictDoUpdate({
                    target: bannedIpsTable.encodedIp,
                    set: { reason, expiresIn, permanent, bannedBy: admin.slug },
                });

            // Also ban any account that has ever used this IP
            const linked = await db
                .selectDistinct({ userId: ipLogsTable.userId })
                .from(ipLogsTable)
                .where(eq(ipLogsTable.encodedIp, ip));

            const userIds = linked.map((r) => r.userId).filter((id): id is string => !!id);
            if (userIds.length) {
                await db
                    .update(usersTable)
                    .set({ banned: true, banReason: reason, bannedBy: admin.slug })
                    .where(inArray(usersTable.id, userIds));
            }

            broadcastBans();
            return c.json({ ok: true });
        },
    )

    /** Creates an account ban. Broadcasts updated bans. */
    .post(
        "/api/ban/account",
        validateParams(z.object({
            slug: z.string(),
            reason: z.string().default(""),
        })),
        async (c) => {
            const admin = c.get("user")!;
            const { slug, reason } = c.req.valid("json");

            await db
                .update(usersTable)
                .set({ banned: true, banReason: reason, bannedBy: admin.slug })
                .where(eq(usersTable.slug, slug));

            broadcastBans();
            return c.json({ ok: true });
        },
    )

    /** Creates a chat ban. Broadcasts updated bans. */
    .post(
        "/api/ban/chat",
        validateParams(z.object({
            ip: z.string(),
            reason: z.string().default(""),
            duration: z.number().default(7),
            permanent: z.boolean().default(false),
        })),
        async (c) => {
            const admin = c.get("user")!;
            const { ip, reason, duration, permanent } = c.req.valid("json");
            const expiresIn = new Date(Date.now() + util.daysToMs(duration));

            await db
                .insert(chatBannedIpsTable)
                .values({ encodedIp: ip, reason, expiresIn, permanent, bannedBy: admin.slug })
                .onConflictDoUpdate({
                    target: chatBannedIpsTable.encodedIp,
                    set: { reason, expiresIn, permanent, bannedBy: admin.slug },
                });

            broadcastBans();
            return c.json({ ok: true });
        },
    )

    /** Removes an IP ban. Also unbans any account that was linked to this IP. Broadcasts updated bans. */
    .post(
        "/api/unban/ip",
        validateParams(z.object({ ip: z.string() })),
        async (c) => {
            const { ip } = c.req.valid("json");

            await db.delete(bannedIpsTable).where(eq(bannedIpsTable.encodedIp, ip));

            // Unban any accounts that were linked to this IP
            const linked = await db
                .selectDistinct({ userId: ipLogsTable.userId })
                .from(ipLogsTable)
                .where(eq(ipLogsTable.encodedIp, ip));

            const userIds = linked.map((r) => r.userId).filter((id): id is string => !!id);
            if (userIds.length) {
                await db
                    .update(usersTable)
                    .set({ banned: false, banReason: "", bannedBy: "" })
                    .where(inArray(usersTable.id, userIds));
            }

            broadcastBans();
            return c.json({ ok: true });
        },
    )

    /** Removes an account ban. Broadcasts updated bans. */
    .post(
        "/api/unban/account",
        validateParams(z.object({ slug: z.string() })),
        async (c) => {
            const { slug } = c.req.valid("json");
            await db
                .update(usersTable)
                .set({ banned: false, banReason: "", bannedBy: "" })
                .where(eq(usersTable.slug, slug));
            broadcastBans();
            return c.json({ ok: true });
        },
    )

    /** Removes a chat ban. Broadcasts updated bans. */
    .post(
        "/api/unban/chat",
        validateParams(z.object({ ip: z.string() })),
        async (c) => {
            const { ip } = c.req.valid("json");
            await db.delete(chatBannedIpsTable).where(eq(chatBannedIpsTable.encodedIp, ip));
            broadcastBans();
            return c.json({ ok: true });
        },
    )

    // ─────────────────────────────────────────────────────────────────────────
    // IP / PLAYER LOOKUP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns the 100 most recently seen unique players (name + most recent IP + ISP).
     * Used to populate the quick-access list on the IP/Player lookup tab.
     */
    .get("/api/recent", async (c) => {
        const rows = await db
            .select({
                username: ipLogsTable.username,
                encodedIp: ipLogsTable.encodedIp,
                isp: ipLogsTable.isp,
                region: ipLogsTable.region,
                createdAt: ipLogsTable.createdAt,
                slug: usersTable.slug,
            })
            .from(ipLogsTable)
            .leftJoin(usersTable, eq(ipLogsTable.userId, usersTable.id))
            .orderBy(desc(ipLogsTable.createdAt))
            .limit(1000); // fetch more, deduplicate by username below

        const seen = new Set<string>();
        const recent: typeof rows = [];
        for (const row of rows) {
            if (!seen.has(row.username)) {
                seen.add(row.username);
                recent.push(row);
                if (recent.length >= 100) break;
            }
        }
        return c.json({ recent });
    })

    /**
     * Returns all names + accounts that ever used this encoded IP, plus the ISP.
     * Recent names (≤30 days) come directly from ip_logs.
     * Historical names (>30 days) are recovered via match_data using the userId
     * linked to the IP — so account-holders keep their full name history.
     * The real IP is never stored or returned here.
     */
    .get("/api/ip/:hash", async (c) => {
        const hash = c.req.param("hash");

        const [banRecord, rows] = await Promise.all([
            db.query.bannedIpsTable.findFirst({
                where: eq(bannedIpsTable.encodedIp, hash),
            }),
            db
                .select({
                    username: ipLogsTable.username,
                    userId: ipLogsTable.userId,
                    slug: usersTable.slug,
                    isp: ipLogsTable.isp,
                    region: ipLogsTable.region,
                    gameId: ipLogsTable.gameId,
                    createdAt: ipLogsTable.createdAt,
                })
                .from(ipLogsTable)
                .where(eq(ipLogsTable.encodedIp, hash))
                .leftJoin(usersTable, eq(ipLogsTable.userId, usersTable.id))
                .orderBy(desc(ipLogsTable.createdAt))
                .limit(200),
        ]);

        // Collect ISP and deduplicate recent names from ip_logs
        const seenNames = new Set<string>();
        const accounts: (typeof rows[number] & { source: "recent" | "historical" })[] = [];
        let isp = "";

        for (const row of rows) {
            if (!isp && row.isp) isp = row.isp;
            if (!seenNames.has(row.username)) {
                seenNames.add(row.username);
                accounts.push({ ...row, source: "recent" });
            }
        }

        // Query match_data directly by encoded IP — covers all players (incl. guests)
        // with no time limit, since match_data is never deleted.
        // Note: no ORDER BY with SELECT DISTINCT (Postgres requires ORDER BY cols to be in SELECT list)
        const historical = await db
            .selectDistinct({ username: matchDataTable.username, userId: matchDataTable.userId })
            .from(matchDataTable)
            .where(eq(matchDataTable.encodedIp, hash))
            .limit(500);

        for (const row of historical) {
            if (!seenNames.has(row.username)) {
                seenNames.add(row.username);
                const knownSlug = rows.find((r) => r.userId === row.userId)?.slug ?? null;
                accounts.push({
                    username: row.username,
                    userId: row.userId ?? "",
                    slug: knownSlug,
                    isp: "",
                    region: "",
                    gameId: "",
                    createdAt: new Date(0),
                    source: "historical",
                });
            }
        }

        return c.json({ hash, isp, banned: !!banRecord, banRecord, accounts });
    })

    /**
     * Returns chat history for a player, looked up by username or encoded IP.
     * Query param: ?by=name (default) or ?by=ip
     * Returns the 200 most recent messages, newest first.
     */
    .get("/api/chat/:query", async (c) => {
        const query = c.req.param("query");
        const by    = c.req.query("by") ?? "name";

        const rows = await db
            .select({
                id:        chatLogsTable.id,
                createdAt: chatLogsTable.createdAt,
                gameId:    chatLogsTable.gameId,
                username:  chatLogsTable.username,
                channel:   chatLogsTable.channel,
                message:   chatLogsTable.message,
                slug:      usersTable.slug,
            })
            .from(chatLogsTable)
            .where(by === "ip"
                ? eq(chatLogsTable.encodedIp, query)
                : eq(chatLogsTable.username, query),
            )
            .leftJoin(usersTable, eq(chatLogsTable.userId, usersTable.id))
            .orderBy(desc(chatLogsTable.createdAt))
            .limit(200);

        return c.json({ messages: rows });
    })

    /**
     * Returns all IP hashes + ISP a player used, looked up by display name.
     */
    .get("/api/player/:name", async (c) => {
        const name = c.req.param("name");

        const rows = await db
            .select({
                encodedIp: ipLogsTable.encodedIp,
                isp: ipLogsTable.isp,
                region: ipLogsTable.region,
                createdAt: ipLogsTable.createdAt,
                slug: usersTable.slug,
            })
            .from(ipLogsTable)
            .where(eq(ipLogsTable.username, name))
            .leftJoin(usersTable, eq(ipLogsTable.userId, usersTable.id))
            .orderBy(desc(ipLogsTable.createdAt))
            .limit(200);

        const seenIps = new Set<string>();
        const ips: { ip: string; isp: string; region: string; lastSeen: Date; slug: string | null }[] = [];
        for (const row of rows) {
            if (!seenIps.has(row.encodedIp)) {
                seenIps.add(row.encodedIp);
                ips.push({ ip: row.encodedIp, isp: row.isp, region: row.region, lastSeen: row.createdAt, slug: row.slug });
            }
        }

        return c.json({ name, ips });
    })

    // ─────────────────────────────────────────────────────────────────────────
    // SSE – LIVE EVENT STREAM
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Server-Sent Events stream for the live dashboard.
     *
     * Query params:
     *   region  (optional) – region of the game being watched
     *   gameId  (optional) – specific game to receive player updates for
     *
     * Events pushed:
     *   "bans"    – full ban list, sent immediately and on every ban change
     *   "servers" – all regions + games, sent immediately then every 8 s
     *   "players" – live player list for the watched game, sent immediately then every 3 s
     */
    .get("/api/events", async (c) => {
        const regionId = c.req.query("region") ?? "";
        const gameId   = c.req.query("gameId")  ?? "";

        return streamSSE(c, async (stream) => {
            activeSseStreams.add(stream);

            // Helper that wraps writeSSE and swallows errors for gone clients
            const push = async (event: string, data: unknown) => {
                try {
                    await stream.writeSSE({ event, data: JSON.stringify(data) });
                } catch { /* client disconnected */ }
            };

            // Send initial snapshots immediately
            await push("bans",    await fetchAllBans());
            await push("servers", await fetchServers());
            if (gameId) {
                const players = await server.getDashboardGamePlayers(regionId, gameId);
                await push("players", { players });
            }

            // Periodic server list updates (every 8 s)
            const serverTimer = setInterval(async () => {
                await push("servers", await fetchServers());
            }, 8_000);

            // Periodic player list updates for the watched game (every 3 s)
            const playerTimer = gameId
                ? setInterval(async () => {
                      const players = await server.getDashboardGamePlayers(regionId, gameId);
                      await push("players", { players });
                  }, 3_000)
                : null;

            // Keep the stream open until the client disconnects
            await new Promise<void>((resolve) => {
                c.req.raw.signal.addEventListener("abort", () => resolve(), { once: true });
            });

            // Cleanup on disconnect
            clearInterval(serverTimer);
            if (playerTimer) clearInterval(playerTimer);
            activeSseStreams.delete(stream);
        });
    })

    // ─────────────────────────────────────────────────────────────────────────
    // LIVE SERVER VIEW (kept for direct REST access)
    // ─────────────────────────────────────────────────────────────────────────

    /** Returns a snapshot of all regions + running games. */
    .get("/api/servers", async (c) => {
        return c.json(await fetchServers());
    })

    /** Sends an announcement to every running game across all regions. */
    .post(
        "/api/servers/announce",
        validateParams(z.object({
            text: z.string(),
            color: z.string().optional(),
            sender: z.string().optional(),
        })),
        async (c) => {
            const { text, color, sender } = c.req.valid("json");
            const cmd = { action: "announce", text, color, sender };

            await Promise.all(
                Object.entries(server.regions).map(async ([regionId, region]) => {
                    const infos = await region.collectGameInfos().catch(() => null);
                    const games = Array.isArray(infos?.data) ? infos.data : [];
                    await Promise.all(
                        games
                            .filter((g: any) => !g.stopped)
                            .map((g: any) => server.sendDashboardGameCmd(regionId, g.id, cmd)),
                    );
                }),
            );

            return c.json({ ok: true });
        },
    )

    /**
     * Returns a spectate token for a specific game so the dashboard can open the
     * game client in spectator mode. Calls the game server via the existing
     * find_game_by_id flow (same as the in-game spectate button).
     */
    .get("/api/game/:region/:id/spectate-token", async (c) => {
        const regionId = c.req.param("region");
        const gameId   = c.req.param("id");
        const data = await server.findGameById(regionId, gameId, true /* admin */);
        return c.json(data);
    })

    /**
     * Returns the live player list for a specific running game.
     * Calls the game server via HTTP, which uses IPC to query the game process.
     */
    .get("/api/game/:region/:id/players", async (c) => {
        const regionId = c.req.param("region");
        const gameId   = c.req.param("id");
        const players  = await server.getDashboardGamePlayers(regionId, gameId);
        return c.json({ players });
    })

    /**
     * Executes an admin command on a running game.
     * Supported actions: freeze | unfreeze | verify | kick | announce | announce_player
     */
    .post(
        "/api/game/:region/:id/cmd",
        validateParams(z.object({
            action: z.string(),
            target: z.string().optional(),
            text: z.string().optional(),
            color: z.string().optional(),
            sender: z.string().optional(),
        })),
        async (c) => {
            const regionId = c.req.param("region");
            const gameId   = c.req.param("id");
            const cmd      = c.req.valid("json");
            await server.sendDashboardGameCmd(regionId, gameId, cmd);
            return c.json({ ok: true });
        },
    )

    .post("/api/servers/:region/verify", async (c) => {
        await server.setServerVerified(c.req.param("region"), true);
        return c.json({ ok: true });
    })

    .post("/api/servers/:region/unverify", async (c) => {
        await server.setServerVerified(c.req.param("region"), false);
        return c.json({ ok: true });
    });
