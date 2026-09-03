import { describe, expect, test } from "vitest";
import { hasMapMatch, matchesFilter, satisfiesMapFilter } from "../../server/src/utils/questHelpers.ts";
import { QuestDefs } from "../../shared/defs/gameObjects/questDefs.ts";
import { RoleDefs } from "../../shared/defs/gameObjects/roleDefs.ts";
import { ObstacleDefs } from "../../shared/defs/mapObjects/obstacles/obstacleDefs.ts";
import { GameObjectDefs, MapObjectDefs } from "../../shared/defs/register.ts";
import { DamageType, GameConfig, MapId, TeamMode, WeaponSlot } from "../../shared/gameConfig.ts";
import { v2 } from "../../shared/utils/v2.ts";
import { createGame } from "./gameTestHelpers.ts";
import { predicates } from "./testHelpers.ts";

const allObstacleCategories = Object.values(ObstacleDefs).map(def => def.category).filter(cat => cat !== undefined);
GameConfig.player.headshotChance = 0;

describe("Quest helpers", () => {
    test("satisfiesMapFilter", () => {
        expect.soft(satisfiesMapFilter(["main"], {})).toBe(true);
        expect.soft(satisfiesMapFilter(["main"], { mapFilterType: "only_on", maps: "main" })).toBe(true);
        expect.soft(satisfiesMapFilter(["main"], { mapFilterType: "only_on", maps: ["main"] })).toBe(true);
        expect.soft(satisfiesMapFilter(["main", "desert"], { mapFilterType: "only_on", maps: "main" })).toBe(true);
        expect.soft(satisfiesMapFilter(["main", "desert"], { mapFilterType: "only_on", maps: MapId.Desert })).toBe(
            true,
        );
        expect.soft(satisfiesMapFilter(["main", "desert"], { mapFilterType: "all_except", maps: MapId.Desert })).toBe(
            false,
        );
        expect.soft(satisfiesMapFilter(["main", "cobalt"], { mapFilterType: "all_except", maps: MapId.Desert })).toBe(
            true,
        );
        expect.soft(
            satisfiesMapFilter(["main", "cobalt"], {
                mapFilterType: "all_except",
                maps: [MapId.Desert, MapId.Faction],
            }),
        ).toBe(true);
        expect.soft(
            satisfiesMapFilter(["woods_spring"], { mapFilterType: "all_except", maps: [MapId.Desert, "woods_spring"] }),
        ).toBe(false);
        expect.soft(
            satisfiesMapFilter(["desert"], { mapFilterType: "all_except", maps: [MapId.Desert, "woods_spring"] }),
        ).toBe(false);
        expect.soft(
            satisfiesMapFilter(["main", "cobalt"], { mapFilterType: "only_on", maps: [MapId.Desert, MapId.Faction] }),
        ).toBe(false);
    });

    test("hasMapMatch", () => {
        expect.soft(hasMapMatch(["main"], "main")).toBe(true);
        expect.soft(hasMapMatch(["main"], ["main"])).toBe(true);

        expect.soft(hasMapMatch(["main"], "cobalt")).toBe(false);
        expect.soft(hasMapMatch(["main"], ["cobalt"])).toBe(false);

        expect.soft(hasMapMatch(["main", "desert"], ["main"])).toBe(true);
        expect.soft(hasMapMatch(["main", "desert"], ["woods"])).toBe(false);

        expect.soft(hasMapMatch(["main"], [MapId.Main])).toBe(true);
        expect.soft(hasMapMatch(["main"], MapId.Main)).toBe(true);

        expect.soft(hasMapMatch(["main"], [MapId.Faction])).toBe(false);
        expect.soft(hasMapMatch(["main"], MapId.Faction)).toBe(false);

        expect.soft(hasMapMatch(["main", "desert"], MapId.Main)).toBe(true);
        expect.soft(hasMapMatch(["main", "desert"], MapId.Woods)).toBe(false);

        expect.soft(hasMapMatch(["main"], [MapId.Main, MapId.Woods])).toBe(true);
        expect.soft(hasMapMatch(["main"], ["main", "woods"])).toBe(true);

        expect.soft(hasMapMatch(["woods_spring"], [MapId.Main, MapId.Woods])).toBe(true);
        expect.soft(hasMapMatch(["woods_spring"], ["main", "woods"])).toBe(false);

        expect.soft(hasMapMatch(["faction_potato"], [MapId.Main, MapId.Woods])).toBe(false);
        expect.soft(hasMapMatch(["faction_potato"], ["main", "woods"])).toBe(false);
    });

    test("matchesFilter", () => {
        expect.soft(matchesFilter("beach", "beach")).toBe(true);
        expect.soft(matchesFilter("beach", "desert")).toBe(false);
        expect.soft(matchesFilter("main", MapId.Main)).toBe(true);
        expect.soft(matchesFilter("woods", MapId.Main)).toBe(false);
        expect.soft(matchesFilter("woods", MapId.Woods)).toBe(true);
        expect.soft(matchesFilter("woods_spring", MapId.Woods)).toBe(true);
    });
});

