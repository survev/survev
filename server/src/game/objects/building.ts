import { MapObjectDefs } from "../../../../shared/defs/mapObjectDefs";
import type {
    BuildingDef,
    ObstacleDef,
    StructureDef,
} from "../../../../shared/defs/mapObjectsTyping";
import { Puzzles } from "../../../../shared/defs/puzzles";
import { ObjectType } from "../../../../shared/net/objectSerializeFns";
import { type AABB, type Collider, coldet } from "../../../../shared/utils/coldet";
import { collider } from "../../../../shared/utils/collider";
import { mapHelpers } from "../../../../shared/utils/mapHelpers";
import { math } from "../../../../shared/utils/math";
import { type Vec2, v2 } from "../../../../shared/utils/v2";
import type { Game } from "../game";
import type { Decal } from "./decal";
import { BaseGameObject } from "./gameObject";
import type { Obstacle } from "./obstacle";
import type { Structure } from "./structure";

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
    puzzleOrder: string[] = [];
    puzzleResetTimeout?: NodeJS.Timeout;

    scale = 1;

    childObjects: Array<Obstacle | Building | Structure | Decal> = [];
    parentStructure?: Structure;

    surfaces: Array<{
        type: string;
        colliders: Collider[];
    }> = [];

    zoomRegions: Array<{
        zoomIn?: AABB;
        zoomOut?: AABB;
        zoom?: number;
    }> = [];

    healRegions?: Array<{
        collision: AABB;
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
        parentStructureId?: number,
    ) {
        super(game, pos);
        this.layer = layer;
        this.ori = ori;
        this.type = type;

        const parentStructure = this.game.objectRegister.getById(parentStructureId ?? 0);
        if (parentStructure?.__type === ObjectType.Structure) {
            this.parentStructure = parentStructure;
        }
        const def = MapObjectDefs[this.type] as BuildingDef;

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
                ) as AABB,
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
            });
        }

        this.hasOccupiedEmitters =
            !!def.occupiedEmitters && def.occupiedEmitters.length > 0;
        const emitterBounds = coldet.boundingAabb(zoomInBounds);
        this.emitterBounds = collider.createAabb(emitterBounds.min, emitterBounds.max);

        if (def.puzzle) {
            this.hasPuzzle = true;
        }
    }

    obstacleDestroyed(obstacle: Obstacle): void {
        const def = MapObjectDefs[obstacle.type] as ObstacleDef;

        if (def.damageCeiling) {
            this.ceilingDamaged = true;
            this.setPartDirty();
        }

        if (def.disableBuildingOccupied) {
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
        if (this.puzzleResetTimeout) clearTimeout(this.puzzleResetTimeout);

        this.puzzleOrder.push(piece.puzzlePiece!);

        const puzzleDef = (MapObjectDefs[this.type] as BuildingDef).puzzle!;

        let puzzleName = puzzleDef.name;
        if (this.game.map.woodsMode && puzzleName === "bunker_eye_02") {
            puzzleName = "bunker_eye_02_woods";
        }

        const puzzleOrder = Puzzles[puzzleName];

        if (this.puzzleOrder.join("-") === puzzleOrder.join("-")) {
            for (const obj of this.childObjects) {
                if (
                    obj.__type === ObjectType.Obstacle &&
                    obj.type === puzzleDef.completeUseType
                ) {
                    setTimeout(() => {
                        obj.toggleDoor();
                    }, puzzleDef.completeUseDelay * 1000);
                }
            }
            this.puzzleSolved = true;
            if (this.parentStructure) {
                const def = MapObjectDefs[this.parentStructure.type] as StructureDef;
                if (def.interiorSound?.puzzle === puzzleDef.name) {
                    this.parentStructure.interiorSoundAlt = true;
                    this.parentStructure.setDirty();
                }
            }
            setTimeout(this.resetPuzzle.bind(this), puzzleDef.completeOffDelay * 1000);
            this.setPartDirty();
        } else if (this.puzzleOrder.length >= puzzleOrder.length) {
            this.puzzleErrSeq++;
            this.setPartDirty();
            this.puzzleResetTimeout = setTimeout(
                this.resetPuzzle.bind(this),
                puzzleDef.errorResetDelay * 1000,
            ) as NodeJS.Timeout;
        } else {
            this.puzzleResetTimeout = setTimeout(() => {
                this.puzzleErrSeq++;
                this.setPartDirty();
                setTimeout(
                    this.resetPuzzle.bind(this),
                    puzzleDef.errorResetDelay * 1000,
                    this,
                );
            }, puzzleDef.pieceResetDelay * 1000) as NodeJS.Timeout;
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
        this.puzzleOrder.length = 0;
        for (const piece of this.childObjects) {
            if (
                piece.__type === ObjectType.Obstacle &&
                piece.isButton &&
                piece.puzzlePiece
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
