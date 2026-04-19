import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as net from "../../../shared/net/net";
import { coldet } from "../../../shared/utils/coldet";
import { PacketRecorder, PacketType } from "../../../shared/utils/packetRecorder";
import type { Game } from "./game";

export class ReplayCaptureService {
    private recorder?: PacketRecorder;
    private playerStatusTicker = 0;
    private static readonly InitialBufferSize = 1 << 16;
    private static readonly MaxBufferSize = 1 << 24;

    constructor(private readonly game: Game) {}

    stop() {
        this.recorder?.stopRecording();
        this.playerStatusTicker = 0;
    }

    startIfNeeded() {
        if (this.recorder || this.game.stopped || !this.game.allowJoin) return;

        this.playerStatusTicker = 0;

        const player =
            this.game.playerBarn.livingPlayers[0] ?? this.game.playerBarn.players[0];
        if (!player) return;

        const initialPacket = this.buildPacket((msgStream) => {
            const joinedMsg = new net.JoinedMsg();
            joinedMsg.teamMode = this.game.teamMode;
            joinedMsg.playerId = player.__id;
            joinedMsg.started = this.game.started;
            joinedMsg.emotes = player.loadout.emotes;
            msgStream.serializeMsg(net.MsgType.Joined, joinedMsg);

            msgStream.stream.writeBytes(
                this.game.map.mapStream.stream,
                0,
                this.game.map.mapStream.stream.byteIndex,
            );

            msgStream.serializeMsg(net.MsgType.ReplayUpdate, this.buildUpdate(true));

            if (
                this.game.playerBarn.aliveCountDirty ||
                this.game.playerBarn.players.length > 0
            ) {
                const aliveMsg = new net.AliveCountsMsg();
                this.game.modeManager.updateAliveCounts(aliveMsg.teamAliveCounts);
                msgStream.serializeMsg(net.MsgType.AliveCounts, aliveMsg);
            }
        });

        this.recorder = PacketRecorder.create(1 << 20);
        this.recorder.startRecording();
        this.recorder.addPacket(PacketType.Server, initialPacket);
    }

    captureTick() {
        if (!this.recorder?.recording || this.game.stopped) return;

        this.playerStatusTicker += 1 / 30;

        const replayMsg = this.buildUpdate(false);
        const hasReplayData =
            replayMsg.delObjIds.length > 0 ||
            replayMsg.fullObjects.length > 0 ||
            replayMsg.partObjects.length > 0 ||
            replayMsg.playerInfos.length > 0 ||
            replayMsg.deletedPlayerIds.length > 0 ||
            replayMsg.playerStatuses.length > 0 ||
            replayMsg.localPlayerData.length > 0 ||
            replayMsg.gasDirty ||
            replayMsg.gasTDirty ||
            replayMsg.bullets.length > 0 ||
            replayMsg.explosions.length > 0 ||
            replayMsg.emotes.length > 0 ||
            replayMsg.planes.length > 0 ||
            replayMsg.airstrikeZones.length > 0 ||
            replayMsg.mapIndicators.length > 0 ||
            replayMsg.killLeaderDirty ||
            this.game.playerBarn.aliveCountDirty ||
            this.game.msgsToSend.stream.byteIndex > 0;

        if (!hasReplayData) return;

        const packet = this.buildPacket((msgStream) => {
            msgStream.serializeMsg(net.MsgType.ReplayUpdate, replayMsg);

            if (this.game.playerBarn.aliveCountDirty) {
                const aliveMsg = new net.AliveCountsMsg();
                this.game.modeManager.updateAliveCounts(aliveMsg.teamAliveCounts);
                msgStream.serializeMsg(net.MsgType.AliveCounts, aliveMsg);
            }

            msgStream.stream.writeBytes(
                this.game.msgsToSend.stream,
                0,
                this.game.msgsToSend.stream.byteIndex,
            );
        });

        this.recorder.addPacket(PacketType.Server, packet);
    }

    async saveReplay() {
        const replayBuffer = this.recorder?.getData();
        if (!replayBuffer) return;

        const recordingsDir = path.resolve(process.cwd(), "recordings");
        const replayPath = path.join(recordingsDir, `recording-${this.game.id}.surv`);

        try {
            await mkdir(recordingsDir, { recursive: true });
            await writeFile(replayPath, Buffer.from(replayBuffer));
            this.game.logger.info(`Saved replay: ${replayPath}`);
        } catch (err) {
            this.game.logger.error("Failed to save replay locally:", err);
        }
    }

