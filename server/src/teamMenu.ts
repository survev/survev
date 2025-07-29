import { randomUUID } from "crypto";
import type { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { UpgradeWebSocket, WSContext } from "hono/ws";
import type { FindGameError } from "../../shared/types/api";
import {
    type ClientRoomData,
    type ClientToServerTeamMsg,
    type RoomData,
    type ServerToClientTeamMsg,
    type TeamErrorMsg,
    type TeamMenuErrorType,
    type TeamMenuPlayer,
    type TeamPlayGameMsg,
    zTeamClientMsg,
} from "../../shared/types/team";
import { assert } from "../../shared/utils/util";
import type { ApiServer } from "./api/apiServer";
import { validateSessionToken } from "./api/auth";
import { hashIp, isBanned } from "./api/routes/private/ModerationRouter";
import { Config } from "./config";
import { Logger } from "./utils/logger";
import {
    getHonoIp,
    HTTPRateLimit,
    isBehindProxy,
    validateUserName,
    verifyTurnsStile,
    WebSocketRateLimit,
} from "./utils/serverHelpers";

interface SocketData {
    rateLimit: Record<symbol, number>;
    player: Player;
    ip: string;
}

class Player {
    room?: Room;

    name = "Player";

    inGame = false;

    get isLeader() {
        // first player is always leader
        return !!this.room && this.room.players[0] == this;
    }

    get playerId() {
        return this.room ? this.room.players.indexOf(this) : -1;
    }

    get data(): TeamMenuPlayer {
        return {
            name: this.name,
            inGame: this.inGame,
            isLeader: this.isLeader,
            playerId: this.playerId,
        };
    }

    lastMsgTime = Date.now();

    disconnectTimeout: ReturnType<typeof setTimeout>;

    encodedIp: string;

    constructor(
        public socket: WSContext<SocketData>,
        public teamMenu: TeamMenu,
        public userId: string | null,
        public ip: string,
    ) {
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

    send<T extends ServerToClientTeamMsg["type"]>(
        type: T,
        data: (ServerToClientTeamMsg & { type: T })["data"],
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

    data: RoomData = {
        roomUrl: "",
        findingGame: false,
        lastError: "",
        region: "",
        autoFill: true,
        enabledGameModeIdxs: [],
        gameModeIdx: 1,
        maxPlayers: 4,
        captchaEnabled: false,
    };

    constructor(
        public teamMenu: TeamMenu,
        public id: string,
        initialData: ClientRoomData,
    ) {
        this.data.roomUrl = `#${id}`;
        this.data.enabledGameModeIdxs = teamMenu.allowedGameModeIdxs();
        this.data.captchaEnabled = teamMenu.server.captchaEnabled;

        this.setProps(initialData);
    }

    addPlayer(player: Player) {
        if (this.players.length >= this.data.maxPlayers) return;

        this.players.push(player);
        player.room = this;

        clearTimeout(player.disconnectTimeout);

        this.sendState();
    }

    onMsg(player: Player, msg: ClientToServerTeamMsg) {
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
            case "playGame": {
                if (!player.isLeader) break;
                this.findGame(msg.data);
                break;
            }
        }
    }

    setProps(props: ClientRoomData) {
        let region = props.region;
        if (!(region in Config.regions)) {
            region = Object.keys(Config.regions)[0];
        }
        this.data.region = region;

        let gameModeIdx = props.gameModeIdx;

        const modes = this.teamMenu.server.modes;

        if (!this.data.enabledGameModeIdxs.includes(gameModeIdx)) {
            // we don't allow creating teams if there's no valid team mode
            // so this will never be -1
            gameModeIdx = modes.findIndex((mode) => mode.enabled && mode.teamMode > 1);
        }

        this.data.gameModeIdx = gameModeIdx;

        this.data.maxPlayers = modes[gameModeIdx].teamMode;
        this.data.autoFill = props.autoFill;

        // kick players that don't fit on the new max players
        while (this.players.length > this.data.maxPlayers) {
            this.kick(this.players.length - 1);
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
        const idx = this.players.indexOf(player);
        if (idx === -1) return;

        this.players.splice(idx, 1);
        player.room = undefined;
        player.socket.close();

        this.sendState();

        if (!this.players.length) {
            this.teamMenu.removeRoom(this);
        }
    }

    findGameCooldown = 0;

    async findGame(data: TeamPlayGameMsg["data"]) {
        if (this.data.findingGame) return;
        if (this.players.some((p) => p.inGame)) return;
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

        const playerData = this.players.map((p) => {
            const token = randomUUID();
            tokenMap.set(p, token);
            return {
                token,
                userId: p.userId,
                ip: p.ip,
            };
        });

        const mode = this.teamMenu.server.modes[this.data.gameModeIdx];
        if (!mode || !mode.enabled) {
            return;
        }

        if (this.data.captchaEnabled) {
            if (!data.turnstileToken) {
                this.data.lastError = "find_game_invalid_captcha";
                this.sendState();
                return;
            }

            try {
                if (!(await verifyTurnsStile(data.turnstileToken, roomLeader.ip))) {
                    this.data.lastError = "find_game_invalid_captcha";
                    this.sendState();
                    return;
                }
            } catch (err) {
                this.teamMenu.logger.error("Failed verifying turnstile:", err);
                this.data.lastError = "find_game_error";
                this.sendState();
                return;
            }
        }

        const res = await this.teamMenu.server.findGame({
            mapName: mode.mapName,
            teamMode: mode.teamMode,
            autoFill: this.data.autoFill,
            region: region,
            version: data.version,
            playerData,
        });

        if ("error" in res) {
            const errMap: Partial<Record<FindGameError, TeamMenuErrorType>> = {
                full: "find_game_full",
                invalid_protocol: "find_game_invalid_protocol",
            };

            this.data.lastError = errMap[res.error] || "find_game_error";
            this.sendState();
            // 1 second cooldown on error
            this.findGameCooldown = Date.now() + 1000;
            return;
        }

        this.findGameCooldown = Date.now() + 5000;

        const joinData = res;
        if (!joinData) return;

        this.data.lastError = "";

        for (const player of this.players) {
            player.inGame = true;
            const token = tokenMap.get(player);

            if (!token) {
                this.teamMenu.logger.warn(`Missing token for player ${player.name}`);
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
        // all players must be logged in to disable it
        this.data.captchaEnabled =
            this.teamMenu.server.captchaEnabled && !this.players.every((p) => !!p.userId);
        for (const player of this.players) {
            player.send("state", {
                localPlayerId: player.playerId,
                room: this.data,
                players,
            });
        }
    }
}

const alphanumerics = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
function randomString(len: number) {
    let str = "";
    let i = 0;
    while (i < len) {
        str += alphanumerics.charAt(Math.floor(Math.random() * alphanumerics.length));
        i++;
    }
    return `${str}`;
}

export class TeamMenu {
    rooms = new Map<string, Room>();

    logger = new Logger("TeamMenu");

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

    allowedGameModeIdxs() {
        return this.server.modes
            .map((_, i) => i)
            .filter((i) => {
                const mode = this.server.modes[i];
                return mode.enabled && mode.teamMode > 1;
            });
    }

    init(app: Hono, upgradeWebSocket: UpgradeWebSocket) {
        const teamMenu = this;

        const httpRateLimit = new HTTPRateLimit(5, 2000);
        const wsRateLimit = new WebSocketRateLimit(50, 1000, 5);

        app.get(
            "/team_v2",
            upgradeWebSocket(async (c) => {
                const ip = getHonoIp(c, Config.apiServer.proxyIPHeader);

                let closeReason: TeamMenuErrorType | undefined;
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

                wsRateLimit.ipConnected(ip!);

                let userId: string | null = null;
                const sessionId = getCookie(c, "session") ?? null;

                if (sessionId) {
                    try {
                        const account = await validateSessionToken(sessionId);
                        userId = account.user?.id || null;

                        if (account.user?.banned) {
                            userId = null;
                        }
                    } catch (err) {
                        this.logger.error(`Failed to validate session:`, err);
                        userId = null;
                    }
                }

                if (!closeReason && (await isBehindProxy(ip!, userId ? 0 : 3))) {
                    closeReason = "behind_proxy";
                }

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
                                        type: closeReason as TeamMenuErrorType,
                                    },
                                } satisfies TeamErrorMsg),
                            );
                            teamMenu.logger.warn(`closed socket for ${closeReason}`);
                            ws.close();
                            return;
                        }
                        teamMenu.onOpen(ws as WSContext<SocketData>, userId, ip!);
                    },

                    onMessage(event, ws) {
                        const data = ws.raw! as SocketData;

                        if (wsRateLimit.isRateLimited(data.rateLimit)) {
                            teamMenu.logger.warn("Rate limited, closing socket.");
                            ws.close();
                            return;
                        }

                        try {
                            teamMenu.onMsg(
                                ws as WSContext<SocketData>,
                                event.data as string,
                            );
                        } catch (err) {
                            teamMenu.logger.error("Error processing message:", err);
                            ws.close();
                        }
                    },

                    onClose(_event, ws) {
                        teamMenu.onClose(ws as WSContext<SocketData>);

                        const data = ws.raw! as SocketData;
                        wsRateLimit.ipDisconnected(data.ip);
                    },
                };
            }),
        );
    }

    onOpen(ws: WSContext<SocketData>, userId: string | null, ip: string) {
        const player = new Player(ws, this, userId, ip);
        ws.raw!.player = player;

        let players = this.playersByIp.get(player.encodedIp);
        if (!players) {
            players = new Set();
            this.playersByIp.set(player.encodedIp, players);
        }
        players.add(player);
    }

    onMsg(ws: WSContext<SocketData>, data: string) {
        let msg: ClientToServerTeamMsg;
        try {
            assert(data.length < 1024);
            msg = JSON.parse(data);
            zTeamClientMsg.parse(msg);
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
                    // don't allow creating a team if there's no team mode enabled
                    if (!this.allowedGameModeIdxs().length) {
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
                    player.setName(msg.data.playerData.name);

                    room.addPlayer(player);
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
        let roomUrl = randomString(4);
        while (this.rooms.has(roomUrl)) {
            roomUrl = randomString(4);
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
