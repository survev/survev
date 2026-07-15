import type { MapId } from "../gameConfig.ts";
import type { Vec2 } from "../utils/v2.ts";
import type { RoleDef } from "./gameObjects/roleDefs.ts";
import { Main } from "./maps/baseDefs.ts";
import { Beach } from "./maps/beachDefs.ts";
import { Birthday } from "./maps/birthdayDefs.ts";
import { Cobalt } from "./maps/cobaltDefs.ts";
import { Desert } from "./maps/desertDefs.ts";
import { Faction } from "./maps/factionDefs.ts";
import { factionPotato } from "./maps/factionPotatoDefs.ts";
import { Halloween } from "./maps/halloweenDefs.ts";
import { MainSpring } from "./maps/mainSpringDefs.ts";
import { MainSummer } from "./maps/mainSummerDefs.ts";
import { Potato } from "./maps/potatoDefs.ts";
import { PotatoSpring } from "./maps/potatoSpringDefs.ts";
import { Savannah } from "./maps/savannahDefs.ts";
import { Snow } from "./maps/snowDefs.ts";
import { testFaction, testNormal } from "./maps/testDefs.ts";
import { Turkey } from "./maps/turkeyDefs.ts";
import { Woods } from "./maps/woodsDefs.ts";
import { WoodsSnow } from "./maps/woodsSnowDefs.ts";
import { WoodsSpring } from "./maps/woodsSpringDefs.ts";
import { WoodsSummer } from "./maps/woodsSummerDefs.ts";

export type Atlas =
    | "gradient"
    | "loadout"
    | "shared"
    | "main"
    | "desert"
    | "faction"
    | "halloween"
    | "potato"
    | "snow"
    | "woods"
    | "cobalt"
    | "savannah"
    | "turkey"
    | "beach";

const _MapDefs = {
    main: Main,
    main_spring: MainSpring,
    main_summer: MainSummer,
    desert: Desert,
    faction: Faction,
    faction_potato: factionPotato,
    halloween: Halloween,
    potato: Potato,
    potato_spring: PotatoSpring,
    snow: Snow,
    woods: Woods,
    woods_snow: WoodsSnow,
    woods_spring: WoodsSpring,
    woods_summer: WoodsSummer,
    savannah: Savannah,
    cobalt: Cobalt,
    turkey: Turkey,
    birthday: Birthday,
    beach: Beach,

    /* STRIP_FROM_PROD_CLIENT:START */
    test_normal: testNormal,
    test_faction: testFaction,
    /* STRIP_FROM_PROD_CLIENT:END */
} satisfies Record<string, MapDef>;

export type MapDefKey = keyof typeof _MapDefs;

export const MapDefs = _MapDefs as Record<MapDefKey, MapDef>;

export interface MapDef {
    mapId: MapId;
    desc: {
        name: string;
        icon: string;
        buttonCss: string;
        buttonText?: string;
        backgroundImg: string;
    };
    assets: {
        audio: Array<{
            name: string;
            channel: string;
        }>;
        atlases: Atlas[];
    };
    biome: {
        colors: {
            background: number;
            water: number;
            waterRipple: number;
            beach: number;
            riverbank: number;
            lakeWater?: number;
            lakeWaterRipple?: number;
            lakeRiverbank?: number;
            grass: number;
            underground: number;
            playerSubmerge: number;
            playerGhillie: number;
        };
        valueAdjust: number;
        sound: {
            riverShore: string;
        };
        particles: {
            camera: string;
        };
        tracerColors: Record<string, Record<string, number>>;
        airdrop: {
            planeImg: string;
            planeSound: string;
            airdropImg: string;
        };
    };
    gameMode: {
        maxPlayers: number;
        killLeaderEnabled: boolean;
        desertMode?: boolean;
        factionMode?: boolean;
        factions?: number;
        potatoMode?: boolean;
        woodsMode?: boolean;
        sniperMode?: boolean;
        perkMode?: boolean;
        perkModeRoles?: string[];
        turkeyMode?: boolean;
        spookyKillSounds?: boolean;
    };
    gameConfig: {
        planes: {
            timings: Array<{
                circleIdx: number;
                wait: number;
                options: {
                    type: number;
                    numPlanes?: Array<{
                        count: number;
                        weight: number;
                    }>;
                    airstrikeZoneRad?: number;
                    wait?: number;
                    delay?: number;
                    airdropType?: string;
                };
            }>;
            crates: Array<{
                name: string;
                weight: number;
            }>;
        };
        roles?: {
            timings: Array<{
                role: string | (() => string);
                circleIdx: number;
                wait: number;
            }>;
            roleOverrides?: Record<string, Partial<RoleDef>>;
        };
        unlocks?: {
            timings: Array<{
                type: string; // can either be a building with the door(s) to unlock OR the door itself, no support for structures yet
                stagger: number; // only for buildings with multiple unlocks, will stagger the unlocks instead of doing them all at once
                circleIdx: number;
                wait: number;
            }>;
        };
        bagSizes: Record<string, number[]>;
        bleedDamage: number;
        bleedDamageMult: number;
    };
    lootTable: Record<
        string,
        Array<{
            name: string;
            count: number;
            weight: number;
            preload?: boolean;
        }>
    >;
    mapGen: {
        map: {
            baseWidth: number;
            baseHeight: number;
            scale: {
                small: number;
                large: number;
            };
            extension: number;
            shoreInset: number;
            grassInset: number;
            rivers: {
                lakes: Array<{
                    odds: number;
                    innerRad: number;
                    outerRad: number;
                    centerObj?: string;
                    riverMaskRad?: number;
                    spawnBound: {
                        pos: Vec2;
                        rad: number;
                    };
                }>;
                weights: Array<{
                    weight: number;
                    widths: number[];
                }>;
                smoothness: number;
                masks: Array<{
                    pos?: Vec2;
                    genOnShore?: boolean;
                    rad: number;
                }>;
                spawnCabins: boolean;
            };
        };
        places: Array<{
            name: string;
            pos: Vec2;
            dontSpawnObjects?: boolean;
        }>;
        bridgeTypes: {
            medium: string;
            large: string;
            xlarge: string;
        };
        customSpawnRules: {
            locationSpawns: Array<{
                type: string;
                pos: Vec2;
                rad: number;
                retryOnFailure: boolean;
            }>;
            placeSpawns: string[];
        };
        densitySpawns: [Record<string, number>];
        fixedSpawns: [
            Record<string, number | { odds: number } | { small: number; large: number }>,
        ];
        randomSpawns: Array<{
            spawns: string[];
            choose: number;
        }>;
        spawnReplacements: [Record<string, string>];
        importantSpawns: string[];
    };
}
