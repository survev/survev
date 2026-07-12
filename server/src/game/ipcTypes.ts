import type { TeamMode } from "../../../shared/gameConfig";
import type { FindGamePrivateBody, ServerGameConfig } from "../utils/types";

export interface GameData {
    id: string;
    teamMode: TeamMode;
    mapName: string;
    canJoin: boolean;
    aliveCount: number;
    startedTime: number;
    stopped: boolean;
}

export enum ProcessMsgType {
    Create,
    Created,
    KeepAlive,
    UpdateData,
    AddJoinToken,
}

export interface CreateGameMsg {
    type: ProcessMsgType.Create;
    config: ServerGameConfig;
    id: string;
}

export interface GameCreatedMsg {
    type: ProcessMsgType.Created;
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

export type ProcessMsg =
    | CreateGameMsg
    | GameCreatedMsg
    | KeepAliveMsg
    | UpdateDataMsg
    | AddJoinTokenMsg;
