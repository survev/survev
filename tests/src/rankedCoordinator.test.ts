import { afterEach, describe, expect, it, vi } from "vitest";
import {
    RankedCoordinator,
    type RoundHost,
    type RoundReport,
    type RoundRequest,
} from "../../server/src/ranked/coordinator.ts";
import { RankedStore } from "../../server/src/ranked/store.ts";
import type { DuelSize } from "../../shared/types/ranked.ts";
import type { DuelCombatSnapshot } from "../../shared/types/rankedCombat.ts";

const stores: RankedStore[] = [];
afterEach(() => {
    for (const store of stores.splice(0)) store.close();
});

function setup(count = 8) {
    let now = 100000;
    const store = new RankedStore(":memory:");
    stores.push(store);
    for (let i = 0; i < count; i++) {
        store.linkAccount(`p${i}`, `Player ${i}`);
    }
    vi.spyOn(store, "settleSeries");
    vi.spyOn(store, "recordForfeit");
    const requests: RoundRequest[] = [];
    const host: RoundHost = {
        create: vi.fn(async request => {
            requests.push(request);
            return { gameId: `game-${request.roundId}`, urls: ["ws://127.0.0.1:9000/play"] };
        }),
        progress: async () =>
            requests.map(r => ({
                gameId: `game-${r.roundId}`,
                phase: "playing",
                connected: r.players.length,
                expected: r.players.length,
            })),
        removePlayer: vi.fn(async () => {}),
    };
    const coordinator = new RankedCoordinator(store, host, () => now);
    for (let i = 0; i < count; i++) coordinator.touch(`p${i}`);
    const acceptAll = async () => {
        for (let i = 0; i < count; i++) {
            const id = `p${i}`;
            const match = coordinator.state(id).match;
            if (match) coordinator.acceptMatch(id, match.id);
        }
        await Promise.resolve();
    };
    const queue = async (size: DuelSize, ids: string[], accept = true) => {
        for (const id of ids) coordinator.joinQueue(id, size);
        if (accept) await acceptAll();
        await Promise.resolve();
    };
    const report = (winner: 0 | 1 = 0): RoundReport => {
        const r = requests.at(-1)!;
        return {
            seriesId: r.seriesId,
            roundId: r.roundId,
            round: r.round,
            gameId: `game-${r.roundId}`,
            winnerTeam: winner,
            started: true,
            reason: "elimination",
        };
    };
    return {
        coordinator,
        store,
        requests,
        host,
        queue,
        acceptAll,
        report,
        advance: (ms: number) => {
            now += ms;
        },
    };
}

