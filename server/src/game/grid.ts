import type { AABB, Collider } from "../../../shared/utils/coldet";
import { collider } from "../../../shared/utils/collider";
import { math } from "../../../shared/utils/math";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { Loot } from "./objects/loot";

interface GameObject {
    __gridCells: Vec2[];
    __gridQueryId: number;
    bounds: AABB;
    pos: Vec2;
}

/**
 * A Grid to filter collision detection of game objects
 */
export class Grid<T extends GameObject = GameObject> {
    readonly width: number;
    readonly height: number;
    readonly cellSize = 16;

    //                        X     Y     Object
    //                      __^__ __^__   __^__
    private readonly _grid: Array<Array<Set<T>>>;

    private nextQueryId = 1;

    constructor(width: number, height: number) {
        this.width = Math.floor(width / this.cellSize);
        this.height = Math.floor(height / this.cellSize);

        this._grid = Array.from({ length: this.width + 1 }, () =>
            Array.from({ length: this.height + 1 }, () => new Set()),
        );
    }

    addObject(obj: T): void {
        this.updateObject(obj);
    }

    /**
     * Add an object to the grid system
     */
    updateObject(obj: T): void {
        this.remove(obj);

        const cells = obj.__gridCells;

        const aabb = obj.bounds;
        // Get the bounds of the hitbox
        // Round it to the grid cells
        const min = this._roundToCells(v2.add(aabb.min, obj.pos));
        const max = this._roundToCells(v2.add(aabb.max, obj.pos));

        // Add it to all grid cells that it intersects
        for (let x = min.x; x <= max.x; x++) {
            const xRow = this._grid[x];
            for (let y = min.y; y <= max.y; y++) {
                xRow[y].add(obj);
                cells.push(v2.create(x, y));
            }
        }
    }

    /**
     * Remove an object from the grid system
     */
    remove(obj: T): void {
        const cells = obj.__gridCells;

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            this._grid[cell.x][cell.y].delete(obj);
        }
        cells.length = 0;
    }

    /**
     * Get all objects near this collider
     * This transforms the collider into a rectangle
     * and gets all objects intersecting it after rounding it to grid cells
     * @param coll The collider
     * @return An array with the objects near this collider
     */
    intersectCollider(coll: Collider): T[] {
        const aabb = collider.toAabb(coll);

        const min = this._roundToCells(aabb.min);
        const max = this._roundToCells(aabb.max);

        const objects: T[] = [];

        const queryId = this.nextQueryId++;

        for (let x = min.x; x <= max.x; x++) {
            const xRow = this._grid[x];
            for (let y = min.y; y <= max.y; y++) {
                const cell = xRow[y];
                for (const object of cell) {
                    if (object.__gridQueryId === queryId) continue;
                    object.__gridQueryId = queryId;
                    objects.push(object);
                }
            }
        }

        return objects;
    }

    /**
     * Get all objects near this game object
     * @param obj The game object. NOTE: it must already be inside the grid
     * @return An array with the objects near this collider
     */
    intersectGameObject(obj: GameObject): T[] {
        const objects: T[] = [];

        const queryId = this.nextQueryId++;

        for (let i = 0; i < obj.__gridCells.length; i++) {
            const pos = obj.__gridCells[i];
            const cell = this._grid[pos.x][pos.y];
            for (const object of cell) {
                if (object.__gridQueryId === queryId) continue;
                if (object === obj) continue;
                object.__gridQueryId = queryId;
                objects.push(object);
            }
        }

        return objects;
    }

    /**
     * Get all objects near this collider
     * This transforms the collider into a rectangle
     * and gets all objects intersecting it after rounding it to grid cells
     * @param coll The collider
     * @return A set with the objects near this collider
     */
    intersectColliderSet(coll: Collider): Set<T> {
        const aabb = collider.toAabb(coll);

        const min = this._roundToCells(aabb.min);
        const max = this._roundToCells(aabb.max);

        const objects = new Set<T>();

        for (let x = min.x; x <= max.x; x++) {
            const xRow = this._grid[x];
            for (let y = min.y; y <= max.y; y++) {
                const cell = xRow[y];
                for (const object of cell) {
                    objects.add(object);
                }
            }
        }

        return objects;
    }

    intersectPos(pos: Vec2) {
        pos = this._roundToCells(pos);
        return [...this._grid[pos.x][pos.y]];
    }

    // in Grid<T> class (grid.ts)
    getAllObjects(): T[] {
        const set = new Set<T>();
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (const obj of this._grid[x][y]) {
                    set.add(obj);
                }
            }
        }
        return [...set];
    }

    intersectLineSegment(lineStart: Vec2, lineEnd: Vec2): T[] {
        const start = this._roundToCells(lineStart);
        const end = this._roundToCells(lineEnd);

        const diff = v2.sub(lineEnd, lineStart);

        const gridDeltaX = lineEnd.x >= lineStart.x ? 1 : -1;
        const gridDeltaY = lineEnd.y >= lineStart.y ? 1 : -1;

        const deltaX =
            Math.abs(diff.x) > 0.00001
                ? (gridDeltaX * this.cellSize) / diff.x
                : Number.MAX_VALUE;
        const deltaY =
            Math.abs(diff.y) > 0.00001
                ? (gridDeltaY * this.cellSize) / diff.y
                : Number.MAX_VALUE;

        const relativeX = math.mod(lineStart.x / this.cellSize, 1);
        const relativeY = math.mod(lineStart.y / this.cellSize, 1);

        let x = deltaX * (gridDeltaX > 0 ? 1 - relativeX : relativeX);
        let y = deltaY * (gridDeltaY > 0 ? 1 - relativeY : relativeY);

        const objects: T[] = [];
        const queryId = this.nextQueryId++;

        while (true) {
            const cell = this._grid[start.x][start.y];

            for (const object of cell) {
                if (object.__gridQueryId === queryId) continue;

                object.__gridQueryId = queryId;
                objects.push(object);
            }
            if (start.x == end.x && start.y == end.y) {
                break;
            }
            if (x < y) {
                x += deltaX;
                start.x += gridDeltaX;
                if (start.x < 0 || start.x >= this.width) {
                    break;
                }
            } else {
                y += deltaY;
                start.y += gridDeltaY;
                if (start.y < 0 || start.y >= this.height) {
                    break;
                }
            }
        }

        return objects;
    }

    /**
     * Rounds a position to this grid cells
     */
    private _roundToCells(vector: Vec2): Vec2 {
        return {
            x: math.clamp(Math.floor(vector.x / this.cellSize), 0, this.width),
            y: math.clamp(Math.floor(vector.y / this.cellSize), 0, this.height),
        };
    }
}

