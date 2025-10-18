import {
    ApplicationCommandOptionType,
    type ChatInputCommandInteraction,
    type SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { zSetClientThemeBody, zSetGameModeBody } from "../../../server/src/utils/types";
import {
    zBanAccountParams,
    zBanIpParams,
    zFindDiscordUserSlugParams,
    zGiveItemParams,
    zRemoveItemParams,
    zSetAccountNameParams,
    zSetMatchDataNameParams,
    zUnbanAccountParams,
    zUnbanIpParams,
} from "../../../shared/types/moderation";
import { Command } from "../utils";
import { createCommand, createSlashCommand, genericExecute } from "./helpers";
import { searchPlayersHandler } from "./search-player";

/**
 * for generic commands that only makes an api call and return it's meessage
 */
const commands = {
    [Command.BanIp]: createCommand({
        name: Command.BanIp,
        description: "ban an IP",
        optionValidator: zBanIpParams,
        options: [
            {
                name: "ips",
                description: "The IP to ban",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "ban_reason",
                description: "The reason for the ban",
                required: false,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "is_encoded",
                description: "If the IP is encoded or raw (defaults to true)",
                required: false,
                type: ApplicationCommandOptionType.Boolean,
            },
            {
                name: "ip_ban_duration",
                description: "The duration for the IP ban (defaults to 7 days)",
                required: false,
                type: ApplicationCommandOptionType.Integer,
            },
            {
                name: "permanent",
                description: "If the IP ban is permanent, will ignore the duration",
                required: false,
                type: ApplicationCommandOptionType.Boolean,
            },
        ],
    }),
    [Command.BanAccount]: createCommand({
        name: Command.BanAccount,
        description: "ban an account",
        optionValidator: zBanAccountParams,
        options: [
            {
                name: "slug",
                description: "The account slug to ban",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "ban_reason",
                description: "The reason for the ban",
                required: false,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "ip_ban_duration",
                description: "The duration for the IP ban (defaults to 7 days)",
                required: false,
                type: ApplicationCommandOptionType.Integer,
            },
            {
                name: "ip_ban_permanent",
                description: "If the IP ban is permanent, will ignore the duration",
                required: false,
                type: ApplicationCommandOptionType.Boolean,
            },
        ],
    }),
    [Command.UnbanAccount]: createCommand({
        name: Command.UnbanAccount,
        description: "unban an account",
        optionValidator: zUnbanAccountParams,
        options: [
            {
                name: "slug",
                description: "The account slug to unban",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
        ],
    }),
    [Command.UnbanIp]: createCommand({
        name: Command.UnbanIp,
        description: "unban an ip",
        optionValidator: zUnbanIpParams,
        options: [
            {
                name: "ip",
                description: "The ip to unban",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "is_encoded",
                description: "If the IP is encoded or raw (defaults to true)",
                required: false,
                type: ApplicationCommandOptionType.Boolean,
            },
        ],
    }),
    [Command.SetMatchDataName]: createCommand({
        name: Command.SetMatchDataName,
        description:
            "update the name of a player in a game, useful for purging bad names from leaderboards",
        optionValidator: zSetMatchDataNameParams,
        options: [
            {
                name: "current_name",
                description: "The current name of the player",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "new_name",
                description: "The new name of the player",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
        ],
    }),
    [Command.SetAccountName]: createCommand({
        name: Command.SetAccountName,
        description: "update the username of an account",
        optionValidator: zSetAccountNameParams,
        options: [
            {
                name: "current_slug",
                description: "The current slug of the account",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "new_name",
                description:
                    "The new name of the account (get randomized if not provided)",
                required: false,
                type: ApplicationCommandOptionType.String,
            },
        ],
    }),
    [Command.FindDiscordUserSlug]: createCommand({
        name: Command.FindDiscordUserSlug,
        description: "Find the slug for a discord user",
        optionValidator: zFindDiscordUserSlugParams,
        options: [
            {
                name: "discord_user",
                description: "find the in game slug for a discord user",
                required: true,
                type: ApplicationCommandOptionType.User,
            },
        ],
    }),
    [Command.GiveItem]: createCommand({
        name: Command.GiveItem,
        description: "Give an item to a user",
        optionValidator: zGiveItemParams,
        isPrivateRoute: true,
        options: [
            {
                name: "item",
                description: "The item to give",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "slug",
                description: "The account slug to give the item to",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "source",
                description: "The source of the item",
                required: false,
                type: ApplicationCommandOptionType.String,
            },
        ],
    }),
    [Command.RemoveItem]: createCommand({
        name: Command.RemoveItem,
        description: "remove an item from a user",
        optionValidator: zRemoveItemParams,
        isPrivateRoute: true,
        options: [
            {
                name: "item",
                description: "The item to remove",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "slug",
                description: "The account slug to remove the item from",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
        ],
    }),
    [Command.SetGameMode]: createCommand({
        name: Command.SetGameMode,
        description: "Sets a game mode in the API",
        optionValidator: zSetGameModeBody,
        isPrivateRoute: true,
        options: [
            {
                name: "index",
                description: "The mode index, e.g 0 for solo / first play button",
                required: true,
                type: ApplicationCommandOptionType.Integer,
            },
            {
                name: "map_name",
                description: "The map name",
                required: false,
                type: ApplicationCommandOptionType.String,
            },
            {
                name: "team_mode",
                description: "The team mode",
                required: false,
                type: ApplicationCommandOptionType.Integer,
            },
            {
                name: "enabled",
                description: "If the mode is enabled",
                required: false,
                type: ApplicationCommandOptionType.Boolean,
            },
        ],
    }),
    [Command.SetClientTheme]: createCommand({
        name: Command.SetClientTheme,
        description: "Sets the client theme in the API",
        optionValidator: zSetClientThemeBody,
        isPrivateRoute: true,
        options: [
            {
                name: "theme",
                description: "The client theme",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
        ],
    }),
};

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
