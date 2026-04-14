import type { AbstractMsg, BitStream } from "./net";
import type {
    ObjectsFullData,
    ObjectsPartialData,
    ObjectType,
} from "./objectSerializeFns";
import type { Bullet, Emote, Explosion, MapIndicator, Plane } from "./updateMsg";
import {
    type Airstrike,
    deserializeActivePlayer,
    deserializeGasData,
    deserializePlayerInfo,
    type GasData,
    type LocalDataWithDirty,
    type PlayerInfo,
    type PlayerStatus,
    serializeActivePlayer,
    serializeGasData,
    serializePlayerInfo,
} from "./updateMsg";
import {
    deserializeAirstrikeZones,
    deserializeBullets,
    deserializeEmotes,
    deserializeExplosions,
    deserializeFullObjects,
    deserializeMapIndicators,
    deserializePartObjects,
    deserializePlanes,
    serializeAirstrikeZones,
    serializeBullets,
    serializeEmotes,
    serializeExplosions,
    serializeFullObjects,
    serializeMapIndicators,
    serializePartObjects,
    serializePlanes,
} from "./updateSections";

export interface ReplayLocalPlayerData {
    playerId: number;
    data: LocalDataWithDirty;
}

export interface ReplayPlayerStatus extends PlayerStatus {
    playerId: number;
}

export const ReplayUpdateFlags = {
    DeletedObjects: 1 << 0,
    FullObjects: 1 << 1,
    PlayerInfos: 1 << 2,
    DeletePlayerIds: 1 << 3,
    PlayerStatuses: 1 << 4,
    LocalPlayerData: 1 << 5,
    Gas: 1 << 6,
    GasCircle: 1 << 7,
    Bullets: 1 << 8,
    Explosions: 1 << 9,
    Emotes: 1 << 10,
    Planes: 1 << 11,
    AirstrikeZones: 1 << 12,
    MapIndicators: 1 << 13,
    KillLeader: 1 << 14,
};

function serializeReplayPlayerStatus(s: BitStream, player: ReplayPlayerStatus) {
    s.writeUint16(player.playerId);
    s.writeMapPos(player.pos, 11);
    s.writeBoolean(player.visible);
    s.writeBoolean(player.dead);
    s.writeBoolean(player.downed);
    s.writeBoolean(player.role !== "");
    if (player.role !== "") {
        s.writeGameType(player.role);
    }
    s.writeFloat(player.health ?? 100, 0, 100, 7);
    s.writeBoolean(!!player.disconnected);
    s.writeAlignToNextByte();
}

function deserializeReplayPlayerStatus(s: BitStream): ReplayPlayerStatus {
    const player = {
        playerId: s.readUint16(),
        pos: s.readMapPos(11),
        visible: s.readBoolean(),
        dead: s.readBoolean(),
        downed: s.readBoolean(),
        role: "",
        health: 100,
        disconnected: false,
        hasData: true,
    } as ReplayPlayerStatus;

    if (s.readBoolean()) {
        player.role = s.readGameType();
    }
    player.health = s.readFloat(0, 100, 7);
    player.disconnected = s.readBoolean();
    s.readAlignToNextByte();
    return player;
}

export class ReplayUpdateMsg implements AbstractMsg {
    delObjIds: number[] = [];
    fullObjects: Array<
        ObjectsFullData[ObjectType] &
            ObjectsPartialData[ObjectType] & {
                __id: number;
                __type: ObjectType;
                partialStream: BitStream;
                fullStream: BitStream;
            }
    > = [];

    partObjects: Array<
        ObjectsPartialData[ObjectType] & {
            __id: number;
            __type: ObjectType;
            partialStream: BitStream;
        }
    > = [];

    playerInfos: PlayerInfo[] = [];
    deletedPlayerIds: number[] = [];
    playerStatuses: ReplayPlayerStatus[] = [];
    localPlayerData: ReplayLocalPlayerData[] = [];

    gasData!: GasData;
    gasDirty = false;
    gasT = 0;
    gasTDirty = false;

    bullets: Bullet[] = [];
    explosions: Explosion[] = [];
    emotes: Emote[] = [];
    planes: Plane[] = [];
    airstrikeZones: Airstrike[] = [];
    mapIndicators: MapIndicator[] = [];

    killLeaderId = 0;
    killLeaderKills = 0;
    killLeaderDirty = false;