/**
 * Hash grid optimized for loot to loot collision.
 * @link https://github.com/reu/broadphase.js/blob/master/src/hash-grid.js
 *
 * Implements the space partitioning algorithim for better performance.
 * @see http://en.wikipedia.org/wiki/Space_partitioning
 */
export class HashGrid<T extends Loot = Loot> {
    width: number;
    height: number;

    cellSize: number;

    rows: number;
    cols: number;
    grid: Array<Array<Array<T>>>;

    constructor(width: number, height: number, cellSize: number) {
        this.width = width;
        this.height = height;

        this.cellSize = cellSize;

        this.rows = Math.ceil(this.height / this.cellSize);
        this.cols = Math.ceil(this.width / this.cellSize);

        this.grid = [];
    }

    /**
     * Cleans the partitioning grid.
     */
    private _resetGrid() {
        for (let y = 0; y < this.rows; y++) {
            if (!this.grid[y]) continue;
            this.grid[y].length = 0;
        }
    }

    /**
     * Checks for collision using spatial grid hashing.
     *
     * @param loots thie list of particles to check collisions.
     * @param comparator the function that, given two objects, return if they are colliding or not.
     * @param resolver the collision resolver which will receive each collision pair occurrence.
     */
    check(
        loots: T[],
        comparator: (a: T, b: T) => boolean,
        resolver: (a: T, b: T) => void,
    ) {
        const length = loots.length;

        this._resetGrid();

        for (let i = 0; i < length; i++) {
            const loot = loots[i];
            if (loot.destroyed) continue;

            const xMin = ((loot.pos.x - loot.lootRad) / this.cellSize) << 0;
            const xMax = ((loot.pos.x + loot.lootRad) / this.cellSize) << 0;
            const yMin = ((loot.pos.y - loot.lootRad) / this.cellSize) << 0;
            const yMax = ((loot.pos.y + loot.lootRad) / this.cellSize) << 0;

            for (let y = yMin; y <= yMax; y++) {
                let row = this.grid[y];
                if (!row) row = this.grid[y] = [];

                for (let x = xMin; x <= xMax; x++) {
                    let col = row[x];
                    if (!col) col = this.grid[y][x] = [];
                    col.push(loot);
                }
            }
        }

        for (let y = 0; y < this.rows; y++) {
            let row = this.grid[y];
            if (!row) continue;

            for (let x = 0; x < this.cols; x++) {
                let col = row[x];
                if (!col) continue;

                this.bruteForceCheck(col, comparator, resolver);
            }
        }
    }

    /**
     * The most basic implementation of collision detection, although it is suitable for lots of cases,
     * specially if your system has few particles (< 100).
     *
     * @param loots thie list of particles to check collisions.
     * @param comparator the function that, given two objects, return if they are colliding or not.
     * @param resolver the collision resolver which will receive each collision pair occurrence.
     */
    bruteForceCheck(
        loots: T[],
        comparator: (a: T, b: T) => boolean,
        resolver: (a: T, b: T) => void,
    ) {
        const length = loots.length;

        if (length < 2) return;

        for (let i = 0; i < length; i++) {
            const p1 = loots[i];

            for (let j = i + 1; j < length; j++) {
                const p2 = loots[j];

                if (comparator(p1, p2)) {
                    resolver(p1, p2);
                }
            }
        }
    }
}
