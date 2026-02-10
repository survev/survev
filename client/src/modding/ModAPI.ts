type OnEventMap = {
    gameStart: void;
    gameEnd: void;
    localPlayerDeath: void;
    playerShoot: void;
    localPlayerShoot: void;
    localPlayerKill: void;
    localPlayerHeal: void;
    localPlayerDamage: void;
    localPlayerInventoryItemChange: void;
    localPlayerHelmetChange: void;
    localPlayerChestChange: void;
    localPlayerBackpackChange: void;
    localPlayerOutfitChange: void;
    localPlayerGearChange: void;
    localPlayerEquippedWeaponChange: void;
    localPlayerWeaponChange: void;
    localPlayerWeaponAmmoUsed: void;
    localPlayerWeaponAmmoGained: void;
    localPlayerRemovedItem: void;
    localPlayerAddedItem: void;
};

type ModEvent = keyof OnEventMap;

type ModEventCallback<E extends ModEvent> = OnEventMap[E] extends void
    ? () => void
    : (payload: OnEventMap[E]) => void;

type EventHooks = {
    [E in ModEvent as `on${Capitalize<E>}`]: (cb: ModEventCallback<E>) => void;
};

// yes you do have to repeat the on* hook names here but I mean
// considering that thats all thats needed to you know have both the
// on("gameStart", () => {}) and onGameStart(() => {}) styles I would say thats fine
// considering well docs are easier to write and some people prefer one or the other :p

const eventNames = [
    "gameStart",
    "gameEnd",
    "localPlayerDeath",
    "playerShoot",
    "localPlayerShoot",
    "localPlayerKill",
    "localPlayerHeal",
    "localPlayerDamage",
    "localPlayerInventoryItemChange",
    "localPlayerHelmetChange",
    "localPlayerChestChange",
    "localPlayerBackpackChange",
    "localPlayerOutfitChange",
    "localPlayerGearChange",
    "localPlayerEquippedWeaponChange",
    "localPlayerWeaponChange",
    "localPlayerWeaponAmmoUsed",
    "localPlayerWeaponAmmoGained",
    "localPlayerRemovedItem",
    "localPlayerAddedItem",
  ] as const satisfies readonly ModEvent[];  

export interface PlayerKills {
    totalKills: number;
}

export interface PlayerHealth {
    totalHealth: number;
}

export interface PlayerDamage {
    totalDamage: number;
}

export type InferredHealSource = "possiblyRegen" | "likelyItem";

export interface PlayerHeal {
    totalHeal: number;
    inferredSource?: InferredHealSource;
}

export interface PlayerHealRaw {
    totalHealRaw: number;
}

export interface PlayerItemAdd {
    addedItem: string;
    addedItemAmount: number;
}

export interface PlayerItemRemove {
    removedItem: string;
    removedItemAmount: number;
}

export interface PlayerHelmetChange {
    newHelmet: string;
}

export interface PlayerChestChange {
    newChest: string;
}

export interface PlayerBackpackChange {
    newBackpack: string;
}

export interface PlayerOutfitChange {
    newOutfit: string;
}

export interface PlayerLastGear {
    gearSlot: string;
    oldGear: string;
    newGear: string;
}

export interface PlayerGearSet {
    helmet: string;
    chest: string;
    backpack: string;
    outfit: string;
}

export interface PlayerActiveWeapon {
    slot: number;
    weaponType: string;
    weaponAmmo: number;
}

export interface PlayerLastWeapon {
    slot: number;
    oldWeapon: string;
    newWeapon: string;
}

export interface PlayerWeaponAmmoRemove {
    slot: number;
    weaponType: string;
    weaponAmmo: number;
    ammoUsed: number;
}

export interface PlayerWeaponAmmoAdd {
    slot: number;
    weaponType: string;
    weaponAmmo: number;
    ammoGained: number;
}

export interface PlayerWeapons {
    primaryWeaponType: string;
    primaryWeaponAmmo: number;
    secondaryWeaponType: string;
    secondaryWeaponAmmo: number;
    meleeWeaponType: string;
    meleeWeaponAmmo: number;
    throwableWeaponType: string;
    throwableWeaponAmmo: number;
}

