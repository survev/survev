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

    const accountData =
        userIds.length > 0
            ? Object.fromEntries(
                  (
                      await db
                          .select({
                              userId: usersTable.id,
                              loadout: usersTable.loadout,
                              quests: sql<
                                  string[]
                              >`array_agg(${userQuestTable.questType}) filter (where ${userQuestTable.questType} is not null)`,
                          })
                          .from(usersTable)
                          .leftJoin(
                              userQuestTable,
                              and(eq(userQuestTable.userId, usersTable.id)),
                          )
                          .where(inArray(usersTable.id, userIds))
                          .groupBy(usersTable.id)
                  ).map((r) => [r.userId, r]),
              )
            : {};

    return players.map(({ token, userId, ip }) => ({
        token,
        userId,
        ip,
        loadout: userId ? accountData[userId]?.loadout : undefined,
        quests: userId ? (accountData[userId]?.quests ?? []) : [],
    }));
}
