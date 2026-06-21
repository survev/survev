import { GameConfig, TeamMode } from "../../../shared/gameConfig.ts";
import * as net from "../../../shared/net/net.ts";
import type { Loadout } from "../../../shared/utils/loadout.ts";
import { math } from "../../../shared/utils/math.ts";
import { v2 } from "../../../shared/utils/v2.ts";
import { Config } from "../config.ts";
import { ServerLogger } from "../utils/logger.ts";
import {
    getParticipantKeys,
    hasParticipantConflict,
    type ParticipantRecord,
} from "../utils/matchmaking.ts";
import { type FindGamePrivateBody, type ServerGameConfig } from "../utils/types.ts";
import { GameModeManager } from "./gameModeManager.ts";
import { Grid } from "./grid.ts";
import { GameMap } from "./map.ts";
import { AirdropBarn } from "./objects/airdrop.ts";
import { BulletBarn } from "./objects/bullet.ts";
import { DeadBodyBarn } from "./objects/deadBody.ts";
import { DecalBarn } from "./objects/decal.ts";
import { ExplosionBarn } from "./objects/explosion.ts";
import { type GameObject, ObjectRegister } from "./objects/gameObject.ts";
import { Gas } from "./objects/gas.ts";
import { LootBarn } from "./objects/loot.ts";
import { MapIndicatorBarn } from "./objects/mapIndicator.ts";
import { PlaneBarn } from "./objects/plane.ts";
import { Player, PlayerBarn } from "./objects/player.ts";
import { ProjectileBarn } from "./objects/projectile.ts";
import { SmokeBarn } from "./objects/smoke.ts";
import { Profiler } from "./profiler.ts";
import type { ClientSocket } from "./socket.ts";

export interface JoinTokenData {
    expiresAt: number;
    userId: string | null;
    clientId?: string;
    findGameIp: string;
    reservationId: string;
    loadout?: Loadout;
    quests?: string[];
    groupData: {
        autoFill: boolean;
        playerCount: number;
        groupHashToJoin: string;
    };
}

export class Game {
    started = false;
    stopped = false;
    over = false;
    startedTime = 0;
    stopTicker = 0;
    // used to stop the game if theres no connected players
    noPlayersTicker = 0;

    id: string;
    teamMode: TeamMode;
    mapName: string;
    isTeamMode: boolean;
    config: ServerGameConfig;
    modeManager: GameModeManager;

    now!: number;
    profiler = new Profiler();
    perfTicker = 0;
    tickTimes: number[] = [];

    tickTimeWarnThreshold = (1000 / Config.gameTps) * 4;
    gameTickWarnings = 0;

    netSyncWarnThreshold = (1000 / Config.netSyncTps) * 4;
    netSyncWarnings = 0;

    joinTokens = new Map<string, JoinTokenData>();
    participantRecords = new Map<string, string>();

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

    grid: Grid<GameObject>;
    map: GameMap;
    gas: Gas;
    objectRegister: ObjectRegister;

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

    logger: ServerLogger;

    // for debug
    preventStart = false;
    debugSpeedMulti = 1;

    constructor(id: string, config: ServerGameConfig) {
        const start = Date.now();
        this.id = id;
        this.logger = new ServerLogger(`Game #${this.id.substring(0, 4)}`);
        this.logger.info("Creating");

        this.config = config;

        this.teamMode = config.teamMode;
        this.mapName = config.mapName;
        this.isTeamMode = this.teamMode !== TeamMode.Solo;

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

        this.map.init();

        this.logger.info(`Created in ${Date.now() - start} ms`);

        this.updateData();
    }

