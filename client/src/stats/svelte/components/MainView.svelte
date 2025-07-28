<script lang="ts">
import jQuery from "jquery";
import type { LeaderboardRequest } from "../../../../../shared/types/stats";
import { api } from "../../../api";
import { helpers } from "../../../helpers";
import Loading from "./loading.svelte";
import Leaderboard from "./leaderboard.svelte";
import LeaderboardError from "./leaderboardError.svelte";
import { MinGames } from "../../../../../shared/constants";
import { onMount } from "svelte";

const { phoneDetected, gameModes } = $props();

let data = $state(
    {} as Partial<
        LeaderboardRequest & {
            data: {
                username: string;
                usernames: string[];
                slug: string;
                slugs: string[];
            }[];
        }
    >,
);
let loading = $state(true);
let error = $state(false);

function load() {
    loading = true;
    error = false;

    // Supported args so far:
    //   type:     most_kills, most_damage_dealt, kills, wins, kpg
    //   interval: daily, weekly, alltime
    //   teamMode: solo, duo, squad
    //   maxCount: 10, 100
    let type =
        helpers.getParameterByName<LeaderboardRequest["type"]>("type") || "most_kills";
    const interval =
        helpers.getParameterByName<LeaderboardRequest["interval"]>("t") || "daily";
    const teamMode = helpers.getParameterByName("team") || "solo";
    const mapId = helpers.getParameterByName("mapId") || "0";
    // Change to most_damage_dealt if faction mode and most_kills selected
    if (type == "most_kills" && Number(mapId) == 3) {
        type = "most_damage_dealt";
    }

    const args: LeaderboardRequest = {
        type: type,
        interval: interval,
        teamMode: teamMode as unknown as number,
        mapId: mapId as unknown as number,
    };

    jQuery.ajax({
        url: api.resolveUrl("/api/leaderboard"),
        type: "POST",
        data: JSON.stringify(args),
        contentType: "application/json; charset=utf-8",
        success: (_data) => {
            data.type = type;
            data.interval = interval;
            data.teamMode = teamMode as unknown as number;
            data.mapId = mapId as unknown as number;
            data.data = _data;
        },
        error: () => {
            error = true;
        },
        complete: () => {
            loading = false;
            afterRequest();
        },
    });
    afterRequest();
    function afterRequest() {
        // Set the select options
        jQuery("#leaderboard-team-mode").val(data.teamMode!);
        jQuery("#leaderboard-map-id").val(data.mapId!);
        jQuery("#leaderboard-type").val(data.type!);
        jQuery("#leaderboard-time").val(data.interval!);

        // Disable most kills option if 50v50 selected
        const factionMode = Number(data.mapId) == 3;
        if (factionMode) {
            jQuery('#leaderboard-type option[value="most_kills"]').attr(
                "disabled",
                "disabled",
            );
        } else {
            jQuery('#leaderboard-type option[value="most_kills"]').removeAttr("disabled");
        }
    }
}

function onChangedParams() {
    const type = jQuery("#leaderboard-type").val();
    const time = jQuery("#leaderboard-time").val();
    const teamMode = jQuery("#leaderboard-team-mode").val();
    const mapId = jQuery("#leaderboard-map-id").val();
    window.history.pushState(
        "",
        "",
        `?type=${type}&team=${teamMode}&t=${time}&mapId=${mapId}`,
    );
    load();
}

// Compute derived values
const TypeToString = {
    most_kills: "stats-most-kills",
    most_damage_dealt: "stats-most-damage",
    kills: "stats-total-kills",
    wins: "stats-total-wins",
    kpg: "stats-kpg",
} satisfies Record<LeaderboardRequest["type"], string>;

onMount(() => {
    onChangedParams();

    jQuery(".leaderboard-opt").change(() => {
        onChangedParams();
    });

    // !! TODO
    // this.app.localization.localizeIndex();
});
</script>

<!-- Background -->
<div id='leaderboard-bg' class='stats-bg'></div>

