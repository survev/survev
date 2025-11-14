import * as PIXI from "pixi.js-legacy";
import { type MapDef, MapDefs } from "../../shared/defs/mapDefs";
import { MapObjectDefs } from "../../shared/defs/mapObjectDefs";
import type { BuildingDef, ObstacleDef } from "../../shared/defs/mapObjectsTyping";
import { GameConfig } from "../../shared/gameConfig";
import type { GroundPatch, MapMsg } from "../../shared/net/mapMsg";
import { type Circle, type Collider, coldet } from "../../shared/utils/coldet";
import { collider } from "../../shared/utils/collider";
import { mapHelpers } from "../../shared/utils/mapHelpers";
import { math } from "../../shared/utils/math";
import type { River } from "../../shared/utils/river";
import { generateJaggedAabbPoints, generateTerrain } from "../../shared/utils/terrainGen";
import { util } from "../../shared/utils/util";
import { type Vec2, v2 } from "../../shared/utils/v2";
import type { Ambiance } from "./ambiance";
import type { AudioManager } from "./audioManager";
import type { Camera } from "./camera";
import type { DebugRenderOpts } from "./config";
import { renderSpline } from "./debug/debugHelpers";
import { debugLines } from "./debug/debugLines";
import { device } from "./device";
import { Building } from "./objects/building";
import type { DecalBarn } from "./objects/decal";
import { Pool } from "./objects/objectPool";
import { Obstacle } from "./objects/obstacle";
import type { Emitter, ParticleBarn } from "./objects/particles";
import type { Player, PlayerBarn } from "./objects/player";
import type { SmokeParticle } from "./objects/smoke";
import { Structure } from "./objects/structure";
import type { Renderer } from "./renderer";

// Drawing

function drawLine(canvas: PIXI.Graphics, pt0: Vec2, pt1: Vec2) {
    canvas.moveTo(pt0.x, pt0.y);
    canvas.lineTo(pt1.x, pt1.y);
}
function tracePath(canvas: PIXI.Graphics, path: Vec2[]) {
    let point = path[0];
    canvas.moveTo(point.x, point.y);
    for (let i = 1; i < path.length; ++i) {
        point = path[i];
        canvas.lineTo(point.x, point.y);
    }
    canvas.closePath();
}
function traceGroundPatch(canvas: PIXI.Graphics, patch: GroundPatch, seed: number) {
    const width = patch.max.x - patch.min.x;
    const height = patch.max.y - patch.min.y;

    const offset = math.max(patch.offsetDist, 0.001);
    const roughness = patch.roughness;

    const divisionsX = Math.round((width * roughness) / offset);
    const divisionsY = Math.round((height * roughness) / offset);

    const seededRand = util.seededRand(seed);
    tracePath(
        canvas,
        generateJaggedAabbPoints(patch, divisionsX, divisionsY, offset, seededRand),
    );
}

function renderRiverDebug(river: River, playerPos: Vec2) {
    const drawPoly = function drawPoly(poly: Vec2[], color: number) {
        for (let i = 0; i < poly.length; i++) {
            const a = poly[i];
            const b = i < poly.length - 1 ? poly[i + 1] : poly[0];
            debugLines.addLine(a, b, color, 0.0);
        }
    };

    drawPoly(river.waterPoly, 0xffff00);
    drawPoly(river.shorePoly, 0xff00ff);

    const splinePts = river.spline.points;
    for (let i = 0; i < splinePts.length; i++) {
        debugLines.addCircle(splinePts[i], 1.0, 0x00ff00, 0.0);
        if (i < splinePts.length - 1) {
            debugLines.addLine(splinePts[i], splinePts[i + 1], 0xffff00, 0.0);
        }
    }

    const { spline } = river;
    const t = spline.getClosestTtoPoint(playerPos);
    const closestPos = spline.getPos(t);
    const closestTangent = v2.normalizeSafe(spline.getTangent(t), v2.create(1.0, 0.0));
    const closestNormal = v2.perp(closestTangent);
    const arcLen = spline.getArcLen(t);
    const arcT = spline.getTfromArcLen(arcLen);
    const arcPos = spline.getPos(arcT);

    renderSpline(spline, spline.totalArcLen * 0.5);
    debugLines.addCircle(arcPos, 0.9, 0xff00ff, 0.0);
    debugLines.addCircle(closestPos, 1.0, 0xff0000, 0.0);
    debugLines.addLine(closestPos, playerPos, 0x00ff00);
    debugLines.addLine(closestPos, v2.add(closestPos, closestTangent), 0xff0000, 0.0);
    debugLines.addLine(closestPos, v2.add(closestPos, closestNormal), 0x00ffff, 0.0);
    debugLines.addAabb(river.aabb.min, river.aabb.max, 0xffffff, 0.0);
}

