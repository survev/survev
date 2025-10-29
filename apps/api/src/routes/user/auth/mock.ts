import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { Config } from "../../../config";
import { db } from "../../../db";
import { usersTable } from "../../../db/schema";
import { createNewUser, generateId, setSessionTokenCookie } from "./authUtils";

export const MockRouter = new Hono();

export const MOCK_USER_ID = "MOCK_USER_ID";

MockRouter.get("/", async (c) => {
    const existingUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.authId, MOCK_USER_ID),
        columns: {
            id: true,
        },
    });

    setCookie(c, "app-data", "1", {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    if (existingUser) {
        await setSessionTokenCookie(existingUser.id, c);
        return c.redirect(Config.oauthBasePath);
    }

    const userId = generateId(15);
    await createNewUser({
        id: userId,
        authId: MOCK_USER_ID,
        username: MOCK_USER_ID,
        linked: true,
        slug: MOCK_USER_ID,
    });

    await setSessionTokenCookie(userId, c);
    return c.redirect(Config.oauthBasePath);
});
