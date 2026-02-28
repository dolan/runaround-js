import { GameEvents } from './EventBus.js';

/**
 * Reacts to world state changes by modifying entity visibility and dialogue.
 * Subscribes to BOARD_ENTER and FLAG_CHANGED to apply changes on the current board.
 */
export class WorldReactor {
    /**
     * @param {import('./EventBus.js').EventBus} eventBus
     * @param {import('./WorldState.js').WorldState} worldState
     * @param {Object} gameContext - Getter-based context with entityRegistry
     */
    constructor(eventBus, worldState, gameContext) {
        this._eventBus = eventBus;
        this._worldState = worldState;
        this._gameContext = gameContext;
        /** @type {function[]} */
        this._unsubs = [];

        this._unsubs.push(
            eventBus.on(GameEvents.BOARD_ENTER, () => this.applyAll()),
            eventBus.on(GameEvents.FLAG_CHANGED, () => this.applyAll())
        );
    }

    /**
     * Apply all world state reactions to the current board's entities.
     */
    applyAll() {
        const registry = this._gameContext.entityRegistry;
        if (!registry) return;

        for (const entity of registry.entities.values()) {
            this._applyVisibility(entity);
            this._applyConditionalDialogue(entity);
            this._applyConditionalText(entity);
        }
    }

    /**
     * Set entity.active based on conditions.visible flags.
     * @param {import('../entities/Entity.js').Entity} entity
     */
    _applyVisibility(entity) {
        const conditions = entity.properties.conditions;
        if (!conditions || !conditions.visible) return;

        entity.active = this._worldState.checkAll(conditions.visible);
    }

    /**
     * Swap NPC dialogue based on conditionalDialogue entries.
     * @param {import('../entities/Entity.js').Entity} entity
     */
    _applyConditionalDialogue(entity) {
        if (entity.type !== 'npc') return;
        const conditionals = entity.properties.conditionalDialogue;
        if (!conditionals || !Array.isArray(conditionals)) return;

        // Store original dialogue on first application
        if (!entity._originalDialogue) {
            entity._originalDialogue = entity.properties.dialogue;
        }

        // Find first matching conditional
        for (const entry of conditionals) {
            if (this._worldState.checkAll(entry.conditions)) {
                entity.properties.dialogue = entry.dialogue;
                entity.dialogueIndex = 0;
                return;
            }
        }

        // No match — restore original
        entity.properties.dialogue = entity._originalDialogue;
    }

    /**
     * Swap sign/interactive text based on conditionalText entries.
     * @param {import('../entities/Entity.js').Entity} entity
     */
    _applyConditionalText(entity) {
        if (entity.type !== 'interactive') return;
        const conditionals = entity.properties.conditionalText;
        if (!conditionals || !Array.isArray(conditionals)) return;

        // Store original text on first application
        if (!entity._originalText) {
            entity._originalText = entity.properties.text;
        }

        // Find first matching conditional
        for (const entry of conditionals) {
            if (this._worldState.checkAll(entry.conditions)) {
                entity.properties.text = entry.text;
                return;
            }
        }

        // No match — restore original
        entity.properties.text = entity._originalText;
    }

    /**
     * Remove all subscriptions.
     */
    destroy() {
        for (const unsub of this._unsubs) unsub();
        this._unsubs = [];
    }
}
