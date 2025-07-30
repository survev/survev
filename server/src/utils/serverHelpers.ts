import type { HttpRequest, HttpResponse } from "uWebSockets.js";
import type { Context } from "hono";
import { hc } from "hono/client";
import { isIP } from "net";
import {
    DataSet,
    englishDataset,
    englishRecommendedTransformers,
    pattern,
    RegExpMatcher,
} from "obscenity";
import ProxyCheck, { type IPAddressInfo } from "proxycheck-ts";
import { Constants } from "../../../shared/net/net";
import type { PrivateRouteApp } from "../api/routes/private/private";
import { Config } from "../config";
import { defaultLogger } from "./logger";

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

export function getHonoIp(c: Context, proxyHeader?: string): string | undefined {
    const ip = proxyHeader
        ? c.req.header(proxyHeader)
        : c.env?.incoming?.socket?.remoteAddress;

    if (!ip || isIP(ip) == 0) return undefined;
    if (ip.includes("::ffff:")) return ip.split("::ffff:")[1];
    return ip;
}

export function forbidden(res: HttpResponse): void {
    res.cork(() => {
        if (res.aborted) return;
        res.writeStatus("403 Forbidden").end("403 Forbidden");
    });
}

export function returnJson(res: HttpResponse, data: Record<string, unknown>): void {
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

const badWordsdataSet = new DataSet<{ originalWord: string }>()
    .addAll(englishDataset)
    .removePhrasesIf((phrase) => {
        // if you really think "shit" is a bad word worth censoring i cant take you seriously
        return phrase.metadata?.originalWord === "shit";
    })
    .addPhrase((phrase) =>
        // https://github.com/jo3-l/obscenity/blob/9564653e9f8563e178cd0790ccf256dc2b610494/src/preset/english.ts#L269 only matches it without the "a"??
        phrase
            .setMetadata({ originalWord: "faggot" })
            .addPattern(pattern`faggot`),
    )
    .addPhrase((phrase) =>
        phrase
            .setMetadata({ originalWord: "hitler" })
            .addPattern(pattern`hitler`)
            .addPattern(pattern`hitla`)
            .addPattern(pattern`hit.ler`)
            .addPattern(pattern`hitlr`),
    )
    .addPhrase((phrase) =>
        phrase
            .setMetadata({ originalWord: "kill yourself" })
            .addPattern(pattern`|kys|`)
            .addPattern(pattern`kill yourself`)
            .addPattern(pattern`hang yourself`)
            .addPattern(pattern`unalive yourself`),
    )
    .addPhrase((phrase) =>
        phrase
            .setMetadata({ originalWord: "nigger" })
            .addPattern(pattern`nlgger`)
            .addPattern(pattern`n1gga`)
            .addPattern(pattern`nigg`)
            .addPattern(pattern`nlgg`)
            .addPattern(pattern`nl99er`)
            .addPattern(pattern`nl99a`)
            .addPattern(pattern`niggr`)
            .addPattern(pattern`n1ggr`)
            .addPattern(pattern`n199r`)
            .addPattern(pattern`nl99r`)
            .addPattern(pattern`nlggr`)
            .addPattern(pattern`n199er`)
            .addPattern(pattern`ni55a`)
            .addPattern(pattern`ni55er`)
            .addPattern(pattern`chigger`)
            .addPattern(pattern`chigga`)
            .addPattern(pattern`n199a`),
    )
    .addPhrase((phrase) =>
        phrase.setMetadata({ originalWord: "dick" }).addPattern(pattern`dlck`),
    );

const matcher = new RegExpMatcher({
    ...badWordsdataSet.build(),
    ...englishRecommendedTransformers,
});

export function checkForBadWords(name: string) {
    return matcher.hasMatch(name);
}

const allowedCharsRegex =
    /[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g;

export function validateUserName(name: string): {
    originalWasInvalid: boolean;
    validName: string;
} {
    const defaultName = "Player";

    if (!name || typeof name !== "string")
        return {
            originalWasInvalid: true,
            validName: defaultName,
        };

    name = name
        .trim()
        .substring(0, Constants.PlayerNameMaxLen)
        // remove extended ascii etc
        .replace(allowedCharsRegex, "")
        .trim();

    if (!name.length || checkForBadWords(name))
        return {
            originalWasInvalid: true,
            validName: defaultName,
        };

    return {
        originalWasInvalid: false,
        validName: name,
    };
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

// modified version of https://github.com/uNetworking/uWebSockets.js/blob/master/examples/RateLimit.js
// also wraps simultaneous connections rate limit not just messages
export class WebSocketRateLimit {
    // for messages rate limit
    private _last = Symbol();
    private _count = Symbol();

    private _now = 0;
    private limit: number;

    // for simultaneous connections rate limit
    private _IPsData = new Map<
        string,
        {
            connections: number;
        }
    >();
    readonly maxConnections: number;

    constructor(limit: number, interval: number, maxConnections: number) {
        this.limit = limit;
        this.maxConnections = maxConnections;

        setInterval(() => ++this._now, interval);

        // clear ips every hour to not leak memory ig
        // probably not an issue but why not /shrug
        setInterval(
            () => {
                this._IPsData.clear();
            },
            1000 * 60 * 60,
        );
    }

    /**
     * Returns true if a websocket is being rate limited by sending too many messages
     */
    isRateLimited(wsData: Record<symbol, number>) {
        if (!Config.rateLimitsEnabled) return false;
        if (wsData[this._last] != this._now) {
            wsData[this._last] = this._now;
            wsData[this._count] = 1;
        } else {
            return ++wsData[this._count] > this.limit;
        }
    }

    /**
     * returns true if the IP has exceeded the max simultaneous connections
     * false otherwise
     */
    isIpRateLimited(ip: string): boolean {
        let data = this._IPsData.get(ip);
        if (!data) {
            data = {
                connections: 0,
            };
            this._IPsData.set(ip, data);
        }
        if (!Config.rateLimitsEnabled) return false;

        if (data.connections + 1 > this.maxConnections) {
            return true;
        }
        return false;
    }

    ipConnected(ip: string) {
        let data = this._IPsData.get(ip);
        if (!data) {
            data = {
                connections: 0,
            };
            this._IPsData.set(ip, data);
        }
        data.connections++;
    }

    ipDisconnected(ip: string) {
        const data = this._IPsData.get(ip);
        if (!data) return;
        data.connections--;
    }
}

export class HTTPRateLimit {
    private _IPsData = new Map<
        string,
        {
            last: number;
            count: number;
        }
    >();

    private _now = 0;

    limit: number;

    constructor(limit: number, interval: number) {
        this.limit = limit;
        setInterval(() => ++this._now, interval);

        // clear ips every hour to not leak memory ig
        // probably not an issue but why not /shrug
        setInterval(
            () => {
                this._IPsData.clear();
            },
            1000 * 60 * 60,
        );
    }

    /**
     * Checks if an IP is rate limited
     */
    isRateLimited(ip: string) {
        if (!Config.rateLimitsEnabled) return false;
        let ipData = this._IPsData.get(ip);
        if (!ipData) {
            ipData = { last: this._now, count: 0 };
            this._IPsData.set(ip, ipData);
        }

        if (ipData.last != this._now) {
            ipData.last = this._now;
            ipData.count = 1;
        } else {
            return ++ipData.count > this.limit;
        }
    }
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

export const apiPrivateRouter = hc<PrivateRouteApp>(
    `${Config.gameServer.apiServerUrl}/private`,
    {
        headers: {
            "survev-api-key": Config.secrets.SURVEV_API_KEY,
        },
    },
);

export async function logErrorToWebhook(from: "server" | "client", ...messages: any[]) {
    const url =
        from === "server" ? Config.errorLoggingWebhook : Config.clientErrorLoggingWebhook;
    if (!url) return;

    try {
        const msg = messages
            .map((msg) => {
                if (msg instanceof Error) {
                    return `\`\`\`${msg.cause}\n${msg.stack}\`\`\``;
                }
                if (typeof msg == "object") {
                    return `\`\`\`json\n${JSON.stringify(msg, null, 2).replaceAll("`", "\\`")}\`\`\``;
                }
                return `${msg}`;
            })
            .join("\n");

        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                embeds: [
                    {
                        color: 0xff0000,
                        title: `${from} error`,
                        timestamp: new Date().toISOString(),
                        description: msg,
                        footer: {
                            text: `Region: ${Config.gameServer.thisRegion}`,
                        },
                    },
                ],
            }),
        });
    } catch (err) {
        // dont use defaultLogger.error here to not log it recursively :)
        console.error("Failed to log error to webhook", err);
    }
}
