import type { BuildingDef } from "../defs/mapObjects/buildings/buildingDefs.ts";
import type { StructureDef } from "../defs/mapObjects/structureDefs.ts";
import { MapObjectDefs } from "../defs/register.ts";
import { type AABB, coldet, type Collider } from "./coldet.ts";
import { collider } from "./collider.ts";
import { math } from "./math.ts";
import { assert, util } from "./util.ts";
import { v2, type Vec2 } from "./v2.ts";

// Memoize computed object colliders
const cachedColliders: Record<string, Collider> = {};

function computeBoundingCollider(type: string): Collider {
    const def = MapObjectDefs.typeToDef(type);
    if (def.type === "structure") {
        const aabbs: AABB[] = [];
        for (let i = 0; i < def.layers.length; i++) {
            const obj = def.layers[i];
            const rot = math.oriToRad(obj.ori);
            const col = collider.transform(
                mapHelpers.getBoundingCollider(obj.type),
                obj.pos,
                rot,
                1.0,
            );
            aabbs.push(collider.toAabb(col));
        }
        for (let i = 0; i < def.stairs.length; i++) {
            aabbs.push(def.stairs[i].collision);
        }
        const aabb = coldet.boundingAabb(aabbs);
        // Expand structure aabb a small amount. This fixes an issue where
        // moving loot scanning for nearby structures may exit a stairwell
        // and no longer detect the nearby structure, thereby not switching
        // layers back to the ground layer.
        const margin = v2.create(1.0, 1.0);
        aabb.min = v2.sub(aabb.min, margin);
        aabb.max = v2.add(aabb.max, margin);
        return collider.createAabb(aabb.min, aabb.max);
    }
    if (def.type === "building") {
        const aabbs: AABB[] = [];
        for (let i = 0; i < def.floor.surfaces.length; i++) {
            const collisions = def.floor.surfaces[i].collision;
            for (let j = 0; j < collisions.length; j++) {
                aabbs.push(collisions[j]);
            }
        }
        for (let i = 0; i < def.ceiling.zoomRegions.length; i++) {
            const region = def.ceiling.zoomRegions[i];
            if (region.zoomIn) {
                aabbs.push(region.zoomIn);
            }
            if (region.zoomOut) {
                aabbs.push(region.zoomOut);
            }
        }
        // Map objects
        for (let i = 0; i < def.mapObjects.length; i++) {
            const mapObj = def.mapObjects[i];
            let mt = mapObj.type!;
            if (typeof mt === "object") {
                mt = util.weightedRandomObject(mt);
            }
            if (mt !== "") {
                const rot = math.oriToRad(mapObj.ori);
                const col = collider.transform(
                    mapHelpers.getBoundingCollider(mt),
                    mapObj.pos,
                    rot,
                    mapObj.scale,
                );
                aabbs.push(collider.toAabb(col));
            }
        }
        const aabb = coldet.boundingAabb(aabbs);
        return collider.createAabb(aabb.min, aabb.max);
    }
    if (def.type === "decal") {
        return collider.toAabb(def.collision);
    }
    if (def.type === "loot_spawner") {
        return collider.createCircle(v2.create(0.0, 0.0), 3.0);
    }
    assert(def.collision !== undefined);
    return def.collision;
}

//
// MapHelpers
//
export const mapHelpers = {
    getBoundingCollider(type: string): Collider {
        if (cachedColliders[type]) {
            return cachedColliders[type];
        }
        const col = computeBoundingCollider(type);
        cachedColliders[type] = col;
        return col;
    },

    /**
     * Ceiling reveal parameters for a building, filled in with the defaults.
     * Shared so the server's occlusion checks reveal ceilings exactly like the client does.
     */
    getCeilingVision(type: string) {
        const def = MapObjectDefs.typeToDef(type, "building");
        return Object.assign(
            {
                dist: 5.5,
                width: 2.75,
                linger: 0,
                fadeRate: 12,
            },
            def.ceiling.vision,
        );
    },

    /**
     * World space bounds of each layer of a structure, and whether that layer is underground.
     * The client renderer uses these to decide if the ground layer is drawn,
     * the server uses them to decide if ground layer objects need to be sent.
     */
    getStructureLayers(type: string, pos: Vec2, ori: number) {
        const def = MapObjectDefs.typeToDef(type, "structure");
        return def.layers.map((layer, i) => {
            const inheritOri = layer.inheritOri === undefined || layer.inheritOri;
            return {
                collision: collider.transform(
                    mapHelpers.getBoundingCollider(layer.type),
                    v2.add(pos, layer.pos),
                    math.oriToRad(inheritOri ? ori + layer.ori : layer.ori),
                    1,
                ),
                underground: layer.underground !== undefined ? layer.underground : i == 1,
            };
        });
    },

    getBridgeDims(type: string) {
        const col = mapHelpers.getBoundingCollider(type);
        const aabb = collider.toAabb(col);
        const e = v2.mul(v2.sub(aabb.max, aabb.min), 0.5);
        const x = e.x > e.y;
        const dir = v2.create(x ? 1.0 : 0.0, x ? 0.0 : 1.0);
        const length = v2.dot(dir, e) * 2.0;
        const width = v2.dot(v2.perp(dir), e) * 2.0;
        return { length, width };
    },

    getBridgeOverlapCollider(type: string, pos: Vec2, rot: number, scale: number) {
        // Returns an expanded collider perpendicular to the bridge.
        // This determines how closely bridges can spawn to one another on a river.
        const def = MapObjectDefs.typeToDef(type) as BuildingDef | StructureDef;
        const dims = mapHelpers.getBridgeDims(type);
        const dir = v2.create(1.0, 0.0);
        const ext = v2.add(
            v2.mul(dir, dims.length * 1.5),
            v2.mul(v2.perp(dir), dims.width * def.terrain.bridge!.nearbyWidthMult),
        );
        const col = collider.createAabbExtents(v2.create(0.0, 0.0), v2.mul(ext, 0.5));
        return collider.transform(col, pos, rot, scale) as AABB;
    },
};
