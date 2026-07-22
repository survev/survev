import type { LootSpawnerDef } from "../mapObjectsTyping.ts";
import { autoLoot, tierLoot } from "./mapObjectHelpers.ts";

export const LootSpawnerDefs: Record<string, LootSpawnerDef> = {
    loot_tier_1: {
        type: "loot_spawner",
        loot: [tierLoot("tier_world", 1, 1)],
        terrain: { grass: true, beach: true, riverShore: true },
    },
    loot_tier_2: {
        type: "loot_spawner",
        loot: [tierLoot("tier_container", 1, 1)],
        terrain: { grass: true, beach: true, riverShore: true },
    },
    loot_tier_beach: {
        type: "loot_spawner",
        loot: [tierLoot("tier_world", 1, 1)],
        terrain: { grass: false, beach: true },
    },
    loot_tier_surviv: {
        type: "loot_spawner",
        loot: [tierLoot("tier_surviv", 1, 1)],
        terrain: { grass: true, beach: true, riverShore: true },
    },
    loot_tier_vault_floor: {
        type: "loot_spawner",
        loot: [tierLoot("tier_vault_floor", 1, 1)],
    },
    loot_tier_police_floor: {
        type: "loot_spawner",
        loot: [tierLoot("tier_police_floor", 1, 1)],
    },
    loot_tier_mansion_floor: {
        type: "loot_spawner",
        loot: [tierLoot("tier_mansion_floor", 1, 1)],
    },
    loot_tier_sv98: {
        type: "loot_spawner",
        loot: [tierLoot("tier_sv98", 1, 1)],
    },
    loot_tier_scopes_sniper: {
        type: "loot_spawner",
        loot: [tierLoot("tier_scopes_sniper", 1, 1)],
    },
    loot_tier_woodaxe: {
        type: "loot_spawner",
        loot: [tierLoot("tier_woodaxe", 1, 1)],
    },
    // loot_tier_fireaxe: {
    //     type: "loot_spawner",
    //     loot: [tierLoot("tier_fireaxe", 1, 1)],
    // },
    loot_tier_stonehammer: {
        type: "loot_spawner",
        loot: [tierLoot("tier_stonehammer", 1, 1)],
    },
    loot_tier_barn_melee: {
        type: "loot_spawner",
        loot: [tierLoot("tier_barn_melee", 1, 1)],
    },
    loot_tier_hatchet_melee: {
        type: "loot_spawner",
        loot: [tierLoot("tier_hatchet_melee", 1, 1)],
    },
    loot_tier_club_melee: {
        type: "loot_spawner",
        loot: [tierLoot("tier_club_melee", 1, 1)],
    },
    loot_tier_leaf_pile: {
        type: "loot_spawner",
        loot: [tierLoot("tier_leaf_pile", 1, 1)],
    },
    loot_tier_islander_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_islander_outfit", 1, 1)],
    },
    loot_tier_verde_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_verde_outfit", 1, 1)],
    },
    loot_tier_lumber_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_lumber_outfit", 1, 1)],
    },
    loot_tier_imperial_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_imperial_outfit", 1, 1)],
    },
    loot_tier_pineapple_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_pineapple_outfit", 1, 1)],
    },
    loot_tier_tarkhany_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_tarkhany_outfit", 1, 1)],
    },
    loot_tier_spetsnaz_outfit: {
        type: "loot_spawner",
        loot: [tierLoot("tier_spetsnaz_outfit", 1, 1)],
    },
    // loot_tier_eye_01: {
    //     type: "loot_spawner",
    //     loot: [tierLoot("tier_eye_01", 1, 1)],
    // },
    loot_tier_eye_02: {
        type: "loot_spawner",
        loot: [tierLoot("tier_eye_02", 1, 1)],
    },
    loot_tier_saloon: {
        type: "loot_spawner",
        loot: [tierLoot("tier_saloon", 1, 1)],
    },
    loot_tier_chrys_01: {
        type: "loot_spawner",
        loot: [tierLoot("tier_chrys_01", 1, 1)],
    },
    loot_tier_chrys_02: {
        type: "loot_spawner",
        loot: [tierLoot("tier_chrys_02", 1, 1)],
    },
    // loot_tier_chrys_02b: {
    //     type: "loot_spawner",
    //     loot: [tierLoot("tier_chrys_02b", 1, 1)],
    // },
    loot_tier_chrys_03: {
        type: "loot_spawner",
        loot: [tierLoot("tier_chrys_03", 1, 1)],
    },
    loot_tier_airdrop_armor: {
        type: "loot_spawner",
        loot: [tierLoot("tier_airdrop_armor", 1, 1)],
    },
    // loot_tier_helmet_potato: {
    //     type: "loot_spawner",
    //     loot: [tierLoot("tier_potato_helmet", 1, 1)],
    //     terrain: { grass: true, beach: false },
    // },
    loot_tier_perk_test: {
        type: "loot_spawner",
        loot: [
            autoLoot("explosive", 1),
            autoLoot("splinter", 1),
            autoLoot("scavenger_adv", 1),
        ],
        terrain: { grass: true, beach: false },
    },
    loot_tier_sniper_test: {
        type: "loot_spawner",
        loot: [
            autoLoot("l86", 1),
            autoLoot("svd", 1),
            autoLoot("vss", 1),
            autoLoot("blr", 1),
            autoLoot("scarssr", 1),
        ],
        terrain: { grass: true, beach: false },
    },
    loot_tier_loot_test: {
        type: "loot_spawner",
        loot: [
            autoLoot("explosive", 1),
            autoLoot("backpack03", 1),
            autoLoot("chest03", 1),
            autoLoot("helmet03", 1),
            autoLoot("scavenger_adv", 1),
            autoLoot("explosive", 1),
            autoLoot("splinter", 1),
            autoLoot("p30l", 1),
            autoLoot("p30l", 1),
            autoLoot("p30l", 1),
            autoLoot("p30l", 1),
            autoLoot("deagle", 1),
            autoLoot("deagle", 1),
            autoLoot("deagle", 1),
            autoLoot("ots38_dual", 1),
        ],
        terrain: { grass: true, beach: false },
    },
    loot_tier_helmet_forest: {
        type: "loot_spawner",
        loot: [tierLoot("tier_forest_helmet", 1, 1)],
        terrain: { grass: true, beach: false },
    },
};
