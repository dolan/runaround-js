import { Entity } from './Entity.js';

/**
 * Interactive objects: signs, chests, levers.
 * Behavior determined by properties.objectType.
 */
export class InteractiveObject extends Entity {
    /**
     * @param {Object} config
     * @param {string} config.properties.objectType - 'sign' | 'chest' | 'lever'
     * @param {string} [config.properties.text] - Text for signs
     * @param {string} [config.properties.itemId] - Item in chest
     * @param {string} [config.properties.description] - Item description for chest
     */
    constructor(config) {
        super({ ...config, type: 'interactive', blocking: true });
        this.opened = false;
        this.activated = false;
    }

    /**
     * Handle interaction based on object type.
     * @param {Object} player
     * @param {Object} context
     * @returns {Object} Result describing the interaction
     */
    interact(player, context) {
        switch (this.properties.objectType) {
            case 'sign':
                return this._interactSign();
            case 'chest':
                return this._interactChest();
            case 'lever':
                return this._interactLever();
            default:
                return null;
        }
    }

    _interactSign() {
        return {
            type: 'dialogue',
            speaker: 'Sign',
            text: this.properties.text || ''
        };
    }

    _interactChest() {
        if (this.opened) {
            return {
                type: 'dialogue',
                speaker: 'Chest',
                text: 'The chest is empty.'
            };
        }
        this.opened = true;
        this.glyph = this.properties.openedGlyph || '📭';
        return {
            type: 'pickup',
            itemId: this.properties.itemId || 'unknown',
            description: this.properties.description || 'Found something in the chest!'
        };
    }

    _interactLever() {
        this.activated = !this.activated;
        return {
            type: 'lever',
            activated: this.activated,
            leverId: this.id
        };
    }
}
