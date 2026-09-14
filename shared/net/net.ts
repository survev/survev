import { assert } from "../utils/util.ts";
import { DropItemMsg } from "./clientMsgs/dropItemMsg.ts";
import { EditMsg } from "./clientMsgs/editMsg.ts";
import { EmoteMsg } from "./clientMsgs/emoteMsg.ts";
import { InputMsg } from "./clientMsgs/inputMsg.ts";
import { JoinMsg } from "./clientMsgs/joinMsg.ts";
import { PerkModeRoleSelectMsg } from "./clientMsgs/perkModeRoleSelectMsg.ts";
import { PointerInputMsg } from "./clientMsgs/pointerInputMsg.ts";
import { SpectateAction, SpectateMsg } from "./clientMsgs/spectateMsg.ts";
import { type AbstractMsg, Constants } from "./constants.ts";
import { AliveCountsMsg } from "./serverMsgs/aliveCountsMsg.ts";
import { GameOverMsg } from "./serverMsgs/gameOverMsg.ts";
import { JoinedMsg } from "./serverMsgs/joinedMsg.ts";
import { KillMsg } from "./serverMsgs/killMsg.ts";
import { MapMsg } from "./serverMsgs/mapMsg.ts";
import { PickupMsg, PickupMsgType } from "./serverMsgs/pickupMsg.ts";
import { PlayerStatsMsg } from "./serverMsgs/playerStatsMsg.ts";
import { RoleAnnouncementMsg } from "./serverMsgs/roleAnnouncementMsg.ts";
import { getPlayerStatusUpdateRate, UpdateMsg } from "./serverMsgs/updateMsg.ts";
import { UpdatePassMsg } from "./serverMsgs/updatePassMsg.ts";
import { BitStream } from "./stream.ts";

export { BitStream, Constants };

export enum ClientMsgType {
    None = 0,
    Join = 1, // JoinMsg should always be ID 1 to not break protocol version check with old clients!
    Input,
    PointerInput,
    Emote,
    DropItem,
    Spectate,
    PerkModeRoleSelect,
    Edit,
}
export type ValidClientMsgType = Exclude<ClientMsgType, ClientMsgType.None>;

const ClientMsgMap = {
    [ClientMsgType.Join]: JoinMsg,
    [ClientMsgType.Input]: InputMsg,
    [ClientMsgType.PointerInput]: PointerInputMsg,
    [ClientMsgType.Emote]: EmoteMsg,
    [ClientMsgType.DropItem]: DropItemMsg,
    [ClientMsgType.Spectate]: SpectateMsg,
    [ClientMsgType.PerkModeRoleSelect]: PerkModeRoleSelectMsg,
    [ClientMsgType.Edit]: EditMsg,
} satisfies Record<ValidClientMsgType, new() => AbstractMsg>;

export type ClientMsg = InstanceType<typeof ClientMsgMap[ValidClientMsgType]>;
export type ClientMsgTypeToMsg<T extends ValidClientMsgType> = InstanceType<typeof ClientMsgMap[T]>;

export {
    DropItemMsg,
    EditMsg,
    EmoteMsg,
    InputMsg,
    JoinMsg,
    PerkModeRoleSelectMsg,
    PointerInputMsg,
    SpectateAction,
    SpectateMsg,
};

export enum ServerMsgType {
    None = 0,
    Joined = 1,
    Map,
    Update,
    AliveCounts,
    Pickup,
    Kill,
    RoleAnnouncement,
    UpdatePass,
    PlayerStats,
    GameOver,
}
export type ValidServerMsgType = Exclude<ServerMsgType, ServerMsgType.None>;
const ServerMsgMap = {
    [ServerMsgType.Joined]: JoinedMsg,
    [ServerMsgType.Map]: MapMsg,
    [ServerMsgType.Update]: UpdateMsg,
    [ServerMsgType.AliveCounts]: AliveCountsMsg,
    [ServerMsgType.Pickup]: PickupMsg,
    [ServerMsgType.Kill]: KillMsg,
    [ServerMsgType.RoleAnnouncement]: RoleAnnouncementMsg,
    [ServerMsgType.UpdatePass]: UpdatePassMsg,
    [ServerMsgType.PlayerStats]: PlayerStatsMsg,
    [ServerMsgType.GameOver]: GameOverMsg,
} satisfies Record<ValidServerMsgType, new() => AbstractMsg>;

export type ServerMsg = InstanceType<typeof ServerMsgMap[ValidServerMsgType]>;
export type ServerMsgTypeToMsg<T extends ValidServerMsgType> = InstanceType<typeof ServerMsgMap[T]>;

export {
    AliveCountsMsg,
    GameOverMsg,
    getPlayerStatusUpdateRate,
    JoinedMsg,
    KillMsg,
    MapMsg,
    PickupMsg,
    PickupMsgType,
    PlayerStatsMsg,
    RoleAnnouncementMsg,
    UpdateMsg,
};

//
// MsgStream
//

export type DeserializedClientMsg = {
    [T in ValidClientMsgType]: {
        type: T;
        msg: ClientMsgTypeToMsg<T>;
    };
}[ValidClientMsgType];

export type DeserializedServerMsg = {
    [T in ValidServerMsgType]: {
        type: T;
        msg: ServerMsgTypeToMsg<T>;
    };
}[ValidServerMsgType];

export class MsgStream {
    stream: BitStream;
    arrayBuf: ArrayBuffer;

    constructor(buf: ArrayBuffer) {
        this.arrayBuf = buf;
        this.stream = new BitStream(buf);
    }

    getBuffer() {
        return new Uint8Array(this.arrayBuf, 0, this.stream.byteIndex);
    }

    getStream() {
        return this.stream;
    }

    serializeClientMsg<T extends ValidClientMsgType>(
        type: T,
        msg: ClientMsgTypeToMsg<T>,
    ) {
        assert(this.stream.index % 8 == 0);
        this.stream.writeUint8(type);
        msg.serialize(this.stream);
        this.stream.writeAlignToNextByte();
    }

    deserializeClientMsg(): { type: ClientMsgType.None; msg: undefined } | DeserializedClientMsg {
        if (this.stream.length - this.stream.byteIndex * 8 >= 1) {
            const type = this.stream.readUint8();
            assert(type in ClientMsgMap, `Received invalid msg with type ${type}`);
            const msg = new ClientMsgMap[type as ValidClientMsgType]();
            msg.deserialize(this.stream);
            return {
                type,
                msg,
            };
        }
        return {
            type: ClientMsgType.None,
            msg: undefined,
        };
    }

    serializeServerMsg<T extends ValidServerMsgType>(
        type: T,
        msg: ServerMsgTypeToMsg<T>,
    ) {
        assert(this.stream.index % 8 == 0);
        this.stream.writeUint8(type);
        msg.serialize(this.stream);
        this.stream.writeAlignToNextByte();
    }

    deserializeServerMsg(): { type: ServerMsgType.None; msg: undefined } | DeserializedServerMsg {
        if (this.stream.length - this.stream.byteIndex * 8 >= 1) {
            const type = this.stream.readUint8();
            assert(type in ServerMsgMap, `Received invalid msg with type ${type}`);
            const msg = new ServerMsgMap[type as ValidServerMsgType]();
            msg.deserialize(this.stream);
            return {
                type,
                msg,
            };
        }
        return {
            type: ServerMsgType.None,
            msg: undefined,
        };
    }
}
