import { z } from "zod";

import { GameObjectDefs } from "../defs/gameObjectDefs";
import { UnlockDefs } from "../defs/gameObjects/unlockDefs";
import { GameConfig } from "../gameConfig";
import { deepEqual } from "./deepEqual";

export type Item = {
    type: string;
    timeAcquired: number;
    source: string;
    status?: ItemStatus;
    ackd?: ItemStatus.Ackd;
};

export const loadoutSchema = z.object({
    outfit: z.string(),
    melee: z.string(),
    heal: z.string(),
    boost: z.string(),
    player_icon: z.string(),
    crosshair: z.object({
        type: z.string(),
        color: z.number(),
        size: z.string(),
        stroke: z.string(),
    }),
    emotes: z.array(z.string()).length(6),
});

export type Loadout = z.infer<typeof loadoutSchema>;
export type Crosshair = Loadout["crosshair"];

export enum ItemStatus {
    New,
    Confirmed,
    Ackd,
}

export const loadout = {
    ItemStatus,
    validate: (userLoadout: Loadout): Loadout => {
        const getGameType = (type: string, gameType: string, defaultValue: string) => {
            const def = GameObjectDefs[gameType];
            if (def && def.type == type) {
                return gameType;
            }
            return defaultValue;
        };
        const getFloat = (flt: string, defaultValue: number) => {
            const val = parseFloat(flt);
            if (Number.isNaN(val)) {
                return defaultValue;
            }
            return val;
        };
        const mergedLoadout = {
            ...{
                crosshair: {
                    type: "",
                    color: 0xffffff,
                    size: 1,
                    stroke: 0,
                },
                emotes: [],
            },
            ...userLoadout,
        } as Loadout;
        const validatedLoadout: Loadout = {
            outfit: getGameType("outfit", mergedLoadout.outfit, "outfitBase"),
            melee: getGameType("melee", mergedLoadout.melee, "fists"),
            heal: getGameType("heal_effect", mergedLoadout.heal, "heal_basic"),
            boost: getGameType("boost_effect", mergedLoadout.boost, "boost_basic"),
            player_icon: getGameType("emote", mergedLoadout.player_icon, ""),
            crosshair: {
                type: getGameType(
                    "crosshair",
                    mergedLoadout.crosshair.type,
                    "crosshair_default",
                ),
                color:
                    parseInt(mergedLoadout.crosshair.color as unknown as string) ||
                    0xffffff,
                size: getFloat(mergedLoadout.crosshair.size, 1).toFixed(2),
                stroke: getFloat(mergedLoadout.crosshair.stroke, 0).toFixed(2),
            },
            emotes: [] as string[],
        };

        const defaultEmotes = GameConfig.defaultEmoteLoadout.slice();
        for (let i = 0; i < GameConfig.EmoteSlot.Count; i++) {
            const inputEmote =
                i < mergedLoadout.emotes.length ? mergedLoadout.emotes[i] : "";
            validatedLoadout.emotes.push(
                getGameType("emote", inputEmote, defaultEmotes[i]),
            );
        }
        return validatedLoadout;
    },
    validateWithAvailableItems: (userLoadout: Loadout, userItems: { type: string }[]) => {
        const unlockedItems = new Set([
            ...(userItems?.map((item) => item.type) || []),
            ...UnlockDefs.unlock_default.unlocks,
        ]);
        const checkTypeExists = (type: string) => {
            if (type && unlockedItems.has(type)) {
                return type;
            }
            return "";
        };
        const newLoadout: Loadout = {
            ...{
                crosshair: {},
                emotes: [],
            },
            ...userLoadout,
        };
        const itemsToCheck = ["outfit", "melee", "heal", "boost", "player_icon"] as const;

        itemsToCheck.forEach((item) => {
            newLoadout[item] = checkTypeExists(newLoadout[item]);
        });

        newLoadout.crosshair.type = checkTypeExists(newLoadout.crosshair.type);

        newLoadout.emotes = newLoadout.emotes.map((emote) => checkTypeExists(emote));

        return loadout.validate(newLoadout);
    },
    defaultLoadout: () => loadout.validate({} as Loadout),
    modified: (a: Loadout, b: Loadout) => !deepEqual(a, b),
    getUserAvailableItems: (heroItems: Item[]) => {
        const items: typeof heroItems = [];
        // Add default items
        const unlockDefaultDef =
            GameObjectDefs.unlock_default as unknown as (typeof UnlockDefs)["unlock_default"];
        for (let i = 0; i < unlockDefaultDef.unlocks.length; i++) {
            const unlock = unlockDefaultDef.unlocks[i];
            items.push({
                type: unlock,
                source: "unlock_default",
                timeAcquired: 0,
                ackd: loadout.ItemStatus.Ackd,
            });
        }
        for (let i = 0; i < heroItems.length; i++) {
            items.push(heroItems[i]);
        }
        return items;
    },
};
export default loadout;
