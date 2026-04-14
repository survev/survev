import { v2 } from "../utils/v2";
import { BitSizes, type BitStream, Constants } from "./net";
import {
    ObjectSerializeFns,
    type ObjectsFullData,
    type ObjectsPartialData,
    type ObjectType,
} from "./objectSerializeFns";
import type {
    Airstrike,
    Bullet,
    Emote,
    Explosion,
    MapIndicator,
    Plane,
} from "./updateMsg";

export function serializeFullObjects(
    s: BitStream,
    fullObjects: Array<
        ObjectsFullData[ObjectType] &
            ObjectsPartialData[ObjectType] & {
                __id: number;
                __type: ObjectType;
                partialStream: BitStream;
                fullStream: BitStream;
            }
    >,
) {
    s.writeArray(fullObjects, 16, (obj) => {
        s.writeUint8(obj.__type);
        s.writeBytes(obj.partialStream, 0, obj.partialStream.byteIndex);
        s.writeBytes(obj.fullStream, 0, obj.fullStream.byteIndex);
    });
}

export function deserializeFullObjects(s: BitStream): Array<
    ObjectsFullData[ObjectType] &
        ObjectsPartialData[ObjectType] & {
            __id: number;
            __type: ObjectType;
            partialStream: BitStream;
            fullStream: BitStream;
        }
> {
    return s.readArray(16, () => {
        const data = {} as ReturnType<typeof deserializeFullObjects>[number];
        data.__type = s.readUint8();
        data.__id = s.readUint16();
        ObjectSerializeFns[data.__type].deserializePart(s, data as any);
        s.readAlignToNextByte();
        ObjectSerializeFns[data.__type].deserializeFull(s, data as any);
        s.readAlignToNextByte();
        return data;
    });
}

export function serializePartObjects(
    s: BitStream,
    partObjects: Array<
        ObjectsPartialData[ObjectType] & {
            __id: number;
            __type: ObjectType;
            partialStream: BitStream;
        }
    >,
) {
    s.writeArray(partObjects, 16, (obj) => {
        s.writeBytes(obj.partialStream, 0, obj.partialStream.byteIndex);
    });
}

export function deserializePartObjects(
    s: BitStream,
    objectCreator: { m_getTypeById: (id: number, s: BitStream) => ObjectType },
): Array<
    ObjectsPartialData[ObjectType] & {
        __id: number;
        __type: ObjectType;
        partialStream: BitStream;
    }
> {
    return s.readArray(16, () => {
        const data = {} as ReturnType<typeof deserializePartObjects>[number];
        data.__id = s.readUint16();
        const type = objectCreator.m_getTypeById(data.__id, s);
        ObjectSerializeFns[type].deserializePart(s, data as any);
        s.readAlignToNextByte();
        return data;
    });
}

export function serializeBullets(s: BitStream, bullets: Bullet[]) {
    s.writeArray(bullets, 8, (bullet) => {
        s.writeUint16(bullet.playerId);
        s.writeMapPos(bullet.startPos);
        s.writeUnitVec(bullet.dir, 8);
        s.writeGameType(bullet.bulletType);
        s.writeBits(bullet.layer, 2);
        s.writeFloat(bullet.varianceT, 0, 1, 4);
        s.writeBits(bullet.distAdjIdx, 4);
        s.writeBoolean(bullet.clipDistance);
        if (bullet.clipDistance) {
            s.writeFloat(bullet.distance, 0, Constants.MaxPosition, 16);
        }
        s.writeBoolean(bullet.shotFx);
        if (bullet.shotFx) {
            s.writeGameType(bullet.shotSourceType);
            s.writeBoolean(bullet.shotOffhand);
            s.writeBoolean(bullet.lastShot);
        }
        s.writeBoolean(bullet.reflectCount > 0);
        if (bullet.reflectCount > 0) {
            s.writeBits(bullet.reflectCount, 2);
            s.writeUint16(bullet.reflectObjId);
        }
        s.writeBoolean(bullet.hasSpecialFx);
        if (bullet.hasSpecialFx) {
            s.writeBoolean(bullet.shotAlt);
            s.writeBoolean(bullet.splinter);
            s.writeBoolean(bullet.trailSaturated);
            s.writeBoolean(bullet.apRounds);
            s.writeBoolean(bullet.trailSmall);
            s.writeBoolean(bullet.trailThick);
        }
    });
    s.writeAlignToNextByte();
}

