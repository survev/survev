import { type Component, createResource } from "solid-js";
import type { MatchDataResponse } from "../../../../shared/types/stats";
import { api } from "../../api";
import { helpers } from "../../helpers";

export interface MatchDataProps {
    gameId: string;
    localId: number;
}

const matchDataCache = new Map<string, MatchDataResponse>();

export const MatchData: Component<MatchDataProps> = (props) => {
    const fetchMatchData = async (gameId: string) => {
        if (!gameId) {
            return null;
        }

        if (matchDataCache.has(gameId)) {
            return matchDataCache.get(gameId)!;
        }

        const response = await fetch(api.resolveUrl("/api/match_data"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({ gameId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch match data`);
        }

        const data: MatchDataResponse = await response.json();
        matchDataCache.set(gameId, data);
        return data;
    };

    const [matchData] = createResource<MatchDataResponse | null, string>(
        () => props.gameId,
        fetchMatchData,
    );

    return (
        <>
            {matchData?.loading ? (
                <div class="col-12 spinner-wrapper-match-data">
                    <div class="spinner"></div>
                </div>
            ) : matchData?.error || !matchData() || matchData()?.length === 0 ? (
                <div class="col-lg-10">
                    <div class="m-3">Error loading match data, please try again.</div>
                </div>
            ) : (
                <>
                    <div class="match-header-wrapper">
                        <table class="match-table">
                            <thead>
                                <tr class="match-headers">
                                    <th
                                        class="match-header-rank"
                                        scope="col"
                                        data-l10n="stats-rank"
                                        data-caps="true"
                                    >
                                        RANK
                                    </th>
                                    <th
                                        class="match-header-icon hide-xs"
                                        scope="col"
                                    ></th>
                                    <th
                                        class="match-header-player"
                                        scope="col"
                                        data-l10n="stats-player"
                                        data-caps="true"
                                    >
                                        PLAYER
                                    </th>
                                    <th
                                        class="match-header-stat"
                                        scope="col"
                                        data-l10n="stats-kills"
                                        data-caps="true"
                                    >
                                        KILLS
                                    </th>
                                    <th
                                        class="match-header-stat hide-xs"
                                        scope="col"
                                        data-l10n="stats-damage"
                                        data-caps="true"
                                    >
                                        DAMAGE
                                    </th>
                                    <th
                                        class="match-header-stat"
                                        scope="col"
                                        data-l10n="stats-survived"
                                        data-caps="true"
                                    >
                                        SURVIVED
                                    </th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    <div class="match-table-wrapper">
                        <table class="match-table">
                            <thead>
                                <tr class="match-headers">
                                    <th class="match-header-rank"></th>
                                    <th class="match-header-icon hide-xs"></th>
                                    <th class="match-header-player"></th>
                                    <th class="match-header-stat"></th>
                                    <th class="match-header-stat hide-xs"></th>
                                    <th class="match-header-stat"></th>
                                </tr>
                            </thead>
                            <tbody class="match-values">
                                {(() => {
                                    let teamId = 0;
                                    let teamIdx = 0;

                                    return matchData()?.map((d) => {
                                        let showRank = false;
                                        if (teamId !== d.team_id) {
                                            teamId = d.team_id;
                                            teamIdx += 1;
                                            showRank = true;
                                        }

                                        return (
                                            <tr
                                                class={`main single-player ${teamIdx % 2 === 0 ? "match-row-dark" : "match-row-light"} ${d.player_id === props.localId ? "match-row-local" : ""}`}
                                            >
                                                {showRank ? (
                                                    <td class="data-rank" scope="row">
                                                        #{d.rank}
                                                    </td>
                                                ) : (
                                                    <td></td>
                                                )}

                                                <td class="data-player-status hide-xs">
                                                    {props.localId !== 0 &&
                                                        d.killer_id === props.localId && (
                                                            <div class="player-icon player-kill" />
                                                        )}
                                                    {(d.killed_ids || []).some(
                                                        (killedId) =>
                                                            props.localId !== 0 &&
                                                            killedId === props.localId,
                                                    ) && (
                                                        <div class="player-icon player-death" />
                                                    )}
                                                </td>

                                                <td class="data-player-names">
                                                    <span class="player-name">
                                                        {d.slug ? (
                                                            <a
                                                                class="player-slug"
                                                                href={`/stats/?slug=${d.slug}`}
                                                            >
                                                                {d.username}
                                                            </a>
                                                        ) : (
                                                            d.username
                                                        )}
                                                    </span>
                                                </td>

                                                <td>{d.kills}</td>
                                                <td class="hide-xs">{d.damage_dealt}</td>
                                                <td>
                                                    {helpers.formatTime(d.time_alive)}
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </>
    );
};
