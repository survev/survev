import $ from "jquery";
import { type MapDefKey, MapDefs } from "../../shared/defs/mapDefs.ts";
import { GameConfig } from "../../shared/gameConfig.ts";
import type { SiteInfoRes } from "../../shared/types/api.ts";
import { api } from "./api.ts";
import type { ConfigManager } from "./config.ts";
import { device } from "./device.ts";
import type { Localization } from "./ui/localization.ts";
import { StartMenu } from "./ui/menu.ts";

export class SiteInfo {
    info = {} as SiteInfoRes;
    loaded = false;
    startMenu = document.querySelector<StartMenu>("start-menu")!;

    constructor(
        public config: ConfigManager,
        public localization: Localization,
    ) {
    }

    load() {
        const locale = this.localization.getLocale();
        const teamSelector = $("#team-server-opts");

        const regions: { id: string; label: string; }[] = []

        for (const region in GAME_REGIONS) {
            const data = GAME_REGIONS[region];
            const name = this.localization.translate(data.l10n);
            const elm = `<option value='${region}' data-l10n='${data.l10n}' data-label='${name}'>${name}</option>`;
            teamSelector.append(elm);
            regions.push({
                id: region,
                label: this.localization.translate(data.l10n)
            });
        }

        this.startMenu.regions = regions;
        this.startMenu.selectedRegion = regions[0].id ?? "";

        const siteInfoUrl = api.resolveUrl(`/api/site_info?language=${locale}`);
        fetch(siteInfoUrl).then(res => res.json()).then((data: SiteInfoRes) => {
            this.info = data || {};
            this.loaded = true;
            this.updatePageFromInfo();
        });
    }

    getGameModeStyles() {
        const availableModes = [];
        const modes = this.info.modes || [];
        for (let i = 0; i < modes.length; i++) {
            const mode = modes[i];
            const mapDef = (MapDefs[mode.mapName as MapDefKey] || MapDefs.main)
                .desc;
            const buttonText = mapDef.buttonText
                ? mapDef.buttonText
                : GameConfig.TeamModeToString[mode.teamMode];
            availableModes.push({
                icon: mapDef.icon,
                buttonCss: mapDef.buttonCss,
                buttonText,
                enabled: mode.enabled,
            });
        }
        return availableModes;
    }

    updatePageFromInfo() {
        if (this.loaded) {
            this.startMenu.gameModes = this.getGameModeStyles();

            this.startMenu.supportsTeam = this.info.modes.some((s) => s.enabled && s.teamMode > 1);

            // Region pops
            const pops = this.info.pops ?? {};

            this.startMenu.regions = this.startMenu.regions.map(region => ({
                ...region,
                playerCount: pops[region.id]?.playerCount,
            }));

            let hasTwitchStreamers = false;
            const featuredStreamersElem = $("#featured-streamers");
            const streamerList = $(".streamer-list");
            if (!device.mobile && this.info.twitch) {
                streamerList.empty();
                for (let i = 0; i < this.info.twitch.length; i++) {
                    const streamer = this.info.twitch[i];
                    const template = $("#featured-streamer-template").clone();
                    template
                        .attr("class", "featured-streamer streamer-tooltip")
                        .attr("id", "");
                    const link = template.find("a");
                    const text = this.localization.translate(
                        streamer.viewers == 1 ? "index-viewer" : "index-viewers",
                    );
                    link.html(
                        `${streamer.name} <span>${streamer.viewers} ${text}</span>`,
                    );
                    link.css("background-image", `url(${streamer.img})`);
                    link.attr("href", streamer.url);
                    streamerList.append(template);
                    hasTwitchStreamers = true;
                }
            }
            featuredStreamersElem.css(
                "visibility",
                hasTwitchStreamers ? "visible" : "hidden",
            );

            const featuredYoutuberElem = $("#featured-youtuber");
            const displayYoutuber = this.info.youtube;
            if (displayYoutuber) {
                $(".btn-youtuber")
                    .attr("href", this.info.youtube.link)
                    .html(this.info.youtube.name);
            }
            featuredYoutuberElem.css("display", displayYoutuber ? "block" : "none");

            const mapDef = MapDefs[this.info.clientTheme];
            if (mapDef) {
                this.config.set("cachedBgImg", mapDef.desc.backgroundImg);
                const bg = document.getElementById("background");
                if (bg) {
                    bg.style.backgroundImage = `url(${mapDef.desc.backgroundImg})`;
                }
            }
        }
    }
}
