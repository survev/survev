import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { DamageType, GameConfig, TeamMode } from "../../../shared/gameConfig";
import * as net from "../../../shared/net/net";
import type { Loadout } from "../../../shared/utils/loadout";
import { math } from "../../../shared/utils/math";
import { v2 } from "../../../shared/utils/v2";
import { Config } from "../config";
import { ServerLogger } from "../utils/logger";
import { apiPrivateRouter } from "../utils/serverHelpers";
import {
    type AdminCmdAction,
    type DashboardPlayer,
    type FindGamePrivateBody,
    ProcessMsgType,
    type SaveGameBody,
    type ServerGameConfig,
    type UpdateDataMsg,
} from "../utils/types";
import { GameModeManager } from "./gameModeManager";
import { Grid } from "./grid";
import { GameMap } from "./map";
import { AirdropBarn } from "./objects/airdrop";
import { BulletBarn } from "./objects/bullet";
import { DeadBodyBarn } from "./objects/deadBody";
import { DecalBarn } from "./objects/decal";
import { ExplosionBarn } from "./objects/explosion";
import { type GameObject, ObjectRegister } from "./objects/gameObject";
import { Gas } from "./objects/gas";
import { LootBarn } from "./objects/loot";
import { MapIndicatorBarn } from "./objects/mapIndicator";
import { PlaneBarn } from "./objects/plane";
import { PlayerBarn } from "./objects/player";
import { ProjectileBarn } from "./objects/projectile";
import { SmokeBarn } from "./objects/smoke";
import { PluginManager } from "./pluginManager";
import { Profiler } from "./profiler";
import { RoleDef } from "../../../shared/defs/gameObjects/roleDefs";

export interface JoinTokenData {
    expiresAt: number;
    userId: string | null;
    findGameIp: string;
    loadout?: Loadout;
    admin: boolean;
    groupData: {
        autoFill: boolean;
        playerCount: number;
        groupHashToJoin: string;
    };
}

export class Game {
    started = false;
    stopped = false;
    allowJoin = false;
    over = false;
    frozen = false;
    verifiedOnly = false;
    startedTime = 0;
    stopTicker = 0;
    id: string;
    teamMode: TeamMode;
    mapName: string;
    isTeamMode: boolean;
    /** Isolated match created from a private lobby; excluded from public matchmaking, see `canJoin`. */
    isPrivate: boolean;
    config: ServerGameConfig;
    pluginManager = new PluginManager(this);
    modeManager: GameModeManager;

    tickTimeWarnThreshold = (1000 / Config.gameTps) * 4;
    gameTickWarnings = 0;

    netSyncWarnThreshold = (1000 / Config.netSyncTps) * 4;
    netSyncWarnings = 0;

    grid: Grid<GameObject>;
    objectRegister: ObjectRegister;

    joinTokens = new Map<string, JoinTokenData>();

    get aliveCount(): number {
        return this.playerBarn.livingPlayers.length;
    }

    get trueAliveCount(): number {
        return this.playerBarn.livingPlayers.filter((p) => !p.disconnected).length;
    }

    /**
     * All msgs created this tick that will be sent to all players
     * cached in a single stream
     */
    msgsToSend = new net.MsgStream(new ArrayBuffer(4096));

    playerBarn: PlayerBarn;
    lootBarn: LootBarn;
    deadBodyBarn: DeadBodyBarn;
    decalBarn: DecalBarn;
    projectileBarn: ProjectileBarn;
    bulletBarn: BulletBarn;
    smokeBarn: SmokeBarn;
    airdropBarn: AirdropBarn;

    explosionBarn: ExplosionBarn;
    planeBarn: PlaneBarn;
    mapIndicatorBarn: MapIndicatorBarn;

    map: GameMap;
    gas: Gas;

    now!: number;

    perfTicker = 0;
    tickTimes: number[] = [];

    logger: ServerLogger;

    start = Date.now();

    profiler = new Profiler();
    teamsAnnounced: boolean = false;

    arenaRoles: string[] = [];
    choosenArenaRoles: string[] = [];

