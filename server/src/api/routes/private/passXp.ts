import { and, eq, sql } from "drizzle-orm";
import { GameObjectDefs } from "../../../../../shared/defs/gameObjectDefs";
import { PassDefs } from "../../../../../shared/defs/gameObjects/passDefs";
import { passUtil } from "../../../../../shared/utils/passUtil";
import { Config } from "../../../config";
import { server } from "../../apiServer";
import type { db } from "../../db";
import { itemsTable, userPassTable } from "../../db/schema";

export async function incrementPassXp(
    transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
    userId: string,
    xpGain: number,
) {
    if (xpGain <= 0) return;

    const passDef = PassDefs[Config.passType];

    const pass = await transaction.query.userPassTable.findFirst({
        where: and(
            eq(userPassTable.userId, userId),
            eq(userPassTable.passType, Config.passType),
        ),
    });

    if (!pass) {
        server.logger.error(`Could not find pass for user ${userId}`);
        return;
    }

    const oldTotalXp = pass.totalXp;
    const newTotalXp = oldTotalXp + xpGain;
    const oldLevel = passUtil.getPassLevelAndXp(Config.passType, oldTotalXp).level;
    const newLevel = passUtil.getPassLevelAndXp(Config.passType, newTotalXp).level;

    const unlockedRewardItems = passDef.items
        .filter((reward) => reward.level > oldLevel && reward.level <= newLevel)
        .map((reward) => reward.item)
        .filter((item) => !!GameObjectDefs[item]);

    let unlockedNewItems = false;

    const now = Date.now();
    if (unlockedRewardItems.length > 0) {
        const insertedRewards = await transaction
            .insert(itemsTable)
            .values(
                unlockedRewardItems.map((item) => ({
                    userId,
                    type: item,
                    source: Config.passType,
                    timeAcquired: now,
                })),
            )
            .onConflictDoNothing()
            .returning({
                type: itemsTable.type,
            });

        unlockedNewItems = insertedRewards.length > 0;
    }

    await transaction
        .insert(userPassTable)
        .values({
            userId,
            passType: Config.passType,
            totalXp: newTotalXp,
            newItems: unlockedNewItems,
        })
        .onConflictDoUpdate({
            target: [userPassTable.userId, userPassTable.passType],
            set: {
                totalXp: newTotalXp,
                newItems: unlockedNewItems ? true : sql`${userPassTable.newItems}`,
                updatedAt: new Date(),
            },
        });
}
