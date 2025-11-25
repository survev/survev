/**
 * Bounty UI Manager - handles all bounty-related UI updates
 */
import * as net from "../../../shared/net/net";
import {
    formatCurrency,
    BountyConfig,
} from "../../../shared/bounty/bountyConfig";
import type { BountyLeaderboardEntry } from "../../../shared/net/bountyMsg";

export interface BountyState {
    isBountyGame: boolean;
    stakeTierId: string;
    entryFee: number;
    totalPool: number;
    placementPool: number;
    bountyPool: number;
    baseBounty: number;
    firstPrize: number;
    secondPrize: number;
    thirdPrize: number;
    playerCount: number;

    // Personal stats
    headBounty: number;
    totalEarned: number;
    kills: number;

    // Leaderboard
    leaderboard: BountyLeaderboardEntry[];
}

export interface BountyGameOverState {
    finalRank: number;
    kills: number;
    bountiesEarned: number;
    placementPrize: number;
    headBountyKept: number;
    totalPayout: number;
    entryFee: number;
}

/**
 * BountyUiManager handles all bounty UI updates
 */
export class BountyUiManager {
    state: BountyState = {
        isBountyGame: false,
        stakeTierId: "",
        entryFee: 0,
        totalPool: 0,
        placementPool: 0,
        bountyPool: 0,
        baseBounty: 0,
        firstPrize: 0,
        secondPrize: 0,
        thirdPrize: 0,
        playerCount: 0,
        headBounty: 0,
        totalEarned: 0,
        kills: 0,
        leaderboard: [],
    };

    gameOverState: BountyGameOverState | null = null;

    // UI elements
    private bountyHud: HTMLElement | null = null;
    private bountyEarnedEl: HTMLElement | null = null;
    private headBountyEl: HTMLElement | null = null;
    private bountyKillsEl: HTMLElement | null = null;
    private bountyPopup: HTMLElement | null = null;
    private bountyLeaderboard: HTMLElement | null = null;

    // Animation state
    private popupTimeout: number | null = null;
    private lastEarnedAmount = 0;

    constructor() {
        this.initializeElements();
    }

    /**
     * Initialize DOM elements
     */
    private initializeElements(): void {
        this.bountyHud = document.getElementById("ui-bounty-hud");
        this.bountyEarnedEl = document.getElementById("ui-bounty-earned");
        this.headBountyEl = document.getElementById("ui-bounty-head");
        this.bountyKillsEl = document.getElementById("ui-bounty-kills");
        this.bountyPopup = document.getElementById("ui-bounty-popup");
        this.bountyLeaderboard = document.getElementById("ui-bounty-leaderboard");
    }

    /**
     * Handle bounty game info message
     */
    handleGameInfo(msg: net.BountyGameInfoMsg): void {
        if (!msg.isBountyGame) {
            this.state.isBountyGame = false;
            this.hideHud();
            return;
        }

        this.state = {
            ...this.state,
            isBountyGame: true,
            stakeTierId: msg.stakeTierId,
            entryFee: msg.entryFee,
            totalPool: msg.totalPool,
            placementPool: msg.placementPool,
            bountyPool: msg.bountyPool,
            baseBounty: msg.baseBounty,
            firstPrize: msg.firstPrize,
            secondPrize: msg.secondPrize,
            thirdPrize: msg.thirdPrize,
            playerCount: msg.playerCount,
            headBounty: msg.baseBounty,
            totalEarned: 0,
            kills: 0,
        };

        this.showHud();
        this.updateHud();
    }

    /**
     * Handle bounty status update
     */
    handleBountyStatus(msg: net.BountyStatusMsg): void {
        this.state.headBounty = msg.headBounty;
        this.state.totalEarned = msg.totalEarned;
        this.state.kills = msg.kills;
        this.updateHud();
    }

    /**
     * Handle bounty kill message
     */
    handleBountyKill(msg: net.BountyKillMsg, isLocalKiller: boolean, victimName: string): void {
        if (isLocalKiller) {
            // Update local stats
            this.state.headBounty = msg.killerNewBounty;
            this.state.totalEarned = msg.killerTotalEarned;
            this.state.kills = msg.killerKills;

            // Show bounty claim popup
            this.showBountyPopup(msg.instantPayout, victimName);

            // Play cash sound
            this.playCashSound();

            this.updateHud();
        }
    }

