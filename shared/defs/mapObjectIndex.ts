import { BuildingObjects } from "./mapObjects/obstacles/buildingObjects"
import { Crates } from "./mapObjects/obstacles/crates"
import { Decals } from "./mapObjects/obstacles/decals"
import { Furniture } from "./mapObjects/obstacles/furniture"
import { Interactables } from "./mapObjects/obstacles/interactables"
import { LootSpawners } from "./mapObjects/obstacles/lootSpawners"
import { MapObstacles } from "./mapObjects/obstacles/mapObstacles"
import { BaseBuildings } from "./mapObjects/buildings/baseBuildings"
import { ModeBuildings } from "./mapObjects/buildings/modeBuildings"
import { Bunkers } from "./mapObjects/buildings/bunkers"
import { Structures } from "./mapObjects/buildings/structures"
import type { MapObjectDef } from "./mapObjectsTyping"

export const ObjectDefIndex = {
  ...BuildingObjects,
  ...BaseBuildings,
  ...Bunkers,
  ...Crates,
  ...Decals,
  ...Furniture,
  ...Interactables,
  ...LootSpawners,
  ...MapObstacles,
  ...ModeBuildings,
  ...Structures
} as const satisfies Record<string, MapObjectDef>;

export type MapObstacleDefKey = 
  | (keyof typeof BuildingObjects)
  | (keyof typeof Crates)
  | (keyof typeof Decals)
  | (keyof typeof Furniture)
  | (keyof typeof Interactables)
  | (keyof typeof LootSpawners)
  | (keyof typeof MapObstacles)

  export type MapBuildingDefKey =
  | (keyof typeof BaseBuildings)
  | (keyof typeof ModeBuildings)
  | (keyof typeof Bunkers)
  | (keyof typeof Structures)

  export type MapObjectKey = MapObstacleDefKey | MapBuildingDefKey
