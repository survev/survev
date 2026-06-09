import $ from "jquery";
import { type RoleDef, RoleDefs } from "../../../shared/defs/gameObjects/roleDefs";
import { type MapDef, MapDefs } from "../../../shared/defs/mapDefs";
import { GameConfig } from "../../../shared/gameConfig";
import * as net from "../../../shared/net/net";
import type { FindGameMatchData } from "../../../shared/types/api";
import type {
    PrivateLobbyErrorType,
    PrivateLobbyMenuPlayer,
    PrivateLobbyPlayGameMsg,
    PrivateLobbyStateMsg,
    RoomData,
    ServerToClientPrivateLobbyMsg,
} from "../../../shared/types/privateLobby";
import { api } from "../api";
import type { AudioManager } from "../audioManager";
import type { ConfigManager } from "../config";
import { device } from "../device";
import { helpers } from "../helpers";
import type { PingTest } from "../pingTest";
import { SDK } from "../sdk/sdk";
import type { SiteInfo } from "../siteInfo";
import type { Localization } from "./localization";

function errorTypeToString(type: string, localization: Localization) {
    const typeMap = {
        join_full: localization.translate("index-private-lobby-is-full"),
        join_not_found: localization.translate("index-failed-joining-private-lobby"),
        create_failed: localization.translate("index-failed-creating-private-lobby"),
        join_failed: localization.translate("index-failed-joining-private-lobby"),
        join_game_failed: localization.translate("index-failed-joining-game"),
        lost_conn: localization.translate("index-lost-connection-private-lobby"),
        find_game_error: localization.translate("index-failed-finding-game"),
        find_game_full: localization.translate("index-failed-finding-game"),
        find_game_invalid_protocol: localization.translate("index-invalid-protocol"),
        kicked: localization.translate("index-private-lobby-kicked"),
        banned: localization.translate("index-ip-banned"),
        behind_proxy: "behind_proxy", // this will get passed to the main app to show a modal
        login_required: localization.translate("index-private-lobby-login-required"),
        mode_disabled: localization.translate("index-private-lobby-mode-disabled"),
        team_full: localization.translate("index-private-lobby-team-full"),
        host_left: localization.translate("index-private-lobby-host-left"),
    } as Record<PrivateLobbyErrorType, string>;
    return typeMap[type as keyof typeof typeMap] || typeMap.lost_conn;
}

export class PrivateLobbyMenu {
    // Jquery elems
    playBtn = $("#btn-start-private-lobby");
    stopGameBtn = $("#btn-stop-private-lobby-game");
    afkBtn = $("#btn-private-lobby-afk");
    afkConfirmContainer = $("#private-lobby-afk-confirm");
    startAnywayBtn = $("#btn-private-lobby-start-anyway");
    cancelStartBtn = $("#btn-private-lobby-cancel-start");
    serverWarning = $("#server-warning");
    serverSelect = $("#private-lobby-server-select");
    modesContainer = $("#private-lobby-menu-modes");
    teamGrid = $("#private-lobby-menu-team-grid");
    createTeamBtn = $("#btn-private-lobby-create-team");
    settingsContainer = $("#private-lobby-menu-settings");
    settingsTabs = $("#private-lobby-settings-tabs");
    settingsContent = $("#private-lobby-settings-content");

    active = false;
    joined = false;
    create = false;
    joiningGame = false;
    afkConfirmPending = false;
    ws: WebSocket | null = null;

    // Ui state
    playerData = {};
    roomData = {} as RoomData;
    players: PrivateLobbyMenuPlayer[] = [];

    prevPlayerCount = 0;
    localPlayerId = 0;
    isLeader = true;
    editingName = false;
    displayedInvalidProtocolModal = false;

    /** Lobby-local id of the player currently selected for team reassignment (leader only). */
    selectedPlayerId = -1;
    /** Team slot revealed via "Create Team" while still empty; cleared once it gets a player. Only one may be revealed at a time. */
    extraEmptyTeamId: number | null = null;
    /** Set when joining as part of a "Create Team" handoff so the lobby groups us with our teammates. */
    importGroupId: string | undefined;
    /** Set when joining via a team-specific invite link/code (e.g. "ABC123-2") so the lobby places us directly into that team slot. */
    teamId: number | undefined;
    /** Id of the currently selected settings tab (e.g. "arenaRoles"); reset to the first available tab whenever it stops applying. */
    activeSettingsTab: string | null = null;

    hideUrl!: boolean;

