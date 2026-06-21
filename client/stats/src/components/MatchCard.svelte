<script lang="ts">
    import { onMount } from "svelte";

    import { TeamModeToTranslationKey } from "../helpers.ts";

    import { helpers } from "$lib/modules/helpers.svelte.ts";
    import type { Localization } from "$lib/modules/Localization.svelte.ts";

    import { TeamMode } from "@/shared/gameConfig.ts";
    import type { MatchDataResponse, MatchHistory } from "@/shared/types/stats.ts";

    const {
        summary,
        data,
        slug,
        gameModes,
        localization,
        requestMatchData,
        setGameId,
        autoExpand,
    }: {
        summary: MatchHistory;
        data: MatchDataResponse | undefined;
        slug: string;
        gameModes: ReturnType<typeof helpers["getGameModes"]>;
        localization: Localization;
        requestMatchData: (gameId: string) => void;
        setGameId: (id: string) => void;
        autoExpand: boolean;
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

    const localPlayer = $derived(data?.find(x => x.slug === slug));
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

    let accordionButton = $state<HTMLButtonElement>();

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
        if (autoExpand && !data) {
            requestMatchData(summary.guid);
        }
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- TODO: Translations for title attribute. -->
<div
    id="match-card-{summary.guid}"
    class="accordion-item match-card-{summary.team_mode}"
    onclick={e => (accordionButton?.click())}
    oncontextmenu={copyGameId}
    title="Right-click to copy game ID."
>
    <div class="accordion-header">
        <div class="col d-none d-md-flex">
            <div></div>
            <span>{timeDiff}</span>
        </div>
        <div class="col col-lg-2">
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
        <div class="col d-none d-lg-flex">
            {#if gameModes[summary.map_id].desc.icon}
                <img src="/{gameModes[summary.map_id].desc.icon}" alt="Map icon">
            {/if}
        </div>
        <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#match-summary-{summary.guid}"
            aria-expanded="false"
            aria-controls="match-summary-{summary.guid}"
            aria-label="Expand statistic"
            bind:this={accordionButton}
            onclick={e => (e.stopPropagation(), setGameId(summary.guid), !data && requestMatchData(summary.guid))}
        ></button>
    </div>
    <div
        id="match-summary-{summary.guid}"
        class='accordion-collapse {autoExpand ? "show" : "collapse"}'
        data-bs-parent="#extra-stats-content"
    >
        <div class="accordion-body">
            <div class="accordion-body-inner">
                {#if data && localPlayer}
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
                {:else}
                    <div class="table-preview">
                        <div class="ui-spinner spinner-sm">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    @import "$lib/scss/mixins.scss";

    @mixin specific-card($color, $width) {
        & {
            border-left: 10px solid $color !important;
        }

        & > .accordion-header > div:first-child > div {
            width: $width;
        }
    }

    .accordion-item {
        background-color: #00000066;
        padding: 0.5rem;
        border-bottom: none;
        cursor: pointer;
        transition: 0.15s;

        .accordion-header {
            display: flex;
            align-items: center;
            height: 84px;

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

                &:nth-child(8) img {
                    width: 48px;
                    height: 48px;

                    padding: 0.5rem;

                    background-color: #00000040;
                }
            }
        }

        .accordion-button {
            background-color: #00000080;
            width: fit-content;
            height: 100% !important;
            box-shadow: none;

            padding: 0.5rem;

            &::after {
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke=%27%23ffffff%27 stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
                background-size: 16px;
                background-position: center;
            }
        }

        .accordion-collapse {
            interpolate-size: allow-keywords;
            transition: height 0.35s;
            overflow: hidden;
        }

        .accordion-body {
            padding: 0;

            .accordion-body-inner {
                margin-top: 0.5rem;
                padding-right: 0.5rem;
                max-height: 400px;
                overflow-y: auto;

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
            padding: 4rem;
        }
    }

    @media (min-width: 768px) {
        .accordion-header > div {
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
        .accordion-header > div:nth-child(2) {
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
        .accordion-header > div:first-child span {
            font-size: 18px !important;
        }
    }
</style>
