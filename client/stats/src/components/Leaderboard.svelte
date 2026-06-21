<script lang="ts">
    import { untrack } from "svelte";
    import type { SvelteMap } from "svelte/reactivity";
    import { innerWidth } from "svelte/reactivity/window";

    import {
        IntervalToTranslationKey,
        RequestState,
        StatsAds,
        type TeamModeQuery,
        TeamModeQueryToTranslationKey,
        TypeToTranslationKey,
    } from "../helpers.ts";

    import { helpers } from "$lib/modules/helpers.svelte.ts";
    import type { Localization } from "$lib/modules/Localization.svelte";

    import type { LeaderboardRequest, LeaderboardResponse } from "@/shared/types/stats.ts";
    import { api } from "../../../src/api.ts";

    const BREAKPOINT = 768;
    const FACTION_MAP_ID = 3;

    const defs = helpers.getGameModes();
    const initMapId = parseInt(helpers.getParameterByName("mapId"));

    const { adMap, localization }: {
        adMap: SvelteMap<StatsAds, boolean>;
        localization: Localization;
    } = $props();

    let teamMode = $state<TeamModeQuery>(helpers.getParameterByName("team") || "solo");
    let type = $state<LeaderboardRequest["type"]>(helpers.getParameterByName("type") || "most_kills");
    let interval = $state<LeaderboardRequest["interval"]>(helpers.getParameterByName("t") || "daily");
    let mapId = $state(isNaN(initMapId) ? defs[0].mapId : initMapId);

    let data = $state<LeaderboardResponse[]>([]);
    let reqState = $state(RequestState.Loading);

    function updateURL(): void {
        let args: string[] = [];

        if (teamMode !== "solo") args.push(`team=${teamMode}`);
        if (type !== "most_kills") args.push(`type=${type}`);
        if (interval !== "daily") args.push(`t=${interval}`);
        if (mapId !== defs[0].mapId) args.push(`mapId=${mapId}`);

        window.history.replaceState(
            null,
            "",
            args.length === 0 ? window.location.pathname : `${window.location.pathname}?${args.join("&")}`,
        );
    }

    $effect(() => {
        reqState = untrack(() => RequestState.Loading);
        helpers.fetchSafe<LeaderboardResponse[]>(api.resolveUrl("/api/leaderboard"), {
            method: "POST",
            body: JSON.stringify({
                teamMode,
                type,
                interval,
                mapId: mapId.toString(),
            }),
            credentials: "omit",
            signal: helpers.abortSignal(3e4),
            headers: {
                "Content-Type": "application/json;charset=utf-8",
            },
        }).then(res => {
            if (res.success) {
                reqState = untrack(() => RequestState.Loaded);
                data = untrack(() => res.data);
            } else reqState = untrack(() => RequestState.Error);
        });
    });
</script>

