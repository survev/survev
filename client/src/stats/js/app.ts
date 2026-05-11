import $ from "jquery";
// TODO(performance): only load needed bootstrap components
import "bootstrap";
import slugify from "slugify";
import { ConfigManager } from "../../config.ts";
import { device } from "../../device.ts";
import { SDK } from "../../sdk/sdk.ts";
import { MainView } from "./mainView.ts";
import { PlayerView } from "./playerView.ts";
import language from "./templates/langauge.ejs";

import "bootstrap/dist/css/bootstrap.css";
import "../../../css/stats/app.css";
import { helpers } from "../../helpers.ts";
import { Localization } from "../../ui/localization.ts";
import EnJs from "../en.json";

const templates = {
    language,
};

type AcceptedLocales = "en" | "es";
type Routes = "player" | "main";

export class App {
    el = $("#content");
    mainView: MainView;
    playerView: PlayerView;
    config: ConfigManager;
    localization: Localization;
    view!: MainView | PlayerView;
    activeAdSlots: string[] = [];

    constructor() {
        this.mainView = new MainView(this);
        this.playerView = new PlayerView(this);

        $("#search-players").on("submit", (e) => {
            e.preventDefault();
            const name = $("#search-players :input").val() as string;
            const slug = slugify(name);
            window.location.href = `/stats/?slug=${slug}`;
        });

        // Load slug for "My Profile" link
        try {
            const config = JSON.parse(localStorage.getItem("survev_config")!);
            if (config.profile && config.profile.slug) {
                $("#my-profile")
                    .css("display", "block")
                    .attr("href", `/stats/?slug=${config.profile.slug}`);
            }
        } catch (_err) {}
        // Ignore
        // Load config
        this.config = new ConfigManager();
        this.config.load(() => {});

        this.localization = new Localization(
            "en",
            ["en", "es"],
            {
                en: EnJs as unknown as Record<string, string>,
            },
            true,
        );
        this.localization.setLocale(this.config.get("language") as AcceptedLocales);
        this.localization.localizeIndex();

        window.addEventListener("load", () => {
            SDK.ensureNitroReady()
                .catch(() => {})
                .finally(() => {
                    if (helpers.getParameterByName("slug")) {
                        this.setView("player");
                    } else {
                        this.setView("main");
                    }
                });
        });
    }

    updateAds(name: Routes) {
        const phoneDetected = device.mobile && !device.tablet;
        const elAdsLeaderboardTop = $("#adsLeaderBoardTop");
        const elAdsLeaderboardBottom = $("#adsLeaderBoardBottom");
        const elAdsPlayerTop = $("#adsPlayerTop");
        const elAdsPlayerBottom = $("#adsPlayerBottom");

        const nextAdSlots: string[] = [];
        if (name === "player") {
            elAdsLeaderboardTop.hide();
            elAdsLeaderboardBottom.hide();

            if (phoneDetected) {
                elAdsPlayerTop.hide();
                elAdsPlayerBottom.show();
            } else {
                elAdsPlayerTop.show();
                elAdsPlayerBottom.hide();
            }
        } else {
            elAdsPlayerTop.hide();
            elAdsPlayerBottom.hide();

            if (phoneDetected) {
                elAdsLeaderboardTop.hide();
                elAdsLeaderboardBottom.show();
            } else {
                elAdsLeaderboardTop.show();
                elAdsLeaderboardBottom.hide();
            }
        }

        if (elAdsLeaderboardTop.css("display") !== "none") {
            nextAdSlots.push(
                "survevio_728x90_leaderboard_top",
                "survevio_300x250_leaderboard_top",
            );
        }
        if (elAdsLeaderboardBottom.css("display") !== "none") {
            nextAdSlots.push("survevio_300x250_leaderboard_bottom");
        }
        if (elAdsPlayerTop.css("display") !== "none") {
            nextAdSlots.push(
                "survevio_728x90_playerprofile_top",
                "survevio_300x250_playerprofile_top",
            );
        }
        if (elAdsPlayerBottom.css("display") !== "none") {
            nextAdSlots.push("survevio_300x250_playerprofile_bottom");
        }

        SDK.hideNitroPlacementsById(this.activeAdSlots);
        SDK.showNitroPlacements(nextAdSlots);
        this.activeAdSlots = nextAdSlots;
    }

    setView(name?: Routes) {
        if (name == "player") {
            this.view = this.playerView;
        } else {
            this.view = this.mainView;
        }

        this.updateAds(name || "main");

        this.view.load();
        // @ts-expect-error go away
        this.el.html(this.view.el);
        this.render();
    }

    render() {
        $("#language-select").html(
            templates.language({
                code: this.localization.getLocale(),
            }),
        );
        // Listen for changes in language select
        $(".dropdown-language").off("click");
        $(".dropdown-language").on("click", (e) => {
            const el = e.target;
            const code = $(el).attr("value") as AcceptedLocales;
            if (code) {
                // Set the config language
                $("#selected-language").text(code.toUpperCase());
                this.localization.setLocale(code);
                this.localization.localizeIndex();
                this.config.set("language", code);
            }
        });
    }
}

export const app = new App();
