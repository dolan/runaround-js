import { Entity } from './Entity.js';

/**
 * Pickup item entity. Non-blocking, deactivates on pickup.
 */
export class Item extends Entity {
    /**
     * @param {Object} config
     * @param {string} config.properties.itemId - Item catalog ID
     * @param {string} [config.properties.description] - Display description
     */
    constructor(config) {
        super({ ...config, type: 'item', blocking: false });
    }

    /**
     * Player picks up this item. Deactivates the entity.
     * @param {Object} player
     * @param {Object} context
     * @returns {{ type: 'pickup', itemId: string, description: string }}
     */
    interact(player, context) {
        this.deactivate();
        return {
            type: 'pickup',
            itemId: this.properties.itemId || this.id,
            description: this.properties.description || 'Picked up an item'
        };
    }
}
