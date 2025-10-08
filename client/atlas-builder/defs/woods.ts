import type { AtlasDef } from "../atlasDefs";
import { BuildingSprites } from "./buildings";

export const WoodsAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.pavilion,
        ...BuildingSprites.bunker_eye,
        ...BuildingSprites.bunker_hatchet,

        "map/map-bush-07sp.svg",

        "map/map-crate-19.svg",

        "map/map-tree-07sp.svg",
        "map/map-tree-08sp.svg",
    ],
};
