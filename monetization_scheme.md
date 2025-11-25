# PROGRESSIVE BOUNTY BATTLE ROYALE - IMPLEMENTATION SPEC

## 🎯 EXECUTIVE SUMMARY

Transform surviv.io into a crypto RMG game using a **Progressive Bounty System** where players earn instant crypto for each kill PLUS placement prizes for Top-3 finishers. This creates continuous dopamine hits (every kill pays) while maintaining big-win potential (Top-3 placement bonuses).

---

## 💰 CORE ECONOMIC MODEL

### **Entry Fee Distribution**

For each game, split the prize pool into:

```
ENTRY FEE BREAKDOWN:
├─ House Rake: 10%
├─ Placement Pool: 40% (goes to Top-3 only)
└─ Bounty Pool: 50% (distributed via kills)
    ├─ Instant Capture: 50% of bounty (paid immediately)
    └─ Carried Bounty: 50% of bounty (added to killer's head)
```

### **Example: $10 Entry, 50 Players**

```
Total Pool: $500

House Rake: $50 (10%)
─────────────────────
Placement Pool: $200 (40%)
  ├─ 1st Place: $120 (60% of placement pool)
  ├─ 2nd Place: $50 (25% of placement pool)
  └─ 3rd Place: $30 (15% of placement pool)

Bounty Pool: $250 (50%)
  └─ Each player starts with: $250 ÷ 50 = $5 bounty on head
      ├─ Instant: $2.50 per kill
      └─ Carried: $2.50 added to killer's bounty
```

---

## 🎮 KILL BOUNTY MECHANICS

### **How Bounties Work**

1. **Starting State**: Every player begins with base bounty = (Total Bounty Pool ÷ Number of Players)

2. **When Player A Kills Player B**:
   ```
   Instant_Payout = Player_B_Bounty × 0.5
   Carried_Bounty = Player_B_Bounty × 0.5
   
   Player_A.wallet += Instant_Payout
   Player_A.bounty += Carried_Bounty
   Player_B eliminated
   ```

3. **Example Progression**:
   ```
   Start:
   ├─ All players: $5.00 bounty
   
   Player A kills Player B:
   ├─ Player A gets: $2.50 instantly (to wallet)
   ├─ Player A's bounty becomes: $5.00 + $2.50 = $7.50
   └─ Player B eliminated
   
   Player A kills Player C:
   ├─ Player A gets: $2.50 instantly
   ├─ Player A's bounty becomes: $7.50 + $2.50 = $10.00
   └─ Player C eliminated
   
   Player D kills Player A:
   ├─ Player D gets: $5.00 instantly (50% of $10)
   ├─ Player D's bounty becomes: $5.00 + $5.00 = $10.00
   └─ Player A keeps their $5.00 in wallet (already paid out)
   ```

### **Critical Rules**

