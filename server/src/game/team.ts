import { GameConfig } from "../../../shared/gameConfig";
import { util } from "../../../shared/utils/util";
import type { Game } from "./game";
import type { Group } from "./group";
import type { Player } from "./objects/player";

export class Team {
    players: Player[] = [];
    livingPlayers: Player[] = [];
    /** number of alive players once the lobby closes, only set and used after lobby close */
    highestAliveCount = -1;
    /** even if leader becomes lone survivr, this variable remains unchanged since it's used for gameover msgs */
    leader?: Player;
    isLastManApplied = false;
    isCaptainApplied = false;

    constructor(
        public game: Game,
        public teamId: number,
    ) {}

    addPlayer(player: Player): void {
        player.teamId = this.teamId;
        player.team = this;
        this.players.push(player);
        this.livingPlayers.push(player);
    }

    removePlayer(player: Player): void {
        this.players.splice(this.players.indexOf(player), 1);
        this.livingPlayers.splice(this.livingPlayers.indexOf(player), 1);
    }

    /** random alive player */
    randomPlayer() {
        return this.livingPlayers[util.randomInt(0, this.livingPlayers.length - 1)];
    }

    getGroups(): Group[] {
        return this.game.playerBarn.groups.filter(
            (g) => g.players[0].teamId == this.teamId,
        );
    }

    checkAllDowned(player: Player): boolean {
        // players with self_revive are discarded from the check since they can get downed "independently"
        // they have no influence over the other downed teammates and how the code measures them
        const filteredPlayers = this.livingPlayers.filter(
            (p) => p != player && !p.hasPerk("self_revive"),
        );
        if (filteredPlayers.length == 0) {
            // this is necessary since for some dumb reason every() on an empty array returns true????
            return false;
        }
        return filteredPlayers.every((p) => p.downed);
    }

    checkAllDead(player: Player): boolean {
        return this.livingPlayers.length == 1 && this.livingPlayers[0] == player;
    }

    killAllTeammates() {
        for (let i = this.livingPlayers.length - 1; i >= 0; i--) {
            const p = this.livingPlayers[i];
            p.kill({
                damageType: GameConfig.DamageType.Bleeding,
                dir: p.dir,
                source: p.downedBy,
            });
        }
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
