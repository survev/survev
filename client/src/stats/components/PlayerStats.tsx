import type { Component } from "solid-js";
import { createMemo, createResource, createSignal, onMount, Show } from "solid-js";
import { EmotesDefs } from "../../../../shared/defs/gameObjects/emoteDefs";
import { TeamModeToString } from "../../../../shared/defs/types/misc";
import type { TeamMode } from "../../../../shared/gameConfig";
import type { UserStatsRequest, UserStatsResponse } from "../../../../shared/types/stats";
import { ALL_MAPS } from "../../../../shared/types/stats";
import { api } from "../../api";
import { helpers } from "../../helpers";

export interface TeamModeCard {
    teamMode: TeamMode;
    games: number;
    name: string;
    midStats: { name: string; val: string }[];
    botStats: { name: string; val: string }[];
}

export interface PlayerStatsProps {
    phoneDetected: boolean;
    teamModeFilter: () => TeamMode;
    onTeamModeFilterChange: (filter: number) => void;
}

export function useUserStats(
    slug: () => string,
    interval: () => UserStatsRequest["interval"],
    mapIdFilter: () => string,
) {
    const cache = new Map<string, { data: UserStatsResponse; error: boolean }>();

    const fetchUserStats = async () => {
        const args: UserStatsRequest = {
            slug: slug(),
            interval: interval(),
            mapIdFilter: mapIdFilter(),
        };

        const cacheKey = `${interval()}${mapIdFilter()}`;
        const cached = cache.get(cacheKey);

        if (cached) {
            return cached.error ? null : cached.data;
        }

        try {
            const response = await fetch(api.resolveUrl("/api/user_stats"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
                body: JSON.stringify(args),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user stats");
            }

            const data: UserStatsResponse = await response.json();
            cache.set(cacheKey, { data, error: false });
            return data;
        } catch (_err: unknown) {
            cache.set(cacheKey, { data: null as any, error: true });
            return null;
        }
    };

    return createResource<UserStatsResponse | null, UserStatsRequest>(
        () => ({
            slug: slug(),
            interval: interval(),
            mapIdFilter: mapIdFilter(),
        }),
        fetchUserStats,
    );
}

export const PlayerStats: Component<PlayerStatsProps> = (props) => {
    const params = new URLSearchParams(window.location.search);
    const [selectedSlug] = createSignal(params.get("slug") || "");
    const [selectedInterval, setSelectedInterval] = createSignal(
        params.get("time") || "alltime",
    );
    const [selectedMapId, setSelectedMapId] = createSignal(
        params.get("mapId") || ALL_MAPS,
    );
    const [userStats] = useUserStats(
        () => selectedSlug(),
        () => selectedInterval() as UserStatsRequest["interval"],
        () => selectedMapId(),
    );

    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setSelectedInterval(urlParams.get("time") || "alltime");
        setSelectedMapId(urlParams.get("mapId") || ALL_MAPS);
    });

    const updateSearchParams = () => {
        const searchParams = new URLSearchParams();
        searchParams.set("slug", selectedSlug());
        searchParams.set("time", selectedInterval());
        searchParams.set("mapId", selectedMapId());
        window.history.pushState("", "", `?${searchParams.toString()}`);
    };

    const onIntervalChange = (interval: string) => {
        setSelectedInterval(() => interval);
        updateSearchParams();
    };

    const onMapIdChange = (mapId: string) => {
        setSelectedMapId(() => mapId);
        updateSearchParams();
    };

    const GAME_MODES = helpers.getGameModes();

    const getTeamModes = (): TeamModeCard[] => {
        if (!userStats() || userStats.error) {
            return [];
        }

        const modes: TeamModeCard[] = [];
        for (let i = 0; i < userStats()!.modes.length; i++) {
            const mode = userStats()!.modes[i];

            const midStats: { name: string; val: string }[] = [];
            midStats.push({ name: "Rating", val: "-" });
            midStats.push({ name: "Rank", val: "-" });

            const botStats: { name: string; val: string }[] = [];
            botStats.push({ name: "Wins", val: mode.wins.toString() });
            botStats.push({ name: "Win %", val: mode.winPct });
            botStats.push({ name: "Kills", val: mode.kills.toString() });
            botStats.push({
                name: "Avg Survived",
                val: helpers.formatTime(mode.avgTimeAlive),
            });
            botStats.push({ name: "Most kills", val: mode.mostKills.toString() });
            botStats.push({ name: "K/G", val: mode.kpg });
            botStats.push({ name: "Most damage", val: mode.mostDamage.toString() });
            botStats.push({ name: "Avg Damage", val: mode.avgDamage.toString() });

            modes.push({
                teamMode: mode.teamMode,
                games: mode.games,
                name: TeamModeToString[mode.teamMode as TeamMode],
                midStats,
                botStats,
            });
        }

        // Insert blank cards for all team modes
        const teamModeKeys = Object.keys(TeamModeToString) as unknown as TeamMode[];
        for (let i = 0; i < teamModeKeys.length; i++) {
            const teamMode = teamModeKeys[i];
            if (!modes.find((x) => x.teamMode == teamMode)) {
                modes.push({
                    teamMode,
                    games: 0,
                    name: TeamModeToString[teamMode as TeamMode],
                    midStats: [],
                    botStats: [],
                });
            }
        }

        modes.sort((a, b) => a.teamMode - b.teamMode);
        return modes;
    };

    const getProfileData = () => {
        if (userStats.error || !userStats()) {
            return null;
        }

        const emoteDef = EmotesDefs[userStats()!.player_icon];
        const texture = emoteDef
            ? helpers.emoteImgToSvg(emoteDef.texture)
            : "/img/gui/player-gui.svg";

        let tmpSlug = userStats()!.slug.toLowerCase();
        tmpSlug = tmpSlug.replace(userStats()!.username.toLowerCase(), "");

        const slugToShow =
            tmpSlug != "" ? `${userStats()!.username}#${tmpSlug}` : userStats()!.username;

        return {
            username: userStats()!.username,
            slugToShow,
            banned: userStats()!.banned,
            avatarTexture: texture,
            wins: userStats()!.wins,
            kills: userStats()!.kills,
            games: userStats()!.games,
            kpg: userStats()!.kpg,
        };
    };

    const profile = createMemo(() => getProfileData());
    const teamModes = createMemo(() => getTeamModes());

    return (
        <>
            <div class="container mt-3">
                <div class="card card-player col-lg-8 col-12 p-0">
                    <div class="card-body">
                        <div class="row card-row-top">
                            <Show
                                when={userStats.error}
                                fallback={
                                    <Show when={!profile()?.username}>
                                        <div class="col-lg-10">
                                            <div class="card-player-name mt-3 ml-3">
                                                That player doesn't exist.
                                            </div>
                                        </div>
                                    </Show>
                                }
                            >
                                <div class="col-lg-10">
                                    <div class="card-player-name mt-3 ml-3">
                                        Error loading content, please try again.
                                    </div>
                                </div>
                            </Show>
                            <Show when={profile()?.username}>
                                <>
                                    <div class="col-md-1 col-sm-2 col-3">
                                        <div
                                            class="player-image"
                                            style={`background-image: url("${profile()!.avatarTexture}")`}
                                        />
                                    </div>
                                    <div class="col-md-5 col-sm-10 col-9">
                                        <div
                                            class={`card-player-name ml-md-5 ml-sm-1 ml-xs-1 ${!profile()!.banned ? "mt-3" : ""}`}
                                        >
                                            {profile()!.username}
                                        </div>
                                        <Show when={profile()!.banned}>
                                            <div
                                                class="card-player-banned ml-md-5"
                                                data-l10n="stats-banned"
                                            >
                                                (Account banned)
                                            </div>
                                        </Show>
                                    </div>
                                    <div class="col-md-6 col-12">
                                        <table class="player-stats-overview">
                                            <thead>
                                                <tr>
                                                    <th
                                                        scope="col"
                                                        data-l10n="stats-wins"
                                                    >
                                                        Wins
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        data-l10n="stats-kills"
                                                    >
                                                        Kills
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        data-l10n="stats-games"
                                                    >
                                                        Games
                                                    </th>
                                                    <th scope="col" data-l10n="stats-kg">
                                                        K/G
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>{profile()!.wins}</td>
                                                    <td>{profile()!.kills}</td>
                                                    <td>{profile()!.games}</td>
                                                    <td>{profile()!.kpg}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            </Show>
                        </div>
                    </div>
                </div>
            </div>

            <Show when={teamModes().length > 0}>
                <div class="container mt-3">
                    <div class="row">
                        <div class="col-lg-2 col-6">
                            <select
                                value={selectedInterval()}
                                id="player-time"
                                class="player-opt custom-select"
                                onChange={(e) => onIntervalChange(e.currentTarget.value)}
                            >
                                <option value="daily" data-l10n="stats-today">
                                    Today
                                </option>
                                <option value="weekly" data-l10n="stats-this-week">
                                    This week
                                </option>
                                <option value="alltime" data-l10n="stats-all-time">
                                    All time
                                </option>
                            </select>
                        </div>
                        <div class="col-lg-2 col-6 pl-0">
                            <select
                                value={selectedMapId()}
                                id="player-map-id"
                                class="player-opt custom-select"
                                onChange={(e) => onMapIdChange(e.currentTarget.value)}
                            >
                                <option value="-1" data-l10n="all">
                                    All modes
                                </option>
                                {GAME_MODES.map((mode) => (
                                    <option value={mode.mapId.toString()}>
                                        {mode.desc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div class="offset-6 col-2 col-rating-help">
                            <div class="rating-help">
                                What is Rating?
                                <div class="rating-help-desc">
                                    <span class="highlight">
                                        This feature coming soon!
                                    </span>
                                    <br />
                                    Rating will be based on placement and kills within an
                                    individual game mode.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Show>

            <div class="container mt-3">
                <div class="row">
                    {teamModes().map((mode, index) => (
                        <div
                            class={`col-lg-4 col-12 ${index === teamModes().length - 1 ? "" : "pr-lg-0"}`}
                        >
                            <div class={`card card-mode card-mode-bg-${index}`}>
                                <div class="card-body p-1">
                                    <div
                                        class="card-mode-row-top"
                                        style={{
                                            display: "flex",
                                            "align-items": "center",
                                            gap: "0.5rem",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "36px",
                                                padding: 0,
                                                "flex-shrink": 0,
                                                width: "16.666%",
                                            }}
                                        >
                                            <img
                                                src={`/img/ui/${mode.name === "solo" ? "player" : `${mode.name}-player`}.svg`}
                                                class="mode-image"
                                            />
                                        </div>
                                        <div
                                            style={{
                                                padding: 0,
                                                flex: 1,
                                            }}
                                        >
                                            <div
                                                class={`mode-name mode-name-${mode.name}`}
                                                data-l10n={`stats-${mode.name}`}
                                                data-caps="true"
                                            >
                                                {mode.name.toUpperCase()}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                "flex-shrink": 0,
                                            }}
                                        >
                                            <Show when={mode.games > 0}>
                                                <div class="mode-games">
                                                    <span>{mode.games}</span>{" "}
                                                    <span
                                                        data-l10n="stats-games"
                                                        data-caps="true"
                                                    >
                                                        Games
                                                    </span>
                                                </div>
                                            </Show>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Show when={mode.games === 0}>
                                <div class="card card-mode card-mode-no-games">
                                    <div class="col-12">No games played.</div>
                                </div>
                            </Show>
                            <Show when={mode.games > 0}>
                                <>
                                    <div class="card card-mode card-mode-bg-mid">
                                        <div class="card-body p-1">
                                            <div class="row m-1">
                                                {mode.midStats.map((stat) => (
                                                    <div class="col-6 mt-1 mb-1">
                                                        <div class="card-mode-stat-mid">
                                                            <div
                                                                class="card-mode-stat-name"
                                                                data-l10n={`stats-${stat.name}`}
                                                                data-caps="true"
                                                            >
                                                                {stat.name.toUpperCase()}
                                                            </div>
                                                            <div
                                                                class="card-mode-stat-value"
                                                                data-l10n={`stats-${stat.val}`}
                                                                data-caps="true"
                                                            >
                                                                {stat.val}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card card-mode card-mode-bg-bot">
                                        <div class="card-body p-1">
                                            <div class="row m-1">
                                                {mode.botStats.map((stat) => (
                                                    <div class="col-6 mt-1 mb-1">
                                                        <div class="card-mode-stat-bot">
                                                            <div
                                                                class="card-mode-stat-name"
                                                                data-l10n={`stats-${stat.name}`}
                                                                data-caps="true"
                                                            >
                                                                {stat.name.toUpperCase()}
                                                            </div>
                                                            <div class="card-mode-stat-value">
                                                                {stat.val}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            </Show>
                        </div>
                    ))}
                </div>
            </div>

            <Show when={profile()?.username}>
                <div class="container mt-3">
                    <div class="row m-0">
                        <div class="offset-0 offset-md-8 col-3 col-md-1 p-0">
                            <div
                                // @ts-expect-error uhhh fix me later
                                class={`extra-team-mode-filter ${props.teamModeFilter() === 7 ? "extra-team-mode-filter-selected" : ""} btn-darken`}
                                onClick={() => props.onTeamModeFilterChange(7)}
                            >
                                All
                            </div>
                        </div>
                        <div class="col-3 col-md-1 p-0">
                            <div
                                class={`extra-team-mode-filter ${props.teamModeFilter() === 1 ? "extra-team-mode-filter-selected" : ""} btn-darken`}
                                onClick={() => props.onTeamModeFilterChange(1)}
                            >
                                Solo
                            </div>
                        </div>
                        <div class="col-3 col-md-1 p-0">
                            <div
                                class={`extra-team-mode-filter ${props.teamModeFilter() === 2 ? "extra-team-mode-filter-selected" : ""} btn-darken`}
                                onClick={() => props.onTeamModeFilterChange(2)}
                            >
                                Duo
                            </div>
                        </div>
                        <div class="col-3 col-md-1 p-0">
                            <div
                                class={`extra-team-mode-filter ${props.teamModeFilter() === 4 ? "extra-team-mode-filter-selected" : ""} btn-darken`}
                                onClick={() => props.onTeamModeFilterChange(4)}
                            >
                                Squad
                            </div>
                        </div>
                    </div>
                </div>
            </Show>
        </>
    );
};