<div class="container mt-3">
    <div class="container p-0">
        <div class="row">
            <div class="col-md-8">
                <div
                    class="ad-block-top-center mb-4"
                    class:d-none={innerWidth.current! < BREAKPOINT || !adMap.get(StatsAds.TopCenterLB)}
                >
                    <!-- Tag ID: survevio_728x90_leaderboard -->
                    <div id="survevio_728x90_leaderboard_top"></div>
                </div>
                <div class="card">{localization.translate("index-leaderboards")}</div>
                <div class="d-flex justify-content-center gap-2">
                    <select
                        class:form-select-sm={innerWidth.current! < BREAKPOINT}
                        class:form-select={innerWidth.current! >= BREAKPOINT}
                        aria-label="Team mode"
                        bind:value={teamMode}
                        onchange={updateURL}
                    >
                        {#each Object.entries(TeamModeQueryToTranslationKey) as [value, key], i (i)}
                            <option {value}>{localization.translate(key)}</option>
                        {/each}
                    </select>
                    <select
                        class:form-select-sm={innerWidth.current! < BREAKPOINT}
                        class:form-select={innerWidth.current! >= BREAKPOINT}
                        aria-label="Stat"
                        bind:value={type}
                        onchange={updateURL}
                    >
                        {#each Object.entries(TypeToTranslationKey) as [value, key], i (i)}
                            <option {value} disabled={value === "most_kills" && mapId === FACTION_MAP_ID}>
                                {localization.translate(key)}
                            </option>
                        {/each}
                    </select>
                    <select
                        class:form-select-sm={innerWidth.current! < BREAKPOINT}
                        class:form-select={innerWidth.current! >= BREAKPOINT}
                        aria-label="Time period"
                        bind:value={interval}
                        onchange={updateURL}
                    >
                        {#each Object.entries(IntervalToTranslationKey) as [value, key], i (i)}
                            <option {value}>{localization.translate(key)}</option>
                        {/each}
                    </select>
                    <select
                        class:form-select-sm={innerWidth.current! < BREAKPOINT}
                        class:form-select={innerWidth.current! >= BREAKPOINT}
                        aria-label="Map"
                        bind:value={mapId}
                        onchange={updateURL}
                    >
                        {#each defs as def, i (i)}
                            <option value={def.mapId} disabled={def.mapId === FACTION_MAP_ID && type === "most_kills"}>
                                {def.desc.name}
                            </option>
                        {/each}
                    </select>
                </div>
            </div>
            <div
                class="col-md-4 ad-block-top-right"
                class:d-none={innerWidth.current! < 1200 || !adMap.get(StatsAds.TopRightLB)}
            >
                <!-- Tag ID: survevio_300x250_leaderboard -->
                <div id="survevio_300x250_leaderboard_top"></div>
            </div>
        </div>
    </div>
    <table>
        <thead>
            <tr>
                <th>{localization.translate("stats-rank")}</th>
                <th>{localization.translate(teamMode === "solo" ? "stats-player" : "stats-players")}</th>
                <th>{localization.translate(TypeToTranslationKey[type])}</th>
                {#if type !== "most_kills"}
                    <th>{localization.translate("stats-games")}</th>
                {/if}
                <th>{localization.translate("stats-region")}</th>
            </tr>
        </thead>
        <tbody>
            {#if reqState === RequestState.Loaded}
                {#each data as entry, i (i)}
                    <tr>
                        <td>#{i + 1}</td>
                        <td>
                            {#each entry.slugs as slug, j (j)}
                                {#if slug !== null}
                                    <span title={entry.usernames[j]}><a href="/stats/?slug={slug}">{
                                            entry.usernames[j]
                                        }</a></span>
                                {:else}
                                    <span title={entry.usernames[j]}>{entry.usernames[j]}</span>
                                {/if}
                            {/each}
                        </td>
                        <td>{entry.val}</td>
                        {#if type !== "most_kills"}
                            <td>{entry.games}</td>
                        {/if}
                        <td>{entry.region}</td>
                    </tr>
                {/each}
            {/if}
        </tbody>
    </table>
    <!-- TODO: Translations for all of the following. -->
    {#if reqState === RequestState.Loading}
        <div class="table-preview">
            <div class="ui-spinner spinner-sm">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    {:else if reqState === RequestState.Error}
        <div class="table-preview gap-2">
            <img src="/img/ui/danger.svg" alt="Danger icon">
            <span>Unable to load leaderboard. Please try again.</span>
        </div>
    {:else if data.length === 0}
        <div class="table-preview gap-2">
            <img src="/img/ui/danger.svg" alt="Danger icon">
            <span>This leaderboard is currently empty.</span>
        </div>
    {/if}
</div>
<div class="ad-block-bottom-center" class:d-none={!adMap.get(StatsAds.BottomCenterLB)}>
    <!-- Tag ID: survevio_300x250_leaderboard -->
    <div id="survevio_300x250_leaderboard_bottom"></div>
</div>

<style>
    .ad-block-top-center {
        width: 728px;
        height: 90px;

        max-width: 100%;
    }

    .ad-block-top-right {
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;

        max-width: 100%;
    }

    #survevio_300x250_leaderboard_top {
        width: 300px;
        height: 250px;
    }

    .container .card {
        background: transparent;
        border: none;

        text-transform: uppercase;
        background-color: #80af49;
        color: white;

        font-weight: bold;
        font-size: 24px;
        text-align: center;
        text-shadow: 2px 2px 2px black;

        padding: 1.5rem 1.75rem;
        border-radius: 0.375rem;

        margin-bottom: 1rem;
    }

    select {
        width: 100%;
    }

    table {
        background-color: #293121f2;
        border: 1px solid black;

        border-radius: 0px;

        color: white;

        margin-top: 1rem;
        text-align: left;
        width: 100%;
    }

    tr {
        border-top: 1px solid #00000080;
    }

    th, td {
        text-align: center;
        padding: 0.5rem;
    }

    th {
        font-size: 12px;
        text-transform: uppercase;
        background-color: #465c33;
    }

    th:nth-child(2) {
        text-align: left;
    }

    td {
        font-size: 12px;
    }

    td:first-child {
        color: #ffffff80;
    }

    td:nth-child(2) {
        text-align: left;
    }

    td:last-child {
        text-transform: uppercase;
    }

    td:nth-child(2) {
        display: flex;
        flex-direction: column;
    }

    a:link, a:visited {
        color: #7cfc00;
        text-decoration: none;
    }

    a:hover, a:active {
        color: #51a500;
        text-decoration: underline;
    }

    table span {
        max-width: 225px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow-x: hidden;
    }

    tbody tr:nth-child(20n + 11),
    tbody tr:nth-child(20n + 12),
    tbody tr:nth-child(20n + 13),
    tbody tr:nth-child(20n + 14),
    tbody tr:nth-child(20n + 15),
    tbody tr:nth-child(20n + 16),
    tbody tr:nth-child(20n + 17),
    tbody tr:nth-child(20n + 18),
    tbody tr:nth-child(20n + 19),
    tbody tr:nth-child(20n + 20) {
        background-color: rgba(0, 0, 0, 0.2);
    }

    .table-preview {
        opacity: 0.75;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: #293121f2;
        color: white;
        padding: 4rem;
        height: 196px;
    }

    .table-preview img {
        width: 36px;
        height: 36px;
    }

    .ad-block-bottom-center {
        display: flex;
        justify-content: center;
        margin: 1rem 0;
    }

    @media (min-width: 768px) {
        td {
            font-size: 14px;
        }

        .container .card {
            font-size: 28px;
        }
    }

    @media (min-width: 768px) {
        select {
            font-weight: bold;
        }

        .container .card {
            font-size: 36px;
        }
    }

    @media (min-width: 992px) {
        .container .card {
            text-align: left;
        }

        th, td {
            font-size: 16px;
        }
    }

    @media (min-width: 1200px) {
        tr:nth-child(-n + 3) > td {
            font-size: 24px;
        }
    }
</style>
