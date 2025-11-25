/**
 * BountyManager - handles in-game bounty tracking for Progressive Bounty Battle Royale
 *
 * This class manages real-time bounty state during a game,
 * synchronizing with the database via the API server.
 */
import * as net from "../../../shared/net/net";
import {
    calculateBountyPool,
    calculatePlacementPrizes,
    calculateKillBounty,
    getStakeTier,
    type BountyPoolInfo,
} from "../../../shared/bounty/bountyConfig";
import { apiPrivateRouter } from "../utils/serverHelpers";
import type { Game } from "./game";
import type { Player } from "./objects/player";

export interface PlayerBountyState {
    playerId: number;
    oderId: string;
    headBounty: number;      // Current bounty on head (in cents)
    totalEarned: number;     // Total bounties claimed (in cents)
    kills: number;
    alive: boolean;
    rank: number;
}

export interface BountyKillResult {
    instant: number;
    carried: number;
    killerNewBounty: number;
    killerTotalEarned: number;
    killerKills: number;
}

/**
 * BountyManager handles all bounty-related logic during a game
 */
export class BountyManager {
    readonly game: Game;

    // Is this a bounty game?
    enabled = false;

    // Bounty game ID (from database)
    bountyGameId: string = "";

    // Stake tier info
    stakeTierId: string = "";
    entryFee: number = 0;
    rakePercent: number = 0;

    // Pool info
    poolInfo: BountyPoolInfo | null = null;
    placementPrizes: { first: number; second: number; third: number } | null = null;

    // Player bounty states (keyed by in-game player ID)
    playerStates = new Map<number, PlayerBountyState>();

    // Leaderboard update ticker
    leaderboardTicker = 0;
    leaderboardUpdateRate = 5; // Send leaderboard every 5 seconds

    // Pending bounty operations to sync with database
    pendingKills: Array<{
        killerPlayerId: number;
        victimPlayerId: number;
        damageType: number;
        weaponType: string;
    }> = [];

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Initialize bounty game with stake tier
     */
    async init(bountyGameId: string, stakeTierId: string): Promise<boolean> {
        const tier = getStakeTier(stakeTierId);
        if (!tier) {
            console.error(`Invalid stake tier: ${stakeTierId}`);
            return false;
        }

        this.enabled = true;
        this.bountyGameId = bountyGameId;
        this.stakeTierId = stakeTierId;
        this.entryFee = tier.entry;
        this.rakePercent = tier.rake;

        return true;
    }

    /**
     * Called when the game starts - calculate pools and set initial bounties
     */
    startGame(): void {
        if (!this.enabled) return;

        const playerCount = this.game.playerBarn.livingPlayers.length;

        // Calculate pool info
        this.poolInfo = calculateBountyPool(
            this.entryFee,
            playerCount,
            this.rakePercent,
        );

        this.placementPrizes = calculatePlacementPrizes(this.poolInfo.placementPool);

        // Initialize player states with base bounty
        for (const player of this.game.playerBarn.livingPlayers) {
            this.playerStates.set(player.__id, {
                oderId: player.__id.toString(),
                playerId: player.__id,
                headBounty: this.poolInfo.baseBounty,
                totalEarned: 0,
                kills: 0,
                alive: true,
                rank: 0,
            });
        }

        // Send bounty game info to all players
        this.broadcastGameInfo();

        // Sync with database (non-blocking)
        this.syncStartWithDatabase();
    }

    /**
     * Add a player to bounty tracking (for players joining after init)
     */
    addPlayer(player: Player): void {
        if (!this.enabled || !this.poolInfo) return;

        // Players joining late get the base bounty
        this.playerStates.set(player.__id, {
            playerId: player.__id,
            oderId: player.__id.toString(),
            headBounty: this.poolInfo.baseBounty,
            totalEarned: 0,
            kills: 0,
            alive: true,
            rank: 0,
        });

        // Send personal bounty status
        this.sendBountyStatus(player);
    }