    constructor(
        id: string,
        config: ServerGameConfig,
        readonly sendSocketMsg: (id: string, data: Uint8Array) => void,
        readonly closeSocket: (id: string, reason?: string) => void,
        readonly sendData?: (data: UpdateDataMsg) => void,
    ) {
        this.id = id;
        this.logger = new ServerLogger(`Game #${this.id.substring(0, 4)}`);
        this.logger.info("Creating");

        this.config = config;

        this.teamMode = config.teamMode;
        this.mapName = config.mapName;
        this.isTeamMode = this.teamMode !== TeamMode.Solo;
        this.isPrivate = config.isPrivate ?? false;
        // Private lobby leader narrowed the arena role pool down (see `RoomData.enabledArenaRoles`);
        // takes priority over the map's full `arenaModeRoles` list (see `Player.playerJoin`/`playerRoleSelect`).
        this.arenaRoles = config.arenaRoles?.length ? [...config.arenaRoles] : [];

        this.map = new GameMap(this);
        this.grid = new Grid(this.map.width, this.map.height);
        this.objectRegister = new ObjectRegister(this.grid);

        this.playerBarn = new PlayerBarn(this);
        this.lootBarn = new LootBarn(this);
        this.deadBodyBarn = new DeadBodyBarn(this);
        this.decalBarn = new DecalBarn(this);
        this.projectileBarn = new ProjectileBarn(this);
        this.bulletBarn = new BulletBarn(this);
        this.smokeBarn = new SmokeBarn(this);
        this.airdropBarn = new AirdropBarn(this);
        this.explosionBarn = new ExplosionBarn(this);
        this.planeBarn = new PlaneBarn(this);
        this.mapIndicatorBarn = new MapIndicatorBarn();

        this.gas = new Gas(this);

        this.modeManager = new GameModeManager(this);

        if (this.map.factionMode) {
            for (let i = 1; i <= this.map.mapDef.gameMode.factions!; i++) {
                this.playerBarn.addTeam(i);
            }
        }
    }

    async init() {
        await this.pluginManager.loadPlugins();
        this.map.init();
        this.pluginManager.emit("gameCreated", this);

        this.allowJoin = true;
        this.logger.info(`Created in ${Date.now() - this.start} ms`);

        this.updateData();
    }

    update(dt?: number): void {
        if (!this.allowJoin) return;
        this.profiler.flush();

        const now = performance.now();
        if (!this.now) this.now = now;
        dt ??= math.clamp((now - this.now) / 1000, 0.001, 1 / 8);

        this.now = now;

        if (this.over) {
            this.stopTicker -= dt;
            if (this.stopTicker <= 0) {
                this.stop();
                return;
            }
        }

        if (!this.started) {
            this.started = this.modeManager.isGameStarted();
            if (this.started) {
                this.gas.advanceGasStage();
            }
        }

        if (this.started) this.startedTime += dt;

        let freezeTimer = this.map.mapDef.gameMode.freezeTime || 0;
        const alivePlayers = this.playerBarn.livingPlayers;
        if(alivePlayers.length > 0 && !this.teamsAnnounced && this.map.mapDef.gameMode.announceTeams && this.startedTime >= freezeTimer ){
                    const enemyGroups = this.playerBarn.getAliveGroups();
                if (enemyGroups.length >= 2) {
                    const group1 = enemyGroups[0].getAlivePlayers().map(p => p.name);
                    const group2 = enemyGroups[1].getAlivePlayers().map(p => p.name);

                    this.teamsAnnounced = true;

                    const joinFeedMsg = new net.JoinFeedMsg();
                    joinFeedMsg.group1 = group1;
                    joinFeedMsg.group2 = group2;
                    this.broadcastMsg(net.MsgType.JoinFeed, joinFeedMsg);
                }
        }

        //
        // Update modules
        //
        this.profiler.addSample("gas");
        this.gas.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("players");
        this.playerBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("map");
        this.map.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("loot");
        this.lootBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("bullets");
        this.bulletBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("projectiles");
        this.projectileBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("explosions");
        this.explosionBarn.update();
        this.profiler.endSample();

        this.profiler.addSample("smoke");
        this.smokeBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("airdrops");
        this.airdropBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("deadBodies");
        this.deadBodyBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("decals");
        this.decalBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("planes");
        this.planeBarn.update(dt);
        this.profiler.endSample();

        const tickTime = performance.now() - this.now;

        if (tickTime > 1000) {
            let errString = `Tick took over 1 second! ${tickTime.toFixed(2)}ms\n`;
            errString += "Profiler stats:\n";
            errString += this.profiler.getStats();
            this.logger.error(errString);
        } else if (tickTime > this.tickTimeWarnThreshold) {
            this.logger.warn(
                `Tick took over ${this.tickTimeWarnThreshold}ms! ${tickTime.toFixed(2)}ms`,
            );
            this.gameTickWarnings++;

            if (this.gameTickWarnings > 20) {
                let errString = `Server is overloaded! Increasing tickTimeWarnThreshold.\n`;
                errString += "Profiler stats:\n";
                errString += this.profiler.getStats();
                this.logger.warn(errString);

                this.gameTickWarnings = 0;
                this.tickTimeWarnThreshold *= 2;
            }
        }

        if (Config.logging.debugLogs) {
            this.tickTimes.push(tickTime);

            this.perfTicker += dt;
            if (this.perfTicker >= 15) {
                this.perfTicker = 0;
                const mspt =
                    this.tickTimes.reduce((a, b) => a + b) / this.tickTimes.length;

                this.logger.debug(
                    `Avg ms/tick: ${mspt.toFixed(2)} | Load: ${((mspt / (1000 / Config.gameTps)) * 100).toFixed(1)}%`,
                );
                this.tickTimes = [];
            }
        }
    }

