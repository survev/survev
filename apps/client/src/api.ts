import { proxy } from "./proxy";

export const api = {
    resolveUrl(url: string) {
        const proxyDef = proxy.getProxyDef();
        if (proxyDef && proxyDef.def.apiUrl) {
            return proxyDef.def.apiUrl + url;
        }
        return url;
    },
    resolveRoomHost() {
        const proxyDef = proxy.getProxyDef();
        if (proxyDef && proxyDef.def.apiUrl) {
            return new URL(proxyDef.def.apiUrl).host;
        }
        return window.location.host;
    },
};
