import type { Hono } from "hono";
import type { UpgradeWebSocket } from "hono/ws";
import type { SiteInfoRes } from "../../../shared/types/api";
import { Config } from "../config";
import { TeamMenu } from "../teamMenu";
import { GIT_VERSION } from "../utils/gitRevision";
import { defaultLogger, ServerLogger } from "../utils/logger";
import type { FindGamePrivateBody, FindGamePrivateRes } from "../utils/types";
import fetch from "node-fetch";

class Region {
    data: (typeof Config)["regions"][string];
    playerCount = 0;

    lastUpdateTime = Date.now();

    constructor(readonly id: string) {
        this.data = Config.regions[this.id];
    }

    async fetch<Data extends object>(endPoint: string, body: object) {
        const url = `http${this.data.https ? "s" : ""}://${this.data.address}/${endPoint}`;

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "survev-api-key": Config.secrets.SURVEV_API_KEY,
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                return (await res.json()) as Data;
            }
        } catch (err) {
            defaultLogger.error(`Error fetching region ${this.id}`, err);
            return undefined;
        }
    }

    async findGame(body: FindGamePrivateBody): Promise<FindGamePrivateRes> {
        const data = await this.fetch<FindGamePrivateRes>("api/find_game", body);
        if (!data) {
            return { error: "find_game_failed" };
        }
        return data;
    }
}

interface RegionData {
    playerCount: number;
}

export class ApiServer {
    readonly logger = new ServerLogger("Server");

    teamMenu = new TeamMenu(this);

    regions: Record<string, Region> = {};

    modes = [...Config.modes];
    clientTheme = Config.clientTheme;

    captchaEnabled = Config.captchaEnabled;
    twitchCache: SiteInfoRes["twitch"] = [];
    youtubeCache: SiteInfoRes["youtube"] = [];

    constructor() {
        for (const region in Config.regions) {
            this.regions[region] = new Region(region);
        }
        this.startFeaturedRefresh();
    }

    init(app: Hono, upgradeWebSocket: UpgradeWebSocket) {
        this.teamMenu.init(app, upgradeWebSocket);
    }

    getSiteInfo(): SiteInfoRes {
        const data: SiteInfoRes = {
            modes: this.modes,
            pops: {},
            youtube: this.youtubeCache,
            twitch: this.twitchCache,
            country: "US",
            gitRevision: GIT_VERSION,
            captchaEnabled: this.captchaEnabled,
            clientTheme: this.clientTheme,
        };

        for (const region in this.regions) {
            data.pops[region] = {
                playerCount: this.regions[region].playerCount,
                l10n: Config.regions[region].l10n,
            };
        }
        return data;
    }

    updateRegion(regionId: string, regionData: RegionData) {
        const region = this.regions[regionId];
        if (!region) {
            this.logger.warn("updateRegion: Invalid region", regionId);
            return;
        }
        region.playerCount = regionData.playerCount;
        region.lastUpdateTime = Date.now();
    }

    async findGame(body: FindGamePrivateBody): Promise<FindGamePrivateRes> {
        if (body.region in this.regions) {
            return await this.regions[body.region].findGame(body);
        }
        return { error: "find_game_failed" };
    }

    private startFeaturedRefresh() {
        const refresh = async () => {
            this.youtubeCache = [...Config.featured.youtubers];
            const streamers: typeof this.twitchCache = [];
            for (const s of Config.featured.twitch) {
                const twitchData = await this.fetchTwitchData(s.name);
                if (twitchData) streamers.push(twitchData);
            }
            this.twitchCache = streamers;
        };
        refresh();
        setInterval(refresh, 300000);
    }

    private async fetchTwitchData(name: string) {
        try {
            const res = await fetch(
                `https://api.twitch.tv/helix/streams?user_login=${name}`,
                {
                    headers: {
                        "Client-ID": Config.secrets.TWITCH_CLIENT_ID ?? "",
                        Authorization: `Bearer ${Config.secrets.TWITCH_OAUTH ?? ""}`,
                    },
                }
            );
            const data = await res.json();
            const stream = data.data?.[0];
            if (!stream) return null;
            return {
                name,
                viewers: stream.viewer_count,
                url: `https://twitch.tv/${name}`,
                img: stream.thumbnail_url
                    .replace("{width}", "320")
                    .replace("{height}", "180"),
            };
        } catch (err) {
            defaultLogger.error("Twitch fetch failed", err);
            return null;
        }
    }
}

export const server = new ApiServer();
