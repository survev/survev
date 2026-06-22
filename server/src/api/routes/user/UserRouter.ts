import { and, eq, inArray, ne, notInArray } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { UnlockDefs } from "../../../../../shared/defs/gameObjects/unlockDefs.ts";
import { Constants } from "../../../../../shared/net/net.ts";
import { loadoutSchema } from "../../../../../shared/types/api.ts";
import { type ProfileResponse, type UsernameResponse } from "../../../../../shared/types/user.ts";
import loadout, { ItemStatus } from "../../../../../shared/utils/loadout.ts";
import { validateUserName } from "../../../utils/badWords.ts";
import { server } from "../../apiServer.ts";
import {
    authMiddleware,
    databaseEnabledMiddleware,
    rateLimitMiddleware,
    validateParams,
} from "../../auth/middleware.ts";
import { db } from "../../db/index.ts";
import { itemsTable, matchDataTable, usersTable } from "../../db/schema.ts";
import type { Context } from "../../index.ts";
import { getTimeUntilNextUsernameChange, logoutUser, sanitizeSlug } from "./auth/authUtils.ts";
import { PassRouter } from "./PassRouter.ts";

export const UserRouter = new Hono<Context>()
    .use(databaseEnabledMiddleware)
    .use(rateLimitMiddleware(40, 60 * 1000))
    .use(authMiddleware)
    .route("/", PassRouter)
    .post("/profile", async (c) => {
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
    })
    .post(
        "/username",
        validateParams(
            z.object({
                username: z.string().trim().min(1).max(Constants.PlayerNameMaxLen),
            }),
            { result: "invalid" } satisfies UsernameResponse,
        ),
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
    )
    .post("/loadout", validateParams(z.object({ loadout: loadoutSchema })), async (c) => {
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

        return c.json(
            {
                loadout: validatedLoadout,
            },
            200,
        );
    })
    .post("/logout", async (c) => {
        const session = c.get("session")!;

        await logoutUser(c, session.id);

        return c.json({}, 200);
    })
    .post("/delete", async (c) => {
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
    })
    .post(
        "/set_item_status",
        validateParams(z.object({
            status: z.enum(ItemStatus),
            itemTypes: z.array(z.string()).max(50),
        })),
        async (c) => {
            const user = c.get("user")!;
            const { itemTypes, status } = c.req.valid("json");

            await db
                .update(itemsTable)
                .set({
                    status: status,
                })
                .where(and(eq(itemsTable.userId, user.id), inArray(itemsTable.type, itemTypes)));

            return c.json({}, 200);
        },
    )
    .post("/reset_stats", async (c) => {
        const user = c.get("user")!;

        await db
            .update(matchDataTable)
            .set({ userId: null })
            .where(eq(matchDataTable.userId, user.id));

        return c.json({}, 200);
    });

export type UserRouterApp = typeof UserRouter;
