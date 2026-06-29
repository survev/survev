import type { AtlasDef } from "../atlasDefs.ts";

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

        "map/map-table-01d.svg",
        "map/map-table-05.svg",
        "map/map-decal-pipe.svg",

        // dont use the svg because it breaks with node-canvas due to the embedded base64 png
        "map/map-decal-flyer-01.png",
    ],
};
