import { createHash } from "node:crypto";
import { and, desc, eq, inArray, lt, ne } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { MapId, TeamModeToString } from "../../../../../shared/defs/types/misc";
import {
    zBanAccountParams,
    zBanChatIpParams,
    zBanIpParams,
    zChatUnbanIpParams,
    zFindDiscordUserSlugParams,
    zGetPlayerIpParams,
    zSetAccountNameParams,
    zSetMatchDataNameParams,
    zUnbanAccountParams,
    zUnbanIpParams,
    zWhoIsParams,
} from "../../../../../shared/types/moderation";
import { util } from "../../../../../shared/utils/util";
import { Config } from "../../../config";
import { validateUserName } from "../../../utils/serverHelpers";
import type { SaveGameBody } from "../../../utils/types";
import { server } from "../../apiServer";
import { databaseEnabledMiddleware, validateParams } from "../../auth/middleware";
import { db } from "../../db";
import { bannedIpsTable, chatBannedIpsTable, ipLogsTable, matchDataTable, usersTable } from "../../db/schema";
import { sanitizeSlug } from "../user/auth/authUtils";
import { userInfo } from "node:os";

export const ModerationRouter = new Hono()
    .use(databaseEnabledMiddleware)
    .post("/ban_account", validateParams(zBanAccountParams), async (c) => {
        const {
            slug,
            ban_reason: banReason,
            executor_id,
            ban_associated_ips,
            ip_ban_duration,
            ip_ban_permanent,
        } = c.req.valid("json");

        const user = await db.query.usersTable.findFirst({
            where: eq(usersTable.slug, slug),
            columns: {
                id: true,
                banned: true,
            },
        });

        if (!user) {
            return c.json({ message: "No user found with that slug." }, 200);
        }

        if (user.banned) {
            return c.json({ message: "User is already banned." }, 200);
        }

        await banAccount(user.id, banReason, executor_id);

        if (ban_associated_ips) {
            const ips = await db
                .select({
                    encodedIp: ipLogsTable.encodedIp,
                    findGameEncodedIp: ipLogsTable.findGameEncodedIp,
                })
                .from(ipLogsTable)
                .where(eq(ipLogsTable.userId, user.id))
                .groupBy(ipLogsTable.encodedIp, ipLogsTable.findGameEncodedIp);

            const expiresIn = new Date(Date.now() + util.daysToMs(ip_ban_duration));

            const bans = [
                ...new Set(
                    ips.map((data) => [data.encodedIp, data.findGameEncodedIp]).flat(),
                ),
            ].map((encodedIp) => {
                return {
                    expiresIn: expiresIn,
                    encodedIp,
                    permanent: ip_ban_permanent,
                    reason: banReason,
                    bannedBy: executor_id,
                };
            });

            if (bans.length) {
                await db
                    .insert(bannedIpsTable)
                    .values(bans)
                    .onConflictDoUpdate({
                        target: bannedIpsTable.encodedIp,
                        set: {
                            expiresIn: expiresIn,
                            reason: banReason,
                            permanent: ip_ban_permanent,
                            bannedBy: executor_id,
                        },
                    });
            }

            for (const ban of bans) {
                server.teamMenu.disconnectPlayers(ban.encodedIp);
            }
        }

        return c.json(
            {
                message: `Banned ${slug} account and all associated IPs for ${ip_ban_duration} days.`,
            },
            200,
        );
    })
    .post("/unban_account", validateParams(zUnbanAccountParams), async (c) => {
        const { slug } = c.req.valid("json");

        const user = await db.query.usersTable.findFirst({
            where: eq(usersTable.slug, slug),
            columns: {
                id: true,
                banned: true,
            },
        });

        if (!user) {
            return c.json({ message: "No user found with that slug." }, 404);
        }

        if (!user.banned) {
            return c.json({ message: "User is not banned." }, 400);
        }

        await db
            .update(usersTable)
            .set({
                banned: false,
                banReason: "",
                bannedBy: "",
            })
            .where(eq(usersTable.id, user.id));

        await db
            .update(matchDataTable)
            .set({ userBanned: false })
            .where(eq(matchDataTable.userId, user.id));

        return c.json({ message: "User has been unbanned." }, 200);
    })
    .post("/ban_ip", validateParams(zBanIpParams), async (c) => {
        const {
            ips,
            is_encoded,
            permanent,
            ban_associated_account,
            ip_ban_duration,
            ban_reason,
            executor_id,
        } = c.req.valid("json");

        const expiresIn = new Date(Date.now() + util.daysToMs(ip_ban_duration));
        const encodedIps = is_encoded ? ips : ips.map(hashIp);
        const values = encodedIps.map((encodedIp) => ({
            encodedIp,
            expiresIn,
            permanent,
            reason: ban_reason,
            bannedBy: executor_id,
        }));

        await db
            .insert(bannedIpsTable)
            .values(values)
            .onConflictDoUpdate({
                target: bannedIpsTable.encodedIp,
                set: {
                    expiresIn: expiresIn,
                    reason: ban_reason,
                    permanent: permanent,
                },
            });

        if (ban_associated_account) {
            const user = await db.query.ipLogsTable.findFirst({
                where: and(
                    inArray(ipLogsTable.encodedIp, encodedIps),
                    ne(ipLogsTable.userId, ""),
                ),
                columns: {
                    userId: true,
                },
            });
            if (user?.userId) {
                await banAccount(user.userId, ban_reason, executor_id);
            }
        }

        for (const encodedIp of encodedIps) {
            server.teamMenu.disconnectPlayers(encodedIp);
        }

        const baseMessage = permanent
            ? "permanently banned"
            : `banned for ${ip_ban_duration} days`;

        if (encodedIps.length === 1) {
            return c.json(
                { message: `IP ${encodedIps[0]} has been ${baseMessage}.` },
                200,
            );
        }

        return c.json(
            { message: `IPs: [${encodedIps.join(", ")}] ${baseMessage}.` },
            200,
        );
    })
    .post("/unban_ip", validateParams(zUnbanIpParams), async (c) => {
        const { ip, is_encoded } = c.req.valid("json");
        const encodedIp = is_encoded ? ip : hashIp(ip);
        await db
            .delete(bannedIpsTable)
            .where(eq(bannedIpsTable.encodedIp, encodedIp))
            .execute();
        return c.json({ message: `IP ${encodedIp} has been unbanned.` }, 200);
    })
    .post("/chat_ban_ip", validateParams(zBanChatIpParams), async (c) => {
        const {
            ips,
            is_encoded,
            permanent,
            chat_ban_duration,
            ban_reason,
            executor_id,
        } = c.req.valid("json");

        const expiresIn = new Date(Date.now() + util.daysToMs(chat_ban_duration));
        const encodedIps = is_encoded ? ips : ips.map(hashIp);

        const values = encodedIps.map((encodedIp: any) => ({
            encodedIp,
            expiresIn,
            permanent,
            reason: ban_reason,
            bannedBy: executor_id,
        }));

        await db
            .insert(chatBannedIpsTable)
            .values(values)
            .onConflictDoUpdate({
                target: chatBannedIpsTable.encodedIp,
                set: {
                    expiresIn,
                    permanent,
                    reason: ban_reason,
                    bannedBy: executor_id,
                },
            });

        const baseMessage = permanent
            ? "permanently chat banned"
            : `chat banned for ${chat_ban_duration} days`;

        if (encodedIps.length === 1) {
            return c.json(
                { message: `IP ${encodedIps[0]} has been ${baseMessage}.` },
                200,
            );
        }

        return c.json(
            { message: `IPs: [${encodedIps.join(", ")}] have been ${baseMessage}.` },
            200,
        );
    })
    .post("/chat_unban_ip", validateParams(zChatUnbanIpParams), async (c) => {
        const { ip, is_encoded } = c.req.valid("json");
        const encodedIp = is_encoded ? ip : hashIp(ip);
        await db
            .delete(chatBannedIpsTable)
            .where(eq(chatBannedIpsTable.encodedIp, encodedIp))
            .execute();
        return c.json({ message: `IP ${encodedIp} has been unbanned from chat.` }, 200);
    })
    /**
     * @deprecated
     */
    .post(
        "/is_ip_banned",
        validateParams(
            z.object({
                ip: z.string(),
            }),
        ),
        async (c) => {
            const { ip } = c.req.valid("json");

            return c.json({
                banned: (await isBanned(ip, false)) !== undefined,
            });
        },
    )
    .post("/get_player_ip", validateParams(zGetPlayerIpParams), async (c) => {
        const { name, use_account_slug, game_id } = c.req.valid("json");

        let userId: string | null = null;

        if (use_account_slug) {
            const user = await db.query.usersTable.findFirst({
                where: eq(usersTable.slug, name),
                columns: {
                    id: true,
                },
            });

            if (!user?.id) {
                return c.json(
                    {
                        message: `User not found`,
                    },
                    200,
                );
            }
            userId = user.id;
        }

        const result = await db
            .select({
                slug: usersTable.slug,
                authId: usersTable.authId,
                linkedDiscord: usersTable.linkedDiscord,
                ip: ipLogsTable.encodedIp,
                findGameIp: ipLogsTable.findGameEncodedIp,
                username: ipLogsTable.username,
                region: ipLogsTable.region,
                teamMode: ipLogsTable.teamMode,
                createdAt: ipLogsTable.createdAt,
                mapId: ipLogsTable.mapId,
                gameId: ipLogsTable.gameId,
            })
            .from(ipLogsTable)
            .where(
                and(
                    userId
                        ? eq(ipLogsTable.userId, userId)
                        : eq(ipLogsTable.username, name),
                    game_id ? eq(ipLogsTable.gameId, game_id) : undefined,
                ),
            )
            .leftJoin(usersTable, eq(ipLogsTable.userId, usersTable.id))
            .orderBy(desc(ipLogsTable.createdAt))
            .limit(200);

        const seenIps = new Set<string>();
        const uniqueResults: typeof result = [];

        for (const row of result) {
            if (!seenIps.has(row.ip)) {
                seenIps.add(row.ip);
                uniqueResults.push(row);

                if (uniqueResults.length >= 10) break;
            }
        }

        if (uniqueResults.length === 0) {
            return c.json(
                {
                    message: `No IP found for ${name}. Make sure the name matches the one in game.`,
                },
                200,
            );
        }

        const prettyResult = uniqueResults.map((data) => ({
            ...data,
            teamMode: TeamModeToString[data.teamMode],
            mapId: MapId[data.mapId],
        }));

        return c.json(prettyResult, 200);
    })
    .post("/clear_all_bans", async (c) => {
        await db.delete(bannedIpsTable).execute();
        return c.json({ message: `All bans have been cleared.` }, 200);
    })
    .post(
        // useful for purging bad names from leaderboards
        "/set_match_data_name",
        validateParams(zSetMatchDataNameParams),
        async (c) => {
            const { current_name, new_name } = c.req.valid("json");

            const res = await db
                .update(matchDataTable)
                .set({
                    username: new_name,
                })
                .where(eq(matchDataTable.username, current_name));

            return c.json({ message: `Updated ${res.rowCount} rows` }, 200);
        },
    )
    .post("/set_account_name", validateParams(zSetAccountNameParams), async (c) => {
        const { new_name, current_slug } = c.req.valid("json");

        const sanitized = validateUserName(new_name);

        if (sanitized.originalWasInvalid) {
            return c.json({ message: "Invalid new username" }, 200);
        }

        const newSlug = sanitizeSlug(sanitized.validName);

        const res = await db
            .update(usersTable)
            .set({
                username: sanitized.validName,
                slug: newSlug,
            })
            .where(eq(usersTable.slug, current_slug));

        if (res.rowCount) {
            return c.json(
                { message: `updated ${current_slug}'s name to ${sanitized.validName}` },
                200,
            );
        }

        return c.json({ message: `User not found` }, 400);
    })
    .post(
        "/delete_game",
        validateParams(
            z.object({
                gameId: z.string(),
            }),
        ),
        async (c) => {
            const { gameId } = c.req.valid("json");

            const res = await db
                .delete(matchDataTable)
                .where(eq(matchDataTable.gameId, gameId));

            return c.json({ message: `Deleted ${res.rowCount} rows` }, 200);
        },
    )
    .post(
        "find_discord_user_slug",
        validateParams(zFindDiscordUserSlugParams),
        async (c) => {
            const { discord_user } = c.req.valid("json");

            const user = await db.query.usersTable.findFirst({
                where: and(
                    eq(usersTable.linkedDiscord, true),
                    eq(usersTable.authId, discord_user),
                ),
                columns: {
                    slug: true,
                },
            });

            if (!user?.slug) {
                return c.json(
                    {
                        message: `User not found`,
                    },
                    200,
                );
            }

            return c.json({ message: `slug: ${user.slug}` }, 200);
        },
    )
    .post("/who_is", validateParams(zWhoIsParams), async (c) => {
        const { ip } = c.req.valid("json");

        const rows = await db
            .select({
                username: ipLogsTable.username,
                userId: ipLogsTable.userId,
                slug: usersTable.slug,
                discordId: usersTable.authId,
            })
            .from(ipLogsTable)
            .where(
                and(
                    eq(ipLogsTable.encodedIp, ip),
                ),
            )
            .leftJoin(usersTable, eq(ipLogsTable.userId, usersTable.id))
            .orderBy(ipLogsTable.username, desc(ipLogsTable.createdAt))

        const counts = new Map<string, number>();
        for (const row of rows) {
            counts.set(row.username, (counts.get(row.username) ?? 0) + 1);
        }

        const uniqueResults: (typeof rows[number] & { count: number })[] = [];
        const seenUsernames = new Set<string>();
        const seenAccountNames = new Set<string>();

        for (const row of rows) {
            if (
                !seenUsernames.has(row.username) &&
                (row.slug === null || !seenAccountNames.has(row.slug))
            ) {
                seenUsernames.add(row.username);
                if(row.slug)
                seenAccountNames.add(row.slug);

                uniqueResults.push({
                    ...row,
                    count: counts.get(row.username) ?? 1, 
                });

                if (uniqueResults.length >= 20) break;
            }
        }

        if(uniqueResults.length === 0){
            return c.json({
                message: `No entries for ${ip} found.`
            }, 200);
        }

        return c.json(uniqueResults, 200);
    });

