import { GameConfig } from "../gameConfig";
import type { Vec2 } from "./../utils/v2";
import { type AbstractMsg, type BitStream, Constants } from "./net";
import type {
    ObjectsFullData,
    ObjectsPartialData,
    ObjectType,
} from "./objectSerializeFns";
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

export function serializeActivePlayer(s: BitStream, data: LocalDataWithDirty) {
    s.writeBoolean(data.healthDirty);
    if (data.healthDirty) s.writeFloat(data.health, 0, 100, 8);

    s.writeBoolean(data.boostDirty);
    if (data.boostDirty) s.writeFloat(data.boost, 0, 100, 8);

    s.writeBoolean(data.zoomDirty);
    if (data.zoomDirty) s.writeUint8(data.zoom);

    s.writeBoolean(data.actionDirty);
    if (data.actionDirty) {
        s.writeFloat(data.action.time, 0, Constants.ActionMaxDuration, 8);
        s.writeFloat(data.action.duration, 0, Constants.ActionMaxDuration, 8);
        s.writeUint16(data.action.targetId);
    }

    s.writeBoolean(data.inventoryDirty);
    if (data.inventoryDirty) {
        s.writeGameType(data.scope);
        for (const key of Object.keys(GameConfig.bagSizes)) {
            const hasItem = data.inventory[key] > 0;
            s.writeBoolean(hasItem);
            if (hasItem) s.writeBits(data.inventory[key], 9);
        }
    }

    s.writeBoolean(data.weapsDirty);
    if (data.weapsDirty) {
        s.writeBits(data.curWeapIdx, 2);
        for (let i = 0; i < GameConfig.WeaponSlot.Count; i++) {
            s.writeGameType(data.weapons[i].type);
            s.writeUint8(data.weapons[i].ammo);
        }
    }

    s.writeBoolean(data.spectatorCountDirty);
    if (data.spectatorCountDirty) {
        s.writeUint8(data.spectatorCount);
    }

    s.writeAlignToNextByte();
}

export function deserializeActivePlayer(s: BitStream, data: LocalDataWithDirty) {
    data.healthDirty = s.readBoolean();
    if (data.healthDirty) {
        data.health = s.readFloat(0, 100, 8);
    }
    data.boostDirty = s.readBoolean();
    if (data.boostDirty) {
        data.boost = s.readFloat(0, 100, 8);
    }
    data.zoomDirty = s.readBoolean();
    if (data.zoomDirty) {
        data.zoom = s.readUint8();
    }
    data.actionDirty = s.readBoolean();
    if (data.actionDirty) {
        data.action = {} as Action;
        data.action.time = s.readFloat(0, Constants.ActionMaxDuration, 8);
        data.action.duration = s.readFloat(0, Constants.ActionMaxDuration, 8);
        data.action.targetId = s.readUint16();
    }
    data.inventoryDirty = s.readBoolean();
    if (data.inventoryDirty) {
        data.scope = s.readGameType();
        data.inventory = {};
        const inventoryKeys = Object.keys(GameConfig.bagSizes);
        for (let i = 0; i < inventoryKeys.length; i++) {
            const item = inventoryKeys[i];
            let count = 0;
            if (s.readBoolean()) {
                count = s.readBits(9);
            }
            data.inventory[item] = count;
        }
    }
    data.weapsDirty = s.readBoolean();
    if (data.weapsDirty) {
        data.curWeapIdx = s.readBits(2);
        data.weapons = [];
        for (let i = 0; i < GameConfig.WeaponSlot.Count; i++) {
            data.weapons.push({
                type: s.readGameType(),
                ammo: s.readUint8(),
            });
        }
    }
    data.spectatorCountDirty = s.readBoolean();
    if (data.spectatorCountDirty) {
        data.spectatorCount = s.readUint8();
    }
    s.readAlignToNextByte();
}

export function serializePlayerStatus(s: BitStream, players: PlayerStatus[]) {
    s.writeArray(players, 8, (info) => {
        s.writeBoolean(info.hasData);

        if (info.hasData) {
            s.writeMapPos(info.pos, 11);
            s.writeBoolean(info.visible);
            s.writeBoolean(info.dead);
            s.writeBoolean(info.downed);

            s.writeBoolean(info.role !== "");
            if (info.role !== "") {
                s.writeGameType(info.role);
            }
        }
    });

    s.writeAlignToNextByte();
}

