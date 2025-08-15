import { TeamColor } from "../../../shared/defs/maps/factionDefs";
import { GameConfig, TeamMode } from "../../../shared/gameConfig";
import { ObjectType } from "../../../shared/net/objectSerializeFns";
import type { PlayerStatus } from "../../../shared/net/updateMsg";
import { collider } from "../../../shared/utils/collider";
import { util } from "../../../shared/utils/util";
import { v2 } from "../../../shared/utils/v2";
import type { Game } from "./game";
import type { DamageParams } from "./objects/gameObject";
import type { Player } from "./objects/player";

enum GameMode {
    /** default solos, any map besides factions */
    Solo,
    /** default duos or squads, any map besides factions */
    Team,
    /** irrelevant to gamemode type, always the mode if faction map is selected */
    Faction,
}

export class GameModeManager {
    readonly game: Game;
    readonly mode: GameMode;
    readonly isSolo: boolean;

    constructor(game: Game) {
        this.game = game;

        this.mode = [
            game.teamMode == TeamMode.Solo && !game.map.factionMode,
            game.teamMode != TeamMode.Solo && !game.map.factionMode,
            game.map.factionMode,
        ].findIndex((isMode) => isMode);

        this.isSolo = this.mode === GameMode.Solo;
    }

    aliveCount(): number {
        switch (this.mode) {
            case GameMode.Solo:
                return this.game.playerBarn.livingPlayers.length;
            case GameMode.Team:
                return this.game.playerBarn.getAliveGroups().length;
            case GameMode.Faction:
                return this.game.playerBarn.getAliveTeams().length;
        }
    }

    // so the game doesn't start when there's only 2 players and one can of them can despawn which would end the game
    // instead it will await 10 seconds for the second player to not be able to despawn before starting
    cantDespawnAliveCount(): number {
        switch (this.mode) {
            case GameMode.Solo:
                return this.game.playerBarn.livingPlayers.filter((p) => !p.canDespawn())
                    .length;
            case GameMode.Team:
                return this.game.playerBarn.getAliveGroups().filter((group) => {
                    return group.players.filter((p) => !p.canDespawn()).length > 0;
                }).length;
            case GameMode.Faction:
                return this.game.playerBarn.getAliveTeams().filter((team) => {
                    return team.players.filter((p) => !p.canDespawn()).length;
                }).length;
        }
    }

    // used when saving the game match data
    getPlayersSortedByRank(): Array<{ player: Player; rank: number }> {
        const players = [...this.game.playerBarn.players];

        switch (this.mode) {
            case GameMode.Solo: {
                return players
                    .sort((a, b) => {
                        return b.killedIndex - a.killedIndex;
                    })
                    .map((player, idx) => {
                        return {
                            player,
                            rank: idx + 1,
                        };
                    });
            }
            case GameMode.Team:
            case GameMode.Faction: {
                // the logic is basically the exact same for both
                // just uses team instead of group on faction...

                const key = this.mode === GameMode.Faction ? "teams" : "groups";

                // calculate each group killed index
                // by basing it on the last player to die killed index
                const groups = this.game.playerBarn[key].map((group) => {
                    return {
                        killedIndex:
                            group.players.sort((a, b) => {
                                return b.killedIndex - a.killedIndex;
                            })[0].killedIndex ?? Infinity,
                        players: group.players,
                    };
                });

                groups.sort((a, b) => b.killedIndex - a.killedIndex);

                let data: Array<{ player: Player; rank: number }> = [];

                for (let i = 0; i < groups.length; i++) {
                    for (const player of groups[i].players) {
                        data.push({
                            player,
                            rank: i + 1,
                        });
                    }
                }

                return data;
            }
        }
    }

    /** true if game needs to end */
    handleGameEnd(): boolean {
        if (!this.game.started || this.aliveCount() > 1) return false;
        switch (this.mode) {
            case GameMode.Solo: {
                const winner = this.game.playerBarn.livingPlayers[0];
                winner.addGameOverMsg(winner.teamId);
                return true;
            }
            case GameMode.Team: {
                const winner = this.game.playerBarn.getAliveGroups()[0];
                for (const player of winner.getAlivePlayers()) {
                    player.addGameOverMsg(winner.groupId);
                }
                return true;
            }
            case GameMode.Faction: {
                const winner = this.game.playerBarn.getAliveTeams()[0];
                for (const player of winner.livingPlayers) {
                    player.addGameOverMsg(winner.teamId);
                }
                return true;
            }
        }
    }

    isGameStarted(): boolean {
        return this.cantDespawnAliveCount() > 1;
    }

    updateAliveCounts(aliveCounts: number[]): void {
        switch (this.mode) {
            case GameMode.Solo:
            case GameMode.Team:
                aliveCounts.push(this.game.aliveCount);
                break;
            case GameMode.Faction:
                const numFactions = this.game.map.mapDef.gameMode.factions!;
                for (let i = 0; i < numFactions; i++) {
                    aliveCounts.push(this.game.playerBarn.teams[i].livingPlayers.length);
                }
                break;
        }
    }

