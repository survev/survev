import type { MapDef } from "../defs/mapDefs";
import type { MapRiverData } from "../utils/terrainGen";
import type { Vec2 } from "../utils/v2";
import { type AbstractMsg, type BitStream, Constants } from "./net";

function serializeMapRiver(s: BitStream, data: MapRiverData) {
    s.writeUint8(data.width);
    s.writeUint8(data.looped as unknown as number);

    s.writeArray(data.points, 8, (pos) => {
        s.writeMapPos(pos);
    });
}

function deserializeMapRiver(s: BitStream): MapRiverData {
    return {
        width: s.readUint8(),
        looped: !!s.readUint8(),
        points: s.readArray(8, () => s.readMapPos()),
    };
}

type Place = MapDef["mapGen"]["places"][number];

function serializeMapPlace(s: BitStream, place: Place) {
    s.writeString(place.name);
    s.writeVec(place.pos, 0, 0, 1, 1, 16);
}

function deserializeMapPlaces(s: BitStream): Place {
    return {
        name: s.readString(),
        pos: s.readVec(0, 0, 1, 1, 16),
    };
}

export interface GroundPatch {
    color: number;
    roughness: number;
    offsetDist: number;
    order?: number;
    useAsMapShape?: boolean;
    min: Vec2;
    max: Vec2;
}

function serializeMapGroundPatch(s: BitStream, patch: GroundPatch) {
    s.writeMapPos(patch.min);
    s.writeMapPos(patch.max);
    s.writeUint32(patch.color);
    s.writeFloat32(patch.roughness);
    s.writeFloat32(patch.offsetDist);
    s.writeBits(patch.order!, 7);
    s.writeBoolean(patch.useAsMapShape!);
}

function deserializeMapGroundPatch(s: BitStream): GroundPatch {
    return {
        min: s.readMapPos(),
        max: s.readMapPos(),
        color: s.readUint32(),
        roughness: s.readFloat32(),
        offsetDist: s.readFloat32(),
        order: s.readBits(7),
        useAsMapShape: s.readBoolean(),
    };
}

interface MapObj {
    pos: Vec2;
    scale: number;
    type: string;
    ori: number;
}

function serializeMapObj(s: BitStream, obj: MapObj) {
    s.writeMapPos(obj.pos);
    s.writeFloat(obj.scale, Constants.MapObjectMinScale, Constants.MapObjectMaxScale, 8);
    s.writeMapType(obj.type);
    s.writeBits(obj.ori, 2);

    s.writeAlignToNextByte();
}

function deserializeMapObj(s: BitStream): MapObj {
    const obj: MapObj = {
        pos: s.readMapPos(),
        scale: s.readFloat(Constants.MapObjectMinScale, Constants.MapObjectMaxScale, 8),
        type: s.readMapType(),
        ori: s.readBits(2),
    };

    s.readAlignToNextByte();
    return obj;
}

export class MapMsg implements AbstractMsg {
    mapName = "";
    seed = 0;
    width = 0;
    height = 0;
    shoreInset = 0;
    grassInset = 0;
    rivers: MapRiverData[] = [];
    places: Place[] = [];
    objects: MapObj[] = [];
    groundPatches: GroundPatch[] = [];

    serialize(s: BitStream) {
        s.writeString(this.mapName, Constants.MapNameMaxLen);
        s.writeUint32(this.seed);
        s.writeUint16(this.width);
        s.writeUint16(this.height);
        s.writeUint16(this.shoreInset);
        s.writeUint16(this.grassInset);

        s.writeArray(this.rivers, 8, (river) => {
            serializeMapRiver(s, river);
        });

        s.writeArray(this.places, 8, (place) => {
            serializeMapPlace(s, place);
        });

        s.writeArray(this.objects, 16, (obj) => {
            serializeMapObj(s, obj);
        });

        s.writeArray(this.groundPatches, 8, (obj) => {
            serializeMapGroundPatch(s, obj);
        });
    }

    deserialize(s: BitStream) {
        this.mapName = s.readString(Constants.MapNameMaxLen);
        this.seed = s.readUint32();
        this.width = s.readUint16();
        this.height = s.readUint16();
        this.shoreInset = s.readUint16();
        this.grassInset = s.readUint16();

        this.rivers = s.readArray(8, () => {
            return deserializeMapRiver(s);
        });

        this.places = s.readArray(8, () => {
            return deserializeMapPlaces(s);
        });

        this.objects = s.readArray(16, () => {
            return deserializeMapObj(s);
        });

        this.groundPatches = s.readArray(8, () => {
            return deserializeMapGroundPatch(s);
        });
    }
}
