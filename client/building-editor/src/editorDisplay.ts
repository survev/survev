import * as PIXI from "pixi.js-legacy";

import type { ConfigManager, DebugRendererOpts } from "$lib/modules/ConfigManager.svelte.ts";
import { MapDefs } from "@/shared/defs/mapDefs.ts";
import { MapObjectDefs } from "@/shared/defs/register.ts";
import { MapMsg } from "@/shared/net/mapMsg.ts";
import { type ObjectData, ObjectType } from "@/shared/net/objectSerializeFns.ts";
import type { LocalDataWithDirty } from "@/shared/net/updateMsg.ts";
import { collider } from "@/shared/utils/collider.ts";
import { math } from "@/shared/utils/math.ts";
import { util } from "@/shared/utils/util.ts";
import { v2, type Vec2 } from "@/shared/utils/v2.ts";
import type { Ambiance } from "../../src/ambiance.ts";
import type { AudioManager } from "../../src/audioManager.ts";
import Camera from "../../src/camera.ts";
import { debugLines } from "../../src/debug/debugLines.ts";
import type { Game } from "../../src/game.ts";
import type { InputBinds } from "../../src/inputBinds.ts";
import { device } from "../../src/lib/modules/Device.svelte.ts";
import { Map } from "../../src/map.ts";
import { DecalBarn } from "../../src/objects/decal.ts";
import { Creator } from "../../src/objects/objectPool.ts";
import { ParticleBarn } from "../../src/objects/particles.ts";
import { type Player, PlayerBarn } from "../../src/objects/player.ts";
import { SmokeBarn } from "../../src/objects/smoke.ts";
import { Renderer } from "../../src/renderer.ts";
import type { ResourceManager } from "../../src/resources.ts";
import type { UiManager2 } from "../../src/ui/ui2.ts";

export class EditorDisplay {
    active = false;
    initialized = false;

    canvasMode!: boolean;
    camera!: Camera;
    renderer!: Renderer;
    particleBarn!: ParticleBarn;
    decalBarn!: DecalBarn;
    map!: Map;
    playerBarn!: PlayerBarn;
    smokeBarn!: SmokeBarn;
    objectCreator!: Creator;
    debugDisplay!: PIXI.Graphics;

    activeId = 98;
    activePlayer!: Player;

    nextId = 100;

    mapMsg = new MapMsg();

    getNextId() {
        return this.nextId++;
    }

    constructor(
        public pixi: PIXI.Application,
        public audioManager: AudioManager,
        public config: ConfigManager,
        public inputBinds: InputBinds,
        public ambience: Ambiance,
        public resourceManager: ResourceManager,
    ) {}

    init() {
        this.canvasMode = this.pixi.renderer.type == PIXI.RENDERER_TYPE.CANVAS;
        this.camera = new Camera();
        this.renderer = new Renderer(this as unknown as Game, this.canvasMode);
        this.particleBarn = new ParticleBarn(this.renderer);
        this.decalBarn = new DecalBarn();
        this.map = new Map(this.decalBarn);
        this.playerBarn = new PlayerBarn();
        this.smokeBarn = new SmokeBarn();

        // Register types
        const TypeToPool = {
            [ObjectType.Player]: this.playerBarn.playerPool,
            [ObjectType.Obstacle]: this.map.m_obstaclePool,
            [ObjectType.Building]: this.map.m_buildingPool,
            [ObjectType.Structure]: this.map.m_structurePool,
            [ObjectType.Decal]: this.decalBarn.decalPool,
            [ObjectType.Smoke]: this.smokeBarn.m_smokePool,
        };

        this.objectCreator = new Creator();
        for (const type in TypeToPool) {
            if (TypeToPool.hasOwnProperty(type)) {
                this.objectCreator.m_registerType(
                    type,
                    TypeToPool[type as unknown as keyof typeof TypeToPool],
                );
            }
        }

        // Render ordering
        this.debugDisplay = new PIXI.Graphics();

        const pixiContainers = [
            this.map.display.ground,
            this.renderer.layers[0],
            this.renderer.ground,
            this.renderer.layers[1],
            this.renderer.layers[2],
            this.renderer.layers[3],
            this.debugDisplay,
        ];
        for (let i = 0; i < pixiContainers.length; i++) {
            const container = pixiContainers[i];
            if (container) {
                container.interactiveChildren = false;
                this.pixi.stage.addChild(container);
            }
        }

        this.resetObj();

        this.updatePlayer();

        this.activePlayer = this.playerBarn.getPlayerById(this.activeId)!;
        this.activePlayer.m_setLocalData(
            {
                boost: 100,
                boostDirty: true,
                health: 100,
                inventoryDirty: false,
                spectatorCountDirty: false,
                weapsDirty: true,
                curWeapIdx: 2,
                weapons: [
                    {
                        type: "",
                        ammo: 0,
                    },
                    {
                        type: "",
                        ammo: 0,
                    },
                    {
                        type: "fists",
                        ammo: 0,
                    },
                    {
                        type: "",
                        ammo: 0,
                    },
                ],
            } satisfies Partial<LocalDataWithDirty> as LocalDataWithDirty,
        );

        this.activePlayer.layer = this.activePlayer.m_netData.m_layer;
        this.renderer.setActiveLayer(this.activePlayer.layer);
        this.audioManager.activeLayer = this.activePlayer.layer;

        this.initialized = true;

        this.resize();
    }

