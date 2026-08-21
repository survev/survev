import { expect } from "vitest";

import type { GameObjectDef } from "../../shared/defs/gameObjectDefs.ts";

import type { Player } from "../../server/src/game/objects/player.ts";
import type { MapObjectDef } from "../../shared/defs/mapObjectDefs.ts";
import { Main } from "../../shared/defs/maps/baseDefs.ts";
import { GameObjectDefs, MapObjectDefs } from "../../shared/defs/register.ts";
import { ObjectType } from "../../shared/net/objectSerializeFns.ts";

type IterableElement<I> = I extends Iterable<infer E> ? E : never;

interface GameTestHelpers<R = unknown> {
    toBeInRange: (value: { min: number; max: number }) => R;
    toHaveNoDuplicates: () => R;
    toAllSatisfy: (predicate: (value: IterableElement<R>, index: number, iterable: R) => unknown) => R;

    toBeValidMapObj: (type?: MapObjectDef["type"][]) => R;
    toBeValidMapObjOrNone: (type?: MapObjectDef["type"][]) => R;
    toBeValidGameObj: (type?: GameObjectDef["type"][]) => R;
    toBeValidLoot: (type?: GameObjectDef["type"][]) => R;
    toBeValidLootTier: () => R;

    toBeSamePlayer: (expected: Player) => R;
}

declare module "vitest" {
    interface Assertion<T = any> extends GameTestHelpers<T> {}
    interface AsymmetricMatchersContaining extends GameTestHelpers {}
}

export const predicates: {
    [K in keyof GameTestHelpers]: (
        received: unknown,
        ...params: Parameters<GameTestHelpers[K]>
    ) => { pass: boolean; message: () => string };
} = {
    toBeInRange: (received, expected: { min: number; max: number }) => {
        if (typeof received !== "number") {
            return {
                message: () => `Expected ${received} to be a number`,
                pass: false,
            };
        }

        if (received > expected.max || received < expected.min) {
            return {
                message: () => `Expected ${received} to be a in range [${expected.min}, ${expected.max}]`,
                pass: false,
            };
        }

        return { pass: true, message: () => "" };
    },

    toHaveNoDuplicates: (received: unknown) => {
        if (!Array.isArray(received)) {
            return {
                pass: false,
                message: () => `Expected ${received} to be an Array`,
            };
        }

        const dupes = new Map<unknown, number>();
        const unique = new Set<unknown>();

        for (let i = 0; i < received.length; ++i) {
            const ele = received[i];

            if (unique.has(ele)) {
                const count = dupes.get(ele);
                dupes.set(ele, (count ?? 1) + 1);
            } else {
                unique.add(ele);
            }
        }

        if (dupes.size) {
            return {
                pass: false,
                message: () => {
                    const dupeString = dupes.entries().map(([val, count]) => `\t${val} => ${count} times`).toArray()
                        .join("\n");
                    return `Expected ${received} to have no duplicates, but found the following dupes:\n${dupeString}`;
                },
            };
        }

        return { pass: true, message: () => "" };
    },

    toAllSatisfy: <T>(received: unknown, predicate: (value: T, index: number, iterable: Iterable<T>) => unknown) => {
        if (
            received === null
            || typeof received !== "object"
            || !(Symbol.iterator in received)
            || typeof received[Symbol.iterator] !== "function"
        ) {
            return {
                pass: false,
                message: () => `Expected '${received}' to be iterable`,
            };
        }

        let idx = 0;
        for (const ele of (received as Iterable<T>)) {
            if (!predicate(ele, idx, received as Iterable<T>)) {
                return {
                    pass: false,
                    message: () =>
                        `Expected all elements in the iterable to satisfy the given predicate but the element at index ${idx} didn't.`,
                };
            }
            ++idx;
        }

        return { pass: true, message: () => "" };
    },

    toBeValidMapObj: (received, expected?: MapObjectDef["type"][]) => {
        if (typeof received !== "string") {
            return {
                message: () => `Expected '${received}' to be a string`,
                pass: false,
            };
        }

        if (!MapObjectDefs.typeExists(received)) {
            return {
                message: () => `Expected '${received}' to be a valid map object type`,
                pass: false,
            };
        }

        if (expected) {
            const def = MapObjectDefs.typeToDef(received);
            if (!expected.includes(def.type)) {
                return {
                    message: () => `Expected '${received}' to be a be of type ${expected}`,
                    pass: false,
                };
            }
        }

        return { pass: true, message: () => "" };
    },

    toBeValidMapObjOrNone: (received, expected?: MapObjectDef["type"][]) => {
        if (received === undefined || received === "") {
            return {
                pass: true,
                message: () => "",
            };
        }

        if (typeof received !== "string") {
            return {
                message: () => `Expected '${received}' to be a string`,
                pass: false,
            };
        }

        if (!MapObjectDefs.typeExists(received)) {
            return {
                message: () => `Expected '${received}' to be a valid map object type`,
                pass: false,
            };
        }

        if (expected !== undefined) {
            const def = MapObjectDefs.typeToDef(received);
            if (!expected.includes(def.type)) {
                return {
                    message: () => `Expected '${received}' to be a be of type ${expected}`,
                    pass: false,
                };
            }
        }

        return { pass: true, message: () => "" };
    },

    toBeValidGameObj: (received, expected?: GameObjectDef["type"][]) => {
        if (typeof received !== "string") {
            return {
                message: () => `Expected '${received}' to be a string`,
                pass: false,
            };
        }

        if (!GameObjectDefs.typeExists(received)) {
            return {
                message: () => `Expected '${received}' to be a valid game object type`,
                pass: false,
            };
        }

        if (expected) {
            const def = GameObjectDefs.typeToDef(received);
            if (!expected.includes(def.type)) {
                return {
                    message: () => `Expected '${received}' to be a be of type ${expected}`,
                    pass: false,
                };
            }
        }

        return { pass: true, message: () => "" };
    },

    toBeValidLoot: (received, expected?: GameObjectDef["type"][]) => {
        if (typeof received !== "string") {
            return {
                message: () => `Expected '${received}' to be a string`,
                pass: false,
            };
        }

        const def = GameObjectDefs.typeToDefSafe(received);
        if (!def || !("lootImg" in def)) {
            return {
                message: () => `Expected '${received}' to be a valid loot type`,
                pass: false,
            };
        }

        if (expected) {
            const def = GameObjectDefs.typeToDef(received);
            if (!expected.includes(def.type)) {
                return {
                    message: () => `Expected '${received}' to be a be of type ${expected}`,
                    pass: false,
                };
            }
        }

        return { pass: true, message: () => "" };
    },

    toBeValidLootTier: (received) => {
        if (typeof received !== "string") {
            return {
                message: () => `Expected '${received}' to be a string`,
                pass: false,
            };
        }

        if (!(received in Main.lootTable)) {
            return {
                message: () => `Expected '${received}' to be a valid loot table`,
                pass: false,
            };
        }

        return { pass: true, message: () => "" };
    },

    toBeSamePlayer: (received: Player | unknown, expected: Player) => {
        if (!received || typeof received !== "object" || (received as Player).__type !== ObjectType.Player) {
            return {
                message: () => `Expected a player instance, received '${received}'`,
                pass: false,
            };
        }

        if ((received as Player).__id !== expected.__id) {
            return {
                message: () => `Expected player '${(received as Player).name}' to be '${expected.name}'`,
                pass: false,
            };
        }

        return { pass: true, message: () => "" };
    },
};

expect.extend(predicates);
