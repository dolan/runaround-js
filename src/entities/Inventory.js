/**
 * Player inventory. Persists across board transitions.
 * Tracks item counts by item ID.
 */
export class Inventory {
    constructor() {
        /** @type {Map<string, number>} */
        this.items = new Map();
    }

    /**
     * Add items to inventory.
     * @param {string} itemId
     * @param {number} [count=1]
     */
    add(itemId, count = 1) {
        this.items.set(itemId, (this.items.get(itemId) || 0) + count);
    }

    /**
     * Remove items from inventory.
     * @param {string} itemId
     * @param {number} [count=1]
     * @returns {boolean} True if removal succeeded (had enough items)
     */
    remove(itemId, count = 1) {
        const current = this.items.get(itemId) || 0;
        if (current < count) return false;
        const remaining = current - count;
        if (remaining === 0) {
            this.items.delete(itemId);
        } else {
            this.items.set(itemId, remaining);
        }
        return true;
    }

    /**
     * Check if inventory contains at least one of this item.
     * @param {string} itemId
     * @returns {boolean}
     */
    has(itemId) {
        return (this.items.get(itemId) || 0) > 0;
    }

    /**
     * Get the count of an item.
     * @param {string} itemId
     * @returns {number}
     */
    count(itemId) {
        return this.items.get(itemId) || 0;
    }

    /**
     * Get all items as an array of { itemId, count }.
     * @returns {{ itemId: string, count: number }[]}
     */
    getAll() {
        return Array.from(this.items.entries()).map(([itemId, count]) => ({ itemId, count }));
    }

    /**
     * Serialize for save games.
     * @returns {Object}
     */
    serialize() {
        return Object.fromEntries(this.items);
    }

    /**
     * Deserialize from save data.
     * @param {Object} data
     * @returns {Inventory}
     */
    static deserialize(data) {
        const inv = new Inventory();
        if (data) {
            for (const [itemId, count] of Object.entries(data)) {
                inv.items.set(itemId, count);
            }
        }
        return inv;
    }
}
