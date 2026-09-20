import $ from "jquery";
import { getRankedTier } from "../../../../shared/defs/rankedDefs.ts";
import type { RankedStatsEntry } from "../../../../shared/types/rankedStats.ts";
import type { LeaderboardRequest } from "../../../../shared/types/stats.ts";
import { device } from "../../device.ts";
import { helpers } from "../../helpers.ts";
import type { App } from "./app.ts";
import { statsLink, statsUrl } from "./statsApi.ts";
import leaderboard from "./templates/leaderboard.ejs";
import leaderboardError from "./templates/leaderboardError.ejs";
import loading from "./templates/loading.ejs";
import main from "./templates/main.ejs";
import rankedLeaderboard from "./templates/rankedLeaderboard.ejs";

const templates = {
    loading,
    main,
    leaderboard,
    leaderboardError,
};

//
// MainView
//
export class MainView {
    rankedEntries: RankedStatsEntry[] = [];
    ranked = false;
    requestId = 0;
    loading = false;
    error = false;
    data = {} as Partial<
        LeaderboardRequest & {
            data: {
                username: string;
                usernames: string[];
                slug: string;
                slugs: string[];
            }[];
        }
    >;
    el = $(
        templates.main({
            phoneDetected: device.mobile && !device.tablet,
            gameModes: helpers.getGameModes(),
        }),
    );

    constructor(readonly app: App) {
        this.el.find(".leaderboard-opt").change(() => {
            this.onChangedParams();
        });
    }
    load() {
        this.loading = true;
        this.error = false;
        const requestId = ++this.requestId;
        const params = new URLSearchParams(location.search);
        this.ranked = params.get("mapId") === "ranked";
        this.el.find("#leaderboard-team-mode option[value=trio]").prop("disabled", !this.ranked).prop(
            "hidden",
            !this.ranked,
        );
        this.el.find("#leaderboard-type option").each((_, option) => {
            const rankedMetric = ["elo", "series_wins"].includes((option as HTMLOptionElement).value);
            $(option).prop("hidden", rankedMetric !== this.ranked).prop("disabled", rankedMetric !== this.ranked);
        });
        this.el.find("#leaderboard-time").prop("disabled", this.ranked);
        if (this.ranked) {
            const team = ["solo", "duo", "trio", "squad"].includes(params.get("team") ?? "")
                ? params.get("team")!
                : "solo";
            const size = { solo: 1, duo: 2, trio: 3, squad: 4 }[team]!;
            const metric = params.get("type") === "series_wins" ? "wins" : "elo";
            this.el.find("#leaderboard-team-mode").val(team);
            this.el.find("#leaderboard-map-id").val("ranked");
            this.el.find("#leaderboard-type").val(metric === "elo" ? "elo" : "series_wins");
            this.el.find("#leaderboard-time").val("alltime");
            $.ajax({
                url: `${statsUrl("/api/ranked_stats/leaderboard")}?size=${size}&metric=${metric}`,
                success: (data: { entries: RankedStatsEntry[] }) => {
                    if (requestId === this.requestId) this.rankedEntries = data.entries;
                },
                error: () => {
                    if (requestId === this.requestId) this.error = true;
                },
                complete: () => {
                    if (requestId === this.requestId) {
                        this.loading = false;
                        this.render();
                    }
                },
            });
            this.render();
            return;
        }

        // Supported args so far:
        //   type:     most_kills, most_damage_dealt, kills, wins, kpg
        //   interval: daily, weekly, alltime
        //   teamMode: solo, duo, squad
        //   maxCount: 10, 100
        let type = helpers.getParameterByName<LeaderboardRequest["type"]>("type")
            || "most_kills";
        if (!["most_kills", "most_damage_dealt", "kills", "wins", "kpg"].includes(type)) type = "most_kills";
        const interval = helpers.getParameterByName<LeaderboardRequest["interval"]>("t") || "daily";
        const selectedTeam = helpers.getParameterByName("team") || "solo";
        const teamMode = selectedTeam === "trio" ? "squad" : selectedTeam;
        const mapId = helpers.getParameterByName("mapId") || "0";
        // Change to most_damage_dealt if faction mode and most_kills selected
        if (type == "most_kills" && Number(mapId) == 3) {
            type = "most_damage_dealt";
        }

        const args: LeaderboardRequest = {
            type: type,
            interval: interval,
            teamMode: teamMode as unknown as number,
            mapId: mapId as unknown as number,
        };

        $.ajax({
            url: statsUrl("/api/leaderboard"),
            type: "POST",
            data: JSON.stringify(args),
            contentType: "application/json; charset=utf-8",
            success: (data) => {
                if (requestId !== this.requestId) return;
                this.data = {
                    type: type,
                    interval: interval,
                    teamMode: teamMode as unknown as number,
                    mapId: mapId as unknown as number,
                    data: data,
                };
            },
            error: () => {
                if (requestId !== this.requestId) return;
                this.error = true;
            },
            complete: () => {
                if (requestId !== this.requestId) return;
                this.loading = false;
                this.render();
            },
        });

        this.render();
    }
    onChangedParams() {
        const type = $("#leaderboard-type").val();
        const time = $("#leaderboard-time").val();
        const teamMode = $("#leaderboard-team-mode").val();
        const mapId = $("#leaderboard-map-id").val();
        window.history.pushState(
            "",
            "",
            statsLink({ type: String(type), team: String(teamMode), t: String(time), mapId: String(mapId) }),
        );
        this.load();
    }
    render() {
        // Compute derived values
        const TypeToString = {
            most_kills: "stats-most-kills",
            most_damage_dealt: "stats-most-damage",
            kills: "stats-total-kills",
            wins: "stats-total-wins",
            kpg: "stats-kpg",
        } satisfies Record<LeaderboardRequest["type"], string>;
        let content = "";
        if (this.loading) {
            content = templates.loading({
                type: "leaderboard",
            });
        } else if (this.error || (!this.ranked && !this.data.data)) {
            content = templates.leaderboardError({});
        } else if (this.ranked) {
            content = rankedLeaderboard({
                entries: this.rankedEntries,
                metric: this.el.find("#leaderboard-type").val() === "series_wins" ? "Series wins" : "Elo",
                getRankedTier,
                statsLink,
            });
        } else {
            const statName = TypeToString[this.data.type as keyof typeof TypeToString] || "";

            content = templates.leaderboard({
                ...this.data,
                statName: statName,
                statsLink,
            });

            // Set the select options
            $("#leaderboard-team-mode").val(this.data.teamMode!);
            $("#leaderboard-map-id").val(this.data.mapId!);
            $("#leaderboard-type").val(this.data.type!);
            $("#leaderboard-time").val(this.data.interval!);

            // Disable most kills option if 50v50 selected
            const factionMode = Number(this.data.mapId) == 3;
            if (factionMode) {
                $("#leaderboard-type option[value=\"most_kills\"]").attr(
                    "disabled",
                    "disabled",
                );
            } else {
                $("#leaderboard-type option[value=\"most_kills\"]").removeAttr("disabled");
            }
        }

        this.el.find(".content").html(content);
        this.app.localization.localizeIndex();
    }
}
