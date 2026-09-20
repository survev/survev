import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getRankedTier } from "../../../shared/defs/rankedDefs.ts";
import type {
    DuelSize,
    DuelTeam,
    RankedCooldown,
    RankedHistory,
    RankedLeaderboardEntry,
    RankedProfile,
    RankedRating,
    RankedScoreboardEntry,
} from "../../../shared/types/ranked.ts";
import { RankedPlacementSeries } from "../../../shared/types/ranked.ts";
import type { DuelCombatStats } from "../../../shared/types/rankedCombat.ts";
import type { Loadout } from "../../../shared/utils/loadout.ts";
import { RankedRequestError } from "./errors.ts";

export type { DuelSize, RankedProfile, RankedRating } from "../../../shared/types/ranked.ts";

export interface RankedSeriesResult {
    id: string;
    size: DuelSize;
    teams: [string[], string[]];
    winner: DuelTeam;
    score: [number, number];
    reason: string;
    endedAt: number;
    scoreboard: RankedScoreboardEntry[] | null;
    ratingChanges: {
        profileId: string;
        name: string;
        before: number;
        after: number;
        delta: number;
        forfeited: boolean;
    }[];
}

export interface RankedForfeit {
    seriesId: string;
    profileId: string;
    size: DuelSize;
    team: DuelTeam;
    before: number;
    after: number;
    delta: number;
    at: number;
    reason: string;
}

type DatabaseRow = Record<string, unknown>;
const duelSizes: DuelSize[] = [1, 2, 3, 4];
const sessionLifetime = 30 * 24 * 60 * 60 * 1000;
const invalidCredentials = "Incorrect username or password.";

function defaultFilePath(): string {
    // Source modules live in server/src/ranked; bundled entry points live in server/dist.
    const serverDirectory = basename(import.meta.dirname) === "dist"
        ? resolve(import.meta.dirname, "..")
        : resolve(import.meta.dirname, "../..");
    return resolve(serverDirectory, "data/ranked.sqlite");
}

function tokenHash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

function passwordHash(password: string, salt: string): Buffer {
    return scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
}

export function rankedTier(elo: number): string {
    return getRankedTier(elo).name;
}

function publicRating(row: DatabaseRow): RankedRating {
    const elo = Number(row.elo);
    const played = Number(row.played);
    return {
        elo,
        played,
        wins: Number(row.wins),
        losses: Number(row.losses),
        streak: Number(row.streak),
        tier: rankedTier(elo),
        placementsRemaining: Math.max(0, RankedPlacementSeries - played),
    };
}

function normalizeName(name: string): string {
    if (typeof name !== "string") throw new RankedRequestError("Enter a username.");
    const normalized = name.normalize("NFKC").trim().replace(/\s+/gu, " ");
    const length = Array.from(normalized).length;
    if (length < 2 || length > 16 || !/^[a-zA-Z0-9 _.-]+$/.test(normalized)) {
        throw new RankedRequestError("Use 2–16 English letters, numbers, spaces, dots, underscores or hyphens.");
    }
    return normalized;
}

function validatePassword(password: string): void {
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
        throw new RankedRequestError("Use a password with 8–128 characters.");
    }
}

function isDuelSize(value: unknown): value is DuelSize {
    return typeof value === "number" && duelSizes.includes(value as DuelSize);
}

const schema = `
    CREATE TABLE accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_key TEXT NOT NULL UNIQUE,
        auth_kind TEXT NOT NULL DEFAULT 'local' CHECK (auth_kind IN ('local', 'native')),
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE ratings (
        account_id TEXT NOT NULL REFERENCES accounts(id),
        size INTEGER NOT NULL CHECK (size BETWEEN 1 AND 4),
        elo INTEGER NOT NULL DEFAULT 1000,
        wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
        losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
        played INTEGER NOT NULL DEFAULT 0 CHECK (played = wins + losses),
        streak INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (account_id, size)
    ) STRICT;
    CREATE TABLE sessions (
        token_hash TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id),
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX sessions_account ON sessions(account_id);
    CREATE TABLE series (
        id TEXT PRIMARY KEY,
        size INTEGER NOT NULL CHECK (size BETWEEN 1 AND 4),
        winner INTEGER NOT NULL CHECK (winner IN (0, 1)),
        score0 INTEGER NOT NULL CHECK (score0 BETWEEN 0 AND 5),
        score1 INTEGER NOT NULL CHECK (score1 BETWEEN 0 AND 5),
        reason TEXT NOT NULL,
        ended_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE series_players (
        series_id TEXT NOT NULL REFERENCES series(id),
        account_id TEXT NOT NULL REFERENCES accounts(id),
        team INTEGER NOT NULL CHECK (team IN (0, 1)),
        position INTEGER NOT NULL,
        name TEXT NOT NULL,
        before_elo INTEGER NOT NULL,
        after_elo INTEGER NOT NULL,
        delta INTEGER NOT NULL CHECK (after_elo - before_elo = delta AND ABS(delta) <= 32),
        PRIMARY KEY (series_id, account_id)
    ) STRICT;
    CREATE INDEX series_players_account ON series_players(account_id, series_id);
    CREATE TABLE account_settings (
        account_id TEXT PRIMARY KEY REFERENCES accounts(id),
        loadout_json TEXT NOT NULL
    ) STRICT;
    PRAGMA user_version = 3;
`;

