import { type BulletDef, BulletDefs } from "./gameObjects/bulletDefs";
import { type CrosshairDef, CrosshairDefs } from "./gameObjects/crosshairDefs";
import { type EmoteDef, EmotesDefs } from "./gameObjects/emoteDefs";
import { type ExplosionDef, ExplosionDefs } from "./gameObjects/explosionsDefs";
import {
    type AmmoDef,
    type BackpackDef,
    type BoostDef,
    type ChestDef,
    GearDefs,
    type HealDef,
    type HelmetDef,
    type ScopeDef,
} from "./gameObjects/gearDefs";
import { type GunDef, GunDefs } from "./gameObjects/gunDefs";
import { type HealEffectDef, HealEffectDefs } from "./gameObjects/healEffectDefs";
import { type MeleeDef, MeleeDefs } from "./gameObjects/meleeDefs";
import { type OutfitDef, OutfitDefs } from "./gameObjects/outfitDefs";
import { type PassDef, PassDefs } from "./gameObjects/passDefs";
import { type PerkDef, PerkDefs } from "./gameObjects/perkDefs";
import { type PingDef, PingDefs } from "./gameObjects/pingDefs";
import { type QuestDef, QuestDefs } from "./gameObjects/questDefs";
import { type RoleDef, RoleDefs } from "./gameObjects/roleDefs";
import { type ThrowableDef, ThrowableDefs } from "./gameObjects/throwableDefs";
import { type UnlockDef, UnlockDefs } from "./gameObjects/unlockDefs";
import { type XPDef, XPDefs } from "./gameObjects/xpDefs";

export type GameObjectDef =
    | BulletDef
    | EmoteDef
    | CrosshairDef
    | HealEffectDef
    | ExplosionDef
    | AmmoDef
    | HealDef
    | BoostDef
    | BackpackDef
    | HelmetDef
    | ChestDef
    | ScopeDef
    | GunDef
    | MeleeDef
    | OutfitDef
    | QuestDef
    | PerkDef
    | PassDef
    | PingDef
    | RoleDef
    | ThrowableDef
    | UnlockDef
    | XPDef;

export type LootDef =
    | AmmoDef
    | HealDef
    | BoostDef
    | BackpackDef
    | HelmetDef
    | ChestDef
    | ScopeDef
    | GunDef
    | MeleeDef
    | OutfitDef
    | PerkDef
    | ThrowableDef
    | XPDef;

const ObjectDefsList: Array<Record<string, GameObjectDef>> = [
    BulletDefs,
    CrosshairDefs,
    HealEffectDefs,
    EmotesDefs,
    ExplosionDefs,
    GearDefs,
    GunDefs,
    MeleeDefs,
    OutfitDefs,
    QuestDefs,
    PerkDefs,
    PassDefs,
    PingDefs,
    RoleDefs,
    ThrowableDefs,
    UnlockDefs,
    XPDefs,
];

export const WeaponTypeToDefs = {
    gun: GunDefs,
    melee: MeleeDefs,
    throwable: ThrowableDefs,
} as const;

export const GameObjectDefs: Record<string, GameObjectDef> = {};

// Merge all item defs in together into one object
for (let i = 0; i < ObjectDefsList.length; i++) {
    const gameObjectDefs = ObjectDefsList[i];
    const objectTypes = Object.keys(gameObjectDefs);
    for (let j = 0; j < objectTypes.length; j++) {
        const objectType = objectTypes[j];
        if (GameObjectDefs[objectType] !== undefined) {
            throw new Error(`GameObject ${objectType} is already defined`);
        }
        GameObjectDefs[objectType] = gameObjectDefs[objectType];
    }
}