async function banAccount(userId: string, banReason: string, executorId: string) {
    await db
        .update(usersTable)
        .set({
            banned: true,
            banReason,
            bannedBy: executorId,
        })
        .where(eq(usersTable.id, userId));

    // NOTE: some lb queries join with the userTable so we do
    // this so it's easier to filter them
    await db
        .update(matchDataTable)
        .set({ userBanned: true })
        .where(eq(matchDataTable.userId, userId));
}

export async function cleanupOldLogs() {
    try {
        const thirtyDaysAgo = new Date(Date.now() - util.daysToMs(30));
        await db.delete(ipLogsTable).where(lt(ipLogsTable.createdAt, thirtyDaysAgo));
    } catch (err) {
        server.logger.error("Failed to cleanup old logs", err);
    }
}

export async function isBanned(ip: string, isEncoded = false) {
    if (!Config.database.enabled) return undefined;
    try {
        const encodedIp = isEncoded ? ip : hashIp(ip);
        const banned = await db.query.bannedIpsTable.findFirst({
            where: eq(bannedIpsTable.encodedIp, encodedIp),
            columns: {
                permanent: true,
                expiresIn: true,
                reason: true,
            },
        });
        if (banned) {
            const { expiresIn, permanent, reason } = banned;
            if (permanent || expiresIn.getTime() > Date.now()) {
                server.logger.info(`${encodedIp} is banned.`);
                return {
                    permanent,
                    expiresIn,
                    reason,
                };
            }
            // unban the ip
            await db
                .delete(bannedIpsTable)
                .where(eq(bannedIpsTable.encodedIp, encodedIp))
                .execute();
            return undefined;
        }
        return undefined;
    } catch (err) {
        server.logger.error("Failed to check if IP is banned", err);
        return undefined;
    }
}

