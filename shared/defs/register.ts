import { assert } from "../utils/util.ts";
import { RawGameObjectDefs } from "./gameObjectDefs.ts";
import { RawMapObjectDefs } from "./mapObjectDefs.ts";

class DefinitionRegister<T extends { type: string }> {
    readonly type: string;

    private _defs: Record<string, T>;

    /**
     * Map type strings to integers for more efficient serialization.
     */
    private _typeToId: Record<string, number> = {};
    private _idToType: Record<number, string> = {};
    private nextId = 0;
    private maxId: number;

    constructor(
        type: string,
        defs: Record<string, T>,
        typeBits: number,
    ) {
        this.type = type;
        this._defs = defs;
        this.maxId = 2 ** typeBits;
        this.addType("");

        const types = Object.keys(defs);
        assert(
            types.length <= this.maxId,
            `${type} contains ${types.length} types, max ${this.maxId}`,
        );
        for (let i = 0; i < types.length; i++) {
            this.addType(types[i]);
        }
    }

    addType(type: string) {
        assert(
            this._typeToId[type] === undefined,
            `Type ${type} has already been defined!`,
        );
        assert(this.nextId < this.maxId);
        this._typeToId[type] = this.nextId;
        this._idToType[this.nextId] = type;
        this.nextId++;
    }

    typeToId(type: string) {
        const id = this._typeToId[type];
        assert(id !== undefined, `Invalid type ${type}`);
        return id;
    }

    idToType(id: number) {
        const type = this._idToType[id];
        if (type === undefined) {
            console.error(
                "Invalid id given to idToType",
                id,
                "max",
                Object.keys(this._idToType).length,
            );
        }
        return type;
    }

    /**
     * Returns the definition associated with a type
     * Will throw an error if the definition doesn't exist
     *
     * Additionally, can have an optional parameter to filter the definition type (e.g. "gun")
     * And will throw if the definition is not of that type
     */
    typeToDef(type: string): T;
    typeToDef<D extends T["type"] = T["type"]>(type: string, defType: D): T & { type: D };
    typeToDef<D extends T["type"] = T["type"]>(type: string, defType?: D): T & { type: D } {
        if (!type) {
            throw new Error(`Received empty type, expected a ${this.type} type`);
        }
        const def = this._defs[type];
        if (!def) {
            throw new Error(`${type} is not a valid ${this.type} definition`);
        }
        if (defType) {
            if (def.type !== defType) {
                throw new Error(`${type} is not a valid ${defType} definition`);
            }
        }
        return def as T & { type: D };
    }

    /**
     * Like typeToDef but that doesn't throw and instead returns undefined for invalid types
     *
     * Use it for optional types (e.g. when the type string can be an empty string)
     */
    typeToDefSafe(type: string): T | undefined {
        return this._defs[type];
    }

    typeExists(type: string): boolean {
        return !!this._defs[type];
    }

    getAllTypes() {
        return Object.keys(this._defs);
    }
}

export const GameObjectDefs = new DefinitionRegister("Game", RawGameObjectDefs, 10);
export const MapObjectDefs = new DefinitionRegister("Map", RawMapObjectDefs, 12);
