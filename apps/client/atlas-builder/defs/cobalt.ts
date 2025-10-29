import type { AtlasDef } from "../atlasDefs";
import { BuildingSprites } from "./buildings";

export const CobaltAtlas: AtlasDef = {
    compress: true,
    images: [
        ...BuildingSprites.bunker_crossing,
        ...BuildingSprites.bunker_hydra,
        ...BuildingSprites.warehouse_complex,
        ...BuildingSprites.bunker_twins,

        "map/map-class-crate-03.svg",
        "map/map-class-crate-assault.svg",
        "map/map-class-crate-demo.svg",
        "map/map-class-crate-healer.svg",
        "map/map-class-crate-res-01.svg",
        "map/map-class-crate-scout.svg",
        "map/map-class-crate-sniper.svg",
        "map/map-class-crate-tank.svg",
        "map/map-class-shell-01a.svg",
        "map/map-class-shell-01b.svg",
        "map/map-class-shell-02a.svg",
        "map/map-class-shell-02b.svg",
        "map/map-class-shell-03a.svg",
        "map/map-class-shell-03b.svg",
        "particles/part-class-shell-01a.svg",
        "particles/part-class-shell-01b.svg",
        "particles/part-class-shell-02a.svg",
        "particles/part-class-shell-02b.svg",
        "particles/part-class-shell-03a.svg",
        "particles/part-class-shell-03b.svg",

        "map/map-stone-01cb.svg",
        "map/map-stone-03cb.svg",
        "map/map-stone-res-01cb.svg",
        "map/map-stone-res-02cb.svg",
        "map/map-tree-03cb.svg",
    ],
};
