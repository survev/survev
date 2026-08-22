import {
    type Filter,
    type FilterParams,
    type FilterTypes,
    type QuestDef,
    QuestDefs,
    type QuestEvent,
    type SupportedFilters,
} from "../../../shared/defs/gameObjects/questDefs.ts";
import { GameObjectDefs } from "../../../shared/defs/register.ts";
import type { TeamMode } from "../../../shared/gameConfig.ts";
import { MsgType, UpdatePassMsg } from "../../../shared/net/net.ts";
import { math } from "../../../shared/utils/math.ts";
import { assert, type UnionToIntersection, util } from "../../../shared/utils/util.ts";
import type { Game } from "./game.ts";
import type { Player } from "./objects/player.ts";

export class QuestManager {
    player: Player;
    game: Game;

    quests: Array<{
        id: string;
        delta: number;
        /**
         * Should only be used for tests, because `delta` is reset after flushing
         */
        totalDelta: number;
    }> = [];
    private gameOverFlushed = false;
    private survivedFlushed = false;

    constructor(player: Player) {
        this.player = player;
        this.game = player.game;
    }

    /**
     * When winningTeamId is not known yet it falls for the rank
     */
    private trackPlacementQuests(winningTeamId?: number) {
        if (this.gameOverFlushed) return;
        if (!this.game.started) return;

        let playerOrGroupDead = false;
        if (this.game.map.factionMode || this.game.isTeamMode) {
            const group = this.player.team ?? this.player.group;
            assert(group, "Player has no group on a team mode");

            playerOrGroupDead = group.livingPlayers.length === 0;
        } else if (this.player.dead) {
            playerOrGroupDead = true;
        }

        const shouldTrack = playerOrGroupDead || this.game.over;
        if (!shouldTrack) return;

        this.gameOverFlushed = true;

        const aliveCount = this.game.modeManager.aliveCount();
        const teamRank = winningTeamId !== undefined && winningTeamId == this.player.teamId
            ? 1
            : aliveCount + 1;

        this.trackEvent("placement", {
            rank: teamRank,
            mode: this.game.teamMode,
        });
    }

    private trackSurvivedQuest() {
        if (this.survivedFlushed) return;

        const shouldTrack = this.player.dead || this.game.over;
        if (!shouldTrack) return;

        this.survivedFlushed = true;
        this.trackEvent("survived", { mode: this.game.teamMode, seconds: this.player.timeAlive });
    }

    flushProgress(winningTeamId?: number) {
        if (!this.player.userId) return;

        this.trackSurvivedQuest();
        this.trackPlacementQuests(winningTeamId);

        const progress = this.quests
            .map((quest) => ({
                id: quest.id,
                delta: Math.round(quest.delta),
            }))
            .filter((quest) => quest.delta > 0);

        if (progress.length === 0) return;

        if (!this.player.disconnected) {
            this.player.client.sendInstantMsg(MsgType.UpdatePass, new UpdatePassMsg());
        }

        this.game.sendQuestProgress(this.player.userId, progress);

        // reset the deltas in case they get flushed again
        for (const quest of this.quests) {
            quest.delta = 0;
        }
    }

    trackEvent<K extends QuestEvent>(
        payloadKey: K,
        payload: QuestEventPayloads[K],
    ): void {
        if (!this.player.userId) return;
        for (const quest of this.quests) {
            const def = QuestDefs[quest.id];
            if (!def || def.event !== payloadKey) continue;

            const delta = questDelta(def, payloadKey, payload);
            if (delta <= 0) continue;

            quest.delta += delta;
            quest.totalDelta += delta;
        }
    }
}

type PayloadByFilter = {
    team_mode: { mode: TeamMode };
    max_rank: { rank: number };
    building: { buildingType: string };
    role: { role: string };
    weapon: { weaponType: string };
    obstacle: { obstacleCategory?: string; obstacleType: string };
    item: { itemCategory: string; itemType: string };
};

type RequiredPayload<E extends QuestEvent> = UnionToIntersection<
    PayloadByFilter[SupportedFilters<E>[number]["type"]]
>;

interface QuestEventExtraPayload {
    kill: object;
    damage: { amount: number };
    survived: { seconds: number };
    placement: object;
    item_used: object;
    obstacle_used: object;
    destruction: object;
    promote: object;
}

export type QuestEventPayloads = { [E in QuestEvent]: RequiredPayload<E> & QuestEventExtraPayload[E] };

const filters: { [F in FilterTypes]: (payload: PayloadByFilter[F], filter: Filter<F>) => boolean } = {
    role(payload, filter) {
        return util.valueMatches(payload.role, filter.role);
    },
    team_mode(payload, filter) {
        return payload.mode === filter.mode;
    },
    max_rank(payload, filter) {
        return payload.rank <= filter.maxRank;
    },
    building(payload, filter) {
        if (filter.subType === "type") {
            return util.valueMatches(payload.buildingType, filter.buildingType);
        } else {
            return util.valueMatches(payload.buildingType, filter.structureCategory);
        }
    },
    obstacle(payload, filter) {
        if (filter.subType === "type") {
            return util.valueMatches(payload.obstacleType, filter.obstacleType);
        } else {
            return util.valueMatches<string | undefined>(payload.obstacleCategory, filter.obstacleCategory);
        }
    },
    weapon(payload, filter) {
        const weapDef = GameObjectDefs.typeToDefSafe(payload.weaponType);
        if (weapDef?.type !== filter.weaponClass) {
            return false;
        }

        if (filter.weaponClass === "gun" && weapDef.type === "gun" && filter.ammo !== undefined) {
            if (!util.valueMatches(weapDef.ammo, filter.ammo)) {
                return false;
            }
        }

        return true;
    },
    item(payload, filter) {
        if (filter.subType === "type") {
            return util.valueMatches(payload.itemType, filter.itemType);
        } else {
            return util.valueMatches(payload.itemCategory, filter.itemCategory);
        }
    },
};

export function questDelta<E extends QuestEvent>(
    def: QuestDef,
    event: E,
    payload: QuestEventPayloads[E],
): number {
    if (def.event !== event) {
        return 0;
    }

    for (const filter of def.filters ?? []) {
        type FilterFn = (_0: PayloadByFilter[typeof filter.type], _1: FilterParams[typeof filter.type]) => boolean;

        if (
            !(filters[filter.type] as FilterFn)(
                payload as PayloadByFilter[typeof filter.type],
                filter,
            )
        ) {
            return 0;
        }
    }

    let value = 0;

    switch (event) {
        case "kill":
        case "placement":
        case "item_used":
        case "destruction":
        case "promote": {
            value = 1;
            break;
        }

        case "damage": {
            const p = payload as QuestEventPayloads["damage"];
            value = p.amount;
            break;
        }

        case "survived": {
            const p = payload as QuestEventPayloads["survived"];
            value = p.seconds;
            break;
        }
    }

    return math.max(0, value);
}
