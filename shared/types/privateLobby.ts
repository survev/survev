// /api/private_lobby_v2 websocket msgs typing

import { z } from "zod";
import type { FindGameMatchData } from "./api";

export type PrivateLobbyErrorType =
    | "join_full"
    | "join_not_found"
    | "join_failed"
    | "create_failed"
    | "lost_conn"
    | "join_game_failed"
    | "find_game_error"
    | "find_game_full"
    | "find_game_invalid_protocol"
    | "kicked"
    | "banned"
    | "behind_proxy"
    | "rate_limited"
    | "login_required"
    | "mode_disabled"
    | "team_full"
    | "host_left";

export interface RoomData {
    roomUrl: string;
    findingGame: boolean;
    lastError: PrivateLobbyErrorType | "";
    region: string;
    enabledGameModeIdxs: number[];
    gameModeIdx: number;
    /** Full lobby capacity, taken from the selected mode's map (`mapDef.gameMode.maxPlayers`). */
    maxPlayers: number;
    /** Number of players per team for the selected mode (1 for Solo). */
    teamSize: number;
    /** Number of team slots available (`maxPlayers / teamSize`). */
    teamCount: number;
    /** Arena-mode roles the leader has enabled for the match (subset of the map's `arenaModeRoles`). Empty for non-arena modes. */
    enabledArenaRoles: string[];
}

//
// Private lobby msgs that the server sends to clients
//

/**
 * send by the server to all clients to make them join the game
 */
export interface PrivateLobbyJoinGameMsg {
    readonly type: "joinGame";
    data: FindGameMatchData;
}

export interface PrivateLobbyMenuPlayer {
    name: string;
    playerId: number;
    isLeader: boolean;
    inGame: boolean;
    /** Lobby-local team slot index this player is currently assigned to. */
    teamId: number;
    /** True when the player has self-marked as AFK. Cleared automatically when a match starts. */
    afk: boolean;
}

/**
 * Send by the server to update the client lobby ui
 */
export interface PrivateLobbyStateMsg {
    readonly type: "state";
    data: {
        localPlayerId: number; // always -1 by default since it can only be set when the socket is actually sending state to each individual client
        room: RoomData;
        players: PrivateLobbyMenuPlayer[];
    };
}

/**
 * Send by the server when the player gets kicked from the lobby room
 */
export interface PrivateLobbyKickedMsg {
    readonly type: "kicked";
    data: {};
}

/**
 * Sent by the server to every in-game member of the lobby when the leader
 * pulls the whole lobby out of an active match early (see Room#forceQuitGame).
 * The client force-disconnects from its current match and returns to the lobby.
 */
export interface PrivateLobbyForceQuitMsg {
    readonly type: "forceQuit";
    data: {};
}

export interface PrivateLobbyErrorMsg {
    readonly type: "error";
    data: {
        type: PrivateLobbyErrorType;
    };
}

export type ServerToClientPrivateLobbyMsg =
    | PrivateLobbyJoinGameMsg
    | PrivateLobbyStateMsg
    | PrivateLobbyKeepAliveMsg
    | PrivateLobbyKickedMsg
    | PrivateLobbyForceQuitMsg
    | PrivateLobbyErrorMsg;

//
// Private lobby msgs that the client sends to the server
//

export const zClientRoomData = z.object({
    roomUrl: z.string(),
    findingGame: z.boolean(),
    lastError: z.string(),
    region: z.string(),
    gameModeIdx: z.number(),
    enabledArenaRoles: z.array(z.string()).optional(),
});

export type ClientRoomData = z.infer<typeof zClientRoomData>;

export const zKeepAliveMsg = z.object({
    type: z.literal("keepAlive"),
    data: z.object({}).optional(),
});
export type PrivateLobbyKeepAliveMsg = z.infer<typeof zKeepAliveMsg>;

export const zPrivateLobbyJoinMsg = z.object({
    type: z.literal("join"),
    data: z.object({
        roomUrl: z.string(),
        playerData: z.object({
            name: z.string(),
        }),
        /**
         * Set when joining as part of a pre-formed "Create Team" group handoff.
         * All joins sharing the same id within a short window are placed together
         * into the same team slot (see section 5 of the private lobby plan).
         */
        importGroupId: z.string().optional(),
        /**
         * Set when joining via a team-specific invite link/code (e.g. "ABC123-2").
         * Places the player directly into that team slot, or rejects the join
         * with a "team_full" error if it has no room (see Room.addPlayer).
         */
        teamId: z.number().optional(),
    }),
});
export type PrivateLobbyJoinMsg = z.infer<typeof zPrivateLobbyJoinMsg>;

