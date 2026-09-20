import { randomBytes, randomUUID } from "node:crypto";
import type { DuelSize, DuelTeam, RankedState } from "../../../shared/types/ranked.ts";
import type { DuelCombatSnapshot, DuelCombatStats } from "../../../shared/types/rankedCombat.ts";
import { RankedRequestError } from "./errors.ts";
import type { RankedForfeit, RankedStore } from "./store.ts";

interface Ticket {
    id: string;
    size: DuelSize;
    region: string;
    players: string[];
    joinedAt: number;
}
interface Party {
    code: string;
    size: DuelSize;
    region: string;
    leaderId: string;
    members: Map<string, boolean>;
}
export interface RoundRequest {
    seriesId: string;
    roundId: string;
    round: number;
    teamSize: DuelSize;
    region: string;
    players: { id: string; name: string; ip: string; team: DuelTeam; joinToken: string }[];
}
export interface RoundReport {
    seriesId: string;
    roundId: string;
    round: number;
    gameId: string;
    winnerTeam: DuelTeam | null;
    reason: "elimination" | "disconnect" | "connection_timeout" | "draw";
    started: boolean;
    missingTeams?: DuelTeam[];
    missingProfileIds?: string[];
    abandonedProfileIds?: string[];
    combat?: DuelCombatSnapshot;
}
export interface PlayerAbandonedReport {
    seriesId: string;
    roundId: string;
    round: number;
    gameId: string;
    profileId: string;
    abandonedProfileIds?: string[];
    combat?: DuelCombatSnapshot;
}
export interface RoundProgress {
    gameId: string;
    phase: "connecting" | "countdown" | "playing" | "finished";
    connected: number;
    expected: number;
    countdownEndsAt?: number;
}
export interface RoundHost {
    create(request: RoundRequest): Promise<{ gameId: string; urls: string[] }>;
    progress(regions?: string[]): Promise<RoundProgress[]>;
    cancel?(seriesId: string, roundId: string, region: string): Promise<void>;
    removePlayer?(
        seriesId: string,
        roundId: string,
        profileId: string,
        region: string,
    ): Promise<DuelCombatSnapshot | void>;
}
interface Series {
    id: string;
    size: DuelSize;
    region: string;
    teams: [string[], string[]];
    parties: Record<string, string>;
    combat: Map<string, Map<string, DuelCombatStats>>;
    roundRosters: Map<string, string[]>;
    score: [number, number];
    round: number;
    roundId: string;
    gameId: string;
    createdAt: number;
    roundCreatedAt: number;
    status: NonNullable<RankedState["series"]>["status"];
    connected: number;
    startsAt: number | null;
    nextRoundAt: number | null;
    urls: string[];
    tokens: Map<string, string>;
    reports: Set<string>;
    result: { winnerTeam: DuelTeam | null; reason: string } | null;
    started: boolean;
    launchPending: boolean;
    draws: number;
    before: Map<string, number>;
    forfeits: Map<string, RankedForfeit>;
    pendingRemovals: Set<string>;
    settled?: boolean;
    finishedSeenAt?: number;
}
interface PendingMatch {
    series: Series;
    accepted: Set<string>;
    deadline: number;
}

export class RankedCoordinator {
    private tickets: Ticket[] = [];
    private parties = new Map<string, Party>();
    private playerParty = new Map<string, string>();
    private series = new Map<string, Series>();
    private playerSeries = new Map<string, string>();
    private matches = new Map<string, PendingMatch>();
    private playerMatch = new Map<string, string>();
    private presence = new Map<string, { at: number; ip: string }>();
    private notices = new Map<string, string>();
    private ticking?: Promise<void>;

    constructor(
        readonly store: Pick<
            RankedStore,
            | "getProfile"
            | "getSeriesResult"
            | "rename"
            | "history"
            | "settleSeries"
            | "recordForfeit"
            | "beginSeries"
            | "queueCooldown"
            | "recordNoShow"
        >,
        private host: RoundHost,
        private now = Date.now,
    ) {}

