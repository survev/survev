import type { AtlasDef } from "../atlasDefs";
import { BuildingSprites } from "./buildings";

export const FactionAtlas: AtlasDef = {
    compress: true,
    images: [
        "map/map-airdrop-03.svg",
        "map/map-airdrop-04.svg",
        "map/map-building-bridge-xlg-floor.svg",

        ...BuildingSprites.greenhouse,
        ...BuildingSprites.bunker_chrys,

        "map/map-chest-03f.svg",

        ...BuildingSprites.warehouse_complex,
        // 50v50 main bridge only
        "map/map-complex-warehouse-floor-04.svg",

        "map/map-crate-02f.svg",

        "map/map-crate-12.svg",
        "map/map-crate-13.svg",
        "map/map-crate-22.svg",

        "map/map-statue-01.svg",
        "map/map-statue-top-01.svg",
        "map/map-statue-top-02.svg",

        "map/map-bush-01f.svg",
        "map/map-tree-08f.svg",

        "map/map-stone-03f.svg",
        "map/map-stone-res-02f.svg",
    ],
};
