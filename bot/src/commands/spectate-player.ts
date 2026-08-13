import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { ModRouterSpectateGameRes } from "../../../server/src/utils/types.ts";
import { GameConfig } from "../../../shared/gameConfig.ts";
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
        if (!hasBotPermission(interaction)) {
            await sendNoPermissionMessage(interaction);
            return;
        }

        const type = interaction.options.getString("type") as "user_id" | "player_name";
        const value = interaction.options.getString("value")!;

        await interaction.deferReply();

        // Stupid thing that updates the message as it gets more responses from servers :)
        const responses: ModRouterSpectateGameRes[] = [];
        // @HACK we should probably have a `clientUrl` config...
        const clientUrl = URL.canParse(Config.oauthBasePath) ? Config.oauthBasePath : Config.oauthRedirectURI;

        const editReply = async (done: boolean) => {
            const playerData: Array<{ region: string; data: string; url: string }> = responses.map(data => {
                return data.players.map((gameData) => {
                    const joinData = gameData.data;

                    const url = new URL(clientUrl);
                    // shortened because long URLs make the discord message run out of characters faster...
                    url.searchParams.set("u", btoa(joinData.urls.join(",")));
                    url.searchParams.set("jt", joinData.joinToken);

                    return {
                        region: data.region,
                        data: `${gameData.gameId.slice(0, 6)} - ${
                            GameConfig.TeamModeToString[gameData.teamMode]
                        } - ${gameData.mapName}`,
                        url: `[Join Link](${url.toString()})`,
                    };
                });
            }).flat();

            const embed = new EmbedBuilder().setColor(done ? 0x00ff00 : 0xffff00);

            let title = "Searching...";

            if (playerData.length) {
                const columnWidths = playerData.reduce((a, b) => {
                    for (const [key, value] of Object.entries(b)) {
                        a[key] = Math.max(a[key] ?? 0, value.length);
                    }
                    return a;
                }, { region: 8, data: 25 } as Record<string, number>);

                let playerCount = 0;

                let text = "**";
                const addRow = (value: { region: string; data: string; url: string }) => {
                    let newRow = "";
                    newRow += `\`${value.region.padEnd(columnWidths.region)}`;
                    newRow += `| ${value.data.padEnd(columnWidths.data)} |\``;
                    newRow += ` ${value.url}\n`;

                    // i hate discord limits
                    if (text.length + newRow.length < 4096) {
                        text += newRow;
                        playerCount++;
                    }
                };
                addRow({ region: "Region", data: "Game info", url: "URL" });
                text += "**";
                for (const data of playerData) {
                    addRow(data);
                }

                embed.setDescription(text);
                embed.setFooter({
                    text:
                        "NOTE: Join links are one time use and expire after 1 minute, if the target player died or if the game ended.",
                });
                if (done) {
                    title = `Found ${playerCount} player${playerCount > 1 ? "s" : ""} with ${
                        type === "player_name" ? "name" : "slug"
                    } \`${value}\`.`;
                }
            } else if (done) {
                title = "No player found matching the filter";
            }
            embed.setTitle(title);

            await interaction.editReply({
                embeds: [embed],
            });
        };

        const res = await honoClient.moderation.spectate_player.$post({
            json: {
                filter: {
                    type,
                    value,
                },
            },
        });

        // this can be undefined apparently??
        if (!res.body) {
            await interaction.editReply({
                content: "Failed to find players to spectate",
            });
            return;
        }
        const decoder = new TextDecoderStream();
        res.body.pipeTo(decoder.writable);

        for await (const read of decoder.readable) {
            const values = read.split("\n");

            for (const value of values) {
                if (!value) continue;

                try {
                    const jsonRes = JSON.parse(value) as { message: string } | ModRouterSpectateGameRes;

                    // for API errors like user not found
                    if ("message" in jsonRes) {
                        await interaction.editReply({
                            content: jsonRes.message,
                        });
                        return;
                    }

                    responses.push(jsonRes);
                    await editReply(jsonRes.done);
                } catch (e) {
                    botLogger.error("Failed to parse API response:", e);
                }
            }
        }
        await editReply(true);
    },
};
