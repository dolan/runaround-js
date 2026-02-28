import { GameEvents } from './EventBus.js';

/**
 * Persistent key-value flag store for world state.
 * Emits FLAG_CHANGED events when values change.
 */
export class WorldState {
    /**
     * @param {import('./EventBus.js').EventBus} [eventBus] - Optional EventBus for change notifications
     */
    constructor(eventBus) {
        /** @type {Map<string, *>} */
        this._flags = new Map();
        /** @type {import('./EventBus.js').EventBus|null} */
        this._eventBus = eventBus || null;
    }

    /**
     * Set a flag value. Emits FLAG_CHANGED if the value actually changes.
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        const oldValue = this._flags.get(key);
        if (oldValue === value) return;
        this._flags.set(key, value);
        if (this._eventBus) {
            this._eventBus.emit(GameEvents.FLAG_CHANGED, { flag: key, value, oldValue });
        }
    }

    /**
     * Get a flag value with optional default.
     * @param {string} key
     * @param {*} [defaultValue]
     * @returns {*}
     */
    get(key, defaultValue) {
        return this._flags.has(key) ? this._flags.get(key) : defaultValue;
    }

    /**
     * Check a flag. If value is provided, checks for exact match.
     * If value is omitted, checks truthiness.
     * @param {string} key
     * @param {*} [value] - If provided, checks exact match
     * @returns {boolean}
     */
    check(key, value) {
        if (arguments.length >= 2) {
            return this._flags.has(key) && this._flags.get(key) === value;
        }
        return !!this._flags.get(key);
    }

    /**
     * Check all conditions. Each condition is { flag, value }.
     * If `value` is omitted from a condition, the flag is checked for truthiness.
     * @param {Array<{ flag: string, value?: * }>} conditions
     * @returns {boolean} True if all conditions are met
     */
    checkAll(conditions) {
        if (!conditions || conditions.length === 0) return true;
        return conditions.every(c =>
            ('value' in c) ? this.check(c.flag, c.value) : this.check(c.flag)
        );
    }

    /**
     * Serialize to a plain object for save games.
     * @returns {Object}
     */
    serialize() {
        return Object.fromEntries(this._flags);
    }

    /**
     * Deserialize from save data.
     * @param {Object} data
     * @param {import('./EventBus.js').EventBus} [eventBus]
     * @returns {WorldState}
     */
    static deserialize(data, eventBus) {
        const ws = new WorldState(eventBus);
        if (data) {
            for (const [key, value] of Object.entries(data)) {
                ws._flags.set(key, value);
            }
        }
        return ws;
    }
}
