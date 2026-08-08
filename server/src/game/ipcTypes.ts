import type { TeamMode } from "../../../shared/gameConfig";
import type { FindGamePrivateBody, ServerGameConfig, SpectateGamePrivateBody } from "../utils/types";

export interface GameData {
    id: string;
    teamMode: TeamMode;
    mapName: string;
    canJoin: boolean;
    aliveCount: number;
    startedTime: number;
    stopped: boolean;
    timeRunning: number;

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
    filter: SpectateGamePrivateBody["filter"];
}

export type ProcessMsg =
    | CreateGameMsg
    | KeepAliveMsg
    | UpdateDataMsg
    | AddJoinTokenMsg
    | AddSpectateTokenMsg;
