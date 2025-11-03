import type { MapDefs } from "./shared/defs/mapDefs";
import type { TeamMode } from "./shared/gameConfig";
import type { ProxyDef } from "./shared/types/api";
import type { DeepPartial } from "./shared/utils/util";
import type { Vec2 } from "./shared/utils/v2";

/**
 * Common keys used by both API and game server.
 */
interface ServerConfig {
    host: string;
    port: number;

    /**
     * HTTP Header used to get IP addresses.
     *
     * NOTE: Only use this when running the specified server under a proxy.
     * Setting a proxy IP header and exposing a direct (without a proxy) connection to the server allows attackers to spoof their IP with the header!
     *
     * A commonly used value is "X-Real-IP"
     */
    proxyIPHeader?: string;

    /**
     * SSL file paths. Not needed if behind an HTTPS proxy.
     */
    ssl?: {
        keyFile: string;
        certFile: string;
    };
}

export interface ConfigType {
    /**
     * API server configuration.
     * Not needed if only deploying a game server.
     */
    apiServer: ServerConfig;

    /**
     * Game server configuration.
     */
    gameServer: ServerConfig & {
        /**
         * The full URL of the main API server.
         * Used by the game server to send data like player count and saving match history to the database.
         */
        apiServerUrl: string;

        /**
         * Which region this game server represents.
         * Should be a valid key from the `regions` object.
         */
        thisRegion: string;
    };

    /**
     * Client dev server.
     */
    vite: {
        host: string;
        port: number;
    };

    /**
     * Game servers / regions.
     *
     * Used for the API server to communicate with the game servers, and for the client server selector.
     *
     * Example:
     * ```hjson
     * {
     *     regions: {
     *         na: {
     *             https: true
     *             address: "na.mycoolsurvevserver.io"
     *             l10n: "index-north-america"
     *         }
     *         sa: {
     *             https: true
     *             address: "sa.mycoolsurvevserver.io"
     *             l10n: "index-south-america"
     *         }
     *     }
     * }
     * ```
     */
    regions: Record<
        string,
        {
            https: boolean;
            /**
             * The region address with port but without the protocol.
             */
            address: string;
            /**
             * The translation key used by the client server selector.
             *
             * Example: "index-south-america" will translate to "South America" in english.
             */
            l10n: string;
        }
    >;

    proxies: Record<string, ProxyDef>;

    /**
     * Enabled game modes. this will update on the UI without requiring a client rebuild, since they are fetched from the server every time the page is loaded.
     *
     * Defaults to Solo, Duo and Squad, all enabled and on "main" / normal map.
     *
     * NOTE: The client side UI currently only supports a maximum of 3 modes!
     */
    modes: Array<{
        /**
         * The ID of the map this mode will be running
         */
        mapName: keyof typeof MapDefs;
        /**
         * The team mode, "Solo", "Duo" or "Squad" are the only supported values
         */
        teamMode: TeamMode;
        /**
         * Enables / disables the mode, will apply a "disabled" effect to the button client-side
         */
        enabled: boolean;
    }>;

    /**
     * The client theme, changes the splash screen background and for some the menu music.
     *
     * NOTE: Required at build time, unlike modes it wont update by fetching from the server!
     */
    clientTheme: keyof typeof MapDefs;

    /**
     * Game tick rate.
     * Controls how many physics and logic ticks the game will try to process every second, defaults to 100.
     */
    gameTps: number;
    /**
     * "Net Synchronization" tick rate.
     * Controls how frequently the game will try sending updates to clients, defaults to 33.
     *
     * Updates done in the game tick will accumulate to be sent on the next net sync tick.
     */
    netSyncTps: number;

    /**
     * If games should all run in the same process.
     * Or spawn a new process for each game.
     *
     * Defaults to single in development and multi in production.
     * Single process mode has faster restarts for development but cant handle many players.
     */
    processMode: "single" | "multi";

    /**
     * Server logger configuration
     */
    logging: {
        /**
         * If the logger class should include the date.
         * Useful to disable it when using logging tools that add a date by default (like journalctl)
         */
        logDate: boolean;

        // logging categories enabled

        /**
         * Information logs
         */
        infoLogs: boolean;

        /**
         * Debug logs, disabled by default on production
         */
        debugLogs: boolean;

        /**
         * Warning logs
         */
        warnLogs: boolean;

        /**
         * Error logs, will also log to a webhook if `errorLoggingWebhook` is set.
         */
        errorLogs: boolean;
    };
    /**
     * Webhook URL to log server errors.
     */
    errorLoggingWebhook?: string;

    /**
     * Webhook URL to log client errors.
     */
    clientErrorLoggingWebhook?: string;

    /**
     * PostgreSQL Database configuration, this will enable features like accounts, IP bans, leaderboards etc.
     */
    database: {
        /**
         * If database support is enabled.
         * Disabling this will make all API routes that need the database return an error.
         */
        enabled: boolean;

        /** @default "127.0.0.1" */
        host: string;
        /** @default "survev" */
        user: string;
        /** @default "survev" */
        password: string;
        /** @default "survev" */
        database: string;
        /** @default 5432 */
        port: number;
    };

