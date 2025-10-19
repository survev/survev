import {
    Client,
    Events,
    InteractionReplyOptions,
    MessageFlags,
    type ChatInputCommandInteraction,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import { botLogger, Command, hasBotPermission, safeBotReply, sendNoPermissionMessage } from "../utils";
import { commands, createSlashCommand, genericExecute } from "./generic";
import { searchPlayersHandler } from "./search-player";

export async function setupInteractionHandlers(client: Client) {
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const commandName = interaction.commandName as Command;
    if (!commandHandlers[commandName]) {
        botLogger.warn(`Unknown command: ${commandName}`);
        return;
    }
    try {
        await commandHandlers[commandName](interaction);
    } catch (error) {
        botLogger.error(`Error executing command "${commandName}":`, error);
        const errorMessage: InteractionReplyOptions = {
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
        };
        safeBotReply(interaction, errorMessage);
    }
});
}

export type CommandHandlers = {
    [key in Command]: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export const commandHandlers: CommandHandlers = (
    Object.keys(commands) as Array<keyof typeof commands>
).reduce(
    (obj, key) => {
        obj[key] = (interaction) =>
            genericExecute(
                key,
                interaction,
                commands[key].optionValidator,
                commands[key].isPrivateRoute,
            );
        return obj;
    },
    {
        // add non generic commands here
        [Command.SearchPlayer]: searchPlayersHandler.execute,
    } as CommandHandlers,
);

export const commandsToRegister: SlashCommandOptionsOnlyBuilder[] = [
    ...Object.values(commands).map(createSlashCommand),
    // add non generic commands here
    searchPlayersHandler.command,
];
