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
    SocketOpen,
    ClientSocketMsg,
    ServerSocketMsg,
    SocketClose,
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

export interface SocketOpenMsg {
    type: ProcessMsgType.SocketOpen;
    socketId: string;
    ip: string;
}

export interface SocketClientMsg {
    type: ProcessMsgType.ClientSocketMsg;
    socketId: string;
    data: ArrayBuffer | Uint8Array;
}

/**
 * msgs is an array to batch all msgs created in the same game net tick
 * into the same send call
 */
export interface SocketServerMsg {
    type: ProcessMsgType.ServerSocketMsg;
    msgs: Array<{
        socketId: string;
        data: ArrayBuffer | Uint8Array;
    }>;
}

/**
 * Sent by the server to the game when the socket is closed
 * Or by the game to the server when the game wants to close the socket
 */
export interface SocketCloseMsg {
    type: ProcessMsgType.SocketClose;
    socketId: string;
    reason?: string;
}

export type ProcessMsg =
    | CreateGameMsg
    | KeepAliveMsg
    | UpdateDataMsg
    | AddJoinTokenMsg
    | SocketOpenMsg
    | SocketClientMsg
    | SocketServerMsg
    | SocketCloseMsg;
