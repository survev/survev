import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { Config } from "../src/config.ts";
import { RankedCoordinator } from "../src/ranked/coordinator.ts";
import { RankedStore } from "../src/ranked/store.ts";

// Opt-in integration check. Only the uniquely named database created here is migrated/deleted.
const connectionString = process.env.SURVEV_TEST_POSTGRES_URL;
assert(connectionString, "Set SURVEV_TEST_POSTGRES_URL to a local PostgreSQL role allowed to create test databases.");
const connection = new URL(connectionString);
assert(["127.0.0.1", "localhost", "[::1]"].includes(connection.hostname), "Use a local test PostgreSQL instance.");
const verifyProcess = process.env.SURVEV_RANKED_TEST_VERIFY === "1";
const database = verifyProcess
    ? connection.pathname.slice(1)
    : `survev_ranked_test_${randomUUID().replaceAll("-", "")}`;
assert(/^survev_ranked_test_[a-f0-9]{32}$/.test(database));
const directory = verifyProcess
    ? process.env.SURVEV_RANKED_TEST_DIRECTORY!
    : mkdtempSync(join(tmpdir(), "survev-ranked-"));
assert(resolve(directory).startsWith(resolve(tmpdir(), "survev-ranked-")));
const sqlitePath = join(directory, "ranked.sqlite");
const admin = verifyProcess ? undefined : new pg.Pool({ connectionString });
let created = false;
let store: RankedStore | undefined;
let pool: pg.Pool | undefined;

