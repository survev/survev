import type { Collider } from "../../utils/coldet.ts";
import { collider } from "../../utils/collider.ts";
import { v2 } from "../../utils/v2.ts";
import type { TerrainSpawnDef } from "../mapObjectsTyping.ts";

export interface DecalDef {
    readonly type: "decal";
    collision: Collider;
    height: number;
    terrain?: TerrainSpawnDef;
    img: {
        sprite: string;
        scale: number;
        alpha: number;
        tint: number;
        zIdx: number;
        flicker?: boolean;
        flickerMin?: number;
        flickerMax?: number;
        flickerRate?: number;
        ignoreAdjust?: boolean;
    };
    lifetime?:
        | {
            min: number;
            max: number;
        }
        | number;
    fadeChance?: number;
    surface?: {
        type: string;
        data: {
            waterColor: number;
            rippleColor: number;
        };
    };
    gore?: {
        fade: {
            start: number;
            end: number;
            pow: number;
            speed: number;
        };
        tint?: number;
        alpha: number;
        waterColor?: number;
        rippleColor?: number;
    };
}

export const DecalDefs: Record<string, DecalDef> = {
    decal_barrel_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-barrel-res-01.img",
            scale: 0.24,
            alpha: 1,
            tint: 0,
            zIdx: 9,
        },
    },
    decal_frag_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-barrel-res-01.img",
            scale: 0.2,
            alpha: 0.8,
            tint: 0,
            zIdx: 11,
        },
    },
    decal_frag_small_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-barrel-res-01.img",
            scale: 0.12,
            alpha: 0.8,
            tint: 0x202020,
            zIdx: 11,
        },
    },
    decal_rounds_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        lifetime: { min: 2, max: 2.5 },
        img: {
            sprite: "map-barrel-res-01.img",
            scale: 0.1,
            alpha: 0.8,
            tint: 0x30120a,
            zIdx: 11,
        },
    },
    decal_bomb_iron_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        lifetime: { min: 6, max: 10 },
        fadeChance: 0.6,
        img: {
            sprite: "map-barrel-res-01.img",
            scale: 0.2,
            alpha: 0.8,
            tint: 0,
            zIdx: 11,
        },
    },
    decal_smoke_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-smoke-res.img",
            scale: 0.2,
            alpha: 0.5,
            tint: 0xffffff,
            zIdx: 11,
        },
    },
    decal_snowball_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        lifetime: 5,
        fadeChance: 1,
        img: {
            sprite: "map-snowball-res.img",
            scale: 0.2,
            alpha: 0.25,
            tint: 0xffffff,
            zIdx: 11,
        },
    },
    decal_potato_explosion: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        lifetime: 5,
        fadeChance: 1,
        img: {
            sprite: "map-potato-res.img",
            scale: 0.2,
            alpha: 0.25,
            tint: 0xffffff,
            zIdx: 11,
        },
    },
    decal_vent_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-bunker-vent-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_vent_02: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-bunker-vent-02.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_vent_03: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-bunker-vent-03.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_hydra_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 3),
        height: 0,
        img: {
            sprite: "map-bunker-hydra-floor-04.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_camera_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.5, 0.5)),
        height: 1,
        img: {
            sprite: "map-decal-camera-01.img",
            scale: 0.25,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_pipe_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 1,
        img: {
            sprite: "map-decal-pipe.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_pipes_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1, 4.5)),
        height: 1,
        img: {
            sprite: "map-pipes-01.img",
            scale: 0.5,
            alpha: 0.96,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_pipes_02: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4, 3)),
        height: 1,
        img: {
            sprite: "map-pipes-02.img",
            scale: 0.5,
            alpha: 0.96,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_pipes_03: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(10.5, 4)),
        height: 1,
        img: {
            sprite: "map-pipes-03.img",
            scale: 0.5,
            alpha: 0.96,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_pipes_04: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1, 5.5)),
        height: 1,
        img: {
            sprite: "map-pipes-04.img",
            scale: 0.5,
            alpha: 0.96,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_pipes_05: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1, 3.5)),
        height: 1,
        img: {
            sprite: "map-pipes-05.img",
            scale: 0.5,
            alpha: 0.96,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_initiative_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 3),
        height: 0,
        img: {
            sprite: "map-decal-initiative.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_caduceus_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 3),
        height: 0,
        img: {
            sprite: "map-decal-caduceus.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_web_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        height: 1,
        img: {
            sprite: "map-web-01.img",
            scale: 0.5,
            alpha: 0.75,
            tint: 0xffffff,
            zIdx: 60,
        },
    },
    decal_light_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(3.25, 3.25)),
        height: 1,
        lifetime: 1e10,
        img: {
            sprite: "map-light-01.img",
            scale: 1,
            alpha: 0.5,
            tint: 0xff9c00,
            zIdx: 60,
            flicker: true,
            flickerMin: 0.9,
            flickerMax: 1.1,
            flickerRate: 0.5,
            ignoreAdjust: true,
        },
    },
    decal_light_02: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2.5)),
        height: 1,
        lifetime: 1e10,
        img: {
            sprite: "map-light-01.img",
            scale: 0.75,
            alpha: 0.5,
            tint: 0xffbe4d,
            zIdx: 60,
            flicker: true,
            flickerMin: 0.8,
            flickerMax: 1.2,
            flickerRate: 0.2,
            ignoreAdjust: true,
        },
    },
    decal_light_03: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2.5)),
        height: 1,
        lifetime: 1e10,
        img: {
            sprite: "map-light-01.img",
            scale: 0.75,
            alpha: 0.5,
            tint: 0x830000,
            zIdx: 60,
            flicker: true,
            flickerMin: 0.8,
            flickerMax: 1.2,
            flickerRate: 0.2,
            ignoreAdjust: true,
        },
    },
    decal_light_04: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 2.5)),
        height: 1,
        lifetime: 1e10,
        img: {
            sprite: "map-light-01.img",
            scale: 0.75,
            alpha: 0.5,
            tint: 0xff5824,
            zIdx: 60,
            flicker: true,
            flickerMin: 0.5,
            flickerMax: 0.75,
            flickerRate: 0.4,
            ignoreAdjust: true,
        },
    },
    decal_blood_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        height: 0,
        img: {
            sprite: "part-splat-01.img",
            scale: 0.25,
            alpha: 0.95,
            tint: 0x3d0e0e,
            zIdx: 0,
        },
    },
    decal_blood_02: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        height: 0,
        img: {
            sprite: "part-splat-02.img",
            scale: 0.25,
            alpha: 0.95,
            tint: 0x3d0e0e,
            zIdx: 0,
        },
    },
    decal_blood_03: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.5, 1.5)),
        height: 0,
        img: {
            sprite: "part-splat-03.img",
            scale: 0.25,
            alpha: 0.95,
            tint: 0x3d0e0e,
            zIdx: 0,
        },
    },
    decal_chrys_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 1,
        img: {
            sprite: "map-bunker-vent-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 3,
        },
    },
    decal_oil_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-decal-oil-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_oil_02: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-decal-oil-02.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_oil_03: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-decal-oil-03.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_oil_04: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-decal-oil-04.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_oil_05: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 1),
        height: 0,
        img: {
            sprite: "map-decal-oil-05.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_oil_06: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 2),
        height: 0,
        img: {
            sprite: "map-decal-oil-06.img",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 0,
        },
    },
    decal_bathhouse_pool_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(9, 15)),
        height: 1,
        surface: {
            type: "water",
            data: {
                waterColor: 0x4eb2c4,
                rippleColor: 0x9fe2ef,
            },
        },
        img: {
            sprite: "map-bathhouse-pool-01.img",
            scale: 8,
            alpha: 0.5,
            tint: 0xcdf1,
            zIdx: 5,
        },
        gore: {
            fade: { start: 0, end: 4, pow: 0.5, speed: 2 },
            tint: 0x75000f,
            alpha: 0.85,
            waterColor: 0x822531,
            rippleColor: 0xaf545f,
        },
    },
    decal_club_01: {
        type: "decal",
        collision: collider.createCircle(v2.create(0, 0), 4),
        height: 0,
        img: {
            sprite: "map-decal-club-01.img",
            scale: 1,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 4,
        },
    },
    decal_club_02: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(4, 10.5)),
        height: 1,
        img: {
            sprite: "map-decal-club-02.img",
            scale: 1,
            alpha: 0,
            tint: 0xffffff,
            zIdx: 4,
        },
        gore: {
            fade: {
                start: 4,
                end: 6,
                pow: 3.25,
                speed: 0.5,
            },
            alpha: 1,
        },
    },
    decal_plank_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 2.25)),
        height: 0,
        img: {
            sprite: "part-plank-01.img",
            scale: 0.5,
            alpha: 1,
            tint: 0x42080c,
            zIdx: 9,
        },
    },
    decal_flyer_01: {
        type: "decal",
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.5, 1)),
        height: 0,
        img: {
            sprite: "map-decal-flyer-01.img",
            scale: 0.6,
            alpha: 0.667,
            tint: 0xffffff,
            zIdx: 4,
        },
    },
};
