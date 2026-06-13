import ProxyCheck, { type IPAddressInfo } from "proxycheck-ts";
import { util } from "../../../shared/utils/util.ts";
import { Config } from "../config.ts";
import { defaultLogger } from "./logger.ts";

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

    const key = `${ip}_${vpn}`;

    const cached = proxyCheckCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        info = cached.info;
    } else {
        try {
            const proxyRes = await proxyCheck.checkIP(ip, {
                vpn,
            });
            switch (proxyRes.status) {
                case "ok":
                case "warning":
                    info = proxyRes[ip];
                    if (proxyRes.status === "warning") {
                        defaultLogger.warn(`ProxyCheck warning, res:`, proxyRes);
                    }
                    break;
                case "denied":
                case "error":
                    defaultLogger.error(`Failed to check for ip ${ip}:`, proxyRes);
                    break;
            }
        } catch (error) {
            defaultLogger.error(`Proxycheck error:`, error);
        }

        if (!info) {
            return false;
        }

        proxyCheckCache.set(key, {
            info,
            expiresAt: Date.now() + util.daysToMs(1),
        });
    }

    return info.proxy === "yes" || info.vpn === "yes";
}
