import $ from "jquery";
import { type FolderApi, Pane, type TabPageApi } from "tweakpane";
import { GameObjectDefs } from "../../../shared/defs/gameObjectDefs";
import { RoleDefs } from "../../../shared/defs/gameObjects/roleDefs";
import { EditMsg } from "../../../shared/net/editMsg";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import {
    type ConfigKey,
    type ConfigManager,
    type ConfigType,
    debugHUDConfig,
    debugRenderConfig,
    type debugToolsConfig,
} from "../config";
import { type InputHandler, Key } from "../input";

const availableLoot = Object.entries(GameObjectDefs)
    .filter(([_, def]) => "lootImg" in def)
    .map(([key]) => key);

const invalidRoleTypes = ["kill_leader"];

const availableRoles = Object.entries(RoleDefs)
    .filter(([type]) => !invalidRoleTypes.includes(type))
    .reduce(
        (obj, [type]) => {
            obj[type] = type;
            return obj;
        },
        {} as Record<string, string>,
    );

availableRoles["None"] = "";

function camelCaseToText(str: string) {
    return str
        .replace(/([A-Z])/g, " $1")
        .split(" ")
        .map((s) => {
            return `${s.charAt(0).toUpperCase()}${s.substring(1)}`;
        })
        .join(" ");
}

export class Editor {
    toolParams: typeof debugToolsConfig;
    renderParams: typeof debugRenderConfig;
    debugHUDParams: typeof debugHUDConfig;

    config: ConfigManager;
    pane: Pane;

    zoomBind: ReturnType<Pane["addBinding"]>;

    enabled = false;

    loadNewMap = false;
    spawnLoot = false;
    promoteToRole = false;
    toggleLayer = false;

    printLootStats = false;

    sendMsg = false;

    constructor(config: ConfigManager) {
        this.config = config;
        this.config.addModifiedListener(this.onConfigModified.bind(this));

        this.toolParams = this.config.get("debugTools")!;
        this.toolParams.role = "";

        this.renderParams = this.config.get("debugRenderer")!;
        this.debugHUDParams = this.config.get("debugHUD")!;

        const container = document.getElementById(
            "ui-editor-top-right",
        ) as HTMLDivElement;

        this.pane = new Pane({
            container,
            expanded: true,
            title: "Editor",
        });

        const pane = this.pane;

        const tabs = pane.addTab({
            pages: [
                {
                    title: "Tools",
                },
                {
                    title: "Render",
                },
                {
                    title: "HUD",
                },
            ],
        });
        const [tools, render, HUD] = tabs.pages;

        //
        // Tools
        //

        const addSlider = (
            key: keyof Editor["toolParams"],
            enabledKey: keyof Editor["toolParams"],
        ) => {
            const folder = tools.addFolder({
                title: key,
            });
            folder.on("change", () => {
                this.sendMsg = true;
                this.config.set("debugTools", this.toolParams);
            });

            folder.addBinding(this.toolParams, enabledKey, {
                label: "Enabled",
            });

            return folder.addBinding(this.toolParams, key, {
                label: `${key.charAt(0).toUpperCase()}${key.substring(1)}`,
                min: 1,
                max: 255,
                step: 1,
            });
        };
        this.zoomBind = addSlider("zoom", "zoomEnabled");
        addSlider("speed", "speedEnabled");

        // Loot
        {
            const folder = tools.addFolder({
                title: "Loot",
            });

            const loot = folder.addBinding(this.toolParams, "loot", {
                label: "Type",
            });
            const input = loot.element.querySelector("input") as HTMLInputElement;

            // don't want to trigger keybinds (like L to fullscreen) while typing
            input.addEventListener("keyup", (e) => e.stopPropagation());
            input.addEventListener("keydown", (e) => {
                e.stopPropagation();

                if (e.key == "Enter" && availableLoot.includes(input.value)) {
                    this.spawnLoot = true;
                    this.sendMsg = true;
                    this.config.set("debugTools", this.toolParams);
                }
            });
            const button = folder.addButton({
                title: "Spawn",
            });
            button.on("click", () => {
                if (availableLoot.includes(input.value)) {
                    this.spawnLoot = true;
                    this.sendMsg = true;
                    this.config.set("debugTools", this.toolParams);
                }
            });

            const dataList = document.createElement("datalist");
            dataList.id = "editor-loot-list";
            input.setAttribute("list", dataList.id);

            input.parentElement?.appendChild(dataList);
            for (const loot of availableLoot) {
                const opt = document.createElement("option");
                opt.value = loot;
                dataList.appendChild(opt);
            }
        }

        // Map
        {
            const folder = tools.addFolder({
                title: "Map",
                expanded: false,
            });
            const input = folder.addBinding(this.toolParams, "mapSeed", {
                label: "Seed",
                step: 1,
                format: (n) => {
                    return math.clamp(Math.floor(n), 1, 2 ** 32 - 1);
                },
            });

            const generate = folder.addButton({
                title: "Generate",
            });

            generate.on("click", () => {
                this.loadNewMap = true;
                this.sendMsg = true;
            });

            const random = folder.addButton({
                title: "Random",
            });
            random.on("click", () => {
                this.toolParams.mapSeed = util.randomInt(1, 2 ** 32 - 1);
                this.loadNewMap = true;
                this.sendMsg = true;
                input.refresh();
            });
        }

        // Roles
        {
            const folder = tools.addFolder({
                title: "Role",
                expanded: false,
            });
            folder.addBinding(this.toolParams, "role", {
                options: availableRoles,
                label: "Role",
            });

            const button = folder.addButton({
                title: "Promote",
            });
            button.on("click", () => {
                this.sendMsg = true;
                this.promoteToRole = true;
            });
        }

        {
            const folder = tools.addFolder({
                title: "Toggles",
            });

            folder.addBinding(this.toolParams, "noClip", {
                label: "No Clip",
            });
            folder.addBinding(this.toolParams, "teleportToPings", {
                label: "Teleport To Pings",
            });
            folder.addBinding(this.toolParams, "godMode", {
                label: "God Mode",
            });
            folder.addBinding(this.toolParams, "moveObjs", {
                label: "Move Objects",
            });
            folder.on("change", () => {
                this.sendMsg = true;
                this.config.set("debugTools", this.toolParams);
            });

            const toggleLayer = folder.addButton({
                title: "Switch Layers",
            });

            toggleLayer.on("click", () => {
                this.toggleLayer = true;
                this.sendMsg = true;
            });
        }
        //
        // Renderer
        //

        const addObject = (
            // we pass both the default config object
            // and the one we actually write to / loaded from local storage
            // because if we always pass the one from LS to it may have keys that have been deleted
            // and i dont want it to spam a bunch of deleted keys specially during development where
            // i end up renaming keys a lot before deciding their final name :)
            defaultObj: Record<string, unknown>,
            outObj: Record<string, unknown>,
            parentObj: Record<string, unknown>,
            folder: FolderApi | TabPageApi,
            configKey: ConfigKey,
        ) => {
            for (const key in defaultObj) {
                const entry = defaultObj[key];

                if (typeof entry === "object") {
                    const folder2 = folder.addFolder({
                        title: camelCaseToText(key),
                        expanded: true,
                    });
                    addObject(
                        entry as Record<string, unknown>,
                        outObj[key] as Record<string, unknown>,
                        parentObj,
                        folder2,
                        configKey,
                    );
                } else if (typeof entry === "boolean") {
                    const label = camelCaseToText(key);

                    const bind = folder.addBinding(outObj, key, {
                        label,
                    });
                    bind.on("change", () => {
                        this.config.set(configKey, parentObj as ConfigType[ConfigKey]);
                    });
                }
            }
        };
        addObject(
            debugRenderConfig,
            this.renderParams,
            this.renderParams,
            render,
            "debugRenderer",
        );

        //
        // HUD
        //

        addObject(
            debugHUDConfig,
            this.debugHUDParams,
            this.debugHUDParams,
            HUD,
            "debugHUD",
        );

        // we dont want to focus buttons because they can mess with keybinds
        // like if you click on "toggle layer" and dont click on anything else
        // the button will remain focused and will activate if you press enter or space
        pane.element
            .querySelectorAll<HTMLElement>(`input[type="checkbox"], button`)
            .forEach((elm) => {
                elm.addEventListener("click", () => {
                    elm.blur();
                });
            });
        // dont let those events reach the game input handler
        // firing a gun while clicking on an editor button is annoying
        for (const event of ["wheel", "mousedown"]) {
            pane.element.addEventListener(event, (e) => {
                e.stopPropagation();
            });
        }

        this.setEnabled(this.toolParams.enabled);
    }

