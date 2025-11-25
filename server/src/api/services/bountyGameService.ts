/**
 * Bounty Game Service - manages bounty game lifecycle and payouts
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
    bountyGamesTable,
    bountyEntriesTable,
    bountyKillsTable,
    bountyPayoutsTable,
    type BountyGamesTableSelect,
    type BountyEntriesTableSelect,
} from "../db/bountySchema";
import {
    calculateBountyPool,
    calculatePlacementPrizes,
    calculateKillBounty,
    getStakeTier,
    type BountyPoolInfo,
    type BountyGameStatus,
} from "../../../../shared/bounty/bountyConfig";
import { WalletService } from "./walletService";

export interface BountyGameInfo {
    bountyGameId: string;
    gameId: string;
    stakeTierId: string;
    entryFee: number;
    status: BountyGameStatus;
    playerCount: number;
    minPlayers: number;
    maxPlayers: number;
    poolInfo?: BountyPoolInfo;
}

export interface PlayerBountyState {
    headBounty: number;
    totalEarned: number;
    kills: number;
}

export interface KillBountyResult {
    instantPayout: number;
    carriedBounty: number;
    killerNewBounty: number;
    killerTotalEarned: number;
}

export interface GameEndPayout {
    userId: string;
    playerId: number;
    username: string;
    rank: number;
    kills: number;
    bountiesEarned: number;
    placementPrize: number;
    headBountyKept: number;
    totalPayout: number;
}

/**
 * BountyGameService handles bounty game operations
 */
