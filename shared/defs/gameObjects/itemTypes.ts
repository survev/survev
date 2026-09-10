import type { Rarity } from "../../gameConfig";

export interface LootImg {
    sprite: string;
    scale: number;
    tint: number;
    border?: string;
    borderTint?: number;
    tintDark?: number;
    innerScale?: number;
    mirror?: boolean;
    rot?: number;
}

export interface MapIndicatorDef {
    sprite: string;
    tint: number;
    pulse: boolean;
    pulseTint: number;
}

export interface BaseLootDef {
    name: string;
    baseType?: string;
    noDrop?: boolean;
    noDropOnDeath?: boolean;
    lootImg: LootImg;
    mapIndicator?: MapIndicatorDef;
    sound: {
        pickup: string;
    };
}

export interface BaseLoadoutItem {
    name?: string;
    lore?: string;
    rarity?: Rarity;
}

export interface BaseWeaponDef extends BaseLootDef {
    noPotatoSwap?: boolean;
    quality: number;
    perk?: string;
}
