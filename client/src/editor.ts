import $ from "jquery";
import { type FolderApi, Pane, type TabPageApi } from "tweakpane";
import { GameObjectDefs } from "../../shared/defs/gameObjectDefs";
import { RoleDefs } from "../../shared/defs/gameObjects/roleDefs";
import { EditMsg } from "../../shared/net/editMsg";
import { Constants } from "../../shared/net/net";
import { math } from "../../shared/utils/math";
import { util } from "../../shared/utils/util";
import { v2 } from "../../shared/utils/v2";
import type { ConfigManager, debugRenderConfig, debugToolsConfig } from "./config";
import { type InputHandler, Key } from "./input";
import type { Player } from "./objects/player";

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

export class Editor {
    infoParams = {
        pos: v2.create(0, 0),
        fps: 0,
        ping: 0,
    };

    toolParams: typeof debugToolsConfig;

    renderParams: typeof debugRenderConfig;

    config: ConfigManager;
    pane!: Pane;

    posBind!: ReturnType<Pane["addBinding"]>;
    zoomBind!: ReturnType<Pane["addBinding"]>;

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

        this.setEnabled(false);

        this.toolParams = this.config.get("debugTools")!;
        this.toolParams.role = "";

        this.renderParams = this.config.get("debugRenderer")!;

        const container = document.querySelector(
            "#ui-editor-info-list",
        ) as HTMLDivElement;

        this.pane = new Pane({
            container,
            expanded: true,
            title: "Editor",
        });

        const events = ["wheel", "mousedown"];
        for (const event of events) {
            this.pane.element.addEventListener(event, (e) => {
                console.log(e);
                e.stopPropagation();
            });
        }

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
                    title: "Info",
                },
            ],
        });
        const [tools, render, info] = tabs.pages;

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
                label: "Enabled: ",
            });

            return folder.addBinding(this.toolParams, key, {
                min: 1,
                max: 255,
                step: 1,
            });
        };
        this.zoomBind = addSlider("zoom", "zoomEnabled");
        addSlider("speed", "speedEnabled");

        // Map
        {
            const folder = tools.addFolder({
                title: "Map",
            });
            const input = folder.addBinding(this.toolParams, "mapSeed", {
                label: "Seed:",
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

        {
            const folder = tools.addFolder({
                title: "Toggles",
            });

            folder.addBinding(this.toolParams, "noClip");
            folder.addBinding(this.toolParams, "godMode");
            folder.addBinding(this.toolParams, "moveObjs");
            folder.on("change", () => {
                this.sendMsg = true;
                this.config.set("debugTools", this.toolParams);
            });
        }

        // Loot
        {
            const loot = tools.addBinding(this.toolParams, "loot", {
                label: "Spawn loot:",
            });
            const input = loot.element.querySelector("input") as HTMLInputElement;

            input.addEventListener("keydown", (e) => {
                e.stopPropagation();

                if (e.key == "Enter" && availableLoot.includes(input.value)) {
                    this.spawnLoot = true;
                    this.sendMsg = true;
                    this.config.set("debugTools", this.toolParams);
                }
            });
            // const form = document.createElement("form");

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

        // Roles
        {
            const roles = tools.addBinding(this.toolParams, "role", {
                options: availableRoles,
                label: "Role:",
            });

            // to stop accidental promotions
            const elm = roles.element.querySelector("select");
            elm?.addEventListener("keydown", (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            roles.on("change", () => {
                this.sendMsg = true;
                this.promoteToRole = true;
                elm?.blur();
            });
        }
        const toggleLayer = tools.addButton({
            title: "Toggle layer",
        });

        toggleLayer.on("click", () => {
            this.toggleLayer = true;
            this.sendMsg = true;
        });
        //
        // Renderer
        //

        const addObject = (
            obj: Record<string, unknown>,
            folder: FolderApi | TabPageApi,
        ) => {
            for (const key in obj) {
                const entry = obj[key];
                if (typeof entry === "object") {
                    const folder2 = folder.addFolder({
                        title: key,
                        expanded: true,
                    });
                    addObject(entry as Record<string, unknown>, folder2);
                } else if (typeof entry === "boolean") {
                    const bind = folder.addBinding(obj, key);
                    bind.on("change", () => {
                        this.config.set("debugRenderer", this.renderParams);
                    });
                }
            }
        };
        addObject(this.renderParams, render);

        //
        // INFO
        //

        this.posBind = info.addBinding(this.infoParams, "pos", {
            x: {
                min: 0,
                max: Constants.MaxPosition,
            },
            y: {
                inverted: true,
                min: 0,
                max: Constants.MaxPosition,
            },
        });
        info.addBinding(this.infoParams, "fps", {
            readonly: true,
            view: "graph",
        });
        info.addBinding(this.infoParams, "ping", {
            readonly: true,
            view: "graph",
        });
    }

    onConfigModified(_key?: string) {
        this.refreshUi();
    }

    setEnabled(e: boolean) {
        this.enabled = e;
        this.refreshUi();
        if (e) this.sendMsg = true;
    }

    refreshUi() {
        const e = this.enabled;

        $("#ui-editor").css("display", e ? "block" : "none");
        $("#ui-leaderboard-wrapper,#ui-right-center,#ui-kill-leader-container").css(
            "display",
            !e ? "block" : "none",
        );
    }

    m_update(dt: number, input: InputHandler, player: Player) {
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

        this.infoParams.pos.x = player.m_pos.x;
        this.infoParams.pos.y = player.m_pos.y;
        this.posBind.refresh();

        this.infoParams.fps = 1 / dt;

        this.config.config.debugRenderer = this.renderParams;

        $("#ui-leaderboard-wrapper,#ui-right-center,#ui-kill-leader-container").css(
            "display",
            !this.enabled ? "block" : "none",
        );
    }

    m_free() {
        this.pane?.dispose();
    }

    getMsg() {
        const msg = new EditMsg();
        msg.zoomEnabled = this.toolParams.zoomEnabled;
        msg.zoom = this.toolParams.zoom;

        msg.speedEnabled = this.toolParams.speedEnabled;
        msg.speed = this.toolParams.speed;

        msg.loadNewMap = this.loadNewMap;
        msg.newMapSeed = this.toolParams.mapSeed;

        msg.spawnLootType = this.spawnLoot ? this.toolParams.loot : "";
        msg.promoteToRole = this.promoteToRole;
        msg.promoteToRoleType = this.toolParams.role;

        msg.toggleLayer = this.toggleLayer;

        msg.noClip = this.toolParams.noClip;
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
