import { api } from "../../api.ts";

export const statsPreview = import.meta.env.DEV && new URLSearchParams(location.search).get("preview") === "1";

export function statsUrl(path: string): string {
    if (statsPreview) {
        path = path.replace("/api/ranked_stats/profile", "/api/stats_preview/ranked_profile")
            .replace("/api/ranked_stats/leaderboard", "/api/stats_preview/ranked_leaderboard")
            .replace(/^\/api\/(user_stats|leaderboard|match_history|match_data)$/, "/api/stats_preview/$1");
    }
    return api.resolveUrl(path);
}

export function statsLink(params: Record<string, string> = {}): string {
    const query = new URLSearchParams(params);
    if (statsPreview) query.set("preview", "1");
    return `/stats/?${query}`;
}
