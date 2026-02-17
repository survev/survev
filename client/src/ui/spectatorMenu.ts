import $ from "jquery";
import { PingTest } from "../pingTest";
import { ConfigManager } from "../config";
import { SiteInfo } from "../siteInfo";
import { Localization } from "./localization";
import { helpers } from "../helpers";
import { GameConfig } from "../../../shared/gameConfig";
import { api } from "../api";
import { MenuModal } from "./menuModal";
import { Game } from "../game"; // Make sure the path is correct based on your project structure
import { GameInfo } from "../gameInfo";
import { SDK } from "../sdk/sdk";


export interface MatchData {
    zone: string;
    gameId: number;
    useHttps: boolean;
    hosts: string[];
    addrs: string[];
    data: string;
}

export class SpectatorMenu{

    spectatorMenu = $("#spectator-menu");
    startMenu = $("#start-menu");
    rightColumn = $("#right-column");
    socialShare = $("#social-share-block");
    btnLeaveSpectator = $("#btn-leave-spectator");
    serverSelect = $("#server-select-spectate");
    gameSelect = $("#game-select-main");
    playMode0Btn = $("#btn-start-spectate-0");
    playMode1Btn = $("#btn-start-spectate-1");
    playMode2Btn = $("#btn-start-spectate-2");
    spectateBtn = $("#btn-start-spectate");
    errorMessageDisplay = $("#server-warning");
    playersToggle = $("#players-toggle");
    reloadGamesBtn = $("#btn-reload-games");



    
    refreshModal = new MenuModal($("#modal-refresh"));

    quickPlayPendingModeIdx = -1;
    findGameAttempts = 0;
    findGameTime = 0;

    errorMessage = "";
    spectatorMenuOpen = false;

    game: Game | null = null;

    constructor(
        
        public config: ConfigManager,
        public pingTest: PingTest,  
        public siteInfo: SiteInfo,
        public gameInfo: GameInfo, 
        public localization: Localization,
        public account: any,
        public joinGameCb: (data: MatchData) => void
    ){

        this.serverSelect.on("change", () => {
                const t = this.serverSelect.find(":selected").val();
                this.config.set("region", t as string);
            });

        this.gameSelect.change(() => {
            const selectedGameId = this.gameSelect.val();
            this.gameInfo.renderSelectedGameInfo(selectedGameId as string);
        });

        this.btnLeaveSpectator.click(() => {
            this.leaveSpectatorMode();
        });

        this.reloadGamesBtn.on("click", () => {
            this.gameInfo.fetchGameInfo(this.config.get("region")!);
        });

            this.playMode0Btn.on("click", () => {
                this.tryQuickStartGameAsSpectator(0);
            });
            this.playMode1Btn.on("click", () => {
                    this.tryQuickStartGameAsSpectator(1);
                
            });
            this.playMode2Btn.on("click", () => {
                    this.tryQuickStartGameAsSpectator(2);
                
            });

            this.spectateBtn.on("click", () => {
                //generate matchdata for the currently choosen game in the gameSelect
                const selectedGameId = this.gameSelect.val();
                

                this.findGameWithId(
                    selectedGameId as string,
                    this.config.get("region")!,
                    (err, matchData) => {
                        if (err) {
                            this.onJoinGameError("join_game_spectator_failed");
                            return;
                        }
                        this.joinGameCb(matchData!);
                        this.quickPlayPendingModeIdx = -1;
                        this.loadSpectatorMenu();
                    }
                );
            });

            this.playersToggle.on("click", () => {
                const $box = $('#spectate-players');
                const collapsed = $box.toggleClass('collapsed').hasClass('collapsed');
                this.playersToggle.text(collapsed ? "Show" : "Hide");
            });

            this.update();

    }

    loadSpectatorMenu(){
        this.gameInfo.fetchGameInfo(this.config.get("region")!);
            if (this.errorMessage.length > 0) {
                this.errorMessageDisplay.text(this.errorMessage);
                this.errorMessageDisplay.css("opacity", "1");
            }
            this.spectatorMenu.css("display", "block");
            this.startMenu.css("display", "none");
            this.rightColumn.css("display", "none");

            const regionPops = this.siteInfo.info.pops || {};
            const regions = Object.keys(regionPops);
            for (let i = 0; i < regions.length; i++) {
                const region = regions[i];
                const count = regionPops[region].playerCount;
                const players = this.localization.translate("index-players");

                const sel = $("#spectate-server-opts").children(`option[value="${region}"]`);
                sel.html(`${sel.attr("data-label")} [${count} ${players}]`);
            }       
            

            this.serverSelect.find("option").each((_i, ele) => {
                        const spellSyncLang = SDK.isSpellSync && window.spellSync.language;
                        const configRegion = this.config.get("region");
                        ele.selected = spellSyncLang
                            ? ele.value === spellSyncLang
                            : ele.value === configRegion;
                    });

            

            const updateButton = (ele: JQuery<HTMLElement>, gameModeIdx: number) => {
            ele.html(
                this.quickPlayPendingModeIdx === gameModeIdx
                    ? '<div class="ui-spinner"></div>'
                    : this.localization.translate(ele.data("l10n")),
            );
        };

        updateButton(this.playMode0Btn, 0);
        updateButton(this.playMode1Btn, 1);
        updateButton(this.playMode2Btn, 2);


        }

    leaveSpectatorMode(){
            this.spectatorMenu.css("display", "none");
            this.startMenu.css("display", "block");
            this.rightColumn.css("display", "block");
    }


