import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { InferResponseType } from "hono";
import { createDiscordDropdownUI } from "../components.ts";
import { Config } from "../config.ts";
import { botLogger, Command, hasBotPermission, honoClient } from "../utils.ts";
import { sendNoPermissionMessage } from "./helpers.ts";

export const spectateCommandHandler = {
    command: new SlashCommandBuilder()
        .setName(Command.SpectatePlayer)
        .setDescription("Search a player to spectate")
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription("The slug of the player to spectate")
                .setChoices([
                    { name: "Use slug", value: "user_id" },
                    { name: "Use in-game name", value: "player_name" },
                ])
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("value")
                .setDescription("The name or account slug of the player to spectate")
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getString("type") as "user_id" | "player_name";
        const value = interaction.options.getString("value")!;

        await interaction.deferReply();

        if (!hasBotPermission(interaction)) {
            await sendNoPermissionMessage(interaction);
            return;
        }

        try {
            const res = await honoClient.moderation.spectate_player.$post({
                json: {
                    filter: {
                        type,
                        value,
                    },
                },
            });

            if (!res.ok) {
                await interaction.editReply({
                    content: "Failed to find players to spectate",
                });
                return;
            }

            const result = await res.json();
            if ("message" in result) {
                await interaction.editReply({
                    content: result.message,
                });
                return;
            }

            // @HACK
            const clientUrl = URL.canParse(Config.oauthBasePath) ? Config.oauthBasePath : Config.oauthRedirectURI;

            await interaction.editReply({
                content: result.res.map(s => {
                    const url = new URL(clientUrl);
                    url.searchParams.set("joinData", btoa(JSON.stringify(s)));
                    return url.toString();
                }).join("\n"),
            });

            return;
        } catch (error) {
            botLogger.error("Error in spectate player command:", error);
            await interaction.editReply({
                content: "An error occurred while searching for players to spectate.",
            });
        }
    },
};