const forfeitMigration = `
    ALTER TABLE series_players RENAME TO old_series_players;
    CREATE TABLE series_players (
        series_id TEXT NOT NULL REFERENCES series(id),
        account_id TEXT NOT NULL REFERENCES accounts(id),
        team INTEGER NOT NULL CHECK (team IN (0, 1)),
        position INTEGER NOT NULL,
        name TEXT NOT NULL,
        before_elo INTEGER NOT NULL,
        after_elo INTEGER NOT NULL,
        delta INTEGER NOT NULL CHECK (after_elo - before_elo = delta AND ABS(delta) <= 64),
        forfeited INTEGER NOT NULL DEFAULT 0 CHECK (forfeited IN (0, 1)),
        PRIMARY KEY (series_id, account_id)
    ) STRICT;
    INSERT INTO series_players (series_id, account_id, team, position, name, before_elo, after_elo, delta)
        SELECT series_id, account_id, team, position, name, before_elo, after_elo, delta FROM old_series_players;
    DROP TABLE old_series_players;
    CREATE INDEX series_players_account ON series_players(account_id, series_id);
    CREATE TABLE series_context (
        series_id TEXT PRIMARY KEY,
        size INTEGER NOT NULL CHECK (size BETWEEN 1 AND 4),
        teams_json TEXT NOT NULL,
        before_json TEXT NOT NULL
    ) STRICT;
    CREATE TABLE series_forfeits (
        series_id TEXT NOT NULL REFERENCES series_context(series_id),
        account_id TEXT NOT NULL REFERENCES accounts(id),
        team INTEGER NOT NULL CHECK (team IN (0, 1)),
        before_elo INTEGER NOT NULL,
        after_elo INTEGER NOT NULL,
        delta INTEGER NOT NULL CHECK (after_elo - before_elo = delta AND delta BETWEEN -64 AND -1),
        at INTEGER NOT NULL,
        reason TEXT NOT NULL,
        PRIMARY KEY (series_id, account_id)
    ) STRICT;
    CREATE INDEX series_forfeits_account ON series_forfeits(account_id, at);
    PRAGMA user_version = 4;
`;

const fairPlayMigration = `
    ALTER TABLE series_context ADD COLUMN parties_json TEXT NOT NULL DEFAULT '{}';
    ALTER TABLE series_context ADD COLUMN factors_json TEXT NOT NULL DEFAULT '{}';
    ALTER TABLE series_players RENAME TO old_series_players;
    CREATE TABLE series_players (
        series_id TEXT NOT NULL REFERENCES series(id), account_id TEXT NOT NULL REFERENCES accounts(id),
        team INTEGER NOT NULL CHECK (team IN (0, 1)), position INTEGER NOT NULL, name TEXT NOT NULL,
        before_elo INTEGER NOT NULL, after_elo INTEGER NOT NULL,
        delta INTEGER NOT NULL CHECK (after_elo - before_elo = delta AND ABS(delta) <= 128),
        forfeited INTEGER NOT NULL DEFAULT 0 CHECK (forfeited IN (0, 1)), PRIMARY KEY (series_id, account_id)
    ) STRICT;
    INSERT INTO series_players SELECT * FROM old_series_players;
    DROP TABLE old_series_players;
    CREATE INDEX series_players_account ON series_players(account_id, series_id);
    ALTER TABLE series_forfeits RENAME TO old_series_forfeits;
    CREATE TABLE series_forfeits (
        series_id TEXT NOT NULL REFERENCES series_context(series_id), account_id TEXT NOT NULL REFERENCES accounts(id),
        team INTEGER NOT NULL CHECK (team IN (0, 1)), before_elo INTEGER NOT NULL, after_elo INTEGER NOT NULL,
        delta INTEGER NOT NULL CHECK (after_elo - before_elo = delta AND delta BETWEEN -128 AND -1),
        at INTEGER NOT NULL, reason TEXT NOT NULL, PRIMARY KEY (series_id, account_id)
    ) STRICT;
    INSERT INTO series_forfeits SELECT * FROM old_series_forfeits;
    DROP TABLE old_series_forfeits;
    CREATE INDEX series_forfeits_account ON series_forfeits(account_id, at);
    CREATE TABLE queue_events (
        id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
        kind TEXT NOT NULL CHECK (kind IN ('no-show', 'forfeit')), at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL, reason TEXT NOT NULL
    ) STRICT;
    CREATE INDEX queue_events_account ON queue_events(account_id, at);
    PRAGMA user_version = 5;
`;

const nativeDeletionMigration = `
    CREATE TABLE pending_native_deletions (
        account_id TEXT PRIMARY KEY, created_at INTEGER NOT NULL
    ) STRICT;
    PRAGMA user_version = 6;
`;

const combatMigration = `
    CREATE TABLE series_combat (
        series_id TEXT NOT NULL, account_id TEXT NOT NULL,
        kills INTEGER NOT NULL CHECK (kills >= 0),
        damage REAL NOT NULL CHECK (damage >= 0),
        round_wins INTEGER NOT NULL CHECK (round_wins >= 0),
        PRIMARY KEY (series_id, account_id),
        FOREIGN KEY (series_id, account_id) REFERENCES series_players(series_id, account_id)
    ) STRICT;
    PRAGMA user_version = 7;
`;

/** Local accounts, revocable sessions and all-or-nothing Elo updates in SQLite. */
export class RankedStore {
    readonly filePath: string;
    private readonly db: DatabaseSync;