describe("Event tests", () => {
    describe("'kill' event", () => {
        test("Correctly increments on kill", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_kills",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({});
            game.step(0.1);

            playerB.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });
            game.step(0.1);
            expect(playerA.questManager.quests[0].totalDelta).toBe(1);
        });

        test("Doesn't do anything for other people's kills", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_kills",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({});
            game.step(0.1);

            playerA.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerB,
                gameSourceType: "fists",
            });
            game.step(0.1);
            expect(playerA.questManager.quests[0].totalDelta).toBe(0);
        });
    });

    describe("'damage' event", () => {
        test("Uses net damage", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_damage",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({});
            playerB.chest = "chest02";
            playerB.helmet = "helmet02";
            game.step(0.1);

            playerB.damage({
                amount: 100,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });
            game.step(0.1);
            expect(playerA.questManager.quests[0].totalDelta).toBe(54.56);
        });

        test("Ignores overkill damage", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_damage",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({});
            playerB.chest = "chest02";
            playerB.helmet = "helmet02";
            game.step(0.1);

            playerB.damage({
                amount: 9999,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });
            game.step(0.1);
            expect(playerA.questManager.quests[0].totalDelta).toBe(100);
        });
    });

    describe("'survived' event", () => {
        test("Survived time on death", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_survived",
                    delta: 0,
                    totalDelta: 0,
                },
            ];

            expect(playerA.questManager.quests[0].totalDelta).toBe(0);

            game.step(10);
            playerA.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Airdrop,
                dir: v2.randomUnit(),
            });

            expect(playerA.questManager.quests[0].totalDelta).toBeCloseTo(10);
        });

        test("Survived time on win", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_survived",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({});

            game.step(15);
            expect(game.started).toBe(true);
            expect(playerA.questManager.quests[0].totalDelta).toBe(0);

            playerB.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Airdrop,
                dir: v2.randomUnit(),
            });

            expect(game.over).toBe(true);
            game.step(0.01);
            expect(Math.round(playerA.questManager.quests[0].totalDelta)).toBeCloseTo(15);
        });
    });

    describe("'placement' event", () => {
        test("Players shouldn't get placement progress for just disconnecting", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_top_solo",
                    delta: 0,
                    totalDelta: 0,
                },
            ];

            expect(playerA.questManager.quests[0].totalDelta).toBe(0);

            playerA.client.socket.close();

            // player leaving shouldn't count as progress
            expect(playerA.questManager.quests[0].totalDelta).toBe(0);
        });

        test("Solo placement success on win", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_top_solo",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({});

            // so the game starts
            playerA.timeAlive = 10;
            playerB.timeAlive = 10;
            game.step(0.1);
            expect(game.started).toBe(true);

            playerB.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });

            expect(game.over).toBe(true);
            game.step(0.1);

            expect(playerA.questManager.quests[0].totalDelta).toBe(1);
        });

        test("Solo placement success on death", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_top_solo",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            playerA.timeAlive = 10;

            for (let i = 0; i < 9; i++) {
                const p = game.playerBarn.addTestPlayer({});
                p.timeAlive = 10;
            }

            game.step(0.1);
            expect(game.started).toBe(true);

            playerA.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Gas,
                dir: v2.randomUnit(),
            });

            expect(playerA.questManager.quests[0].totalDelta).toBe(1);
        });

        test("Squad placement success on win", () => {
            const game = createGame(TeamMode.Squad, "test_normal");

            const groupA = game.playerBarn.addGroup(false);
            const playerA = game.playerBarn.addTestPlayer({ group: groupA, userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_top_squad",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({ group: groupA });
            playerA.timeAlive = 10;
            playerB.timeAlive = 10;

            const groupB = game.playerBarn.addGroup(false);
            const playerC = game.playerBarn.addTestPlayer({ group: groupB });
            playerC.timeAlive = 10;

            game.step(0.1);
            expect(game.started).toBe(true);

            playerC.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Airdrop,
                dir: v2.randomUnit(),
            });

            expect(game.over).toBe(true);
            game.step(0.1);

            expect(playerA.questManager.quests[0].totalDelta).toBe(1);
        });

        test("Squad placement success on death", () => {
            const game = createGame(TeamMode.Squad, "test_normal");

            const groupA = game.playerBarn.addGroup(false);
            const playerA = game.playerBarn.addTestPlayer({ group: groupA, userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_top_squad",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({ group: groupA });
            playerA.timeAlive = 10;
            playerB.timeAlive = 10;

            for (let i = 0; i < 4; i++) {
                const group = game.playerBarn.addGroup(false);
                const player = game.playerBarn.addTestPlayer({ group: group });
                player.timeAlive = 10;
            }

            game.step(0.1);
            expect(game.started).toBe(true);

            playerA.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Airdrop,
                dir: v2.randomUnit(),
            });
            expect(playerA.questManager.quests[0].totalDelta).toBe(0);

            playerB.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Airdrop,
                dir: v2.randomUnit(),
            });

            expect(playerA.questManager.quests[0].totalDelta).toBe(1);
        });

        // the same as above, but with one extra group so the rank doesn't fit the quest criteria
        test("Squad placement fail on death", () => {
            const game = createGame(TeamMode.Squad, "test_normal");

            const groupA = game.playerBarn.addGroup(false);
            const playerA = game.playerBarn.addTestPlayer({ group: groupA, userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_top_squad",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({ group: groupA });
            playerA.timeAlive = 10;
            playerB.timeAlive = 10;

            for (let i = 0; i < 5; i++) {
                const group = game.playerBarn.addGroup(false);
                const player = game.playerBarn.addTestPlayer({ group: group });
                player.timeAlive = 10;
            }

            game.step(0.1);
            expect(game.started).toBe(true);

            playerA.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Airdrop,
                dir: v2.randomUnit(),
            });
            expect(playerA.questManager.quests[0].totalDelta).toBe(0);

            playerB.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Airdrop,
                dir: v2.randomUnit(),
            });

            expect(playerA.questManager.quests[0].totalDelta).toBe(0);
        });
    });

    describe("'item_used' event", () => {
        test("Correct item usage is incremented only after the item is used", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_boost",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            game.step(0.1);

            const item = "soda";
            const def = GameObjectDefs.typeToDef(item, "boost");
            playerA.invManager.give(item, 1);
            playerA.useBoostItem(item);

            game.step(0.1);
            expect.soft(playerA.questManager.quests[0].totalDelta).toBe(0);

            game.step(def.useTime - 0.1);
            expect.soft(playerA.questManager.quests[0].totalDelta).toBe(1);
        });

        test("Incorrect item usage is ignored", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_boost",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            game.step(0.1);

            const item = "bandage";
            const def = GameObjectDefs.typeToDef(item, "heal");
            playerA.invManager.give(item, 1);
            playerA.useHealingItem(item);

            game.step(def.useTime);
            expect(playerA.questManager.quests[0].totalDelta).toBe(0);
        });

        test("Cancelled item usage is ignored", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_boost",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            game.step(0.1);

            const item = "soda";
            const def = GameObjectDefs.typeToDef(item, "boost");
            playerA.invManager.give(item, 1);
            playerA.useBoostItem(item);

            game.step(def.useTime / 2);
            playerA.cancelAction();

            game.step(def.useTime / 2);
            expect(playerA.questManager.quests[0].totalDelta).toBe(0);
        });
    });

    describe("'airdrop_unlocked' event", () => {
        test("Airdrops unlocked by player are tallied", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_airdrop",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            game.step(0.1);

            const airdrop = "airdrop_crate_01";
            const def = MapObjectDefs.typeToDef(airdrop, "obstacle");
            const obstacle = game.map.genObstacle(airdrop, v2.create(0, 0));
            expect(def.button).not.toBeUndefined();
            obstacle.interact(playerA);
            game.step(def.button!.useDelay);

            expect(playerA.questManager.quests[0].totalDelta).toBe(1);
        });

        test("Airdrops not unlocked by player aren't tallied", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_airdrop",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            game.step(0.1);

            const airdrop = "airdrop_crate_01";
            const def = MapObjectDefs.typeToDef(airdrop, "obstacle");
            const obstacle = game.map.genObstacle(airdrop, v2.create(0, 0));
            expect(def.button).not.toBeUndefined();
            obstacle.interact();
            game.step(def.button!.useDelay);

            expect(playerA.questManager.quests[0].totalDelta).toBe(0);
        });
    });

    describe("'destruction' event", () => {
        test("Obstacle destroyed by gun, melee, grenade, or traceable explosion all count", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_crates",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            playerA.weaponManager.setWeapon(WeaponSlot.Primary, "sv98", 10);
            playerA.invManager.set("frag", 1);
            playerA.invManager.set("potato", 1);
            game.step(0.1);

            const crate = "crate_01";
            const obstacle1 = game.map.genObstacle(crate, v2.create(0, 0));

            {
                // gun
                obstacle1.damage({
                    amount: 9999,
                    damageType: DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    gameSourceType: "sv98",
                });

                game.update(0.1);
                expect.soft(obstacle1.dead).toBe(true);
            }

            const obstacle2 = game.map.genObstacle(crate, v2.create(100, 100));
            obstacle2.damage({ amount: obstacle2.health - 1, damageType: DamageType.Player, dir: v2.create(1, 0) });

            {
                // melee
                obstacle2.damage({
                    amount: 9999,
                    damageType: DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    gameSourceType: "fists",
                });
                game.update(0.1);
                expect.soft(obstacle2.dead).toBe(true);
            }

            const obstacle3 = game.map.genObstacle(crate, v2.create(200, 200));
            obstacle3.damage({ amount: obstacle3.health - 1, damageType: DamageType.Player, dir: v2.create(1, 0) });

            {
                // explosion
                obstacle3.damage({
                    amount: 9999,
                    damageType: DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    isExplosion: true,
                    gameSourceType: "frag",
                    weaponSourceType: "frag",
                });

                game.step(0.1);
                expect.soft(obstacle3.dead).toBe(true);
            }

            const obstacle4 = game.map.genObstacle(crate, v2.create(300, 300));
            obstacle4.damage({ amount: obstacle3.health - 1, damageType: DamageType.Player, dir: v2.create(1, 0) });

            {
                // throwable
                obstacle4.damage({
                    amount: 9999,
                    damageType: DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    gameSourceType: "frag",
                    weaponSourceType: "frag",
                    mapSourceType: "",
                });
                expect.soft(obstacle4.dead).toBe(true);
            }

            const obstacle5 = game.map.genObstacle(crate, v2.create(400, 400));
            obstacle5.damage({ amount: obstacle3.health - 1, damageType: DamageType.Player, dir: v2.create(1, 0) });

            {
                // airstrike
                game.planeBarn.addAirStrike(v2.create(390, 400), v2.create(1, 0), playerA.playerId);

                game.step(5);
                expect.soft(obstacle5.dead).toBe(true);
            }

            expect(playerA.questManager.quests[0].totalDelta).toBe(5);
        });

        test("Obstacle destroyed by anything else don't count", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_crates",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            game.step(0.1);

            const crate = "crate_01";
            const obstacle1 = game.map.genObstacle(crate, v2.create(0, 0));

            {
                // player but no source
                obstacle1.damage({ amount: 9999, damageType: DamageType.Player, dir: v2.create(1, 0) });
                game.update(0.1);
                expect.soft(obstacle1.dead).toBe(true);
            }

            const obstacle2 = game.map.genObstacle(crate, v2.create(100, 100));
            obstacle2.damage({ amount: obstacle2.health - 1, damageType: DamageType.Player, dir: v2.create(1, 0) });

            {
                // airdrop but no source
                obstacle2.damage({ amount: 9999, damageType: DamageType.Airdrop, dir: v2.create(1, 0) });
                game.update(0.1);
                expect.soft(obstacle1.dead).toBe(true);
            }

            expect(playerA.questManager.quests[0].totalDelta).toBe(0);
        });
    });

    describe("'promote' event", () => {
        test("Promotion to correct role is always tallied, even in the same game", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_promote_hunted",
                    delta: 0,
                    totalDelta: 0,
                },
            ];

            playerA.promoteToRole("the_hunted");
            game.step(0.1);

            expect(playerA.questManager.quests[0].totalDelta).toBe(1);

            playerA.removeRole();
            playerA.promoteToRole("the_hunted");
            expect(playerA.questManager.quests[0].totalDelta).toBe(2);
        });

        test("Promotion to incorrect role is ignored", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_promote_hunted",
                    delta: 0,
                    totalDelta: 0,
                },
            ];

            playerA.promoteToRole("leader");
            game.step(0.1);

            expect(playerA.questManager.quests[0].totalDelta).toBe(0);
        });
    });

    describe("'be_mvp' event", () => {
        test("Being MVP is tallied", () => {
            const game = createGame(TeamMode.Solo, "test_faction");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_be_mvp",
                    delta: 0,
                    totalDelta: 0,
                },
            ];

            const orig = game.modeManager.getFactionMvp;
            game.modeManager.getFactionMvp = () => playerA;

            game.started = true;
            game.checkGameOver();
            game.step(0.1);

            expect(game.over).toBe(true);
            expect(playerA.questManager.quests[0].totalDelta).toBe(1);

            game.modeManager.getFactionMvp = orig;
        });
    });
});

