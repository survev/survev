import { util } from "../../utils/util";
import { v2 } from "../../utils/v2";
import type { MapDef } from "../mapDefs";
import { MapId } from "../types/misc";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    mapId: MapId.Chaos,
    desc: {
        name: "Chaos",
        icon: "img/gui/cobalt.svg",
        buttonCss: "btn-mode-birthday",
    },
    biome: {
        colors: {
            background: 0x20536e,
            water: 0x63bac9,
            waterRipple: 0xb3f0ff,
            beach: 0xd9c5cf,
            riverbank: 0xa6929c,
            grass: 0x679e87,
            underground: 0x1b0d03,
            playerSubmerge: 0x4293a1,
            playerGhillie: 0xb85dc2,
        },
        valueAdjust: 1,
        sound: { riverShore: "sand" },
        particles: { camera: "" },
        tracerColors: {},
        airdrop: {
            planeImg: "map-plane-01.img",
            planeSound: "plane_01",
            airdropImg: "map-chute-01.img",
        },
    }
};

export const Chaos = util.mergeDeep({}, Main, mapDef) as MapDef;
