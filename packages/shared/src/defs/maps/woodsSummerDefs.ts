import { util } from "../../utils/util";
import type { MapDef } from "../mapDefs";
import type { PartialMapDef } from "./baseDefs";
import { Woods } from "./woodsDefs";

const mapDef: PartialMapDef = {
    biome: {
        colors: {
            background: 0x20536e,
            water: 0x3282ab,
            waterRipple: 0xb3f0ff,
            beach: 0xdc9e28,
            riverbank: 0xa37119,
            grass: 0x629522,
            underground: 0x1b0d03,
            playerSubmerge: 0x2b8ca4,
            playerGhillie: 0x659825,
        },
        particles: { camera: "falling_leaf_summer" },
    },
};

export const WoodsSummer = util.mergeDeep({}, Woods, mapDef) as MapDef;