export class Map {
    display = {
        ground: new PIXI.Graphics(),
    };

    mapName = "";
    mapDef = {} as MapDef;
    factionMode = false;
    perkMode = false;
    turkeyMode = false;
    seed = 0;
    width = 0;
    height = 0;
    mapData: {
        places: Array<{
            name: string;
            pos: Vec2;
        }>;
        objects: Array<{
            ori: number;
            pos: Vec2;
            scale: number;
            type: string;
        }>;
        groundPatches: GroundPatch[];
    } = {
        places: [],
        objects: [],
        groundPatches: [],
    };

    mapLoaded = false;
    mapTexture: PIXI.RenderTexture | null = null;
    m_obstaclePool = new Pool(Obstacle);
    m_buildingPool = new Pool(Building);
    m_structurePool = new Pool(Structure);
    deadObstacleIds: number[] = [];
    deadCeilingIds: number[] = [];
    solvedPuzzleIds: number[] = [];
    lootDropSfxIds: number[] = [];
    terrain: {
        shore: Vec2[];
        grass: Array<{
            x: number;
            y: number;
        }>;
        rivers: River[];
    } | null = null;

    cameraEmitter: Emitter | null = null;

    constructor(public decalBarn: DecalBarn) {}

    m_free() {
        // Buildings need to stop sound emitters
        const buildings = this.m_buildingPool.m_getPool();
        for (let i = 0; i < buildings.length; i++) {
            buildings[i].m_free();
        }
        this.mapTexture?.destroy(true);
        this.display.ground.destroy({
            children: true,
        });
        this.cameraEmitter?.stop();
        this.cameraEmitter = null;
    }

    resize(pixiRenderer: PIXI.IRenderer, canvasMode: boolean) {
        this.renderMap(pixiRenderer, canvasMode);
    }

    loadMap(
        mapMsg: MapMsg,
        camera: Camera,
        canvasMode: boolean,
        particleBarn: ParticleBarn,
    ) {
        this.mapName = mapMsg.mapName;
        // Clone the source mapDef
        const mapDef = MapDefs[this.mapName as keyof typeof MapDefs];
        if (!mapDef) {
            throw new Error(`Failed loading mapDef ${this.mapName}`);
        }
        this.mapDef = util.cloneDeep(mapDef);
        this.factionMode = !!this.mapDef.gameMode.factionMode;
        this.perkMode = !!this.mapDef.gameMode.perkMode;
        this.turkeyMode = !!this.mapDef.gameMode.turkeyMode;
        this.seed = mapMsg.seed;
        this.width = mapMsg.width;
        this.height = mapMsg.height;
        this.terrain = generateTerrain(
            this.width,
            this.height,
            mapMsg.shoreInset,
            mapMsg.grassInset,
            mapMsg.rivers,
            this.seed,
        );
        this.mapData = {
            places: mapMsg.places,
            objects: mapMsg.objects,
            groundPatches: mapMsg.groundPatches,
        };
        this.mapLoaded = true;
        const cameraEmitterType = this.mapDef.biome.particles.camera;
        if (cameraEmitterType) {
            const dir = v2.normalize(v2.create(1, -1));
            this.cameraEmitter?.stop();
            this.cameraEmitter = particleBarn.addEmitter(cameraEmitterType, {
                pos: v2.create(0, 0),
                dir,
                layer: 99999,
            });
        }
        this.display.ground.clear();
        this.renderTerrain(this.display.ground, 2 / camera.m_ppu, canvasMode, false);
    }

    getMapDef() {
        if (!this.mapLoaded) {
            throw new Error("Map not loaded!");
        }
        return this.mapDef;
    }

    getMapTexture() {
        return this.mapTexture;
    }

