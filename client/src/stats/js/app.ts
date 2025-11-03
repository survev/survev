import $ from "jquery";
// TODO(performance): only load needed bootstrap components
import "bootstrap";
import slugify from "slugify";
import { ConfigManager } from "../../config";
import { MainView } from "./mainView";
import { PlayerView } from "./playerView";
import language from "./templates/langauge.ejs";

import "bootstrap/dist/css/bootstrap.css";
import "../../../css/stats/app.css";
import { helpers } from "../../helpers";
import { Localization } from "../../ui/localization";
import EnJs from "../en.json";

const templates = {
    language,
};

type AcceptedLocales = "en" | "es";

type Routes = "player" | "main";

//
// Ads
//
class Ads {
    slotIdToPlacement = {
        survevio_728x90_leaderboard_top: "survevio_728x90_leaderboard",
        survevio_300x250_leaderboard_top: "survevio_300x250_leaderboard",
        survevio_300x250_leaderboard_bottom: "survevio_300x250_leaderboard",
        survevio_728x90_playerprofile_top: "survevio_728x90_playerprofile",
        survevio_300x250_playerprofile_top: "survevio_300x250_playerprofile",
        survevio_300x250_playerprofile_bottom: "survevio_300x250_playerprofile",
    };
    showFreestarAds(_slotIds: string) {}
    getFreestarSlotPlacement(_slotId: string) {}
}

export class App {
    el = $("#content");
    mainView: MainView;
    playerView: PlayerView;
    config: ConfigManager;
    localization: Localization;
    view!: MainView | PlayerView;
    adManager: Ads;

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

        this.adManager = new Ads();

        window.addEventListener("load", () => {
            if (helpers.getParameterByName("slug")) {
                this.setView("player");
            } else {
                this.setView("main");
            }
        });
    }
    setView(name?: Routes) {
        /*
        const phoneDetected = device.mobile && !device.tablet;
        const elAdsLeaderboardTop = $("#adsLeaderBoardTop");
        const elAdsLeaderboardBottom = $("#adsLeaderBoardBottom");
        const elAdsPlayerTop = $("#adsPlayerTop");
        const elAdsPlayerBottom = $("#adsPlayerBottom");
        */

        if (name == "player") {
            /*
            elAdsLeaderboardTop.css("display", "none");
            elAdsLeaderboardBottom.css("display", "none");
            if (phoneDetected) {
                elAdsPlayerTop.css("display", "none");
                elAdsPlayerBottom.css("display", "block");
            } else {
                elAdsPlayerTop.css("display", "block");
                elAdsPlayerBottom.css("display", "none");
            }
            */
            this.view = this.playerView;
        } else {
            /*
            elAdsPlayerTop.css("display", "none");
            elAdsPlayerBottom.css("display", "none");

            if (phoneDetected) {
                elAdsLeaderboardTop.css("display", "none");
                elAdsLeaderboardBottom.css("display", "block");
            } else {
                elAdsLeaderboardTop.css("display", "block");
                elAdsLeaderboardBottom.css("display", "none");
            }
            */
            this.view = this.mainView;
        }

        /*
        // show ads
        const slotIds = [];
        if (elAdsLeaderboardTop && elAdsLeaderboardTop.css("display") != "none") {
            slotIds.push("survevio_728x90_leaderboard_top");
            slotIds.push("survevio_300x250_leaderboard_top");
        }
        if (elAdsLeaderboardBottom && elAdsLeaderboardBottom.css("display") != "none") {
            slotIds.push("survevio_300x250_leaderboard_bottom");
        }
        if (elAdsPlayerTop && elAdsPlayerTop.css("display") != "none") {
            slotIds.push("survevio_728x90_playerprofile_top");
            slotIds.push("survevio_300x250_playerprofile_top");
        }
        if (elAdsPlayerBottom && elAdsPlayerBottom.css("display") != "none") {
            slotIds.push("survevio_300x250_playerprofile_bottom");
        }
        this.adManager.showFreestarAds(slotIds);
        */

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
