import type { BitStream } from "../../../shared/net/net.ts";
import { type ObjectData, type ObjectsPartialData, ObjectType } from "../../../shared/net/objectSerializeFns.ts";
import { assert } from "../../../shared/utils/util.ts";
import { errorLogManager } from "../errorLogs.ts";
import type { Ctx } from "../game.ts";

import type { AbstractObject } from "./player.ts";

type C<T extends AbstractObject> = new() => T;

export class Pool<T extends AbstractObject> {
    m_pool: T[] = [];
    m_freeList: T[] = [];
    m_activeCount = 0;
    m_creator: {
        type: C<T>;
    };

    constructor(classFn: C<T>) {
        this.m_creator = {
            type: classFn,
        };
        assert(classFn !== undefined);
    }

    m_alloc() {
        let obj = this.m_freeList.pop();
        if (!obj) {
            obj = new this.m_creator.type();
        }
        obj.active = true;
        obj.__poolIdx = this.m_pool.length;
        this.m_pool.push(obj);
        obj.m_init();
        this.m_activeCount++;
        return obj;
    }

    m_free(obj: T) {
        obj.m_free();
        obj.active = false;
        this.m_activeCount--;

        const idx = obj.__poolIdx;
        if (idx !== undefined && idx !== -1) {
            const last = this.m_pool.pop()!;
            if (last !== obj) {
                this.m_pool[idx] = last;
                last.__poolIdx = idx;
            }
            obj.__poolIdx = -1;
        }
        this.m_freeList.push(obj);

        if (
            this.m_freeList.length > 128 &&
            this.m_activeCount < this.m_freeList.length / 2
        ) {
            this.m_freeList.length = Math.floor(this.m_freeList.length / 2);
        }
    }

    m_getPool() {
        return this.m_pool;
    }

    m_getTotalSize() {
        return this.m_pool.length + this.m_freeList.length;
    }
}

export class Creator {
    m_idToObj: Record<number, AbstractObject> = {};
    m_types: Record<string, Pool<AbstractObject>> = {};
    m_seenCount = 0;

    m_registerType(type: string, pool: Pool<AbstractObject>) {
        this.m_types[type] = pool;
    }

    m_getObjById(id: number) {
        return this.m_idToObj[id];
    }

    m_getTypeById(id: number, s: BitStream) {
        const obj = this.m_getObjById(id);
        if (!obj) {
            const err = {
                id,
                ids: Object.keys(this.m_idToObj),
                stream: [...s.view.view],
            };
            errorLogManager.logError("getTypeById", err);
            errorLogManager.storeGeneric("objectPoolErr", "getTypeById");
            return ObjectType.Invalid;
        }
        return obj.__type;
    }

    m_updateObjFull<Type extends ObjectType>(
        type: Type,
        id: number,
        data: ObjectData<Type>,
        ctx: Ctx,
    ) {
        let obj = this.m_getObjById(id);
        let isNew = false;
        if (obj === undefined) {
            obj = this.m_types[type].m_alloc();
            obj.__id = id;
            obj.__type = type;
            this.m_idToObj[id] = obj;
            this.m_seenCount++;
            isNew = true;
        }
        obj.m_updateData(data, true, isNew, ctx);
        return obj;
    }

    m_updateObjPart(id: number, data: ObjectsPartialData[ObjectType], ctx: Ctx) {
        const obj = this.m_getObjById(id);
        if (obj) {
            obj.m_updateData(data, false, false, ctx);
        } else {
            errorLogManager.storeGeneric("objectPoolErr", "updateObjPart");
            console.error("updateObjPart, missing object", id);
        }
    }

    m_deleteObj(id: number) {
        const obj = this.m_getObjById(id);
        if (obj === undefined) {
            console.error("deleteObj, missing object", id);
            errorLogManager.storeGeneric("objectPoolErr", "deleteObj");
        } else {
            this.m_types[obj.__type].m_free(obj);
            delete this.m_idToObj[id];
        }
    }
}
