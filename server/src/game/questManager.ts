import { GameObjectDefs } from "../../../shared/defs/gameObjectDefs";
import { type QuestDef, QuestDefs } from "../../../shared/defs/gameObjects/questDefs";
import { MapObjectDefs } from "../../../shared/defs/mapObjectDefs";
import type { ObstacleDef } from "../../../shared/defs/mapObjectsTyping";
import { TeamModeToString } from "../../../shared/defs/types/misc";
import type { Game } from "./game";
import type { Player } from "./objects/player";

export class QuestManager {
    player: Player;
    game: Game;

    quests: Array<{ id: string; delta: number }> = [];
    private gameOverFlushed = false;

    constructor(player: Player) {
        this.player = player;
        this.game = player.game;
    }

    /**
     * When winningTeamId is not known yet it falls for the rank
     */
    trackGameOverQuests(winningTeamId?: number) {
        if (this.gameOverFlushed) return;

        const aliveCount = this.game.modeManager.aliveCount();
        const teamRank =
            winningTeamId !== undefined && winningTeamId == this.player.teamId
                ? 1
                : aliveCount + 1;

        this.trackEvent("survived", { seconds: this.player.timeAlive });
        this.trackEvent("placement", {
            rank: teamRank,
            mode: TeamModeToString[this.game.teamMode],
        });
    }

    flushProgress() {
        if (!this.player.userId || this.gameOverFlushed) return;
        this.gameOverFlushed = true;

        const progress = this.quests
            .map((quest) => ({
                id: quest.id,
                delta: Math.round(quest.delta),
            }))
            .filter((quest) => quest.delta > 0);

        if (progress.length === 0) return;

        this.game.sendQuestProgress(this.player.userId, progress);
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
        }
    }
}

export interface QuestEventPayloads {
    kill: { weaponType: string; buildingType: string };
    damage: { amount: number; weaponType: string };
    survived: { seconds: number };
    placement: { rank: number; mode: "solo" | "duo" | "squad" };
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
            const weapDef = GameObjectDefs[p.weaponType];
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
            const itemDef = GameObjectDefs[p.itemType];

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
            console.log({ payload });
            const p = payload as QuestEventPayloads["destruction"];
            const obstacleType = where?.obstacleType;

            if (!obstacleType) {
                return 0;
            }

            const objectDef = MapObjectDefs[p.objectType] as ObstacleDef | undefined;
            if (objectDef?.obstacleType) {
                value = objectDef.obstacleType === obstacleType ? 1 : 0;
                break;
            }

            value = p.objectType.startsWith(obstacleType) ? 1 : 0;
            break;
        }
    }

    if (value <= 0) {
        return 0;
    }

    return value;
}
