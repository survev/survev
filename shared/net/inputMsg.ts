import { v2 } from "../utils/v2";
import { type AbstractMsg, type BitStream, Constants } from "./net";

export class InputMsg implements AbstractMsg {
    seq = 0;
    moveLeft = false;
    moveRight = false;
    moveUp = false;
    moveDown = false;
    shootStart = false;
    shootHold = false;
    portrait = false;
    touchMoveActive = false;
    touchMoveDir = v2.create(1, 0);
    touchMoveLen = 255;
    toMouseDir = v2.create(1, 0);
    toMouseLen = 0;
    inputs: number[] = [];
    useItem = "";

    addInput(input: number) {
        if (this.inputs.length < 7 && !this.inputs.includes(input)) {
            this.inputs.push(input);
        }
    }

    serialize(s: BitStream) {
        s.writeUint8(this.seq);
        s.writeBoolean(this.moveLeft);
        s.writeBoolean(this.moveRight);
        s.writeBoolean(this.moveUp);
        s.writeBoolean(this.moveDown);

        s.writeBoolean(this.shootStart);
        s.writeBoolean(this.shootHold);

        s.writeBoolean(this.portrait);
        s.writeBoolean(this.touchMoveActive);
        if (this.touchMoveActive) {
            s.writeUnitVec(this.touchMoveDir, 8);
            s.writeUint8(this.touchMoveLen);
        }
        s.writeUnitVec(this.toMouseDir, 10);
        s.writeFloat(this.toMouseLen, 0, Constants.MouseMaxDist, 8);

        s.writeArray(this.inputs, 4, (i) => {
            s.writeUint8(i);
        });

        s.writeGameType(this.useItem);
    }

    deserialize(s: BitStream) {
        this.seq = s.readUint8();
        this.moveLeft = s.readBoolean();
        this.moveRight = s.readBoolean();
        this.moveUp = s.readBoolean();
        this.moveDown = s.readBoolean();

        this.shootStart = s.readBoolean();
        this.shootHold = s.readBoolean();

        this.portrait = s.readBoolean();
        this.touchMoveActive = s.readBoolean();
        if (this.touchMoveActive) {
            this.touchMoveDir = s.readUnitVec(8);
            this.touchMoveLen = s.readUint8();
        }
        this.toMouseDir = s.readUnitVec(10);
        this.toMouseLen = s.readFloat(0, Constants.MouseMaxDist, 8);

        this.inputs = s.readArray(4, () => {
            return s.readUint8();
        });

        this.useItem = s.readGameType();
    }
}
