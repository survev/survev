import type { RankedStore } from "./store.ts";

/** The database lookup is injected so this worker never opens production databases in a factory test. */
export function createNativeDeletionReconciler(
    store: Pick<RankedStore, "pendingNativeDeletions" | "completeNativeDeletion">,
    nativeAccountExists: (id: string) => Promise<boolean>,
    log: (message: string, error: unknown) => void = console.error,
) {
    let running: Promise<void> | undefined;
    const drain = async () => {
        for (const id of store.pendingNativeDeletions()) {
            try {
                // An existing row may be an in-flight deletion or a rollback. Keep both identity and intent.
                if (await nativeAccountExists(id)) continue;
                store.completeNativeDeletion(id);
            } catch (error) {
                log("Native ranked account cleanup will be retried:", error);
            }
        }
    };
    return () => {
        running ??= drain().finally(() => {
            running = undefined;
        });
        return running;
    };
}