    /**
     * Handle a kill - calculate bounty payout and update states
     */
    handleKill(
        killer: Player,
        victim: Player,
        damageType: number,
        weaponType: string,
    ): BountyKillResult | null {
        if (!this.enabled) return null;

        const killerState = this.playerStates.get(killer.__id);
        const victimState = this.playerStates.get(victim.__id);

        if (!killerState || !victimState) {
            return null;
        }

        // Don't process if same team (shouldn't happen but safety check)
        if (killer.teamId === victim.teamId && killer !== victim) {
            return null;
        }

        // Calculate bounty split
        const { instant, carried } = calculateKillBounty(victimState.headBounty);

        // Update killer state
        killerState.headBounty += carried;
        killerState.totalEarned += instant;
        killerState.kills++;

        // Update victim state
        victimState.alive = false;

        // Queue for database sync
        this.pendingKills.push({
            killerPlayerId: killer.__id,
            victimPlayerId: victim.__id,
            damageType,
            weaponType,
        });

        // Broadcast bounty kill message
        this.broadcastKill(killer, victim, instant, killerState);

        // Send updated status to killer
        this.sendBountyStatus(killer);

        return {
            instant,
            carried,
            killerNewBounty: killerState.headBounty,
            killerTotalEarned: killerState.totalEarned,
            killerKills: killerState.kills,
        };
    }

    /**
     * Handle environment death (zone, fall damage, etc.)
     */
    handleEnvironmentDeath(
        victim: Player,
        lastDamager?: Player,
    ): BountyKillResult | null {
        if (!this.enabled) return null;

        const victimState = this.playerStates.get(victim.__id);
        if (!victimState) return null;

        // Mark victim as dead
        victimState.alive = false;

        // If there's a last damager, give them the bounty
        if (lastDamager && lastDamager !== victim) {
            return this.handleKill(lastDamager, victim, 0, "environment");
        }

        // Otherwise bounty disappears (house edge)
        return null;
    }

    /**
     * Handle player disconnect
     */
    handleDisconnect(player: Player): void {
        if (!this.enabled) return;

        const state = this.playerStates.get(player.__id);
        if (state) {
            state.alive = false;
        }
    }

    /**
     * Update - called every game tick
     */
    update(dt: number): void {
        if (!this.enabled) return;

        // Update leaderboard periodically
        this.leaderboardTicker += dt;
        if (this.leaderboardTicker >= this.leaderboardUpdateRate) {
            this.leaderboardTicker = 0;
            this.broadcastLeaderboard();
        }

        // Sync pending kills to database
        this.syncPendingKills();
    }

    /**
     * End game - calculate final payouts
     */
    async endGame(
        rankings: Array<{ player: Player; rank: number }>,
    ): Promise<void> {
        if (!this.enabled || !this.poolInfo || !this.placementPrizes) return;

        // Update ranks in player states
        for (const { player, rank } of rankings) {
            const state = this.playerStates.get(player.__id);
            if (state) {
                state.rank = rank;

                // Send bounty game over to each player
                this.sendGameOver(player, state, rank);
            }
        }

        // Sync final results to database
        await this.syncEndWithDatabase(rankings);
    }

    /**
     * Get player's bounty state
     */
    getPlayerState(playerId: number): PlayerBountyState | undefined {
        return this.playerStates.get(playerId);
    }

    /**
     * Get bounty leaderboard (top 10 by head bounty)
     */
    getLeaderboard(): PlayerBountyState[] {
        return Array.from(this.playerStates.values())
            .filter(s => s.alive)
            .sort((a, b) => b.headBounty - a.headBounty)
            .slice(0, 10);
    }

    // ===============================
    // Network message methods
    // ===============================

    /**
     * Broadcast game info to all players
     */
    private broadcastGameInfo(): void {
        if (!this.poolInfo || !this.placementPrizes) return;

        const msg = new net.BountyGameInfoMsg();
        msg.isBountyGame = true;
        msg.stakeTierId = this.stakeTierId;
        msg.entryFee = this.entryFee;
        msg.totalPool = this.poolInfo.totalPool;
        msg.placementPool = this.poolInfo.placementPool;
        msg.bountyPool = this.poolInfo.bountyPool;
        msg.baseBounty = this.poolInfo.baseBounty;
        msg.firstPrize = this.placementPrizes.first;
        msg.secondPrize = this.placementPrizes.second;
        msg.thirdPrize = this.placementPrizes.third;
        msg.playerCount = this.playerStates.size;

        this.game.broadcastMsg(net.MsgType.BountyGameInfo, msg);
    }

