/**
 * Wallet Service - manages user balances and transactions
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { usersTable } from "../db/schema";
import {
    walletsTable,
    walletTransactionsTable,
    type WalletsTableSelect,
    type WalletTransactionsTableSelect,
} from "../db/bountySchema";
import type { TransactionType } from "../../../../shared/bounty/bountyConfig";

export interface TransactionResult {
    success: boolean;
    error?: string;
    balance?: number;
    transactionId?: string;
}

export interface WalletInfo {
    balance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    totalWon: number;
    totalSpent: number;
}

/**
 * WalletService handles all wallet operations
 */
export const WalletService = {
    /**
     * Get or create wallet for user
     */
    async getOrCreateWallet(userId: string): Promise<WalletsTableSelect> {
        // Try to get existing wallet
        let wallet = await db.query.walletsTable.findFirst({
            where: eq(walletsTable.userId, userId),
        });

        if (!wallet) {
            // Create new wallet
            const [newWallet] = await db
                .insert(walletsTable)
                .values({ userId })
                .returning();
            wallet = newWallet;
        }

        return wallet;
    },

    /**
     * Get wallet balance
     */
    async getBalance(userId: string): Promise<number> {
        const wallet = await this.getOrCreateWallet(userId);
        return wallet.balance;
    },

    /**
     * Get full wallet info
     */
    async getWalletInfo(userId: string): Promise<WalletInfo> {
        const wallet = await this.getOrCreateWallet(userId);
        return {
            balance: wallet.balance,
            totalDeposited: wallet.totalDeposited,
            totalWithdrawn: wallet.totalWithdrawn,
            totalWon: wallet.totalWon,
            totalSpent: wallet.totalSpent,
        };
    },

    /**
     * Credit funds to wallet (deposit, winnings, etc.)
     */
    async credit(
        userId: string,
        amount: number,
        type: TransactionType,
        description: string,
        bountyGameId?: string,
        externalRef?: string,
    ): Promise<TransactionResult> {
        if (amount <= 0) {
            return { success: false, error: "Amount must be positive" };
        }

        try {
            // Get current wallet
            const wallet = await this.getOrCreateWallet(userId);
            const newBalance = wallet.balance + amount;

            // Update wallet balance
            await db
                .update(walletsTable)
                .set({
                    balance: newBalance,
                    lastTransactionAt: new Date(),
                    ...(type === "deposit" ? { totalDeposited: sql`${walletsTable.totalDeposited} + ${amount}` } : {}),
                    ...(["bounty_instant", "bounty_carried", "placement_prize", "head_bounty_kept"].includes(type)
                        ? { totalWon: sql`${walletsTable.totalWon} + ${amount}` }
                        : {}),
                })
                .where(eq(walletsTable.userId, userId));

            // Record transaction
            const [transaction] = await db
                .insert(walletTransactionsTable)
                .values({
                    userId,
                    type,
                    amount,
                    balanceAfter: newBalance,
                    bountyGameId,
                    description,
                    externalRef,
                })
                .returning();

            return {
                success: true,
                balance: newBalance,
                transactionId: transaction.id,
            };
        } catch (error) {
            console.error("Wallet credit error:", error);
            return { success: false, error: "Transaction failed" };
        }
    },

    /**
     * Debit funds from wallet (withdrawal, game entry, etc.)
     */
    async debit(
        userId: string,
        amount: number,
        type: TransactionType,
        description: string,
        bountyGameId?: string,
        externalRef?: string,
    ): Promise<TransactionResult> {
        if (amount <= 0) {
            return { success: false, error: "Amount must be positive" };
        }

        try {
            // Get current wallet
            const wallet = await this.getOrCreateWallet(userId);

            if (wallet.balance < amount) {
                return { success: false, error: "Insufficient balance" };
            }

            const newBalance = wallet.balance - amount;

            // Update wallet balance
            await db
                .update(walletsTable)
                .set({
                    balance: newBalance,
                    lastTransactionAt: new Date(),
                    ...(type === "withdrawal" ? { totalWithdrawn: sql`${walletsTable.totalWithdrawn} + ${amount}` } : {}),
                    ...(type === "game_entry" ? { totalSpent: sql`${walletsTable.totalSpent} + ${amount}` } : {}),
                })
                .where(eq(walletsTable.userId, userId));

            // Record transaction
            const [transaction] = await db
                .insert(walletTransactionsTable)
                .values({
                    userId,
                    type,
                    amount: -amount, // Negative for debit
                    balanceAfter: newBalance,
                    bountyGameId,
                    description,
                    externalRef,
                })
                .returning();

            return {
                success: true,
                balance: newBalance,
                transactionId: transaction.id,
            };
        } catch (error) {
            console.error("Wallet debit error:", error);
            return { success: false, error: "Transaction failed" };
        }
    },

    /**
     * Get transaction history for user
     */
    async getTransactionHistory(
        userId: string,
        limit = 50,
        offset = 0,
    ): Promise<WalletTransactionsTableSelect[]> {
        return db.query.walletTransactionsTable.findMany({
            where: eq(walletTransactionsTable.userId, userId),
            orderBy: (table, { desc }) => desc(table.createdAt),
            limit,
            offset,
        });
    },

    /**
     * Check if user has sufficient balance for game entry
     */
    async canAffordEntry(userId: string, entryFee: number): Promise<boolean> {
        const balance = await this.getBalance(userId);
        return balance >= entryFee;
    },

    /**
     * Process game entry payment
     */
    async processGameEntry(
        userId: string,
        entryFee: number,
        bountyGameId: string,
        stakeTierId: string,
    ): Promise<TransactionResult> {
        return this.debit(
            userId,
            entryFee,
            "game_entry",
            `Entry fee for ${stakeTierId} bounty game`,
            bountyGameId,
        );
    },

    /**
     * Process game refund (cancelled game)
     */
    async processRefund(
        userId: string,
        amount: number,
        bountyGameId: string,
        reason: string,
    ): Promise<TransactionResult> {
        return this.credit(
            userId,
            amount,
            "game_refund",
            `Refund: ${reason}`,
            bountyGameId,
        );
    },

    /**
     * Process bounty payout
     */
    async processBountyPayout(
        userId: string,
        amount: number,
        bountyGameId: string,
        type: "bounty_instant" | "bounty_carried" | "placement_prize" | "head_bounty_kept",
        description: string,
    ): Promise<TransactionResult> {
        return this.credit(
            userId,
            amount,
            type,
            description,
            bountyGameId,
        );
    },

    /**
     * Add demo credits to user wallet (for testing)
     */
    async addDemoCredits(userId: string, amount: number): Promise<TransactionResult> {
        return this.credit(
            userId,
            amount,
            "deposit",
            "Demo credits",
        );
    },
};
