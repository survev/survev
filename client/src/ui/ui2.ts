import type { LootDef } from "../../../shared/defs/gameObjectDefs.ts";
import {
    type AmmoDef,
    type BoostDef,
    type ChestDef,
    GEAR_TYPES,
    type HealDef,
    SCOPE_LEVELS,
} from "../../../shared/defs/gameObjects/gearDefs.ts";
import type { GunDef } from "../../../shared/defs/gameObjects/gunDefs.ts";
import type { MeleeDef } from "../../../shared/defs/gameObjects/meleeDefs.ts";
import type { RoleDef } from "../../../shared/defs/gameObjects/roleDefs.ts";
import type { ObstacleDef } from "../../../shared/defs/mapObjects/obstacles/obstacleDefs.ts";

import { GameObjectDefs, MapObjectDefs } from "../../../shared/defs/register.ts";
import { Action, DamageType, GameConfig, Input, type InventoryItem } from "../../../shared/gameConfig.ts";
import { PickupMsgType } from "../../../shared/net/net.ts";
import { collider } from "../../../shared/utils/collider.ts";
import { math } from "../../../shared/utils/math.ts";
import { util } from "../../../shared/utils/util.ts";
import { v2 } from "../../../shared/utils/v2.ts";
import { device } from "../device.ts";
import { helpers } from "../helpers.ts";
import type { InputBinds } from "../inputBinds.ts";
import type { Map } from "../map.ts";
import type { Loot, LootBarn } from "../objects/loot.ts";
import type { Obstacle } from "../objects/obstacle.ts";
import type { Player, PlayerBarn } from "../objects/player.ts";
import type { Localization } from "./localization.ts";

const maxKillFeedLines = 6;
const touchHoldDuration = 0.75 * 1000;
const perkUiCount = 4;

enum InteractionType {
    None,
    Cancel,
    Loot,
    Revive,
    Object,
}

const WeaponSlotToBind = {
    [GameConfig.WeaponSlot.Primary]: Input.EquipPrimary,
    [GameConfig.WeaponSlot.Secondary]: Input.EquipSecondary,
    [GameConfig.WeaponSlot.Melee]: Input.EquipMelee,
    [GameConfig.WeaponSlot.Throwable]: Input.EquipThrowable,
};

function domElemById(id: string) {
    return document.getElementById(id)!;
}
function isLmb(e: MouseEvent) {
    return e.button == 0;
}
function isRmb(e: MouseEvent) {
    return e.button == 2;
}
// These functions, copy and diff, only work if both
// arguments have the same internal structure
function copy(src: any, dst: any, path?: any) {
    if (src instanceof Array) {
        for (let i = 0; i < src.length; i++) {
            copy(src[i], path !== undefined ? dst[path] : dst, i);
        }
    } else if (src instanceof Object) {
        const keys = Object.keys(src);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            copy(src[key], path !== undefined ? dst[path] : dst, key);
        }
    } else {
        dst[path] = src;
    }
}

// 'all' could be removed if clone() were used instead of copy();
// with clone, oldState would begin with no properties and would
// thus automatically diff properly.
function diff(a: any, b: any, all: boolean): any {
    if (b instanceof Array) {
        const patch = [];
        for (let i = 0; i < b.length; i++) {
            patch[i] = diff(a[i], b[i], all);
        }
        return patch;
    }
    if (b instanceof Object) {
        const patch: Record<string, any> = {};
        const keys = Object.keys(b);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            patch[key] = diff(a[key], b[key], all);
        }
        return patch;
    }
    return a != b || all;
}

function m() {
    const e = GameObjectDefs.getAllTypes();
    const t = [];
    for (let r = 0; r < e.length; r++) {
        const a = e[r];
        const i = GameObjectDefs.typeToDef(a) as AmmoDef | HealDef | BoostDef;
        if (
            !(i as AmmoDef).hideUi
            && (i.type == "heal" || i.type == "boost" || i.type == "ammo")
        ) {
            t.push(a);
        }
    }
    return t;
}

class UiState {
    mobile = false;
    touch = false;
    rareLootMessage = {
        lootType: "",
        ticker: 0,
        duration: 0,
        opacity: 0,
    };

    pickupMessage = {
        message: "",
        ticker: 0,
        duration: 0,
        opacity: 0,
    };

    killMessage = {
        text: "",
        count: "",
        ticker: 0,
        duration: 0,
        opacity: 0,
    };

    killFeed = Array.from({ length: maxKillFeedLines }, () => ({
        text: "",
        color: "#000000",
        offset: 0,
        opacity: 0,
        ticker: Number.MAX_VALUE,
    }));

    ammo = {
        current: 0,
        remaining: 0,
        displayCurrent: false,
        displayRemaining: false,
    };

    interaction = {
        type: InteractionType.None,
        text: "",
        key: "",
        usable: false,
    };

    weapons = Array.from({ length: GameConfig.WeaponSlot.Count }, (_, i) => ({
        slot: i,
        type: "",
        ammo: 0,
        equipped: false,
        selectable: false,
        opacity: 0,
        width: 0,
        ticker: 0,
        bind: WeaponSlotToBind[i as keyof typeof WeaponSlotToBind],
        bindStr: "",
    }));

    scopes = SCOPE_LEVELS.map((type) => ({
        type,
        visible: false,
        equipped: false,
        selectable: false,
    }));

    loot = m().map((type) => ({
        type,
        count: 0,
        maximum: 0,
        selectable: false,
        width: 0,
        ticker: 0,
    }));

    perks = Array.from({ length: perkUiCount }, () => ({
        type: "",
        droppable: false,
        width: 0,
        ticker: 0,
        pulse: false,
    }));

    gear = GEAR_TYPES.map((type) => ({
        type,
        item: "",
        selectable: false,
        width: 0,
        ticker: 0,
        rot: 0,
    }));

    health = GameConfig.player.health as number;
    boost = 0;
    downed = false;
}

interface EventListeners<
    T extends keyof HTMLElementEventMap = keyof HTMLElementEventMap,
> {
    event: T;
    elem: HTMLElement;
    fn: (e: any) => void;
}
export class UiManager2 {
    // Ui state
    oldState = new UiState();
    newState = new UiState();
    frameCount = 0;

