import {
    Client,
    Events,
    GatewayIntentBits
} from "discord.js";
import { DISCORD_BOT_TOKEN } from "./config";
import {
    botLogger
} from "./utils";
import { setupInteractionHandlers } from "./commands";
import { setupEventListeners } from "./listeners";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

try {
    client.once(Events.ClientReady, (readyClient) => {
        botLogger.info(`Logged in as ${readyClient.user.tag}!`);
    });
    await setupInteractionHandlers(client);
    await setupEventListeners(client);
    await client.login(DISCORD_BOT_TOKEN);
} catch (error) {
    botLogger.error("Failed to start the bot:", error);
    process.exit(1);
}