    touch(id: string, ip = "127.0.0.1") {
        this.presence.set(id, { at: this.now(), ip });
    }
    private profile(id: string) {
        const profile = this.store.getProfile(id);
        if (!profile) throw new RankedRequestError("Player profile not found.");
        return profile;
    }
    private ticket(id: string) {
        return this.tickets.find(t => t.players.includes(id));
    }
    private active(id: string) {
        const seriesId = this.playerSeries.get(id);
        return seriesId ? this.series.get(seriesId) : undefined;
    }
    private assertIdle(id: string) {
        if (this.ticket(id)) throw new RankedRequestError("Leave the queue first.");
        if (this.playerMatch.has(id)) throw new RankedRequestError("Accept or decline your pending match first.");
        if (this.active(id)) throw new RankedRequestError("Finish or dismiss your current series first.");
    }
    private assertCanQueue(id: string) {
        const cooldown = this.store.queueCooldown(id, this.now());
        if (cooldown) {
            throw new RankedRequestError(
                `${this.profile(id).name}: ${cooldown.reason} ${cooldown.seconds} seconds remaining.`,
            );
        }
    }
    private party(id: string) {
        return this.parties.get(this.playerParty.get(id) ?? "");
    }
    private notify(ids: string[], message: string) {
        for (const id of ids) this.notices.set(id, message);
    }
    private rating(id: string, size: DuelSize) {
        return this.profile(id).ratings[size].elo;
    }
    private range(ticket: Ticket) {
        return Math.min(1500, 150 + Math.floor((this.now() - ticket.joinedAt) / 15000) * 50);
    }

    rename(id: string, name: string) {
        this.assertIdle(id);
        this.store.rename(id, name);
    }
    createParty(id: string, size: DuelSize, region = "local") {
        this.assertIdle(id);
        if (size === 1) throw new RankedRequestError("1v1 uses the solo queue.");
        if (this.party(id)) throw new RankedRequestError("Leave your current party first.");
        let code: string;
        do {
            code = randomBytes(3).toString("hex").toUpperCase();
        } while (this.parties.has(code));
        this.parties.set(code, { code, size, region, leaderId: id, members: new Map([[id, true]]) });
        this.playerParty.set(id, code);
    }
    joinParty(id: string, code: string) {
        this.assertIdle(id);
        if (this.party(id)) throw new RankedRequestError("Leave your current party first.");
        const party = this.parties.get(code.trim().toUpperCase());
        if (!party) throw new RankedRequestError("Party code not found.");
        if (this.ticket(party.leaderId) || this.active(party.leaderId) || this.playerMatch.has(party.leaderId)) {
            throw new RankedRequestError("That party is already queued or playing.");
        }
        if (party.members.size >= party.size) throw new RankedRequestError("That party is full.");
        party.members.set(id, false);
        this.playerParty.set(id, party.code);
    }
    leaveParty(id: string) {
        this.assertIdle(id);
        this.removePartyMember(id);
    }
    private removePartyMember(id: string) {
        const party = this.party(id);
        if (!party) return;
        party.members.delete(id);
        this.playerParty.delete(id);
        if (!party.members.size) this.parties.delete(party.code);
        else if (party.leaderId === id) party.leaderId = party.members.keys().next().value!;
    }
    resizeParty(id: string, size: DuelSize) {
        this.assertIdle(id);
        const party = this.party(id);
        if (!party) throw new RankedRequestError("Join a party first.");
        if (party.leaderId !== id) throw new RankedRequestError("Only the party leader can change the party size.");
        for (const member of party.members.keys()) this.assertIdle(member);
        if (size === 1) throw new RankedRequestError("1v1 uses the solo queue.");
        if (party.members.size > size) {
            throw new RankedRequestError("The selected mode has fewer places than your current party members.");
        }
        party.size = size;
        for (const member of party.members.keys()) party.members.set(member, member === party.leaderId);
    }
    disbandParty(id: string) {
        this.assertIdle(id);
        const party = this.party(id);
        if (!party) return;
        if (party.leaderId !== id) throw new RankedRequestError("Only the party leader can disband the party.");
        for (const member of party.members.keys()) this.assertIdle(member);
        for (const member of party.members.keys()) this.playerParty.delete(member);
        this.parties.delete(party.code);
    }
    ready(id: string, ready: boolean) {
        this.assertIdle(id);
        if (ready) this.assertCanQueue(id);
        const party = this.party(id);
        if (!party) throw new RankedRequestError("Join a party first.");
        party.members.set(id, ready);
    }
    joinQueue(id: string, size: DuelSize, region = "local") {
        this.assertIdle(id);
        const party = this.party(id);
        const ids = party ? [...party.members.keys()] : [id];
        if (party) {
            if (party.leaderId !== id) throw new RankedRequestError("Your party leader starts the queue.");
            if (party.size !== size) throw new RankedRequestError(`This party is set to ${party.size}v${party.size}.`);
            region = party.region;
            if ([...party.members.values()].some(ready => !ready)) {
                throw new RankedRequestError("Every party member must be ready.");
            }
        }
        for (const player of ids) {
            this.assertIdle(player);
            this.assertCanQueue(player);
            if (this.now() - (this.presence.get(player)?.at ?? 0) > 25000) {
                throw new RankedRequestError("A party member is offline. Ask them to reopen Ranked Duels.");
            }
            this.notices.delete(player);
        }
        this.tickets.push({ id: randomUUID(), size, region, players: ids, joinedAt: this.now() });
        this.matchmake();
    }
    leaveQueue(id: string) {
        const ticket = this.ticket(id);
        if (!ticket) return;
        this.tickets = this.tickets.filter(t => t !== ticket);
        this.notify(ticket.players, "Queue cancelled. Your rating is unchanged.");
    }