    // DOM
    dom = {
        debugButton: domElemById("ui-debug-button"),
        emoteButton: domElemById("ui-emote-button"),
        menu: {
            touchStyles: domElemById("btn-touch-styles"),
            aimLine: domElemById("btn-game-aim-line"),
        },
        rareLootMessage: {
            icon: domElemById("ui-perk-message-image-icon"),
            imageWrapper: domElemById("ui-perk-message-image-wrapper"),
            wrapper: domElemById("ui-perk-message-wrapper"),
            name: domElemById("ui-perk-message-name"),
            desc: domElemById("ui-perk-message-acquired"),
        },
        pickupMessage: domElemById("ui-pickup-message"),
        killMessage: {
            div: domElemById("ui-kills"),
            text: domElemById("ui-kill-text"),
            count: domElemById("ui-kill-count"),
        },
        killFeed: {
            div: domElemById("ui-killfeed-contents"),
            lines: [] as Array<{ line: HTMLElement; text: HTMLElement }>,
        },
        weapons: [] as Array<{
            div: HTMLElement;
            type: HTMLElement;
            number: HTMLElement;
            image: HTMLImageElement;
            ammo: HTMLElement;
        }>,
        ammo: {
            current: domElemById("ui-current-clip"),
            remaining: domElemById("ui-remaining-ammo"),
            reloadButton: domElemById("ui-reload-button-container"),
        },
        interaction: {
            div: domElemById("ui-interaction"),
            key: domElemById("ui-interaction-press"),
            text: domElemById("ui-interaction-description"),
        },
        health: {
            inner: domElemById("ui-health-actual"),
            depleted: domElemById("ui-health-depleted"),
        },
        boost: {
            div: domElemById("ui-boost-counter"),
            bars: [
                domElemById("ui-boost-counter-0").firstElementChild,
                domElemById("ui-boost-counter-1").firstElementChild,
                domElemById("ui-boost-counter-2").firstElementChild,
                domElemById("ui-boost-counter-3").firstElementChild,
            ] as HTMLElement[],
        },
        scopes: [] as Array<{
            scopeType: string;
            div: HTMLElement;
        }>,
        loot: [] as Array<{
            lootType: string;
            div: HTMLElement;
            count: HTMLElement;
            image: HTMLImageElement;
            overlay: HTMLElement;
        }>,
        gear: [] as Array<{
            gearType: (typeof GEAR_TYPES)[number];
            div: HTMLElement;
            level: HTMLElement;
            image: HTMLImageElement;
        }>,
        perks: [] as Array<{
            perkType: string;
            div: HTMLElement;
            divTitle: HTMLElement;
            divDesc: HTMLElement;
            image: HTMLImageElement;
        }>,
    };

    rareLootMessageQueue: string[] = [];
    uiEvents: Array<{ action: string; type: string; data: string | number }> = [];

    eventListeners = [] as EventListeners[];
    clearQueuedItemActions: () => void;
    onKeyUp: (e: KeyboardEvent) => void;
    // Game-item handling. Game item UIs support two actions:
    // left-click to use, and right-click to drop.
    itemActions = [] as Array<{
        action: string;
        type: string;
        data: string;
        div: HTMLElement;
        actionQueued: boolean;
        actionTime: number;
        touchOsId?: number;
    }>;

    constructor(
        public localization: Localization,
        public inputBinds: InputBinds,
    ) {
        // KillFeed
        for (let i = 0; i < maxKillFeedLines; i++) {
            // Search for an existing line; if we don't find one, create it
            const lineId = `ui-killfeed-${i}`;
            let line = domElemById(lineId);

            if (!line) {
                line = document.createElement("div");
                line.id = lineId;
                line.classList.add("killfeed-div");
                const child = document.createElement("div");
                child.classList.add("killfeed-text");
                line.appendChild(child);
                this.dom.killFeed.div.appendChild(line);
            }

            this.dom.killFeed.lines.push({
                line,
                text: line.firstElementChild as HTMLElement,
            });
        }

        // Weapon slot
        for (let i = 0; i < GameConfig.WeaponSlot.Count; i++) {
            const weapon = domElemById(`ui-weapon-id-${i + 1}`)!;
            const weaponData = {
                div: weapon,
                type: weapon.getElementsByClassName("ui-weapon-name")[0] as HTMLElement,
                number: weapon.getElementsByClassName(
                    "ui-weapon-number",
                )[0] as HTMLElement,
                image: weapon.getElementsByClassName(
                    "ui-weapon-image",
                )[0] as HTMLImageElement,
                ammo: weapon.getElementsByClassName(
                    "ui-weapon-ammo-counter",
                )[0] as HTMLElement,
            };
            this.dom.weapons.push(weaponData);
        }

        for (let i = 0; i < SCOPE_LEVELS.length; i++) {
            const scopeType = SCOPE_LEVELS[i];
            const x = {
                scopeType,
                div: domElemById(`ui-scope-${scopeType}`),
            };
            this.dom.scopes.push(x);
        }
        for (let S = m(), v = 0; v < S.length; v++) {
            const I = S[v];
            const T = domElemById(`ui-loot-${I}`);
            if (T) {
                const P = {
                    lootType: I,
                    div: T,
                    count: T.getElementsByClassName("ui-loot-count")[0] as HTMLElement,
                    image: T.getElementsByClassName(
                        "ui-loot-image",
                    )[0] as HTMLImageElement,
                    overlay: T.getElementsByClassName(
                        "ui-loot-overlay",
                    )[0] as HTMLElement,
                };
                this.dom.loot.push(P);
            }
        }
        for (let i = 0; i < GEAR_TYPES.length; i++) {
            const gearType = GEAR_TYPES[i];
            const div = domElemById(`ui-armor-${gearType}`);
            const L = {
                gearType,
                div,
                level: div.getElementsByClassName("ui-armor-level")[0] as HTMLElement,
                image: div.getElementsByClassName(
                    "ui-armor-image",
                )[0] as HTMLImageElement,
            };
            this.dom.gear.push(L);
        }
        for (let i = 0; i < perkUiCount; i++) {
            const perk = domElemById(`ui-perk-${i}`);
            const perkData = {
                perkType: "",
                div: perk,
                divTitle: perk.getElementsByClassName("tooltip-title")[0] as HTMLElement,
                divDesc: perk.getElementsByClassName("tooltip-desc")[0] as HTMLElement,
                image: perk.getElementsByClassName(
                    "ui-armor-image",
                )[0] as HTMLImageElement,
            };
            this.dom.perks.push(perkData);
        }

        const setEventListener = <
            T extends keyof HTMLElementEventMap = keyof HTMLElementEventMap,
        >(
            event: T,
            elem: HTMLElement,
            fn: (e: HTMLElementEventMap[T]) => void,
        ) => {
            this.eventListeners.push({
                event,
                elem,
                fn,
            });
            elem.addEventListener(event, fn);
        };

        const addItemAction = (
            action: string,
            type: string,
            data: string,
            div: HTMLElement,
        ) => {
            this.itemActions.push({
                action,
                type,
                data,
                div,
                actionQueued: false,
                actionTime: 0,
            });
        };

        for (let i = 0; i < this.dom.weapons.length; i++) {
            addItemAction(
                "use",
                "weapon",
                i as unknown as string,
                this.dom.weapons[i].div,
            );
            addItemAction(
                "drop",
                "weapon",
                i as unknown as string,
                this.dom.weapons[i].div,
            );
        }
        for (let i = 0; i < this.dom.scopes.length; i++) {
            const W = this.dom.scopes[i];
            addItemAction("use", "scope", W.scopeType, W.div);
            if (W.scopeType != "1xscope") {
                addItemAction("drop", "loot", W.scopeType, W.div);
            }
        }
        for (let i = 0; i < this.dom.loot.length; i++) {
            const loot = this.dom.loot[i];
            const def = GameObjectDefs.typeToDef(loot.lootType);
            if (def.type == "heal" || def.type == "boost") {
                addItemAction("use", "loot", loot.lootType, loot.div);
            }
            addItemAction("drop", "loot", loot.lootType, loot.div);
        }
        for (let i = 0; i < this.dom.gear.length; i++) {
            const gear = this.dom.gear[i];
            if (gear.gearType != "backpack") {
                addItemAction("drop", "loot", gear.gearType, gear.div);
            }
        }
        for (let i = 0; i < this.dom.perks.length; i++) {
            addItemAction("drop", "perk", i as unknown as string, this.dom.perks[i].div);
        }
        for (let i = 0; i < this.itemActions.length; i++) {
            const item = this.itemActions[i];
            setEventListener("mousedown", item.div, (e) => {
                if (
                    (item.action == "use" && isLmb(e))
                    || (item.action == "drop" && isRmb(e))
                ) {
                    e.stopPropagation();
                    item.actionQueued = true;
                }
            });
            setEventListener("mouseup", item.div, (e) => {
                if (
                    item.actionQueued
                    && ((item.action == "use" && isLmb(e))
                        || (item.action == "drop" && isRmb(e)))
                ) {
                    e.stopPropagation();
                    this.pushAction(item);
                    item.actionQueued = false;
                }
            });
            setEventListener("touchstart", item.div, (e) => {
                if (e.changedTouches.length > 0) {
                    e.stopPropagation();
                    item.actionQueued = true;
                    item.actionTime = new Date().getTime();
                    item.touchOsId = e.changedTouches[0].identifier;
                }
            });
            setEventListener("touchend", item.div, (_e) => {
                if (
                    new Date().getTime() - item.actionTime < touchHoldDuration
                    && item.actionQueued
                    && item.action == "use"
                ) {
                    this.pushAction(item);
                }
                item.actionQueued = false;
            });
            setEventListener("touchcancel", item.div, (_e) => {
                item.actionQueued = false;
            });
        }

        const canvas = document.getElementById("cvs")!;
        this.clearQueuedItemActions = () => {
            for (let i = 0; i < this.itemActions.length; i++) {
                this.itemActions[i].actionQueued = false;
            }

            // @HACK: Get rid of :hover styling when using touch
            if (device.touch) {
                canvas.focus();
            }
        };

        window.addEventListener("mouseup", this.clearQueuedItemActions);
        window.addEventListener("focus", this.clearQueuedItemActions);

        this.onKeyUp = (e: KeyboardEvent) => {
            // Add an input handler specifically to handle fullscreen on Firefox;
            // "requestFullscreen() must be called from inside a short running user-generated event handler."
            const keyCode = e.which || e.keyCode;
            const bind = this.inputBinds.getBind(Input.Fullscreen);
            if (bind && keyCode == bind.code) {
                helpers.toggleFullScreen();
            }
        };
        window.addEventListener("keyup", this.onKeyUp);
    }

