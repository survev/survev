import { hc } from "hono/client";
import type { PrivateRouteApp } from "../api/routes/private/private.ts";
import { Config } from "../config.ts";
import { fetchWithRetry } from "./fetchWithRetry.ts";

export const apiPrivateRouter = hc<PrivateRouteApp>(
    `${Config.gameServer.apiServerUrl}/private`,
    {
        fetch: fetchWithRetry,
        headers: {
            "survev-api-key": Config.secrets.SURVEV_API_KEY,
        },
    },
);
