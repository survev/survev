import { earcut } from "./earcut";
import { assert } from "./util";
import { type Vec2, v2 } from "./v2";

const kEpsilon = 0.000001;

export const math = {
    clamp(a: number, min: number, max: number) {
        return a < max ? (a > min ? a : min) : max;
    },

    v2Clamp(vector: Vec2, minV2: Vec2, maxV2: Vec2) {
        let minX: number;
        let minY: number;
        let maxX: number;
        let maxY: number;

        if (minV2.x > maxV2.x) {
            minX = maxV2.x;
            maxX = minV2.x;
        } else {
            minX = minV2.x;
            maxX = maxV2.x;
        }

        if (minV2.y > maxV2.y) {
            minY = maxV2.y;
            maxY = minV2.y;
        } else {
            minY = minV2.y;
            maxY = maxV2.y;
        }

        const resX = vector.x < maxX ? (vector.x > minX ? vector.x : minX) : maxX;
        const resY = vector.y < maxY ? (vector.y > minY ? vector.y : minY) : maxY;

        return v2.create(resX, resY);
    },

    min(a: number, b: number) {
        return a < b ? a : b;
    },

    max(a: number, b: number) {
        return a > b ? a : b;
    },

    lerp(t: number, a: number, b: number) {
        return a * (1.0 - t) + b * t;
    },

    delerp(t: number, a: number, b: number) {
        return math.clamp((t - a) / (b - a), 0.0, 1.0);
    },

    v2lerp(t: number, a: Vec2, b: Vec2) {
        return v2.create(math.lerp(t, a.x, b.x), math.lerp(t, a.y, b.y));
    },

    smoothstep(v: number, a: number, b: number) {
        const t = math.clamp((v - a) / (b - a), 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
    },

    easeOutElastic(e: number, t = 0.3) {
        return Math.pow(2, e * -10) * Math.sin(((e - t / 4) * (Math.PI * 2)) / t) + 1;
    },

    easeOutExpo(e: number) {
        if (e === 1) {
            return 1;
        }
        return 1 - Math.pow(2, e * -10);
    },
    easeInExpo(e: number) {
        if (e === 0) {
            return 0;
        }
        return Math.pow(2, (e - 1) * 10);
    },

    easeOutQuart(e: number) {
        return 1 - Math.pow(1 - e, 4);
    },

    remap(v: number, a: number, b: number, x: number, y: number) {
        const t = math.clamp((v - a) / (b - a), 0.0, 1.0);
        return math.lerp(t, x, y);
    },

    eqAbs(a: number, b: number, eps = kEpsilon) {
        return Math.abs(a - b) < eps;
    },

    eqRel(a: number, b: number, eps = kEpsilon) {
        return Math.abs(a - b) <= eps * Math.max(Math.max(1.0, Math.abs(a)), Math.abs(b));
    },

    deg2rad(deg: number) {
        return (deg * Math.PI) / 180.0;
    },

    deg2vec2(deg: number) {
        deg *= Math.PI / 180; // Convert to radians
        return v2.create(Math.cos(deg), Math.sin(deg));
    },

    rad2deg(rad: number) {
        return (rad * 180.0) / Math.PI;
    },

    rad2Direction(rad: number): Vec2 {
        return v2.create(Math.cos(rad), Math.sin(rad));
    },

    rad2degFromDirection(y: number, x: number) {
        const rad = Math.atan2(y, x);
        let angle = (rad * 180) / Math.PI;

        if (angle < 0) {
            angle += 360;
        }
        return angle;
    },

    fract(n: number) {
        return n - Math.floor(n);
    },

    sign(n: number) {
        return n < 0.0 ? -1.0 : 1.0;
    },

    mod(num: number, n: number) {
        return ((num % n) + n) % n;
    },

    fmod(num: number, n: number) {
        return num - Math.floor(num / n) * n;
    },

    angleDiff(a: number, b: number) {
        const d = math.fmod(b - a + Math.PI, Math.PI * 2.0) - Math.PI;
        return d < -Math.PI ? d + Math.PI * 2.0 : d;
    },

    oriToRad(ori: number) {
        return (ori % 4) * 0.5 * Math.PI;
    },

    oriToAngle(ori: number) {
        return ori * (180 / Math.PI);
    },

    radToOri(rad: number) {
        return Math.floor(
            math.fmod(rad + Math.PI * 0.25, Math.PI * 2.0) / (Math.PI * 0.5),
        );
    },

    quantize(f: number, min: number, max: number, bits: number) {
        assert(f >= min && f <= max);
        const range = (1 << bits) - 1;
        const x = math.clamp(f, min, max);
        const t = (x - min) / (max - min);
        const a = t * range + 0.5;
        const b = a < 0.0 ? Math.ceil(a) : Math.floor(a);
        return min + (b / range) * (max - min);
    },

    v2Quantize(
        v: Vec2,
        minX: number,
        minY: number,
        maxX: number,
        maxY: number,
        bits: number,
    ) {
        return v2.create(
            math.quantize(v.x, minX, maxX, bits),
            math.quantize(v.y, minY, maxY, bits),
        );
    },

    // Ray-Line and Ray-Polygon implementations from
    // http://ahamnett.blogspot.com/2012/06/raypolygon-intersections.html
    rayLineIntersect(origin: Vec2, direction: Vec2, lineA: Vec2, lineB: Vec2) {
        const segment = v2.sub(lineB, lineA);
        const segmentPerp = v2.create(segment.y, -segment.x);
        const perpDotDir = v2.dot(direction, segmentPerp);

        // Parallel lines, no intersection
        if (Math.abs(perpDotDir) <= kEpsilon) return undefined;

        const d = v2.sub(lineA, origin);

        // Distance of intersection along ray
        const t = v2.dot(segmentPerp, d) / perpDotDir;

        // Distance of intersection along line
        const s = v2.dot(v2.create(direction.y, -direction.x), d) / perpDotDir;

        // If t is positive and s lies within the line it intersects; returns t
        return t >= 0.0 && s >= 0.0 && s <= 1.0 ? t : undefined;
    },

    rayPolygonIntersect(origin: Vec2, direction: Vec2, vertices: Vec2[]) {
        let t = Number.MAX_VALUE;

        let intersected = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const distance = this.rayLineIntersect(
                origin,
                direction,
                vertices[j],
                vertices[i],
            );
            if (distance !== undefined) {
                if (distance < t) {
                    intersected = true;
                    t = distance;
                }
            }
        }

        // Returns closest intersection
        return intersected ? t : undefined;
    },

    // https://stackoverflow.com/questions/22521982/js-check-if-point-inside-a-polygon
    pointInsidePolygon(point: Vec2, poly: Vec2[]) {
        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        const { x, y } = point;
        let inside = false;
        const count = poly.length;
        for (let i = 0, j = count - 1; i < count; j = i++) {
            const xi = poly[i].x;
            const yi = poly[i].y;
            const xj = poly[j].x;
            const yj = poly[j].y;

            const intersect =
                yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    },

    distToSegmentSq(p: Vec2, a: Vec2, b: Vec2) {
        const ab = v2.sub(b, a);
        const c = v2.dot(v2.sub(p, a), ab) / v2.dot(ab, ab);
        const d = v2.add(a, v2.mul(ab, math.clamp(c, 0.0, 1.0)));
        const e = v2.sub(d, p);
        return v2.dot(e, e);
    },

    distToPolygon(p: Vec2, poly: Vec2[]) {
        let closestDistSq = Number.MAX_VALUE;
        for (let i = 0; i < poly.length; i++) {
            const a = poly[i];
            const b = i === poly.length - 1 ? poly[0] : poly[i + 1];
            const distSq = math.distToSegmentSq(p, a, b);
            if (distSq < closestDistSq) {
                closestDistSq = distSq;
            }
        }
        return Math.sqrt(closestDistSq);
    },

    polygonArea(poly: Vec2[]) {
        // Convert polygon to triangles
        const verts: number[] = [];
        for (let i = 0; i < poly.length; i++) {
            verts.push(poly[i].x);
            verts.push(poly[i].y);
        }
        const idxs = earcut(verts);

        // Compute area of triangles
        let area = 0.0;
        for (let _i = 0; _i < idxs.length; _i += 3) {
            const idx0 = idxs[_i + 0];
            const idx1 = idxs[_i + 1];
            const idx2 = idxs[_i + 2];
            const ax = verts[idx0 * 2 + 0];
            const ay = verts[idx0 * 2 + 1];
            const bx = verts[idx1 * 2 + 0];
            const by = verts[idx1 * 2 + 1];
            const cx = verts[idx2 * 2 + 0];
            const cy = verts[idx2 * 2 + 1];
            area += Math.abs(
                (ax * by + bx * cy + cx * ay - bx * ay - cx * by - ax * cy) * 0.5,
            );
        }
        return area;
    },

    transformSegment(p0: Vec2, p1: Vec2, pos: Vec2, dir: Vec2) {
        const ang = Math.atan2(dir.y, dir.x);
        return {
            p0: v2.add(pos, v2.rotate(p0, ang)),
            p1: v2.add(pos, v2.rotate(p1, ang)),
        };
    },

    // http://paulbourke.net/geometry/pointlineplane/javascript.txt
    lineIntersects(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
        x4: number,
        y4: number,
    ) {
        // Check if none of the lines are of length 0
        if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
            return false;
        }

        const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

        // Lines are parallel
        if (denominator === 0) {
            return false;
        }

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

        // is the intersection along the segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return false;
        }

        // Return a object with the x and y coordinates of the intersection
        const x = x1 + ua * (x2 - x1);
        const y = y1 + ua * (y2 - y1);

        return { x, y };
    },

    // functions not copied from surviv
    addAdjust(pos1: Vec2, pos: Vec2, ori: number): Vec2 {
        if (ori === 0) return v2.add(pos1, pos);
        let xOffset: number, yOffset: number;
        switch (ori) {
            case 1:
                xOffset = -pos.y;
                yOffset = pos.x;
                break;
            case 2:
                xOffset = -pos.x;
                yOffset = -pos.y;
                break;
            case 3:
                xOffset = pos.y;
                yOffset = -pos.x;
                break;
        }
        return v2.add(pos1, v2.create(xOffset!, yOffset!));
    },
};