    m_free() {
        for (let i = 0; i < this.eventListeners.length; i++) {
            const e = this.eventListeners[i];
            e.elem.removeEventListener(e.event, e.fn);
        }

        window.removeEventListener("focus", this.clearQueuedItemActions);

        window.removeEventListener("mouseup", this.clearQueuedItemActions);
        window.removeEventListener("keyup", this.onKeyUp);
    }

    pushAction(itemAction: { action: string; type: string; data: string }) {
        this.uiEvents.push({
            action: itemAction.action,
            type: itemAction.type,
            data: itemAction.data,
        });
    }

    flushInput() {
        this.uiEvents = [];
    }

    m_update(
        dt: number,
        activePlayer: Player,
        spectating: boolean,
        playerBarn: PlayerBarn,
        lootBarn: LootBarn,
        map: Map,
        inputBinds: InputBinds,
    ) {
        const state = this.newState;

        // Device
        state.mobile = device.mobile;
        state.touch = device.touch;
        // Process touch-hold events
        if (state.touch) {
            for (let i = 0; i < this.itemActions.length; i++) {
                const itemAction = this.itemActions[i];
                if (itemAction.actionQueued && itemAction.action == "drop") {
                    const time = new Date().getTime();
                    const elapsed = time - itemAction.actionTime;
                    if (elapsed >= touchHoldDuration) {
                        this.pushAction(itemAction);
                        itemAction.actionTime = time;
                        itemAction.actionQueued = false;
                    }
                }
            }
        }

        // Perk message
        if (
            state.rareLootMessage.ticker >= state.rareLootMessage.duration
            // Create a new message if we aren't displaying one
            && this.rareLootMessageQueue.length > 0
        ) {
            const lootType = this.rareLootMessageQueue.shift()!;
            state.rareLootMessage.lootType = lootType;
            state.rareLootMessage.ticker = 0;
            state.rareLootMessage.duration = this.rareLootMessageQueue.length > 0 ? 2 : 4;
            state.rareLootMessage.opacity = 0;
        }

        // Update displayed message message
        state.rareLootMessage.ticker += dt;
        const g = state.rareLootMessage.ticker;
        const f = state.rareLootMessage.duration;
        state.rareLootMessage.opacity = 1 - math.smoothstep(g, f - 0.2, f);

        // Pickup message
        state.pickupMessage.ticker += dt;
        const x = state.pickupMessage.ticker;
        const z = state.pickupMessage.duration;
        state.pickupMessage.opacity = math.smoothstep(x, 0, 0.2)
            * (1 - math.smoothstep(x, z, z + 0.2))
            * (1 - state.rareLootMessage.opacity);

        // Kill message
        state.killMessage.ticker += dt;
        const I = state.killMessage.ticker;
        const T = state.killMessage.duration;
        state.killMessage.opacity = (1 - math.smoothstep(I, T - 0.2, T)) * (1 - state.rareLootMessage.opacity);

        // KillFeed
        let offset = 0;
        for (let i = 0; i < state.killFeed.length; i++) {
            const line = state.killFeed[i];
            line.ticker += dt;
            const E = line.ticker;
            line.offset = offset;
            line.opacity = math.smoothstep(E, 0, 0.25) * (1 - math.smoothstep(E, 6, 6.5));
            offset += math.min(E / 0.25, 1);

            // Shorter animation on mobile
            if (device.mobile) {
                line.opacity = E < 6.5 ? 1 : 0;
            }
        }

        // Player status
        state.health = activePlayer.m_netData.m_dead
            ? 0
            : math.max(activePlayer.m_localData.m_health, 1);
        state.boost = activePlayer.m_localData.m_boost;
        state.downed = activePlayer.m_netData.m_downed;

        // Interaction
        let interactionType = InteractionType.None;
        let interactionObject: Obstacle | Loot | Player | null = null;
        let interactionUsable = true;

        if (activePlayer.canInteract(map)) {
            // Usable obstacles
            let closestObj = null;
            let closestPen = 0;
            const obstacles = map.m_obstaclePool.m_getPool();

            for (let i = 0; i < obstacles.length; i++) {
                const obstacle = obstacles[i];
                if (
                    obstacle.active
                    && !obstacle.dead
                    && util.sameLayer(obstacle.layer, activePlayer.layer)
                ) {
                    const interact = obstacle.getInteraction(activePlayer);
                    if (interact) {
                        if (obstacle.isButton && obstacle.button.isVat) {
                            const distance = v2.distance(
                                activePlayer.m_pos,
                                obstacle.pos,
                            );

                            if (
                                distance + activePlayer.m_rad
                                    < interact.rad * obstacle.scale
                            ) {
                                closestObj = obstacle;
                                closestPen = 0;
                            }
                        } else {
                            const res = collider.intersectCircle(
                                obstacle.collider,
                                activePlayer.m_netData.m_pos,
                                interact.rad + activePlayer.m_rad,
                            );
                            if (res && res.pen >= closestPen) {
                                closestObj = obstacle;
                                closestPen = res.pen;
                            }
                        }
                    }
                }
            }
            if (closestObj) {
                interactionType = InteractionType.Object;
                interactionObject = closestObj;
                interactionUsable = true;
            }

            // Loot
            const loot = lootBarn.getClosestLoot();
            if (loot && !activePlayer.m_netData.m_downed) {
                // Ignore if it's a gun and we have full guns w/ fists out...
                // unless we're on a small screen
                const itemDef = GameObjectDefs.typeToDef(loot.type) as LootDef;

                const X = activePlayer.m_hasWeaponInSlot(GameConfig.WeaponSlot.Primary);
                const K = activePlayer.m_hasWeaponInSlot(GameConfig.WeaponSlot.Secondary);
                const Z = X && K;
                const usable = itemDef.type != "gun"
                    || !Z
                    || activePlayer.m_equippedWeaponType() == "gun";

                let J = false;
                if (
                    (state.touch
                        && itemDef.type == "helmet"
                        && activePlayer.m_getHelmetLevel() == itemDef.level
                        && loot.type != activePlayer.m_netData.m_helmet)
                    || (itemDef.type == "chest"
                        && activePlayer.m_getChestLevel() == itemDef.level
                        && loot.type != activePlayer.m_netData.m_chest)
                ) {
                    J = true;
                }

                if (usable || device.uiLayout == device.UiLayout.Sm) {
                    interactionType = InteractionType.Loot;
                    interactionObject = loot;
                }
                interactionUsable = usable
                    && (!state.touch
                        || itemDef.type == "gun"
                        || itemDef.type == "melee"
                        || itemDef.type == "outfit"
                        || itemDef.type == "perk"
                        || J);
            }

            // Reviving
            const canSelfRevive = activePlayer.m_hasPerk("self_revive");

            if (
                activePlayer.m_action.type == Action.None
                && (!activePlayer.m_netData.m_downed || canSelfRevive)
            ) {
                const ourTeamId = playerBarn.getPlayerInfo(activePlayer.__id).teamId;
                const players = playerBarn.playerPool.m_getPool();

                for (let i = 0; i < players.length; i++) {
                    const p = players[i];
                    if (p.active) {
                        const theirTeamId = playerBarn.getPlayerInfo(p.__id).teamId;
                        if (
                            (p.__id != activePlayer.__id || canSelfRevive)
                            && ourTeamId == theirTeamId
                            && p.m_netData.m_downed
                            && !p.m_netData.m_dead
                            && p.m_action.type != Action.Revive
                        ) {
                            const dist = v2.length(
                                v2.sub(p.m_netData.m_pos, activePlayer.m_netData.m_pos),
                            );
                            if (
                                dist < GameConfig.player.reviveRange
                                && util.sameLayer(p.layer, activePlayer.layer)
                            ) {
                                interactionType = InteractionType.Revive;
                                interactionObject = p;
                                interactionUsable = true;
                            }
                        }
                    }
                }
            }

            if (
                activePlayer.m_action.type == Action.Revive
                && activePlayer.m_netData.m_downed
                && !canSelfRevive
            ) {
                interactionType = InteractionType.None;
                interactionObject = null;
                interactionUsable = false;
            }

            if (
                (activePlayer.m_action.type == Action.UseItem
                    || (activePlayer.m_action.type == Action.Revive
                        && (!activePlayer.m_netData.m_downed || !!canSelfRevive)))
                && !spectating
            ) {
                interactionType = InteractionType.Cancel;
                interactionObject = null;
                interactionUsable = true;
            }
        }
        state.interaction.type = interactionType;
        state.interaction.text = this.getInteractionText(
            interactionType,
            interactionObject!,
            activePlayer,
        );
        state.interaction.key = this.getInteractionKey(interactionType);
        state.interaction.usable = interactionUsable && !spectating;

        function updateAnimationWidth(item: { ticker: number; width: number }, duration: number) {
            if (device.mobile) {
                item.width = 0;
                return;
            }

            const animationTime = math.min(item.ticker / duration, Math.PI); // still not fully set on that variable name... but I can't think of anything else to call it...
            const animationWidth = Math.sin(animationTime);
            item.width = animationWidth < 0.001 ? 0 : animationWidth;
        }        

        for (let weaponIndex = 0; weaponIndex < activePlayer.m_localData.m_weapons.length; weaponIndex++) {
            const playerWeapon = activePlayer.m_localData.m_weapons[weaponIndex];
            const weaponState = state.weapons[weaponIndex];
            weaponState.type = playerWeapon.type;
            weaponState.ammo = playerWeapon.ammo;
            if (weaponIndex == GameConfig.WeaponSlot.Throwable) {
                weaponState.ammo = activePlayer.m_localData.m_inventory[playerWeapon.type] || 0;
            }

            const wasEquipped = weaponState.equipped;
            weaponState.equipped = weaponIndex == activePlayer.m_localData.m_curWeapIdx;
            weaponState.selectable = (playerWeapon.type != "" || weaponIndex == GameConfig.WeaponSlot.Primary || weaponIndex == GameConfig.WeaponSlot.Secondary) && !spectating; // more "code" but more semantic
            const targetOpacity = weaponState.equipped ? 1 : 0.6;
            const opacityDelta = targetOpacity - weaponState.opacity;
            const opacityStep = math.min(opacityDelta, (math.sign(opacityDelta) * dt) / 0.15);
            weaponState.opacity = math.clamp(weaponState.opacity + opacityStep, 0, 1);

            if (device.mobile) {
                weaponState.opacity = targetOpacity;
            }
            if (weaponState.type == "bugle" && weaponState.ammo == 0) {
                weaponState.opacity = 0.25;
            }
            weaponState.ticker += dt;
            if (!weaponState.equipped || !wasEquipped) {
                weaponState.ticker = 0;
            }
            if (this.frameCount < 2) {
                weaponState.ticker = 1;
            }

            updateAnimationWidth(weaponState, 0.09);

            const weaponInputBind = inputBinds.getBind(weaponState.bind);
            weaponState.bindStr = weaponInputBind ? weaponInputBind.toString() : "";
        }

        const playerWeaponState = state.weapons[activePlayer.m_localData.m_curWeapIdx];
        const weaponDef = GameObjectDefs.typeToDef(playerWeaponState.type) as GunDef | MeleeDef;
        const currentAmmo = playerWeaponState.ammo;
        let remainingWeaponAmmo = 0;
        if (weaponDef.type === "gun") {
            const infiniteAmmo = weaponDef.ammoInfinite || (activePlayer.m_hasPerk("endless_ammo") && !weaponDef.ignoreEndlessAmmo);
            remainingWeaponAmmo = infiniteAmmo 
                ? Number.MAX_VALUE 
                : activePlayer.m_localData.m_inventory[weaponDef.ammo];

        }
        state.ammo.current = currentAmmo;
        state.ammo.remaining = remainingWeaponAmmo;
        state.ammo.displayCurrent = weaponDef.type != "melee";
        state.ammo.displayRemaining = remainingWeaponAmmo > 0;

        for (let scopeIndex = 0; scopeIndex < state.scopes.length; scopeIndex++) {
            const scopeState = state.scopes[scopeIndex];
            scopeState.visible = activePlayer.m_localData.m_inventory[scopeState.type] > 0;
            scopeState.equipped = scopeState.visible && activePlayer.m_localData.m_scope == scopeState.type;
            scopeState.selectable = scopeState.visible && !spectating;
        }

        const playerBagLevel = activePlayer.m_getBagLevel(); // weird minifier putting this in the loop... or maybe I am wrong and this should be in there...

        for (let lootIndex = 0; lootIndex < state.loot.length; lootIndex++) {
            const lootState = state.loot[lootIndex];
            const previousLootCount = lootState.count;
            lootState.count = activePlayer.m_localData.m_inventory[lootState.type] || 0;
            lootState.maximum = GameConfig.bagSizes[lootState.type as InventoryItem][playerBagLevel];
            lootState.selectable = lootState.count > 0 && !spectating;
            if (lootState.count > previousLootCount) {
                lootState.ticker = 0;
            }
            if (this.frameCount < 2) {
                lootState.ticker = 1;
            }
            lootState.ticker += dt;

            updateAnimationWidth(lootState, 0.05);
        }

        for (let gearIndex = 0; gearIndex < state.gear.length; gearIndex++) {
            const gearState = state.gear[gearIndex];
            let equippedItem = "";
            switch (gearState.type) {
                case "chest": {
                    equippedItem = activePlayer.m_netData.m_chest;
                    break;
                }
                case "helmet": {
                    equippedItem = activePlayer.m_netData.m_helmet;
                    break;
                }
                case "backpack": {
                    if ((equippedItem = activePlayer.m_netData.m_backpack) === "backpack00") {
                        equippedItem = "";
                        break;
                    }
                    break;
                }
            }

            const previousGearItem = gearState.item;
            gearState.item = equippedItem;
            gearState.selectable = equippedItem != "" && !spectating;
            if (previousGearItem != gearState.item) {
                gearState.ticker = 0;
            }
            if (this.frameCount < 2) {
                gearState.ticker = 1;
            }
            gearState.ticker += dt;

            updateAnimationWidth(gearState, 0.05);
        }

        for (let perkIndex = 0; perkIndex < state.perks.length; perkIndex++) {
            const perkState = state.perks[perkIndex];
            if (activePlayer.perks.length > perkIndex) {
                const playerPerk = activePlayer.perks[perkIndex];
                perkState.type = playerPerk.type;
                perkState.droppable = playerPerk.droppable;
                if (playerPerk.isNew) {
                    perkState.ticker = 0;
                }
                if (this.frameCount < 2) {
                    perkState.ticker = 1;
                }
                perkState.ticker += dt;

                updateAnimationWidth(perkState, 0.05);

                perkState.pulse = !device.mobile && perkState.ticker < 4;
            } else {
                perkState.type = "";
            }
        }

        // render state diff
        const patch = diff(this.oldState, this.newState, this.frameCount++ == 0);
        this.render(patch, this.newState);
        copy(this.newState, this.oldState);
    }