export const zPrivateLobbyChangeNameMsg = z.object({
    type: z.literal("changeName"),
    data: z.object({
        name: z.string(),
    }),
});

export type PrivateLobbyChangeNameMsg = z.infer<typeof zPrivateLobbyChangeNameMsg>;

export const zPrivateLobbySetRoomPropsMsg = z.object({
    type: z.literal("setRoomProps"),
    data: zClientRoomData,
});

export type PrivateLobbySetRoomPropsMsg = z.infer<typeof zPrivateLobbySetRoomPropsMsg>;

export const zPrivateLobbyCreateMsg = z.object({
    type: z.literal("create"),
    data: z.object({
        roomData: zClientRoomData,
        playerData: z.object({
            name: z.string(),
        }),
    }),
});

export type PrivateLobbyCreateMsg = z.infer<typeof zPrivateLobbyCreateMsg>;

export const zPrivateLobbyKickMsg = z.object({
    type: z.literal("kick"),
    data: z.object({
        playerId: z.number(),
    }),
});

export type PrivateLobbyKickMsg = z.infer<typeof zPrivateLobbyKickMsg>;

/** Leader-only: hands lobby ownership over to another player. */
export const zPrivateLobbyPromoteMsg = z.object({
    type: z.literal("promote"),
    data: z.object({
        playerId: z.number(),
    }),
});

export type PrivateLobbyPromoteMsg = z.infer<typeof zPrivateLobbyPromoteMsg>;

/** Leader-only: moves a player into a different team slot. */
export const zPrivateLobbyAssignTeamMsg = z.object({
    type: z.literal("assignTeam"),
    data: z.object({
        playerId: z.number(),
        teamId: z.number(),
    }),
});

export type PrivateLobbyAssignTeamMsg = z.infer<typeof zPrivateLobbyAssignTeamMsg>;

/** Leader-only: swaps two players' team slots. */
export const zPrivateLobbySwapTeamMsg = z.object({
    type: z.literal("swapTeam"),
    data: z.object({
        playerId: z.number(),
        targetPlayerId: z.number(),
    }),
});

export type PrivateLobbySwapTeamMsg = z.infer<typeof zPrivateLobbySwapTeamMsg>;

/** Any player: toggles their own AFK state. */
export const zPrivateLobbySetAfkMsg = z.object({
    type: z.literal("setAfk"),
    data: z.object({ afk: z.boolean() }),
});

export type PrivateLobbySetAfkMsg = z.infer<typeof zPrivateLobbySetAfkMsg>;

/** Leader-only: pulls the whole lobby out of an active match back to the lobby. */
export const zPrivateLobbyLeaveGameMsg = z.object({
    type: z.literal("leaveGame"),
    data: z.object({}).optional(),
});

export type PrivateLobbyLeaveGameMsg = z.infer<typeof zPrivateLobbyLeaveGameMsg>;

export const zPrivateLobbyPlayGameMsg = z.object({
    type: z.literal("playGame"),
    data: z.object({
        version: z.number(),
        region: z.string(),
    }),
});

export type PrivateLobbyPlayGameMsg = z.infer<typeof zPrivateLobbyPlayGameMsg>;

export const zGameCompleteMsg = z.object({
    type: z.literal("gameComplete"),
    data: z.object({}).optional(),
});

export type PrivateLobbyGameCompleteMsg = z.infer<typeof zGameCompleteMsg>;

export const zPrivateLobbyClientMsg = z.discriminatedUnion("type", [
    zPrivateLobbyCreateMsg,
    zPrivateLobbySetRoomPropsMsg,
    zPrivateLobbyJoinMsg,
    zPrivateLobbyPlayGameMsg,
    zPrivateLobbyLeaveGameMsg,
    zPrivateLobbySetAfkMsg,
    zPrivateLobbyKickMsg,
    zPrivateLobbyPromoteMsg,
    zPrivateLobbyAssignTeamMsg,
    zPrivateLobbySwapTeamMsg,
    zPrivateLobbyChangeNameMsg,
    zGameCompleteMsg,
    zKeepAliveMsg,
]);

export type ClientToServerPrivateLobbyMsg =
    | PrivateLobbyKeepAliveMsg
    | PrivateLobbyJoinMsg
    | PrivateLobbyChangeNameMsg
    | PrivateLobbySetRoomPropsMsg
    | PrivateLobbyCreateMsg
    | PrivateLobbyKickMsg
    | PrivateLobbyPromoteMsg
    | PrivateLobbyAssignTeamMsg
    | PrivateLobbySwapTeamMsg
    | PrivateLobbyGameCompleteMsg
    | PrivateLobbyPlayGameMsg
    | PrivateLobbyLeaveGameMsg
    | PrivateLobbySetAfkMsg;
