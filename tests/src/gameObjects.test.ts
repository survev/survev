import { describe, expect, test } from "vitest";
import "./testHelpers.ts";

import { BulletDefs } from "../../shared/defs/gameObjects/bulletDefs.ts";
import { ExplosionDefs } from "../../shared/defs/gameObjects/explosionsDefs.ts";
import { GunDefs } from "../../shared/defs/gameObjects/gunDefs.ts";
import { QuestDefs } from "../../shared/defs/gameObjects/questDefs.ts";
import { RoleDefs } from "../../shared/defs/gameObjects/roleDefs.ts";
import { ThrowableDefs } from "../../shared/defs/gameObjects/throwableDefs.ts";
import { ObstacleDefs } from "../../shared/defs/mapObjects/obstacles/obstacleDefs.ts";
import { FactionTeam, GameConfig } from "../../shared/gameConfig.ts";
import { predicates } from "./testHelpers.ts";

describe.for(Object.entries(GunDefs))("Gun $0", ([, def]) => {
    test("Bullet", () => {
        expect(def.bulletType).toBeValidGameObj(["bullet"]);
    });

    if (def.dualWieldType) {
        test("Dual Wield", () => {
            expect(def.dualWieldType).toBeValidGameObj(["gun"]);
        });
    }

    if (!def.ammoInfinite && def.ammoSpawnCount) {
        test("Ammo type", () => {
            expect(def.ammo).toBeValidGameObj(["ammo"]);
        });
    }
});

describe.for(Object.entries(BulletDefs))("Bullet $0", ([, def]) => {
    if (def.onHit) {
        test("On Hit", () => {
            expect(def.onHit).toBeValidGameObj(["explosion"]);
        });
    }

    test("Tracer Color", () => {
        expect(GameConfig.tracerColors).toHaveProperty(def.tracerColor);
    });
});

describe.for(Object.entries(BulletDefs))("Bullet $0", ([, def]) => {
    if (def.onHit) {
        test("On Hit", () => {
            expect(def.onHit).toBeValidGameObj(["explosion"]);
        });
    }

    test("Tracer Color", () => {
        expect(GameConfig.tracerColors).toHaveProperty(def.tracerColor);
    });
});

describe.for(Object.entries(ExplosionDefs))("Explosion $0", ([, def]) => {
    if (def.shrapnelType) {
        test("Shrapnel", () => {
            expect(def.shrapnelType).toBeValidGameObj(["bullet"]);
        });
    }

    test("Decal", () => {
        expect(def.decalType).toBeValidMapObjOrNone(["decal"]);
    });
});

describe.for(Object.entries(ThrowableDefs))("Throwable $0", ([, def]) => {
    test("Explosion", () => {
        expect(def.explosionType).toBeValidGameObj(["explosion"]);
    });

    if (def.splitType) {
        test("Split", () => {
            expect(def.splitType).toBeValidGameObj(["throwable"]);
        });
    }
});

describe.for(Object.entries(ThrowableDefs))("Throwable $0", ([, def]) => {
    test("Explosion", () => {
        expect(def.explosionType).toBeValidGameObj(["explosion"]);
    });

    if (def.splitType) {
        test("Split", () => {
            expect(def.splitType).toBeValidGameObj(["throwable"]);
        });
    }
});

describe.for(Object.entries(RoleDefs))("Role $0", ([, def]) => {
    let hasTest = false;

    if (def.perks) {
        hasTest = true;

        test.for(def.perks)("Perk $0", {
            retry: 200,
        }, (perk) => {
            if (typeof perk === "string") {
                expect(perk).toBeValidLoot(["perk"]);
            } else {
                expect(perk()).toBeValidLoot(["perk"]);
            }
        });
    }

    if (def.defaultItems) {
        hasTest = true;

        describe("Items", () => {
            test.for(def.defaultItems!.weapons)("Weapon $0", {
                retry: 200,
            }, (weapon) => {
                if (typeof weapon === "object" && weapon.type) {
                    expect(weapon.type).toBeValidLoot();
                } else if (typeof weapon === "function") {
                    expect(weapon(FactionTeam.Red).type).toBeValidLoot();
                    expect(weapon(FactionTeam.Blue).type).toBeValidLoot();
                }
            });

            test("Items", () => {
                if (def.defaultItems!.backpack) {
                    expect(def.defaultItems?.backpack).toBeValidLoot(["backpack"]);
                }
                if (def.defaultItems!.helmet) {
                    const helmet = def.defaultItems!.helmet;
                    if (typeof helmet === "string") {
                        expect(helmet).toBeValidLoot(["helmet"]);
                    } else {
                        expect(helmet(FactionTeam.Red)).toBeValidLoot(["helmet"]);
                        expect(helmet(FactionTeam.Blue)).toBeValidLoot(["helmet"]);
                    }
                }
                if (def.defaultItems!.chest) {
                    expect(def.defaultItems?.chest).toBeValidLoot(["chest"]);
                }
                if (def.defaultItems!.outfit) {
                    const outfit = def.defaultItems!.outfit;
                    if (typeof outfit === "string") {
                        expect(outfit).toBeValidLoot(["outfit"]);
                    } else {
                        expect(outfit(FactionTeam.Red)).toBeValidLoot(["outfit"]);
                        expect(outfit(FactionTeam.Blue)).toBeValidLoot(["outfit"]);
                    }
                }
            });
        });
    }

    if (!hasTest) {
        // some roles have nothing to test... and vitest gets mad at that
        test("Type", () => {
            expect(def.type).toBe("role");
        });
    }
});

describe.for(Object.entries(QuestDefs))("Quest %s", ([, quest]) => {
    const allObstacleCategories = Object.values(ObstacleDefs).map(def => def.category).filter(cat => cat !== undefined);

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
                        .toAllSatisfy(type => {
                            return predicates.toBeValidMapObj(type, ["building"]);
                        });
                    break;
                }
                case "item": {
                    if (filter.subType !== "type") break;

                    expect(filter.itemType, "Item types should exist")
                        .toAllSatisfy(type => {
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
                            .toAllSatisfy(type => {
                                return predicates.toBeValidMapObj(type, ["obstacle"]);
                            });
                    } else {
                        expect(filter.obstacleCategory, "Obstacle category should match at least 1 obstacle")
                            .toAllSatisfy(category => {
                                return allObstacleCategories.includes(category);
                            });
                    }
                    break;
                }
                case "role": {
                    expect(filter.role, "Role should exist")
                        .toAllSatisfy(role => Object.hasOwn(RoleDefs, role));
                    break;
                }
                case "team_mode": {
                    // nothing to validate
                    break;
                }
                case "weapon": {
                    if (filter.weaponType !== undefined) {
                        expect(filter.weaponType).toBeValidGameObj([filter.weaponClass]);
                    }

                    if (filter.weaponClass === "gun") {
                        if (filter.ammo !== undefined) {
                            expect(filter.ammo)
                                .toAllSatisfy(type => {
                                    return predicates.toBeValidGameObj(type, ["ammo"]);
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