    /**
     * Solos: all living players in game wrapped in outer array
     *
     * Duos/Squads: 2D array of living players in each group
     *
     * Factions: 2D array of living players on each team
     */
    getAlivePlayersContext(): Player[][] {
        switch (this.mode) {
            case GameMode.Solo:
                return [this.game.playerBarn.livingPlayers];
            case GameMode.Team:
                return this.game.playerBarn.groups.map((g) => g.livingPlayers);
            case GameMode.Faction:
                return this.game.playerBarn.teams.map((t) => t.livingPlayers);
        }
    }

    getSpectatablePlayers(player: Player): Player[] {
        let playerFilter: (p: Player) => boolean;
        if (this.getPlayerAlivePlayersContext(player).length != 0) {
            playerFilter = (p: Player) => !p.disconnected && p.teamId == player.teamId;
        } else {
            // if no players left on group/team, player can spectate anyone
            playerFilter = (p: Player) => !p.disconnected;
        }
        // livingPlayers is used here instead of a more "efficient" option because its sorted while other options are not
        return this.game.playerBarn.livingPlayers.filter(playerFilter);
    }

    getPlayerStatusPlayers(player: Player): Player[] | undefined {
        switch (this.mode) {
            case GameMode.Solo:
                return undefined;
            case GameMode.Team:
                return player.group!.players;
            case GameMode.Faction:
                return this.game.playerBarn.players;
        }
    }

    getPlayerAlivePlayersContext(player: Player): Player[] {
        switch (this.mode) {
            case GameMode.Solo:
                return !player.dead ? [player] : [];
            case GameMode.Team:
                return player.group!.livingPlayers;
            case GameMode.Faction:
                return player.team!.livingPlayers;
        }
    }

    getIdContext(player: Player): number {
        switch (this.mode) {
            case GameMode.Solo:
                return player.__id;
            case GameMode.Team:
                return player.groupId;
            case GameMode.Faction:
                return player.teamId;
        }
    }

    /** includes passed in player */
    getNearbyAlivePlayersContext(player: Player, range: number): Player[] {
        const alivePlayersContext = this.getPlayerAlivePlayersContext(player);

        // probably more efficient when there's 4 or less players in the context (untested)
        if (alivePlayersContext.length <= 4) {
            return alivePlayersContext.filter(
                (p) =>
                    !!util.sameLayer(player.layer, p.layer) &&
                    v2.lengthSqr(v2.sub(player.pos, p.pos)) <= range * range,
            );
        }

        const playerIdContext = this.getIdContext(player);
        return this.game.grid
            .intersectCollider(collider.createCircle(player.pos, range))
            .filter(
                (obj): obj is Player =>
                    obj.__type == ObjectType.Player &&
                    playerIdContext == this.getIdContext(obj) &&
                    !obj.dead && // necessary since player isnt deleted from grid on death
                    !!util.sameLayer(player.layer, obj.layer) &&
                    v2.lengthSqr(v2.sub(player.pos, obj.pos)) <= range * range,
            );
    }

    isReviveSupported(): boolean {
        return !this.isSolo;
    }

    isReviving(player: Player): boolean {
        if (this.isSolo) return false;

        return player.actionType == GameConfig.Action.Revive && !!player.action.targetId;
    }

    isBeingRevived(player: Player): boolean {
        if (!player.downed || this.isSolo) return false;

        const normalRevive =
            player.actionType == GameConfig.Action.Revive && player.action.targetId == 0;
        if (normalRevive) return true;

        const numMedics = this.game.playerBarn.medics.length;
        if (numMedics) {
            return this.game.playerBarn.medics.some((medic) => {
                return (
                    medic != player &&
                    this.isReviving(medic) &&
                    player.isAffectedByAOE(medic)
                );
            });
        }
        return false;
    }

    showStatsMsg(player: Player): boolean {
        switch (this.mode) {
            case GameMode.Solo:
                return false;
            case GameMode.Team:
                return !player.group!.allDeadOrDisconnected && this.aliveCount() > 1;
            case GameMode.Faction:
                return this.aliveCount() > 1;
        }
    }

    getGameoverPlayers(player: Player): Player[] {
        switch (this.mode) {
            case GameMode.Solo:
                return [player];
            case GameMode.Team:
                return player.group!.players;
            case GameMode.Faction:
                const redLeader = this.game.playerBarn.teams[TeamColor.Red - 1].leader;
                const blueLeader = this.game.playerBarn.teams[TeamColor.Blue - 1].leader;
                const highestKiller = this.game.playerBarn.players.reduce(
                    (highestKiller, p) =>
                        highestKiller.kills > p.kills ? highestKiller : p,
                );

                // if game ends before leaders are promoted, just show the player by himself
                return !redLeader || !blueLeader
                    ? [player]
                    : [player, redLeader, blueLeader, highestKiller];
        }
    }

