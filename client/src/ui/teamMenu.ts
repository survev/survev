import $ from "jquery";
import { GameConfig } from "../../../shared/gameConfig";
import * as net from "../../../shared/net/net";
import type { FindGameMatchData } from "../../../shared/types/api";
import type {
    RoomData,
    ServerToClientTeamMsg,
    TeamMenuErrorType,
    TeamPlayGameMsg,
    TeamStateMsg,
} from "../../../shared/types/team";
import { api } from "../api";
import type { AudioManager } from "../audioManager";
import type { ConfigManager } from "../config";
import { device } from "../device";
import { helpers } from "../helpers";
import type { PingTest } from "../pingTest";
import { SDK } from "../sdk";
import type { SiteInfo } from "../siteInfo";
import type { Localization } from "./localization";

function errorTypeToString(type: string, localization: Localization) {
    const typeMap = {
        join_full: localization.translate("index-team-is-full"),
        join_not_found: localization.translate("index-failed-joining-team"),
        create_failed: localization.translate("index-failed-creating-team"),
        join_failed: localization.translate("index-failed-joining-team"),
        join_game_failed: localization.translate("index-failed-joining-game"),
        lost_conn: localization.translate("index-lost-connection"),
        find_game_error: localization.translate("index-failed-finding-game"),
        find_game_full: localization.translate("index-failed-finding-game"),
        find_game_invalid_protocol: localization.translate("index-invalid-protocol"),
        find_game_invalid_captcha: localization.translate("index-invalid-captcha"),
        kicked: localization.translate("index-team-kicked"),
        banned: localization.translate("index-ip-banned"),
        behind_proxy: "behind_proxy", // this will get passed to the main app to show a modal
    } as Record<TeamMenuErrorType, string>;
    return typeMap[type as keyof typeof typeMap] || typeMap.lost_conn;
}

export class TeamMenu {
    // Jquery elems
    playBtn = $("#btn-start-team");
    serverWarning = $("#server-warning");
    teamOptions = $(
        "#btn-team-queue-mode-1, #btn-team-queue-mode-2, #btn-team-fill-auto, #btn-team-fill-none",
    );

    serverSelect = $("#team-server-select");
    queueMode1 = $("#btn-team-queue-mode-1");
    queueMode2 = $("#btn-team-queue-mode-2");
    fillAuto = $("#btn-team-fill-auto");
    fillNone = $("#btn-team-fill-none");

    active = false;
    joined = false;
    create = false;
    joiningGame = false;
    ws: WebSocket | null = null;
    keepAliveTimeout = 0;

    // Ui state
    playerData = {};
    roomData = {} as RoomData;
    players: Array<{
        playerId: number;
        inGame: boolean;
        name: string;
        isLeader: boolean;
    }> = [];

    prevPlayerCount = 0;
    localPlayerId = 0;
    isLeader = true;
    editingName = false;
    displayedInvalidProtocolModal = false;

    hideUrl!: boolean;

