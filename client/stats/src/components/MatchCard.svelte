<script lang="ts">
    import { onMount } from "svelte";

    import { TeamModeToTranslationKey } from "../helpers.ts";

    import type { Localization } from "$lib/modules/Localization.svelte.ts";
    import { helpers } from "../../../src/helpers.ts";

    import { TeamMode } from "@/shared/gameConfig.ts";
    import type { MatchDataResponse, MatchHistory } from "@/shared/types/stats.ts";

    const {
        summary,
        data,
        gameModes,
        localization,
        requestMatchData,
        setGameId,
        expanded,
    }: {
        summary: MatchHistory;
        data: MatchDataResponse | undefined;
        gameModes: ReturnType<typeof helpers["getGameModes"]>;
        localization: Localization;
        requestMatchData: (gameId: string) => void;
        setGameId: (expanded: boolean, id: string) => void;
        expanded: boolean;
    } = $props();

    const augmentedData = $derived.by(() => {
        let teamIdx = 0;
        let lastRank = 0;
        let lastTeamId = 0;

        return data?.map(player => {
            let showRank = false;

            if (player.team_id !== lastTeamId) {
                teamIdx++;
                lastTeamId = player.team_id;
            }

            if (player.rank !== lastRank) {
                lastRank = player.rank;
                showRank = true;
            }

            return {
                showRank,
                teamIdx,
                ...player,
            };
        });
    });

    let bodyInner = $state<HTMLElement>();

    $effect(() => {
        if (expanded && data) {
            const elm = document.querySelector<HTMLElement>(`.match-row-local[data-player-id="${summary.player_id}"]`);
            if (elm) {
                bodyInner?.scrollTo({
                    top: elm.offsetTop - 100,
                });
            }
        }
    });

    const localPlayer = $derived(data?.find(x => x.player_id === summary.player_id));
    const timeDiff = $derived.by(() => {
        const now = Date.now();
        const timestamp = new Date(summary.end_time).getTime();

        const secondsElapsed = (now - timestamp) / 1e3;
        if (secondsElapsed < 3600) {
            const minutes = Math.floor(secondsElapsed / 60);
            return minutes === 1
                ? "1 minute ago"
                : `${minutes} minutes ago`;
        } else if (secondsElapsed < 86400) {
            const hours = Math.floor(secondsElapsed / 3600);
            return hours === 1
                ? "1 hour ago"
                : `${hours} hours ago`;
        } else {
            const days = Math.floor(secondsElapsed / 86400);
            return days === 1
                ? "1 day ago"
                : `${days} days ago`;
        }
    });

    function copyGameId(e: MouseEvent): void {
        e.preventDefault();

        // TODO: Add visual indicator that the text has been copied. Maybe Bootstrap toasts?
        try {
            navigator.clipboard.writeText(summary.guid);
        } catch (_e) {
            console.warn("Unable to copy game ID to clipboard.");
        }
    }

    onMount(() => {
        if (expanded && !data) {
            requestMatchData(summary.guid);
        }
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- TODO: Translations for title attribute. -->
<div
    id="match-card-{summary.guid}"
    class="match-data-item match-card-{summary.team_mode}"
    oncontextmenu={copyGameId}
    title="Right-click to copy game ID."
>
    <div
        class="match-data-header"
        onclick={e => {
            setGameId(!expanded, summary.guid), !data && requestMatchData(summary.guid);
        }}
    >
        <div class="col d-none d-md-flex">
            <div></div>
            <span>{timeDiff}</span>
        </div>
        <div class="col col-lg-3">
            <span>{localization.translate(`${TeamModeToTranslationKey[summary.team_mode as TeamMode]}-rank`)}</span>
            <div>
                <span
                    class:text-gold={summary.rank === 1}
                    class:text-silver={summary.rank === 2}
                    class:text-bronze={summary.rank === 3}
                >#{summary.rank}</span>
                <span>/{summary.team_total}</span>
            </div>
        </div>
        <div class="col">
            <span>{localization.translate("stats-kills")}</span>
            <span>{summary.kills}</span>
        </div>
        <div class="col d-none d-lg-flex" class:invisible={summary.team_mode === TeamMode.Solo}>
            <span>{localization.translate("stats-team-kills")}</span>
            <span>{summary.team_kills}</span>
        </div>
        <div class="col">
            <span>{localization.translate("stats-damage-dealt")}</span>
            <span>{summary.damage_dealt}</span>
        </div>
        <div class="col">
            <span>{localization.translate("stats-damage-taken")}</span>
            <span>{summary.damage_taken}</span>
        </div>
        <div class="col">
            <span>{localization.translate("stats-survived")}</span>
            <span>{helpers.formatTime(summary.time_alive)}</span>
        </div>
        <div class="map-icon col d-none d-lg-flex">
            {#if gameModes[summary.map_id].desc.icon}
                <img src="/{gameModes[summary.map_id].desc.icon}" alt="Map icon">
            {/if}
        </div>
        <button
            class="match-data-expand-button"
            class:expanded
            type="button"
            aria-expanded="false"
            aria-controls="match-summary-{summary.guid}"
            aria-label="Expand statistic"
        ></button>
    </div>
    <div
        id="match-summary-{summary.guid}"
        class='match-data-collapse {expanded ? "show" : "collapse"}'
        data-bs-parent="#extra-stats-content"
    >
        <div class="match-data-body" onclick={e => e.stopPropagation()}>
            {#if data && localPlayer}
                <div class="match-data-body-inner" bind:this={bodyInner}>
                    <table>
                        <thead>
                            <tr>
                                <th>{localization.translate("stats-rank")}</th>
                                <th></th>
                                <th>{localization.translate("stats-player")}</th>
                                <th>{localization.translate("stats-kills")}</th>
                                <th>{localization.translate("stats-damage-dealt")}</th>
                                <th>{localization.translate("stats-survived")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each augmentedData as player, i (i)}
                                <tr
                                    class:team-local={false}
                                    class:match-row-local={player.player_id === localPlayer.player_id}
                                    class:match-row-dark={player.teamIdx % 2 === 0}
                                    class:match-row-light={player.teamIdx % 2 === 1}
                                    data-player-id={player.player_id}
                                >
                                    {#if player.showRank}
                                        <td>#{player.rank}</td>
                                    {:else}
                                        <td></td>
                                    {/if}
                                    <td>
                                        {#if player.killer_id === localPlayer.player_id}
                                            <img src="/img/ui/crosshair.svg" alt="Scope icon">
                                        {:else if player.player_id === localPlayer.killer_id}
                                            <img src="/img/ui/skull.svg" alt="Skull icon">
                                        {/if}
                                    </td>
                                    <td>
                                        {#if player.slug}
                                            <a href="/stats/?slug={player.slug}">{player.username}</a>
                                        {:else}
                                            {player.username}
                                        {/if}
                                    </td>
                                    <td>{player.kills}</td>
                                    <td>{player.damage_dealt}</td>
                                    <td>{helpers.formatTime(player.time_alive)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else if expanded}
                <div class="table-preview">
                    <div class="ui-spinner spinner-sm">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    @import "$lib/scss/mixins.scss";

    @mixin specific-card($color, $width) {
        & {
            border-left: 10px solid $color !important;
        }

        & > .match-data-header > div:first-child > div {
            width: $width;
        }
    }

    .match-data-item {
        background-color: #00000066;
        padding: 0.5rem;
        border-bottom: none;
        transition: background-color 0.15s;

        .match-data-header {
            display: flex;
            align-items: center;
            height: 84px;
            cursor: pointer;

            & > div {
                display: flex;
                flex-direction: column;
                justify-content: space-evenly;
                align-items: center;
                font-weight: bold;
                height: 100%;

                color: white;

                &:nth-child(n + 3) {
                    span:first-child {
                        color: #c8c8c8;
                        font-size: 10px;
                    }

                    span:last-child {
                        font-size: 20px;
                    }
                }

                &:first-child {
                    align-items: flex-start;

                    div {
                        background-image: url("/img/ui/player.svg");
                        background-position: center;
                        background-size: 26px;
                        background-repeat: space;
                        height: 26px;
                    }

                    span {
                        color: #c8c8c8;
                        font-size: 16px;
                    }
                }

                &:nth-child(2) {
                    align-items: flex-start;
                    margin-left: 0.5rem;

                    & > span {
                        font-size: 16px;
                        text-shadow: 1px 1px 1px black;
                    }

                    & > div {
                        span:first-child {
                            font-size: 20px;

                            &.text-gold {
                                color: gold;
                            }

                            &.text-silver {
                                color: #78ff00;
                            }

                            &.text-bronze {
                                color: #cd7f32;
                            }
                        }

                        span:last-child {
                            font-size: 12px;
                            font-weight: normal;
                        }
                    }
                }

                &.map-icon img {
                    width: 48px;
                    height: 48px;

                    padding: 0.5rem;

                    background-color: #00000040;
                }
            }
        }

        .match-data-expand-button {
            text-align: center;
            background-color: #00000080;
            background-image: url(../img/ui/expand.svg);
            background-position: 50%;
            background-repeat: no-repeat;
            background-size: 12px;
            border-radius: 2px;
            padding: 0.5rem;
            margin-left: auto;
            width: 2.5em;
            height: 100% !important;

            border: none;
            appearance: none;
            outline: none;
            box-shadow: none;

            &.expanded {
                transform: rotate(180deg);
            }
        }

        .match-data-collapse {
            overflow: hidden;
            transition: height 0.2s ease-in;
            height: 0px;
            display: block !important;

            &.show {
                height: 400px;
            }
        }

        .match-data-body {
            padding: 0;

            .match-data-body-inner {
                margin-top: 0.5rem;
                padding-right: 0.5rem;
                overflow-y: auto;
                height: calc(400px - 0.5rem);

                @include custom-scrollbar;
            }

            table {
                position: relative;
                color: white;
                width: 100%;
            }

            th, td {
                font-size: 12px;
                text-align: center;
                padding: 0.25rem;

                &:nth-child(3) {
                    text-align: left;
                }
            }

            th {
                background-color: #283820;
                text-transform: uppercase;
                position: sticky;
                top: 0;
            }

            .match-row-local {
                background-color: #00c80033 !important;
            }

            .match-row-light {
                background-color: transparent;
            }

            .match-row-dark {
                background-color: #00000033;
            }

            td {
                &:first-child {
                    color: #ffffff80;
                }

                &:nth-child(2) {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 26px;

                    img {
                        width: 12px;
                        height: 12px;
                    }
                }
            }

            a:link, a:visited {
                color: #7cfc00;
                text-decoration: none;
            }

            a:hover, a:active {
                color: #51a500;
                text-decoration: underline;
            }
        }

        &:hover {
            background-color: #00000080;
        }

        &.match-card-1 {
            @include specific-card(hsl(204, 70%, 53%), 26px);
        }

        &.match-card-2 {
            @include specific-card(hsl(283, 39%, 53%), 52px);
        }

        &.match-card-4 {
            @include specific-card(hsl(28, 80%, 52%), 52px);
        }

        &:has(:global(.show)), &:not(:has(.collapse)) {
            background-color: #19282899 !important;
        }

        .table-preview {
            opacity: 0.75;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 400px;
        }
    }

    @media (min-width: 768px) {
        .match-data-header > div {
            &:first-child {
                margin-left: 0.5rem;
            }

            &:nth-child(2) {
                margin-left: 1rem !important;

                & > span {
                    font-size: 20px !important;
                }

                & > div {
                    span:first-child {
                        font-size: 28px !important;
                    }

                    span:last-child {
                        font-size: 16px !important;
                    }
                }
            }

            &:nth-child(n + 3) {
                span:first-child {
                    font-size: 12px !important;
                }

                span:last-child {
                    font-size: 24px !important;
                }
            }
        }
    }

    @media (min-width: 992px) {
        .match-data-header > div:nth-child(2) {
            & > span {
                font-size: 24px !important;
            }

            & > div {
                span:first-child {
                    font-size: 32px !important;
                }

                span:last-child {
                    font-size: 20px !important;
                }
            }
        }

        th, td {
            font-size: 16px !important;
        }

        td:nth-child(2) {
            height: 32px !important;

            img {
                width: 20px !important;
                height: 20px !important;
            }
        }
    }

    @media (min-width: 1200px) {
        .match-data-header > div:first-child span {
            font-size: 18px !important;
        }
    }
</style>
