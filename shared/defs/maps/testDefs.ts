import { util } from "../../utils/util.ts";
import type { MapDef } from "../mapDefs.ts";
import { Main, type PartialMapDef } from "./baseDefs.ts";

export const testNormal = util.mergeDeep(
    {},
    Main,
    {
        mapGen: {
            map: {
                baseWidth: 128,
                baseHeight: 128,
                rivers: {
                    lakes: [],
                    weights: [{ weight: 1, widths: [] }],
                    spawnCabins: false,
                },
            },
            customSpawnRules: {
                locationSpawns: [],
                placeSpawns: [],
            },
            densitySpawns: [{}],
            fixedSpawns: [{}],
            randomSpawns: [],
            spawnReplacements: [{}],
        },
    } satisfies PartialMapDef,
) as MapDef;

export const testFaction = util.mergeDeep(
    {},
    testNormal,
    {
        gameMode: {
            factionMode: true,
            factions: 2,
        },
    } satisfies PartialMapDef,
) as MapDef;
