import type { AtlasDef } from "../atlasDefs";

export const GradientAtlas: AtlasDef = {
    compress: false,
    images: [
        "map/map-barrel-res-01.svg",
        "map/map-building-club-gradient-01.svg",
        "map/map-building-mansion-gradient-01.svg",
        "map/map-bush-01.svg",
        "map/map-bush-01cb.svg",
        "map/map-bush-03.svg",
        "map/map-bush-04.svg",
        "map/map-bush-04cb.svg",
        "map/map-light-01.svg",
        "map/map-plane-01.svg",
        "map/map-plane-02.svg",
        // dont use the svg because it breaks with node-canvas due to the embedded base64 png
        "map/map-decal-flyer-01.png",
    ],
};
