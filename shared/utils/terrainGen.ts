import { GameConfig } from "../gameConfig";
import { collider } from "./collider";
import { River } from "./river";
import { util } from "./util";
import { type Vec2, v2 } from "./v2";

export interface MapRiverData {
    width: number;
    looped: boolean;
    points: Vec2[];
}

export function generateJaggedAabbPoints(
    aabb: { min: Vec2; max: Vec2 },
    divisionsX: number,
    divisionsY: number,
    variation: number,
    rand: (typeof util)["random"],
) {
    const ll = v2.create(aabb.min.x, aabb.min.y);
    const lr = v2.create(aabb.max.x, aabb.min.y);
    const ul = v2.create(aabb.min.x, aabb.max.y);
    const ur = v2.create(aabb.max.x, aabb.max.y);

    const distanceX = lr.x - ll.x;
    const distanceY = ul.y - ll.y;
    const spanX = distanceX / (divisionsX + 1);
    const spanY = distanceY / (divisionsY + 1);

    // Generate points in a counter-clockwise direction starting from the
    // lower left.
    const points: Vec2[] = [];
    points.push(v2.copy(ll));
    for (let i = 1; i <= divisionsX; ++i) {
        points.push(v2.create(ll.x + spanX * i, ll.y + rand(-variation, variation)));
    }

    points.push(v2.copy(lr));
    for (let i = 1; i <= divisionsY; ++i) {
        points.push(v2.create(lr.x + rand(-variation, variation), lr.y + spanY * i));
    }

    points.push(v2.copy(ur));
    for (let i = 1; i <= divisionsX; ++i) {
        points.push(v2.create(ur.x - spanX * i, ur.y + rand(-variation, variation)));
    }

    points.push(v2.copy(ul));
    for (let i = 1; i <= divisionsY; ++i) {
        points.push(v2.create(ul.x + rand(-variation, variation), ul.y - spanY * i));
    }

    return points;
}

export function generateTerrain(
    width: number,
    height: number,
    shoreInset: number,
    grassInset: number,
    riverDescs: MapRiverData[],
    seed: number,
) {
    // Subdivisions along one edge of the shore
    const shoreDivisions = 64.0;
    const { shoreVariation } = GameConfig.map;
    const { grassVariation } = GameConfig.map;

    const seededRand = util.seededRand(seed);

    // First generate a shore path that separates the island from water.
    const ll = v2.create(shoreInset, shoreInset);
    // const lr = v2.create(width - shoreInset, shoreInset);
    // const ul = v2.create(shoreInset, height - shoreInset);
    const ur = v2.create(width - shoreInset, height - shoreInset);

    const aabbMin = v2.create(ll.x, ll.y);
    const aabbMax = v2.create(ur.x, ur.y);
    const aabb = collider.createAabb(aabbMin, aabbMax);
    const shore = generateJaggedAabbPoints(
        aabb,
        shoreDivisions,
        shoreDivisions,
        shoreVariation,
        seededRand,
    );

    // Create grass path by insetting the shore path
    // The beach lies between the shore and grass.
    const center = v2.create(width * 0.5, height * 0.5);
    const grass = shore.map((pos) => {
        const toCenter = v2.normalize(v2.sub(center, pos));
        const variation = seededRand(-grassVariation, grassVariation);
        const inset = grassInset + variation;
        return v2.add(pos, v2.mul(toCenter, inset));
    });

    // Calculate river forms from the given river splines
    const mapBounds = collider.createAabb(v2.create(0.0, 0.0), v2.create(width, height));

    const rivers: River[] = [];
    for (let i = 0; i < riverDescs.length; i++) {
        const desc = riverDescs[i];
        const river = new River(desc.points, desc.width, desc.looped, rivers, mapBounds);
        rivers.push(river);
    }

    return { shore, grass, rivers };
}
