import type { AtlasDef } from "../atlasDefs.ts";
import { BuildingSprites } from "./buildings.ts";

export const PotatoAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.shilo,

        "map/map-potato-01.svg",
        "map/map-potato-02.svg",
        "map/map-potato-03.svg",
        "map/map-potato-res-01.svg",

        "map/map-egg-01.svg",
        "map/map-egg-02.svg",
        "map/map-egg-03.svg",
        "map/map-egg-04.svg",
        "map/map-egg-res-01.svg",

        "map/map-tomato-01.svg",
        "map/map-tomato-02.svg",
        "map/map-tomato-03.svg",
        "map/map-tomato-res-01.svg",
        "map/map-tomato-res-02.svg",
    ],
};
