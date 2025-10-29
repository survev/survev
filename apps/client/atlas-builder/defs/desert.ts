import type { AtlasDef } from "../atlasDefs";
import { BuildingSprites } from "./buildings";

export const DesertAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.saloon,
        ...BuildingSprites.greenhouse_aged,
        ...BuildingSprites.bunker_chrys_aged,

        "map/map-building-archway-ceiling-01.svg",
        "map/map-archway-res-01.svg",

        "map/map-bush-05.svg",
        "map/map-bush-res-05.svg",
        "map/map-chest-03d.svg",

        "map/map-crate-18.svg",

        "map/map-bunker-statue-chamber-floor-01.svg",
        "map/map-statue-03.svg",
        "map/map-statue-04.svg",
        "map/map-complex-warehouse-floor-05.svg",
        "map/map-crate-22.svg",
        "map/map-crate-02f.svg",
        "map/map-case-meteor-01.svg",
        "map/map-case-meteor-res-01.svg",

        "map/map-stone-03b.svg",
        "map/map-stone-06.svg",
        "map/map-stone-res-01b.svg",

        "map/map-tree-05c.svg",
        "map/map-tree-06.svg",
    ],
};