export const BountyGameService = {
    /**
     * Create a new bounty game
     */
    async createBountyGame(
        gameId: string,
        stakeTierId: string,
        region: string,
    ): Promise<BountyGameInfo | null> {
        const tier = getStakeTier(stakeTierId);
        if (!tier || !tier.enabled) {
            console.error(`Invalid or disabled stake tier: ${stakeTierId}`);
            return null;
        }

        try {
            const [bountyGame] = await db
                .insert(bountyGamesTable)
                .values({
                    gameId,
                    stakeTierId,
                    entryFee: tier.entry,
                    rakePercent: tier.rake,
                    minPlayers: tier.minPlayers,
                    maxPlayers: tier.maxPlayers,
                    region,
                    status: "lobby",
                })
                .returning();

            return {
                bountyGameId: bountyGame.id,
                gameId: bountyGame.gameId,
                stakeTierId: bountyGame.stakeTierId,
                entryFee: bountyGame.entryFee,
                status: bountyGame.status as BountyGameStatus,
                playerCount: bountyGame.playerCount,
                minPlayers: bountyGame.minPlayers,
                maxPlayers: bountyGame.maxPlayers,
            };
        } catch (error) {
            console.error("Error creating bounty game:", error);
            return null;
        }
    },

    /**
     * Get bounty game by game ID
     */
    async getBountyGameByGameId(gameId: string): Promise<BountyGamesTableSelect | null> {
        const game = await db.query.bountyGamesTable.findFirst({
            where: eq(bountyGamesTable.gameId, gameId),
        });
        return game || null;
    },

    /**
     * Get bounty game by bounty game ID
     */
    async getBountyGame(bountyGameId: string): Promise<BountyGamesTableSelect | null> {
        const game = await db.query.bountyGamesTable.findFirst({
            where: eq(bountyGamesTable.id, bountyGameId),
        });
        return game || null;
    },

    /**
     * Add player to bounty game
     */
    async addPlayer(
        bountyGameId: string,
        userId: string,
        playerId: number,
        username: string,
    ): Promise<{ success: boolean; error?: string; entry?: BountyEntriesTableSelect }> {
        const game = await this.getBountyGame(bountyGameId);
        if (!game) {
            return { success: false, error: "Game not found" };
        }

        if (game.status !== "lobby" && game.status !== "starting") {
            return { success: false, error: "Game not accepting players" };
        }

        if (game.playerCount >= game.maxPlayers) {
            return { success: false, error: "Game is full" };
        }

        // Check if already in game
        const existing = await db.query.bountyEntriesTable.findFirst({
            where: and(
                eq(bountyEntriesTable.bountyGameId, bountyGameId),
                eq(bountyEntriesTable.userId, userId),
            ),
        });

        if (existing) {
            return { success: false, error: "Already in game" };
        }

        // Process entry payment
        const paymentResult = await WalletService.processGameEntry(
            userId,
            game.entryFee,
            bountyGameId,
            game.stakeTierId,
        );

        if (!paymentResult.success) {
            return { success: false, error: paymentResult.error || "Payment failed" };
        }

        try {
            // Add entry
            const [entry] = await db
                .insert(bountyEntriesTable)
                .values({
                    bountyGameId,
                    userId,
                    playerId,
                    username,
                    entryPaid: game.entryFee,
                })
                .returning();

            // Update player count
            await db
                .update(bountyGamesTable)
                .set({ playerCount: sql`${bountyGamesTable.playerCount} + 1` })
                .where(eq(bountyGamesTable.id, bountyGameId));

            return { success: true, entry };
        } catch (error) {
            // Refund if entry failed
            await WalletService.processRefund(
                userId,
                game.entryFee,
                bountyGameId,
                "Entry registration failed",
            );
            console.error("Error adding player to bounty game:", error);
            return { success: false, error: "Failed to join game" };
        }
    },

    /**
     * Start the bounty game (called when game actually starts)
     */
    async startGame(bountyGameId: string): Promise<BountyPoolInfo | null> {
        const game = await this.getBountyGame(bountyGameId);
        if (!game) {
            console.error("Game not found for start:", bountyGameId);
            return null;
        }

        // Calculate pool
        const poolInfo = calculateBountyPool(
            game.entryFee,
            game.playerCount,
            game.rakePercent,
        );

        const prizes = calculatePlacementPrizes(poolInfo.placementPool);

        // Update game with pool info
        await db
            .update(bountyGamesTable)
            .set({
                status: "in_progress",
                startedAt: new Date(),
                totalPool: poolInfo.totalPool,
                houseRake: poolInfo.houseRake,
                placementPool: poolInfo.placementPool,
                bountyPool: poolInfo.bountyPool,
                baseBounty: poolInfo.baseBounty,
            })
            .where(eq(bountyGamesTable.id, bountyGameId));

        // Set initial bounties for all players
        await db
            .update(bountyEntriesTable)
            .set({ headBounty: poolInfo.baseBounty })
            .where(eq(bountyEntriesTable.bountyGameId, bountyGameId));

        return poolInfo;
    },

    /**
     * Get player's bounty entry
     */
    async getPlayerEntry(
        bountyGameId: string,
        playerId: number,
    ): Promise<BountyEntriesTableSelect | null> {
        const entry = await db.query.bountyEntriesTable.findFirst({
            where: and(
                eq(bountyEntriesTable.bountyGameId, bountyGameId),
                eq(bountyEntriesTable.playerId, playerId),
            ),
        });
        return entry || null;
    },

    /**
     * Get player's bounty entry by user ID
     */
    async getPlayerEntryByUserId(
        bountyGameId: string,
        userId: string,
    ): Promise<BountyEntriesTableSelect | null> {
        const entry = await db.query.bountyEntriesTable.findFirst({
            where: and(
                eq(bountyEntriesTable.bountyGameId, bountyGameId),
                eq(bountyEntriesTable.userId, userId),
            ),
        });
        return entry || null;
    },

    /**
     * Handle kill - calculate and apply bounty
     */
    async handleKill(
        bountyGameId: string,
        killerPlayerId: number,
        victimPlayerId: number,
        damageType: number,
        weaponType: string,
    ): Promise<KillBountyResult | null> {
        const [killer, victim] = await Promise.all([
            this.getPlayerEntry(bountyGameId, killerPlayerId),
            this.getPlayerEntry(bountyGameId, victimPlayerId),
        ]);

        if (!killer || !victim) {
            console.error("Kill handler: player not found");
            return null;
        }

        // Calculate bounty split
        const { instant, carried } = calculateKillBounty(victim.headBounty);

        // Update killer
        const killerNewBounty = killer.headBounty + carried;
        const killerTotalEarned = killer.bountiesClaimed + instant;

        await db
            .update(bountyEntriesTable)
            .set({
                headBounty: killerNewBounty,
                bountiesClaimed: killerTotalEarned,
                kills: sql`${bountyEntriesTable.kills} + 1`,
            })
            .where(eq(bountyEntriesTable.id, killer.id));

        // Update victim
        await db
            .update(bountyEntriesTable)
            .set({
                alive: false,
                diedAt: new Date(),
            })
            .where(eq(bountyEntriesTable.id, victim.id));

        // Record kill
        await db.insert(bountyKillsTable).values({
            bountyGameId,
            killerId: killer.userId,
            killerPlayerId,
            victimId: victim.userId,
            victimPlayerId,
            victimHeadBounty: victim.headBounty,
            instantPayout: instant,
            carriedBounty: carried,
            damageType,
            weaponType,
        });

        // Credit instant payout to killer's wallet
        await WalletService.processBountyPayout(
            killer.userId,
            instant,
            bountyGameId,
            "bounty_instant",
            `Kill bounty: ${victim.username}`,
        );

        return {
            instantPayout: instant,
            carriedBounty: carried,
            killerNewBounty,
            killerTotalEarned,
        };
    },

    /**
     * Handle player death by environment (zone, fall, etc.)
     * Give bounty to last damager if available
     */
    async handleEnvironmentDeath(
        bountyGameId: string,
        victimPlayerId: number,
        lastDamagerPlayerId?: number,
    ): Promise<KillBountyResult | null> {
        const victim = await this.getPlayerEntry(bountyGameId, victimPlayerId);
        if (!victim) return null;

        // Mark victim as dead
        await db
            .update(bountyEntriesTable)
            .set({
                alive: false,
                diedAt: new Date(),
            })
            .where(eq(bountyEntriesTable.id, victim.id));

        // If there's a last damager, give them the bounty
        if (lastDamagerPlayerId && lastDamagerPlayerId !== victimPlayerId) {
            return this.handleKill(
                bountyGameId,
                lastDamagerPlayerId,
                victimPlayerId,
                0, // Environment damage type
                "environment",
            );
        }

        // Otherwise bounty disappears (house edge increase)
        return null;
    },

    /**
     * Handle player disconnect
     */
    async handleDisconnect(bountyGameId: string, playerId: number): Promise<void> {
        await db
            .update(bountyEntriesTable)
            .set({ disconnected: true })
            .where(and(
                eq(bountyEntriesTable.bountyGameId, bountyGameId),
                eq(bountyEntriesTable.playerId, playerId),
            ));
    },

    /**
     * Get all players in bounty game
     */
    async getPlayers(bountyGameId: string): Promise<BountyEntriesTableSelect[]> {
        return db.query.bountyEntriesTable.findMany({
            where: eq(bountyEntriesTable.bountyGameId, bountyGameId),
            orderBy: (table, { desc }) => [desc(table.bountiesClaimed), desc(table.kills)],
        });
    },

    /**
     * Get alive players in bounty game
     */
    async getAlivePlayers(bountyGameId: string): Promise<BountyEntriesTableSelect[]> {
        return db.query.bountyEntriesTable.findMany({
            where: and(
                eq(bountyEntriesTable.bountyGameId, bountyGameId),
                eq(bountyEntriesTable.alive, true),
            ),
        });
    },

    /**
     * End game and calculate final payouts
     */
    async endGame(
        bountyGameId: string,
        rankings: Array<{ playerId: number; rank: number }>,
    ): Promise<GameEndPayout[]> {
        const game = await this.getBountyGame(bountyGameId);
        if (!game) {
            console.error("Game not found for end:", bountyGameId);
            return [];
        }

        const placementPool = game.placementPool || 0;
        const prizes = calculatePlacementPrizes(placementPool);

        const payouts: GameEndPayout[] = [];
        const players = await this.getPlayers(bountyGameId);

        // Map player IDs to entries
        const playerMap = new Map(players.map(p => [p.playerId, p]));

        for (const { playerId, rank } of rankings) {
            const entry = playerMap.get(playerId);
            if (!entry) continue;

            let placementPrize = 0;
            let headBountyKept = 0;

            // Calculate placement prizes
            if (rank === 1) {
                placementPrize = prizes.first;
                headBountyKept = entry.headBounty; // Winner keeps their head bounty
            } else if (rank === 2) {
                placementPrize = prizes.second;
            } else if (rank === 3) {
                placementPrize = prizes.third;
            }

            const totalPayout = entry.bountiesClaimed + placementPrize + headBountyKept;

            // Update entry with final stats
            await db
                .update(bountyEntriesTable)
                .set({
                    finalRank: rank,
                    placementPrize,
                    totalPayout,
                })
                .where(eq(bountyEntriesTable.id, entry.id));

            // Create payout record
            await db.insert(bountyPayoutsTable).values({
                bountyGameId,
                userId: entry.userId,
                bountiesEarned: entry.bountiesClaimed,
                placementPrize,
                headBountyKept,
                totalPayout,
                finalRank: rank,
                kills: entry.kills,
            });

            // Process payouts to wallet
            if (placementPrize > 0) {
                await WalletService.processBountyPayout(
                    entry.userId,
                    placementPrize,
                    bountyGameId,
                    "placement_prize",
                    `#${rank} placement prize`,
                );
            }

            if (headBountyKept > 0) {
                await WalletService.processBountyPayout(
                    entry.userId,
                    headBountyKept,
                    bountyGameId,
                    "head_bounty_kept",
                    "Winner head bounty kept",
                );
            }

            payouts.push({
                userId: entry.userId,
                playerId: entry.playerId,
                username: entry.username,
                rank,
                kills: entry.kills,
                bountiesEarned: entry.bountiesClaimed,
                placementPrize,
                headBountyKept,
                totalPayout,
            });
        }

        // Update game status
        await db
            .update(bountyGamesTable)
            .set({
                status: "completed",
                endedAt: new Date(),
            })
            .where(eq(bountyGamesTable.id, bountyGameId));

        return payouts;
    },

    /**
     * Cancel game and refund all players
     */
    async cancelGame(bountyGameId: string, reason: string): Promise<void> {
        const game = await this.getBountyGame(bountyGameId);
        if (!game) return;

        const players = await this.getPlayers(bountyGameId);

        // Refund all players
        for (const player of players) {
            await WalletService.processRefund(
                player.userId,
                player.entryPaid,
                bountyGameId,
                reason,
            );
        }

        // Update game status
        await db
            .update(bountyGamesTable)
            .set({ status: "cancelled" })
            .where(eq(bountyGamesTable.id, bountyGameId));
    },

    /**
     * Get bounty leaderboard for a game
     */
    async getLeaderboard(bountyGameId: string): Promise<Array<{
        playerId: number;
        username: string;
        kills: number;
        headBounty: number;
        totalEarned: number;
    }>> {
        const players = await this.getPlayers(bountyGameId);
        return players
            .filter(p => p.alive)
            .map(p => ({
                playerId: p.playerId,
                username: p.username,
                kills: p.kills,
                headBounty: p.headBounty,
                totalEarned: p.bountiesClaimed,
            }))
            .sort((a, b) => b.headBounty - a.headBounty)
            .slice(0, 10);
    },
};
