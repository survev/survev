/**
 * Network messages for Progressive Bounty Battle Royale
 */
import type { AbstractMsg, BitStream } from "./net";

/**
 * Bounty update message - sent to all players after a kill
 * Updates bounty information for killer and broadcasts kill reward
 */
export class BountyKillMsg implements AbstractMsg {
    killerId = 0;           // In-game player ID of killer
    victimId = 0;           // In-game player ID of victim
    instantPayout = 0;      // Instant bounty earned (in cents)
    killerNewBounty = 0;    // Killer's new head bounty (in cents)
    killerTotalEarned = 0;  // Killer's total bounties earned this game (in cents)
    killerKills = 0;        // Killer's kill count

    serialize(s: BitStream) {
        s.writeUint16(this.killerId);
        s.writeUint16(this.victimId);
        s.writeUint32(this.instantPayout);
        s.writeUint32(this.killerNewBounty);
        s.writeUint32(this.killerTotalEarned);
        s.writeUint8(this.killerKills);
    }

    deserialize(s: BitStream) {
        this.killerId = s.readUint16();
        this.victimId = s.readUint16();
        this.instantPayout = s.readUint32();
        this.killerNewBounty = s.readUint32();
        this.killerTotalEarned = s.readUint32();
        this.killerKills = s.readUint8();
    }
}

/**
 * Player bounty status - sent as part of update message
 */
export interface PlayerBountyStatus {
    playerId: number;
    headBounty: number;     // Current bounty on their head (in cents)
    totalEarned: number;    // Total bounties earned (in cents)
    kills: number;
}

/**
 * Bounty leaderboard entry
 */
export interface BountyLeaderboardEntry {
    playerId: number;
    username: string;
    kills: number;
    headBounty: number;     // In cents
    totalEarned: number;    // In cents
    rank: number;
}

/**
 * Game bounty info message - sent when player joins bounty game
 */
export class BountyGameInfoMsg implements AbstractMsg {
    isBountyGame = false;
    stakeTierId = "";
    entryFee = 0;           // In cents
    totalPool = 0;          // In cents
    placementPool = 0;      // In cents
    bountyPool = 0;         // In cents
    baseBounty = 0;         // In cents (per player starting bounty)
    firstPrize = 0;         // In cents
    secondPrize = 0;        // In cents
    thirdPrize = 0;         // In cents
    playerCount = 0;

    serialize(s: BitStream) {
        s.writeBoolean(this.isBountyGame);
        if (!this.isBountyGame) return;

        s.writeASCIIString(this.stakeTierId, 16);
        s.writeUint32(this.entryFee);
        s.writeUint32(this.totalPool);
        s.writeUint32(this.placementPool);
        s.writeUint32(this.bountyPool);
        s.writeUint32(this.baseBounty);
        s.writeUint32(this.firstPrize);
        s.writeUint32(this.secondPrize);
        s.writeUint32(this.thirdPrize);
        s.writeUint8(this.playerCount);
    }

    deserialize(s: BitStream) {
        this.isBountyGame = s.readBoolean();
        if (!this.isBountyGame) return;

        this.stakeTierId = s.readASCIIString(16);
        this.entryFee = s.readUint32();
        this.totalPool = s.readUint32();
        this.placementPool = s.readUint32();
        this.bountyPool = s.readUint32();
        this.baseBounty = s.readUint32();
        this.firstPrize = s.readUint32();
        this.secondPrize = s.readUint32();
        this.thirdPrize = s.readUint32();
        this.playerCount = s.readUint8();
    }
}

/**
 * Player's own bounty status update - sent to individual player
 */
export class BountyStatusMsg implements AbstractMsg {
    headBounty = 0;         // Current bounty on head (in cents)
    totalEarned = 0;        // Total bounties earned (in cents)
    kills = 0;

    serialize(s: BitStream) {
        s.writeUint32(this.headBounty);
        s.writeUint32(this.totalEarned);
        s.writeUint8(this.kills);
    }

    deserialize(s: BitStream) {
        this.headBounty = s.readUint32();
        this.totalEarned = s.readUint32();
        this.kills = s.readUint8();
    }
}

/**
 * Bounty game over stats - extends normal game over with bounty info
 */
export class BountyGameOverMsg implements AbstractMsg {
    isBountyGame = false;
    finalRank = 0;
    kills = 0;
    bountiesEarned = 0;     // In cents
    placementPrize = 0;     // In cents
    headBountyKept = 0;     // In cents (only for winner)
    totalPayout = 0;        // In cents
    entryFee = 0;           // In cents (for ROI calculation)

    serialize(s: BitStream) {
        s.writeBoolean(this.isBountyGame);
        if (!this.isBountyGame) return;

        s.writeUint8(this.finalRank);
        s.writeUint8(this.kills);
        s.writeUint32(this.bountiesEarned);
        s.writeUint32(this.placementPrize);
        s.writeUint32(this.headBountyKept);
        s.writeUint32(this.totalPayout);
        s.writeUint32(this.entryFee);
    }

    deserialize(s: BitStream) {
        this.isBountyGame = s.readBoolean();
        if (!this.isBountyGame) return;

        this.finalRank = s.readUint8();
        this.kills = s.readUint8();
        this.bountiesEarned = s.readUint32();
        this.placementPrize = s.readUint32();
        this.headBountyKept = s.readUint32();
        this.totalPayout = s.readUint32();
        this.entryFee = s.readUint32();
    }
}

/**
 * Bounty leaderboard message - sent periodically or on request
 */
export class BountyLeaderboardMsg implements AbstractMsg {
    entries: BountyLeaderboardEntry[] = [];

    serialize(s: BitStream) {
        s.writeUint8(this.entries.length);
        for (const entry of this.entries) {
            s.writeUint16(entry.playerId);
            s.writeASCIIString(entry.username, 16);
            s.writeUint8(entry.kills);
            s.writeUint32(entry.headBounty);
            s.writeUint32(entry.totalEarned);
            s.writeUint8(entry.rank);
        }
    }

    deserialize(s: BitStream) {
        const count = s.readUint8();
        this.entries = [];
        for (let i = 0; i < count; i++) {
            this.entries.push({
                playerId: s.readUint16(),
                username: s.readASCIIString(16),
                kills: s.readUint8(),
                headBounty: s.readUint32(),
                totalEarned: s.readUint32(),
                rank: s.readUint8(),
            });
        }
    }
}
