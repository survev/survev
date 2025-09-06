import {
    Client,
    ComponentType,
    Events,
    GatewayIntentBits,
    type InteractionReplyOptions,
    MessageFlags,
    RepliableInteraction,
    StringSelectMenuInteraction,
} from "discord.js";
import { commandHandlers } from "./commands";
import { createSelectUI, DropdownPlayer } from "./components";
import { DISCORD_BOT_TOKEN, webhookId } from "./config";
import { type Command, hasPermission, honoClient, TIMEOUT_IN_SECONDS } from "./utils";
import { MapId, TeamModeToString } from "../../shared/defs/types/misc";

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
        if ( message.channel.isDMBased() ) return;
        if (message.webhookId !== webhookId) return;

        if ( message.embeds.length <= 0 || !message.embeds[0].url ) {
            console.log("Expected an embed, but got none");
            return;
        }

        const recordingId = message.embeds[0].url.split("/").at(-1);

        if (!recordingId) {
            await message.reply("Malformatted url.");
            return;
        }

        const res = await honoClient.reports.get_data_by_recording_id.$post({
            json: {
                recordingId: recordingId,
            },
        });

        const result = await res.json();

        if ("message" in result) {
            await message.reply(result.message);
            return;
        }

        const prettyPlayers: DropdownPlayer[] = result.map((player) => ({
            teamMode:player.teamMode,
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

        console.log({ result, prettyPlayers });

        const { embed, row } = createSelectUI(prettyPlayers, "");

        await message.reply({
            embeds: [embed],
            components: [row],
        });

        // const matchingPlayers: string[] = []

        // const onCollect = async (interaction: StringSelectMenuInteraction) => {
        //     await interaction.deferUpdate();
        //     const selectedValue = interaction.values[0];
        //     // fomrat: ban_<index>

        //     console.log({ selectedValue })
        //     await interaction.reply({
        //         content: "Dance",
        //     })
        // };

        // const collector = message.createMessageComponentCollector({
        //     // filter: (i) => i.user.id === options.originalUserId,
        //     componentType: ComponentType.StringSelect,
        //     time: TIMEOUT_IN_SECONDS * 1000,
        // });

        // collector.on("collect", async (interaction) => {
        //         await onCollect(interaction);
        //         collector.stop("completed");
        //     });
        
        // collector.on("ignore", async (interaction: RepliableInteraction) => {
        //     await interaction.reply({
        //         content: "You are not the original creator. Please create a new command.",
        //         flags: MessageFlags.Ephemeral,
        //     });
        // });
    
        // collector.on("end", async (_, reason) => {
        //     if (reason === "time") {
        //         await message.reply({
        //             content: "Timed out, please try again.",
        //             components: [],
        //             embeds: [],
        //         });
        //         return;
        //     }
        // });
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
