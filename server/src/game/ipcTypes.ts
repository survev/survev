import type { MapDefKey } from "../../../shared/defs/mapDefs.ts";
import type { TeamMode } from "../../../shared/gameConfig.ts";
import type { DuelCombatSnapshot } from "../../../shared/types/rankedCombat.ts";
import type { DuelRoundStatus, FindGamePrivateBody, ServerGameConfig } from "../utils/types.ts";
import type { SpectateTokenData } from "./game.ts";

export interface GameData {
    id: string;
    teamMode: TeamMode;
    mapName: MapDefKey;
    canJoin: boolean;
    aliveCount: number;
    startedTime: number;
    stopped: boolean;
    timeRunning: number;
    duel?: DuelRoundStatus;
    duelCombat?: DuelCombatSnapshot;

    livingPlayers: Array<{
        id: number;
        userId: string | null;
        name: string;
        disconnected: boolean;
    }>;
}

export enum ProcessMsgType {
    Create,
    KeepAlive,
    UpdateData,
    AddJoinToken,
    AddSpectateToken,
    CancelDuel,
    RemoveDuelPlayer,
    DuelPlayerRemoved,
}

export interface CreateGameMsg {
    type: ProcessMsgType.Create;
    config: ServerGameConfig;
    id: string;
}

export interface KeepAliveMsg {
    type: ProcessMsgType.KeepAlive;
}

export interface UpdateDataMsg extends GameData {
    type: ProcessMsgType.UpdateData;
}

export interface AddJoinTokenMsg {
    type: ProcessMsgType.AddJoinToken;
    autoFill: boolean;
    tokens: FindGamePrivateBody["playerData"];
}

export interface AddSpectateTokenMsg {
    type: ProcessMsgType.AddSpectateToken;
    token: string;
    data: SpectateTokenData;
}

export interface CancelDuelMsg {
    type: ProcessMsgType.CancelDuel;
    seriesId: string;
    roundId: string;
}

export interface RemoveDuelPlayerMsg {
    type: ProcessMsgType.RemoveDuelPlayer;
    seriesId: string;
    roundId: string;
    profileId: string;
    requestId: string;
}

export interface DuelPlayerRemovedMsg {
    type: ProcessMsgType.DuelPlayerRemoved;
    requestId: string;
    combat?: DuelCombatSnapshot;
}

export type ProcessMsg =
    | CreateGameMsg
    | KeepAliveMsg
    | UpdateDataMsg
    | AddJoinTokenMsg
    | AddSpectateTokenMsg
    | CancelDuelMsg
    | RemoveDuelPlayerMsg
    | DuelPlayerRemovedMsg;