    constructor(filePath = defaultFilePath()) {
        this.filePath = filePath === ":memory:" ? filePath : resolve(filePath);
        if (this.filePath !== ":memory:") mkdirSync(dirname(this.filePath), { recursive: true });
        const db = new DatabaseSync(this.filePath);
        this.db = db;
        try {
            const integrity = db.prepare("PRAGMA quick_check").get();
            if (!integrity || Object.values(integrity)[0] !== "ok") {
                throw new Error("Ranked database integrity check failed.");
            }
            const version = Number(this.row("PRAGMA user_version")!.user_version);
            db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
            if (version === 0) {
                const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
                if (tables.length !== 0) throw new Error("Unrecognized ranked database schema.");
                this.transaction(() => db.exec(schema));
            } else if (version === 1) {
                this.transaction(() =>
                    db.exec(
                        "ALTER TABLE accounts ADD COLUMN auth_kind TEXT NOT NULL DEFAULT 'local' CHECK (auth_kind IN ('local', 'native')); PRAGMA user_version = 2;",
                    )
                );
            } else if (
                version !== 2 && version !== 3 && version !== 4 && version !== 5 && version !== 6 && version !== 7
            ) {
                throw new Error("Unsupported ranked database version.");
            }
            if (version === 1 || version === 2) {
                this.transaction(() =>
                    db.exec(
                        "CREATE TABLE account_settings (account_id TEXT PRIMARY KEY REFERENCES accounts(id), loadout_json TEXT NOT NULL) STRICT; PRAGMA user_version = 3;",
                    )
                );
            }
            if (version < 4) this.transaction(() => db.exec(forfeitMigration));
            if (version < 5) this.transaction(() => db.exec(fairPlayMigration));
            if (version < 6) this.transaction(() => db.exec(nativeDeletionMigration));
            if (version < 7) this.transaction(() => db.exec(combatMigration));
            // Check the schema before accepting requests; never replace an invalid existing database.
            db.prepare(
                "SELECT a.id, a.name, a.name_key, a.auth_kind, a.password_salt, a.password_hash, a.created_at, r.size, r.elo, r.wins, r.losses, r.played, r.streak FROM accounts a JOIN ratings r ON r.account_id = a.id LIMIT 1",
            ).all();
            db.prepare("SELECT token_hash, account_id, created_at, expires_at FROM sessions LIMIT 1").all();
            db.prepare("SELECT account_id, loadout_json FROM account_settings LIMIT 1").all();
            db.prepare(
                "SELECT series_id, size, teams_json, before_json, parties_json, factors_json FROM series_context LIMIT 1",
            ).all();
            db.prepare("SELECT id, account_id, kind, at, expires_at, reason FROM queue_events LIMIT 1").all();
            db.prepare("SELECT account_id, created_at FROM pending_native_deletions LIMIT 1").all();
            db.prepare("SELECT series_id, account_id, kills, damage, round_wins FROM series_combat LIMIT 1").all();
            db.prepare(
                "SELECT series_id, account_id, team, before_elo, after_elo, delta, at, reason FROM series_forfeits LIMIT 1",
            ).all();
            db.prepare("SELECT forfeited FROM series_players LIMIT 1").all();
            db.prepare(
                "SELECT s.id, s.size, s.winner, s.score0, s.score1, s.reason, s.ended_at, p.account_id, p.team, p.position, p.name, p.before_elo, p.after_elo, p.delta FROM series s JOIN series_players p ON p.series_id = s.id LIMIT 1",
            ).all();
            if (db.prepare("PRAGMA foreign_key_check").all().length) {
                throw new Error("Ranked database has broken references.");
            }
            db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;");
        } catch (error) {
            db.close();
            throw new Error(`Cannot load ranked database at ${this.filePath}. Existing data was left unchanged.`, {
                cause: error,
            });
        }
    }

    close(): void {
        this.db.close();
    }

    private row(sql: string, ...values: (string | number)[]): DatabaseRow | undefined {
        return this.db.prepare(sql).get(...values) as DatabaseRow | undefined;
    }

    private rows(sql: string, ...values: (string | number)[]): DatabaseRow[] {
        return this.db.prepare(sql).all(...values) as DatabaseRow[];
    }

    private transaction<T>(operation: () => T): T {
        this.db.exec("BEGIN IMMEDIATE");
        try {
            const result = operation();
            this.db.exec("COMMIT");
            return result;
        } catch (error) {
            this.db.exec("ROLLBACK");
            throw error;
        }
    }

    queueCooldown(id: string, now = Date.now()): RankedCooldown | null {
        const event = this.row(
            "SELECT expires_at, reason FROM queue_events WHERE account_id = ? AND expires_at > ? ORDER BY expires_at DESC LIMIT 1",
            id,
            now,
        );
        return event
            ? {
                until: Number(event.expires_at),
                seconds: Math.ceil((Number(event.expires_at) - now) / 1000),
                reason: String(event.reason),
            }
            : null;
    }