export function deserializePlayerStatus(s: BitStream): PlayerStatus[] {
    const players = s.readArray(8, () => {
        const p = {
            hasData: s.readBoolean(),
        } as PlayerStatus;

        if (p.hasData) {
            p.pos = s.readMapPos(11);
            p.visible = s.readBoolean();
            p.dead = s.readBoolean();
            p.downed = s.readBoolean();
            p.role = "";
            if (s.readBoolean()) {
                p.role = s.readGameType();
            }
        }
        return p;
    });

    s.readAlignToNextByte();

    return players;
}

export function serializeGroupStatus(s: BitStream, players: GroupStatus[]) {
    s.writeArray(players, 8, (status) => {
        s.writeFloat(status.health, 0, 100, 7);
        s.writeBoolean(status.disconnected);
    });
}

export function deserializeGroupStatus(s: BitStream): GroupStatus[] {
    return s.readArray(8, () => {
        return {
            health: s.readFloat(0, 100, 7),
            disconnected: s.readBoolean(),
        };
    });
}

export interface PlayerInfo {
    playerId: number;
    teamId: number;
    groupId: number;
    name: string;

    loadout: {
        heal: string;
        boost: string;
    };
}

export function serializePlayerInfo(s: BitStream, data: PlayerInfo) {
    s.writeUint16(data.playerId);
    s.writeUint8(data.teamId);
    s.writeUint8(data.groupId);
    s.writeString(data.name);

    s.writeGameType(data.loadout.heal);
    s.writeGameType(data.loadout.boost);

    s.writeAlignToNextByte();
}

export function deserializePlayerInfo(s: BitStream, data: PlayerInfo) {
    data.playerId = s.readUint16();
    data.teamId = s.readUint8();
    data.groupId = s.readUint8();
    data.name = s.readString();
    data.loadout = {} as PlayerInfo["loadout"];
    data.loadout.heal = s.readGameType();
    data.loadout.boost = s.readGameType();
    s.readAlignToNextByte();
}

export interface GasData {
    mode: number;
    duration: number;
    posOld: Vec2;
    posNew: Vec2;
    radOld: number;
    radNew: number;
}

export function serializeGasData(s: BitStream, data: GasData) {
    s.writeUint8(data.mode);
    s.writeFloat32(data.duration);
    s.writeMapPos(data.posOld);
    s.writeMapPos(data.posNew);
    s.writeFloat(data.radOld, 0, 2048, 16);
    s.writeFloat(data.radNew, 0, 2048, 16);
}

export function deserializeGasData(s: BitStream, data: GasData) {
    data.mode = s.readUint8();
    data.duration = s.readFloat32();
    data.posOld = s.readMapPos();
    data.posNew = s.readMapPos();
    data.radOld = s.readFloat(0, 2048, 16);
    data.radNew = s.readFloat(0, 2048, 16);
}

export const UpdateExtFlags = {
    DeletedObjects: 1 << 0,
    FullObjects: 1 << 1,
    ActivePlayerId: 1 << 2,
    Gas: 1 << 3,
    GasCircle: 1 << 4,
    PlayerInfos: 1 << 5,
    DeletePlayerIds: 1 << 6,
    PlayerStatus: 1 << 7,
    GroupStatus: 1 << 8,
    Bullets: 1 << 9,
    Explosions: 1 << 10,
    Emotes: 1 << 11,
    Planes: 1 << 12,
    AirstrikeZones: 1 << 13,
    MapIndicators: 1 << 14,
    KillLeader: 1 << 15,
};

export class UpdateMsg implements AbstractMsg {
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

    activePlayerId = 0;
    activePlayerIdDirty = false;
    activePlayerData!: LocalDataWithDirty;

    gasData!: GasData;
    gasDirty = false;
    gasT = 0;
    gasTDirty = false;

    playerInfos: PlayerInfo[] = [];
    deletedPlayerIds: number[] = [];

    playerStatus: PlayerStatus[] = [];
    playerStatusDirty = false;

    groupStatus: GroupStatus[] = [];
    groupStatusDirty = false;

    bullets: Bullet[] = [];
    explosions: Explosion[] = [];
    emotes: Emote[] = [];
    planes: Plane[] = [];
    airstrikeZones: Airstrike[] = [];
    mapIndicators: MapIndicator[] = [];

    killLeaderId = 0;
    killLeaderKills = 0;
    killLeaderDirty = false;
    ack = 0;

