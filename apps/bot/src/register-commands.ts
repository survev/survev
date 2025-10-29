import { REST, Routes } from "discord.js";
import { commandsToRegister } from "./commands";
import { DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } from "./config";
import { botLogger } from "./utils";

async function registerCommands() {
    const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN);
    try {
        botLogger.info("Started refreshing application (/) commands.");
        await rest.put(
            Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID!),
            {
                body: commandsToRegister.map((command) => command.toJSON()),
            },
        );
        botLogger.info("Successfully reloaded application (/) commands.");
    } catch (error) {
        botLogger.error("Failed to refresh application commands:", error);
    }
}

await registerCommands();