describe("ranked duel matchmaking and series", () => {
    it("matches complete later parties while an older party waits for a compatible teammate", () => {
        const s = setup(16);
        const party = (ids: string[]) => {
            s.coordinator.createParty(ids[0], 4);
            const code = s.coordinator.state(ids[0]).party!.code;
            for (const id of ids.slice(1)) {
                s.coordinator.joinParty(id, code);
                s.coordinator.ready(id, true);
            }
            s.coordinator.joinQueue(ids[0], 4);
        };
        party(["p0", "p1", "p2"]);
        party(["p3", "p4", "p5", "p6"]);
        party(["p7", "p8", "p9", "p10"]);
        expect(s.coordinator.state("p0").queue).not.toBeNull();
        const match = s.coordinator.state("p3").match;
        expect(match).toMatchObject({ total: 8 });
        expect(s.coordinator.state("p7").match!.id).toBe(match!.id);
        expect(s.requests).toHaveLength(0);

        // Its original wait time and priority survive the match it could not fill.
        party(["p11", "p12", "p13", "p14"]);
        s.coordinator.joinQueue("p15", 4);
        expect(s.coordinator.state("p0").match).toMatchObject({ total: 8 });
        expect(s.coordinator.state("p15").match!.id).toBe(s.coordinator.state("p0").match!.id);
    });

    it("records precise first-arena no-shows after acceptance without changing Elo or striking connected players", async () => {
        const s = setup();
        const ids = ["p0", "p1", "p2", "p3"];
        for (let attempt = 0; attempt < 2; attempt++) {
            await s.queue(2, ids);
            const report: RoundReport = {
                ...s.report(),
                started: false,
                winnerTeam: null,
                reason: "connection_timeout",
                missingTeams: [0],
                missingProfileIds: ["p1"],
            };
            expect(() => s.coordinator.roundResult({ ...report, missingProfileIds: ["unknown-player"] })).toThrow(
                "Invalid missing player",
            );
            expect(s.coordinator.roundResult(report)).toBe(true);
            expect(s.coordinator.roundResult(report)).toBe(false);
            expect(s.coordinator.state("p1").series!.status).toBe("cancelled");
            expect(s.coordinator.state("p1").cooldown?.seconds ?? 0).toBe(attempt === 0 ? 0 : 60);
            for (const id of ids) {
                expect(s.store.getProfile(id)!.ratings[2]).toMatchObject({ elo: 1000, played: 0 });
                if (id !== "p1") expect(s.coordinator.state(id).cooldown).toBeNull();
                s.coordinator.acknowledge(id);
            }
        }
        expect(s.store.settleSeries).not.toHaveBeenCalled();
        expect(s.store.recordForfeit).not.toHaveBeenCalled();
    });
    it("retains original premade membership after a forfeit removes the player from the party", async () => {
        const s = setup();
        s.coordinator.createParty("p0", 2);
        s.coordinator.joinParty("p1", s.coordinator.state("p0").party!.code);
        s.coordinator.ready("p1", true);
        await s.queue(2, ["p0", "p2", "p3"]);
        await s.coordinator.forfeit("p0");
        expect(s.coordinator.state("p0").party).toBeNull();
        const winner = (1 - s.coordinator.state("p1").series!.teamIndex) as 0 | 1;
        for (let round = 1; round <= 5; round++) {
            s.coordinator.roundResult(s.report(winner));
            if (round < 5) {
                s.advance(7001);
                await s.coordinator.tick();
                await Promise.resolve();
            }
        }
        expect(s.store.getProfile("p0")!.ratings[2].elo).toBe(936);
        expect(s.store.getProfile("p1")!.ratings[2].elo).toBe(968);
    });

    it("aggregates final scoreboard counters once per round despite repeated result callbacks", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        for (let round = 1; round <= 5; round++) {
            const report = s.report();
            const combat: DuelCombatSnapshot = {
                ...report,
                players: [
                    { profileId: "p0", kills: 1, damageDealt: 125, roundWins: 1 },
                    { profileId: "p1", kills: 0, damageDealt: 60, roundWins: 0 },
                ],
            };
            expect(s.coordinator.roundResult({ ...report, combat })).toBe(true);
            expect(s.coordinator.roundResult({ ...report, combat })).toBe(false);
            if (round < 5) {
                expect(s.coordinator.state("p0").series!.scoreboard).toBeNull();
                s.advance(7001);
                await s.coordinator.tick();
                await Promise.resolve();
            }
        }
        expect(s.coordinator.state("p0").series!.scoreboard).toMatchObject([
            {
                id: "p0",
                team: 0,
                kills: 5,
                damage: 625,
                roundsWon: 5,
                before: 1000,
                after: 1032,
                delta: 32,
                forfeited: false,
            },
            {
                id: "p1",
                team: 1,
                kills: 0,
                damage: 300,
                roundsWon: 0,
                before: 1000,
                after: 968,
                delta: -32,
                forfeited: false,
            },
        ]);
        const seriesId = s.coordinator.state("p0").series!.id;
        expect(s.store.getSeriesResult(seriesId)!.scoreboard).toEqual(s.coordinator.state("p0").series!.scoreboard);
        s.store.anonymizeAccount("p0");
        expect(s.coordinator.state("p1").series!.scoreboard![0]).toMatchObject({ name: "Deleted Player", kills: 5 });
    });

    it("does not present partial series telemetry as a complete scoreboard", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        for (let round = 1; round <= 5; round++) {
            const report = s.report();
            const combat: DuelCombatSnapshot | undefined = round === 5
                ? {
                    ...report,
                    players: [
                        { profileId: "p0", kills: 1, damageDealt: 100, roundWins: 1 },
                        { profileId: "p1", kills: 0, damageDealt: 50, roundWins: 0 },
                    ],
                }
                : undefined;
            s.coordinator.roundResult({ ...report, combat });
            if (round < 5) {
                s.advance(7001);
                await s.coordinator.tick();
                await Promise.resolve();
            }
        }
        const series = s.coordinator.state("p0").series!;
        expect(series.status).toBe("complete");
        expect(series.scoreboard).toBeNull();
        expect(s.store.getSeriesResult(series.id)!.scoreboard).toBeNull();
        expect(s.store.getProfile("p0")!.ratings[1].played).toBe(1);
    });

    it("waits for confirmed combat counters before finalizing a last-player forfeit scoreboard", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        await s.coordinator.tick();
        let release!: (combat: DuelCombatSnapshot) => void;
        s.host.removePlayer = vi.fn(() =>
            new Promise<DuelCombatSnapshot>(resolve => {
                release = resolve;
            })
        );
        const forfeit = s.coordinator.forfeit("p0");
        expect(s.coordinator.state("p0").series!.result!.delta).toBe(-64);
        expect(s.coordinator.state("p0").series!.scoreboard).toBeNull();
        expect(s.store.settleSeries).not.toHaveBeenCalled();
        release({
            ...s.report(),
            players: [
                { profileId: "p0", kills: 2, damageDealt: 240, roundWins: 0 },
                { profileId: "p1", kills: 1, damageDealt: 150, roundWins: 1 },
            ],
        });
        await forfeit;
        expect(s.coordinator.state("p0").series!.score).toEqual([0, 5]);
        expect(s.coordinator.state("p0").series!.scoreboard).toMatchObject([
            { id: "p0", kills: 2, damage: 240, roundsWon: 0, delta: -64, forfeited: true },
            { id: "p1", kills: 1, damage: 150, roundsWon: 1, delta: 32, forfeited: false },
        ]);
        expect(s.store.settleSeries).toHaveBeenCalledTimes(1);
    });
    it("reserves a full match but allocates no arena until every player accepts the same match", async () => {
        const s = setup();
        await s.queue(2, ["p0", "p1", "p2", "p3"], false);
        const match = s.coordinator.state("p0").match!;
        expect(s.requests).toHaveLength(0);
        expect(s.coordinator.state("p0").series).toBeNull();
        expect(match).toMatchObject({ total: 4, acceptedCount: 0, accepted: false, deadline: 130000 });
        expect(Object.keys(match)).not.toContain("teams");
        expect(() => s.coordinator.acceptMatch("p0", "stale-match")).toThrow("no longer waiting");
        expect(() => s.coordinator.joinQueue("p0", 1)).toThrow("pending match");
        for (const id of ["p0", "p1", "p2"]) s.coordinator.acceptMatch(id, match.id);
        s.coordinator.acceptMatch("p0", match.id);
        expect(s.coordinator.state("p0").match!.acceptedCount).toBe(3);
        expect(s.requests).toHaveLength(0);
        s.coordinator.acceptMatch("p3", match.id);
        await Promise.resolve();
        expect(s.coordinator.state("p0").match).toBeNull();
        expect(s.requests).toHaveLength(1);
    });

    it("only penalizes players who decline or miss the acceptance deadline and resets their party readiness", async () => {
        const s = setup();
        s.coordinator.createParty("p0", 2);
        s.coordinator.joinParty("p1", s.coordinator.state("p0").party!.code);
        s.coordinator.ready("p1", true);
        await s.queue(2, ["p0", "p2", "p3"], false);
        const first = s.coordinator.state("p0").match!;
        for (const id of ["p0", "p2", "p3"]) s.coordinator.acceptMatch(id, first.id);
        s.advance(30000);
        await s.coordinator.tick();
        expect(s.coordinator.state("p1").notice).toContain("Warning");
        expect(s.coordinator.state("p0").cooldown).toBeNull();
        expect(s.coordinator.state("p1").party!.members.find(member => member.id === "p1")!.ready).toBe(false);
        expect(s.requests).toHaveLength(0);
        for (const id of ["p0", "p1", "p2", "p3"]) s.coordinator.touch(id);
        s.coordinator.ready("p1", true);
        await s.queue(2, ["p0", "p2", "p3"], false);
        const second = s.coordinator.state("p1").match!;
        s.coordinator.declineMatch("p1", first.id);
        expect(s.coordinator.state("p1").match!.id).toBe(second.id);
        s.coordinator.declineMatch("p1", second.id);
        expect(s.coordinator.state("p1").cooldown!.seconds).toBe(60);
        expect(s.coordinator.state("p0").party!.members.find(member => member.id === "p1")!.cooldown!.seconds).toBe(60);
        expect(() => s.coordinator.ready("p1", true)).toThrow("cooldown");
        expect(s.coordinator.state("p0").cooldown).toBeNull();
        expect(s.store.getProfile("p1")!.ratings[2].played).toBe(0);
    });

    it("does not count game-server allocation failures as missed acceptance or a forfeit", async () => {
        const s = setup();
        vi.mocked(s.host.create).mockRejectedValueOnce(new Error("server unavailable"));
        await s.queue(1, ["p0", "p1"]);
        for (const id of ["p0", "p1"]) {
            expect(s.coordinator.state(id).cooldown).toBeNull();
            expect(s.store.getProfile(id)!.ratings[1].played).toBe(0);
            s.coordinator.acknowledge(id);
        }
        await s.queue(1, ["p0", "p1"], false);
        s.coordinator.declineMatch("p0", s.coordinator.state("p0").match!.id);
        expect(s.coordinator.state("p0").notice).toContain("Warning");
        expect(s.coordinator.state("p0").cooldown).toBeNull();
    });
    it("a prestart individual forfeit keeps the assigned 2v1 match and removes the player from their party", async () => {
        const s = setup();
        s.coordinator.createParty("p0", 2);
        s.coordinator.joinParty("p1", s.coordinator.state("p0").party!.code);
        s.coordinator.ready("p1", true);
        await s.queue(2, ["p0", "p2", "p3"]);
        expect(s.coordinator.state("p0").series!.status).toBe("connecting");
        s.coordinator.forfeit("p0");
        expect(s.coordinator.state("p1").series).toMatchObject({ status: "connecting", total: 3, result: null });
        expect(s.coordinator.state("p0").party).toBeNull();
        expect(s.coordinator.state("p1").party!.leaderId).toBe("p1");
        expect(s.store.getProfile("p0")!.ratings[2]).toMatchObject({ losses: 1, elo: 936 });
        expect(s.store.settleSeries).not.toHaveBeenCalled();
        expect(s.host.removePlayer).toHaveBeenCalledTimes(1);
    });

    it("removes a forfeiter from an allocation that was still in flight when they left", async () => {
        const s = setup();
        let allocate!: () => void;
        const originalCreate = s.host.create;
        s.host.create = async request => {
            await new Promise<void>(resolve => {
                allocate = resolve;
            });
            return originalCreate(request);
        };
        await s.queue(2, ["p0", "p1", "p2", "p3"]);
        s.coordinator.forfeit("p0");
        await Promise.resolve();
        expect(() => s.coordinator.acknowledge("p0")).toThrow("connection is closing");
        allocate();
        for (let i = 0; i < 6; i++) await Promise.resolve();
        expect(s.host.removePlayer).toHaveBeenCalledTimes(2);
        expect(s.requests[0].players).toHaveLength(4);
        expect(s.coordinator.state("p0").series!.join).toBeNull();
        expect(s.coordinator.state("p1").series!.join).not.toBeNull();
        expect(() => s.coordinator.acknowledge("p0")).not.toThrow();
    });
    it("applies simultaneous abandonment to both sides without inventing a winner", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        await s.coordinator.tick();
        const report = { ...s.report(), profileId: "p0", abandonedProfileIds: ["p0", "p1"] };
        expect(s.coordinator.playerAbandoned(report)).toBe(true);
        expect(s.coordinator.state("p0").series!.status).toBe("cancelled");
        expect(s.coordinator.state("p1").series!.personalForfeit).toBe(true);
        expect(s.store.settleSeries).not.toHaveBeenCalled();
        for (const id of ["p0", "p1"]) {
            expect(s.store.getProfile(id)!.ratings[1]).toMatchObject({ elo: 936, losses: 1, wins: 0 });
        }
        expect(s.coordinator.playerAbandoned({ ...report, profileId: "p1" })).toBe(false);
        expect(s.store.recordForfeit).toHaveBeenCalledTimes(2);
    });

    it("does not release a forfeiter for another queue until the old arena connection is removed", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        await s.coordinator.tick();
        let remove!: () => void;
        s.host.removePlayer = vi.fn(() =>
            new Promise<void>(resolve => {
                remove = resolve;
            })
        );
        s.coordinator.forfeit("p0");
        expect(s.coordinator.state("p0").series!.status).toBe("playing");
        expect(() => s.coordinator.acknowledge("p0")).toThrow("connection is closing");
        expect(() => s.coordinator.joinQueue("p0", 1)).toThrow("current series");
        remove();
        await Promise.resolve();
        s.coordinator.acknowledge("p0");
        expect(() => s.coordinator.joinQueue("p0", 1)).toThrow("cooldown");
        s.advance(300001);
        s.coordinator.touch("p0");
        expect(() => s.coordinator.joinQueue("p0", 1)).not.toThrow();
    });

    it("retries a failed arena removal even when the series has already finished", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        await s.coordinator.tick();
        vi.mocked(s.host.removePlayer!).mockRejectedValueOnce(new Error("temporary outage"));
        s.coordinator.forfeit("p0");
        await Promise.resolve();
        await Promise.resolve();
        expect(() => s.coordinator.acknowledge("p0")).toThrow("connection is closing");
        await s.coordinator.tick();
        await Promise.resolve();
        expect(s.host.removePlayer).toHaveBeenCalledTimes(2);
        expect(() => s.coordinator.acknowledge("p0")).not.toThrow();
    });

    it("waits for an already finished round result instead of changing its winner through a late forfeit", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        s.host.progress = async () => [{ gameId: s.report().gameId, phase: "finished", connected: 2, expected: 2 }];
        await s.coordinator.tick();
        expect(() => s.coordinator.forfeit("p0")).toThrow("result is being confirmed");
        expect(s.store.recordForfeit).not.toHaveBeenCalled();
        s.coordinator.roundResult(s.report());
        expect(() => s.coordinator.forfeit("p0")).not.toThrow();
        expect(s.store.recordForfeit).toHaveBeenCalledTimes(1);
    });
    it("resizes and disbands idle parties only through their leader, without removing members", () => {
        const s = setup();
        s.coordinator.createParty("p0", 4);
        const code = s.coordinator.state("p0").party!.code;
        s.coordinator.joinParty("p1", code);
        s.coordinator.joinParty("p2", code);
        s.coordinator.ready("p1", true);
        s.coordinator.ready("p2", true);
        expect(() => s.coordinator.resizeParty("p1", 3)).toThrow("leader");
        expect(() => s.coordinator.resizeParty("p0", 2)).toThrow("fewer places");
        expect(s.coordinator.state("p0").party!.members).toHaveLength(3);
        s.coordinator.resizeParty("p0", 3);
        expect(s.coordinator.state("p0").party).toMatchObject({
            size: 3,
            members: [
                { id: "p0", ready: true, rating: { elo: 1000 } },
                { id: "p1", ready: false },
                { id: "p2", ready: false },
            ],
        });
        expect(() => s.coordinator.disbandParty("p1")).toThrow("leader");
        s.coordinator.ready("p1", true);
        s.coordinator.ready("p2", true);
        s.coordinator.joinQueue("p0", 3);
        expect(() => s.coordinator.resizeParty("p0", 4)).toThrow("queue");
        expect(() => s.coordinator.disbandParty("p0")).toThrow("queue");
        s.coordinator.leaveQueue("p0");
        s.coordinator.disbandParty("p0");
        for (const id of ["p0", "p1", "p2"]) expect(s.coordinator.state(id).party).toBeNull();
    });

    it("keeps a 4v2 series going, awards normal teammate wins and never double-penalizes abandonment reports", async () => {
        const s = setup();
        await s.queue(4, Array.from({ length: 8 }, (_, i) => `p${i}`));
        await s.coordinator.tick();
        const first = s.coordinator.state("p0").series!;
        const ownTeam = first.teamIndex;
        const [one, two, staying] = first.teams[ownTeam].map(player => player.id);
        const callback = { ...s.report(), profileId: one };
        expect(s.coordinator.playerAbandoned({ ...callback, gameId: "forged" })).toBe(false);
        expect(s.coordinator.playerAbandoned(callback)).toBe(true);
        expect(s.coordinator.playerAbandoned(callback)).toBe(true);
        s.coordinator.forfeit(two);
        expect(s.store.recordForfeit).toHaveBeenCalledTimes(2);
        expect(s.coordinator.state(staying).series).toMatchObject({ total: 6, personalForfeit: false, result: null });
        for (let round = 1; round <= 5; round++) {
            const report = { ...s.report(ownTeam), abandonedProfileIds: [one, two] };
            expect(s.coordinator.roundResult(report)).toBe(true);
            expect(s.coordinator.roundResult(report)).toBe(false);
            if (round < 5) {
                s.advance(7001);
                await s.coordinator.tick();
                await Promise.resolve();
            }
        }
        expect(s.requests.slice(1).every(request => request.players.length === 6 && request.teamSize === 4)).toBe(true);
        expect(s.store.recordForfeit).toHaveBeenCalledTimes(2);
        expect(s.store.settleSeries).toHaveBeenCalledTimes(1);
        expect(s.store.getProfile(one)!.ratings[4]).toMatchObject({ elo: 936, played: 1, losses: 1, wins: 0 });
        expect(s.store.getProfile(staying)!.ratings[4]).toMatchObject({ elo: 1032, wins: 1 });
        expect(s.coordinator.state(one).series!.result).toMatchObject({
            before: 1000,
            after: 936,
            delta: -64,
            winnerTeam: 1 - ownTeam,
        });
    });

    it("processes abandonment included in the winning round callback before final Elo settlement", async () => {
        const s = setup();
        await s.queue(2, ["p0", "p1", "p2", "p3"]);
        const team = s.coordinator.state("p0").series!.teamIndex;
        for (let round = 1; round < 5; round++) {
            s.coordinator.roundResult(s.report(team));
            s.advance(7001);
            await s.coordinator.tick();
            await Promise.resolve();
        }
        const last = { ...s.report(team), abandonedProfileIds: ["p0"] };
        expect(s.coordinator.roundResult(last)).toBe(true);
        expect(s.store.getProfile("p0")!.ratings[2]).toMatchObject({ played: 1, losses: 1, elo: 936 });
        expect(s.coordinator.playerAbandoned({ ...last, profileId: "p0" })).toBe(false);
        expect(s.store.recordForfeit).toHaveBeenCalledTimes(1);
        expect(s.store.settleSeries).toHaveBeenCalledTimes(1);
    });
    it.each([1, 2, 3, 4] as DuelSize[])("waits for both full teams in %iv%i", async size => {
        const s = setup();
        const ids = Array.from({ length: size * 2 }, (_, i) => `p${i}`);
        await s.queue(size, ids.slice(0, -1));
        expect(s.requests).toHaveLength(0);
        expect(s.coordinator.state("p0").series).toBeNull();
        await s.queue(size, ids.slice(-1));
        expect(s.requests).toHaveLength(1);
        expect(s.requests[0].players.filter(p => p.team === 0)).toHaveLength(size);
        expect(s.requests[0].players.filter(p => p.team === 1)).toHaveLength(size);
        expect(new Set(s.requests[0].players.map(p => p.id)).size).toBe(2 * size);
    });
    it("cannot queue a profile twice or in a second mode", () => {
        const s = setup();
        s.coordinator.joinQueue("p0", 4);
        expect(() => s.coordinator.joinQueue("p0", 1)).toThrow("Leave the queue");
    });
    it("keeps regions separate while using each account rating", async () => {
        const s = setup();
        s.coordinator.joinQueue("p0", 1, "eu");
        s.coordinator.joinQueue("p1", 1, "na");
        expect(s.requests).toHaveLength(0);
        s.coordinator.joinQueue("p2", 1, "eu");
        await s.acceptAll();
        expect(s.requests).toHaveLength(1);
        expect(s.requests[0].region).toBe("eu");
        expect(s.coordinator.state("p1").queue?.region).toBe("na");
    });
    it("cancels queue without creating a game and expires offline players", async () => {
        const s = setup();
        s.coordinator.joinQueue("p0", 1);
        s.coordinator.leaveQueue("p0");
        expect(s.coordinator.state("p0").queue).toBeNull();
        s.coordinator.joinQueue("p0", 1);
        s.advance(26000);
        await s.coordinator.tick();
        expect(s.coordinator.state("p0").queue).toBeNull();
        expect(s.requests).toHaveLength(0);
        expect(s.store.settleSeries).not.toHaveBeenCalled();
    });
    it("keeps parties on the same team and requires every member ready", async () => {
        const s = setup();
        s.coordinator.createParty("p0", 3);
        const code = s.coordinator.state("p0").party!.code;
        s.coordinator.joinParty("p1", code);
        expect(() => s.coordinator.joinQueue("p0", 3)).toThrow("ready");
        s.coordinator.ready("p1", true);
        await s.queue(3, ["p0", "p2", "p3", "p4", "p5"]);
        const roster = s.requests[0].players;
        expect(roster.find(p => p.id === "p0")!.team).toBe(roster.find(p => p.id === "p1")!.team);
        expect(roster).toHaveLength(6);
    });
    it("requires five round wins; stale/duplicate callbacks never award twice", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        for (let round = 1; round <= 5; round++) {
            const report = s.report();
            expect(s.coordinator.roundResult(report)).toBe(true);
            expect(s.coordinator.roundResult(report)).toBe(false);
            if (round < 5) {
                expect(s.store.settleSeries).not.toHaveBeenCalled();
                expect(s.coordinator.state("p0").series!.status).toBe("intermission");
                s.advance(7001);
                await s.coordinator.tick();
                await Promise.resolve();
                expect(s.coordinator.roundResult(report)).toBe(false);
            }
        }
        expect(s.store.settleSeries).toHaveBeenCalledTimes(1);
        expect(s.coordinator.state("p0").series!.score).toEqual([5, 0]);
        expect(s.coordinator.state("p0").series!.status).toBe("complete");
        s.coordinator.acknowledge("p0");
        expect(s.coordinator.state("p0").series).toBeNull();
    });
    it("no-shows before the first round cancel without Elo changes", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        s.coordinator.roundResult({
            ...s.report(),
            winnerTeam: null,
            started: false,
            reason: "connection_timeout",
            missingTeams: [1],
        });
        expect(s.coordinator.state("p0").series!.status).toBe("cancelled");
        expect(s.store.settleSeries).not.toHaveBeenCalled();
    });
    it("an individual forfeit leaves a 2v1 series running and charges only that player immediately", async () => {
        const s = setup();
        await s.queue(2, ["p0", "p1", "p2", "p3"]);
        await s.coordinator.tick();
        const myTeam = s.coordinator.state("p0").series!.teamIndex;
        s.coordinator.forfeit("p0");
        expect(s.store.settleSeries).not.toHaveBeenCalled();
        expect(s.coordinator.state("p0").series!.result!.winnerTeam).toBe(1 - myTeam);
        expect(s.coordinator.state("p0").series).toMatchObject({
            status: "playing",
            personalForfeit: true,
            total: 3,
            join: null,
        });
        expect(s.store.getProfile("p0")!.ratings[2]).toMatchObject({ elo: 936, played: 1, losses: 1 });
        expect(s.host.removePlayer).toHaveBeenCalledTimes(1);
        s.coordinator.forfeit("p0");
        expect(s.store.recordForfeit).toHaveBeenCalledTimes(1);
        await Promise.resolve();
        s.coordinator.acknowledge("p0");
        expect(s.coordinator.state("p0").series).toBeNull();
        s.coordinator.roundResult(s.report());
        s.advance(7001);
        await s.coordinator.tick();
        await Promise.resolve();
        expect(s.requests.at(-1)!.players).toHaveLength(3);
        expect(s.requests.at(-1)!.players.some(player => player.id === "p0")).toBe(false);
        expect(s.requests.at(-1)!.teamSize).toBe(2);
    });
    it("rejects forged game and round identifiers", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        expect(s.coordinator.roundResult({ ...s.report(), gameId: "forged" })).toBe(false);
        expect(s.coordinator.roundResult({ ...s.report(), roundId: "forged" })).toBe(false);
        expect(s.coordinator.state("p0").series!.score).toEqual([0, 0]);
    });
    it("a forfeit waits for an already running poll to confirm the round started", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        const currentProgress = s.host.progress;
        let finishPoll!: () => void;
        s.host.progress = async () => {
            await new Promise<void>(resolve => {
                finishPoll = resolve;
            });
            return currentProgress();
        };
        const backgroundPoll = s.coordinator.tick();
        const actionPoll = s.coordinator.tick();
        expect(actionPoll).toBe(backgroundPoll);
        let forfeited = false;
        const action = actionPoll.then(() => {
            s.coordinator.forfeit("p0");
            forfeited = true;
        });
        await Promise.resolve();
        expect(forfeited).toBe(false);
        finishPoll();
        await action;
        expect(s.coordinator.state("p0").series!.status).toBe("complete");
        expect(s.store.settleSeries).toHaveBeenCalledTimes(1);
    });
    it("a delayed status poll cannot replace a committed result with a cancellation", async () => {
        const s = setup();
        await s.queue(1, ["p0", "p1"]);
        await s.coordinator.tick();
        let finishPoll!: (value: []) => void;
        s.host.progress = () =>
            new Promise(resolve => {
                finishPoll = resolve;
            });
        const polling = s.coordinator.tick();
        s.coordinator.forfeit("p0");
        s.advance(11 * 60 * 1000);
        finishPoll([]);
        await polling;
        expect(s.store.settleSeries).toHaveBeenCalledTimes(1);
        expect(s.coordinator.state("p0").series!.status).toBe("complete");
        expect(s.coordinator.state("p0").series!.result!.reason).toContain("forfeited");
    });
    it("an allocation failure returns no-contest instead of changing ratings", async () => {
        const s = setup();
        vi.mocked(s.host.create).mockRejectedValueOnce(new Error("offline"));
        await s.queue(1, ["p0", "p1"]);
        expect(s.coordinator.state("p0").series!.status).toBe("cancelled");
        expect(s.store.settleSeries).not.toHaveBeenCalled();
    });
});
