import { type DeepPartial, util } from "../../utils/util";

function defineXpSkin(baseType: string, params: DeepPartial<XPDef>): XPDef {
    return util.mergeDeep({}, BaseDefs[baseType], params);
}

export interface XPDef {
    readonly type: "xp";
    name: string;
    xp: number;
    lootImg: {
        sprite: string;
        tint: number;
        border: string;
        borderTint: number;
        scale: number;
    };
    sound: {
        drop: string;
        pickup: string;
    };
    emitter: string;
}

const BaseDefs: Record<string, XPDef> = {
    xp_10: {
        name: "XP",
        type: "xp",
        xp: 8,
        lootImg: {
            sprite: "loot-xp-book-01.img",
            tint: 0xffffff,
            border: "loot-circle-outer-05.img",
            borderTint: 0xffffff,
            scale: 0.2,
        },
        sound: {
            drop: "xp_drop_01",
            pickup: "xp_pickup_01",
        },
        emitter: "xp_common",
    },
    xp_25: {
        name: "XP",
        type: "xp",
        xp: 24,
        lootImg: {
            sprite: "loot-xp-book-01.img",
            tint: 0xffffff,
            border: "loot-circle-outer-05.img",
            borderTint: 0xffffff,
            scale: 0.2,
        },
        sound: {
            drop: "xp_drop_02",
            pickup: "xp_pickup_02",
        },
        emitter: "xp_rare",
    },
    xp_100: {
        name: "XP",
        type: "xp",
        xp: 96,
        lootImg: {
            sprite: "loot-xp-book-01.img",
            tint: 0xffffff,
            border: "loot-circle-outer-05.img",
            borderTint: 0xffffff,
            scale: 0.2,
        },
        sound: {
            drop: "xp_drop_02",
            pickup: "xp_pickup_02",
        },
        emitter: "xp_mythic",
    },
};

const SkinDefs: Record<string, XPDef> = {
    xp_book_tallow: defineXpSkin("xp_10", {
        name: "Tallow's Journal",
        lootImg: {
            sprite: "loot-xp-book-01.img",
        },
    }),
    xp_book_greene: defineXpSkin("xp_10", {
        name: "Greene's Infinite Wisdom",
        lootImg: {
            sprite: "loot-xp-book-02.img",
        },
    }),
    xp_book_parma: defineXpSkin("xp_10", {
        name: "The PARMA Papers",
        lootImg: {
            sprite: "loot-xp-book-03.img",
        },
    }),
    xp_book_nevelskoy: defineXpSkin("xp_10", {
        name: "The Nevelskoy Report",
        lootImg: {
            sprite: "loot-xp-book-04.img",
        },
    }),
    xp_book_rinzo: defineXpSkin("xp_10", {
        name: "Rinzō's Log",
        lootImg: {
            sprite: "loot-xp-book-05.img",
        },
    }),
    xp_book_kuga: defineXpSkin("xp_10", {
        name: "Memoirs of Kuga Kairyū",
        lootImg: {
            sprite: "loot-xp-book-06.img",
        },
    }),

    xp_glasses: defineXpSkin("xp_25", {
        name: "Lenz's Spectacles",
        lootImg: {
            sprite: "loot-xp-glasses-01.img",
        },
    }),
    xp_compass: defineXpSkin("xp_25", {
        name: "Amélie's True Compass",
        lootImg: {
            sprite: "loot-xp-compass-01.img",
        },
    }),
    xp_stump: defineXpSkin("xp_25", {
        name: "Ravenstone's Bloody Stump",
        lootImg: {
            sprite: "loot-xp-stump-01.img",
        },
    }),
    xp_bone: defineXpSkin("xp_25", {
        name: "Bone of Gordon",
        lootImg: {
            sprite: "loot-xp-bone-01.img",
        },
    }),

    xp_donut: defineXpSkin("xp_100", {
        name: "Cake Donut",
        lootImg: {
            sprite: "loot-xp-donut-01.img",
        },
    }),
};

export const XPDefs = { ...BaseDefs, ...SkinDefs };
