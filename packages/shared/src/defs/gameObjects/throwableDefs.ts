import type { Vec2 } from "../../utils/v2";

export interface ThrowableDef {
    readonly type: "throwable";
    name: string;
    quality: number;
    explosionType: string;
    inventoryOrder: number;
    cookable: boolean;
    explodeOnImpact: boolean;
    playerCollision: boolean;
    fuseTime: number;
    aimDistance: number;
    rad: number;
    throwPhysics: {
        playerVelMult: number;
        velZ: number;
        speed: number;
        spinVel: number;
        spinDrag: number;
        fixedCollisionHeight?: number;
        randomizeSpinDir?: boolean;
    };
    speed: {
        equip: number;
        attack: number;
    };
    lootImg: {
        sprite: string;
        tint: number;
        border: "loot-circle-outer-01.img";
        borderTint: number;
        scale: number;
        rot?: number;
        mirror?: boolean;
    };
    worldImg: {
        sprite: string;
        scale: number;
        tint: number;
    };
    handImg?: Record<string, { right: Cook; left: Cook }>;
    useThrowParticles: boolean;
    sound: {
        pullPin: string;
        throwing: string;
        pickup: string;
        deploy: string;
    };
    strikeDelay?: number;
    freezeOnImpact?: boolean;
    heavyType?: string;
    changeTime?: number; // after changeTime has elapsed, throwable is changed to its "heavyType" variant
    forceMaxThrowDistance?: boolean;
    emoteId?: number;
    noPotatoSwap?: boolean;
    destroyNonCollidables?: boolean;
    trail?: {
        maxLength: number;
        width: number;
        alpha: number;
        tint: number;
    };
    fuseVariance?: number;
    numSplit?: number;
    splitType?: string;
}

export interface Cook {
    sprite: string;
    pos?: Vec2;
    scale?: number;
}

