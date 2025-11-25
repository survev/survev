/**
 * Bounty API Routes - wallet and bounty game operations
 */
import { Hono } from "hono";
import { z } from "zod";
import type { Context } from "..";
import { authMiddleware, databaseEnabledMiddleware, validateParams } from "../auth/middleware";
import { WalletService } from "../services/walletService";
import { BountyGameService } from "../services/bountyGameService";
import {
    getEnabledStakeTiers,
    getStakeTier,
    formatCurrency,
    calculateBountyPool,
    calculatePlacementPrizes,
} from "../../../../shared/bounty/bountyConfig";

/**
 * Wallet Routes - manage user balance
 */
export const WalletRouter = new Hono<Context>()
    .use(databaseEnabledMiddleware)
    .use(authMiddleware)

    // Get wallet info
    .get("/info", async (c) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const walletInfo = await WalletService.getWalletInfo(user.id);
        return c.json({
            balance: walletInfo.balance,
            balanceFormatted: formatCurrency(walletInfo.balance),
            totalDeposited: walletInfo.totalDeposited,
            totalWithdrawn: walletInfo.totalWithdrawn,
            totalWon: walletInfo.totalWon,
            totalSpent: walletInfo.totalSpent,
        });
    })

    // Get transaction history
    .get("/transactions", async (c) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const limit = parseInt(c.req.query("limit") || "50");
        const offset = parseInt(c.req.query("offset") || "0");

        const transactions = await WalletService.getTransactionHistory(
            user.id,
            Math.min(limit, 100),
            offset,
        );

        return c.json({
            transactions: transactions.map(tx => ({
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                amountFormatted: formatCurrency(Math.abs(tx.amount)),
                balanceAfter: tx.balanceAfter,
                description: tx.description,
                createdAt: tx.createdAt.toISOString(),
            })),
        });
    })

    // Add demo credits (for testing only)
    .post(
        "/demo-credits",
        validateParams(z.object({
            amount: z.number().min(100).max(100000), // $1 to $1000
        })),
        async (c) => {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const { amount } = c.req.valid("json");
            const result = await WalletService.addDemoCredits(user.id, amount);

            if (!result.success) {
                return c.json({ error: result.error }, 400);
            }

            return c.json({
                success: true,
                newBalance: result.balance,
                newBalanceFormatted: formatCurrency(result.balance || 0),
            });
        },
    );

/**
 * Bounty Game Routes - public info about bounty games
 */
export const BountyRouter = new Hono<Context>()
    .use(databaseEnabledMiddleware)

    // Get available stake tiers
    .get("/tiers", (c) => {
        const tiers = getEnabledStakeTiers();
        return c.json({
            tiers: tiers.map(tier => ({
                id: tier.id,
                entry: tier.entry,
                entryFormatted: formatCurrency(tier.entry),
                minPlayers: tier.minPlayers,
                maxPlayers: tier.maxPlayers,
                rake: tier.rake,
            })),
        });
    })

    // Get tier info with projected pool
    .get("/tier/:tierId", (c) => {
        const tierId = c.req.param("tierId");
        const tier = getStakeTier(tierId);

        if (!tier || !tier.enabled) {
            return c.json({ error: "Invalid tier" }, 404);
        }

        // Calculate example pool at min players
        const poolInfo = calculateBountyPool(tier.entry, tier.minPlayers, tier.rake);
        const prizes = calculatePlacementPrizes(poolInfo.placementPool);

        return c.json({
            tier: {
                id: tier.id,
                entry: tier.entry,
                entryFormatted: formatCurrency(tier.entry),
                minPlayers: tier.minPlayers,
                maxPlayers: tier.maxPlayers,
                rake: tier.rake,
            },
            examplePool: {
                playerCount: tier.minPlayers,
                totalPool: poolInfo.totalPool,
                totalPoolFormatted: formatCurrency(poolInfo.totalPool),
                placementPool: poolInfo.placementPool,
                bountyPool: poolInfo.bountyPool,
                baseBounty: poolInfo.baseBounty,
                baseBountyFormatted: formatCurrency(poolInfo.baseBounty),
                prizes: {
                    first: prizes.first,
                    firstFormatted: formatCurrency(prizes.first),
                    second: prizes.second,
                    secondFormatted: formatCurrency(prizes.second),
                    third: prizes.third,
                    thirdFormatted: formatCurrency(prizes.third),
                },
            },
        });
    })

    // Calculate pool for specific player count
    .get("/calculate-pool", (c) => {
        const tierId = c.req.query("tier") || "free";
        const playerCount = parseInt(c.req.query("players") || "50");

        const tier = getStakeTier(tierId);
        if (!tier || !tier.enabled) {
            return c.json({ error: "Invalid tier" }, 404);
        }

        const poolInfo = calculateBountyPool(tier.entry, playerCount, tier.rake);
        const prizes = calculatePlacementPrizes(poolInfo.placementPool);

        return c.json({
            playerCount,
            totalPool: poolInfo.totalPool,
            totalPoolFormatted: formatCurrency(poolInfo.totalPool),
            placementPool: poolInfo.placementPool,
            bountyPool: poolInfo.bountyPool,
            baseBounty: poolInfo.baseBounty,
            baseBountyFormatted: formatCurrency(poolInfo.baseBounty),
            instantPerKill: Math.floor(poolInfo.baseBounty * 0.5),
            instantPerKillFormatted: formatCurrency(Math.floor(poolInfo.baseBounty * 0.5)),
            prizes: {
                first: prizes.first,
                firstFormatted: formatCurrency(prizes.first),
                second: prizes.second,
                secondFormatted: formatCurrency(prizes.second),
                third: prizes.third,
                thirdFormatted: formatCurrency(prizes.third),
            },
        });
    })

    // Check if user can afford entry
    .get("/can-afford/:tierId", authMiddleware, async (c) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const tierId = c.req.param("tierId");
        const tier = getStakeTier(tierId);

        if (!tier || !tier.enabled) {
            return c.json({ error: "Invalid tier" }, 404);
        }

        const canAfford = await WalletService.canAffordEntry(user.id, tier.entry);
        const balance = await WalletService.getBalance(user.id);

        return c.json({
            canAfford,
            balance,
            balanceFormatted: formatCurrency(balance),
            entryFee: tier.entry,
            entryFeeFormatted: formatCurrency(tier.entry),
            shortfall: canAfford ? 0 : tier.entry - balance,
            shortfallFormatted: canAfford ? "$0.00" : formatCurrency(tier.entry - balance),
        });
    });

/**
 * Combined router
 */
export const BountyApiRouter = new Hono<Context>()
    .route("/wallet", WalletRouter)
    .route("/bounty", BountyRouter);
