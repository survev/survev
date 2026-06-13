import { hc } from "hono/client";
import type { PrivateRouteApp } from "../api/routes/private/private.ts";
import { Config } from "../config.ts";
import { defaultLogger } from "./logger.ts";

function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
        const tryFetch = (attempts: number) => {
            fetch(input, init)
                .then(resolve)
                .catch((err) => {
                    if (attempts < 3) {
                        defaultLogger.warn(`Failed to fetch ${input}, retrying`);
                        setTimeout(
                            () => {
                                tryFetch(++attempts);
                            },
                            (attempts + 1) * 1000,
                        );
                    } else {
                        reject(err);
                    }
                });
        };

        tryFetch(0);
    });
}

export const apiPrivateRouter = hc<PrivateRouteApp>(
    `${Config.gameServer.apiServerUrl}/private`,
    {
        fetch: fetchWithRetry,
        headers: {
            "survev-api-key": Config.secrets.SURVEV_API_KEY,
        },
    },
);
