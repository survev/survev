import type { AbstractMsg } from "../constants.ts";
import type { BitStream } from "../stream.ts";

export enum PickupMsgType {
    Full,
    AlreadyOwned,
    AlreadyEquipped,
    BetterItemEquipped,
    Success,
    GunCannotFire,
    MaxPerks,
}

export class PickupMsg implements AbstractMsg {
    type: PickupMsgType = 0;
    item = "";
    count = 0;

    serialize(s: BitStream) {
        /* STRIP_FROM_PROD_CLIENT:START */
        s.writeUint8(this.type);
        s.writeGameType(this.item);
        s.writeUint8(this.count);
        /* STRIP_FROM_PROD_CLIENT:END */
    }

    deserialize(s: BitStream) {
        this.type = s.readUint8();
        this.item = s.readGameType();
        this.count = s.readUint8();
    }
}
