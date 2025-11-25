/**
 * Database schema for Progressive Bounty Battle Royale monetization
 */
import {
    bigint,
    boolean,
    index,
    integer,
    json,
    pgTable,
    real,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { usersTable } from "./schema";
import type { BountyGameStatus, TransactionType } from "../../../../shared/bounty/bountyConfig";

/**
 * User wallets - track balance for each user
 */
export const walletsTable = pgTable("wallets", {
    userId: text("user_id")
        .primaryKey()
        .references(() => usersTable.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    // Balance in cents to avoid floating point issues
    balance: bigint("balance", { mode: "number" }).notNull().default(0),
    // Total deposited (lifetime)
    totalDeposited: bigint("total_deposited", { mode: "number" }).notNull().default(0),
    // Total withdrawn (lifetime)
    totalWithdrawn: bigint("total_withdrawn", { mode: "number" }).notNull().default(0),
    // Total won from games (lifetime)
    totalWon: bigint("total_won", { mode: "number" }).notNull().default(0),
    // Total spent on entries (lifetime)
    totalSpent: bigint("total_spent", { mode: "number" }).notNull().default(0),
    // Wallet created timestamp
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // Last transaction timestamp
    lastTransactionAt: timestamp("last_transaction_at", { withTimezone: true }),
});

export type WalletsTableSelect = typeof walletsTable.$inferSelect;
export type WalletsTableInsert = typeof walletsTable.$inferInsert;

/**
 * Wallet transactions - audit log of all balance changes
 */
export const walletTransactionsTable = pgTable(
    "wallet_transactions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => usersTable.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        // Transaction type
        type: text("type").$type<TransactionType>().notNull(),
        // Amount in cents (positive for credit, negative for debit)
        amount: bigint("amount", { mode: "number" }).notNull(),
        // Balance after this transaction
        balanceAfter: bigint("balance_after", { mode: "number" }).notNull(),
        // Reference to bounty game (if applicable)
        bountyGameId: uuid("bounty_game_id"),
        // Description/notes
        description: text("description").notNull().default(""),
        // Timestamp
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        // External reference (e.g., payment processor ID)
        externalRef: text("external_ref"),
    },
    (table) => [
        index("idx_wallet_tx_user").on(table.userId, table.createdAt),
        index("idx_wallet_tx_game").on(table.bountyGameId),
    ],
);

export type WalletTransactionsTableSelect = typeof walletTransactionsTable.$inferSelect;
export type WalletTransactionsTableInsert = typeof walletTransactionsTable.$inferInsert;

/**
 * Bounty games - tracks each bounty mode game instance
 */
export const bountyGamesTable = pgTable(
    "bounty_games",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        // Reference to actual game
        gameId: uuid("game_id").notNull(),
        // Stake tier ID
        stakeTierId: text("stake_tier_id").notNull(),
        // Entry fee in cents
        entryFee: integer("entry_fee").notNull(),
        // Rake percentage (0-1)
        rakePercent: real("rake_percent").notNull(),
        // Game status
        status: text("status").$type<BountyGameStatus>().notNull().default("lobby"),
        // Number of players
        playerCount: integer("player_count").notNull().default(0),
        minPlayers: integer("min_players").notNull(),
        maxPlayers: integer("max_players").notNull(),
        // Pool calculations (set when game starts)
        totalPool: bigint("total_pool", { mode: "number" }),
        houseRake: bigint("house_rake", { mode: "number" }),
        placementPool: bigint("placement_pool", { mode: "number" }),
        bountyPool: bigint("bounty_pool", { mode: "number" }),
        baseBounty: bigint("base_bounty", { mode: "number" }),
        // Timestamps
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        startedAt: timestamp("started_at", { withTimezone: true }),
        endedAt: timestamp("ended_at", { withTimezone: true }),
        // Region
        region: text("region").notNull(),
    },
    (table) => [
        index("idx_bounty_game_status").on(table.status),
        index("idx_bounty_game_created").on(table.createdAt),
        index("idx_bounty_game_id").on(table.gameId),
    ],
);

export type BountyGamesTableSelect = typeof bountyGamesTable.$inferSelect;
export type BountyGamesTableInsert = typeof bountyGamesTable.$inferInsert;

/**
 * Bounty game entries - tracks players in each bounty game
 */