- ✅ Bounties claimed are NEVER lost (they're in your wallet)
- ✅ Your HEAD bounty is at risk (others can claim it)
- ✅ If you win, you keep your head bounty too
- ✅ Self-elimination (zone death, disconnect) = bounty goes to last damager or disappears

---

## 🏆 FINAL PAYOUT CALCULATION

### **Winner (1st Place)**
```
Total_Payout = Bounties_Earned + Placement_Prize + Own_Head_Bounty

Example:
├─ 12 kills × $2.50 avg = $30 in bounties
├─ 1st place prize = $120
├─ Own head bounty = $35 (accumulated from kills)
└─ TOTAL: $185 (1,850% ROI on $10 entry!)
```

### **2nd Place**
```
Total_Payout = Bounties_Earned + Placement_Prize

Example:
├─ 8 kills × $2.50 avg = $20 in bounties
├─ 2nd place prize = $50
└─ TOTAL: $70 (700% ROI)
```

### **3rd Place**
```
Total_Payout = Bounties_Earned + Placement_Prize

Example:
├─ 5 kills × $2.50 avg = $12.50 in bounties
├─ 3rd place prize = $30
└─ TOTAL: $42.50 (425% ROI)
```

### **4th-50th Place**
```
Total_Payout = Bounties_Earned only (no placement prize)

Examples:
├─ 6 kills = $15 (150% ROI - PROFIT!)
├─ 5 kills = $12.50 (125% ROI - PROFIT!)
├─ 4 kills = $10 (100% ROI - break even)
├─ 2 kills = $5 (50% ROI - loss but not total)
└─ 0 kills = $0 (100% loss)
```

---

## 🎨 UI/UX REQUIREMENTS

### **Pre-Game Lobby**

```
┌─────────────────────────────────────────┐
│  PROGRESSIVE BOUNTY ROYALE - $10 Entry  │
├─────────────────────────────────────────┤
│                                         │
│  Prize Pool: $450 (after 10% rake)     │
│                                         │
│  🏆 PLACEMENT PRIZES:                   │
│     1st: $120 | 2nd: $50 | 3rd: $30   │
│                                         │
│  💀 BOUNTY POOL: $250                   │
│     Your starting bounty: $5.00         │
│     Earn $2.50 per kill instantly!     │
│                                         │
│  Players: 47/50  [JOIN GAME]           │
└─────────────────────────────────────────┘
```

### **In-Game HUD (Essential Elements)**

```
Top-Right Corner:
┌──────────────────────┐
│ YOUR STATS           │
├──────────────────────┤
│ Bounties: $17.50 💰  │  ← Running total earned
│ Your Head: $13.75 💀 │  ← Others can claim this
│ Kills: 7             │
│ Rank: #8/23 alive    │
└──────────────────────┘

Kill Feed (Top-Left):
┌──────────────────────────────────┐
│ 💰 You killed Player47 (+$6.25)  │ ← Instant feedback
│ 💀 Player23 killed Player08      │
│ 💰 Player12 killed Player03 ($8) │ ← Show bounty value
└──────────────────────────────────┘

Leaderboard (Tab to view):
┌─────────────────────────────────────┐
│  # | Player    | Kills | Bounty    │
├─────────────────────────────────────┤
│  1 | xXProXx   |  15   | $42.50 💀 │ ← Big target!
│  2 | SnipeGod  |  12   | $35.00 💀 │
│  3 | You       |   7   | $13.75 💀 │
│  4 | Camper99  |   2   | $6.25  💀 │
└─────────────────────────────────────┘
```

### **Visual Feedback on Kill**

When you kill someone:
```
[BIG CENTER SCREEN POPUP - 2 seconds]

    ╔═══════════════════════════════╗
    ║   💰 BOUNTY CLAIMED! 💰      ║
    ║                               ║
    ║      +$6.25 USDC             ║
    ║                               ║
    ║   Killed: SweatyPlayer        ║
    ║   Your Total: $23.75         ║
    ╚═══════════════════════════════╝

[SOUND: Cash register "cha-ching!"]
[ANIMATION: Coins flying to your balance]
```

### **Player Name Tags (When Aiming)**

```
Above each player you see:

     SweatyPlayer
    💀 $18.50 💀      ← Their bounty value
    ████████░░        ← Health bar
```

This creates target prioritization: "That guy is worth $18.50!"

### **Death Screen**

```
┌─────────────────────────────────────────┐
│            💀 ELIMINATED 💀              │
├─────────────────────────────────────────┤
│  Killed by: xXProXx                     │
│  Your Final Stats:                      │
│                                         │
│  🎯 Kills: 5                            │
│  💰 Bounties Earned: $12.50            │
│  💀 Your Head: $11.25 (claimed)        │
│  📊 Final Rank: #17/50                 │
│                                         │
│  💵 TOTAL PAYOUT: $12.50               │
│      (125% of entry fee)               │
│                                         │
│  [PLAY AGAIN] [VIEW LEADERBOARD]       │
└─────────────────────────────────────────┘
```

### **Victory Screen (1st Place)**

```
┌─────────────────────────────────────────┐
│       🏆 VICTORY ROYALE! 🏆            │
├─────────────────────────────────────────┤
│                                         │
│  💰 Bounties Earned: $35.00            │
│  🏆 1st Place Prize: $120.00           │
│  💀 Own Bounty Kept: $42.50            │
│  ═══════════════════════════════        │
│  💵 TOTAL PAYOUT: $197.50 USDC         │
│                                         │
│  🚀 1,975% ROI on $10 entry!           │
│                                         │
│  🎯 Kills: 14                          │
│  ⏱️ Time: 4:32                          │
│                                         │
│  [CLAIM WINNINGS] [PLAY AGAIN]         │
└─────────────────────────────────────────┘
```

---

## 💻 BACKEND REQUIREMENTS

### **Data Structures**

```javascript
// Player Object (in-game)
{
  id: "player_uuid",
  username: "SweatyPlayer",
  walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  
  // Game state
  health: 100,
  position: {x: 245, y: 678},
  alive: true,
  
  // Bounty tracking
  bountyClaimed: 12.50,        // Total earned this game (safe)
  headBounty: 11.25,           // Current bounty on their head (at risk)
  kills: 5,
  
  // Stats
  damageDealt: 850,
  damageTaken: 45,
  survivalTime: 243  // seconds
}

// Game Object
{
  gameId: "game_uuid",
  stakeLevel: 10.00,           // Entry fee in USDC
  status: "in_progress",       // lobby, in_progress, finished
  
  startTime: 1699564800,
  endTime: null,
  
  // Prize structure
  prizePool: {
    total: 500,
    rake: 50,                  // House take
    placementPool: 200,        // For Top-3
    bountyPool: 250,           // For kills
    baseBounty: 5.00          // Initial per player
  },
  
  // Participants
  players: [...],              // Array of Player objects
  playersAlive: 47,
  maxPlayers: 50,
  
  // Results
  rankings: [],                // Filled as players die
  payouts: []                  // Calculated at end
}
```

### **Kill Event Handler**

```javascript
function handleKill(killerId, victimId, gameId) {
  const game = getGame(gameId);
  const killer = game.players.find(p => p.id === killerId);
  const victim = game.players.find(p => p.id === victimId);
  
  // Calculate payouts
  const instantPayout = victim.headBounty * 0.5;
  const carriedBounty = victim.headBounty * 0.5;
  
  // Update killer
  killer.bountyClaimed += instantPayout;
  killer.headBounty += carriedBounty;
  killer.kills += 1;
  
  // Update victim
  victim.alive = false;
  victim.deathTime = Date.now();
  victim.killedBy = killerId;
  
  // Add to rankings (reverse order)
  game.rankings.unshift({
    playerId: victimId,
    rank: game.playersAlive,
    kills: victim.kills,
    bountyEarned: victim.bountyClaimed,
    payout: victim.bountyClaimed  // Only bounties for non-Top-3
  });
  
  game.playersAlive -= 1;
  
  // Broadcast kill feed
  broadcastKillFeed(game, {
    killer: killer.username,
    victim: victim.username,
    bountyValue: instantPayout,
    killerNewBounty: killer.headBounty
  });
  
  // Check if game over
  if (game.playersAlive === 1) {
    endGame(gameId);
  }
  
  return {
    instantPayout,
    killerNewBounty: killer.headBounty
  };
}
```

### **Game End Handler**

```javascript
function endGame(gameId) {
  const game = getGame(gameId);
  const winner = game.players.find(p => p.alive);
  
  // Calculate Top-3 payouts
  const top3 = game.rankings.slice(0, 3);
  
  // 1st Place
  if (winner) {
    const winnerPayout = 
      winner.bountyClaimed +                      // Bounties earned
      (game.prizePool.placementPool * 0.60) +    // 1st prize
      winner.headBounty;                          // Keep own bounty
    
    game.payouts.push({
      playerId: winner.id,
      rank: 1,
      bountiesEarned: winner.bountyClaimed,
      placementPrize: game.prizePool.placementPool * 0.60,
      headBountyKept: winner.headBounty,
      totalPayout: winnerPayout
    });
  }
  
  // 2nd Place
  const second = top3[0];
  const secondPayout = 
    second.bountyEarned + 
    (game.prizePool.placementPool * 0.25);
  
  game.payouts[1] = {
    ...game.payouts[1],
    placementPrize: game.prizePool.placementPool * 0.25,
    totalPayout: secondPayout
  };
  
  // 3rd Place
  const third = top3[1];
  const thirdPayout = 
    third.bountyEarned + 
    (game.prizePool.placementPool * 0.15);
    
  game.payouts[2] = {
    ...game.payouts[2],
    placementPrize: game.prizePool.placementPool * 0.15,
    totalPayout: thirdPayout
  };
  
  // Everyone else only gets their bounties (already recorded)
  
  // Process blockchain payouts
  processPayouts(game.payouts);
  
  game.status = "finished";
  game.endTime = Date.now();
  
  return game;
}
```

---

## 🎲 STAKE TIERS & RAKE STRUCTURE

```javascript
const STAKE_TIERS = {
  micro_50:  { entry: 0.50, rake: 0.15, minPlayers: 30 },
  micro_1:   { entry: 1.00, rake: 0.15, minPlayers: 40 },
  micro_2:   { entry: 2.00, rake: 0.12, minPlayers: 40 },
  
  low_5:     { entry: 5.00, rake: 0.10, minPlayers: 50 },
  low_10:    { entry: 10.00, rake: 0.10, minPlayers: 50 },
  
  mid_20:    { entry: 20.00, rake: 0.08, minPlayers: 50 },
  mid_50:    { entry: 50.00, rake: 0.08, minPlayers: 50 },
  
  high_100:  { entry: 100.00, rake: 0.12, minPlayers: 30 },
  high_250:  { entry: 250.00, rake: 0.12, minPlayers: 20 },
  high_500:  { entry: 500.00, rake: 0.12, minPlayers: 20 },
  
  vip_1k:    { entry: 1000.00, rake: 0.10, minPlayers: 10 }
};
```

**Rationale:**
- Micro stakes: Higher rake (15%) - casual players, higher costs to service
- Low stakes: Standard rake (10%) - main volume tier
- Mid stakes: Lower rake (8%) - retain competitive players
- High stakes: Higher rake (12%) - whales less price-sensitive
- VIP: Standard rake (10%) - prestige tier

---

## 🔧 EDGE CASES TO HANDLE

### **1. Zone Deaths / Environmental Kills**

```javascript
// If player dies to zone/fall damage:
if (victim.killedBy === "zone" || victim.killedBy === "environment") {
  // Give bounty to last player who damaged them
  const lastDamager = getLastDamager(victim.id);
  
  if (lastDamager && lastDamager.alive) {
    // Award bounty to last damager
    handleKill(lastDamager.id, victim.id, gameId);
  } else {
    // No valid damager - bounty disappears (adds to house edge)
    victim.alive = false;
    game.playersAlive -= 1;
  }
}
```

### **2. Disconnects / Rage Quits**

```javascript
// If player disconnects:
function handleDisconnect(playerId, gameId) {
  const game = getGame(gameId);
  const player = game.players.find(p => p.id === playerId);
  
  // Grace period: 30 seconds to reconnect
  setTimeout(() => {
    if (!player.reconnected) {
      // Treat as zone death - give to last damager
      const lastDamager = getLastDamager(playerId);
      if (lastDamager) {
        handleKill(lastDamager.id, playerId, gameId);
      } else {
        // No damager - bounty disappears
        player.alive = false;
        game.playersAlive -= 1;
      }
    }
  }, 30000);
}
```

### **3. Simultaneous Kills (Both Players Die)**

```javascript
// If two players kill each other simultaneously:
if (killEvent1.timestamp === killEvent2.timestamp) {
  // Both get each other's bounties
  const bounty1 = player1.headBounty * 0.5;
  const bounty2 = player2.headBounty * 0.5;
  
  player1.bountyClaimed += bounty2;
  player2.bountyClaimed += bounty1;
  
  // Both die
  player1.alive = false;
  player2.alive = false;
  
  // Note: Carried bounty portion disappears (increases house edge slightly)
}
```

### **4. Teamming / Collusion Detection**

```javascript
// Flag suspicious behavior:
function detectTeamming(gameId) {
  const game = getGame(gameId);
  
  // Check for:
  // - Players who never shoot each other
  // - Players moving together for extended periods
  // - Abnormal kill trading patterns
  
  if (suspiciousActivity) {
    flagForReview(gameId);
    // Possible actions:
    // - Ban players
    // - Void game
    // - Forfeit earnings
  }
}
```

### **5. Minimum Players Not Met**

```javascript
// If game doesn't fill:
function handleUnderfilled(gameId) {
  const game = getGame(gameId);
  
  if (game.players.length < game.minPlayers) {
    // Cancel game after 5 minute wait
    setTimeout(() => {
      if (game.players.length < game.minPlayers) {
        cancelGame(gameId);
        refundAllPlayers(gameId);
      }
    }, 300000);
  }
}
```

---

## 📊 ANALYTICS TO TRACK

### **Per-Game Metrics**

```javascript
{
  gameId: "uuid",
  stakeLevel: 10.00,
  duration: 287,  // seconds
  
  players: {
    total: 50,
    completed: 50,
    disconnected: 2
  },
  
  kills: {
    total: 49,
    average: 0.98,
    max: 15,
    median: 2
  },
  
  bountyDistribution: {
    totalPaid: 250,
    averagePerPlayer: 5.00,
    topEarner: 42.50,
    zeroKills: 18  // Number who got $0
  },
  
  winnerStats: {
    kills: 15,
    bountyEarned: 37.50,
    placementPrize: 120,
    headBountyKept: 42.50,
    totalPayout: 200,
    roi: 2000  // percent
  }
}
```

### **Player Lifecycle Metrics**

```javascript
{
  playerId: "uuid",
  
  // Engagement
  gamesPlayed: 127,
  totalSpent: 1270,  // USDC
  totalWon: 945,     // USDC  
  netPosition: -325,  // USDC
  
  // Performance
  winRate: 0.024,    // 2.4% win rate
  top3Rate: 0.089,   // 8.9% Top-3 rate
  avgKills: 3.2,
  avgBounty: 8.15,
  avgPayout: 7.44,
  
  // Retention
  daysSinceFirst: 47,
  daysSinceLast: 0,
  sessionsPerWeek: 8.5,
  avgSessionLength: 42,  // minutes
  churnRisk: 0.12,  // ML prediction
  
  // Monetization
  favoriteStake: 10.00,
  avgStake: 8.25,
  lifetimeValue: 325,  // Net house profit
  acquisitionCost: 75
}
```

---

## 🎯 SUCCESS METRICS (KPIs)

Track these religiously:

```javascript
const KPIs = {
  // Revenue
  dailyRevenue: target >= 2000,  // per 1000 DAU
  monthlyRevenue: target >= 60000,
  profitMargin: target >= 0.95,
  
  // Engagement
  gamesPerSession: target >= 6,
  avgSessionTime: target >= 40,  // minutes
  bountyClaimRate: target >= 0.40,  // % who earn anything
  
  // Retention
  day1Retention: target >= 0.70,
  day7Retention: target >= 0.60,
  day30Retention: target >= 0.40,
  
  // Monetization
  ARPU: target >= 60,  // per month
  LTV: target >= 360,
  CAC: target <= 120,
  LTV_CAC_ratio: target >= 3.0,
  
  // Health
  bountyPoolUtilization: target >= 0.90,  // % actually claimed
  avgKillsPerGame: target >= 2.5,
  zeroKillRate: target <= 0.35  // % who get 0 kills
};
```

---

## ⚡ QUICK REFERENCE: Key Formulas

```javascript
// Bounty calculations
baseBounty = (totalPool × 0.50) ÷ numPlayers
instantPayout = victimBounty × 0.50
carriedBounty = victimBounty × 0.50

// Placement prizes (from 40% of pool)
first = placementPool × 0.60
second = placementPool × 0.25
third = placementPool × 0.15

// Final payouts
winner = bountiesClaimed + firstPrize + ownHeadBounty
topThree = bountiesClaimed + placementPrize
others = bountiesClaimed only

// ROI calculation
roi = (totalPayout - entryFee) / entryFee × 100
```

---

## 🚀 IMPLEMENTATION CHECKLIST

### **Phase 1: Core System** ✅
- [ ] Prize pool distribution logic
- [ ] Kill bounty tracking
- [ ] Placement prize calculation
- [ ] Wallet integration (USDC on Solana)
- [ ] Basic HUD (bounties, kills, rank)
- [ ] Kill feed with bounty values
- [ ] End-game payout screen

### **Phase 2: UX Polish** ✅
- [ ] Player nametags with bounty values
- [ ] Kill celebration popup (+$X.XX)
- [ ] Real-time leaderboard (Tab view)
- [ ] Sound effects (cash register on kill)
- [ ] Visual animations (coins, bounty glow)
- [ ] Lobby preview of prize structure

### **Phase 3: Anti-Cheat** ✅
- [ ] Edge case handling (zone deaths, disconnects)
- [ ] Collusion detection
- [ ] Replay recording
- [ ] Manual review system
- [ ] Ban/forfeit mechanisms

### **Phase 4: Retention Features** ✅
- [ ] Daily challenges (bonus bounties)
- [ ] Leaderboards (daily/weekly/monthly)
- [ ] Achievement system
- [ ] Referral bonuses
- [ ] Loss rebates (3x losses = discount)

---

## 💬 SAMPLE USER FLOWS

### **New Player First Game**

1. **Lobby**: Sees "$10 entry - earn $2.50 per kill!"
2. **Drops in**: HUD shows "Your bounty: $5.00"
3. **First kill**: 🎉 "+$2.50 USDC" popup, sound effect
4. **Dies at #23**: "You earned $7.50 (75% back)"
5. **Reaction**: "Almost broke even! One more game..."

### **Experienced Player Hot Streak**

1. **Game 1**: 8 kills + 2nd place = $70 (700% ROI)
2. **Feeling good**: Immediately queues next game
3. **Game 2**: 12 kills + 1st place = $197 (1,970% ROI!)
4. **Dopamine peak**: Plays 4 more games chasing high
5. **Net session**: +$180 across 6 games, hooked for life

### **Whale Player Experience**

1. **Joins $500 stake**: Prize pool $9,000
2. **Starting bounty**: $100 per player
3. **Gets 5 kills**: Already earned $250
4. **Dies #12**: Still walks away with $250 (50% back)
5. **Thought**: "Not bad, the action was worth it"

---

## 🎊 THAT'S THE MODEL

**Core Philosophy**: Every kill should feel like winning, even if you lose the game.

**Implementation Priority**: Get the bounty feedback loop perfect - that's what drives retention. The instant "$X claimed!" popup and sound is MORE important than graphics.

**The Secret Sauce**: 40% of players earn SOMETHING, which dramatically reduces loss aversion and keeps them playing "just one more game" to recoup losses or press their luck.

Now go build it and print money! 💰
