import type { AtlasDef } from "../atlasDefs";
import { BuildingSprites } from "./buildings";

export const SnowAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.warehouse_complex,
        ...BuildingSprites.bunker_hydra,
        ...BuildingSprites.greenhouse_aged,
        ...BuildingSprites.bunker_chrys_aged,

        "map/map-airdrop-01x.svg",
        "map/map-airdrop-02x.svg",

        "map/map-bush-01x.svg",
        "map/map-chest-03x.svg",
        "map/map-chute-01x.svg",

        "map/map-crate-01x.svg",
        "map/map-crate-02x.svg",
        "map/map-crate-03x.svg",

        "map/map-snow-01.svg",
        "map/map-snow-02.svg",
        "map/map-snow-03.svg",
        "map/map-snow-04.svg",
        "map/map-snow-05.svg",
        "map/map-snow-06.svg",
        "map/map-snowball-res.svg",

        "map/map-stone-01x.svg",
        "map/map-stone-03x.svg",
        "map/map-stone-res-01x.svg",
        "map/map-stone-res-02x.svg",

        "map/map-table-01x.svg",
        "map/map-table-02x.svg",
        "map/map-table-03x.svg",

        "map/map-tree-10.svg",
        "map/map-tree-11.svg",
    ],
};
