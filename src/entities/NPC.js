import { Entity } from './Entity.js';

/**
 * Non-player character with dialogue.
 * Cycles through dialogue lines on each interaction.
 */
export class NPC extends Entity {
    /**
     * @param {Object} config
     * @param {string[]} config.properties.dialogue - Array of dialogue lines
     * @param {string} [config.properties.name] - NPC display name
     */
    constructor(config) {
        super({ ...config, type: 'npc', blocking: true });
        this.dialogueIndex = 0;
    }

    /**
     * Returns dialogue result, cycling through dialogue lines.
     * @param {Object} player
     * @param {Object} context
     * @returns {{ type: 'dialogue', speaker: string, text: string }}
     */
    interact(player, context) {
        const dialogue = this.properties.dialogue || [];
        if (dialogue.length === 0) return null;

        if (this.dialogueIndex >= dialogue.length) this.dialogueIndex = 0;
        const text = dialogue[this.dialogueIndex];
        this.dialogueIndex = (this.dialogueIndex + 1) % dialogue.length;

        return {
            type: 'dialogue',
            speaker: this.properties.name || this.id,
            text
        };
    }
}
