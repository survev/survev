import { getConfig } from "../../config.ts";

const isProd = process.env["NODE_ENV"] === "production";
export const serverConfigPath = isProd ? "../../" : "";
export const Config = getConfig(isProd, serverConfigPath);

// sanitiy check
if (
    !Config.discordGuildId
    || !Config.discordRoleId
    || !Config.secrets.DISCORD_CLIENT_ID
    || !Config.secrets.DISCORD_BOT_TOKEN
    || !Config.gameServer.apiServerUrl
) {
    throw new Error("Bot config not set up properly");
}

const API_URL = `${Config.gameServer.apiServerUrl}/private`;

const {
    discordGuildId: DISCORD_GUILD_ID,
    discordRoleId: DISCORD_ROLE_ID,
    secrets: { DISCORD_CLIENT_ID, DISCORD_BOT_TOKEN },
} = Config;

export { API_URL, DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID, DISCORD_ROLE_ID };
