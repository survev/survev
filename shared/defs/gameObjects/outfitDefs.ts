import { Rarity } from "../../gameConfig";
import { type DeepPartial, util } from "../../utils/util";

export interface OutfitDef {
    readonly type: "outfit";
    name: string;
    skinImg: {
        baseTint: number;
        baseSprite: string;
        handTint: number;
        handSprite: string;
        footTint: number;
        footSprite: string;
        backpackTint: number;
        backpackSprite: string;
    };
    lootImg: {
        sprite: string;
        tint: number;
        border: string;
        borderTint: number;
        scale: number;
    };
    sound: {
        pickup: string;
    };
    baseType?: string;
    noDropOnDeath?: boolean;
    rarity?: number;
    lore?: string;
    noDrop?: boolean;
    obstacleType?: string;
    baseScale?: number;
    ghillie?: boolean;
}

function defineOutfitSkin(baseType: string, params: DeepPartial<OutfitDef>): OutfitDef {
    return util.mergeDeep({}, BaseDefs[baseType], params);
}
const BaseDefs: Record<string, OutfitDef> = {
    outfitBase: {
        name: "Basic Outfit",
        type: "outfit",
        skinImg: {
            baseTint: 0xf8c574,
            baseSprite: "player-base-01.img",
            handTint: 0xf8c574,
            handSprite: "player-hands-01.img",
            footTint: 0xf8c574,
            footSprite: "player-feet-01.img",
            backpackTint: 0x816537,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xffffff,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        sound: {
            pickup: "clothes_pickup_01",
        },
    },
};

const SkinDefs: Record<string, OutfitDef> = {
    outfitBase: defineOutfitSkin("outfitBase", {
        noDropOnDeath: true,
        name: "Basic Outfit",
        rarity: Rarity.Stock,
        lore: "Pure and simple.",
        lootImg: {
            sprite: "loot-shirt-outfitBase.img",
            tint: 0xffffff,
        },
    }),
    outfitDemo: defineOutfitSkin("outfitBase", {
        noDrop: true,
        skinImg: {
            baseTint: 0xc76a67,
            baseSprite: "player-base-02.img",
            handTint: 0xb5504d,
            handSprite: "player-hands-02.img",
            footTint: 0xb5504d,
            footSprite: "player-feet-02.img",
            backpackTint: 0x9e3734,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xffffff,
        },
    }),
    outfitTank: defineOutfitSkin("outfitBase", {
        noDrop: true,
        skinImg: {
            baseTint: 0xeab963,
            baseSprite: "player-base-02.img",
            handTint: 0xd8a44b,
            handSprite: "player-hands-02.img",
            footTint: 0xd8a44b,
            footSprite: "player-feet-02.img",
            backpackTint: 0xbf8b2f,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xffffff,
        },
    }),
    outfitMedic: defineOutfitSkin("outfitBase", {
        noDrop: true,
        skinImg: {
            baseTint: 0xdc79dc,
            baseSprite: "player-base-02.img",
            handTint: 0xc454c4,
            handSprite: "player-hands-02.img",
            footTint: 0xc454c4,
            footSprite: "player-feet-02.img",
            backpackTint: 0xa937a9,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xffffff,
        },
    }),
    outfitScout: defineOutfitSkin("outfitBase", {
        noDrop: true,
        skinImg: {
            baseTint: 0xacd563,
            baseSprite: "player-base-02.img",
            handTint: 0x96c24a,
            handSprite: "player-hands-02.img",
            footTint: 0x96c24a,
            footSprite: "player-feet-02.img",
            backpackTint: 0x83b034,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xffffff,
        },
    }),
    outfitSniper: defineOutfitSkin("outfitBase", {
        noDrop: true,
        skinImg: {
            baseTint: 0x8dcedb,
            baseSprite: "player-base-02.img",
            handTint: 0x70bac9,
            handSprite: "player-hands-02.img",
            footTint: 0x70bac9,
            footSprite: "player-feet-02.img",
            backpackTint: 0x52a3b4,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xffffff,
        },
    }),
    outfitAssault: defineOutfitSkin("outfitBase", {
        noDrop: true,
        skinImg: {
            baseTint: 0xdacf59,
            baseSprite: "player-base-02.img",
            handTint: 0xc6bb40,
            handSprite: "player-hands-02.img",
            footTint: 0xc6bb40,
            footSprite: "player-feet-02.img",
            backpackTint: 0xa69c28,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xffffff,
        },
    }),
    outfitTurkey: defineOutfitSkin("outfitBase", {
        name: "Fowl Facade",
        noDropOnDeath: true,
        skinImg: {
            baseTint: 0xf0cebb,
            baseSprite: "player-base-outfitTurkey.img",
            handTint: 0xa51300,
            handSprite: "player-hands-02.img",
            footTint: 0xa51300,
            footSprite: "player-feet-02.img",
            backpackTint: 0xa85526,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitTurkey.img",
            tint: 0xf0cebb,
        },
        rarity: Rarity.Rare,
        lore: "M1100 not included.",
    }),
    outfitDev: defineOutfitSkin("outfitBase", {
        name: "Developer Swag",
        noDropOnDeath: true,
        skinImg: {
            baseTint: 0x348628,
            baseSprite: "player-base-outfitDC.img",
            handTint: 0x69da22,
            handSprite: "player-hands-02.img",
            footTint: 0x69da22,
            footSprite: "player-feet-02.img",
            backpackTint: 0x2c4b09,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitDev.img",
            tint: 0xffffff,
        },
        rarity: Rarity.Mythic,
        lore: "The limited edition print.",
    }),
    outfitGD: defineOutfitSkin("outfitBase", {
        name: "Game Designr",
        noDropOnDeath: true,
        skinImg: {
            baseTint: 0xab3030,
            baseSprite: "player-base-outfitDC.img",
            handTint: 0xe35f5f,
            handSprite: "player-hands-02.img",
            footTint: 0xe35f5f,
            footSprite: "player-feet-02.img",
            backpackTint: 0x6e1010,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitGD.img",
            tint: 0xffffff,
        },
        rarity: Rarity.Epic,
        lore: "For those who knows.",
    }),
    outfitMod: defineOutfitSkin("outfitBase", {
        name: "Game Moderatr",
        noDropOnDeath: true,
        skinImg: {
            baseTint: 0x3393db,
            baseSprite: "player-base-outfitDC.img",
            handTint: 0x93c7ee,
            handSprite: "player-hands-02.img",
            footTint: 0x93c7ee,
            footSprite: "player-feet-02.img",
            backpackTint: 0x175686,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitMod.img",
            tint: 0xffffff,
        },
        rarity: Rarity.Epic,
        lore: "For those who wield the power of the pan.",
    }),
    outfitWheat: defineOutfitSkin("outfitBase", {
        name: "Splintered Wheat",
        skinImg: {
            baseTint: 0xffffff,
            baseSprite: "player-base-outfitWheat.img",
            handTint: 0xf0dd92,
            handSprite: "player-hands-01.img",
            footTint: 0xf0dd92,
            footSprite: "player-feet-01.img",
            backpackTint: 0xcba81d,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitWheat.img",
            tint: 0xffffff,
        },
    }),
    outfitNoir: defineOutfitSkin("outfitBase", {
        name: "Neo Noir",
        skinImg: {
            baseTint: 0x1b1b1b,
            baseSprite: "player-base-02.img",
            handTint: 0xffffff,
            handSprite: "player-hands-02.img",
            footTint: 0xffffff,
            footSprite: "player-feet-02.img",
            backpackTint: 0x777777,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x1b1b1b,
        },
    }),
    outfitRedLeaderAged: defineOutfitSkin("outfitBase", {
        name: "Weathered Red",
        skinImg: {
            baseTint: 0x9a1818,
            baseSprite: "player-base-02.img",
            handTint: 0xff0000,
            handSprite: "player-hands-02.img",
            footTint: 0xff0000,
            footSprite: "player-feet-02.img",
            backpackTint: 0x530c0c,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x9a1818,
        },
    }),
    outfitBlueLeaderAged: defineOutfitSkin("outfitBase", {
        name: "Stifled Blue",
        skinImg: {
            baseTint: 0x173e99,
            baseSprite: "player-base-02.img",
            handTint: 0x4eff,
            handSprite: "player-hands-02.img",
            footTint: 0x4eff,
            footSprite: "player-feet-02.img",
            backpackTint: 794700,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x173e99,
        },
    }),
    outfitRedLeader: defineOutfitSkin("outfitBase", {
        name: "Red Leader",
        noDrop: true,
        skinImg: {
            baseTint: 0x9b0000,
            baseSprite: "player-base-02.img",
            handTint: 0xff0000,
            handSprite: "player-hands-02.img",
            footTint: 0xff0000,
            footSprite: "player-feet-02.img",
            backpackTint: 0x530000,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x840000,
        },
    }),
    outfitBlueLeader: defineOutfitSkin("outfitBase", {
        name: "Blue Leader",
        noDrop: true,
        skinImg: {
            baseTint: 0x2f9b,
            baseSprite: "player-base-02.img",
            handTint: 0x4eff,
            handSprite: "player-hands-02.img",
            footTint: 0x4eff,
            footSprite: "player-feet-02.img",
            backpackTint: 0x174c,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 13223,
        },
    }),
    outfitSpetsnaz: defineOutfitSkin("outfitBase", {
        name: "Siberian Assault",
        skinImg: {
            baseTint: 0xffffff,
            baseSprite: "player-base-outfitSpetsnaz.img",
            handTint: 0xe4e4e4,
            handSprite: "player-hands-01.img",
            footTint: 0xe4e4e4,
            footSprite: "player-feet-01.img",
            backpackTint: 0xd2d2d2,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitSpetsnaz.img",
            tint: 0xffffff,
        },
    }),
    outfitWoodsCloak: defineOutfitSkin("outfitBase", {
        name: "Greencloak",
        skinImg: {
            baseTint: 0x2aff00,
            baseSprite: "player-base-02.img",
            handTint: 0xfeffaa,
            handSprite: "player-hands-02.img",
            footTint: 0xfeffaa,
            footSprite: "player-feet-02.img",
            backpackTint: 0xee9347,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x2aff00,
        },
    }),
    outfitElf: defineOutfitSkin("outfitBase", {
        name: "Tallow's Little Helper",
        skinImg: {
            baseTint: 0xc40000,
            baseSprite: "player-base-01.img",
            handTint: 0x16b900,
            handSprite: "player-hands-01.img",
            footTint: 0x16b900,
            footSprite: "player-feet-01.img",
            backpackTint: 0x59300,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x16b900,
        },
    }),
    outfitImperial: defineOutfitSkin("outfitBase", {
        name: "Imperial Seal",
        skinImg: {
            baseTint: 0xbc002d,
            baseSprite: "player-base-01.img",
            handTint: 0xffffff,
            handSprite: "player-hands-01.img",
            footTint: 0xffffff,
            footSprite: "player-feet-01.img",
            backpackTint: 0xc0a73f,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xbc002d,
        },
    }),
    outfitLumber: defineOutfitSkin("outfitBase", {
        name: "Woodcutter's Wrap",
        skinImg: {
            baseTint: 0xffffff,
            baseSprite: "player-base-outfitLumber.img",
            handTint: 0x7e0308,
            handSprite: "player-hands-02.img",
            footTint: 0x7e0308,
            footSprite: "player-feet-02.img",
            backpackTint: 0x4a1313,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitLumber.img",
            tint: 0xffffff,
        },
    }),
    outfitVerde: defineOutfitSkin("outfitBase", {
        name: "Poncho Verde",
        skinImg: {
            baseTint: 0x1b400c,
            baseSprite: "player-base-02.img",
            handTint: 0xb5c58b,
            handSprite: "player-hands-02.img",
            footTint: 0xb5c58b,
            footSprite: "player-feet-02.img",
            backpackTint: 0xab7c29,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x1b400c,
        },
    }),
    outfitPineapple: defineOutfitSkin("outfitBase", {
        name: "Valiant Pineapple",
        skinImg: {
            baseTint: 0x990000,
            baseSprite: "player-base-02.img",
            handTint: 0x4c1111,
            handSprite: "player-hands-02.img",
            footTint: 0x4c1111,
            footSprite: "player-feet-02.img",
            backpackTint: 0xffcc00,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x990000,
        },
    }),
    outfitTarkhany: defineOutfitSkin("outfitBase", {
        name: "Tarkhany Regal",
        skinImg: {
            baseTint: 0x4b2e83,
            baseSprite: "player-base-02.img",
            handTint: 0xffb400,
            handSprite: "player-hands-02.img",
            footTint: 0xffb400,
            footSprite: "player-feet-02.img",
            backpackTint: 0x472060,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x4b2e83,
        },
    }),
    outfitWaterElem: defineOutfitSkin("outfitBase", {
        name: "Water Elemental",
        skinImg: {
            baseTint: 0x6cffe9,
            baseSprite: "player-base-02.img",
            handTint: 0xf4005c,
            handSprite: "player-hands-02.img",
            footTint: 0xf4005c,
            footSprite: "player-feet-02.img",
            backpackTint: 0x7f84,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 7143401,
        },
    }),
    outfitHeaven: defineOutfitSkin("outfitBase", {
        name: "Celestial Garb",
        skinImg: {
            baseTint: 0xffffff,
            baseSprite: "player-base-outfitHeaven.img",
            handTint: 0xd2004f,
            handSprite: "player-hands-02.img",
            footTint: 0xd2004f,
            footSprite: "player-feet-02.img",
            backpackTint: 0x8e97,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitHeaven.img",
            tint: 0xffffff,
        },
    }),
    outfitMeteor: defineOutfitSkin("outfitBase", {
        name: "Falling Star",
        skinImg: {
            baseTint: 0x950000,
            baseSprite: "player-base-02.img",
            handTint: 0xff7800,
            handSprite: "player-hands-02.img",
            footTint: 0xff7800,
            footSprite: "player-feet-02.img",
            backpackTint: 0x48231e,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x950000,
        },
    }),
    outfitIslander: defineOutfitSkin("outfitBase", {
        name: "Island Time",
        skinImg: {
            baseTint: 0xffc600,
            baseSprite: "player-base-01.img",
            handTint: 0x24600,
            handSprite: "player-hands-01.img",
            footTint: 0x24600,
            footSprite: "player-feet-01.img",
            backpackTint: 0x449700,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xffc600,
        },
    }),
    outfitAqua: defineOutfitSkin("outfitBase", {
        name: "Aquatic Avenger",
        skinImg: {
            baseTint: 0xbaa2,
            baseSprite: "player-base-01.img",
            handTint: 0xffde,
            handSprite: "player-hands-01.img",
            footTint: 0xffde,
            footSprite: "player-feet-01.img",
            backpackTint: 0x8302c,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xbaa2,
        },
    }),
    outfitCoral: defineOutfitSkin("outfitBase", {
        name: "Coral Guise",
        skinImg: {
            baseTint: 0xff5f67,
            baseSprite: "player-base-01.img",
            handTint: 0xff898f,
            handSprite: "player-hands-01.img",
            footTint: 0xff898f,
            footSprite: "player-feet-01.img",
            backpackTint: 0xffecca,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xff5f67,
        },
    }),
    outfitKhaki: defineOutfitSkin("outfitBase", {
        name: "The Initiative",
        rarity: Rarity.Common,
        skinImg: {
            baseTint: 0xc3ae85,
            baseSprite: "player-base-02.img",
            handTint: 0x8f8064,
            handSprite: "player-hands-02.img",
            footTint: 0x8f8064,
            footSprite: "player-feet-02.img",
            backpackTint: 0x40392c,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xc3ae85,
        },
    }),
    outfitParma: defineOutfitSkin("outfitBase", {
        name: "PARMA Jumpsuit",
        noDropOnDeath: true,
        rarity: Rarity.Common,
        lore: "Next generation inversion.",
        skinImg: {
            baseTint: 0x857659,
            baseSprite: "player-base-01.img",
            handTint: 0xc3ae85,
            handSprite: "player-hands-01.img",
            footTint: 0xc3ae85,
            footSprite: "player-feet-01.img",
            backpackTint: 0x40392c,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitParma.img",
            tint: 0xffffff,
        },
    }),
    outfitParmaPrestige: defineOutfitSkin("outfitBase", {
        name: "The Core Jumpsuit",
        noDropOnDeath: true,
        rarity: Rarity.Rare,
        lore: "Special issue for staffers at Bunker 1.",
        skinImg: {
            baseTint: 0xe3c081,
            baseSprite: "player-base-outfitParmaPrestige.img",
            handTint: 0xa9936b,
            handSprite: "player-hands-02.img",
            footTint: 0xa9936b,
            footSprite: "player-feet-02.img",
            backpackTint: 0x655231,
            backpackSprite: "player-circle-base-02.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitParmaPrestige.img",
            tint: 0xffffff,
        },
    }),
    outfitCasanova: defineOutfitSkin("outfitBase", {
        name: "Casanova Silks",
        skinImg: {
            baseTint: 0x42080c,
            baseSprite: "player-base-01.img",
            handTint: 0x740007,
            handSprite: "player-hands-01.img",
            footTint: 0x740007,
            footSprite: "player-feet-01.img",
            backpackTint: 0x101010,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x42080c,
        },
    }),
    outfitPrisoner: defineOutfitSkin("outfitBase", {
        name: "The New Black",
        skinImg: {
            baseTint: 0xff5c22,
            baseSprite: "player-base-01.img",
            handTint: 0xfc7523,
            handSprite: "player-hands-01.img",
            footTint: 0xfc7523,
            footSprite: "player-feet-01.img",
            backpackTint: 0xffae00,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0xff5c22,
        },
    }),
    outfitJester: defineOutfitSkin("outfitBase", {
        name: "Jester's Folly",
        skinImg: {
            baseTint: 0x770078,
            baseSprite: "player-base-01.img",
            handTint: 0x4b004c,
            handSprite: "player-hands-01.img",
            footTint: 0x4b004c,
            footSprite: "player-feet-01.img",
            backpackTint: 0xe4c00,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x770078,
        },
    }),
    outfitWoodland: defineOutfitSkin("outfitBase", {
        name: "Woodland Combat",
        rarity: Rarity.Common,
        lore: "Common component of PARMA survival caches.",
        skinImg: {
            baseTint: 0x2b332a,
            baseSprite: "player-base-01.img",
            handTint: 0x5a6c52,
            handSprite: "player-hands-01.img",
            footTint: 0x5a6c52,
            footSprite: "player-feet-01.img",
            backpackTint: 0x4d2600,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitWoodland.img",
            tint: 0xffffff,
        },
    }),
    outfitRoyalFortune: defineOutfitSkin("outfitBase", {
        name: "Royal Fortune",
        rarity: Rarity.Rare,
        skinImg: {
            baseTint: 0x7f2723,
            baseSprite: "player-base-01.img",
            handTint: 0xe8c22a,
            handSprite: "player-hands-01.img",
            footTint: 0xe8c22a,
            footSprite: "player-feet-01.img",
            backpackTint: 0x984f00,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitRoyalFortune.img",
            tint: 0xffffff,
        },
    }),
    outfitKeyLime: defineOutfitSkin("outfitBase", {
        name: "Key Lime",
        rarity: Rarity.Common,
        lore: "Not for eating.",
        skinImg: {
            baseTint: 0xc7ff3f,
            baseSprite: "player-base-01.img",
            handTint: 0xeeff5d,
            handSprite: "player-hands-01.img",
            footTint: 0xeeff5d,
            footSprite: "player-feet-01.img",
            backpackTint: 0xbc8737,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitKeyLime.img",
            tint: 0xffffff,
        },
    }),
    outfitCobaltShell: defineOutfitSkin("outfitBase", {
        name: "Cobalt Shell",
        rarity: Rarity.Common,
        lore: "It means bluish.",
        skinImg: {
            baseTint: 0x2b57,
            baseSprite: "player-base-01.img",
            handTint: 0x295e7c,
            handSprite: "player-hands-01.img",
            footTint: 0x295e7c,
            footSprite: "player-feet-01.img",
            backpackTint: 0x4a95,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitCobaltShell.img",
            tint: 0xffffff,
        },
    }),
    outfitFragtastic: defineOutfitSkin("outfitBase", {
        name: "Fragtastic",
        rarity: Rarity.Common,
        lore: "Pin not included. Maybe.",
        skinImg: {
            baseTint: 0x62591f,
            baseSprite: "player-base-01.img",
            handTint: 0x7f742a,
            handSprite: "player-hands-01.img",
            footTint: 0x7f742a,
            footSprite: "player-feet-01.img",
            backpackTint: 0x999999,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x938632,
        },
    }),
    outfitCarbonFiber: defineOutfitSkin("outfitBase", {
        name: "Carbon Fiber",
        // noDropOnDeath: true,
        rarity: Rarity.Uncommon,
        lore: "Military-grade, fine spun filament.",
        skinImg: {
            baseTint: 0x212121,
            baseSprite: "player-base-01.img",
            handTint: 0x1c1c1c,
            handSprite: "player-hands-01.img",
            footTint: 0x1c1c1c,
            footSprite: "player-feet-01.img",
            backpackTint: 0x363636,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitCarbonFiber.img",
            tint: 0xffffff,
        },
    }),
    outfitDarkGloves: defineOutfitSkin("outfitBase", {
        name: "The Professional",
        // noDropOnDeath: true,
        rarity: Rarity.Uncommon,
        lore: "True survivrs wear the dark gloves.",
        skinImg: {
            baseTint: 0xf8c574,
            baseSprite: "player-base-01.img",
            handTint: 0xbe7800,
            handSprite: "player-hands-01.img",
            footTint: 0xbe7800,
            footSprite: "player-feet-01.img",
            backpackTint: 0xa36700,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitDarkGloves.img",
            tint: 0xffffff,
        },
    }),
    outfitDarkShirt: defineOutfitSkin("outfitBase", {
        name: "The Semi-Pro",
        noDropOnDeath: true,
        rarity: Rarity.Common,
        lore: "Some survivrs wear the dark shirt.",
        skinImg: {
            baseTint: 0xbe7800,
            baseSprite: "player-base-01.img",
            handTint: 0xf8c574,
            handSprite: "player-hands-01.img",
            footTint: 0xf8c574,
            footSprite: "player-feet-01.img",
            backpackTint: 0xe7ae53,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitDarkShirt.img",
            tint: 0xffffff,
        },
    }),
    outfitGhillie: defineOutfitSkin("outfitBase", {
        name: "Ghillie Suit",
        ghillie: true,
        skinImg: {
            baseTint: 0x83af50,
            baseSprite: "player-base-01.img",
            handTint: 0x83af50,
            handSprite: "player-hands-01.img",
            footTint: 0x83af50,
            footSprite: "player-feet-01.img",
            backpackTint: 0x663300,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-01.img",
            tint: 0x83af50,
        },
    }),
    outfitDesertCamo: defineOutfitSkin("outfitBase", {
        name: "Desert Camo",
        rarity: Rarity.Common,
        skinImg: {
            baseTint: 0xd19b4e,
            baseSprite: "player-base-01.img",
            handTint: 0xaa6d16,
            handSprite: "player-hands-01.img",
            footTint: 0xaa6d16,
            footSprite: "player-feet-01.img",
            backpackTint: 0xffcb82,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitDesertCamo.img",
            tint: 0xffffff,
        },
    }),
    outfitCamo: defineOutfitSkin("outfitBase", {
        name: "Forest Camo",
        rarity: Rarity.Common,
        lore: "Be one with the trees.",
        skinImg: {
            baseTint: 0x999966,
            baseSprite: "player-base-01.img",
            handTint: 0x848457,
            handSprite: "player-hands-01.img",
            footTint: 0x848457,
            footSprite: "player-feet-01.img",
            backpackTint: 0x666633,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitCamo.img",
            tint: 0xffffff,
        },
    }),
    outfitRed: defineOutfitSkin("outfitBase", {
        name: "Target Practice",
        // noDropOnDeath: true,
        rarity: Rarity.Common,
        lore: "On the plus side, they won't see you bleed.",
        skinImg: {
            baseTint: 0xff0000,
            baseSprite: "player-base-01.img",
            handTint: 0xd40000,
            handSprite: "player-hands-01.img",
            footTint: 0xd40000,
            footSprite: "player-feet-01.img",
            backpackTint: 0xb70000,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitRed.img",
            tint: 0xffffff,
        },
    }),
    outfitWhite: defineOutfitSkin("outfitBase", {
        name: "Arctic Avenger",
        // noDropOnDeath: true,
        rarity: Rarity.Common,
        lore: "No business like snow business.",
        skinImg: {
            baseTint: 0xe3e3e3,
            baseSprite: "player-base-01.img",
            handTint: 0xeeeeee,
            handSprite: "player-hands-01.img",
            footTint: 0xeeeeee,
            footSprite: "player-feet-01.img",
            backpackTint: 0xdcdcdc,
            backpackSprite: "player-circle-base-01.img",
        },
        lootImg: {
            sprite: "loot-shirt-outfitWhite.img",
            tint: 0xffffff,
        },
    }),
    outfitBarrel: defineOutfitSkin("outfitBase", {
        name: "Barrel Costume",
        obstacleType: "barrel_01",
        baseScale: 0.8,
        lootImg: {
            tint: 0x393939,
        },
    }),
    outfitWoodBarrel: defineOutfitSkin("outfitBase", {
        name: "Wood Barrel Costume",
        obstacleType: "barrel_02",
        baseScale: 1,
        lootImg: {
            tint: 0xab6f22,
        },
    }),
    outfitStone: defineOutfitSkin("outfitBase", {
        name: "Stone Costume",
        obstacleType: "stone_01",
        baseScale: 0.9,
        lootImg: {
            tint: 0x717171,
        },
    }),
    outfitSpringTree: defineOutfitSkin("outfitBase", {
        name: "Tree Costume",
        obstacleType: "tree_07sp",
        baseScale: 1,
        lootImg: {
            tint: 0x462d12,
        },
    }),
    outfitHalloweenTree: defineOutfitSkin("outfitBase", {
        name: "Tree Costume",
        obstacleType: "tree_07",
        baseScale: 1,
        lootImg: {
            tint: 0x462d12,
        },
    }),
    outfitTreeSpooky: defineOutfitSkin("outfitBase", {
        name: "Spooky Tree Costume",
        obstacleType: "tree_05",
        baseScale: 1,
        lootImg: {
            tint: 0x1b1917,
        },
    }),
    outfitStump: defineOutfitSkin("outfitBase", {
        name: "Stump Costume",
        obstacleType: "tree_09",
        baseScale: 1,
        lootImg: {
            tint: 0x834400,
        },
    }),
    outfitBush: defineOutfitSkin("outfitBase", {
        name: "Bush Costume",
        obstacleType: "bush_01b",
        baseScale: 1,
        lootImg: {
            tint: 0x3b5b1f,
        },
    }),
    outfitLeafPile: defineOutfitSkin("outfitBase", {
        name: "Leaf Pile Costume",
        obstacleType: "bush_06b",
        baseScale: 1,
        lootImg: {
            tint: 0xff4d00,
        },
    }),
    outfitCrate: defineOutfitSkin("outfitBase", {
        name: "Crate Costume",
        obstacleType: "crate_01",
        baseScale: 1,
        lootImg: {
            tint: 0x663300,
        },
    }),
    outfitTable: defineOutfitSkin("outfitBase", {
        name: "Table Costume",
        obstacleType: "table_01",
        baseScale: 1,
        lootImg: {
            tint: 0x663300,
        },
    }),
    outfitSoviet: defineOutfitSkin("outfitBase", {
        name: "Soviet Costume",
        obstacleType: "crate_02",
        baseScale: 1,
        lootImg: {
            tint: 0x663300,
        },
    }),
    outfitAirdrop: defineOutfitSkin("outfitBase", {
        name: "Air Drop Costume",
        obstacleType: "crate_10",
        baseScale: 1,
        lootImg: {
            tint: 0x646464,
        },
    }),
    outfitOven: defineOutfitSkin("outfitBase", {
        name: "Oven Costume",
        obstacleType: "oven_01",
        baseScale: 1,
        lootImg: {
            tint: 0xe3e3e3,
        },
    }),
    outfitRefrigerator: defineOutfitSkin("outfitBase", {
        name: "Fridge Costume",
        obstacleType: "refrigerator_01b",
        baseScale: 1,
        lootImg: {
            tint: 0x76000b,
        },
    }),
    outfitVending: defineOutfitSkin("outfitBase", {
        name: "Vending Costume",
        obstacleType: "vending_01",
        baseScale: 1,
        lootImg: {
            tint: 0x2aad,
        },
    }),
    outfitPumpkin: defineOutfitSkin("outfitBase", {
        name: "Pumpkin Costume",
        obstacleType: "pumpkin_01",
        baseScale: 1,
        lootImg: {
            tint: 0xf27503,
        },
    }),
    outfitWoodpile: defineOutfitSkin("outfitBase", {
        name: "Woodpile Costume",
        obstacleType: "woodpile_01",
        baseScale: 1,
        lootImg: {
            tint: 0x904800,
        },
    }),
    outfitToilet: defineOutfitSkin("outfitBase", {
        name: "Toilet Costume",
        obstacleType: "toilet_02",
        baseScale: 1,
        lootImg: {
            tint: 0xffffff,
        },
    }),
    outfitBushRiver: defineOutfitSkin("outfitBase", {
        name: "River Bush Costume",
        obstacleType: "bush_04",
        baseScale: 1,
        lootImg: {
            tint: 0x517b2a,
        },
    }),
    outfitCrab: defineOutfitSkin("outfitBase", {
        name: "Crab Pot Costume",
        obstacleType: "crate_20",
        baseScale: 1,
        lootImg: {
            tint: 0xfd3018,
        },
    }),
    outfitStumpAxe: defineOutfitSkin("outfitBase", {
        name: "Stump Axe Costume",
        obstacleType: "tree_02h",
        baseScale: 1,
        lootImg: {
            tint: 0xa9621d,
        },
    }),
};

export const OutfitDefs = { ...BaseDefs, ...SkinDefs };
