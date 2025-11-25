/**
 * Progressive Bounty Battle Royale Configuration
 *
 * Economic model:
 * - House Rake: 10% (configurable per tier)
 * - Placement Pool: 40% (goes to Top-3 only)
 * - Bounty Pool: 50% (distributed via kills)
 *   - Instant Capture: 50% of bounty (paid immediately)
 *   - Carried Bounty: 50% of bounty (added to killer's head)
 */

export interface StakeTier {
    id: string;
    entry: number;        // Entry fee in cents (to avoid float issues)
    rake: number;         // House rake percentage (0-1)
    minPlayers: number;   // Minimum players to start
    maxPlayers: number;   // Maximum players per game
    enabled: boolean;
}

export const STAKE_TIERS: Record<string, StakeTier> = {
    free: { id: "free", entry: 0, rake: 0, minPlayers: 2, maxPlayers: 50, enabled: true },
    micro_50: { id: "micro_50", entry: 50, rake: 0.15, minPlayers: 30, maxPlayers: 50, enabled: true },
    micro_1: { id: "micro_1", entry: 100, rake: 0.15, minPlayers: 40, maxPlayers: 50, enabled: true },
    micro_2: { id: "micro_2", entry: 200, rake: 0.12, minPlayers: 40, maxPlayers: 50, enabled: true },
    low_5: { id: "low_5", entry: 500, rake: 0.10, minPlayers: 50, maxPlayers: 50, enabled: true },
    low_10: { id: "low_10", entry: 1000, rake: 0.10, minPlayers: 50, maxPlayers: 50, enabled: true },
    mid_20: { id: "mid_20", entry: 2000, rake: 0.08, minPlayers: 50, maxPlayers: 50, enabled: true },
    mid_50: { id: "mid_50", entry: 5000, rake: 0.08, minPlayers: 50, maxPlayers: 50, enabled: true },
    high_100: { id: "high_100", entry: 10000, rake: 0.12, minPlayers: 30, maxPlayers: 50, enabled: true },
    high_250: { id: "high_250", entry: 25000, rake: 0.12, minPlayers: 20, maxPlayers: 50, enabled: true },
    high_500: { id: "high_500", entry: 50000, rake: 0.12, minPlayers: 20, maxPlayers: 50, enabled: true },
    vip_1k: { id: "vip_1k", entry: 100000, rake: 0.10, minPlayers: 10, maxPlayers: 50, enabled: true },
};

export const BountyConfig = {
    // Pool distribution
    PLACEMENT_POOL_PERCENT: 0.40,    // 40% to Top-3
    BOUNTY_POOL_PERCENT: 0.50,       // 50% for kills
    // (Remaining 10% is rake, but can vary by tier)

    // Placement distribution (from placement pool)
    FIRST_PLACE_PERCENT: 0.60,       // 60% of placement pool
    SECOND_PLACE_PERCENT: 0.25,      // 25% of placement pool
    THIRD_PLACE_PERCENT: 0.15,       // 15% of placement pool

    // Kill bounty distribution
    INSTANT_BOUNTY_PERCENT: 0.50,    // 50% paid immediately
    CARRIED_BOUNTY_PERCENT: 0.50,    // 50% added to killer's head

    // Game settings
    LOBBY_WAIT_TIME_MS: 60000,       // 60 seconds to wait for players
    MIN_PLAYERS_TIMEOUT_MS: 300000,  // 5 minutes to get minimum players
    DISCONNECT_GRACE_PERIOD_MS: 30000, // 30 seconds to reconnect

    // Minimum balance to enter a game (as multiplier of entry fee)
    MIN_BALANCE_MULTIPLIER: 1.0,

    // Currency display
    CURRENCY_SYMBOL: "$",
    CURRENCY_DECIMALS: 2,
};

export interface BountyPoolInfo {
    totalPool: number;           // Total prize pool (after rake)
    houseRake: number;           // House take
    placementPool: number;       // For Top-3
    bountyPool: number;          // For kills
    baseBounty: number;          // Initial per player
    playerCount: number;         // Number of players
}

/**
 * Calculate the bounty pool distribution for a game
 */
export function calculateBountyPool(
    entryFeeCents: number,
    playerCount: number,
    rakePercent: number,
): BountyPoolInfo {
    const totalCollected = entryFeeCents * playerCount;
    const houseRake = Math.floor(totalCollected * rakePercent);
    const totalPool = totalCollected - houseRake;

    const placementPool = Math.floor(totalPool * BountyConfig.PLACEMENT_POOL_PERCENT);
    const bountyPool = Math.floor(totalPool * BountyConfig.BOUNTY_POOL_PERCENT);
    const baseBounty = Math.floor(bountyPool / playerCount);

    return {
        totalPool,
        houseRake,
        placementPool,
        bountyPool,
        baseBounty,
        playerCount,
    };
}

/**
 * Calculate placement prizes
 */
export function calculatePlacementPrizes(placementPool: number): {
    first: number;
    second: number;
    third: number;
} {
    return {
        first: Math.floor(placementPool * BountyConfig.FIRST_PLACE_PERCENT),
        second: Math.floor(placementPool * BountyConfig.SECOND_PLACE_PERCENT),
        third: Math.floor(placementPool * BountyConfig.THIRD_PLACE_PERCENT),
    };
}

/**
 * Calculate kill bounty payout
 */
export function calculateKillBounty(victimHeadBounty: number): {
    instant: number;
    carried: number;
} {
    const instant = Math.floor(victimHeadBounty * BountyConfig.INSTANT_BOUNTY_PERCENT);
    const carried = Math.floor(victimHeadBounty * BountyConfig.CARRIED_BOUNTY_PERCENT);
    return { instant, carried };
}

/**
 * Format cents to display string
 */
export function formatCurrency(cents: number): string {
    const dollars = cents / 100;
    return `${BountyConfig.CURRENCY_SYMBOL}${dollars.toFixed(BountyConfig.CURRENCY_DECIMALS)}`;
}

/**
 * Get stake tier by ID
 */
export function getStakeTier(tierId: string): StakeTier | undefined {
    return STAKE_TIERS[tierId];
}

/**
 * Get enabled stake tiers
 */
export function getEnabledStakeTiers(): StakeTier[] {
    return Object.values(STAKE_TIERS).filter(t => t.enabled);
}

export type TransactionType =
    | "deposit"
    | "withdrawal"
    | "game_entry"
    | "game_refund"
    | "bounty_instant"
    | "bounty_carried"
    | "placement_prize"
    | "head_bounty_kept";

export type BountyGameStatus =
    | "lobby"           // Waiting for players
    | "starting"        // Game about to start
    | "in_progress"     // Game running
    | "finished"        // Game ended, payouts pending
    | "completed"       // Payouts done
    | "cancelled";      // Game cancelled, refunds issued