describe("Filter tests", () => {
    describe("'team_mode' filter", () => {
        test("Tallied correctly when mode matches", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_top_solo",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({});

            // so the game starts
            playerA.timeAlive = 10;
            playerB.timeAlive = 10;
            game.step(0.1);
            expect(game.started).toBe(true);

            playerB.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });

            expect(game.over).toBe(true);
            game.step(0.1);

            expect(playerA.questManager.quests[0].totalDelta).toBe(1);
        });

        test("Ignored when mode doesn't match", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_top_duo",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({});

            // so the game starts
            playerA.timeAlive = 10;
            playerB.timeAlive = 10;
            game.step(0.1);
            expect(game.started).toBe(true);

            playerB.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });

            expect(game.over).toBe(true);
            game.step(0.1);

            expect(playerA.questManager.quests[0].totalDelta).toBe(0);
        });
    });

    describe("'max_rank' filter", () => {
        test("Solo placement success on death", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_top_solo",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            playerA.timeAlive = 10;

            for (let i = 0; i < 9; i++) {
                const p = game.playerBarn.addTestPlayer({});
                p.timeAlive = 10;
            }

            game.step(0.1);
            expect(game.started).toBe(true);

            playerA.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Gas,
                dir: v2.randomUnit(),
            });

            expect(playerA.questManager.quests[0].totalDelta).toBe(1);
        });

        // the same as above, but with one extra player so the rank doesn't fit the quest criteria
        test("Solo placement test fail on death", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_top_solo",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            playerA.timeAlive = 10;

            for (let i = 0; i < 10; i++) {
                const p = game.playerBarn.addTestPlayer({});
                p.timeAlive = 10;
            }

            game.step(0.1);
            expect(game.started).toBe(true);

            playerA.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Gas,
                dir: v2.randomUnit(),
            });

            expect(playerA.questManager.quests[0].totalDelta).toBe(0);
        });
    });

    describe("'building' filter", () => {
        test("Only kills in the building are counted", () => {
            const game = createGame(TeamMode.Solo, "test_normal");
            game.map.genBuilding("club_complex_01", game.map.center, 0, 0);

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_club_kills",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({});
            game.step(0.1);

            // main building
            playerB.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });
            game.step(0.1);
            expect(playerA.questManager.quests[0].totalDelta).toBe(1);

            // side rooms
            const bathHouseRock = game.map.obstacles.find((b) => b.type === "bathhouse_rocks_01");
            expect(bathHouseRock).toBeDefined();

            const playerC = game.playerBarn.addTestPlayer({
                pos: bathHouseRock!.pos,
            });
            v2.set(playerA.pos, bathHouseRock!.pos);
            playerA.layer = bathHouseRock!.layer;
            playerC.layer = bathHouseRock!.layer;
            game.step(0.1);

            playerC.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });
            expect(playerA.questManager.quests[0].totalDelta).toBe(2);

            const outsideClub = v2.create(300, 300);
            const playerD = game.playerBarn.addTestPlayer({
                pos: outsideClub,
            });
            v2.set(playerA.pos, bathHouseRock!.pos);
            playerA.layer = 0;
            game.step(0.1);

            playerD.damage({
                amount: 999,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });
            expect(playerA.questManager.quests[0].totalDelta).toBe(2);
        });
    });

    describe("'role' filter", () => {
        test("Only counts actions when the user has the given role", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_damage_woods_king",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            const playerB = game.playerBarn.addTestPlayer({});
            game.step(0.1);

            playerB.damage({
                amount: 10,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });
            game.step(0.1);

            playerA.promoteToRole("woods_king");

            playerB.damage({
                amount: 10,
                damageType: GameConfig.DamageType.Player,
                dir: v2.randomUnit(),
                source: playerA,
                gameSourceType: "fists",
            });
            game.step(0.1);

            expect(playerA.questManager.quests[0].totalDelta).toBe(10);
        });
    });

    describe("'weapon' filter", () => {
        describe("weaponClass 'gun'", () => {
            // mfw no quest exists that has either "no gun, no ammo" or "gun id"
            // so can't test those configurations of the filter

            test("ammo filter", () => {
                const game = createGame(TeamMode.Solo, "test_normal");

                const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
                playerA.questManager.quests = [
                    {
                        id: "quest_damage_9mm",
                        delta: 0,
                        totalDelta: 0,
                    },
                ];
                const playerB = game.playerBarn.addTestPlayer({});
                game.step(0.1);

                playerB.damage({
                    amount: 10,
                    damageType: GameConfig.DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    gameSourceType: "mac10",
                });
                game.step(0.1);

                expect(playerA.questManager.quests[0].totalDelta).toBe(10);

                playerB.damage({
                    amount: 10,
                    damageType: GameConfig.DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    gameSourceType: "m416",
                });
                game.step(0.1);

                expect(playerA.questManager.quests[0].totalDelta).toBe(10);

                playerB.damage({
                    amount: 10,
                    damageType: GameConfig.DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    gameSourceType: "fists",
                });
                game.step(0.1);

                expect(playerA.questManager.quests[0].totalDelta).toBe(10);
            });
        });

        describe("weaponClass 'melee'", () => {
            // no existing quest to test type filter

            test("no filter counts all melee damage", () => {
                const game = createGame(TeamMode.Solo, "test_normal");

                const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
                playerA.questManager.quests = [
                    {
                        id: "quest_damage_melee",
                        delta: 0,
                        totalDelta: 0,
                    },
                ];
                const playerB = game.playerBarn.addTestPlayer({});
                game.step(0.1);

                playerB.damage({
                    amount: 10,
                    damageType: GameConfig.DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    gameSourceType: "mac10",
                });
                game.step(0.1);

                expect(playerA.questManager.quests[0].totalDelta).toBe(0);

                playerB.damage({
                    amount: 10,
                    damageType: GameConfig.DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    gameSourceType: "fists",
                });
                game.step(0.1);

                expect(playerA.questManager.quests[0].totalDelta).toBe(10);

                playerB.damage({
                    amount: 10,
                    damageType: GameConfig.DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    gameSourceType: "katana",
                });
                game.step(0.1);

                expect(playerA.questManager.quests[0].totalDelta).toBe(20);
            });
        });

        describe("weaponClass 'throwable'", () => {
            // no existing quest to test type filter

            test("no filter counts all throwable damage", () => {
                const game = createGame(TeamMode.Solo, "test_normal");

                const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
                playerA.questManager.quests = [
                    {
                        id: "quest_damage_grenade",
                        delta: 0,
                        totalDelta: 0,
                    },
                ];
                const playerB = game.playerBarn.addTestPlayer({});
                game.step(0.1);

                playerB.damage({
                    amount: 10,
                    damageType: GameConfig.DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    isExplosion: true,
                    gameSourceType: "frag",
                    weaponSourceType: "frag",
                });
                game.step(0.1);

                expect(playerA.questManager.quests[0].totalDelta).toBe(10);

                playerB.damage({
                    amount: 10,
                    damageType: GameConfig.DamageType.Airstrike,
                    dir: v2.randomUnit(),
                    source: playerA,
                    isExplosion: true,
                    gameSourceType: "bomb_iron",
                    weaponSourceType: "strobe",
                });
                game.step(0.1);

                expect(playerA.questManager.quests[0].totalDelta).toBe(20);

                playerB.damage({
                    amount: 10,
                    damageType: GameConfig.DamageType.Player,
                    dir: v2.randomUnit(),
                    source: playerA,
                    gameSourceType: "katana",
                });
                game.step(0.1);

                expect(playerA.questManager.quests[0].totalDelta).toBe(20);
            });
        });
    });

    describe("'obstacle' filter", () => {
        test("subtype 'category' -> only tallies obstacles in the category (-ies)", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_crates",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            game.step(0.1);

            const destroyObstacle = (type: string) => {
                const obstacle1 = game.map.genObstacle(type, v2.create(0, 0));

                obstacle1.damage({
                    amount: 999,
                    dir: v2.randomUnit(),
                    damageType: GameConfig.DamageType.Player,
                    source: playerA,
                    weaponSourceType: "fists",
                });
                game.step(0.1);
            };

            destroyObstacle("crate_01");
            expect(playerA.questManager.quests[0].totalDelta).toBe(1);

            destroyObstacle("tree_01");
            expect(playerA.questManager.quests[0].totalDelta).toBe(1);

            destroyObstacle("crate_02f");
            expect(playerA.questManager.quests[0].totalDelta).toBe(2);
        });

        test("subtype 'type' -> only tallies obstacles the type(s)", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_airdrop_rare",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            game.step(0.1);

            const unlockAirdrop = (type: string) => {
                const def = MapObjectDefs.typeToDef(type, "obstacle");
                const obstacle = game.map.genObstacle(type, v2.create(0, 0));
                expect(def.button).not.toBeUndefined();
                obstacle.interact(playerA);
                game.step(def.button!.useDelay);
            };

            unlockAirdrop("airdrop_crate_02de");
            expect(playerA.questManager.quests[0].totalDelta).toBe(1);

            unlockAirdrop("airdrop_crate_01");
            expect(playerA.questManager.quests[0].totalDelta).toBe(1);

            unlockAirdrop("airdrop_crate_05");
            expect(playerA.questManager.quests[0].totalDelta).toBe(2);
        });
    });

    describe("'item' filter", () => {
        test("subtype 'category' -> only tallies items in the category (-ies)", () => {
            const game = createGame(TeamMode.Solo, "test_normal");

            const playerA = game.playerBarn.addTestPlayer({ userId: "meow" });
            playerA.questManager.quests = [
                {
                    id: "quest_boost",
                    delta: 0,
                    totalDelta: 0,
                },
            ];
            game.step(0.1);

            playerA.doAction("soda", GameConfig.Action.UseItem, 0.1);
            game.step(0.1);
            expect(playerA.questManager.quests[0].totalDelta).toBe(1);

            playerA.doAction("bandage", GameConfig.Action.UseItem, 0.1);
            game.step(0.1);
            expect(playerA.questManager.quests[0].totalDelta).toBe(1);

            playerA.doAction("painkiller", GameConfig.Action.UseItem, 0.1);
            game.step(0.1);
            expect(playerA.questManager.quests[0].totalDelta).toBe(2);
        });

        // no quest uses subtype 'type'
    });
});

