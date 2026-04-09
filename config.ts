import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import hjson from "hjson";
import type { ConfigType, PartialConfig } from "./configType";
import { TeamMode } from "./shared/gameConfig";
import { util } from "./shared/utils/util";

export const configFileName = "survev-config.hjson";

export function getConfig(isProduction: boolean, dir: string) {
    const isDev = !isProduction;

    const config: ConfigType = {
        apiServer: {
            host: "0.0.0.0",
            port: 8000,
        },
        gameServer: {
            host: "0.0.0.0",
            port: 8001,
            apiServerUrl: "",
            thisRegion: "local",
        },
        vite: {
            host: "127.0.0.1",
            port: 3000,
        },
        regions: {},
        proxies: {},
        modes: [
            { mapName: "main", teamMode: TeamMode.Solo, enabled: true },
            { mapName: "main", teamMode: TeamMode.Duo, enabled: true },
            { mapName: "main", teamMode: TeamMode.Squad, enabled: true },
        ],
        clientTheme: "main",
        passType: "pass_survivr1",
        gameTps: 100,
        netSyncTps: 33,
        processMode: isDev ? "single" : "multi",
        logging: {
            logDate: true,
            infoLogs: true,
            debugLogs: isDev,
            warnLogs: true,
            errorLogs: true,
        },
        database: {
            enabled: true,
            host: "127.0.0.1",
            user: "survev",
            password: "survev",
            database: "survev",
            port: 5432,
        },
        oauthRedirectURI: "",
        oauthBasePath: "/",
        secrets: {
            SURVEV_API_KEY: "",
            SURVEV_LOADOUT_SECRET: "",
            SURVEV_IP_SECRET: "",
        },
        captchaEnabled: false,
        cachingEnabled: false,
        rateLimitsEnabled: isProduction,
        uniqueInGameNames: true,
        debug: {
            spawnMode: "default",
            allowBots: isDev,
            allowEditMsg: isDev,
            allowMockAccount: isDev,
        },
        defaultItems: {},
    };

    const dirname = import.meta?.dirname || __dirname;

    const configPath = path.join(dirname, dir, configFileName);

    let localConfig: PartialConfig = {};

    if (fs.existsSync(configPath)) {
        console.log(`Sourcing config ${configPath}`);
        const configText = fs.readFileSync(configPath).toString();
        localConfig = hjson.parse(configText);
    } else {
        console.log("Config file doesn't exist... creating");
        localConfig = {
            // always specify default random keys..
            secrets: {
                SURVEV_API_KEY: randomBytes(64).toString("base64"),
                SURVEV_LOADOUT_SECRET: randomBytes(32).toString("base64"),
                SURVEV_IP_SECRET: randomBytes(32).toString("base64"),
            },
        };

        fs.writeFileSync(
            configPath,
            hjson.stringify(localConfig, { bracesSameLine: true }),
        );
    }

    util.mergeDeep(config, localConfig);

    if (!config.oauthRedirectURI) {
        // apply this default after merging the local config
        // so if the local config changes the vite host and port it will still be right
        config.oauthRedirectURI = `http://${config.vite.host}:${config.vite.port}`;
    }
    const baseUrl = new URL(config.oauthRedirectURI);

    if (!config.gameServer.apiServerUrl) {
        // same as above, provide a more accurate default value if not set manually
        config.gameServer.apiServerUrl = `http://${config.apiServer.host}:${config.apiServer.port}`;
    }

    const googleLogin = !!(
        config.secrets.GOOGLE_CLIENT_ID && config.secrets.GOOGLE_SECRET_ID
    );
    const discordLogin = !!(
        config.secrets.DISCORD_CLIENT_ID && config.secrets.DISCORD_CLIENT_ID
    );

    config.proxies[baseUrl.hostname] = {
        google: googleLogin,
        discord: discordLogin,
        mock: config.debug.allowMockAccount,
        ...(config.proxies[baseUrl.hostname] ?? {}),
    };

    if (isDev) {
        config.regions.local ??= {
            https: false,
            address: `127.0.0.1:${config.gameServer.port}`,
            l10n: "index-local",
        };
    }

    return config;
}

export function saveConfig(dir: string, config: PartialConfig) {
    try {
        const dirname = import.meta?.dirname || __dirname;

        const configPath = path.join(dirname, dir, configFileName);

        const configText = fs.readFileSync(configPath).toString();
        const localConfig = hjson.parse(configText);

        const finalConfig = util.mergeDeep({}, localConfig, config);

        fs.writeFileSync(
            configPath,
            hjson.stringify(finalConfig, { bracesSameLine: true }),
        );
        console.log("Saved config file");
    } catch (err) {
        console.error("Failed saving config", err);
    }
}