    tryQuickStartGameAsSpectator(gameModeIdx: number) {
            if (this.quickPlayPendingModeIdx === -1) {
                // Update UI to display a spinner on the play button
                this.quickPlayPendingModeIdx = gameModeIdx;
                this.setConfigFromDOM();
                this.loadSpectatorMenu();
    
                // Wait some amount of time if we've recently attempted to
                // find a game to prevent spamming the server
                let delay = 0;
                if (this.findGameAttempts > 0 && Date.now() - this.findGameTime < 30000) {
                    delay = Math.min(this.findGameAttempts * 2.5 * 1000, 7500);
                } else {
                    this.findGameAttempts = 0;
                }
                this.findGameTime = Date.now();
                this.findGameAttempts++;
    
                const version = GameConfig.protocolVersion;
                let region = this.config.get("region")!;
                const paramRegion = helpers.getParameterByName("region");
                if (paramRegion !== undefined && paramRegion.length > 0) {
                    region = paramRegion;
                }
                let zones = this.pingTest.getZones(region);
                const paramZone = helpers.getParameterByName("zone");
                if (paramZone !== undefined && paramZone.length > 0) {
                    zones = [paramZone];
                }
    
                const matchArgs = {
                    version,
                    region,
                    zones,
                    playerCount: 1,
                    autoFill: true,
                    gameModeIdx,
                };
    
                const tryQuickStartGameImpl = () => {
                    this.waitOnAccount(() => {
                        this.findGameToSpectate(matchArgs, (err, matchData) => {
                            if (err) {
                                this.onJoinGameError("join_game_spectator_failed");
                                return;
                            }
                            this.joinGameCb(matchData!);
                            this.quickPlayPendingModeIdx = -1;
                            this.loadSpectatorMenu();
                        });
                    });
                };
    
                if (delay == 0) {
                    // We can improve findGame responsiveness by ~30 ms by skipping
                    // the 0ms setTimeout
                    tryQuickStartGameImpl();
                } else {
                    setTimeout(() => {
                        tryQuickStartGameImpl();
                    }, delay);
                }
            }
        }



        setConfigFromDOM() {
                const playerName = helpers.sanitizeNameInput(this.config.get("playerName") as string);
                this.config.set("playerName", playerName);
                const region = this.serverSelect.find(":selected").val();
                this.config.set("region", region as string);
        }


        waitOnAccount(cb: () => void) {
            if (this.account.requestsInFlight == 0) {
                cb();
            } else {
                // Wait some maximum amount of time for pending account requests
                const timeout = setTimeout(() => {
                    runOnce();
                }, 2500);
                const runOnce = () => {
                    cb();
                    clearTimeout(timeout);
                    this.account.removeEventListener("requestsComplete", runOnce);
                };
                this.account.addEventListener("requestsComplete", runOnce);
            }
        }


        findGameToSpectate(
        matchArgs: unknown,
        cb: (err?: string | null, matchData?: MatchData) => void,
    ) {
        (function findGameImpl(iter, maxAttempts) {
            if (iter >= maxAttempts) {
                cb("full");
                return;
            }
            const retry = function () {
                setTimeout(() => {
                    findGameImpl(iter + 1, maxAttempts);
                }, 500);
            };
            $.ajax({
                type: "POST",
                url: api.resolveUrl("/api/find_spectator_game"),
                data: JSON.stringify(matchArgs),
                contentType: "application/json; charset=utf-8",
                timeout: 10 * 1000,
                success: function (data: { err?: string; res: [MatchData] }) {
                    if (data?.err && data.err != "full") {
                        cb(data.err);
                        return;
                    }
                    const matchData = data?.res ? data.res[0] : null;
                    if (matchData?.hosts && matchData.addrs) {
                        cb(null, matchData);
                    } else {
                        retry();
                    }
                },
                error: function (_e) {
                    retry();
                },
            });
        })(0, 2);
    }

    onJoinGameError(err: string) {
        const errMap = {
            full: this.localization.translate("index-failed-finding-game"),
            invalid_protocol: this.localization.translate("index-invalid-protocol"),
            join_game_failed: this.localization.translate("index-failed-joining-game"),
            join_game_spectator_failed: this.localization.translate("index-failed-joining-spectator-game"),
        };
        if (err == "invalid_protocol") {
            this.showInvalidProtocolModal();
        }
        this.errorMessage = errMap[err as keyof typeof errMap] || errMap.full;
        this.quickPlayPendingModeIdx = -1;
        this.loadSpectatorMenu();
    }

    showInvalidProtocolModal() {
        this.refreshModal.show(true);
    }

    update(){
        //loop every  reloading the menu
        setInterval(() => {
            this.gameInfo.fetchGameInfo(this.config.get("region")!);
        }, 10000);
    }

    findGameWithId(selectedGameId: string, region: string, cb: (err?: string | null, matchData?: MatchData) => void,){
        (function findGameImpl(iter, maxAttempts) {
            if (iter >= maxAttempts) {
                cb("full");
                return;
            }
            const retry = function () {
                setTimeout(() => {
                    findGameImpl(iter + 1, maxAttempts);
                }, 500);
            };
            $.ajax({
                type: "POST",
                url: api.resolveUrl("/api/find_game_by_id"),
                data: JSON.stringify({ gameId: selectedGameId, region: region }),
                contentType: "application/json; charset=utf-8",
                timeout: 10 * 1000,
                success: function (data: { err?: string; res: [MatchData] }) {
                    if (data?.err && data.err != "full") {
                        cb(data.err);
                        return;
                    }
                    const matchData = data?.res ? data.res[0] : null;
                    if (matchData?.hosts && matchData.addrs) {
                        cb(null, matchData);
                    } else {
                        retry();
                    }
                },
                error: function (_e) {
                    retry();
                },
            });
        })(0, 2);
    }

}