    constructor(
        public config: ConfigManager,
        public pingTest: PingTest,
        public siteInfo: SiteInfo,
        public localization: Localization,
        public audioManager: AudioManager,
        public joinGameCb: (data: FindGameMatchData) => void,
        public leaveCb: (err: string) => void,
        public forceQuitCb: () => void,
    ) {
        // Listen for ui modifications
        this.serverSelect.on("change", () => {
            const e = this.serverSelect.find(":selected").val() as string;
            this.pingTest.start([e]);
            this.connect(false, this.roomData.roomUrl);
            this.setRoomProperty("region", e);
        });
        this.playBtn.on("click", () => {
            SDK.requestMidGameAd(() => {
                this.tryStartGame();
            });
        });
        this.stopGameBtn.on("click", () => {
            this.tryEndGame();
        });
        this.startAnywayBtn.on("click", () => {
            this.tryStartGame();
        });
        this.cancelStartBtn.on("click", () => {
            this.afkConfirmPending = false;
            this.refreshUi();
        });
        this.afkBtn.on("click", () => {
            const localPlayer = this.getPlayerById(this.localPlayerId);
            if (localPlayer) {
                this.sendMessage("setAfk", { afk: !localPlayer.afk });
            }
        });
        $("#private-lobby-copy-url, #private-lobby-desc-text").on("click", (e) => {
            const t = $("<div/>", {
                class: "copy-toast",
                html: "Copied!",
            });
            $("#start-menu-wrapper").append(t);
            t.css({
                left: e.pageX - parseInt(t.css("width")) / 2,
                top: $("#private-lobby-copy-url").offset()!.top,
            });
            t.animate(
                {
                    top: "-=20",
                    opacity: 1,
                },
                {
                    queue: false,
                    duration: 300,
                    complete: function () {
                        $(this).fadeOut(250, function () {
                            $(this).remove();
                        });
                    },
                },
            );
            let codeToCopy = $("#private-lobby-url").text();
            // if running on an iframe
            if (window !== window.top) {
                codeToCopy = this.roomData.roomUrl.substring(1);
            }
            helpers.copyTextToClipboard(codeToCopy);
        });

        if (window !== window.top) {
            $("#private-lobby-desc-text").hide();
        }

        if (!device.mobile) {
            // Hide invite link
            this.hideUrl = false;
            $("#private-lobby-hide-url").on("click", (e) => {
                const el = e.currentTarget;
                this.hideUrl = !this.hideUrl;
                $("#private-lobby-desc-text, #private-lobby-code-text").css({
                    opacity: this.hideUrl ? 0 : 1,
                });
                $(el).css({
                    "background-image": this.hideUrl
                        ? "url(../img/gui/hide.svg)"
                        : "url(../img/gui/eye.svg)",
                });
            });
        }

        // Clicking anywhere inside a team's area (besides on a player entry)
        // moves the currently selected player there (leader only)
        this.teamGrid.on("click", ".private-lobby-team", (e) => {
            if (!this.isLeader || this.selectedPlayerId < 0) return;
            const teamIdAttr = $(e.currentTarget).attr("data-teamid");
            if (teamIdAttr === undefined) return;
            this.sendMessage("assignTeam", {
                playerId: this.selectedPlayerId,
                teamId: Number(teamIdAttr),
            });
            this.selectedPlayerId = -1;
            this.refreshUi();
        });

        // Reveals the next empty team slot in the grid (leader only). Capped
        // at one revealed-but-empty team so the list stays decluttered; it's
        // cleared again once a player gets assigned there (see renderTeamGrid).
        this.createTeamBtn.on("click", () => {
            if (!this.isLeader || this.extraEmptyTeamId !== null) return;
            // Private lobbies allow custom (uneven) team layouts, so the leader
            // isn't capped at the mode's nominal team count (maxPlayers / teamSize) —
            // any number of team slots is fine as long as there's still a free
            // player slot left to put someone in.
            const maxPlayers = Math.max(1, this.roomData.maxPlayers);
            const filled = new Set(
                this.players
                    .filter((p) => p.teamId >= 0 && p.teamId < maxPlayers)
                    .map((p) => p.teamId),
            );
            if (filled.size >= maxPlayers) return;
            for (let t = 0; t < maxPlayers; t++) {
                if (!filled.has(t)) {
                    this.extraEmptyTeamId = t;
                    break;
                }
            }
            this.refreshUi();
        });

        setInterval(() => {
            if (this.joined) {
                this.sendMessage("keepAlive", {});
            }
        }, 10 * 1000);
    }

    getPlayerById(playerId: number) {
        return this.players.find((x) => {
            return x.playerId == playerId;
        });
    }

