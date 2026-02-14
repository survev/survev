// so turns out you can do the generation from one map thingy if you
// use a const instead of type which is cool!
const eventMap = {
    gameStart: undefined,
    gameEnd: undefined,
    localPlayerDeath: undefined,
    playerShoot: undefined,
    localPlayerShoot: undefined,
    localPlayerKill: undefined,
    localPlayerHeal: undefined,
    localPlayerDamage: undefined,
    localPlayerInventoryItemChange: undefined,
    localPlayerHelmetChange: undefined,
    localPlayerChestChange: undefined,
    localPlayerBackpackChange: undefined,
    localPlayerOutfitChange: undefined,
    localPlayerGearChange: undefined,
    localPlayerEquippedWeaponChange: undefined,
    localPlayerWeaponChange: undefined,
    localPlayerWeaponAmmoUsed: undefined,
    localPlayerWeaponAmmoGained: undefined,
    localPlayerRemovedItem: undefined,
    localPlayerAddedItem: undefined,
} as const;

type OnEventMap = typeof eventMap;
type ModEvent = keyof OnEventMap;

type ModEventCallback<E extends ModEvent> = OnEventMap[E] extends void
    ? () => void
    : (payload: OnEventMap[E]) => void;

type EventHooks = {
    [E in ModEvent as `on${Capitalize<E>}`]: (cb: ModEventCallback<E>) => void;
};

const infoMap = {
    localPlayerKills: { totalKills: 0 },
    localPlayerHealth: { totalHealth: 100 },
    localPlayerDamage: { totalDamage: 0 },
    localPlayerHeal: {
        totalHeal: 0,
        inferredSource: undefined as "possiblyRegen" | "likelyItem" | undefined, // I think thats right?
    },
    localPlayerHealRaw: { totalHealRaw: 0 },
    localPlayerAddedItem: {
        addedItem: "",
        addedItemAmount: 0,
    },
    localPlayerRemovedItem: {
        removedItem: "",
        removedItemAmount: 0,
    },
    localPlayerHelmet: { newHelmet: "" },
    localPlayerChest: { newChest: "" },
    localPlayerBackpack: { newBackpack: "" },
    localPlayerOutfit: { newOutfit: "" },
    localPlayerLastChangedGear: {
        gearSlot: "",
        oldGear: "",
        newGear: "",
    },
    localPlayerGear: {
        helmet: "",
        chest: "",
        backpack: "",
        outfit: "",
    },
    localPlayerCurrentEquippedWeapon: {
        slot: 0,
        weaponType: "",
        weaponAmmo: 0,
    },
    localPlayerLastChangedWeapon: {
        slot: 0,
        oldWeapon: "",
        newWeapon: "",
    },
    localPlayerWeaponAmmoUsed: {
        slot: 0,
        weaponType: "",
        weaponAmmo: 0,
        ammoUsed: 0,
    },
    localPlayerWeaponAmmoGained: {
        slot: 0,
        weaponType: "",
        weaponAmmo: 0,
        ammoGained: 0,
    },
    localPlayerWeapons: {
        primaryWeaponType: "",
        primaryWeaponAmmo: 0,
        secondaryWeaponType: "",
        secondaryWeaponAmmo: 0,
        meleeWeaponType: "",
        meleeWeaponAmmo: 0,
        throwableWeaponType: "",
        throwableWeaponAmmo: 0,
    },
};

type GetInfoMap = typeof infoMap;
type GetMap = keyof GetInfoMap;
const state: GetInfoMap = { ...infoMap };

export function createModAPI() {
    const listeners: { [E in ModEvent]?: ModEventCallback<E>[] } = {};

    const hooks = {} as EventHooks;

    for (const event in eventMap) {
        const typedEvent = event as ModEvent;
        const hookName = `on${capitalize(event)}` as keyof EventHooks;
        hooks[hookName] = (cb: any) => {
            (listeners[typedEvent] ??= []).push(cb);
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

    type Getters = {
        [K in GetMap as `get${Capitalize<K>}`]: () => Readonly<GetInfoMap[K]>;
    };

    const getters = {} as any;

    (Object.keys(state) as GetMap[]).forEach((key) => {
        const getterName = `get${capitalize(key)}`;

        getters[getterName] = () => {
            return { ...state[key] };
        };
    });

    const get = getters as Getters;

    type Setters = {
        [K in GetMap as `_set${Capitalize<K>}`]: (
            payload: Partial<GetInfoMap[K]>,
        ) => void;
    };

    const setters = {} as any;

    (Object.keys(state) as GetMap[]).forEach((key) => {
        const setterName = `_set${capitalize(key)}`;

        setters[setterName] = (payload: Partial<GetInfoMap[typeof key]>) => {
            Object.assign(state[key], payload);
        };
    });

    const _set = setters as Setters;

    return Object.freeze({
        // on* hooks start
        on,
        ...hooks,
        // on* hooks end
        // get* hooks start
        ...get,
        // _emit* internal hooks start

        _emit,

        // _emit* internal hooks end

        // _set* internal hooks start
        ..._set,
        // _set* internal hooks end
    });
}

function capitalize(s: string) {
    return s[0].toUpperCase() + s.slice(1);
}

export type ModAPI = ReturnType<typeof createModAPI>;
