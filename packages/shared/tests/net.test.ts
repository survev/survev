import * as net from "@survev/lib/net";
import { ObjectType } from "@survev/lib/net/objectSerializeFns";
import { beforeEach, expect, test } from "vitest";
import { util } from "../../shared/utils/util";
import { v2 } from "../../shared/utils/v2";
import { Main } from "../src/defs/maps/baseDefs";
import { GameConfig, GasMode } from "../src/gameConfig";

const stream = new net.MsgStream(new ArrayBuffer(1 << 16));

beforeEach(() => {
    // reset the buff
    new Uint8Array(stream.arrayBuf).fill(0);
    stream.stream.byteIndex = 0;
});

function randomPos() {
    return util.randomPointInAabb({
        min: v2.create(0, 0),
        max: v2.create(1024, 1024),
    });
}

test("Map Msg", () => {
    // input msg
    const inMsg = new net.MapMsg();

    inMsg.mapName = "main";
    inMsg.seed = 1312;
    inMsg.width = 512;
    inMsg.height = 512;
    inMsg.shoreInset = 64;
    inMsg.grassInset = 64;

    inMsg.rivers = Array.from({ length: 5 }, () => {
        return {
            width: util.randomInt(4, 16),
            points: Array.from({ length: 5 }, randomPos),
            looped: Math.random() < 0.5,
        };
    });

    inMsg.places = [...Main.mapGen.places];

    inMsg.objects = Array.from({ length: 1024 }, () => {
        return {
            type: "crate_01",
            pos: randomPos(),
            ori: util.randomInt(0, 3),
            scale: util.random(
                net.Constants.MapObjectMinScale,
                net.Constants.MapObjectMaxScale,
            ),
        };
    });

    inMsg.groundPatches = Array.from({ length: 100 }, () => {
        return {
            color: util.randomInt(0, 1 << 24),
            roughness: Math.random(),
            offsetDist: Math.random(),
            order: util.randomInt(0, (1 << 7) - 1),
            useAsMapShape: false,
            min: randomPos(),
            max: randomPos(),
        };
    });

    stream.serializeMsg(net.MsgType.Map, inMsg);

    stream.stream.index = 0;
    expect(stream.deserializeMsgType()).toBe(net.MsgType.Map);

    const outMsg = new net.MapMsg();
    outMsg.deserialize(stream.getStream());

    expect(outMsg).toMatchObject({
        mapName: inMsg.mapName,
        seed: inMsg.seed,
        width: inMsg.width,
        height: inMsg.height,
        shoreInset: inMsg.shoreInset,
        grassInset: inMsg.shoreInset,
    });

    for (let i = 0; i < outMsg.rivers.length; i++) {
        const riverA = outMsg.rivers[i];
        const riverB = inMsg.rivers[i];

        expect(riverA.width).toBe(riverB.width);
        expect(riverA.looped).toBe(riverB.looped);

        for (let j = 0; j < riverA.points.length; j++) {
            const pA = riverA.points[j];
            const pB = riverB.points[j];
            expect(pA).toStrictEqual({
                x: expect.closeTo(pB.x, 1),
                y: expect.closeTo(pB.y, 1),
            });
        }
    }

    for (let i = 0; i < outMsg.places.length; i++) {
        const pA = outMsg.places[i];
        const pB = inMsg.places[i];

        expect(pA).toStrictEqual({
            name: pB.name,
            pos: {
                x: expect.closeTo(pB.pos.x, 1),
                y: expect.closeTo(pB.pos.y, 1),
            },
        });
    }

    for (let i = 0; i < outMsg.objects.length; i++) {
        const a = outMsg.objects[i];
        const b = inMsg.objects[i];

        expect(a).toStrictEqual({
            type: b.type,
            ori: b.ori,
            pos: {
                x: expect.closeTo(b.pos.x, 1),
                y: expect.closeTo(b.pos.y, 1),
            },
            scale: expect.closeTo(b.scale, 2),
        });
    }

    for (let i = 0; i < outMsg.groundPatches.length; i++) {
        const a = outMsg.groundPatches[i];
        const b = inMsg.groundPatches[i];

        expect(a).toStrictEqual({
            min: {
                x: expect.closeTo(b.min.x, 1),
                y: expect.closeTo(b.min.y, 1),
            },
            max: {
                x: expect.closeTo(b.max.x, 1),
                y: expect.closeTo(b.max.y, 1),
            },
            color: b.color,
            roughness: expect.closeTo(b.roughness, 5),
            offsetDist: expect.closeTo(b.offsetDist, 5),
            order: b.order,
            useAsMapShape: b.useAsMapShape,
        });
    }
});

