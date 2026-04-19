import { math } from "./math";
import { assert } from "./util";
import { type Vec2, v2 } from "./v2";

function getControlPoints(t: number, points: Vec2[], looped: boolean) {
    const count = points.length;
    let i: number;
    let i0: number;
    let i1: number;
    let i2: number;
    let i3: number;
    if (looped) {
        // Assume that with looped rails, points 0 and count are the same
        t = math.fmod(t, 1.0);
        i = ~~(t * (count - 1));
        i1 = i;
        i2 = (i1 + 1) % (count - 1);
        i0 = i1 > 0 ? i1 - 1 : count - 2;
        i3 = (i2 + 1) % (count - 1);
    } else {
        t = math.clamp(t, 0.0, 1.0);
        i = ~~(t * (count - 1));
        i1 = i === count - 1 ? i - 1 : i;
        i2 = i1 + 1;
        i0 = i1 > 0 ? i1 - 1 : i1;
        i3 = i2 < count - 1 ? i2 + 1 : i2;
    }
    return {
        pt: t * (count - 1) - i1,
        p0: points[i0],
        p1: points[i1],
        p2: points[i2],
        p3: points[i3],
    };
}

// Taken from https://www.mvps.org/directx/articles/catmull/
function catmullRom(t: number, p0: number, p1: number, p2: number, p3: number) {
    return (
        0.5 *
        (2.0 * p1 +
            t * (-p0 + p2) +
            t * t * (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) +
            t * t * t * (-p0 + 3.0 * p1 - 3.0 * p2 + p3))
    );
}

function catmullRomDerivative(t: number, p0: number, p1: number, p2: number, p3: number) {
    return (
        0.5 *
        (-p0 +
            p2 +
            2.0 * t * (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) +
            3.0 * t * t * (-p0 + 3.0 * p1 - 3.0 * p2 + p3))
    );
}

//
// Spline
//

export class Spline {
    points: Vec2[] = [];
    arcLens: number[] = [];
    totalArcLen: number;
    looped: boolean;

    constructor(points: Vec2[], looped: boolean) {
        assert(points.length > 1);

        this.totalArcLen = 0.0;
        this.looped = looped;

        for (let i = 0; i < points.length; i++) {
            this.points.push(v2.copy(points[i]));
        }

        const arcLenSamples = points.length * 4;
        let cur = this.points[0];
        for (let i = 0; i <= arcLenSamples; i++) {
            const t = i / arcLenSamples;
            const next = this.getPos(t);
            const arcLenPrev = i === 0 ? 0.0 : this.arcLens[i - 1];
            this.arcLens[i] = arcLenPrev + v2.length(v2.sub(next, cur));
            cur = v2.copy(next);
        }
        this.totalArcLen = this.arcLens[this.arcLens.length - 1];
    }

    getPos(t: number) {
        const _getControlPoints = getControlPoints(t, this.points, this.looped);
        const { pt } = _getControlPoints;
        const { p0 } = _getControlPoints;
        const { p1 } = _getControlPoints;
        const { p2 } = _getControlPoints;
        const { p3 } = _getControlPoints;

        return v2.create(
            catmullRom(pt, p0.x, p1.x, p2.x, p3.x),
            catmullRom(pt, p0.y, p1.y, p2.y, p3.y),
        );
    }

    getTangent(t: number) {
        const _getControlPoints2 = getControlPoints(t, this.points, this.looped);
        const { pt } = _getControlPoints2;
        const { p0 } = _getControlPoints2;
        const { p1 } = _getControlPoints2;
        const { p2 } = _getControlPoints2;
        const { p3 } = _getControlPoints2;

        return v2.create(
            catmullRomDerivative(pt, p0.x, p1.x, p2.x, p3.x),
            catmullRomDerivative(pt, p0.y, p1.y, p2.y, p3.y),
        );
    }

    getNormal(t: number) {
        const tangent = this.getTangent(t);
        return v2.perp(v2.normalizeSafe(tangent, v2.create(1.0, 0.0)));
    }

    getClosestTtoPoint(pos: Vec2) {
        // Find closest segment to pos
        let closestDistSq = Number.MAX_VALUE;
        let closestSegIdx = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            const distSq = math.distToSegmentSq(pos, this.points[i], this.points[i + 1]);
            if (distSq < closestDistSq) {
                closestDistSq = distSq;
                closestSegIdx = i;
            }
        }
        const idx0 = closestSegIdx;
        const idx1 = idx0 + 1;
        const s0 = this.points[idx0];
        const s1 = this.points[idx1];
        const seg = v2.sub(s1, s0);
        const t = math.clamp(v2.dot(v2.sub(pos, s0), seg) / v2.dot(seg, seg), 0.0, 1.0);
        const len = this.points.length - 1;
        const tMin = math.clamp((idx0 + t - 0.1) / len, 0.0, 1.0);
        const tMax = math.clamp((idx0 + t + 0.1) / len, 0.0, 1.0);

        // Refine closest point by testing near the closest segment point
        let nearestT = (idx0 + t) / len;
        let nearestDistSq = Number.MAX_VALUE;
        const kIter = 8;
        for (let i = 0; i <= kIter; i++) {
            const testT = math.lerp(i / kIter, tMin, tMax);
            const testPos = this.getPos(testT);
            const testDistSq = v2.lengthSqr(v2.sub(testPos, pos));
            if (testDistSq < nearestDistSq) {
                nearestT = testT;
                nearestDistSq = testDistSq;
            }
        }

        // Refine by offsetting along the spline tangent
        const tangent = this.getTangent(nearestT);
        const tanLen = v2.length(tangent);
        if (tanLen > 0.0) {
            const nearest = this.getPos(nearestT);
            const offset = v2.dot(tangent, v2.sub(pos, nearest)) / tanLen;
            const offsetT = nearestT + offset / (tanLen * len);
            if (
                v2.lengthSqr(v2.sub(pos, this.getPos(offsetT))) <
                v2.lengthSqr(v2.sub(pos, nearest))
            ) {
                nearestT = offsetT;
            }
        }

        return nearestT;
    }

    getTfromArcLen(arcLen: number) {
        arcLen = math.clamp(arcLen, 0.0, this.totalArcLen);

        let idx = 0;
        while (arcLen > this.arcLens[idx]) {
            idx++;
        }

        if (idx === 0) {
            return 0.0;
        }
        const arcT = math.delerp(arcLen, this.arcLens[idx - 1], this.arcLens[idx]);
        const arcCount = this.arcLens.length - 1;
        const t0 = (idx - 1) / arcCount;
        const t1 = idx / arcCount;
        return math.lerp(arcT, t0, t1);
    }

    getArcLen(t: number) {
        t = math.clamp(t, 0.0, 1.0);
        const arcCount = this.arcLens.length - 1;
        const idx0 = Math.floor(t * arcCount);
        const idx1 = idx0 < arcCount - 1 ? idx0 + 1 : idx0;
        const arcT = math.fmod(t, 1.0 / arcCount) / (1.0 / arcCount);
        return math.lerp(arcT, this.arcLens[idx0], this.arcLens[idx1]);
    }
}
