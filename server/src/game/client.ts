import type { EmoteDef } from "../../../shared/defs/gameObjects/emoteDefs.ts";
import { GameObjectDefs } from "../../../shared/defs/register.ts";
import { GameConfig } from "../../../shared/gameConfig.ts";
import { JoinMsg } from "../../../shared/net/joinMsg.ts";
import * as net from "../../../shared/net/net.ts";
import type { Emote, GroupStatus } from "../../../shared/net/updateMsg.ts";
import { coldet } from "../../../shared/utils/coldet.ts";
import { collider } from "../../../shared/utils/collider.ts";
import { util } from "../../../shared/utils/util.ts";
import { v2 } from "../../../shared/utils/v2.ts";
import { Config } from "../config.ts";
import type { Game } from "./game.ts";
import type { GameObject } from "./objects/gameObject.ts";
import type { MapIndicator } from "./objects/mapIndicator.ts";
import type { Player } from "./objects/player.ts";

export class ClientBarn {
    clients: Client[] = [];
    game: Game;

    socketIdToClient = new Map<string, Client>();

    /**
     * All msgs created this tick that will be sent to all clients
     * cached in a single stream
     */
    msgsToSend = new net.MsgStream(new ArrayBuffer(4096));

    constructor(game: Game) {
        this.game = game;
    }

    addClient(socketId: string, joinMsg: JoinMsg, ip: string) {
        const joinData = this.game.joinTokens.get(joinMsg.matchPriv);

        if (!joinData || joinData.expiresAt < Date.now()) {
            this.game.closeSocket(socketId);
            if (joinData) {
                this.game.joinTokens.delete(joinMsg.matchPriv);
            }
            return;
        }
        this.game.joinTokens.delete(joinMsg.matchPriv);

        if (Config.rateLimitsEnabled) {
            const count = this.clients.filter(
                (p) =>
                    p.ip === ip
                    || p.findGameIp == joinData.findGameIp
                    || (joinData.userId !== null && p.userId === joinData.userId),
            );
            if (count.length >= 5) {
                this.game.closeSocket(socketId, "rate_limited");
                return;
            }
        }

        const client = new Client(
            this.game,
            ip,
            joinData.findGameIp,
            joinData.userId,
            socketId,
        );

        this.clients.push(client);
        this.socketIdToClient.set(socketId, client);

        const player = this.game.playerBarn.addPlayer(client, joinMsg, joinData);
        client.player = player;

        return client;
    }

    sendMsgs() {
        for (let i = 0; i < this.clients.length; i++) {
            const client = this.clients[i];
            if (client.disconnected) continue;
            client.sendMsgs();
        }
    }

    update(dt: number) {
        for (let i = 0; i < this.clients.length; i++) {
            const client = this.clients[i];
            if (client.disconnected) continue;
            client.update(dt);
        }
    }

    flush() {
        this.msgsToSend.stream.index = 0;
    }

    deserializeMsg(buff: ArrayBuffer): {
        type: net.MsgType;
        msg: net.AbstractMsg | undefined;
        error?: string;
    } {
        const msgStream = new net.MsgStream(buff);
        const stream = msgStream.stream;

        const type = msgStream.deserializeMsgType();

        let msg:
            | net.JoinMsg
            | net.InputMsg
            | net.EmoteMsg
            | net.DropItemMsg
            | net.SpectateMsg
            | net.PerkModeRoleSelectMsg
            | net.EditMsg
            | undefined = undefined;

        switch (type) {
            case net.MsgType.Join: {
                // read protocol version outside of JoinMsg
                // reason: if theres a protocol change in JoinMsg it will fail to deserialize the entire msg
                // and won't give the proper invalid-protocol error
                // so we read it before deserializing the msg to avoid it throwing and giving the wrong error

                const oldIdx = stream.index;
                const protocol = stream.readUint32();

                if (protocol !== GameConfig.protocolVersion) {
                    return {
                        type: net.MsgType.Join,
                        msg: undefined,
                        error: "index-invalid-protocol",
                    };
                }
                stream.index = oldIdx;

                msg = new net.JoinMsg();
                msg.deserialize(stream);
                break;
            }
            case net.MsgType.Input: {
                msg = new net.InputMsg();
                msg.deserialize(stream);
                break;
            }
            case net.MsgType.Emote:
                msg = new net.EmoteMsg();
                msg.deserialize(stream);
                break;
            case net.MsgType.DropItem:
                msg = new net.DropItemMsg();
                msg.deserialize(stream);
                break;
            case net.MsgType.Spectate:
                msg = new net.SpectateMsg();
                msg.deserialize(stream);
                break;
            case net.MsgType.PerkModeRoleSelect:
                msg = new net.PerkModeRoleSelectMsg();
                msg.deserialize(stream);
                break;
            case net.MsgType.Edit:
                if (!Config.debug.allowEditMsg) break;
                msg = new net.EditMsg();
                msg.deserialize(stream);
                break;
        }

        return {
            type,
            msg,
        };
    }

