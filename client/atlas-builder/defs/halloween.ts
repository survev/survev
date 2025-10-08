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

        "map/map-bush-07sp.svg",

        "map/map-crate-11h.svg",

        "map/map-web-01.svg",
    ],
};
