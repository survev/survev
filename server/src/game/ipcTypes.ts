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
    timeRunning: number;
}

export enum ProcessMsgType {
    Create,
    KeepAlive,
    UpdateData,
    AddJoinToken,
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

export type ProcessMsg =
    | CreateGameMsg
    | KeepAliveMsg
    | UpdateDataMsg
    | AddJoinTokenMsg;
