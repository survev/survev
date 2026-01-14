import type { Hono } from "hono";
import type { UpgradeWebSocket } from "hono/ws";
import z from "zod";
import { type SiteInfoRes, twitchSchema } from "../../../shared/types/api";
import { util } from "../../../shared/utils/util";
import { Config } from "../config";
import { TeamMenu } from "../teamMenu";
import { GIT_VERSION } from "../utils/gitRevision";
import { defaultLogger, ServerLogger } from "../utils/logger";
import type { FindGamePrivateBody, FindGamePrivateRes } from "../utils/types";

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
        const featuredYt = util.randomItem(Config.featured.youtubers);
        const data: SiteInfoRes = {
            modes: this.modes,
            pops: {},
            youtube: featuredYt,
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
            this.twitchCache = await this.fetchTwitchData();
        };
        refresh();
        setInterval(refresh, 300000);
    }

    private async fetchTwitchData() {
        if (!Config.secrets.TWITCH_CLIENT_ID || !Config.secrets.TWITCH_OAUTH) {
            return [];
        }
        const streamers = Config.featured.streamers.slice(0, 3);

        const params = new URLSearchParams();
        streamers.forEach((name) => params.append("user_login", name));
        try {
            const res = await fetch(
                `https://api.twitch.tv/helix/streams?user_login=${params.toString()}`,
                {
                    headers: {
                        "Client-ID": Config.secrets.TWITCH_CLIENT_ID,
                        Authorization: `Bearer ${Config.secrets.TWITCH_OAUTH}`,
                    },
                },
            );
            const { data: stream } = await res.json();
            if (!stream.length) return [];

            const { data, success } = z.array(twitchSchema).safeParse(stream);

            if (!success) {
                defaultLogger.error("Failed to parse twitch data", stream);
                return [];
            }

            return data;
        } catch (err) {
            defaultLogger.error("Twitch fetch failed", err);
            return [];
        }
    }
}

export const server = new ApiServer();
