import { MapDefs } from "@/shared/defs/mapDefs.ts";
import { type FolderApi, Pane, type TabPageApi } from "tweakpane";

import {
    type BuildingEditorConfig,
    type ConfigKey,
    type ConfigManager,
    type ConfigType,
    debugRendererConfig,
} from "$lib/modules/ConfigManager.svelte.ts";
import { MapObjectDefs } from "@/shared/defs/register.ts";
import { math } from "@/shared/utils/math.ts";
import { v2 } from "@/shared/utils/v2.ts";
import { type InputHandler, Key, MouseWheel } from "../../src/input.ts";
import type { EditorDisplay } from "./editorDisplay.ts";

function camelCaseToText(str: string) {
    return str
        .replace(/([A-Z])/g, " $1")
        .split(" ")
        .map((s) => {
            return `${s.charAt(0).toUpperCase()}${s.substring(1)}`;
        })
        .join(" ");
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.2;

export class EditorUi {
    params: typeof BuildingEditorConfig;
    rendererParams: typeof debugRendererConfig;

    pane: Pane;
    zoomBind: ReturnType<Pane["addBinding"]>;
    constructor(
        public config: ConfigManager,
        public display: EditorDisplay,
    ) {
        this.params = this.config.get("buildingEditor")!;
        this.rendererParams = this.config.get("debugRenderer")!;

        const container = document.getElementById("editor-ui") as HTMLDivElement;

        this.pane = new Pane({
            container,
            expanded: true,
            title: "Editor",
        });

        const pane = this.pane;

        // zoom
        {
            const addSlider = (key: keyof EditorUi["params"]) => {
                const bind = pane.addBinding(this.params, key, {
                    label: `${key.charAt(0).toUpperCase()}${key.substring(1)}`,
                    min: MIN_ZOOM,
                    max: MAX_ZOOM,
                    step: ZOOM_STEP,
                });
                bind.on("change", (e) => {
                    this.config.set("buildingEditor", this.params);
                });
                return bind;
            };
            this.zoomBind = addSlider("zoom");
        }

        // Position
        {
            const mapCenter = v2.create(
                this.display.map.width / 2,
                this.display.map.height / 2,
            );

            const posBind = pane.addBinding(this.params, "pos", {
                x: {
                    min: -mapCenter.x,
                    max: mapCenter.x,
                    step: 0.1,
                },
                y: {
                    inverted: true,
                    min: -mapCenter.y,
                    max: mapCenter.y,
                    step: 0.1,
                },
                picker: "inline",
                label: "Camera Position",
            });

            const visualBind = {
                pos: v2.create(0, 0),
            };
            const mousePosBind = pane.addBinding(visualBind, "pos", {
                x: {
                    min: -mapCenter.x,
                    max: mapCenter.x,
                    step: 0.1,
                },
                y: {
                    inverted: true,
                    min: -mapCenter.y,
                    max: mapCenter.y,
                    step: 0.1,
                },
                label: "Cursor Position",
            });

            let changePos = true;
            posBind.on("change", (v) => {
                if (changePos) {
                    this.display.setPlayerPos(this.display.toWorldPos(v.value));
                }
                this.config.set("buildingEditor", this.params);
            });

            const canvas = this.display.pixi.view as HTMLCanvasElement;
            canvas.addEventListener("mousemove", (e: MouseEvent) => {
                if (e.buttons === 1) {
                    canvas.style.cursor = "grabbing";
                    const delta = v2.div(
                        v2.create(e.movementX, -e.movementY),
                        this.display.camera.m_z(),
                    );
                    const pos = v2.sub(this.display.activePlayer.m_pos, delta);

                    pos.x = Math.round(pos.x * 10) / 10;
                    pos.y = Math.round(pos.y * 10) / 10;

                    this.display.setPlayerPos(pos);
                    this.params.pos = this.display.toBuildingPos(pos);
                    this.config.set("buildingEditor", this.params);
                    posBind.refresh();
                } else {
                    canvas.style.cursor = "crosshair";
                }

                visualBind.pos = this.display.toBuildingPos(
                    this.display.camera.m_screenToPoint(v2.create(e.clientX, e.clientY)),
                );
                mousePosBind.refresh();
            });
        }

        // Map
        {
            const maps = Object.keys(MapDefs).reduce(
                (a, key) => {
                    a[key] = key;
                    return a;
                },
                {} as Record<string, string>,
            );
            const mapBind = pane.addBinding(this.params, "map", {
                options: maps,
                label: "Map",
            });
            mapBind.on("change", (e) => {
                if (MapDefs[e.value]) {
                    this.config.set("buildingEditor", this.params);
                    this.display.resetObj();
                }
            });
        }

        {
            const avaliableObjects = MapObjectDefs.getAllTypes()
                .filter((type) => {
                    const def = MapObjectDefs.typeToDef(type);
                    // we cant render loot spawner, also no point on spawning them individually
                    if (def.type === "loot_spawner") return false;

                    // too many walls
                    if (def.type === "obstacle" && def.isWall) return false;

                    return true;
                });

            const bind = pane.addBinding(this.params, "object", {
                label: "Type",
            });
            const input = bind.element.querySelector("input") as HTMLInputElement;

            // don't want to trigger keybinds (like L to fullscreen) while typing
            input.addEventListener("keyup", (e) => e.stopPropagation());
            input.addEventListener("keydown", (e) => {
                e.stopPropagation();

                if (e.key == "Enter" && avaliableObjects.includes(input.value)) {
                    this.params.object = input.value;
                    this.config.set("buildingEditor", this.params);
                    this.display.resetObj();
                }
            });
            const button = pane.addButton({
                title: "Spawn",
            });
            button.on("click", () => {
                if (avaliableObjects.includes(input.value)) {
                    this.config.set("buildingEditor", this.params);
                    this.display.resetObj();
                }
            });

            const dataList = document.createElement("datalist");
            dataList.id = "editor-loot-list";
            input.setAttribute("list", dataList.id);

            input.parentElement?.appendChild(dataList);
            for (const loot of avaliableObjects) {
                const opt = document.createElement("option");
                opt.value = loot;
                dataList.appendChild(opt);
            }
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
            debugRendererConfig,
            this.rendererParams,
            this.rendererParams,
            this.pane,
            "debugRenderer",
        );
    }

    m_update(input: InputHandler) {
        let zoom = this.params.zoom;

        if (input.keyPressed(Key.Plus) || input.mouseWheelState === MouseWheel.Down) {
            zoom -= ZOOM_STEP;
        }

        if (input.keyPressed(Key.Minus) || input.mouseWheelState === MouseWheel.Up) {
            zoom += ZOOM_STEP;
        }

        zoom = math.clamp(zoom, MIN_ZOOM, MAX_ZOOM);
        if (zoom !== this.params.zoom) {
            this.params.zoom = zoom;
            this.zoomBind.refresh();
            this.config.set("buildingEditor", this.params);
        }

        this.config.config.debugRenderer = this.rendererParams;
    }
}
