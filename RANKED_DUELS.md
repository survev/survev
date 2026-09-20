# Ranked duels

## Match parameters

| Parameter | Value |
| --- | --- |
| Team sizes | 1v1, 2v2, 3v3, 4v4; separate queues and ratings |
| Series win condition | 5 round wins |
| Allocation requirement | Two full teams; all players accept |
| Acceptance timeout | 30 seconds |
| Round connection timeout | 45 seconds |
| Shared start countdown | 3 seconds; simulation frozen |
| Reconnect grace during play | 15 seconds; same player entity |
| Victory / intermission | 3 seconds of controls, then 7 seconds between rounds |
| Gas | First movement after 60 seconds; fully closed at 4:45 |

| Mode | Map dimensions | Primary buildings |
| --- | --- | --- |
| 1v1 | 280 × 280 | 3 |
| 2v2 | 336 × 336 | 6 |
| 3v3 | 420 × 420 | 9 |
| 4v4 | 560 × 560 | 12 |

- Map scaling uses side length, not area; the selected mode fixes map size after forfeits.
- One narrow river; no shoreline huts or airdrops; teams alternate spawn sides.
- Held inputs and unfinished actions clear after the victory period.

## Elo and penalties

| Parameter | Value |
| --- | --- |
| Initial Elo | 1000 per mode |
| Placement requirement | 5 rated series per mode; required for public leaderboards |
| K factor | 64 during placements; 32 afterwards |
| Expected score | Original teams' average Elo; 400-point scale |
| Normal loss | Minimum 1 Elo |
| Personal forfeit | Twice normal expected loss; minimum 2 Elo; applied immediately, once |
| Tier thresholds | Bronze <900; Silver 900; Gold 1100; Platinum 1300; Diamond 1500; Master 1700 |

- Original ratings, K factors and premade membership are saved before the first round.
- Remaining teammates continue after a forfeit. Loss protection excludes departures from the player's original premade party:

  `loss = max(1, round(normal loss × (team size - eligible forfeits) / team size))`

- A forfeiter keeps their personal loss if the team wins. Settlement does not charge that player again.
- Protection and minimum losses mean Elo changes are not necessarily zero-sum.

| Queue penalty | First | Second | Third | Fourth and later |
| --- | --- | --- | --- | --- |
| Declined/missed acceptance or initial connection | Warning | 1 minute | 5 minutes | 15 minutes |
| Forfeit/disconnect abandonment | 5 minutes | 15 minutes | 60 minutes | 60 minutes |

- Separate rolling 24-hour strike windows; cooldowns survive logout/restart and block affected parties.
- Leaving the ordinary queue and server allocation failures carry no penalty.
- Initial no-shows cancel the series without normal Elo settlement; explicit forfeits already charged remain.
- Later no-shows remove individual players. An empty side loses; both sides abandoning produces no invented winner.

## Integration and deployment

- **Single API coordinator:** queues, parties and active series are in memory. Multiple API instances require shared coordination. API restart cancels active state; completed results and committed penalties persist.
- **Accounts:** PostgreSQL deployments reuse native sessions and account IDs. `database.enabled: false` enables the local account provider in the existing account menu.
- **Storage:** `node:sqlite`, Node ≥22.18; persistent file `server/data/ranked.sqlite`. Stop the API before copying the database for backup. Schema upgrades preserve existing records.
- **Authority:** the API owns matchmaking and series scores; game servers own reserved rosters, combat and round results. Private callbacks use `SURVEV_API_KEY`; round IDs and penalty records prevent duplicate settlement.
- **Scoreboard:** server combat snapshots freeze at round decision/departure and commit with ratings. Incomplete or older combat data produces no scoreboard; forfeits do not invent played rounds.
- **Native deletion:** durable cleanup intent precedes the PostgreSQL transaction. Ranked anonymization follows commit; retries run at startup and every 15 seconds after confirming native deletion. Rollback/unavailable PostgreSQL preserves ranked data. Fallback deletion is one SQLite transaction.
- **Public stats:** `/api/ranked_stats` is read-only; banned/deleted native users are excluded. Elo and series-win ladders use all-time results.
- **Sample stats:** `/stats/?preview=1` requires development mode and PostgreSQL disabled; no account/rating writes. Real normal-match statistics require PostgreSQL.
- **Release checks:** external OAuth, HTTPS proxies and regional hosting require target-environment validation. Ranked UI text is English.

## Validation

```sh
pnpm --filter @survev/tests exec vitest run
pnpm exec tsc -p tests/tsconfig.json
pnpm build
```

- Existing lint and package type-check workflows also apply.
- Native account integration: set `SURVEV_TEST_POSTGRES_URL` to a local PostgreSQL administrator connection, then run `pnpm --filter @survev/server test:ranked-native`.
- That check creates/removes its own temporary PostgreSQL database and SQLite file; covers sessions, identity, persistence and deletion failure/recovery. It does not contact Google or Discord.