    private queueEvent(eventId: string, id: string, kind: "no-show" | "forfeit", now: number): string {
        const existing = this.row("SELECT reason FROM queue_events WHERE id = ?", eventId);
        if (existing) return String(existing.reason);
        const recent = Number(
            this.row(
                "SELECT COUNT(*) AS count FROM queue_events WHERE account_id = ? AND kind = ? AND at > ?",
                id,
                kind,
                now - 24 * 60 * 60 * 1000,
            )!.count,
        );
        const minutes = kind === "no-show" ? [0, 1, 5, 15][Math.min(3, recent)] : [5, 15, 60][Math.min(2, recent)];
        const reason = minutes === 0
            ? "Missed match. Warning: repeated missed matches cause a queue cooldown."
            : `${kind === "no-show" ? "Missed match" : "Series forfeit"}: ${minutes}-minute ranked queue cooldown.`;
        this.db.prepare(
            "INSERT INTO queue_events (id, account_id, kind, at, expires_at, reason) VALUES (?, ?, ?, ?, ?, ?)",
        )
            .run(eventId, id, kind, now, now + minutes * 60 * 1000, reason);
        return reason;
    }

    recordNoShow(matchId: string, id: string, now = Date.now()): string {
        return this.transaction(() => this.queueEvent(`no-show:${matchId}:${id}`, id, "no-show", now));
    }

    beginSeries(
        seriesId: string,
        size: DuelSize,
        teams: [string[], string[]],
        parties: Record<string, string> = {},
        before?: Record<string, number>,
    ): void {
        this.transaction(() => {
            this.seriesContext(seriesId, size, teams, before, parties);
        });
    }

