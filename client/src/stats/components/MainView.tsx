import type { Component } from "solid-js";
import { createResource, createSignal, onMount } from "solid-js";
import { MapId, type teamModesStrings } from "../../../../shared/defs/types/misc";
import type { LeaderboardRequest } from "../../../../shared/types/stats";
import { api } from "../../api";
import { helpers } from "../../helpers";
import { Leaderboard } from "./Leaderboard";
import { LeaderboardError } from "./LeaderboardError";
import { Loading } from "./Loading";

export interface LeaderboardData extends Partial<LeaderboardRequest> {
    data?: Array<{
        username: string;
        usernames?: string[];
        slug: string;
        slugs?: string[];
        val: number;
        games?: number;
        region?: string;
    }>;
}

export interface MainViewProps {
    phoneDetected: boolean;
    gameModes: Array<{ mapId: number; desc: { name: string } }>;
}

export const MainView: Component<MainViewProps> = (props) => {
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal(false);
    const [selectedType, setSelectedType] =
        createSignal<LeaderboardRequest["type"]>("most_kills");
    const [selectedInterval, setSelectedInterval] =
        createSignal<LeaderboardRequest["interval"]>("daily");
    const [selectedTeamMode, setSelectedTeamMode] =
        createSignal<(typeof teamModesStrings)[number]>("solo");
    const [selectedMapId, setSelectedMapId] = createSignal(MapId.Main.toString());

    const typeToString = {
        most_kills: "stats-most-kills",
        most_damage_dealt: "stats-most-damage",
        kills: "stats-total-kills",
        wins: "stats-total-wins",
        kpg: "stats-kpg",
    } as const;

    const fetchLeaderboardData = async () => {
        setLoading(true);
        setError(false);

        let type =
            helpers.getParameterByName<LeaderboardRequest["type"]>("type") ||
            "most_kills";
        const interval =
            helpers.getParameterByName<LeaderboardRequest["interval"]>("t") || "daily";
        const teamMode =
            helpers.getParameterByName<(typeof teamModesStrings)[number]>("team") ||
            "solo";
        const mapId =
            helpers.getParameterByName<string>("mapId") || MapId.Main.toString();

        // Change to most_damage_dealt if faction mode and most_kills selected
        if (type === "most_kills" && Number(mapId) === MapId.Faction) {
            type = "most_damage_dealt";
        }

        setSelectedType(type);
        setSelectedInterval(interval);
        setSelectedTeamMode(teamMode);
        setSelectedMapId(mapId);

        const args: LeaderboardRequest = {
            type: type,
            interval: interval,
            teamMode: teamMode,
            mapId: mapId,
        };

        try {
            const response = await fetch(api.resolveUrl("/api/leaderboard"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
                body: JSON.stringify(args),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch leaderboard data");
            }

            const data = await response.json();

            return {
                type: type,
                interval: interval,
                teamMode: teamMode,
                mapId: mapId,
                data: data,
            } as LeaderboardData;
        } catch (_err: unknown) {
            setError(true);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const [leaderboardData, { refetch }] = createResource(fetchLeaderboardData);

    const onParamsChange = () => {
        const type = (document.getElementById("leaderboard-type") as HTMLSelectElement)
            ?.value;
        const time = (document.getElementById("leaderboard-time") as HTMLSelectElement)
            ?.value;
        const teamMode = (
            document.getElementById("leaderboard-team-mode") as HTMLSelectElement
        )?.value;
        const mapId = (document.getElementById("leaderboard-map-id") as HTMLSelectElement)
            ?.value;

        window.history.pushState(
            "",
            "",
            `?type=${type}&team=${teamMode}&t=${time}&mapId=${mapId}`,
        );
        refetch();
    };

    // Initialize URL params on mount
    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const type =
            (urlParams.get("type") as LeaderboardRequest["type"]) || "most_kills";
        const time = (urlParams.get("t") as LeaderboardRequest["interval"]) || "daily";
        const team = (urlParams.get("team") as LeaderboardRequest["teamMode"]) || "solo";
        const mapId = urlParams.get("mapId") || MapId.Main.toString();

        setSelectedType(type);
        setSelectedInterval(time);
        setSelectedTeamMode(team);
        setSelectedMapId(mapId);
    });

    const currentData = () => leaderboardData();
    const isLoading = () => loading() || leaderboardData.loading;
    const hasError = () => error() || !currentData()?.data;
    const factionMode = () => Number(selectedMapId()) === 3;

    return (
        <>
            <div id="leaderboard-bg" class="stats-bg"></div>

            {!props.phoneDetected && (
                <div id="ad-block-top" class="container mt-3">
                    <div class="ad-block-top-leaderboard">
                        <div id="surviv-io_728x90_Leaderboard">{/* Ad content */}</div>
                    </div>
                    <div class="ad-block-top-med-rect">
                        <div id="surviv-io_300x250_leaderboard">{/* Ad content */}</div>
                    </div>
                </div>
            )}

            <div class="container mt-3">
                <div class="card card-leaderboard col-lg-8 col-12 p-0">
                    <div class="card-body">
                        <div class="row card-row-top">
                            <div class="col-12">
                                <div
                                    class="leaderboard-title ml-sm-3 ml-0 mr-0 mt-3"
                                    data-l10n="index-leaderboards"
                                    data-caps="true"
                                >
                                    LEADERBOARDS
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container mt-3">
                <div class="row">
                    <div class="col-lg-2 col-3 pr-lg-3 pr-1">
                        <select
                            id="leaderboard-team-mode"
                            class="leaderboard-opt custom-select"
                            onChange={onParamsChange}
                        >
                            <option
                                value="solo"
                                data-l10n="stats-solo"
                                selected={selectedTeamMode() === "solo"}
                            >
                                Solo
                            </option>
                            <option
                                value="duo"
                                data-l10n="stats-duo"
                                selected={selectedTeamMode() === "duo"}
                            >
                                Duo
                            </option>
                            <option
                                value="squad"
                                data-l10n="stats-squad"
                                selected={selectedTeamMode() === "squad"}
                            >
                                Squad
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-2 col-3 pl-lg-0 pr-lg-3 pl-0 pr-1">
                        <select
                            id="leaderboard-type"
                            class="leaderboard-opt custom-select"
                            onChange={onParamsChange}
                        >
                            <option
                                value="most_kills"
                                data-l10n="stats-most-kills"
                                selected={selectedType() === "most_kills"}
                                disabled={factionMode()}
                            >
                                Most kills
                            </option>
                            <option
                                value="most_damage_dealt"
                                data-l10n="stats-most-damage"
                                selected={selectedType() === "most_damage_dealt"}
                            >
                                Most damage
                            </option>
                            <option
                                value="kpg"
                                data-l10n="stats-kpg-full"
                                selected={selectedType() === "kpg"}
                            >
                                Kills per game
                            </option>
                            <option
                                value="kills"
                                data-l10n="stats-total-kills"
                                selected={selectedType() === "kills"}
                            >
                                Total kills
                            </option>
                            <option
                                value="wins"
                                data-l10n="stats-total-wins"
                                selected={selectedType() === "wins"}
                            >
                                Total wins
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-2 col-3 pl-lg-0 pr-lg-3 pl-0 pr-1">
                        <select
                            id="leaderboard-time"
                            class="leaderboard-opt custom-select"
                            onChange={onParamsChange}
                        >
                            <option
                                value="daily"
                                data-l10n="stats-today"
                                selected={selectedInterval() === "daily"}
                            >
                                Today
                            </option>
                            <option
                                value="weekly"
                                data-l10n="stats-this-week"
                                selected={selectedInterval() === "weekly"}
                            >
                                This week
                            </option>
                            <option
                                value="alltime"
                                data-l10n="stats-all-time"
                                selected={selectedInterval() === "alltime"}
                            >
                                All time
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-2 col-3 pl-0">
                        <select
                            id="leaderboard-map-id"
                            class="leaderboard-opt custom-select"
                            onChange={onParamsChange}
                        >
                            {props.gameModes.map((mode) => (
                                <option
                                    value={mode.mapId.toString()}
                                    selected={selectedMapId() === mode.mapId.toString()}
                                >
                                    {mode.desc.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div class="container mt-2 mb-4 p-sm-3 p-0">
                <div class="row justify-content-center">
                    <div class="col-md-12">
                        <div class="content">
                            {isLoading() ? (
                                <Loading type="leaderboard" />
                            ) : hasError() || !currentData()?.data ? (
                                <LeaderboardError />
                            ) : (
                                <Leaderboard
                                    type={currentData()!.type!}
                                    interval={currentData()!.interval!}
                                    teamMode={currentData()!.teamMode!}
                                    data={currentData()!.data!}
                                    statName={typeToString[currentData()!.type!] || ""}
                                    minGames={1}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {props.phoneDetected && (
                <div class="col-12">
                    <div class="ad-block-bot-med-rect">
                        <div id="surviv-io_300x250_leaderboard">{/* Ad content */}</div>
                    </div>
                </div>
            )}
        </>
    );
};
