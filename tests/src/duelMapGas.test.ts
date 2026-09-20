import { describe, expect, test, vi } from "vitest";
import { Config } from "../../server/src/config.ts";
import { Game } from "../../server/src/game/game.ts";
import { MapDefs } from "../../shared/defs/mapDefs.ts";
import { GasMode, TeamMode } from "../../shared/gameConfig.ts";
import { collider } from "../../shared/utils/collider.ts";
import { util } from "../../shared/utils/util.ts";

function createDuel(size: 1 | 2 | 3 | 4 = 1) {
    Config.logging.infoLogs = false;
    Config.logging.debugLogs = false;
    Config.logging.logDate = false;
    return new Game("duel-map-gas", {
        mapName: "duel",
        teamMode: size === 1 ? TeamMode.Solo : size === 2 ? TeamMode.Duo : TeamMode.Squad,
        duel: {
            seriesId: "map-gas-series",
            roundId: "map-gas-round",
            round: 1,
            teamSize: size,
            roster: Array.from({ length: size * 2 }, (_, index) => ({
                profileId: `player-${index}`,
                name: `Player${index}`,
                team: (index < size ? 0 : 1) as 0 | 1,
            })),
        },
    });
}

describe("duel map placement and circle pacing", () => {
    test.each([1, 2, 3, 4] as const)(
        "size %s: scaled arenas contain the required buildings, cover and no beach huts",
        size => {
            const sharedBefore = JSON.stringify(MapDefs.duel);
            const normalBefore = JSON.stringify(MapDefs.main);
            const seeds = [
                1,
                2,
                3,
                11,
                42,
                127,
                256,
                512,
                1024,
                2048,
                8192,
                65535,
                100003,
                314159,
                271828,
                999983,
                214748,
                1367769627,
                1010101,
                987654321,
            ];
            for (const seed of seeds) {
                const random = vi.spyOn(Math, "random").mockImplementation(util.seededRand(seed));
                try {
                    const game = createDuel(size);
                    game.map.regenerate(seed);
                    expect(game.map.width).toBe([280, 336, 420, 560][size - 1]);
                    expect(game.map.height).toBe(game.map.width);
                    const normal = MapDefs.main.mapGen.map;
                    expect(game.map.width).toBeLessThan(normal.baseWidth * normal.scale.small + normal.extension);
                    const primary = game.map.buildings.filter(building =>
                        ["house_red_01", "warehouse_01"].includes(building.type)
                    );
                    expect(primary, `seed ${seed}`).toHaveLength(size * 3);
                    expect(game.map.buildings.some(building => building.type.startsWith("hut_"))).toBe(false);
                    expect(game.map.buildings.some(building => building.type.startsWith("shack_"))).toBe(false);
                    expect(game.map.mapDef.mapGen.fixedSpawns[0].crate_01).toBe(24 * size);
                    expect(game.map.mapDef.mapGen.fixedSpawns[0].loot_tier_1).toBe(28 * size);
                    expect(game.map.obstacles.filter(obstacle => obstacle.type === "tree_01").length)
                        .toBeGreaterThanOrEqual(38 * size);
                    expect(game.lootBarn.loots.length).toBeGreaterThan(28 * size);
                    for (const building of game.map.buildings) {
                        if (building.layer !== 0) continue;
                        const bound = collider.toAabb(collider.transform(building.bounds, building.pos, 0, 1));
                        expect(bound.min.x, `${seed}: ${building.type}`).toBeGreaterThanOrEqual(8);
                        expect(bound.min.y, `${seed}: ${building.type}`).toBeGreaterThanOrEqual(8);
                        expect(bound.max.x, `${seed}: ${building.type}`).toBeLessThanOrEqual(game.map.width - 8);
                        expect(bound.max.y, `${seed}: ${building.type}`).toBeLessThanOrEqual(game.map.height - 8);
                    }
                    for (const team of [0, 1] as const) {
                        for (let i = 0; i < 4; i++) {
                            const pos = game.map.getSpawnPos(undefined, undefined, team);
                            expect(game.map.canPlayerSpawn(pos), `seed ${seed}: team ${team} spawn`).toBe(true);
                        }
                    }
                } finally {
                    random.mockRestore();
                }
            }
            expect(JSON.stringify(MapDefs.duel)).toBe(sharedBefore);
            expect(JSON.stringify(MapDefs.main)).toBe(normalBefore);
        },
    );

    test("the opening minute stays open and circles contract gradually until 4:45", () => {
        const game = createDuel();
        const gas = game.gas;
        const initialRadius = gas.currentRad;
        gas.advanceGasStage();
        const expectedRadii = new Map([
            [60, initialRadius],
            [90, 126],
            [155, 86.8],
            [210, 53.2],
            [255, 25.2],
            [285, 0],
        ]);
        let previousRadius = initialRadius;
        for (let seconds = 1; seconds <= 285; seconds++) {
            gas.update(1);
            expect(gas.currentRad).toBeLessThanOrEqual(previousRadius);
            if (seconds < 60) {
                expect(gas.mode).toBe(GasMode.Waiting);
                expect(gas.currentRad).toBe(initialRadius);
            }
            const expected = expectedRadii.get(seconds);
            if (expected !== undefined) expect(gas.currentRad, `at ${seconds}s`).toBeCloseTo(expected, 4);
            if (seconds < 285) expect(gas.currentRad).toBeGreaterThan(0);
            previousRadius = gas.currentRad;
        }
        expect(gas.damage).toBe(22);
        expect(gas.isInGas(game.map.center)).toBe(true);
    });

    test("ordinary matches retain the original 80-second opening and 30-second first close", () => {
        const game = new Game("normal-gas", { mapName: "test_normal", teamMode: TeamMode.Solo });
        const gas = game.gas;
        const initialRadius = gas.currentRad;
        gas.advanceGasStage();
        expect(gas.duration).toBe(80);
        for (let seconds = 0; seconds < 80; seconds++) gas.update(1);
        expect(gas.currentRad).toBe(initialRadius);
        expect(gas.mode).toBe(GasMode.Moving);
        expect(gas.duration).toBe(30);
        for (let seconds = 0; seconds < 30; seconds++) gas.update(1);
        expect(gas.currentRad).toBeCloseTo(gas.mapSize * 0.45, 4);
        expect(gas.mode).toBe(GasMode.Waiting);
        expect(gas.duration).toBe(65);
    });
});
