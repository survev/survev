import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { InferResponseType } from "hono";
import { createDiscordDropdownUI } from "../components";
import { botLogger, Command, hasBotPermission, honoClient } from "../utils";
import { sendNoPermissionMessage } from "./helpers";

export type SelectedPlayer = Extract<
    InferResponseType<typeof honoClient.moderation.get_player_ip.$post, 200>,
    any[]
>[number];

export const BUTTON_PREFIXES = {
    BAN_FOR_CHEATING: `search_player_ban_for_cheating_`,
    BAN_FOR_BAD_NAME: `search_player_ban_for_name_`,
} as const;

export const searchPlayersHandler = {
    command: new SlashCommandBuilder()
        .setName(Command.SearchPlayer)
        .setDescription("Search and ban a player by name")
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name of the player to search for")
                .setRequired(true),
        )
        .addBooleanOption((option) =>
            option
                .setName("use_account_slug")
                .setDescription(
                    "If should search for account slugs instead of in-game names (defaults to false)",
                )
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("game_id")
                .setDescription("Specify a specific game to search for")
                .setRequired(false),
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const searchName = interaction.options.getString("name")!;
        const useSlug = interaction.options.getBoolean("use_account_slug") || false;
        const gameId = interaction.options.getString("game_id") || undefined;

        await interaction.deferReply();

        if (!hasBotPermission(interaction)) {
            await sendNoPermissionMessage(interaction);
            return;
        }

        try {
            const res = await honoClient.moderation.get_player_ip.$post({
                json: {
                    name: searchName!,
                    use_account_slug: useSlug,
                    game_id: gameId,
                },
            });

            if (!res.ok) {
                await interaction.editReply({
                    content: "Failed to get player IP",
                });
                return;
            }

            const result = await res.json();

            // no player found, return message formatted by the api;
            if ("message" in result) {
                await interaction.editReply({
                    content: result.message,
                });
                return;
            }

            const matchingPlayers = result;

            await createDiscordDropdownUI(interaction, matchingPlayers, searchName);
        } catch (error) {
            botLogger.error("Error in banplayer command:", error);
            await interaction.editReply({
                content: "An error occurred while searching for players.",
            });
        }
    },
};
