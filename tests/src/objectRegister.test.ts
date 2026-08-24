import { describe, expect, test } from "vitest";
import type { Grid } from "../../server/src/game/grid.ts";
import { type GameObject, ObjectRegister } from "../../server/src/game/objects/gameObject.ts";

describe("ObjectRegister dirty queue", () => {
    test("deduplicates dirty objects and lets full updates override partial updates", () => {
        const register = new ObjectRegister({} as Grid<GameObject>);
        const serialized = { full: 0, partial: 0 };
        const object = {
            __id: 42,
            serializeFull: () => serialized.full++,
            serializePartial: () => serialized.partial++,
        } as unknown as GameObject;
        register.idToObj[object.__id] = object;

        register.markDirty(object, false);
        register.markDirty(object, false);
        register.markDirty(object, true);

        const routed: Array<{ object: GameObject; full: boolean }> = [];
        register.forEachDirtyObject((dirtyObject, full) => {
            routed.push({ object: dirtyObject, full });
        });
        register.serializeObjs();

        expect(routed).toEqual([{ object, full: true }]);
        expect(serialized).toEqual({ full: 1, partial: 0 });

        register.flush();
        expect(register.isDirty(object)).toBe(false);
        expect(Array.from(dirtyObjects(register))).toEqual([]);
    });

    test("can be cleared and marked again before the queue is flushed", () => {
        const register = new ObjectRegister({} as Grid<GameObject>);
        const object = { __id: 7 } as GameObject;
        register.idToObj[object.__id] = object;

        register.markDirty(object, true);
        register.clearDirty(object);
        expect(Array.from(dirtyObjects(register))).toEqual([]);

        register.markDirty(object, false);
        expect(Array.from(dirtyObjects(register))).toEqual([{ object, full: false }]);
    });
});

function* dirtyObjects(register: ObjectRegister) {
    const objects: Array<{ object: GameObject; full: boolean }> = [];
    register.forEachDirtyObject((object, full) => objects.push({ object, full }));
    yield* objects;
}
