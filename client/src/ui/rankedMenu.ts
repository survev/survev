import { getRankedTier, RankedTiers } from "../../../shared/defs/rankedDefs.ts";
import { RankedPlacementSeries } from "../../../shared/types/ranked.ts";
import type {
    DuelSize,
    RankedCooldown,
    RankedHistory,
    RankedLeaderboardEntry,
    RankedProfile,
    RankedRating,
    RankedState,
} from "../../../shared/types/ranked.ts";
import { api } from "../api.ts";
import { helpers } from "../helpers.ts";
import type { Application } from "../main.ts";
import "./ranked.css";

type RankedSeries = NonNullable<RankedState["series"]>;

export class RankedMenu {
    private root: HTMLDivElement;
    private hud: HTMLDivElement;
    private roundOverlay: HTMLDivElement;
    private state: RankedState | null = null;
    private size: DuelSize = 1;
    private browseSize: DuelSize = 1;
    private tab: "play" | "leaderboard" | "history" | "tiers" = "play";
    private nativeSession = false;
    private sessionChecked = false;
    private checkingSession = false;
    private sessionRefreshPending = false;
    private region = "";
    private opened = false;
    private busy = false;
    private polling = false;
    private stateVersion = 0;
    private joinKey = "";
    private retryAt = 0;
    private transition = false;
    private forfeitConfirm = false;
    private disbandConfirm = false;
    private error = "";
    private leaderboard: RankedLeaderboardEntry[] = [];
    private leaderboardLoading = false;
    private history: RankedHistory[] = [];
    private historyLoading = false;
    private summaryKey = "";
    private contentKey = "";
    private matchContentKey = "";
    private seriesContentKey = "";
    private lastFocus: HTMLElement | null = null;