describe("Quest definition tests", () => {
    describe.for(Object.entries(QuestDefs))("Quest %s", ([, quest]) => {
        expect(quest.xp).toBeGreaterThan(0);
        expect(quest.target).toBeGreaterThan(0);

        if (quest.filters === undefined || quest.filters.length === 0) {
            test("(no filters)", () => {});
        } else {
            expect(quest.filters.map(f => f.type)).toHaveNoDuplicates();

            test.for(quest.filters.map(f => [f, f.type] as const))("Filter $1", ([filter]) => {
                switch (filter.type) {
                    case "building": {
                        expect(filter.buildingType, "Building types should exist")
                            .toEitherSatisfyOrAllSatisfy(type => {
                                return predicates.toBeValidMapObj(type, "building");
                            });
                        break;
                    }
                    case "item": {
                        if (filter.subType !== "type") break;

                        expect(filter.itemType, "Item types should exist")
                            .toEitherSatisfyOrAllSatisfy(type => {
                                return predicates.toBeValidGameObj(type, ["boost", "heal"]);
                            });
                        break;
                    }
                    case "max_rank": {
                        expect(filter.maxRank).toBeGreaterThan(0);
                        break;
                    }
                    case "obstacle": {
                        if (filter.subType === "type") {
                            expect(filter.obstacleType, "Obstacle types should exist")
                                .toEitherSatisfyOrAllSatisfy(type => {
                                    return predicates.toBeValidMapObj(type, "obstacle");
                                });
                        } else {
                            expect(filter.obstacleCategory, "Obstacle category should match at least 1 obstacle")
                                .toEitherSatisfyOrAllSatisfy(category => {
                                    return allObstacleCategories.includes(category);
                                });
                        }
                        break;
                    }
                    case "role": {
                        expect(filter.role, "Role should exist")
                            .toEitherSatisfyOrAllSatisfy(role => Object.hasOwn(RoleDefs, role));
                        break;
                    }
                    case "team_mode": {
                        // nothing to validate
                        break;
                    }
                    case "weapon": {
                        if (filter.weaponType !== undefined) {
                            expect(filter.weaponType).toBeValidGameObj(filter.weaponClass);
                        }

                        if (filter.weaponClass === "gun") {
                            if (filter.ammo !== undefined) {
                                expect(filter.ammo)
                                    .toEitherSatisfyOrAllSatisfy(type => {
                                        return predicates.toBeValidGameObj(type, "ammo");
                                    });
                            }

                            expect(
                                filter.weaponType === undefined,
                                "Only one of weaponType or ammo should be specified",
                            ).not.toBe(filter.ammo === undefined);
                        }
                        break;
                    }
                    default: {
                        expect(false, `Unhandled filter type '${(filter as { type: string }).type}'`).toBe(true);
                    }
                }
            });
        }
    });
});
