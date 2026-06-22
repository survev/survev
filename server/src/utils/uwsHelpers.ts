import { isIP } from "node:net";
import type { HttpRequest, HttpResponse } from "uWebSockets.js";

const textDecoder = new TextDecoder();

export const uwsHelpers = {
    forbidden(res: HttpResponse): void {
        if (res.aborted) return;
        res.cork(() => {
            if (res.aborted) return;
            res.writeStatus("403 Forbidden").end("403 Forbidden");
        });
    },

    returnJson(res: HttpResponse, data: Record<string, unknown>): void {
        if (res.aborted) return;
        res.cork(() => {
            if (res.aborted) return;
            res.writeHeader("Content-Type", "application/json").end(JSON.stringify(data));
        });
    },

    /**
     * Get an IP from an uWebsockets HTTP response
     */
    getIp(res: HttpResponse, req: HttpRequest, proxyHeader?: string) {
        const ip = proxyHeader
            ? req.getHeader(proxyHeader.toLowerCase())
            : textDecoder.decode(res.getRemoteAddressAsText());

        if (!ip || isIP(ip) == 0) return undefined;
        return ip;
    },
};
