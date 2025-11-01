import type { AtlasDef } from "../atlasDefs";
import { BuildingSprites } from "./buildings";

export const HalloweenAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.bunker_eye,

        "map/map-airdrop-01h.svg",
        "map/map-airdrop-02h.svg",
        "particles/part-airdrop-01h.svg",
        "particles/part-airdrop-02h.svg",

        "map/map-bush-06.svg",
        "map/map-bush-07sp.svg",
        "map/map-bush-res-06.svg",

        "map/map-crate-11h.svg",

        "map/map-pumpkin-01.svg",
        "map/map-pumpkin-02.svg",
        "map/map-pumpkin-04.svg",
        "map/map-pumpkin-res-01.svg",
        "map/map-pumpkin-res-04.svg",

        "map/map-tree-04h.svg",
        "map/map-tree-05.svg",

        "map/map-web-01.svg",
    ],
};
