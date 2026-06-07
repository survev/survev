import type { Hono } from "hono";
import type { UpgradeWebSocket } from "hono/ws";
import type { SiteInfoRes } from "../../../shared/types/api";
import { Config } from "../config";
import { PrivateLobbyMenu } from "../privateLobby";
import { TeamMenu } from "../teamMenu";
import { GIT_VERSION } from "../utils/gitRevision";
import { defaultLogger, ServerLogger } from "../utils/logger";
import type {
    FindGamePrivateBody,
    FindGamePrivateRes,
    FindPrivateLobbyGameBody,
} from "../utils/types";

class Region {
    data: (typeof Config)["regions"][string];
    playerCount = 0;
    verifiedOnly = false;

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

    async createPrivateGame(body: FindPrivateLobbyGameBody): Promise<FindGamePrivateRes> {
        const data = await this.fetch<FindGamePrivateRes>("api/find_private_game", body);
        if (!data) {
            return { error: "find_game_failed" };
        }
        return data;
    }

    // in class Region
    async collectGameInfos(): Promise<any> {
    const data = await this.fetch<any>("api/game_infos", { region: this.id });
    return data ?? { error: "game_infos_failed" };
    }

    async findSpectatorGame(body: any): Promise<any> {
    const data = await this.fetch<any>("api/find_spectator_game", body);
    return data ?? { error: "find_spectator_game_failed" };
    }

    /** Fetches live player list for a game from the game server (for the moderation dashboard). */
    async getDashboardGamePlayers(gameId: string): Promise<any[]> {
        const data = await this.fetch<{ players: any[] }>("api/dashboard/game_players", { gameId });
        return data?.players ?? [];
    }

    /** Sends an admin command to a running game on this region's game server. */
    async sendDashboardGameCmd(gameId: string, cmd: object): Promise<boolean> {
        const data = await this.fetch<{ ok: boolean }>("api/dashboard/game_cmd", { gameId, cmd });
        return data?.ok ?? false;
    }

    /** Sets verified-only mode on all games (running + future) on this region's game server. */
    async setServerVerified(state: boolean): Promise<void> {
        this.verifiedOnly = state;
        await this.fetch("api/dashboard/set_server_verified", { state });
    }

    async findGameById(gameId: string, admin: boolean,): Promise<any> {
    const data = await this.fetch<any>("api/find_game_by_id", { region: this.id, gameId, admin });
    return data ?? { error: "find_game_by_id_failed" };
    }

    async getModes(): Promise<any[]> {
    const data = await this.fetch<{ data: any[] }>("api/get_modes", { region: this.id });
    return data?.data ?? [];
}

}

interface RegionData {
    playerCount: number;
}

export class ApiServer {
    readonly logger = new ServerLogger("Server");

    teamMenu = new TeamMenu(this);
    privateLobbyMenu = new PrivateLobbyMenu(this);

    regions: Record<string, Region> = {};

    modes = [...Config.modes];
    modesByRegion: Record<string, any[]> = {};
    clientTheme = Config.clientTheme;

    captchaEnabled = Config.captchaEnabled;

    constructor() {
        for (const region in Config.regions) {
            this.regions[region] = new Region(region);
        }
        this.refreshRegionModes();
    }

    init(app: Hono, upgradeWebSocket: UpgradeWebSocket) {
        this.teamMenu.init(app, upgradeWebSocket);
        this.privateLobbyMenu.init(app, upgradeWebSocket);
    }

    getSiteInfo(region?: string): SiteInfoRes {
        const selectedRegion = region && this.modesByRegion[region]?.length
        ? region
        : Object.keys(this.modesByRegion)[0];
        const data: SiteInfoRes = {
            modes: this.modesByRegion[selectedRegion] ?? [],
            modesByRegion: this.modesByRegion,
            pops: {},
            youtube: { name: "", link: "" },
            twitch: [],
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

    async createPrivateGame(body: FindPrivateLobbyGameBody): Promise<FindGamePrivateRes> {
        if (body.region in this.regions) {
            return await this.regions[body.region].createPrivateGame(body);
        }
        return { error: "find_game_failed" };
    }

    async collectGameInfos(region: string) {
    const r = this.regions[region];
    if (!r) return { error: "Invalid Region" };
        return await r.collectGameInfos();
    }

    async findSpectatorGame(body: any) {
    const r = this.regions[body.region];
    if (!r) return { error: "Invalid Region" };
        return await r.findSpectatorGame(body);
    }

    async findGameById(region: string, gameId: string, admin: boolean) {
    const r = this.regions[region];
    if (!r) return { error: "Invalid Region" };
        return await r.findGameById(gameId, admin);
    }

    /** Returns live players for a game from the game server of the given region. */
    async getDashboardGamePlayers(region: string, gameId: string): Promise<any[]> {
        return (await this.regions[region]?.getDashboardGamePlayers(gameId)) ?? [];
    }

    /** Sends an admin command to a running game in the given region. */
    async sendDashboardGameCmd(region: string, gameId: string, cmd: object): Promise<boolean> {
        return (await this.regions[region]?.sendDashboardGameCmd(gameId, cmd)) ?? false;
    }

    /** Sets verified-only mode on all games (running + future) in the given region. */
    async setServerVerified(region: string, state: boolean): Promise<void> {
        await this.regions[region]?.setServerVerified(state);
    }

    async refreshRegionModes() {
        console.log("Refreshing region modes...");
        for (const region in this.regions) {
            console.log(`Refreshing modes for region ${region}...`);
            this.modesByRegion[region] = [];
            try {
                this.modesByRegion[region] = await this.regions[region].getModes();
            } catch (err) {
                this.logger.warn("refreshRegionModes failed for region", region, err);
            }
        }
    }

}

export const server = new ApiServer();
