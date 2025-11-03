import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import enquirer from "enquirer";
import hjson from "hjson";
import { configFileName } from "./config";
import type { PartialConfig } from "./configType";
import { util } from "./shared/utils/util";

const prompt = enquirer.prompt;

async function importKeys(config: PartialConfig) {
    config.secrets ??= {};
    const apiKey = await prompt<{ value: string }>({
        message: "Enter API key:",
        name: "value",
        type: "text",
        required: true,
    });
    config.secrets.SURVEV_API_KEY = apiKey.value;

    const loadoutSecret = await prompt<{ value: string }>({
        message: "Enter Loadout secret:",
        name: "value",
        type: "text",
        required: true,
        validate(value) {
            try {
                atob(value);
            } catch {
                return "Invalid base64 string";
            }

            const buff = Buffer.from(value, "base64");
            if (buff.length < 32) {
                return "Loadout secret should have more than 32 bytes!";
            }
            return true;
        },
    });

    config.secrets.SURVEV_LOADOUT_SECRET = loadoutSecret.value;
}

async function setupGameServer(config: PartialConfig) {
    config.gameServer ??= {};

    const regionId = await prompt<{ value: string }>({
        message: "Which region is this game server hosting?",
        name: "value",
        type: "text",
        required: true,
    });
    config.gameServer.thisRegion = regionId.value;

    config.regions ??= {};

    if (!config.regions[regionId.value]) {
        const https = await prompt<{ value: boolean }>({
            message: "Does this region support https?",
            name: "value",
            type: "confirm",
            initial: true,
        });

        const address = await prompt<{ value: string }>({
            message: "Enter region address",
            name: "value",
            type: "text",
        });

        const l10n = await prompt<{ value: string }>({
            message:
                "Enter region translation key (eg: index-north-america, index-south-america)",
            name: "value",
            type: "text",
        });

        config.regions[regionId.value] = {
            https: https.value,
            address: address.value,
            l10n: l10n.value,
        };
    }

    const apiAddress = await prompt<{ value: string }>({
        message: "Enter the API server address",
        name: "value",
        type: "text",
        required: true,
        initial: `http://${config.apiServer?.host ?? "127.0.0.1"}:${config.apiServer?.port ?? 8000}`,
        validate(value) {
            return URL.parse(value) !== null;
        },
    });
    config.gameServer.apiServerUrl = apiAddress.value;

    await setupProxyIPHeader(config, "gameServer");
    await setupSSL(config, "gameServer");
}

async function setupDatabase(config: PartialConfig, initial = true) {
    const dbEnabled = await prompt<{ value: boolean }>({
        message:
            "Would you like to setup database support (required for accounts, IP bans, leaderboards etc)",
        name: "value",
        type: "confirm",
        initial,
    });

    config.database = {
        ...config.database,
        enabled: dbEnabled.value,
    };

    if (dbEnabled.value) {
        await setupAccounts(config);

        const setupBot = await prompt<{ value: boolean }>({
            message: "Would you like to setup the moderation bot?",
            name: "value",
            type: "confirm",
            initial: false,
        });

        if (setupBot.value) {
            await setupBotConfig(config);
        }
    }
}