    // Parties are indivisible. Prefer the oldest ticket that can fill a match,
    // leaving an incompatible party queued without blocking other complete teams.
    private findPair(size: DuelSize, region: string): [Ticket[], Ticket[]] | null {
        const all = this.tickets.filter(t => t.size === size && t.region === region);
        const totals = new Map(all.map(ticket => [
            ticket.id,
            ticket.players.reduce((sum, id) => sum + this.rating(id, size), 0),
        ]));
        const total = (tickets: Ticket[]) => tickets.reduce((sum, ticket) => sum + totals.get(ticket.id)!, 0);
        for (const [anchorIndex, anchor] of all.entries()) {
            const center = totals.get(anchor.id)! / anchor.players.length;
            const candidates = all.slice(anchorIndex + 1).filter(t =>
                Math.abs(totals.get(t.id)! / t.players.length - center) <= this.range(anchor)
            )
                .slice(0, 13);
            let best: [Ticket[], Ticket[]] | null = null;
            let difference = Infinity;
            const search = (index: number, a: Ticket[], b: Ticket[], ac: number, bc: number) => {
                if (ac === size && bc === size) {
                    const diff = Math.abs(total(a) - total(b)) / size;
                    if (diff < difference) {
                        difference = diff;
                        best = [[...a], [...b]];
                    }
                    return;
                }
                if (index >= candidates.length || difference === 0) return;
                if (candidates.slice(index).reduce((n, t) => n + t.players.length, 0) < 2 * size - ac - bc) return;
                const ticket = candidates[index];
                const count = ticket.players.length;
                if (ac + count <= size) search(index + 1, [...a, ticket], b, ac + count, bc);
                if (bc + count <= size) search(index + 1, a, [...b, ticket], ac, bc + count);
                search(index + 1, a, b, ac, bc);
            };
            search(0, [anchor], [], anchor.players.length, 0);
            if (best) return best;
        }
        return null;
    }
    private matchmake() {
        for (const size of [1, 2, 3, 4] as DuelSize[]) {
            for (const region of new Set(this.tickets.filter(t => t.size === size).map(t => t.region))) {
                let pair: [Ticket[], Ticket[]] | null;
                while ((pair = this.findPair(size, region))) {
                    const matched = new Set(pair.flat().map(t => t.id));
                    this.tickets = this.tickets.filter(t => !matched.has(t.id));
                    const teams: [string[], string[]] = [
                        pair[0].flatMap(t => t.players),
                        pair[1].flatMap(t => t.players),
                    ];
                    const series: Series = {
                        id: randomUUID(),
                        size,
                        region,
                        teams,
                        parties: Object.fromEntries(
                            pair.flat().filter(ticket => ticket.players.length > 1)
                                .flatMap(ticket => ticket.players.map(id => [id, ticket.id])),
                        ),
                        combat: new Map(),
                        roundRosters: new Map(),
                        score: [0, 0],
                        round: 0,
                        roundId: "",
                        gameId: "",
                        createdAt: this.now(),
                        roundCreatedAt: this.now(),
                        status: "connecting",
                        connected: 0,
                        startsAt: null,
                        nextRoundAt: null,
                        urls: [],
                        tokens: new Map(),
                        reports: new Set(),
                        result: null,
                        started: false,
                        launchPending: false,
                        draws: 0,
                        before: new Map(teams.flat().map(id => [id, this.rating(id, size)])),
                        forfeits: new Map(),
                        pendingRemovals: new Set(),
                    };
                    this.matches.set(series.id, { series, accepted: new Set(), deadline: this.now() + 30000 });
                    for (const id of teams.flat()) this.playerMatch.set(id, series.id);
                }
            }
        }
    }
    private cancelMatch(match: PendingMatch, noShows: string[]) {
        const messages = new Map(noShows.map(id => [id, this.store.recordNoShow(match.series.id, id, this.now())]));
        this.matches.delete(match.series.id);
        for (const id of match.series.teams.flat()) {
            this.playerMatch.delete(id);
            this.notices.set(
                id,
                messages.get(id) ?? "Match cancelled because a player did not accept. Your rating is unchanged.",
            );
        }
        for (const id of noShows) this.party(id)?.members.set(id, false);
    }
    acceptMatch(id: string, matchId: string) {
        const match = this.matches.get(this.playerMatch.get(id) ?? "");
        if (!match || match.series.id !== matchId) {
            throw new RankedRequestError("That match is no longer waiting for acceptance.");
        }
        if (this.now() >= match.deadline) {
            this.cancelMatch(match, match.series.teams.flat().filter(player => !match.accepted.has(player)));
            return;
        }
        match.accepted.add(id);
        if (match.accepted.size !== match.series.size * 2) return;
        const series = match.series;
        try {
            this.store.beginSeries(
                series.id,
                series.size,
                series.teams,
                series.parties,
                Object.fromEntries(series.before),
            );
        } catch (error) {
            this.matches.delete(series.id);
            for (const player of series.teams.flat()) this.playerMatch.delete(player);
            this.notify(series.teams.flat(), "The server could not prepare the match. No rating or cooldown changed.");
            throw error;
        }
        this.matches.delete(series.id);
        this.series.set(series.id, series);
        for (const player of series.teams.flat()) {
            this.playerMatch.delete(player);
            this.playerSeries.set(player, series.id);
        }
        void this.launchRound(series);
    }
    declineMatch(id: string, matchId: string) {
        const match = this.matches.get(this.playerMatch.get(id) ?? "");
        if (!match || match.series.id !== matchId) return;
        if (this.now() >= match.deadline) {
            this.cancelMatch(
                match,
                match.series.teams.flat().filter(player => !match.accepted.has(player)),
            );
        } else this.cancelMatch(match, [id]);
    }
    private async launchRound(series: Series) {
        if (series.launchPending || series.result) return;
        series.launchPending = true;
        series.round++;
        series.roundId = randomUUID();
        series.gameId = "";
        series.roundCreatedAt = this.now();
        series.finishedSeenAt = undefined;
        series.status = "connecting";
        series.connected = 0;
        series.startsAt = null;
        series.nextRoundAt = null;
        series.urls = [];
        series.tokens = new Map(
            series.teams.flat().filter(id => !series.forfeits.has(id)).map(id => [id, randomUUID()]),
        );
        series.roundRosters.set(series.roundId, [...series.tokens.keys()]);
        try {
            const allocation = await this.host.create({
                seriesId: series.id,
                roundId: series.roundId,
                round: series.round,
                teamSize: series.size,
                region: series.region,
                players: series.teams.flatMap((team, teamIndex) =>
                    team.filter(id => !series.forfeits.has(id)).map(id => ({
                        id,
                        name: this.profile(id).name,
                        ip: this.presence.get(id)?.ip ?? "127.0.0.1",
                        team: teamIndex as DuelTeam,
                        joinToken: series.tokens.get(id)!,
                    }))
                ),
            });
            if (!series.result) {
                series.gameId = allocation.gameId;
                series.urls = allocation.urls;
                for (const id of series.forfeits.keys()) {
                    if (this.host.removePlayer) {
                        series.pendingRemovals.add(id);
                        this.removeFromArena(series, id);
                    }
                }
            } else this.stopArena(series);
        } catch (error) {
            console.error("Ranked round could not start:", error);
            this.cancel(series, "The game server could not start the round. No rating changed.");
        } finally {
            series.launchPending = false;
            this.finishEmptyTeam(series);
        }
    }
    private mergeCombat(series: Series, snapshot?: DuelCombatSnapshot) {
        if (
            !snapshot || snapshot.seriesId !== series.id || snapshot.roundId !== series.roundId
            || snapshot.round !== series.round || (series.gameId && snapshot.gameId !== series.gameId)
        ) return;
        const roster = series.roundRosters.get(snapshot.roundId)!;
        if (
            snapshot.players.length !== roster.length
            || new Set(snapshot.players.map(player => player.profileId)).size !== snapshot.players.length
            || snapshot.players.some(player =>
                !roster.includes(player.profileId)
                || !Number.isSafeInteger(player.kills) || player.kills < 0 || !Number.isFinite(player.damageDealt)
                || player.damageDealt < 0
                || !Number.isSafeInteger(player.roundWins) || player.roundWins < 0 || player.roundWins > 1
            )
        ) {
            throw new RankedRequestError("Invalid ranked combat snapshot.");
        }
        const round = series.combat.get(snapshot.roundId) ?? new Map<string, DuelCombatStats>();
        for (const player of snapshot.players) {
            const current = round.get(player.profileId);
            round.set(player.profileId, {
                profileId: player.profileId,
                kills: Math.max(current?.kills ?? 0, player.kills),
                damageDealt: Math.max(current?.damageDealt ?? 0, player.damageDealt),
                roundWins: Math.max(current?.roundWins ?? 0, player.roundWins),
            });
        }
        series.combat.set(snapshot.roundId, round);
    }
    private stopArena(series: Series) {
        if (this.host.cancel) {
            void this.host.cancel(series.id, series.roundId, series.region).then(() => series.pendingRemovals.clear())
                .catch(error => console.error("Duel cleanup:", error));
        }
    }
    private cancel(series: Series, reason: string) {
        if (series.result) return;
        if (series.forfeits.size) {
            reason = `${
                reason.replace(/(?:No rating changed\.|no rating changed\.)/g, "").trim()
            } Personal forfeit penalties remain applied.`;
        }
        series.status = "cancelled";
        series.result = { winnerTeam: null, reason };
        series.urls = [];
        series.nextRoundAt = null;
        this.stopArena(series);
    }
    private finish(series: Series, winner: DuelTeam, reason: string) {
        if (series.result) return;
        // The store commits all ratings and the result in one atomic operation.
        this.store.settleSeries(
            series.id,
            series.size,
            series.teams,
            winner,
            series.score,
            reason,
            Object.fromEntries(series.before),
            this.combatTotals(series),
        );
        series.settled = true;
        series.status = "complete";
        series.result = { winnerTeam: winner, reason };
        series.urls = [];
        series.nextRoundAt = null;
        this.stopArena(series);
    }
    private combatTotals(series: Series): DuelCombatStats[] | undefined {
        // A mixed-version or interrupted report stream must not label a partial series total as complete.
        for (const [roundId, roster] of series.roundRosters) {
            const round = series.combat.get(roundId);
            if (!round || roster.some(id => !round.has(id))) return undefined;
        }
        const totals: DuelCombatStats[] = [];
        for (const profileId of series.teams.flat()) {
            const stats = [...series.combat.values()].flatMap(round =>
                round.has(profileId) ? [round.get(profileId)!] : []
            );
            // Missing legacy telemetry is unavailable, not a fabricated zero-score player.
            if (!stats.length) return undefined;
            totals.push({
                profileId,
                kills: stats.reduce((sum, player) => sum + player.kills, 0),
                damageDealt: stats.reduce((sum, player) => sum + player.damageDealt, 0),
                roundWins: stats.reduce((sum, player) => sum + player.roundWins, 0),
            });
        }
        return totals;
    }
    roundResult(report: RoundReport) {
        const series = this.series.get(report.seriesId);
        if (
            !series || series.result || series.roundId !== report.roundId || series.round !== report.round
            || series.gameId !== report.gameId || series.reports.has(report.roundId)
        ) return false;
        if (!report.started && report.reason !== "connection_timeout") {
            throw new RankedRequestError("A round cannot finish before it starts.");
        }
        this.mergeCombat(series, report.combat);
        if (report.abandonedProfileIds?.length) {
            if (
                (!series.started && !report.started)
                || report.abandonedProfileIds.some(id => !series.teams.flat().includes(id))
            ) {
                throw new RankedRequestError("Invalid abandoned player report.");
            }
            series.started ||= report.started;
            for (const id of report.abandonedProfileIds) {
                this.forfeitPlayer(series, id, "Connection lost. Personal forfeit penalty applied.", false);
            }
            if (this.finishEmptyTeam(series)) {
                series.reports.add(report.roundId);
                return true;
            }
        }
        const previousScore: [number, number] = [...series.score];
        try {
            if (report.reason === "connection_timeout") {
                if (report.round === 1 && !series.started && !report.started && report.missingProfileIds?.length) {
                    if (
                        report.missingProfileIds.some(id =>
                            !series.teams.flat().includes(id) || series.forfeits.has(id)
                        )
                    ) {
                        throw new RankedRequestError("Invalid missing player report.");
                    }
                    for (const id of new Set(report.missingProfileIds)) {
                        this.notices.set(id, this.store.recordNoShow(series.id, id, this.now()));
                        this.party(id)?.members.set(id, false);
                    }
                }
                if (series.started && report.missingTeams?.length === 1) {
                    const winner = (1 - report.missingTeams[0]) as DuelTeam;
                    series.score[winner] = 5;
                    this.finish(series, winner, "Opponent did not reconnect for the next round.");
                } else this.cancel(series, "Not every player connected. Series cancelled; no rating changed.");
            } else if (report.winnerTeam !== null) {
                series.started = true;
                series.score[report.winnerTeam]++;
                if (series.score[report.winnerTeam] >= 5) {
                    this.finish(
                        series,
                        report.winnerTeam,
                        report.reason === "disconnect" ? "Opponent disconnected." : "First to five rounds.",
                    );
                } else {
                    series.status = "intermission";
                    series.urls = [];
                    series.nextRoundAt = this.now() + 7000;
                }
            } else {
                series.draws++;
                if (series.draws >= 3) this.cancel(series, "Three drawn rounds. Series cancelled; no rating changed.");
                else {
                    series.status = "intermission";
                    series.urls = [];
                    series.nextRoundAt = this.now() + 7000;
                }
            }
            series.reports.add(report.roundId);
            return true;
        } catch (error) {
            series.score = previousScore;
            throw error;
        }
    }
    forfeit(id: string) {
        const series = this.active(id);
        if (!series || series.result) return;
        if (series.forfeits.has(id)) {
            this.finishEmptyTeam(series);
            return;
        }
        if (series.finishedSeenAt && series.status !== "intermission") {
            throw new RankedRequestError("The round result is being confirmed. Please wait a moment.");
        }
        const removal = this.forfeitPlayer(
            series,
            id,
            "You forfeited the series. Personal forfeit penalty applied.",
            true,
        );
        if (removal) {
            return removal.then(() => {
                this.finishEmptyTeam(series);
            });
        }
        this.finishEmptyTeam(series);
    }
    private forfeitPlayer(series: Series, id: string, reason: string, removeFromArena: boolean) {
        if (series.forfeits.has(id)) return;
        const penalty = this.store.recordForfeit(
            series.id,
            series.size,
            series.teams,
            id,
            reason,
            Object.fromEntries(series.before),
            this.now(),
        );
        series.forfeits.set(id, penalty);
        series.tokens.delete(id);
        this.removePartyMember(id);
        if (removeFromArena && this.host.removePlayer) {
            series.pendingRemovals.add(id);
            return this.removeFromArena(series, id);
        }
    }
    private async removeFromArena(series: Series, id: string) {
        try {
            const combat = await this.host.removePlayer?.(series.id, series.roundId, id, series.region);
            if (combat) this.mergeCombat(series, combat);
            series.pendingRemovals.delete(id);
            this.finishEmptyTeam(series);
        } catch (error) {
            console.error("Duel player removal will be retried:", error);
        }
    }
    private finishEmptyTeam(series: Series) {
        if (series.result) return true;
        if (series.pendingRemovals.size || series.launchPending) return false;
        const remaining = series.teams.map(team => team.filter(id => !series.forfeits.has(id)).length);
        if (remaining.every(count => count > 0)) return false;
        if (remaining.every(count => count === 0)) {
            this.cancel(series, "Every player left. Personal forfeit penalties remain applied.");
        } else {
            const winner: DuelTeam = remaining[0] > 0 ? 0 : 1;
            const previousScore: [number, number] = [...series.score];
            series.score[winner] = 5;
            try {
                this.finish(series, winner, "All opponents forfeited the series.");
            } catch (error) {
                series.score = previousScore;
                throw error;
            }
        }
        return true;
    }
    playerAbandoned(report: PlayerAbandonedReport) {
        const series = this.series.get(report.seriesId);
        const abandoned = report.abandonedProfileIds ?? [report.profileId];
        if (
            !series || series.result || series.roundId !== report.roundId || series.round !== report.round
            || series.gameId !== report.gameId || !abandoned.includes(report.profileId)
            || abandoned.some(id => !series.teams.flat().includes(id))
        ) return false;
        this.mergeCombat(series, report.combat);
        // Only the authenticated game server reports abandonment after play or on a later reconnect.
        series.started = true;
        for (const id of abandoned) {
            this.forfeitPlayer(series, id, "Connection lost. Personal forfeit penalty applied.", false);
        }
        this.finishEmptyTeam(series);
        return true;
    }
    acknowledge(id: string) {
        const series = this.active(id);
        if (series && !series.result && !series.forfeits.has(id)) {
            throw new RankedRequestError("The series is still in progress.");
        }
        if (series?.pendingRemovals.has(id) || (series?.forfeits.has(id) && series.launchPending)) {
            throw new RankedRequestError("Your arena connection is closing. Please try again in a moment.");
        }
        this.playerSeries.delete(id);
        if (series && !series.teams.flat().some(player => this.playerSeries.get(player) === series.id)) {
            this.series.delete(series.id);
        }
        this.notices.delete(id);
    }
    state(id: string): RankedState {
        const profile = this.profile(id);
        const party = this.party(id);
        const ticket = this.ticket(id);
        const series = this.active(id);
        const match = this.matches.get(this.playerMatch.get(id) ?? "");
        const teamIndex: DuelTeam = series?.teams[1].includes(id) ? 1 : 0;
        const rating = series ? profile.ratings[series.size].elo : 0;
        const forfeit = series?.forfeits.get(id);
        const savedResult = series?.settled ? this.store.getSeriesResult(series.id) : undefined;
        const savedChange = savedResult?.ratingChanges.find(change => change.profileId === id);
        return {
            profile,
            history: this.store.history(id),
            notice: this.notices.get(id) ?? null,
            cooldown: this.store.queueCooldown(id, this.now()),
            match: match
                ? {
                    id: match.series.id,
                    size: match.series.size,
                    region: match.series.region,
                    accepted: match.accepted.has(id),
                    acceptedCount: match.accepted.size,
                    total: match.series.size * 2,
                    deadline: match.deadline,
                }
                : null,
            party: party
                ? {
                    code: party.code,
                    size: party.size,
                    region: party.region,
                    leaderId: party.leaderId,
                    members: [...party.members].map(([player, ready]) => ({
                        id: player,
                        name: this.profile(player).name,
                        ready,
                        rating: this.profile(player).ratings[party.size],
                        cooldown: this.store.queueCooldown(player, this.now()),
                    })),
                }
                : null,
            queue: ticket
                ? {
                    size: ticket.size,
                    region: ticket.region,
                    joinedAt: ticket.joinedAt,
                    total: ticket.size * 2,
                    players: this.tickets.filter(t => t.size === ticket.size && t.region === ticket.region).reduce(
                        (n, t) => n + t.players.length,
                        0,
                    ),
                    ratingRange: this.range(ticket),
                }
                : null,
            series: series
                ? {
                    id: series.id,
                    size: series.size,
                    region: series.region,
                    firstTo: 5,
                    teamIndex,
                    teams: series.teams.map(team =>
                        team.map(player => ({
                            id: player,
                            name: this.store.getProfile(player)?.name ?? "Deleted Player",
                        }))
                    ) as NonNullable<RankedState["series"]>["teams"],
                    forfeitedIds: [...series.forfeits.keys()],
                    personalForfeit: !!forfeit,
                    scoreboard: savedResult?.scoreboard ?? null,
                    score: [...series.score],
                    round: series.round,
                    status: series.status,
                    connected: series.connected,
                    total: series.size * 2 - series.forfeits.size,
                    startsAt: series.startsAt,
                    nextRoundAt: series.nextRoundAt,
                    join: series.urls.length && !forfeit
                        ? { urls: series.urls, joinToken: series.tokens.get(id)! }
                        : null,
                    result: forfeit
                        ? {
                            winnerTeam: (1 - teamIndex) as DuelTeam,
                            before: forfeit.before,
                            after: forfeit.after,
                            delta: forfeit.delta,
                            reason: forfeit.reason,
                        }
                        : series.result
                        ? {
                            ...series.result,
                            before: savedChange?.before ?? series.before.get(id)!,
                            after: savedChange?.after ?? rating,
                            delta: savedChange?.delta ?? rating - series.before.get(id)!,
                        }
                        : null,
                }
                : null,
        };
    }
    tick(): Promise<void> {
        // HTTP actions must await the same fresh state as the background poll.
        this.ticking ??= this.update().finally(() => {
            this.ticking = undefined;
        });
        return this.ticking;
    }
    private async update() {
        for (const match of this.matches.values()) {
            if (this.now() >= match.deadline) {
                this.cancelMatch(
                    match,
                    match.series.teams.flat().filter(id => !match.accepted.has(id)),
                );
            }
        }
        const expired = this.tickets.filter(t =>
            t.players.some(id => this.now() - (this.presence.get(id)?.at ?? 0) > 25000)
        );
        for (const ticket of expired) {
            this.tickets = this.tickets.filter(t => t !== ticket);
            this.notify(ticket.players, "Queue ended because a player went offline. Your rating is unchanged.");
        }
        this.matchmake();
        for (const series of this.series.values()) {
            for (const id of series.pendingRemovals) this.removeFromArena(series, id);
        }
        const active = [...this.series.values()].filter(s => !s.result);
        if (active.length) {
            let progress: RoundProgress[] = [];
            try {
                progress = await this.host.progress([...new Set(active.map(s => s.region))]);
            } catch { /* Watchdog below handles prolonged outages. */ }
            for (const series of active) {
                if (series.result) continue;
                if (this.finishEmptyTeam(series)) continue;
                const round = progress.find(p => p.gameId === series.gameId);
                if (round && ["connecting", "countdown", "playing"].includes(series.status)) {
                    series.connected = round.connected;
                    series.startsAt = round.countdownEndsAt ?? null;
                    if (round.phase !== "finished") series.status = round.phase;
                    if (round.phase === "playing") series.started = true;
                    if (round.phase === "finished") series.finishedSeenAt ??= this.now();
                }
                if (series.nextRoundAt !== null && this.now() >= series.nextRoundAt) void this.launchRound(series);
                if (
                    !round && !series.launchPending && series.status !== "intermission"
                    && this.now() - series.roundCreatedAt > 80000
                ) this.cancel(series, "The game server stopped responding. No rating changed.");
                if (
                    series.finishedSeenAt && this.now() - series.finishedSeenAt > 65000
                    && series.status !== "intermission"
                ) this.cancel(series, "The round result could not be confirmed. No rating changed.");
                if (this.now() - series.roundCreatedAt > 10 * 60 * 1000) {
                    this.cancel(series, "The round exceeded its time limit. No rating changed.");
                }
            }
        }
    }
}
