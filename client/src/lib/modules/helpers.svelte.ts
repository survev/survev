import { type MapDefKey, MapDefs } from "@/shared/defs/mapDefs.ts";
import { SvelteURLSearchParams } from "svelte/reactivity";

/**
 * Helpers v2. Will eventually be used as the main one.
 */
export const helpers = {
    /**
     * `AbortSignal` polyfill.
     * @param timeout The duration, in milliseconds, to abort the request.
     * @returns
     */
    abortSignal(timeout: number): AbortSignal {
        if ("timeout" in AbortSignal) return AbortSignal.timeout(timeout);

        const controller = new AbortController();
        setTimeout(() => {
            controller.abort(
                new DOMException("The operation timed out.", "TimeoutError"),
            );
        }, timeout);

        return controller.signal;
    },

    /**
     * Obtain the relative path for an emote.
     * @param img The emote name.
     */
    emoteImgToSvg(img: string): string {
        return img && img.length > 4 ? `../img/emotes/${img.slice(0, -4)}.svg` : "";
    },

    /**
     * Safely fetch a URL without having to handle errors.
     * @param url The URL to fetch.
     * @param init Request options.
     */
    async fetchSafe<T>(
        url: string | URL | Request,
        init?: RequestInit,
    ): Promise<{ success: false } | { success: true; data: T }> {
        try {
            const res = await fetch(url, init);
            if (res.status !== 200) {
                return {
                    success: false,
                };
            }

            const data = await res.json();
            return {
                success: true,
                data,
            };
        } catch (_e) {
            return {
                success: false,
            };
        }
    },

    /**
     * Format a time into minutes and seconds.
     * @param time The time, in seconds.
     */
    formatTime(time: number): string {
        const minutes = Math.floor(time / 60) % 60;
        const seconds = (Math.floor(time) % 60).toString().padStart(2, "0");

        return `${minutes}:${seconds}`;
    },

    /**
     * Get a querystring parameter by its name.
     * @param name The name of the parameter.
     */
    getParameterByName<T extends string>(name: string): T {
        const params = new SvelteURLSearchParams(window.location.search);
        return (params.get(name) || "") as T;
    },

    /**
     * Obtain gamemodes from map definitions.
     */
    getGameModes() {
        const gameModes: Array<{
            mapId: number;
            desc: Record<"buttonCss" | "icon" | "name", string>;
        }> = [];

        // Gather unique mapIds and assosciated descriptions from the list of maps.
        const mapKeys = Object.keys(MapDefs);
        for (let i = 0; i < mapKeys.length; i++) {
            const mapKey = mapKeys[i] as MapDefKey;
            const mapDef = MapDefs[mapKey];

            if (!gameModes.find(x => x.mapId == mapDef.mapId)) {
                gameModes.push({
                    mapId: mapDef.mapId,
                    desc: mapDef.desc,
                });
            }
        }

        gameModes.sort((a, b) => a.mapId - b.mapId);
        return gameModes;
    },
};
