import { z } from "zod";
import type { MapDefKey } from "../defs/mapDefs.ts";
import type { TeamMode } from "../gameConfig.ts";

export const zFindGameBody = z.object({
    region: z.string(),
    zones: z.array(z.string()),
    version: z.number(),
    playerCount: z.number(),
    autoFill: z.boolean(),
    gameModeIdx: z.number(),
    turnstileToken: z.string().optional(),
});

export type FindGameBody = z.infer<typeof zFindGameBody>;

export interface FindGameMatchData {
    urls: string[];
    data: string;
}

export const loadoutSchema = z.object({
    outfit: z.string(),
    melee: z.string(),
    heal: z.string(),
    boost: z.string(),
    player_icon: z.string(),
    crosshair: z.object({
        type: z.string(),
        color: z.number(),
        size: z.string(),
        stroke: z.string(),
    }),
    emotes: z.array(z.string()).length(6),
});

export type FindGameError =
    | "banned"
    | "behind_proxy"
    | "find_game_failed"
    | "full"
    | "invalid_captcha"
    | "invalid_ip"
    | "invalid_protocol"
    | "invalid_region"
    | "join_game_failed"
    | "mode_disabled"
    | "rate_limited";

export type FindGamePrivateError =
    | "find_game_failed"
    | "full"
    | "invalid_protocol"
    | "invalid_region";

export type GameWsDisconnectReason =
    | "behind_proxy"
    | "full"
    | "host_closed"
    | "invalid_packet"
    | "invalid_protocol"
    | "ip_banned"
    | "rate_limited"
    | "server_crashed"
    | "server_restart";

export type FindGameResponse =
    | {
        type: "success";
        res: FindGameMatchData;
    }
    | {
        type: "error";
        error: FindGameError;
    }
    | {
        type: "banned";
        reason: string;
        permanent: boolean;
        expiresIn: Date | string;
    };

export interface SiteInfoRes {
    country: string;
    gitRevision: string;
    captchaEnabled: boolean;
    modes: Array<{
        mapName: string;
        teamMode: TeamMode;
        enabled: boolean;
    }>;
    clientTheme: MapDefKey;
    pops: Record<
        string,
        {
            playerCount: number;
            l10n: string;
        }
    >;
    youtube: {
        name: string;
        link: string;
    };
    twitch: Array<{
        name: string;
        viewers: number;
        url: string;
        img: string;
    }>;
}

export interface ProxyDef {
    apiUrl?: string;
    google?: boolean;
    discord?: boolean;
    mock?: boolean;
    all?: boolean;
}
