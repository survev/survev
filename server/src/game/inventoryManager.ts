import { GameObjectDefs } from "../../../shared/defs/gameObjectDefs";
import { SCOPE_LEVELS, type ScopeDef } from "../../../shared/defs/gameObjects/gearDefs";
import { GameConfig, type InventoryItem } from "../../../shared/gameConfig";
import { math } from "../../../shared/utils/math";
import type { Player } from "./objects/player";
import { throwableList } from "./weaponManager";

const emptyInventory = Object.keys(GameConfig.bagSizes).reduce(
    (inv, key) => {
        inv[key] = 0;
        return inv;
    },
    {} as Record<string, number>,
) as Record<InventoryItem, number>;

function assertAmount(n: number) {
    if (n < 0 || !Number.isFinite(n) || ~~n !== n) {
        throw new Error(
            `Inventory Items must be positive, finite and integers, received ${n}`,
        );
    }
}

export class InventoryManager {
    private _items: Record<InventoryItem, number> = { ...emptyInventory };

    get items(): Readonly<Record<InventoryItem, number>> {
        return this._items;
    }

    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    get bagSizes() {
        return this.player.game.playerBarn.bagSizes;
    }

    isValid(item: string): item is InventoryItem {
        return item in emptyInventory;
    }

    get(item: InventoryItem): number {
        return this._items[item];
    }

    has(item: InventoryItem): boolean {
        return this._items[item] > 0;
    }

    set(item: InventoryItem, amount: number) {
        assertAmount(amount);

        if (this._items[item] !== amount) {
            this.player.inventoryDirty = true;

            const oldAmount = this._items[item];
            this._items[item] = amount;

            if (oldAmount === 0) {
                this._onItemAdded(item);
            } else if (amount === 0) {
                this._onItemRemoved(item);
            }
        }
    }

    getMaxCapacity(item: InventoryItem): number {
        const bagLevel = this.player.getGearLevel(this.player.backpack);
        return this.bagSizes[item][bagLevel];
    }

    /**
     * Gives an amount of an item to this inventory
     */
    give(
        item: InventoryItem,
        amount: number,
    ): {
        added: number;
        remaining: number;
    } {
        assertAmount(amount);

        const max = this.getMaxCapacity(item);
        const current = this.get(item);

        const spaceLeft = math.max(max - current, 0);

        // no space left
        if (spaceLeft <= 0) {
            return {
                added: 0,
                remaining: amount,
            };
        }

        // space left is smaller than amount to add
        if (amount > spaceLeft) {
            const added = spaceLeft;
            const remaining = amount - added;
            this.set(item, max);

            return {
                added,
                remaining,
            };
        }

        // we can add everything at once
        this.set(item, current + amount);

        return {
            added: amount,
            remaining: 0,
        };
    }

    /**
     * Gives an item and automatically drops the remaining items as loot if it goes over the backpack capacity
     */
    giveAndDrop(
        item: InventoryItem,
        amount: number,
    ): {
        added: number;
        remaining: number;
    } {
        const result = this.give(item, amount);

        if (result.remaining > 0 && item !== "1xscope") {
            this.player.dropLoot(item, result.remaining, false);
        }

        return result;
    }

    /**
     * Takes an amount of an item from this inventory
     * Will give the maximum it can based on the available amount of the item
     */
    take(item: InventoryItem, amount: number): number {
        assertAmount(amount);

        const current = this.get(item);
        const trueAmount = math.min(current, amount);

        this.set(item, current - trueAmount);

        return trueAmount;
    }

    /**
     * Runs only when an item drops to 0
     */
    private _onItemRemoved(item: InventoryItem) {
        const def = GameObjectDefs[item];

        switch (def.type) {
            case "scope": {
                // switch to a lower scope if the scope dropped is the equipped one
                if (this.player.scope === item) {
                    const scopeIdx = SCOPE_LEVELS.indexOf(item);
                    for (let i = scopeIdx; i >= 0; i--) {
                        if (!this.has(SCOPE_LEVELS[i] as InventoryItem)) continue;
                        this.player.scope = SCOPE_LEVELS[i];
                        break;
                    }
                }
                break;
            }
            case "throwable": {
                // shows the next throwable or switch to fists
                if (this.player.weapons[GameConfig.WeaponSlot.Throwable].type === item) {
                    this.player.weaponManager.showNextThrowable();
                }
                break;
            }
        }
    }

    /**
     * Runs only when an item was 0 and now is not
     */
    private _onItemAdded(item: InventoryItem) {
        const def = GameObjectDefs[item];

        switch (def.type) {
            case "scope": {
                // switch to scope if its higher than the equipped one
                const currentScope = GameObjectDefs[this.player.scope] as ScopeDef;
                if (def.level > currentScope.level) {
                    this.player.scope = item;
                }
                break;
            }
            case "throwable": {
                // set the throwable slot to this item if there was no throwables before
                if (
                    !this.player.weapons[GameConfig.WeaponSlot.Throwable].type &&
                    throwableList.includes(item)
                ) {
                    this.player.weaponManager.setWeapon(
                        GameConfig.WeaponSlot.Throwable,
                        item,
                        0,
                    );
                }
                break;
            }
            case "ammo": {
                // automatically reloads gun if inventory has 0 ammo and ammo is picked up
                const weaponInfo = GameObjectDefs[this.player.activeWeapon];
                if (
                    weaponInfo.type === "gun" &&
                    this.player.weapons[this.player.curWeapIdx].ammo <= 0 &&
                    weaponInfo.ammo === item
                ) {
                    this.player.weaponManager.scheduledReload = true;
                }
            }
        }
    }
}
