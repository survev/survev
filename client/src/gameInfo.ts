import { api } from "./api";
import $ from "jquery";
import { Game } from "./game";
import { ConfigManager } from "./config";

export class GameInfo {

    //map game IDs und dann info zu den jeweiligen games (mode, playercount, playernames, runtime)
    gameInfoMap: Map<string, { teamMode: number; playerCount: number; playerNames: string[]; runtime: number; stopped: boolean }> = new Map();

    constructor(
        public config: ConfigManager
    ) {
        //api request an server um gameinfo zu bekommen

        this.fetchGameInfo(this.config.get("region")!);
        console.log(this.gameInfoMap);
    }

    fetchGameInfo(region: string) {
        console.log("Fetching game info for region:", region);

        // Hier wird die API-Anfrage an den Server gestellt, um die Game-Informationen zu erhalten
        $.ajax({
            url: api.resolveUrl("/api/game_infos"),
            type: "POST",
            data: JSON.stringify({ region: region }),
            contentType: "application/json; charset=utf-8",
            success: (response) => {
                this.gameInfoMap.clear();
                const games = (response?.data ?? []).filter((game: any) => game.playerCount > 0); // <- hier filtern // Array oder Fallback []
                games.forEach((game: any) => {
                    this.gameInfoMap.set(game.id, {
                        teamMode: game.teamMode,
                        playerCount: game.playerCount,
                        playerNames: game.playerNames,
                        runtime: game.runtime,
                        stopped: game.stopped,
                    });
                });
            this.load();
            },
            error: (error) => {
                console.error("Error fetching game info:", error);
            },
        });
    }

    load() {
            console.log("Loading game info...");

            const prevSelection = $('#game-select-main').val();

            $('#game-opts').empty();

            this.gameInfoMap;
            let i = 0;
            console.log("Available games:");
            for (const [gameId, info] of this.gameInfoMap) {
                console.log(`Game ID: ${gameId}, Info: ${JSON.stringify(info)}`);
                i++;
                let teamMode = this.teamModeToText(info.teamMode);
                $('#game-opts').append(`<option value="${gameId}" data-players="${info.playerNames}">[Game#${i}] ${teamMode} - ${info.playerCount} players</option>`);
            }

            if (i === 0) {
                $('#game-opts').append(`<option value="0" data-players="">Currently No Games Available</option>`);
                $('#game-select-main').val('0');
            }

            if (prevSelection && $(`#game-select-main option[value="${prevSelection}"]`).length) {
                $('#game-select-main').val(prevSelection);
            }else{
                //no prevselection use first of gameInfoMap
                const firstGameId = this.gameInfoMap.keys().next().value;
                if (firstGameId) {
                    $('#game-select-main').val(firstGameId);
                }
            }
            console.log("prevSelection", prevSelection);

            this.renderSelectedGameInfo($('#game-select-main').val() as string);
    }

    teamModeToText(n: number){ return n === 4 ? 'Squad' : (n === 2 ? 'Duo' : 'Solo'); }

    renderPlayers(list: string[]): void {
        const html = (list && list.length)
            ? `<ul>${list.map((p: string) => `<li>${String(p)}`).join('')}</ul>`
            : '<div class="empty">No players</div>';
        $('#spectate-players').html(html);
        // Button-Text passend zum Zustand
        const collapsed: boolean = $('#spectate-players').hasClass('collapsed');
        $('#players-toggle').text(collapsed ? 'Show' : 'Hide');
    }

    renderSelectedGameInfo(selectedId: string) {
        if (!selectedId) {
            $('#spectate-teamMode-name').text('—');
            $('#spectate-playerCount').text('—');
            $('#spectate-runtime').text('—');
            this.renderPlayers([]);
        return;
    }
    const info = this.gameInfoMap.get(selectedId);
    if (!info){
        $('#spectate-teamMode-name').text('—');
        $('#spectate-playerCount').text('0');
        $('#spectate-runtime').text('—');
        this.renderPlayers([]);
        return;
    }
        $('#spectate-teamMode-name').text(this.teamModeToText(info.teamMode));
        $('#spectate-playerCount').text(info.playerCount ?? (info.playerNames?.length ?? 0));
        $('#spectate-runtime').text(this.fmtRuntime(info.runtime ?? 0));
        this.renderPlayers(info.playerNames || []);
    }

    fmtRuntime(sec: number) {
    if (sec == null || isNaN(sec)) return "0:00";
    sec = Math.floor(sec); // Nach unten runden, Dezimalstellen weg
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

}