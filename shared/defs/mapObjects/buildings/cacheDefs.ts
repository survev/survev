import { type DeepPartial, util } from "../../../utils/util.ts";
import { v2 } from "../../../utils/v2.ts";
import type { BuildingDef } from "./buildingDefs.ts";

function createCache(overrides: DeepPartial<BuildingDef>): BuildingDef {
    const baseDef: BuildingDef = {
        type: "building",
        map: { display: true, displayType: "stone_01" },
        terrain: { grass: true, beach: false },
        ori: 0,
        floor: {
            surfaces: [],
            imgs: [
                {
                    sprite: "",
                    scale: 0.5,
                    alpha: 1,
                    tint: 0xffffff,
                },
            ],
        },
        ceiling: { zoomRegions: [], imgs: [] },
        mapObjects: [
            {
                type: "stone_02",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
    };
    return util.mergeDeep(baseDef, overrides);
}

export const CacheDefs: Record<string, BuildingDef> = {
    cache_01: createCache({}),
    cache_01x: createCache({
        mapObjects: [
            {
                type: "stone_02x",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "stone_01x" },
    }),
    cache_01sv: createCache({
        mapObjects: [
            {
                type: "stone_02sv",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "stone_01" },
    }),
    cache_01cb: createCache({
        mapObjects: [
            {
                type: "stone_02cb",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "stone_01cb" },
    }),
    cache_01w: createCache({
        mapObjects: [
            {
                type: "stone_02w",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "stone_01" },
    }),
    cache_01bh: createCache({
        mapObjects: [
            {
                type: "stone_02bh",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "stone_01" },
    }),
    cache_01f: createCache({
        mapObjects: [
            {
                type: "stone_02f",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "stone_01" },
    }),
    cache_02: createCache({
        mapObjects: [
            {
                type: "tree_03",
                pos: v2.create(0, 0),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_01" },
    }),
    cache_02x: createCache({
        mapObjects: [
            {
                type: "tree_03x",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_10" },
    }),
    cache_02sv: createCache({
        mapObjects: [
            {
                type: "tree_03sv",
                pos: v2.create(0, 0),
                scale: 0.9,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_03sv" },
    }),
    cache_02w: createCache({
        mapObjects: [
            {
                type: "tree_03w",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_07" },
    }),
    cache_02sp: createCache({
        mapObjects: [
            {
                type: "tree_03sp",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.3,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_07sp" },
    }),
    cache_02su: createCache({
        mapObjects: [
            {
                type: "tree_03su",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.3,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_07su" },
    }),
    cache_02cb: createCache({
        mapObjects: [
            {
                type: "tree_03cb",
                pos: v2.create(0, 0),
                scale: 1.3,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.3,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_01cb" },
    }),
    cache_02d: createCache({
        mapObjects: [
            {
                type: "tree_03d",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_06" },
    }),
    cache_02f: createCache({
        mapObjects: [
            {
                type: "tree_03f",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.3,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_08f" },
    }),
    cache_02h: createCache({
        mapObjects: [
            {
                type: "tree_03h",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.2,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_07" },
    }),
    cache_02bh: createCache({
        mapObjects: [
            {
                type: "tree_03bh",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 0.9,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "tree_14" },
    }),
    cache_03: createCache({
        mapObjects: [
            {
                type: "bush_06",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "bush_06" },
    }),
    cache_03tr: createCache({
        mapObjects: [
            {
                type: "bush_06tr",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "bush_06" },
    }),
    cache_04: createCache({
        terrain: {
            grass: false,
            beach: false,
            river: { centerWeight: 0.5 },
            riverShore: false,
        },
        mapObjects: [
            {
                type: "stone_08",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_caduceus_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    }),
    cache_04x: createCache({
        terrain: {
            grass: false,
            beach: false,
            river: { centerWeight: 0.5 },
            riverShore: false,
        },
        mapObjects: [
            {
                type: "stone_08x",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_caduceus_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    }),
    cache_04cb: createCache({
        terrain: {
            grass: false,
            beach: false,
            river: { centerWeight: 0.5 },
            riverShore: false,
        },
        mapObjects: [
            {
                type: "stone_08cb",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_caduceus_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    }),
    cache_06: createCache({
        mapObjects: [
            {
                type: "bush_07",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "bush_07" },
    }),
    cache_06bh: createCache({
        mapObjects: [
            {
                type: "bush_07x",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "bush_07x" },
    }),
    cache_07: createCache({
        mapObjects: [
            {
                type: "barrel_01b",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "barrel_01" },
    }),
    cache_07w: createCache({
        mapObjects: [
            {
                type: "barrel_01w",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "barrel_01" },
    }),
    cache_06cb: createCache({
        mapObjects: [
            {
                type: "bush_07cb",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "loot_tier_leaf_pile",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "bush_07cb" },
    }),
    cache_07f: createCache({
        mapObjects: [
            {
                type: "barrel_01f",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1.1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "barrel_01" },
    }),
    cache_07bh: createCache({
        mapObjects: [
            {
                type: "barrel_01bh",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_initiative_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
        ],
    }),
    cache_log_13: createCache({
        terrain: { grass: false, beach: true },
        mapObjects: [
            {
                type: "crate_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "recorder_13",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
        map: { displayType: "crate_01" },
    }),
    cache_pumpkin_01: createCache({
        mapObjects: [
            {
                type: "pumpkin_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_01",
                pos: v2.create(0, 0),
                scale: 1.5,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
    cache_pumpkin_02: createCache({
        mapObjects: [
            {
                type: "pumpkin_02",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_01",
                pos: v2.create(0, 0),
                scale: 1.5,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
    cache_pumpkin_03: createCache({
        mapObjects: [
            {
                type: "pumpkin_03",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_04",
                pos: v2.create(0, 0),
                scale: 1.5,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
    cache_pumpkin_airdrop_02: createCache({
        mapObjects: [
            {
                type: "crate_11h",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_01",
                pos: v2.create(0, 0),
                scale: 1.5,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
    candle_lit_01: createCache({
        mapObjects: [
            {
                type: "candle_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_02",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
    candle_lit_02: createCache({
        mapObjects: [
            {
                type: "candle_01",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
            },
            {
                type: "decal_light_03",
                pos: v2.create(0, 0),
                scale: 1,
                ori: 0,
                inheritOri: false,
            },
        ],
    }),
};
