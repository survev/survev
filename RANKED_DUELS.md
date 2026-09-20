# Ranked duels

**Play Ranked** opens first-to-five series for 1v1, 2v2, 3v3 and 4v4. Ranked uses the
normal account menu, game simulation, weapons and loot. Each team size has its own
queue and Elo ladder. Normal Solo, Duo and Squad matchmaking remains separate.

## Match flow

Solo queue fills missing teammates. Parties stay together and every member must
be ready. An idle leader can resize a party without removing members; choosing
1v1 requires confirmation to disband it. Leaderboard and history filters do not
change the party's mode.

Both teams must be full before a 30-second acceptance check. The game server
allocates an arena only after everyone accepts. Once all reserved players connect,
a shared three-second countdown starts. Movement, combat, looting and gas remain
frozen until it ends. Ranked arenas reject unreserved players.

| Mode | Island dimensions | Primary buildings |
| --- | --- | --- |
| 1v1 | 280 × 280 | 3 |
| 2v2 | 336 × 336 | 6 |
| 3v3 | 420 × 420 | 9 |
| 4v4 | 560 × 560 | 12 |

These dimensions are 100%, 120%, 150% and 200% of the 1v1 map's side length, all
smaller than the normal map. Cover and loot also scale with team size. Maps contain
one narrow river and omit shoreline huts and airdrops. Building footprints leave
walking space inside the land border. Teams alternate spawn sides each round;
the original mode determines map size even after someone forfeits.

Gas waits 60 seconds before moving and finishes closing at 4:45. Winners retain
controls for three seconds. Held inputs and unfinished actions are then cleared,
followed by a seven-second intermission and automatic entry into the next round.

## Ratings and penalties

Ratings start at 1000. Expected score uses the original teams' average Elo and a
400-point scale. Each player's K factor is 64 for their first five rated series
in a mode, then 32. Original parties, ratings and factors are saved when the match
is accepted. Players enter that mode's public leaderboard after five series.

A normal win awards the rounded expected gain. A normal loss costs at least one
point. Forfeiting applies twice the player's normal expected loss, at least two
points, immediately and exactly once. The forfeiter remains a personal loser if
their team later wins, and the final series result does not charge them again.

Remaining teammates continue playing. On a loss, protection counts only forfeits
outside the player's original premade party:

```text
loss = max(1, round(normal loss × (team size - eligible forfeits) / team size))
```

For example, at equal Elo after placements, a 2v2 forfeiter loses 32 points. A
remaining solo-queued teammate loses 8 if the team loses; a premade partner loses
the normal 16. Staying winners gain the normal 16. Protection and minimum losses
mean rating changes are not necessarily zero-sum.

Tiers and badge references are defined in `shared/defs/rankedDefs.ts`: Bronze below
900, Silver from 900, Gold from 1100, Platinum from 1300, Diamond from 1500 and
Master from 1700. Placement progress displays as Unranked.

| Event | First occurrence | Second | Third and later |
| --- | --- | --- | --- |
| Declined/missed acceptance or initial connection | Warning | 1 minute | 5 minutes, then 15 minutes |
| Forfeit or disconnect abandonment | 5 minutes | 15 minutes | 60 minutes |

Counts use separate rolling 24-hour windows and survive logout and restarts.
Duplicate events do not extend a cooldown. A party cannot queue while a member
has an active cooldown. Leaving an ordinary queue has no penalty.

## Disconnects and authority

Before the first round, failure to connect within 45 seconds cancels the series
without normal Elo changes. Only players identified as absent by the game server
receive a no-show strike. Previously committed explicit forfeit penalties remain.
Server allocation failures do not penalize players.

After play starts, a disconnected player has 15 seconds to return to the same
character. Expiry is a personal forfeit. In later rounds, absent reserved players
are removed individually after 45 seconds so remaining teammates can continue.
A side with no remaining players loses the series. If both sides abandon, their
personal penalties remain without inventing a winner.

The API coordinator owns queues, parties, acceptance and series scores. Regional
game servers own arena membership, combat and round winners. Private requests
authenticate with the existing `SURVEV_API_KEY`. Round IDs and per-account penalty
records prevent duplicate results. Client packets cannot choose winners or alter
ranked teams.

The final scoreboard includes each original player's kills, damage, actual round
wins and Elo change. Combat snapshots come from the game server and freeze when
the round is decided or the player leaves. Awarding a series after forfeits does
not invent played rounds. Counters and the final rating result commit atomically.
Older results without combat snapshots have no scoreboard.

## Accounts and storage

With PostgreSQL enabled, Ranked validates the original session cookie and uses the
native account ID. With `database.enabled: false`, a local username/password
provider appears in the existing account menu. It supports the main profile and
loadout, uses salted scrypt password hashes and an HttpOnly session cookie, and is
disabled when native accounts are enabled.

Ranked stores ratings, results, cooldowns and fallback accounts in
`server/data/ranked.sqlite`. The repository's Node.js requirement (22.18 or newer)
provides `node:sqlite`; no database dependency is added. Keep this file on persistent
disk and stop the API before copying it for a backup. Schema upgrades preserve
existing ratings and results without recalculating history.

Native account deletion records a cleanup intent before the PostgreSQL transaction.
After commit, ranked identities and result names are anonymized. If SQLite cleanup
fails, a worker retries at startup and every 15 seconds, first confirming that the
native account is absent. A rollback or unavailable PostgreSQL connection preserves
the identity and intent. Deleted identities cannot be recreated by stale sessions;
opponents retain their match history. Fallback account deletion uses one SQLite
transaction.

This implementation requires **one API matchmaking coordinator**. Live queues,
parties and series are in memory; multiple API instances need shared coordination.
Restarting the API cancels that live state without awarding a result. Completed
results, scoreboards, personal forfeit penalties and cooldowns remain saved. Public
OAuth, HTTPS proxy configuration and regional hosting must be checked in the
deployment environment. New ranked text is English.

## Statistics and local preview

The existing `/stats/` player and leaderboard pages include ranked modes, tiers,
placements, series records and history. `/api/ranked_stats` is read-only: viewing
stats never creates an account or changes a rating. Native banned/deleted accounts
are excluded. Leaderboards support current Elo and all-time series wins.

With PostgreSQL disabled, real normal-match stats are unavailable. For sample
normal and ranked data, use `/stats/?preview=1` or
`/stats/?preview=1&slug=demo-demosurvevr`. This preview requires development mode
and PostgreSQL disabled, is visibly labelled, and does not write account or rating
records. Production builds do not enable the preview query flag.

## Development checks

Use the existing workspace tooling:

```sh
pnpm exec oxlint --max-warnings 0
pnpm exec dprint check
pnpm --filter @survev/client typecheck
pnpm --filter @survev/server typecheck
pnpm --filter bot typecheck
pnpm --filter @survev/tests exec vitest run
pnpm build
```

The Vitest suites cover queue/acceptance lifecycles, partial teams, Elo settlement,
store migrations, native account hooks, game transitions, maps and gas. To test
native account persistence against a real local PostgreSQL instance, set
`SURVEV_TEST_POSTGRES_URL` to a local administrator connection URL and run:

```sh
pnpm --filter @survev/server test:ranked-native
```

This creates a uniquely named temporary PostgreSQL database and separate SQLite
file, runs the original migrations and development login provider, then removes
its own test resources. It checks sessions, profiles, ranked linkage, renaming,
deletion failure/recovery and persistence in a fresh process. It does not contact
Google or Discord.
