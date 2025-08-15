import { GameObjectDefs } from "../../../shared/defs/gameObjectDefs";
import type { GunDef } from "../../../shared/defs/gameObjects/gunDefs";
import type { MeleeDef } from "../../../shared/defs/gameObjects/meleeDefs";
import { PerkProperties } from "../../../shared/defs/gameObjects/perkDefs";
import {
    type ThrowableDef,
    ThrowableDefs,
} from "../../../shared/defs/gameObjects/throwableDefs";
import { GameConfig, WeaponSlot } from "../../../shared/gameConfig";
import * as net from "../../../shared/net/net";
import { ObjectType } from "../../../shared/net/objectSerializeFns";
import { coldet } from "../../../shared/utils/coldet";
import { collider } from "../../../shared/utils/collider";
import { collisionHelpers } from "../../../shared/utils/collisionHelpers";
import { math } from "../../../shared/utils/math";
import { assert, util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { BulletParams } from "../game/objects/bullet";
import type { GameObject } from "../game/objects/gameObject";
import type { Player } from "../game/objects/player";
import type { Projectile } from "./objects/projectile";

/**
 * List of throwables to cycle based on the definition `inventoryOrder`
 */
export const throwableList = Object.keys(ThrowableDefs).filter((a) => {
    const def = ThrowableDefs[a];
    // Trying to pickup a throwable that has no `handImg` will crash the client
    // so filter them out
    return "handImg" in def && "equip" in def.handImg!;
});

throwableList.sort((a, b) => {
    const aDef = ThrowableDefs[a];
    const bDef = ThrowableDefs[b];
    return aDef.inventoryOrder - bDef.inventoryOrder;
});

export class WeaponManager {
    player: Player;

    private _curWeapIdx = 2;

    lastWeaponIdx = 0;

    get curWeapIdx(): number {
        return this._curWeapIdx;
    }

    /**
     *
     * @param idx index being swapped to
     * @param cancelAction cancels current action if true
     * @param shouldReload will attempt automatic reload at 0 ammo if true
     * @param changeCooldown Weather to change the weapons cooldown, used by SwapWeapSlots to keep them the same
     * @returns
     */
    setCurWeapIndex(
        idx: number,
        cancelAction = true,
        cancelSlowdown = true,
        forceSwitch = false,
        changeCooldown = true,
    ): void {
        // if current slot is invalid and next too, switch to melee
        if (!this.activeWeapon && !this.weapons[idx].type) {
            idx = WeaponSlot.Melee;

            if (!this.weapons[idx].type) {
                this.weapons[idx].type = "fists";
                this.weapons[idx].cooldown = 0;
            }
            forceSwitch = true;
        }

        if (idx === this._curWeapIdx) return;
        if (this.weapons[idx].type === "") return;

        const curWeaponDef = GameObjectDefs[this.activeWeapon] as
            | GunDef
            | MeleeDef
            | ThrowableDef;

        if (
            curWeaponDef?.type === "gun" &&
            curWeaponDef.fireMode === "burst" &&
            this.bursts.length &&
            !forceSwitch
        )
            return;

        this.player.cancelAnim();

        if (cancelSlowdown) {
            this.player.shotSlowdownTimer = 0;
        }
        this.bursts.length = 0;
        this.meleeAttacks.length = 0;
        this.scheduledReload = false;

        this.player.recoilTicker = 0;

        const curWeapon = this.weapons[this.curWeapIdx];
        const nextWeapon = this.weapons[idx];
        let effectiveSwitchDelay = 0;

        if (curWeapon.type && nextWeapon.type && changeCooldown) {
            // ensure that player is still holding both weapons (didnt drop one)
            const nextWeaponDef = GameObjectDefs[this.weapons[idx].type] as
                | GunDef
                | MeleeDef
                | ThrowableDef;

            const swappingToGun = nextWeaponDef.type == "gun";

            effectiveSwitchDelay = swappingToGun ? nextWeaponDef.switchDelay : 0;

            if (this.player.freeSwitchTimer < 0) {
                effectiveSwitchDelay = GameConfig.player.baseSwitchDelay;
                this.player.freeSwitchTimer = GameConfig.player.freeSwitchCooldown;
            }

            if (
                swappingToGun &&
                // @ts-expect-error All combinations of non-identical non-zero values (including undefined)
                //                  give NaN or a number not equal to 1, meaning that this correctly checks
                //                  for two identical non-zero numerical deploy groups
                curWeaponDef.deployGroup / nextWeaponDef.deployGroup === 1 &&
                curWeapon.cooldown > 0
            ) {
                effectiveSwitchDelay = nextWeaponDef.switchDelay;
            } else if (nextWeaponDef.type === "melee") {
                effectiveSwitchDelay = math.max(
                    nextWeapon.cooldown,
                    nextWeaponDef.switchDelay,
                );
            }

            nextWeapon.cooldown = effectiveSwitchDelay;
        }

        this.lastWeaponIdx = this._curWeapIdx;
        this._curWeapIdx = idx;
        if (cancelAction) {
            this.player.cancelAction();
        }

        this.player.wearingPan = false;
        if (
            this.weapons[WeaponSlot.Melee].type === "pan" &&
            this.activeWeapon !== "pan"
        ) {
            this.player.wearingPan = true;
        }

        if (effectiveSwitchDelay != 0) {
            this.applyWeaponDelay(effectiveSwitchDelay);
        }

        if (GameConfig.WeaponType[idx] === "gun" && this.weapons[idx].ammo == 0) {
            this.scheduleReload();
        }

        if (idx === this.curWeapIdx && WeaponSlot[idx] == "gun") {
            this.offHand = false;
        }

        this.player.setDirty();
        this.player.weapsDirty = true;
    }

    setWeapon(idx: number, type: string, ammo: number) {
        const weaponDef = GameObjectDefs[type];
        const isMelee = idx === WeaponSlot.Melee;

        // non melee weapons can be set to empty strings to clear the slot
        if (!isMelee && type !== "") {
            assert(
                weaponDef.type === "gun" ||
                    weaponDef.type === "melee" ||
                    weaponDef.type === "throwable",
            );
        }

        // can't wear pan if you're replacing it with another melee
        if (this.weapons[idx].type == "pan") {
            this.player.wearingPan = false;
            this.player.setDirty();
        }

        // pan is always "worn" if player has it and any other slot is selected
        if (type == "pan" && this.curWeapIdx != WeaponSlot.Melee) {
            this.player.wearingPan = true;
            this.player.setDirty();
        }

        this.weapons[idx].type = type;
        this.weapons[idx].cooldown = 0;
        this.weapons[idx].ammo = ammo;
        if (weaponDef?.type === "gun") {
            this.weapons[idx].recoilTime = weaponDef.recoilTime;
        }
        if (weaponDef && "switchDelay" in weaponDef) {
            this.weapons[idx].cooldown = weaponDef.switchDelay;
        }

        if (idx === this.curWeapIdx) {
            this.bursts.length = 0;
            this.player.setDirty();
        }

        if (!this.activeWeapon) {
            this.setCurWeapIndex(WeaponSlot.Melee, undefined, undefined, true);
        }

        this.player.weapsDirty = true;
    }

    weapons: Array<{
        type: string;
        ammo: number;
        cooldown: number;
        recoilTime: number;
    }> = [];

    get activeWeapon(): string {
        return this.weapons[this.curWeapIdx].type;
    }

    constructor(player: Player) {
        this.player = player;

        for (let i = 0; i < WeaponSlot.Count; i++) {
            this.weapons.push({
                type: GameConfig.WeaponType[i] === "melee" ? "fists" : "",
                ammo: 0,
                cooldown: 0,
                recoilTime: Infinity,
            });
        }
    }

    cookingThrowable = false;
    cookTicker = 0;

    bursts: number[] = [];

    meleeAttacks: number[] = [];

    update(dt: number) {
        const player = this.player;

        if (player.downed) {
            return;
        }

        player.freeSwitchTimer -= dt;

        player.recoilTicker += dt;

        for (let i = 0; i < this.weapons.length; i++) {
            this.weapons[i].cooldown -= dt;
            this.weapons[i].recoilTime -= dt;
        }

        this.weaponDelayTicker -= dt;
        if (this.weaponDelayTicker <= 0 && this.scheduledReload) {
            this.scheduledReload = false;
            this.tryReload();
        }

        const itemDef = GameObjectDefs[this.activeWeapon];

        switch (itemDef.type) {
            case "gun": {
                this.gunUpdate(dt);
                break;
            }
            case "melee": {
                this.meleeUpdate(dt);
                break;
            }
            case "throwable": {
                if (player.shootStart && !this.cookingThrowable) {
                    this.cookThrowable();
                }
                break;
            }
        }

        if (this.cookingThrowable) {
            this.cookTicker += dt;
            if (this.curWeapIdx != WeaponSlot.Throwable) {
                this.throwThrowable();
                return;
            }

            if (
                (itemDef.type === "throwable" &&
                    itemDef.cookable &&
                    this.cookTicker > itemDef.fuseTime) || // safety check
                (!player.shootHold && this.cookTicker > GameConfig.player.cookTime)
            ) {
                this.throwThrowable();
            }
        }

        player.shootStart = false;
    }

    gunUpdate(dt: number) {
        const itemDef = GameObjectDefs[this.activeWeapon] as GunDef;
        const player = this.player;
        const weapon = this.weapons[this.curWeapIdx];

        switch (itemDef.fireMode) {
            case "auto":
                if (player.shootHold && weapon.cooldown <= 0) {
                    this.fireWeapon(this.offHand);
                    this.offHand = !this.offHand;
                }
                break;
            case "single":
                if (player.shootStart && weapon.cooldown < 0) {
                    this.fireWeapon(this.offHand);
                    this.offHand = !this.offHand;
                }
                break;
            case "burst":
                if (player.shootHold && weapon.cooldown < 0) {
                    weapon.cooldown = 0;
                    for (let i = 0; i < itemDef.burstCount!; i++) {
                        this.bursts.push(weapon.cooldown);
                        weapon.cooldown += itemDef.burstDelay!;
                    }
                    this.offHand = !this.offHand;
                    weapon.cooldown += itemDef.fireDelay;
                }
                for (let i = 0; i < this.bursts.length; i++) {
                    this.bursts[i] -= dt;
                    if (this.bursts[i] <= 0) {
                        this.fireWeapon(this.offHand);
                        this.bursts.splice(i, 1);
                        i--;
                    }
                }
                break;
        }
    }

    meleeUpdate(dt: number) {
        const itemDef = GameObjectDefs[this.activeWeapon] as MeleeDef;
        const player = this.player;
        const attack = itemDef.attack;
        const weapon = this.weapons[this.curWeapIdx];

        if (
            player.animType !== GameConfig.Anim.Melee &&
            (player.shootStart || (player.shootHold && itemDef.autoAttack)) &&
            weapon.cooldown < 0
        ) {
            this.player.cancelAction();

            this.player.playAnim(GameConfig.Anim.Melee, attack.cooldownTime);
            weapon.cooldown = attack.cooldownTime;
            this.meleeAttacks = [...attack.damageTimes];
        }

        for (let i = 0; i < this.meleeAttacks.length; i++) {
            this.meleeAttacks[i] -= dt;
            if (this.meleeAttacks[i] <= 0) {
                this.meleeDamage();
                this.meleeAttacks.splice(i, 1);
                i--;
            }
        }
    }

    scheduledReload = false;
    scheduleReload(): void {
        this.scheduledReload = true;
    }

    weaponDelayTicker = 0;
    weaponOnDelay = false;
    applyWeaponDelay(delay: number): void {
        this.weaponDelayTicker = delay;
        this.weaponOnDelay = true;
    }

    getTrueAmmoStats(weaponDef: GunDef): {
        trueMaxClip: number;
        trueMaxReload: number;
        trueMaxReloadAlt: number | undefined;
    } {
        if (this.player.hasPerk("firepower")) {
            return {
                trueMaxClip: weaponDef.extendedClip,
                trueMaxReload: weaponDef.extendedReload,
                trueMaxReloadAlt: weaponDef.extendedReloadAlt,
            };
        }

        return {
            trueMaxClip: weaponDef.maxClip,
            trueMaxReload: weaponDef.maxReload,
            trueMaxReloadAlt: weaponDef.maxReloadAlt,
        };
    }

    isInfinite(weaponDef: GunDef): boolean {
        return (
            !weaponDef.ignoreEndlessAmmo &&
            (weaponDef.ammoInfinite || this.player.hasPerk("endless_ammo"))
        );
    }

    /**
     * Try to schedule a reload action if all conditions are met
     */
    tryReload() {
        if (
            (
                [GameConfig.Action.Reload, GameConfig.Action.ReloadAlt] as number[]
            ).includes(this.player.actionType)
        ) {
            return;
        }
        const weaponDef = GameObjectDefs[this.activeWeapon] as GunDef;

        const conditions = [
            this.player.actionType == GameConfig.Action.Revive,
            this.player.actionType == GameConfig.Action.UseItem,
            this.weapons[this.curWeapIdx].ammo >=
                this.getTrueAmmoStats(weaponDef).trueMaxClip,
            !this.player.inventory[weaponDef.ammo] && !this.isInfinite(weaponDef),
            this.curWeapIdx == WeaponSlot.Melee ||
                this.curWeapIdx == WeaponSlot.Throwable,
        ];
        if (conditions.some((c) => c)) {
            return;
        }

        let duration = weaponDef.reloadTime;
        let action: number = GameConfig.Action.Reload;
        if (
            weaponDef.reloadTimeAlt &&
            this.weapons[this.curWeapIdx].ammo === 0 &&
            (this.player.inventory[weaponDef.ammo] > 1 || this.isInfinite(weaponDef))
        ) {
            duration = weaponDef.reloadTimeAlt!;
            action = GameConfig.Action.ReloadAlt;
        }

        this.player.doAction(this.activeWeapon, action, duration);
    }

    /**
     * called when reload action completed, actually updates all state variables
     */
    reload(curWeapIdx = this.curWeapIdx): void {
        if (!this.weapons[curWeapIdx].type) return; // prevent rare bug
        const weapon = this.weapons[curWeapIdx];
        const weaponDef = GameObjectDefs[weapon.type] as GunDef;
        const trueAmmoStats = this.getTrueAmmoStats(weaponDef);
        const activeWeaponAmmo = weapon.ammo;
        const spaceLeft = trueAmmoStats.trueMaxClip - activeWeaponAmmo; // if gun is 27/30 ammo, spaceLeft = 3

        const inv = this.player.inventory;

        let amountToReload = trueAmmoStats.trueMaxReload;
        if (trueAmmoStats.trueMaxReloadAlt && activeWeaponAmmo === 0) {
            amountToReload = trueAmmoStats.trueMaxReloadAlt;
        }

        if (this.isInfinite(weaponDef)) {
            weapon.ammo += math.clamp(amountToReload, 0, spaceLeft);
        } else if (inv[weaponDef.ammo] < spaceLeft) {
            // 27/30, inv = 2
            if (trueAmmoStats.trueMaxClip != amountToReload) {
                // m870, mosin, spas: only refill by one bullet at a time
                weapon.ammo++;
                inv[weaponDef.ammo]--;
            } else {
                // mp5, sv98, ak47: refill to as much as you have left in your inventory
                weapon.ammo += inv[weaponDef.ammo];
                inv[weaponDef.ammo] = 0;
            }
        } else {
            // 27/30, inv = 100
            weapon.ammo += math.clamp(amountToReload, 0, spaceLeft);
            inv[weaponDef.ammo] -= math.clamp(amountToReload, 0, spaceLeft);
        }

        // if you have an m870 with 2 ammo loaded and 0 ammo left in your inventory, your actual max clip is just 2 since you cant load anymore ammo
        const realMaxClip =
            inv[weaponDef.ammo] == 0 && !this.isInfinite(weaponDef)
                ? weapon.ammo
                : trueAmmoStats.trueMaxClip;
        if (trueAmmoStats.trueMaxClip != amountToReload && weapon.ammo != realMaxClip) {
            this.player.reloadAgain = true;
        }

        this.player.inventoryDirty = true;
        this.player.weapsDirty = true;
        this.bursts.length = 0;
    }

    private _dropGun(weapIdx: number): void {
        const weap = this.weapons[weapIdx];
        if (!weap || !weap.type) return;
        const weaponDef = GameObjectDefs[weap.type] as GunDef;
        if (!weaponDef) return;
        if (weaponDef.noDrop) return;
        const weaponAmmoType = weaponDef.ammo;
        const weaponAmmoCount = weap.ammo;

        let item = weap.type;

        const backpackLevel = this.player.getGearLevel(this.player.backpack);

        let amountToDrop = 0;
        // some guns ammo type have no item in bagSizes, like potato guns
        if (this.player.bagSizes[weaponAmmoType] && !this.isInfinite(weaponDef)) {
            const bagSpace = this.player.bagSizes[weaponAmmoType][backpackLevel];
            if (this.player.inventory[weaponAmmoType] + weaponAmmoCount <= bagSpace) {
                this.player.inventory[weaponAmmoType] += weaponAmmoCount;
                this.player.inventoryDirty = true;
            } else {
                const spaceLeft = bagSpace - this.player.inventory[weaponAmmoType];
                const amountToAdd = spaceLeft;

                this.player.inventory[weaponAmmoType] += amountToAdd;
                this.player.inventoryDirty = true;
                amountToDrop = weaponAmmoCount - amountToAdd;
            }
        }

        if (weaponDef.isDual) {
            item = item.replace("_dual", "");
            this.player.dropLoot(item, 0, true);
        }
        this.player.dropLoot(item, amountToDrop, true);
        this.player.weapsDirty = true;
    }

    dropGun(weapIdx: number): void {
        const def = GameObjectDefs[this.weapons[weapIdx].type] as GunDef | undefined;
        if (def?.noDrop) return;

        this._dropGun(weapIdx);
        this.setWeapon(weapIdx, "", 0);
    }

    replaceGun(idx: number, type: string): void {
        const oldDef = GameObjectDefs[this.weapons[idx].type] as GunDef | undefined;
        let ammo = 0;

        if (oldDef) {
            ammo = oldDef.dualWieldType === type ? this.weapons[idx].ammo : 0;
            if (oldDef.dualWieldType !== type) {
                this._dropGun(idx);
            }
        }

        this.setWeapon(idx, type, ammo);
    }

    dropMelee(): void {
        const slot = WeaponSlot.Melee;
        if (this.weapons[slot].type != "fists") {
            this.player.dropLoot(this.weapons[slot].type);
            this.setWeapon(slot, "fists", 0);
            if (slot === this.curWeapIdx) this.player.setDirty();
        }
    }

    /**
     * Checks if player can drop flare gun, if holding one.
     * @param weapIdx The slot index.
     */
    canDropFlare(weapIdx: number): boolean {
        const def = GameObjectDefs[this.weapons[weapIdx].type] as GunDef;
        if (!def) return false;

        if (this.player.role !== "leader") return true;

        return def.ammo !== "flare" || this.player.hasFiredFlare;
    }

    isBulletSaturated(ammo: string): boolean {
        if (this.player.lastBreathActive) {
            return true;
        }
        // avoid other checks if player has no perks
        if (!this.player.perks.length) return false;

        const perks = ["bonus_assault", "treat_super"];
        if (perks.some((p) => this.player.hasPerk(p))) {
            return true;
        }

        if (PerkProperties.ammoBonuses[ammo]) {
            for (const perk of this.player.perks) {
                if (PerkProperties.ammoBonuses[ammo].includes(perk.type)) {
                    return true;
                }
            }
        }

        return false;
    }

    offHand = false;
    fireWeapon(offHand: boolean, forceFire?: boolean) {
        const itemDef = GameObjectDefs[this.activeWeapon] as GunDef;

        const weapon = this.weapons[this.curWeapIdx];

        this.applyWeaponDelay(itemDef.fireDelay);

        this.scheduledReload = false;
        if (weapon.ammo <= 1) {
            this.scheduleReload();
        }
        if (weapon.ammo <= 0) return;

        const firstShotAccuracy = weapon.recoilTime <= 0;

        weapon.cooldown = itemDef.fireDelay;
        weapon.recoilTime = itemDef.recoilTime;

        // Check firing location
        if (itemDef.outsideOnly && this.player.indoors && !forceFire) {
            const msg = new net.PickupMsg();
            msg.type = net.PickupMsgType.GunCannotFire;
            this.player.msgsToSend.push({ type: net.MsgType.Pickup, msg });
            return;
        }

        const direction = this.player.dir;
        const toMouseLen = this.player.toMouseLen;

        this.player.shotSlowdownTimer = itemDef.fireDelay;

        this.player.cancelAction();

        weapon.ammo--;
        this.player.weapsDirty = true;

        const collisionLayer = util.toGroundLayer(this.player.layer);
        const bulletLayer = this.player.aimLayer;

        const gunOff = itemDef.isDual
            ? itemDef.dualOffset! * (offHand ? 1.0 : -1.0)
            : itemDef.barrelOffset;
        const gunPos = v2.add(this.player.pos, v2.mul(v2.perp(direction), gunOff));
        const gunLen = itemDef.barrelLength;

        // Compute gun pos clipping if there is an obstacle in the way
        // @NOTE: Add an extra 1.5 to account for shotgun shots being
        //        offset to spawn infront of the gun
        let clipLen = gunLen + 1.5;
        let clipPt = v2.add(gunPos, v2.mul(direction, clipLen));
        let clipNrm = v2.mul(direction, -1.0);
        const aabb = collider.createAabbExtents(
            this.player.pos,
            v2.create(this.player.rad + gunLen + 1.5),
        );

        const nearbyObjs = this.player.game.grid.intersectCollider(aabb);

        for (let i = 0; i < nearbyObjs.length; i++) {
            const obj = nearbyObjs[i];
            if (obj.__type !== ObjectType.Obstacle) continue;

            if (
                obj.dead ||
                !obj.collidable ||
                !util.sameLayer(obj.layer, bulletLayer) ||
                obj.height < GameConfig.bullet.height
            ) {
                continue;
            }
            // @NOTE: The player can sometimes be inside a collider.
            // This can happen when the bulletLayer is different from
            // the player's layer, ie when the player is firing down a
            // stairwell. In this case we'll just ignore that particular
            // collider.
            // Create fake circle for detecting collision between guns and map objects.
            if (
                !util.sameLayer(collisionLayer, bulletLayer) &&
                collider.intersectCircle(obj.collider, gunPos, GameConfig.player.radius)
            ) {
                continue;
            }

            const res = collider.intersectSegment(obj.collider, gunPos, clipPt);
            if (res) {
                const colPos = v2.add(res.point, v2.mul(res.normal, 0.01));
                const newLen = v2.length(v2.sub(colPos, gunPos));
                if (newLen < clipLen) {
                    clipLen = newLen;
                    clipPt = colPos;
                    clipNrm = res.normal;
                }
            }
        }

        //
        // Perks
        //
        const hasExplosive = this.player.hasPerk("explosive");
        const hasSplinter = this.player.hasPerk("splinter");
        const hasApRounds = this.player.hasPerk("ap_rounds");
        const shouldApplyChambered =
            this.player.hasPerk("chambered") &&
            itemDef.ammo !== "12gauge" &&
            (weapon.ammo === 0 || // ammo count already decremented
                weapon.ammo === this.getTrueAmmoStats(itemDef).trueMaxClip - 1);

        let damageMult = 1;
        if (hasSplinter) {
            damageMult *= PerkProperties.splinter.mainDamageMult;
        }

        const saturated = this.isBulletSaturated(itemDef.ammo);
        if (saturated) {
            damageMult *= PerkProperties.ammoBonusDamageMult;
        }

        if (shouldApplyChambered) {
            damageMult *= 1.25;
        }

        //
        // Movement spread
        //
        let spread = itemDef.shotSpread ?? 0;
        const travel = v2.sub(this.player.pos, this.player.posOld);
        if (v2.length(travel) > 0.01) {
            spread += itemDef.moveSpread ?? 0;
        }

        // Recoil currently just cancels spread if you shoot slow enough.
        if (this.player.recoilTicker >= itemDef.recoilTime) {
            spread = 0.0;
        }
        this.player.recoilTicker = 0.0;

        let bulletType = itemDef.bulletType;

        if (itemDef.ammo == "9mm" && this.player.hasPerk("bonus_9mm")) {
            bulletType = itemDef.bulletTypeBonus ?? bulletType;
            spread *= PerkProperties.bonus_9mm.spreadMul;
        }

        const bulletCount = itemDef.bulletCount;
        const jitter = itemDef.jitter ?? 0.25;

        for (let i = 0; i < bulletCount; i++) {
            const deviation = firstShotAccuracy
                ? 0
                : util.random(-0.5, 0.5) * (spread || 0);
            const shotDir = v2.rotate(direction, math.deg2rad(deviation));

            // Compute shot start position
            let bltStart = v2.add(gunPos, v2.mul(direction, gunLen));
            if (i > 0) {
                // Add shotgun jitter
                const offset = v2.mul(
                    v2.create(util.random(-jitter, jitter), util.random(-jitter, jitter)),
                    1.11,
                );
                bltStart = v2.add(bltStart, offset);
            }

            let toBlt = v2.sub(bltStart, gunPos);
            let toBltLen = v2.length(toBlt);
            toBlt = toBltLen > 0.00001 ? v2.div(toBlt, toBltLen) : v2.create(1.0, 0.0);
            // Clip with nearly obstacle plane
            // @TODO: This doesn't handle interior corners properly;
            //        bullets may still escape if one spawns closer
            //        to a different clipping plane than the gun end.
            const dn = v2.dot(toBlt, clipNrm);
            if (dn < -0.00001) {
                const t = v2.dot(v2.sub(clipPt, gunPos), clipNrm) / dn;
                if (t < toBltLen) {
                    toBltLen = t - 0.1;
                }
            }

            const shotPos = v2.add(gunPos, v2.mul(toBlt, toBltLen));
            let distance = Number.MAX_VALUE;
            if (itemDef.toMouseHit) {
                distance = math.max(toMouseLen - gunLen, 0.0);
            }

            const params: BulletParams = {
                playerId: this.player.__id,
                bulletType: bulletType,
                gameSourceType: this.activeWeapon,
                damageType: GameConfig.DamageType.Player,
                pos: shotPos,
                dir: shotDir,
                layer: bulletLayer,
                distance,
                clipDistance: itemDef.toMouseHit,
                damageMult,
                shotFx: i === 0,
                shotOffhand: offHand,
                trailSaturated: shouldApplyChambered || saturated,
                trailSmall: false,
                trailThick: shouldApplyChambered,
                reflectCount: 0,
                splinter: hasSplinter,
                apRounds: hasApRounds,
                lastShot: weapon.ammo <= 0,
                reflectObjId: this.player.obstacleOutfit?.__id,
                onHitFx: hasExplosive ? "explosion_rounds" : undefined,
            };

            this.player.game.bulletBarn.fireBullet(params);

            // Shoot a projectile if defined
            let projectile: Projectile | undefined;
            if (itemDef.projType) {
                const projDef = GameObjectDefs[itemDef.projType];
                assert(
                    projDef.type === "throwable",
                    `Invalid projectile type: ${itemDef.projType}`,
                );

                const vel = v2.mul(shotDir, projDef.throwPhysics.speed);
                projectile = this.player.game.projectileBarn.addProjectile(
                    this.player.__id,
                    itemDef.projType,
                    shotPos,
                    0.5,
                    bulletLayer,
                    vel,
                    projDef.fuseTime,
                    GameConfig.DamageType.Player,
                    shotDir,
                );
            }

            // Splinter creates additional bullets that deviate on either side of
            // the main bullet
            const splinterSpread = math.max(spread, 1.0);
            if (hasSplinter && !itemDef.noSplinter) {
                for (let j = 0; j < 2; j++) {
                    const sParams = { ...params };

                    const deviation =
                        util.random(0.2, 0.25) *
                        splinterSpread *
                        (j % 2 === 0 ? -1.0 : 1.0);
                    sParams.dir = v2.rotate(sParams.dir, math.deg2rad(deviation));
                    sParams.lastShot = false;
                    sParams.shotFx = false;
                    sParams.trailSmall = true;
                    sParams.damageMult *= PerkProperties.splinter.splitsDamageMult;

                    this.player.game.bulletBarn.fireBullet(sParams);
                    //
                    if (projectile) {
                        this.player.game.projectileBarn.addProjectile(
                            this.player.__id,
                            projectile.type,
                            shotPos,
                            0.5,
                            bulletLayer,
                            v2.rotate(projectile.vel, math.deg2rad(deviation)),
                            projectile.fuseTime,
                            GameConfig.DamageType.Player,
                            sParams.dir,
                        );
                    }
                }
            }
        }

        if (this.activeWeapon == "bugle" && this.player.hasPerk("inspiration")) {
            this.player.playBugle();
        }

        if (bulletType === "bullet_flare" && this.player.role === "leader") {
            this.player.hasFiredFlare = true;
        }

        if (
            this.player.game.map.factionMode &&
            !this.player.game.playerBarn.players.every(
                (p) =>
                    p.teamId === this.player.teamId ||
                    p.dead ||
                    p.disconnected ||
                    v2.distance(p.pos, this.player.pos) > p.zoom,
            )
        ) {
            this.player.timeUntilHidden = 1;
        }
    }

    getMeleeCollider() {
        const meleeDef = GameObjectDefs[this.player.activeWeapon] as MeleeDef;
        const rot = Math.atan2(this.player.dir.y, this.player.dir.x);

        const pos = v2.add(
            meleeDef.attack.offset,
            v2.mul(v2.create(1, 0), this.player.scale - 1),
        );
        const rotated = v2.add(this.player.pos, v2.rotate(pos, rot));
        const rad = meleeDef.attack.rad;
        return collider.createCircle(rotated, rad, 0);
    }

    meleeDamage(): void {
        const meleeDef = GameObjectDefs[this.activeWeapon] as MeleeDef;

        const coll = this.getMeleeCollider();
        const lineEnd = coll.rad + v2.length(v2.sub(this.player.pos, coll.pos));

        const hits: Array<{
            obj: GameObject;
            prio: number;
            pos: Vec2;
            pen: number;
            dir: Vec2;
        }> = [];

        const objs = this.player.game.grid.intersectCollider(coll);

        const obstacles = objs.filter((obj) => obj.__type === ObjectType.Obstacle);

        for (const obj of objs) {
            if (obj.__type === ObjectType.Obstacle) {
                const obstacle = obj;
                if (
                    !obstacle.dead &&
                    !obstacle.isSkin &&
                    obstacle.height >= GameConfig.player.meleeHeight &&
                    util.sameLayer(obstacle.layer, this.player.layer & 1)
                ) {
                    let collision = collider.intersectCircle(
                        obstacle.collider,
                        coll.pos,
                        coll.rad,
                    );

                    if (meleeDef.cleave) {
                        const normalized = v2.normalizeSafe(
                            v2.sub(obstacle.pos, this.player.pos),
                            v2.create(1, 0),
                        );
                        const wallCheck = collisionHelpers.intersectSegment(
                            obstacles,
                            this.player.pos,
                            normalized,
                            lineEnd,
                            GameConfig.player.meleeHeight,
                            this.player.layer,
                            false,
                        );
                        if (wallCheck && wallCheck.id !== obstacle.__id) {
                            collision = null;
                        }
                    }
                    if (collision) {
                        const pos = v2.add(
                            coll.pos,
                            v2.mul(v2.neg(collision.dir), coll.rad - collision.pen),
                        );
                        hits.push({
                            obj: obstacle,
                            pen: collision.pen,
                            prio: 1,
                            pos,
                            dir: collision.dir,
                        });
                    }
                }
            } else if (obj.__type === ObjectType.Player) {
                const player = obj;
                if (
                    player.__id !== this.player.__id &&
                    !player.dead &&
                    util.sameLayer(player.layer, this.player.layer)
                ) {
                    const normalized = v2.normalizeSafe(
                        v2.sub(player.pos, this.player.pos),
                        v2.create(1, 0),
                    );
                    const collision = coldet.intersectCircleCircle(
                        coll.pos,
                        coll.rad,
                        player.pos,
                        player.rad,
                    );
                    if (
                        collision &&
                        math.eqAbs(
                            lineEnd,
                            collisionHelpers.intersectSegmentDist(
                                obstacles,
                                this.player.pos,
                                normalized,
                                lineEnd,
                                GameConfig.player.meleeHeight,
                                this.player.layer,
                                false,
                            ),
                        )
                    ) {
                        hits.push({
                            obj: player,
                            pen: collision.pen,
                            prio: player.teamId === this.player.teamId ? 2 : 0,
                            pos: v2.copy(player.pos),
                            dir: collision.dir,
                        });
                    }
                }
            }
        }

        hits.sort((a, b) => {
            return a.prio === b.prio ? b.pen - a.pen : a.prio - b.prio;
        });

        let maxHits = hits.length;
        if (!meleeDef.cleave) maxHits = math.min(maxHits, 1);

        for (let i = 0; i < maxHits; i++) {
            const hit = hits[i];
            const obj = hit.obj;

            if (obj.__type === ObjectType.Obstacle) {
                obj.damage({
                    amount: meleeDef.damage * meleeDef.obstacleDamage,
                    gameSourceType: this.activeWeapon,
                    damageType: GameConfig.DamageType.Player,
                    source: this.player,
                    dir: v2.neg(hit.dir),
                    weaponSourceType: this.activeWeapon,
                });
                if (obj.interactable) obj.interact(this.player);
            } else if (obj.__type === ObjectType.Player) {
                obj.damage({
                    amount: meleeDef.damage,
                    gameSourceType: this.activeWeapon,
                    damageType: GameConfig.DamageType.Player,
                    source: this.player,
                    dir: hit.dir,
                });
            }
        }
    }

    cookThrowable(): void {
        if (
            this.player.animType === GameConfig.Anim.Cook ||
            this.player.animType === GameConfig.Anim.Throw
        ) {
            return;
        }
        this.player.cancelAction();
        const itemDef = GameObjectDefs[this.activeWeapon];
        assert(
            itemDef.type === "throwable",
            `Invalid projectile type: ${this.activeWeapon}`,
        );

        this.cookingThrowable = true;
        this.cookTicker = 0;

        this.player.playAnim(
            GameConfig.Anim.Cook,
            itemDef.cookable ? itemDef.fuseTime : Infinity,
            () => {
                this.throwThrowable();
            },
        );
    }

    throwThrowable(noSpeed?: boolean): void {
        if (!this.cookingThrowable) return;
        this.cookingThrowable = false;

        // need to store this incase throwableType gets replaced with its "heavy" variant like snowball => snowball_heavy
        // used to manage inventory since snowball_heavy isnt stored in inventory, when it's thrown you decrement "snowball" from inv
        const oldThrowableType = this.weapons[GameConfig.WeaponSlot.Throwable].type;

        let throwableType = this.weapons[GameConfig.WeaponSlot.Throwable].type;
        let throwableDef = GameObjectDefs[throwableType];
        assert(throwableDef.type === "throwable");

        if (throwableDef.heavyType && throwableDef.changeTime) {
            if (this.cookTicker >= throwableDef.changeTime) {
                throwableType = throwableDef.heavyType;
                throwableDef = GameObjectDefs[throwableType] as ThrowableDef;
            }
        }
        assert(throwableDef.type === "throwable");

        let multiplier: number;
        if (throwableDef.forceMaxThrowDistance) {
            multiplier = 1;
        } else if (this.curWeapIdx != GameConfig.WeaponSlot.Throwable || noSpeed) {
            // if selected weapon slot is not throwable, that means player switched slots early and velocity needs to be 0
            multiplier = 0;
        } else {
            // default throw strength algorithm, just based on mouse distance from player
            multiplier =
                math.clamp(
                    this.player.toMouseLen,
                    0,
                    GameConfig.player.throwableMaxMouseDist * 1.8,
                ) / 15;
        }

        const throwStr = multiplier * throwableDef.throwPhysics.speed;

        if (this.player.inventory[oldThrowableType] > 0) {
            this.player.inventory[oldThrowableType] -= 1;

            // if throwable count drops below 0
            // show the next throwable
            // the function will handle switching to last weapon
            // if no more throwables
            if (this.player.inventory[oldThrowableType] == 0) {
                this.showNextThrowable();
            }
            this.player.weapsDirty = true;
            this.player.inventoryDirty = true;
        }

        if (!throwableDef.explosionType) return;

        // position of throwing hand
        const pos = v2.add(
            this.player.pos,
            v2.rotate(
                v2.create(0.5, -1.0),
                Math.atan2(this.player.dir.y, this.player.dir.x),
            ),
        );

        let dir = v2.copy(this.player.dir);
        // Aim toward a point some distance infront of the player
        if (throwableDef.aimDistance > 0.0) {
            const aimTarget = v2.add(
                this.player.pos,
                v2.mul(this.player.dir, throwableDef.aimDistance),
            );
            dir = v2.normalizeSafe(v2.sub(aimTarget, pos), v2.create(1.0, 0.0));
        }

        // Incorporate some of the player motion into projectile velocity
        const vel = v2.add(
            v2.mul(this.player.moveVel, throwableDef.throwPhysics.playerVelMult),
            // player mouse position is irrelevant for max throwing distance
            v2.mul(dir, throwStr),
        );

        const fuseTime = math.max(
            0.0,
            throwableDef.fuseTime - (throwableDef.cookable ? this.cookTicker : 0),
        );
        const projectile = this.player.game.projectileBarn.addProjectile(
            this.player.__id,
            throwableType,
            pos,
            0.5,
            this.player.layer,
            vel,
            fuseTime,
            GameConfig.DamageType.Player,
            dir,
            oldThrowableType,
        );

        if (oldThrowableType == "strobe") {
            let airstrikesLeft = 3;

            if (this.player.hasPerk("broken_arrow")) {
                airstrikesLeft += PerkProperties.broken_arrow.bonusAirstrikes;
            }

            projectile.strobe = {
                strobeTicker: 4,
                airstrikesLeft: airstrikesLeft,
                airstrikeTicker: 0,
            };
        }

        const animationDuration = GameConfig.player.throwTime;
        this.player.playAnim(GameConfig.Anim.Throw, animationDuration);
    }

    /**
     * switch weapons slot throwable to the next one in the throwables array
     * only call this method after the inventory state has been updated accordingly, this function only changes the weaponManager.weapons' state
     */
    showNextThrowable(): void {
        const slot = WeaponSlot.Throwable;
        const startingIndex = throwableList.indexOf(this.weapons[slot].type) + 1;
        for (let i = startingIndex; i < startingIndex + throwableList.length; i++) {
            const arrayIndex = i % throwableList.length;
            const type = throwableList[arrayIndex];
            const amount = this.player.inventory[type];

            if (!throwableList.includes(type)) {
                continue;
            }

            if (amount != 0) {
                this.setWeapon(slot, type, 0);
                return;
            }
        }

        if (this.curWeapIdx === slot) {
            const newSlot = this.weapons[this.lastWeaponIdx].type
                ? this.lastWeaponIdx
                : WeaponSlot.Melee;
            this.setCurWeapIndex(newSlot);
        }
        this.setWeapon(slot, "", 0);
    }
}