export function deserializeBullets(s: BitStream): Bullet[] {
    const bullets = s.readArray(8, () => {
        const bullet = {} as Bullet;
        bullet.playerId = s.readUint16();
        bullet.pos = s.readMapPos();
        bullet.dir = s.readUnitVec(8);
        bullet.bulletType = s.readGameType();
        bullet.layer = s.readBits(2);
        bullet.varianceT = s.readFloat(0, 1, 4);
        bullet.distAdjIdx = s.readBits(4);
        bullet.clipDistance = s.readBoolean();
        if (bullet.clipDistance) {
            bullet.distance = s.readFloat(0, Constants.MaxPosition, 16);
        }
        bullet.shotFx = s.readBoolean();
        if (bullet.shotFx) {
            bullet.shotSourceType = s.readGameType();
            bullet.shotOffhand = s.readBoolean();
            bullet.lastShot = s.readBoolean();
        }
        bullet.reflectCount = 0;
        bullet.reflectObjId = 0;
        if (s.readBoolean()) {
            bullet.reflectCount = s.readBits(2);
            bullet.reflectObjId = s.readUint16();
        }
        bullet.hasSpecialFx = s.readBoolean();
        if (bullet.hasSpecialFx) {
            bullet.shotAlt = s.readBoolean();
            bullet.splinter = s.readBoolean();
            bullet.trailSaturated = s.readBoolean();
            bullet.apRounds = s.readBoolean();
            bullet.trailSmall = s.readBoolean();
            bullet.trailThick = s.readBoolean();
        }
        return bullet;
    });
    s.readAlignToNextByte();
    return bullets;
}

export function serializeExplosions(s: BitStream, explosions: Explosion[]) {
    s.writeArray(explosions, 8, (explosion) => {
        s.writeMapPos(explosion.pos);
        s.writeGameType(explosion.type);
        s.writeBits(explosion.layer, 2);
        s.writeAlignToNextByte();
    });
}

export function deserializeExplosions(s: BitStream): Explosion[] {
    return s.readArray(8, () => {
        const explosion = {} as Explosion;
        explosion.pos = s.readMapPos();
        explosion.type = s.readGameType();
        explosion.layer = s.readBits(2);
        s.readAlignToNextByte();
        return explosion;
    });
}

export function serializeEmotes(s: BitStream, emotes: Emote[]) {
    s.writeArray(emotes, 8, (emote) => {
        s.writeUint16(emote.playerId);
        s.writeGameType(emote.type);
        s.writeGameType(emote.itemType);
        s.writeBoolean(emote.isPing);
        if (emote.isPing) {
            s.writeMapPos(emote.pos!);
        }
        s.writeAlignToNextByte();
    });
}

export function deserializeEmotes(s: BitStream): Emote[] {
    return s.readArray(8, () => {
        const emote = {} as Emote;
        emote.playerId = s.readUint16();
        emote.type = s.readGameType();
        emote.itemType = s.readGameType();
        emote.isPing = s.readBoolean();
        if (emote.isPing) {
            emote.pos = s.readMapPos();
        }
        s.readAlignToNextByte();
        return emote;
    });
}

export function serializePlanes(s: BitStream, planes: Plane[]) {
    s.writeArray(planes, 8, (plane) => {
        s.writeUint8(plane.id);
        s.writeVec(v2.add(plane.pos, v2.create(512, 512)), 0, 0, 2048, 2048, 10);
        s.writeUnitVec(plane.planeDir, 8);
        s.writeBoolean(plane.actionComplete);
        s.writeBits(plane.action, 3);
    });
}

export function deserializePlanes(s: BitStream): Plane[] {
    return s.readArray(8, () => {
        const plane = {} as Plane;
        plane.id = s.readUint8();
        const pos = s.readVec(0, 0, 2048, 2048, 10);
        plane.pos = v2.create(pos.x - 512, pos.y - 512);
        plane.planeDir = s.readUnitVec(8);
        plane.actionComplete = s.readBoolean();
        plane.action = s.readBits(3);
        return plane;
    });
}

export function serializeAirstrikeZones(s: BitStream, airstrikeZones: Airstrike[]) {
    s.writeArray(airstrikeZones, 8, (zone) => {
        s.writeMapPos(zone.pos, 12);
        s.writeFloat(zone.rad, 0, Constants.AirstrikeZoneMaxRad, 8);
        s.writeFloat(zone.duration, 0, Constants.AirstrikeZoneMaxDuration, 8);
    });
    s.writeAlignToNextByte();
}

export function deserializeAirstrikeZones(s: BitStream): Airstrike[] {
    const zones = s.readArray(8, () => {
        const zone = {} as Airstrike;
        zone.pos = s.readMapPos(12);
        zone.rad = s.readFloat(0, Constants.AirstrikeZoneMaxRad, 8);
        zone.duration = s.readFloat(0, Constants.AirstrikeZoneMaxDuration, 8);
        return zone;
    });
    s.readAlignToNextByte();
    return zones;
}

export function serializeMapIndicators(s: BitStream, mapIndicators: MapIndicator[]) {
    s.writeArray(mapIndicators, BitSizes.MapIndicators, (indicator) => {
        s.writeBits(indicator.id, BitSizes.MapIndicators);
        s.writeBoolean(indicator.dead);
        s.writeBoolean(indicator.equipped);
        s.writeGameType(indicator.type);
        s.writeMapPos(indicator.pos);
    });
    s.writeAlignToNextByte();
}

export function deserializeMapIndicators(s: BitStream): MapIndicator[] {
    const indicators = s.readArray(BitSizes.MapIndicators, () => {
        const indicator = {} as MapIndicator;
        indicator.id = s.readBits(BitSizes.MapIndicators);
        indicator.dead = s.readBoolean();
        indicator.equipped = s.readBoolean();
        indicator.type = s.readGameType();
        indicator.pos = s.readMapPos();
        return indicator;
    });
    s.readAlignToNextByte();
    return indicators;
}