export const ThrowableDefs: Record<string, ThrowableDef> = {
    frag: {
        name: "Frag Grenade",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_frag",
        inventoryOrder: 1,
        cookable: true,
        explodeOnImpact: false,
        playerCollision: false,
        fuseTime: 4,
        aimDistance: 0,
        rad: 1,
        throwPhysics: {
            playerVelMult: 0.6,
            velZ: 5,
            speed: 20,
            spinVel: 10 * Math.PI,
            spinDrag: 1,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-frag.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-frag-nopin-nolever-01.img",
            scale: 0.12,
            tint: 0xffffff,
        },
        handImg: {
            equip: {
                right: {
                    sprite: "proj-frag-pin-01.img",
                    pos: { x: 4.2, y: 4.2 },
                    scale: 0.14,
                },
                left: { sprite: "none" },
            },
            cook: {
                right: {
                    sprite: "proj-frag-nopin-01.img",
                    pos: { x: 4.2, y: 4.2 },
                    scale: 0.14,
                },
                left: {
                    sprite: "proj-frag-pin-part.img",
                    pos: { x: 4.2, y: 4.2 },
                    scale: 0.14,
                },
            },
            throwing: {
                right: { sprite: "none" },
                left: { sprite: "none" },
            },
        },
        useThrowParticles: true,
        sound: {
            pullPin: "frag_pin_01",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
    },
    mirv: {
        name: "MIRV Grenade",
        type: "throwable",
        quality: 1,
        explosionType: "explosion_mirv",
        inventoryOrder: 2,
        cookable: true,
        explodeOnImpact: false,
        playerCollision: false,
        fuseTime: 4,
        aimDistance: 0,
        rad: 1,
        throwPhysics: {
            playerVelMult: 0.6,
            velZ: 5,
            speed: 20,
            spinVel: 10 * Math.PI,
            spinDrag: 1,
        },
        numSplit: 6,
        splitType: "mirv_mini",
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-mirv.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-mirv-nopin-nolever.img",
            scale: 0.13,
            tint: 0xffffff,
        },
        handImg: {
            equip: {
                right: {
                    sprite: "proj-mirv-pin.img",
                    pos: { x: 4.2, y: 4.2 },
                    scale: 0.15,
                },
                left: { sprite: "none" },
            },
            cook: {
                right: {
                    sprite: "proj-mirv-nopin.img",
                    pos: { x: 4.2, y: 4.2 },
                    scale: 0.15,
                },
                left: {
                    sprite: "proj-frag-pin-part.img",
                    pos: { x: 4.2, y: 4.2 },
                    scale: 0.15,
                },
            },
            throwing: {
                right: { sprite: "none" },
                left: { sprite: "none" },
            },
        },
        useThrowParticles: true,
        sound: {
            pullPin: "frag_pin_01",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
    },
    mirv_mini: {
        name: "MIRV Grenade",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_mirv_mini",
        inventoryOrder: 99,
        cookable: true,
        noPotatoSwap: true,
        explodeOnImpact: false,
        playerCollision: false,
        fuseTime: 1.8,
        fuseVariance: 0.3,
        aimDistance: 0,
        rad: 1,
        throwPhysics: {
            playerVelMult: 0.6,
            velZ: 5,
            speed: 20,
            spinVel: 10 * Math.PI,
            spinDrag: 1,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-frag.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-mirv-mini-01.img",
            scale: 0.12,
            tint: 0xffffff,
        },
        useThrowParticles: true,
        sound: {
            pullPin: "frag_pin_01",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
    },
    martyr_nade: {
        name: "Martyrdom",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_martyr_nade",
        inventoryOrder: 99,
        cookable: true,
        noPotatoSwap: true,
        explodeOnImpact: false,
        playerCollision: false,
        fuseTime: 3,
        fuseVariance: 0.3,
        aimDistance: 0,
        rad: 1,
        throwPhysics: {
            playerVelMult: 0.6,
            velZ: 5,
            speed: 20,
            spinVel: 10 * Math.PI,
            spinDrag: 1,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-frag.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-martyrdom-01.img",
            scale: 0.12,
            tint: 0xffffff,
        },
        useThrowParticles: true,
        sound: {
            pullPin: "frag_pin_01",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
    },
    smoke: {
        name: "Smoke Grenade",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_smoke",
        inventoryOrder: 3,
        cookable: false,
        explodeOnImpact: false,
        playerCollision: false,
        fuseTime: 2.5,
        aimDistance: 0,
        rad: 1,
        throwPhysics: {
            playerVelMult: 0.6,
            velZ: 5,
            speed: 15,
            spinVel: 10 * Math.PI,
            spinDrag: 1,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-smoke.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-smoke-nopin-nolever.img",
            scale: 0.12,
            tint: 0xffffff,
        },
        handImg: {
            equip: {
                right: {
                    sprite: "proj-smoke-pin.img",
                    pos: { x: 3, y: 4.2 },
                    scale: 0.14,
                },
                left: { sprite: "none" },
            },
            cook: {
                right: {
                    sprite: "proj-smoke-nopin.img",
                    pos: { x: 3, y: 4.2 },
                    scale: 0.14,
                },
                left: {
                    sprite: "proj-frag-pin-part.img",
                    pos: { x: 3, y: 4.2 },
                    scale: 0.14,
                },
            },
            throwing: {
                right: { sprite: "none" },
                left: { sprite: "none" },
            },
        },
        useThrowParticles: true,
        sound: {
            pullPin: "frag_pin_01",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
    },
    strobe: {
        name: "IR Strobe",
        type: "throwable",
        quality: 1,
        explosionType: "explosion_strobe",
        inventoryOrder: 3,
        cookable: false,
        explodeOnImpact: false,
        playerCollision: false,
        fuseTime: 13.5,
        strikeDelay: 3, // Changed this from 2.5 to 3, but it might have been used somewhere else
        aimDistance: 0,
        rad: 1,
        throwPhysics: {
            playerVelMult: 0.6,
            velZ: 5,
            speed: 25,
            spinVel: 6 * Math.PI,
            spinDrag: 1,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-strobe.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-strobe-armed.img",
            scale: 0.12,
            tint: 0xffffff,
        },
        handImg: {
            equip: {
                right: {
                    sprite: "proj-strobe-unarmed.img",
                    pos: { x: 3, y: 4.2 },
                    scale: 0.14,
                },
                left: { sprite: "none" },
            },
            cook: {
                right: {
                    sprite: "proj-strobe-arming.img",
                    pos: { x: 3, y: 4.2 },
                    scale: 0.14,
                },
                left: {
                    sprite: "",
                    pos: { x: 3, y: 4.2 },
                    scale: 0.14,
                },
            },
            throwing: {
                right: { sprite: "none" },
                left: { sprite: "none" },
            },
        },
        useThrowParticles: false,
        sound: {
            pullPin: "strobe_click_01",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
    },
    snowball: {
        name: "Snowball",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_snowball",
        heavyType: "snowball_heavy",
        changeTime: 1,
        inventoryOrder: 0,
        cookable: true,
        noPotatoSwap: true,
        forceMaxThrowDistance: true,
        explodeOnImpact: true,
        playerCollision: true,
        fuseTime: 9999,
        aimDistance: 32,
        rad: 1,
        throwPhysics: {
            playerVelMult: 0,
            velZ: 3.35,
            speed: 40,
            spinVel: 10 * Math.PI,
            spinDrag: 1,
            fixedCollisionHeight: 0.25,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-snowball.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-snowball-01.img",
            scale: 0.12,
            tint: 0xffffff,
        },
        handImg: {
            equip: {
                right: {
                    sprite: "proj-snowball-01.img",
                    pos: { x: 3, y: 4.2 },
                    scale: 0.14,
                },
                left: { sprite: "none" },
            },
            cook: {
                right: {
                    sprite: "proj-snowball-01.img",
                    pos: { x: 3, y: 4.2 },
                    scale: 0.14,
                },
                left: { sprite: "none" },
            },
            throwing: {
                right: { sprite: "none" },
                left: { sprite: "none" },
            },
        },
        useThrowParticles: false,
        sound: {
            pullPin: "",
            throwing: "frag_throw_01",
            pickup: "snowball_pickup_01",
            deploy: "frag_deploy_01",
        },
    },
    snowball_heavy: {
        name: "Snowball",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_snowball_heavy",
        inventoryOrder: 0,
        cookable: true,
        noPotatoSwap: true,
        forceMaxThrowDistance: true,
        explodeOnImpact: true,
        playerCollision: true,
        fuseTime: 9999,
        aimDistance: 32,
        rad: 1.25,
        throwPhysics: {
            playerVelMult: 0,
            velZ: 3.35,
            speed: 45,
            spinVel: 10 * Math.PI,
            spinDrag: 1,
            fixedCollisionHeight: 0.25,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-snowball.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-snowball-02.img",
            scale: 0.2,
            tint: 0xffffff,
        },
        handImg: {},
        useThrowParticles: false,
        sound: {
            pullPin: "",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
    },
    potato: {
        name: "Potato",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_potato",
        freezeOnImpact: true,
        heavyType: "potato_heavy",
        changeTime: 1,
        inventoryOrder: 0,
        cookable: true,
        forceMaxThrowDistance: true,
        explodeOnImpact: true,
        playerCollision: true,
        fuseTime: 9999,
        aimDistance: 32,
        rad: 1,
        throwPhysics: {
            playerVelMult: 0,
            velZ: 3.35,
            speed: 40,
            spinVel: 10 * Math.PI,
            spinDrag: 1,
            fixedCollisionHeight: 0.25,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-potato.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-potato-01.img",
            scale: 0.12,
            tint: 0xffffff,
        },
        handImg: {
            equip: {
                right: {
                    sprite: "proj-potato-01.img",
                    pos: { x: 3, y: 4.2 },
                    scale: 0.14,
                },
                left: { sprite: "none" },
            },
            cook: {
                right: {
                    sprite: "proj-potato-01.img",
                    pos: { x: 3, y: 4.2 },
                    scale: 0.14,
                },
                left: { sprite: "none" },
            },
            throwing: {
                right: { sprite: "none" },
                left: { sprite: "none" },
            },
        },
        useThrowParticles: false,
        sound: {
            pullPin: "",
            throwing: "frag_throw_01",
            pickup: "potato_pickup_01",
            deploy: "frag_deploy_01",
        },
        emoteId: 210,
    },
    potato_heavy: {
        name: "Potato",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_potato_heavy",
        inventoryOrder: 0,
        noPotatoSwap: true,
        cookable: true,
        forceMaxThrowDistance: true,
        explodeOnImpact: true,
        playerCollision: true,
        fuseTime: 9999,
        aimDistance: 32,
        rad: 1.25,
        throwPhysics: {
            playerVelMult: 0,
            velZ: 3.35,
            speed: 45,
            spinVel: 10 * Math.PI,
            spinDrag: 1,
            fixedCollisionHeight: 0.25,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-potato.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-potato-02.img",
            scale: 0.2,
            tint: 0xffffff,
        },
        handImg: {},
        useThrowParticles: false,
        sound: {
            pullPin: "",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
    },
    potato_cannonball: {
        name: "Potato Cannon",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_potato_cannonball",
        inventoryOrder: 0,
        noPotatoSwap: true,
        cookable: true,
        forceMaxThrowDistance: true,
        explodeOnImpact: true,
        destroyNonCollidables: true,
        playerCollision: true,
        fuseTime: 999,
        aimDistance: 32,
        rad: 1,
        throwPhysics: {
            playerVelMult: 0,
            velZ: 3,
            speed: 65,
            spinVel: 5 * Math.PI,
            spinDrag: 1,
            fixedCollisionHeight: 0.25,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-potato.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-potato-02.img",
            scale: 0.2,
            tint: 0xffffff,
        },
        handImg: {},
        useThrowParticles: false,
        sound: {
            pullPin: "",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
        trail: {
            maxLength: 25,
            width: 2.8,
            alpha: 1,
            tint: 0x5a4636,
        },
    },
    potato_smgshot: {
        name: "Spud Gun",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_potato_smgshot",
        inventoryOrder: 0,
        noPotatoSwap: true,
        cookable: true,
        forceMaxThrowDistance: true,
        explodeOnImpact: true,
        destroyNonCollidables: true,
        playerCollision: true,
        fuseTime: 999,
        aimDistance: 32,
        rad: 0.1,
        throwPhysics: {
            playerVelMult: 0,
            velZ: 3,
            speed: 85,
            spinVel: 9 * Math.PI,
            spinDrag: 1,
            fixedCollisionHeight: 0.25,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-potato.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-wedge-01.img",
            scale: 0.075,
            tint: 0xffffff,
        },
        handImg: {},
        useThrowParticles: false,
        sound: {
            pullPin: "",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
        trail: {
            maxLength: 40,
            width: 2.8,
            alpha: 1,
            tint: 0x5a5636,
        },
    },
    bomb_iron: {
        name: "Iron Bomb",
        type: "throwable",
        quality: 0,
        explosionType: "explosion_bomb_iron",
        inventoryOrder: 1,
        cookable: true,
        noPotatoSwap: true,
        // HACK: force constant velocity until we figure out how surviv's airstrike bomb velocity really worked
        forceMaxThrowDistance: true,
        explodeOnImpact: true,
        playerCollision: false,
        fuseTime: 4,
        aimDistance: 0,
        rad: 1,
        throwPhysics: {
            playerVelMult: 0.6,
            velZ: 0,
            speed: 20,
            spinVel: 1 * Math.PI,
            spinDrag: 1,
            randomizeSpinDir: true,
        },
        speed: { equip: 0, attack: 0 },
        lootImg: {
            sprite: "loot-throwable-frag.img",
            tint: 0xff00,
            border: "loot-circle-outer-01.img",
            borderTint: 0,
            scale: 0.2,
        },
        worldImg: {
            sprite: "proj-bomb-iron-01.img",
            scale: 0.12,
            tint: 0xffffff,
        },
        handImg: {},
        useThrowParticles: true,
        sound: {
            pullPin: "frag_pin_01",
            throwing: "frag_throw_01",
            pickup: "frag_pickup_01",
            deploy: "frag_deploy_01",
        },
    },
};
