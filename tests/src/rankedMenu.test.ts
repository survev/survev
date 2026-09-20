import { afterEach, describe, expect, it, vi } from "vitest";
import type { DuelSize, RankedHistory, RankedProfile, RankedState } from "../../shared/types/ranked.ts";

vi.mock("../../client/src/api.ts", () => ({ api: { resolveUrl: (path: string) => path } }));
vi.mock("../../client/src/helpers.ts", () => ({
    helpers: { htmlEscape: (text: string) => text, abortSignal: () => undefined },
}));

// Load the actual controller without pulling the browser application's type graph into the server test project.
const { RankedMenu } = await vi.importActual<{ RankedMenu: { prototype: Controller } }>(
    "../../client/src/ui/rankedMenu.ts",
);

interface Controller {
    state: RankedState | null;
    size: DuelSize;
    browseSize: DuelSize;
    tab: string;
    nativeSession: boolean;
    sessionChecked: boolean;
    opened: boolean;
    busy: boolean;
    error: string;
    history: RankedHistory[];
    joinKey: string;
    retryAt: number;
    forfeitConfirm: boolean;
    disbandConfirm: boolean;
    request: ReturnType<typeof vi.fn>;
    render: ReturnType<typeof vi.fn>;
    renderSeries: ReturnType<typeof vi.fn>;
    poll: (force?: boolean) => Promise<void>;
    refreshSession: () => Promise<void>;
    mutate: (path: string, body?: unknown) => Promise<RankedState | undefined>;
    applyState: (state: RankedState) => void;
    handleClick: (event: unknown) => void;
    open: () => void;
    activeSeries: () => RankedState["series"];
    isBusy: () => boolean;
    selectedSize: () => DuelSize;
    renderPlay: () => string;
    statusMessage: () => string;
    loadHistory: () => Promise<void>;
    onGameQuit: () => boolean;
    app: ReturnType<typeof application>;
    root: { hidden: boolean; contains: () => boolean; querySelector: ReturnType<typeof vi.fn> };
}

function profile(id = "player"): RankedProfile {
    const rating = { elo: 1000, wins: 0, losses: 0, played: 0, streak: 0, tier: "Silver", placementsRemaining: 5 };
    return { id, name: id, ratings: { 1: { ...rating }, 2: { ...rating }, 3: { ...rating }, 4: { ...rating } } };
}

function state(): RankedState {
    return {
        profile: profile(),
        history: [],
        notice: null,
        cooldown: null,
        match: null,
        queue: null,
        party: null,
        series: null,
    };
}

function series(): NonNullable<RankedState["series"]> {
    return {
        id: "series",
        size: 2,
        region: "local",
        firstTo: 5,
        teamIndex: 0,
        teams: [[{ id: "player", name: "Player" }, { id: "friend", name: "Friend" }], [{
            id: "opponent",
            name: "Opponent",
        }, { id: "other", name: "Other" }]],
        forfeitedIds: [],
        personalForfeit: false,
        scoreboard: null,
        score: [0, 0],
        round: 1,
        status: "playing",
        connected: 4,
        total: 4,
        startsAt: null,
        nextRoundAt: null,
        join: { urls: ["ws://example.invalid/play"], joinToken: "test" },
        result: null,
    };
}

function application() {
    return {
        input: { onWindowFocus: vi.fn() },
        config: { set: vi.fn(), get: vi.fn(() => "local") },
        serverSelect: { val: vi.fn(() => "local") },
        nameInput: { val: vi.fn() },
        teamMenu: { leave: vi.fn() },
        game: { initialized: false, connecting: false, connected: false, m_gameOver: false, onQuit: vi.fn() },
        joinGame: vi.fn(),
    };
}

function menu(initial: RankedState | null = state()): Controller {
    return Object.assign(Object.create(RankedMenu.prototype), {
        state: initial,
        size: 1,
        browseSize: 1,
        tab: "play",
        nativeSession: !!initial,
        sessionChecked: true,
        checkingSession: false,
        opened: false,
        busy: false,
        polling: false,
        stateVersion: 0,
        joinKey: "",
        retryAt: 0,
        transition: false,
        forfeitConfirm: false,
        disbandConfirm: false,
        error: "",
        history: [],
        historyLoading: false,
        leaderboard: [],
        leaderboardLoading: false,
        app: application(),
        root: { hidden: true, contains: () => false, querySelector: vi.fn() },
        render: vi.fn(),
        renderSeries: vi.fn(),
        request: vi.fn(),
    });
}