try {
    if (admin) {
        await admin.query(`CREATE DATABASE "${database}"`);
        created = true;
    }
    // Configure before importing the native database/auth modules; never edit the running game's config.
    Config.database = {
        enabled: true,
        host: connection.hostname.replace(/^\[|\]$/g, ""),
        port: Number(connection.port || 5432),
        user: decodeURIComponent(connection.username),
        password: decodeURIComponent(connection.password),
        database,
    };
    Config.apiServer.proxyIPHeader = "x-test-ip";
    Config.debug.allowMockAccount = true;
    const { db } = await import("../src/api/db/index.ts");
    pool = db.$client;
    if (!verifyProcess) {
        await migrate(db, { migrationsFolder: fileURLToPath(new URL("../src/api/db/drizzle/", import.meta.url)) });
    }
    const { usersTable, sessionTable } = await import("../src/api/db/schema.ts");
    const { createSession, validateSessionToken } = await import("../src/api/auth/index.ts");
    const { createNativeDeletionReconciler } = await import("../src/ranked/nativeDeletion.ts");
    const nativeAccountExists = async (id: string) =>
        !!await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) });
    store = new RankedStore(sqlitePath);

    if (verifyProcess && process.env.SURVEV_RANKED_TEST_RECOVER_ID) {
        const id = process.env.SURVEV_RANKED_TEST_RECOVER_ID;
        assert.equal(await nativeAccountExists(id), false);
        assert(store.pendingNativeDeletions().includes(id));
        await createNativeDeletionReconciler(store, nativeAccountExists)();
        assert.equal(store.getProfile(id), undefined);
        assert(!store.pendingNativeDeletions().includes(id));
        console.log("PASS fresh process: interrupted ranked cleanup recovered after confirmed native deletion.");
    } else if (verifyProcess) {
        const token = process.env.SURVEV_RANKED_TEST_TOKEN!;
        const account = await validateSessionToken(token);
        assert(account.user, "The original native session must survive a fresh API process.");
        const profile = store.getProfile(account.user.id)!;
        assert.equal(profile.ratings[1].played, 5);
        assert.equal(store.history(profile.id, 1).length, 5);
        assert.equal(store.leaderboard(1)[0].id, profile.id);
        const scoreboard = store.getSeriesResult("native-placement-0")!.scoreboard!;
        assert.equal(scoreboard.length, 2);
        assert.deepEqual(scoreboard.find(entry => entry.id === profile.id), {
            id: profile.id,
            name: profile.name,
            team: 0,
            kills: 2,
            damage: 210,
            roundsWon: 5,
            before: 1000,
            after: 1032,
            delta: 32,
            forfeited: false,
        });
        console.log(
            "PASS fresh process: native session, account identity, Elo, history, scoreboard and leaderboard persisted.",
        );
    } else {
        const { AuthRouter } = await import("../src/api/routes/user/AuthRouter.ts");
        const { createUserRouter } = await import("../src/api/routes/user/UserRouter.ts");
        const { createStatsRouter } = await import("../src/api/routes/stats/StatsRouter.ts");
        const { createRankedRouters } = await import("../src/ranked/router.ts");
        const { createRankedAccountHooks } = await import("../src/ranked/accountHooks.ts");
        const { createNewUser } = await import("../src/api/routes/user/auth/authUtils.ts");
        const coordinator = new RankedCoordinator(store, {
            async create() {
                throw new Error("This account check never allocates a game server.");
            },
            async progress() {
                return [];
            },
        });
        const app = new Hono();
        app.onError((error, c) =>
            error instanceof HTTPException ? error.getResponse() : c.json({ error: error.message }, 500)
        );
        app.route("/api/auth", AuthRouter);
        app.route("/api/user", createUserRouter(createRankedAccountHooks(store, coordinator)));
        app.route("/api/ranked", createRankedRouters(store, coordinator).app);
        app.route("/api", createStatsRouter(store));
        let cookie = "";
        const request = (path: string, body?: unknown, useCookie = true) =>
            app.request(`/api/${path}`, {
                method: body === undefined ? "GET" : "POST",
                headers: {
                    "x-test-ip": "127.0.0.1",
                    "content-type": "application/json",
                    ...(useCookie && cookie ? { cookie } : {}),
                },
                ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            });
        const login = await request("auth/mock", undefined, false);
        assert.equal(login.status, 302);
        cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
        assert(cookie.includes("session="));
        assert(login.headers.getSetCookie().some(value => value.startsWith("session=") && value.includes("HttpOnly")));
        const token = cookie.match(/(?:^|; )session=([^;]+)/)![1];
        const native = await validateSessionToken(token);
        assert(native.user);
        const id = native.user.id;
        const slug = native.user.slug;
        const mainProfile = await (await request("user/profile", {})).json();
        assert.equal(mainProfile.profile.slug, slug);
        assert.equal(store.getProfile(id), undefined, "Normal account reads should not create a ranked profile.");
        const ranked = await (await request("ranked/session")).json();
        assert.equal(ranked.profile.id, id);
        assert.equal(ranked.profile.name, mainProfile.profile.username);
        assert.equal((await request("ranked/state", undefined, false)).status, 401);
        assert.equal((await request("stats_preview/ranked_profile?slug=demo-demosurvevr")).status, 404);
        const normalStats = await request("user_stats", { slug, interval: "alltime", mapIdFilter: "-1" });
        assert.equal(normalStats.status, 200);
        assert.equal((await normalStats.json()).username, native.user.username);
        console.log("PASS original native login, main account UI, shared ranked identity and real PostgreSQL stats.");

        const opponentId = randomUUID();
        await createNewUser({
            id: opponentId,
            authId: `ranked-check:${opponentId}`,
            username: "Opponent",
            slug: "ranked-check-opponent",
        });
        store.linkAccount(opponentId, "Opponent");
        const first = store.settleSeries(
            "native-placement-0",
            1,
            [[id], [opponentId]],
            0,
            [5, 2],
            "completed",
            undefined,
            [
                { profileId: id, kills: 2, damageDealt: 210, roundWins: 5 },
                { profileId: opponentId, kills: 1, damageDealt: 100, roundWins: 2 },
            ],
        );
        assert.equal(store.getProfile(id)!.ratings[1].elo, 1032);
        assert.equal(store.leaderboard(1).length, 0);
        assert.deepEqual(
            store.settleSeries("native-placement-0", 1, [[id], [opponentId]], 0, [5, 2], "completed"),
            first,
        );
        for (let index = 1; index < 5; index++) {
            const winner = index % 2 === 0 ? 0 : 1;
            store.settleSeries(
                `native-placement-${index}`,
                1,
                [[id], [opponentId]],
                winner,
                winner === 0 ? [5, 2] : [2, 5],
                "completed",
            );
        }
        const rating = store.getProfile(id)!.ratings[1];
        const board = await (await request("ranked_stats/leaderboard?size=1")).json();
        assert.equal(board.entries[0].id, id);
        assert.equal(board.entries[0].slug, slug);
        const menuBoard = await (await request("ranked/leaderboard?size=1")).json();
        assert.deepEqual(menuBoard.entries, board.entries);
        const publicProfile = await (await request(`ranked_stats/profile?slug=${encodeURIComponent(slug)}`)).json();
        assert.equal(publicProfile.profile.ratings[1].elo, rating.elo);
        assert.equal(publicProfile.history.length, 5);
        console.log("PASS placements, idempotent settlement, native public profile and ranked leaderboard.");

        const childConnection = new URL(connectionString);
        childConnection.pathname = `/${database}`;
        const verifyFreshProcess = (recoverId = "") => {
            const child = spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url)], {
                cwd: fileURLToPath(new URL("../", import.meta.url)),
                windowsHide: true,
                encoding: "utf8",
                timeout: 30000,
                env: {
                    ...process.env,
                    SURVEV_TEST_POSTGRES_URL: childConnection.href,
                    SURVEV_RANKED_TEST_VERIFY: "1",
                    SURVEV_RANKED_TEST_DIRECTORY: directory,
                    SURVEV_RANKED_TEST_TOKEN: token,
                    SURVEV_RANKED_TEST_RECOVER_ID: recoverId,
                },
            });
            assert.equal(
                child.status,
                0,
                [child.error?.message, child.stderr, child.stdout].filter(Boolean).join("\n"),
            );
            console.log(child.stdout.trim());
        };
        verifyFreshProcess();

        coordinator.touch(id);
        coordinator.touch(opponentId);
        coordinator.joinQueue(id, 1, "local");
        coordinator.joinQueue(opponentId, 1, "local");
        await coordinator.tick();
        assert(coordinator.state(id).match);
        for (const path of ["user/logout", "user/delete", "user/username"]) {
            assert.equal((await request(path, { username: "Changed" })).status, 409);
        }
        coordinator.declineMatch(id, coordinator.state(id).match!.id);
        const linkAccount = store.linkAccount.bind(store);
        const previousName = store.getProfile(id)!.name;
        store.linkAccount = () => {
            throw new Error("Simulated linked name write interruption");
        };
        const renamed = await request("user/username", { username: "Native Ranked" });
        assert.equal(renamed.status, 200);
        assert.deepEqual(await renamed.json(), { result: "success" });
        assert.equal(
            (await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) }))!.username,
            "Native Ranked",
        );
        assert.equal(store.getProfile(id)!.name, previousName);
        store.linkAccount = linkAccount;
        assert.equal((await (await request("ranked/session")).json()).profile.name, "Native Ranked");
        assert.equal(store.getProfile(id)!.name, "Native Ranked");
        assert.deepEqual(store.getProfile(id)!.ratings[1], rating);
        assert.equal((await request(`ranked_stats/profile?slug=${encodeURIComponent(slug)}`)).status, 404);
        assert.equal((await (await request("ranked_stats/profile?slug=native-ranked")).json()).profile.id, id);
        assert.equal((await request("user/logout", {})).status, 200);
        assert.equal((await request("ranked/state")).status, 401);
        assert.equal((await validateSessionToken(token)).user, null);
        const relogin = await request("auth/mock", undefined, false);
        cookie = relogin.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
        assert.equal((await (await request("ranked/session")).json()).profile.id, id);
        console.log("PASS pending-match account guards, rename, logout and sign-in preserve the same Elo.");

        await db.update(usersTable).set({ banned: true }).where(eq(usersTable.id, id));
        assert.equal((await request("ranked/state")).status, 401);
        assert.equal((await request("ranked_stats/profile?slug=native-ranked")).status, 404);
        assert(
            !(await (await request("ranked_stats/leaderboard?size=1")).json()).entries.some((entry: { id: string }) =>
                entry.id === id
            ),
        );
        assert(
            !(await (await request("ranked/leaderboard?size=1")).json()).entries.some((entry: { id: string }) =>
                entry.id === id
            ),
        );
        await db.update(usersTable).set({ banned: false }).where(eq(usersTable.id, id));
        const expiredToken = randomUUID();
        const expired = await createSession(expiredToken, id);
        await db.update(sessionTable).set({ expiresAt: new Date(0) }).where(eq(sessionTable.id, expired.id));
        assert.equal((await validateSessionToken(expiredToken)).user, null);

        // A deferred trigger fails at COMMIT, after the native DELETE and its cascades have run.
        await pool.query(
            "CREATE FUNCTION ranked_test_reject_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'ranked test commit failure'; END $$",
        );
        await pool.query(
            "CREATE CONSTRAINT TRIGGER ranked_test_commit_failure AFTER DELETE ON users DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ranked_test_reject_commit()",
        );
        assert.equal((await request("user/delete", {})).status, 500);
        assert.equal(await nativeAccountExists(id), true);
        assert.deepEqual(store.getProfile(id)!.ratings[1], rating);
        assert(store.pendingNativeDeletions().includes(id));
        await createNativeDeletionReconciler(store, nativeAccountExists)();
        assert.deepEqual(store.getProfile(id)!.ratings[1], rating);
        await pool.query("DROP TRIGGER ranked_test_commit_failure ON users");
        await pool.query("DROP FUNCTION ranked_test_reject_commit()");
        console.log("PASS PostgreSQL COMMIT failure preserves both the native account and its earned Elo.");

        const completeDeletion = store.completeNativeDeletion.bind(store);
        store.completeNativeDeletion = () => {
            throw new Error("Simulated ranked cleanup interruption");
        };
        assert.equal((await request("user/delete", {})).status, 200);
        assert.equal(await db.query.usersTable.findFirst({ where: eq(usersTable.id, id) }), undefined);
        assert(store.pendingNativeDeletions().includes(id));
        assert(store.getProfile(id));
        store.completeNativeDeletion = completeDeletion;
        verifyFreshProcess(id);
        assert.equal(store.getProfile(id), undefined);
        assert.equal((await request("ranked_stats/profile?slug=native-ranked")).status, 404);
        assert.equal((await request("ranked/state")).status, 401);
        assert.equal(
            store.history(opponentId).length,
            5,
            "Deleting an account must retain opponents' earned match history.",
        );
        console.log("PASS bans, expired sessions and account deletion across PostgreSQL and ranked storage.");
    }
} finally {
    store?.close();
    await pool?.end();
    if (admin) {
        if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
        await admin.end();
        for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
        rmdirSync(directory);
    }
}

// Native server modules create housekeeping timers. All test resources are closed above.
process.exit(0);
