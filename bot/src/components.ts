import type { ButtonInteraction } from "discord.js";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    type RepliableInteraction,
    StringSelectMenuBuilder,
    type StringSelectMenuInteraction,
} from "discord.js";
import { BUTTON_PREFIXES, type SelectedPlayer } from "./commands/search-player";
import { createCollector, formatDate, honoClient } from "./utils";

export async function createDiscordDropdownUI(
    interaction: RepliableInteraction,
    matchingPlayers: SelectedPlayer[],
    searchName: string,
) {
    const originalUserId = interaction.user.id;
    const options = matchingPlayers.map((player, index) => {
        const slug = player.slug ? ` (slug: ${player.slug})` : "";

        return {
            label: `[${player.region}] - ${player.mapId.toLowerCase()} - ${player.teamMode} - ${player.username} ${slug}`,
            description: `Played at: ${formatDate(player.createdAt)}`,
            value: `ban_${index}`,
        };
    });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("player_ban_select")
        .setPlaceholder("Select a player to ban")
        .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Multiple Players Found")
        .setDescription(
            `Found ${matchingPlayers.length} players matching "${searchName}". Please select one to ban:`,
        )
        .setTimestamp();

    const response = await interaction.editReply({
        embeds: [embed],
        components: [row],
    });

    createCollector({
        response,
        options: {
            originalUserId,
            componentType: ComponentType.StringSelect,
            interaction,
        },
        onCollect: async (interaction: StringSelectMenuInteraction) => {
            await interaction.deferUpdate();
            const selectedValue = interaction.values[0];
            // fomrat: ban_<index>
            const playerIndex = parseInt(selectedValue.split("_")[1]);

            const selectedPlayer = matchingPlayers[playerIndex];

            await createDiscordPlayerInfoCardUI({
                interaction,
                selectedPlayer,
                playerIdx: playerIndex,
                originalUserId,
                matchingPlayers,
            });
        },
    });
}

export async function createDiscordPlayerInfoCardUI({
    interaction,
    selectedPlayer,
    playerIdx,
    originalUserId,
    matchingPlayers,
}: {
    interaction: RepliableInteraction;
    selectedPlayer: SelectedPlayer;
    playerIdx: number;
    originalUserId: string;
    matchingPlayers: SelectedPlayer[];
}) {
    const fields = getEmbedFields(selectedPlayer);

    const embed = new EmbedBuilder()
        .setColor(0xff4500)
        .setTitle("Info")
        .addFields(fields)
        .setDescription("I'm a description, I should describe.")
        .setTimestamp()
        .setFooter({ text: "hammer time baby" });

    const banPlayerForCheating = new ButtonBuilder()
        .setCustomId(`${BUTTON_PREFIXES.BAN_FOR_CHEATING}${playerIdx}`)
        .setLabel("Ban For Cheating")
        .setStyle(ButtonStyle.Secondary);

    const banPlayerForBadName = new ButtonBuilder()
        .setCustomId(`${BUTTON_PREFIXES.BAN_FOR_BAD_NAME}${playerIdx}`)
        .setLabel("Ban For Bad Name")
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(banPlayerForCheating)
        .addComponents(banPlayerForBadName);

    const response = await interaction.editReply({
        embeds: [embed],
        components: [row],
    });

    createCollector({
        response,
        options: {
            originalUserId,
            componentType: ComponentType.Button,
            interaction,
        },
        onCollect: async (interaction: ButtonInteraction) => {
            await interaction.deferUpdate();

            const parts = interaction.customId.split("_");
            const playerIndex = parseInt(parts[parts.length - 1]);

            const selectedPlayer = matchingPlayers[playerIndex];
            const executorId = interaction.user.id;

            const { ipBanDuration, banReason } = interaction.customId.startsWith(
                BUTTON_PREFIXES.BAN_FOR_CHEATING,
            )
                ? {
                      banReason: "Banned for cheating",
                      ipBanDuration: 30,
                  }
                : {
                      banReason: "Banned for bad name",
                      ipBanDuration: 7,
                  };

            if (selectedPlayer.slug) {
                const res = await honoClient.moderation.ban_account.$post({
                    json: {
                        slug: selectedPlayer.slug,
                        ban_reason: banReason,
                        ip_ban_duration: ipBanDuration,
                        ban_associated_ips: true,
                        ip_ban_permanent: false,
                        executor_id: executorId,
                    },
                });
                const { message } = await res.json();
                await clearEmbedWithMessage(interaction, message);
                return;
            }

            const ipsToBan = [selectedPlayer.ip];
            if (selectedPlayer.findGameIp !== selectedPlayer.ip) {
                ipsToBan.push(selectedPlayer.findGameIp);
            }

            const res = await honoClient.moderation.ban_ip.$post({
                json: {
                    ips: ipsToBan,
                    ip_ban_duration: ipBanDuration,
                    ban_reason: banReason,
                    is_encoded: true,
                    executor_id: executorId,
                },
            });

            const { message } = await res.json();
            await clearEmbedWithMessage(interaction, message);
        },
    });
}

export async function clearEmbedWithMessage(
    interaction: RepliableInteraction,
    content: string,
) {
    await interaction.editReply({
        content,
        components: [],
        embeds: [],
    });
}

function getEmbedFields(selectedPlayer: SelectedPlayer) {
    const fields = [
        { name: "Player Name", value: selectedPlayer.username, inline: true },
        { name: "Team Mode", value: selectedPlayer.teamMode, inline: true },
        { name: "Map", value: selectedPlayer.mapId, inline: true },
        {
            name: "Region",
            value: `[${selectedPlayer.region.toUpperCase()}]`,
            inline: true,
        },
    ];

    if (selectedPlayer.slug) {
        fields.push({ name: "Slug", value: selectedPlayer.slug, inline: true });
    }
    if (selectedPlayer.linkedDiscord && selectedPlayer.authId) {
        fields.push({ name: "Discord ID", value: selectedPlayer.authId, inline: true });
    }

    if (
        selectedPlayer.findGameIp === undefined ||
        selectedPlayer.findGameIp === selectedPlayer.ip
    ) {
        fields.push({
            name: "IP Address (Find Game IP is the same)",
            value: selectedPlayer.ip,
            inline: false,
        });
    } else {
        fields.push(
            { name: "IP Address", value: selectedPlayer.ip, inline: false },
            { name: "Find Game IP", value: selectedPlayer.findGameIp, inline: false },
        );
    }

    fields.push({
        name: "Played at",
        value: formatDate(selectedPlayer.createdAt),
        inline: false,
    });

    return fields;
}