    m_update(
        dt: number,
        activePlayer: Player,
        playerBarn: PlayerBarn,
        particleBarn: ParticleBarn,
        audioManager: AudioManager,
        ambience: Ambiance,
        renderer: Renderer,
        camera: Camera,
        _smokeParticles: SmokeParticle[],
        debug: DebugRenderOpts,
    ) {
        const obstacles = this.m_obstaclePool.m_getPool();
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            if (obstacle.active) {
                obstacle.update(
                    dt,
                    this,
                    playerBarn,
                    particleBarn,
                    audioManager,
                    activePlayer,
                    renderer,
                );
                obstacle.render(dt, camera, debug, activePlayer.layer);
            }
        }

        const buildings = this.m_buildingPool.m_getPool();
        for (let i = 0; i < buildings.length; i++) {
            const building = buildings[i];
            if (building.active) {
                building.m_update(
                    dt,
                    this,
                    particleBarn,
                    audioManager,
                    activePlayer,
                    renderer,
                    camera,
                    debug,
                );
                building.render(camera, debug, activePlayer.layer);
            }
        }

        for (
            let structures = this.m_structurePool.m_getPool(), x = 0;
            x < structures.length;
            x++
        ) {
            const structure = structures[x];
            if (structure.active) {
                structure.update(dt, this, activePlayer, ambience);
                structure.render(camera, debug, activePlayer.layer);
            }
        }

        if (this.cameraEmitter) {
            this.cameraEmitter.pos = v2.copy(camera.m_pos);
            this.cameraEmitter.enabled = true;

            // Adjust radius and spawn rate based on zoom
            const maxRadius = 120;
            const camRadius = activePlayer.m_getZoom() * 2.5;
            this.cameraEmitter.radius = math.min(camRadius, maxRadius);
            const radius = this.cameraEmitter.radius;
            const ratio = (radius * radius) / (maxRadius * maxRadius);
            this.cameraEmitter.rateMult = 1 / ratio;
            const alphaTarget = activePlayer.layer == 0 ? 1 : 0;
            this.cameraEmitter.alpha = math.lerp(
                dt * 6,
                this.cameraEmitter.alpha,
                alphaTarget,
            );
        }

