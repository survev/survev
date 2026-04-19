import type { MapDef } from "../../../shared/defs/mapDefs";
import { coldet } from "../../../shared/utils/coldet";
import { math } from "../../../shared/utils/math";
import { util } from "../../../shared/utils/util";
import { type Vec2, v2 } from "../../../shared/utils/v2";
import type { GameMap } from "./map";

export class RiverCreator {
    randomGenerator: (min?: number, max?: number) => number;

    constructor(
        public map: GameMap,
        randomGenerator?: (min?: number, max?: number) => number,
    ) {
        this.randomGenerator =
            randomGenerator ?? ((min = 0, max = 1) => Math.random() * (max - min) + min);
    }

    private getStartPoint(isFactionRiver: boolean): Vec2 {
        if (isFactionRiver) {
            switch (this.map.factionModeSplitOri) {
                case 0:
                    return v2.create(0, this.map.height / 2);
                case 1:
                    return v2.create(this.map.width / 2, 0);
            }
        }

        return this.map.randomPointOnMapEdge(this.randomGenerator);
    }

    private getEndPoint(start: Vec2, isFactionRiver: boolean): Vec2 {
        if (isFactionRiver) {
            switch (this.map.factionModeSplitOri) {
                case 0:
                    return v2.create(this.map.width, this.map.height / 2);
                case 1:
                    return v2.create(this.map.width / 2, this.map.height);
            }
        }

        const corners = [
            v2.create(0, 0),
            v2.create(0, this.map.height),
            v2.create(this.map.width, this.map.height),
            v2.create(this.map.width, 0),
        ];

        const gridSize = this.map.width;
        const tileSize = this.map.width / 4;

        const isStartNearCorner = corners.some(
            (c) => v2.manhattanDistance(c, start) < tileSize,
        );
        let attempts = 0;
        while (attempts++ < 1000) {
            const end = this.map.randomPointOnMapEdge(this.randomGenerator);
            if (v2.manhattanDistance(start, end) <= gridSize) continue;
            // if a river starts on corner, it can't end on a corner
            if (
                isStartNearCorner &&
                corners.some((c) => v2.manhattanDistance(c, end) < tileSize)
            )
                continue;
            return end;
        }

        // should hopefully never reach here
        return v2.create(this.map.width / 2, this.map.height);
    }

    private getMidPoint(lastPoint: Vec2, nextPoint: Vec2, offsetDir: Vec2): Vec2 {
        const segmentDistance = v2.distance(lastPoint, nextPoint);
        // the closer the points are, the less offset there is to make the river look smoother
        let offsetDistance = (this.randomGenerator(0, 1) * segmentDistance) / 7;
        // prevents rivers from straying off too far in one direction, need to stay relatively aligned to original start/end
        if (this.randomGenerator(0, 1) < 0.5) offsetDistance *= -1;

        const offset = v2.mul(offsetDir, offsetDistance);
        const midpoint = v2.midpoint(lastPoint, nextPoint);
        return v2.add(midpoint, offset);
    }

    /**
     * checks to see if passed in river intersects with any pre-existing rivers
     * if it does, it will chop off the end of the river at the point of intersection to create a junction between the two rivers
     */
    handleIntersection(riverPoints: Vec2[]): void {
        for (let r = 1; r < riverPoints.length; r++) {
            for (const river of this.map.riverDescs) {
                const points = river.points;
                for (let j = 1; j < points.length; j++) {
                    const intersection = coldet.intersectSegmentSegment(
                        riverPoints[r - 1],
                        riverPoints[r],
                        points[j - 1],
                        points[j],
                    );
                    if (intersection) {
                        // visually attaches the 2 colliding rivers if their intersections are too far apart
                        riverPoints[r - 1] = intersection.point;
                        riverPoints.splice(r);
                        return;
                    }
                }
            }
        }
    }

