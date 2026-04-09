import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../api/db";
import { userQuestTable, usersTable } from "../api/db/schema";
import type { FindGamePrivateBody } from "./types";

export async function getFindGamePlayerData(
    players: Pick<FindGamePrivateBody["playerData"][number], "token" | "userId" | "ip">[],
): Promise<FindGamePrivateBody["playerData"]> {
    const userIds = [
        ...new Set(players.map((p) => p.userId).filter((id) => id !== null)),
    ];

    let accountData: Record<
        string,
        {
            loadout: FindGamePrivateBody["playerData"][0]["loadout"];
            quests: FindGamePrivateBody["playerData"][0]["quests"];
        }
    > = {};

    if (userIds.length) {
        const query = await db
            .select({
                userId: usersTable.id,
                loadout: usersTable.loadout,
                quests: sql<
                    string[]
                >`array_agg(${userQuestTable.questType}) filter (where ${userQuestTable.questType} is not null)`,
            })
            .from(usersTable)
            .leftJoin(userQuestTable, and(eq(userQuestTable.userId, usersTable.id)))
            .where(inArray(usersTable.id, userIds))
            .groupBy(usersTable.id);

        accountData = Object.fromEntries(query.map((r) => [r.userId, r]));
    }

    return players.map(({ token, userId, ip }) => ({
        token,
        userId,
        ip,
        loadout: userId ? accountData[userId]?.loadout : undefined,
        quests: userId ? (accountData[userId]?.quests ?? []) : [],
    }));
}