export async function getActiveChatBan(encodedIp: string) {
    const ban = await db.query.chatBannedIpsTable.findFirst({
        where: eq(chatBannedIpsTable.encodedIp, encodedIp),
        columns: {
            permanent: true,
            expiresIn: true,
            reason: true,
        }
    });
    if (ban) {
            const { expiresIn, permanent, reason } = ban;
            if (permanent || expiresIn.getTime() > Date.now()) {
                server.logger.info(`${encodedIp} is banned.`);
                return {
                    permanent,
                    expiresIn,
                    reason,
                };
            }
            // unban the ip
            await db
                .delete(chatBannedIpsTable)
                .where(eq(chatBannedIpsTable.encodedIp, encodedIp))
                .execute();
            return undefined;
        }
    return null;
}

/** Looks up the ISP for a given IP via ip-api.com (free, no key required). Returns "" on failure. */
async function lookupIsp(ip: string): Promise<string> {
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=isp`, { signal: AbortSignal.timeout(3000) });
        const data = await res.json() as { isp?: string };
        return data.isp ?? "";
    } catch {
        return "";
    }
}

export async function logPlayerIPs(data: SaveGameBody["matchData"]) {
    try {
        // Fetch ISP for each unique raw IP in parallel, then map to log rows
        const uniqueIps = [...new Set(data.map((m) => m.ip))];
        const ispMap = Object.fromEntries(
            await Promise.all(uniqueIps.map(async (ip) => [ip, await lookupIsp(ip)])),
        );

        const logsData = data.map((matchData) => ({
            ...matchData,
            encodedIp: hashIp(matchData.ip),
            findGameEncodedIp: hashIp(matchData.findGameIp),
            isp: ispMap[matchData.ip] ?? "",
        }));
        await db.insert(ipLogsTable).values(logsData);
    } catch (err) {
        server.logger.error("Failed to log player ip", err);
    }
}

const salt = Config.secrets.SURVEV_IP_SECRET;
export function hashIp(ip: string) {
    return createHash("sha256")
        .update(salt + ip)
        .digest("hex");
}