    connect(create: boolean, roomUrl: string, importGroupId?: string, teamId?: number) {
        if (!this.active || roomUrl !== this.roomData.roomUrl) {
            const roomHost = api.resolveRoomHost();
            const url = `w${
                window.location.protocol === "https:" ? "ss" : "s"
            }://${roomHost}/private_lobby_v2`;
            this.active = true;
            this.joined = false;
            this.create = create;
            this.joiningGame = false;
            this.editingName = false;
            this.selectedPlayerId = -1;
            this.extraEmptyTeamId = null;
            this.importGroupId = importGroupId;
            this.teamId = teamId;

            // Load properties from config
            this.playerData = {
                name: this.config.get("playerName"),
            };
            this.roomData = {
                roomUrl,
                region: this.config.get("region")!,
                gameModeIdx: this.config.get("gameModeIdx")!,
                findingGame: false,
                lastError: "",
            } as RoomData;
            this.displayedInvalidProtocolModal = false;

            this.refreshUi();

            if (this.ws) {
                this.ws.onclose = function () {};
                this.ws.close();
                this.ws = null;
            }

            try {
                this.ws = new WebSocket(url);
                this.ws.onerror = (_e) => {
                    this.ws?.close();
                };
                this.ws.onclose = () => {
                    let errMsg = "";
                    if (!this.joiningGame) {
                        errMsg = this.joined
                            ? "lost_conn"
                            : this.create
                              ? "create_failed"
                              : "join_failed";
                    }
                    this.leave(errMsg);
                };
                this.ws.onopen = () => {
                    if (this.create) {
                        this.sendMessage("create", {
                            roomData: this.roomData,
                            playerData: this.playerData,
                        });
                    } else {
                        this.sendMessage("join", {
                            roomUrl: this.roomData.roomUrl,
                            playerData: this.playerData,
                            importGroupId: this.importGroupId,
                            teamId: this.teamId,
                        });
                    }
                };
                this.ws.onmessage = (e) => {
                    if (this.active) {
                        const msg = JSON.parse(e.data);
                        this.onMessage(msg.type, msg.data);
                    }
                };
            } catch (_e) {
                this.leave(this.create ? "create_failed" : "join_failed");
            }
        }
    }

    leave(errType = "") {
        if (this.active) {
            this.ws?.close();
            this.ws = null;
            this.active = false;
            this.joined = false;
            this.joiningGame = false;
            this.afkConfirmPending = false;
            this.selectedPlayerId = -1;
            this.importGroupId = undefined;
            this.teamId = undefined;
            this.refreshUi();

            // Save state to config for the menu
            this.config.set("gameModeIdx", this.roomData.gameModeIdx);
            if (this.isLeader) {
                this.config.set("region", this.roomData.region);
            }
            let errTxt = "";
            if (errType && errType != "") {
                errTxt = errorTypeToString(errType, this.localization);
            }
            this.leaveCb(errTxt);

            SDK.hideInviteButton();
        }
    }

    onGameComplete() {
        if (this.active) {
            this.joiningGame = false;
            this.sendMessage("gameComplete");
        }
    }

    onMessage<T extends ServerToClientPrivateLobbyMsg["type"]>(
        type: T,
        data: ServerToClientPrivateLobbyMsg["data"],
    ) {
        switch (type) {
            case "state": {
                let stateData = data as PrivateLobbyStateMsg["data"];
                this.joined = true;
                const ourRoomData = this.roomData;
                this.roomData = stateData.room;
                this.players = stateData.players;
                this.localPlayerId = stateData.localPlayerId;
                this.isLeader = this.getPlayerById(this.localPlayerId)!.isLeader;

                // Override room properties with local values if we're
                // the leader; otherwise, the server may override a
                // recent change.
                if (this.isLeader) {
                    this.roomData.region = ourRoomData.region;
                }
                if (!this.getPlayerById(this.selectedPlayerId)) {
                    this.selectedPlayerId = -1;
                }
                this.refreshUi();
                // Since the only way to get the roomID (ig?) is from state, each time receiving state, we can show the invite button
                SDK.showInviteButton(stateData.room.roomUrl.replace("#", ""));
                break;
            }
            case "joinGame":
                this.joiningGame = true;
                this.joinGameCb(data as FindGameMatchData);
                break;
            case "keepAlive":
                break;
            case "kicked":
                this.leave("kicked");
                break;
            case "forceQuit":
                // the leader pulled the lobby out of the match early; force-disconnect
                // from the active game (if we're in one) and head back to the lobby
                this.joiningGame = false;
                this.forceQuitCb();
                break;
            case "error":
                this.leave((data as { type: string }).type);
        }
    }

    sendMessage(type: string, data?: unknown) {
        if (this.ws) {
            if (this.ws.readyState === this.ws.OPEN) {
                const msg = JSON.stringify({
                    type,
                    data,
                });
                this.ws.send(msg);
            } else {
                this.ws.close();
            }
        }
    }

