<script lang="ts">
 let props : { 
     statName: string;
     type: string;
     minGames: number;
     data: Array<{
       slugs?: string[];
       usernames?: string[];
       slug?: string;
       username?: string;
       val: any;
       games?: number;
       region?: string;
       active?: boolean;
     }>;
 } = $props();
 </script>
  
  <table id='leaderboard-table'>
    <thead>
      <tr class='leaderboard-headers'>
        <th class='header-rank' scope="col" data-l10n='stats-rank' data-caps='true'>RANK</th>
        <th class='header-player' scope="col" data-l10n='stats-player' data-caps='true'>PLAYER</th>
        <!--
        <th class='header-active' scope="col" data-l10n='stats-active' data-caps='true'>ACTIVE</th>
        -->
        <th class='header-stat' scope="col" data-l10n='{props.statName}' data-caps='true'>STAT</th>
        {#if (props.type != 'most_kills' && props.type != 'win_streak')}
          <th class='header-games' scope="col" data-l10n='stats-games' data-caps='true'>GAMES (>{props.minGames})</th>
        {/if}
        <th class='header-region' scope="col" data-l10n='stats-region' data-caps='true'>REGION</th>
      </tr>
    </thead>
    <tbody class='leaderboard-values'>
      {#each props.data as data, i}
        {#if Array.isArray(data.slugs)}
          <tr class='main multiple-players'>
            <td class='data-rank' scope="row">#{i + 1}</td>
            <td class='data-player-names'>
              {#each data.slugs as slug, j}
                <span class='player-name'>
                  {#if slug}
                    <a href="/stats/?slug={slug}">{data.usernames[j]}</a>
                  {:else}
                    {data.usernames[j]}
                  {/if}
                </span>
              {/each}
            </td>
            <td>{data.val}</td>
            <td>{data.region ? data.region.toUpperCase() : ''}</td>
            <!--
            <td class='{data.active ? 'active' : 'inactive'}'></td>
            -->
          </tr>
        {:else}
          <tr class='main single-player'>
            <td class='data-rank' scope="row">#{i + 1}</td>
            <td class='data-player-names'>
              <span class='player-name'>
                {#if data.slug}
                  <a href="/stats/?slug={data.slug}">{data.username}</a>
                {:else}
                  {data.username}
                {/if}
              </span>
            </td>
            <!--
            <td class='{data.active ? 'active' : 'inactive'}'></td>
            -->
            <td>{data.val}</td>
            {#if props.type != 'most_kills' && props.type != 'win_streak'}
              <td>{data.games}</td>
            {/if}
            <td class='data-region'>{data.region ? data.region.toUpperCase() : ''}</td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>