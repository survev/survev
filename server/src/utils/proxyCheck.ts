import { assert, util } from "../../../shared/utils/util.ts";
import { Config } from "../config.ts";
import { fetchWithRetry } from "./fetchWithRetry.ts";
import { defaultLogger } from "./logger.ts";

type IpInfo = {
    network: {
        asn: string;
        range: string;
        hostname: string;
        provider: string;
        organisation: string;
        type: string;
    };
    location: {
        continent_name: string;
        continent_code: string;
        country_name: string;
        country_code: string;
        region_name: string;
        region_code: string;
        city_name: string;
        postal_code: string;
        latitude: number;
        longitude: number;
        timezone: string;
        currency: {
            name: string;
            code: string;
            symbol: string;
        };
    };
    device_estimate: {
        address: number;
        subnet: number;
    };
    detections: {
        proxy: boolean;
        vpn: boolean;
        compromised: boolean;
        scraper: boolean;
        tor: boolean;
        hosting: boolean;
        anonymous: boolean;
        risk: number;
        confidence: number;
        first_seen: string;
        last_seen: string;
    };
    detection_history: {
        delisted: boolean;
        delist_datetime: string;
    };
    attack_history: {
        vulnerability_probing: number;
    };
    operator: null;
    last_updated: string;
};

type ProxyCheckRes<IP extends string> =
    & {
        status: "ok" | "warning" | "denied" | "error";
        query_time: number;
    }
    & {
        [k in IP]: IpInfo;
    };

const proxyCheckCache = new Map<
    string,
    {
        info: IpInfo;
        expiresAt: number;
    }
>();

async function fetchProxyCheck<IP extends string>(ip: IP) {
    const url = new URL(`https://proxycheck.io/v3/${ip}`);
    url.searchParams.set("key", Config.secrets.PROXYCHECK_KEY!);
    const res = await fetchWithRetry(url);

    const data = await res.json();
    return data as ProxyCheckRes<IP>;
}

export async function isBehindProxy(ip: string, checkVpn: boolean): Promise<boolean> {
    if (!Config.secrets.PROXYCHECK_KEY) return false;

    let info: IpInfo | undefined = undefined;

    const key = `${ip}_${checkVpn}`;

    const cached = proxyCheckCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        info = cached.info;
    } else {
        try {
            const proxyRes = await fetchProxyCheck(ip);
            switch (proxyRes.status) {
                case "ok":
                case "warning":
                    info = proxyRes[ip];
                    if (proxyRes.status === "warning") {
                        defaultLogger.warn(`ProxyCheck warning, res:`, proxyRes);
                    }
                    assert(info.detections);
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

    if (checkVpn && info.detections.vpn) return true;

    return info.detections.proxy;
}
