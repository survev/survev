import { TeamMode } from "@survev/shared/gameConfig";
import z from "zod";

export const zSetGameModeBody = z.object({
    index: z.number(),
    team_mode: z.nativeEnum(TeamMode).optional(),
    map_name: z.string().optional(),
    enabled: z.boolean().optional(),
});

export const zSetClientThemeBody = z.object({
    theme: z.string(),
});