    netSync() {
        if (!this.allowJoin) return;

        const start = performance.now();

        // serialize objects and send msgs
        this.objectRegister.serializeObjs();
        this.playerBarn.sendMsgs();

        //
        // reset stuff
        //
        this.playerBarn.flush();
        this.lootBarn.flush();
        this.planeBarn.flush();
        this.bulletBarn.flush();
        this.airdropBarn.flush();
        this.objectRegister.flush();
        this.explosionBarn.flush();
        this.gas.flush();
        this.mapIndicatorBarn.flush();

        this.msgsToSend.stream.index = 0;

        const syncTime = performance.now() - start;
        if (syncTime > 1000) {
            this.logger.error(`Tick took over 1 second! ${syncTime.toFixed(2)}ms`);
        } else if (syncTime > this.netSyncWarnThreshold) {
            this.logger.warn(
                `Tick took over ${this.netSyncWarnThreshold}ms! ${syncTime.toFixed(2)}ms`,
            );
            this.netSyncWarnings++;

            if (this.netSyncWarnings > 20) {
                this.logger.warn(
                    `Server is overloaded! Increasing netSyncWarnThreshold.`,
                );

                this.netSyncWarnings = 0;
                this.netSyncWarnThreshold *= 2;
            }
        }
    }

    get canJoin(): boolean {
        return (
            !this.isPrivate &&
            this.aliveCount < this.map.mapDef.gameMode.maxPlayers &&
            !this.over &&
            this.startedTime < (this.map.mapDef.gameMode.joinTime || 60)
        );
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
            | net.JoinAsSpectatorMsg
            | net.InputMsg
            | net.EmoteMsg
            | net.DropItemMsg
            | net.SpectateMsg
            | net.PerkModeRoleSelectMsg
            | net.RoleSelectMsg
            | net.EditMsg
            | net.KillFeedMsg
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
            case net.MsgType.JoinAsSpectator: {
                // read protocol version outside of JoinAsSpectatorMsg
                // reason: if theres a protocol change in JoinAsSpectatorMsg it will fail to deserialize the entire msg
                // and won't give the proper invalid-protocol error
                // so we read it before deserializing the msg to avoid it throwing and giving the wrong error

                const oldIdx = stream.index;
                const protocol = stream.readUint32();

                if (protocol !== GameConfig.protocolVersion) {
                    return {
                        type: net.MsgType.JoinAsSpectator,
                        msg: undefined,
                        error: "index-invalid-protocol",
                    };
                }
                stream.index = oldIdx;

                msg = new net.JoinAsSpectatorMsg();
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
            case net.MsgType.RoleSelect:
                msg = new net.RoleSelectMsg();
                msg.deserialize(stream);
                break;
            case net.MsgType.Edit:
                //if (!Config.debug.allowEditMsg) break;
                msg = new net.EditMsg();
                msg.deserialize(stream);
                break;
            case net.MsgType.KillFeed:
                msg = new net.KillFeedMsg();
                msg.deserialize(stream);
                break;
        }

        return {
            type,
            msg,
        };
    }