    free() {
        if (this.initialized) {
            this.map.m_free();
            this.particleBarn.m_free();
            this.renderer.m_free();
            while (this.pixi.stage.children.length > 0) {
                const e = this.pixi.stage.children[0];
                this.pixi.stage.removeChild(e);
                e.destroy({
                    children: true,
                });
            }
        }
        this.initialized = false;
    }

    getCtx() {
        return {
            audioManager: this.audioManager,
            renderer: this.renderer,
            particleBarn: this.particleBarn,
            map: this.map,
            smokeBarn: this.smokeBarn,
            decalBarn: this.decalBarn,
        };
    }

    toWorldPos(pos: Vec2) {
        const center = v2.create(this.map.width / 2, this.map.height / 2);

        return v2.add(center, pos);
    }

    toBuildingPos(pos: Vec2) {
        const center = v2.create(this.map.width / 2, this.map.height / 2);
        return v2.sub(pos, center);
    }

    updatePlayer() {
        const pos = this.toWorldPos(this.config.get("buildingEditor")!.pos);
        const obj: ObjectData<ObjectType.Player> = {
            outfit: "outfitDev",
            backpack: "backpack02",
            helmet: "helmet01",
            chest: "chest03",
            activeWeapon: "fists",
            layer: 0,
            dead: true,
            downed: false,
            animType: 0,
            animSeq: 0,
            actionSeq: 0,
            actionType: 0,
            actionItem: "",
            wearingPan: false,
            healEffect: false,
            lastStandEffect: false,
            frozen: false,
            frozenOri: 0,
            frozenType: "",
            hasteType: 0,
            hasteSeq: 0,
            scale: 1,
            role: "",
            perks: [],
            pos: pos,
            dir: v2.create(0, -1),
        };

        const p = this.objectCreator.m_updateObjFull(
            ObjectType.Player,
            this.activeId,
            obj as unknown as ObjectData<ObjectType.Player>,
            this.getCtx(),
        ) as Player;

        this.playerBarn.setPlayerInfo({
            playerId: 98,
            teamId: 1,
            groupId: 0,
            name: "",
            loadout: {
                heal: "heal_basic",
                boost: "boost_basic",
            },
        });
    }

    setPlayerPos(pos: Vec2) {
        this.objectCreator.m_updateObjPart(
            this.activeId,
            {
                pos: pos,
                dir: v2.create(0, -1),
            },
            this.getCtx(),
        );
    }

    addStructure(type: string, pos: Vec2, ori: number) {
        const def = MapObjectDefs.typeToDef(type, "structure");

        const data: ObjectData<ObjectType.Structure> = {
            type,
            pos,
            ori,
            layerObjIds: [],
            interiorSoundAlt: false,
            interiorSoundEnabled: true,
        };
        const obj = this.objectCreator.m_updateObjFull(
            ObjectType.Structure,
            this.getNextId(),
            data,
            this.getCtx(),
        );

        for (let i = 0; i < def.layers.length; i++) {
            const layerDef = def.layers[i];
            this.addBuilding(
                layerDef.type,
                math.addAdjust(pos, layerDef.pos, ori),
                (layerDef.ori + ori) % 4,
                i,
            );
        }

        return obj;
    }

