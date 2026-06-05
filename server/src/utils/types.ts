import { z } from "zod";
import type { MapDefs } from "../../../shared/defs/mapDefs";
import { TeamMode } from "../../../shared/gameConfig";
import type { FindGameError } from "../../../shared/types/api";
import { loadoutSchema } from "../../../shared/utils/loadout";
import type { MatchDataTable } from "../api/db/schema";

export interface GameSocketData {
    gameId: string;
    id: string;
    closed: boolean;
    rateLimit: Record<symbol, number>;
    ip: string;
    disconnectReason: string;
}

export const zUpdateRegionBody = z.object({
    regionId: z.string(),
    data: z.object({
        playerCount: z.number(),
    }),
});
export type UpdateRegionBody = z.infer<typeof zUpdateRegionBody>;

export const zSetGameModeBody = z.object({
    index: z.number(),
    team_mode: z.nativeEnum(TeamMode).optional(),
    map_name: z.string().optional(),
    enabled: z.boolean().optional(),
});

export const zSetClientThemeBody = z.object({
    theme: z.string(),
});

export interface SaveGameBody {
    matchData: (MatchDataTable & { ip: string; findGameIp: string })[];
}

export interface ServerGameConfig {
    readonly mapName: keyof typeof MapDefs;
    readonly teamMode: TeamMode;
}

export interface GameData {
    id: string;
    teamMode: TeamMode;
    mapName: string;
    canJoin: boolean;
    aliveCount: number;
    startedTime: number;
    stopped: boolean;
}

export const zFindGamePrivateBody = z.object({
    region: z.string(),
    version: z.number(),
    autoFill: z.boolean(),
    mapName: z.string(),
    teamMode: z.number(),
    playerData: z.array(
        z.object({
            token: z.string(),
            userId: z.string().nullable(),
            ip: z.string(),
            admin:z.boolean(),
            loadout: loadoutSchema.optional(),
        }),
    ),
});

export type FindGamePrivateBody = z.infer<typeof zFindGamePrivateBody>;

export type FindGamePrivateRes =
    | {
          gameId: string;
          useHttps: boolean;
          hosts: string[];
          addrs: string[];
      }
    | { error: FindGameError };

export enum ProcessMsgType {
    Create,
    Created,
    KeepAlive,
    UpdateData,
    AddJoinToken,
    AddJoinTokenAsSpectator,
    SocketMsg,
    SocketClose,
    // Dashboard IPC messages
    GetPlayerData,      // API server → game process: request live player list
    PlayerDataResponse, // game process → API server: live player list response
    AdminCmd,           // API server → game process: execute an admin action
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

export interface AddJoinTokenAsSpectatorMsg {
    type: ProcessMsgType.AddJoinTokenAsSpectator;
    autoFill: boolean;
    tokens: FindGamePrivateBody["playerData"];
}

/**
 * Used for server to send websocket msgs to game
 * And game to send websocket msgs to clients
 * msgs is an array to batch all msgs created in the same game net tick
 * into the same send call
 */
export interface SocketMsgsMsg {
    type: ProcessMsgType.SocketMsg;
    msgs: Array<{
        socketId: string;
        ip: string;
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

/** One player's live state, returned by GetPlayerData. */
export interface DashboardPlayer {
    username: string;
    userId: string;
    encodedIp: string;
    kills: number;
    assists: number;
    alive: boolean;
    isSpectator: boolean;
    isAdmin: boolean;
    disconnected: boolean;
}

export interface GetPlayerDataMsg {
    type: ProcessMsgType.GetPlayerData;
    /** Unique request id so the manager can match the response to its Promise. */
    requestId: string;
}

export interface PlayerDataResponseMsg {
    type: ProcessMsgType.PlayerDataResponse;
    requestId: string;
    players: DashboardPlayer[];
}

/** Actions the dashboard can trigger on a running game. */
export type AdminCmdAction =
    | { action: "freeze" }
    | { action: "unfreeze" }
    | { action: "verify" }
    | { action: "unverify" }
    | { action: "kick";            target: string }
    | { action: "announce";        text: string; color?: string; sender?: string }
    | { action: "announce_player"; target: string; text: string; color?: string; sender?: string };

export interface AdminCmdMsg {
    type: ProcessMsgType.AdminCmd;
    cmd: AdminCmdAction;
}

export type ProcessMsg =
    | CreateGameMsg
    | GameCreatedMsg
    | KeepAliveMsg
    | UpdateDataMsg
    | AddJoinTokenMsg
    | AddJoinTokenAsSpectatorMsg
    | SocketMsgsMsg
    | SocketCloseMsg
    | GetPlayerDataMsg
    | PlayerDataResponseMsg
    | AdminCmdMsg;

    export interface GameInfo {
    id: string,
    teamMode: TeamMode,
    playerCount: number,
    playerNames: string[],
    runtime: number,
    stopped: boolean,
    }