function click(controller: Controller, dataset: Record<string, string>) {
    const button = { dataset, disabled: false };
    controller.handleClick({ target: { closest: () => button } });
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => resolve = done);
    return { promise, resolve };
}

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("ranked menu session and match lifecycle", () => {
    it("keeps a login refresh that arrives during the initial signed-out session request", async () => {
        const controller = menu(null);
        const firstSession = deferred<{ nativeAccounts: boolean; profile: RankedProfile | null }>();
        controller.request.mockReturnValueOnce(firstSession.promise)
            .mockResolvedValueOnce({ nativeAccounts: true, profile: profile() });
        controller.poll = vi.fn().mockResolvedValue(undefined);
        const initial = controller.refreshSession();
        void controller.refreshSession();
        firstSession.resolve({ nativeAccounts: true, profile: null });
        await initial;
        await vi.waitFor(() => expect(controller.nativeSession).toBe(true), { timeout: 100 });
        expect(controller.request).toHaveBeenCalledTimes(2);
    });

    it("ignores a stale poll when accepting a match changes the state", async () => {
        const controller = menu();
        controller.opened = true;
        const oldState = deferred<RankedState>();
        const matched = state();
        matched.match = {
            id: "proposal",
            size: 2,
            region: "local",
            accepted: true,
            acceptedCount: 1,
            total: 4,
            deadline: Date.now() + 30000,
        };
        controller.request.mockReturnValueOnce(oldState.promise).mockResolvedValueOnce(matched);
        const poll = controller.poll();
        await controller.mutate("match/accept", { matchId: "proposal" });
        oldState.resolve(state());
        await poll;
        expect(controller.state?.match?.accepted).toBe(true);
        expect(controller.app.joinGame).not.toHaveBeenCalled();
    });

    it("keeps idle closed menus quiet but restores and maintains an active queue", async () => {
        const controller = menu();
        controller.request.mockResolvedValue(state());
        await controller.poll();
        expect(controller.request).not.toHaveBeenCalled();
        await controller.poll(true);
        expect(controller.request).toHaveBeenCalledTimes(1);
        controller.state!.queue = {
            size: 1,
            region: "local",
            players: 1,
            total: 2,
            joinedAt: Date.now(),
            ratingRange: 100,
        };
        await controller.poll();
        expect(controller.request).toHaveBeenCalledTimes(2);
    });

    it("waits for allocation before joining and rejects stale or expired accept clicks", async () => {
        const controller = menu();
        const matched = state();
        matched.match = {
            id: "proposal",
            size: 2,
            region: "local",
            accepted: false,
            acceptedCount: 0,
            total: 4,
            deadline: Date.now() + 30000,
        };
        controller.applyState(matched);
        expect(controller.isBusy()).toBe(true);
        expect(controller.app.joinGame).not.toHaveBeenCalled();
        click(controller, { action: "match-accept", matchId: "old-proposal" });
        expect(controller.request).not.toHaveBeenCalled();
        const accepted = structuredClone(matched);
        accepted.match!.accepted = true;
        controller.request.mockResolvedValue(accepted);
        click(controller, { action: "match-accept", matchId: "proposal" });
        await vi.waitFor(() => expect(controller.busy).toBe(false));
        expect(controller.request).toHaveBeenCalledWith("match/accept", { matchId: "proposal" });
        expect(controller.app.joinGame).not.toHaveBeenCalled();
        controller.state!.match!.deadline = Date.now() - 1;
        click(controller, { action: "match-decline", matchId: "proposal" });
        expect(controller.request).toHaveBeenCalledTimes(1);
        const allocated = state();
        allocated.series = series();
        controller.applyState(allocated);
        controller.applyState(structuredClone(allocated));
        expect(controller.app.joinGame).toHaveBeenCalledExactlyOnceWith(allocated.series.join);
    });

    it("disconnects a personal forfeiter without joining subsequent rounds", () => {
        const controller = menu();
        controller.state!.series = series();
        controller.joinKey = "series:1";
        controller.app.game.initialized = true;
        const departure = state();
        departure.series = { ...series(), personalForfeit: true, forfeitedIds: ["player"], join: null };
        controller.applyState(departure);
        expect(controller.app.input.onWindowFocus).toHaveBeenCalledOnce();
        expect(controller.app.game.onQuit).toHaveBeenCalledOnce();
        expect(controller.activeSeries()).toBeNull();
        departure.series.round++;
        controller.applyState(departure);
        expect(controller.app.joinGame).not.toHaveBeenCalled();
        expect(controller.onGameQuit()).toBe(true);
    });

    it("continues the next round for teammates who remain after a forfeit", () => {
        const controller = menu();
        controller.state!.series = series();
        controller.joinKey = "series:1";
        const next = state();
        next.series = { ...series(), round: 2, forfeitedIds: ["friend"] };
        controller.applyState(next);
        expect(controller.app.joinGame).toHaveBeenCalledExactlyOnceWith(next.series.join);
        expect(controller.activeSeries()?.round).toBe(2);
    });

    it("retains failed acknowledgement errors while the arena departure is pending", async () => {
        const controller = menu();
        controller.state!.series = { ...series(), personalForfeit: true, join: null };
        controller.request.mockRejectedValue(new Error("Waiting for arena removal."));
        await controller.mutate("series/ack");
        controller.applyState(structuredClone(controller.state!));
        expect(controller.error).toBe("Waiting for arena removal.");
    });

    it("does not allow the quit confirmation during a won-round celebration", () => {
        const controller = menu();
        controller.state!.series = series();
        controller.app.game.m_gameOver = true;
        click(controller, { action: "series-forfeit" });
        click(controller, { action: "forfeit-confirm" });
        expect(controller.forfeitConfirm).toBe(false);
        expect(controller.request).not.toHaveBeenCalled();
    });

    it("moves keyboard focus into a newly opened dialog", () => {
        const controller = menu();
        const focus = vi.fn();
        vi.stubGlobal("document", { activeElement: { id: "btn-ranked-duels" } });
        controller.root.querySelector.mockReturnValue({ focus });
        controller.refreshSession = vi.fn().mockResolvedValue(undefined);
        controller.open();
        expect(focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
    });
});

describe("ranked menu party and ladder controls", () => {
    it("keeps browsing filters independent from party size and captain-only resizing", async () => {
        const controller = menu();
        const joined = state();
        joined.party = {
            code: "PARTY",
            region: "local",
            size: 2,
            leaderId: "friend",
            members: [
                { id: "player", name: "Player", ready: true, rating: profile().ratings[2], cooldown: null },
                { id: "friend", name: "Friend", ready: true, rating: profile().ratings[2], cooldown: null },
            ],
        };
        controller.applyState(joined);
        click(controller, { size: "3" });
        expect(controller.request).not.toHaveBeenCalled();
        controller.tab = "history";
        controller.request.mockResolvedValue({ entries: [] });
        click(controller, { size: "4" });
        await vi.waitFor(() => expect(controller.request).toHaveBeenCalledWith("history?size=4"));
        controller.applyState(structuredClone(joined));
        expect(controller.selectedSize()).toBe(4);
        expect(controller.size).toBe(2);
    });

    it("loads the latest selected history when an older mode request finishes late", async () => {
        const controller = menu();
        controller.tab = "history";
        const firstHistory = deferred<{ entries: RankedHistory[] }>();
        controller.request.mockReturnValueOnce(firstHistory.promise).mockResolvedValueOnce({ entries: [] });
        const first = controller.loadHistory();
        controller.browseSize = 4;
        await controller.loadHistory();
        firstHistory.resolve({ entries: [{ size: 1 } as RankedHistory] });
        await first;
        await vi.waitFor(() => expect(controller.request).toHaveBeenCalledWith("history?size=4"));
        expect(controller.history).toEqual([]);
    });

    it("blocks a party queue until a restricted teammate can ready up", () => {
        const controller = menu();
        const cooldown = { until: Date.now() + 60000, seconds: 60, reason: "Repeated ready checks missed." };
        controller.size = 2;
        controller.state!.party = {
            code: "PARTY",
            region: "local",
            size: 2,
            leaderId: "player",
            members: [
                { id: "player", name: "Player", ready: false, rating: profile().ratings[2], cooldown },
            ],
        };
        expect(controller.renderPlay()).toMatch(/data-action="party-ready" disabled/);
        expect(controller.renderPlay()).toMatch(/data-action="queue" disabled/);
        expect(controller.renderPlay()).toContain("Repeated ready checks missed.");
    });

    it("shows an identical cooldown reason once while preserving errors and other tabs' notices", () => {
        const controller = menu();
        controller.state!.cooldown = {
            until: Date.now() + 60000,
            seconds: 60,
            reason: "Repeated ready checks missed.",
        };
        controller.state!.notice = controller.state!.cooldown.reason;
        expect(controller.statusMessage()).toBe("");
        controller.error = "Connection lost.";
        expect(controller.statusMessage()).toBe("Connection lost.");
        controller.error = "";
        controller.tab = "history";
        expect(controller.statusMessage()).toBe(controller.state!.notice);
        controller.tab = "play";
        controller.state!.notice = "Your teammate left the party.";
        expect(controller.statusMessage()).toBe("Your teammate left the party.");
    });
});
