import { type AABB, coldet } from "./coldet";
import { collider } from "./collider";
import { math } from "./math";
import { Spline } from "./spline";
import { type Vec2, v2 } from "./v2";

export class River {
    spline: Spline;
    waterWidth: number;
    shoreWidth: number;
    looped: boolean;
    center: Vec2;
    waterPoly: Vec2[];
    shorePoly: Vec2[];
    waterWidths: number[];
    shoreWidths: number[];
    aabb: AABB;

    constructor(
        splinePts: Vec2[],
        riverWidth: number,
        looped: boolean,
        otherRivers: River[],
        mapBounds: AABB,
    ) {
        this.spline = new Spline(splinePts, looped);
        this.waterWidth = riverWidth;
        this.shoreWidth = math.clamp(riverWidth * 0.75, 4.0, 8.0);
        this.looped = looped;

        // Compute center (useful for map generation referencing looped rivers)
        this.center = v2.create(0.0, 0.0);
        for (let i = 0; i < this.spline.points.length; i++) {
            this.center = v2.add(this.center, this.spline.points[i]);
        }
        this.center = v2.div(this.center, this.spline.points.length);

        // Lake island smoothing needs the average point distance to the center island
        let avgDistToCenter = 0.0;
        for (let _i = 0; _i < this.spline.points.length; _i++) {
            const dist = v2.length(v2.sub(this.spline.points[_i], this.center));
            avgDistToCenter += dist;
        }
        avgDistToCenter /= this.spline.points.length;

        const mapExtent = v2.mul(v2.sub(mapBounds.max, mapBounds.min), 0.5);
        const mapCenter = v2.add(mapBounds.min, mapExtent);

        // Generate polygons from the spline
        this.waterPoly = [];
        this.shorePoly = [];
        this.waterWidths = [];
        this.shoreWidths = [];
        for (let i = 0; i < splinePts.length; i++) {
            const vert = splinePts[i];
            let norm = this.spline.getNormal(i / (splinePts.length - 1));

            // If the endpoints are near the map boundary, adjust the
            // normal to be parallel to the map aabb at that point.
            // This gives the river polygon flat ends flush with the map bounds.
            let nearMapEdge = false;
            if (!this.looped && (i === 0 || i === splinePts.length - 1)) {
                const e = v2.sub(vert, mapCenter);
                let edgePos = v2.create(0.0, 0.0);
                let edgeNorm = v2.create(1.0, 0.0);
                if (Math.abs(e.x) > Math.abs(e.y)) {
                    edgePos = v2.create(
                        e.x > 0.0 ? mapBounds.max.x : mapBounds.min.x,
                        vert.y,
                    );
                    edgeNorm = v2.create(e.x > 0.0 ? 1.0 : -1.0, 0.0);
                } else {
                    edgePos = v2.create(
                        vert.x,
                        e.y > 0.0 ? mapBounds.max.y : mapBounds.min.y,
                    );
                    edgeNorm = v2.create(0.0, e.y > 0.0 ? 1.0 : -1.0);
                }
                if (v2.lengthSqr(v2.sub(edgePos, vert)) < 1.0) {
                    let perpNorm = v2.perp(edgeNorm);
                    if (v2.dot(norm, perpNorm) < 0.0) {
                        perpNorm = v2.neg(perpNorm);
                    }
                    norm = perpNorm;
                    nearMapEdge = true;
                }
            }

            let { waterWidth } = this;
            // Widen river near the endpoints
            if (!this.looped) {
                const len = splinePts.length;
                const end = 2.0 * (Math.max(1.0 - i / len, i / len) - 0.5);
                waterWidth = (1.0 + end ** 3.0 * 1.5) * this.waterWidth;
            }
            this.waterWidths.push(waterWidth);

            // Increase shoreWidth to match that of larger nearby rivers.
            // Also determine if we terminate within another river. If so,
            // we need to constain our ending water and shore points to be
            // within that rivers polygons.
            //
            // There's a bug with clipRayToPoly when this happens at the
            // map edges; avoid that with a explicit check for now.
            let { shoreWidth } = this;
            let boundingRiver: River | null = null;
            for (let j = 0; j < otherRivers.length; j++) {
                const river = otherRivers[j];
                const t = river.spline.getClosestTtoPoint(vert);
                const p = river.spline.getPos(t);
                const _len = v2.length(v2.sub(p, vert));
                if (_len < river.waterWidth * 2.0) {
                    shoreWidth = math.max(shoreWidth, river.shoreWidth);
                }
                if (
                    (i === 0 || i === splinePts.length - 1) &&
                    _len < 1.5 &&
                    !nearMapEdge
                ) {
                    boundingRiver = river;
                }
            }
            if (i > 0) {
                shoreWidth = (this.shoreWidths[i - 1] + shoreWidth) / 2.0;
            }
            this.shoreWidths.push(shoreWidth);
            shoreWidth += waterWidth;

            // Poly verts
            const clipRayToPoly = function clipRayToPoly(
                pt: Vec2,
                dir: Vec2,
                poly: Vec2[],
            ) {
                const end = v2.add(pt, dir);
                if (!math.pointInsidePolygon(end, poly)) {
                    const _t = math.rayPolygonIntersect(pt, dir, poly);
                    if (_t) {
                        return v2.mul(dir, _t);
                    }
                }
                return dir;
            };

            let waterPtA: Vec2;
            let waterPtB: Vec2;
            let shorePtA: Vec2;
            let shorePtB: Vec2;

            if (this.looped) {
                let toVert = v2.sub(vert, this.center);
                const _dist = v2.length(toVert);
                toVert = _dist > 0.0001 ? v2.div(toVert, _dist) : v2.create(1.0, 0.0);

                const interiorWaterWidth = math.lerp(
                    math.min(waterWidth / avgDistToCenter, 1.0) ** 0.5,
                    waterWidth,
                    (1.0 - (avgDistToCenter - waterWidth) / _dist) * _dist,
                );
                const interiorShoreWidth = math.lerp(
                    math.min(shoreWidth / avgDistToCenter, 1.0) ** 0.5,
                    shoreWidth,
                    (1.0 - (avgDistToCenter - shoreWidth) / _dist) * _dist,
                );

                waterPtA = v2.add(vert, v2.mul(toVert, waterWidth));
                waterPtB = v2.add(vert, v2.mul(toVert, -interiorWaterWidth));
                shorePtA = v2.add(vert, v2.mul(toVert, shoreWidth));
                shorePtB = v2.add(vert, v2.mul(toVert, -interiorShoreWidth));
            } else {
                let waterRayA = v2.mul(norm, waterWidth);
                let waterRayB = v2.mul(norm, -waterWidth);
                let shoreRayA = v2.mul(norm, shoreWidth);
                let shoreRayB = v2.mul(norm, -shoreWidth);

                if (boundingRiver) {
                    waterRayA = clipRayToPoly(vert, waterRayA, boundingRiver.waterPoly);
                    waterRayB = clipRayToPoly(vert, waterRayB, boundingRiver.waterPoly);
                    shoreRayA = clipRayToPoly(vert, shoreRayA, boundingRiver.shorePoly);
                    shoreRayB = clipRayToPoly(vert, shoreRayB, boundingRiver.shorePoly);
                }

                waterPtA = v2.add(vert, waterRayA);
                waterPtB = v2.add(vert, waterRayB);
                shorePtA = v2.add(vert, shoreRayA);
                shorePtB = v2.add(vert, shoreRayB);
            }

            waterPtA = coldet.clampPosToAabb(waterPtA, mapBounds);
            waterPtB = coldet.clampPosToAabb(waterPtB, mapBounds);
            shorePtA = coldet.clampPosToAabb(shorePtA, mapBounds);
            shorePtB = coldet.clampPosToAabb(shorePtB, mapBounds);

            this.waterPoly.splice(i, 0, waterPtA);
            this.waterPoly.splice(this.waterPoly.length - i, 0, waterPtB);
            this.shorePoly.splice(i, 0, shorePtA);
            this.shorePoly.splice(this.shorePoly.length - i, 0, shorePtB);
        }

        // Compute aabb
        let aabbMin = v2.create(Number.MAX_VALUE, Number.MAX_VALUE);
        let aabbMax = v2.create(-Number.MAX_VALUE, -Number.MAX_VALUE);
        for (let i = 0; i < this.shorePoly.length; i++) {
            aabbMin = v2.minElems(aabbMin, this.shorePoly[i]);
            aabbMax = v2.maxElems(aabbMax, this.shorePoly[i]);
        }
        this.aabb = collider.createAabb(aabbMin, aabbMax);
    }

    distanceToShore(pos: Vec2) {
        const t = this.spline.getClosestTtoPoint(pos);
        const dist = v2.length(v2.sub(pos, this.spline.getPos(t)));
        return math.max(this.waterWidth - dist, 0.0);
    }

    getWaterWidth(t: number) {
        const count = this.spline.points.length;
        const idx = math.clamp(Math.floor(t * count), 0, count);
        return this.waterWidths[idx];
    }
}