        if (IS_DEV && debug.rivers) {
            for (const river of this.terrain!.rivers) {
                renderRiverDebug(river, camera.m_pos);
            }
        }
    }

    renderTerrain(
        groundGfx: PIXI.Graphics,
        gridThickness: number,
        canvasMode: boolean,
        mapRender: boolean,
    ) {
        const width = this.width;
        const height = this.height;
        const terrain = this.terrain!;
        const ll = {
            x: 0,
            y: 0,
        };
        const lr = {
            x: width,
            y: 0,
        };
        const ul = {
            x: 0,
            y: height,
        };
        const ur = {
            x: width,
            y: height,
        };
        const mapColors = this.mapDef.biome.colors;
        const groundPatches = this.mapData.groundPatches;
        groundGfx.beginFill(mapColors.background);
        groundGfx.drawRect(-120, -120, width + 240, 120);
        groundGfx.drawRect(-120, height, width + 240, 120);
        groundGfx.drawRect(-120, -120, 120, height + 240);
        groundGfx.drawRect(width, -120, 120, height + 240);
        groundGfx.endFill();
        groundGfx.beginFill(mapColors.beach);
        tracePath(groundGfx, terrain?.shore);
        groundGfx.beginHole();
        tracePath(groundGfx, terrain?.grass);
        // groundGfx.addHole();
        groundGfx.endHole();
        groundGfx.endFill();

        // As mentioned above, don't explicitly render a grass polygon;
        // there's a hole left where the grass should be, with the background
        // clear color set to the grass color.
        //
        // ... except we have to for canvas mode!
        if (canvasMode) {
            groundGfx.beginFill(mapColors.grass);
            tracePath(groundGfx, terrain?.grass);
            groundGfx.endFill();
        }

        // Order 0 ground patches
        for (let i = 0; i < groundPatches.length; i++) {
            const patch = groundPatches[i];
            if (patch.order == 0 && (!mapRender || !!patch.useAsMapShape)) {
                groundGfx.beginFill(patch.color);
                traceGroundPatch(groundGfx, patch, this.seed);
                groundGfx.endFill();
            }
        }

        // River shore
        groundGfx.beginFill(mapColors.riverbank);

        // groundGfx.lineStyle(2, 0xff0000);

        for (let i = 0; i < terrain.rivers.length; i++) {
            tracePath(groundGfx, terrain.rivers[i].shorePoly);
        }
        groundGfx.endFill();
        groundGfx.beginFill(mapColors.water);
        for (let b = 0; b < terrain.rivers.length; b++) {
            tracePath(groundGfx, terrain.rivers[b].waterPoly);
        }
        groundGfx.endFill();

        // Water
        groundGfx.beginFill(mapColors.water);
        groundGfx.moveTo(ul.x, ul.y);
        groundGfx.lineTo(ur.x, ur.y);
        groundGfx.lineTo(lr.x, lr.y);
        groundGfx.lineTo(ll.x, ll.y);
        groundGfx.beginHole();
        tracePath(groundGfx, terrain.shore);
        // e.addHole();
        groundGfx.endHole();
        groundGfx.closePath();
        groundGfx.endFill();

        // Grid
        const gridGfx = groundGfx;
        gridGfx.lineStyle(gridThickness, 0, 0.15);
        for (let x = 0; x <= width; x += GameConfig.map.gridSize) {
            drawLine(
                gridGfx,
                {
                    x,
                    y: 0,
                },
                {
                    x,
                    y: height,
                },
            );
        }
        for (let y = 0; y <= height; y += GameConfig.map.gridSize) {
            drawLine(
                gridGfx,
                {
                    x: 0,
                    y,
                },
                {
                    x: width,
                    y,
                },
            );
        }
        gridGfx.lineStyle(gridThickness, 0, 0);

        // Order 1 ground patches
        for (let i = 0; i < groundPatches.length; i++) {
            const patch = groundPatches[i];
            if (patch.order == 1 && (!mapRender || !!patch.useAsMapShape)) {
                groundGfx.beginFill(patch.color);
                traceGroundPatch(groundGfx, patch, this.seed);
                groundGfx.endFill();
            }
        }
    }

    m_render(camera: Camera) {
        // Terrain
        // Fairly robust way to get translation and scale from the camera ...
        const p0 = camera.m_pointToScreen(v2.create(0, 0));
        const p1 = camera.m_pointToScreen(v2.create(1, 1));
        const s = v2.sub(p1, p0);
        // Translate and scale the map polygons to move the with camera
        this.display.ground.position.set(p0.x, p0.y);
        this.display.ground.scale.set(s.x, s.y);
    }

    getMinimapRender(obj: (typeof this.mapData.objects)[number]) {
        const def = MapObjectDefs[obj.type] as ObstacleDef | BuildingDef;
        const zIdx = def.type == "building" ? 750 + (def.zIdx || 0) : def.img.zIdx || 0;
        let shapes: Array<{
            scale?: number;
            color: number;
            collider: Circle;
        }> = [];
        if ((def as BuildingDef).map?.shapes !== undefined) {
            // @ts-expect-error stfu
            shapes = (def as BuildingDef).map?.shapes!;
        } else {
            let col = null;
            if (
                (col =
                    def.type == "obstacle"
                        ? def.collision
                        : def.ceiling.zoomRegions.length > 0 &&
                            def.ceiling.zoomRegions[0].zoomIn
                          ? def.ceiling.zoomRegions[0].zoomIn
                          : mapHelpers.getBoundingCollider(obj.type))
            ) {
                shapes.push({
                    collider: collider.copy(col) as Circle,
                    scale: def.map?.scale! || 1,
                    color: def.map?.color!,
                });
            }
        }
        return {
            obj,
            zIdx,
            shapes,
        };
    }

    renderMap(renderer: PIXI.IRenderer, canvasMode: boolean) {
        if (this.mapLoaded) {
            const mapRender = new PIXI.Container();
            const txtRender = new PIXI.Container();
            const mapColors = this.mapDef.biome.colors;
            const places = this.mapData.places;
            const objects = this.mapData.objects;
            let screenScale = device.screenHeight;
            if (device.mobile) {
                if (!device.isLandscape) {
                    screenScale = device.screenWidth;
                }
                screenScale *= math.min(device.pixelRatio, 2);
            }
            const scale = this.height / screenScale;

            // Background
            const background = new PIXI.Graphics();
            background.beginFill(mapColors.grass);
            background.drawRect(0, 0, this.width, this.height);
            background.endFill();
            this.renderTerrain(background, scale, canvasMode, true);

            // Border for extra spiffiness
            const ll = {
                x: 0,
                y: 0,
            };
            const lr = {
                x: this.width,
                y: 0,
            };
            const ul = {
                x: 0,
                y: this.height,
            };
            const ur = {
                x: this.width,
                y: this.height,
            };
            background.lineStyle(scale * 2, 0, 1);
            drawLine(background, ll, ul);
            drawLine(background, ul, ur);
            drawLine(background, ur, lr);
            drawLine(background, lr, ll);
            background.position.y = this.height;
            background.scale.y = -1;

            mapRender.addChild(background);

            // Render minimap objects, sorted by zIdx
            const minimapRenders = [];
            for (let i = 0; i < objects.length; i++) {
                const obj = objects[i];
                minimapRenders.push(this.getMinimapRender(obj));
            }
            minimapRenders.sort((a, b) => {
                return a.zIdx - b.zIdx;
            });

            const gfx = new PIXI.Graphics();
            for (let i = 0; i < minimapRenders.length; i++) {
                const render = minimapRenders[i];
                const obj = render.obj;
                for (let j = 0; j < render.shapes.length; j++) {
                    const shape = render.shapes[j];
                    const col = collider.transform(
                        shape.collider,
                        obj.pos,
                        math.oriToRad(obj.ori),
                        obj.scale,
                    );
                    const scale = shape.scale !== undefined ? shape.scale : 1;
                    gfx.beginFill(shape.color, 1);
                    switch (col.type) {
                        case collider.Type.Circle:
                            gfx.drawCircle(
                                col.pos.x,
                                this.height - col.pos.y,
                                col.rad * scale,
                            );
                            break;
                        case collider.Type.Aabb: {
                            let A = v2.mul(v2.sub(col.max, col.min), 0.5);
                            const O = v2.add(col.min, A);
                            A = v2.mul(A, scale);
                            gfx.drawRect(
                                O.x - A.x,
                                this.height - O.y - A.y,
                                A.x * 2,
                                A.y * 2,
                            );
                            gfx.endFill();
                        }
                    }
                }
            }
            mapRender.addChild(gfx);

            // Place names
            const nameContainer = new PIXI.Container();
            for (let i = 0; i < places.length; i++) {
                const place = places[i];
                const style = new PIXI.TextStyle({
                    fontFamily: "Arial",
                    fontSize: device.mobile ? 20 : 22,
                    fontWeight: "bold",
                    fill: ["#ffffff"],
                    stroke: "#000000",
                    strokeThickness: 1,
                    dropShadow: true,
                    dropShadowColor: "#000000",
                    dropShadowBlur: 1,
                    dropShadowAngle: Math.PI / 3,
                    dropShadowDistance: 1,
                    wordWrap: false,
                    align: "center",
                });
                const richText = new PIXI.Text(place.name, style);
                richText.anchor.set(0.5, 0.5);
                richText.x = (place.pos.x * this.height) / scale;
                richText.y = (place.pos.y * this.height) / scale;
                richText.alpha = 0.75;
                nameContainer.addChild(richText);
            }
            txtRender.addChild(nameContainer);

            // Generate and/or update the texture
            if (this.mapTexture) {
                this.mapTexture.resize(screenScale, screenScale);
            } else {
                this.mapTexture = PIXI.RenderTexture.create({
                    width: screenScale,
                    height: screenScale,
                    scaleMode: PIXI.SCALE_MODES.LINEAR,
                    resolution: 1,
                });
            }
            mapRender.scale = new PIXI.Point(
                screenScale / this.height,
                screenScale / this.height,
            );
            renderer.render(mapRender, {
                renderTexture: this.mapTexture,
                clear: true,
            });
            renderer.render(txtRender, {
                renderTexture: this.mapTexture,
                clear: false,
            });
            mapRender.destroy({
                children: true,
                texture: true,
                baseTexture: true,
            });
            txtRender.destroy({
                children: true,
                texture: true,
                baseTexture: true,
            });
        }
    }

    getGroundSurface(pos: Vec2, layer: number) {
        const groundSurface = (type: string, data: Record<string, any> = {}) => {
            if (type == "water") {
                const mapColors = this.getMapDef().biome.colors;
                data.waterColor =
                    data.waterColor !== undefined ? data.waterColor : mapColors.water;
                data.rippleColor =
                    data.rippleColor !== undefined
                        ? data.rippleColor
                        : mapColors.waterRipple;
            }
            return {
                type,
                data,
            } as {
                type: string;
                data: Required<typeof data>;
            };
        };

        // Check decals
        const decals = this.decalBarn.decalPool.m_getPool();
        for (let i = 0; i < decals.length; i++) {
            const decal = decals[i];
            if (
                decal.active &&
                decal.surface &&
                util.sameLayer(decal.layer, layer) &&
                collider.intersectCircle(decal.collider, pos, 0.0001)
            ) {
                return groundSurface(decal.surface.type, decal.surface.data);
            }
        }

        // Check buildings
        let surface = null;
        let zIdx = 0;
        const onStairs = layer & 2;
        const buildings = this.m_buildingPool.m_getPool();
        for (let i = 0; i < buildings.length; i++) {
            const building = buildings[i];
            if (
                building.active &&
                building.zIdx >= zIdx &&
                // Prioritize layer0 building surfaces when on stairs
                (building.layer == layer || !!onStairs) &&
                (building.layer != 1 || !onStairs)
            ) {
                for (let i = 0; i < building.surfaces.length; i++) {
                    const s = building.surfaces[i];
                    for (let j = 0; j < s.colliders.length; j++) {
                        const res = collider.intersectCircle(s.colliders[j], pos, 0.0001);
                        if (res) {
                            zIdx = building.zIdx;
                            surface = s;
                            break;
                        }
                    }
                }
            }
        }
        if (surface) {
            return groundSurface(surface.type, surface.data);
        }

        // Check rivers
        let onRiverShore = false;
        if (layer != 1) {
            const rivers = this.terrain?.rivers!;
            for (let v = 0; v < rivers.length; v++) {
                const river = rivers[v];
                if (
                    coldet.testPointAabb(pos, river.aabb.min, river.aabb.max) &&
                    math.pointInsidePolygon(pos, river.shorePoly) &&
                    ((onRiverShore = true), math.pointInsidePolygon(pos, river.waterPoly))
                ) {
                    return groundSurface("water", {
                        river,
                    });
                }
            }
        }
        // Check terrain
        return groundSurface(
            // Use a stone step sound if we're in the main-spring def
            math.pointInsidePolygon(pos, this.terrain?.grass!)
                ? onRiverShore
                    ? this.mapDef.biome.sound.riverShore
                    : "grass"
                : math.pointInsidePolygon(pos, this.terrain?.shore!)
                  ? "sand"
                  : "water",
        );
    }

    isInOcean(pos: Vec2) {
        return !math.pointInsidePolygon(pos, this.terrain?.shore!);
    }

    distanceToShore(pos: Vec2) {
        return math.distToPolygon(pos, this.terrain?.shore!);
    }

    insideStructureStairs(collision: Collider) {
        const structures = this.m_structurePool.m_getPool();
        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            if (structure.active && structure.insideStairs(collision)) {
                return true;
            }
        }
        return false;
    }

    getBuildingById(objId: number) {
        const buildings = this.m_buildingPool.m_getPool();
        for (let i = 0; i < buildings.length; i++) {
            const building = buildings[i];
            if (building.active && building.__id == objId) {
                return building;
            }
        }
        return null;
    }

    insideStructureMask(collision: Collider) {
        const structures = this.m_structurePool.m_getPool();
        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            if (structure.active && structure.insideMask(collision)) {
                return true;
            }
        }
        return false;
    }

    insideBuildingCeiling(collision: Collider, checkVisible: boolean) {
        const buildings = this.m_buildingPool.m_getPool();
        for (let i = 0; i < buildings.length; i++) {
            const building = buildings[i];
            if (
                building.active &&
                (!checkVisible ||
                    (building.ceiling.visionTicker > 0 && !building.ceilingDead)) &&
                building.isInsideCeiling(collision)
            ) {
                return true;
            }
        }
        return false;
    }
}
