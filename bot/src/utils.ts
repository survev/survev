import type {
    ButtonInteraction,
    ComponentType,
    Interaction,
    Message,
    RepliableInteraction,
    StringSelectMenuInteraction,
} from "discord.js";
import { MessageFlags, PermissionFlagsBits } from "discord.js";
import { hc } from "hono/client";
import type { PrivateRouteApp } from "../../server/src/api/routes/private/private";
import { API_URL, Config, DISCORD_GUILD_ID, DISCORD_ROLE_ID } from "./config";

// we love enums
export const enum Command {
    BanIp = "ban_ip",
    FindDiscordUserSlug = "find_discord_user_slug",
    BanAccount = "ban_account",
    SearchPlayer = "search_player",
    UnbanAccount = "unban_account",
    UnbanIp = "unban_ip",
    SetMatchDataName = "set_match_data_name",
    SetAccountName = "set_account_name",
}

export const honoClient = hc<PrivateRouteApp>(API_URL, {
    headers: {
        "survev-api-key": Config.secrets.SURVEV_API_KEY,
    },
});

export function hasPermission(interaction: Interaction): boolean {
    if (interaction.guild?.id !== DISCORD_GUILD_ID) {
        return false;
    }

    if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return true;
    }

    if (interaction.inCachedGuild()) {
        return interaction.member.roles.cache.has(DISCORD_ROLE_ID);
    }

    return false;
}

const TIMEOUT_IN_SECONDS = 60;

/**
 * generic collector that handles timeouts and only allows interactions buy the original user
 */
export function createCollector<
    T extends ButtonInteraction | StringSelectMenuInteraction,
>({
    response,
    onCollect,
    options,
}: {
    response: Message;
    onCollect: (interaction: T) => Promise<void>;
    options: {
        interaction: RepliableInteraction;
        originalUserId: string;
        componentType: ComponentType.Button | ComponentType.StringSelect;
    };
}) {
    const collector = response.createMessageComponentCollector({
        filter: (i) => i.user.id === options.originalUserId,
        componentType: options.componentType,
        time: TIMEOUT_IN_SECONDS * 1000,
    });

    collector.on("collect", async (interaction: T) => {
        await onCollect(interaction);
        collector.stop("completed");
    });

    collector.on("ignore", async (interaction: RepliableInteraction) => {
        await interaction.reply({
            content: "You are not the original creator. Please create a new command.",
            flags: MessageFlags.Ephemeral,
        });
    });

    collector.on("end", async (_, reason) => {
        if (reason === "time") {
            await options.interaction.editReply({
                content: "Timed out, please try again.",
                components: [],
                embeds: [],
            });
            return;
        }
    });
}

export function formatDate(date?: string) {
    return date
        ? new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "Unknown";
}
