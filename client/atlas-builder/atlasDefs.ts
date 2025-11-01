import type { Atlas } from "../../shared/defs/mapDefs";
import { CobaltAtlas } from "./defs/cobalt";
import { DesertAtlas } from "./defs/desert";
import { FactionAtlas } from "./defs/faction";
import { GradientAtlas } from "./defs/gradient";
import { HalloweenAtlas } from "./defs/halloween";
import { LoadoutAtlas } from "./defs/loadout";
import { MainAtlas } from "./defs/main";
import { PotatoAtlas } from "./defs/potato";
import { SavannahAtlas } from "./defs/savannah";
import { SharedAtlas } from "./defs/shared";
import { SnowAtlas } from "./defs/snow";
import { TurkeyAtlas } from "./defs/turkey";
import { WoodsAtlas } from "./defs/woods";

export interface AtlasDef {
    /**
     * Some atlases have extra quality compression disabled (like loadout).
     *
     * The quality compression works by limiting the image to 256 colors
     *
     * Which doesn't work for some atlases like loadout, gradient, etc...
     * since they have way more colors than the spritesheets with only map objects.
     *
     * This is what the original game did BTW, with this we get really similar (and small) file sizes.
     */
    compress: boolean;
    images: string[];
}

export const Atlases: Record<Atlas, AtlasDef> = {
    gradient: GradientAtlas,
    loadout: LoadoutAtlas,
    shared: SharedAtlas,
    main: MainAtlas,
    desert: DesertAtlas,
    faction: FactionAtlas,
    halloween: HalloweenAtlas,
    potato: PotatoAtlas,
    snow: SnowAtlas,
    woods: WoodsAtlas,
    cobalt: CobaltAtlas,
    savannah: SavannahAtlas,
    turkey: TurkeyAtlas,
};
export type AtlasRes = "high" | "low";

export const AtlasResolutions: Record<AtlasRes, number> = {
    high: 1,
    low: 0.5,
};

// sprites that are scaled inside the sheets
export const scaledSprites: Record<string, number> = {
    // Smaller ceilings
    "map/map-building-house-ceiling.svg": 0.75,
    "map/map-building-hut-ceiling-01.svg": 0.75,
    "map/map-building-hut-ceiling-02.svg": 0.75,
    "map/map-building-hut-ceiling-03.svg": 0.75,
    "map/map-building-police-ceiling-01.svg": 0.75,
    "map/map-building-police-ceiling-02.svg": 0.75,
    "map/map-building-police-ceiling-03.svg": 0.75,
    "map/map-building-shack-ceiling-01.svg": 0.75,
    "map/map-building-shack-ceiling-02.svg": 0.75,
    "map/map-building-barn-ceiling-02.svg": 0.75,

    // Larger ceilings
    "map/map-building-barn-ceiling-01.svg": 0.5,
    "map/map-building-mansion-ceiling.svg": 0.5,
    "map/map-building-vault-ceiling.svg": 0.5,
    "map/map-building-warehouse-ceiling-01.svg": 0.5,
    "map/map-building-warehouse-ceiling-02.svg": 0.5,
    "map/map-bunker-conch-chamber-ceiling-01.svg": 0.5,
    "map/map-bunker-conch-chamber-ceiling-02.svg": 0.5,
    "map/map-bunker-conch-compartment-ceiling-01.svg": 0.5,
    "map/map-bunker-egg-chamber-ceiling-01.svg": 0.5,
    "map/map-bunker-storm-chamber-ceiling-01.svg": 0.5,
    "map/map-bunker-hydra-ceiling-01.svg": 0.5,
    "map/map-bunker-hydra-chamber-ceiling-01.svg": 0.5,
    "map/map-bunker-hydra-chamber-ceiling-02.svg": 0.5,
    "map/map-bunker-hydra-chamber-ceiling-03.svg": 0.5,
    "map/map-bunker-hydra-compartment-ceiling-02.svg": 0.5,
    "map/map-bunker-hydra-compartment-ceiling-03.svg": 0.5,
};
