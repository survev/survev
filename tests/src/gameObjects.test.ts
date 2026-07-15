import "./testHelpers.ts";
import { describe, expect, test } from "vitest";

import { BulletDefs } from "../../shared/defs/gameObjects/bulletDefs.ts";
import { ExplosionDefs } from "../../shared/defs/gameObjects/explosionsDefs.ts";
import { GunDefs } from "../../shared/defs/gameObjects/gunDefs.ts";
import { RoleDefs } from "../../shared/defs/gameObjects/roleDefs.ts";
import { ThrowableDefs } from "../../shared/defs/gameObjects/throwableDefs.ts";
import { FactionTeam, GameConfig } from "../../shared/gameConfig.ts";

describe.for(Object.entries(GunDefs))("Gun $0", ([, def]) => {
    test("Bullet", () => {
        expect(def.bulletType).toBeValidGameObj("bullet");
    });

    if (def.dualWieldType) {
        test("Dual Wield", () => {
            expect(def.dualWieldType).toBeValidGameObj("gun");
        });
    }

    if (!def.ammoInfinite && def.ammoSpawnCount) {
        test("Ammo type", () => {
            expect(def.ammo).toBeValidGameObj("ammo");
        });
    }
});

describe.for(Object.entries(BulletDefs))("Bullet $0", ([, def]) => {
    if (def.onHit) {
        test("On Hit", () => {
            expect(def.onHit).toBeValidGameObj("explosion");
        });
    }

    test("Tracer Color", () => {
        expect(GameConfig.tracerColors).toHaveProperty(def.tracerColor);
    });
});

describe.for(Object.entries(BulletDefs))("Bullet $0", ([, def]) => {
    if (def.onHit) {
        test("On Hit", () => {
            expect(def.onHit).toBeValidGameObj("explosion");
        });
    }

    test("Tracer Color", () => {
        expect(GameConfig.tracerColors).toHaveProperty(def.tracerColor);
    });
});

describe.for(Object.entries(ExplosionDefs))("Explosion $0", ([, def]) => {
    if (def.shrapnelType) {
        test("Shrapnel", () => {
            expect(def.shrapnelType).toBeValidGameObj("bullet");
        });
    }

    test("Decal", () => {
        expect(def.decalType).toBeValidMapObjOrNone("decal");
    });
});

describe.for(Object.entries(ThrowableDefs))("Throwable $0", ([, def]) => {
    test("Explosion", () => {
        expect(def.explosionType).toBeValidGameObj("explosion");
    });

    if (def.splitType) {
        test("Split", () => {
            expect(def.splitType).toBeValidGameObj("throwable");
        });
    }
});

describe.for(Object.entries(ThrowableDefs))("Throwable $0", ([, def]) => {
    test("Explosion", () => {
        expect(def.explosionType).toBeValidGameObj("explosion");
    });

    if (def.splitType) {
        test("Split", () => {
            expect(def.splitType).toBeValidGameObj("throwable");
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
                expect(perk).toBeValidLoot("perk");
            } else {
                expect(perk()).toBeValidLoot("perk");
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
                    expect(def.defaultItems?.backpack).toBeValidLoot("backpack");
                }
                if (def.defaultItems!.helmet) {
                    const helmet = def.defaultItems!.helmet;
                    if (typeof helmet === "string") {
                        expect(helmet).toBeValidLoot("helmet");
                    } else {
                        expect(helmet(FactionTeam.Red)).toBeValidLoot("helmet");
                        expect(helmet(FactionTeam.Blue)).toBeValidLoot("helmet");
                    }
                }
                if (def.defaultItems!.chest) {
                    expect(def.defaultItems?.chest).toBeValidLoot("chest");
                }
                if (def.defaultItems!.outfit) {
                    const outfit = def.defaultItems!.outfit;
                    if (typeof outfit === "string") {
                        expect(outfit).toBeValidLoot("outfit");
                    } else {
                        expect(outfit(FactionTeam.Red)).toBeValidLoot("outfit");
                        expect(outfit(FactionTeam.Blue)).toBeValidLoot("outfit");
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