test("Update Msg", () => {
    const inMsg = new net.UpdateMsg();

    inMsg.activePlayerData = {
        healthDirty: true,
        health: util.random(0, 100),
        boostDirty: true,
        boost: util.random(0, 100),
        zoomDirty: true,
        zoom: util.randomInt(10, 100),
        actionDirty: true,
        action: {
            time: util.random(0, net.Constants.ActionMaxDuration),
            duration: util.random(0, net.Constants.ActionMaxDuration),
            targetId: util.randomInt(10, 1 << 10),
        },
        inventoryDirty: true,
        inventory: Object.keys(GameConfig.bagSizes).reduce(
            (obj, key) => {
                obj[key] = util.randomInt(0, 255);
                return obj;
            },
            {} as Record<string, number>,
        ),
        scope: "1xscope",
        weapsDirty: true,
        weapons: Array.from({ length: GameConfig.WeaponSlot.Count }, () => {
            return {
                type: "m9",
                ammo: util.randomInt(0, 255),
            };
        }),
        curWeapIdx: 0,
        spectatorCountDirty: true,
        spectatorCount: util.randomInt(0, 255),
    };

    inMsg.gasDirty = true;
    inMsg.gasData = {
        mode: GasMode.Inactive,
        duration: util.random(0, 200),
        posOld: randomPos(),
        posNew: randomPos(),
        radOld: util.random(0, 200),
        radNew: util.random(0, 200),
    };

    inMsg.delObjIds = Array.from({ length: 300 }, () => util.randomInt(0, 500));

    // TODO: add more tests for UpdateMsg fields...

    stream.serializeMsg(net.MsgType.Update, inMsg);

    stream.stream.index = 0;
    expect(stream.deserializeMsgType()).toBe(net.MsgType.Update);

    const outMsg = new net.UpdateMsg();
    outMsg.deserialize(stream.getStream(), {
        m_getTypeById() {
            return ObjectType.Invalid;
        },
    });

    expect(outMsg.activePlayerData).toStrictEqual({
        ...inMsg.activePlayerData,
        action: {
            duration: expect.closeTo(inMsg.activePlayerData.action.duration, 1),
            time: expect.closeTo(inMsg.activePlayerData.action.time, 1),
            targetId: inMsg.activePlayerData.action.targetId,
        },
        health: expect.closeTo(inMsg.activePlayerData.health, 0),
        boost: expect.closeTo(inMsg.activePlayerData.boost, 0),
    });

    expect(outMsg.gasData).toStrictEqual({
        mode: inMsg.gasData.mode,
        duration: expect.closeTo(inMsg.gasData.duration),
        posOld: {
            x: expect.closeTo(inMsg.gasData.posOld.x, 1),
            y: expect.closeTo(inMsg.gasData.posOld.y, 1),
        },
        posNew: {
            x: expect.closeTo(inMsg.gasData.posNew.x, 1),
            y: expect.closeTo(inMsg.gasData.posNew.y, 1),
        },
        radOld: expect.closeTo(inMsg.gasData.radOld, 1),
        radNew: expect.closeTo(inMsg.gasData.radNew, 1),
    });

    expect(outMsg.delObjIds).toStrictEqual(inMsg.delObjIds);
});
