import { describe, expect, test } from "vitest";
import type { Game } from "../../server/src/game/game.ts";
import type { Building } from "../../server/src/game/objects/building.ts";
import type { GameObject } from "../../server/src/game/objects/gameObject.ts";
import type { Player } from "../../server/src/game/objects/player.ts";
import type { BuildingDef } from "../../shared/defs/mapObjects/buildings/buildingDefs.ts";
import { RoofMasks } from "../../shared/defs/mapObjects/buildings/roofMasks.ts";
import { MapObjectDefs } from "../../shared/defs/register.ts";
import { GameConfig, TeamMode } from "../../shared/gameConfig.ts";
import { InputMsg } from "../../shared/net/inputMsg.ts";
import { ObjectType } from "../../shared/net/objectSerializeFns.ts";
import { v2, type Vec2 } from "../../shared/utils/v2.ts";
import { createGame } from "./gameTestHelpers.ts";

// house_red_01: roof over a ~29x26 interior, 5.5 unit peek distance at doors and windows
const HOUSE_POS = v2.create(64, 64);
// 25 units east of the house center: inside the 1x view box, outside the peek distance
const OUTSIDE_POS = v2.create(89, 64);

function setup(teamMode = TeamMode.Solo) {
    const game = createGame(teamMode, "test_normal");
    const house = game.map.genBuilding("house_red_01", v2.copy(HOUSE_POS), 0, 0);
    return { game, house };
}

/** Runs the game like the server does: game updates plus net syncs. */
function run(game: Game, seconds: number) {
    const dt = 1 / 33;
    for (let t = 0; t < seconds; t += dt) {
        game.update(dt);
        game.netSync();
    }
}

function sees(viewer: Player, obj: GameObject) {
    return viewer.client.visibleObjects.has(obj);
}

function place(game: Game, player: Player, pos: Vec2) {
    player.pos = v2.copy(pos);
    player.posOld = v2.copy(pos);
    game.grid.updateObject(player);
}

function move(player: Player, right: boolean) {
    const msg = new InputMsg();
    msg.moveRight = right;
    player.handleInput(msg);
}

describe("Roofs", () => {
    test("enemy standing still under a roof is not sent to a player outside", () => {
        const { game } = setup();
        const viewer = game.playerBarn.addTestPlayer({ pos: OUTSIDE_POS });
        const enemy = game.playerBarn.addTestPlayer({ pos: HOUSE_POS });
        run(game, 1);

        expect(sees(viewer, enemy)).toBe(false);
    });

    test("enemy under a roof is sent while making noise within earshot", () => {
        const { game } = setup();
        const viewer = game.playerBarn.addTestPlayer({ pos: OUTSIDE_POS });
        const enemy = game.playerBarn.addTestPlayer({ pos: HOUSE_POS });
        run(game, 1);
        expect(sees(viewer, enemy)).toBe(false);

        // footsteps
        move(enemy, true);
        run(game, 0.1);
        expect(sees(viewer, enemy)).toBe(true);

        // stays sent through short pauses, then goes quiet
        move(enemy, false);
        run(game, 1);
        expect(sees(viewer, enemy)).toBe(true);
        run(game, 2);
        expect(sees(viewer, enemy)).toBe(false);
    });

    test("enemy under a roof is sent when a bullet passes by them", () => {
        const { game } = setup();
        const viewer = game.playerBarn.addTestPlayer({ pos: OUTSIDE_POS });
        const enemy = game.playerBarn.addTestPlayer({ pos: HOUSE_POS });
        run(game, 1);
        expect(sees(viewer, enemy)).toBe(false);

        game.bulletBarn.fireBullet({
            bulletType: "bullet_mp5",
            gameSourceType: "mp5",
            pos: v2.add(HOUSE_POS, v2.create(-3, 0)),
            dir: v2.create(1, 0),
            layer: 0,
            damageMult: 1,
            damageType: GameConfig.DamageType.Player,
            playerId: viewer.__id,
        });
        run(game, 0.05);
        expect(sees(viewer, enemy)).toBe(true);
    });

    test("enemy under the glass skylight is sent", () => {
        const { game } = setup();
        const viewer = game.playerBarn.addTestPlayer({ pos: OUTSIDE_POS });
        // house_red_01's skylight spans about x -3..3, y 2.4..6.6
        const enemy = game.playerBarn.addTestPlayer({ pos: v2.add(HOUSE_POS, v2.create(0, 4.5)) });
        run(game, 1);

        expect(sees(viewer, enemy)).toBe(true);
    });

    test("enemy whose gun sticks out past the roof edge is sent", () => {
        const { game } = setup();
        const viewer = game.playerBarn.addTestPlayer({ pos: OUTSIDE_POS });
        const enemy = game.playerBarn.addTestPlayer({ pos: v2.add(HOUSE_POS, v2.create(11.5, -8)) });
        enemy.weapons[GameConfig.WeaponSlot.Melee].type = "fists";
        enemy.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Melee, true);
        enemy.dir = v2.create(1, 0);
        run(game, 1);
        expect(sees(viewer, enemy)).toBe(false);

        // the roof ends ~15 units from the center, a mosin barrel is 5 long
        enemy.weapons[GameConfig.WeaponSlot.Primary].type = "mosin";
        enemy.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Primary, true);
        enemy.dir = v2.create(1, 0);
        run(game, 3);
        expect(sees(viewer, enemy)).toBe(true);
    });

    test("teammates under a roof are always sent", () => {
        const { game } = setup(TeamMode.Squad);
        const group = game.playerBarn.addGroup(false);
        const viewer = game.playerBarn.addTestPlayer({ group, pos: OUTSIDE_POS });
        const mate = game.playerBarn.addTestPlayer({ group, pos: HOUSE_POS });
        run(game, 1);

        expect(sees(viewer, mate)).toBe(true);
    });

    test("enemy is sent once the viewer walks inside", () => {
        const { game } = setup();
        const viewer = game.playerBarn.addTestPlayer({ pos: OUTSIDE_POS });
        const enemy = game.playerBarn.addTestPlayer({ pos: HOUSE_POS });
        run(game, 1);
        expect(sees(viewer, enemy)).toBe(false);

        place(game, viewer, v2.add(HOUSE_POS, v2.create(5, 0)));
        run(game, 0.05);
        expect(sees(viewer, enemy)).toBe(true);

        // the client fades the roof back in over a moment, so the enemy isn't cut off instantly
        place(game, viewer, OUTSIDE_POS);
        run(game, 0.1);
        expect(sees(viewer, enemy)).toBe(true);
        run(game, 2);
        expect(sees(viewer, enemy)).toBe(false);
    });

    test("destroyed roofs hide nothing", () => {
        const { game, house } = setup();
        const viewer = game.playerBarn.addTestPlayer({ pos: OUTSIDE_POS });
        const enemy = game.playerBarn.addTestPlayer({ pos: HOUSE_POS });
        run(game, 1);
        expect(sees(viewer, enemy)).toBe(false);

        house.ceilingDead = true;
        run(game, 0.05);
        expect(sees(viewer, enemy)).toBe(true);
    });

    test("loot under a roof is only sent to players who can see inside", () => {
        const { game } = setup();
        const viewer = game.playerBarn.addTestPlayer({ pos: OUTSIDE_POS });
        const inside = game.playerBarn.addTestPlayer({ pos: v2.add(HOUSE_POS, v2.create(5, 5)) });
        game.lootBarn.addLoot("bandage", v2.add(HOUSE_POS, v2.create(-5, 0)), 0, 1, { pushSpeed: 0 });
        run(game, 1);

        const loot = [...inside.client.visibleObjects].find(
            (o) => o.__type === ObjectType.Loot && o.type === "bandage",
        );
        expect(loot).toBeDefined();
        expect(sees(viewer, loot!)).toBe(false);
    });

    test("every building with roof art has a roof mask", () => {
        const defs = (MapObjectDefs as unknown as { _defs: Record<string, BuildingDef> })._defs;
        for (const [type, def] of Object.entries(defs)) {
            if (def.type !== "building") continue;
            const hasRoof = def.ceiling.imgs.some((img) => img.sprite && img.sprite !== "none")
                && def.ceiling.zoomRegions.some((region) => region.zoomIn);
            expect(type in RoofMasks, `${type}: run \`pnpm roofMasks\` in client/`).toBe(hasRoof);
        }
    });
});

