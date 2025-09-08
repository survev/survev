import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    ComponentType,
    Events,
    GatewayIntentBits,
    type InteractionReplyOptions,
    MessageFlags,
    RepliableInteraction,
    StringSelectMenuInteraction,
} from "discord.js";
import { MapId, TeamModeToString } from "../../shared/defs/types/misc";
import { commandHandlers } from "./commands";
import { clearEmbedWithMessage, createDiscordPlayerInfoCardUI, createSelectUI, discordCardUI, type DropdownPlayer } from "./components";
import { DISCORD_BOT_TOKEN, webhookId } from "./config";
import { type Command, hasPermission, honoClient, BOT_COLLECTOR_TIMEOUT } from "./utils";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

function setupInteractionHandlers() {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!hasPermission(interaction)) {
            if (interaction.isRepliable()) {
                await interaction.reply({
                    content: "You do not have permission to use this action.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const commandName = interaction.commandName as Command;
        if (!commandHandlers[commandName]) {
            console.warn(`Unknown command: ${commandName}`);
            return;
        }
        try {
            await commandHandlers[commandName](interaction);
        } catch (error) {
            console.error(`Error executing command "${commandName}":`, error);
            const errorMessage: InteractionReplyOptions = {
                content: "There was an error while executing this command!",
                flags: MessageFlags.Ephemeral,
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    });
}

function setupEventListeners() {
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

        const matchingPlayers: DropdownPlayer[] = result.map((player) => ({
            teamMode: player.teamMode,
            mapId: player.mapId,
            slug: player.slug,
            authId: player.authId,
            linkedDiscord: player.linkedDiscord,
            ip: player.ip,
            findGameIp: player.findGameIp,
            username: player.username,
            region: player.region,
            createdAt: new Date(player.createdAt),
        }));

        const { row } = createSelectUI(matchingPlayers, "");

        const banPlayerForCheating = new ButtonBuilder()
            .setLabel("Spam? Ignore Now")
            .setStyle(ButtonStyle.Secondary);

        const selectDropdownReply = await message.reply({
            embeds: [],
            components: [
                row,
                new ActionRowBuilder<ButtonBuilder>()
                .addComponents(banPlayerForCheating)
            ],
        });

        const collector = selectDropdownReply
            .createMessageComponentCollector({
                time: BOT_COLLECTOR_TIMEOUT,
            })
        
        collector.on("collect", async (interaction) => {
                if ( interaction.componentType === ComponentType.Button) {
                    const res = await honoClient.reports.ignore_report.$post({
                        json: {
                            reportId
                        },
                    });
                    const { message } = await res.json();
                    await clearEmbedWithMessage(selectDropdownReply, message);
                    collector.stop("completed")
                    return;
                }
                if ( interaction.componentType !== ComponentType.StringSelect ) return;

                await interaction.deferUpdate();
                const selectedValue = interaction.values[0];
                const playerIdx = parseInt(selectedValue.split("_")[1]);
                
                const { embed, row } = discordCardUI(matchingPlayers[playerIdx], playerIdx);

                await interaction.editReply({
                    embeds: [embed],
                    components: [row],
                });

                await createDiscordPlayerInfoCardUI({
                    interaction: interaction,
                    playerIdx,
                    originalUserId: interaction.user.id,
                    matchingPlayers,
                });
                collector.stop("completed")
            })
            .on("end", async (_, reason) => {
                if (reason != "time") return;
                await clearEmbedWithMessage(selectDropdownReply, "Timed out, please try again.");
            });
    });
}

try {
    client.once(Events.ClientReady, (readyClient) => {
        console.log(`Logged in as ${readyClient.user.tag}!`);
    });
    setupInteractionHandlers();
    setupEventListeners();
    await client.login(DISCORD_BOT_TOKEN);
} catch (error) {
    console.error("Failed to start the bot:", error);
    process.exit(1);
}