    serialize(s: BitStream) {
        let flags = 0;
        const flagsIdx = s.byteIndex;
        s.writeUint16(flags);

        if (this.delObjIds.length) {
            s.writeArray(this.delObjIds, 16, (id) => {
                s.writeUint16(id);
            });
            flags |= ReplayUpdateFlags.DeletedObjects;
        }

        if (this.fullObjects.length) {
            serializeFullObjects(s, this.fullObjects);
            flags |= ReplayUpdateFlags.FullObjects;
        }

        serializePartObjects(s, this.partObjects);

        if (this.playerInfos.length) {
            s.writeArray(this.playerInfos, 8, (info) => {
                serializePlayerInfo(s, info);
            });
            flags |= ReplayUpdateFlags.PlayerInfos;
        }

        if (this.deletedPlayerIds.length) {
            s.writeArray(this.deletedPlayerIds, 8, (id) => {
                s.writeUint16(id);
            });
            flags |= ReplayUpdateFlags.DeletePlayerIds;
        }

        if (this.playerStatuses.length) {
            s.writeArray(this.playerStatuses, 8, (player) => {
                serializeReplayPlayerStatus(s, player);
            });
            flags |= ReplayUpdateFlags.PlayerStatuses;
        }

        if (this.localPlayerData.length) {
            s.writeArray(this.localPlayerData, 8, (player) => {
                s.writeUint16(player.playerId);
                serializeActivePlayer(s, player.data);
            });
            flags |= ReplayUpdateFlags.LocalPlayerData;
        }

        if (this.gasDirty) {
            serializeGasData(s, this.gasData);
            flags |= ReplayUpdateFlags.Gas;
        }

        if (this.gasTDirty) {
            s.writeFloat(this.gasT, 0, 1, 16);
            flags |= ReplayUpdateFlags.GasCircle;
        }

        if (this.bullets.length) {
            serializeBullets(s, this.bullets);
            flags |= ReplayUpdateFlags.Bullets;
        }

        if (this.explosions.length) {
            serializeExplosions(s, this.explosions);
            flags |= ReplayUpdateFlags.Explosions;
        }

        if (this.emotes.length) {
            serializeEmotes(s, this.emotes);
            flags |= ReplayUpdateFlags.Emotes;
        }

        if (this.planes.length) {
            serializePlanes(s, this.planes);
            flags |= ReplayUpdateFlags.Planes;
        }

        if (this.airstrikeZones.length) {
            serializeAirstrikeZones(s, this.airstrikeZones);
            flags |= ReplayUpdateFlags.AirstrikeZones;
        }

        if (this.mapIndicators.length) {
            serializeMapIndicators(s, this.mapIndicators);
            flags |= ReplayUpdateFlags.MapIndicators;
        }

        if (this.killLeaderDirty) {
            s.writeUint16(this.killLeaderId);
            s.writeUint8(this.killLeaderKills);
            flags |= ReplayUpdateFlags.KillLeader;
        }

        const idx = s.byteIndex;
        s.byteIndex = flagsIdx;
        s.writeUint16(flags);
        s.byteIndex = idx;
    }

    // @ts-expect-error deserialize only accept one argument for now
    deserialize(
        s: BitStream,
        objectCreator: { m_getTypeById: (id: number, s: BitStream) => ObjectType },
    ) {
        const flags = s.readUint16();

        if ((flags & ReplayUpdateFlags.DeletedObjects) != 0) {
            this.delObjIds = s.readArray(16, () => s.readUint16());
        }

        if ((flags & ReplayUpdateFlags.FullObjects) != 0) {
            this.fullObjects = deserializeFullObjects(s);
        }

        this.partObjects = deserializePartObjects(s, objectCreator);

        if ((flags & ReplayUpdateFlags.PlayerInfos) != 0) {
            this.playerInfos = s.readArray(8, () => {
                const info = {} as PlayerInfo;
                deserializePlayerInfo(s, info);
                return info;
            });
        }

        if ((flags & ReplayUpdateFlags.DeletePlayerIds) != 0) {
            this.deletedPlayerIds = s.readArray(8, () => s.readUint16());
        }

        if ((flags & ReplayUpdateFlags.PlayerStatuses) != 0) {
            this.playerStatuses = s.readArray(8, () => deserializeReplayPlayerStatus(s));
        }

        if ((flags & ReplayUpdateFlags.LocalPlayerData) != 0) {
            this.localPlayerData = s.readArray(8, () => {
                const player = {
                    playerId: s.readUint16(),
                    data: {} as LocalDataWithDirty,
                };
                const target = player.data;
                target.healthDirty = false;
                target.boostDirty = false;
                target.zoomDirty = false;
                target.actionDirty = false;
                target.inventoryDirty = false;
                target.weapsDirty = false;
                target.spectatorCountDirty = false;
                target.action = { time: 0, duration: 0, targetId: 0 };
                deserializeActivePlayer(s, target);
                return player;
            });
        }

        if ((flags & ReplayUpdateFlags.Gas) != 0) {
            const gasData = {} as GasData;
            deserializeGasData(s, gasData);
            this.gasData = gasData;
            this.gasDirty = true;
        }

        if ((flags & ReplayUpdateFlags.GasCircle) != 0) {
            this.gasT = s.readFloat(0, 1, 16);
            this.gasTDirty = true;
        }

        if ((flags & ReplayUpdateFlags.Bullets) != 0) {
            this.bullets = deserializeBullets(s);
        }

        if ((flags & ReplayUpdateFlags.Explosions) != 0) {
            this.explosions = deserializeExplosions(s);
        }

        if ((flags & ReplayUpdateFlags.Emotes) != 0) {
            this.emotes = deserializeEmotes(s);
        }

        if ((flags & ReplayUpdateFlags.Planes) != 0) {
            this.planes = deserializePlanes(s);
        }

        if ((flags & ReplayUpdateFlags.AirstrikeZones) != 0) {
            this.airstrikeZones = deserializeAirstrikeZones(s);
        }

        if ((flags & ReplayUpdateFlags.MapIndicators) != 0) {
            this.mapIndicators = deserializeMapIndicators(s);
        }

        if ((flags & ReplayUpdateFlags.KillLeader) != 0) {
            this.killLeaderId = s.readUint16();
            this.killLeaderKills = s.readUint8();
            this.killLeaderDirty = true;
        }
    }
}
