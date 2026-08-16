import { type FolderApi, Pane, type TabPageApi } from "tweakpane";
import { MapDefs } from "../../../shared/defs/mapDefs.ts";

import * as PIXI from "pixi.js-legacy";
import { MapObjectDefs } from "../../../shared/defs/register.ts";
import { coldet } from "../../../shared/utils/coldet.ts";
import { collider } from "../../../shared/utils/collider.ts";
import { mapHelpers } from "../../../shared/utils/mapHelpers.ts";
import { math } from "../../../shared/utils/math.ts";
import { v2 } from "../../../shared/utils/v2.ts";
import {
    type BuildingEditorConfig,
    type ConfigKey,
    type ConfigManager,
    type ConfigType,
    debugRenderConfig,
} from "../../src/config.ts";
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
    renderParams: typeof debugRenderConfig;

    pane: Pane;
    zoomBind: ReturnType<Pane["addBinding"]>;

    screenshotPane: Pane;

    constructor(
        public config: ConfigManager,
        public display: EditorDisplay,
    ) {
        this.params = this.config.get("buildingEditor")!;
        this.renderParams = this.config.get("debugRenderer")!;

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
            const toggleLayer = pane.addButton({
                title: "Switch Layers",
            });

            toggleLayer.on("click", () => {
                this.params.layer = this.params.layer === 0 ? 1 : 0;
                this.display.activePlayer.layer = this.params.layer;
                this.config.set("buildingEditor", this.params);
                this.display.updatePlayer();
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

        const hideCeilings = this.pane.addBinding(this.params, "hideCeilings", {
            label: "Hide Ceilings",
        });
        hideCeilings.on("change", () => {
            this.config.set("buildingEditor", this.params);
        });

        const showGrid = this.pane.addBinding(this.params, "showGrid", {
            label: "Show Grid",
        });
        showGrid.on("change", () => {
            this.config.set("buildingEditor", this.params);
        });

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
                    const label = key === "enabled" ? "All debug lines" : camelCaseToText(key);

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
            this.pane,
            "debugRenderer",
        );

        // screenshot UI
        {
            this.screenshotPane = new Pane({
                container: document.getElementById("screenshot-ui") as HTMLDivElement,
                title: "Screenshot",
                expanded: true,
            });

            const screenshotParams = {
                transparent: false,
                ceilings: false,
                resolution: 1,
                margins: 8,
            };

            this.screenshotPane.addBinding(screenshotParams, "transparent", {
                label: "Transparent",
            });
            this.screenshotPane.addBinding(screenshotParams, "ceilings", {
                label: "Show ceilings",
            });
            this.screenshotPane.addBinding(screenshotParams, "resolution", {
                label: "Resolution",
                min: 0.1,
                max: 5,
                step: 0.1,
            });
            this.screenshotPane.addBinding(screenshotParams, "margins", {
                label: "Margins",
                min: 0,
                max: 32,
                step: 1,
            });

            this.screenshotPane.addButton({
                title: "Take screenshot",
            }).on("click", () => {
                // reset the zoom to the target resolution, then set it back at the end...
                const zoom = this.params.zoom;
                this.params.zoom = screenshotParams.resolution;
                this.config.set("buildingEditor", this.params);
                this.display.camera.m_targetZoom = screenshotParams.resolution;
                this.display.camera.m_zoom = screenshotParams.resolution;

                // hide ceilings
                const buildings = this.display.map.m_buildingPool.m_getPool();
                for (let i = 0; i < buildings.length; i++) {
                    buildings[i].ceiling.visionTicker = screenshotParams.ceilings ? 0 : 1;
                    buildings[i].ceiling.fadeAlpha = screenshotParams.ceilings ? 99 : 0;
                }
                // since we change the camera zoom and ceilings, we need to run an update
                // so everything is positioned correctly and building ceilings get hidden
                this.display.update(0.01);

                // get the building bounds to use for the screenshot width and height
                const bounds = collider.toAabb(mapHelpers.getBoundingCollider(this.params.object));

                // expand the bounds by the margins, for some buildings some sprites can go outside the bounding collider
                // so just let the user deal with it by expanding the screenshot themselves :)
                v2.set(bounds.min, v2.sub(bounds.min, v2.create(screenshotParams.margins, screenshotParams.margins)));
                v2.set(bounds.max, v2.add(bounds.max, v2.create(screenshotParams.margins, screenshotParams.margins)));

                const width = this.display.camera.m_scaleToScreen(bounds.max.x - bounds.min.x);
                const height = this.display.camera.m_scaleToScreen(bounds.max.y - bounds.min.y);

                const { x, y } = this.display.camera.m_pointToScreen(this.display.toWorldPos(bounds.min));

                const rect = new PIXI.Rectangle(x, y - height, width, height);

                const pixi = this.display.pixi;
                const background = new PIXI.Graphics();
                pixi.stage.addChildAt(background, 0);

                if (screenshotParams.transparent) {
                    display.renderer.ground.alpha = 0;
                    display.map.display.ground.alpha = 0;
                } else {
                    background.alpha = 1;
                    display.map.display.ground.alpha = display.renderer.layer === 0 ? 1 : 0;

                    // ... manually draw a background, this can be removed in pixi v8 because v8 renderer.extract has a clearColor param
                    const colors = display.map.getMapDef().biome.colors;
                    const undergroundColor = display.renderer.layer === 1 ? colors.underground : colors.grass;
                    background.clear();
                    background.beginFill(undergroundColor);
                    background.drawRect(rect.x, rect.y, rect.width, rect.height);
                    background.endFill();
                }

                const canvas = pixi.renderer.extract.canvas(pixi.stage, rect);
                canvas.toBlob?.(blob => {
                    if (blob) window.open(URL.createObjectURL(blob));
                });

                background.destroy();

                // reset stuff
                this.params.zoom = zoom;
                this.config.set("buildingEditor", this.params);
                this.display.camera.m_targetZoom = zoom;
                this.display.camera.m_zoom = zoom;
                display.map.display.ground.alpha = 1;
            });
        }
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

        this.config.config.debugRenderer = this.renderParams;
    }
}
