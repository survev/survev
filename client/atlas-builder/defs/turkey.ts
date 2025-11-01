import type { AtlasDef } from "../atlasDefs";
import { BuildingSprites } from "./buildings";

export const TurkeyAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.greenhouse,
        ...BuildingSprites.bunker_chrys,
        ...BuildingSprites.bunker_crossing,
        ...BuildingSprites.bunker_hydra,
        ...BuildingSprites.warehouse_complex,

        "map/map-squash-02.svg",
        "map/map-squash-03.svg",

        "map/map-squash-res-02.svg",
        "map/map-squash-res-03.svg",

        "map/map-tree-07.svg",
        "map/map-tree-08.svg",

        "map/map-bush-06tr.svg",
        "map/map-bush-res-06.svg",

        "map/map-woodpile-02.svg",
        "map/map-woodpile-res-02.svg",

        "map/map-stone-03tr.svg",
        "map/map-chest-03tr.svg",
    ],
};
