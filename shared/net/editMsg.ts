import type { AbstractMsg, BitStream } from "./net.ts";

export class EditMsg implements AbstractMsg {
    zoomEnabled = false;
    zoom = 1;

    speedEnabled = false;
    speed = 0;

    gameSpeedEnabled = false;
    gameSpeed = 1;

    loadNewMap = false;
    newMapSeed = 0;

    spawnLootType = "";
    promoteToRole = false;
    promoteToRoleType = "";

    toggleLayer = false;

    noClip = false;
    teleportToPings = false;
    godMode = false;
    moveObjs = false;
    preventGameStart = false;

    serialize(s: BitStream) {
        s.writeBoolean(this.zoomEnabled);
        if (this.zoomEnabled) {
            s.writeUint8(this.zoom);
        }

        s.writeBoolean(this.speedEnabled);
        if (this.speedEnabled) {
            s.writeFloat32(this.speed);
        }

        s.writeBoolean(this.gameSpeedEnabled);
        if (this.gameSpeedEnabled) {
            s.writeFloat32(this.gameSpeed);
        }

        s.writeBoolean(this.loadNewMap);
        if (this.loadNewMap) {
            s.writeUint32(this.newMapSeed);
        }

        s.writeGameType(this.spawnLootType);
        s.writeBoolean(this.promoteToRole);
        if (this.promoteToRole) {
            s.writeGameType(this.promoteToRoleType);
        }
        s.writeBoolean(this.toggleLayer);

        s.writeBoolean(this.noClip);
        s.writeBoolean(this.teleportToPings);
        s.writeBoolean(this.godMode);
        s.writeBoolean(this.moveObjs);
        s.writeBoolean(this.preventGameStart);
    }

    deserialize(s: BitStream) {
        this.zoomEnabled = s.readBoolean();
        if (this.zoomEnabled) {
            this.zoom = s.readUint8();
        }

        this.speedEnabled = s.readBoolean();
        if (this.speedEnabled) {
            this.speed = s.readFloat32();
        }

        this.gameSpeedEnabled = s.readBoolean();
        if (this.gameSpeedEnabled) {
            this.gameSpeed = s.readFloat32();
        }

        this.loadNewMap = s.readBoolean();
        if (this.loadNewMap) {
            this.newMapSeed = s.readUint32();
        }

        this.spawnLootType = s.readGameType();
        this.promoteToRole = s.readBoolean();
        if (this.promoteToRole) {
            this.promoteToRoleType = s.readGameType();
        }
        this.toggleLayer = s.readBoolean();

        this.noClip = s.readBoolean();
        this.teleportToPings = s.readBoolean();
        this.godMode = s.readBoolean();
        this.moveObjs = s.readBoolean();
        this.preventGameStart = s.readBoolean();
    }
}
