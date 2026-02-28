/**
 * Base class for all entities that exist on the board as an overlay on tiles.
 * Entities have position, visual representation, and behavior.
 */
export class Entity {
    /**
     * @param {Object} config
     * @param {string} config.id - Unique identifier
     * @param {string} config.type - Entity type (npc, enemy, item, interactive)
     * @param {number} config.x - Grid X position
     * @param {number} config.y - Grid Y position
     * @param {string} [config.glyph] - Display glyph (emoji)
     * @param {string} [config.color] - Background color
     * @param {boolean} [config.blocking=true] - Whether this entity blocks player movement
     * @param {Object} [config.properties] - Type-specific properties
     */
    constructor({ id, type, x, y, glyph = '', color = '', blocking = true, properties = {} }) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.glyph = glyph;
        this.color = color;
        this.blocking = blocking;
        this.properties = properties;
        this.active = true;
    }

    /**
     * Handle player interaction with this entity.
     * @param {Object} player - The player object
     * @param {Object} context - Game context (board, inventory, etc.)
     * @returns {Object|null} Result describing what happened
     */
    interact(player, context) {
        return null;
    }

    /**
     * Called each turn to update entity state.
     * @param {Object} player - The player object
     * @param {Object} context - Game context (board, entityRegistry, etc.)
     */
    update(player, context) {
        // Base class does nothing
    }

    /**
     * Mark this entity as inactive (removed/defeated/collected).
     */
    deactivate() {
        this.active = false;
    }
}
