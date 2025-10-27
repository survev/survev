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
    // !! TODO: pass the param
    isRateLimited(ip: string, rateLimitsEnabled = false) {
        if (!rateLimitsEnabled) return false;
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
    // !! TODO
    isRateLimited(wsData: Record<symbol, number>, rateLimitsEnabled = false) {
        if (!rateLimitsEnabled) return false;
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
    // !! TODO: pass the param
    isIpRateLimited(ip: string, rateLimitsEnabled = false): boolean {
        let data = this._IPsData.get(ip);
        if (!data) {
            data = {
                connections: 0,
            };
            this._IPsData.set(ip, data);
        }
        if (!rateLimitsEnabled) return false;

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
