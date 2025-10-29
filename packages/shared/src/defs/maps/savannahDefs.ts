import { util } from "../../utils/util";
import { MapId } from "../types/misc";
import { Main, type PartialMapDef } from "./baseDefs";

const mapDef: PartialMapDef = {
    mapId: MapId.Savannah,

    desc: {
        name: "Savannah",
        icon: "img/gui/player-the-hunted.svg",
        buttonCss: "btn-mode-savannah",
    },
    assets: {
        audio: [],
        atlases: ["gradient", "loadout", "shared", "savannah"],
    },
    biome: {
        colors: {
            background: 0x1c5b5f,
            water: 0x41a4aa,
            waterRipple: 0x96f0f6,
            beach: 0xcb7132,
            riverbank: 0xb25e24,
            grass: 0xb4b02e,
            underground: 0x3d0d03,
            playerSubmerge: 0x4e9b8f,
            playerGhillie: 0xb0ac2b,
        },
        particles: {},
    },
    gameMode: { maxPlayers: 80, sniperMode: true },
};

export const Savannah = util.mergeDeep({}, Main, mapDef);