    /**
     * Used for account oauth2 redirects (https://www.oauth.com/oauth2-servers/redirect-uris/).
     * Should be the full hosted website url, example: https://mycoolsurvevserver.io.
     */
    oauthRedirectURI: string;

    /**
     * Base path of the client
     * Used if the API is on a subdomain instead of the main one
     * So the auth code can redirect to it instead of `/`
     */
    oauthBasePath: string;

    /**
     * API keys for accounts and other features.
     */
    secrets: {
        /**
         * API key used for game server and API server to communicate.
         * A default random one is generated when creating the config file
         */
        SURVEV_API_KEY: string;

        /**
         * Used to encrypt the loadout before sending it to the client, So the game server can read it back.
         *
         * Should be 32 bytes base64 string, a default one can be generated when running the setup script.
         * Can also run `openssl rand -base64 32` to generate one
         */
        SURVEV_LOADOUT_SECRET: string;

        /**
         * Used to encode IP addresses on the database
         */
        SURVEV_IP_SECRET: string;

        /**
         * Discord client ID.
         * If this and the secret ID are present the discord login button will be enabled client-side.
         */
        DISCORD_CLIENT_ID?: string;

        /**
         * Discord secret ID.
         * If this and the client ID are present the discord login button will be enabled client-side.
         */
        DISCORD_SECRET_ID?: string;

        /**
         * Google client ID.
         * If this and the secret ID are present the google login button will be enabled client-side.
         */
        GOOGLE_CLIENT_ID?: string;
        /**
         * Google secret ID.
         * If this and the client ID are present the google login button will be enabled client-side.
         */
        GOOGLE_SECRET_ID?: string;

        /**
         * Discord bot token.
         */
        DISCORD_BOT_TOKEN?: string;

        /**
         * Enables proxycheck.io to ban VPNs and proxies from connecting.
         *
         */
        PROXYCHECK_KEY?: string;

        /**
         * Turnstile captcha secret key.
         */
        TURNSTILE_SECRET_KEY?: string;

        /**
         * Turnstile captcha site key.
         */
        TURNSTILE_SITE_KEY?: string;

        /**
         * Adin play ID: API key used for Adin play ads.
         * Setting both this and AIP_PLACEMENT_ID will enable ads on the client.
         *
         * NOTE: This is only used by the client so must be present at the build time!
         */
        AIP_ID?: string;
        /**
         * Adin play placement ID (used to identify ad banners), can be just "survev-io".
         *
         * NOTE: This is only used by the client so must be present at the build time!
         */
        AIP_PLACEMENT_ID?: string;
        GAMEMONETIZE_ID?: string;
    };

    /**
     * Role ID for users with moderation permissions
     */
    discordRoleId?: string;

    /**
     * Guild ID
     */
    discordGuildId?: string;

    /**
     * Enables caching some expensive API requests (like leaderboards) with Redis.
     *
     * This requires a Redis server to be set up with the API server.
     */
    cachingEnabled: boolean;

    /**
     * If the turnstile captcha state is enabled.
     * Used by the API server and will be returned on site_info API.
     *
     * Requires the turnstile keys on secrets object.
     */
    captchaEnabled: boolean;

    /**
     * Enables IP rate limits.
     * This both limits how many requests per second IP's can make to the API server and how many simultaneous IP's can connect to the game server.
     *
     * Enabled by default on production.
     */
    rateLimitsEnabled: boolean;

    /**
     * If in-game names should be unique.
     * Useful for banning players.
     */
    uniqueInGameNames: boolean;

    /**
     * Debugging config for development :)
     * All the boolean ones default to false on production and true otherwise.
     */
    debug: {
        /**
         * If should use the map default spawn mode or a fixed one
         */
        spawnMode: "default" | "fixed";
        /**
         * Fixed spawn mode position, if not set will use the map center
         */
        spawnPos?: Vec2;
        /**
         * If clients that tag themselves as bots can join
         * This is used for the stress test bots so they get no custom loadout
         */
        allowBots: boolean;
        /**
         * If clients can send edit msgs from the client-side debug editor
         */
        allowEditMsg: boolean;
        /**
         * If the "mock" test account is enabled, used for testing account features without requiring discord or google oauth2 keys
         */
        allowMockAccount: boolean;
    };

    /**
     * Overrides default items players spawn with, mostly for development.
     * Account loadouts and mode spawn items (eg from cobalt) can still override this!
     */
    defaultItems: {
        weapons?: [
            {
                type: string;
                ammo: number;
            },
        ];
        outfit?: string;
        backpack?: string;
        helmet?: string;
        chest?: string;
        scope?: string;
        perks?: Array<{ type: string; droppable?: boolean }>;
        /**
         * ammo, grenades, healing items and scopes
         */
        inventory?: Record<string, number>;
    };
}

export type PartialConfig = DeepPartial<ConfigType>;