    addBuilding(type: string, pos: Vec2, ori: number, layer: number) {
        const data: ObjectData<ObjectType.Building> = {
            type,
            pos,
            ori,
            layer,
            occupied: false,
            ceilingDamaged: false,
            ceilingDead: false,
            hasPuzzle: false,
            puzzleSolved: false,
            puzzleErrSeq: 0,
        };
        const obj = this.objectCreator.m_updateObjFull(
            ObjectType.Building,
            this.getNextId(),
            data,
            this.getCtx(),
        );
        const def = MapObjectDefs.typeToDef(type, "building");

        for (const child of def.mapObjects) {
            let partType = child.type;

            if (typeof partType === "object") {
                partType = util.weightedRandomObject(partType);
            }
            if (!partType) continue;

            let partOri: number;
            if (child.inheritOri === false) partOri = child.ori;
            else partOri = (child.ori + ori) % 4;

            const partPos = math.addAdjust(pos, child.pos, ori);

            this.addAuto(
                partType,
                partPos,
                layer,
                partOri,
                child.scale,
                obj.__id,
                !!child.puzzlePiece,
            );
        }

        if (def.mapGroundPatches) {
            for (const patch of def.mapGroundPatches) {
                if (patch.bound.type === collider.Type.Circle) {
                    const worldCenter = math.addAdjust(pos, patch.bound.pos, ori);
                    this.mapMsg.groundPatches.push({
                        bound: collider.createCircle(worldCenter, patch.bound.rad),
                        color: patch.color,
                        roughness: patch.roughness ?? 0,
                        offsetDist: patch.offsetDist ?? 0,
                        order: patch.order ?? 0,
                        useAsMapShape: patch.useAsMapShape ?? true,
                    });
                } else {
                    this.mapMsg.groundPatches.push({
                        bound: collider.createAabb(
                            math.addAdjust(pos, patch.bound.min, ori),
                            math.addAdjust(pos, patch.bound.max, ori),
                        ),
                        color: patch.color,
                        roughness: patch.roughness ?? 0,
                        offsetDist: patch.offsetDist ?? 0,
                        order: patch.order ?? 0,
                        useAsMapShape: patch.useAsMapShape ?? true,
                    });
                }
            }
        }

        return obj;
    }

    addObstacle(
        type: string,
        pos: Vec2,
        ori: number,
        scale: number,
        layer: number,
        parentId?: number,
        puzzlePiece?: boolean,
    ) {
        MapObjectDefs.typeToDef(type, "obstacle");

        const data: ObjectData<ObjectType.Obstacle> = {
            type,
            pos,
            ori,
            scale,
            layer,
            healthT: 1,
            dead: false,
            isDoor: false,
            door: {
                open: false,
                canUse: false,
                locked: false,
                seq: 0,
            },
            isButton: false,
            button: {
                onOff: false,
                canUse: false,
                seq: 0,
            },
            isPuzzlePiece: !!puzzlePiece,
            parentBuildingId: parentId,
            isSkin: false,
            skinPlayerId: 0,
        };
        const obj = this.objectCreator.m_updateObjFull(
            ObjectType.Obstacle,
            this.getNextId(),
            data,
            this.getCtx(),
        );
        return obj;
    }

    addDecal(type: string, pos: Vec2, ori: number, scale: number, layer: number) {
        MapObjectDefs.typeToDef(type, "decal");

        const data: ObjectData<ObjectType.Decal> = {
            type,
            pos,
            ori,
            scale,
            layer,
            goreKills: 0,
        };
        const obj = this.objectCreator.m_updateObjFull(
            ObjectType.Decal,
            this.getNextId(),
            data,
            this.getCtx(),
        );
        return obj;
    }

    addAuto(
        type: string,
        pos: Vec2,
        layer: number,
        ori: number,
        scale: number,
        parentId?: number,
        puzzlePiece?: boolean,
        ignoreMapSpawnReplacement?: boolean,
    ) {
        let def = MapObjectDefs.typeToDef(type);

        const spawnReplacements = this.map.getMapDef().mapGen.spawnReplacements[0];
        if (spawnReplacements[type] && !ignoreMapSpawnReplacement) {
            type = spawnReplacements[type];
            def = MapObjectDefs.typeToDef(type);
        }

        switch (def.type) {
            case "obstacle":
                return this.addObstacle(
                    type,
                    pos,
                    ori,
                    scale,
                    layer,
                    parentId,
                    puzzlePiece,
                );
            case "building":
                return this.addBuilding(type, pos, ori, layer);
            case "structure":
                return this.addStructure(type, pos, ori);
            case "decal": {
                return this.addDecal(type, pos, ori, scale, layer);
            }
            case "loot_spawner":
                // nothing for now
                break;
        }
    }

    clearAllObjs() {
        for (const obj of this.map.m_structurePool.m_getPool()) {
            if (obj.active) {
                this.objectCreator.m_deleteObj(obj.__id);
            }
        }

        for (const obj of this.map.m_buildingPool.m_getPool()) {
            if (obj.active) {
                this.objectCreator.m_deleteObj(obj.__id);
            }
        }

        for (const obj of this.map.m_obstaclePool.m_getPool()) {
            if (obj.active) {
                this.objectCreator.m_deleteObj(obj.__id);
            }
        }

        for (const obj of this.decalBarn.decalPool.m_getPool()) {
            if (obj.active) {
                this.objectCreator.m_deleteObj(obj.__id);
            }
        }
    }