async function setupAccounts(config: PartialConfig) {
    const redirectURI = await prompt<{ value: string }>({
        message:
            "Enter the full base URL of the website for oauth2 redirects (eg: https://survev.io)",
        name: "value",
        type: "text",
        initial: `http://${config.apiServer?.host ?? "127.0.0.1"}:${config.apiServer?.port ?? 8000}`,
        required: true,
    });

    config.oauthRedirectURI = redirectURI.value;

    const addGoogle = await prompt<{ value: boolean }>({
        message: "Would you like to add google login support",
        name: "value",
        type: "confirm",
        initial: false,
    });

    config.secrets ??= {};

    if (addGoogle.value) {
        const clientId = await prompt<{ value: string }>({
            message: "Enter google client ID",
            name: "value",
            type: "text",
            required: true,
        });

        config.secrets.GOOGLE_SECRET_ID = clientId.value;

        const clientSecret = await prompt<{ value: string }>({
            message: "Enter google secret ID",
            name: "value",
            type: "text",
            required: true,
        });

        config.secrets.GOOGLE_SECRET_ID = clientSecret.value;
    }

    const addDiscord = await prompt<{ value: boolean }>({
        message: "Would you like to add discord login support",
        name: "value",
        type: "confirm",
        initial: false,
    });

    if (addDiscord.value) {
        const clientId = await prompt<{ value: string }>({
            message: "Enter discord client ID",
            name: "value",
            type: "text",
            required: true,
        });
        config.secrets.DISCORD_CLIENT_ID = clientId.value;

        const clientSecret = await prompt<{ value: string }>({
            message: "Enter discord secret secret",
            name: "value",
            type: "text",
            required: true,
        });
        config.secrets.DISCORD_SECRET_ID = clientSecret.value;
    }
}

async function setupAPIServer(config: PartialConfig) {
    const shouldImportKeys = await prompt<{ value: "import" | "random" }>({
        message:
            "Would you like to import the API and loadout secret keys or use random ones?",
        name: "value",
        type: "select",
        choices: ["import", "random"],
    });

    if (shouldImportKeys.value === "import") {
        await importKeys(config);
    }
    await setupProxyIPHeader(config, "apiServer");
    await setupSSL(config, "apiServer");
    await setupDatabase(config);
}

async function setupRegions(config: PartialConfig) {
    config.regions ??= {};

    let addRegion = true;
    while (addRegion) {
        const regionId = await prompt<{ value: string }>({
            message: "Enter region ID (eg: na, eu, sa, as)",
            name: "value",
            type: "text",
            required: true,
        });

        const https = await prompt<{ value: boolean }>({
            message: "Does this region support https?",
            name: "value",
            type: "confirm",
            initial: true,
        });

        const address = await prompt<{ value: string }>({
            message: "Enter region address",
            name: "value",
            type: "text",
        });

        const l10n = await prompt<{ value: string }>({
            message:
                "Enter region translation key (eg: index-north-america, index-south-america)",
            name: "value",
            type: "text",
        });

        config.regions[regionId.value] = {
            https: https.value,
            address: address.value,
            l10n: l10n.value,
        };

        const addMore = await prompt<{ value: boolean }>({
            message: "Would you like to add another region?",
            name: "value",
            type: "confirm",
            initial: false,
        });

        addRegion = addMore.value;
    }
}

async function setupProxyCheck(config: PartialConfig) {
    const enableProxyCheck = await prompt<{ value: boolean }>({
        message: "Would you like to enable proxycheck.io to ban VPNs and proxies?",
        name: "value",
        type: "confirm",
        initial: false,
    });
    if (enableProxyCheck.value) {
        const proxycheckKey = await prompt<{ value: string }>({
            message: "Enter proxycheck API key",
            name: "value",
            type: "text",
        });
        config.secrets ??= {};
        config.secrets.PROXYCHECK_KEY = proxycheckKey.value;
    }
}

async function setupProxyIPHeader(
    config: PartialConfig,
    server: "apiServer" | "gameServer",
) {
    const serverName = server == "apiServer" ? "API server" : "game server";
    const isBehindProxy = await prompt<{ value: boolean }>({
        message: `Is the ${serverName} behind a proxy? (e.g nginx or cloudflare)`,
        name: "value",
        type: "confirm",
        initial: false,
    });

    if (isBehindProxy.value) {
        const proxyHeader = await prompt<{ value: string }>({
            message: "Enter the proxy HTTP header",
            name: "value",
            type: "text",
            initial: "X-Real-IP",
        });
        config[server] ??= {};
        config[server].proxyIPHeader = proxyHeader.value;
    }
}

