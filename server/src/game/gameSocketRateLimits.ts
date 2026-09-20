import { HTTPRateLimit, WebSocketRateLimit } from "../utils/rateLimit.ts";

/** Captures the limiter selected at upgrade, even if the process hosts a new round later. */
export class GameSocketRateLease {
    private released = false;

    constructor(private readonly limit: WebSocketRateLimit, private readonly ip: string) {}

    isRateLimited(messageCounts: Record<symbol, number>) {
        return this.limit.isRateLimited(messageCounts);
    }

    release() {
        if (this.released) return;
        this.released = true;
        this.limit.ipDisconnected(this.ip);
    }
}

export class GameSocketRateLimits {
    private readonly normal = {
        http: new HTTPRateLimit(5, 1000),
        ws: new WebSocketRateLimit(500, 1000, 5),
    };
    // A complete 4v4 roster may share one NAT. Allow overlapping old/new sockets
    // during reconnects; reserved join tokens still cap actual players at eight.
    private readonly ranked = {
        http: new HTTPRateLimit(16, 1000),
        ws: new WebSocketRateLimit(500, 1000, 16),
    };

    reserve(ip: string, ranked: boolean): GameSocketRateLease | undefined {
        const limits = ranked ? this.ranked : this.normal;
        if (limits.http.isRateLimited(ip) || limits.ws.isIpRateLimited(ip)) return;
        limits.ws.ipConnected(ip);
        return new GameSocketRateLease(limits.ws, ip);
    }
}
