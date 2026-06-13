import type { AtlasDef } from "../atlasDefs.ts";
import { BuildingSprites } from "./buildings.ts";

export const SnowAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.warehouse_complex,
        ...BuildingSprites.bunker_hydra,
        ...BuildingSprites.greenhouse_aged,
        ...BuildingSprites.bunker_chrys_aged,
        ...BuildingSprites.bunker_crossing,

        "map/map-plane-01x.svg",

        "map/map-airdrop-01x.svg",
        "map/map-airdrop-02x.svg",

        "map/map-bush-01x.svg",

        "map/map-campfire-01.svg",

        "map/map-chest-03x.svg",
        "map/map-chute-01x.svg",

        "map/map-crate-01x.svg",
        "map/map-crate-02x.svg",
        "map/map-crate-03x.svg",

        "map/map-case-meteor-01.svg",
        "map/map-case-meteor-res-01.svg",

        "map/map-snow-01.svg",
        "map/map-snow-02.svg",
        "map/map-snow-03.svg",
        "map/map-snow-04.svg",
        "map/map-snow-05.svg",
        "map/map-snow-06.svg",
        "map/map-snowball-res.svg",

        "map/map-stone-01x.svg",
        "map/map-stone-03x.svg",
        "map/map-stone-04x.svg",
        "map/map-stone-res-01x.svg",
        "map/map-stone-res-02x.svg",

        "map/map-table-01x.svg",
        "map/map-table-02x.svg",
        "map/map-table-03x.svg",

        "map/map-tree-04h.svg",
        "map/map-tree-10.svg",
        "map/map-tree-11.svg",

        "map/map-woodpile-03.svg",
        "map/map-woodpile-res-03.svg",
    ],
};