export const bountyEntriesTable = pgTable(
    "bounty_entries",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        bountyGameId: uuid("bounty_game_id")
            .notNull()
            .references(() => bountyGamesTable.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        userId: text("user_id")
            .notNull()
            .references(() => usersTable.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        // In-game player ID
        playerId: integer("player_id").notNull(),
        // Username used in game
        username: text("username").notNull(),
        // Entry fee paid (in cents)
        entryPaid: integer("entry_paid").notNull(),
        // Current bounty on their head (in cents)
        headBounty: bigint("head_bounty", { mode: "number" }).notNull().default(0),
        // Total bounties claimed (in cents)
        bountiesClaimed: bigint("bounties_claimed", { mode: "number" }).notNull().default(0),
        // Kills in this game
        kills: integer("kills").notNull().default(0),
        // Final rank (1 = winner)
        finalRank: integer("final_rank"),
        // Placement prize (in cents)
        placementPrize: bigint("placement_prize", { mode: "number" }).notNull().default(0),
        // Total payout (in cents)
        totalPayout: bigint("total_payout", { mode: "number" }).notNull().default(0),
        // Is player still alive
        alive: boolean("alive").notNull().default(true),
        // Player disconnected
        disconnected: boolean("disconnected").notNull().default(false),
        // Payout processed
        payoutProcessed: boolean("payout_processed").notNull().default(false),
        // Timestamps
        joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
        diedAt: timestamp("died_at", { withTimezone: true }),
    },
    (table) => [
        index("idx_bounty_entry_game").on(table.bountyGameId),
        index("idx_bounty_entry_user").on(table.userId),
        index("idx_bounty_entry_player").on(table.bountyGameId, table.playerId),
    ],
);

export type BountyEntriesTableSelect = typeof bountyEntriesTable.$inferSelect;
export type BountyEntriesTableInsert = typeof bountyEntriesTable.$inferInsert;

/**
 * Bounty kills - tracks each kill with bounty data
 */
export const bountyKillsTable = pgTable(
    "bounty_kills",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        bountyGameId: uuid("bounty_game_id")
            .notNull()
            .references(() => bountyGamesTable.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        // Killer info
        killerId: text("killer_id")
            .notNull()
            .references(() => usersTable.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        killerPlayerId: integer("killer_player_id").notNull(),
        // Victim info
        victimId: text("victim_id")
            .notNull()
            .references(() => usersTable.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        victimPlayerId: integer("victim_player_id").notNull(),
        // Bounty info (in cents)
        victimHeadBounty: bigint("victim_head_bounty", { mode: "number" }).notNull(),
        instantPayout: bigint("instant_payout", { mode: "number" }).notNull(),
        carriedBounty: bigint("carried_bounty", { mode: "number" }).notNull(),
        // Kill details
        damageType: integer("damage_type").notNull(),
        weaponType: text("weapon_type").notNull().default(""),
        // Timestamp
        killedAt: timestamp("killed_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index("idx_bounty_kill_game").on(table.bountyGameId),
        index("idx_bounty_kill_killer").on(table.killerId),
        index("idx_bounty_kill_victim").on(table.victimId),
    ],
);

export type BountyKillsTableSelect = typeof bountyKillsTable.$inferSelect;
export type BountyKillsTableInsert = typeof bountyKillsTable.$inferInsert;

/**
 * Bounty payouts - final payouts for each player
 */
export const bountyPayoutsTable = pgTable(
    "bounty_payouts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        bountyGameId: uuid("bounty_game_id")
            .notNull()
            .references(() => bountyGamesTable.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        userId: text("user_id")
            .notNull()
            .references(() => usersTable.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        // Payout breakdown (in cents)
        bountiesEarned: bigint("bounties_earned", { mode: "number" }).notNull(),
        placementPrize: bigint("placement_prize", { mode: "number" }).notNull(),
        headBountyKept: bigint("head_bounty_kept", { mode: "number" }).notNull().default(0),
        totalPayout: bigint("total_payout", { mode: "number" }).notNull(),
        // Stats
        finalRank: integer("final_rank").notNull(),
        kills: integer("kills").notNull(),
        // Payout status
        processed: boolean("processed").notNull().default(false),
        processedAt: timestamp("processed_at", { withTimezone: true }),
        // Transaction reference
        transactionId: uuid("transaction_id"),
        // Timestamp
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index("idx_bounty_payout_game").on(table.bountyGameId),
        index("idx_bounty_payout_user").on(table.userId),
    ],
);

export type BountyPayoutsTableSelect = typeof bountyPayoutsTable.$inferSelect;
export type BountyPayoutsTableInsert = typeof bountyPayoutsTable.$inferInsert;
