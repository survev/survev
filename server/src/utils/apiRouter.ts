import { hc } from "hono/client";
import type { PrivateRouteApp } from "../api/routes/private/private.ts";
import { Config } from "../config.ts";
import { fetchWithRetry } from "./fetchWithRetry.ts";
import { defaultLogger } from "./logger.ts";

export const apiPrivateRouter = hc<PrivateRouteApp>(
    `${Config.gameServer.apiServerUrl}/private`,
    {
        fetch: fetchWithRetry,
        headers: {
            "survev-api-key": Config.secrets.SURVEV_API_KEY,
        },
    },
);

export async function checkIp(ip: string) {
    try {
        const apiRes = await apiPrivateRouter.check_ip.$post({
            json: {
                ip,
            },
        });

        if (apiRes.ok) {
            const body = await apiRes.json();
            return body;
        }
    } catch (err) {
        defaultLogger.error(`Failed request API fetch_ip: `, err);
    }

    return undefined;
}
