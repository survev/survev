import {
    ApplicationCommandOptionType,
    type ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import type z from "zod";
import { botLogger, type Command, honoClient, isAdmin } from "../utils";

export function createCommand<T extends z.ZodSchema>(config: {
    name: Command;
    description: string;
    optionValidator: T;
    isPrivateRoute?: boolean;
    options: {
        name: keyof z.input<T>;
        description: string;
        required: boolean;
        type:
            | ApplicationCommandOptionType.String
            | ApplicationCommandOptionType.Integer
            | ApplicationCommandOptionType.Boolean
            | ApplicationCommandOptionType.User;
    }[];
}) {
    return config;
}

export async function genericExecute<N extends Exclude<Command, "search_player">>(
    name: N,
    interaction: ChatInputCommandInteraction,
    validator: z.ZodTypeAny,
    isPrivateRoute = false,
) {
    await interaction.deferReply();

    const options = interaction.options.data.reduce(
        (obj, { name, value }) => {
            obj[name] = value;
            return obj;
        },
        {} as Record<string, unknown>,
    );

    const args = validator.safeParse({
        ...options,
        executor_id: interaction.user.id,
    });

    if (!args.success) {
        botLogger.error("Failed to parse arguments", options, args.error);
        await interaction.reply({
            content: "Invalid arguments",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (isPrivateRoute) {
        await handlePrivateRoute(interaction, name, args.data);
        return;
    }

    // @ts-expect-error - we don't care at this point
    const res = await honoClient.moderation[name].$post({
        json: args.data as any,
    });
    const { message } = await res.json();
    await interaction.editReply(message);
}

async function handlePrivateRoute(
    interaction: ChatInputCommandInteraction,
    name: any,
    payload: any,
) {
    if (!isAdmin(interaction)) {
        await sendNoPermissionMessage(interaction);
        return;
    }

    // @ts-expect-error - we don't care at this point
    const res = await honoClient[name].$post({
        json: payload,
    });
    const { message } = await res.json();
    await interaction.editReply(message);
}

export function createSlashCommand(config: ReturnType<typeof createCommand>) {
    const builder = new SlashCommandBuilder()
        .setName(config.name)
        .setDescription(config.description);

    const configureBuilderOption = (opt: any, option: any) =>
        opt
            .setName(option.name as string)
            .setDescription(option.description)
            .setRequired(option.required);

    for (const option of config.options) {
        switch (option.type) {
            case ApplicationCommandOptionType.String:
                builder.addStringOption((opt) => configureBuilderOption(opt, option));
                break;
            case ApplicationCommandOptionType.Integer:
                builder.addIntegerOption((opt) => configureBuilderOption(opt, option));
                break;
            case ApplicationCommandOptionType.Boolean:
                builder.addBooleanOption((opt) => configureBuilderOption(opt, option));
                break;
            case ApplicationCommandOptionType.User:
                builder.addUserOption((opt) => configureBuilderOption(opt, option));
                break;
            default:
                throw new Error(`Unsupported option type: ${option.type}, add it first.`);
        }
    }

    return builder;
}

export async function sendNoPermissionMessage(interaction: ChatInputCommandInteraction) {
    if (!interaction.isRepliable()) return;
    const errorMessage = {
        content: "You do not have permission to use this action.",
        flags: MessageFlags.Ephemeral,
    } as const;
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
    } else {
        await interaction.reply(errorMessage);
    }
}
