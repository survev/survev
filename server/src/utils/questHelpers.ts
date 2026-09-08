import type { ConfigType } from "../../../configType.ts";
import {
    exclusivityGroups,
    type MapFilter,
    type MapFilterEntry,
    QuestDefs,
    QuestDifficulty,
    type QuestMapFilter,
} from "../../../shared/defs/gameObjects/questDefs.ts";
import { type MapDefKey, MapDefs } from "../../../shared/defs/mapDefs.ts";
import { MapId } from "../../../shared/gameConfig.ts";

const questTypes = Object.keys(QuestDefs);

const incompatibleQuestMap = new Map(
    questTypes
        .map<[string, Set<string>]>(quest => {
            const incompatibleQuests = new Set(
                exclusivityGroups
                    .filter(g => g.includes(quest))
                    .flat(),
            );
            incompatibleQuests.delete(quest);

            return [
                quest,
                incompatibleQuests,
            ];
        })
        .filter(([, groups]) => groups.size > 0),
);

export const questHelpers = {
    getAvailableQuestsForModes(
        modes: ConfigType["modes"],
        currentQuests: ReadonlySet<string>,
        rerollingId?: string,
    ): string[] {
        modes = modes.filter(mode => mode.enabled);
        const serverMapNames = modes.map(mode => mode.mapName);

        // for top in solo / squad quests
        // filter them based on running modes not being normal mode
        // getting top in solos while a mode is running on squads is really frustrating :)
        const nonNormalTeamModes = modes
            .filter(m => MapDefs[m.mapName].mapId !== MapId.Main)
            .map(m => m.teamMode);

        return questTypes.filter(questType => {
            if (currentQuests.has(questType)) return false;

            const questDef = QuestDefs[questType];
            if (rerollingId !== undefined && questDef.difficulty === QuestDifficulty.Hard) {
                return false;
            }

            if (!questHelpers.satisfiesMapFilter(serverMapNames, questDef)) {
                return false;
            }

            if (nonNormalTeamModes.length > 0) {
                const modeFilter = questDef.filters?.find(f => f.type === "team_mode");
                if (modeFilter !== undefined && !nonNormalTeamModes.includes(modeFilter.mode)) {
                    return false;
                }
            }

            const incompatibleQuests = incompatibleQuestMap.get(questType);
            if (incompatibleQuests === undefined || rerollingId === undefined) {
                return true;
            }

            const validBlockers = new Set(currentQuests);
            validBlockers.delete(rerollingId);
            return incompatibleQuests.isDisjointFrom(validBlockers);
        });
    },

    satisfiesMapFilter(serverMaps: MapDefKey[], mapFilter: QuestMapFilter): boolean {
        if (mapFilter.mapFilterType === undefined) {
            return true;
        }

        return (mapFilter.mapFilterType === "only_on") === this.hasMapMatch(serverMaps, mapFilter.maps);
    },

    hasMapMatch(serverMaps: MapDefKey[], available: MapFilter): boolean {
        return serverMaps.some(map => available.some(a => this.matchesFilter(map, a)));
    },

    matchesFilter(map: MapDefKey, filter: MapFilterEntry): boolean {
        return typeof filter === "string" ? filter === map : filter === MapDefs[map].mapId;
    },
};