    render(patch: UiState, state: UiState) {
        const dom = this.dom;

        // Touch
        if (patch.touch) {
            dom.interaction.key.style.backgroundImage = state.touch
                ? "url('img/gui/tap.svg')"
                : "none";
            if (state.touch) {
                dom.interaction.key.innerHTML = "";
            }
            dom.menu.touchStyles.style.display = state.touch ? "flex" : "none";
            dom.menu.aimLine.style.display = state.touch ? "block" : "none";
            dom.ammo.reloadButton.style.display = state.touch ? "block" : "none";
            dom.emoteButton.style.display = state.touch ? "block" : "none";
            if (dom.debugButton) {
                dom.debugButton.style.display = state.touch ? "block" : "none";
            }
        }

        // Rare loot message
        if (patch.rareLootMessage.lootType) {
            const lootType = state.rareLootMessage.lootType;
            const lootDef = GameObjectDefs.typeToDefSafe(lootType) as LootDef;
            if (lootDef && lootDef.type == "xp") {
                const lootDesc = this.localization.translate("game-xp-drop-desc");
                dom.rareLootMessage.desc.innerHTML = `+${lootDef.xp} ${lootDesc}`;
            } else {
                dom.rareLootMessage.desc.innerHTML = "";
            }

            const bgImg = lootDef?.lootImg?.border
                ? `url(img/loot/${lootDef.lootImg.border.slice(0, -4)}.svg)`
                : "none";
            dom.rareLootMessage.imageWrapper.style.backgroundImage = bgImg;
            const lootImg = helpers.getSvgFromGameType(lootType);
            dom.rareLootMessage.icon.style.backgroundImage = lootImg
                ? `url('${lootImg}')`
                : "none";
            const lootName = this.localization.translate(`game-${lootType}`);

            dom.rareLootMessage.name.innerHTML = lootName;
        }

        if (patch.rareLootMessage.opacity) {
            dom.rareLootMessage.wrapper.style.opacity = String(
                state.rareLootMessage.opacity,
            );
        }

        // Pickup message
        if (patch.pickupMessage.message) {
            dom.pickupMessage.innerHTML = state.pickupMessage.message;
        }
        if (patch.pickupMessage.opacity) {
            dom.pickupMessage.style.opacity = String(state.pickupMessage.opacity);
        }

        // Kill message
        if (patch.killMessage.text || patch.killMessage.count) {
            dom.killMessage.text.innerHTML = state.killMessage.text;
            dom.killMessage.count.innerHTML = state.killMessage.count;
        }
        if (patch.killMessage.opacity) {
            dom.killMessage.div.style.opacity = String(state.killMessage.opacity);
        }

        // KillFeed
        for (let i = 0; i < patch.killFeed.length; i++) {
            const patchK = patch.killFeed[i];
            const domK = dom.killFeed.lines[i];
            const x = state.killFeed[i];

            if (patchK.text) {
                domK.text.innerHTML = x.text;
            }

            if (patchK.offset) {
                const top = device.uiLayout != device.UiLayout.Sm || device.tablet ? 35 : 15;
                domK.line.style.top = `${Math.floor(x.offset * top)}px`;
            }
            if (patchK.color) {
                domK.text.style.color = x.color;
            }
            if (patchK.opacity) {
                domK.line.style.opacity = String(x.opacity);
            }
        }

        // Health
        if (patch.health || patch.downed) {
            const steps = [
                {
                    health: 100,
                    color: [179, 179, 179],
                },
                {
                    health: 100,
                    color: [255, 255, 255],
                },
                {
                    health: 75,
                    color: [255, 255, 255],
                },
                {
                    health: 75,
                    color: [255, 158, 158],
                },
                {
                    health: 25,
                    color: [255, 82, 82],
                },
                {
                    health: 25,
                    color: [255, 0, 0],
                },
                {
                    health: 0,
                    color: [255, 0, 0],
                },
            ];

            let endIdx = 0;
            const health = Math.ceil(state.health);

            while (steps[endIdx].health > health && endIdx < steps.length - 1) {
                endIdx++;
            }

            const stepA = steps[math.max(endIdx - 1, 0)];
            const stepB = steps[endIdx];
            const t = math.delerp(state.health, stepA.health, stepB.health);
            let rgb = [
                Math.floor(math.lerp(t, stepA.color[0], stepB.color[0])),
                Math.floor(math.lerp(t, stepA.color[1], stepB.color[1])),
                Math.floor(math.lerp(t, stepA.color[2], stepB.color[2])),
            ];

            if (state.downed) {
                rgb = [255, 0, 0];
            }

            dom.health.inner.style.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1.0)`;
            dom.health.inner.style.width = `${state.health}%`;
            dom.health.depleted.style.width = `${state.health}%`;
            dom.health.depleted.style.display = state.health > 0 ? "block" : "none";
            if (state.health > 25) {
                dom.health.inner.classList.remove("ui-bar-danger");
            } else {
                dom.health.inner.classList.add("ui-bar-danger");
            }
        }
        if (patch.boost) {
            const breakPoints = GameConfig.player.boostBreakpoints;
            const max = breakPoints.reduce((a, b) => a + b, 0);

            let boostT = state.boost / 100;
            for (let i = 0; i < dom.boost.bars.length; i++) {
                const breakPointT = breakPoints[i] / max;
                const widthT = math.clamp(boostT / breakPointT, 0, 1);
                boostT = math.max(boostT - breakPointT, 0);
                dom.boost.bars[i].style.width = `${widthT * 100}%`;
            }
            dom.boost.div.style.opacity = String(state.boost == 0 ? 0 : 1);
        }
        if (patch.interaction.type) {
            dom.interaction.div.style.display = state.interaction.type == InteractionType.None ? "none" : "flex";
        }
        if (patch.interaction.text) {
            dom.interaction.text.innerHTML = state.interaction.text;
        }
        if (patch.interaction.key) {
            dom.interaction.key.innerHTML = state.touch ? "" : state.interaction.key;
            dom.interaction.key.className = dom.interaction.key.innerHTML.length > 1
                ? "ui-interaction-small"
                : "ui-interaction-large";
        }
        if (patch.interaction.usable) {
            dom.interaction.key.style.display = state.interaction.usable
                ? "block"
                : "none";
        }

        for (let weaponIndex = 0; weaponIndex < patch.weapons.length; weaponIndex++) {
            const weaponPatch = patch.weapons[weaponIndex];
            const weaponDom = dom.weapons[weaponIndex];
            const weaponState = state.weapons[weaponIndex];
            if (weaponPatch.type) {
                let weaponName = "";
                let weaponTransformCss = "";
                const weaponDef = GameObjectDefs.typeToDefSafe(weaponState.type);
                if (weaponDef) {
                    weaponName = this.localization.translate(`game-hud-${weaponState.type}`)
                        || this.localization.translate(`game-${weaponState.type}`);
                    weaponTransformCss = helpers.getCssTransformFromGameType(weaponState.type);
                }

                weaponDom.type.innerHTML = weaponName;
                weaponDom.image.src = helpers.getSvgFromGameType(weaponState.type);
                weaponDom.image.style.display = weaponDef ? "inline" : "none";
                weaponDom.image.style.transform = weaponTransformCss;
            }
            if (weaponPatch.equipped) {
                weaponDom.div.style.backgroundColor = weaponState.equipped
                    ? "rgba(0, 0, 0, 0.4)"
                    : "rgba(0, 0, 0, 0)";
            }
            if (weaponPatch.selectable) {
                weaponDom.div.style.pointerEvents = weaponState.type !== "" || weaponState.selectable ? "auto" : "none";
            }
            if (weaponPatch.width) {
                const weaponWidth = math.lerp(weaponState.width, 83.33, 100);
                weaponDom.div.style.width = `${weaponWidth}%`;
            }
            if (weaponPatch.opacity) {
                weaponDom.div.style.opacity = String(weaponState.opacity);
            }
            if (weaponPatch.ammo && weaponDom.ammo) {
                weaponDom.ammo.innerHTML = String(weaponState.ammo);
                weaponDom.ammo.style.display = weaponState.ammo > 0 ? "block" : "none";
            }
            if (weaponPatch.bindStr) {
                weaponDom.number.innerHTML = weaponState.bindStr[0] || "";
            }
        }
        if (patch.ammo.current) {
            const currentAmmo = state.ammo.current;
            dom.ammo.current.innerHTML = String(currentAmmo);
            dom.ammo.current.style.color = currentAmmo > 0 ? "white" : "red";
        }
        if (patch.ammo.remaining) {
            const remainingAmmo = state.ammo.remaining;
            dom.ammo.remaining.innerHTML = String(remainingAmmo === Number.MAX_VALUE ? "&#8734;" : remainingAmmo);
            dom.ammo.remaining.style.color = remainingAmmo !== 0 ? "white" : "red";
        }
        if (patch.ammo.displayCurrent) {
            dom.ammo.current.style.opacity = String(state.ammo.displayCurrent ? 1 : 0);
        }
        if (patch.ammo.displayRemaining) {
            dom.ammo.remaining.style.opacity = String(
                state.ammo.displayRemaining ? 1 : 0,
            );
            dom.ammo.reloadButton.style.opacity = String(
                state.ammo.displayRemaining ? 1 : 0,
            );
        }

        for (let scopeIndex = 0; scopeIndex < patch.scopes.length; scopeIndex++) {
            const scopePatch = patch.scopes[scopeIndex];
            const scopeDom = dom.scopes[scopeIndex];
            const scopeState = state.scopes[scopeIndex];
            if (scopePatch.visible) {
                scopeDom.div.classList.toggle("ui-hidden", !scopeState.visible);
            }
            if (scopePatch.equipped) {
                scopeDom.div.classList.toggle("ui-zoom-active", scopeState.equipped);
                scopeDom.div.classList.toggle("ui-zoom-inactive", !scopeState.equipped);
            }
            if (scopePatch.selectable) {
                scopeDom.div.style.pointerEvents = scopeState.selectable ? "auto" : "none";
            }
        }

        for (let lootIndex = 0; lootIndex < patch.loot.length; lootIndex++) {
            const lootPatch = patch.loot[lootIndex];
            const lootDom = dom.loot[lootIndex];
            const lootState = state.loot[lootIndex];
            if (lootPatch && lootDom && lootState) {
                if (lootPatch.count || lootPatch.maximum) {
                    lootDom.count.innerHTML = String(lootState.count);
                    lootDom.div.style.opacity = String(
                        (GameObjectDefs.typeToDef(lootDom.lootType) as AmmoDef).special && lootState.count == 0
                            ? 0
                            : lootState.count > 0
                            ? 1
                            : 0.25,
                    );
                    lootDom.div.style.color = lootState.count === lootState.maximum ? "#ff9900" : "#ffffff";
                }
                if (lootPatch.width) {
                    const scale = 1 + lootState.width * 0.33;
                    const transform = `scale(${scale}, ${scale})`;
                    lootDom.image.style.transform = transform;
                    if (lootDom.overlay) {
                        lootDom.overlay.style.transform = transform;
                    }
                }
                if (lootPatch.selectable) {
                    lootDom.div.style.pointerEvents = lootState.selectable ? "auto" : "none";
                }
            }
        }

        for (let gearIndex = 0; gearIndex < patch.gear.length; gearIndex++) {
            const gearPatch = patch.gear[gearIndex];
            const gearDom = dom.gear[gearIndex];
            const gearState = state.gear[gearIndex];
            if (gearPatch.item) {
                // GearDef? | new comment from the future answering this -> yes! or well I think :p (I should probably delete this)
                const gearDef = gearState.item ? (GameObjectDefs.typeToDef(gearState.item) as ChestDef) : null;
                const gearLevel = gearDef ? gearDef.level : 0;
                gearDom.div.style.display = gearDef ? "block" : "none";
                gearDom.level.innerHTML = this.localization.translate(`game-level-${gearLevel}`);
                gearDom.level.style.color = gearLevel === 4 ? "#b30000" : gearLevel === 3 ? "#ff9900" : "#ffffff";
                gearDom.image.src = helpers.getSvgFromGameType(gearState.item);
            }
            if (gearPatch.selectable) {
                gearDom.div.style.pointerEvents = gearState.selectable ? "auto" : "none";
            }
            if (gearPatch.width) {
                const scale = 1 + gearState.width * 0.33;
                let transform = `scale(${scale}, ${scale})`;
                const meleeGearDef = GameObjectDefs.typeToDefSafe(gearState.item) as MeleeDef;
                if (meleeGearDef?.lootImg.rot !== undefined) {
                    transform += ` rotate(${meleeGearDef.lootImg.rot}rad)`;
                }
                gearDom.image.style.transform = transform;
            }
        }

        for (let perkIndex = 0; perkIndex < patch.perks.length; perkIndex++) {
            const perkPatch = patch.perks[perkIndex];
            const perkDom = dom.perks[perkIndex];
            const perkState = state.perks[perkIndex];
            if (perkPatch.type) {
                perkDom.perkType = perkState.type;
                perkDom.divTitle.innerHTML = this.localization.translate(`game-${perkState.type}`);
                perkDom.divDesc.innerHTML = this.localization.translate(`game-${perkState.type}-desc`,);
                perkDom.div.style.display = perkState.type ? "block" : "none";
                perkDom.image.src = perkState.type ? helpers.getSvgFromGameType(perkState.type) : "";
            }
            if (perkPatch.droppable) {
                perkDom.div.classList.toggle("ui-outline-hover", perkState.droppable);
                perkDom.div.classList.toggle("ui-perk-no-drop", !perkState.droppable);
            }
            if (perkPatch.pulse) {
                perkDom.div.classList.toggle("ui-perk-pulse", perkState.pulse);
            }
            if (perkPatch.width) {
                const scale = 1 + perkState.width * 0.33;
                perkDom.image.style.transform = `scale(${scale}, ${scale})`; // well that is interesting... the minifier got rid of the `transform` variable... actually no it isn't because the `transform` variable is only used once here the minifier sees this as less code and whatnot :p
            }
        }
    }

    displayPickupMessage(type: PickupMsgType) {
        const p = this.newState.pickupMessage;
        p.message = this.getPickupMessageText(type);
        p.ticker = 0;
        p.duration = 3;
    }

    displayKillMessage(text: string, count: string) {
        const p = this.newState.killMessage;
        p.text = text;
        p.count = count;
        p.ticker = 0;
        p.duration = 7;
    }

    hideKillMessage() {
        this.newState.killMessage.ticker = math.max(
            this.newState.killMessage.ticker,
            this.newState.killMessage.duration - 0.2,
        );
    }

    addRareLootMessage(lootType: string, clearQueue?: boolean) {
        if (clearQueue) {
            this.newState.rareLootMessage.ticker = this.newState.rareLootMessage.duration;
            this.rareLootMessageQueue = [];
        }
        this.rareLootMessageQueue.push(lootType);
    }

    removeRareLootMessage(lootType: string) {
        const idx = this.rareLootMessageQueue.indexOf(lootType);

        if (idx >= 0) {
            this.rareLootMessageQueue.splice(idx, 1);
        }

        if (this.newState.rareLootMessage.lootType == lootType) {
            this.newState.rareLootMessage.ticker = this.newState.rareLootMessage.duration;
        }
    }

    getRareLootMessageText(perk: string) {
        if (GameObjectDefs.typeExists(perk)) {
            return `Acquired perk: ${this.localization.translate(`game-${perk}`)}`;
        }
        return "";
    }

    addKillFeedMessage(text: string, color: string) {
        const killFeed = this.newState.killFeed;
        const oldest = killFeed[killFeed.length - 1];
        oldest.text = text;
        oldest.color = color;
        oldest.ticker = 0;
        killFeed.sort((a, b) => {
            return a.ticker - b.ticker;
        });
    }

    getKillFeedText(
        targetName: string,
        killerName: string,
        sourceType: string,
        damageType: DamageType,
        downed: boolean,
    ) {
        switch (damageType) {
            case DamageType.Player:
                return `${killerName} ${
                    this.localization.translate(
                        downed ? "game-knocked-out" : "game-killed",
                    )
                } ${targetName} ${
                    this.localization.translate(
                        "game-with",
                    )
                } ${this.localization.translate(`game-${sourceType}`)}`;
            case DamageType.Bleeding: {
                const killTxt = this.localization.translate(
                    killerName ? "game-finally-killed" : "game-finally-bled-out",
                );
                if (killerName) {
                    return `${killerName} ${killTxt} ${targetName}`;
                }
                return `${targetName} ${killTxt}`;
            }
            case DamageType.Gas: {
                let killName;
                let killTxt;
                if (downed) {
                    killName = this.localization.translate("game-the-red-zone");
                    killTxt = this.localization.translate("game-knocked-out");
                } else {
                    killTxt = this.localization.translate(
                        killerName ? "game-finally-killed" : "game-died-outside",
                    );
                }
                if (killName) {
                    return `${killName} ${killTxt} ${targetName}`;
                }
                return `${targetName} ${killTxt}`;
            }
            case DamageType.Airdrop: {
                const mapObj = MapObjectDefs.typeToDefSafe(sourceType) as ObstacleDef;
                const killName = this.localization.translate("game-the-air-drop");
                const killTxt = downed
                    ? this.localization.translate("game-knocked-out")
                    : mapObj && !mapObj.airdropCrate
                    ? this.localization.translate("game-killed")
                    : this.localization.translate("game-crushed");
                return `${killName} ${killTxt} ${targetName}`;
            }
            case DamageType.Airstrike: {
                const killTxt = this.localization.translate(
                    downed ? "game-knocked-out" : "game-killed",
                );
                if (killerName) {
                    return `${killerName} ${killTxt} ${targetName} ${
                        this.localization.translate(
                            "game-with",
                        )
                    } ${this.localization.translate("game-an-air-strike")}`;
                }
                return `${
                    this.localization.translate(
                        "game-the-air-strike",
                    )
                } ${killTxt} ${targetName}`;
            }
            default:
                return "";
        }
    }

    getKillFeedColor(
        activeTeamId: number,
        targetTeamId: number,
        killerTeamId: number,
        factionMode: boolean,
    ) {
        if (factionMode) {
            return "#efeeee";
        }
        if (activeTeamId == targetTeamId) {
            return "#d1777c";
        }
        if (activeTeamId == killerTeamId) {
            return "#00bfff";
        }
        return "#efeeee";
    }

    getRoleKillFeedColor(role: string, teamId: number, playerBarn: PlayerBarn) {
        const roleDef = GameObjectDefs.typeToDefSafe(role) as RoleDef | undefined;
        if (roleDef?.killFeed?.color) {
            return roleDef.killFeed.color;
        }
        return helpers.colorToHexString(playerBarn.getTeamColor(teamId));
    }

    getRoleTranslation(role: string, teamId: number) {
        let roleTxt = `game-${role}`;
        if (role == "leader") {
            roleTxt = teamId == GameConfig.FactionTeam.Red ? "game-red-leader" : "game-blue-leader";
        }
        return this.localization.translate(roleTxt);
    }

    getRoleAnnouncementText(role: string, teamId: number) {
        return `${
            this.localization.translate(
                "game-youve-been-promoted-to",
            )
        } ${this.getRoleTranslation(role, teamId)}!`;
    }

    getRoleAssignedKillFeedText(role: string, teamId: number, playerName: string) {
        const roleTxt = this.getRoleTranslation(role, teamId);
        return `${playerName} ${
            this.localization.translate(
                "game-promoted-to",
            )
        } ${roleTxt}!`;
    }

    getRoleKilledKillFeedText(role: string, teamId: number, killerName: string) {
        const roleTxt = this.getRoleTranslation(role, teamId);
        if (killerName) {
            return `${killerName} ${
                this.localization.translate(
                    "game-killed",
                )
            } ${roleTxt}!`;
        }
        return `${roleTxt} ${this.localization.translate("game-is-dead")}!`;
    }

    getKillText(
        killerName: string,
        targetName: string,
        completeKill: boolean,
        downed: boolean,
        killed: boolean,
        suicide: boolean,
        sourceType: string,
        damageType: DamageType,
        spectating: boolean,
    ) {
        const knockedOut = downed && !killed;
        const youTxt = spectating
            ? killerName
            : this.localization.translate("game-you").toUpperCase();
        const killKey = knockedOut
            ? "game-knocked-out"
            : completeKill
            ? "game-killed"
            : "game-finally-killed";
        const killTxt = this.localization.translate(killKey);
        const targetTxt = suicide
            ? spectating
                ? this.localization.translate("game-themselves")
                : this.localization.translate("game-yourself").toUpperCase()
            : targetName;
        const damageTxt = this.localization.translate(
            damageType == GameConfig.DamageType.Airstrike
                ? "game-an-air-strike"
                : `game-${sourceType}`,
        );
        const withTxt = this.localization.translate("game-with");

        if (damageTxt && (completeKill || knockedOut)) {
            return `${youTxt} ${killTxt} ${targetTxt} ${withTxt} ${damageTxt}`;
        }
        return `${youTxt} ${killTxt} ${targetTxt}`;
    }

    getKillCountText(killCount: number) {
        return `${killCount} ${
            this.localization.translate(
                killCount != 1 ? "game-kills" : "game-kill",
            )
        }`;
    }

    getDownedText(
        killerName: string,
        targetName: string,
        sourceType: string,
        damageType: DamageType,
        spectating: boolean,
    ) {
        const youTxt = spectating
            ? targetName
            : this.localization.translate("game-you").toUpperCase();
        let killerTxt = killerName;
        if (!killerTxt) {
            if (damageType == GameConfig.DamageType.Gas) {
                killerTxt = this.localization.translate("game-the-red-zone");
            } else if (damageType == GameConfig.DamageType.Airdrop) {
                killerTxt = this.localization.translate("game-the-air-drop");
            } else if (damageType == GameConfig.DamageType.Airstrike) {
                killerTxt = this.localization.translate("game-the-air-strike");
            }
        }
        let damageTxt = this.localization.translate(`game-${sourceType}`);
        if (killerName && damageType == GameConfig.DamageType.Airstrike) {
            damageTxt = this.localization.translate("game-an-air-strike");
        }
        const withTxt = this.localization.translate("game-with");
        if (damageTxt) {
            return `${killerTxt} knocked ${youTxt} out ${withTxt} ${damageTxt}`;
        }
        return `${killerTxt} knocked ${youTxt} out`;
    }

    getPickupMessageText(type: PickupMsgType) {
        const typeMap: Record<number, string> = {
            [PickupMsgType.Full]: "game-not-enough-space",
            [PickupMsgType.AlreadyOwned]: "game-item-already-owned",
            [PickupMsgType.AlreadyEquipped]: "game-item-already-equipped",
            [PickupMsgType.BetterItemEquipped]: "game-better-item-equipped",
            [PickupMsgType.GunCannotFire]: "game-gun-cannot-fire",
            [PickupMsgType.MaxPerks]: "game-max-perks",
        };
        const key = typeMap[type] || typeMap[PickupMsgType.Full];
        return this.localization.translate(key);
    }

    getInteractionText(
        type: InteractionType,
        object: Obstacle | Loot | Player,
        player: Player,
    ) {
        switch (type) {
            case InteractionType.None:
                return "";
            case InteractionType.Cancel:
                return this.localization.translate("game-cancel");
            case InteractionType.Revive:
                if (
                    object
                    && player
                    && (object == player || player.downed)
                    && player.m_hasPerk("self_revive")
                ) {
                    return this.localization.translate("game-revive-self");
                }
                return this.localization.translate("game-revive-teammate");
            case InteractionType.Object: {
                const x = (object as Obstacle).getInteraction(player)!;
                return `${
                    this.localization.translate(
                        x.action,
                    )
                } ${this.localization.translate(x.object)}`;
            }
            case InteractionType.Loot: {
                const loot = object as Loot;
                let txt = this.localization.translate(`game-${loot.type}`) || loot.type;
                if (loot.count > 1) {
                    txt += ` (${loot.count})`;
                }
                return txt;
            }
            default:
                return "";
        }
    }

    getInteractionKey(type: InteractionType) {
        let bind = null;
        switch (type) {
            case InteractionType.Cancel:
                bind = this.inputBinds.getBind(Input.Cancel);
                break;
            case InteractionType.Loot:
                bind = this.inputBinds.getBind(Input.Loot)
                    || this.inputBinds.getBind(Input.Interact);
                break;
            case InteractionType.Object:
                bind = this.inputBinds.getBind(Input.Use)
                    || this.inputBinds.getBind(Input.Interact);
                break;
            case InteractionType.Revive:
                bind = this.inputBinds.getBind(Input.Revive)
                    || this.inputBinds.getBind(Input.Interact);
                break;
            case InteractionType.None:
            default:
                bind = this.inputBinds.getBind(Input.Use);
        }

        if (bind) {
            return bind.toString();
        }
        return "<Unbound>";
    }
}

export function loadStaticDomImages() {
    // Fetch dom images here instead of index.html to speed up page responsiveness
    const lootImages = {
        "ui-loot-bandage": "img/loot/loot-medical-bandage.svg",
        "ui-loot-healthkit": "img/loot/loot-medical-healthkit.svg",
        "ui-loot-soda": "img/loot/loot-medical-soda.svg",
        "ui-loot-painkiller": "img/loot/loot-medical-pill.svg",
        "ui-loot-9mm": "img/loot/loot-ammo-box.svg",
        "ui-loot-12gauge": "img/loot/loot-ammo-box.svg",
        "ui-loot-762mm": "img/loot/loot-ammo-box.svg",
        "ui-loot-556mm": "img/loot/loot-ammo-box.svg",
        "ui-loot-50AE": "img/loot/loot-ammo-box.svg",
        "ui-loot-308sub": "img/loot/loot-ammo-box.svg",
        "ui-loot-flare": "img/loot/loot-ammo-box.svg",
        "ui-loot-45acp": "img/loot/loot-ammo-box.svg",
    };

    for (const [id, img] of Object.entries(lootImages)) {
        (
            domElemById(id).getElementsByClassName("ui-loot-image")[0] as HTMLImageElement
        ).src = img;
    }

    (domElemById("mag-glass-white") as HTMLImageElement).src = "img/gui/mag-glass.svg";
    (domElemById("ui-minimize-img") as HTMLImageElement).src = "img/gui/minimize.svg";
}
