import { GameEvents } from './EventBus.js';
import { executeActions } from './TriggerSystem.js';

/**
 * Map objective types to the EventBus events they listen for.
 */
const OBJECTIVE_EVENT_MAP = {
    interact: GameEvents.ENTITY_INTERACT,
    pickup: GameEvents.ITEM_PICKUP,
    defeat: GameEvents.ENTITY_DEFEAT,
    enterBoard: GameEvents.BOARD_ENTER,
    flag: GameEvents.FLAG_CHANGED
};

/**
 * Staged quest lifecycle manager.
 * Quests progress through stages, each with objectives.
 * When all objectives in a stage are met, onComplete actions execute and the quest advances.
 */
export class QuestSystem {
    /**
     * @param {import('./EventBus.js').EventBus} eventBus
     * @param {import('./WorldState.js').WorldState} worldState
     * @param {Object} gameContext - Getter-based context object
     */
    constructor(eventBus, worldState, gameContext) {
        this._eventBus = eventBus;
        this._worldState = worldState;
        this._gameContext = gameContext;
        /** @type {Map<string, Object>} Quest definitions keyed by ID */
        this._questDefs = new Map();
        /** @type {Map<string, { stageIndex: number, completedObjectives: Set<string>[] }>} */
        this._activeQuests = new Map();
        /** @type {Set<string>} */
        this._completedQuests = new Set();
        /** @type {function[]} */
        this._unsubs = [];
    }

    /**
     * Load quest definitions and subscribe to relevant events.
     * @param {Object[]} questDefs
     */
    loadQuests(questDefs) {
        if (!questDefs || !Array.isArray(questDefs)) return;
        for (const def of questDefs) {
            this._questDefs.set(def.id, def);
        }
        this._subscribeToEvents();

        // Auto-start quests marked with autoStart
        for (const def of questDefs) {
            if (def.autoStart && !this._activeQuests.has(def.id) && !this._completedQuests.has(def.id)) {
                this.startQuest(def.id);
            }
        }
    }

    /**
     * Start a quest by ID.
     * @param {string} questId
     */
    startQuest(questId) {
        if (this._activeQuests.has(questId) || this._completedQuests.has(questId)) return;
        const def = this._questDefs.get(questId);
        if (!def) return;

        this._activeQuests.set(questId, {
            stageIndex: 0,
            completedObjectives: def.stages.map(() => new Set())
        });

        this._eventBus.emit(GameEvents.QUEST_START, { questId, name: def.name });
    }

    /**
     * Check if a quest is currently active.
     * @param {string} questId
     * @returns {boolean}
     */
    isActive(questId) {
        return this._activeQuests.has(questId);
    }

    /**
     * Check if a quest is completed.
     * @param {string} questId
     * @returns {boolean}
     */
    isCompleted(questId) {
        return this._completedQuests.has(questId);
    }

    /**
     * Get all active quests with current stage info.
     * @returns {Array<{ id: string, name: string, description: string, stageDescription: string }>}
     */
    getActiveQuests() {
        const result = [];
        for (const [id, state] of this._activeQuests) {
            const def = this._questDefs.get(id);
            if (!def) continue;
            const stage = def.stages[state.stageIndex];
            result.push({
                id,
                name: def.name,
                description: def.description,
                stageDescription: stage ? stage.description : ''
            });
        }
        return result;
    }

    /**
     * Get all completed quests.
     * @returns {Array<{ id: string, name: string }>}
     */
    getCompletedQuests() {
        const result = [];
        for (const id of this._completedQuests) {
            const def = this._questDefs.get(id);
            result.push({ id, name: def ? def.name : id });
        }
        return result;
    }

    /**
     * Subscribe to all event types that objectives care about.
     */
    _subscribeToEvents() {
        // Clean up previous subscriptions
        for (const unsub of this._unsubs) unsub();
        this._unsubs = [];

        const eventTypes = new Set(Object.values(OBJECTIVE_EVENT_MAP));
        for (const event of eventTypes) {
            const unsub = this._eventBus.on(event, (data) => {
                this._checkObjectives(event, data);
            });
            this._unsubs.push(unsub);
        }
    }

