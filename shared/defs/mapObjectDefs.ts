import { type BuildingDef, BuildingDefs } from "./mapObjects/buildings/buildingDefs.ts";
import { type DecalDef, DecalDefs } from "./mapObjects/decalDefs.ts";
import { LootSpawnerDefs } from "./mapObjects/lootSpawnerDefs.ts";
import { type ObstacleDef, ObstacleDefs } from "./mapObjects/obstacles/obstacleDefs.ts";
import { type StructureDef, StructureDefs } from "./mapObjects/structureDefs.ts";
import type { LootSpawnerDef } from "./mapObjectsTyping.ts";

export type MapObjectDef =
    | ObstacleDef
    | BuildingDef
    | StructureDef
    | DecalDef
    | LootSpawnerDef;

export const RawMapObjectDefs: Record<string, MapObjectDef> = {
    ...ObstacleDefs,
    ...BuildingDefs,
    ...StructureDefs,
    ...DecalDefs,
    ...LootSpawnerDefs,
};
