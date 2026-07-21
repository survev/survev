import { Puzzles } from "../../../../shared/defs/puzzles.ts";
import { MapObjectDefs } from "../../../../shared/defs/register.ts";
import { DamageType } from "../../../../shared/gameConfig.ts";
import { ObjectType } from "../../../../shared/net/objectSerializeFns.ts";
import { type AABB, coldet, type Collider } from "../../../../shared/utils/coldet.ts";
import { collider } from "../../../../shared/utils/collider.ts";
import { mapHelpers } from "../../../../shared/utils/mapHelpers.ts";
import { math } from "../../../../shared/utils/math.ts";
import { util } from "../../../../shared/utils/util.ts";
import { v2, type Vec2 } from "../../../../shared/utils/v2.ts";
import type { Game } from "../game.ts";
import type { Decal } from "./decal.ts";
import { BaseGameObject } from "./gameObject.ts";
import type { Obstacle } from "./obstacle.ts";
import type { Structure } from "./structure.ts";

export class Building extends BaseGameObject {
    mapObstacleBounds: Collider[] = [];

    override readonly __type = ObjectType.Building;
    bounds: AABB;

    type: string;

    layer: number;

    wallsToDestroy: number;
    ceilingDead = false;
    ceilingDamaged = false;
    ori: number;
    occupiedDisabled = false;
    occupied = false;

    hasPuzzle = false;
    puzzleSolved = false;
    puzzleErrSeq = 0;
    puzzleInputCode: string[] = [];

    puzzleResetTicker = 0;
    puzzleCompleteTicker = 0;
    puzzlePieceResetTicker = 0;

    scale = 1;

    childObjects: Array<Obstacle | Building | Structure | Decal> = [];
    parentStructure?: Structure;
    parentBuilding?: Building;

    surfaces: Array<{
        type: string;
        colliders: Collider[];
    }> = [];

    zoomRegions: Array<{
        zoomIn?: AABB;
        zoomOut?: AABB;
        zoom?: number;
        noZoom?: boolean;
    }> = [];

    healRegions?: Array<{
        collision: Collider;
        healRate: number;
    }> = [];

    goreRegion?: AABB;

    hasOccupiedEmitters: boolean;
    emitterBounds: AABB;

    rot: number;

    zIdx: number;

    constructor(
        game: Game,
        type: string,
        pos: Vec2,
        ori: number,
        layer: number,
        parentId?: number,
    ) {
        super(game, pos);
        this.layer = layer;
        this.ori = ori;
        this.type = type;

        const parent = this.game.objectRegister.getById(parentId ?? 0);

        if (parent?.__type === ObjectType.Building) {
            this.parentBuilding = parent;
        } else if (parent?.__type === ObjectType.Structure) {
            this.parentStructure = parent;
        }

        if (
            this.parentBuilding
            && !this.parentStructure
            && this.parentBuilding.parentStructure
        ) {
            this.parentStructure = this.parentBuilding.parentStructure;
        }

        const def = MapObjectDefs.typeToDef(this.type, "building");

        this.rot = math.oriToRad(ori);

        this.zIdx = def.zIdx ?? 0;

        this.bounds = collider.transform(
            mapHelpers.getBoundingCollider(type),
            v2.create(0, 0),
            this.rot,
            1,
        ) as AABB;

        // transforms heal region local coordinates to world coordinates
        this.healRegions = def.healRegions?.map((hr) => {
            return {
                collision: collider.transform(
                    hr.collision,
                    this.pos,
                    this.rot,
                    this.scale,
                ),
                healRate: hr.healRate,
            };
        });

        if (def.goreRegion) {
            this.goreRegion = collider.transform(
                def.goreRegion,
                this.pos,
                this.rot,
                this.scale,
            ) as AABB;
        }

        this.wallsToDestroy = def.ceiling.destroy?.wallCount ?? Infinity;

        this.surfaces = [];

        for (let i = 0; i < def.floor.surfaces.length; i++) {
            const surfaceDef = def.floor.surfaces[i];
            const surface = {
                type: surfaceDef.type,
                colliders: [] as Collider[],
            };
            for (let i = 0; i < surfaceDef.collision.length; i++) {
                surface.colliders.push(
                    collider.transform(surfaceDef.collision[i], this.pos, this.rot, 1),
                );
            }
            this.surfaces.push(surface);
        }

        const zoomInBounds: AABB[] = [];
        for (let i = 0; i < def.ceiling.zoomRegions.length; i++) {
            const region = def.ceiling.zoomRegions[i];
            const zoomIn = region.zoomIn
                ? (collider.transform(
                    region.zoomIn,
                    this.pos,
                    this.rot,
                    this.scale,
                ) as AABB)
                : undefined;

            if (zoomIn) {
                zoomInBounds.push(zoomIn);
            }

            this.zoomRegions.push({
                zoomIn,
                zoomOut: region.zoomOut
                    ? (collider.transform(
                        region.zoomOut,
                        this.pos,
                        this.rot,
                        this.scale,
                    ) as AABB)
                    : undefined,
                zoom: region.zoom,
                noZoom: region.noZoom,
            });
        }

        this.hasOccupiedEmitters = !!def.occupiedEmitters && def.occupiedEmitters.length > 0;
        const emitterBounds = coldet.boundingAabb(zoomInBounds);
        this.emitterBounds = collider.createAabb(emitterBounds.min, emitterBounds.max);

        if (def.puzzle) {
            this.hasPuzzle = true;
        }
    }