    private buildPacket(writePacket: (msgStream: net.MsgStream) => void) {
        let bufferSize = ReplayCaptureService.InitialBufferSize;

        while (bufferSize <= ReplayCaptureService.MaxBufferSize) {
            try {
                const msgStream = new net.MsgStream(new ArrayBuffer(bufferSize));
                writePacket(msgStream);
                return msgStream.getBuffer();
            } catch (error) {
                if (!(error instanceof RangeError)) {
                    throw error;
                }

                bufferSize *= 2;
            }
        }

        throw new RangeError(
            `Replay packet exceeded ${ReplayCaptureService.MaxBufferSize} bytes`,
        );
    }

    private buildUpdate(fullSnapshot: boolean) {
        const replayMsg = new net.ReplayUpdateMsg();

        if (fullSnapshot) {
            for (const obj of this.game.objectRegister.objects) {
                if (obj) {
                    replayMsg.fullObjects.push(
                        obj as (typeof replayMsg.fullObjects)[number],
                    );
                }
            }
        } else {
            for (const obj of this.game.objectRegister.deletedObjs) {
                replayMsg.delObjIds.push(obj.__id);
            }

            for (const obj of this.game.objectRegister.objects) {
                if (!obj) continue;

                if (this.game.objectRegister.dirtyFull[obj.__id]) {
                    replayMsg.fullObjects.push(
                        obj as (typeof replayMsg.fullObjects)[number],
                    );
                } else if (this.game.objectRegister.dirtyPart[obj.__id]) {
                    replayMsg.partObjects.push(
                        obj as (typeof replayMsg.partObjects)[number],
                    );
                }
            }
        }

        replayMsg.playerInfos = fullSnapshot
            ? [...this.game.playerBarn.players]
            : [...this.game.playerBarn.newPlayers];
        replayMsg.deletedPlayerIds = [...this.game.playerBarn.deletedPlayers];
        if (this.shouldIncludePlayerStatuses(fullSnapshot)) {
            replayMsg.playerStatuses = this.game.playerBarn.getReplayPlayerStatuses();
            this.playerStatusTicker = 0;
        }

        for (const player of this.game.playerBarn.players) {
            if (fullSnapshot || player.hasReplayLocalDataChanges()) {
                replayMsg.localPlayerData.push({
                    playerId: player.__id,
                    data: player.getReplayLocalData(fullSnapshot),
                });
            }
        }

        if (fullSnapshot || this.game.gas.dirty) {
            replayMsg.gasDirty = true;
            replayMsg.gasData = this.game.gas;
        }

        if (fullSnapshot || this.game.gas.timeDirty) {
            replayMsg.gasTDirty = true;
            replayMsg.gasT = this.game.gas.gasT;
        }

        replayMsg.bullets.push(...this.game.bulletBarn.newBullets);
        replayMsg.explosions.push(...this.game.explosionBarn.newExplosions);
        replayMsg.emotes.push(...this.game.playerBarn.emotes);
        for (const plane of this.game.planeBarn.planes) {
            const visibleToAnyPlayer = this.game.playerBarn.players.some((player) => {
                const rect = coldet.circleToAabb(player.pos, player.zoom + 4);
                return coldet.testCircleAabb(plane.pos, plane.rad, rect.min, rect.max);
            });

            if (visibleToAnyPlayer) {
                replayMsg.planes.push(plane);
            }
        }
        replayMsg.airstrikeZones.push(
            ...(fullSnapshot
                ? this.game.planeBarn.airstrikeZones.map((zone) => ({
                      pos: zone.pos,
                      rad: zone.rad,
                      duration: zone.durationTicker,
                  }))
                : this.game.planeBarn.newAirstrikeZones),
        );
        replayMsg.mapIndicators.push(
            ...this.game.mapIndicatorBarn.getReplayUpdates(fullSnapshot),
        );

        if (fullSnapshot || this.game.playerBarn.killLeaderDirty) {
            replayMsg.killLeaderDirty = true;
            replayMsg.killLeaderId = this.game.playerBarn.killLeader?.__id ?? 0;
            replayMsg.killLeaderKills = this.game.playerBarn.killLeader?.kills ?? 0;
        }

        return replayMsg;
    }

    private shouldIncludePlayerStatuses(fullSnapshot: boolean) {
        return (
            fullSnapshot ||
            this.playerStatusTicker >=
                net.getPlayerStatusUpdateRate(this.game.map?.factionMode ?? false)
        );
    }
}