    /**
     * Send bounty status to specific player
     */
    private sendBountyStatus(player: Player): void {
        const state = this.playerStates.get(player.__id);
        if (!state) return;

        const msg = new net.BountyStatusMsg();
        msg.headBounty = state.headBounty;
        msg.totalEarned = state.totalEarned;
        msg.kills = state.kills;

        const stream = new net.MsgStream(new ArrayBuffer(64));
        stream.serializeMsg(net.MsgType.BountyStatus, msg);
        this.game.sendSocketMsg(player.socketId, stream.getBuffer());
    }

    /**
     * Broadcast kill bounty message
     */
    private broadcastKill(
        killer: Player,
        victim: Player,
        instantPayout: number,
        killerState: PlayerBountyState,
    ): void {
        const msg = new net.BountyKillMsg();
        msg.killerId = killer.__id;
        msg.victimId = victim.__id;
        msg.instantPayout = instantPayout;
        msg.killerNewBounty = killerState.headBounty;
        msg.killerTotalEarned = killerState.totalEarned;
        msg.killerKills = killerState.kills;

        this.game.broadcastMsg(net.MsgType.BountyKill, msg);
    }

    /**
     * Broadcast leaderboard to all players
     */
    private broadcastLeaderboard(): void {
        const leaderboard = this.getLeaderboard();

        const msg = new net.BountyLeaderboardMsg();
        msg.entries = leaderboard.map((state, index) => {
            const player = this.game.playerBarn.players.find(p => p.__id === state.playerId);
            return {
                playerId: state.playerId,
                username: player?.name || "Unknown",
                kills: state.kills,
                headBounty: state.headBounty,
                totalEarned: state.totalEarned,
                rank: index + 1,
            };
        });

        this.game.broadcastMsg(net.MsgType.BountyLeaderboard, msg);
    }

    /**
     * Send game over stats to player
     */
    private sendGameOver(player: Player, state: PlayerBountyState, rank: number): void {
        if (!this.placementPrizes) return;

        const msg = new net.BountyGameOverMsg();
        msg.isBountyGame = true;
        msg.finalRank = rank;
        msg.kills = state.kills;
        msg.bountiesEarned = state.totalEarned;
        msg.entryFee = this.entryFee;

        // Calculate placement prize
        if (rank === 1) {
            msg.placementPrize = this.placementPrizes.first;
            msg.headBountyKept = state.headBounty;
        } else if (rank === 2) {
            msg.placementPrize = this.placementPrizes.second;
        } else if (rank === 3) {
            msg.placementPrize = this.placementPrizes.third;
        }

        msg.totalPayout = state.totalEarned + msg.placementPrize + msg.headBountyKept;

        const stream = new net.MsgStream(new ArrayBuffer(64));
        stream.serializeMsg(net.MsgType.BountyGameOver, msg);
        this.game.sendSocketMsg(player.socketId, stream.getBuffer());
    }

    // ===============================
    // Database sync methods
    // ===============================

    /**
     * Sync game start with database
     */
    private async syncStartWithDatabase(): Promise<void> {
        // This would call the API to update game status
        // For now we'll handle this through the existing save_game endpoint
        console.log(`[Bounty] Game ${this.bountyGameId} started with ${this.playerStates.size} players`);
    }

    /**
     * Sync pending kills to database
     */
    private async syncPendingKills(): Promise<void> {
        if (this.pendingKills.length === 0) return;

        const kills = [...this.pendingKills];
        this.pendingKills = [];

        // In production, this would batch-send to the API
        // For now, kills are tracked in-memory and synced at game end
        console.log(`[Bounty] Syncing ${kills.length} kills`);
    }

    /**
     * Sync game end with database
     */
    private async syncEndWithDatabase(
        rankings: Array<{ player: Player; rank: number }>,
    ): Promise<void> {
        console.log(`[Bounty] Game ${this.bountyGameId} ended, processing payouts`);

        // In production, this would call the bounty payout API
        // The API would handle wallet credits and database updates
    }
}
