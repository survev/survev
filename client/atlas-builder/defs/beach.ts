import type { AtlasDef } from "../atlasDefs";
import { BuildingSprites } from "./buildings";

export const BeachAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.large_hut,

        "map/map-barrel-05.svg",
        "map/map-gun-mount-06.svg",
        "map/map-stone-03bh.svg",
        "map/map-tree-01.svg",
        "map/map-tree-01x.svg",
        "map/map-tree-13x.svg",
        "map/map-tree-14.svg",
        "map/map-tree-14x.svg",
    ],
};