    /**
     * Handle bounty leaderboard update
     */
    handleLeaderboard(msg: net.BountyLeaderboardMsg): void {
        this.state.leaderboard = msg.entries;
        this.updateLeaderboard();
    }

    /**
     * Handle bounty game over
     */
    handleGameOver(msg: net.BountyGameOverMsg): void {
        if (!msg.isBountyGame) return;

        this.gameOverState = {
            finalRank: msg.finalRank,
            kills: msg.kills,
            bountiesEarned: msg.bountiesEarned,
            placementPrize: msg.placementPrize,
            headBountyKept: msg.headBountyKept,
            totalPayout: msg.totalPayout,
            entryFee: msg.entryFee,
        };
    }

    /**
     * Show the bounty HUD
     */
    showHud(): void {
        if (this.bountyHud) {
            this.bountyHud.style.display = "block";
        }
    }

    /**
     * Hide the bounty HUD
     */
    hideHud(): void {
        if (this.bountyHud) {
            this.bountyHud.style.display = "none";
        }
    }

    /**
     * Update the HUD display
     */
    updateHud(): void {
        if (!this.state.isBountyGame) return;

        if (this.bountyEarnedEl) {
            this.bountyEarnedEl.textContent = formatCurrency(this.state.totalEarned);
        }
        if (this.headBountyEl) {
            this.headBountyEl.textContent = formatCurrency(this.state.headBounty);
        }
        if (this.bountyKillsEl) {
            this.bountyKillsEl.textContent = String(this.state.kills);
        }
    }

    /**
     * Show bounty claim popup
     */
    showBountyPopup(amount: number, victimName: string): void {
        if (!this.bountyPopup) return;

        // Clear any existing timeout
        if (this.popupTimeout) {
            clearTimeout(this.popupTimeout);
        }

        // Update popup content
        const amountEl = this.bountyPopup.querySelector(".bounty-popup-amount");
        const nameEl = this.bountyPopup.querySelector(".bounty-popup-name");
        const totalEl = this.bountyPopup.querySelector(".bounty-popup-total");

        if (amountEl) {
            amountEl.textContent = `+${formatCurrency(amount)}`;
        }
        if (nameEl) {
            nameEl.textContent = `Killed: ${victimName}`;
        }
        if (totalEl) {
            totalEl.textContent = `Total: ${formatCurrency(this.state.totalEarned)}`;
        }

        // Show popup with animation
        this.bountyPopup.classList.remove("bounty-popup-hidden");
        this.bountyPopup.classList.add("bounty-popup-show");

        // Hide after delay
        this.popupTimeout = window.setTimeout(() => {
            if (this.bountyPopup) {
                this.bountyPopup.classList.remove("bounty-popup-show");
                this.bountyPopup.classList.add("bounty-popup-hidden");
            }
        }, 2500);
    }

    /**
     * Update the bounty leaderboard
     */
    updateLeaderboard(): void {
        if (!this.bountyLeaderboard) return;

        const entries = this.state.leaderboard;
        let html = '<div class="bounty-lb-header"><span>#</span><span>Player</span><span>Kills</span><span>Bounty</span></div>';

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const isHighValue = entry.headBounty >= this.state.baseBounty * 2;
            html += `
                <div class="bounty-lb-row ${isHighValue ? 'bounty-lb-high' : ''}">
                    <span>${entry.rank}</span>
                    <span class="bounty-lb-name">${this.escapeHtml(entry.username)}</span>
                    <span>${entry.kills}</span>
                    <span class="bounty-lb-value">${formatCurrency(entry.headBounty)} 💀</span>
                </div>
            `;
        }