    /**
     * gives all the players spectating the player who died a new player to spectate
     * @param player player who died
     */
    assignNewSpectate(player: Player): void {
        // This method doesn't use a mode switchcase like all the other methods in this class,
        // as the spectate logic is identitical with the sole exception of narrowing random players
        // in 50v50: random players spectated in 50v50 should be on the same team as the spectator.

        // If there are no spectators, we have no need to run any logic.
        if (player.spectatorCount === 0) return;

        // Priority list of spectate targets.
        const spectateTargets = [
            player.group?.randomPlayer(), // undefined if no player to choose
            player.team?.randomPlayer(), // undefined if no player to choose
            player.getAliveKiller(),
            player.game.playerBarn.randomPlayer(),
        ];

        const playerToSpec = spectateTargets.filter((x) => x !== undefined).shift();
        for (const spectator of player.spectators) {
            // If all group members have died, they need to be sent a game over message instead.
            if (
                player.group &&
                player.group.allDeadOrDisconnected &&
                player.group.players.includes(spectator)
            )
                continue;

            // Set remaining spectators to new player.
            spectator.spectating = playerToSpec;
        }
    }

    getPlayerStatuses(player: Player): PlayerStatus[] {
        if (this.isSolo) return [];

        const players: Player[] = this.getPlayerStatusPlayers(player)!;
        return players.map((p) => ({
            hasData: p.playerStatusDirty,
            pos: p.pos,
            visible: p.teamId === player.teamId || p.timeUntilHidden > 0,
            dead: p.dead,
            downed: p.downed,
            role: p.role,
        }));
    }

    handlePlayerDeath(player: Player, params: DamageParams): void {
        switch (this.mode) {
            case GameMode.Solo:
                return player.kill(params);
            case GameMode.Team:
                {
                    const sourceIsPlayer = params.source?.__type === ObjectType.Player;
                    const group = player.group!;
                    if (player.downed) {
                        const finishedByTeammate =
                            player.downedBy &&
                            sourceIsPlayer &&
                            player.downedBy.groupId === (params.source as Player).groupId;

                        const bledOut =
                            player.downedBy &&
                            params.damageType == GameConfig.DamageType.Bleeding;

                        if (finishedByTeammate || bledOut) {
                            params.source = player.downedBy;
                        }

                        player.kill(params);
                        // special case that only happens when the player has self_revive since the teammates wouldnt have previously been finished off
                        if (group.checkAllDowned(player) && !group.checkSelfRevive()) {
                            // don't kill teammates if any one has self revive
                            group.killAllTeammates();
                        }
                        return;
                    }

                    const allDeadOrDisconnected =
                        group.checkAllDeadOrDisconnected(player);
                    const allDowned = group.checkAllDowned(player);
                    const groupHasSelfRevive = group.livingPlayers.find((p) =>
                        p.hasPerk("self_revive"),
                    );

                    if (!groupHasSelfRevive && (allDeadOrDisconnected || allDowned)) {
                        group.allDeadOrDisconnected = true; // must set before any kill() calls so the gameovermsgs are accurate
                        player.kill(params);
                        if (allDowned) {
                            group.killAllTeammates();
                        }
                    } else {
                        player.down(params);
                    }
                }
                break;
            case GameMode.Faction:
                {
                    const sourceIsPlayer = params.source?.__type === ObjectType.Player;
                    const team = player.team!;
                    if (player.downed) {
                        const finishedByTeammate =
                            player.downedBy &&
                            sourceIsPlayer &&
                            player.downedBy.teamId === (params.source as Player).teamId;

                        const bledOut =
                            player.downedBy &&
                            params.damageType == GameConfig.DamageType.Bleeding;

                        if (finishedByTeammate || bledOut) {
                            params.source = player.downedBy;
                        }

                        player.kill(params);
                        // special case that only happens when the player has self_revive since the teammates wouldnt have previously been finished off
                        if (team.checkAllDowned(player) && !team.checkSelfRevive()) {
                            team.killAllTeammates();
                        }
                        return;
                    }

                    const allDeadOrDisconnected = team.checkAllDeadOrDisconnected(player);
                    const allDowned = team.checkAllDowned(player);
                    const teamHasSelfRevive = team.livingPlayers.find((p) =>
                        p.hasPerk("self_revive"),
                    );

                    if (!teamHasSelfRevive && (allDeadOrDisconnected || allDowned)) {
                        player.kill(params);
                        if (allDowned) {
                            team.killAllTeammates();
                        }
                    } else {
                        player.down(params);
                    }
                }
                break;
        }
    }
}
