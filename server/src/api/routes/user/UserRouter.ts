import { and, eq, gte, inArray, ne, notInArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { _allowedCrosshairs, _allowedEmotes, _allowedHealEffects, _allowedMeleeSkins, _allowedOutfits, UnlockDefs } from "../../../../../shared/defs/gameObjects/unlockDefs";
import {
    type GetPassResponse,
    type LoadoutResponse,
    type ProfileResponse,
    type RefreshQuestResponse,
    type SetPassUnlockResponse,
    type UsernameResponse,
    zGetPassRequest,
    zLoadoutRequest,
    zRefreshQuestRequest,
    zSetItemStatusRequest,
    zSetPassUnlockRequest,
    zUsernameRequest,
} from "../../../../../shared/types/user";
import loadout from "../../../../../shared/utils/loadout";
import { apiPrivateRouter, validateUserName } from "../../../utils/serverHelpers";
import { server } from "../../apiServer";
import {
    authMiddleware,
    databaseEnabledMiddleware,
    rateLimitMiddleware,
    validateParams,
} from "../../auth/middleware";
import { db } from "../../db";
import { itemsTable, matchDataTable, usersTable, userXpTable } from "../../db/schema";
import type { Context } from "../../index";
import {
    getTimeUntilNextUsernameChange,
    logoutUser,
    sanitizeSlug,
} from "./auth/authUtils";
import { PassDefs } from "../../../../../shared/defs/gameObjects/passDefs";
import { ExperienceConverter, GameConfig } from "../../../../../shared/gameConfig";
import { QuestDefs } from "../../../../../shared/defs/gameObjects/questDefs";
import { mapDef } from "../../../../../shared/defs/maps/2v2Defs";
import { getMapDefById, MapDefs } from "../../../../../shared/defs/mapDefs";
import { MapId } from "../../../../../shared/defs/types/misc";

export const UserRouter = new Hono<Context>();

UserRouter.use(databaseEnabledMiddleware);
UserRouter.use(rateLimitMiddleware(40, 60 * 1000));
UserRouter.use(authMiddleware);

UserRouter.post("/profile", async (c) => {
    const user = c.get("user")!;

    const {
        loadout,
        slug,
        linked,
        username,
        usernameSet,
        lastUsernameChangeTime,
        banned,
        banReason,
    } = user;

    if (banned) {
        const session = c.get("session")!;
        await logoutUser(c, session.id);

        return c.json<ProfileResponse>({
            banned: true,
            reason: banReason,
        });
    }

    const timeUntilNextChange = getTimeUntilNextUsernameChange(lastUsernameChangeTime);

    const defaultUnlockItems = UnlockDefs["unlock_default"].unlocks;

    const items = await db
        .select({
            type: itemsTable.type,
            timeAcquired: itemsTable.timeAcquired,
            source: itemsTable.source,
            status: itemsTable.status,
        })
        .from(itemsTable)
        .where(
            and(
                eq(itemsTable.userId, user.id),
                notInArray(itemsTable.type, defaultUnlockItems),
            ),
        );

    return c.json<ProfileResponse>(
        {
            success: true,
            profile: {
                slug,
                linked,
                username,
                usernameSet,
                usernameChangeTime: timeUntilNextChange,
            },
            loadout,
            items: items,
        },
        200,
    );
});

UserRouter.post(
    "/username",
    validateParams(zUsernameRequest, { result: "invalid" } satisfies UsernameResponse),
    async (c) => {
        const user = c.get("user")!;
        const { username } = c.req.valid("json");
        const timeUntilNextChange = getTimeUntilNextUsernameChange(
            user.lastUsernameChangeTime,
        );

        if (timeUntilNextChange > 0) {
            return c.json<UsernameResponse>({ result: "change_time_not_expired" }, 200);
        }

        const { validName, originalWasInvalid } = validateUserName(username);

        if (originalWasInvalid) {
            return c.json<UsernameResponse>({ result: "invalid" }, 200);
        }

        const slug = sanitizeSlug(validName);

        const slugTaken = await db.query.usersTable.findFirst({
            where: and(eq(usersTable.slug, slug), ne(usersTable.id, user.id)),
            columns: {
                id: true,
            },
        });

        if (slugTaken) {
            return c.json<UsernameResponse>({ result: "taken" }, 200);
        }

        try {
            await db
                .update(usersTable)
                .set({
                    username: validName,
                    slug: slug,
                    usernameSet: true,
                    lastUsernameChangeTime: new Date(),
                })
                .where(eq(usersTable.id, user.id));
        } catch (err) {
            server.logger.error("/api/username: Error updating username", err);
            return c.json<UsernameResponse>({ result: "failed" }, 500);
        }

        return c.json<UsernameResponse>({ result: "success" }, 200);
    },
);

UserRouter.post("/loadout", validateParams(zLoadoutRequest), async (c) => {
    const user = c.get("user")!;
    const { loadout: userLoadout } = c.req.valid("json");

    const items = await db
        .select({
            type: itemsTable.type,
            timeAcquired: itemsTable.timeAcquired,
            source: itemsTable.source,
            status: itemsTable.status,
        })
        .from(itemsTable)
        .where(eq(itemsTable.userId, user.id));

    const validatedLoadout = loadout.validateWithAvailableItems(userLoadout, items);

    await db
        .update(usersTable)
        .set({ loadout: validatedLoadout })
        .where(eq(usersTable.id, user.id));

    return c.json<LoadoutResponse>(
        {
            loadout: validatedLoadout,
        },
        200,
    );
});

UserRouter.post("/logout", async (c) => {
    const session = c.get("session")!;

    await logoutUser(c, session.id);

    return c.json({}, 200);
});

UserRouter.post("/delete", async (c) => {
    const user = c.get("user")!;
    const session = c.get("session")!;

    // logout out the user
    await logoutUser(c, session.id);

    // delete the account
    await db.delete(usersTable).where(eq(usersTable.id, user.id));

    // remove reference to the user from match data
    await db
        .update(matchDataTable)
        .set({ userId: null })
        .where(eq(matchDataTable.userId, user.id));

    return c.json({}, 200);
});

UserRouter.post("/set_item_status", validateParams(zSetItemStatusRequest), async (c) => {
    const user = c.get("user")!;
    const { itemTypes, status } = c.req.valid("json");

    await db
        .update(itemsTable)
        .set({
            status: status,
        })
        .where(and(eq(itemsTable.userId, user.id), inArray(itemsTable.type, itemTypes)));

    return c.json({}, 200);
});

UserRouter.post("/reset_stats", async (c) => {
    const user = c.get("user")!;

    await db
        .update(matchDataTable)
        .set({ userId: null })
        .where(eq(matchDataTable.userId, user.id));

    return c.json({}, 200);
});

//
// NOT IMPLEMENTED
//
UserRouter.post("/set_pass_unlock", validateParams(zSetPassUnlockRequest), (c) => {
    return c.json<SetPassUnlockResponse>({ success: true }, 200);
});

UserRouter.post("/get_pass", validateParams(zGetPassRequest), async (c) => {
    const user = c.get("user")!;
    const passType = GameConfig.serverSettings.currentPass;
    // get lastUpdated from user_xp table to check if we need to recalculate the pass progress
    const userXpRecord = await db.query.userXpTable.findFirst({
        where: and(eq(userXpTable.userId, user.id), eq(userXpTable.passType, passType)),
    });
    const seasonStart = new Date(GameConfig.serverSettings.seasonStart);
    const lastUpdated = userXpRecord && userXpRecord.lastUpdated > seasonStart
    ? userXpRecord.lastUpdated
    : seasonStart;

    const currentXp = userXpRecord ? Number(userXpRecord.xp) : 0;
    const stats = await db
        .select({
            gameId: matchDataTable.gameId,
            kills: sql<number>`max(${matchDataTable.kills})`,
            damage: sql<number>`max(${matchDataTable.damageDealt})`,
            timeAlive: sql<number>`max(${matchDataTable.timeAlive})`,
            rank: sql<number>`min(${matchDataTable.rank})`,
            mapId: sql<number>`max(${matchDataTable.mapId})`,
            createdAt: sql<Date>`max(${matchDataTable.createdAt})`,
            entryCount: sql<number>`count(*)`,
        })
        .from(matchDataTable)
        .where(
            and(
                eq(matchDataTable.userId, user.id),
                gte(matchDataTable.createdAt, lastUpdated),
            ),
        )
        .groupBy(matchDataTable.gameId)
        .having(sql`count(*) = 1`);

    // Build reverse lookup: MapId number → map type name string
    const mapIdToName = Object.fromEntries(
        Object.entries(MapDefs).map(([name, def]) => [def.mapId, name]),
    ) as Record<number, string>;

    // Returns the XP boost multiplier for a given pass/map/time, or 1 if none active
    function getXpBoost(mapTypeName: string, matchTime: Date): number {
        const boostEvents = GameConfig.serverSettings.xpBoostEvents?.[passType];
        if (!boostEvents) return 1;
        const t = matchTime instanceof Date ? matchTime.getTime() : new Date(matchTime).getTime();
        for (const event of Object.values(boostEvents)) {
            if (
                t >= new Date(event.start).getTime() &&
                t <= new Date(event.end).getTime() &&
                event.maps.includes(mapTypeName)
            ) {
                return event.boost;
            }
        }
        return 1;
    }

    let totalXp = 0;
    for (const stat of stats) {
        const mapDef = getMapDefById(stat.mapId);
        const xpMultiplier = mapDef?.gameMode?.xpMultiplier || {
            kill: 0,
            damage: 0,
            win: 0,
            timeSurvived: 0,
        };
        const mapTypeName = mapIdToName[stat.mapId] ?? "";
        const boost = getXpBoost(mapTypeName, stat.createdAt);

        let matchXp = 0;
        matchXp += stat.kills * xpMultiplier.kill;
        matchXp += stat.damage * xpMultiplier.damage;
        matchXp += (stat.rank === 1 ? 1 : 0) * xpMultiplier.win;
        matchXp += stat.timeAlive * xpMultiplier.timeSurvived;
        totalXp += Math.floor(matchXp * boost);
    }
    console.log(`User ${user.username} earned ${totalXp} XP from ${stats.length} matches since last update`);

    const newTotalXp = currentXp + totalXp;

    const { level, xp } = getPassLevelAndXp(passType, newTotalXp);


    const allowedItems = [
                    ...new Set([
                        ..._allowedHealEffects,
                        ..._allowedMeleeSkins,
                        ..._allowedOutfits,
                        ..._allowedEmotes,
                        ..._allowedCrosshairs,
                    ]),
                ];

        const passDef = PassDefs[passType as keyof typeof PassDefs];

        const unlockedItems = passDef.items.filter(
                    (item) => item.level <= level
                );
                const ownedItems = await db
                    .select({ type: itemsTable.type })
                    .from(itemsTable)
                    .where(eq(itemsTable.userId, user.id));
        
                const ownedSet = new Set(ownedItems.map((i) => i.type));
                const newUnlocks = unlockedItems.filter((item) => !ownedSet.has(item.item) && allowedItems.includes(item.item));
        
                if (newUnlocks.length > 0) {
                    await db.insert(itemsTable).values(
                        newUnlocks.map((item) => ({
                            userId: user.id,
                            type: item.item,
                            source: passType,
                            timeAcquired: Date.now(),
                        }))
                    );
                }
                console.log(`User ${user.username} has ${totalXp} XP, level ${level}, ${newUnlocks.length} new unlocks`);

    const pass = {
        type: passType,
        level,
        xp,
        newTotalXp,
        newItems: false,
    };
    if (newUnlocks.length > 0) {
        pass.newItems = true;
    }

    // neue xp und level in der user_xp db speichern
    if(stats.length > 0) {
        await db
            .insert(userXpTable)
            .values({
                userId: user.id,
                passType,
                xp: String(newTotalXp),
                level,
                lastUpdated: new Date(),
            })
            .onConflictDoUpdate({
                target: [userXpTable.userId, userXpTable.passType],
                set: {
                xp: String(newTotalXp),
                level,
                lastUpdated: new Date(),
                },
            });
    }

    const quests = Object.keys(QuestDefs).map((questType, idx) => {
    const questDef = QuestDefs[questType];

            return {
            idx,
            type: questType,
            timeAcquired: Date.now(),
            progress: 0,
            target: questDef.target,
            complete: false,
            rerolled: false,
            timeToRefresh: 0,
        };
    });

    return c.json<GetPassResponse>(
        {
            success: true,
            pass,
            quests,
            questPriv: "",
        },
        200,
    );
});

UserRouter.post("/refresh_quest", validateParams(zRefreshQuestRequest), (c) => {
    return c.json<RefreshQuestResponse>({ success: true }, 200);
});


const PASS_MAX_LEVEL = GameConfig.serverSettings.passMaxLevel;

function getPassLevelXp(passType: string, level: number) {
    const passDef = PassDefs[passType];
    const levelIdx = level - 1;

    if (levelIdx < passDef.xp.length) {
        return passDef.xp[levelIdx];
    }

    // aktuell gleiches Verhalten wie dein bestehendes passUtil
    return passDef.xp[passDef.xp.length - 1];
}

function getPassLevelAndXp(passType: string, passXp: number) {
    let xp = passXp;
    let level = 1;

    while (level < PASS_MAX_LEVEL) {
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