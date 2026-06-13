import { isIP } from "node:net";
import type { HttpRequest, HttpResponse } from "uWebSockets.js";

const textDecoder = new TextDecoder();

export const uwsHelpers = {
    /**
     * Apply CORS headers to a response.
     * @param res The response sent by the server.
     */
    cors(res: HttpResponse): void {
        if (res.aborted) return;
        res.writeHeader("Access-Control-Allow-Origin", "*")
            .writeHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            .writeHeader(
                "Access-Control-Allow-Headers",
                "origin, content-type, accept, x-requested-with",
            )
            .writeHeader("Access-Control-Max-Age", "3600");
    },

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
