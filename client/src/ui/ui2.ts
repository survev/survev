import { GameObjectDefs, type LootDef } from "../../../shared/defs/gameObjectDefs";
import {
    type AmmoDef,
    type BoostDef,
    type ChestDef,
    GEAR_TYPES,
    type HealDef,
    SCOPE_LEVELS,
} from "../../../shared/defs/gameObjects/gearDefs";
import type { GunDef } from "../../../shared/defs/gameObjects/gunDefs";
import type { MeleeDef } from "../../../shared/defs/gameObjects/meleeDefs";
import type { RoleDef } from "../../../shared/defs/gameObjects/roleDefs";
import { MapObjectDefs } from "../../../shared/defs/mapObjectDefs";
import type { ObstacleDef } from "../../../shared/defs/mapObjectsTyping";
import {
    Action,
    DamageType,
    GameConfig,
    Input,
    type InventoryItem,
} from "../../../shared/gameConfig";
import { PickupMsgType } from "../../../shared/net/net";
import { collider } from "../../../shared/utils/collider";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import { v2 } from "../../../shared/utils/v2";
import { device } from "../device";
import { helpers } from "../helpers";
import type { InputBinds } from "../inputBinds";
import type { Map } from "../map";
import type { Loot, LootBarn } from "../objects/loot";
import type { Obstacle } from "../objects/obstacle";
import type { Player, PlayerBarn } from "../objects/player";
import type { Localization } from "./localization";

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
    const e = Object.keys(GameObjectDefs);
    const t = [];
    for (let r = 0; r < e.length; r++) {
        const a = e[r];
        const i = GameObjectDefs[a] as AmmoDef | HealDef | BoostDef;
        if (
            !(i as AmmoDef).hideUi &&
            (i.type == "heal" || i.type == "boost" || i.type == "ammo")
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
            const def = GameObjectDefs[loot.lootType];
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
                    (item.action == "use" && isLmb(e)) ||
                    (item.action == "drop" && isRmb(e))
                ) {
                    e.stopPropagation();
                    item.actionQueued = true;
                }
            });
            setEventListener("mouseup", item.div, (e) => {
                if (
                    item.actionQueued &&
                    ((item.action == "use" && isLmb(e)) ||
                        (item.action == "drop" && isRmb(e)))
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
                    new Date().getTime() - item.actionTime < touchHoldDuration &&
                    item.actionQueued &&
                    item.action == "use"
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
            state.rareLootMessage.ticker >= state.rareLootMessage.duration &&
            // Create a new message if we aren't displaying one
            this.rareLootMessageQueue.length > 0
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
        state.pickupMessage.opacity =
            math.smoothstep(x, 0, 0.2) *
            (1 - math.smoothstep(x, z, z + 0.2)) *
            (1 - state.rareLootMessage.opacity);

        // Kill message
        state.killMessage.ticker += dt;
        const I = state.killMessage.ticker;
        const T = state.killMessage.duration;
        state.killMessage.opacity =
            (1 - math.smoothstep(I, T - 0.2, T)) * (1 - state.rareLootMessage.opacity);

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
                    obstacle.active &&
                    !obstacle.dead &&
                    util.sameLayer(obstacle.layer, activePlayer.layer)
                ) {
                    const interact = obstacle.getInteraction();
                    if (interact) {
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
                const itemDef = GameObjectDefs[loot.type] as LootDef;

                const X = activePlayer.m_hasWeaponInSlot(GameConfig.WeaponSlot.Primary);
                const K = activePlayer.m_hasWeaponInSlot(GameConfig.WeaponSlot.Secondary);
                const Z = X && K;
                const usable =
                    itemDef.type != "gun" ||
                    !Z ||
                    activePlayer.m_equippedWeaponType() == "gun";

                let J = false;
                if (
                    (state.touch &&
                        itemDef.type == "helmet" &&
                        activePlayer.m_getHelmetLevel() == itemDef.level &&
                        loot.type != activePlayer.m_netData.m_helmet) ||
                    (itemDef.type == "chest" &&
                        activePlayer.m_getChestLevel() == itemDef.level &&
                        loot.type != activePlayer.m_netData.m_chest)
                ) {
                    J = true;
                }

                if (usable || device.uiLayout == device.UiLayout.Sm) {
                    interactionType = InteractionType.Loot;
                    interactionObject = loot;
                }
                interactionUsable =
                    usable &&
                    (!state.touch ||
                        itemDef.type == "gun" ||
                        itemDef.type == "melee" ||
                        itemDef.type == "outfit" ||
                        itemDef.type == "perk" ||
                        J);
            }

            // Reviving
            const canSelfRevive = activePlayer.m_hasPerk("self_revive");

            if (
                activePlayer.m_action.type == Action.None &&
                (!activePlayer.m_netData.m_downed || canSelfRevive)
            ) {
                const ourTeamId = playerBarn.getPlayerInfo(activePlayer.__id).teamId;
                const players = playerBarn.playerPool.m_getPool();

                for (let i = 0; i < players.length; i++) {
                    const p = players[i];
                    if (p.active) {
                        const theirTeamId = playerBarn.getPlayerInfo(p.__id).teamId;
                        if (
                            (p.__id != activePlayer.__id || canSelfRevive) &&
                            ourTeamId == theirTeamId &&
                            p.m_netData.m_downed &&
                            !p.m_netData.m_dead &&
                            p.m_action.type != Action.Revive
                        ) {
                            const dist = v2.length(
                                v2.sub(p.m_netData.m_pos, activePlayer.m_netData.m_pos),
                            );
                            if (
                                dist < GameConfig.player.reviveRange &&
                                util.sameLayer(p.layer, activePlayer.layer)
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
                activePlayer.m_action.type == Action.Revive &&
                activePlayer.m_netData.m_downed &&
                !canSelfRevive
            ) {
                interactionType = InteractionType.None;
                interactionObject = null;
                interactionUsable = false;
            }

            if (
                (activePlayer.m_action.type == Action.UseItem ||
                    (activePlayer.m_action.type == Action.Revive &&
                        (!activePlayer.m_netData.m_downed || !!canSelfRevive))) &&
                !spectating
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
        for (let oe = 0; oe < activePlayer.m_localData.m_weapons.length; oe++) {
            const se = activePlayer.m_localData.m_weapons[oe];
            const ne = state.weapons[oe];
            ne.type = se.type;
            ne.ammo = se.ammo;
            if (oe == GameConfig.WeaponSlot.Throwable) {
                ne.ammo = activePlayer.m_localData.m_inventory[se.type] || 0;
            }
            const le = ne.equipped;
            ne.equipped = oe == activePlayer.m_localData.m_curWeapIdx;
            ne.selectable = (se.type != "" || oe == 0 || oe == 1) && !spectating;
            const ce = ne.equipped ? 1 : 0.6;
            const me = ce - ne.opacity;
            const pe = math.min(me, (math.sign(me) * dt) / 0.15);
            ne.opacity = math.clamp(ne.opacity + pe, 0, 1);
            if (device.mobile) {
                ne.opacity = ce;
            }
            if (ne.type == "bugle" && ne.ammo == 0) {
                ne.opacity = 0.25;
            }
            ne.ticker += dt;
            if (!ne.equipped || !le) {
                ne.ticker = 0;
            }
            if (this.frameCount < 2) {
                ne.ticker = 1;
            }
            const he = math.min(ne.ticker / 0.09, Math.PI);
            const de = Math.sin(he);
            ne.width = de < 0.001 ? 0 : de;
            if (device.mobile) {
                ne.width = 0;
            }
            const ue = inputBinds.getBind(ne.bind);
            ne.bindStr = ue ? ue.toString() : "";
        }
        const ge = state.weapons[activePlayer.m_localData.m_curWeapIdx];
        const weaponDef = GameObjectDefs[ge.type] as GunDef | MeleeDef;
        const we = ge.ammo;
        const fe =
            weaponDef.type == "gun"
                ? weaponDef.ammoInfinite ||
                  (activePlayer.m_hasPerk("endless_ammo") && !weaponDef.ignoreEndlessAmmo)
                    ? Number.MAX_VALUE
                    : activePlayer.m_localData.m_inventory[weaponDef.ammo]
                : 0;
        state.ammo.current = we;
        state.ammo.remaining = fe;
        state.ammo.displayCurrent = weaponDef.type != "melee";
        state.ammo.displayRemaining = fe > 0;
        for (let _e = 0; _e < state.scopes.length; _e++) {
            const be = state.scopes[_e];
            be.visible = activePlayer.m_localData.m_inventory[be.type] > 0;
            be.equipped = be.visible && activePlayer.m_localData.m_scope == be.type;
            be.selectable = be.visible && !spectating;
        }
        for (
            let xe = activePlayer.m_getBagLevel(), Se = 0;
            Se < state.loot.length;
            Se++
        ) {
            const ve = state.loot[Se];
            const ke = ve.count;
            ve.count = activePlayer.m_localData.m_inventory[ve.type] || 0;
            ve.maximum = GameConfig.bagSizes[ve.type as InventoryItem][xe];
            ve.selectable = ve.count > 0 && !spectating;
            if (ve.count > ke) {
                ve.ticker = 0;
            }
            if (this.frameCount < 2) {
                ve.ticker = 1;
            }
            ve.ticker += dt;
            const ze = math.min(ve.ticker / 0.05, Math.PI);
            const Ie = Math.sin(ze);
            ve.width = Ie < 0.001 ? 0 : Ie;
            if (device.mobile) {
                ve.width = 0;
            }
        }
        for (let Te = 0; Te < state.gear.length; Te++) {
            const Me = state.gear[Te];
            let Pe = "";
            if (Me.type == "chest") {
                Pe = activePlayer.m_netData.m_chest;
            } else if (Me.type == "helmet") {
                Pe = activePlayer.m_netData.m_helmet;
            } else if (
                Me.type == "backpack" &&
                (Pe = activePlayer.m_netData.m_backpack) == "backpack00"
            ) {
                Pe = "";
            }
            const Ce = Me.item;
            Me.item = Pe;
            Me.selectable = Pe != "" && !spectating;
            if (Ce != Me.item) {
                Me.ticker = 0;
            }
            if (this.frameCount < 2) {
                Me.ticker = 1;
            }
            Me.ticker += dt;
            const Ae = math.min(Me.ticker / 0.05, Math.PI);
            const Oe = Math.sin(Ae);
            Me.width = Oe < 0.001 ? 0 : Oe;
            if (device.mobile) {
                Me.width = 0;
            }
        }
        for (let De = 0; De < state.perks.length; De++) {
            const Ee = state.perks[De];
            if (activePlayer.perks.length > De) {
                const Be = activePlayer.perks[De];
                Ee.type = Be.type;
                Ee.droppable = Be.droppable;
                if (Be.isNew) {
                    Ee.ticker = 0;
                }
                if (this.frameCount < 2) {
                    Ee.ticker = 1;
                }
                Ee.ticker += dt;
                const Re = math.min(Ee.ticker / 0.05, Math.PI);
                const Le = Math.sin(Re);
                Ee.width = Le < 0.001 ? 0 : Le;
                if (device.mobile) {
                    Ee.width = 0;
                }
                Ee.pulse = !device.mobile && Ee.ticker < 4;
            } else {
                Ee.type = "";
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
            const lootDef = GameObjectDefs[lootType] as LootDef;
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
                const top =
                    device.uiLayout != device.UiLayout.Sm || device.tablet ? 35 : 15;
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
            const v = GameConfig.player.boostBreakpoints;
            let I = 0;
            for (let T = 0; T < v.length; T++) {
                I += v[T];
            }
            for (let P = state.boost / 100, C = 0; C < dom.boost.bars.length; C++) {
                const A = v[C] / I;
                const O = math.clamp(P / A, 0, 1);
                P = math.max(P - A, 0);
                dom.boost.bars[C].style.width = `${O * 100}%`;
            }
            dom.boost.div.style.opacity = String(state.boost == 0 ? 0 : 1);
        }
        if (patch.interaction.type) {
            dom.interaction.div.style.display =
                state.interaction.type == InteractionType.None ? "none" : "flex";
        }
        if (patch.interaction.text) {
            dom.interaction.text.innerHTML = state.interaction.text;
        }
        if (patch.interaction.key) {
            dom.interaction.key.innerHTML = state.touch ? "" : state.interaction.key;
            dom.interaction.key.className =
                dom.interaction.key.innerHTML.length > 1
                    ? "ui-interaction-small"
                    : "ui-interaction-large";
        }
        if (patch.interaction.usable) {
            dom.interaction.key.style.display = state.interaction.usable
                ? "block"
                : "none";
        }
        for (let E = 0; E < patch.weapons.length; E++) {
            const B = patch.weapons[E];
            const R = dom.weapons[E];
            const L = state.weapons[E];
            if (B.type) {
                let q = "";
                let F = "";
                const j = GameObjectDefs[L.type];
                if (j) {
                    q =
                        this.localization.translate(`game-hud-${L.type}`) ||
                        this.localization.translate(`game-${L.type}`);
                    F = helpers.getCssTransformFromGameType(L.type);
                }
                R.type.innerHTML = q;
                R.image.src = helpers.getSvgFromGameType(L.type);
                R.image.style.display = j ? "inline" : "none";
                R.image.style.transform = F;
            }
            if (B.equipped) {
                R.div.style.backgroundColor = L.equipped
                    ? "rgba(0, 0, 0, 0.4)"
                    : "rgba(0, 0, 0, 0)";
            }
            if (B.selectable) {
                R.div.style.pointerEvents =
                    L.type != "" || L.selectable ? "auto" : "none";
            }
            if (B.width) {
                const N = math.lerp(L.width, 83.33, 100);
                R.div.style.width = `${N}%`;
            }
            if (B.opacity) {
                R.div.style.opacity = String(L.opacity);
            }
            if (B.ammo && R.ammo) {
                R.ammo.innerHTML = String(L.ammo);
                R.ammo.style.display = L.ammo > 0 ? "block" : "none";
            }
            if (B.bindStr) {
                R.number.innerHTML = L.bindStr[0] || "";
            }
        }
        if (patch.ammo.current) {
            const H = state.ammo.current;
            dom.ammo.current.innerHTML = String(H);
            dom.ammo.current.style.color = H > 0 ? "white" : "red";
        }
        if (patch.ammo.remaining) {
            const V = state.ammo.remaining;
            dom.ammo.remaining.innerHTML = String(V == Number.MAX_VALUE ? "&#8734;" : V);
            dom.ammo.remaining.style.color = V != 0 ? "white" : "red";
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
        for (let U = 0; U < patch.scopes.length; U++) {
            const W = patch.scopes[U];
            const G = dom.scopes[U];
            const X = state.scopes[U];
            if (W.visible) {
                if (X.visible) {
                    G.div.classList.remove("ui-hidden");
                } else {
                    G.div.classList.add("ui-hidden");
                }
            }
            if (W.equipped) {
                if (X.equipped) {
                    G.div.classList.add("ui-zoom-active");
                    G.div.classList.remove("ui-zoom-inactive");
                } else {
                    G.div.classList.remove("ui-zoom-active");
                    G.div.classList.add("ui-zoom-inactive");
                }
            }
            if (W.selectable) {
                G.div.style.pointerEvents = X.selectable ? "auto" : "none";
            }
        }
        for (let K = 0; K < patch.loot.length; K++) {
            const Z = patch.loot[K];
            const Y = dom.loot[K];
            const J = state.loot[K];
            if (Z && Y && J) {
                if (Z.count || Z.maximum) {
                    Y.count.innerHTML = String(J.count);
                    Y.div.style.opacity = String(
                        (GameObjectDefs[Y.lootType] as AmmoDef).special && J.count == 0
                            ? 0
                            : J.count > 0
                              ? 1
                              : 0.25,
                    );
                    Y.div.style.color = J.count == J.maximum ? "#ff9900" : "#ffffff";
                }
                if (Z.width) {
                    const Q = 1 + J.width * 0.33;
                    const $ = `scale(${Q}, ${Q})`;
                    Y.image.style.transform = $;
                    if (Y.overlay) {
                        Y.overlay.style.transform = $;
                    }
                }
                if (Z.selectable) {
                    Y.div.style.pointerEvents = J.selectable ? "auto" : "none";
                }
            }
        }
        for (let ee = 0; ee < patch.gear.length; ee++) {
            const te = patch.gear[ee];
            const re = dom.gear[ee];
            const ae = state.gear[ee];
            if (te.item) {
                // GearDef?
                const ie = ae.item ? (GameObjectDefs[ae.item] as ChestDef) : null;
                const oe = ie ? ie.level : 0;
                re.div.style.display = ie ? "block" : "none";
                re.level.innerHTML = this.localization.translate(`game-level-${oe}`);
                re.level.style.color = oe >= 3 ? "#ff9900" : "#ffffff";
                re.image.src = helpers.getSvgFromGameType(ae.item);
            }
            if (te.selectable) {
                re.div.style.pointerEvents = ae.selectable ? "auto" : "none";
            }
            if (te.width) {
                const se = 1 + ae.width * 0.33;
                let ne = `scale(${se}, ${se})`;
                const le = GameObjectDefs[ae.item] as MeleeDef;
                if (le?.lootImg.rot !== undefined) {
                    ne += ` rotate(${le.lootImg.rot}rad)`;
                }
                re.image.style.transform = ne;
            }
        }
        for (let ce = 0; ce < patch.perks.length; ce++) {
            const me = patch.perks[ce];
            const pe = dom.perks[ce];
            const he = state.perks[ce];
            if (me.type) {
                pe.perkType = he.type;
                pe.divTitle.innerHTML = this.localization.translate(`game-${he.type}`);
                pe.divDesc.innerHTML = this.localization.translate(
                    `game-${he.type}-desc`,
                );
                pe.div.style.display = he.type ? "block" : "none";
                pe.image.src = he.type ? helpers.getSvgFromGameType(he.type) : "";
            }
            if (me.droppable) {
                if (he.droppable) {
                    pe.div.classList.add("ui-outline-hover");
                    pe.div.classList.remove("ui-perk-no-drop");
                } else {
                    pe.div.classList.remove("ui-outline-hover");
                    pe.div.classList.add("ui-perk-no-drop");
                }
            }
            if (me.pulse) {
                if (he.pulse) {
                    pe.div.classList.add("ui-perk-pulse");
                } else {
                    pe.div.classList.remove("ui-perk-pulse");
                }
            }
            if (me.width) {
                const de = 1 + he.width * 0.33;
                pe.image.style.transform = `scale(${de}, ${de})`;
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
        if (GameObjectDefs[perk]) {
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
                return `${killerName} ${this.localization.translate(
                    downed ? "game-knocked-out" : "game-killed",
                )} ${targetName} ${this.localization.translate(
                    "game-with",
                )} ${this.localization.translate(`game-${sourceType}`)}`;
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
                const mapObj = MapObjectDefs[sourceType] as ObstacleDef;
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
                    return `${killerName} ${killTxt} ${targetName} ${this.localization.translate(
                        "game-with",
                    )} ${this.localization.translate("game-an-air-strike")}`;
                }
                return `${this.localization.translate(
                    "game-the-air-strike",
                )} ${killTxt} ${targetName}`;
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
        const roleDef = GameObjectDefs[role] as RoleDef;
        if (roleDef?.killFeed?.color) {
            return roleDef.killFeed.color;
        }
        return helpers.colorToHexString(playerBarn.getTeamColor(teamId));
    }

    getRoleTranslation(role: string, teamId: number) {
        let roleTxt = `game-${role}`;
        if (role == "leader") {
            roleTxt = teamId == 1 ? "game-red-leader" : "game-blue-leader";
        }
        return this.localization.translate(roleTxt);
    }

    getRoleAnnouncementText(role: string, teamId: number) {
        return `${this.localization.translate(
            "game-youve-been-promoted-to",
        )} ${this.getRoleTranslation(role, teamId)}!`;
    }

    getRoleAssignedKillFeedText(role: string, teamId: number, playerName: string) {
        const roleTxt = this.getRoleTranslation(role, teamId);
        return `${playerName} ${this.localization.translate(
            "game-promoted-to",
        )} ${roleTxt}!`;
    }

    getRoleKilledKillFeedText(role: string, teamId: number, killerName: string) {
        const roleTxt = this.getRoleTranslation(role, teamId);
        if (killerName) {
            return `${killerName} ${this.localization.translate(
                "game-killed",
            )} ${roleTxt}!`;
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
        return `${killCount} ${this.localization.translate(
            killCount != 1 ? "game-kills" : "game-kill",
        )}`;
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
                    object &&
                    player &&
                    (object == player || player.downed) &&
                    player.m_hasPerk("self_revive")
                ) {
                    return this.localization.translate("game-revive-self");
                }
                return this.localization.translate("game-revive-teammate");
            case InteractionType.Object: {
                const x = (object as Obstacle).getInteraction()!;
                return `${this.localization.translate(
                    x.action,
                )} ${this.localization.translate(x.object)}`;
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
                bind =
                    this.inputBinds.getBind(Input.Loot) ||
                    this.inputBinds.getBind(Input.Interact);
                break;
            case InteractionType.Object:
                bind =
                    this.inputBinds.getBind(Input.Use) ||
                    this.inputBinds.getBind(Input.Interact);
                break;
            case InteractionType.Revive:
                bind =
                    this.inputBinds.getBind(Input.Revive) ||
                    this.inputBinds.getBind(Input.Interact);
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
