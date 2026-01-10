import type { Component } from "solid-js";
import { createResource, createSignal, For, Show } from "solid-js";
import {
    ALL_TEAM_MODES,
    type WeaponStat,
    type WeaponStatsParams,
    type WeaponStatsResponse,
} from "../../../../shared/types/stats";
import { api } from "../../api";
import { Loading } from "./Loading";
import { MatchHistory } from "./MatchHistory";
import { PlayerStats } from "./PlayerStats";

export interface PlayerViewProps {
    phoneDetected: boolean;
}

export const PlayerView: Component<PlayerViewProps> = (props) => {
    const params = new URLSearchParams(window.location.search);
    const [selectedSlug] = createSignal(params.get("slug") || "");
    const [teamModeFilter, setTeamModeFilter] = createSignal(ALL_TEAM_MODES);

    return (
        <>
            <div id="leaderboard-bg" class="stats-bg"></div>

            <PlayerStats
                teamModeFilter={teamModeFilter}
                onTeamModeFilterChange={setTeamModeFilter}
                phoneDetected={props.phoneDetected}
            />

            <MatchData selectedSlug={selectedSlug} teamModeFilter={teamModeFilter} />
        </>
    );
};

function MatchData({
    selectedSlug,
    teamModeFilter,
}: {
    selectedSlug: () => string;
    teamModeFilter: () => number;
}) {
    const [selectedView, setSelectedView] = createSignal<"matches" | "weapons">(
        "matches",
    );
    return (
        <div class="container mt-3">
            <div class="row">
                <div class="col-12 col-md-2">
                    <div
                        class="selector-extra col-2 col-md-12 p-0"
                        style={{
                            "border-left": "8px solid rgba(0, 0, 0, 0.6)",
                        }}
                        onClick={() => {
                            setSelectedView("matches");
                        }}
                    >
                        Matches
                        <div
                            style={{
                                height: "33px",
                                "line-height": "normal",
                            }}
                        >
                            <img
                                src="/img/ui/history.svg"
                                draggable="false"
                                style={{
                                    "object-fit": "contain",
                                    height: "100%",
                                    width: "100%",
                                }}
                            />
                        </div>
                    </div>
                    <div
                        class="selector-extra col-2 col-md-12 p-0"
                        style={{
                            "border-left": "8px solid rgba(0, 0, 0, 0.6)",
                        }}
                        onClick={() => {
                            setSelectedView("weapons");
                        }}
                    >
                        Weapons
                        <div
                            style={{
                                height: "40px",
                                "line-height": "normal",
                            }}
                        >
                            <img
                                src="/img/loot/loot-weapon-flare-gun.svg"
                                draggable="false"
                                style={{
                                    "object-fit": "contain",
                                    height: "100%",
                                    width: "100%",
                                }}
                            />
                        </div>
                    </div>
                </div>

                <Show when={selectedView() === "matches"}>
                    <div class="col-12 col-md-10">
                        <MatchHistory
                            selectedSlug={selectedSlug}
                            teamModeFilter={teamModeFilter}
                        />
                    </div>
                </Show>
                <Show when={selectedView() === "weapons"}>
                    <WeaponStats selectedSlug={selectedSlug} />
                </Show>
            </div>
        </div>
    );
}

function WeaponStats({ selectedSlug }: { selectedSlug: () => string }) {
    const [isLoading, setIsLoading] = createSignal(false);

    const [weaponStatsResource] = createResource<WeaponStatsResponse | null, string>(
        "ak47",
        async (slug) => {
            try {
                setIsLoading(true);

                const args: WeaponStatsParams = {
                    slug: selectedSlug(),
                };
                const response = await fetch(api.resolveUrl("/api/weapon_stats"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                    body: JSON.stringify(args),
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch weapon stats");
                }
                const data: WeaponStatsResponse = await response.json();
                return data;
            } catch (err) {
                // we rethrow cuz createResource handles the error for us
                // but i need a try cactch for the finally
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
    );

    const typeToTextMap = {
        kills: "Kills",
        deaths: "Deaths",
        damageDealt: "Damage Dealt",
        damageTaken: "Damage Taken",
    } as const;
    return (
        <Show when={!isLoading()} fallback={<Loading type="match_history" />}>
            <div class="col-12 col-md-10">
                <div
                    class="header-extra"
                    style={{
                        padding: "2px 8px",
                        display: "flex",
                        "align-items": "center",
                        gap: "8px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            "align-items": "center",
                            "justify-content": "center",
                        }}
                    >
                        <img
                            src="/img/loot/loot-weapon-flare-gun.svg"
                            draggable="false"
                            style={{
                                height: "28px",
                                "line-height": "normal",
                                "object-fit": "contain",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            "line-height": "normal",
                        }}
                    >
                        WEAPON STATS
                    </div>
                </div>
                {weaponStatsResource?.error ? (
                    <div class="col-lg-10">
                        <div class="m-3">Error loading content, please try again.</div>
                    </div>
                ) : weaponStatsResource()?.length === 0 ? (
                    <div class="col-lg-10">
                        <div class="m-3">No recent games played.</div>
                    </div>
                ) : (
                    <For each={weaponStatsResource()}>
                        {(weaponStat) => (
                            <div class="col-lg-12">
                                <div
                                    class="row row-match"
                                    style={{
                                        display: "flex",
                                        "justify-content": "space-between",
                                        "border-left": `8px solid ${weaponStat.color}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            "flex-grow": "1",
                                            display: "flex",
                                            gap: "8px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "60px",
                                            }}
                                        >
                                            <img
                                                src={`${window.location.origin}/${weaponStat.img}`}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    "object-fit": "contain",
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <div
                                                style={{
                                                    color: "#c8c8c8",
                                                    "font-weight": "bold",
                                                }}
                                            >
                                                name
                                            </div>
                                            <div
                                                style={{
                                                    "font-size": "24px",
                                                    "text-shadow": "1px 1px 1px black",
                                                    "font-weight": "bold",
                                                }}
                                            >
                                                {weaponStat.name}
                                            </div>
                                        </div>
                                    </div>
                                    {(
                                        Object.keys(typeToTextMap) as Array<
                                            Exclude<
                                                keyof WeaponStat,
                                                "type" | "color" | "img" | "name"
                                            >
                                        >
                                    ).map((key) => {
                                        return (
                                            <div
                                                style={{
                                                    "flex-grow": "1",
                                                    display: "flex",
                                                    "flex-direction": "column",
                                                    "align-items": "center",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        "flex-grow": "1",
                                                        color: "#c8c8c8",
                                                        "font-weight": "bold",
                                                        "font-size": "12px",
                                                    }}
                                                >
                                                    {typeToTextMap[key]}
                                                </div>
                                                <div
                                                    style={{
                                                        "flex-grow": "1",
                                                        "font-size": "24px",
                                                        "font-weight": "bold",
                                                        display: "flex",
                                                        "align-items": "end",
                                                    }}
                                                >
                                                    {weaponStat[key]}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </For>
                )}
            </div>
        </Show>
    );
}