    onConfigModified(_key?: string) {
        this.refreshUi();
    }

    setEnabled(e: boolean) {
        this.enabled = e;
        this.refreshUi();
        if (e) this.sendMsg = true;

        this.toolParams.enabled = e;
        this.config.set("debugTools", this.toolParams);
    }

    refreshUi() {
        const e = this.enabled;

        $("#ui-editor").css("display", e ? "block" : "none");
        $("#ui-leaderboard-wrapper,#ui-right-center,#ui-kill-leader-container").css(
            "display",
            !e ? "block" : "none",
        );
    }

    m_update(input: InputHandler) {
        let zoom = this.toolParams.zoom;
        if (input.keyPressed(Key.Plus)) {
            zoom -= 8;
        }
        if (input.keyPressed(Key.Minus)) {
            zoom += 8;
        }

        zoom = math.clamp(zoom, 1, 255);
        if (zoom !== this.toolParams.zoom) {
            this.toolParams.zoom = zoom;
            this.sendMsg = true;
            this.zoomBind.refresh();
        }

        this.config.config.debugRenderer = this.renderParams;

        $("#ui-leaderboard-wrapper,#ui-right-center,#ui-kill-leader-container").css(
            "display",
            !this.enabled ? "block" : "none",
        );
    }

    getMsg() {
        const msg = new EditMsg();
        msg.zoomEnabled = this.toolParams.zoomEnabled;
        msg.zoom = this.toolParams.zoom;

        msg.speedEnabled = this.toolParams.speedEnabled;
        msg.speed = this.toolParams.speed;

        msg.loadNewMap = this.loadNewMap;
        msg.newMapSeed = this.toolParams.mapSeed;

        if (availableLoot.includes(this.toolParams.loot)) {
            msg.spawnLootType = this.spawnLoot ? this.toolParams.loot : "";
        }
        msg.promoteToRole = this.promoteToRole;
        msg.promoteToRoleType = this.toolParams.role;

        msg.toggleLayer = this.toggleLayer;

        msg.noClip = this.toolParams.noClip;
        msg.teleportToPings = this.toolParams.teleportToPings;
        msg.godMode = this.toolParams.godMode;
        msg.moveObjs = this.toolParams.moveObjs;

        return msg;
    }

    postSerialization() {
        this.spawnLoot = false;
        this.promoteToRole = false;
        this.loadNewMap = false;

        this.printLootStats = false;

        this.toggleLayer = false;
        this.sendMsg = false;
    }
}
