import { GameConfig } from "../../../shared/gameConfig";
import { util } from "../../../shared/utils/util";
import type { Vec2 } from "../../../shared/utils/v2";
import type { Game } from "./game";
import type { Player } from "./objects/player";

class BasePlayerGroup {
    id: number;

    /**
     * Duos and squads use groups, faction mode uses teams
     */
    type: "group" | "team";

    players: Player[] = [];
    livingPlayers: Player[] = [];

    allDeadOrDisconnected = true; // only set to false when first player is added to the group

    constructor(id: number, type: BasePlayerGroup["type"]) {
        this.id = id;
        this.type = type;
    }

    getAlivePlayers() {
        return this.players.filter((p) => !p.dead && !p.disconnected);
    }

    getAliveTeammates(player: Player) {
        return this.players.filter((p) => p != player && !p.dead && !p.disconnected);
    }

    checkPlayers(): void {
        this.livingPlayers = this.players.filter((p) => !p.dead);
        this.allDeadOrDisconnected = this.players.every((p) => p.dead || p.disconnected);
    }

    addPlayer(player: Player) {
        player[`${this.type}Id`] = this.id;
        (player[this.type] as BasePlayerGroup) = this;

        this.players.push(player);
        this.livingPlayers.push(player);
        this.allDeadOrDisconnected = false;
        this.checkPlayers();
    }

    removePlayer(player: Player) {
        this.players.splice(this.players.indexOf(player), 1);
        this.checkPlayers();
    }

    /**
     * true if all teammates besides the passed in player are dead
     * also if player is solo queuing, all teammates are "dead" by default
     */
    checkAllDeadOrDisconnected(player: Player) {
        const alivePlayers = !this.players.some(
            (p) => !p.dead && !p.disconnected && p !== player,
        );
        return alivePlayers;
    }

    /**
     * kills all teammates, only called after last player on team thats not knocked gets knocked
     */
    killAllTeammates() {
        const alivePlayers = this.getAlivePlayers();
        for (const p of alivePlayers) {
            p.kill({
                damageType: GameConfig.DamageType.Bleeding,
                dir: p.dir,
                source: p.downedBy,
            });
        }
    }

    /**
     * true if all ALIVE teammates besides the passed in player are downed
     */
    checkAllDowned(player: Player) {
        for (const p of this.players) {
            if (p === player) continue;
            if (p.downed) continue;
            if (p.dead) continue;
            if (p.disconnected) continue;
            return false;
        }
        return true;
    }

    /**
     * checks if any players in the group have the self revive perk
     * @returns true if any players in the group have the self revive perk
     */
    checkSelfRevive() {
        const alivePlayers = this.getAlivePlayers();
        for (const p of alivePlayers) {
            if (p.hasPerk("self_revive")) {
                return true;
            }
        }
        return false;
    }

    /**
     *
     * @param player optional player to exclude
     * @returns random alive player
     */
    randomPlayer(player?: Player) {
        const alivePlayers = player
            ? this.getAliveTeammates(player)
            : this.getAlivePlayers();
        return alivePlayers[util.randomInt(0, alivePlayers.length - 1)];
    }

    /** gets next alive player in the array, loops around if end is reached */
    nextPlayer(currentPlayer: Player) {
        const alivePlayers = this.getAlivePlayers();
        const currentPlayerIndex = alivePlayers.indexOf(currentPlayer);
        const newIndex = (currentPlayerIndex + 1) % alivePlayers.length;
        return alivePlayers[newIndex];
    }

    /** gets previous alive player in the array, loops around if beginning is reached */
    prevPlayer(currentPlayer: Player) {
        const alivePlayers = this.getAlivePlayers();
        const currentPlayerIndex = alivePlayers.indexOf(currentPlayer);
        const newIndex =
            currentPlayerIndex == 0 ? alivePlayers.length - 1 : currentPlayerIndex - 1;
        return alivePlayers[newIndex];
    }
}

export class Group extends BasePlayerGroup {
    hash: string;

    autoFill: boolean;

    maxPlayers: number;
    reservedSlots = 0;

    /**
     * We update the group spawn position (where new teammates will spawn) to the leader position
     * Every 1 second if the leader is on a valid spawn position (e.g not inside a building etc)
     */
    spawnPositionTicker = 0;
    spawnPosition?: Vec2;

    constructor(hash: string, groupId: number, autoFill: boolean, maxPlayers: number) {
        super(groupId, "group");
        this.hash = hash;
        this.autoFill = autoFill;
        this.maxPlayers = maxPlayers;
    }

    canJoin(players: number) {
        return (
            this.maxPlayers - this.reservedSlots - players >= 0 &&
            !this.allDeadOrDisconnected
        );
    }
}

export class Team extends BasePlayerGroup {
    /** even if leader becomes lone survivr, this variable remains unchanged since it's used for gameover msgs */
    leader?: Player;
    isLastManApplied = false;
    isCaptainApplied = false;

    game: Game;

    constructor(game: Game, teamId: number) {
        super(teamId, "team");
        this.game = game;
    }

    getGroups(): Group[] {
        return this.game.playerBarn.groups.filter((g) => g.players[0].teamId == this.id);
    }

    checkAndApplyLastMan() {
        if (this.isLastManApplied) return;

        const playersToPromote = this.livingPlayers.filter(
            (p) => !p.downed && !p.disconnected,
        );

        if (playersToPromote.length > 2 || this.game.canJoin) return;

        const last1 = playersToPromote[0];
        const last2 = playersToPromote[1];
        if (last1 && last1.role != "last_man") last1.promoteToRole("last_man");
        if (last2 && last2.role != "last_man") last2.promoteToRole("last_man");
        this.isLastManApplied = true;
    }

    checkAndApplyCaptain() {
        if (this.isCaptainApplied) return;

        const leaderAlive = this.livingPlayers.find(
            (p) => !p.disconnected && p.role === "leader",
        );
        if (leaderAlive) return;

        const lieutenant = this.livingPlayers.find(
            (p) => !p.downed && !p.disconnected && p.role === "lieutenant",
        );
        if (lieutenant) {
            lieutenant.promoteToRole("captain");
            this.isCaptainApplied = true;
        }
    }
}
