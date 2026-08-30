export interface PassDef {
    readonly type: "pass";
    xp: number[];
    items: Array<{
        level: number;
        item: string;
    }>;
}

export const PassDefs: Record<string, PassDef> = {
    pass_survivr1: {
        type: "pass",
        // dprint-ignore
        xp: [
            50, 50, 50, 50, 50, 50, 50, 50, 75, 75, 75, 75, 75, 75, 100, 100, 100, 125,
            125, 150, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75,
            75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 50,
        ],
        items: [
            {
                level: 2,
                item: "outfitParma",
            },
            {
                level: 3,
                item: "heal_heart",
            },
            {
                level: 4,
                item: "emote_bandagedface",
            },
            {
                level: 5,
                item: "outfitWhite",
            },
            {
                level: 6,
                item: "boost_star",
            },
            {
                level: 7,
                item: "emote_ok",
            },
            {
                level: 8,
                item: "outfitRed",
            },
            {
                level: 9,
                item: "heal_moon",
            },
            {
                level: 10,
                item: "emote_pooface",
            },
            {
                level: 11,
                item: "knuckles_rusted",
            },
            {
                level: 12,
                item: "boost_naturalize",
            },
            {
                level: 13,
                item: "emote_ghost_base",
            },
            {
                level: 14,
                item: "outfitDarkGloves",
            },
            {
                level: 15,
                item: "heal_tomoe",
            },
            {
                level: 16,
                item: "emote_picassoface",
            },
            {
                level: 17,
                item: "outfitCarbonFiber",
            },
            {
                level: 18,
                item: "boost_shuriken",
            },
            {
                level: 19,
                item: "emote_rainbow",
            },
            {
                level: 20,
                item: "outfitParmaPrestige",
            },
            {
                level: 21,
                item: "knuckles_heroic",
            },
            {
                level: 30,
                item: "outfitTurkey",
            },
            {
                level: 50,
                item: "bayonet_rugged",
            },
            {
                level: 99,
                item: "bayonet_woodland",
            },
        ],
    },
    pass_survivr2: {
        type: "pass",
        xp: [
            50,
            50,
            50,
            50,
            50,
            50,
            75,
            75,
            75,
            75,
            75,
            75,
            100,
            100,
            100,
            100,
            100,
            100,
            250,
            250,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            75,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            50,
            125,
        ],
        items: [
            {
                level: 2,
                item: "outfitRain",
            },
            {
                level: 3,
                item: "heal_diamond",
            },
            {
                level: 4,
                item: "", // TODO: final emote
            },
            {
                level: 5,
                item: "boost_club",
            },
            {
                level: 6,
                item: "outfitCowz",
            },
            {
                level: 7,
                item: "emote_bruh",
            },
            {
                level: 8,
                item: "outfitChameleon",
            },
            {
                level: 9,
                item: "emote_timeout",
            },
            {
                level: 10,
                item: "heal_ankh",
            },
            {
                level: 11,
                item: "boost_hermes",
            },
            {
                level: 12,
                item: "emote_saluteface",
            },
            {
                level: 13,
                item: "outfitPastel",
            },
            {
                level: 14,
                item: "heal_menacing",
            },
            {
                level: 15,
                item: "emote_flatteredface",
            },
            {
                level: 16,
                item: "outfitChrys",
            },
            {
                level: 17,
                item: "boost_lightning",
            },
            {
                level: 18,
                item: "emote_traumatizedface",
            },
            {
                level: 19,
                item: "boost_gearshift",
            },
            {
                level: 20,
                item: "huntsman_rugged",
            },
            {
                level: 25,
                item: "outfitFahrenheit",
            },
            {
                level: 30,
                item: "huntsman_burnished",
            },
            {
                level: 40,
                item: "outfitPotatoskin",
            },
            {
                level: 50,
                item: "karambit_rugged",
            },
            {
                level: 75,
                item: "karambit_borealis",
            },
            {
                level: 99,
                item: "outfitAurora",
            },
        ],
    },
};
