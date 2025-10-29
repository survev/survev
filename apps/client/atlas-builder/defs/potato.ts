import type { AtlasDef } from "../atlasDefs";
import { BuildingSprites } from "./buildings";

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
    ],
};
