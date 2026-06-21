<script lang="ts">
    import { onMount, untrack } from "svelte";
    import { SvelteMap } from "svelte/reactivity";
    import { innerWidth } from "svelte/reactivity/window";

    import {
        ExtraStatsTabs,
        IntervalToTranslationKey,
        RequestState,
        StatsAds,
        TeamModeToTranslationKey,
        TypeToTranslationKey,
    } from "../helpers.ts";
    import MatchCard from "./MatchCard.svelte";
    import ModeCard from "./ModeCard.svelte";

    import { helpers } from "$lib/modules/helpers.svelte.ts";
    import type { Localization } from "$lib/modules/Localization.svelte.ts";

    import { EmotesDefs } from "@/shared/defs/gameObjects/emoteDefs.ts";
    import { TeamMode } from "@/shared/gameConfig.ts";
    import type {
        LeaderboardRequest,
        MatchDataResponse,
        MatchHistoryResponse,
        UserStatsRequest,
        UserStatsResponse,
    } from "@/shared/types/stats.ts";
    import { api } from "../../../src/api.ts";

    const BREAKPOINT = 768;

    const defs = helpers.getGameModes();
    const initMapId = parseInt(helpers.getParameterByName("mapId"));

    const { adMap, localization }: {
        adMap: SvelteMap<StatsAds, boolean>;
        localization: Localization;
    } = $props();

    let slug = $derived(helpers.getParameterByName("slug"));

    let interval = $state<UserStatsRequest["interval"]>(helpers.getParameterByName("t") || "alltime");
    let type = $state<LeaderboardRequest["type"]>(helpers.getParameterByName("type") || "most_kills");
    let mapId = $state(isNaN(initMapId) ? -1 : initMapId);
    let gameId = $state(helpers.getParameterByName("gameId"));
    let teamModeFilter = $state(7);

    let data = $state<UserStatsResponse>();
    let summaries = $state<MatchHistoryResponse>([]);
    let matches = new SvelteMap<string, MatchDataResponse>();

    let reqState = $state(RequestState.Loading);
    let extraStatTab = $state(ExtraStatsTabs.MatchHistory);
    let moreGamesAvailable = $state(true);

    let ratingContainer = $state<HTMLDivElement>();

    const userIconDef = $derived(data ? EmotesDefs[data.player_icon] : undefined);
    const userIcon = $derived(userIconDef ? helpers.emoteImgToSvg(userIconDef.texture) : "/img/gui/player-gui.svg");

    const gameModes = helpers.getGameModes();
    const matchHistoryCache = $state<Record<number, MatchHistoryResponse>>({});

    const initGameId = helpers.getParameterByName("gameId");

    function updateURL(gameIdOnly = false): void {
        let args: string[] = [`slug=${slug}`];

        if (interval !== "alltime") args.push(`t=${interval}`);
        if (mapId !== -1) args.push(`mapId=${mapId}`);
        if (gameId !== "") args.push(`gameId=${gameId}`);

        window.history.replaceState(
            "",
            "",
            args.length === 0 ? window.location.pathname : `${window.location.pathname}?${args.join("&")}`,
        );
        if (!gameIdOnly) reqState = RequestState.Loading;
    }

    function setGameId(id: string) {
        if (gameId === id) gameId = "";
        else gameId = id;

        updateURL(true);
    }

    function requestMatchData(gameId: string): void {
        helpers.fetchSafe<MatchDataResponse>(api.resolveUrl("/api/match_data"), {
            method: "POST",
            body: JSON.stringify({
                gameId,
            }),
            credentials: "omit",
            signal: helpers.abortSignal(1e4),
            headers: {
                "Content-Type": "application/json;charset=utf-8",
            },
        }).then(res => {
            if (res.success) {
                matches.set(gameId, res.data);
            }
        });
    }

    async function requestMatchHistory(more = false): Promise<void> {
        matchHistoryCache[teamModeFilter] ??= [];
        summaries = matchHistoryCache[teamModeFilter];

        if (summaries.length > 0 && !more) {
            moreGamesAvailable = summaries.length % 10 === 0;
            return;
        }

        const res = await helpers.fetchSafe<MatchHistoryResponse>(api.resolveUrl("/api/match_history"), {
            method: "POST",
            body: JSON.stringify({
                slug,
                offset: summaries.length,
                count: 10,
                teamModeFilter,
            }),
            credentials: "omit",
            headers: {
                "Content-Type": "application/json;charset=utf-8",
            },
        });

        if (res.success) {
            matchHistoryCache[teamModeFilter].push(...res.data);
            summaries = matchHistoryCache[teamModeFilter];

            moreGamesAvailable = res.data.length >= 10;
        }
    }

    onMount(async () => {
        const Tooltip = (await import("bootstrap/js/dist/tooltip.js")).default;
        new Tooltip(ratingContainer!);

        await requestMatchHistory();

        if (initGameId) {
            document.querySelector(`#match-card-${initGameId}`)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    });

    $effect(() => {
        reqState = untrack(() => RequestState.Loading);
        helpers.fetchSafe<UserStatsResponse>(api.resolveUrl("/api/user_stats"), {
            method: "POST",
            body: JSON.stringify({
                interval,
                slug,
                mapIdFilter: mapId.toString(),
            }),
            credentials: "omit",
            signal: helpers.abortSignal(1e4),
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

<div class="container d-flex flex-column gap-3">
    <div class="row">
        <div class="col-xl-10 col-xxl-8 d-flex flex-column justify-content-end gap-3">
            <div
                class="ad-block-top-center"
                class:d-none={innerWidth.current! < BREAKPOINT || !adMap.get(StatsAds.TopCenterPlayer)}
            >
                <!-- Tag ID: survevio_728x90_playerprofile -->
                <div id="survevio_728x90_playerprofile_top"></div>
            </div>
            <div class="card">
                <div class="row align-items-center gap-3 gap-lg-0">
                    <div class="col-sm-12 col-lg-7 d-flex justify-content-center justify-content-lg-start align-items-center gap-3">
                        <img src={userIcon} alt="Player icon" class="player-icon">
                        <!-- TODO: Translations for the following strings. -->
                        <div class="d-flex flex-column">
                            {#if reqState === RequestState.Loading}
                                <span class="player-name pe-3">{data?.username}</span>
                            {:else}
                                <span class="player-name pe-3">{data?.username || "That player doesn't exist."}</span>
                            {/if}
                            <span class="player-warning" class:d-none={!data?.banned}>{
                                localization.translate("stats-banned")
                            }</span>
                        </div>
                    </div>
                    <div class="player-stats col-sm-12 col-lg-5 d-flex justify-content-evenly align-items-center">
                        {#if data?.slug}
                            <div class="d-flex justify-content-center align-items-center">
                                <span>{localization.translate("stats-wins")}</span>
                                <span>{data.wins}</span>
                            </div>
                            <div class="d-flex justify-content-center align-items-center">
                                <span>{localization.translate("stats-kills")}</span>
                                <span>{data.kills}</span>
                            </div>
                            <div class="d-flex justify-content-center align-items-center">
                                <span>{localization.translate("stats-games")}</span>
                                <span>{data.games}</span>
                            </div>
                            <div class="d-flex justify-content-center align-items-center">
                                <span>{localization.translate("stats-kpg")}</span>
                                <span>{data.kpg}</span>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
        <div
            class="col-md-4 ad-block-top-right mt-1"
            class:d-none={innerWidth.current! < 1200 || !adMap.get(StatsAds.TopRightPlayer)}
        >
            <!-- Tag ID: survevio_300x250_playerprofile_top -->
            <div id="survevio_300x250_playerprofile_top"></div>
        </div>
    </div>
    <div class="row gap-2 gap-lg-0">
        <div class="col-lg-4 d-flex justify-content-center gap-2">
            <select
                class:form-select-sm={innerWidth.current! < BREAKPOINT}
                class:form-select={innerWidth.current! >= BREAKPOINT}
                aria-label="Time period"
                bind:value={interval}
                onchange={() => updateURL()}
                disabled={!data?.slug}
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
                onchange={() => updateURL()}
                disabled={!data?.slug}
            >
                <!-- TODO: Translations for this. -->
                <option value={-1}>All modes</option>
                {#each defs as def, i (i)}
                    <option value={def.mapId}>{def.desc.name}</option>
                {/each}
            </select>
        </div>
        <div class="col-lg-6"></div>
        <div class="col-lg-2">
            <div
                bind:this={ratingContainer}
                class="card text-white"
                class:invisible={!data?.slug}
                data-bs-toggle="tooltip"
                data-bs-placement="left"
                data-bs-html="true"
                data-bs-title="<span class='text-warning fw-bold'>This feature is coming soon!</span> Rating will be based on placement and kills within an individual game mode."
            >
                What is Rating?
            </div>
        </div>
    </div>
    <div class="row gap-3 gap-lg-0">
        {#each Object.keys(TeamModeToTranslationKey) as key, i (i)}
            <div class="col-lg-4">
                <ModeCard
                    key={key as unknown as TeamMode}
                    mode={data?.modes.find(x => `${x.teamMode}` === key)}
                    {localization}
                    {reqState}
                />
            </div>
        {/each}
    </div>
    <div class="row" class:d-none={!data?.slug}>
        <div class="col-8"></div>
        <div class="col-xl-4 d-flex match-filter">
            <button
                class="btn btn-sm btn-light w-100"
                disabled={teamModeFilter === TeamMode.Solo + TeamMode.Duo + TeamMode.Squad}
                onclick={() => (teamModeFilter = TeamMode.Solo + TeamMode.Duo + TeamMode.Squad, requestMatchHistory())}
            >
                All
            </button>
            <button
                class="btn btn-sm btn-light w-100"
                disabled={teamModeFilter === TeamMode.Solo}
                onclick={() => (teamModeFilter = TeamMode.Solo, requestMatchHistory())}
            >
                Solo
            </button>
            <button
                class="btn btn-sm btn-light w-100"
                disabled={teamModeFilter === TeamMode.Duo}
                onclick={() => (teamModeFilter = TeamMode.Duo, requestMatchHistory())}
            >
                Duo
            </button>
            <button
                class="btn btn-sm btn-light w-100"
                disabled={teamModeFilter === TeamMode.Squad}
                onclick={() => (teamModeFilter = TeamMode.Squad, requestMatchHistory())}
            >
                Squad
            </button>
        </div>
    </div>
    <div class="row extra-stats-wrapper gap-3 gap-xl-0" class:d-none={!data?.slug}>
        <div class="col-xl-2 d-flex flex-xl-column gap-2">
            <button
                class="btn btn-darken btn-sidebar"
                disabled={extraStatTab === ExtraStatsTabs.MatchHistory}
                onclick={() => extraStatTab = ExtraStatsTabs.MatchHistory}
            >
                <span>Matches</span>
                <img src="/img/ui/history.svg" alt="History icon">
            </button>
            <!--
                <button class="btn btn-darken btn-sidebar" disabled={extraStatTab === ExtraStatsTabs.WeaponStats} onclick={() => extraStatTab = ExtraStatsTabs.WeaponStats}>
                    <span>Weapons</span>
                    <img src="/img/loot/loot-weapon-ot38.svg" alt="History icon">
                </button>
            -->
        </div>
        <div id="extra-stats-content" class="col-xl-10 d-flex flex-column gap-2 accordion accordion-flush">
            <div class="extra-stats-header gap-2 gap-lg-0">
                <div class="col-12 col-lg-10 gap-2" class:d-none={extraStatTab === ExtraStatsTabs.WeaponStats}>
                    <img src="/img/ui/history.svg" alt="History icon">
                    <span>Match History</span>
                </div>
                <div class="col-12 col-lg-10 gap-2" class:d-none={extraStatTab === ExtraStatsTabs.MatchHistory}>
                    <img src="/img/loot/loot-weapon-ot38.svg" alt="Weapon stats icon">
                    <span>Weapon Stats</span>
                    <div class="col-12 col-lg-2 d-flex justify-content-end">
                        <select
                            class="form-select-sm"
                            aria-label="Stat"
                            bind:value={type}
                            onchange={() => requestMatchHistory()}
                        >
                            {#each Object.entries(TypeToTranslationKey) as [value, key], i (i)}
                                <option {value}>{localization.translate(key)}</option>
                            {/each}
                        </select>
                    </div>
                </div>
            </div>
            {#if summaries.length === 0}
                <div class="extra-stats-preview">
                    <img src="/img/ui/danger.svg" alt="Danger icon">
                    <!-- TODO: Translations for this. -->
                    <span>No recent games.</span>
                </div>
            {:else}
                {#each summaries as summary, i (i)}
                    <MatchCard
                        {summary}
                        data={matches.get(summary.guid)}
                        {slug}
                        {gameModes}
                        {localization}
                        {requestMatchData}
                        {setGameId}
                        autoExpand={initGameId === summary.guid}
                    />
                {/each}
                {#if moreGamesAvailable}
                    <button class="btn btn-lg btn-light w-100" onclick={() => requestMatchHistory(true)}>More</button>
                {/if}
            {/if}
        </div>
    </div>
</div>
<div class="ad-block-bottom-center" class:d-none={!adMap.get(StatsAds.BottomCenterPlayer)}>
    <!-- Tag ID: survevio_300x250_playerprofile -->
    <div id="survevio_300x250_playerprofile_bottom"></div>
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

    #survevio_300x250_playerprofile_top {
        width: 300px;
        height: 250px;
    }

    .card:not(.text-white) {
        background: transparent;
        border: none;

        background-color: #80af49;
        color: white;

        font-weight: bold;
        font-size: 24px;

        padding: 1.5rem 1.75rem;
        border-radius: 0.375rem;
    }

    .player-icon {
        width: 4.5rem;
        height: 4.5rem;

        padding: 8px;
        background-color: #00000060;
        border-radius: 0.375rem;
    }

    .player-name {
        font-size: 24px;
        text-align: center;
        text-shadow: 2px 2px 2px black;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow-x: hidden;
    }

    .player-warning {
        font-size: 18px;
        font-weight: bold;
        color: gold;
        text-shadow: 1px 1px 1px black;
    }

    .player-stats > div {
        display: flex;
        flex-direction: column;
    }

    .player-stats span:first-child {
        color: gold;
        font-size: 18px;
        text-shadow: 1px 1px 1px black;
    }

    .player-stats span:last-child {
        font-size: 28px;
        text-shadow: 2px 2px 2px black;
    }

    select {
        width: 100%;
    }

    .card.text-white {
        text-align: center;
        background: #00000040;
        padding: 0.5rem 0.25rem;
        border-radius: 0.375rem;
    }

    .match-filter button {
        font-weight: bold;
        border: 1px solid black;
        border-radius: 0;
    }

    .match-filter button:disabled {
        background: orange;
        color: black;
        opacity: 1;
    }

    .extra-stats-header {
        display: flex;
        flex-wrap: wrap;
        background-color: #000000bf;
        color: white;
        text-transform: uppercase;
        font-size: 24px;
        font-weight: bold;
        padding: 0.5rem;
    }

    .extra-stats-header > div:first-child {
        display: flex;
        align-items: center;
    }

    .extra-stats-header img {
        height: 28px;
    }

    .btn-sidebar {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #00000066;
        color: white;
        border-left: 10px solid #80af49;
        border-radius: 0;
        font-size: 24px;
        width: 100%;
        padding: 0.75rem;
    }

    /* .btn-sidebar:hover, .btn-sidebar:active {} */

    .btn-sidebar:disabled {
        background-color: #00000066;
        color: white;
        border-left: 10px solid #00000099;
        opacity: 1;
    }

    .btn-sidebar img {
        height: 32px;
    }

    .extra-stats-wrapper > div:last-child > button {
        border: 1px solid black;
        border-radius: 0;
    }

    .extra-stats-preview {
        background-color: #00000066;
        color: white;
        opacity: 0.75;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 4rem;
    }

    .extra-stats-preview > img {
        width: 36px;
        height: 36px;
    }

    .ad-block-bottom-center {
        display: flex;
        justify-content: center;
        margin: 1rem 0;
    }

    @media (min-width: 768px) {
        .player-name {
            font-size: 28px;            
        }

        select {
            font-weight: bold;
        }
    }
</style>
