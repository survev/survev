import { GameConfig, TeamMode } from "../../../shared/gameConfig.ts";
import type { DuelCombatSnapshot } from "../../../shared/types/rankedCombat.ts";
import { getFindGamePlayerData } from "../api/apiHelpers.ts";
import { Config } from "../config.ts";
import type { DuelRoundStatus, FindGamePrivateBody, FindGamePrivateRes } from "../utils/types.ts";
import type { RoundHost, RoundProgress, RoundRequest } from "./coordinator.ts";

export class GameServerDuelHost implements RoundHost {
    private base(region: string) {
        const config = Config.regions[region];
        if (!config) throw new Error("Invalid game region.");
        return `http${config.https ? "s" : ""}://${config.address}`;
    }
    private headers = { "content-type": "application/json", "survev-api-key": Config.secrets.SURVEV_API_KEY };

    async create(request: RoundRequest) {
        const players = request.players.map(player => ({
            joinToken: player.joinToken,
            userId: Config.database.enabled ? player.id : null,
            ip: player.ip,
        }));
        const playerData = Config.database.enabled ? await getFindGamePlayerData(players) : players;
        const body: FindGamePrivateBody = {
            region: request.region,
            version: GameConfig.protocolVersion,
            autoFill: false,
            mapName: "duel",
            teamMode: request.teamSize === 1 ? TeamMode.Solo : request.teamSize === 2 ? TeamMode.Duo : TeamMode.Squad,
            duel: {
                seriesId: request.seriesId,
                roundId: request.roundId,
                round: request.round,
                teamSize: request.teamSize,
            },
            playerData: request.players.map((player, index) => ({
                ...playerData[index],
                // Ranked records its own series results and does not advance normal-match quests.
                quests: [],
                duelProfileId: player.id,
                duelTeam: player.team,
                duelName: player.name,
            })),
        };
        const response = await fetch(`${this.base(request.region)}/api/find_game`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) throw new Error(`Game server returned ${response.status}`);
        const allocation = await response.json() as FindGamePrivateRes;
        if ("error" in allocation || !allocation.gameId || !allocation.urls.length) {
            throw new Error("No duel arena available.");
        }
        return { gameId: allocation.gameId, urls: allocation.urls };
    }
    async progress(regions = Object.keys(Config.regions)): Promise<RoundProgress[]> {
        const results = await Promise.allSettled(regions.map(region => this.regionProgress(region)));
        return results.flatMap(result => result.status === "fulfilled" ? result.value : []);
    }
    private async regionProgress(region: string): Promise<RoundProgress[]> {
        const response = await fetch(`${this.base(region)}/private/status`, {
            headers: this.headers,
            signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) throw new Error("Game server status unavailable.");
        const body = await response.json() as { games: { gameData: { id: string; duel?: DuelRoundStatus } }[] };
        return body.games.flatMap(game =>
            game.gameData.duel
                ? [{
                    gameId: game.gameData.id,
                    ...game.gameData.duel,
                }]
                : []
        );
    }
    async cancel(seriesId: string, roundId: string, region: string) {
        const response = await fetch(`${this.base(region)}/api/cancel_duel`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({ seriesId, roundId }),
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error(`Could not close duel arena: ${response.status}`);
    }
    async removePlayer(seriesId: string, roundId: string, profileId: string, region: string) {
        const response = await fetch(`${this.base(region)}/api/remove_duel_player`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({ seriesId, roundId, profileId }),
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error(`Could not remove duel player: ${response.status}`);
        const result = await response.json() as { ok: boolean; combat?: DuelCombatSnapshot };
        if (!result.ok) throw new Error("The game server did not confirm the player removal.");
        return result.combat;
    }
}
