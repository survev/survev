import { describe, expect, test } from "vitest";
import type { Building } from "../../server/src/game/objects/building.ts";
import { MapObjectDefs } from "../../shared/defs/register.ts";
import { TeamMode } from "../../shared/gameConfig.ts";
import { createGame } from "./gameTestHelpers.ts";

describe("Map message", () => {
    const game = createGame(TeamMode.Solo, "main");
    const mapObjects = new Set<unknown>(game.map.msg.objects);

    test("children of disguised buildings are not on the map", () => {
        let disguised = 0;
        for (const building of game.map.buildings as Building[]) {
            const def = MapObjectDefs.typeToDef(building.type, "building");
            if (def.map?.displayType === undefined) continue;
            disguised++;
            for (const child of building.childObjects) {
                expect(mapObjects.has(child), `${child.type} in ${building.type}`).toBe(false);
            }
        }
        expect(disguised).toBeGreaterThan(0);
    });

    test("disguised buildings get a scale like the obstacle they show as", () => {
        let disguises = 0;
        for (const obj of game.map.msg.objects) {
            // real obstacles are pushed as objects, building entries as plain data
            if ("__type" in obj) continue;
            const def = MapObjectDefs.typeToDef(obj.type);
            if (def.type !== "obstacle") continue;
            disguises++;
            expect(obj.scale).toBeGreaterThanOrEqual(def.scale.createMin);
            expect(obj.scale).toBeLessThanOrEqual(def.scale.createMax);
        }
        expect(disguises).toBeGreaterThan(0);
    });

    test("objects are not in generation order", () => {
        const objs = game.map.msg.objects;
        for (let i = 1; i < objs.length; i++) {
            expect(objs[i - 1].pos.x <= objs[i].pos.x).toBe(true);
        }
    });
});