    /**
     * Check all active quest objectives against an incoming event.
     * @param {string} event
     * @param {*} eventData
     */
    _checkObjectives(event, eventData) {
        for (const [questId, state] of this._activeQuests) {
            const def = this._questDefs.get(questId);
            if (!def) continue;
            const stage = def.stages[state.stageIndex];
            if (!stage) continue;

            for (let i = 0; i < stage.objectives.length; i++) {
                const obj = stage.objectives[i];
                if (state.completedObjectives[state.stageIndex].has(String(i))) continue;

                const expectedEvent = OBJECTIVE_EVENT_MAP[obj.type];
                if (expectedEvent !== event) continue;

                if (!this._objectiveMatches(obj, eventData)) continue;

                // Check requiredFlags
                if (obj.requiredFlags && !this._worldState.checkAll(obj.requiredFlags)) continue;

                state.completedObjectives[state.stageIndex].add(String(i));
            }

            // Check if all objectives in current stage are met
            if (state.completedObjectives[state.stageIndex].size >= stage.objectives.length) {
                this._completeStage(questId);
            }
        }
    }

    /**
     * Check if an objective matches the event data.
     * @param {Object} objective
     * @param {*} eventData
     * @returns {boolean}
     */
    _objectiveMatches(objective, eventData) {
        if (!eventData) return false;
        switch (objective.type) {
            case 'interact':
                return eventData.entityId === objective.entityId;
            case 'pickup':
                return eventData.itemId === objective.itemId;
            case 'defeat':
                return eventData.entityId === objective.entityId;
            case 'enterBoard':
                return eventData.boardId === objective.boardId;
            case 'flag':
                return eventData.flag === objective.flag &&
                    (objective.value === undefined || eventData.value === objective.value);
            default:
                return false;
        }
    }

    /**
     * Complete a stage: advance to next stage, then execute onComplete actions.
     * Stage index is advanced BEFORE actions to prevent re-entrant completion
     * when onComplete actions emit events that trigger _checkObjectives.
     * @param {string} questId
     */
    _completeStage(questId) {
        const def = this._questDefs.get(questId);
        const state = this._activeQuests.get(questId);
        if (!def || !state) return;

        const stage = def.stages[state.stageIndex];

        // Advance stage index BEFORE executing actions to prevent re-entry
        state.stageIndex++;
        const isComplete = state.stageIndex >= def.stages.length;

        if (isComplete) {
            this._completeQuest(questId);
        } else {
            this._eventBus.emit(GameEvents.QUEST_ADVANCE, {
                questId,
                stageIndex: state.stageIndex
            });
        }

        // Execute onComplete actions after advancing (events from these won't re-trigger this stage)
        if (stage && stage.onComplete) {
            const context = {
                worldState: this._worldState,
                eventBus: this._eventBus,
                get inventory() { return this._gc.inventory; },
                get entityRegistry() { return this._gc.entityRegistry; },
                get dialogueSystem() { return this._gc.dialogueSystem; },
                get questSystem() { return this._gc.questSystem; },
                _gc: this._gameContext
            };
            executeActions(stage.onComplete, {}, context);
        }
    }

    /**
     * Advance a quest to the next stage (called by advanceQuest action).
     * @param {string} questId
     */
    _advanceQuest(questId) {
        const state = this._activeQuests.get(questId);
        const def = this._questDefs.get(questId);
        if (!state || !def) return;
        state.stageIndex++;
        if (state.stageIndex >= def.stages.length) {
            this._completeQuest(questId);
        }
    }

    /**
     * Mark a quest as completed.
     * @param {string} questId
     */
    _completeQuest(questId) {
        this._activeQuests.delete(questId);
        this._completedQuests.add(questId);
        const def = this._questDefs.get(questId);
        this._eventBus.emit(GameEvents.QUEST_COMPLETE, {
            questId,
            name: def ? def.name : questId
        });
    }

    /**
     * Serialize quest state for save games.
     * @returns {Object}
     */
    serialize() {
        const active = {};
        for (const [id, state] of this._activeQuests) {
            active[id] = {
                stageIndex: state.stageIndex,
                completedObjectives: state.completedObjectives.map(s => [...s])
            };
        }
        return {
            active,
            completed: [...this._completedQuests]
        };
    }

    /**
     * Deserialize quest state from save data.
     * @param {Object} data
     * @param {import('./EventBus.js').EventBus} eventBus
     * @param {import('./WorldState.js').WorldState} worldState
     * @param {Object} gameContext
     * @returns {QuestSystem}
     */
    static deserialize(data, eventBus, worldState, gameContext) {
        const qs = new QuestSystem(eventBus, worldState, gameContext);
        if (!data) return qs;
        if (data.completed) {
            qs._completedQuests = new Set(data.completed);
        }
        if (data.active) {
            for (const [id, state] of Object.entries(data.active)) {
                qs._activeQuests.set(id, {
                    stageIndex: state.stageIndex,
                    completedObjectives: state.completedObjectives.map(arr => new Set(arr))
                });
            }
        }
        return qs;
    }
}