        this.bountyLeaderboard.innerHTML = html;
    }

    /**
     * Play cash register sound
     */
    private playCashSound(): void {
        // This will be hooked into the audio manager
        // For now, we'll dispatch a custom event
        window.dispatchEvent(new CustomEvent("bounty-cash-sound"));
    }

    /**
     * Get formatted kill feed text with bounty
     */
    getKillFeedText(
        killerName: string,
        victimName: string,
        bountyAmount: number,
    ): string {
        return `${killerName} killed ${victimName} (+${formatCurrency(bountyAmount)})`;
    }

    /**
     * Get game over stats HTML
     */
    getGameOverStatsHtml(): string {
        if (!this.gameOverState) return "";

        const {
            finalRank,
            kills,
            bountiesEarned,
            placementPrize,
            headBountyKept,
            totalPayout,
            entryFee,
        } = this.gameOverState;

        const roi = entryFee > 0 ? ((totalPayout - entryFee) / entryFee * 100).toFixed(0) : "0";
        const isProfit = totalPayout >= entryFee;

        let placementText = "";
        if (finalRank === 1) {
            placementText = "🏆 VICTORY!";
        } else if (finalRank === 2) {
            placementText = "🥈 2nd Place";
        } else if (finalRank === 3) {
            placementText = "🥉 3rd Place";
        } else {
            placementText = `#${finalRank}`;
        }

        return `
            <div class="bounty-gameover">
                <div class="bounty-gameover-title">${placementText}</div>
                <div class="bounty-gameover-stats">
                    <div class="bounty-stat-row">
                        <span>🎯 Kills:</span>
                        <span>${kills}</span>
                    </div>
                    <div class="bounty-stat-row">
                        <span>💰 Bounties Earned:</span>
                        <span>${formatCurrency(bountiesEarned)}</span>
                    </div>
                    ${placementPrize > 0 ? `
                    <div class="bounty-stat-row">
                        <span>🏆 Placement Prize:</span>
                        <span>${formatCurrency(placementPrize)}</span>
                    </div>
                    ` : ''}
                    ${headBountyKept > 0 ? `
                    <div class="bounty-stat-row">
                        <span>💀 Head Bounty Kept:</span>
                        <span>${formatCurrency(headBountyKept)}</span>
                    </div>
                    ` : ''}
                    <div class="bounty-stat-divider"></div>
                    <div class="bounty-stat-row bounty-stat-total">
                        <span>💵 TOTAL PAYOUT:</span>
                        <span class="${isProfit ? 'bounty-profit' : 'bounty-loss'}">${formatCurrency(totalPayout)}</span>
                    </div>
                    <div class="bounty-stat-row bounty-stat-roi">
                        <span>ROI:</span>
                        <span class="${isProfit ? 'bounty-profit' : 'bounty-loss'}">${roi}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get pre-game bounty info HTML
     */
    getPreGameInfoHtml(): string {
        if (!this.state.isBountyGame) return "";

        return `
            <div class="bounty-pregame">
                <div class="bounty-pregame-title">💰 PROGRESSIVE BOUNTY ROYALE</div>
                <div class="bounty-pregame-entry">Entry: ${formatCurrency(this.state.entryFee)}</div>
                <div class="bounty-pregame-pool">
                    <div class="bounty-pool-item">
                        <span>Prize Pool:</span>
                        <span>${formatCurrency(this.state.totalPool)}</span>
                    </div>
                    <div class="bounty-pool-prizes">
                        <span>🥇 ${formatCurrency(this.state.firstPrize)}</span>
                        <span>🥈 ${formatCurrency(this.state.secondPrize)}</span>
                        <span>🥉 ${formatCurrency(this.state.thirdPrize)}</span>
                    </div>
                </div>
                <div class="bounty-pregame-bounty">
                    <div class="bounty-pool-item">
                        <span>💀 Bounty Pool:</span>
                        <span>${formatCurrency(this.state.bountyPool)}</span>
                    </div>
                    <div class="bounty-pregame-detail">
                        Your starting bounty: ${formatCurrency(this.state.baseBounty)}
                    </div>
                    <div class="bounty-pregame-detail highlight">
                        Earn ${formatCurrency(Math.floor(this.state.baseBounty * 0.5))} per kill instantly!
                    </div>
                </div>
                <div class="bounty-pregame-players">
                    Players: ${this.state.playerCount}
                </div>
            </div>
        `;
    }

    /**
     * Reset state for new game
     */
    reset(): void {
        this.state = {
            isBountyGame: false,
            stakeTierId: "",
            entryFee: 0,
            totalPool: 0,
            placementPool: 0,
            bountyPool: 0,
            baseBounty: 0,
            firstPrize: 0,
            secondPrize: 0,
            thirdPrize: 0,
            playerCount: 0,
            headBounty: 0,
            totalEarned: 0,
            kills: 0,
            leaderboard: [],
        };
        this.gameOverState = null;
        this.hideHud();
    }

    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml(str: string): string {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }
}

// Singleton instance
export const bountyUi = new BountyUiManager();
