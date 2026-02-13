import type { AbstractMsg, BitStream } from "./net";
import { PlayerStatsMsg } from "./playerStatsMsg";

export class GameOverMsg implements AbstractMsg {
    teamId = 0;
    teamRank = 0;
    rank = 0;
    gameOver = false;
    winningTeamId = 0;
    //spectator = false;
    betterStats = false;
    playerStats: Array<PlayerStatsMsg["playerStats"]> = [];

    serialize(s: BitStream) {
        /* STRIP_FROM_PROD_CLIENT:START */
        s.writeUint8(this.teamId);
        s.writeUint8(this.teamRank);
        s.writeUint8(this.rank);
        s.writeUint8(+this.gameOver);
        s.writeUint8(this.winningTeamId);
        //s.writeUint8(+this.spectator);
        s.writeUint8(+this.betterStats);

        s.writeArray(this.playerStats, 8, (stats) => {
            const statsMsg = new PlayerStatsMsg();
            statsMsg.playerStats = stats;
            statsMsg.serialize(s);
        });
        /* STRIP_FROM_PROD_CLIENT:END */
    }

    deserialize(s: BitStream) {
        this.teamId = s.readUint8();
        this.teamRank = s.readUint8();
        this.rank = s.readUint8();
        this.gameOver = s.readUint8() as unknown as boolean;
        this.winningTeamId = s.readUint8();
        //this.spectator = s.readUint8() as unknown as boolean;
        this.betterStats = s.readUint8() as unknown as boolean;

        this.playerStats = s.readArray(8, () => {
            const statsMsg = new PlayerStatsMsg();
            statsMsg.deserialize(s);
            return statsMsg.playerStats;
        });
    }
}
