import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createNativeDeletionReconciler } from "../../server/src/ranked/nativeDeletion.ts";
import { RankedStore } from "../../server/src/ranked/store.ts";

const stores: RankedStore[] = [];
const directories: string[] = [];
function open(file?: string) {
    if (!file) {
        const directory = mkdtempSync(join(tmpdir(), "survev-native-deletion-"));
        directories.push(directory);
        file = join(directory, "ranked.sqlite");
    }
    const store = new RankedStore(file);
    stores.push(store);
    return store;
}
function sql(store: RankedStore, command: string) {
    const db = new DatabaseSync(store.filePath);
    try {
        db.exec(command);
    } finally {
        db.close();
    }
}
afterEach(() => {
    for (const store of stores.splice(0)) store.close();
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("native deletion reconciliation", () => {
    it("keeps the account and durable intent intact when a deletion is still uncommitted or rolled back", async () => {
        const store = open();
        const profile = store.linkAccount("native-player", "Native Player");
        store.markNativeDeletion(profile.id);
        const loaded = open(store.filePath);
        let respond!: (exists: boolean) => void;
        const exists = vi.fn(() =>
            new Promise<boolean>(resolve => {
                respond = resolve;
            })
        );
        const drain = createNativeDeletionReconciler(loaded, exists);
        const running = drain();
        expect(drain()).toBe(running);
        respond(true);
        await running;
        expect(loaded.getProfile(profile.id)).toEqual(profile);
        expect(loaded.pendingNativeDeletions()).toEqual([profile.id]);
        exists.mockResolvedValue(false);
        await drain();
        expect(loaded.getProfile(profile.id)).toBeUndefined();
        expect(loaded.pendingNativeDeletions()).toEqual([]);
        expect(() => loaded.linkAccount(profile.id, "Stale Session")).toThrow("deleted");
    });

    it("persists failed post-commit cleanup and retries it after reopening SQLite without changing opponents' results", async () => {
        const store = open();
        const one = store.linkAccount("native-one", "Player One");
        const two = store.linkAccount("native-two", "Player Two");
        store.settleSeries("saved-series", 1, [[one.id], [two.id]], 0, [5, 2], "completed");
        const own = store.getProfile(one.id)!;
        const opponent = store.getProfile(two.id)!;
        store.markNativeDeletion(one.id);
        sql(
            store,
            "CREATE TRIGGER cleanup_failure BEFORE UPDATE ON accounts BEGIN SELECT RAISE(ABORT, 'SQLite unavailable'); END",
        );
        const log = vi.fn();
        await createNativeDeletionReconciler(store, async () => false, log)();
        expect(log).toHaveBeenCalledTimes(1);
        const loaded = open(store.filePath);
        expect(loaded.getProfile(one.id)).toEqual(own);
        expect(loaded.pendingNativeDeletions()).toEqual([one.id]);
        sql(loaded, "DROP TRIGGER cleanup_failure");
        await createNativeDeletionReconciler(loaded, async () => false)();
        expect(loaded.getProfile(one.id)).toBeUndefined();
        expect(loaded.getProfile(two.id)).toEqual(opponent);
        expect(loaded.history(two.id)[0].opponents).toEqual(["Deleted Player"]);
        expect(loaded.pendingNativeDeletions()).toEqual([]);
        expect(() => loaded.completeNativeDeletion(one.id)).not.toThrow();
    });

    it("does not erase identity or drop pending work when PostgreSQL cannot confirm deletion", async () => {
        const store = open();
        const profile = store.linkAccount("native-user", "Native User");
        store.markNativeDeletion(profile.id);
        const log = vi.fn();
        await createNativeDeletionReconciler(store, async () => {
            throw new Error("PostgreSQL unavailable");
        }, log)();
        expect(log).toHaveBeenCalledTimes(1);
        expect(store.getProfile(profile.id)).toEqual(profile);
        expect(store.pendingNativeDeletions()).toEqual([profile.id]);
    });

    it("leaves no intent if its write fails and blocks stale sessions for a deleted account that never used ranked", () => {
        const store = open();
        sql(
            store,
            "CREATE TRIGGER intent_failure BEFORE INSERT ON pending_native_deletions BEGIN SELECT RAISE(ABORT, 'intent unavailable'); END",
        );
        expect(() => store.markNativeDeletion("never-linked")).toThrow("intent unavailable");
        expect(store.pendingNativeDeletions()).toEqual([]);
        sql(store, "DROP TRIGGER intent_failure");
        store.markNativeDeletion("never-linked");
        store.completeNativeDeletion("never-linked");
        expect(store.pendingNativeDeletions()).toEqual([]);
        expect(store.getProfile("never-linked")).toBeUndefined();
        expect(() => store.linkAccount("never-linked", "Stale User")).toThrow("deleted");
    });
});