export function createModAPI() {
    const listeners: { [E in ModEvent]?: ModEventCallback<E>[] } = {};

    const hooks = {} as EventHooks;

    for (const event of eventNames) {
        const hookName = `on${capitalize(event)}` as keyof EventHooks;
        hooks[hookName] = (cb: any) => {
            (listeners[event] ??= []).push(cb);
        };
    }

    function on<E extends ModEvent>(event: E, cb: ModEventCallback<E>) {
        const arr = (listeners[event] ??
            (listeners[event] = [])) as ModEventCallback<E>[];

        arr.push(cb);
    }

    function _emit<E extends ModEvent>(event: E, payload: OnEventMap[E]) {
        for (const fn of listeners[event] ?? []) {
            (fn as any)(payload);
        }
    }

    const playerKills: PlayerKills = {
        totalKills: 0,
    };
    const playerHealth: PlayerHealth = {
        totalHealth: 100,
    };
    const playerDamage: PlayerDamage = {
        totalDamage: 0,
    };
    const playerHeal: PlayerHeal = {
        totalHeal: 0,
        inferredSource: undefined,
    };
    const playerHealRaw: PlayerHealRaw = {
        totalHealRaw: 0,
    };
    const playerItemAdd: PlayerItemAdd = {
        addedItem: "",
        addedItemAmount: 0,
    };
    const playerItemRemove: PlayerItemRemove = {
        removedItem: "",
        removedItemAmount: 0,
    };
    const playerHelmetChange: PlayerHelmetChange = {
        newHelmet: "",
    };
    const playerChestChange: PlayerChestChange = {
        newChest: "",
    };
    const playerBackpackChange: PlayerBackpackChange = {
        newBackpack: "",
    };
    const playerOutfitChange: PlayerOutfitChange = {
        newOutfit: "",
    };
    const playerLastGear: PlayerLastGear = {
        gearSlot: "",
        oldGear: "",
        newGear: "",
    };
    const playerGearSet: PlayerGearSet = {
        helmet: "",
        chest: "",
        backpack: "",
        outfit: "",
    };
    const playerActiveWeapon: PlayerActiveWeapon = {
        slot: 0,
        weaponType: "",
        weaponAmmo: 0,
    };
    const playerLastWeapon: PlayerLastWeapon = {
        slot: 0,
        oldWeapon: "",
        newWeapon: "",
    };
    const playerWeaponAmmoRemove: PlayerWeaponAmmoRemove = {
        slot: 0,
        weaponType: "",
        weaponAmmo: 0,
        ammoUsed: 0,
    };
    const playerWeaponAmmoAdd: PlayerWeaponAmmoAdd = {
        slot: 0,
        weaponType: "",
        weaponAmmo: 0,
        ammoGained: 0,
    };
    const playerWeapons: PlayerWeapons = {
        primaryWeaponType: "",
        primaryWeaponAmmo: 0,
        secondaryWeaponType: "",
        secondaryWeaponAmmo: 0,
        meleeWeaponType: "",
        meleeWeaponAmmo: 0,
        throwableWeaponType: "",
        throwableWeaponAmmo: 0,
    };

    return Object.freeze({
        // on* hooks start
        on,
        ...hooks,
        // on* hooks end
        // get* hooks start

        getLocalPlayerKills(): Readonly<PlayerKills> {
            return { ...playerKills };
        },

        getLocalPlayerHealth(): Readonly<PlayerHealth> {
            return { ...playerHealth };
        },

        getLocalPlayerDamage(): Readonly<PlayerDamage> {
            return { ...playerDamage };
        },

        getLocalPlayerHeal(): Readonly<PlayerHeal> {
            return { ...playerHeal };
        },

        getLocalPlayerHealRaw(): Readonly<PlayerHealRaw> {
            return { ...playerHealRaw };
        },

        getLocalPlayerRemovedItem(): Readonly<PlayerItemRemove> {
            return { ...playerItemRemove };
        },

        getLocalPlayerAddedItem(): Readonly<PlayerItemAdd> {
            return { ...playerItemAdd };
        },

        getLocalPlayerHelmet(): Readonly<PlayerHelmetChange> {
            return { ...playerHelmetChange };
        },

        getLocalPlayerChest(): Readonly<PlayerChestChange> {
            return { ...playerChestChange };
        },

        getLocalPlayerBackpack(): Readonly<PlayerBackpackChange> {
            return { ...playerBackpackChange };
        },

        getLocalPlayerOutfit(): Readonly<PlayerOutfitChange> {
            return { ...playerOutfitChange };
        },

        getLocalPlayerLastChangedGear(): Readonly<PlayerLastGear> {
            return { ...playerLastGear };
        },

        getLocalPlayerGear(): Readonly<PlayerGearSet> {
            return { ...playerGearSet };
        },

        getLocalPlayerCurrentEquippedWeapon(): Readonly<PlayerActiveWeapon> {
            return { ...playerActiveWeapon };
        },

        getLocalPlayerLastChangedWeapon(): Readonly<PlayerLastWeapon> {
            return { ...playerLastWeapon };
        },

        getLocalPlayerWeaponAmmoUsed(): Readonly<PlayerWeaponAmmoRemove> {
            return { ...playerWeaponAmmoRemove };
        },

        getLocalPlayerWeaponAmmoGained(): Readonly<PlayerWeaponAmmoAdd> {
            return { ...playerWeaponAmmoAdd };
        },

        getLocalPlayerWeapons(): Readonly<PlayerWeapons> {
            return { ...playerWeapons };
        },

        // _emit* internal hooks start

        _emit,

        // _emit* internal hooks end

        // _set* internal hooks start
        _setPlayerKills(totalKills: number) {
            playerKills.totalKills = totalKills;
        },

        _setLocalPlayerHealth(totalHealth: number) {
            playerHealth.totalHealth = totalHealth;
        },

        _setLocalPlayerDamageAmount(totalDamage: number) {
            playerDamage.totalDamage = totalDamage;
        },
        // im probably going to forget this so heres a note for later doc writing
        // the setLocalPlayerHealAmount is what people use when they want a semi-filtered
        // heal readout meanwhile the raw one as the name implies is a raw readout
        // (now that I think of it this is probably hard to forget due to the name but anything can happen I guess...)
        _setLocalPlayerHealAmount(
            totalHeal: number,
            options?: { inferredSource?: InferredHealSource },
        ) {
            playerHeal.totalHeal = totalHeal;
            playerHeal.inferredSource = options?.inferredSource;
        },

        _setLocalPlayerHealAmountRaw(totalHealRaw: number) {
            playerHealRaw.totalHealRaw = totalHealRaw;
        },

        _setLocalPlayerRemoveItem(removedItem: string, removedItemAmount: number) {
            playerItemRemove.removedItem = removedItem;
            playerItemRemove.removedItemAmount = removedItemAmount;
        },

        _setLocalPlayerAddItem(addedItem: string, addedItemAmount: number) {
            playerItemAdd.addedItem = addedItem;
            playerItemAdd.addedItemAmount = addedItemAmount;
        },

        _setLocalPlayerHelmet(newHelmet: string) {
            playerHelmetChange.newHelmet = newHelmet;
        },

        _setLocalPlayerChest(newChest: string) {
            playerChestChange.newChest = newChest;
        },

        _setLocalPlayerBackpack(newBackpack: string) {
            playerBackpackChange.newBackpack = newBackpack;
        },

        _setLocalPlayerOutfit(newOutfit: string) {
            playerOutfitChange.newOutfit = newOutfit;
        },

        _setLocalPlayerLastChangedGear(
            gearSlot: string,
            oldGear: string,
            newGear: string,
        ) {
            playerLastGear.gearSlot = gearSlot;
            playerLastGear.oldGear = oldGear;
            playerLastGear.newGear = newGear;
        },

        _setLocalPlayerGear(
            helmet: string,
            chest: string,
            backpack: string,
            outfit: string,
        ) {
            playerGearSet.helmet = helmet;
            playerGearSet.chest = chest;
            playerGearSet.backpack = backpack;
            playerGearSet.outfit = outfit;
        },

        _setLocalPlayerCurrentEquippedWeapon(
            slot: number,
            weaponType: string,
            weaponAmmo: number,
        ) {
            playerActiveWeapon.slot = slot;
            playerActiveWeapon.weaponType = weaponType;
            playerActiveWeapon.weaponAmmo = weaponAmmo;
        },

        _setLocalPlayerLastChangedWeapon(
            slot: number,
            oldWeapon: string,
            newWeapon: string,
        ) {
            playerLastWeapon.slot = slot;
            playerLastWeapon.oldWeapon = oldWeapon;
            playerLastWeapon.newWeapon = newWeapon;
        },

        _setLocalPlayerWeaponAmmoUsed(
            slot: number,
            weaponType: string,
            weaponAmmo: number,
            ammoUsed: number,
        ) {
            playerWeaponAmmoRemove.slot = slot;
            playerWeaponAmmoRemove.weaponType = weaponType;
            playerWeaponAmmoRemove.weaponAmmo = weaponAmmo;
            playerWeaponAmmoRemove.ammoUsed = ammoUsed;
        },

        _setLocalPlayerWeaponAmmoGained(
            slot: number,
            weaponType: string,
            weaponAmmo: number,
            ammoGained: number,
        ) {
            playerWeaponAmmoAdd.slot = slot;
            playerWeaponAmmoAdd.weaponType = weaponType;
            playerWeaponAmmoAdd.weaponAmmo = weaponAmmo;
            playerWeaponAmmoAdd.ammoGained = ammoGained;
        },

        _setLocalPlayerWeapons(
            primaryWeaponType: string,
            primaryWeaponAmmo: number,
            secondaryWeaponType: string,
            secondaryWeaponAmmo: number,
            meleeWeaponType: string,
            meleeWeaponAmmo: number,
            throwableWeaponType: string,
            throwableWeaponAmmo: number,
        ) {
            playerWeapons.primaryWeaponType = primaryWeaponType;
            playerWeapons.primaryWeaponAmmo = primaryWeaponAmmo;
            playerWeapons.secondaryWeaponType = secondaryWeaponType;
            playerWeapons.secondaryWeaponAmmo = secondaryWeaponAmmo;
            playerWeapons.meleeWeaponType = meleeWeaponType;
            playerWeapons.meleeWeaponAmmo = meleeWeaponAmmo;
            playerWeapons.throwableWeaponType = throwableWeaponType;
            playerWeapons.throwableWeaponAmmo = throwableWeaponAmmo;
        },
        // _set* internal hooks end
    });
}

function capitalize(s: string) {
    return s[0].toUpperCase() + s.slice(1);
}

export type ModAPI = ReturnType<typeof createModAPI>;
