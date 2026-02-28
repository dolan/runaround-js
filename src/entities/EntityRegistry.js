/**
 * Per-board spatial index for entities.
 * Manages entity lifecycle, spatial lookups, and batch updates.
 */
export class EntityRegistry {
    constructor() {
        /** @type {Map<string, import('./Entity.js').Entity>} */
        this.entities = new Map();
        /** @type {Map<string, import('./Entity.js').Entity>} */
        this.positionIndex = new Map();
    }

    /**
     * Generate a position key for spatial indexing.
     * @param {number} x
     * @param {number} y
     * @returns {string}
     */
    static posKey(x, y) {
        return `${x}:${y}`;
    }

    /**
     * Add an entity to the registry.
     * @param {import('./Entity.js').Entity} entity
     */
    add(entity) {
        this.entities.set(entity.id, entity);
        if (entity.active) {
            this.positionIndex.set(EntityRegistry.posKey(entity.x, entity.y), entity);
        }
    }

    /**
     * Remove an entity by ID.
     * @param {string} id
     */
    remove(id) {
        const entity = this.entities.get(id);
        if (entity) {
            const key = EntityRegistry.posKey(entity.x, entity.y);
            if (this.positionIndex.get(key) === entity) {
                this.positionIndex.delete(key);
            }
            this.entities.delete(id);
        }
    }

    /**
     * Get the active entity at a grid position.
     * @param {number} x
     * @param {number} y
     * @returns {import('./Entity.js').Entity|null}
     */
    getAt(x, y) {
        const entity = this.positionIndex.get(EntityRegistry.posKey(x, y));
        return (entity && entity.active) ? entity : null;
    }

    /**
     * Move an entity to a new position, updating the spatial index.
     * @param {string} id
     * @param {number} newX
     * @param {number} newY
     */
    moveEntity(id, newX, newY) {
        const entity = this.entities.get(id);
        if (!entity || !entity.active) return;

        const oldKey = EntityRegistry.posKey(entity.x, entity.y);
        if (this.positionIndex.get(oldKey) === entity) {
            this.positionIndex.delete(oldKey);
        }

        entity.x = newX;
        entity.y = newY;
        this.positionIndex.set(EntityRegistry.posKey(newX, newY), entity);
    }

    /**
     * Get all active entities.
     * @returns {import('./Entity.js').Entity[]}
     */
    getAll() {
        return Array.from(this.entities.values()).filter(e => e.active);
    }

    /**
     * Get all active entities of a specific type.
     * @param {string} type
     * @returns {import('./Entity.js').Entity[]}
     */
    getAllOfType(type) {
        return this.getAll().filter(e => e.type === type);
    }

    /**
     * Call update() on each active entity.
     * @param {Object} player
     * @param {Object} context
     */
    updateAll(player, context) {
        for (const entity of this.entities.values()) {
            if (entity.active) {
                entity.update(player, context);
            }
        }
    }

    /**
     * Remove inactive entities from both maps.
     */
    cleanup() {
        for (const [id, entity] of this.entities) {
            if (!entity.active) {
                const key = EntityRegistry.posKey(entity.x, entity.y);
                if (this.positionIndex.get(key) === entity) {
                    this.positionIndex.delete(key);
                }
                this.entities.delete(id);
            }
        }
    }

    /**
     * Build a registry from an array of entity definitions.
     * @param {Object[]} defs - Entity definitions from board JSON
     * @param {function(Object): import('./Entity.js').Entity} factoryFn - Creates entity from definition
     * @returns {EntityRegistry}
     */
    static fromDefinitions(defs, factoryFn) {
        const registry = new EntityRegistry();
        if (!defs || !Array.isArray(defs)) return registry;
        for (const def of defs) {
            const entity = factoryFn(def);
            registry.add(entity);
        }
        return registry;
    }
}
