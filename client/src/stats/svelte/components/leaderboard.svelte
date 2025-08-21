<script lang="ts">
    const { statsName, type, minGames, data }: {
        statsName: string
        type: string
        minGames: number
        data: Array<{
            val: any
            slugs?: string[]
            usernames?: string[]
            slug?: string
            username?: string
            games?: number
            region?: string
            active?: boolean
        }>
    } = $props();
</script>

<table id="leaderboard-table">
    <thead>
        <tr class="leaderboard-headers">
            <th class="header-rank" scope="col" data-l10n="stats-rank" data-caps="true">RANK</th>
            <th class="header-player" scope="col" data-l10n="stats-player" data-caps="true">PLAYER</th>
            <!-- <th class="header-active" scope="col" data-l10n="stats-active" data-caps="true">ACTIVE</th> -->
            <th class="header-stat" scope="col" data-l10n="{statsName}">STAT</th>
            {#if type !== "most_kills" && type !== "win_streak"}
                <th class="header-games" scope="col" data-l10n="stats-games" data-caps="true">GAMES (> {minGames})</th>
            {/if}
            <th class="header-region" scope="col" data-l10n="stats-region" data-caps="true">REGION</th>            
        </tr>
    </thead>
    <tbody class="leaderboard-values">
        {#each data as entry, i}
            {#if Array.isArray(entry.slugs)}
                <tr class="main multiple-players">
                    <td class="data-rank">#{i + 1}</td>
                    <td class="data-player-names">
                        {#each entry.slugs as slug, j}
                            <span class="player-name">
                                {#if slug}
                                    <a href="/stats/?slug={slug}">{entry.usernames![j]}</a>
                                {:else}
                                    {entry.usernames![j]}
                                {/if}
                            </span>
                        {/each}
                    </td>
                    <td>{entry.val}</td>
                    <td>{entry.region?.toUpperCase() ?? ""}</td>
                    <!-- <td class:active={entry.active} class:inactive={!entry.active}></td> -->
                </tr>
            {:else}
                <tr class="main single-player">
                    <td class="data-rank">#{i + 1}</td>
                    <td class="data-player-names">
                        <span class="player-name">
                            {#if entry.slug}
                                    <a href="/stats/?slug={entry.slug}">{entry.username}</a>
                            {:else}
                                {entry.username}
                            {/if}
                        </span>
                    </td>
                    <!-- <td class:active={entry.active} class:inactive={!entry.active}></td> -->
                    <td>{entry.val}</td>
                    {#if type !== "most_kills" && type !== "win_streak"}
                        <td>{entry.games}</td>
                    {/if}
                    <td>{entry.region?.toUpperCase() ?? ""}</td>
                </tr>
            {/if}
        {/each}
    </tbody>
</table>
