import { type Component, createResource, createSignal, Show } from "solid-js";
import { TeamModeToString } from "../../../../shared/defs/types/misc";
import { TeamMode } from "../../../../shared/gameConfig";
import {
    ALL_TEAM_MODES,
    type MatchHistoryParams,
    type MatchHistoryResponse,
} from "../../../../shared/types/stats";
import { api } from "../../api";
import { helpers } from "../../helpers";
import { Loading } from "./Loading";
import { MatchData } from "./MatchData";

export interface MatchHistoryProps {
    selectedSlug: () => string;
    teamModeFilter: () => number;
}

type MatchHistoryClientData = {
    summary: MatchHistoryResponse[number] & {
        icon: string;
    };
    expanded: boolean;
    data?: any;
    dataError?: boolean;
};

const matchHistoryCache = new Map<number, MatchHistoryClientData[]>();

export const MatchHistory: Component<MatchHistoryProps> = (props) => {
    const [games, setGames] = createSignal<MatchHistoryClientData[]>(
        matchHistoryCache.get(props.teamModeFilter()) || [],
    );
    const [moreGamesAvailable, setMoreGamesAvailable] = createSignal(true);
    const [matchHistoryOffset, setMatchHistoryOffset] = createSignal(0);
    const [isLoading, setIsLoading] = createSignal(false);

    const [matchHistoryResource] = createResource<
        MatchHistoryClientData[] | null,
        {
            slug: string;
            offset: number;
            teamModeFilter: number;
        }
    >(
        () => ({
            slug: props.selectedSlug(),
            offset: matchHistoryOffset(),
            teamModeFilter: props.teamModeFilter(),
        }),
        async ({ slug, offset, teamModeFilter }) => {
            if (offset === 0 && matchHistoryCache.has(teamModeFilter)) {
                setGames(matchHistoryCache.get(teamModeFilter)!);
                return null;
            }

            try {
                if (offset === 0) {
                    setIsLoading(true);
                }
                const count = 10;
                const args: MatchHistoryParams = {
                    slug,
                    offset: offset + 1,
                    count,
                    teamModeFilter: teamModeFilter as any,
                };

                const response = await fetch(api.resolveUrl("/api/match_history"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                    body: JSON.stringify(args),
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch match history");
                }

                const data: MatchHistoryResponse = await response.json();
                const gameModes = helpers.getGameModes();

                const result = data.map((game: any) => ({
                    summary: {
                        ...game,
                        icon:
                            gameModes.find((x) => x.mapId == game.map_id)?.desc.icon ||
                            "",
                    },
                    expanded: false,
                    data: undefined,
                    dataError: false,
                })) satisfies MatchHistoryClientData[];

                if (matchHistoryOffset() === 0) {
                    setGames(result);
                } else {
                    setGames((prev) => [...prev, ...result]);
                }

                setMoreGamesAvailable(result.length >= 10);

                if (
                    matchHistoryOffset() === 0 &&
                    !matchHistoryCache.has(teamModeFilter)
                ) {
                    matchHistoryCache.set(teamModeFilter, games());
                }
                return result;
            } catch (_err: unknown) {
                return null;
            } finally {
                setIsLoading(false);
            }
        },
    );

    const onMatchClick = (gameId: string) => {
        const game = games().find((g) => g.summary.guid === gameId);
        if (!game) return;

        setGames((prev) =>
            prev.map((g) => {
                if (g.summary.guid === gameId) {
                    return { ...g, expanded: !g.expanded };
                }
                return g;
            }),
        );
    };

    const gamesToDisplay = () =>
        games().filter(
            (g) =>
                props.teamModeFilter() === ALL_TEAM_MODES ||
                g.summary.team_mode === props.teamModeFilter(),
        );

    return (
        <Show when={!isLoading()} fallback={<Loading type="match_history" />}>
            <div class="header-extra">MATCH HISTORY</div>

            {matchHistoryResource?.error ? (
                <div class="col-lg-10">
                    <div class="m-3">Error loading content, please try again.</div>
                </div>
            ) : games().length === 0 ? (
                <div class="col-lg-10">
                    <div class="m-3">No recent games played.</div>
                </div>
            ) : (
                <>
                    <div class="col-lg-12">
                        {gamesToDisplay().length &&
                            gamesToDisplay().map((game) => {
                                const teamModeString =
                                    TeamModeToString[game.summary.team_mode];
                                const getLocalPlayerId = () => {
                                    const expandedGame = games().find((g) => g.expanded);
                                    if (!expandedGame || !expandedGame.data) return 0;

                                    const currentPlayerSlug = props.selectedSlug();
                                    const player = expandedGame.data.find(
                                        (d: any) => d.slug === currentPlayerSlug,
                                    );
                                    return player?.player_id || 0;
                                };
                                return (
                                    <div
                                        class={`row row-match match-link js-match-data ${game.expanded ? "match-link-expanded" : ""}`}
                                        onClick={() => onMatchClick(game.summary.guid)}
                                    >
                                        <div
                                            class={`match-link-mode-color match-link-mode-${teamModeString}`}
                                        />

                                        <div class="hide-xs col-2">
                                            <div class="match-link-player-icons">
                                                {Array.from(
                                                    { length: game.summary.team_count },
                                                    (_, i) => (
                                                        <div class="match-link-player-icon" />
                                                    ),
                                                )}
                                            </div>
                                            <div class="match-link-start-time">
                                                {formatTimeAgo(game.summary.end_time)}
                                            </div>
                                        </div>

                                        <div class="col-3">
                                            <div class="match-link-stat">
                                                <div class="match-link-stat-name match-link-stat-name-lg">
                                                    <span
                                                        style={{
                                                            "text-transform":
                                                                "capitalize",
                                                        }}
                                                    >
                                                        {teamModeString}{" "}
                                                    </span>
                                                    Rank
                                                </div>
                                                <div class="match-link-stat-value match-link-stat-value-lg">
                                                    <span
                                                        class={`match-link-stat-rank match-link-stat-${game.summary.rank}`}
                                                    >
                                                        #{game.summary.rank}
                                                    </span>
                                                    /{game.summary.team_total || 80}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="col-2 col-md-1">
                                            <div class="match-link-stat">
                                                <div class="match-link-stat-name match-link-stat-name-md">
                                                    Kills
                                                </div>
                                                <div class="match-link-stat-value match-link-stat-value-md">
                                                    {game.summary.kills}
                                                </div>
                                            </div>
                                        </div>

                                        {game.summary.team_mode !== TeamMode.Solo && (
                                            <div class="hide-xs col-md-1">
                                                <div class="match-link-stat">
                                                    <div class="match-link-stat-name match-link-stat-name-md">
                                                        Team Kills
                                                    </div>
                                                    <div class="match-link-stat-value match-link-stat-value-md">
                                                        {game.summary.team_kills || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div
                                            class={`col-2 col-md-1 ${(game.summary.team_mode) === TeamMode.Solo ? "offset-md-1" : ""}`}
                                        >
                                            <div class="match-link-stat">
                                                <div class="match-link-stat-name match-link-stat-name-md">
                                                    Damage Dealt
                                                </div>
                                                <div class="match-link-stat-value match-link-stat-value-md">
                                                    {game.summary.damage_dealt}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="col-2 col-md-1">
                                            <div class="match-link-stat">
                                                <div class="match-link-stat-name match-link-stat-name-md">
                                                    Damage Taken
                                                </div>
                                                <div class="match-link-stat-value match-link-stat-value-md">
                                                    {game.summary.damage_taken}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="col-2 col-md-1">
                                            <div class="match-link-stat">
                                                <div class="match-link-stat-name match-link-stat-name-md">
                                                    Survived
                                                </div>
                                                <div class="match-link-stat-value match-link-stat-value-md">
                                                    {helpers.formatTime(
                                                        game.summary.time_alive,
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="hide-xs col-md-1">
                                            {game.summary.icon && (
                                                <div class="match-link-stat">
                                                    <div
                                                        class="game-mode-icon"
                                                        style={`background-image: url(/${game.summary.icon})`}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div class="offset-0 col-1 pl-0 pr-0">
                                            <div
                                                class={`match-link-expand ${game.expanded ? "match-link-expand-up" : "match-link-expand-down"}`}
                                            />
                                        </div>

                                        <Show when={game.expanded}>
                                            <div id="match-data" class="col-lg-12">
                                                <MatchData
                                                    gameId={game.summary.guid}
                                                    localId={getLocalPlayerId()}
                                                />
                                            </div>
                                        </Show>
                                    </div>
                                );
                            })}
                    </div>
                    {moreGamesAvailable() && (
                        <>
                            {matchHistoryResource?.loading ? (
                                <div class="col-12 spinner-wrapper-match-data">
                                    <div class="spinner"></div>
                                </div>
                            ) : (
                                <div
                                    class="col-12 js-match-load-more btn-darken"
                                    onClick={() => {
                                        setMatchHistoryOffset((prev) => prev + 10);
                                    }}
                                >
                                    More
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </Show>
    );
};

const formatTimeAgo = (endTime: string | Date) => {
    const timeStart = new Date(endTime);
    const now = Date.now();
    const secondsPast = (now - timeStart.getTime()) / 1000;

    if (secondsPast < 3600) {
        const minutes = Math.round(secondsPast / 60);
        return minutes < 2 ? "1 minute ago" : `${minutes} minutes ago`;
    }
    if (secondsPast <= 86400) {
        const hours = Math.round(secondsPast / 3600);
        return hours === 1 ? "an hour ago" : `${hours} hours ago`;
    }
    if (secondsPast > 86400 && secondsPast < 172800) {
        return `${Math.floor(secondsPast / 86400)} day ago`;
    }
    return `${Math.floor(secondsPast / 86400)} days ago`;
};
