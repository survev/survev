import { util } from "../../utils/util";
import type { MapDef } from "../mapDefs";
import type { PartialMapDef } from "./baseDefs";
import { Woods } from "./woodsDefs";

const mapDef: PartialMapDef = {
    assets: {
        audio: [
            { name: "vault_change_02", channel: "sfx" },
            { name: "footstep_08", channel: "sfx" },
            { name: "footstep_09", channel: "sfx" },
            { name: "snowball_01", channel: "sfx" },
            { name: "snowball_02", channel: "sfx" },
            { name: "snowball_pickup_01", channel: "ui" },
        ],
        atlases: ["gradient", "loadout", "shared", "woods", "snow"],
    },
    biome: {
        colors: {
            background: 0x93639,
            water: 0xc4d51,
            waterRipple: 0xb3f0ff,
            beach: 0xcdb35b,
            riverbank: 0x905e24,
            grass: 0xbdbdbd,
            underground: 0x1b0d03,
            playerSubmerge: 0x2b8ca4,
        },
        particles: { camera: "falling_snow_slow" },
        tracerColors: {
            "762mm": {
                regular: 0x96a1e6,
                saturated: 0xabc4ff,
                alphaRate: 0.96,
                alphaMin: 0.4,
            },
        },
    },
    /* STRIP_FROM_PROD_CLIENT:START */
    lootTable: {
        tier_throwables: [
            { name: "frag", count: 3, weight: 1 },
            { name: "mirv", count: 2, weight: 0.5 },
            { name: "smoke", count: 1, weight: 1 },
            { name: "snowball", count: 5, weight: 0.25 },
        ],
        tier_airdrop_throwables: [
            { name: "mirv", count: 2, weight: 1 },
            { name: "snowball", count: 10, weight: 0.25 },
        ],
    },
    mapGen: {
        spawnReplacements: [
            {
                bank_01: "bank_01x",
                barn_01: "barn_01x",
                bridge_lg_01: "bridge_lg_01x",
                cabin_01: "cabin_01x",
                container_01: "container_01x",
                crate_02: "crate_19",
                crate_08: "crate_19",
                crate_09: "crate_19",
                greenhouse_01: "greenhouse_02",
                house_red_01: "house_red_01x",
                house_red_02: "house_red_02x",
                hut_01: "hut_01x",
                hut_02: "hut_02x",
                mansion_01: "mansion_01x",
                outhouse_01: "outhouse_01x",
                police_01: "police_01x",
                shack_01: "shack_01x",
                shack_02: "shack_02x",
                shack_03a: "shack_03x",
                warehouse_01: "warehouse_01x",
                warehouse_02: "warehouse_02x",
                bush_01: "bush_01x",
                chest_03: "chest_03x",
                crate_01: "crate_01x",
                stone_01: "stone_01x",
                stone_03: "stone_03x",
                tree_01: "tree_07",
            },
        ],
    },
    /* STRIP_FROM_PROD_CLIENT:END */
};

export const WoodsSnow = util.mergeDeep({}, Woods, mapDef) as MapDef;
