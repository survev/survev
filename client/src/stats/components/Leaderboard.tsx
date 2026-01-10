import type { Component } from "solid-js";
import { For, onMount, Show } from "solid-js";
import type { teamModesStrings } from "../../../../shared/defs/types/misc";
import type { LeaderboardRequest } from "../../../../shared/types/stats";
import { statsLocalization } from "../js/utils";
import type { LeaderboardData } from "./MainView";

type LeaderboardProps = {
    type: LeaderboardRequest["type"];
    interval: LeaderboardRequest["interval"];
    teamMode: (typeof teamModesStrings)[number];
    data: LeaderboardData["data"];
    statName: string;
    minGames: number;
};

export const Leaderboard: Component<LeaderboardProps> = (props) => {
    const showGamesColumn = () => props.type !== "most_kills";

    onMount(() => {
        statsLocalization.localizeIndex();
    });
    return (
        <table id="leaderboard-table">
            <thead>
                <tr class="leaderboard-headers">
                    <th
                        class="header-rank"
                        scope="col"
                        data-l10n="stats-rank"
                        data-caps="true"
                    >
                        RANK
                    </th>
                    <th
                        class="header-player"
                        scope="col"
                        data-l10n="stats-player"
                        data-caps="true"
                    >
                        PLAYER
                    </th>
                    <th
                        class="header-stat"
                        scope="col"
                        data-l10n={props.statName}
                        data-caps="true"
                    >
                        STAT
                    </th>
                    {showGamesColumn() && (
                        <th
                            class="header-games"
                            scope="col"
                            data-l10n="stats-games"
                            data-caps="true"
                        >
                            GAMES (&gt;{props.minGames})
                        </th>
                    )}
                    <th
                        class="header-region"
                        scope="col"
                        data-l10n="stats-region"
                        data-caps="true"
                    >
                        REGION
                    </th>
                </tr>
            </thead>
            <tbody class="leaderboard-values">
                {props.data?.map((player, index) => (
                    <Show
                        when={Array.isArray(player.slugs)}
                        fallback={
                            <tr class="main single-player">
                                <td class="data-rank" scope="row">
                                    #{index + 1}
                                </td>
                                <td class="data-player-names">
                                    <span class="player-name">
                                        {player.slug ? (
                                            <a href={`/stats/?slug=${player.slug}`}>
                                                {player.username}
                                            </a>
                                        ) : (
                                            player.username
                                        )}
                                    </span>
                                </td>
                                <td>{player.val}</td>
                                {showGamesColumn() && <td>{player.games}</td>}
                                <td class="data-region">
                                    {player.region ? player.region.toUpperCase() : ""}
                                </td>
                            </tr>
                        }
                    >
                        <tr class="main multiple-players">
                            <td class="data-rank" scope="row">
                                #{index + 1}
                            </td>
                            <td class="data-player-names">
                                <For each={player.slugs!}>
                                    {(slug, index) => (
                                        <span class="player-name">
                                            {slug ? (
                                                <a href={`/stats/?slug=${slug}`}>
                                                    {player.usernames![index()]}
                                                </a>
                                            ) : (
                                                player.usernames![index()]
                                            )}
                                        </span>
                                    )}
                                </For>
                            </td>
                            <td>{player.val}</td>
                            {showGamesColumn() && <td>{player.games}</td>}
                            <td>{player.region ? player.region.toUpperCase() : ""}</td>
                        </tr>
                    </Show>
                ))}
            </tbody>
        </table>
    );
};
