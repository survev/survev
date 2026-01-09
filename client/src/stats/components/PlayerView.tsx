import type { Component } from "solid-js";
import { createSignal } from "solid-js";
import { ALL_TEAM_MODES } from "../../../../shared/types/stats";
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

            <div class="container mt-3">
                <div class="row">
                    <div class="col-12 col-md-2">
                        <div
                            id="selector-extra-matches"
                            class="extra-matches selector-extra col-2 col-md-12 p-0"
                        >
                            Matches<span class="selected-extra"></span>
                        </div>
                    </div>

                    <div id="match-history" class="col-12 col-md-10">
                        <MatchHistory
                            selectedSlug={selectedSlug}
                            teamModeFilter={teamModeFilter}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};