    constructor(private app: Application) {
        this.region = String(app.serverSelect.val() ?? app.config.get("region") ?? "local");
        this.root = document.createElement("div");
        this.root.className = "ranked-root";
        this.root.hidden = true;
        this.root.innerHTML = `
            <section class="ranked-dialog" role="dialog" aria-modal="true" aria-labelledby="ranked-title">
                <header class="ranked-header">
                    <div>
                        <h1 id="ranked-title">Ranked Duels</h1>
                        <p>First to five rounds</p>
                    </div>
                    <button class="ranked-close" data-action="close" aria-label="Close ranked duels">×</button>
                </header>
                <div class="ranked-layout">
                    <main class="ranked-main">
                        <nav class="ranked-tabs" aria-label="Ranked sections" role="tablist">
                            <button class="ranked-tab" role="tab" data-tab="play" aria-selected="true">Play</button>
                            <button class="ranked-tab" role="tab" data-tab="leaderboard" aria-selected="false">Leaderboard</button>
                            <button class="ranked-tab" role="tab" data-tab="history" aria-selected="false">History</button>
                            <button class="ranked-tab" role="tab" data-tab="tiers" aria-selected="false">Tiers</button>
                        </nav>
                        <div class="ranked-modes" aria-label="Team size">
                            ${
            ([1, 2, 3, 4] as const).map(size =>
                `<button class="ranked-mode" data-size="${size}" aria-pressed="${
                    size === 1
                }"><strong>${size}v${size}</strong></button>`
            ).join("")
        }
                        </div>
                        <div class="ranked-region-row"><label for="ranked-region">Region</label><select id="ranked-region" aria-label="Matchmaking region"></select></div>
                        <div class="ranked-summary" id="ranked-summary"></div><div id="ranked-content" role="tabpanel"></div>
                    </main>

                </div>
                <div class="ranked-error" id="ranked-error" role="status" aria-live="polite"></div>
            </section>`;
        this.hud = document.createElement("div");
        this.hud.className = "ranked-hud";
        this.hud.hidden = true;
        this.roundOverlay = document.createElement("div");
        this.roundOverlay.className = "ranked-round-overlay";
        this.roundOverlay.hidden = true;
        document.body.append(this.root, this.hud, this.roundOverlay);
        const updateHudPosition = () => this.positionHud();
        window.addEventListener("resize", updateHudPosition);
        const hudObserver = new MutationObserver(updateHudPosition);
        for (const id of ["ui-top-center-scopes-wrapper", "ui-top-center"]) {
            const element = document.getElementById(id);
            if (element) hudObserver.observe(element, { attributes: true, subtree: true });
        }
        const gameUi = document.getElementById("ui-game");
        if (gameUi) hudObserver.observe(gameUi, { attributes: true });
        // Modal controls must not also become game movement, shots or touch gestures.
        for (const element of [this.root, this.roundOverlay]) {
            for (
                const type of [
                    "keydown",
                    "keyup",
                    "mousedown",
                    "mouseup",
                    "touchstart",
                    "touchend",
                    "touchmove",
                    "touchcancel",
                ]
            ) {
                element.addEventListener(type, event => event.stopPropagation());
            }
        }
        document.getElementById("btn-ranked-duels")?.addEventListener("click", () => this.open());
        document.getElementById("btn-ranked-duels")?.addEventListener("mousedown", event => event.preventDefault());
        document.getElementById("btn-ranked-duels")?.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.open();
            }
        });
        this.root.addEventListener("click", event => this.handleClick(event));
        this.roundOverlay.addEventListener("click", event => this.handleClick(event));
        this.roundOverlay.addEventListener("keydown", event => {
            if (event.key === "Tab") this.trapFocus(event, this.roundOverlay);
        });
        this.root.addEventListener("change", event => {
            if ((event.target as HTMLElement).id === "ranked-region" && !this.isBusy()) {
                this.region = (event.target as HTMLSelectElement).value;
                this.app.serverSelect.val(this.region);
                this.app.config.set("region", this.region);
                this.render();
            }
        });
        this.root.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                event.preventDefault();
                this.close();
            }
            if (event.key === "Enter" && (event.target as HTMLElement).id === "ranked-party-input") {
                event.preventDefault();
                void this.joinParty();
            }
            if (event.key === "Tab") this.trapFocus(event);
        });
        // The normal quit buttons remain useful, but ranked departure needs its own consequence shown.
        document.addEventListener("click", event => {
            const button = (event.target as Element)?.closest?.("#btn-game-quit, #btn-spectate-quit");
            if (button && this.activeSeries()) {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (this.celebratingRound()) return;
                this.forfeitConfirm = true;
                this.renderSeries();
            }
        }, true);
        this.app.account.addEventListener("login", () => {
            void this.refreshSession();
        });
        this.render();
        void this.refreshSession();
        window.setInterval(() => {
            this.renderClock();
            this.renderSeries();
            void this.poll();
        }, 1000);
    }

    isBusy() {
        return !!(this.state?.queue || this.state?.match || this.state?.party || this.activeSeries());
    }

    private activeSeries() {
        const series = this.state?.series;
        return series && !series.personalForfeit && series.status !== "complete" && series.status !== "cancelled"
            ? series
            : null;
    }

    private selectedSize() {
        return this.tab === "leaderboard" || this.tab === "history" ? this.browseSize : this.size;
    }

    private canChangePlaySize() {
        const state = this.state;
        return !this.busy && !state?.queue && !state?.match && !this.activeSeries()
            && (!state?.party || state.party.leaderId === state.profile.id);
    }

    private celebratingRound() {
        return this.state?.series?.status === "playing" && !!this.app.game?.m_gameOver;
    }

    open() {
        if (!this.opened) this.lastFocus = document.activeElement as HTMLElement;
        this.opened = true;
        if (!this.activeSeries()) this.root.hidden = false;
        if (!this.isBusy()) {
            this.region = String(this.app.serverSelect.val() ?? this.app.config.get("region") ?? this.region);
        }
        this.render();
        if (!this.root.hidden && !this.root.contains(document.activeElement)) {
            this.root.querySelector<HTMLElement>("[aria-selected='true']")?.focus({ preventScroll: true });
        }
        void this.refreshSession();
    }

    private close() {
        if (this.state?.queue || this.state?.match || this.activeSeries()) return;
        this.opened = false;
        this.disbandConfirm = false;
        this.root.hidden = true;
        this.lastFocus?.focus({ preventScroll: true });
    }

    private trapFocus(event: KeyboardEvent, container = this.root) {
        const focusable = Array.from(
            container.querySelectorAll<HTMLElement>(
                "button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex='0']",
            ),
        )
            .filter(element => element.offsetParent !== null);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (!focusable.includes(document.activeElement as HTMLElement)) {
            event.preventDefault();
            (event.shiftKey ? last : first)?.focus();
        } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
        }
    }

    private async request<T>(path: string, body?: unknown): Promise<T> {
        const response = await fetch(api.resolveUrl(`/api/ranked/${path}`), {
            method: body === undefined ? "GET" : "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            signal: helpers.abortSignal(8000),
        });
        const data = await response.json();
        if (!response.ok) {
            const error = new Error(data.error || "The ranked server could not complete that request.");
            if (response.status === 401) error.name = "RankedAuthError";
            throw error;
        }
        return data as T;
    }

    private async refreshSession() {
        if (this.checkingSession) {
            this.sessionRefreshPending = true;
            return;
        }
        this.checkingSession = true;
        try {
            const session = await this.request<{ nativeAccounts: boolean; profile: RankedProfile | null }>("session");
            this.sessionChecked = true;
            this.error = "";
            if (session.profile?.id !== this.state?.profile.id) {
                this.stateVersion++;
                this.state = null;
                this.history = [];
            }
            this.nativeSession = !!session.profile;
            this.render();
            await this.poll(true);
            this.loadSelectedRecords();
        } catch (error) {
            this.error = error instanceof Error ? error.message : "The ranked server is unavailable.";
            this.render();
        } finally {
            this.checkingSession = false;
            if (this.sessionRefreshPending) {
                this.sessionRefreshPending = false;
                void this.refreshSession();
            }
        }
    }

    private async poll(force = false) {
        // Restore once on login/open; keep presence alive only while ranked is in use.
        if (!force && !this.opened && !this.isBusy()) return;
        if (!this.nativeSession || !this.sessionChecked || this.polling || this.busy) return;
        this.polling = true;
        const version = this.stateVersion;
        try {
            const state = await this.request<RankedState>("state");
            if (version !== this.stateVersion) return;
            if (this.error.startsWith("Connection lost")) this.error = "";
            this.applyState(state);
        } catch (error) {
            if (version !== this.stateVersion) return;
            if (error instanceof Error && error.name === "RankedAuthError") {
                this.nativeSession = false;
                this.state = null;
            }
            this.error = error instanceof Error && error.name !== "TimeoutError" && error.name !== "TypeError"
                ? error.message
                : "Connection lost. Reconnecting to the local ranked server…";
            this.render();
        } finally {
            this.polling = false;
        }
    }

    private async mutate(path: string, body: unknown = {}) {
        if (this.busy) return;
        this.busy = true;
        this.stateVersion++;
        this.error = "";
        this.render();
        try {
            const state = await this.request<RankedState>(path, body);
            this.applyState(state);
            return state;
        } catch (error) {
            this.error = error instanceof Error ? error.message : "Please try again.";
            if (path === "series/forfeit" && !this.celebratingRound()) this.forfeitConfirm = true;
        } finally {
            this.busy = false;
            this.stateVersion++;
            this.render();
        }
    }

    private applyState(state: RankedState) {
        const previous = this.state?.series;
        this.state = state;
        if (!state.party) this.disbandConfirm = false;
        if (
            state.series
            && (state.series.personalForfeit || ["intermission", "complete", "cancelled"].includes(state.series.status))
            && (previous?.id !== state.series.id || previous.status !== state.series.status
                || previous.personalForfeit !== state.series.personalForfeit)
        ) {
            this.error = "";
        }

        for (const context of [state.party, state.queue, state.match, state.series]) {
            if (context) {
                this.size = context.size;
                this.region = context.region;
            }
        }
        if (state.queue || state.match || state.series) this.opened = true;
        if (this.activeSeries() && state.series) {
            const key = `${state.series.id}:${state.series.round}`;
            if (state.series.join && key !== this.joinKey && Date.now() >= this.retryAt) {
                this.joinKey = key;
                this.transition = true;
                this.app.input?.onWindowFocus();
                if (this.app.game?.initialized || this.app.game?.connecting || this.app.game?.connected) {
                    this.app.game.onQuit();
                }
                this.transition = false;
                this.app.config.set("playerName", state.profile.name);
                this.app.nameInput.val(state.profile.name);
                this.app.teamMenu.leave();
                this.app.joinGame(state.series.join);
            }
        } else if (
            previous
            && (!state.series || previous.status !== state.series.status
                || previous.personalForfeit !== state.series.personalForfeit)
        ) {
            this.transition = true;
            this.app.input?.onWindowFocus();
            if (this.app.game?.initialized || this.app.game?.connecting || this.app.game?.connected) {
                this.app.game.onQuit();
            }
            this.transition = false;
            this.forfeitConfirm = false;
        }
        this.render();
    }

    /** Ranked handles its own reconnects and expected round closures. */
    onGameQuit(): boolean {
        if (this.transition) return true;
        const series = this.state?.series;
        if (!series) return false;
        if (series.personalForfeit || ["intermission", "complete", "cancelled"].includes(series.status)) return true;
        this.joinKey = "";
        this.retryAt = Date.now() + 2000;
        this.error = "Reconnecting to your ranked series…";
        void this.poll();
        return true;
    }

    onGameJoined() {
        if (!this.activeSeries()) return;
        this.error = "";
        this.render();
    }

    onGameOver(gameOver: boolean): boolean {
        if (!this.activeSeries()) return false;
        if (gameOver) this.forfeitConfirm = false;
        else this.app.game?.m_uiManager.beginSpectating();
        // The arena keeps normal controls alive briefly before reporting the round result.
        this.renderSeries();
        return true;
    }

    private handleClick(event: MouseEvent) {
        const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action], [data-tab], [data-size]");
        if (!target || (target as HTMLButtonElement).disabled) return;
        const size = Number(target.dataset.size) as DuelSize;
        if (size) {
            if (this.tab === "leaderboard" || this.tab === "history") {
                this.browseSize = size;
                this.render();
                this.loadSelectedRecords();
            } else if (this.canChangePlaySize()) {
                if (this.state?.party) {
                    if (size === 1) {
                        this.disbandConfirm = true;
                        this.render();
                    } else {
                        this.disbandConfirm = false;
                        if (size !== this.state.party.size) void this.mutate("party/size", { size });
                        else this.render();
                    }
                } else {
                    this.size = size;
                    this.render();
                }
            }
            return;
        }
        if (target.dataset.tab) {
            this.tab = target.dataset.tab as typeof this.tab;
            this.disbandConfirm = false;
            this.render();
            this.loadSelectedRecords();
            return;
        }
        switch (target.dataset.action) {
            case "close":
                this.close();
                break;
            case "sign-in":
                this.close();
                this.app.profileUi.showLoginMenu({ modal: true });
                break;
            case "queue":
                void this.mutate("queue/join", { size: this.size, region: this.region });
                break;
            case "queue-cancel":
                void this.mutate("queue/leave");
                break;
            case "match-accept":
            case "match-decline":
                if (
                    this.state?.match && target.dataset.matchId === this.state.match.id
                    && this.secondsUntil(this.state.match.deadline)
                ) {
                    void this.mutate(target.dataset.action === "match-accept" ? "match/accept" : "match/decline", {
                        matchId: this.state.match.id,
                    });
                }
                break;
            case "party-create":
                void this.mutate("party/create", { size: this.size, region: this.region });
                break;
            case "party-join":
                void this.joinParty();
                break;
            case "party-leave":
                void this.mutate("party/leave");
                break;
            case "party-disband-cancel":
                this.disbandConfirm = false;
                this.render();
                break;
            case "party-disband-confirm":
                void this.disbandParty();
                break;
            case "party-ready": {
                const member = this.state?.party?.members.find(member => member.id === this.state?.profile.id);
                void this.mutate("party/ready", { ready: !member?.ready });
                break;
            }
            case "party-copy":
                void this.copyPartyCode();
                break;
            case "series-ack":
                void this.mutate("series/ack").then(() => this.loadSelectedRecords());
                break;
            case "series-forfeit":
                if (this.celebratingRound()) break;
                this.forfeitConfirm = true;
                this.renderSeries();
                break;
            case "forfeit-cancel":
                this.forfeitConfirm = false;
                this.renderSeries();
                break;
            case "forfeit-confirm":
                if (this.celebratingRound()) break;
                this.forfeitConfirm = false;
                void this.mutate("series/forfeit");
                break;
            case "leaderboard-refresh":
                void this.loadLeaderboard();
                break;
            case "history-refresh":
                void this.loadHistory();
                break;
        }
    }

    private async disbandParty() {
        const state = await this.mutate("party/disband");
        if (state) {
            this.size = 1;
            this.disbandConfirm = false;
            this.render();
        }
    }

    private async joinParty() {
        const code = (document.getElementById("ranked-party-input") as HTMLInputElement)?.value.trim().toUpperCase();
        if (!code) {
            this.error = "Enter your teammate’s party code.";
            this.render();
            return;
        }
        await this.mutate("party/join", { code });
    }

    private async copyPartyCode() {
        const code = this.state?.party?.code;
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            const button = this.root.querySelector<HTMLElement>("[data-action='party-copy']");
            if (button) button.textContent = "Copied";
        } catch {
            this.error = `Your party code is ${code}. Share it with your teammates.`;
            this.render();
        }
    }

    private async loadLeaderboard() {
        if (this.leaderboardLoading) return;
        this.leaderboard = [];
        this.leaderboardLoading = true;
        this.render();
        const size = this.browseSize;
        try {
            const result = await this.request<{ entries: RankedLeaderboardEntry[] }>(`leaderboard?size=${size}`);
            if (size === this.browseSize) this.leaderboard = result.entries;
        } catch (error) {
            this.error = error instanceof Error ? error.message : "Leaderboard unavailable.";
        } finally {
            this.leaderboardLoading = false;
            this.render();
            if (size !== this.browseSize && this.tab === "leaderboard") void this.loadLeaderboard();
        }
    }

    private loadSelectedRecords() {
        if (this.tab === "leaderboard") void this.loadLeaderboard();
        else if (this.tab === "history") void this.loadHistory();
    }

    private async loadHistory() {
        if (this.historyLoading || !this.state) return;
        this.history = [];
        this.historyLoading = true;
        this.render();
        const size = this.browseSize;
        const profileId = this.state.profile.id;
        try {
            const result = await this.request<{ entries: RankedHistory[] }>(`history?size=${size}`);
            if (size === this.browseSize && profileId === this.state?.profile.id) this.history = result.entries;
        } catch (error) {
            this.error = error instanceof Error ? error.message : "History unavailable.";
        } finally {
            this.historyLoading = false;
            this.render();
            if ((size !== this.browseSize || profileId !== this.state?.profile.id) && this.tab === "history") {
                void this.loadHistory();
            }
        }
    }

    private render() {
        const state = this.state;
        const series = state?.series;
        this.root.hidden = !this.opened || !!state?.match || !!series;
        const close = this.root.querySelector<HTMLButtonElement>("[data-action='close']")!;
        close.disabled = !!(state?.queue || state?.match || this.activeSeries());
        this.root.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach(button => {
            button.setAttribute("aria-selected", String(button.dataset.tab === this.tab));
        });
        this.root.querySelectorAll<HTMLButtonElement>("[data-size]").forEach(button => {
            button.setAttribute("aria-pressed", String(Number(button.dataset.size) === this.selectedSize()));
            button.disabled = this.tab === "play" && !this.canChangePlaySize();
        });
        const regionSelect = document.getElementById("ranked-region") as HTMLSelectElement;
        if (regionSelect.innerHTML !== this.app.serverSelect.html()) {
            regionSelect.innerHTML = this.app.serverSelect.html();
        }
        regionSelect.value = this.region;
        regionSelect.disabled = this.isBusy();
        (regionSelect.parentElement as HTMLElement).hidden = this.tab !== "play" || regionSelect.options.length <= 1;
        (this.root.querySelector(".ranked-modes") as HTMLElement).hidden = this.tab === "tiers";
        const contentKey = JSON.stringify([
            this.tab,
            this.size,
            this.browseSize,
            this.disbandConfirm,
            this.sessionChecked,
            state?.queue,
            state?.party && {
                ...state.party,
                members: state.party.members.map(member => ({
                    ...member,
                    cooldown: member.cooldown && [member.cooldown.until, member.cooldown.reason],
                })),
            },
            state?.cooldown && [state.cooldown.until, state.cooldown.reason],
            state?.history,
            state?.profile.id,
            this.busy,
            this.leaderboard,
            this.leaderboardLoading,
            this.history,
            this.historyLoading,
        ]);
        if (contentKey !== this.contentKey) {
            this.contentKey = contentKey;
            document.getElementById("ranked-content")!.innerHTML = this.tab === "play"
                ? this.renderPlay()
                : this.tab === "leaderboard"
                ? this.renderLeaderboard()
                : this.tab === "history"
                ? this.renderHistory()
                : this.renderTiers();
        }
        this.renderSummary();
        document.getElementById("ranked-error")!.textContent = this.statusMessage();
        this.renderClock();
        this.renderSeries();
    }

    private statusMessage() {
        if (this.error) return this.error;
        const notice = this.state?.notice || "";
        const cooldownShown = this.tab === "play" && !this.state?.queue && !this.disbandConfirm;
        return cooldownShown && notice === this.queueCooldown()?.reason ? "" : notice;
    }

    private renderPlay() {
        const state = this.state;
        if (!this.sessionChecked) return "<p class=\"ranked-muted\">Loading account…</p>";
        if (!state) {
            return "<button class=\"ranked-btn ranked-primary ranked-queue-button\" data-action=\"sign-in\">Sign in</button>";
        }
        const party = state.party;
        const queue = state.queue;
        const disabled = this.busy ? "disabled" : "";
        if (party && this.disbandConfirm) {
            return `<div class="ranked-confirm"><strong>Switch to 1v1?</strong><p class="ranked-muted">This closes the party for everyone.</p><div class="ranked-party-actions"><button class="ranked-btn" data-action="party-disband-cancel" ${disabled}>Keep party</button><button class="ranked-btn ranked-primary" data-action="party-disband-confirm" ${disabled}>Disband and switch</button></div></div>`;
        }
        if (queue) {
            return `<div class="ranked-queue" role="status" aria-live="polite"><div class="ranked-queue-status"><strong>Finding match · ${
                Math.min(queue.players, queue.total)
            } / ${queue.total} players</strong><span id="ranked-queue-time">0:00</span></div><div class="ranked-slots" aria-hidden="true">${
                Array.from({ length: queue.total }, (_, index) =>
                    `${index === queue.size ? "<span class=\"ranked-vs\">VS</span>" : ""}<span class="ranked-slot${
                        index < queue.players ? " filled" : ""
                    }"></span>`).join("")
            }</div><div class="ranked-muted ranked-small">Waiting for two full teams.</div><button class="ranked-btn ranked-queue-button" data-action="queue-cancel" ${disabled}>Cancel</button></div>`;
        }
        const cooldown = this.queueCooldown();
        let html = cooldown
            ? `<div class="ranked-cooldown" role="status"><strong>Queue cooldown · <span data-cooldown-until="${cooldown.until}">${
                this.duration(this.secondsUntil(cooldown.until))
            }</span></strong><span>${helpers.htmlEscape(cooldown.reason)}</span></div>`
            : "";
        if (this.size > 1) {
            if (party) {
                const me = party.members.find(member => member.id === state.profile.id);
                html += `<div class="ranked-party"><div class="ranked-party-code"><span>Party <strong>${
                    helpers.htmlEscape(party.code)
                }</strong> · ${party.members.length}/${this.size}</span><button class="ranked-btn" data-action="party-copy">Copy</button></div>${
                    party.members.map(member =>
                        `<div class="ranked-member"><span class="ranked-player-name">${
                            this.tierBadge(member.rating)
                        }<span>${helpers.htmlEscape(member.name)}${
                            member.id === party.leaderId ? " · Captain" : ""
                        }</span></span><span class="${
                            member.cooldown ? "ranked-negative" : member.ready ? "ready" : "not-ready"
                        }">${
                            member.cooldown
                                ? `Cooldown <span data-cooldown-until="${member.cooldown.until}">${
                                    this.duration(this.secondsUntil(member.cooldown.until))
                                }</span>`
                                : member.ready
                                ? "Ready"
                                : "Not ready"
                        }</span></div>`
                    ).join("")
                }${
                    party.leaderId !== state.profile.id
                        ? "<p class=\"ranked-muted ranked-small\">Only the captain can change team size.</p>"
                        : ""
                }<div class="ranked-party-actions"><button class="ranked-btn ${
                    me?.ready ? "" : "ranked-primary"
                }" data-action="party-ready" ${
                    this.busy || (!me?.ready && me?.cooldown && this.secondsUntil(me.cooldown.until)) ? "disabled" : ""
                }>${
                    me?.ready
                        ? "Unready"
                        : "Ready"
                }</button><button class="ranked-btn" data-action="party-leave" ${disabled}>Leave party</button></div></div>`;
            } else {
                html +=
                    `<div class="ranked-party-options"><button class="ranked-btn" data-action="party-create" ${disabled}>Create party</button><input id="ranked-party-input" aria-label="Party code" placeholder="Party code" maxlength="10" autocomplete="off"><button class="ranked-btn" data-action="party-join" ${disabled}>Join</button></div><div class="ranked-muted ranked-small">Or queue solo to find teammates.</div>`;
            }
        }
        const leader = !party || party.leaderId === state.profile.id;
        const ready = !party || party.members.every(member => member.ready);
        html += `<button class="ranked-btn ranked-primary ranked-queue-button" data-action="queue" ${
            this.busy || !leader || !ready || cooldown ? "disabled" : ""
        }>${
            cooldown
                ? "Queue on cooldown"
                : !leader
                ? "Waiting for captain"
                : !ready
                ? "Waiting for ready players"
                : `Queue ${this.size}v${this.size}`
        }</button>`;
        return html;
    }

    private renderSummary() {
        const profile = this.state?.profile;
        const rating = profile?.ratings[this.selectedSize()];
        const key = JSON.stringify([profile, this.selectedSize(), this.sessionChecked]);
        if (key === this.summaryKey) return;
        this.summaryKey = key;
        document.getElementById("ranked-summary")!.innerHTML = profile && rating
            ? `<strong>${helpers.htmlEscape(profile.name)}</strong><span class="ranked-summary-rating">${
                this.tierBadge(rating)
            }${
                rating.placementsRemaining
                    ? `Placements ${
                        RankedPlacementSeries - rating.placementsRemaining
                    }/${RankedPlacementSeries} · <b>${rating.elo} provisional Elo</b>`
                    : `${helpers.htmlEscape(rating.tier)} · <b>${rating.elo} Elo</b>`
            }</span><span>${rating.wins}W / ${rating.losses}L</span>`
            : "<span>Use your Survev account to play ranked.</span>";
    }

    private tierBadge(rating: RankedRating) {
        if (rating.placementsRemaining) {
            return `<span class="ranked-badge ranked-unplaced" role="img" aria-label="Unranked" title="${rating.placementsRemaining} placement series remaining">?</span>`;
        }
        const tier = getRankedTier(rating.elo);
        return `<img class="ranked-badge" src="/img/gui/ranked/${tier.id}.svg" alt="${tier.name}" title="${tier.name} · ${rating.elo} Elo">`;
    }

    private renderTiers() {
        return `<div class="ranked-tiers">${
            RankedTiers.map((tier, index) =>
                `<div class="ranked-tier"><img src="/img/gui/ranked/${tier.id}.svg" alt=""><strong>${tier.name}</strong><span>${
                    tier.minElo === null ? `Below ${RankedTiers[index + 1].minElo}` : `${tier.minElo}+`
                } Elo</span></div>`
            ).join("")
        }</div>`;
    }

    private renderLeaderboard() {
        if (this.leaderboardLoading) {
            return `<div class="ranked-empty">Loading the ${this.browseSize}v${this.browseSize} ladder…</div>`;
        }
        const caption =
            `<div class="ranked-table-caption">${this.browseSize}v${this.browseSize} · Placed players <button class="ranked-btn" style="float:right;min-height:28px;padding:3px 8px" data-action="leaderboard-refresh">Refresh</button></div>`;
        if (!this.leaderboard.length) {
            return `${caption}<div class="ranked-empty">No placed players yet. Complete five series to join the ladder.</div>`;
        }
        return `${caption}<table class="ranked-table"><thead><tr><th>#</th><th>PLAYER</th><th>W / L</th><th>ELO</th></tr></thead><tbody>${
            this.leaderboard.map(entry =>
                `<tr class="${
                    entry.id === this.state?.profile.id ? "is-you" : ""
                }"><td>${entry.rank}</td><td><div class="ranked-player-name">${this.tierBadge(entry.rating)}<span>${
                    helpers.htmlEscape(entry.name)
                }${entry.id === this.state?.profile.id ? " · You" : ""}<br><span class="ranked-muted ranked-small">${
                    helpers.htmlEscape(entry.rating.tier)
                }</span></span></div></td><td>${entry.rating.wins} / ${entry.rating.losses}</td><td><strong>${entry.rating.elo}</strong></td></tr>`
            ).join("")
        }</tbody></table>`;
    }

    private renderHistory() {
        if (this.historyLoading) {
            return `<div class="ranked-empty">Loading your ${this.browseSize}v${this.browseSize} history…</div>`;
        }
        const history = this.state ? this.history : [];
        if (!history.length) {
            return `<div class="ranked-empty">No completed ${this.browseSize}v${this.browseSize} series yet.</div>`;
        }
        return `<div class="ranked-table-caption">Your recent ${this.browseSize}v${this.browseSize} series <button class="ranked-btn" style="float:right;min-height:28px;padding:3px 8px" data-action="history-refresh">Refresh</button></div><table class="ranked-table"><thead><tr><th>RESULT</th><th>OPPONENTS</th><th>SCORE</th><th>ELO</th></tr></thead><tbody>${
            history.map(entry =>
                `<tr><td class="${entry.won ? "ranked-positive" : "ranked-negative"}"><strong>${
                    entry.won ? "WIN" : "LOSS"
                }</strong><br><span class="ranked-muted ranked-small">${
                    helpers.htmlEscape(
                        new Date(entry.at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                    )
                }</span></td><td>${
                    entry.opponents.map(helpers.htmlEscape).join(", ")
                }<br><span class="ranked-muted ranked-small">${
                    helpers.htmlEscape(
                        entry.reason === "completed" ? "First to five" : entry.reason.replaceAll("_", " "),
                    )
                }</span></td><td>${entry.score[0]} – ${entry.score[1]}</td><td class="${
                    entry.delta >= 0 ? "ranked-positive" : "ranked-negative"
                }"><strong>${
                    entry.delta > 0 ? "+" : ""
                }${entry.delta}</strong><br><span class="ranked-muted ranked-small">${entry.after} Elo</span></td></tr>`
            ).join("")
        }</tbody></table>`;
    }

    private renderClock() {
        const queue = this.state?.queue;
        const timer = document.getElementById("ranked-queue-time");
        if (queue && timer) {
            const seconds = Math.max(0, Math.floor((Date.now() - queue.joinedAt) / 1000));
            timer.textContent = this.duration(seconds);
        }
        this.root.querySelectorAll<HTMLElement>("[data-cooldown-until]").forEach(element => {
            element.textContent = this.duration(this.secondsUntil(Number(element.dataset.cooldownUntil)));
        });
    }

    private duration(seconds: number) {
        return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    }

    private queueCooldown(): RankedCooldown | null {
        const state = this.state;
        if (state?.cooldown && this.secondsUntil(state.cooldown.until)) return state.cooldown;
        const member = state?.party?.members.find(member =>
            member.cooldown && this.secondsUntil(member.cooldown.until)
        );
        return member?.cooldown
            ? { ...member.cooldown, reason: `${member.name}: ${member.cooldown.reason}` }
            : null;
    }

    private secondsUntil(time: number | null) {
        return time ? Math.max(0, Math.ceil((time - Date.now()) / 1000)) : 0;
    }

    private seriesStatus(series: RankedSeries) {
        switch (series.status) {
            case "connecting":
                return `Connecting both teams · ${series.connected} / ${series.total} players ready`;
            case "countdown":
                return `Round begins in ${this.secondsUntil(series.startsAt)}`;
            case "playing":
                return this.app.game?.m_gameOver ? "Round complete" : `Round ${series.round} · First to 5`;
            case "intermission":
                return `Next round in ${this.secondsUntil(series.nextRoundAt)}`;
            case "complete":
                return "Series complete";
            case "cancelled":
                return "Series cancelled · Elo unchanged";
        }
    }

    private renderSeries() {
        const series = this.state?.series;
        const active = this.activeSeries();
        document.body.classList.toggle("ranked-in-game", !!active);
        this.hud.hidden = !active;
        if (this.state?.match) {
            this.seriesContentKey = "";
            this.renderMatch();
            return;
        }
        this.matchContentKey = "";
        const overlayWasHidden = this.roundOverlay.hidden;
        this.roundOverlay.hidden = !series
            || (!series.personalForfeit && series.status === "playing" && !this.forfeitConfirm);
        if (overlayWasHidden && !this.roundOverlay.hidden) this.app.input?.onWindowFocus();
        if (!series) {
            this.seriesContentKey = "";
            return;
        }
        if (
            series.status === "playing" && this.app.game?.initialized && !this.app.game.m_gameOver
            && this.app.game.m_uiManager.displayingStats
        ) {
            this.app.game.m_uiManager.beginSpectating();
        }
        const mine = series.score[series.teamIndex], theirs = series.score[series.teamIndex === 0 ? 1 : 0];
        const ownMembers = series.teams[series.teamIndex], opponents = series.teams[series.teamIndex === 0 ? 1 : 0];
        this.hud.innerHTML =
            `<div class="ranked-hud-score"><span>YOUR TEAM</span><strong>${mine}</strong><b>:</b><strong>${theirs}</strong><span>OPPONENTS</span></div><div class="ranked-hud-status">${series.size}v${series.size} · ${
                helpers.htmlEscape(this.seriesStatus(series))
            }</div>`;
        this.positionHud();
        if (this.roundOverlay.hidden) return;
        // Keep result scrolling and focused actions intact when a poll has no visible changes.
        const contentKey = JSON.stringify([
            series,
            this.forfeitConfirm,
            this.busy,
            this.error,
            this.seriesStatus(series),
        ]);
        if (contentKey === this.seriesContentKey) return;
        this.seriesContentKey = contentKey;
        if (series.personalForfeit) {
            const result = series.result;
            const teammatesPlaying = series.size > 1 && series.status !== "complete" && series.status !== "cancelled";
            this.roundOverlay.innerHTML = `<section class="ranked-round-card${
                series.scoreboard ? " ranked-results-card" : ""
            }" role="status" aria-live="polite"><div class="ranked-eyebrow">Ranked ${series.size}v${series.size}</div><h2>You left the series</h2>${
                result
                    ? `<div class="ranked-round-delta ranked-negative">${result.delta} Elo <span class="ranked-muted">· ${result.before} → ${result.after}</span></div>`
                    : ""
            }<p class="ranked-muted">Personal forfeit penalty.${
                teammatesPlaying ? " Your teammates are still playing." : ""
            }</p>${this.renderScoreboard(series)}${
                this.error ? `<p class="ranked-negative" role="alert">${helpers.htmlEscape(this.error)}</p>` : ""
            }<button class="ranked-btn ranked-primary" data-action="series-ack" ${
                this.busy ? "disabled" : ""
            }>Back to ranked</button></section>`;
            return;
        }
        if (this.forfeitConfirm) {
            this.roundOverlay.innerHTML =
                `<section class="ranked-round-card" role="dialog" aria-modal="true" aria-labelledby="ranked-forfeit-title"><div class="ranked-eyebrow">Ranked series in progress</div><h2 id="ranked-forfeit-title">Leave this series?</h2><p class="ranked-muted">${
                    series.size > 1
                        ? "You take a ranked loss, an extra Elo penalty and a queue cooldown. Your teammates keep playing."
                        : "You take a ranked loss, an extra Elo penalty and a queue cooldown."
                }</p>${
                    series.size > 1
                        ? "<p class=\"ranked-muted ranked-small\">Premade teammates receive no loss protection.</p>"
                        : ""
                }${
                    this.error
                        ? `<p class="ranked-negative" role="alert">${helpers.htmlEscape(this.error)}</p>`
                        : ""
                }<button class="ranked-btn" data-action="forfeit-cancel">Keep playing</button><button class="ranked-btn" data-action="forfeit-confirm">Leave and accept penalty</button></section>`;
            return;
        }
        const finished = series.status === "complete" || series.status === "cancelled";
        const won = series.result?.winnerTeam === series.teamIndex;
        const title = series.status === "complete"
            ? won ? "Series victory" : "Series defeat"
            : series.status === "cancelled"
            ? "Match cancelled"
            : series.status === "connecting"
            ? "Match found"
            : series.status === "countdown"
            ? `Round ${series.round}`
            : "Round complete";
        const delta = series.result?.delta ?? 0;
        const reason = series.result?.reason?.replaceAll("_", " ");
        const teamNames = (members: RankedSeries["teams"][0]) =>
            members.map(member =>
                `${helpers.htmlEscape(member.name)}${
                    series.forfeitedIds.includes(member.id) ? " <span class=\"ranked-negative\">· Left</span>" : ""
                }`
            ).join("<br>");
        this.roundOverlay.innerHTML = `<section class="ranked-round-card${
            finished && series.scoreboard ? " ranked-results-card" : ""
        }" role="status" aria-live="polite">
            <div class="ranked-eyebrow">Ranked ${series.size}v${series.size} · First to five</div><h2>${title}</h2>
            <div class="ranked-round-score">${mine}<span>:</span>${theirs}</div>
            ${
            finished && series.scoreboard
                ? this.renderScoreboard(series)
                : `<div class="ranked-round-teams"><div><strong>Your team</strong>${
                    teamNames(ownMembers)
                }</div><div><strong>Opponents</strong>${teamNames(opponents)}</div></div>`
        }
            ${
            finished && series.result
                ? `<div class="ranked-round-delta ${delta >= 0 ? "ranked-positive" : "ranked-negative"}">${
                    delta > 0 ? "+" : ""
                }${delta} Elo <span class="ranked-muted">· ${series.result.before} → ${series.result.after}</span></div>`
                : ""
        }
            <p class="ranked-muted">${helpers.htmlEscape(this.seriesStatus(series))}</p>
            ${this.error ? `<p class="ranked-negative" role="alert">${helpers.htmlEscape(this.error)}</p>` : ""}
            ${
            series.status === "connecting"
                ? "<p class=\"ranked-muted ranked-small\">The round starts together after every player connects.</p>"
                : ""
        }
            ${finished && reason ? `<p class="ranked-muted ranked-small">${helpers.htmlEscape(reason)}</p>` : ""}
            ${
            finished
                ? `<button class="ranked-btn ranked-primary" data-action="series-ack" ${
                    this.busy ? "disabled" : ""
                }>Back to ranked</button>`
                : "<button class=\"ranked-btn\" data-action=\"series-forfeit\">Leave series</button>"
        }
        </section>`;
    }

    private renderMatch() {
        const match = this.state!.match!;
        const seconds = this.secondsUntil(match.deadline);
        const key = JSON.stringify([match, this.busy, this.error]);
        const wasHidden = this.roundOverlay.hidden;
        this.roundOverlay.hidden = false;
        if (wasHidden) this.app.input?.onWindowFocus();
        // Update the clock in place so polling never moves keyboard focus between Accept and Decline.
        if (key !== this.matchContentKey) {
            this.matchContentKey = key;
            const hadFocus = this.roundOverlay.contains(document.activeElement);
            this.roundOverlay.innerHTML =
                `<section class="ranked-round-card ranked-match-card" role="dialog" aria-modal="true" aria-labelledby="ranked-match-title">
                <div class="ranked-eyebrow">Ranked ${match.size}v${match.size}</div>
                <h2 id="ranked-match-title" tabindex="-1">Match found</h2>
                <div class="ranked-match-clock"><span id="ranked-match-time">${seconds}</span><small>seconds to accept</small></div>
                <p class="ranked-muted" role="status">${match.acceptedCount} / ${match.total} accepted${
                    match.accepted ? " · You’re ready" : ""
                }</p>
                <div class="ranked-match-actions">
                    <button class="ranked-btn ranked-primary" data-action="match-accept" data-match-id="${
                    helpers.htmlEscape(match.id)
                }" ${this.busy || match.accepted || !seconds ? "disabled" : ""}>${
                    match.accepted ? "Accepted" : "Accept"
                }</button>
                    <button class="ranked-btn" data-action="match-decline" data-match-id="${
                    helpers.htmlEscape(match.id)
                }" ${this.busy || !seconds ? "disabled" : ""}>Decline</button>
                </div>
                <p class="ranked-muted ranked-small">Repeated declines or misses cause a queue cooldown.</p>
                ${this.error ? `<p class="ranked-negative" role="alert">${helpers.htmlEscape(this.error)}</p>` : ""}
            </section>`;
            if (wasHidden || hadFocus) {
                this.roundOverlay.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
            }
        }
        const timer = this.roundOverlay.querySelector("#ranked-match-time");
        if (timer) timer.textContent = String(seconds);
        if (!seconds) {
            this.roundOverlay.querySelectorAll<HTMLButtonElement>("button").forEach(button => button.disabled = true);
        }
    }

    private renderScoreboard(series: RankedSeries) {
        if (!series.scoreboard) return "";
        const teams = [series.teamIndex, series.teamIndex === 0 ? 1 : 0];
        return `<div class="ranked-scoreboard-wrap"><table class="ranked-table ranked-scoreboard"><caption>Series scoreboard</caption><thead><tr><th>PLAYER</th><th>KILLS</th><th>DAMAGE</th><th>ROUNDS</th><th>ELO</th></tr></thead>${
            teams.map(team =>
                `<tbody><tr class="ranked-scoreboard-team"><th colspan="5">${
                    team === series.teamIndex ? "Your team" : "Opponents"
                }</th></tr>${
                    series.scoreboard!.filter(entry => entry.team === team).map(entry =>
                        `<tr class="${entry.id === this.state?.profile.id ? "is-you" : ""}"><td>${
                            helpers.htmlEscape(entry.name)
                        }${
                            entry.forfeited
                                ? "<span class=\"ranked-negative ranked-small\"> · Left</span>"
                                : ""
                        }</td><td>${entry.kills}</td><td>${
                            Math.round(entry.damage)
                        }</td><td>${entry.roundsWon}</td><td><span class="ranked-scoreboard-elo">${entry.before} → ${entry.after}</span><strong class="${
                            entry.delta >= 0 ? "ranked-positive" : "ranked-negative"
                        }">${entry.delta > 0 ? "+" : ""}${entry.delta}</strong></td></tr>`
                    ).join("")
                }</tbody>`
            ).join("")
        }</table></div>`;
    }

    private positionHud() {
        if (this.hud.hidden) return;
        const gameUi = this.app.game?.initialized ? this.app.game.m_uiManager : null;
        this.hud.style.visibility = gameUi && (!gameUi.hudVisible || gameUi.bigmapDisplayed) ? "hidden" : "";
        const hudBounds = this.hud.getBoundingClientRect();
        let top = 12;
        // Mobile scopes form a side column; only items beneath the scoreboard's width affect its position.
        for (const element of document.querySelectorAll("#ui-top-center-scopes .ui-scope, #ui-spectate-text")) {
            const bounds = element.getBoundingClientRect();
            if (bounds.width && bounds.height && bounds.left < hudBounds.right && bounds.right > hudBounds.left) {
                top = Math.max(top, bounds.bottom + 6);
            }
        }
        this.hud.style.top = `${Math.ceil(top)}px`;
    }
}