    update(dt: number) {
        if (this.hasPuzzle) {
            const puzzleDef = MapObjectDefs.typeToDef(this.type, "building").puzzle!;

            if (this.puzzleResetTicker > 0) {
                this.puzzleResetTicker -= dt;
                if (this.puzzleResetTicker <= 0) {
                    this.resetPuzzle();
                }
            }

            if (this.puzzleSolved && this.puzzleCompleteTicker > 0) {
                this.puzzleCompleteTicker -= dt;

                if (this.puzzleCompleteTicker <= 0) {
                    for (const obj of this.childObjects) {
                        if (
                            obj.__type === ObjectType.Obstacle
                            && obj.type === puzzleDef.completeUseType
                        ) {
                            if (obj.isDoor) {
                                obj.toggleDoor();
                            } else if (obj.isButton) {
                                obj.useButton();
                            } else {
                                obj.kill({
                                    damageType: DamageType.Player,
                                    dir: v2.create(0, 0),
                                    // source: piece.interactedBy,
                                });
                            }
                        }
                    }
                }
            }

            if (this.puzzlePieceResetTicker > 0) {
                this.puzzlePieceResetTicker -= dt;
                if (this.puzzlePieceResetTicker <= 0) {
                    this.puzzleErrSeq++;
                    this.setPartDirty();
                    this.puzzleResetTicker = puzzleDef.errorResetDelay;
                }
            }
        }

        if (this.hasOccupiedEmitters && !this.occupiedDisabled) {
            const oldOccupiedState = this.occupied;

            this.occupied = false;

            const livingPlayers = this.game.playerBarn.livingPlayers;
            const players = livingPlayers.length < 20
                ? livingPlayers
                : this.game.grid.intersectCollider(this.emitterBounds);

            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                if (player.__type !== ObjectType.Player) continue;
                if (player.dead) continue;
                if (!util.sameLayer(player.layer, this.layer)) continue;
                for (let j = 0; j < this.zoomRegions.length; j++) {
                    const region = this.zoomRegions[j];

                    if (!region.zoomIn) continue;
                    if (
                        coldet.testCircleAabb(
                            player.pos,
                            player.rad,
                            region.zoomIn.min,
                            region.zoomIn.max,
                        )
                    ) {
                        this.occupied = true;
                        break;
                    }
                }
                if (this.occupied) {
                    break;
                }
            }

            if (this.occupied !== oldOccupiedState) {
                this.setPartDirty();
            }
        }
    }

    obstacleDestroyed(obstacle: Obstacle): void {
        const def = MapObjectDefs.typeToDef(obstacle.type, "obstacle");

        if (def.damageCeiling) {
            this.ceilingDamaged = true;
            this.setPartDirty();
        }

        if (def.disableBuildingOccupied) {
            this.occupied = false;
            this.occupiedDisabled = true;
        }

        if (obstacle.isWall) {
            // ceiling destroy logic
            this.wallsToDestroy--;
            if (this.wallsToDestroy <= 0 && !this.ceilingDead) {
                this.ceilingDead = true;
                this.setPartDirty();
            }
        }
    }

    delete(): void {
        const dfs = (obj: Obstacle | Building | Structure | Decal) => {
            switch (obj.__type) {
                case ObjectType.Obstacle:
                case ObjectType.Decal:
                    obj.destroy();
                    break;
                case ObjectType.Building:
                    for (let i = 0; i < obj.childObjects.length; i++) {
                        const childObj = obj.childObjects[i];
                        dfs(childObj);
                    }
                    obj.destroy();
                    break;
                case ObjectType.Structure:
                    const topFloor = this.game.objectRegister.getById(
                        obj.layerObjIds[0],
                    ) as Building;
                    const bottomFloor = this.game.objectRegister.getById(
                        obj.layerObjIds[1],
                    ) as Building;
                    dfs(topFloor);
                    dfs(bottomFloor);
                    break;
            }
        };
        dfs(this);
    }

    refresh(): void {
        this.game.map.genBuilding(
            this.type,
            v2.copy(this.pos),
            this.layer,
            this.ori,
            this.parentStructure?.__id,
            undefined,
            true,
        );
        this.delete();
    }

    updatePos(newPos: Vec2): void {
        const deltaPos = v2.sub(newPos, this.pos);
        const dfs = (obj: Obstacle | Building | Structure | Decal) => {
            obj.pos = v2.add(obj.pos, deltaPos);
            this.game.map.clampToMapBounds(obj.pos);
            switch (obj.__type) {
                case ObjectType.Obstacle:
                    obj.setPartDirty();
                    break;
                case ObjectType.Decal:
                    obj.setDirty();
                    break;
                case ObjectType.Building:
                    obj.setDirty();
                    for (let i = 0; i < obj.childObjects.length; i++) {
                        const childObj = obj.childObjects[i];
                        dfs(childObj);
                    }

                    break;
                case ObjectType.Structure:
                    const topFloor = this.game.objectRegister.getById(
                        obj.layerObjIds[0],
                    ) as Building;
                    const bottomFloor = this.game.objectRegister.getById(
                        obj.layerObjIds[1],
                    ) as Building;
                    dfs(topFloor);
                    dfs(bottomFloor);
                    break;
            }
        };
        dfs(this);
    }

    puzzlePieceToggled(piece: Obstacle): void {
        const puzzleDef = MapObjectDefs.typeToDef(this.type, "building").puzzle!;

        this.puzzleResetTicker = 0;
        this.puzzlePieceResetTicker = 0;

        this.puzzleInputCode.push(piece.puzzlePiece!);

        let puzzleName = puzzleDef.name;
        if (this.game.map.woodsMode && puzzleName === "bunker_eye_02") {
            puzzleName = "bunker_eye_02_woods";
        }

        const puzzleCode = Puzzles[puzzleName];

        if (this.puzzleInputCode.join("-") === puzzleCode.join("-")) {
            this.puzzleSolved = true;
            if (this.parentStructure) {
                const def = MapObjectDefs.typeToDef(this.parentStructure.type, "structure");
                if (def.interiorSound?.puzzle === puzzleDef.name) {
                    this.parentStructure.interiorSoundAlt = true;
                    this.parentStructure.setDirty();
                }
            }
            this.setPartDirty();

            this.puzzleResetTicker = puzzleDef.completeOffDelay;
            this.puzzleCompleteTicker = puzzleDef.completeUseDelay;
        } else if (this.puzzleInputCode.length >= puzzleCode.length) {
            this.puzzleErrSeq++;
            this.setPartDirty();

            this.puzzleResetTicker = puzzleDef.errorResetDelay;
        } else {
            this.puzzlePieceResetTicker = puzzleDef.pieceResetDelay;
        }
    }

    onGoreRegionKill() {
        for (const obj of this.childObjects) {
            if (obj.__type === ObjectType.Decal) {
                obj.goreKills++;
                obj.setDirty();
            }
        }
    }

    resetPuzzle(): void {
        this.puzzleInputCode.length = 0;
        this.puzzlePieceResetTicker = 0;
        this.puzzleResetTicker = 0;

        for (const piece of this.childObjects) {
            if (
                piece.__type === ObjectType.Obstacle
                && piece.isButton
                && piece.puzzlePiece
            ) {
                piece.button.canUse = !this.puzzleSolved;
                piece.button.onOff = false;
                piece.button.seq++;
                piece.setDirty();
            }
        }
        this.setPartDirty();
    }
}
