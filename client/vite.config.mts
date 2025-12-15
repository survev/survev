import { resolve } from "node:path";
import { defineConfig, type Plugin, type ServerOptions } from "vite";
import stripBlockPlugin from "vite-plugin-strip-block";
import { getConfig } from "../config";
import { version } from "../package.json";
import { GIT_VERSION } from "../server/src/utils/gitRevision";
import { atlasBuilderPlugin } from "./atlas-builder/vitePlugin";
import { codefendPlugin } from "./vite-plugins/codefendPlugin";
import { ejsPlugin } from "./vite-plugins/ejsPlugin";

export default defineConfig(({ mode }) => {
    const isDev = mode === "development";

    const Config = getConfig(!isDev, "");

    process.env.VITE_FUSE_SCRIPT = isDev ? "" : `<script async src="https://cdn.fuseplatform.net/publift/tags/2/4018/fuse.js"></script>`;

    process.env.VITE_TURNSTILE_SCRIPT = "";
    process.env.VITE_AD_PREFIX = Config.secrets.AD_PREFIX;
    if (Config.secrets.TURNSTILE_SITE_KEY) {
        process.env.VITE_TURNSTILE_SCRIPT = `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" defer></script>`;
    }

    process.env.VITE_GAME_VERSION = version;

    process.env.VITE_SPELLSYNC_PROJECT_ID = Config.secrets.SPELLSYNC_PROJECT_ID;
    process.env.VITE_SPELLSYNC_PUBLIC_TOKEN = Config.secrets.SPELLSYNC_PUBLIC_TOKEN;

    const plugins: Plugin[] = [ejsPlugin(), ...atlasBuilderPlugin()];

    if (!isDev) {
        plugins.push(codefendPlugin());

        plugins.push(
            stripBlockPlugin({
                start: "STRIP_FROM_PROD_CLIENT:START",
                end: "STRIP_FROM_PROD_CLIENT:END",
            }),
        );
    }

    const serverOptions: ServerOptions = {
        port: Config.vite.port,
        host: Config.vite.host,
        proxy: {
            // this redirects /stats to /stats/
            // because vite is cringe and does not work without trailing slashes at the end of paths 😭
            "^/stats(?!/$).*": {
                target: `http://${Config.vite.host}:${Config.vite.port}`,
                rewrite: (path) => path.replace(/^\/stats(?!\/$).*/, "/stats/"),
                changeOrigin: true,
                secure: false,
            },
            "/api": {
                target: `http://${Config.apiServer.host}:${Config.apiServer.port}`,
                changeOrigin: true,
                secure: false,
            },
            "/team_v2": {
                target: `http://${Config.apiServer.host}:${Config.apiServer.port}`,
                changeOrigin: true,
                secure: false,
                ws: true,
            },
        },
    };

    return {
        appType: "mpa",
        base: "",
        build: {
            target: "es2022",
            chunkSizeWarningLimit: 2000,
            rollupOptions: {
                input: {
                    main: resolve(import.meta.dirname, "index.html"),
                    stats: resolve(import.meta.dirname, "stats/index.html"),
                },
                output: {
                    assetFileNames(assetInfo) {
                        if (assetInfo.names[0]?.endsWith(".css")) {
                            return "css/[name]-[hash][extname]";
                        }
                        return "assets/[name]-[hash][extname]";
                    },
                    entryFileNames: "js/[hash].js",
                    chunkFileNames: "js/[hash].js",
                },
            },
        },
        resolve: {
            extensions: [".ts", ".js"],
        },
        define: {
            GAME_REGIONS: Config.regions,
            GIT_VERSION: JSON.stringify(GIT_VERSION),
            PING_TEST_URLS: Object.entries(Config.regions).map(([key, data]) => {
                return {
                    region: key,
                    zone: key,
                    url: data.address,
                    https: data.https,
                };
            }),
            AD_PREFIX: JSON.stringify(Config.secrets.AD_PREFIX),
            VITE_GAMEMONETIZE_ID: JSON.stringify(Config.secrets.GAMEMONETIZE_ID),
            SPELLSYNC_PROJECT_ID: JSON.stringify(Config.secrets.SPELLSYNC_PROJECT_ID),
            SPELLSYNC_PUBLIC_TOKEN: JSON.stringify(Config.secrets.SPELLSYNC_PUBLIC_TOKEN),
            IS_DEV: isDev,
            PROXY_DEFS: JSON.stringify(Config.proxies),
            TURNSTILE_SITE_KEY: JSON.stringify(Config.secrets.TURNSTILE_SITE_KEY),
        },
        plugins,
        json: {
            stringify: true,
        },
        server: serverOptions,
        preview: serverOptions,
    };
});
