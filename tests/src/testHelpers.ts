import { expect } from "vitest";
import { type GameObjectDef, GameObjectDefs } from "../../shared/defs/gameObjectDefs";
import { MapObjectDefs } from "../../shared/defs/mapObjectDefs";
import type { MapObjectDef } from "../../shared/defs/mapObjectsTyping";
import { Main } from "../../shared/defs/maps/baseDefs";

interface GameTestHelpers<R = unknown> {
    toBeInRange: (value: { min: number; max: number }) => R;

    toBeValidMapObj: (type?: MapObjectDef["type"]) => R;
    toBeValidMapObjOrNone: (type?: MapObjectDef["type"]) => R;
    toBeValidGameObj: (type?: GameObjectDef["type"]) => R;
    toBeValidLoot: (type?: GameObjectDef["type"]) => R;
    toBeValidLootTier: () => R;
}

declare module "vitest" {
    interface Assertion<T = any> extends GameTestHelpers<T> {}
    interface AsymmetricMatchersContaining extends GameTestHelpers {}
}

expect.extend({
    toBeInRange: (received: number, expected: { min: number; max: number }) => {
        if (received > expected.max || received < expected.min) {
            return {
                message: () =>
                    `Expected ${received} to be a in range [${expected.min}, ${expected.max}]`,
                pass: false,
            };
        }

        return { pass: true, message: () => "" };
    },

    toBeValidMapObj: (received, expected) => {
        if (!(received in MapObjectDefs)) {
            return {
                message: () => `Expected '${received}' to be a valid map object type`,
                pass: false,
            };
        }

        if (expected) {
            const def = MapObjectDefs[received];
            if (def.type !== expected) {
                return {
                    message: () =>
                        `Expected '${received}' to be a be of type ${expected}`,
                    pass: false,
                };
            }
        }

        return { pass: true, message: () => "" };
    },

    toBeValidMapObjOrNone: (received, expected) => {
        if (received && !(received in MapObjectDefs)) {
            return {
                message: () => `Expected '${received}' to be a valid map object type`,
                pass: false,
            };
        }

        if (received && expected) {
            const def = MapObjectDefs[received];
            if (def.type !== expected) {
                return {
                    message: () =>
                        `Expected '${received}' to be a be of type ${expected}`,
                    pass: false,
                };
            }
        }

        return { pass: true, message: () => "" };
    },

    toBeValidGameObj: (received, expected) => {
        if (!(received in GameObjectDefs)) {
            return {
                message: () => `Expected '${received}' to be a valid game object type`,
                pass: false,
            };
        }

        if (expected) {
            const def = GameObjectDefs[received];
            if (def.type !== expected) {
                return {
                    message: () =>
                        `Expected '${received}' to be a be of type ${expected}`,
                    pass: false,
                };
            }
        }

        return { pass: true, message: () => "" };
    },

    toBeValidLoot: (received, expected) => {
        const def = GameObjectDefs[received];
        if (!def || !("lootImg" in def)) {
            return {
                message: () => `Expected '${received}' to be a valid loot type`,
                pass: false,
            };
        }

        if (expected) {
            const def = GameObjectDefs[received];
            if (def.type !== expected) {
                return {
                    message: () =>
                        `Expected '${received}' to be a be of type ${expected}`,
                    pass: false,
                };
            }
        }

        return { pass: true, message: () => "" };
    },

    toBeValidLootTier: (received, _expected) => {
        if (!(received in Main.lootTable)) {
            return {
                message: () => `Expected '${received}' to be a valid loot table`,
                pass: false,
            };
        }

        return { pass: true, message: () => "" };
    },
});
