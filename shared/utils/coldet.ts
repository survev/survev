import { collider } from "./collider";
import { math } from "./math";
import { type Vec2, v2 } from "./v2";

export interface Circle {
    type: 0;
    pos: Vec2;
    rad: number;
}

export interface AABB {
    type: 1;
    min: Vec2;
    max: Vec2;
}

export type Collider = Circle | AABB;

export const coldet = {
    circleToAabb(pos: Vec2, rad: number): AABB {
        const extent = v2.create(rad);
        return {
            type: 1,
            min: v2.sub(pos, extent),
            max: v2.add(pos, extent),
        };
    },

    aabbToCircle(min: Vec2, max: Vec2): Circle {
        const e = v2.mul(v2.sub(max, min), 0.5);
        const c = v2.add(min, e);
        return {
            type: 0,
            pos: c,
            rad: v2.length(e),
        };
    },

    lineSegmentToAabb(a: Vec2, b: Vec2) {
        return {
            type: collider.Type.Aabb,
            min: v2.create(a.x < b.x ? a.x : b.x, a.y < b.y ? a.y : b.y),
            max: v2.create(a.x > b.x ? a.x : b.x, a.y > b.y ? a.y : b.y),
        };
    },

    boundingAabb(aabbs: AABB[]) {
        const min = v2.create(Number.MAX_VALUE, Number.MAX_VALUE);
        const max = v2.create(-Number.MAX_VALUE, -Number.MAX_VALUE);
        for (let i = 0; i < aabbs.length; i++) {
            const x = aabbs[i];
            min.x = math.min(min.x, x.min.x);
            min.y = math.min(min.y, x.min.y);
            max.x = math.max(max.x, x.max.x);
            max.y = math.max(max.y, x.max.y);
        }
        return { min, max };
    },

    /**
     * splits ALONG axis not on the axis, (0, 1) is y axis so aabb will be split into top and bottom half
     */
    splitAabb(aabb: { min: Vec2; max: Vec2 }, axis: Vec2) {
        // Split aabb along centerpoint into two child aabbs.
        // This could be generalized into split-along-plane
        const e = v2.mul(v2.sub(aabb.max, aabb.min), 0.5);
        const c = v2.add(aabb.min, e);
        const left = { min: v2.copy(aabb.min), max: v2.copy(aabb.max) };
        const right = { min: v2.copy(aabb.min), max: v2.copy(aabb.max) };
        if (Math.abs(axis.y) > Math.abs(axis.x)) {
            left.max = v2.create(aabb.max.x, c.y);
            right.min = v2.create(aabb.min.x, c.y);
        } else {
            left.max = v2.create(c.x, aabb.max.y);
            right.min = v2.create(c.x, aabb.min.y);
        }
        // Return aabbs ordered [toward axis, away from axis]
        const dir = v2.sub(aabb.max, aabb.min);
        return v2.dot(dir, axis) > 0.0 ? [right, left] : [left, right];
    },

    /**
     * similar to splitAabb(), but different in a few ways:
     *
     * divides aabb evenly into n number of sections
     *
     * does NOT care about sign of axis, will always return the sections from closest to origin to farthest to origin
     */
    divideAabb(aabb: { min: Vec2; max: Vec2 }, axis: Vec2, nDivisions: number) {
        const length = v2.sub(aabb.max, aabb.min);
        const segmentLength = v2.mul(length, 1 / nDivisions);

        const sections: { min: Vec2; max: Vec2 }[] = [];
        for (let i = 0; i < nDivisions; i++) {
            const section = { min: v2.copy(aabb.min), max: v2.copy(aabb.max) };

            if (Math.abs(axis.y) > Math.abs(axis.x)) {
                section.min = v2.create(aabb.min.x, aabb.min.y + segmentLength.y * i);
                section.max = v2.create(
                    aabb.max.x,
                    aabb.min.y + segmentLength.y * (i + 1),
                );
            } else {
                section.min = v2.create(aabb.min.x + segmentLength.x * i, aabb.min.y);
                section.max = v2.create(
                    aabb.min.x + segmentLength.x * (i + 1),
                    aabb.max.y,
                );
            }

            sections.push(section);
        }

        return sections;
    },

    scaleAabbAlongAxis(aabb: AABB, axis: Vec2, scale: number) {
        const e = v2.mul(v2.sub(aabb.max, aabb.min), 0.5);
        const c = v2.add(aabb.min, e);
        const y = Math.abs(axis.y) > Math.abs(axis.x);
        return {
            min: v2.create(
                y ? aabb.min.x : c.x - e.x * scale,
                y ? c.y - e.y * scale : aabb.min.y,
            ),
            max: v2.create(
                y ? aabb.max.x : c.x + e.x * scale,
                y ? c.y + e.y * scale : aabb.max.y,
            ),
        };
    },

    clampPosToAabb(pos: Vec2, aabb: AABB) {
        return v2.minElems(v2.maxElems(pos, aabb.min), aabb.max);
    },

    clampPolygonToAabb(poly: Vec2[], aabb: AABB) {
        const newPoly: Vec2[] = [];
        for (let i = 0; i < poly.length; i++) {
            newPoly.push(coldet.clampPosToAabb(poly[i], aabb));
        }
        return newPoly;
    },

    testPointAabb(pos: Vec2, min: Vec2, max: Vec2) {
        return pos.x >= min.x && pos.y >= min.y && pos.x <= max.x && pos.y <= max.y;
    },

    testCircleAabb(pos: Vec2, rad: number, min: Vec2, max: Vec2) {
        const cpt = v2.create(
            math.clamp(pos.x, min.x, max.x),
            math.clamp(pos.y, min.y, max.y),
        );
        const dstSqr = v2.lengthSqr(v2.sub(pos, cpt));
        return (
            dstSqr < rad * rad ||
            (pos.x >= min.x && pos.x <= max.x && pos.y >= min.y && pos.y <= max.y)
        );
    },

    testCircleCircle(pos0: Vec2, rad0: number, pos1: Vec2, rad1: number) {
        const rad = rad0 + rad1;
        return v2.lengthSqr(v2.sub(pos1, pos0)) < rad * rad;
    },

    testAabbAabb(min0: Vec2, max0: Vec2, min1: Vec2, max1: Vec2) {
        return min0.x < max1.x && min0.y < max1.y && min1.x < max0.x && min1.y < max0.y;
    },

    testAabbPolygon(min: Vec2, max: Vec2, poly: Vec2[]) {
        for (let i = 0; i < poly.length; i++) {
            const a = poly[i];
            const b = i === poly.length - 1 ? poly[0] : poly[i + 1];
            if (coldet.intersectSegmentAabb(a, b, min, max)) {
                return true;
            }
        }
        return false;
    },

    test(coll1: Collider, coll2: Collider): boolean {
        if (coll1.type === 0) {
            if (coll2.type === 0) {
                return coldet.testCircleCircle(
                    coll1.pos,
                    coll1.rad,
                    coll2.pos,
                    coll2.rad,
                );
            }
            return coldet.testCircleAabb(coll1.pos, coll1.rad, coll2.min, coll2.max);
        }
        if (coll2.type === 0) {
            return coldet.testCircleAabb(coll2.pos, coll2.rad, coll1.min, coll1.max);
        }
        return coldet.testAabbAabb(coll1.min, coll1.max, coll2.min, coll2.max);
    },

    aabbInsideAabb(min0: Vec2, max0: Vec2, min1: Vec2, max1: Vec2) {
        return (
            min0.x >= min1.x && min0.y >= min1.y && max0.x <= max1.x && max0.y <= max1.y
        );
    },

    signedAreaTri(a: Vec2, b: Vec2, c: Vec2) {
        return (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
    },

    intersectSegmentSegment(a0: Vec2, a1: Vec2, b0: Vec2, b1: Vec2) {
        const x1 = coldet.signedAreaTri(a0, a1, b1);
        const x2 = coldet.signedAreaTri(a0, a1, b0);
        if (x1 !== 0.0 && x2 !== 0.0 && x1 * x2 < 0.0) {
            const x3 = coldet.signedAreaTri(b0, b1, a0);
            const x4 = x3 + x2 - x1;
            if (x3 * x4 < 0.0) {
                const t = x3 / (x3 - x4);
                return {
                    point: v2.add(a0, v2.mul(v2.sub(a1, a0), t)),
                };
            }
        }
        return null;
    },

    intersectSegmentCircle(s0: Vec2, s1: Vec2, pos: Vec2, rad: number) {
        let d = v2.sub(s1, s0);
        const len = math.max(v2.length(d), 0.000001);
        d = v2.div(d, len);
        const m = v2.sub(s0, pos);
        const b = v2.dot(m, d);
        const c = v2.dot(m, m) - rad * rad;
        if (c > 0.0 && b > 0.0) {
            return null;
        }
        const discSq = b * b - c;
        if (discSq < 0.0) {
            return null;
        }
        const disc = Math.sqrt(discSq);
        let t = -b - disc;
        if (t < 0.0) {
            t = -b + disc;
        }
        if (t <= len) {
            const point = v2.add(s0, v2.mul(d, t));
            return {
                point,
                normal: v2.normalize(v2.sub(point, pos)),
            };
        }
        return null;
    },

    intersectSegmentAabb(s0: Vec2, s1: Vec2, min: Vec2, max: Vec2) {
        let tmin = 0;
        let tmax = Number.MAX_VALUE;
        const eps = 0.00001;
        const r = s0;
        let d = v2.sub(s1, s0);
        const dist = v2.length(d);
        d = dist > eps ? v2.div(d, dist) : v2.create(1.0, 0.0);

        let absDx = Math.abs(d.x);
        let absDy = Math.abs(d.y);

        // @HACK: fix this function
        if (absDx < eps) {
            d.x = eps * 2.0;
            absDx = d.x;
        }
        if (absDy < eps) {
            d.y = eps * 2.0;
            absDy = d.y;
        }

        if (absDx > eps) {
            const tx1 = (min.x - r.x) / d.x;
            const tx2 = (max.x - r.x) / d.x;
            tmin = math.max(tmin, math.min(tx1, tx2));
            tmax = math.min(tmax, math.max(tx1, tx2));
            if (tmin > tmax) {
                return null;
            }
        }
        if (absDy > eps) {
            const ty1 = (min.y - r.y) / d.y;
            const ty2 = (max.y - r.y) / d.y;
            tmin = math.max(tmin, math.min(ty1, ty2));
            tmax = math.min(tmax, math.max(ty1, ty2));
            if (tmin > tmax) {
                return null;
            }
        }
        if (tmin > dist) {
            return null;
        }
        // Hit
        const p = v2.add(s0, v2.mul(d, tmin));
        // Intersection normal
        const c = v2.add(min, v2.mul(v2.sub(max, min), 0.5));
        const p0 = v2.sub(p, c);
        const d0 = v2.mul(v2.sub(min, max), 0.5);

        const x = (p0.x / Math.abs(d0.x)) * 1.001;
        const y = (p0.y / Math.abs(d0.y)) * 1.001;
        const n = v2.normalizeSafe(
            v2.create(
                x < 0.0 ? Math.ceil(x) : Math.floor(x),
                y < 0.0 ? Math.ceil(y) : Math.floor(y),
            ),
            v2.create(1.0, 0.0),
        );
        return {
            point: p,
            normal: n,
        };
    },

    intersectSegmentAabb2(s0: Vec2, s1: Vec2, min: Vec2, max: Vec2) {
        // Returns proper intersection point if the segment
        // begins inside of the aabb
        const segments = [
            { a: v2.create(min.x, min.y), b: v2.create(max.x, min.y) },
            { a: v2.create(max.x, min.y), b: v2.create(max.x, max.y) },
            { a: v2.create(max.x, max.y), b: v2.create(min.x, max.y) },
            { a: v2.create(min.x, max.y), b: v2.create(min.x, min.y) },
        ];
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const res = coldet.intersectSegmentSegment(s0, s1, seg.a, seg.b);
            if (res) {
                return res;
            }
        }
        return null;
    },

    intersectRayAabb(o: Vec2, d: Vec2, min: Vec2, max: Vec2) {
        const eps = 0.00001;
        if (Math.abs(d.x) < eps) {
            d.x = eps * 2.0;
        }
        if (Math.abs(d.y) < eps) {
            d.y = eps * 2.0;
        }
        const tmin = v2.divElems(v2.sub(min, o), d);
        const tmax = v2.divElems(v2.sub(max, o), d);
        const rmin = v2.minElems(tmin, tmax);
        const rmax = v2.maxElems(tmin, tmax);
        const minmax = math.min(rmax.x, rmax.y);
        const maxmin = math.max(rmin.x, rmin.y);
        return minmax >= maxmin ? v2.add(o, v2.mul(d, minmax)) : null;
    },

    intersectCircleCircle(pos0: Vec2, rad0: number, pos1: Vec2, rad1: number) {
        const r = rad0 + rad1;
        const toP1 = v2.sub(pos1, pos0);
        const distSqr = v2.lengthSqr(toP1);
        if (distSqr < r * r) {
            const dist = Math.sqrt(distSqr);
            return {
                dir: dist > 0.00001 ? v2.div(toP1, dist) : v2.create(1.0, 0.0),
                pen: r - dist,
            };
        }
        return null;
    },

    intersectAabbCircle(min: Vec2, max: Vec2, pos: Vec2, rad: number) {
        if (pos.x >= min.x && pos.x <= max.x && pos.y >= min.y && pos.y <= max.y) {
            const e = v2.mul(v2.sub(max, min), 0.5);
            const c = v2.add(min, e);
            const p = v2.sub(pos, c);
            const xp = Math.abs(p.x) - e.x - rad;
            const yp = Math.abs(p.y) - e.y - rad;
            if (xp > yp) {
                return {
                    dir: v2.create(p.x > 0.0 ? 1.0 : -1.0, 0.0),
                    pen: -xp,
                };
            }
            return {
                dir: v2.create(0.0, p.y > 0.0 ? 1.0 : -1.0),
                pen: -yp,
            };
        }
        const cpt = v2.create(
            math.clamp(pos.x, min.x, max.x),
            math.clamp(pos.y, min.y, max.y),
        );
        const dir = v2.sub(pos, cpt);

        const dstSqr = v2.lengthSqr(dir);
        if (dstSqr < rad * rad) {
            const dst = Math.sqrt(dstSqr);
            return {
                dir: dst > 0.0001 ? v2.div(dir, dst) : v2.create(1.0, 0.0),
                pen: rad - dst,
            };
        }

        return null;
    },

    intersectAabbAabb(min0: Vec2, max0: Vec2, min1: Vec2, max1: Vec2) {
        const e0 = v2.mul(v2.sub(max0, min0), 0.5);
        const c0 = v2.add(min0, e0);
        const e1 = v2.mul(v2.sub(max1, min1), 0.5);
        const c1 = v2.add(min1, e1);
        const n = v2.sub(c1, c0);
        const xo = e0.x + e1.x - Math.abs(n.x);
        if (xo > 0.0) {
            const yo = e0.y + e1.y - Math.abs(n.y);
            if (yo > 0.0) {
                if (xo > yo) {
                    return {
                        dir: n.x < 0.0 ? v2.create(-1.0, 0.0) : v2.create(1.0, 0.0),
                        pen: xo,
                    };
                }
                return {
                    dir: n.y < 0.0 ? v2.create(0.0, -1.0) : v2.create(0.0, 1.0),
                    pen: yo,
                };
            }
        }
        return null;
    },
};
