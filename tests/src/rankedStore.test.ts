import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RankedStore, rankedTier } from "../../server/src/ranked/store.ts";

const directories: string[] = [];
const stores: RankedStore[] = [];
const password = "correct horse battery";

function temporaryFile(): string {
    const directory = mkdtempSync(join(tmpdir(), "survev-ranked-test-"));
    directories.push(directory);
    return join(directory, "ranked.sqlite");
}

function openStore(file = temporaryFile()): RankedStore {
    const store = new RankedStore(file);
    stores.push(store);
    return store;
}

function withDatabase<T>(file: string, action: (db: DatabaseSync) => T): T {
    const db = new DatabaseSync(file);
    try {
        return action(db);
    } finally {
        db.close();
    }
}

afterEach(() => {
    vi.restoreAllMocks();
    for (const store of stores.splice(0)) store.close();
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("local ranked account database", () => {
    it("persists completed combat and Elo together and reconstructs anonymized scoreboard identities after reopening", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const one = store.linkAccount("combat-one", "Original Name");
        const two = store.linkAccount("combat-two", "Other Player");
        const teams: [string[], string[]] = [[one.id], [two.id]];
        store.recordForfeit("saved-combat", 1, teams, one.id, "Personal forfeit");
        const combat = [
            { profileId: one.id, kills: 2, damageDealt: 210.5, roundWins: 2 },
            { profileId: two.id, kills: 5, damageDealt: 615, roundWins: 5 },
        ];
        const result = store.settleSeries("saved-combat", 1, teams, 1, [2, 5], "completed", undefined, combat);
        expect(result.scoreboard).toEqual([
            {
                id: one.id,
                name: "Original Name",
                team: 0,
                kills: 2,
                damage: 210.5,
                roundsWon: 2,
                before: 1000,
                after: 936,
                delta: -64,
                forfeited: true,
            },
            {
                id: two.id,
                name: "Other Player",
                team: 1,
                kills: 5,
                damage: 615,
                roundsWon: 5,
                before: 1000,
                after: 1032,
                delta: 32,
                forfeited: false,
            },
        ]);
        const loaded = openStore(file);
        expect(loaded.getSeriesResult("saved-combat")!.scoreboard).toEqual(result.scoreboard);
        expect(
            loaded.settleSeries(
                "saved-combat",
                1,
                teams,
                0,
                [5, 0],
                "duplicate",
                undefined,
                combat.map(player => ({ ...player, kills: 99 })),
            ),
        ).toEqual(result);
        expect(loaded.getProfile(one.id)!.ratings[1].played).toBe(1);
        loaded.anonymizeAccount(one.id);
        const anonymous = loaded.getSeriesResult("saved-combat")!;
        expect(anonymous.scoreboard![0]).toMatchObject({ name: "Deleted Player", kills: 2, damage: 210.5, delta: -64 });
        expect(JSON.stringify(anonymous)).not.toContain("Original Name");
        const columns = withDatabase(
            file,
            db => db.prepare("PRAGMA table_info(series_combat)").all() as { name: string }[],
        );
        expect(columns.map(column => column.name)).toEqual([
            "series_id",
            "account_id",
            "kills",
            "damage",
            "round_wins",
        ]);
    });

    it("keeps legacy results without telemetry unavailable when migrating version six", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const one = store.linkAccount("legacy-one", "Legacy One");
        const two = store.linkAccount("legacy-two", "Legacy Two");
        const original = store.settleSeries("legacy-result", 1, [[one.id], [two.id]], 0, [5, 2], "completed");
        expect(original.scoreboard).toBeNull();
        withDatabase(file, db => db.exec("DROP TABLE series_combat; PRAGMA user_version = 6;"));
        const upgraded = openStore(file);
        expect(upgraded.getSeriesResult("legacy-result")).toEqual(original);
        expect(upgraded.getSeriesResult("legacy-result")!.scoreboard).toBeNull();
        expect(upgraded.getProfile(one.id)!.ratings[1].elo).toBe(1032);
    });

    it("rolls back both Elo and scoreboard rows if combat persistence fails", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const one = store.linkAccount("atomic-one", "Atomic One");
        const two = store.linkAccount("atomic-two", "Atomic Two");
        const teams: [string[], string[]] = [[one.id], [two.id]];
        const combat = [
            { profileId: one.id, kills: 1, damageDealt: 100, roundWins: 5 },
            { profileId: two.id, kills: 0, damageDealt: 50, roundWins: 0 },
        ];
        expect(() => store.settleSeries("bad-roster", 1, teams, 0, [5, 0], "completed", undefined, combat.slice(0, 1)))
            .toThrow("Invalid ranked series combat");
        withDatabase(
            file,
            db =>
                db.exec(
                    "CREATE TRIGGER combat_failure BEFORE INSERT ON series_combat WHEN NEW.account_id = 'atomic-two' BEGIN SELECT RAISE(ABORT, 'combat write failed'); END",
                ),
        );
        expect(() => store.settleSeries("atomic-combat", 1, teams, 0, [5, 0], "completed", undefined, combat)).toThrow(
            "combat write failed",
        );
        expect(store.getSeriesResult("atomic-combat")).toBeUndefined();
        for (const id of [one.id, two.id]) {
            expect(store.getProfile(id)!.ratings[1]).toMatchObject({ elo: 1000, played: 0 });
        }
        expect(withDatabase(file, db => db.prepare("SELECT * FROM series_combat").all())).toEqual([]);
        withDatabase(file, db => db.exec("DROP TRIGGER combat_failure"));
        expect(store.settleSeries("atomic-combat", 1, teams, 0, [5, 0], "completed", undefined, combat).scoreboard)
            .toHaveLength(2);
    });
    it("protects random teammates but not the forfeiter's original premade partner", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const ids = Array.from({ length: 6 }, (_, i) => store.linkAccount(`p${i}`, `Player ${i}`).id);
        const teams: [string[], string[]] = [ids.slice(0, 3), ids.slice(3)];
        const parties = { p0: "original-premade", p1: "original-premade" };
        store.beginSeries("premade-protection", 3, teams, parties);
        parties.p1 = "changed-after-assignment";
        const loaded = openStore(file);
        loaded.recordForfeit("premade-protection", 3, teams, "p0", "Personal forfeit");
        const result = loaded.settleSeries("premade-protection", 3, teams, 1, [2, 5], "completed");
        expect(result.ratingChanges.map(change => change.delta)).toEqual([-64, -32, -21, 32, 32, 32]);
        expect(store.getProfile("p1")!.ratings[3].losses).toBe(1);
        expect(store.getProfile("p2")!.ratings[3].losses).toBe(1);
    });

    it("uses faster Elo for exactly five placements and admits players to the leaderboard afterward", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const one = store.linkAccount("new-player", "New Player");
        const two = store.linkAccount("other-player", "Other Player");
        const teams: [string[], string[]] = [[one.id], [two.id]];
        for (let game = 1; game <= 6; game++) {
            withDatabase(file, db => db.exec("UPDATE ratings SET elo = 1000 WHERE size = 1"));
            const result = store.settleSeries(`placement-${game}`, 1, teams, 0, [5, 2], "completed");
            expect(result.ratingChanges.map(change => change.delta)).toEqual(game <= 5 ? [32, -32] : [16, -16]);
            expect(store.getProfile(one.id)!.ratings[1].placementsRemaining).toBe(Math.max(0, 5 - game));
            expect(store.leaderboard(1)).toHaveLength(game < 5 ? 0 : 2);
        }
        const newcomer = store.linkAccount("late-newcomer", "Late Newcomer");
        withDatabase(file, db => db.exec("UPDATE ratings SET elo = 1000 WHERE size = 1"));
        const mixed = store.settleSeries("mixed-placement", 1, [[newcomer.id], [one.id]], 0, [5, 0], "completed");
        expect(mixed.ratingChanges.map(change => change.delta)).toEqual([32, -16]);
    });

    it("persists escalating cooldowns with duplicate protection and a rolling twenty-four-hour window", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const one = store.linkAccount("cooldown-user", "Cooldown User");
        const two = store.linkAccount("opponent", "Opponent");
        const at = 100000;
        expect(store.recordNoShow("first", one.id, at)).toContain("Warning");
        expect(store.queueCooldown(one.id, at)).toBeNull();
        store.recordNoShow("second", one.id, at + 1);
        const loaded = openStore(file);
        expect(loaded.queueCooldown(one.id, at + 1)).toMatchObject({ until: at + 60001, seconds: 60 });
        loaded.recordNoShow("second", one.id, at + 30000);
        expect(loaded.queueCooldown(one.id, at + 30000)!.until).toBe(at + 60001);
        loaded.recordNoShow("third", one.id, at + 60002);
        expect(loaded.queueCooldown(one.id, at + 60002)!.seconds).toBe(300);
        loaded.recordNoShow("fourth", one.id, at + 400000);
        expect(loaded.queueCooldown(one.id, at + 400000)!.seconds).toBe(900);
        const nextDay = at + 25 * 60 * 60 * 1000;
        expect(loaded.recordNoShow("next-day", one.id, nextDay)).toContain("Warning");
        expect(loaded.queueCooldown(one.id, nextDay)).toBeNull();
        for (let strike = 0; strike < 3; strike++) {
            const now = nextDay + strike * 3600001;
            const penalty = loaded.recordForfeit(
                `forfeit-${strike}`,
                1,
                [[one.id], [two.id]],
                one.id,
                "Personal forfeit",
                undefined,
                now,
            );
            expect(loaded.queueCooldown(one.id, now)!.seconds).toBe([300, 900, 3600][strike]);
            expect(
                loaded.recordForfeit(
                    `forfeit-${strike}`,
                    1,
                    [[one.id], [two.id]],
                    one.id,
                    "Duplicate",
                    undefined,
                    now + 1,
                ),
            ).toEqual(penalty);
            expect(loaded.queueCooldown(one.id, now)!.seconds).toBe([300, 900, 3600][strike]);
        }
    });

    it("migrates version-four pending penalties without changing old Elo or inventing party membership", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const one = store.linkAccount("existing-one", "Existing One");
        const two = store.linkAccount("existing-two", "Existing Two");
        const teams: [string[], string[]] = [[one.id], [two.id]];
        const original = store.recordForfeit("pending-v4", 1, teams, one.id, "Personal forfeit");
        withDatabase(
            file,
            db =>
                db.exec(
                    "DROP TABLE queue_events; DROP TABLE pending_native_deletions; DROP TABLE series_combat; ALTER TABLE series_context DROP COLUMN parties_json; ALTER TABLE series_context DROP COLUMN factors_json; PRAGMA user_version = 4;",
                ),
        );
        const upgraded = openStore(file);
        expect(upgraded.getForfeit("pending-v4", one.id)).toEqual(original);
        expect(upgraded.getProfile(one.id)!.ratings[1].elo).toBe(original.after);
        const settled = upgraded.settleSeries("pending-v4", 1, teams, 1, [0, 5], "completed");
        expect(settled.ratingChanges.map(change => change.delta)).toEqual([original.delta, 16]);
        expect(upgraded.getProfile(one.id)!.ratings[1].played).toBe(1);
    });
    it("persists a personal penalty immediately and never applies it again when the team wins", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const ids = Array.from({ length: 4 }, (_, i) => store.linkAccount(`native-${i}`, `Player ${i}`).id);
        const teams: [string[], string[]] = [ids.slice(0, 2), ids.slice(2)];
        const penalty = store.recordForfeit("unfinished-series", 2, teams, ids[0], "Personal forfeit");
        expect(penalty).toMatchObject({ before: 1000, after: 936, delta: -64 });
        const reloaded = openStore(file);
        expect(reloaded.recordForfeit("unfinished-series", 2, teams, ids[0], "Duplicate report")).toEqual(penalty);
        expect(reloaded.getProfile(ids[0])!.ratings[2]).toMatchObject({ elo: 936, played: 1, losses: 1 });
        expect(reloaded.history(ids[0], 2)[0]).toMatchObject({
            won: false,
            delta: -64,
            reason: "Personal forfeit",
            forfeited: true,
        });
        // This player may already enter another series while their old teammates continue.
        store.settleSeries("later-series", 2, teams, 1, [0, 5], "completed");
        const afterLater = store.getProfile(ids[0])!.ratings[2];
        const result = reloaded.settleSeries("unfinished-series", 2, teams, 0, [5, 3], "completed");
        expect(store.getProfile(ids[0])!.ratings[2]).toEqual(afterLater);
        expect(result.ratingChanges.map(change => change.delta)).toEqual([-64, 32, -32, -32]);
        expect(reloaded.history(ids[0], 2).find(entry => entry.seriesId === "unfinished-series"))
            .toMatchObject({
                won: false,
                before: 1000,
                after: 936,
                delta: -64,
                reason: "Personal forfeit",
                forfeited: true,
            });
        expect(reloaded.settleSeries("unfinished-series", 2, teams, 1, [1, 5], "duplicate")).toEqual(result);
        expect(reloaded.getProfile(ids[0])!.ratings[2]).toEqual(afterLater);
    });

    it.each([1, 2, 3])("reduces remaining 4v4 teammates' losses after %i individual forfeits", forfeiterCount => {
        const store = openStore();
        const ids = Array.from({ length: 8 }, (_, i) => store.linkAccount(`native-${i}`, `Player ${i}`).id);
        const teams: [string[], string[]] = [ids.slice(0, 4), ids.slice(4)];
        for (const id of teams[0].slice(0, forfeiterCount)) {
            store.recordForfeit("partial-team", 4, teams, id, "Personal forfeit");
        }
        const result = store.settleSeries("partial-team", 4, teams, 1, [2, 5], "completed");
        const remainingLoss = -Math.round(32 * (4 - forfeiterCount) / 4);
        expect(result.ratingChanges.map(change => change.delta)).toEqual([
            ...Array(forfeiterCount).fill(-64),
            ...Array(4 - forfeiterCount).fill(remainingLoss),
            ...Array(4).fill(32),
        ]);
        for (const id of ids) expect(store.getProfile(id)!.ratings[4].played).toBe(1);
        for (const id of ids) expect(store.getProfile(id)!.ratings[2].played).toBe(0);
    });

    it("always charges at least one Elo for a loss and a larger personal forfeit penalty", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const ids = Array.from({ length: 4 }, (_, i) => store.linkAccount(`native-${i}`, `Player ${i}`).id);
        const teams: [string[], string[]] = [ids.slice(0, 2), ids.slice(2)];
        withDatabase(file, db => {
            for (const id of teams[1]) {
                db.prepare("UPDATE ratings SET elo = 3000 WHERE account_id = ? AND size = 2").run(id);
            }
        });
        expect(store.recordForfeit("large-gap", 2, teams, ids[0], "Personal forfeit").delta).toBe(-2);
        const result = store.settleSeries("large-gap", 2, teams, 1, [0, 5], "completed");
        expect(result.ratingChanges[1].delta).toBe(-1);
        expect(result.ratingChanges[2].delta).toBe(0);
    });

    it("rolls back a failed immediate penalty and still settles after the forfeiter deletes their account", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const ids = Array.from({ length: 4 }, (_, i) => store.linkAccount(`native-${i}`, `Player ${i}`).id);
        const teams: [string[], string[]] = [ids.slice(0, 2), ids.slice(2)];
        withDatabase(
            file,
            db =>
                db.exec(
                    "CREATE TRIGGER fail_forfeit BEFORE INSERT ON series_forfeits BEGIN SELECT RAISE(ABORT, 'failed write'); END",
                ),
        );
        expect(() => store.recordForfeit("retry", 2, teams, ids[0], "Personal forfeit")).toThrow("failed write");
        expect(store.getProfile(ids[0])!.ratings[2].played).toBe(0);
        expect(store.history(ids[0])).toEqual([]);
        withDatabase(file, db => db.exec("DROP TRIGGER fail_forfeit"));
        store.recordForfeit("retry", 2, teams, ids[0], "Personal forfeit");
        store.anonymizeAccount(ids[0]);
        expect(store.settleSeries("retry", 2, teams, 1, [1, 5], "completed").ratingChanges[0])
            .toMatchObject({ name: "Deleted Player", delta: -64, forfeited: true });
        expect(store.history(ids[2])[0].opponents).toEqual(["Deleted Player", "Player 1"]);
    });
    it("reloads real accounts and sessions without storing plaintext credentials", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const { profile, token } = store.register("  Zoe   Player  ", password);
        const other = store.register("Other Player", password);
        expect(profile.name).toBe("Zoe Player");
        expect(profile.ratings[1]).toMatchObject({ elo: 1000, played: 0, tier: "Silver", placementsRemaining: 5 });
        withDatabase(file, (db) => {
            const accounts = db.prepare("SELECT password_salt, password_hash FROM accounts").all() as {
                password_salt: string;
                password_hash: string;
            }[];
            expect(accounts[0].password_salt).not.toBe(accounts[1].password_salt);
            expect(accounts[0].password_hash).not.toBe(accounts[1].password_hash);
            const sessions = db.prepare("SELECT token_hash FROM sessions").all();
            expect(JSON.stringify({ accounts, sessions })).not.toContain(password);
            expect(JSON.stringify(sessions)).not.toContain(token);
            expect(JSON.stringify(sessions)).not.toContain(other.token);
        });
        const loaded = openStore(file);
        expect(loaded.authenticate(token)).toEqual(profile);
        expect(loaded.login("zoe player", password).profile).toEqual(profile);
        expect(Object.keys(profile).sort()).toEqual(["id", "name", "ratings"]);
        expect(loaded.authenticate(profile.id)).toBeUndefined();
        expect(loaded.authenticate("a".repeat(43))).toBeUndefined();
        expect(loaded.authenticate(`${token}x`)).toBeUndefined();
        expect(() => loaded.login("zoe player", "wrong password")).toThrow("Incorrect username or password");
        expect(() => loaded.login("missing user", password)).toThrow("Incorrect username or password");
    });

    it("revokes logout sessions and expires them after thirty days", () => {
        const store = openStore();
        const first = store.register("Player One", password);
        const second = store.login("Player One", password);
        expect(second.token).not.toBe(first.token);
        store.logout(first.token);
        expect(store.authenticate(first.token)).toBeUndefined();
        expect(store.authenticate(second.token)?.id).toBe(first.profile.id);
        const future = Date.now() + 31 * 24 * 60 * 60 * 1000;
        vi.spyOn(Date, "now").mockReturnValue(future);
        expect(store.authenticate(second.token)).toBeUndefined();
        expect(store.login("Player One", password).profile.id).toBe(first.profile.id);
    });

    it("validates unique game-compatible usernames and password length, and persists renames", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const first = store.register("Player One", password);
        store.register("Player Two", password);
        expect(() => store.register("player one", password)).toThrow("already taken");
        expect(() => store.register("Ｐｌａｙｅｒ Ｏｎｅ", password)).toThrow("already taken");
        for (const badName of ["x", "x".repeat(17), "<script>", "A&B", "A\u202eBC", "玩家二"]) {
            expect(() => store.register(badName, password)).toThrow();
        }
        expect(() => store.register("Player Three", "short")).toThrow("8–128");
        expect(() => store.register("Player Three", "a".repeat(129))).toThrow("8–128");
        expect(() => store.rename(first.profile.id, "Player Two")).toThrow("already taken");
        expect(store.rename(first.profile.id, "New Name").name).toBe("New Name");
        expect(openStore(file).login("new name", password).profile.id).toBe(first.profile.id);
        expect(() => store.login("Player One", password)).toThrow("Incorrect username or password");
    });

    it("settles an entire first-to-five series exactly once across connections", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const one = store.register("Player One", password).profile.id;
        const two = store.register("Player Two", password).profile.id;
        const result = store.settleSeries("series-1", 1, [[one], [two]], 0, [5, 3], "completed");
        expect(result.ratingChanges.map((entry) => entry.delta)).toEqual([32, -32]);
        expect(store.getProfile(one)?.ratings[1]).toMatchObject({
            elo: 1032,
            played: 1,
            wins: 1,
            losses: 0,
            streak: 1,
            placementsRemaining: 4,
        });
        expect(store.getProfile(two)?.ratings[1]).toMatchObject({ elo: 968, played: 1, losses: 1, streak: -1 });
        expect(store.history(two)[0]).toMatchObject({
            score: [3, 5],
            won: false,
            opponents: ["Player One"],
            delta: -32,
        });
        expect(store.settleSeries("series-1", 1, [[one], [two]], 1, [0, 5], "forfeit")).toEqual(result);
        const loaded = openStore(file);
        expect(loaded.settleSeries("series-1", 1, [[one], [two]], 0, [5, 3], "completed")).toEqual(result);
        expect(loaded.getProfile(one)?.ratings[1].played).toBe(1);
        expect(loaded.history(one)).toHaveLength(1);
    });

    it("links original Survev accounts by stable ID and preserves their Elo across name changes", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const one = store.linkAccount("native-account-one", "Native Player");
        const two = store.linkAccount("native-account-two", "Native Player");
        expect(one.id).toBe("native-account-one");
        expect(two.name).not.toBe(one.name);
        expect(two.name).toMatch(/^[a-zA-Z0-9 _.-]{2,16}$/);
        withDatabase(
            file,
            (db) =>
                db.exec(
                    "CREATE TRIGGER block_poll_writes BEFORE UPDATE ON accounts BEGIN SELECT RAISE(ABORT, 'poll must be read-only'); END",
                ),
        );
        expect(store.linkAccount(one.id, "Native Player")).toEqual(one);
        expect(store.linkAccount(two.id, "Native Player")).toEqual(two);
        withDatabase(file, (db) => db.exec("DROP TRIGGER block_poll_writes"));
        store.settleSeries("native-series", 1, [[one.id], [two.id]], 0, [5, 2], "completed");
        const renamed = openStore(file).linkAccount(one.id, "Updated Name");
        expect(renamed.name).toBe("Updated Name");
        expect(renamed.ratings[1].elo).toBe(1032);
        expect(store.history(one.id)[0].delta).toBe(32);
        expect(() => store.login(renamed.name, password)).toThrow("Incorrect username or password");
        const local = store.register("Local Player", password);
        expect(() => store.linkAccount(local.profile.id, "Impersonator")).toThrow("already in use");
        expect(store.authenticate(local.token)?.name).toBe("Local Player");
    });

    it("upgrades local account databases without losing account passwords or ratings", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const account = store.register("Existing Player", password);
        withDatabase(
            file,
            (db) =>
                db.exec(
                    "ALTER TABLE accounts DROP COLUMN auth_kind; DROP TABLE account_settings; DROP TABLE series_forfeits; DROP TABLE series_context; DROP TABLE queue_events; DROP TABLE pending_native_deletions; DROP TABLE series_combat; PRAGMA user_version = 1;",
                ),
        );
        const upgraded = openStore(file);
        expect(upgraded.authenticate(account.token)).toEqual(account.profile);
        expect(upgraded.login("Existing Player", password).profile).toEqual(account.profile);
        expect(upgraded.linkAccount("new-native-user", "Native User").id).toBe("new-native-user");
        expect(
            withDatabase(
                file,
                (db) => (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version,
            ),
        ).toBe(7);
    });

    it("upgrades version-three series history without changing saved Elo or account sessions", () => {
        const file = temporaryFile();
        const original = openStore(file);
        const one = original.register("Existing Player", password);
        const two = original.linkAccount("existing-opponent", "Opponent");
        const saved = original.settleSeries("existing-result", 1, [[one.profile.id], [two.id]], 0, [5, 2], "completed");
        withDatabase(
            file,
            db =>
                db.exec(
                    "DROP TABLE series_forfeits; DROP TABLE series_context; DROP TABLE queue_events; DROP TABLE pending_native_deletions; DROP TABLE series_combat; ALTER TABLE series_players DROP COLUMN forfeited; PRAGMA user_version = 3;",
                ),
        );
        const upgraded = openStore(file);
        expect(upgraded.authenticate(one.token)!.ratings[1].elo).toBe(1032);
        expect(upgraded.getSeriesResult("existing-result")).toEqual(saved);
        expect(upgraded.history(two.id)[0]).toMatchObject({ delta: -32, score: [2, 5] });
        expect(
            upgraded.recordForfeit("new-forfeit", 1, [[one.profile.id], [two.id]], one.profile.id, "Personal forfeit")
                .delta,
        ).toBeLessThan(-32);
        expect(upgraded.getProfile(two.id)!.ratings[1].played).toBe(1);
    });

    it("anonymizes native account deletion without changing opponents' Elo or reviving stale identities", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const one = store.linkAccount("native-deleted-player", "Native Player");
        const two = store.linkAccount("native-surviving-player", "Opponent");
        store.settleSeries("native-deletion-series", 1, [[one.id], [two.id]], 0, [5, 2], "completed");
        withDatabase(file, db => db.exec("UPDATE ratings SET played = 5, wins = 4, losses = 1 WHERE size = 1"));
        store.anonymizeAccount(one.id);
        expect(store.getProfile(one.id)).toBeUndefined();
        expect(store.leaderboard(1).map(entry => entry.id)).toEqual([two.id]);
        expect(store.getProfile(two.id)?.ratings[1].elo).toBe(968);
        expect(store.history(two.id)[0]).toMatchObject({ opponents: ["Deleted Player"], delta: -32 });
        expect(() => store.linkAccount(one.id, "Old Auth Session")).toThrow("deleted");
        expect(() => openStore(file).linkAccount(one.id, "Old Auth Session")).toThrow("deleted");
        expect(() => store.anonymizeAccount(one.id)).not.toThrow();
        expect(() => store.anonymizeAccount("never-linked-native-user")).not.toThrow();
    });

    it("uses team-average Elo with equal per-player changes and independent modes", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const profiles = ["Strong One", "Strong Two", "Weak One", "Weak Two"].map((name) =>
            store.register(name, password).profile.id
        );
        withDatabase(file, (db) => {
            const update = db.prepare("UPDATE ratings SET elo = ? WHERE account_id = ? AND size = 2");
            [1600, 1200, 1000, 1000].forEach((elo, index) => update.run(elo, profiles[index]));
        });
        const result = store.settleSeries(
            "upset",
            2,
            [profiles.slice(0, 2), profiles.slice(2)],
            1,
            [4, 5],
            "completed",
        );
        expect(result.ratingChanges.map((change) => change.delta)).toEqual([-58, -58, 58, 58]);
        expect(result.ratingChanges.reduce((sum, change) => sum + change.delta, 0)).toBe(0);
        for (const id of profiles) {
            expect(store.getProfile(id)?.ratings[1]).toMatchObject({ elo: 1000, played: 0 });
            expect(store.getProfile(id)?.ratings[3]).toMatchObject({ elo: 1000, played: 0 });
            expect(store.getProfile(id)?.ratings[4]).toMatchObject({ elo: 1000, played: 0 });
        }
    });

    it("tracks five placements, signed streaks and the twenty most recent series", () => {
        const store = openStore();
        const one = store.register("Player One", password).profile.id;
        const two = store.register("Player Two", password).profile.id;
        for (let index = 0; index < 22; index++) {
            const winner = index < 20 ? 0 : 1;
            store.settleSeries(
                `series-${index}`,
                1,
                [[one], [two]],
                winner,
                winner === 0 ? [5, 2] : [1, 5],
                "completed",
            );
        }
        expect(store.getProfile(one)?.ratings[1]).toMatchObject({
            played: 22,
            wins: 20,
            losses: 2,
            streak: -2,
            placementsRemaining: 0,
        });
        expect(store.getProfile(two)?.ratings[1].streak).toBe(2);
        expect(store.history(one)).toHaveLength(20);
        expect(store.history(one)[0].seriesId).toBe("series-21");
        expect(store.history(one).at(-1)?.seriesId).toBe("series-2");
        expect(store.leaderboard(1).map((entry) => entry.id)).toEqual([one, two]);
        expect(store.leaderboard(2)).toEqual([]);
    });

    it("pages leaderboards in the selected metric before limiting results", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const ids = Array.from({ length: 6 }, (_, i) => store.linkAccount(`native-${i}`, `Player ${i}`).id);
        withDatabase(file, db => {
            const update = db.prepare(
                "UPDATE ratings SET elo = ?, wins = ?, played = ? WHERE account_id = ? AND size = 2",
            );
            ids.forEach((id, i) => update.run(1500 - 100 * i, i + 5, i + 5, id));
        });
        expect(store.leaderboard(2, 2, "elo", 2).map(entry => [entry.id, entry.rank])).toEqual([[ids[2], 3], [
            ids[3],
            4,
        ]]);
        expect(store.leaderboard(2, 2, "wins", 2).map(entry => entry.id)).toEqual([ids[3], ids[2]]);
        expect(store.getProfileByName("PLAYER 3")!.id).toBe(ids[3]);
        expect(store.leaderboard(2, 2, "wins", 6)).toEqual([]);
    });

    it("does not expose mutable references to ratings or saved results", () => {
        const store = openStore();
        const one = store.register("Player One", password).profile;
        const two = store.register("Player Two", password).profile;
        one.ratings[1].elo = 99999;
        const result = store.settleSeries("series-1", 1, [[one.id], [two.id]], 0, [5, 2], "completed");
        result.teams[0][0] = "modified";
        result.ratingChanges[0].after = 99999;
        store.history(one.id)[0].score[0] = 99;
        withDatabase(
            store.filePath,
            db => db.exec("UPDATE ratings SET played = 5, wins = 5 WHERE size = 1 AND wins = 1"),
        );
        store.leaderboard(1)[0].rating.elo = 99999;
        expect(store.getSeriesResult("series-1")?.teams[0]).toEqual([one.id]);
        expect(store.history(one.id)[0].score).toEqual([5, 2]);
        expect(store.getProfile(one.id)?.ratings[1].elo).toBe(1032);
    });

    it("rejects invalid teams and rolls back every participant if persistence fails midway", () => {
        const file = temporaryFile();
        const store = openStore(file);
        const one = store.register("Player One", password).profile.id;
        const two = store.register("Player Two", password).profile.id;
        expect(() => store.settleSeries("bad", 1, [[one], [one]], 0, [5, 0], "completed")).toThrow("one team slot");
        expect(() => store.settleSeries("bad", 2, [[one], [two]], 0, [5, 0], "completed")).toThrow();
        expect(() => store.settleSeries("bad", 1, [[one], ["missing"]], 0, [5, 0], "completed")).toThrow("not found");
        expect(() => store.settleSeries("bad", 1, [[one], [two]], 0, [6, 0], "completed")).toThrow();
        withDatabase(
            file,
            (db) =>
                db.exec(
                    "CREATE TRIGGER simulate_failure BEFORE INSERT ON series_players WHEN NEW.team = 1 BEGIN SELECT RAISE(ABORT, 'simulated write failure'); END",
                ),
        );
        expect(() => store.settleSeries("retry", 1, [[one], [two]], 0, [5, 2], "completed")).toThrow(
            "simulated write failure",
        );
        expect(store.getProfile(one)?.ratings[1].elo).toBe(1000);
        expect(store.getProfile(two)?.ratings[1].elo).toBe(1000);
        expect(store.getSeriesResult("retry")).toBeUndefined();
        expect(store.history(one)).toEqual([]);
        withDatabase(file, (db) => db.exec("DROP TRIGGER simulate_failure"));
        expect(store.settleSeries("retry", 1, [[one], [two]], 0, [5, 2], "completed").ratingChanges[0].delta).toBe(32);
        expect(openStore(file).getProfile(one)?.ratings[1].elo).toBe(1032);
    });

    it("fails closed on corrupt or unsupported databases", () => {
        const corrupt = temporaryFile();
        writeFileSync(corrupt, "not a sqlite database");
        expect(() => new RankedStore(corrupt)).toThrow();
        expect(readFileSync(corrupt, "utf8")).toBe("not a sqlite database");
        const unsupported = temporaryFile();
        withDatabase(unsupported, (db) => db.exec("PRAGMA user_version = 99"));
        expect(() => new RankedStore(unsupported)).toThrow("Existing data was left unchanged");
        expect(
            withDatabase(
                unsupported,
                (db) => (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version,
            ),
        ).toBe(99);
    });

    it("uses the documented tier boundaries", () => {
        expect([899, 900, 1099, 1100, 1299, 1300, 1499, 1500, 1699, 1700].map(rankedTier))
            .toEqual([
                "Bronze",
                "Silver",
                "Silver",
                "Gold",
                "Gold",
                "Platinum",
                "Platinum",
                "Diamond",
                "Diamond",
                "Master",
            ]);
    });
});