    handleMsg(buff: ArrayBuffer | Buffer, socketId: string, ip: string): void {
        if (!(buff instanceof ArrayBuffer)) return;

        const player = this.playerBarn.socketIdToPlayer.get(socketId);

        let msg: net.AbstractMsg | undefined = undefined;
        let type = net.MsgType.None;
        let error: string | undefined;

        try {
            const deserialized = this.deserializeMsg(buff);
            msg = deserialized.msg;
            type = deserialized.type;
            error = deserialized.error;
        } catch (err) {
            this.logger.error(
                "Failed to deserialize msg: ",
                err,
                "msg buffer: ",
                // JSON.stringify doesn't work on buffers, so need to convert to an Uint8Array first
                // and then to a regular array... 😭
                // the slice is to make sure it doesn't overflow the error webhook
                JSON.stringify([...new Uint8Array(buff.slice(0, 255))]),
            );
            this.closeSocket(socketId);
            return;
        }

        if (error) {
            this.closeSocket(socketId, error);
            return;
        }

        if (!msg) return;

        if (type === net.MsgType.Join && !player) {
            this.playerBarn.addPlayer(socketId, msg as net.JoinMsg, ip);
            return;
        }

        if (type === net.MsgType.JoinAsSpectator && !player) {
            this.playerBarn.addSpectator(socketId, msg as net.JoinAsSpectatorMsg, ip);
            return;
        }

        if (!player) {
            this.closeSocket(socketId);
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
                player.spectate(msg as net.SpectateMsg);
                break;
            }
            case net.MsgType.PerkModeRoleSelect: {
                player.roleSelect((msg as net.PerkModeRoleSelectMsg).role);
                break;
            }
            case net.MsgType.RoleSelect: {
                if(player.role)return;
                player.playerRoleSelect((msg as net.RoleSelectMsg).role);
                break;
            }
            case net.MsgType.Edit: {
                if(!player.isAdmin && !Config.debug.allowEditMsg) break;
                player.processEditMsg(msg as net.EditMsg);
                break;
            }
            case net.MsgType.KillFeed: {
                player.processKillFeedMsg(msg as net.KillFeedMsg);
                break;
            }
        }
    }

    handleSocketClose(socketId: string): void {
        const player = this.playerBarn.socketIdToPlayer.get(socketId);
        if (!player) return;
        this.logger.info(`"${player.name}" left`);
        player.disconnected = true;
        player.group?.checkPlayers();
        player.spectating = undefined;
        player.dirNew = v2.create(1, 0);
        player.setPartDirty();
        if (player.downed){
            //player killed durch bleed out
            player.kill({
                damageType: GameConfig.DamageType.Bleeding,
                dir: player.dir,
                source: player.downedBy,
            });
        }else
        if (player.canDespawn() && this.map.mapDef.gameMode.canDespawn || !this.started && !player.spectator) {
            player.game.playerBarn.removePlayer(player);
            player.mapIndicator?.kill();
        }else {
            player.kill({
                damageType: GameConfig.DamageType.Disconnect,
                dir: player.dir,
                source: player.lastDamagedBy,
            });
        }

    }

    broadcastMsg(type: net.MsgType, msg: net.Msg) {
        this.msgsToSend.serializeMsg(type, msg);
    }

    checkGameOver(): void {
        if (this.over) return;
        const didGameEnd: boolean = this.modeManager.handleGameEnd();

        if (didGameEnd) {
            this.over = true;

            // send win emoji after 1 second
            this.playerBarn.sendWinEmoteTicker = 1;
            // stop game after 1.8s
            this.stopTicker = 1.8;

            this.updateData();
        }
    }

    // --------------- Dashboard admin helpers ---------------

    /** Hashes a raw IP using the same salt as ModerationRouter. */
    private hashIp(ip: string): string {
        return createHash("sha256").update(Config.secrets.SURVEV_IP_SECRET + ip).digest("hex");
    }

    /** Builds the live player list sent to the moderation dashboard. */
    getPlayerDataForDashboard(): DashboardPlayer[] {
        return this.playerBarn.players.map((p) => ({
            username: p.name,
            userId: p.userId ?? "",
            encodedIp: this.hashIp(p.ip),
            kills: p.kills,
            assists: p.assists,
            alive: !p.dead,
            isSpectator: p.spectating !== undefined,
            isAdmin: p.isAdmin,
            disconnected: p.disconnected,
        }));
    }

    /** Sends an announcement to all players in this game.
     *  duration is in milliseconds (client default = 3000). */
    private broadcastAnnounce(text: string, color = "#ffffff", sender = "moderator", duration = 3000) {
        const msg = new net.KillFeedMsg();
        msg.type = net.KillFeedMsgType.CmdMsg;
        msg.player = sender;
        msg.cmd = "announce";
        msg.string = text;
        msg.args.push(color, String(duration));
        this.broadcastMsg(net.MsgType.KillFeed, msg);
    }

    /** Sends an announcement only to the named player (direct message).
     *  duration is in milliseconds (client default = 3000). */
    private announceToPlayer(targetName: string, text: string, color = "#ffffff", sender = "moderator", duration = 3000) {
        const target = this.playerBarn.players.find((p) => p.name === targetName);
        if (!target) return;
        const msg = new net.KillFeedMsg();
        msg.type = net.KillFeedMsgType.CmdMsg;
        msg.player = sender;
        msg.cmd = "announce";
        msg.string = text;
        msg.args.push(color, String(duration));
        target.sendMsg(net.MsgType.KillFeed, msg);
    }

    /** Kicks a player by display name and calls checkGameOver. */
    private kickPlayerByName(name: string, reason: string) {
        const player = this.playerBarn.players.find((p) => p.name === name);
        if (!player) return;
        this.closeSocket(player.socketId, reason);
        this.checkGameOver();
    }

    /** Executes an admin command sent from the moderation dashboard via IPC. */
    executeAdminCmd(cmd: AdminCmdAction) {
        switch (cmd.action) {
            case "freeze":
                this.frozen = true;
                this.broadcastAnnounce("Game frozen by moderator", "#ff4444");
                break;
            case "unfreeze":
                this.frozen = false;
                this.broadcastAnnounce("Game unfrozen", "#44ff44");
                break;
            case "verify":
                this.verifiedOnly = true;
                for (const p of this.playerBarn.livingPlayers) {
                    if (!p.userId) this.kickPlayerByName(p.name, "player_not_verified");
                }
                break;
            case "unverify":
                this.verifiedOnly = false;
                break;
            case "kick":
                this.kickPlayerByName(cmd.target, "kicked_by_admin");
                break;
            case "announce":
                this.broadcastAnnounce(cmd.text, cmd.color, cmd.sender);
                break;
            case "announce_player":
                this.announceToPlayer(cmd.target, cmd.text, cmd.color, cmd.sender);
                break;
        }
    }

    // -------------------------------------------------------

    addJoinTokens(tokens: FindGamePrivateBody["playerData"], autoFill: boolean) {
        const groupData = {
            playerCount: tokens.length,
            groupHashToJoin: "",
            autoFill,
        };

        for (const token of tokens) {
            this.joinTokens.set(token.token, {
                expiresAt: Date.now() + 10000,
                userId: token.userId,
                groupData,
                findGameIp: token.ip,
                loadout: token.loadout,
                admin: token.admin,
            });
        }
    }

    addJoinTokensAsSpectator(tokens: FindGamePrivateBody["playerData"], autoFill: boolean) {
        const groupData = {
            playerCount: tokens.length,
            groupHashToJoin: "",
            autoFill,
        };

        for (const token of tokens) {
            this.joinTokens.set(token.token, {
                expiresAt: Date.now() + 10000,
                userId: token.userId,
                groupData,
                findGameIp: token.ip,
                loadout: token.loadout,
                admin: token.admin,
            });
        }
    }

    /**
     * Like addJoinTokens, but registers one separate `groupData` per team batch
     * so each batch ends up in its own in-game Group instead of all sharing one.
     * Used for private lobbies, where the leader assigns players to teams beforehand.
     * Never auto-fills empty slots with bots/randoms.
     */
    addGroupedJoinTokens(teams: FindGamePrivateBody["playerData"][]) {
        for (const tokens of teams) {
            if (!tokens.length) continue;

            const groupData = {
                playerCount: tokens.length,
                groupHashToJoin: "",
                autoFill: false,
            };

            for (const token of tokens) {
                this.joinTokens.set(token.token, {
                    expiresAt: Date.now() + 10000,
                    userId: token.userId,
                    groupData,
                    findGameIp: token.ip,
                    loadout: token.loadout,
                    admin: token.admin,
                });
            }
        }
    }

    updateData() {
        this.sendData?.({
            type: ProcessMsgType.UpdateData,
            id: this.id,
            teamMode: this.teamMode,
            mapName: this.mapName,
            canJoin: this.canJoin,
            isPrivate: this.isPrivate,
            aliveCount: this.aliveCount,
            startedTime: this.startedTime,
            stopped: this.stopped,
        });
    }

    stop(): void {
        if (this.stopped) return;
        this.stopped = true;
        this.allowJoin = false;
        for (const player of this.playerBarn.players) {
            if (!player.disconnected) {
                this.closeSocket(player.socketId);
            }
        }
        this.logger.info("Game Ended");
        this.updateData();
        this._saveGameToDatabase();
    }

    private async _saveGameToDatabase() {
        const players = this.modeManager.getPlayersSortedByRank();
        /**
         * teamTotal is for total teams that started the match, i hope?
         *
         * it also seems to be unused by the client so we could also remove it?
         */
        const teamTotal = new Set(players.map(({ player }) => player.teamId)).size;

        const teamKills = players.reduce(
            (acc, curr) => {
                acc[curr.player.teamId] =
                    (acc[curr.player.teamId] ?? 0) + curr.player.kills;
                return acc;
            },
            {} as Record<string, number>,
        );

        const values: SaveGameBody["matchData"] = players.map(({ player, rank }) => {
            return {
                // *NOTE: userId is optional; we save the game stats for non logged users too
                userId: !player.spectator ? player.userId : null,
                region: Config.gameServer.thisRegion,
                username: player.name,
                playerId: player.matchDataId,
                teamMode: this.teamMode,
                teamCount: player.group?.players.length ?? 1,
                teamTotal: teamTotal,
                teamId: player.teamId,
                timeAlive: Math.round(player.timeAlive),
                died: player.dead,
                kills: player.kills,
                assists: player.assists,
                team_kills: teamKills[player.groupId] ?? 0,
                damageDealt: Math.round(player.damageDealt),
                damageTaken: Math.round(player.damageTaken),
                killerId: player.killedBy?.matchDataId || 0,
                gameId: this.id,
                mapId: this.map.mapId,
                mapSeed: this.map.seed,
                killedIds: player.killedIds,
                assistedIds: player.assistedIds,
                rank: rank,
                ip: player.ip,
                findGameIp: player.findGameIp,
            };
        });

        // only save the game if it has more than 2 players lol
        if (values.length < 2) return;

        // FIXME: maybe move this to the parent game server process?
        // to avoid blocking the game from being GC'd until this request is done
        // and opening a database in each process if it fails
        // etc
        let res: Response | undefined = undefined;
        try {
            res = await apiPrivateRouter.save_game.$post({
                json: {
                    matchData: values,
                },
            });
        } catch (err) {
            this.logger.error(`Failed to fetch API save game:`, err);
        }

        if (!res || !res.ok) {
            const region = Config.gameServer.thisRegion.toUpperCase();
            this.logger.error(
                `[${region}] Failed to save game data, saving locally instead`,
            );

            const dir = path.resolve("lost_game_data");
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            fs.writeFileSync(
                path.join(dir, `${this.id}.json`),
                JSON.stringify(values),
                "utf8",
            );
        }
    }

    /**
     * Steps the game X seconds in the future
     * This is done in smaller steps of 0.1 seconds
     * To make sure everything updates properly
     *
     * Used for unit tests, don't call this on actual game code :p
     */
    step(seconds: number) {
        for (let i = 0, steps = seconds * 10; i < steps; i++) {
            this.update(0.1);
        }
    }
}