    serialize(s: BitStream) {
        let flags = 0;
        const flagsIdx = s.byteIndex;
        s.writeUint16(flags);

        if (this.delObjIds.length) {
            s.writeArray(this.delObjIds, 16, (id) => {
                s.writeUint16(id);
            });

            flags |= UpdateExtFlags.DeletedObjects;
        }

        if (this.fullObjects.length) {
            serializeFullObjects(s, this.fullObjects);

            flags |= UpdateExtFlags.FullObjects;
        }

        serializePartObjects(s, this.partObjects);

        if (this.activePlayerIdDirty) {
            s.writeUint16(this.activePlayerId);
            flags |= UpdateExtFlags.ActivePlayerId;
        }

        serializeActivePlayer(s, this.activePlayerData);

        if (this.gasDirty) {
            serializeGasData(s, this.gasData);
            flags |= UpdateExtFlags.Gas;
        }

        if (this.gasTDirty) {
            s.writeFloat(this.gasT, 0, 1, 16);
            flags |= UpdateExtFlags.GasCircle;
        }

        if (this.playerInfos.length) {
            s.writeArray(this.playerInfos, 8, (info) => {
                serializePlayerInfo(s, info);
            });

            flags |= UpdateExtFlags.PlayerInfos;
        }

        if (this.deletedPlayerIds.length) {
            s.writeArray(this.deletedPlayerIds, 8, (id) => {
                s.writeUint16(id);
            });

            flags |= UpdateExtFlags.DeletePlayerIds;
        }

        if (this.playerStatusDirty) {
            serializePlayerStatus(s, this.playerStatus);
            flags |= UpdateExtFlags.PlayerStatus;
        }

        if (this.groupStatusDirty) {
            serializeGroupStatus(s, this.groupStatus);
            flags |= UpdateExtFlags.GroupStatus;
        }

        if (this.bullets.length) {
            serializeBullets(s, this.bullets);
            flags |= UpdateExtFlags.Bullets;
        }

        if (this.explosions.length) {
            serializeExplosions(s, this.explosions);

            flags |= UpdateExtFlags.Explosions;
        }

        if (this.emotes.length) {
            serializeEmotes(s, this.emotes);

            flags |= UpdateExtFlags.Emotes;
        }

        if (this.planes.length) {
            serializePlanes(s, this.planes);

            flags |= UpdateExtFlags.Planes;
        }

        if (this.airstrikeZones.length) {
            serializeAirstrikeZones(s, this.airstrikeZones);
            flags |= UpdateExtFlags.AirstrikeZones;
        }

        if (this.mapIndicators.length) {
            serializeMapIndicators(s, this.mapIndicators);
            flags |= UpdateExtFlags.MapIndicators;
        }

        if (this.killLeaderDirty) {
            s.writeUint16(this.killLeaderId);
            s.writeUint8(this.killLeaderKills);
            flags |= UpdateExtFlags.KillLeader;
        }

        s.writeUint8(this.ack);
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

        if ((flags & UpdateExtFlags.DeletedObjects) != 0) {
            this.delObjIds = s.readArray(16, () => {
                return s.readUint16();
            });
        }

        if ((flags & UpdateExtFlags.FullObjects) != 0) {
            this.fullObjects = deserializeFullObjects(s);
        }

        this.partObjects = deserializePartObjects(s, objectCreator);

        if ((flags & UpdateExtFlags.ActivePlayerId) != 0) {
            this.activePlayerId = s.readUint16();
            this.activePlayerIdDirty = true;
        }

        const activePlayerData = {} as LocalDataWithDirty;
        deserializeActivePlayer(s, activePlayerData);
        this.activePlayerData = activePlayerData;

        if ((flags & UpdateExtFlags.Gas) != 0) {
            const gasData = {} as GasData;
            deserializeGasData(s, gasData);
            this.gasData = gasData;
            this.gasDirty = true;
        }

        if ((flags & UpdateExtFlags.GasCircle) != 0) {
            this.gasT = s.readFloat(0, 1, 16);
            this.gasTDirty = true;
        }

        if ((flags & UpdateExtFlags.PlayerInfos) != 0) {
            this.playerInfos = s.readArray(8, () => {
                const x = {} as PlayerInfo;
                deserializePlayerInfo(s, x);
                return x;
            });
        }

        if ((flags & UpdateExtFlags.DeletePlayerIds) != 0) {
            this.deletedPlayerIds = s.readArray(8, () => {
                return s.readUint16();
            });
        }

        if ((flags & UpdateExtFlags.PlayerStatus) != 0) {
            this.playerStatus = deserializePlayerStatus(s);
            this.playerStatusDirty = true;
        }

        if ((flags & UpdateExtFlags.GroupStatus) != 0) {
            this.groupStatus = deserializeGroupStatus(s);
            this.groupStatusDirty = true;
        }

        if ((flags & UpdateExtFlags.Bullets) != 0) {
            this.bullets = deserializeBullets(s);
        }

        if ((flags & UpdateExtFlags.Explosions) != 0) {
            this.explosions = deserializeExplosions(s);
        }

        if ((flags & UpdateExtFlags.Emotes) != 0) {
            this.emotes = deserializeEmotes(s);
        }

        if ((flags & UpdateExtFlags.Planes) != 0) {
            this.planes = deserializePlanes(s);
        }

        if ((flags & UpdateExtFlags.AirstrikeZones) != 0) {
            this.airstrikeZones = deserializeAirstrikeZones(s);
        }

        if ((flags & UpdateExtFlags.MapIndicators) != 0) {
            this.mapIndicators = deserializeMapIndicators(s);
        }

        if ((flags & UpdateExtFlags.KillLeader) != 0) {
            this.killLeaderId = s.readUint16();
            this.killLeaderKills = s.readUint8();
            this.killLeaderDirty = true;
        }
        this.ack = s.readUint8();
    }
}