    setRoomProperty<T extends keyof RoomData>(prop: T, val: RoomData[T]) {
        if (this.isLeader && this.roomData[prop] != val) {
            this.roomData[prop] = val;
            this.sendMessage("setRoomProps", this.roomData);
        }
    }

    tryStartGame() {
        if (!this.isLeader || this.roomData.findingGame) return;
        const afkPlayers = this.players.filter((p) => p.afk);
        if (afkPlayers.length > 0 && !this.afkConfirmPending) {
            this.afkConfirmPending = true;
            this.refreshUi();
            return;
        }
        this.afkConfirmPending = false;
        {
            const version = GameConfig.protocolVersion;
            let region = this.roomData.region;
            const paramRegion = helpers.getParameterByName("region");
            if (paramRegion !== undefined && paramRegion.length > 0) {
                region = paramRegion;
            }
            const matchArgs: PrivateLobbyPlayGameMsg["data"] = {
                version,
                region,
            };

            this.sendMessage("playGame", matchArgs);
            this.roomData.findingGame = true;
            this.refreshUi();
        }
    }

    /** Leader-only: pulls every in-game lobby member back to the lobby mid-match. */
    tryEndGame() {
        if (this.isLeader && this.players.some((p) => p.inGame)) {
            this.sendMessage("leaveGame");
        }
    }