describe("Layers", () => {
    test("players on layer 1 are not sent to players on the ground", () => {
        const game = createGame(TeamMode.Solo, "test_normal");
        const viewer = game.playerBarn.addTestPlayer({ pos: v2.create(40, 40) });
        const enemy = game.playerBarn.addTestPlayer({ pos: v2.create(50, 40) });
        enemy.layer = 1;
        run(game, 2);

        expect(sees(viewer, enemy)).toBe(false);
    });

    test("underground players don't get ground layer players", () => {
        const game = createGame(TeamMode.Solo, "test_normal");
        const viewer = game.playerBarn.addTestPlayer({ pos: v2.create(40, 40) });
        const enemy = game.playerBarn.addTestPlayer({ pos: v2.create(50, 40) });
        viewer.layer = 1;
        run(game, 2);

        expect(sees(viewer, enemy)).toBe(false);
    });

    test("players on stairs see both layers", () => {
        const game = createGame(TeamMode.Solo, "test_normal");
        const viewer = game.playerBarn.addTestPlayer({ pos: v2.create(40, 40) });
        const ground = game.playerBarn.addTestPlayer({ pos: v2.create(50, 40) });
        const under = game.playerBarn.addTestPlayer({ pos: v2.create(30, 40) });
        viewer.layer = 2;
        under.layer = 1;
        run(game, 1);

        expect(sees(viewer, ground)).toBe(true);
        expect(sees(viewer, under)).toBe(true);
    });

    test("layer changes give the client time to fade", () => {
        const game = createGame(TeamMode.Solo, "test_normal");
        const viewer = game.playerBarn.addTestPlayer({ pos: v2.create(40, 40) });
        const enemy = game.playerBarn.addTestPlayer({ pos: v2.create(50, 40) });
        viewer.layer = 2;
        enemy.layer = 1;
        run(game, 1);
        expect(sees(viewer, enemy)).toBe(true);

        viewer.layer = 0;
        run(game, 0.1);
        expect(sees(viewer, enemy)).toBe(true);
        run(game, 1);
        expect(sees(viewer, enemy)).toBe(false);
    });
});
