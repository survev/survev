import { GameConfig } from "../../../shared/gameConfig";
import type * as net from "../../../shared/net/net";
import type { LocalDataWithDirty } from "../../../shared/net/updateMsg";
import type { Game } from "../game";

export class ReplaySession {
    active = false;
    localDataById: Record<number, LocalDataWithDirty> = {};

    constructor(private readonly game: Game) {}

    reset() {
        this.active = false;
        this.localDataById = {};
    }

    start() {
        this.active = true;
        this.localDataById = {};
    }

    preserveState() {
        return {
            active: this.active,
            localDataById: this.localDataById,
        };
    }

    restoreState(state: ReturnType<ReplaySession["preserveState"]>) {
        this.active = state.active;
        this.localDataById = state.localDataById;
    }

    removePlayer(playerId: number) {
        delete this.localDataById[playerId];
    }

    mergeLocalData(playerId: number, incoming: LocalDataWithDirty) {
        this.localDataById[playerId] = this.mergeReplayLocalData(
            this.localDataById[playerId],
            incoming,
        );
    }

    getActiveLocalData() {
        return this.localDataById[this.game.m_activeId];
    }

    setWatchedPlayer(playerId: number) {
        const player = this.game.m_playerBarn.getPlayerById(playerId);
        if (!player) return;

        this.game.m_localId = playerId;
        this.game.m_activeId = playerId;
        this.game.m_spectating = true;
        this.game.m_activePlayer = player;

        const localData = this.localDataById[playerId];
        if (localData) {
            this.game.m_activePlayer.m_setLocalData(localData);
            this.game.m_uiManager.weapsDirty = true;
        }

        this.game.m_uiManager.setSpectateTarget(
            this.game.m_activeId,
            this.game.m_localId,
            this.game.teamMode,
            this.game.m_playerBarn,
        );
        this.game.m_touch.hideAll();
    }

    ensureWatchedPlayerValid() {
        const activePlayer = this.game.m_playerBarn.getPlayerById(this.game.m_activeId);
        if (activePlayer && !activePlayer.dead && !activePlayer.m_netData.m_dead) {
            return;
        }

        const alivePlayers = this.game.m_playerBarn.playerIds.filter((id) => {
            const player = this.game.m_playerBarn.getPlayerById(id);
            return !!player && !player.dead && !player.m_netData.m_dead;
        });
        if (alivePlayers.length > 0) {
            this.setWatchedPlayer(alivePlayers[0]);
            return;
        }

        const availablePlayers = this.game.m_playerBarn.playerIds.filter((id) => {
            return !!this.game.m_playerBarn.getPlayerById(id);
        });
        if (availablePlayers.length > 0) {
            this.setWatchedPlayer(availablePlayers[0]);
        }
    }

    cycleWatchedPlayer(direction: 1 | -1) {
        const candidates = this.game.m_playerBarn.playerIds.filter((id) => {
            return !!this.game.m_playerBarn.getPlayerById(id);
        });
        if (candidates.length === 0) return;

        const currentIdx = candidates.indexOf(this.game.m_activeId);
        const nextIdx =
            currentIdx === -1
                ? 0
                : (currentIdx + direction + candidates.length) % candidates.length;
        this.setWatchedPlayer(candidates[nextIdx]);
    }

    applyReplayPlayerChanges(msg: net.ReplayUpdateMsg) {
        for (let i = 0; i < msg.playerInfos.length; i++) {
            this.game.m_playerBarn.setPlayerInfo(msg.playerInfos[i]);
        }
        for (let i = 0; i < msg.deletedPlayerIds.length; i++) {
            this.game.m_playerBarn.deletePlayerInfo(msg.deletedPlayerIds[i]);
            this.removePlayer(msg.deletedPlayerIds[i]);
        }
        if (msg.playerInfos.length > 0 || msg.deletedPlayerIds.length > 0) {
            this.game.m_playerBarn.recomputeTeamData();
        }

        for (let i = 0; i < msg.playerStatuses.length; i++) {
            const status = msg.playerStatuses[i];
            this.game.m_playerBarn.setPlayerStatus(status.playerId, status);
        }

        for (let i = 0; i < msg.localPlayerData.length; i++) {
            const player = msg.localPlayerData[i];
            this.mergeLocalData(player.playerId, player.data);
        }

        if (!this.game.m_playerBarn.getPlayerById(this.game.m_activeId)) {
            this.setWatchedPlayer(
                this.game.m_localId || this.game.m_playerBarn.playerIds[0] || 0,
            );
        }
        if (
            !this.game.m_playerBarn.getPlayerById(this.game.m_activeId) &&
            msg.playerInfos.length > 0
        ) {
            this.setWatchedPlayer(msg.playerInfos[0].playerId);
        }

        this.ensureWatchedPlayerValid();

        const activePlayer = this.game.m_playerBarn.getPlayerById(this.game.m_activeId);
        if (!activePlayer) {
            return;
        }

        this.game.m_activePlayer = activePlayer;
        const activeLocalData = this.getActiveLocalData();
        if (activeLocalData) {
            this.game.m_activePlayer.m_setLocalData(activeLocalData);
        }

        this.game.m_uiManager.setSpectateTarget(
            this.game.m_activeId,
            this.game.m_localId,
            this.game.teamMode,
            this.game.m_playerBarn,
        );
        this.game.m_touch.hideAll();
    }

    private createEmptyReplayLocalData(): LocalDataWithDirty {
        return {
            healthDirty: true,
            health: 100,
            boostDirty: true,
            boost: 0,
            zoomDirty: true,
            zoom: 0,
            actionDirty: true,
            action: { time: 0, duration: 0, targetId: 0 },
            inventoryDirty: true,
            inventory: {},
            scope: "",
            weapsDirty: true,
            curWeapIdx: 0,
            weapons: Array.from({ length: GameConfig.WeaponSlot.Count }, () => ({
                type: "",
                ammo: 0,
            })),
            spectatorCountDirty: true,
            spectatorCount: 0,
        };
    }

    private cloneReplayLocalData(data: LocalDataWithDirty): LocalDataWithDirty {
        return {
            ...data,
            action: { ...data.action },
            inventory: { ...data.inventory },
            weapons: data.weapons.map((weapon) => ({ ...weapon })),
        };
    }

    private mergeReplayLocalData(
        current: LocalDataWithDirty | undefined,
        incoming: LocalDataWithDirty,
    ) {
        const next = current
            ? this.cloneReplayLocalData(current)
            : this.createEmptyReplayLocalData();

        if (incoming.healthDirty) next.health = incoming.health;
        if (incoming.boostDirty) next.boost = incoming.boost;
        if (incoming.zoomDirty) next.zoom = incoming.zoom;
        if (incoming.actionDirty) next.action = { ...incoming.action };
        if (incoming.inventoryDirty) {
            next.scope = incoming.scope;
            next.inventory = { ...incoming.inventory };
        }
        if (incoming.weapsDirty) {
            next.curWeapIdx = incoming.curWeapIdx;
            next.weapons = incoming.weapons.map((weapon) => ({ ...weapon }));
        }
        if (incoming.spectatorCountDirty) {
            next.spectatorCount = incoming.spectatorCount;
        }

        next.healthDirty = true;
        next.boostDirty = true;
        next.zoomDirty = true;
        next.actionDirty = true;
        next.inventoryDirty = true;
        next.weapsDirty = true;
        next.spectatorCountDirty = true;
        return next;
    }
}