    /** Renders a single player entry; reused for every team slot in the grid. */
    renderPlayerEntry(player: PrivateLobbyMenuPlayer) {
        const self = player.playerId == this.localPlayerId;
        const member = $("<div/>", {
            class: `team-menu-member private-lobby-player${
                player.playerId == this.selectedPlayerId ? " private-lobby-player-selected" : ""
            }${player.afk ? " private-lobby-player-afk" : ""}`,
            "data-playerid": player.playerId,
        });

        if (player.isLeader) {
            member.append(
                $("<div/>", {
                    class: "icon icon-leader",
                    "data-playerid": player.playerId,
                }),
            );
        } else if (this.isLeader && !self) {
            // Leader-only actions on another member: hand them ownership, or remove them
            const promoteIcon = $("<div/>", {
                class: "icon icon-promote",
                "data-playerid": player.playerId,
                title: this.localization.translate("index-private-lobby-promote"),
            });
            promoteIcon.on("click", (e) => {
                e.stopPropagation();
                this.sendMessage("promote", { playerId: player.playerId });
            });
            member.append(promoteIcon);

            const kickIcon = $("<div/>", {
                class: "icon icon-kick",
                "data-playerid": player.playerId,
            });
            kickIcon.on("click", (e) => {
                e.stopPropagation();
                this.sendMessage("kick", { playerId: player.playerId });
            });
            member.append(kickIcon);
        } else {
            member.append(
                $("<div/>", {
                    class: "icon",
                    "data-playerid": player.playerId,
                }),
            );
        }

        if (this.editingName && self) {
            const n: JQuery<HTMLInputElement> = $("<input/>", {
                type: "text",
                tabindex: 0,
                class: "name menu-option name-text name-self-input",
                maxLength: net.Constants.PlayerNameMaxLen,
            });
            n.val(player.name);
            const submitName = () => {
                const name = helpers.sanitizeNameInput(n?.val()!);
                this.config.set("playerName", name);
                this.sendMessage("changeName", {
                    name,
                });
                this.editingName = false;
                this.refreshUi();
            };
            const cancelEdit = () => {
                this.editingName = false;
                this.refreshUi();
            };
            n.on("click", (e) => e.stopPropagation());
            n.on("keydown", (e) => {
                if (e.which === 13) {
                    submitName();
                    return false;
                }
            });
            n.on("blur", cancelEdit);
            member.append(n);
            const c = $("<div/>", {
                class: "icon icon-submit-name-change",
            });
            c.on("click", (e) => {
                e.stopPropagation();
                submitName();
            });
            c.on("mousedown", (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            member.append(c);
            n.trigger("focus");
        } else {
            let nameClass = "name-text";
            if (self) {
                nameClass += " name-self";
            }
            if (player.inGame) {
                nameClass += " name-in-game";
            }
            const nameDiv = $("<div/>", {
                class: `name menu-option ${nameClass}`,
                html: helpers.htmlEscape(player.name),
            });
            if (self) {
                nameDiv.on("click", (e) => {
                    e.stopPropagation();
                    this.editingName = true;
                    this.refreshUi();
                });
            }
            member.append(nameDiv);
            member.append(
                $("<div/>", {
                    class: `icon ${player.inGame ? "icon-in-game" : ""}`,
                }),
            );
        }

        member.on("click", (e) => {
            if (this.editingName || !this.isLeader) return;
            e.stopPropagation();
            if (this.selectedPlayerId >= 0 && this.selectedPlayerId !== player.playerId) {
                // A player was already selected — clicking a different one swaps their team slots
                this.sendMessage("swapTeam", {
                    playerId: this.selectedPlayerId,
                    targetPlayerId: player.playerId,
                });
                this.selectedPlayerId = -1;
            } else {
                this.selectedPlayerId =
                    this.selectedPlayerId == player.playerId ? -1 : player.playerId;
            }
            this.refreshUi();
        });

        return member;
    }

    /** Renders the leader-assignable team grid: one block per team slot, plus an "unassigned" overflow block. */
    renderTeamGrid() {
        const grid = this.teamGrid;
        grid.empty();

        const teamCount = Math.max(1, this.roomData.teamCount);
        const teamSize = Math.max(1, this.roomData.teamSize);
        const maxPlayers = Math.max(1, this.roomData.maxPlayers);

        // Players can be assigned to any slot in [0, maxPlayers) — private lobbies
        // allow custom layouts (e.g. splitting a squad-mode lobby into more, smaller
        // teams), not just the mode's nominal team count (maxPlayers / teamSize).
        const playersByTeam = new Map<number, PrivateLobbyMenuPlayer[]>();
        const unassigned: PrivateLobbyMenuPlayer[] = [];
        for (const player of this.players) {
            if (player.teamId < 0 || player.teamId >= maxPlayers) {
                unassigned.push(player);
                continue;
            }
            let bucket = playersByTeam.get(player.teamId);
            if (!bucket) {
                bucket = [];
                playersByTeam.set(player.teamId, bucket);
            }
            bucket.push(player);
        }

        // Once the manually-revealed empty team gets a player (or stops
        // existing, e.g. after a mode change shrinks maxPlayers), forget it so
        // "Create Team" can reveal the next empty slot again.
        if (
            this.extraEmptyTeamId !== null &&
            (this.extraEmptyTeamId >= maxPlayers || playersByTeam.has(this.extraEmptyTeamId))
        ) {
            this.extraEmptyTeamId = null;
        }

        // Show every team slot up to the mode's nominal count, plus any extra
        // slot that's in use (custom layout) or revealed via "Create Team".
        let displayCount = teamCount;
        for (const t of playersByTeam.keys()) {
            if (t >= displayCount) displayCount = t + 1;
        }
        if (this.extraEmptyTeamId !== null && this.extraEmptyTeamId >= displayCount) {
            displayCount = this.extraEmptyTeamId + 1;
        }

        const teamLabel = this.localization.translate("index-private-lobby-team");
        for (let t = 0; t < displayCount; t++) {
            const members = playersByTeam.get(t) || [];
            // Only show filled teams, plus the one empty team revealed via "Create Team".
            if (members.length === 0 && t !== this.extraEmptyTeamId) continue;
            const team = $("<div/>", {
                class: "private-lobby-team",
                "data-teamid": t,
            });
            const header = $("<div/>", { class: "private-lobby-team-header" });
            header.append(
                $("<span/>", {
                    html: `${teamLabel} ${t + 1} (${members.length}/${teamSize})`,
                }),
            );
            // Lets anyone grab a link/code that drops a joiner straight into
            // this team slot (e.g. "ABC123-2"); not leader-gated since sharing
            // it doesn't change lobby state, only where the joiner lands.
            if (teamSize > 1) {
                const copyLinkBtn = $("<a/>", {
                    class: "private-lobby-team-copy-link",
                    title: this.localization.translate("index-private-lobby-copy-team-link"),
                });
                copyLinkBtn.on("click", (e) => {
                    e.stopPropagation();
                    this.copyTeamInviteCode(t, e);
                });
                header.append(copyLinkBtn);
            }
            team.append(header);
            const slot = $("<div/>", { class: "private-lobby-team-slot" });
            for (const player of members) {
                slot.append(this.renderPlayerEntry(player));
            }
            for (let i = members.length; i < teamSize; i++) {
                slot.append($("<div/>", { class: "private-lobby-player-empty" }));
            }
            team.append(slot);
            grid.append(team);
        }

        if (unassigned.length) {
            const team = $("<div/>", {
                class: "private-lobby-team private-lobby-team-unassigned",
            });
            team.append(
                $("<div/>", {
                    class: "private-lobby-team-header",
                    html: this.localization.translate("index-private-lobby-unassigned"),
                }),
            );
            const slot = $("<div/>", { class: "private-lobby-team-slot" });
            for (const player of unassigned) {
                slot.append(this.renderPlayerEntry(player));
            }
            team.append(slot);
            grid.append(team);
        }

        // "Create Team" is leader-only, and disabled while an empty team is
        // already revealed or there's no room left for another team slot
        // (can't usefully have more teams than total player capacity).
        const canCreateTeam = this.extraEmptyTeamId === null && playersByTeam.size < maxPlayers;
        this.createTeamBtn.css("display", this.isLeader ? "block" : "none");
        this.createTeamBtn.removeClass("btn-darken btn-disabled btn-opaque");
        this.createTeamBtn.addClass(canCreateTeam ? "btn-darken" : "btn-disabled btn-opaque");
        this.createTeamBtn.prop("disabled", !canCreateTeam);

        const localPlayer = this.getPlayerById(this.localPlayerId);
        this.afkBtn.css("display", this.isLeader ? "none" : "block");
        this.afkBtn.toggleClass("afk-active", !!localPlayer?.afk);
    }

    /**
     * Copies a shareable code/link that joins this lobby and places the
     * joiner directly into `teamId` (e.g. lobby code "ABC123" -> "ABC123-2").
     * Mirrors the lobby-wide invite copy handler wired up in the constructor.
     */
    copyTeamInviteCode(teamId: number, e: JQuery.TriggeredEvent) {
        if (!this.roomData.roomUrl) return;

        const toast = $("<div/>", {
            class: "copy-toast",
            html: "Copied!",
        });
        $("#start-menu-wrapper").append(toast);
        toast.css({
            left: (e.pageX ?? 0) - parseInt(toast.css("width")) / 2,
            top: $(e.currentTarget).offset()!.top,
        });
        toast.animate(
            {
                top: "-=20",
                opacity: 1,
            },
            {
                queue: false,
                duration: 300,
                complete: function () {
                    $(this).fadeOut(250, function () {
                        $(this).remove();
                    });
                },
            },
        );

        const roomCode = this.roomData.roomUrl.substring(1);
        const teamCode = `${roomCode}-${teamId}`;

        let codeToCopy = teamCode;
        // if running on an iframe, fall back to the bare code like the lobby-wide copy does
        if (window === window.top) {
            const url = new URL(window.location.href);
            url.search = "";
            url.hash = `${this.roomData.roomUrl}-${teamId}`;
            codeToCopy = url.toString();
        }
        helpers.copyTextToClipboard(codeToCopy);
    }

    /** The map driving the currently selected mode, or undefined while mode lists haven't loaded yet. */
    getSelectedMapDef(): MapDef | undefined {
        const modes =
            this.siteInfo.info.modesByRegion?.[this.roomData.region] ||
            this.siteInfo.info.modes ||
            [];
        const mode = modes[this.roomData.gameModeIdx];
        if (!mode) return undefined;
        return MapDefs[mode.mapName as keyof typeof MapDefs] as MapDef;
    }

    /** Selectable arena roles for the current mode's map (e.g. ["arena1", "arena2"]); empty outside arena mode. */
    getArenaModeRoles(): string[] {
        const mapDef = this.getSelectedMapDef();
        if (!mapDef?.gameMode.arenaMode) return [];
        return mapDef.gameMode.arenaModeRoles ?? [];
    }

    /** Settings tabs that apply to the current mode. Extend this list to add more tabs in the future. */
    getSettingsTabs(): Array<{ id: string; label: string }> {
        const tabs: Array<{ id: string; label: string }> = [];
        if (this.getArenaModeRoles().length >= 2) {
            tabs.push({
                id: "arenaRoles",
                label: this.localization.translate("index-private-lobby-tab-arena-roles"),
            });
        }
        return tabs;
    }

    /** Renders the tabbed settings box (bottom-right of the options column). Hidden entirely when no tab applies to the current mode. */
    renderSettings() {
        const tabs = this.getSettingsTabs();

        this.settingsContainer.css("display", tabs.length ? "flex" : "none");
        if (!tabs.length) return;

        if (!tabs.some((tab) => tab.id === this.activeSettingsTab)) {
            this.activeSettingsTab = tabs[0].id;
        }

        this.settingsTabs.empty();
        for (const tab of tabs) {
            const btn = $("<a/>", {
                class: `private-lobby-settings-tab${
                    tab.id === this.activeSettingsTab ? " private-lobby-settings-tab-active" : ""
                }`,
                html: tab.label,
            });
            btn.on("click", () => {
                if (this.activeSettingsTab === tab.id) return;
                this.activeSettingsTab = tab.id;
                this.refreshUi();
            });
            this.settingsTabs.append(btn);
        }

        this.settingsContent.empty();
        switch (this.activeSettingsTab) {
            case "arenaRoles":
                this.settingsContent.append(this.renderArenaRolesTab());
                break;
        }
    }

    /** "Arena Roles" tab: lets the leader narrow down which of the map's arena roles get played. */
    renderArenaRolesTab() {
        const wrapper = $("<div/>", { class: "private-lobby-arena-roles" });
        const enabled = new Set(this.roomData.enabledArenaRoles);

        for (const role of this.getArenaModeRoles()) {
            const roleDef = RoleDefs[role] as RoleDef | undefined;
            if (!roleDef) continue;

            const isEnabled = enabled.has(role);
            const card = $("<div/>", {
                class: `private-lobby-arena-role${
                    isEnabled ? " private-lobby-arena-role-enabled" : ""
                }${this.isLeader ? "" : " private-lobby-arena-role-readonly"}`,
            });
            card.append(
                $("<div/>", { class: "private-lobby-arena-role-icon" }).css({
                    "background-image": `url(${roleDef.guiImg})`,
                }),
            );
            card.append(
                $("<div/>", {
                    class: "private-lobby-arena-role-name",
                    html: this.localization.translate(`game-${role}`),
                }),
            );
            if (this.isLeader) {
                card.on("click", () => this.toggleArenaRole(role));
            }
            wrapper.append(card);
        }

        return wrapper;
    }

    /** Leader-only: toggles whether `role` is part of the match's arena role pool. At least one role must stay enabled. */
    toggleArenaRole(role: string) {
        if (!this.isLeader) return;

        const enabled = (this.roomData.enabledArenaRoles ?? []).slice();
        const idx = enabled.indexOf(role);
        if (idx >= 0) {
            if (enabled.length <= 1) return;
            enabled.splice(idx, 1);
        } else {
            enabled.push(role);
        }
        this.roomData.enabledArenaRoles = enabled;
        this.sendMessage("setRoomProps", this.roomData);
    }

    refreshUi() {
        const setButtonState = function (
            el: JQuery<HTMLElement>,
            selected: boolean,
            enabled: boolean,
        ) {
            el.removeClass("btn-darken btn-disabled btn-opaque btn-hollow-selected");
            if (enabled) {
                el.addClass("btn-darken");
            } else {
                el.addClass("btn-disabled");
                if (!selected) {
                    el.addClass("btn-opaque");
                }
            }
            if (selected) {
                el.addClass("btn-hollow-selected");
            }
            el.prop("disabled", !enabled);
        };
        $("#private-lobby-menu").css("display", this.active ? "block" : "none");
        $("#start-menu").css("display", this.active ? "none" : "block");
        $("#right-column").css("display", this.active ? "none" : "block");
        $("#left-column").css("display", this.active ? "none" : "block");
        $("#start-row-header").css("display", this.active ? "none" : "block");
        $("#social-share-block").css("display", this.active ? "none" : "block");

        // Error text
        const hasError = this.roomData.lastError != "";
        const errorTxt = errorTypeToString(this.roomData.lastError, this.localization);
        this.serverWarning.css("opacity", hasError ? 1 : 0);
        this.serverWarning.html(errorTxt);

        if (
            this.roomData.lastError == "find_game_invalid_protocol" &&
            !this.displayedInvalidProtocolModal
        ) {
            $("#modal-refresh").fadeIn(200);
            this.displayedInvalidProtocolModal = true;
        }

        // Show/hide lobby connecting/contents
        if (this.active) {
            $("#private-lobby-menu-joining-text").css("display", this.create ? "none" : "block");
            $("#private-lobby-menu-creating-text").css("display", this.create ? "block" : "none");
            $("#private-lobby-menu-connecting").css("display", this.joined ? "none" : "block");
            $("#private-lobby-menu-contents").css("display", this.joined ? "block" : "none");
            $("#btn-private-lobby-leave").css("display", this.joined ? "block" : "none");
        }

        if (this.joined) {
            // Regions
            const regionPops = this.siteInfo.info.pops || {};
            const regions = Object.keys(regionPops);
            for (let i = 0; i < regions.length; i++) {
                const region = regions[i];
                const count = regionPops[region].playerCount;
                const players = this.localization.translate("index-players");
                const sel = $("#private-lobby-server-opts").children(`option[value="${region}"]`);
                sel.html(`${sel.attr("data-label")} [${count} ${players}]`);
            }

            this.serverSelect.find("option").each((_idx, ele) => {
                ele.selected = ele.value == this.roomData.region;
            });
            this.serverSelect.prop("disabled", !this.isLeader);

            // Mode buttons - lobbies allow any enabled mode (including Solo),
            // so they're built dynamically instead of the fixed Duo/Squad pair teams use
            const modeStyles = this.siteInfo.getGameModeStyles(this.roomData.region);
            this.modesContainer.empty();
            for (const idx of this.roomData.enabledGameModeIdxs) {
                const style = modeStyles[idx];
                if (!style) continue;
                const btn = $("<a/>", {
                    class: "btn-hollow btn-hollow-selected btn-darken team-menu-option btn-team-queue",
                    html: this.localization.translate(`index-play-${style.buttonText}`),
                });
                if (style.icon) {
                    btn.addClass("btn-custom-mode-select");
                    btn.css({ "background-image": `url(${style.icon})` });
                }
                setButtonState(btn, this.roomData.gameModeIdx == idx, this.isLeader);
                btn.on("click", () => {
                    this.setRoomProperty("gameModeIdx", idx);
                });
                this.modesContainer.append(btn);
            }

            // Invite link
            if (this.roomData.roomUrl) {
                const roomCode = this.roomData.roomUrl.substring(1);
                $("#private-lobby-code").text(roomCode);

                if (SDK.supportsInviteLink()) {
                    SDK.getInviteLink(roomCode).then((sdkUrl) => {
                        $("#private-lobby-url").text(sdkUrl!);
                    });
                } else {
                    const url = new URL(window.location.href);
                    url.search = "";
                    url.hash = this.roomData.roomUrl;

                    $("#private-lobby-url").text(url.toString());

                    if (window.history) {
                        window.history.replaceState("", "", this.roomData.roomUrl);
                    }
                }
            }

            // Play button
            this.playBtn.html(
                this.roomData.findingGame || this.joiningGame
                    ? '<div class="ui-spinner"></div>'
                    : this.playBtn.attr("data-label")!,
            );

            for (let i = 0; i < modeStyles.length; i++) {
                this.playBtn.removeClass(modeStyles[i].buttonCss);
            }
            const style = modeStyles[this.roomData.gameModeIdx];
            if (style) {
                this.playBtn.addClass("btn-custom-mode-no-indent");
                this.playBtn.addClass(style.buttonCss);
                this.playBtn.css({
                    "background-image": `url(${style.icon})`,
                });
            } else {
                this.playBtn.css({
                    "background-image": "",
                });
            }
            let playersInGame = false;
            for (let i = 0; i < this.players.length; i++) {
                playersInGame = playersInGame || this.players[i].inGame;
            }

            const waitReason = $("#msg-private-lobby-wait-reason");

            if (this.isLeader) {
                waitReason.html(
                    `${this.localization.translate(
                        "index-game-in-progress",
                    )}<span> ...</span>`,
                );

                const showWaitMessage = playersInGame && !this.joiningGame;
                waitReason.css("display", "none");
                this.stopGameBtn.css("display", showWaitMessage ? "block" : "none");

                // Auto-reset if no more AFK players while dialog is open
                if (this.afkConfirmPending && !this.players.some((p) => p.afk)) {
                    this.afkConfirmPending = false;
                }

                const showAfkConfirm = this.afkConfirmPending && !showWaitMessage;
                if (showAfkConfirm) {
                    const afkNames = this.players
                        .filter((p) => p.afk)
                        .map((p) => helpers.htmlEscape(p.name))
                        .join(", ");
                    this.afkConfirmContainer
                        .find("#private-lobby-afk-confirm-text")
                        .html(
                            `${afkNames} ${this.localization.translate("index-private-lobby-afk-warning")}`,
                        );
                }
                this.afkConfirmContainer.css("display", showAfkConfirm ? "block" : "none");
                this.playBtn.css("display", showWaitMessage || showAfkConfirm ? "none" : "block");
            } else {
                this.afkConfirmContainer.css("display", "none");
                this.stopGameBtn.css("display", "none");
                if (this.roomData.findingGame || this.joiningGame) {
                    waitReason.html(
                        `<div class="ui-spinner" style="margin-right:16px"></div>${this.localization.translate(
                            "index-joining-game",
                        )}<span> ...</span>`,
                    );
                } else if (playersInGame) {
                    waitReason.html(
                        `${this.localization.translate(
                            "index-game-in-progress",
                        )}<span> ...</span>`,
                    );
                } else {
                    waitReason.html(
                        `${this.localization.translate(
                            "index-waiting-for-leader",
                        )}<span> ...</span>`,
                    );
                }
                waitReason.css("display", "block");
                this.playBtn.css("display", "none");
            }

            this.renderTeamGrid();
            this.renderSettings();

            // Play a sound if player count has increased
            const localPlayer = this.players.find((player) => {
                return player.playerId == this.localPlayerId;
            });
            const playJoinSound = localPlayer && !localPlayer.inGame;
            if (
                !document.hasFocus() &&
                this.prevPlayerCount < this.players.length &&
                this.players.length > 1 &&
                playJoinSound
            ) {
                this.audioManager.playSound("notification_join_01", {
                    channel: "ui",
                });
            }
            this.prevPlayerCount = this.players.length;
        }
    }
}
