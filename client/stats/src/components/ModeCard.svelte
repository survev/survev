<script lang="ts">
    import { helpers } from "../../../src/helpers.ts";
    import { RequestState, TeamModeToTranslationKey } from "../helpers.ts";

    import { Localization } from "$lib/modules/Localization.svelte.ts";

    import type { TeamMode } from "@/shared/gameConfig.ts";
    import type { Mode } from "@/shared/types/stats.ts";

    const {
        key,
        mode,
        localization,
        reqState,
    }: {
        key: TeamMode;
        mode: Mode | undefined;
        localization: Localization;
        reqState: RequestState;
    } = $props();
</script>

<div class="mode-card mode-card-{key}">
    <div class="mode-card-header">
        <div class="col-6">
            <div></div>
            <span>{localization.translate(TeamModeToTranslationKey[key])}</span>
        </div>
        <div class="col-6">
            <span class:invisible={!mode}>{mode?.games} {localization.translate("stats-games")}</span>
        </div>
    </div>
    <div class="mode-card-content">
        <div class="mode-card-data" class:invisible={!mode || reqState !== RequestState.Loaded}>
            <!--
                <div>
                    <div class="col-6">
                        <span>{localization.translate("stats-rating")}</span>
                        <span>-</span>
                    </div>
                    <div class="col-6">
                        <span>{localization.translate("stats-rank")}</span>
                        <span>-</span>
                    </div>
                </div>
            -->
            <div>
                <div class="col-6">
                    <span>{localization.translate("stats-wins")}</span>
                    <span>{mode?.wins ?? 0}</span>
                </div>
                <div class="col-6">
                    <span>{localization.translate("stats-win-pct")}</span>
                    <span>{mode?.winPct ?? 0}</span>
                </div>
            </div>
            <div>
                <div class="col-6">
                    <span>{localization.translate("stats-kills")}</span>
                    <span>{mode?.kills ?? 0}</span>
                </div>
                <div class="col-6">
                    <span>{localization.translate("stats-avg-survived")}</span>
                    <span>{helpers.formatTime(mode?.avgTimeAlive ?? 0)}</span>
                </div>
            </div>
            <div>
                <div class="col-6">
                    <span>{localization.translate("stats-most-kills")}</span>
                    <span>{mode?.mostKills ?? 0}</span>
                </div>
                <div class="col-6">
                    <span>{localization.translate("stats-kpg")}</span>
                    <span>{mode?.kpg ?? "0.0"}</span>
                </div>
            </div>
            <div>
                <div class="col-6">
                    <span>{localization.translate("stats-most-damage")}</span>
                    <span>{mode?.mostDamage ?? 0}</span>
                </div>
                <div class="col-6">
                    <span>{localization.translate("stats-avg-damage")}</span>
                    <span>{mode?.avgDamage ?? 0}</span>
                </div>
            </div>
        </div>
        <div class="mode-card-preview" class:d-none={reqState !== RequestState.Loading}>
            <div class="ui-spinner spinner-sm">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
        <div
            class="mode-card-preview gap-2"
            class:d-none={reqState === RequestState.Loading || (reqState === RequestState.Loaded && mode)}
        >
            <img src="/img/ui/danger.svg" alt="Danger icon">
            <span>No games played.</span>
        </div>
    </div>
</div>

<style lang="scss">
    @mixin specific-card($color, $width, $height) {
        & > div:first-child {
            background-color: $color;
        }

        & > div:first-child > div:first-child > div {
            width: $width;
            height: $height;
        }
    }

    .mode-card {
        text-transform: uppercase;
        color: white;

        .mode-card-header {
            display: flex;
            padding: 0.25rem 1.5rem;

            .col-6 {
                display: flex;
                align-items: center;
                font-weight: bold;

                &:first-child {
                    font-size: 28px;
                    gap: 0.5rem;

                    div {
                        background-image: url("/img/ui/player.svg");
                        background-position: center;
                        background-size: 18px;
                        background-repeat: space;
                    }
                }

                &:last-child {
                    justify-content: flex-end;
                    font-size: 18px;
                }
            }
        }

        .mode-card-content {
            position: relative;

            .mode-card-data > div {
                display: flex;
                padding: 0.25rem 1.5rem;

                .col-6 {
                    display: flex;
                    flex-direction: column;

                    span:first-child {
                        color: gold;
                        font-size: 12px;
                    }

                    span:last-child {
                        font-size: 24px;
                    }
                }

                &:nth-child(1) {
                    // background-color: hsl(91, 35%, 32%);
                    // font-weight: bold;
                    padding-top: 0.75rem;

                    // span:first-child {
                    //     font-size: 14px !important;
                    // }

                    // span:last-child {
                    //     font-size: 32px !important;
                    // }
                }

                &:nth-child(n + 1) {
                    background-color: hsl(93, 31%, 27%);
                }

                &:nth-child(1) {
                    padding-top: 0.75rem;
                }

                &:nth-child(4) {
                    padding-bottom: 0.75rem;
                }
            }
        }

        .mode-card-preview {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;

            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background-color: hsl(91, 35%, 32%);
            text-transform: none;

            & img {
                width: 36px;
                height: 36px;
            }

            & > * {
                opacity: 0.75;
            }
        }

        &.mode-card-1 {
            @include specific-card(hsl(204, 70%, 53%), 18px, 18px);
        }

        &.mode-card-2 {
            @include specific-card(hsl(283, 39%, 53%), 36px, 18px);
        }

        &.mode-card-4 {
            @include specific-card(hsl(28, 80%, 52%), 36px, 36px);
        }
    }
</style>