<!-- Top ad -->
{#if !phoneDetected}
  <div id='ad-block-top' class='container mt-3'>
    <div class='ad-block-top-leaderboard'>
      <div id='surviv-io_728x90_Leaderboard'>
        <!-- <script type='text/javascript'>
          aiptag.cmd.display.push(function() { aipDisplayTag.display('surviv-io_728x90_Leaderboard'); });
        </script> -->
      </div>
    </div>
    <div class='ad-block-top-med-rect'>
      <div id='surviv-io_300x250_leaderboard'>
        <!-- <script type='text/javascript'>
          aiptag.cmd.display.push(function() { aipDisplayTag.display('surviv-io_300x250_leaderboard'); });
        </script> -->
      </div>
    </div>
  </div>
{/if}

<!-- Overview Card -->
<div class="container mt-3">
  <div class="card card-leaderboard col-lg-8 col-12 p-0">
    <div class="card-body">
      <div class='row card-row-top'>
        <div class='col-12'>
          <div class="leaderboard-title ml-sm-3 ml-0 mr-0 mt-3" data-l10n='index-leaderboards' data-caps='true'>LEADERBOARDS</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Mode selectors -->
<div class='container mt-3'>
  <div class="row">
    <div class='col-lg-2 col-3 pr-lg-3 pr-1'>
      <select id="leaderboard-team-mode" class="leaderboard-opt custom-select">
        <option value="solo" data-l10n='stats-solo'>Solo</option>
        <option value="duo" data-l10n='stats-duo'>Duo</option>
        <option value="squad" data-l10n='stats-squad'>Squad</option>
      </select>
    </div>
    <div class='col-lg-2 col-3 pl-lg-0 pr-lg-3 pl-0 pr-1'>
      <select id="leaderboard-type" class="leaderboard-opt custom-select">
        <option value="most_kills" data-l10n='stats-most-kills'>Most kills</option>
        <option value="most_damage_dealt" data-l10n='stats-most-damage'>Most damage</option>
        <option value="kpg" data-l10n='stats-kpg-full'>Kills per game</option>
        <option value="kills" data-l10n='stats-total-kills'>Total kills</option>
        <option value="wins" data-l10n='stats-total-wins'>Total wins</option>
      </select>
    </div>
    <div class='col-lg-2 col-3 pl-lg-0 pr-lg-3 pl-0 pr-1'>
      <select id="leaderboard-time" class="leaderboard-opt custom-select">
        <option value="daily" data-l10n='stats-today'>Today</option>
        <option value="weekly" data-l10n='stats-this-week'>This week</option>
        <option value="alltime" data-l10n='stats-all-time'>All time</option>
      </select>
    </div>
    <div class='col-lg-2 col-3 pl-0'>
      <select id="leaderboard-map-id" class="leaderboard-opt custom-select">
        {#each gameModes as gameMode}
          <option value={gameMode.mapId}>{gameMode.desc.name}</option>
        {/each}
      </select>
    </div>
  </div>
</div>

<div class='container mt-2 mb-4 p-sm-3 p-0'>
  <div class="row justify-content-center">
    <div class="col-md-12">
      <div class="content">
      {#if loading}
      <Loading type="leaderboard"/>
      {:else if error || !data.data}
        <LeaderboardError />
      {:else}
        <Leaderboard
        {...data}
        statsName={TypeToString[data.type as keyof typeof TypeToString] || ""}
        minGames={MinGames[data.type as keyof typeof MinGames]
          ? // @ts-expect-error go away
            MinGames[data.type][data.interval] ?? 1
          : 1} /> 
      {/if}

      </div>
    </div>
  </div>
</div>

{#if phoneDetected}
  <div class='col-12'>
    <div class='ad-block-bot-med-rect'>
      <div id='surviv-io_300x250_leaderboard'>
        <!-- <script type='text/javascript'>
          aiptag.cmd.display.push(function() { aipDisplayTag.display('surviv-io_300x250_leaderboard'); });
        </script> -->
      </div>
    </div>
  </div>
{/if}