    handleMsg(buff: ArrayBuffer | Buffer, socketId: string, ip: string) {
        if (!(buff instanceof ArrayBuffer)) return;

        let client = this.socketIdToClient.get(socketId);

        let msg: net.AbstractMsg | undefined = undefined;
        let type = net.MsgType.None;
        let error: string | undefined;

        try {
            const deserialized = this.deserializeMsg(buff);
            msg = deserialized.msg;
            type = deserialized.type;
            error = deserialized.error;
        } catch (err) {
            this.game.logger.error(
                "Failed to deserialize msg: ",
                err,
                "msg buffer: ",
                // JSON.stringify doesn't work on buffers, so need to convert to an Uint8Array first
                // and then to a regular array... 😭
                // the slice is to make sure it doesn't overflow the error webhook
                JSON.stringify([...new Uint8Array(buff.slice(0, 255))]),
            );
            if (client) {
                client.disconnect();
            } else {
                this.game.closeSocket(socketId);
            }
            return;
        }

        if (error) {
            if (client) {
                client.disconnect();
            } else {
                this.game.closeSocket(socketId);
            }
            return;
        }

        if (!msg) return;

        if (type === net.MsgType.Join && !client) {
            client = this.addClient(socketId, msg as net.JoinMsg, ip);

            return;
        }

        if (!client) {
            this.game.closeSocket(socketId);
            return;
        }
        const player = client.player;

        if (client.disconnected) {
            return;
        }

        switch (type) {
            case net.MsgType.Input: {
                player.handleInput(msg as net.InputMsg);
                break;
            }
            case net.MsgType.Emote: {
                player.emoteFromMsg(msg as net.EmoteMsg);
                break;
            }
            case net.MsgType.DropItem: {
                player.dropItem(msg as net.DropItemMsg);
                break;
            }
            case net.MsgType.Spectate: {
                client.spectate(msg as net.SpectateMsg);
                break;
            }
            case net.MsgType.PerkModeRoleSelect: {
                player.roleSelect((msg as net.PerkModeRoleSelectMsg).role);
                break;
            }
            case net.MsgType.Edit: {
                player.processEditMsg(msg as net.EditMsg);
                break;
            }
        }
    }

    handleSocketClose(socketId: string) {
        const client = this.socketIdToClient.get(socketId);
        if (!client) return;
        const player = client.player;
        if (!player) return;

        this.game.logger.info(`"${player.name}" left`);
        player.questManager.flushProgress();
        client.disconnected = true;
        player.group?.checkPlayers();
        player.client.spectating = undefined;
        player.dirNew = v2.create(1, 0);
        player.setPartDirty();
        if (player.canDespawn()) {
            player.game.playerBarn.removePlayer(player);
        }
    }

    broadcastMsg(type: net.MsgType, msg: net.Msg) {
        this.msgsToSend.serializeMsg(type, msg);
    }
}

export class Client {
    readonly game: Game;

    readonly socketId: string;
    readonly ip: string;
    readonly findGameIp: string;
    readonly userId: string | null;

    private _disconnected = false;

    player!: Player;

    /** true when player starts spectating new player, only stays true for that given tick */
    startedSpectating: boolean = false;

    private _spectating?: Player;

    get spectating(): Player | undefined {
        return this._spectating;
    }

    set spectating(player: Player | undefined) {
        if (player === this.player) {
            throw new Error(
                `Player ${player.name} tried spectate themselves (how tf did this happen?)`,
            );
        }
        if (this._spectating === player) return;

        if (this._spectating) {
            this._spectating.spectatorCount--;
            this._spectating.spectators.delete(this.player);
        }
        if (player) {
            player.spectatorCount++;
            player.spectators.add(this.player);
        }

        this._spectating = player;
        this.startedSpectating = true;
    }

    spectateCooldown = 0;
    spectateCooldownCount = 0;
    spectateMsgCount = 0;
    spectateMsgTicker = 0;

    ack = 0;
    private _firstUpdate = true;

