import type { Vec2 } from "../utils/v2";
import { TwoVsTwo } from "./maps/2v2Defs";
import { FourVsFour } from "./maps/4v4Defs";
import { Main } from "./maps/baseDefs";
import { Beach } from "./maps/beachDefs";
import { Birthday } from "./maps/birthdayDefs";
import { Cobalt } from "./maps/cobaltDefs";
import { Comp } from "./maps/compDefs";
import { CompDuo } from "./maps/compDuoDefs";
import { CompSolo } from "./maps/compSoloDefs";
import { Desert } from "./maps/desertDefs";
import { Faction } from "./maps/factionDefs";
import { Halloween } from "./maps/halloweenDefs";
import { Local } from "./maps/localDefs";
import { MainSpring } from "./maps/mainSpringDefs";
import { MainSummer } from "./maps/mainSummerDefs";
import { Potato } from "./maps/potatoDefs";
import { PotatoSpring } from "./maps/potatoSpringDefs";
import { Savannah } from "./maps/savannahDefs";
import { Snow } from "./maps/snowDefs";
import { testFaction, testNormal } from "./maps/testDefs";
import { Turkey } from "./maps/turkeyDefs";
import { Woods } from "./maps/woodsDefs";
import { WoodsSnow } from "./maps/woodsSnowDefs";
import { WoodsSpring } from "./maps/woodsSpringDefs";
import { WoodsSummer } from "./maps/woodsSummerDefs";
import type { MapId } from "./types/misc";

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
    | "beach"
    | "comp"
    | "local"
    | "two_vs_two"
    | "four_vs_four"
    | "comp_solo"
    | "comp_duo";

export const MapDefs = {
    main: Main,
    main_spring: MainSpring,
    main_summer: MainSummer,
    desert: Desert,
    faction: Faction,
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
    comp: Comp,
    local: Local,
    two_vs_two: TwoVsTwo,
    four_vs_four: FourVsFour,
    comp_solo: CompSolo,
    comp_duo : CompDuo,

    /* STRIP_FROM_PROD_CLIENT:START */
    test_normal: testNormal,
    test_faction: testFaction,
    /* STRIP_FROM_PROD_CLIENT:END */
} satisfies Record<string, MapDef>;

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
        frozenSprites?: string[];
    };
    gameMode: {
        maxPlayers: number;
        killLeaderEnabled: boolean;
        
        freezeTime?: number,
        joinTime?: number, // time until players can move after game start
        airdropMinDistance?: number, // minimum distance between airdrops

        unlimitedAdren?: boolean; //if true, players will not lose adrenaline and start with max adrenaline || default false
        pickup?: boolean; //true to allow players to pick up items from the ground || default true
        indicator?: boolean; //true to show all players on the map || default false
        betterStats?: boolean; //true to show every players stats || default false
        canDespawn?: boolean; //if set to true players can despawn for a short time after spawning || default: true

        betterMapGen?: boolean; //if set to true, will do MinDistances between POIs || default: false

        // spawn related settings
        //spawning can now be changed per map
        betterSpawn?: boolean; //use our better spawn algorithm (only for 2 team matches) | default: false
        edgeBuffer?: number, // distance to maps border (to prevent pakistani spawns) | default: 150
        centerNoSpawnRadius?: number, // no spawn zone in the center of the map | default: 170
        minSpawnRad?: number, // spawn radius away from alive players | default: 400 (used for default spawn system too)
        minPosSpawnRad?: number, // spawn radius away from other spawn points |default: 100
        spawnCenter?: boolean, // spawn in the center of the map

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

    defaultItems?: {
        weapons: [
            { type: string, ammo: number },
            { type: string, ammo: number },
            { type: string, ammo: number },
            { type: string, ammo: number },
        ];
        outfit: string;
        backpack: string;
        helmet: string;
        chest: string;
        scope: string;
        perks: (string | (() => string))[];
        inventory: {
            "9mm": number;
            "762mm": number;
            "556mm": number;
            "12gauge": number;
            "50AE": number;
            "308sub": number;
            flare: number;
            "45acp": number;
            frag: number;
            smoke: number;
            strobe: number;
            mirv: number;
            snowball: number;
            potato: number;
            coconut: number;
            bandage: number;
            healthkit: number;
            soda: number;
            painkiller: number;
            "1xscope": number;
            "2xscope": number;
            "4xscope": number;
            "8xscope": number;
            "15xscope": number;
        };
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
