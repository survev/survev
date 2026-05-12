import { type BulletDef, BulletDefs } from "./gameObjects/bulletDefs.ts";
import { type CrosshairDef, CrosshairDefs } from "./gameObjects/crosshairDefs.ts";
import { type EmoteDef, EmotesDefs } from "./gameObjects/emoteDefs.ts";
import { type ExplosionDef, ExplosionDefs } from "./gameObjects/explosionsDefs.ts";
import {
    type AmmoDef,
    type BackpackDef,
    type BoostDef,
    type ChestDef,
    GearDefs,
    type HealDef,
    type HelmetDef,
    type ScopeDef,
} from "./gameObjects/gearDefs.ts";
import { type GunDef, GunDefs } from "./gameObjects/gunDefs.ts";
import { type HealEffectDef, HealEffectDefs } from "./gameObjects/healEffectDefs.ts";
import { type MeleeDef, MeleeDefs } from "./gameObjects/meleeDefs.ts";
import { type OutfitDef, OutfitDefs } from "./gameObjects/outfitDefs.ts";
import { type PassDef, PassDefs } from "./gameObjects/passDefs.ts";
import { type PerkDef, PerkDefs } from "./gameObjects/perkDefs.ts";
import { type PingDef, PingDefs } from "./gameObjects/pingDefs.ts";
import { type QuestDef, QuestDefs } from "./gameObjects/questDefs.ts";
import { type RoleDef, RoleDefs } from "./gameObjects/roleDefs.ts";
import { type ThrowableDef, ThrowableDefs } from "./gameObjects/throwableDefs.ts";
import { type UnlockDef, UnlockDefs } from "./gameObjects/unlockDefs.ts";
import { type XPDef, XPDefs } from "./gameObjects/xpDefs.ts";

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

export const RawGameObjectDefs: Record<string, GameObjectDef> = {};

// Merge all item defs in together into one object
for (let i = 0; i < ObjectDefsList.length; i++) {
    const gameObjectDefs = ObjectDefsList[i];
    const objectTypes = Object.keys(gameObjectDefs);
    for (let j = 0; j < objectTypes.length; j++) {
        const objectType = objectTypes[j];
        if (RawGameObjectDefs[objectType] !== undefined) {
            throw new Error(`GameObject ${objectType} is already defined`);
        }
        RawGameObjectDefs[objectType] = gameObjectDefs[objectType];
    }
}
