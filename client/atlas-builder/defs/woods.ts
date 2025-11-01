import type { AtlasDef } from "../atlasDefs";
import { BuildingSprites } from "./buildings";

export const WoodsAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.pavilion,
        ...BuildingSprites.bunker_eye,
        ...BuildingSprites.bunker_hatchet,

        "map/map-bush-01x.svg",
        "map/map-bush-06.svg",
        "map/map-bush-07sp.svg",

        "map/map-chest-03x.svg",

        "map/map-crate-01x.svg",
        "map/map-crate-02x.svg",
        "map/map-crate-03x.svg",
        "map/map-crate-19.svg",

        "map/map-snowball-res.svg",

        "map/map-stone-01x.svg",
        "map/map-stone-03x.svg",
        "map/map-stone-res-01x.svg",
        "map/map-stone-res-02x.svg",

        "map/map-table-01x.svg",
        "map/map-table-02x.svg",
        "map/map-table-03x.svg",

        "map/map-tree-05.svg",
        "map/map-tree-07.svg",
        "map/map-tree-07sp.svg",
        "map/map-tree-08.svg",
        "map/map-tree-08sp.svg",
        "map/map-tree-10.svg",
        "map/map-tree-11.svg",

        "map/map-woodpile-02.svg",
        "map/map-woodpile-res-02.svg",
    ],
};
