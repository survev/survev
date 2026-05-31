import { and, eq, gte, inArray, not, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { saveConfig } from "../../../../../config";
import { GameObjectDefs } from "../../../../../shared/defs/gameObjectDefs";
import { MapDefs } from "../../../../../shared/defs/mapDefs";
import { ExperienceConverter, GameConfig, TeamMode } from "../../../../../shared/gameConfig";
import {
    zCheckForUnlocksParams,
    zGiveItemParams,
    zRemoveItemParams,
} from "../../../../../shared/types/moderation";
import { Config, serverConfigPath } from "../../../config";
import { isBehindProxy } from "../../../utils/serverHelpers";
import {
    type SaveGameBody,
    zSetClientThemeBody,
    zSetGameModeBody,
    zUpdateRegionBody,
} from "../../../utils/types";
import type { Context } from "../..";
import { server } from "../../apiServer";
import {
    databaseEnabledMiddleware,
    privateMiddleware,
    validateParams,
} from "../../auth/middleware";
import { getRedisClient } from "../../cache";
import { leaderboardCache } from "../../cache/leaderboard";
import { db } from "../../db";
import {
    itemsTable,
    type MatchDataTable,
    matchDataTable,
    usersTable,
} from "../../db/schema";
import { MOCK_USER_ID } from "../user/auth/mock";
import { getActiveChatBan, hashIp, isBanned, logPlayerIPs, ModerationRouter } from "./ModerationRouter";
import { _allowedCrosshairs, _allowedEmotes, _allowedHealEffects, _allowedMeleeSkins, _allowedOutfits, UnlockDefs } from "../../../../../shared/defs/gameObjects/unlockDefs";
import { PassDefs } from "../../../../../shared/defs/gameObjects/passDefs";
import { level } from "winston";

export const PrivateRouter = new Hono<Context>()
    .use(privateMiddleware)
    .route("/moderation", ModerationRouter)
    .post("/update_region", validateParams(zUpdateRegionBody), (c) => {
        const { regionId, data } = c.req.valid("json");

        server.updateRegion(regionId, data);
        return c.json({}, 200);
    })
    .post("/set_game_mode", validateParams(zSetGameModeBody), (c) => {
        const {
            index,
            map_name: mapName,
            team_mode: teamMode,
            enabled,
        } = c.req.valid("json");

        if (!MapDefs[mapName as keyof typeof MapDefs]) {
            return c.json({ error: "Invalid map name" }, 400);
        }

        if (!server.modes[index]) {
            return c.json({ error: "Invalid mode index" }, 400);
        }

        server.modes[index] = {
            mapName: (mapName ?? server.modes[index].mapName) as keyof typeof MapDefs,
            teamMode: teamMode ?? server.modes[index].teamMode,
            enabled: enabled ?? server.modes[index].enabled,
        };

        saveConfig(serverConfigPath, {
            modes: server.modes,
        });

        return c.json(
            { message: `Set mode ${index} to ${JSON.stringify(server.modes[index])}` },
            200,
        );
    })
    .post("/set_client_theme", validateParams(zSetClientThemeBody), (c) => {
        const { theme } = c.req.valid("json");

        if (!MapDefs[theme as keyof typeof MapDefs]) {
            return c.json({ error: "Invalid map name" }, 400);
        }

        server.clientTheme = theme as keyof typeof MapDefs;

        saveConfig(serverConfigPath, {
            clientTheme: server.clientTheme,
        });

        return c.json({ message: `Set client theme to ${theme}` }, 200);
    })
    .post(
        "/toggle_captcha",
        validateParams(
            z.object({
                enabled: z.boolean(),
            }),
        ),
        (c) => {
            const { enabled } = c.req.valid("json");

            server.captchaEnabled = enabled;

            saveConfig(serverConfigPath, {
                captchaEnabled: enabled,
            });

            return c.json({ state: enabled }, 200);
        },
    )
    .post("/save_game", databaseEnabledMiddleware, async (c) => {
        const data = (await c.req.json()) as SaveGameBody;

        const matchData = data.matchData;

        if (!matchData.length) {
            return c.json({ error: "Empty match data" }, 400);
        }

        const gameIds = [...new Set(data.matchData.map((d) => d.gameId))];

        // i really don't want the game server to insert duplicated games by accident
        // when saving lost game data...
        const exists = await db
            .selectDistinct({
                gameId: matchDataTable.gameId,
            })
            .from(matchDataTable)
            .where(inArray(matchDataTable.gameId, gameIds));

        if (exists.length) {
            return c.json(
                {
                    error: `Games [${exists.map((d) => d.gameId).join(",")}] are already inserted`,
                },
                400,
            );
        }

        await leaderboardCache.invalidateCache(matchData);

        // Hash each player's IP and store it alongside the match data for permanent IP history
        await db.insert(matchDataTable).values(
            matchData.map((d) => ({ ...d, encodedIp: hashIp(d.ip) })),
        );
        await logPlayerIPs(matchData);
        server.logger.info(`Saved game data for ${matchData[0].gameId}`);
        return c.json({}, 200);
    })
    .post(
        "/give_item",
        databaseEnabledMiddleware,
        validateParams(zGiveItemParams),
        async (c) => {
            const { item, slug, source } = c.req.valid("json");

            const allowedItems = [
                ...new Set([
                    ..._allowedHealEffects,
                    ..._allowedMeleeSkins,
                    ..._allowedOutfits,
                    ..._allowedEmotes,
                    ..._allowedCrosshairs,
                ]),
            ];

            const user = await db.query.usersTable.findFirst({
                where: eq(usersTable.slug, slug),
                columns: {
                    id: true,
                },
            });

            if (!user) {
                return c.json({ message: "User not found" }, 200);
            }

            if (item === "all") {
                const ownedItems = await db.query.itemsTable.findMany({
                    where: eq(itemsTable.userId, user.id),
                    columns: {
                        type: true,
                    },
                });

                const ownedTypes = new Set(ownedItems.map((i) => i.type));

                const missingTypes = allowedItems.filter((type) => !ownedTypes.has(type));

                if (missingTypes.length === 0) {
                    return c.json({ message: "User already has all allowed items" }, 200);
                }

                const now = Date.now();

                await db.insert(itemsTable).values(
                    missingTypes.map((type) => ({
                        userId: user.id,
                        type,
                        source,
                        timeAcquired: now,
                    })),
                );

                return c.json(
                    {
                        message: `${missingTypes.length} items given to ${slug}`,
                        items: missingTypes,
                    },
                    200,
                );
            }

            if (!allowedItems.includes(item)) {
                return c.json({ message: "Item is not allowed" }, 200);
            }

            const existing = await db.query.itemsTable.findFirst({
                where: and(eq(itemsTable.userId, user.id), eq(itemsTable.type, item)),
                columns: {
                    type: true,
                },
            });

            if (existing) {
                return c.json({ message: "User already has item" }, 200);
            }

            await db.insert(itemsTable).values({
                userId: user.id,
                type: item,
                source,
                timeAcquired: Date.now(),
            });

            return c.json({ message: `Item "${item}" given to ${slug}` }, 200);
        },
    )
    .post(
        "/remove_item",
        databaseEnabledMiddleware,
        validateParams(zRemoveItemParams),
        async (c) => {
            const { item, slug } = c.req.valid("json");

            const user = await db.query.usersTable.findFirst({
                where: eq(usersTable.slug, slug),
                columns: {
                    id: true,
                },
            });

            if (!user) {
                return c.json({ message: "User not found" }, 200);
            }

            if (item === "all") {
                const protectedItems = [
                    ...(UnlockDefs.unlock_default?.unlocks ?? []),
                    ...(UnlockDefs.unlock_new_account?.unlocks ?? []),
                ];

                const result = await db
                    .delete(itemsTable)
                    .where(
                        and(
                            eq(itemsTable.userId, user.id),
                            protectedItems.length > 0
                                ? not(inArray(itemsTable.type, protectedItems))
                                : undefined,
                        ),
                    )
                    .returning({ type: itemsTable.type });

                if (result.length === 0) {
                    return c.json(
                        { message: "No removable items found for user" },
                        200,
                    );
                }

                return c.json(
                    {
                        message: `Removed ${result.length} items from ${slug}`,
                        removedCount: result.length,
                        removedItems: result.map((r) => r.type),
                    },
                    200,
                );
            }

            const result = await db
                .delete(itemsTable)
                .where(
                    and(
                        eq(itemsTable.userId, user.id),
                        eq(itemsTable.type, item),
                    ),
                )
                .returning({ type: itemsTable.type });

            if (result.length === 0) {
                return c.json({ message: "User does not have this item" }, 200);
            }

            return c.json({ message: `Item "${item}" removed from ${slug}` }, 200);
        },
    )
    .post("/clear_cache", async (c) => {
        const client = await getRedisClient();
        await client.flushAll();
        return c.json({ success: true }, 200);
    })
    .post(
        "/check_ip",
        validateParams(
            z.object({
                ip: z.string(),
            }),
        ),
        async (c) => {
            const { ip } = c.req.valid("json");

            const banData = await isBanned(ip, false);
            if (banData) {
                return c.json({ banned: true, banData: banData, behindProxy: false });
            }

            const isProxied = await isBehindProxy(ip, 0);
            if (isProxied) {
                return c.json({ banned: false, banData: undefined, behindProxy: true });
            }

            return c.json({ banned: false, banData: undefined, behindProxy: false });
        },
    )
    .post(
        "/check_chat_ip",
        validateParams(
            z.object({
                ip: z.string(),
            }),
        ),
        async (c) => {
            const { ip } = c.req.valid("json");

            const banData = await getActiveChatBan(ip);
            if (banData) {
                return c.json({ banned: true, banData: banData, behindProxy: false });
            }

            return c.json({ banned: false, banData: undefined, behindProxy: false });
        },
    )
    .post(
        "/test/insert_game",
        databaseEnabledMiddleware,
        validateParams(
            z.object({
                kills: z.number().default(1),
            }),
        ),
        async (c) => {
            const data = c.req.valid("json");
            const matchData: MatchDataTable = {
                ...{
                    gameId: crypto.randomUUID(),
                    userId: MOCK_USER_ID,
                    createdAt: new Date(),
                    region: "na",
                    mapId: 0,
                    mapSeed: 9834567801234,
                    username: MOCK_USER_ID,
                    playerId: 9834,
                    teamMode: TeamMode.Solo,
                    teamCount: 4,
                    teamTotal: 25,
                    teamId: 7,
                    timeAlive: 842,
                    rank: 3,
                    died: true,
                    kills: 5,
                    assists: 5,
                    damageDealt: 1247,
                    damageTaken: 862,
                    killerId: 18765,
                    killedIds: [12543, 13587, 14298, 15321, 16754],
                },
                ...data,
            };
            await leaderboardCache.invalidateCache([matchData]);
            await db.insert(matchDataTable).values(matchData);
            return c.json({ success: true }, 200);
        },
    )
    .post(
        "/update_modes",
        async (c) => {
                server.refreshRegionModes();
                return c.json({ success: true }, 200);
        }
    );

    function getPassLevelXp(passType: string, level: number) {
        const passDef = PassDefs[passType];
        const levelIdx = level - 1;

        if (levelIdx < passDef.xp.length) {
            return passDef.xp[levelIdx];
        }

        return passDef.xp[passDef.xp.length - 1];
    }

    function getPassLevelAndXp(passType: string, passXp: number) {
        let xp = passXp;
        let level = 1;

        while (level < GameConfig.serverSettings.passMaxLevel) {
            const levelXp = getPassLevelXp(passType, level);

            if (xp < levelXp) {
                break;
            }

            xp -= levelXp;
            level++;
        }

        return {
            level,
            xp,
            nextLevelXp: getPassLevelXp(passType, level),
        };
    }

export type PrivateRouteApp = typeof PrivateRouter;