    constructor(
        public config: ConfigManager,
        public pingTest: PingTest,
        public siteInfo: SiteInfo,
        public localization: Localization,
        public audioManager: AudioManager,
        public joinGameCb: (data: FindGameMatchData) => void,
        public leaveCb: (err: string) => void,
    ) {
        // Listen for ui modifications
        this.serverSelect.on("change", () => {
            const e = this.serverSelect.find(":selected").val() as string;
            this.pingTest.start([e]);
            this.setRoomProperty("region", e);
        });
        this.queueMode1.on("click", () => {
            this.setRoomProperty("gameModeIdx", 1);
        });
        this.queueMode2.on("click", () => {
            this.setRoomProperty("gameModeIdx", 2);
        });
        this.fillAuto.on("click", () => {
            this.setRoomProperty("autoFill", true);
        });
        this.fillNone.on("click", () => {
            this.setRoomProperty("autoFill", false);
        });
        this.playBtn.on("click", () => {
            SDK.requestMidGameAd(() => {
                this.tryStartGame();
            });
        });
        $("#team-copy-url, #team-desc-text").on("click", (e) => {
            const t = $("<div/>", {
                class: "copy-toast",
                html: "Copied!",
            });
            $("#start-menu-wrapper").append(t);
            t.css({
                left: e.pageX - parseInt(t.css("width")) / 2,
                top: $("#team-copy-url").offset()!.top,
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
            let codeToCopy = $("#team-url").text();
            // if running on an iframe
            if (window !== window.top) {
                codeToCopy = this.roomData.roomUrl.substring(1);
            }
            helpers.copyTextToClipboard(codeToCopy);
        });

        if (window !== window.top) {
            $("#team-desc-text").hide();
        }

        if (!device.mobile) {
            // Hide invite link
            this.hideUrl = false;
            $("#team-hide-url").on("click", (e) => {
                const el = e.currentTarget;
                this.hideUrl = !this.hideUrl;
                $("#team-desc-text, #team-code-text").css({
                    opacity: this.hideUrl ? 0 : 1,
                });
                $(el).css({
                    "background-image": this.hideUrl
                        ? "url(../img/gui/hide.svg)"
                        : "url(../img/gui/eye.svg)",
                });
            });
        }

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

    connect(create: boolean, roomUrl: string) {
        if (!this.active || roomUrl !== this.roomData.roomUrl) {
            const roomHost = api.resolveRoomHost();
            const url = `w${
                window.location.protocol === "https:" ? "ss" : "s"
            }://${roomHost}/team_v2`;
            this.active = true;
            this.joined = false;
            this.create = create;
            this.joiningGame = false;
            this.editingName = false;

            // Load properties from config
            this.playerData = {
                name: this.config.get("playerName"),
            };
            this.roomData = {
                roomUrl,
                region: this.config.get("region")!,
                gameModeIdx: this.config.get("gameModeIdx")!,
                autoFill: this.config.get("teamAutoFill")!,
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
            this.refreshUi();

            // Save state to config for the menu
            this.config.set("gameModeIdx", this.roomData.gameModeIdx);
            this.config.set("teamAutoFill", this.roomData.autoFill);
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

    onMessage<T extends ServerToClientTeamMsg["type"]>(
        type: T,
        data: ServerToClientTeamMsg["data"],
    ) {
        switch (type) {
            case "state": {
                let stateData = data as TeamStateMsg["data"];
                this.joined = true;
                const ourRoomData = this.roomData;
                this.roomData = stateData.room;
                this.players = stateData.players;
                this.localPlayerId = stateData.localPlayerId;
                this.isLeader = this.getPlayerById(this.localPlayerId)!.isLeader;

                // Override room properties with local values if we're
                // the leader; otherwise, the server may override a
                // recent change.
                //
                // A better solution here would be just a sequence
                // number and we can ignore updates that don't include our
                // most recent change request.
                if (this.isLeader) {
                    this.roomData.region = ourRoomData.region;
                    this.roomData.autoFill = ourRoomData.autoFill;
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
        if (this.isLeader && !this.roomData.findingGame) {
            const version = GameConfig.protocolVersion;
            let region = this.roomData.region;
            const paramRegion = helpers.getParameterByName("region");
            if (paramRegion !== undefined && paramRegion.length > 0) {
                region = paramRegion;
            }
            let zones = this.pingTest.getZones(region);
            const paramZone = helpers.getParameterByName("zone");
            if (paramZone !== undefined && paramZone.length > 0) {
                zones = [paramZone];
            }
            const matchArgs: TeamPlayGameMsg["data"] = {
                version,
                region,
                zones,
            };

            helpers.verifyTurnstile(this.roomData.captchaEnabled, (token) => {
                matchArgs.turnstileToken = token;
                this.sendMessage("playGame", matchArgs);
            });
            this.roomData.findingGame = true;
            this.refreshUi();
        }
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
        $("#team-menu").css("display", this.active ? "block" : "none");
        $("#start-menu").css("display", this.active ? "none" : "block");
        $("#right-column").css("display", this.active ? "none" : "block");
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

        // Set captcha to enabled if we fail the captcha
        // This can happen if it was disabled when the page loaded which would meant it was sending an empty token
        // And we only fetch the state when the page loads...
        if (this.roomData.lastError === "find_game_invalid_captcha") {
            this.siteInfo.info.captchaEnabled = true;
        }

        // Show/hide team connecting/contents
        if (this.active) {
            $("#team-menu-joining-text").css("display", this.create ? "none" : "block");
            $("#team-menu-creating-text").css("display", this.create ? "block" : "none");
            $("#team-menu-connecting").css("display", this.joined ? "none" : "block");
            $("#team-menu-contents").css("display", this.joined ? "block" : "none");
            $("#btn-team-leave").css("display", this.joined ? "block" : "none");
        }

        if (this.joined) {
            // Regions
            const regionPops = this.siteInfo.info.pops || {};
            const regions = Object.keys(regionPops);
            for (let i = 0; i < regions.length; i++) {
                const region = regions[i];
                const count = regionPops[region].playerCount;
                const players = this.localization.translate("index-players");
                const sel = $("#team-server-opts").children(`option[value="${region}"]`);
                sel.html(`${sel.attr("data-label")} [${count} ${players}]`);
            }

            this.serverSelect.find("option").each((_idx, ele) => {
                ele.selected = ele.value == this.roomData.region;
            });

            // Modes btns
            setButtonState(
                this.queueMode1,
                this.roomData.gameModeIdx == 1,
                this.isLeader && this.roomData.enabledGameModeIdxs.includes(1),
            );
            setButtonState(
                this.queueMode2,
                this.roomData.gameModeIdx == 2,
                this.isLeader && this.roomData.enabledGameModeIdxs.includes(2),
            );

            // Fill mode
            setButtonState(this.fillAuto, this.roomData.autoFill, this.isLeader);
            setButtonState(this.fillNone, !this.roomData.autoFill, this.isLeader);
            this.serverSelect.prop("disabled", !this.isLeader);

            // Invite link
            if (this.roomData.roomUrl) {
                const roomCode = this.roomData.roomUrl.substring(1);
                $("#team-code").text(roomCode);

                if (SDK.supportsInviteLink()) {
                    SDK.getInviteLink(roomCode).then((sdkUrl) => {
                        $("#team-url").text(sdkUrl!);
                    });
                } else {
                    const roomUrl = new URL(window.location.href);
                    roomUrl.search = ""; // removes ?t=<timestamp> that is set when the client receives an invalid protocol error
                    roomUrl.hash = this.roomData.roomUrl;

                    const url = new URL(window.location.href);
                    url.search = "";
                    url.hash = this.roomData.roomUrl;

                    $("#team-url").text(url.toString());

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

            const gameModeStyles = this.siteInfo.getGameModeStyles();
            for (let i = 0; i < gameModeStyles.length; i++) {
                this.playBtn.removeClass(gameModeStyles[i].buttonCss);
            }
            const style = gameModeStyles[this.roomData.gameModeIdx];
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

            const waitReason = $("#msg-wait-reason");

            if (this.isLeader) {
                waitReason.html(
                    `${this.localization.translate(
                        "index-game-in-progress",
                    )}<span> ...</span>`,
                );

                const showWaitMessage = playersInGame && !this.joiningGame;
                waitReason.css("display", showWaitMessage ? "block" : "none");
                this.playBtn.css("display", showWaitMessage ? "none" : "block");
            } else {
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

            // Player properties
            const teamMembers = $("#team-menu-member-list");
            teamMembers.empty();
            for (let t = 0; t < this.roomData.maxPlayers; t++) {
                let playerStatus = {
                    name: "",
                    playerId: 0,
                    isLeader: false,
                    inGame: false,
                    self: false,
                };
                if (t < this.players.length) {
                    const player = this.players[t];
                    playerStatus = {
                        name: player.name,
                        playerId: player.playerId,
                        isLeader: player.isLeader,
                        inGame: player.inGame,
                        self: player.playerId == this.localPlayerId,
                    };
                }

                const member = $("<div/>", {
                    class: "team-menu-member",
                });

                // Left-side icon
                let iconClass = "";
                if (playerStatus.isLeader) {
                    iconClass = " icon-leader";
                } else if (this.isLeader && playerStatus.playerId != 0) {
                    iconClass = " icon-kick";
                }

                member.append(
                    $("<div/>", {
                        class: `icon${iconClass}`,
                        "data-playerid": playerStatus.playerId,
                    }),
                );
                let n: JQuery<HTMLInputElement> | null = null;
                let c = null;
                if (this.editingName && playerStatus.self) {
                    n = $("<input/>", {
                        type: "text",
                        tabindex: 0,
                        class: "name menu-option name-text name-self-input",
                        maxLength: net.Constants.PlayerNameMaxLen,
                    });
                    n.val(playerStatus.name);
                    const m = () => {
                        const name = helpers.sanitizeNameInput(n?.val()!);
                        playerStatus.name = name;
                        this.config.set("playerName", name);
                        this.sendMessage("changeName", {
                            name,
                        });
                        this.editingName = false;
                        this.refreshUi();
                    };
                    const h = () => {
                        this.editingName = false;
                        this.refreshUi();
                    };
                    n.on("keydown", (e) => {
                        if (e.which === 13) {
                            m();
                            return false;
                        }
                    });
                    n.on("blur", h);
                    member.append(n);
                    c = $("<div/>", {
                        class: "icon icon-submit-name-change",
                    });
                    c.on("click", m);
                    c.on("mousedown", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    });
                } else {
                    // Name
                    let nameClass = "name-text";

                    if (playerStatus.self) {
                        nameClass += " name-self";
                    }
                    if (playerStatus.inGame) {
                        nameClass += " name-in-game";
                    }
                    const nameDiv = $("<div/>", {
                        class: `name menu-option ${nameClass}`,
                        html: helpers.htmlEscape(playerStatus.name),
                    });
                    if (playerStatus.self) {
                        nameDiv.on("click", () => {
                            this.editingName = true;
                            this.refreshUi();
                        });
                    }
                    member.append(nameDiv);
                }
                if (c) {
                    member.append(c);
                } else {
                    member.append(
                        $("<div/>", {
                            class: `icon ${playerStatus.inGame ? "icon-in-game" : ""}`,
                        }),
                    );
                }
                teamMembers.append(member);
                n?.trigger("focus");
            }

            $(".icon-kick", teamMembers).on("click", (e) => {
                const playerId = Number($(e.currentTarget).attr("data-playerid"));
                this.sendMessage("kick", {
                    playerId,
                });
            });

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
