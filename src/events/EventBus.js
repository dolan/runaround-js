/**
 * Game event name constants.
 * @enum {string}
 */
export const GameEvents = {
    BOARD_ENTER: 'board:enter',
    PLAYER_MOVE: 'player:move',
    ENTITY_INTERACT: 'entity:interact',
    ENTITY_DEFEAT: 'entity:defeat',
    ITEM_PICKUP: 'item:pickup',
    ITEM_USE: 'item:use',
    LEVER_TOGGLE: 'lever:toggle',
    FLAG_CHANGED: 'flag:changed',
    QUEST_START: 'quest:start',
    QUEST_ADVANCE: 'quest:advance',
    QUEST_COMPLETE: 'quest:complete'
};

/**
 * Synchronous publish/subscribe event bus for game events.
 */
export class EventBus {
    constructor() {
        /** @type {Map<string, Set<function>>} */
        this._listeners = new Map();
    }

    /**
     * Subscribe to an event.
     * @param {string} event - Event name
     * @param {function} fn - Callback
     * @returns {function} Unsubscribe function
     */
    on(event, fn) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(fn);
        return () => this.off(event, fn);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event - Event name
     * @param {function} fn - Callback to remove
     */
    off(event, fn) {
        const set = this._listeners.get(event);
        if (set) {
            set.delete(fn);
            if (set.size === 0) {
                this._listeners.delete(event);
            }
        }
    }

    /**
     * Subscribe to an event, auto-removing after first call.
     * @param {string} event - Event name
     * @param {function} fn - Callback
     * @returns {function} Unsubscribe function
     */
    once(event, fn) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            fn(data);
        };
        return this.on(event, wrapper);
    }

    /**
     * Emit an event synchronously to all listeners.
     * @param {string} event - Event name
     * @param {*} [data] - Event data
     */
    emit(event, data) {
        const set = this._listeners.get(event);
        if (!set) return;
        // Iterate a copy so listeners can remove themselves during emit
        for (const fn of [...set]) {
            fn(data);
        }
    }

    /**
     * Remove all listeners for a specific event, or all events if no event given.
     * @param {string} [event] - Event name (omit to clear all)
     */
    clear(event) {
        if (event !== undefined) {
            this._listeners.delete(event);
        } else {
            this._listeners.clear();
        }
    }
}