    visibleObjects = new Set<GameObject>();
    visibleMapIndicators = new Set<MapIndicator>();

    private _msgStream = new net.MsgStream(new ArrayBuffer(65536));
    private _msgsToSend: Array<{ type: number; msg: net.Msg }> = [];

    constructor(
        game: Game,
        ip: string,
        findGameIp: string,
        userId: string | null,
        socketId: string,
    ) {
        this.game = game;
        this.ip = ip;
        this.findGameIp = findGameIp;
        this.userId = userId;
        this.socketId = socketId;
    }

    get disconnected(): boolean {
        return this._disconnected;
    }

    set disconnected(disconnected: boolean) {
        if (this.disconnected === disconnected) return;

        this._disconnected = disconnected;

        this.player?.setGroupStatuses();
    }

    disconnect(reason?: string) {
        this.disconnected = true;
        this.game.closeSocket(this.socketId, reason);
    }

    bufferSendMsg(type: net.MsgType, msg: net.AbstractMsg) {
        this._msgsToSend.push({ type, msg });
    }

    sendMsg(type: net.MsgType, msg: net.AbstractMsg, bytes = 128): void {
        const stream = new net.MsgStream(new ArrayBuffer(bytes));
        stream.serializeMsg(type, msg);
        this.sendData(stream.getBuffer());
    }

    sendData(buffer: Uint8Array): void {
        this.game.sendSocketMsg(this.socketId, buffer);
    }

    update(dt: number) {
        this.spectateCooldown -= dt;

        if (this.spectateMsgCount > 0) {
            this.spectateMsgTicker += dt;
            if (this.spectateMsgTicker > 3) {
                this.spectateMsgCount--;
                this.spectateMsgTicker = 0;
            }
        }
    }

