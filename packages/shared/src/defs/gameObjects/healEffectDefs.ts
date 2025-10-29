import { Rarity } from "../../gameConfig";

export interface HealEffectDef {
    readonly type: "heal_effect" | "boost_effect";
    name: string;
    rarity: number;
    texture: string;
    emitter: string;
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
};