    private createSession(accountId: string): string {
        const now = Date.now();
        const token = randomBytes(32).toString("base64url");
        this.db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
        this.db.prepare("INSERT INTO sessions (token_hash, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
            .run(tokenHash(token), accountId, now, now + sessionLifetime);
        return token;
    }

    private availableName(name: string, excludingId?: string): string {
        const normalized = normalizeName(name);
        const existing = this.row("SELECT id FROM accounts WHERE name_key = ?", normalized.toLowerCase());
        if (existing && existing.id !== excludingId) throw new RankedRequestError("That username is already taken.");
        return normalized;
    }

    register(name: string, password: string): { token: string; profile: RankedProfile } {
        const normalized = this.availableName(name);
        validatePassword(password);
        const id = randomUUID();
        const salt = randomBytes(32).toString("hex");
        const hash = passwordHash(password, salt).toString("hex");
        return this.transaction(() => {
            this.availableName(normalized);
            this.db.prepare(
                "INSERT INTO accounts (id, name, name_key, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            )
                .run(id, normalized, normalized.toLowerCase(), salt, hash, Date.now());
            const addRating = this.db.prepare("INSERT INTO ratings (account_id, size) VALUES (?, ?)");
            for (const size of duelSizes) addRating.run(id, size);
            const token = this.createSession(id);
            return { token, profile: this.getProfile(id)! };
        });
    }

    login(name: string, password: string): { token: string; profile: RankedProfile } {
        let normalized: string;
        try {
            normalized = normalizeName(name);
            validatePassword(password);
        } catch {
            throw new RankedRequestError(invalidCredentials);
        }
        const account = this.row(
            "SELECT id, password_salt, password_hash FROM accounts WHERE name_key = ? AND auth_kind = 'local'",
            normalized.toLowerCase(),
        );
        // Missing users still do the expensive hash so username existence is not revealed by hash timing.
        const salt = account ? String(account.password_salt) : "0".repeat(64);
        const actual = passwordHash(password, salt);
        const expected = account ? Buffer.from(String(account.password_hash), "hex") : Buffer.alloc(64);
        if (expected.length !== actual.length || !timingSafeEqual(actual, expected) || !account) {
            throw new RankedRequestError(invalidCredentials);
        }
        return this.transaction(() => ({
            token: this.createSession(String(account.id)),
            profile: this.getProfile(String(account.id))!,
        }));
    }

    authenticate(token: string): RankedProfile | undefined {
        if (typeof token !== "string" || !/^[a-zA-Z0-9_-]{43}$/.test(token)) return undefined;
        const session = this.row(
            "SELECT account_id FROM sessions WHERE token_hash = ? AND expires_at > ?",
            tokenHash(token),
            Date.now(),
        );
        return session ? this.getProfile(String(session.account_id)) : undefined;
    }

    logout(token: string): void {
        if (typeof token !== "string" || !/^[a-zA-Z0-9_-]{43}$/.test(token)) return;
        this.db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
    }

    getSavedLoadout(id: string): Loadout | undefined {
        const settings = this.row("SELECT loadout_json FROM account_settings WHERE account_id = ?", id);
        return settings ? JSON.parse(String(settings.loadout_json)) as Loadout : undefined;
    }

    saveLoadout(id: string, loadout: Loadout): void {
        if (!this.getProfile(id)) throw new RankedRequestError("Account not found.");
        this.db.prepare(
            "INSERT INTO account_settings (account_id, loadout_json) VALUES (?, ?) ON CONFLICT(account_id) DO UPDATE SET loadout_json = excluded.loadout_json",
        )
            .run(id, JSON.stringify(loadout));
    }

    deleteLocalAccount(id: string): void {
        const account = this.row("SELECT auth_kind FROM accounts WHERE id = ?", id);
        if (!account || account.auth_kind !== "local") throw new RankedRequestError("Local account not found.");
        this.anonymizeAccount(id);
    }

    /** Remove either account provider's personal data while retaining anonymous Elo result references. */
    anonymizeAccount(id: string): void {
        this.transaction(() => this.anonymizeAccountData(id));
    }

    private anonymizeAccountData(id: string): void {
        if (!this.row("SELECT id FROM accounts WHERE id = ?", id)) return;
        this.db.prepare("DELETE FROM sessions WHERE account_id = ?").run(id);
        this.db.prepare("DELETE FROM account_settings WHERE account_id = ?").run(id);
        // Keep an anonymous match reference so deleting one account cannot alter opponents' Elo history.
        this.db.prepare(
            "UPDATE accounts SET name = 'Deleted Player', name_key = ?, password_salt = '', password_hash = '' WHERE id = ?",
        )
            .run(`deleted:${id}`, id);
        this.db.prepare("UPDATE series_players SET name = 'Deleted Player' WHERE account_id = ?").run(id);
    }

    markNativeDeletion(id: string): void {
        if (!/^[a-zA-Z0-9_.:-]{1,120}$/.test(id)) throw new RankedRequestError("Invalid native account ID.");
        this.db.prepare(
            "INSERT INTO pending_native_deletions (account_id, created_at) VALUES (?, ?) ON CONFLICT(account_id) DO NOTHING",
        )
            .run(id, Date.now());
    }

    pendingNativeDeletions(): string[] {
        return this.rows("SELECT account_id FROM pending_native_deletions ORDER BY created_at, account_id")
            .map(row => String(row.account_id));
    }

    /** Call only after PostgreSQL confirms the native account no longer exists. */
    completeNativeDeletion(id: string): void {
        this.transaction(() => {
            if (!this.row("SELECT account_id FROM pending_native_deletions WHERE account_id = ?", id)) return;
            const account = this.row("SELECT auth_kind FROM accounts WHERE id = ?", id);
            if (!account) {
                // Block a request whose native session was validated just before PostgreSQL committed deletion.
                this.db.prepare(
                    "INSERT INTO accounts (id, name, name_key, auth_kind, password_salt, password_hash, created_at) VALUES (?, 'Deleted Player', ?, 'native', '', '', ?)",
                )
                    .run(id, `deleted:${id}`, Date.now());
                const addRating = this.db.prepare("INSERT INTO ratings (account_id, size) VALUES (?, ?)");
                for (const size of duelSizes) addRating.run(id, size);
            } else if (account.auth_kind === "native") this.anonymizeAccountData(id);
            this.db.prepare("DELETE FROM pending_native_deletions WHERE account_id = ?").run(id);
        });
    }

    /** Called only after the API has verified the original Survev account session. */
    linkAccount(nativeId: string, name: string): RankedProfile {
        if (typeof nativeId !== "string" || !/^[a-zA-Z0-9_.:-]{1,120}$/.test(nativeId)) {
            throw new RankedRequestError("Invalid linked account ID.");
        }
        const cleaned = typeof name === "string"
            ? name.normalize("NFKC").replace(/[^a-zA-Z0-9 _.-]/g, "").trim().replace(/\s+/g, " ").slice(0, 16)
            : "";
        const baseName = cleaned.length >= 2 ? cleaned : "Player";
        const mappedName = (): string => {
            let candidate = baseName;
            let attempt = 0;
            while (
                this.row("SELECT id FROM accounts WHERE name_key = ? AND id <> ?", candidate.toLowerCase(), nativeId)
            ) {
                const suffix = createHash("sha256").update(attempt === 0 ? nativeId : `${nativeId}:${attempt}`).digest(
                    "hex",
                ).slice(0, 5);
                candidate = `${baseName.slice(0, 10)}_${suffix}`;
                attempt++;
            }
            return candidate;
        };
        const current = this.row("SELECT name, name_key, auth_kind FROM accounts WHERE id = ?", nativeId);
        if (current && current.auth_kind !== "native") throw new RankedRequestError("Account ID is already in use.");
        if (current && String(current.name_key).startsWith("deleted:")) {
            throw new RankedRequestError("Account has been deleted.");
        }
        if (current && current.name === mappedName()) return this.getProfile(nativeId)!;
        return this.transaction(() => {
            const existing = this.row("SELECT id, name_key, auth_kind FROM accounts WHERE id = ?", nativeId);
            if (existing && existing.auth_kind !== "native") {
                throw new RankedRequestError("Account ID is already in use.");
            }
            if (existing && String(existing.name_key).startsWith("deleted:")) {
                throw new RankedRequestError("Account has been deleted.");
            }
            const linkedName = mappedName();
            if (existing) {
                this.db.prepare("UPDATE accounts SET name = ?, name_key = ? WHERE id = ?")
                    .run(linkedName, linkedName.toLowerCase(), nativeId);
            } else {
                this.db.prepare(
                    "INSERT INTO accounts (id, name, name_key, auth_kind, password_salt, password_hash, created_at) VALUES (?, ?, ?, 'native', '', '', ?)",
                )
                    .run(nativeId, linkedName, linkedName.toLowerCase(), Date.now());
                const addRating = this.db.prepare("INSERT INTO ratings (account_id, size) VALUES (?, ?)");
                for (const size of duelSizes) addRating.run(nativeId, size);
            }
            return this.getProfile(nativeId)!;
        });
    }

    rename(id: string, name: string): RankedProfile {
        return this.transaction(() => {
            if (!this.getProfile(id)) throw new RankedRequestError("Ranked account not found.");
            const normalized = this.availableName(name, id);
            this.db.prepare("UPDATE accounts SET name = ?, name_key = ? WHERE id = ?")
                .run(normalized, normalized.toLowerCase(), id);
            return this.getProfile(id)!;
        });
    }

    getProfile(id: string): RankedProfile | undefined {
        const account = this.row("SELECT id, name FROM accounts WHERE id = ? AND name_key NOT LIKE 'deleted:%'", id);
        if (!account) return undefined;
        const rows = this.rows("SELECT size, elo, wins, losses, played, streak FROM ratings WHERE account_id = ?", id);
        if (rows.length !== 4) throw new Error("Ranked account ratings are incomplete.");
        const ratings = {} as Record<DuelSize, RankedRating>;
        for (const row of rows) ratings[Number(row.size) as DuelSize] = publicRating(row);
        return { id: String(account.id), name: String(account.name), ratings };
    }

    getProfileByName(name: string): RankedProfile | undefined {
        const account = this.row(
            "SELECT id FROM accounts WHERE name_key = ? AND name_key NOT LIKE 'deleted:%'",
            name.trim().toLowerCase(),
        );
        return account ? this.getProfile(String(account.id)) : undefined;
    }

    leaderboard(size: DuelSize, limit = 50, metric: "elo" | "wins" = "elo", offset = 0): RankedLeaderboardEntry[] {
        if (!isDuelSize(size)) throw new RankedRequestError("Choose a duel size from 1v1 to 4v4.");
        const pageOffset = Math.max(0, Number.isSafeInteger(offset) ? offset : 0);
        return this.rows(
            `SELECT a.id, a.name, r.elo, r.wins, r.losses, r.played, r.streak FROM ratings r JOIN accounts a ON a.id = r.account_id WHERE r.size = ? AND r.played >= ${RankedPlacementSeries} AND a.name_key NOT LIKE 'deleted:%' ORDER BY ${
                metric === "wins" ? "r.wins DESC, r.elo DESC" : "r.elo DESC, r.wins DESC"
            }, a.created_at ASC, a.id ASC LIMIT ? OFFSET ?`,
            size,
            Math.max(1, Math.min(1000, Math.trunc(limit) || 50)),
            pageOffset,
        )
            .map((row, index) => ({
                id: String(row.id),
                name: String(row.name),
                rank: pageOffset + index + 1,
                rating: publicRating(row),
            }));
    }

    history(profileId: string, size?: DuelSize): RankedHistory[] {
        const completed: RankedHistory[] = this.rows(
            "SELECT s.id FROM series s JOIN series_players p ON p.series_id = s.id WHERE p.account_id = ? AND (? = 0 OR s.size = ?) ORDER BY s.ended_at DESC, s.rowid DESC LIMIT 20",
            profileId,
            size ?? 0,
            size ?? 0,
        )
            .map((row) => {
                const result = this.getSeriesResult(String(row.id))!;
                const team = result.teams[0].includes(profileId) ? 0 : 1;
                const change = result.ratingChanges.find((entry) => entry.profileId === profileId)!;
                return {
                    seriesId: result.id,
                    size: result.size,
                    at: result.endedAt,
                    score: [result.score[team], result.score[1 - team]],
                    won: !change.forfeited && result.winner === team,
                    before: change.before,
                    after: change.after,
                    delta: change.delta,
                    opponents: result.teams[1 - team].map((id) =>
                        result.ratingChanges.find((entry) => entry.profileId === id)!.name
                    ),
                    reason: change.forfeited ? this.getForfeit(result.id, profileId)!.reason : result.reason,
                    forfeited: change.forfeited,
                };
            });
        const pending: RankedHistory[] = this.rows(
            "SELECT f.series_id, c.teams_json FROM series_forfeits f JOIN series_context c ON c.series_id = f.series_id WHERE f.account_id = ? AND (? = 0 OR c.size = ?) AND NOT EXISTS (SELECT 1 FROM series s WHERE s.id = f.series_id) ORDER BY f.at DESC LIMIT 20",
            profileId,
            size ?? 0,
            size ?? 0,
        ).map(row => {
            const forfeit = this.getForfeit(String(row.series_id), profileId)!;
            const teams = JSON.parse(String(row.teams_json)) as [string[], string[]];
            return {
                seriesId: forfeit.seriesId,
                size: forfeit.size,
                at: forfeit.at,
                score: [0, 0],
                won: false,
                before: forfeit.before,
                after: forfeit.after,
                delta: forfeit.delta,
                opponents: teams[1 - forfeit.team].map(id => this.getProfile(id)?.name ?? "Deleted Player"),
                reason: forfeit.reason,
                forfeited: true,
            };
        });
        return [...pending, ...completed].sort((a, b) => b.at - a.at).slice(0, 20);
    }

    getSeriesResult(id: string): RankedSeriesResult | undefined {
        const row = this.row("SELECT id, size, winner, score0, score1, reason, ended_at FROM series WHERE id = ?", id);
        if (!row) return undefined;
        const players = this.rows(
            "SELECT account_id, team, name, before_elo, after_elo, delta, forfeited FROM series_players WHERE series_id = ? ORDER BY team ASC, position ASC",
            id,
        );
        const teams: [string[], string[]] = [[], []];
        for (const player of players) teams[Number(player.team) as DuelTeam].push(String(player.account_id));
        const combat = new Map(
            this.rows("SELECT account_id, kills, damage, round_wins FROM series_combat WHERE series_id = ?", id)
                .map(stats => [String(stats.account_id), stats]),
        );
        if (combat.size && combat.size !== players.length) throw new Error("Ranked series combat data is incomplete.");
        return {
            id: String(row.id),
            size: Number(row.size) as DuelSize,
            teams,
            winner: Number(row.winner) as DuelTeam,
            score: [Number(row.score0), Number(row.score1)],
            reason: String(row.reason),
            endedAt: Number(row.ended_at),
            scoreboard: combat.size
                ? players.map(player => {
                    const stats = combat.get(String(player.account_id))!;
                    return {
                        id: String(player.account_id),
                        name: String(player.name),
                        team: Number(player.team) as DuelTeam,
                        kills: Number(stats.kills),
                        damage: Number(stats.damage),
                        roundsWon: Number(stats.round_wins),
                        before: Number(player.before_elo),
                        after: Number(player.after_elo),
                        delta: Number(player.delta),
                        forfeited: Boolean(player.forfeited),
                    };
                })
                : null,
            ratingChanges: players.map((player) => ({
                profileId: String(player.account_id),
                name: String(player.name),
                before: Number(player.before_elo),
                after: Number(player.after_elo),
                delta: Number(player.delta),
                forfeited: Boolean(player.forfeited),
            })),
        };
    }

    private seriesContext(
        seriesId: string,
        size: DuelSize,
        teams: [string[], string[]],
        before?: Record<string, number>,
        parties: Record<string, string> = {},
    ) {
        if (
            !/^[a-zA-Z0-9_.:-]{1,120}$/.test(seriesId) || !isDuelSize(size)
            || !Array.isArray(teams) || teams.length !== 2
            || !teams.every(team => Array.isArray(team) && team.length === size)
        ) {
            throw new RankedRequestError("Invalid ranked series result.");
        }
        if (new Set(teams.flat()).size !== size * 2) {
            throw new RankedRequestError("Every ranked player must occupy one team slot.");
        }
        const saved = this.row(
            "SELECT size, teams_json, before_json, parties_json, factors_json FROM series_context WHERE series_id = ?",
            seriesId,
        );
        if (saved) {
            if (Number(saved.size) !== size || String(saved.teams_json) !== JSON.stringify(teams)) {
                throw new RankedRequestError("Ranked series participants cannot change.");
            }
            return {
                ratings: JSON.parse(String(saved.before_json)) as Record<string, number>,
                parties: JSON.parse(String(saved.parties_json)) as Record<string, string>,
                factors: JSON.parse(String(saved.factors_json)) as Record<string, number>,
            };
        }
        const ratings = Object.fromEntries(
            teams.flat().map(id => {
                const profile = this.getProfile(id);
                if (!profile) throw new RankedRequestError("Ranked account not found.");
                const elo = before?.[id] ?? profile.ratings[size].elo;
                if (!Number.isSafeInteger(elo)) throw new RankedRequestError("Invalid initial rating.");
                return [id, elo];
            }),
        );
        const factors = Object.fromEntries(
            teams.flat().map(id => [id, this.getProfile(id)!.ratings[size].played < RankedPlacementSeries ? 64 : 32]),
        );
        const initialParties = Object.fromEntries(teams.flat().filter(id => parties[id]).map(id => [id, parties[id]]));
        this.db.prepare(
            "INSERT INTO series_context (series_id, size, teams_json, before_json, parties_json, factors_json) VALUES (?, ?, ?, ?, ?, ?)",
        )
            .run(
                seriesId,
                size,
                JSON.stringify(teams),
                JSON.stringify(ratings),
                JSON.stringify(initialParties),
                JSON.stringify(factors),
            );
        return { ratings, parties: initialParties, factors };
    }

    private expectedLoss(teams: [string[], string[]], team: DuelTeam, ratings: Record<string, number>, factor = 32) {
        const averages = teams.map(members => members.reduce((sum, id) => sum + ratings[id], 0) / members.length);
        return Math.round(factor / (1 + 10 ** ((averages[1 - team] - averages[team]) / 400)));
    }

    private applyRating(id: string, size: DuelSize, delta: number, won: boolean) {
        const rating = this.row(
            "SELECT elo, wins, losses, played, streak FROM ratings WHERE account_id = ? AND size = ?",
            id,
            size,
        );
        if (!rating) throw new RankedRequestError("Ranked account not found.");
        const before = Number(rating.elo);
        this.db.prepare(
            "UPDATE ratings SET elo = ?, wins = ?, losses = ?, played = ?, streak = ? WHERE account_id = ? AND size = ?",
        )
            .run(
                before + delta,
                Number(rating.wins) + Number(won),
                Number(rating.losses) + Number(!won),
                Number(rating.played) + 1,
                won ? Math.max(0, Number(rating.streak)) + 1 : Math.min(0, Number(rating.streak)) - 1,
                id,
                size,
            );
        return { before, after: before + delta };
    }

    getForfeit(seriesId: string, profileId: string): RankedForfeit | undefined {
        const row = this.row(
            "SELECT f.*, c.size FROM series_forfeits f JOIN series_context c ON c.series_id = f.series_id WHERE f.series_id = ? AND f.account_id = ?",
            seriesId,
            profileId,
        );
        return row
            ? {
                seriesId,
                profileId,
                size: Number(row.size) as DuelSize,
                team: Number(row.team) as DuelTeam,
                before: Number(row.before_elo),
                after: Number(row.after_elo),
                delta: Number(row.delta),
                at: Number(row.at),
                reason: String(row.reason),
            }
            : undefined;
    }

    /** Commit a personal loss now, independently of teammates finishing their series later. */
    recordForfeit(
        seriesId: string,
        size: DuelSize,
        teams: [string[], string[]],
        profileId: string,
        reason: string,
        before?: Record<string, number>,
        at = Date.now(),
    ): RankedForfeit {
        return this.transaction(() => {
            const existing = this.getForfeit(seriesId, profileId);
            if (existing) return existing;
            if (this.getSeriesResult(seriesId)) throw new RankedRequestError("The series has already finished.");
            if (!teams.flat().includes(profileId) || !this.getProfile(profileId)) {
                throw new RankedRequestError("Ranked account not found.");
            }
            if (!reason || reason.length > 200 || /[<>\p{Cc}\p{Cf}]/u.test(reason)) {
                throw new RankedRequestError("Invalid forfeit reason.");
            }
            const context = this.seriesContext(seriesId, size, teams, before);
            const team: DuelTeam = teams[0].includes(profileId) ? 0 : 1;
            const normalLoss = Math.max(
                1,
                this.expectedLoss(teams, team, context.ratings, context.factors[profileId] ?? 32),
            );
            const delta = -Math.max(2 * normalLoss, normalLoss + 1);
            const change = this.applyRating(profileId, size, delta, false);
            this.db.prepare(
                "INSERT INTO series_forfeits (series_id, account_id, team, before_elo, after_elo, delta, at, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            )
                .run(seriesId, profileId, team, change.before, change.after, delta, at, reason);
            this.queueEvent(`forfeit:${seriesId}:${profileId}`, profileId, "forfeit", at);
            return this.getForfeit(seriesId, profileId)!;
        });
    }

    settleSeries(
        seriesId: string,
        size: DuelSize,
        teams: [string[], string[]],
        winner: DuelTeam,
        score: [number, number],
        reason: string,
        before?: Record<string, number>,
        combat?: DuelCombatStats[],
    ): RankedSeriesResult {
        return this.transaction(() => {
            const existing = this.getSeriesResult(seriesId);
            if (existing) return existing;
            if (
                typeof seriesId !== "string" || !/^[a-zA-Z0-9_.:-]{1,120}$/.test(seriesId)
                || !isDuelSize(size) || (winner !== 0 && winner !== 1)
                || !Array.isArray(teams) || teams.length !== 2
                || !teams.every((team) => Array.isArray(team) && team.length === size)
                || !Array.isArray(score) || score.length !== 2
                || !score.every((points) => Number.isSafeInteger(points) && points >= 0 && points <= 5)
                || typeof reason !== "string" || reason.length < 1 || reason.length > 200
                || /[<>\p{Cc}\p{Cf}]/u.test(reason)
            ) throw new RankedRequestError("Invalid ranked series result.");
            if (
                combat
                && (combat.length !== size * 2 || new Set(combat.map(player => player.profileId)).size !== combat.length
                    || combat.some(player =>
                        !teams.flat().includes(player.profileId)
                        || !Number.isSafeInteger(player.kills) || player.kills < 0
                        || !Number.isFinite(player.damageDealt) || player.damageDealt < 0
                        || !Number.isSafeInteger(player.roundWins) || player.roundWins < 0
                    ))
            ) {
                throw new RankedRequestError("Invalid ranked series combat data.");
            }
            const initial = this.seriesContext(seriesId, size, teams, before);
            const forfeits = new Map(teams.flat().map(id => [id, this.getForfeit(seriesId, id)]));
            this.db.prepare(
                "INSERT INTO series (id, size, winner, score0, score1, reason, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
                .run(seriesId, size, winner, score[0], score[1], reason, Date.now());
            const addPlayer = this.db.prepare(
                "INSERT INTO series_players (series_id, account_id, team, position, name, before_elo, after_elo, delta, forfeited) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            );
            for (const [team, members] of teams.entries()) {
                for (const [position, id] of members.entries()) {
                    const forfeit = forfeits.get(id);
                    const profile = this.getProfile(id);
                    if (!profile && !forfeit) throw new RankedRequestError("Ranked account not found.");
                    const won = team === winner;
                    const delta = this.expectedLoss(
                        teams,
                        (1 - winner) as DuelTeam,
                        initial.ratings,
                        initial.factors[id] ?? 32,
                    );
                    // Protection applies only to departures outside this player's original premade party.
                    const protectedDepartures = members.filter(member =>
                        forfeits.get(member)
                        && (!initial.parties[id] || initial.parties[member] !== initial.parties[id])
                    ).length;
                    const remaining = size - protectedDepartures;
                    const change = forfeit?.delta ?? (won ? delta : -Math.max(1, Math.round(delta * remaining / size)));
                    const applied = forfeit ?? this.applyRating(id, size, change, won);
                    addPlayer.run(
                        seriesId,
                        id,
                        team,
                        position,
                        profile?.name ?? "Deleted Player",
                        applied.before,
                        applied.after,
                        change,
                        Number(!!forfeit),
                    );
                }
            }
            if (combat) {
                const addCombat = this.db.prepare(
                    "INSERT INTO series_combat (series_id, account_id, kills, damage, round_wins) VALUES (?, ?, ?, ?, ?)",
                );
                for (const player of combat) {
                    addCombat.run(seriesId, player.profileId, player.kills, player.damageDealt, player.roundWins);
                }
            }
            return this.getSeriesResult(seriesId)!;
        });
    }
}
