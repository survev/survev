import { Config } from "../config.ts";
import { RankedCoordinator } from "./coordinator.ts";
import { GameServerDuelHost } from "./gameServerHost.ts";
import { createNativeDeletionReconciler } from "./nativeDeletion.ts";
import { createRankedRouters } from "./router.ts";
import { RankedStore } from "./store.ts";

export const rankedStore = new RankedStore();
export const rankedCoordinator = new RankedCoordinator(rankedStore, new GameServerDuelHost());
export const rankedRouters = createRankedRouters(rankedStore, rankedCoordinator);
const rankedTimer = setInterval(() => {
    void rankedCoordinator.tick().catch(error => console.error("Ranked matchmaking:", error));
}, 1000);
rankedTimer.unref();

if (Config.database.enabled) {
    const reconcile = createNativeDeletionReconciler(rankedStore, async id => {
        const [{ db }, { usersTable }, { eq }] = await Promise.all([
            import("../api/db/index.ts"),
            import("../api/db/schema.ts"),
            import("drizzle-orm"),
        ]);
        return !!await db.query.usersTable.findFirst({ where: eq(usersTable.id, id), columns: { id: true } });
    });
    const drain = () => {
        void reconcile().catch(error => console.error("Native account cleanup unavailable:", error));
    };
    drain();
    const cleanupTimer = setInterval(drain, 15000);
    cleanupTimer.unref();
}
