/**
 * Class to manage entity ID's
 */
export class IDAllocator {
    readonly maxId: number;
    private _currentId = 1;
    /**
     * A list of free ID's to be used once the main ID's run out
     */
    private readonly _freeList: number[] = [];

    constructor(bits: number) {
        this.maxId = 2 ** bits;
    }

    /**
     * Gets the next available ID
     * If the current ID is higher than the max ID it will start using the free list ID's
     * @throws {Error} If the there's no ID's left
     */
    getNextId(): number {
        let id: number | undefined = this._currentId;
        if (id > this.maxId) {
            id = this._freeList.shift();
            if (id) {
                return id;
            }
            throw new Error("Ran out of ID's");
        }
        this._currentId++;
        return id;
    }

    /**
     * Gives an ID back to the allocator so it can be reused once it runs out of ID's
     * NOTE: This doesn't check if the ID is already on the free list
     */
    give(id: number) {
        if (id <= 0 || id > this.maxId) {
            throw new Error(`ID out of range: ${id}, range: [1, ${this.maxId}]`);
        }
        this._freeList.push(id);
    }
}
