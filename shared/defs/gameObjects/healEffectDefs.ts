import { Rarity } from "../../gameConfig.ts";

export interface HealEffectDef {
    readonly type: "heal_effect" | "boost_effect";
    name: string;
    lore?: string;
    rarity: Rarity;
    texture: string;
    emitter: string | string[];
}

export const HealEffectDefs: Record<string, HealEffectDef> = {
    heal_basic: {
        type: "heal_effect",
        name: "Basic Healing",
        rarity: Rarity.Stock,
        texture: "part-heal-basic.img",
        emitter: "heal_basic",
    },
    heal_heart: {
        type: "heal_effect",
        name: "Healing Hearts",
        rarity: Rarity.Common,
        texture: "part-heal-heart.img",
        emitter: "heal_heart",
    },
    heal_moon: {
        type: "heal_effect",
        name: "Blood Moon",
        rarity: Rarity.Uncommon,
        texture: "part-heal-moon.img",
        emitter: "heal_moon",
    },
    heal_tomoe: {
        type: "heal_effect",
        name: "Tomoe",
        rarity: Rarity.Rare,
        texture: "part-heal-tomoe.img",
        emitter: "heal_tomoe",
    },
    heal_diamond: {
        type: "heal_effect",
        name: "Crazy Diamond",
        lore: "Dora-ra-ra-ra!",
        rarity: Rarity.Common,
        texture: "part-heal-diamond.img",
        emitter: "heal_diamond",
    },
    heal_ankh: {
        type: "heal_effect",
        name: "Ankh Charm",
        lore: "Grants immunity to most debuffs.",
        rarity: Rarity.Uncommon,
        texture: "part-heal-ankh.img",
        emitter: "heal_ankh",
    },
    heal_menacing: {
        type: "heal_effect",
        name: "Phantom Blood",
        lore: "Oh? You're approaching me?",
        rarity: Rarity.Rare,
        texture: "part-heal-menacing.img",
        emitter: "heal_menacing",
    },
    boost_basic: {
        type: "boost_effect",
        name: "Basic Boost",
        rarity: Rarity.Stock,
        texture: "part-boost-basic.img",
        emitter: "boost_basic",
    },
    boost_star: {
        type: "boost_effect",
        name: "Starboost",
        rarity: Rarity.Common,
        texture: "part-boost-star.img",
        emitter: "boost_star",
    },
    boost_naturalize: {
        type: "boost_effect",
        name: "Naturalize",
        rarity: Rarity.Uncommon,
        texture: "part-boost-naturalize.img",
        emitter: "boost_naturalize",
    },
    boost_shuriken: {
        type: "boost_effect",
        name: "Shuriken",
        rarity: Rarity.Rare,
        texture: "part-boost-shuriken.img",
        emitter: "boost_shuriken",
    },
    boost_club: {
        type: "boost_effect",
        name: "Club Cola",
        lore: "Copyright 2026, PARMA Institute.",
        rarity: Rarity.Common,
        texture: "part-boost-club.img",
        emitter: "boost_club",
    },
    boost_hermes: {
        type: "boost_effect",
        name: "Winged Grace",
        lore: "Graced by the mythical holy moly.",
        rarity: Rarity.Uncommon,
        texture: "part-boost-hermes.img",
        emitter: "boost_hermes",
    },
    boost_lightning: {
        type: "boost_effect",
        name: "Surged",
        lore: "Feel the surge!",
        rarity: Rarity.Rare,
        texture: "part-boost-lightning.img",
        emitter: "boost_lightning",
    },
    boost_gearshift: {
        type: "boost_effect",
        name: "Gearshift",
        lore: "What is the landspeed velocity of an unladen survevr?",
        rarity: Rarity.Epic,
        texture: "part-boost-gearshift.img",
        emitter: ["boost_gearshift_01", "boost_gearshift_02"],
    },
};
