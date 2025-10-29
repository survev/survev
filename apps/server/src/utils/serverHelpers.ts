import type { HttpRequest, HttpResponse } from "uWebSockets.js";
import { checkForBadWords, validateUserName } from "@survev/shared/utils/profanity";
import { HTTPRateLimit } from "@survev/shared/utils/ratelimit";
import { sendWebhook } from "@survev/shared/utils/webhook";
import { hc } from "hono/client";
import { isIP } from "net";
import type { PrivateRouteApp } from "../../../api/src/routes/private/private";
import { Config } from "../config";
import { defaultLogger } from "./logger";

// !! TODO: we reexport these as we refactor; to cleaned up later;
export { validateUserName, checkForBadWords };
export { HTTPRateLimit };
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

/**
 * Apply CORS headers to a response.
 * @param res The response sent by the server.
 */
export function cors(res: HttpResponse): void {
    if (res.aborted) return;
    res.writeHeader("Access-Control-Allow-Origin", "*")
        .writeHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        .writeHeader(
            "Access-Control-Allow-Headers",
            "origin, content-type, accept, x-requested-with",
        )
        .writeHeader("Access-Control-Max-Age", "3600");
}

export function forbidden(res: HttpResponse): void {
    res.cork(() => {
        if (res.aborted) return;
        res.writeStatus("403 Forbidden").end("403 Forbidden");
    });
}

export function returnJson(res: HttpResponse, data: Record<string, unknown>): void {
    if (res.aborted) return;
    res.cork(() => {
        if (res.aborted) return;
        res.writeHeader("Content-Type", "application/json").end(JSON.stringify(data));
    });
}

/**
 * Read the body of a POST request.
 * @link https://github.com/uNetworking/uWebSockets.js/blob/master/examples/JsonPost.js
 * @param res The response from the client.
 * @param cb A callback containing the request body.
 * @param err A callback invoked whenever the request cannot be retrieved.
 */
export function readPostedJSON<T>(
    res: HttpResponse,
    cb: (json: T) => void,
    err: () => void,
): void {
    let buffer: Buffer | Uint8Array;
    /* Register data cb */
    res.onData((ab, isLast) => {
        const chunk = Buffer.from(ab);
        if (isLast) {
            let json: T;
            if (buffer) {
                try {
                    // @ts-expect-error JSON.parse can accept a Buffer as an argument
                    json = JSON.parse(Buffer.concat([buffer, chunk]));
                } catch (_e) {
                    /* res.close calls onAborted */
                    res.close();
                    return;
                }
                cb(json);
            } else {
                try {
                    // @ts-expect-error JSON.parse can accept a Buffer as an argument
                    json = JSON.parse(chunk);
                } catch (_e) {
                    /* res.close calls onAborted */
                    res.close();
                    return;
                }
                cb(json);
            }
        } else {
            if (buffer) {
                buffer = Buffer.concat([buffer, chunk]);
            } else {
                buffer = Buffer.concat([chunk]);
            }
        }
    });

    /* Register error cb */
    res.onAborted(err);
}

const textDecoder = new TextDecoder();

/**
 * Get an IP from an uWebsockets HTTP response
 */
export function getIp(res: HttpResponse, req: HttpRequest, proxyHeader?: string) {
    const ip = proxyHeader
        ? req.getHeader(proxyHeader.toLowerCase())
        : textDecoder.decode(res.getRemoteAddressAsText());

    if (!ip || isIP(ip) == 0) return undefined;
    return ip;
}

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
