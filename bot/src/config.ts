import { getConfig } from "../../config";

const isProd = process.env["NODE_ENV"] === "production";
export const serverConfigPath = isProd ? "../../" : "";
export const Config = getConfig(isProd, serverConfigPath);

// sanitiy check
if (
    !Config.discordGuildId ||
    !Config.discordRoleId ||
    !Config.secrets.DISCORD_CLIENT_ID ||
    !Config.secrets.DISCORD_BOT_TOKEN ||
    !Config.gameServer.apiServerUrl
) {
    throw new Error("Bot config not set up properly");
}

const API_URL = `${Config.gameServer.apiServerUrl}/private`;

const {
    discordGuildId: DISCORD_GUILD_ID,
    discordRoleId: DISCORD_ROLE_ID,
    secrets: { DISCORD_CLIENT_ID, DISCORD_BOT_TOKEN },
} = Config;

export {
    DISCORD_GUILD_ID,
    DISCORD_ROLE_ID,
    DISCORD_CLIENT_ID,
    DISCORD_BOT_TOKEN,
    API_URL,
};

const regex = /webhooks\/(\d+)\//;
const webhookId = Config.recordingReportWebhook?.match(regex)?.[1];
export { webhookId }