    update(dt?: number) {
        if (this.stopped) return;
        this.profiler.flush();

        const now = performance.now();
        if (!this.now) this.now = now;
        dt ??= math.clamp((now - this.now) / 1000, 0.001, 1 / 8);

        dt *= this.debugSpeedMulti;

        this.now = now;

        if (this.over) {
            this.stopTicker -= dt;
            if (this.stopTicker <= 0) {
                this.stop();
                return;
            }
        }

        if (!this.started && !this.preventStart) {
            this.started = this.modeManager.isGameStarted();
            if (this.started) {
                this.gas.advanceGasStage();
            } else {
                const connected = this.playerBarn.players.reduce((a, b) => {
                    return a + (b.disconnected ? 0 : 1);
                }, 0);
                if (connected === 0) {
                    this.noPlayersTicker += dt;
                } else {
                    this.noPlayersTicker = 0;
                }
                // after 30 seconds of no connected players on a game that didn't start
                // we just force stop the game so it doesn't run forever...
                if (this.noPlayersTicker > 30) {
                    this.over = true;
                    this.stop();
                    return;
                }
            }
        }

        if (this.started) this.startedTime += dt;

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
                const mspt = this.tickTimes.reduce((a, b) => a + b) / this.tickTimes.length;

                this.logger.debug(
                    `Avg ms/tick: ${mspt.toFixed(2)} | Load: ${((mspt / (1000 / Config.gameTps)) * 100).toFixed(1)}%`,
                );
                this.tickTimes = [];
            }
        }
    }

    netSync() {
        if (this.stopped) return;

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

    get maxPlayers(): number {
        return this.map.mapDef.gameMode.maxPlayers;
    }

    get participantRecordList(): ParticipantRecord[] {
        return Array.from(this.participantRecords.entries()).map(([key, reservationId]) => ({
            key,
            reservationId,
        }));
    }

    get isEarlyJoinWindowOpen(): boolean {
        return (
            this.aliveCount < this.maxPlayers
            && !this.over
            && !this.stopped
            && this.startedTime < Config.matchmaking.earlyJoinWindowSeconds
        );
    }

    get canAcceptMatchmakingPlayers(): boolean {
        if (this.aliveCount >= this.maxPlayers || this.over || this.stopped) return false;
        if (this.isEarlyJoinWindowOpen) return true;
        if (!Config.matchmaking.lateJoinEnabled || !this.started) return false;

        const targetPlayers = Math.min(
            this.maxPlayers,
            Config.matchmaking.lateJoinTargetPlayers,
        );
        return (
            this.startedTime <= Config.matchmaking.lateJoinMaxStartedTime
            && this.gas.circleIdx <= Config.matchmaking.lateJoinMaxGasCircleIdx
            && this.aliveCount >= Config.matchmaking.lateJoinMinAliveCount
            && this.aliveCount < targetPlayers
        );
    }

    get canUpdateGroupSpawnAnchor(): boolean {
        return this.isEarlyJoinWindowOpen;
    }

    get canJoin(): boolean {
        return this.canAcceptMatchmakingPlayers;
    }

    getJoinTokenParticipantKeys(joinData: JoinTokenData): string[] {
        return getParticipantKeys({
            userId: joinData.userId,
            clientId: joinData.clientId,
            ip: joinData.findGameIp,
        });
    }

    hasParticipantConflict(joinData: JoinTokenData): boolean {
        return hasParticipantConflict(
            this.participantRecordList,
            this.getJoinTokenParticipantKeys(joinData),
            joinData.reservationId,
        );
    }

    registerParticipant(joinData: JoinTokenData) {
        for (const key of this.getJoinTokenParticipantKeys(joinData)) {
            this.participantRecords.set(key, joinData.reservationId);
        }
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

    handleMsg(buff: ArrayBuffer | Buffer, socket: ClientSocket<Player | undefined>) {
        if (!(buff instanceof ArrayBuffer)) return;

        const player = socket.getUserData();

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
            if (player) {
                player.disconnect();
            } else {
                socket.close();
            }
            return;
        }

        if (error) {
            this.logger.warn("Disconnecting player because of packet error:", error);
            if (player) {
                player.disconnect();
            } else {
                socket.close();
            }
            return;
        }

        if (!msg) return;

        if (type === net.MsgType.Join && !player) {
            this.playerBarn.addPlayer(socket, msg as net.JoinMsg);
            return;
        }

        if (!player) {
            this.logger.warn("No player found and we didn't receive a JoinMsg, closing socket");
            socket.close();
            return;
        }

        if (player.disconnected) {
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
            case net.MsgType.Edit: {
                player.processEditMsg(msg as net.EditMsg);
                break;
            }
        }
    }

    handleSocketClose(socket: ClientSocket<Player | undefined>) {
        const player = socket.getUserData();
        if (!player) return;
        this.logger.info(`"${player.name}" left`);
        player.questManager.flushProgress();
        player.disconnected = true;
        player.group?.checkPlayers();
        player.spectating = undefined;
        player.dirNew = v2.create(1, 0);
        player.setPartDirty();
        if (player.canDespawn()) {
            player.game.playerBarn.removePlayer(player);
        }
    }

    broadcastMsg(type: net.MsgType, msg: net.Msg) {
        this.msgsToSend.serializeMsg(type, msg);
    }

    checkGameOver() {
        if (this.over) return;

        const didGameEnd = this.started && this.modeManager.aliveCount() <= 1;

        if (didGameEnd) {
            this.over = true;

            // send win emoji after 1 second
            this.playerBarn.sendWinEmoteTicker = 1;
            // stop game after 1.8s
            this.stopTicker = 1.8;

            this.modeManager.sendGameOverMsgs();
            this.updateData();
        }
    }

    addJoinTokens(
        tokens: FindGamePrivateBody["playerData"],
        autoFill: boolean,
        reservationId: string,
    ) {
        const groupData = {
            playerCount: tokens.length,
            groupHashToJoin: "",
            autoFill,
        };

        for (const token of tokens) {
            this.joinTokens.set(token.token, {
                expiresAt: Date.now() + 10000,
                userId: token.userId,
                clientId: token.clientId,
                reservationId,
                groupData,
                findGameIp: token.ip,
                loadout: token.loadout,
                quests: token.quests,
            });
        }
    }

    notifyJoinTokenConsumed(_token: string) {}

    stop() {
        if (this.stopped) return;
        this.stopped = true;
        for (const player of this.playerBarn.players) {
            if (!player.disconnected) {
                player.disconnect();
            }
        }
        this.logger.info("Game Ended");
        this.updateData();
        this._saveGameToDatabase();
    }

    // implementation of those is on gameProcess.ts
    // this keeps the base Game class free of nodejs imports and the ability to make network requests
    // to make offline mode and unit tests easier to maintain

    updateData() {}
    protected async _saveGameToDatabase() {}
    async sendQuestProgress(_userId: string, _progress: Array<{ id: string; delta: number }>) {}

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