async function setupSSL(config: PartialConfig, server: "apiServer" | "gameServer") {
    const serverName = server == "apiServer" ? "API server" : "game server";

    const enableSSL = await prompt<{ value: boolean }>({
        message: `Would you like enabling SSL for the ${serverName}?`,
        name: "value",
        type: "confirm",
        initial: false,
    });

    if (enableSSL.value) {
        const keyFilePath = await prompt<{ value: string }>({
            message: "Enter SSL key file path",
            name: "value",
            type: "text",
        });
        const certFilePath = await prompt<{ value: string }>({
            message: "Enter SSL cert file path",
            name: "value",
            type: "text",
        });
        config[server] ??= {};
        config[server].ssl = {
            keyFile: keyFilePath.value,
            certFile: certFilePath.value,
        };
    }
}

async function setupProductionConfig(config: PartialConfig) {
    const apiOrGameServer = await prompt<{
        value: "Both" | "API" | "Game server region";
    }>({
        message: "Are you deploying a an API server, a game server region or both?",
        name: "value",
        type: "select",
        choices: ["Both", "API", "Game server region"],
    });

    if (apiOrGameServer.value === "Both") {
        await setupAPIServer(config);
        await setupRegions(config);
        await setupGameServer(config);
    } else if (apiOrGameServer.value === "API") {
        await setupAPIServer(config);
        await setupRegions(config);
    } else {
        await setupGameServer(config);
        await importKeys(config);
    }
    await setupProxyCheck(config);
}

async function setupDevelopmentConfig(config: PartialConfig) {
    await setupDatabase(config, false);
}

async function setupBotConfig(config: PartialConfig) {
    config.secrets ??= {};

    if (!config.secrets.DISCORD_CLIENT_ID) {
        const clientId = await prompt<{ value: string }>({
            message: "Enter discord client ID",
            name: "value",
            type: "text",
            required: true,
        });
        config.secrets.DISCORD_CLIENT_ID = clientId.value;
    }

    const discordBotToken = await prompt<{ value: string }>({
        message: "Enter the discord bot token",
        name: "value",
        type: "text",
    });
    config.secrets.DISCORD_BOT_TOKEN = discordBotToken.value;

    const discordGuildId = await prompt<{ value: string }>({
        message: "Enter the guild ID",
        name: "value",
        type: "text",
    });
    config.discordGuildId = discordGuildId.value;

    const discordRoleId = await prompt<{ value: string }>({
        message: "Enter the discord role ID",
        name: "value",
        type: "text",
    });
    config.discordRoleId = discordRoleId.value;
}

const configPath = path.join(import.meta.dirname, configFileName);

async function loadExistingConfig(config: PartialConfig) {
    if (!fs.existsSync(configPath)) return;

    const confirmation = await prompt<{ value: boolean }>({
        message: "A config file already exists, would you like to run this setup anyway?",
        name: "value",
        type: "confirm",
        initial: true,
    });
    if (!confirmation.value) {
        process.exit(0);
    }

    const configText = fs.readFileSync(configPath).toString();
    const localConfig = hjson.parse(configText);
    util.mergeDeep(config, localConfig);
}

async function setupConfig() {
    const config: PartialConfig = {
        secrets: {
            SURVEV_API_KEY: randomBytes(64).toString("base64"),
            SURVEV_LOADOUT_SECRET: randomBytes(32).toString("base64"),
        },
    };

    console.log("Welcome to Survev.io initial config setup!");

    await loadExistingConfig(config);

    const devOrProd = await prompt<{ value: "development" | "production" }>({
        message:
            "Are you setting up a local development environment or a production server?",
        name: "value",
        type: "select",
        choices: ["production", "development"],
    });

    if (devOrProd.value === "development") {
        await setupDevelopmentConfig(config);
    } else {
        await setupProductionConfig(config);
    }

    const str = hjson.stringify(config, { bracesSameLine: true, space: 2 });
    fs.writeFileSync(configPath, str);

    console.log("Wrote config to", configPath, ":");
    console.log(
        hjson.stringify(config, { bracesSameLine: true, space: 2, colors: true }),
    );
}

await setupConfig();
