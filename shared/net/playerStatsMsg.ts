import type { AbstractMsg, BitStream } from "./net";

export class PlayerStatsMsg implements AbstractMsg {
    playerStats = {
        playerId: 0,
        rank: 0,
        timeAlive: 0,
        kills: 0,
        dead: false,
        damageDealt: 0,
        damageTaken: 0,
    };

    serialize(s: BitStream) {
        /* STRIP_FROM_PROD_CLIENT:START */
        s.writeUint16(this.playerStats.playerId);
        s.writeUint16(this.playerStats.rank);
        s.writeUint16(this.playerStats.timeAlive);
        s.writeUint8(this.playerStats.kills);
        s.writeUint8(this.playerStats.dead as unknown as number);
        // writing integers will just strip the decimal digits instead of rounding
        // so without rounding 99.9999... will become 99 instead of 100
        s.writeUint16(Math.round(this.playerStats.damageDealt));
        s.writeUint16(Math.round(this.playerStats.damageTaken));
        /* STRIP_FROM_PROD_CLIENT:END */
    }

    deserialize(s: BitStream) {
        const playerStats = {} as this["playerStats"];
        playerStats.playerId = s.readUint16();
        playerStats.rank = s.readUint16();
        playerStats.timeAlive = s.readUint16();
        playerStats.kills = s.readUint8();
        playerStats.dead = s.readUint8() as unknown as boolean;
        playerStats.damageDealt = s.readUint16();
        playerStats.damageTaken = s.readUint16();
        this.playerStats = playerStats;
    }
}