    resetObj() {
        const cfg = this.config.get("buildingEditor")!;
        let mapName = cfg.map;
        const type = cfg.object;

        if (!(mapName in MapDefs)) {
            mapName = "main";
        }

        this.resourceManager.loadMapAssets(mapName);

        this.mapMsg = new MapMsg();
        this.mapMsg.grassInset = 18;
        this.mapMsg.groundPatches = [];
        this.mapMsg.width = 720;
        this.mapMsg.height = 720;
        this.mapMsg.mapName = mapName;
        this.mapMsg.objects = [];
        this.mapMsg.places = [];
        this.mapMsg.rivers = [];
        this.mapMsg.seed = 218051654;
        this.mapMsg.shoreInset = 48;

        this.map.loadMap(this.mapMsg, this.camera, this.canvasMode, this.particleBarn);

        this.clearAllObjs();
        const center = v2.create(this.map.width / 2, this.map.height / 2);

        if (type && MapObjectDefs.typeExists(type)) {
            this.addAuto(type, center, 0, 0, 1);
        }

        // re render the map so ground patches are rendered after the buildings are created
        this.map.display.ground.clear();
        this.map.renderTerrain(
            this.map.display.ground,
            2 / this.camera.m_ppu,
            this.canvasMode,
            false,
        );
    }

    update(dt: number) {
        const debug = this.config.get("debugRenderer")!;
        const editorCfg = this.config.get("buildingEditor")!;
        // Camera
        this.camera.m_pos = v2.copy(this.activePlayer.m_pos);
        this.camera.m_targetZoom = editorCfg.zoom;

        this.camera.m_zoom = math.lerp(
            dt * 5,
            this.camera.m_zoom,
            this.camera.m_targetZoom,
        );

        this.audioManager.cameraPos = v2.copy(this.camera.m_pos);

        if (editorCfg.grid) {
            const width = this.camera.m_screenWidth / this.camera.m_z();
            const height = this.camera.m_screenHeight / this.camera.m_z();

            const roundV2 = (v: Vec2) => {
                return {
                    x: Math.round(v.x / 10) * 10,
                    y: Math.round(v.y / 10) * 10,
                };
            };
            const size = v2.create(width, height);
            const start = roundV2(v2.sub(this.camera.m_pos, size));
            const end = roundV2(v2.add(this.camera.m_pos, size));

            function addGrid(steps: number, color: number) {
                for (let y = start.y; y < end.y; y += steps) {
                    debugLines.addLine(v2.create(start.x, y), v2.create(end.x, y), color);
                }
                for (let x = start.x; x < end.x; x += steps) {
                    debugLines.addLine(v2.create(x, start.y), v2.create(x, end.y), color);
                }
            }
            if (this.camera.m_zoom >= 1.5) {
                addGrid(1, 0x424242);
            }
            if (this.camera.m_zoom >= 4.5) {
                addGrid(0.25, 0x424242);
            }
            addGrid(this.camera.m_zoom > 0.5 ? 5 : 10, 0x7f7f7f);

            debugLines.addRay(this.camera.m_pos, v2.create(0, 1), 1, 0x00ff00);
            debugLines.addRay(this.camera.m_pos, v2.create(1, 0), 1, 0x00ff00);
        }

        this.playerBarn.m_update(
            dt,
            this.activeId,
            this.renderer,
            this.particleBarn,
            this.camera,
            this.map,
            this.inputBinds,
            this.audioManager,
            // ui2 manager is only used for updating perks, as long as we dont add any perks
            // it should be fine :)
            undefined as unknown as UiManager2,
            false,
            false,
        );

        this.map.m_update(
            dt,
            this.activePlayer,
            this.playerBarn,
            this.particleBarn,
            this.audioManager,
            this.ambience,
            this.renderer,
            this.camera,
            [],
            debug,
        );

        this.smokeBarn.m_update(
            dt,
            this.camera,
            this.activePlayer,
            this.map,
            this.renderer,
        );
        this.particleBarn.m_update(dt, this.camera);
        this.decalBarn.m_update(dt, this.camera, this.renderer);
        this.renderer.m_update(dt, this.camera, this.map, debug.structures.layerMasks);
        this.activePlayer.playActionStartSfx = false;

        this.render(debug);
    }

    render(debug: DebugRendererOpts) {
        const grassColor = this.map.mapLoaded
            ? this.map.getMapDef().biome.colors.grass
            : 0x80af49;

        this.pixi.renderer.background.color = grassColor;

        // Module rendering
        this.playerBarn.m_render(this.camera, debug);
        this.map.m_render(this.camera);

        this.debugDisplay.clear();
        if (debug.enabled) {
            debugLines.m_render(this.camera, this.debugDisplay);
        }
        debugLines.flush();
    }

    resize() {
        if (this.initialized) {
            this.camera.m_screenWidth = device.screenWidth;
            this.camera.m_screenHeight = device.screenHeight;
            this.map.resize(this.pixi.renderer, this.canvasMode);
            this.renderer.resize(this.map, this.camera);
        }
    }
}
