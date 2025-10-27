import { createHash } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { Config } from "../config";
import { db } from "../db";
import {
    type SessionTableSelect,
    sessionTable,
    type UsersTableSelect,
    usersTable,
} from "../db/schema";

export const sessionCookieName = "auth_session";

function toSha256(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
    token: string,
    userId: string,
): Promise<SessionTableSelect> {
    const sessionId = toSha256(token);

    const session: SessionTableSelect = {
        id: sessionId,
        userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    };
    await db.insert(sessionTable).values(session);
    return session;
}

export async function validateSessionToken(
    token: string,
): Promise<SessionValidationResult> {
    if (!Config.database.enabled) return { session: null, user: null };

    const sessionId = toSha256(token);

    const result = await db
        .select({ user: usersTable, session: sessionTable })
        .from(sessionTable)
        .innerJoin(usersTable, eq(sessionTable.userId, usersTable.id))
        .where(eq(sessionTable.id, sessionId));
    if (result.length < 1) {
        return { session: null, user: null };
    }
    const { user, session } = result[0];
    if (Date.now() >= session.expiresAt.getTime()) {
        await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
        return { session: null, user: null };
    }
    if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
        session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
        await db
            .update(sessionTable)
            .set({
                expiresAt: session.expiresAt,
            })
            .where(eq(sessionTable.id, session.id));
    }
    return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
    await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export async function invalidateAllSessions(userId: string): Promise<void> {
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
}

export async function deleteExpiredSessions(): Promise<void> {
    await db.delete(sessionTable).where(lt(sessionTable.expiresAt, new Date()));
}

export type SessionValidationResult =
    | { session: SessionTableSelect; user: UsersTableSelect }
    | { session: null; user: null };
