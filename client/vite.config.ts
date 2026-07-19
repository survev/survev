import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "node:path";
import { defineConfig, loadEnv, type ServerOptions, type UserConfig } from "vite";
import stripBlockPlugin from "vite-plugin-strip-block";
import { getConfig } from "../config.ts";
import { version } from "../package.json";
import { GIT_VERSION } from "../server/src/utils/gitRevision.ts";
import { atlasBuilderPlugin } from "./atlas-builder/vitePlugin.ts";
import { codefendPlugin } from "./vite-plugins/codefendPlugin.ts";

export default defineConfig(({ mode }) => {
    const isDev = mode === "development";

    const viteEnv = loadEnv(mode, process.cwd(), "VITE_");
    const Config = getConfig(!isDev, "");

    process.env.VITE_TURNSTILE_SCRIPT = "";
    if (Config.secrets.TURNSTILE_SITE_KEY) {
        process.env.VITE_TURNSTILE_SCRIPT =
            `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" defer></script>`;
    }

    process.env.VITE_GAME_VERSION = version;

    process.env.VITE_SPELLSYNC_PROJECT_ID = Config.secrets.SPELLSYNC_PROJECT_ID;
    process.env.VITE_SPELLSYNC_PUBLIC_TOKEN = Config.secrets.SPELLSYNC_PUBLIC_TOKEN;

    const plugins: UserConfig["plugins"] = [
        svelte({
            configFile: false,
            compilerOptions: {
                // TODO: Rewrite client to remove this.
                warningFilter: function(warning) {
                    return !warning.code.startsWith("a11y") || warning.filename !== "src/App.svelte";
                },
            },
            preprocess: [vitePreprocess()],
        }),
        ...atlasBuilderPlugin(),
    ];

    if (!isDev) {
        plugins.push(
            codefendPlugin(),
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
            // Redirect all /stats requests to /stats/.
            "^/stats(?!/).*": {
                target: `http://${Config.vite.host}:${Config.vite.port}`,
                configure(proxy) {
                    proxy.on("proxyReq", (_, req, res) => {
                        res.writeHead(302, { location: req.url!.replace(/^\/stats(\?|$)/, "/stats/$1") });
                        res.end();
                    });
                },
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
            rolldownOptions: {
                checks: {
                    // Atlas builder alone takes over 3 seconds, so this warning is irrelevant.
                    pluginTimings: false,
                },
                input: {
                    main: resolve(import.meta.dirname, "index.html"),
                    stats: resolve(import.meta.dirname, "stats/index.html"),
                    ...(isDev ? { "building-editor": resolve(import.meta.dirname, "building-editor/index.html") } : {}),
                },
                output: {
                    entryFileNames: "js/[hash].js",
                    chunkFileNames: "js/[hash].js",
                    assetFileNames: "[ext]/[hash].[ext]",
                },
            },
        },
        resolve: {
            alias: {
                "$lib": resolve(import.meta.dirname, "./src/lib/"),
                "@/shared": resolve(import.meta.dirname, "../shared"),
                "@/sdk.ts": viteEnv?.VITE_ENABLE_SURVEV_ADS === "true"
                    ? resolve(import.meta.dirname, "./src/sdk/sdk-manager.prod.ts")
                    : resolve(import.meta.dirname, "./src/sdk/sdk-manager.ts"),
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: ["color-functions", "if-function", "import", "global-builtin"],
                },
            },
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
            PASS_TYPE: JSON.stringify(Config.passType),
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