    sendMsgs(): void {
        const msgStream = this._msgStream;
        const game = this.game;
        const playerBarn = game.playerBarn;
        msgStream.stream.index = 0;

        if (this._firstUpdate) {
            const joinedMsg = new net.JoinedMsg();
            joinedMsg.teamMode = this.game.teamMode;
            joinedMsg.playerId = this.player.__id;
            joinedMsg.started = game.started;
            joinedMsg.teamMode = game.teamMode;
            joinedMsg.emotes = this.player.loadout.emotes;
            this.sendMsg(net.MsgType.Joined, joinedMsg);

            const mapStream = game.map.mapStream.stream;

            msgStream.stream.writeBytes(mapStream, 0, mapStream.byteIndex);
        }

        if (playerBarn.aliveCountDirty || this._firstUpdate) {
            const aliveMsg = new net.AliveCountsMsg();
            this.game.modeManager.updateAliveCounts(aliveMsg.teamAliveCounts);
            msgStream.serializeMsg(net.MsgType.AliveCounts, aliveMsg);
        }

        const updateMsg = new net.UpdateMsg();

        updateMsg.ack = this.ack;

        if (game.gas.dirty || this._firstUpdate) {
            updateMsg.gasDirty = true;
            updateMsg.gasData = game.gas;
        }

        if (game.gas.timeDirty || this._firstUpdate) {
            updateMsg.gasTDirty = true;
            updateMsg.gasT = game.gas.gasT;
        }

        let player: Player;
        if (this.spectating == undefined) {
            // not spectating anyone
            player = this.player;
        } else if (this.spectating.dead) {
            // was spectating someone but they died so find new player to spectate
            player = this.spectating.killedBy && !this.spectating.killedBy.dead
                ? this.spectating.killedBy
                : playerBarn.randomPlayer();
            if (player === this.player) {
                player = playerBarn.randomPlayer();
            }
            this.spectating = player;
        } else {
            // spectating someone currently who is still alive
            player = this.spectating;
        }
        // temporary guard while the spectating code is not fixed
        if (!player) {
            player = this.player;
        }

        const radius = player._cullingZoom + 4;
        let width = player._cullingZoom + 4;
        // client zoom tries to keep a 16/9 aspect ratio, mirror it here
        let height = width / (16 / 9);
        if (player._cullingPortrait) {
            let tmp = width;
            width = height;
            height = tmp;
        }
        const rect = collider.createAabbExtents(player.pos, v2.create(width, height));

        const newVisibleObjects = game.grid.intersectColliderSet(rect);
        // client crashes if active player is not visible
        // so make sure its always added to visible objects
        newVisibleObjects.add(this.player);
        newVisibleObjects.add(player);

        for (const obj of this.visibleObjects) {
            if (!newVisibleObjects.has(obj)) {
                updateMsg.delObjIds.push(obj.__id);
            }
        }

        for (const obj of newVisibleObjects) {
            if (
                !this.visibleObjects.has(obj)
                || game.objectRegister.dirtyFull[obj.__id]
            ) {
                updateMsg.fullObjects.push(obj);
            } else if (game.objectRegister.dirtyPart[obj.__id]) {
                updateMsg.partObjects.push(obj);
            }
        }

        this.visibleObjects = newVisibleObjects;

        updateMsg.activePlayerId = player.__id;
        if (this.startedSpectating) {
            updateMsg.activePlayerIdDirty = true;

            // build the active player data object manually
            // To avoid setting the spectating player fields to dirty
            updateMsg.activePlayerData = {
                healthDirty: true,
                health: player.health,
                boostDirty: true,
                boost: player.boost,
                zoomDirty: true,
                zoom: player.zoom,
                actionDirty: true,
                action: player.action,
                inventoryDirty: true,
                inventory: player.inventory,
                scope: player.scope,
                weapsDirty: true,
                curWeapIdx: player.curWeapIdx,
                weapons: player.weapons,
                spectatorCountDirty: true,
                spectatorCount: player.spectatorCount,
            };
            this.startedSpectating = false;
        } else {
            updateMsg.activePlayerIdDirty = player.activeIdDirty;
            updateMsg.activePlayerData = player;
        }

        updateMsg.playerInfos = this._firstUpdate
            ? playerBarn.players
            : playerBarn.newPlayers;

        updateMsg.deletedPlayerIds = playerBarn.deletedPlayers;

        if (playerBarn.playerStatusTicker > playerBarn.playerStatusRate) {
            let statuses = player.getPlayerStatus();
            updateMsg.playerStatus = statuses;
            updateMsg.playerStatusDirty = true;
        }

        if (player.groupStatusDirty) {
            const teamPlayers = player.group!.players;

            let statuses: GroupStatus[] = [];
            for (const p of teamPlayers) {
                statuses.push({
                    health: p.health,
                    disconnected: p.disconnected,
                });
            }
            updateMsg.groupStatus = statuses;
            updateMsg.groupStatusDirty = true;
        }

        const shouldSendEmote = (emote: Emote) => {
            const emotePlayer = game.objectRegister.getById(emote.playerId) as
                | Player
                | undefined;

            const emoteDef = GameObjectDefs.typeToDef(emote.type);

            if (emotePlayer) {
                if (!emote.isPing && !this.visibleObjects.has(emotePlayer)) {
                    return false;
                }

                // regular emotes: always send if visible
                if (!emote.isPing && !(emoteDef as EmoteDef).teamOnly) {
                    return true;
                }

                // part of the same group
                if (emotePlayer?.groupId === player.groupId) {
                    return true;
                }

                // part of the same team
                if (emotePlayer?.teamId === player.teamId && !emote.isPing) {
                    return true;
                }

                // faction team leader
                if (
                    (emotePlayer.role === "leader" || emotePlayer.role === "captain")
                    && emotePlayer.teamId === player.teamId
                ) {
                    return true;
                }
            }

            // always send map events pings
            if (emote.isPing && emoteDef.type === "ping" && emoteDef.mapEvent) {
                return true;
            }

            return false;
        };

        for (let i = 0; i < playerBarn.emotes.length; i++) {
            const emote = playerBarn.emotes[i];
            if (shouldSendEmote(emote)) {
                updateMsg.emotes.push(emote);
            }
        }

        const extendedRadius = 1.1 * radius;
        const radiusSquared = extendedRadius * extendedRadius;

        const bullets = game.bulletBarn.newBullets;
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            if (
                v2.lengthSqr(v2.sub(bullet.pos, player.pos)) < radiusSquared
                || v2.lengthSqr(v2.sub(bullet.clientEndPos, player.pos)) < radiusSquared
                || coldet.intersectSegmentCircle(
                    bullet.pos,
                    bullet.clientEndPos,
                    player.pos,
                    extendedRadius,
                )
            ) {
                updateMsg.bullets.push(bullet);
            }
        }

        for (let i = 0; i < game.explosionBarn.newExplosions.length; i++) {
            const explosion = game.explosionBarn.newExplosions[i];
            const rad = explosion.rad + extendedRadius;
            if (v2.lengthSqr(v2.sub(explosion.pos, player.pos)) < rad * rad) {
                updateMsg.explosions.push(explosion);
            }
        }

