import { randomUUID } from "crypto";
import { inArray } from "drizzle-orm";
import type { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { UpgradeWebSocket, WSContext } from "hono/ws";
import { type MapDef, MapDefs } from "../../shared/defs/mapDefs";
import type { FindGameError } from "../../shared/types/api";
import {
    type ClientRoomData,
    type ClientToServerPrivateLobbyMsg,
    type PrivateLobbyErrorMsg,
    type PrivateLobbyErrorType,
    type PrivateLobbyMenuPlayer,
    type PrivateLobbyPlayGameMsg,
    type RoomData,
    type ServerToClientPrivateLobbyMsg,
    zPrivateLobbyClientMsg,
} from "../../shared/types/privateLobby";
import type { Loadout } from "../../shared/utils/loadout";
import { assert, util } from "../../shared/utils/util";
import type { ApiServer } from "./api/apiServer";
import { validateSessionToken } from "./api/auth";
import { db } from "./api/db";
import { usersTable } from "./api/db/schema";
import { hashIp, isBanned } from "./api/routes/private/ModerationRouter";
import { Config } from "./config";
import { ServerLogger } from "./utils/logger";
import {
    getHonoIp,
    HTTPRateLimit,
    isBehindProxy,
    validateUserName,
    WebSocketRateLimit,
} from "./utils/serverHelpers";
import type { FindGamePrivateBody } from "./utils/types";

interface SocketData {
    rateLimit: Record<symbol, number>;
    player: Player;
    ip: string;
}

class Player {
    room?: Room;

    name = "Player";

    inGame = false;
    afk = false;

    /** Lobby-local team slot index. Reassigned by the leader via `assignTeam`. */
    teamId = 0;

    get isLeader() {
        // ownership is explicit (see Room#leader) — the room's creator starts
        // as leader, and it only changes via Room#promote, not by player order
        return !!this.room && this.room.leader === this;
    }

    get playerId() {
        return this.room ? this.room.players.indexOf(this) : -1;
    }

    get data(): PrivateLobbyMenuPlayer {
        return {
            name: this.name,
            inGame: this.inGame,
            isLeader: this.isLeader,
            playerId: this.playerId,
            teamId: this.teamId,
            afk: this.afk,
        };
    }

    lastMsgTime = Date.now();

    disconnectTimeout: ReturnType<typeof setTimeout>;

    encodedIp: string;
    admin: boolean;

    constructor(
        public socket: WSContext<SocketData>,
        public privateLobbyMenu: PrivateLobbyMenu,
        public userId: string | null,
        public ip: string,
        admin = false,
    ) {
        this.admin = admin;
        this.encodedIp = hashIp(ip);
        // disconnect if didn't join a room in 5 seconds
        this.disconnectTimeout = setTimeout(() => {
            if (!this.room) {
                this.socket.close();
            }
        }, 5000);
    }

    setName(name: string) {
        this.name = validateUserName(name).validName;
    }

    send<T extends ServerToClientPrivateLobbyMsg["type"]>(
        type: T,
        data: (ServerToClientPrivateLobbyMsg & { type: T })["data"],
    ) {
        this.socket.send(
            JSON.stringify({
                type,
                data,
            }),
        );
    }
}

class Room {
    players: Player[] = [];

    /**
     * Explicit lobby ownership — set to the room's creator on first join, and
     * only changes via `promote`. Unlike player order, this never shifts on
     * its own: if the leader disconnects, the lobby closes (see `removePlayer`)
     * rather than handing control to whoever's left.
     */
    leader?: Player;

    data: RoomData = {
        roomUrl: "",
        findingGame: false,
        lastError: "",
        region: "",
        enabledGameModeIdxs: [],
        gameModeIdx: 0,
        maxPlayers: 1,
        teamSize: 1,
        teamCount: 1,
        enabledArenaRoles: [],
    };

    constructor(
        public privateLobbyMenu: PrivateLobbyMenu,
        public id: string,
        initialData: ClientRoomData,
    ) {
        this.data.roomUrl = `#${id}`;
        this.data.enabledGameModeIdxs = privateLobbyMenu.allowedGameModeIdxs(
            initialData.region,
        );

        this.setProps(initialData);
    }

    /**
     * Pre-formed "Create Team" groups handed off via `importGroupId`, keyed by that id.
     * Held in a grace window so all members land in the same team slot together
     * instead of being scattered one-by-one (see `queueImportedPlayer`/`finalizeImportGroup`).
     */
    pendingImports = new Map<
        string,
        { players: Player[]; timeout: ReturnType<typeof setTimeout> }
    >();

    addPlayer(player: Player, importGroupId?: string, teamId?: number) {
        if (this.players.length >= this.data.maxPlayers) return;

        this.players.push(player);
        player.room = this;
        if (!this.leader) this.leader = player;

        clearTimeout(player.disconnectTimeout);

        if (teamId !== undefined) {
            // joined via a team-specific invite link/code; onMsg already
            // checked the slot has room before we got here
            player.teamId = teamId;
        } else if (importGroupId) {
            // placement deferred until the whole group has had a chance to join
            player.teamId = -1;
            this.queueImportedPlayer(importGroupId, player);
        } else {
            player.teamId = this.firstOpenTeamSlot();
        }

        this.sendState();
    }

    /** Returns the lowest-index team slot that still has room for another player. */
    firstOpenTeamSlot(): number {
        const counts = new Array(this.data.teamCount).fill(0);
        for (const p of this.players) {
            if (p.teamId >= 0 && p.teamId < counts.length) counts[p.teamId]++;
        }
        for (let i = 0; i < counts.length; i++) {
            if (counts[i] < this.data.teamSize) return i;
        }
        return 0;
    }

    /** True if `teamId` is a valid slot index that still has room for another player. */
    teamSlotHasRoom(teamId: number): boolean {
        if (teamId < 0 || teamId >= this.data.maxPlayers) return false;
        const count = this.players.filter((p) => p.teamId === teamId).length;
        return count < this.data.teamSize;
    }

    /** Returns the lowest-index team slot with enough free space for `size` players together, or -1 if none fits. */
    findTeamSlotForGroup(size: number): number {
        const counts = new Array(this.data.teamCount).fill(0);
        for (const p of this.players) {
            if (p.teamId >= 0 && p.teamId < counts.length) counts[p.teamId]++;
        }
        for (let i = 0; i < counts.length; i++) {
            if (this.data.teamSize - counts[i] >= size) return i;
        }
        return -1;
    }

    queueImportedPlayer(importGroupId: string, player: Player) {
        let pending = this.pendingImports.get(importGroupId);
        if (!pending) {
            pending = {
                players: [],
                timeout: setTimeout(() => this.finalizeImportGroup(importGroupId), 3000),
            };
            this.pendingImports.set(importGroupId, pending);
        }
        pending.players.push(player);
    }

    /** Places every member of an imported group into one team slot, falling back to individual placement if none fits. */
    finalizeImportGroup(importGroupId: string) {
        const pending = this.pendingImports.get(importGroupId);
        if (!pending) return;
        this.pendingImports.delete(importGroupId);
        clearTimeout(pending.timeout);

        // drop members that disconnected/left during the grace window
        const players = pending.players.filter((p) => p.room === this);
        if (!players.length) return;

        const teamId = this.findTeamSlotForGroup(players.length);

        for (const player of players) {
            player.teamId = teamId >= 0 ? teamId : this.firstOpenTeamSlot();
        }

        this.sendState();
    }

    onMsg(player: Player, msg: ClientToServerPrivateLobbyMsg) {
        if (player.room !== this) return;

        player.lastMsgTime = Date.now();
        switch (msg.type) {
            case "changeName": {
                player.setName(msg.data.name);
                this.sendState();
                break;
            }
            case "keepAlive": {
                player.send("keepAlive", {});
                break;
            }
            case "gameComplete": {
                player.inGame = false;
                this.sendState();
                break;
            }
            case "setRoomProps": {
                if (!player.isLeader) break;
                this.setProps(msg.data);
                break;
            }
            case "kick": {
                if (!player.isLeader) break;
                this.kick(msg.data.playerId);
                break;
            }
            case "promote": {
                if (!player.isLeader) break;
                this.promote(msg.data.playerId);
                break;
            }
            case "assignTeam": {
                if (!player.isLeader) break;
                this.assignTeam(msg.data.playerId, msg.data.teamId);
                break;
            }
            case "swapTeam": {
                if (!player.isLeader) break;
                this.swapTeam(msg.data.playerId, msg.data.targetPlayerId);
                break;
            }
            case "playGame": {
                if (!player.isLeader) break;
                this.findGame(msg.data);
                break;
            }
            case "leaveGame": {
                if (!player.isLeader) break;
                this.forceQuitGame();
                break;
            }
            case "setAfk": {
                player.afk = msg.data.afk;
                this.sendState();
                break;
            }
        }
    }

    /** Leader-only: moves a player into a different (non-full) team slot. */
    assignTeam(playerId: number, teamId: number) {
        const player = this.players[playerId];
        if (!player) return;
        // Lobbies allow custom layouts beyond the mode's nominal team count
        // (e.g. splitting a squad lobby into more, smaller teams), so any slot
        // index up to maxPlayers is valid — there just can't be more useful
        // team slots than there are players to fill them.
        if (teamId < 0 || teamId >= this.data.maxPlayers) return;
        if (player.teamId === teamId) return;

        const teamSize = this.players.filter(
            (p) => p !== player && p.teamId === teamId,
        ).length;
        if (teamSize >= this.data.teamSize) return;

        player.teamId = teamId;
        this.sendState();
    }

    /** Leader-only: swaps two players' team slots. */
    swapTeam(playerId: number, targetPlayerId: number) {
        const player = this.players[playerId];
        const target = this.players[targetPlayerId];
        if (!player || !target || player === target) return;

        const teamId = player.teamId;
        player.teamId = target.teamId;
        target.teamId = teamId;

        this.sendState();
    }

    /** Leader-only: hands lobby ownership over to another player. */
    promote(playerId: number) {
        const player = this.players[playerId];
        if (!player || player === this.leader) return;

        this.leader = player;
        this.sendState();
    }

    setProps(props: ClientRoomData) {
        let region = props.region;
        if (!(region in Config.regions)) {
            region = Object.keys(Config.regions)[0];
        }
        this.data.region = region;

        let gameModeIdx = props.gameModeIdx;

        const modes = this.privateLobbyMenu.server.modesByRegion[this.data.region] ?? [];

        if (!this.data.enabledGameModeIdxs.includes(gameModeIdx)) {
            // we don't allow creating lobbies if there's no valid mode
            // so this will never be -1
            gameModeIdx = this.data.enabledGameModeIdxs[0];
        }

        this.data.gameModeIdx = gameModeIdx;

        const mode = modes[gameModeIdx];
        const mapDef = MapDefs[mode.mapName as keyof typeof MapDefs] as MapDef;

        this.data.maxPlayers = mapDef.gameMode.maxPlayers;
        this.data.teamSize = mode.teamMode;
        this.data.teamCount = Math.max(
            1,
            Math.floor(this.data.maxPlayers / this.data.teamSize),
        );

        // Arena-mode maps describe a pool of selectable roles (e.g. Sniper/Medic);
        // the leader can narrow that pool down to the ones they want played.
        // Keep only roles that are still valid for the (possibly new) mode, and
        // fall back to the full pool whenever nothing valid was selected — this
        // also covers initial room creation and mode switches that change the pool.
        const arenaRoles = mapDef.gameMode.arenaMode ? (mapDef.gameMode.arenaModeRoles ?? []) : [];
        let enabledArenaRoles = (props.enabledArenaRoles ?? []).filter((role) =>
            arenaRoles.includes(role),
        );
        if (!enabledArenaRoles.length) {
            enabledArenaRoles = [...arenaRoles];
        }
        this.data.enabledArenaRoles = enabledArenaRoles;

        // kick players that don't fit on the new max players — but never the
        // leader (who's the only one able to trigger this): since ownership no
        // longer follows player order, they could otherwise end up anywhere in
        // the list and kick themselves, closing the lobby mid-update (see
        // removePlayer/close)
        while (this.players.length > this.data.maxPlayers) {
            let idx = this.players.length - 1;
            while (idx >= 0 && this.players[idx] === this.leader) idx--;
            if (idx < 0) break;
            this.kick(idx);
        }

        // re-bucket players that fell outside the new team layout, or that now
        // overflow their team's capacity (e.g. switching from 2v2 to 1v1 while
        // doubled up) — players keep their slot if it still fits, otherwise they
        // move to the first team with room (or become unassigned if none fits)
        const teamCounts = new Array(this.data.teamCount).fill(0);
        for (const player of this.players) {
            if (
                player.teamId >= 0 &&
                player.teamId < this.data.teamCount &&
                teamCounts[player.teamId] < this.data.teamSize
            ) {
                teamCounts[player.teamId]++;
                continue;
            }

            let slot = -1;
            for (let i = 0; i < this.data.teamCount; i++) {
                if (teamCounts[i] < this.data.teamSize) {
                    slot = i;
                    break;
                }
            }
            player.teamId = slot;
            if (slot >= 0) teamCounts[slot]++;
        }

        this.sendState();
    }

    kick(playerId: number) {
        const player = this.players[playerId];
        if (!player) return;

        player.send("kicked", {});

        this.removePlayer(player);
    }

    removePlayer(player: Player) {
        if (!util.removeFrom(this.players, player)) {
            return;
        }

        player.room = undefined;
        player.socket.close();

        // Ownership doesn't shift to whoever's left — if the leader goes,
        // the lobby goes with them.
        if (player === this.leader) {
            this.close("host_left");
            return;
        }

        this.sendState();

        if (!this.players.length) {
            this.privateLobbyMenu.removeRoom(this);
        }
    }

    /** Disconnects every remaining member (e.g. after the leader leaves) and removes the room. */
    close(reason: PrivateLobbyErrorType) {
        for (const player of this.players) {
            player.send("error", { type: reason });
            player.room = undefined;
            player.socket.close();
        }
        this.players = [];

        this.privateLobbyMenu.removeRoom(this);
    }

    /**
     * Leader-only: pulls every in-game member of the lobby out of the active
     * match and back to the lobby. The actual match keeps running on the game
     * server — this just tells each client to disconnect from it early, the
     * same way a normal early-exit/disconnect does.
     */
    forceQuitGame() {
        let pulledAnyone = false;
        for (const player of this.players) {
            if (!player.inGame) continue;
            player.inGame = false;
            player.send("forceQuit", {});
            pulledAnyone = true;
        }
        if (pulledAnyone) this.sendState();
    }

    findGameCooldown = 0;

    async findGame(data: PrivateLobbyPlayGameMsg["data"]) {
        if (this.data.findingGame) return;
        if (this.players.some((p) => p.inGame)) return;
        if (!this.players.length) return;
        const roomLeader = this.players[0];
        if (!roomLeader) return;

        this.data.findingGame = true;
        this.sendState();

        let region = data.region;
        if (!(region in Config.regions)) {
            region = Object.keys(Config.regions)[0];
        }
        this.data.region = region;

        const tokenMap = new Map<Player, string>();

        const userIds = this.players.map((p) => p.userId).filter((p) => p !== null);

        let loadouts: Array<{ userId: string; loadout: Loadout }> = [];
        if (userIds.length > 0) {
            loadouts = await db
                .select({
                    userId: usersTable.id,
                    loadout: usersTable.loadout,
                })
                .from(usersTable)
                .where(inArray(usersTable.id, userIds));
        }

        const regionModes = this.privateLobbyMenu.server.modesByRegion[region] ?? [];
        const mode = regionModes[this.data.gameModeIdx];
        if (!mode || !mode.enabled) {
            this.data.findingGame = false;
            this.data.lastError = "mode_disabled";
            this.sendState();
            return;
        }

        // group players by their assigned team slot, preserving join order within each team;
        // each bucket lands in its own in-game Group (see Game.addGroupedJoinTokens)
        const teamBuckets = new Map<number, Player[]>();
        for (const player of this.players) {
            let bucket = teamBuckets.get(player.teamId);
            if (!bucket) {
                bucket = [];
                teamBuckets.set(player.teamId, bucket);
            }
            bucket.push(player);
        }

        const teams = [...teamBuckets.values()].map((bucket) =>
            bucket.map((p) => {
                const token = randomUUID();
                tokenMap.set(p, token);
                return {
                    token,
                    userId: p.userId,
                    ip: p.ip,
                    admin: p.admin,
                    loadout: loadouts.find((l) => l.userId == p.userId)?.loadout,
                } satisfies FindGamePrivateBody["playerData"][0];
            }),
        );

        const res = await this.privateLobbyMenu.server.createPrivateGame({
            mapName: mode.mapName,
            teamMode: mode.teamMode,
            region,
            version: data.version,
            teams,
            arenaRoles: this.data.enabledArenaRoles,
        });

        if ("error" in res) {
            const errMap: Partial<Record<FindGameError, PrivateLobbyErrorType>> = {
                full: "find_game_full",
                invalid_protocol: "find_game_invalid_protocol",
            };

            this.data.findingGame = false;
            this.data.lastError = errMap[res.error] || "find_game_error";
            this.sendState();
            // 1 second cooldown on error
            this.findGameCooldown = Date.now() + 1000;
            return;
        }

        this.findGameCooldown = Date.now() + 5000;

        this.data.lastError = "";

        for (const player of this.players) {
            player.inGame = true;
            player.afk = false; // clear AFK when the match begins
            const token = tokenMap.get(player);

            if (!token) {
                this.privateLobbyMenu.logger.warn(
                    `Missing token for player ${player.name}`,
                );
                continue;
            }

            player.send("joinGame", {
                zone: "",
                data: token,
                gameId: res.gameId,
                addrs: res.addrs,
                hosts: res.hosts,
                useHttps: res.useHttps,
            });
        }

        this.sendState();
    }

    sendState() {
        const players = this.players.map((p) => p.data);
        for (const player of this.players) {
            player.send("state", {
                localPlayerId: player.playerId,
                room: this.data,
                players,
            });
        }
    }
}

const lobbyCodeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
// 6 chars (vs. 4 for team codes) so lobby codes/links can be told apart from
// team codes/links — keep PRIVATE_LOBBY_CODE_LENGTH in client/src/main.ts in sync
function generateLobbyCode(): string {
    let str = "";
    for (let i = 0; i < 6; i++) {
        str += lobbyCodeCharacters.charAt(
            Math.floor(Math.random() * lobbyCodeCharacters.length),
        );
    }
    return `${str}`;
}

export class PrivateLobbyMenu {
    rooms = new Map<string, Room>();

    logger = new ServerLogger("PrivateLobbyMenu");

    playersByIp = new Map<string, Set<Player>>();

    constructor(public server: ApiServer) {
        setInterval(() => {
            for (const room of this.rooms.values()) {
                // just making sure ig
                if (!room.players.length) {
                    this.removeRoom(room);
                    continue;
                }
                if (room.data.findingGame && room.findGameCooldown < Date.now()) {
                    room.data.findingGame = false;
                    room.sendState();
                }

                // kick players that haven't sent a keep alive msg in over a minute
                // client sends it every 45 seconds
                for (const player of room.players) {
                    if (player.lastMsgTime < Date.now() - 8 * 60 * 1000) {
                        player.send("error", { type: "lost_conn" });
                        room.removePlayer(player);
                    }
                }
            }
        }, 1000);
    }

    /** Any enabled mode is allowed in private lobbies, including Solo (unlike teams). */
    allowedGameModeIdxs(region: string) {
        const regionModes = this.server.modesByRegion[region] ?? [];

        return regionModes
            .map((mode, i) => ({ mode, i }))
            .filter(({ mode }) => mode.enabled)
            .map(({ i }) => i);
    }

    init(app: Hono, upgradeWebSocket: UpgradeWebSocket) {
        const privateLobbyMenu = this;

        const httpRateLimit = new HTTPRateLimit(5, 2000);
        const wsRateLimit = new WebSocketRateLimit(50, 1000, 5);

        app.get(
            "/private_lobby_v2",
            upgradeWebSocket(async (c) => {
                const ip = getHonoIp(c, Config.apiServer.proxyIPHeader);

                let closeReason: PrivateLobbyErrorType | undefined;
                if (
                    !ip ||
                    httpRateLimit.isRateLimited(ip) ||
                    wsRateLimit.isIpRateLimited(ip)
                ) {
                    closeReason = "rate_limited";
                }

                if (await isBanned(ip!)) {
                    closeReason = "banned";
                }

                let userId: string | null = null;
                let admin = false;
                const sessionId = getCookie(c, "session") ?? null;

                if (sessionId) {
                    try {
                        const account = await validateSessionToken(sessionId);
                        userId = account.user?.id || null;
                        admin = account.user?.admin ?? false;

                        if (account.user?.banned) {
                            userId = null;
                            admin = false;
                        }
                    } catch (err) {
                        this.logger.error(`Failed to validate session:`, err);
                        userId = null;
                    }
                }

                if (!closeReason && !userId && (await isBehindProxy(ip!, 3))) {
                    closeReason = "behind_proxy";
                }

                if (!closeReason && ip) wsRateLimit.ipConnected(ip!);

                return {
                    onOpen(_event, ws) {
                        ws.raw = {
                            ip,
                            rateLimit: {},
                            player: undefined,
                        };

                        if (closeReason) {
                            ws.send(
                                JSON.stringify({
                                    type: "error",
                                    data: {
                                        type: closeReason as PrivateLobbyErrorType,
                                    },
                                } satisfies PrivateLobbyErrorMsg),
                            );
                            privateLobbyMenu.logger.warn(
                                `closed socket for ${closeReason}`,
                            );
                            ws.close();
                            return;
                        }
                        privateLobbyMenu.onOpen(
                            ws as WSContext<SocketData>,
                            userId,
                            ip!,
                            admin,
                        );
                    },

                    onMessage(event, ws) {
                        const data = ws.raw! as SocketData;

                        if (wsRateLimit.isRateLimited(data.rateLimit)) {
                            privateLobbyMenu.logger.warn("Rate limited, closing socket.");
                            ws.close();
                            return;
                        }

                        try {
                            privateLobbyMenu.onMsg(
                                ws as WSContext<SocketData>,
                                event.data as string,
                            );
                        } catch (err) {
                            privateLobbyMenu.logger.error(
                                "Error processing message:",
                                err,
                            );
                            ws.close();
                        }
                    },

                    onClose(_event, ws) {
                        privateLobbyMenu.onClose(ws as WSContext<SocketData>);

                        const data = ws.raw! as SocketData;
                        wsRateLimit.ipDisconnected(data.ip);
                    },
                };
            }),
        );
    }

    onOpen(ws: WSContext<SocketData>, userId: string | null, ip: string, admin: boolean) {
        const player = new Player(ws, this, userId, ip, admin);
        ws.raw!.player = player;

        let players = this.playersByIp.get(player.encodedIp);
        if (!players) {
            players = new Set();
            this.playersByIp.set(player.encodedIp, players);
        }
        players.add(player);
    }

    onMsg(ws: WSContext<SocketData>, data: string) {
        let msg: ClientToServerPrivateLobbyMsg;
        try {
            assert(data.length < 1024);
            msg = JSON.parse(data);
            zPrivateLobbyClientMsg.parse(msg);
        } catch {
            this.logger.warn("Failed to parse message, closing socket.");
            ws.close();
            return;
        }

        const player = ws.raw?.player;
        // i really don't think this is necessary but /shrug
        if (!player) {
            this.logger.warn("Player not found, closing socket.");
            ws.close();
            return;
        }

        // handle creation and joining messages
        // other messages are handled on the player class
        if (!player.room) {
            switch (msg.type) {
                case "create": {
                    // creating a private lobby requires an account; joining one doesn't
                    if (!player.userId && !Config.debug.allowEditMsg) {
                        player.send("error", { type: "login_required" });
                        break;
                    }

                    // don't allow creating a lobby if there's no mode enabled
                    if (!this.allowedGameModeIdxs(msg.data.roomData.region).length) {
                        player.send("error", { type: "create_failed" });
                        break;
                    }

                    player.setName(msg.data.playerData.name);

                    const room = this.createRoom(msg.data.roomData);
                    room.addPlayer(player);

                    break;
                }
                case "join": {
                    const room = this.rooms.get(msg.data.roomUrl);
                    if (!room) {
                        player.send("error", { type: "join_not_found" });
                        break;
                    }

                    if (room.players.length >= room.data.maxPlayers) {
                        player.send("error", { type: "join_full" });
                        break;
                    }

                    const teamId = msg.data.teamId;
                    if (teamId !== undefined && !room.teamSlotHasRoom(teamId)) {
                        player.send("error", { type: "team_full" });
                        break;
                    }

                    player.setName(msg.data.playerData.name);

                    room.addPlayer(player, msg.data.importGroupId, teamId);
                }
            }
        }

        // player.room is set on room.addPlayer
        // if we don't have a room at this point it meant both creation and joining failed
        // so close the socket
        if (!player.room) {
            this.logger.debug("Player not in room, closing socket.");
            ws.close();
            return;
        }

        // handle messages for when the player is already inside a room
        player.room.onMsg(player, msg);
    }

    onClose(ws: WSContext<SocketData>) {
        const player = ws.raw?.player;

        if (!player) {
            this.logger.debug("Player not found, closing socket.");
            ws.close();
            return;
        }

        const byIp = this.playersByIp.get(player.encodedIp);
        if (byIp) {
            byIp.delete(player);
            if (byIp.size === 0) {
                this.playersByIp.delete(player.encodedIp);
            }
        }

        // meh just to make sure we dont keep timeouts with references hanging
        // not like it matters because its 5 seconds...
        clearTimeout(player.disconnectTimeout);

        if (player.room) {
            player.room.removePlayer(player);
        }
    }

    createRoom(data: ClientRoomData) {
        let roomUrl = generateLobbyCode();
        while (this.rooms.has(roomUrl)) {
            roomUrl = generateLobbyCode();
        }

        const room = new Room(this, roomUrl, data);
        this.rooms.set(roomUrl, room);
        return room;
    }

    removeRoom(room: Room) {
        this.rooms.delete(room.id);
    }

    disconnectPlayers(encodedIp: string) {
        const players = this.playersByIp.get(encodedIp);
        if (!players) return;

        for (const player of players) {
            player.socket.close();
        }
        players.clear();
        this.playersByIp.delete(encodedIp);
    }
}
