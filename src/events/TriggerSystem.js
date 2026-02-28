import { GameEvents } from './EventBus.js';

/**
 * Execute an array of action objects against the game context.
 * Shared vocabulary used by both TriggerSystem and QuestSystem.
 * @param {Array<Object>} actions
 * @param {Object} eventData - The event data that triggered the actions
 * @param {Object} context - { worldState, eventBus, inventory, entityRegistry, dialogueSystem, questSystem }
 */
export function executeActions(actions, eventData, context) {
    if (!actions) return;
    for (const action of actions) {
        switch (action.type) {
            case 'setFlag':
                context.worldState.set(action.flag, action.value);
                break;
            case 'showMessage':
                if (context.dialogueSystem) {
                    context.dialogueSystem.startSimple(
                        action.speaker || 'System',
                        action.text
                    );
                }
                break;
            case 'giveItem':
                if (context.inventory) {
                    context.inventory.add(action.itemId, action.count ?? 1);
                }
                break;
            case 'removeItem':
                if (context.inventory) {
                    context.inventory.remove(action.itemId, action.count ?? 1);
                }
                break;
            case 'startQuest':
                if (context.questSystem) {
                    context.questSystem.startQuest(action.questId);
                }
                break;
            case 'advanceQuest':
                if (context.questSystem) {
                    context.questSystem._advanceQuest(action.questId);
                }
                break;
            case 'completeQuest':
                if (context.questSystem) {
                    context.questSystem._completeQuest(action.questId);
                }
                break;
            case 'emit':
                if (context.eventBus) {
                    context.eventBus.emit(action.event, action.data ?? {});
                }
                break;
        }
    }
}

/**
 * Data-driven trigger system. Evaluates JSON trigger definitions
 * against EventBus events and executes actions when conditions are met.
 */
export class TriggerSystem {
    /**
     * @param {import('./EventBus.js').EventBus} eventBus
     * @param {import('./WorldState.js').WorldState} worldState
     * @param {Object} gameContext - Getter-based context object for current game state
     */
    constructor(eventBus, worldState, gameContext) {
        this._eventBus = eventBus;
        this._worldState = worldState;
        this._gameContext = gameContext;
        /** @type {Map<string, { trigger: Object, unsub: function, source: string }>} */
        this._activeTriggers = new Map();
        /** @type {Set<string>} */
        this._firedOnce = new Set();
    }

    /**
     * Register an array of trigger definitions.
     * @param {Object[]} defs - Trigger definitions from JSON
     * @param {string} source - Source tag (e.g., board ID) for cleanup
     */
    registerTriggers(defs, source) {
        if (!defs || !Array.isArray(defs)) return;
        for (const def of defs) {
            if (this._activeTriggers.has(def.id)) continue;
            const unsub = this._eventBus.on(def.event, (eventData) => {
                this._handleTrigger(def, eventData);
            });
            this._activeTriggers.set(def.id, { trigger: def, unsub, source });
        }
    }

    /**
     * Remove all triggers registered with a specific source tag.
     * @param {string} source
     */
    clearTriggersBySource(source) {
        for (const [id, entry] of this._activeTriggers) {
            if (entry.source === source) {
                entry.unsub();
                this._activeTriggers.delete(id);
            }
        }
    }

    /**
     * Remove all triggers.
     */
    clearAll() {
        for (const entry of this._activeTriggers.values()) {
            entry.unsub();
        }
        this._activeTriggers.clear();
    }

    /**
     * Handle a trigger firing.
     * @param {Object} trigger
     * @param {*} eventData
     */
    _handleTrigger(trigger, eventData) {
        if (trigger.once && this._firedOnce.has(trigger.id)) return;
        if (!this._evaluateConditions(trigger, eventData)) return;

        if (trigger.once) {
            this._firedOnce.add(trigger.id);
        }

        this._executeActions(trigger.actions, eventData);
    }

    /**
     * Evaluate trigger conditions against event data and world state.
     * @param {Object} trigger
     * @param {*} eventData
     * @returns {boolean}
     */
    _evaluateConditions(trigger, eventData) {
        const cond = trigger.conditions;
        if (!cond) return true;

        // Check eventMatch: shallow field comparison against eventData
        if (cond.eventMatch) {
            for (const [key, expected] of Object.entries(cond.eventMatch)) {
                if (!eventData || eventData[key] !== expected) return false;
            }
        }

        // Check flags via worldState
        if (cond.flags) {
            if (!this._worldState.checkAll(cond.flags)) return false;
        }

        return true;
    }

    /**
     * Execute trigger actions using the shared action vocabulary.
     * @param {Object[]} actions
     * @param {*} eventData
     */
    _executeActions(actions, eventData) {
        const context = {
            worldState: this._worldState,
            eventBus: this._eventBus,
            get inventory() { return this._gc.inventory; },
            get entityRegistry() { return this._gc.entityRegistry; },
            get dialogueSystem() { return this._gc.dialogueSystem; },
            get questSystem() { return this._gc.questSystem; },
            _gc: this._gameContext
        };
        executeActions(actions, eventData, context);
    }

    /**
     * Serialize fired-once trigger IDs for save games.
     * @returns {string[]}
     */
    serialize() {
        return [...this._firedOnce];
    }

    /**
     * Restore fired-once trigger IDs from save data.
     * @param {string[]} data
     */
    deserializeFiredOnce(data) {
        if (data && Array.isArray(data)) {
            this._firedOnce = new Set(data);
        }
    }
}