        const planes = this.game.planeBarn.planes;
        for (let i = 0; i < planes.length; i++) {
            const plane = planes[i];
            if (
                coldet.testCircleAabb(plane.pos, plane.rad, rect.min, rect.max)
                && coldet.testPointAabb(
                    plane.pos,
                    this.game.planeBarn.planeBounds.min,
                    this.game.planeBarn.planeBounds.max,
                )
            ) {
                updateMsg.planes.push(plane);
            }
        }
        const newAirstrikeZones = this.game.planeBarn.newAirstrikeZones;
        for (let i = 0; i < newAirstrikeZones.length; i++) {
            const zone = newAirstrikeZones[i];
            updateMsg.airstrikeZones.push(zone);
        }

        const indicators = this.game.mapIndicatorBarn.mapIndicators;
        for (let i = 0; i < indicators.length; i++) {
            const indicator = indicators[i];
            if (indicator.dirty || !this.visibleMapIndicators.has(indicator)) {
                updateMsg.mapIndicators.push(indicator);
                this.visibleMapIndicators.add(indicator);
            }
            if (indicator.dead) {
                this.visibleMapIndicators.delete(indicator);
            }
        }

        if (playerBarn.killLeaderDirty || this._firstUpdate) {
            updateMsg.killLeaderDirty = true;
            updateMsg.killLeaderId = playerBarn.killLeader?.__id ?? 0;
            updateMsg.killLeaderKills = playerBarn.killLeader?.kills ?? 0;
        }

        msgStream.serializeMsg(net.MsgType.Update, updateMsg);

        for (let i = 0; i < this._msgsToSend.length; i++) {
            const msg = this._msgsToSend[i];
            msgStream.serializeMsg(msg.type, msg.msg);
        }

        this._msgsToSend.length = 0;

        const globalMsgStream = this.game.clientBarn.msgsToSend.stream;
        msgStream.stream.writeBytes(globalMsgStream, 0, globalMsgStream.byteIndex);

        this.sendData(msgStream.getBuffer());
        this._firstUpdate = false;
    }

    handleInput(msg: net.InputMsg) {
        this.ack = msg.seq;

        this.player.handleInput(msg);
    }

    // TODO: redo this mess
    spectate(spectateMsg: net.SpectateMsg): void {
        if (!this.player.dead) return;

        if (this.spectateCooldown >= 0.75) {
            this.spectateCooldownCount++;

            if (this.spectateCooldownCount > 10) {
                this.disconnect();
                this.game.logger.error(
                    `Game ${this.game.id} - Player ${this.player.name} disconnected for spamming SpectateMsg (cooldown)`,
                );
            }
            return;
        }
        this.spectateCooldown = 1;

        this.spectateMsgCount++;

        if (this.spectateMsgCount > 50) {
            this.disconnect();
            this.game.logger.error(
                `Game ${this.game.id} - Player ${this.player.name} Player ${this.player.name} disconnected for spamming SpectateMsg (count)`,
            );
            return;
        }

        // livingPlayers is used here instead of a more "efficient" option because its sorted while other options are not
        const spectatablePlayers = this.game.playerBarn.livingPlayers.filter(
            (p) =>
                this.player != p
                && !p.disconnected
                && (this.game.modeManager.getPlayerAlivePlayersContext(this.player).length === 0
                    || p.teamId == this.player.teamId),
        );

        let playerToSpec: Player | undefined;
        switch (true) {
            case spectateMsg.specBegin:
                const groupExistsOrAlive = this.game.isTeamMode && this.player.group!.livingPlayers.length > 0;
                const teamExistsOrAlive = this.game.map.factionMode && this.player.team!.livingPlayers.length > 0;
                const aliveKiller = this.player.getAliveKiller();
                const shouldSpecRandom = groupExistsOrAlive || teamExistsOrAlive || !aliveKiller;

                if (!shouldSpecRandom) {
                    playerToSpec = aliveKiller;
                    break;
                }

                const players = this.game.map.factionMode && groupExistsOrAlive
                    ? this.player.group!.livingPlayers
                    : spectatablePlayers;

                playerToSpec = util.randomItem(players);
                break;
            case spectateMsg.specNext:
            case spectateMsg.specPrev:
                const nextOrPrev = +spectateMsg.specNext - +spectateMsg.specPrev;
                playerToSpec = util.wrappedArrayIndex(
                    spectatablePlayers,
                    spectatablePlayers.indexOf(this.spectating!) + nextOrPrev,
                );
                break;
        }
        this.spectating = playerToSpec;
    }
}
