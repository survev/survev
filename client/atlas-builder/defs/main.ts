import type { AtlasDef } from "../atlasDefs.ts";
import { BuildingSprites } from "./buildings.ts";

export const MainAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.greenhouse,
        ...BuildingSprites.bunker_chrys,
        ...BuildingSprites.bunker_crossing,
        ...BuildingSprites.bunker_hydra,
        ...BuildingSprites.warehouse_complex,

        "map/map-tree-07sp.svg",
        "map/map-tree-08sp.svg",
        "map/map-bush-01f.svg",
    ],
};
