import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type Client,
    ComponentType,
    Events,
} from "discord.js";
import {
    clearEmbedWithMessage,
    createDiscordPlayerInfoCardUI,
    createSelectUI,
    type DropdownPlayer,
    discordCardUI,
} from "../components";
import { webhookId } from "../config";
import { BOT_COLLECTOR_TIMEOUT, honoClient } from "../utils";

export async function setupEventListeners(client: Client) {
    client.on(Events.MessageCreate, async (message) => {
        if (message.channel.isDMBased()) return;
        if (message.webhookId !== webhookId) return;

        if (message.embeds.length <= 0 || !message.embeds[0].url) {
            console.log("Expected an embed, but got none");
            return;
        }

        const reportId = message.embeds[0].url.split("/").at(-1);

        if (!reportId) {
            await message.reply("Malformatted url.");
            return;
        }

        const res = await honoClient.reports.get_data_by_recording_id.$post({
            json: {
                reportId: reportId,
            },
        });

        if (!res.ok) {
            await message.reply("Failed to get data from server.");
            return;
        }

        const result = await res.json();

        if ("message" in result) {
            await message.reply(result.message);
            return;
        }

        const matchingPlayers: DropdownPlayer[] = result;

        const { row } = createSelectUI(matchingPlayers, "");

        const banPlayerForCheating = new ButtonBuilder()
            .setLabel("Spam? Ignore Now")
            .setStyle(ButtonStyle.Secondary);

        const selectDropdownReply = await message.reply({
            embeds: [],
            components: [
                row,
                new ActionRowBuilder<ButtonBuilder>().addComponents(banPlayerForCheating),
            ],
        });

        const collector = selectDropdownReply.createMessageComponentCollector({
            time: BOT_COLLECTOR_TIMEOUT,
        });

        collector
            .on("collect", async (interaction) => {
                if (interaction.componentType === ComponentType.Button) {
                    const res = await honoClient.reports.ignore_report.$post({
                        json: {
                            reportId,
                        },
                    });
                    const { message } = await res.json();
                    await clearEmbedWithMessage(selectDropdownReply, message);
                    collector.stop("completed");
                    return;
                }
                if (interaction.componentType !== ComponentType.StringSelect) return;

                await interaction.deferUpdate();
                const selectedValue = interaction.values[0];
                const playerIdx = parseInt(selectedValue.split("_")[1]);

                const { embed, row } = discordCardUI(
                    matchingPlayers[playerIdx],
                    playerIdx,
                );

                await interaction.editReply({
                    embeds: [embed],
                    components: [row],
                });

                await createDiscordPlayerInfoCardUI({
                    interaction: interaction,
                    playerIdx,
                    originalUserId: interaction.user.id,
                    matchingPlayers,
                    reportId,
                });
                collector.stop("completed");
            })
            .on("end", async (_, reason) => {
                if (reason != "time") return;
                await clearEmbedWithMessage(
                    selectDropdownReply,
                    "Timed out, please try again.",
                );
            });
    });
}
