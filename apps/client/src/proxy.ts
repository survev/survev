import type { ProxyDef } from "@survev/types/api";

declare const PROXY_DEFS: Record<string, ProxyDef>;

export const proxy = {
    getProxyDef() {
        for (const proxy in PROXY_DEFS) {
            if (window.location.hostname.indexOf(proxy) !== -1) {
                return { proxy: proxy, def: PROXY_DEFS[proxy] };
            }
        }

        if (PROXY_DEFS.default) {
            return {
                proxy: window.location.hostname,
                def: PROXY_DEFS.default,
            };
        }

        return null;
    },

    loginSupported(loginType: keyof ProxyDef) {
        const proxyDef = proxy.getProxyDef();
        return proxyDef ? !!(proxyDef.def[loginType] || proxyDef.def.all) : false;
    },

    anyLoginSupported() {
        return (
            proxy.loginSupported("google") ||
            proxy.loginSupported("discord") ||
            proxy.loginSupported("mock")
        );
    },
};
