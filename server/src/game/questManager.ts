import { type QuestDef, QuestDefs } from "../../../shared/defs/gameObjects/questDefs.ts";
import type { ObstacleDef } from "../../../shared/defs/mapObjectsTyping.ts";
import { GameObjectDefs, MapObjectDefs } from "../../../shared/defs/register.ts";
import type { TeamMode } from "../../../shared/gameConfig.ts";
import { MsgType, UpdatePassMsg } from "../../../shared/net/net.ts";
import { assert } from "../../../shared/utils/util.ts";
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
        this.trackEvent("survived", { seconds: this.player.timeAlive });
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

    trackEvent<K extends keyof QuestEventPayloads>(
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

export interface QuestEventPayloads {
    kill: { weaponType: string; buildingType: string };
    damage: { amount: number; weaponType: string };
    survived: { seconds: number };
    placement: { rank: number; mode: TeamMode };
    item_used: { itemType: string };
    destruction: { objectType: string };
}

export function questDelta<E extends keyof QuestEventPayloads>(
    def: QuestDef,
    event: E,
    payload: QuestEventPayloads[E],
): number {
    if (def.event !== event) {
        return 0;
    }

    const where = def.where;
    let value = 0;

    switch (event) {
        case "kill": {
            const p = payload as QuestEventPayloads["kill"];
            if (where?.buildingType && p.buildingType !== where.buildingType) {
                return 0;
            }
            value = 1;
            break;
        }

        case "damage": {
            const p = payload as QuestEventPayloads["damage"];
            const weapDef = GameObjectDefs.typeToDefSafe(p.weaponType);
            const ammo = weapDef?.type === "gun" ? weapDef.ammo : undefined;

            if (where?.ammo && ammo !== where.ammo) {
                return 0;
            }

            if (where?.weaponClass && weapDef?.type !== where.weaponClass) {
                return 0;
            }

            value = p.amount;
            break;
        }

        case "survived": {
            const p = payload as QuestEventPayloads["survived"];
            value = p.seconds;
            break;
        }

        case "placement": {
            const p = payload as QuestEventPayloads["placement"];

            if (where?.mode && p.mode !== where.mode) {
                return 0;
            }

            if (where?.maxRank !== undefined && p.rank > where.maxRank) {
                return 0;
            }

            value = 1;
            break;
        }

        case "item_used": {
            const p = payload as QuestEventPayloads["item_used"];
            const itemDef = GameObjectDefs.typeToDefSafe(p.itemType);

            if (where?.itemType && p.itemType !== where.itemType) {
                return 0;
            }

            if (where?.itemClass && itemDef?.type !== where.itemClass) {
                return 0;
            }

            value = 1;
            break;
        }

        case "destruction": {
            const p = payload as QuestEventPayloads["destruction"];
            const obstacleType = where?.obstacleType;

            if (!obstacleType) {
                return 0;
            }

            const objectDef = MapObjectDefs.typeToDefSafe(p.objectType) as ObstacleDef | undefined;
            if (objectDef?.obstacleType) {
                value = objectDef.obstacleType === obstacleType ? 1 : 0;
                break;
            }

            break;
        }
    }

    if (value <= 0) {
        return 0;
    }

    return value;
}
