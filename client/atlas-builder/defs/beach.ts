import type { AtlasDef } from "../atlasDefs.ts";
import { BuildingSprites } from "./buildings.ts";

export const BeachAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.large_hut,

        "map/map-barrel-05.svg",
        "map/map-stone-03bh.svg",
        "map/map-tree-01.svg",
        "map/map-tree-01x.svg",
        "map/map-tree-13x.svg",
        "map/map-tree-14x.svg",
    ],
};
