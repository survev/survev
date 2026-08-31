import {
    type MapFilter,
    type MapFilterEntry,
    type QuestMapFilter,
} from "../../../shared/defs/gameObjects/questDefs.ts";
import { type MapDefKey, MapDefs } from "../../../shared/defs/mapDefs.ts";

export function satisfiesMapFilter(serverMaps: MapDefKey[], mapFilter: QuestMapFilter): boolean {
    if (mapFilter.mapFilterType === undefined) {
        return true;
    }

    return (mapFilter.mapFilterType === "only_on") === hasMapMatch(serverMaps, mapFilter.maps);
}

export function hasMapMatch(serverMaps: MapDefKey[], available: MapFilter): boolean {
    if (Array.isArray(available)) {
        return serverMaps.some(map => available.some(a => matchesFilter(map, a)));
    }

    return serverMaps.some(map => matchesFilter(map, available));
}

export function matchesFilter(map: MapDefKey, filter: MapFilterEntry): boolean {
    return typeof filter === "string" ? filter === map : filter === MapDefs[map].mapId;
}
