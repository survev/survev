import { generateRandomString } from "@oslojs/crypto/random";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import slugify from "slugify";
import { UnlockDefs } from "../../../../../../shared/defs/gameObjects/unlockDefs";
import { util } from "../../../../../../shared/utils/util";
import { Config } from "../../../../config";
import { checkForBadWords } from "../../../../utils/serverHelpers";
import { createSession, invalidateSession } from "../../../auth";
import { db } from "../../../db";
import { itemsTable, type UsersTableInsert, usersTable } from "../../../db/schema";

let oauthBaseURL: URL | undefined = undefined;
if (URL.canParse(Config.oauthBasePath)) {
    oauthBaseURL = new URL(Config.oauthBasePath);
}
export const cookieDomain = oauthBaseURL?.hostname;

const random = {
    read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
    },
};
export function generateId(length: number) {
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    return generateRandomString(random, alphabet, length);
}

export function sanitizeSlug(username: string) {
    let slug = slugify(
        username
            .toLowerCase()
            .trim()
            .replace(/[\.,\?""!@#\$%\^&\*\(\)_=\+;:<>\/\\\|\}\{\[\]`~]/g, "-"),
        {
            trim: true,
            strict: true,
        },
    );

    if (!slug || checkForBadWords(slug)) {
        slug = `player_${generateId(6).toLowerCase()}`;
    }

    return slug;
}

export async function setSessionTokenCookie(userId: string, c: Context) {
    const sessionToken = crypto.randomUUID();
    const session = await createSession(sessionToken, userId);

    setCookie(c, "session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: session.expiresAt,
        domain: cookieDomain,
    });
    return session;
}

export async function logoutUser(c: Context, sessionId: string) {
    await invalidateSession(sessionId);
    deleteSessionTokenCookie(c);
    deleteCookie(c, "app-data");
}

export function deleteSessionTokenCookie(c: Context) {
    setCookie(c, "session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        domain: cookieDomain,
    });
}

type Provider = "discord" | "google";

export async function handleAuthUser(c: Context, provider: Provider, authId: string) {
    const existingUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.authId, authId),
        columns: {
            id: true,
        },
    });

    setCookie(c, "app-data", "1", {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        domain: cookieDomain,
    });

    if (existingUser) {
        await setSessionTokenCookie(existingUser.id, c);
        return;
    }

    let generateUsername = true;

    let username = "";
    let slug = "";

    while (generateUsername) {
        username = `Player ${generateId(6)}`;
        slug = sanitizeSlug(username);

        const slugTaken = await db.query.usersTable.findFirst({
            where: eq(usersTable.slug, slug),
            columns: {
                id: true,
            },
        });
        generateUsername = !!slugTaken;
    }

    const linkedProvider =
        provider === "discord" ? { linkedDiscord: true } : { linkedGoogle: true };

    const userId = generateId(15);
    await createNewUser({
        id: userId,
        authId,
        linked: true,
        username: username,
        slug,
        ...linkedProvider,
    });

    await setSessionTokenCookie(userId, c);
}

export async function createNewUser(payload: UsersTableInsert) {
    await db.transaction(async (tx) => {
        await tx.insert(usersTable).values(payload);

        const unlockType = "unlock_new_account";
        const itemsToUnlock = UnlockDefs[unlockType].unlocks || [];

        if (!itemsToUnlock.length) return;

        const items = itemsToUnlock.map((outfit) => {
            return {
                userId: payload.id,
                source: unlockType,
                type: outfit,
                timeAcquired: Date.now(),
            };
        });

        await tx.insert(itemsTable).values(items);
    });
}

export function getRedirectUri(method: Provider) {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && !Config.oauthRedirectURI) {
        throw new Error("oauthRedirectURI is not defined.");
    }

    return `${Config.oauthRedirectURI}/api/auth/${method}/callback`;
}

const cooldownPeriod = util.daysToMs(10);

export function getTimeUntilNextUsernameChange(lastChangeTime: Date | null) {
    if (!(lastChangeTime instanceof Date)) return 0;

    const currentTime = Date.now();
    const timeSinceLastChange = currentTime - new Date(lastChangeTime).getTime();
    return cooldownPeriod - timeSinceLastChange;
}