    create(isFactionRiver: boolean): Vec2[] {
        const start = this.getStartPoint(isFactionRiver);
        const end = this.getEndPoint(start, isFactionRiver);

        const slope = (end.y - start.y) / (end.x - start.x);
        const slopeAngle = Math.atan(slope);
        // river points need to be offset a bit to provide variation in the river
        // the offset needs to be perpendicular to the river direction hence the "+ Math.PI/2"
        const offsetAngle = slopeAngle + Math.PI / 2;
        const offsetDir = math.rad2Direction(offsetAngle);

        const riverPoints = [start, end];

        const nPasses = isFactionRiver ? 6 : 5; // faction rivers need to be smoother than normal rivers
        for (let i = 0; i < nPasses; i++) {
            for (let j = 1; j < riverPoints.length; j++) {
                const lastPoint = riverPoints[j - 1];
                const nextPoint = riverPoints[j];

                let midPoint: Vec2;
                // not the cleanest but forces the factionRiver to be straight...
                // since the first midpoint of the river determines its overall structure
                // will replace will a cleaner solution when i figure out one lmao
                if (isFactionRiver && i == 0) {
                    midPoint = v2.midpoint(lastPoint, nextPoint);
                } else {
                    midPoint = this.getMidPoint(lastPoint, nextPoint, offsetDir);
                }
                this.map.clampToMapBounds(midPoint);
                riverPoints.splice(j, 0, midPoint);
                // skip over point we just added
                j++;
            }
        }

        // if too many points are inside the ocean
        // discard the river because its most likely "sliding" along the map boundaries
        let maxPointsOutside = math.max(
            (this.map.shoreInset + this.map.grassInset) / 9,
            3,
        );
        if (isFactionRiver) maxPointsOutside *= 2;
        for (let i = 0, pointsOutsideGrass = 0; i < riverPoints.length; i++) {
            if (
                !coldet.testPointAabb(
                    riverPoints[i],
                    this.map.grassBounds.min,
                    this.map.grassBounds.max,
                )
            ) {
                pointsOutsideGrass++;
                if (pointsOutsideGrass > maxPointsOutside) {
                    return [];
                }
            }
        }

        for (let i = 0; i < this.map.riverMasks.length; i++) {
            const mask = this.map.riverMasks[i];
            for (let j = 0; j < riverPoints.length; j++) {
                const point = riverPoints[j];
                if (coldet.testCircleCircle(point, 0.01, mask.pos, mask.rad)) {
                    return [];
                }
            }
        }

        this.handleIntersection(riverPoints);

        return riverPoints;
    }

    pushNodes(center: Vec2, points: Vec2[], position: Vec2) {
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const dist = v2.distance(point, position);

            if (dist > 32) continue;
            const force = (32 - dist) * 0.8;
            const dir = v2.normalize(v2.sub(position, center));
            v2.set(point, v2.add(point, v2.mul(dir, force)));
        }
    }

    createLake(lake: MapDef["mapGen"]["map"]["rivers"]["lakes"][number]) {
        const points: Vec2[] = [];

        const center = v2.add(
            v2.mulElems(v2.create(this.map.width, this.map.height), lake.spawnBound.pos),
            util.randomPointInCircle(lake.spawnBound.rad, this.randomGenerator),
        );

        const variationPushDistance = 10;
        const width = (lake.outerRad - lake.innerRad) / 2;

        const len = lake.innerRad + width - variationPushDistance * 2;

        const step = (Math.PI * 2) / (width + 1);
        const max = Math.PI * 2 - step;
        for (let i = 0; i < max; i += step) {
            const dir = v2.create(Math.cos(i), Math.sin(i));
            points.push(v2.add(center, v2.mul(dir, len)));
        }

        const start = this.randomGenerator(0, Math.PI * 2);
        const end = start + Math.PI * 2;
        for (let i = start; i < end; i += this.randomGenerator(0.5, 1.1)) {
            let pushDist = this.randomGenerator(0, variationPushDistance);
            if (this.randomGenerator() < 0.5) pushDist *= -1;
            pushDist += len;

            const dir = v2.create(Math.cos(i) * pushDist, Math.sin(i) * pushDist);
            this.pushNodes(center, points, v2.add(center, dir));
        }
        points.push(v2.copy(points[0]));

        return {
            width,
            points,
            looped: true,
            center,
        };
    }
}
