type GameStartListener = () => void;
type GameEndListener = () => void;
type PlayerDeathListener = () => void;
type PlayerShootListener = () => void;
type PlayerLocalShootListener = () => void;
type PlayerKillListener = () => void;
type PlayerHealListener = () => void;
type PlayerDamageListener = () => void;
type PlayerInventoryListener = () => void;
type PlayerHelmetListener = () => void;
type PlayerChestListener = () => void;
type PlayerBackpackListener = () => void;
type PlayerOutfitListener = () => void;
type PlayerGearListener = () => void;
type PlayerEquippedWeaponListener = () => void;
type PlayerWeaponListener = () => void;
type PlayerWeaponUsedAmmoListener = () => void;
type PlayerWeaponGainedAmmoListener = () => void;
type PlayerRemovedItemListener = () => void;
type PlayerAddedItemListener = () => void;

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
    ammoUsed: number;
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
    const gameStartListeners: GameStartListener[] = [];
    const gameEndListeners: GameEndListener[] = [];
    const playerDeathListeners: PlayerDeathListener[] = [];
    const playerShootListeners: PlayerShootListener[] = [];
    const playerLocalShootListeners: PlayerLocalShootListener[] = [];
    const playerKillListeners: PlayerKillListener[] = [];
    const playerKills: PlayerKills = {
        totalKills: 0,
    };
    const playerHealListeners: PlayerHealListener[] = [];
    const playerDamageListeners: PlayerDamageListener[] = [];
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
    const playerInventoryListeners: PlayerInventoryListener[] = [];
    const playerHelmetListeners: PlayerHelmetListener[] = [];
    const playerChestListeners: PlayerChestListener[] = [];
    const playerBackpackListeners: PlayerBackpackListener[] = [];
    const playerOutfitListeners: PlayerOutfitListener[] = [];
    const playerGearListeners: PlayerGearListener[] = [];
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
    const playerEquippedWeaponListeners: PlayerEquippedWeaponListener[] = [];
    const playerWeaponListeners: PlayerWeaponListener[] = [];
    const playerWeaponUsedAmmoListeners: PlayerWeaponUsedAmmoListener[] = [];
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
        ammoUsed: 0,
    };
    const playerWeaponGainedAmmoListeners: PlayerWeaponGainedAmmoListener[] = [];
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
    const playerRemovedItemListeners: PlayerRemovedItemListener[] = [];
    const playerAddedItemListeners: PlayerAddedItemListener[] = [];

    return Object.freeze({
        // on* hooks start
        onGameStart(fn: GameStartListener) {
            gameStartListeners.push(fn);
        },

        onGameEnd(fn: GameEndListener) {
            gameEndListeners.push(fn);
        },

        onLocalPlayerDeath(fn: PlayerDeathListener) {
            playerDeathListeners.push(fn);
        },

        onPlayerShoot(fn: PlayerShootListener) {
            playerShootListeners.push(fn);
        },

        onLocalPlayerShoot(fn: PlayerLocalShootListener) {
            playerLocalShootListeners.push(fn);
        },

        onLocalPlayerKill(fn: PlayerKillListener) {
            playerKillListeners.push(fn);
        },

        onLocalPlayerHeal(fn: PlayerHealListener) {
            playerHealListeners.push(fn);
        },

        onLocalPlayerDamage(fn: PlayerDamageListener) {
            playerDamageListeners.push(fn);
        },

        onLocalPlayerInventoryItemChange(fn: PlayerInventoryListener) {
            playerInventoryListeners.push(fn);
        },

        onLocalPlayerHelmetChange(fn: PlayerHelmetListener) {
            playerHelmetListeners.push(fn);
        },

        onLocalPlayerChestChange(fn: PlayerChestListener) {
            playerChestListeners.push(fn);
        },

        onLocalPlayerBackpackChange(fn: PlayerBackpackListener) {
            playerBackpackListeners.push(fn);
        },

        onLocalPlayerOutfitChange(fn: PlayerOutfitListener) {
            playerOutfitListeners.push(fn);
        },

        onLocalPlayerGearChange(fn: PlayerGearListener) {
            playerGearListeners.push(fn);
        },

        onLocalPlayerEquippedWeaponChange(fn: PlayerEquippedWeaponListener) {
            playerEquippedWeaponListeners.push(fn);
        },

        onLocalPlayerWeaponChange(fn: PlayerWeaponListener) {
            playerWeaponListeners.push(fn);
        },

        onLocalPlayerWeaponAmmoUse(fn: PlayerWeaponUsedAmmoListener) {
            playerWeaponUsedAmmoListeners.push(fn);
        },

        onLocalPlayerWeaponAmmoGained(fn: PlayerWeaponGainedAmmoListener) {
            playerWeaponGainedAmmoListeners.push(fn);
        },

        onLocalPlayerRemovedItem(fn: PlayerRemovedItemListener) {
            playerRemovedItemListeners.push(fn);
        },

        onLocalPlayerAddedItem(fn: PlayerAddedItemListener) {
            playerAddedItemListeners.push(fn);
        },

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

        _emitGameStart() {
            for (const fn of gameStartListeners) fn();
        },

        _emitGameEnd() {
            for (const fn of gameEndListeners) fn();
        },

        _emitLocalPlayerDeath() {
            for (const fn of playerDeathListeners) fn();
        },

        _emitPlayerShoot() {
            for (const fn of playerShootListeners) fn();
        },

        _emitLocalPlayerShoot() {
            for (const fn of playerLocalShootListeners) fn();
        },

        _emitLocalPlayerKill() {
            for (const fn of playerKillListeners) fn();
        },

        _emitLocalPlayerHeal() {
            for (const fn of playerHealListeners) fn();
        },

        _emitLocalPlayerDamage() {
            for (const fn of playerDamageListeners) fn();
        },

        _emitLocalPlayerInventoryItemChange() {
            for (const fn of playerInventoryListeners) fn();
        },

        _emitLocalPlayerHelmetChange() {
            for (const fn of playerHelmetListeners) fn();
        },

        _emitLocalPlayerChestChange() {
            for (const fn of playerChestListeners) fn();
        },

        _emitLocalPlayerBackpackChange() {
            for (const fn of playerBackpackListeners) fn();
        },

        _emitLocalPlayerOutfitChange() {
            for (const fn of playerOutfitListeners) fn();
        },

        _emitLocalPlayerGearChange() {
            for (const fn of playerGearListeners) fn();
        },

        _emitLocalPlayerEquippedWeaponChange() {
            for (const fn of playerEquippedWeaponListeners) fn();
        },

        _emitLocalPlayerWeaponChange() {
            for (const fn of playerWeaponListeners) fn();
        },

        _emitLocalPlayerWeaponAmmoUsed() {
            for (const fn of playerWeaponUsedAmmoListeners) fn();
        },

        _emitLocalPlayerWeaponAmmoGained() {
            for (const fn of playerWeaponGainedAmmoListeners) fn();
        },

        _emitLocalPlayerRemovedItem() {
            for (const fn of playerRemovedItemListeners) fn();
        },

        _emitLocalPlayerAddedItem() {
            for (const fn of playerAddedItemListeners) fn();
        },

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
            ammoUsed: number,
        ) {
            playerWeaponAmmoAdd.slot = slot;
            playerWeaponAmmoAdd.weaponType = weaponType;
            playerWeaponAmmoAdd.weaponAmmo = weaponAmmo;
            playerWeaponAmmoAdd.ammoUsed = ammoUsed;
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

export type ModAPI = ReturnType<typeof createModAPI>;