export function getPlayerStatusUpdateRate(factionMode: boolean) {
    if (factionMode) {
        return 0.5;
    }
    return 0.25;
}

export interface Bullet {
    playerId: number;
    startPos: Vec2;
    pos: Vec2;
    dir: Vec2;
    bulletType: string;
    layer: number;
    varianceT: number;
    distAdjIdx: number;
    clipDistance: boolean;
    distance: number;
    shotFx: boolean;
    shotSourceType: string;
    shotOffhand: boolean;
    lastShot: boolean;
    reflectCount: number;
    reflectObjId: number;
    hasSpecialFx: boolean;
    shotAlt: boolean;
    splinter: boolean;
    trailSaturated: boolean;
    apRounds: boolean;
    trailSmall: boolean;
    trailThick: boolean;
}

export interface Explosion {
    pos: Vec2;
    type: string;
    layer: number;
}

export interface Emote {
    playerId: number;
    type: string;
    itemType: string;
    isPing: boolean;
    pos?: Vec2;
}

export interface Airstrike {
    pos: Vec2;
    duration: number;
    rad: number;
}

export interface Plane {
    planeDir: Vec2;
    pos: Vec2;
    actionComplete: boolean;
    action: number;
    id: number;
}

export interface MapIndicator {
    id: number;
    dead: boolean;
    equipped: boolean;
    type: string;
    pos: Vec2;
}

export interface Action {
    type: Action;
    seq: number;
    seqOld: number;
    item: string;
    skin: string;
    targetId: number;
    time: number;
    duration: number;
    throttleCount: number;
    throttleTicker: number;
}

export interface LocalData {
    health: number;
    zoom: number;
    boost: number;
    scope: string;
    curWeapIdx: number;
    inventory: Record<string, number>;
    weapons: Array<{
        type: string;
        ammo: number;
    }>;
    spectatorCount: number;
}

export interface LocalDataWithDirty extends LocalData {
    healthDirty: boolean;
    boostDirty: boolean;
    zoomDirty: boolean;
    actionDirty: boolean;
    action: {
        time: number;
        duration: number;
        targetId: number;
    };
    inventoryDirty: boolean;
    weapsDirty: boolean;
    spectatorCountDirty: boolean;
}

// the non-optional properties are used by both server and client
export interface PlayerStatus {
    playerId?: number;
    pos: Vec2;
    posTarget?: Vec2;
    posDelta?: number;
    health?: number;
    posInterp?: number;
    visible: boolean;
    dead: boolean;
    downed: boolean;
    disconnected?: boolean;
    role: string;
    timeSinceUpdate?: number;
    timeSinceVisible?: number;
    minimapAlpha?: number;
    minimapVisible?: boolean;
    hasData: boolean;
}

export interface GroupStatus {
    health: number;
    disconnected: boolean;
}
