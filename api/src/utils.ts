import type { Context } from "hono";
import { isIP } from "net";
import ProxyCheck, { type IPAddressInfo } from "proxycheck-ts";
import z from "zod";
import { TeamMode } from "../../shared/gameConfig";
import { sendWebhook } from "../../shared/utils/webhook";
import { server } from "./apiServer";
import { Config } from "./config";

export function getHonoIp(c: Context, proxyHeader?: string): string | undefined {
    const ip = proxyHeader
        ? c.req.header(proxyHeader)
        : c.env?.incoming?.socket?.remoteAddress;

    if (!ip || isIP(ip) == 0) return undefined;
    if (ip.includes("::ffff:")) return ip.split("::ffff:")[1];
    return ip;
}

const proxyCheck = Config.secrets.PROXYCHECK_KEY
    ? new ProxyCheck({
          api_key: Config.secrets.PROXYCHECK_KEY,
      })
    : undefined;

const proxyCheckCache = new Map<
    string,
    {
        info: IPAddressInfo;
        expiresAt: number;
    }
>();

export async function isBehindProxy(ip: string, vpn: 0 | 1 | 2 | 3): Promise<boolean> {
    if (!proxyCheck) return false;

    let info: IPAddressInfo | undefined = undefined;
    const cached = proxyCheckCache.get(ip);
    if (cached && cached.expiresAt > Date.now()) {
        info = cached.info;
    }
    if (!info) {
        try {
            const proxyRes = await proxyCheck.checkIP(ip, {
                vpn,
            });
            switch (proxyRes.status) {
                case "ok":
                case "warning":
                    info = proxyRes[ip];
                    if (proxyRes.status === "warning") {
                        server.logger.warn(`ProxyCheck warning, res:`, proxyRes);
                    }
                    break;
                case "denied":
                case "error":
                    server.logger.error(`Failed to check for ip ${ip}:`, proxyRes);
                    break;
            }
        } catch (error) {
            server.logger.error(`Proxycheck error:`, error);
            return true;
        }
    }
    if (!info) {
        return false;
    }
    proxyCheckCache.set(ip, {
        info,
        expiresAt: Date.now() + 60 * 60 * 24, // a day
    });

    return info.proxy === "yes" || info.vpn === "yes";
}

export async function verifyTurnsStile(token: string, ip: string): Promise<boolean> {
    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const result = await fetch(url, {
        body: JSON.stringify({
            secret: Config.secrets.TURNSTILE_SECRET_KEY,
            response: token,
            remoteip: ip,
        }),
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    const outcome = await result.json();

    if (!outcome.success) {
        return false;
    }
    return true;
}

export async function logErrorToWebhook(from: "server" | "client", ...messages: any[]) {
    await sendWebhook({
        messages,
        from,
        url:
            from === "server"
                ? Config.errorLoggingWebhook
                : Config.clientErrorLoggingWebhook,
        region: Config.gameServer.thisRegion,
    });
}

export const zUpdateRegionBody = z.object({
    regionId: z.string(),
    data: z.object({
        playerCount: z.number(),
    }),
});
export type UpdateRegionBody = z.infer<typeof zUpdateRegionBody>;

export const zSetGameModeBody = z.object({
    index: z.number(),
    team_mode: z.nativeEnum(TeamMode).optional(),
    map_name: z.string().optional(),
    enabled: z.boolean().optional(),
});

export const zSetClientThemeBody = z.object({
    theme: z.string(),
});
