import type { Collider } from "./coldet";
import { collider } from "./collider";
import { math } from "./math";
import { util } from "./util";
import { type Vec2, v2 } from "./v2";

interface Obstacle {
    __id: number;
    dead: boolean;
    collidable: boolean;
    isWindow: boolean;
    height: number;
    layer: number;
    collider: Collider;
}

//
// Internal helper routines
//
function intersectSegmentObstacle(
    obstacle: Obstacle,
    s0: Vec2,
    s1: Vec2,
    height: number,
    layer: number,
    hackStairs: boolean,
) {
    const o = obstacle;

    if (
        o.dead ||
        !o.collidable ||
        o.isWindow ||
        o.height < height ||
        !util.sameLayer(o.layer, layer)
    ) {
        return null;
    }

    // Ignore above-ground walls when on stairs.
    // Currently there are invisible walls at the bottom and tops of stairs,
    // and this allows for proper bunker ceiling reveals when at the tops of
    // stairs. This hack could be removed if bullets are refactored to no
    // longer stop at the bottoms and tops of stairs.
    if (hackStairs && layer & 0x2 && o.layer == 0) {
        return null;
    }

    return collider.intersectSegment(o.collider, s0, s1);
}

function getIntersectSegmentEnd(
    obstacles: Obstacle[],
    pos: Vec2,
    dir: Vec2,
    len: number,
    layer: number,
) {
    const dist = collisionHelpers.intersectSegmentDist(
        obstacles,
        pos,
        dir,
        len,
        0.0,
        layer,
        false,
    );
    return v2.add(pos, v2.mul(dir, dist));
}

//
// Exported routines
//
export const collisionHelpers = {
    intersectSegment(
        obstacles: Obstacle[],
        pos: Vec2,
        dir: Vec2,
        len: number,
        height: number,
        layer: number,
        hackStairs: boolean,
    ) {
        const end = v2.add(pos, v2.mul(dir, len));
        const cols: Array<{ id: number; dist: number }> = [];
        for (let i = 0; i < obstacles.length; i++) {
            const o = obstacles[i];
            const res = intersectSegmentObstacle(o, pos, end, height, layer, hackStairs);
            if (res) {
                const dist = v2.length(v2.sub(res.point, pos));
                cols.push({
                    id: o.__id,
                    dist,
                });
            }
        }
        cols.sort((a, b) => a.dist - b.dist);
        return cols.length > 0 ? cols[0] : null;
    },

    intersectSegmentDist(
        obstacles: Obstacle[],
        pos: Vec2,
        dir: Vec2,
        len: number,
        height: number,
        layer: number,
        hackStairs: boolean,
    ) {
        let dist = len;
        const end = v2.add(pos, v2.mul(dir, len));
        for (let i = 0; i < obstacles.length; i++) {
            const o = obstacles[i];
            const res = intersectSegmentObstacle(o, pos, end, height, layer, hackStairs);
            if (res) {
                dist = math.min(dist, v2.length(v2.sub(res.point, pos)));
            }
        }
        return dist;
    },
    scanCollider(
        col: Collider,
        obstacles: Obstacle[],
        pos: Vec2,
        layer: number,
        height: number,
        scanWidth: number,
        scanDist: number,
        rayCount: number,
        debug?: boolean,
        debugLines?: {
            addRay: (pos: Vec2, dir: Vec2, dist: number, color: number) => void;
        },
    ) {
        const toCol = collider.intersectCircle(col, pos, scanDist);
        if (!toCol) {
            return null;
        }
        if (toCol.pen >= scanDist) {
            // Inside the collider
            return { dist: 0.0 };
        }

        const perp = v2.perp(toCol.dir);

        const scanStart = getIntersectSegmentEnd(
            obstacles,
            pos,
            v2.neg(perp),
            0.5 * scanWidth,
            layer,
        );
        const scanEnd = getIntersectSegmentEnd(
            obstacles,
            pos,
            perp,
            0.5 * scanWidth,
            layer,
        );
        let scanDir = v2.sub(scanEnd, scanStart);
        const scanLen = v2.length(scanDir);
        scanDir = scanLen > 0.0001 ? v2.div(scanDir, scanLen) : v2.create(1.0, 0.0);

        const rayPositions: Vec2[] = [];
        for (let i = 0; i < rayCount; i++) {
            const t = i / math.max(rayCount - 1, 1);
            rayPositions.push(v2.add(scanStart, v2.mul(scanDir, scanLen * t)));
        }
        const rayHeight = height;

        for (let i = 0; i < rayPositions.length; i++) {
            const rayPos = rayPositions[i];

            const circleRes = collider.intersectCircle(col, rayPos, scanDist);
            if (!circleRes) {
                continue;
            }

            const rayDir = v2.neg(circleRes.dir);
            const maxDist = collisionHelpers.intersectSegmentDist(
                obstacles,
                rayPos,
                rayDir,
                scanDist,
                rayHeight,
                layer,
                true,
            );
            const res = collider.intersectSegment(
                col,
                rayPos,
                v2.add(rayPos, v2.mul(rayDir, scanDist)),
            );
            const dist = res ? v2.length(v2.sub(res.point, rayPos)) : 0.0;
            const rayHit = res && dist <= maxDist;
            if (debug) {
                const color = rayHit ? 0x00ff00 : 0xff0000;
                debugLines?.addRay(rayPos, rayDir, scanDist, color);
            }
            if (rayHit) {
                return { dist };
            }
        }

        return null;
    },
};
