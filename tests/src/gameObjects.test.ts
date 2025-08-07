import { describe, expect, test } from "vitest";
import { BulletDefs } from "../../shared/defs/gameObjects/bulletDefs";
import { GunDefs } from "../../shared/defs/gameObjects/gunDefs";
import { GameConfig } from "../../shared/gameConfig";

import "./testHelpers";
import { ExplosionDefs } from "../../shared/defs/gameObjects/explosionsDefs";
import { ThrowableDefs } from "../../shared/defs/gameObjects/throwableDefs";

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
