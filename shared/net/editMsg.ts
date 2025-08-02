import type { AbstractMsg, BitStream } from "./net";

export class EditMsg implements AbstractMsg {
    overrideZoom = false;
    zoom = 1;
    speed = -1;
    layer = 0;
    cull = false;
    loadNewMap = false;
    newMapSeed = 0;
    printLootStats = false;
    spawnLootType = "";
    promoteToRoleType = "";
    spectatorMode = false;
    godMode = false;

    serialize(s: BitStream) {
        s.writeBoolean(this.overrideZoom);
        s.writeBoolean(this.cull);
        s.writeFloat32(this.zoom);
        s.writeFloat32(this.speed);
        s.writeBits(this.layer, 2);

        s.writeBoolean(this.printLootStats);

        s.writeBoolean(this.loadNewMap);
        s.writeUint32(this.newMapSeed);

        s.writeGameType(this.spawnLootType);
        s.writeGameType(this.promoteToRoleType);
        s.writeBoolean(this.spectatorMode);
        s.writeBoolean(this.godMode);
    }

    deserialize(s: BitStream) {
        this.overrideZoom = s.readBoolean();
        this.cull = s.readBoolean();
        this.zoom = s.readFloat32();
        this.speed = s.readFloat32();
        this.layer = s.readBits(2);

        this.printLootStats = s.readBoolean();

        this.loadNewMap = s.readBoolean();
        this.newMapSeed = s.readUint32();

        this.spawnLootType = s.readGameType();
        this.promoteToRoleType = s.readGameType();
        this.spectatorMode = s.readBoolean();
        this.godMode = s.readBoolean();
    }
}
