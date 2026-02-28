import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QuestSystem } from '../src/events/QuestSystem.js';
import { EventBus, GameEvents } from '../src/events/EventBus.js';
import { WorldState } from '../src/events/WorldState.js';

function makeContext(overrides = {}) {
    return {
        inventory: { add: vi.fn(), remove: vi.fn(), has: vi.fn() },
        dialogueSystem: { startSimple: vi.fn() },
        entityRegistry: null,
        questSystem: null,
        ...overrides
    };
}

const SIMPLE_QUEST = {
    id: 'quest1',
    name: 'Test Quest',
    description: 'A test quest.',
    stages: [
        {
            description: 'Talk to NPC',
            objectives: [{ type: 'interact', entityId: 'npc1' }],
            onComplete: [{ type: 'setFlag', flag: 'stage1_done', value: true }]
        },
        {
            description: 'Collect the gem',
            objectives: [{ type: 'pickup', itemId: 'gem' }],
            onComplete: [{ type: 'setFlag', flag: 'stage2_done', value: true }]
        }
    ]
};

describe('QuestSystem', () => {
    let bus, ws, ctx, qs;

    beforeEach(() => {
        bus = new EventBus();
        ws = new WorldState(bus);
        ctx = makeContext();
        qs = new QuestSystem(bus, ws, ctx);
        ctx.questSystem = qs;
    });

    test('loadQuests stores definitions', () => {
        qs.loadQuests([SIMPLE_QUEST]);
        expect(qs._questDefs.has('quest1')).toBe(true);
    });

    test('startQuest activates a quest', () => {
        qs.loadQuests([SIMPLE_QUEST]);
        qs.startQuest('quest1');
        expect(qs.isActive('quest1')).toBe(true);
        expect(qs.isCompleted('quest1')).toBe(false);
    });

    test('startQuest emits QUEST_START', () => {
        const fn = vi.fn();
        bus.on(GameEvents.QUEST_START, fn);
        qs.loadQuests([SIMPLE_QUEST]);
        qs.startQuest('quest1');
        expect(fn).toHaveBeenCalledWith({ questId: 'quest1', name: 'Test Quest' });
    });

    test('startQuest is idempotent', () => {
        const fn = vi.fn();
        bus.on(GameEvents.QUEST_START, fn);
        qs.loadQuests([SIMPLE_QUEST]);
        qs.startQuest('quest1');
        qs.startQuest('quest1');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('autoStart starts quests on load', () => {
        qs.loadQuests([{ ...SIMPLE_QUEST, autoStart: true }]);
        expect(qs.isActive('quest1')).toBe(true);
    });

    test('getActiveQuests returns current stage info', () => {
        qs.loadQuests([SIMPLE_QUEST]);
        qs.startQuest('quest1');
        const active = qs.getActiveQuests();
        expect(active).toHaveLength(1);
        expect(active[0].name).toBe('Test Quest');
        expect(active[0].stageDescription).toBe('Talk to NPC');
    });

    test('interact objective completes stage', () => {
        qs.loadQuests([SIMPLE_QUEST]);
        qs.startQuest('quest1');

        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'npc1' });
        expect(ws.get('stage1_done')).toBe(true);

        // Quest should be on stage 2 now
        const active = qs.getActiveQuests();
        expect(active[0].stageDescription).toBe('Collect the gem');
    });

    test('wrong entity does not complete objective', () => {
        qs.loadQuests([SIMPLE_QUEST]);
        qs.startQuest('quest1');

        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'wrong_npc' });
        expect(ws.get('stage1_done')).toBeUndefined();
    });

    test('completing all stages completes the quest', () => {
        const fn = vi.fn();
        bus.on(GameEvents.QUEST_COMPLETE, fn);

        qs.loadQuests([SIMPLE_QUEST]);
        qs.startQuest('quest1');

        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'npc1' });
        bus.emit(GameEvents.ITEM_PICKUP, { itemId: 'gem' });

        expect(qs.isActive('quest1')).toBe(false);
        expect(qs.isCompleted('quest1')).toBe(true);
        expect(fn).toHaveBeenCalledWith({ questId: 'quest1', name: 'Test Quest' });
    });

    test('getCompletedQuests returns completed quest info', () => {
        qs.loadQuests([SIMPLE_QUEST]);
        qs.startQuest('quest1');
        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'npc1' });
        bus.emit(GameEvents.ITEM_PICKUP, { itemId: 'gem' });

        const completed = qs.getCompletedQuests();
        expect(completed).toHaveLength(1);
        expect(completed[0].name).toBe('Test Quest');
    });

    test('defeat objective type works', () => {
        const quest = {
            id: 'q2',
            name: 'Slay Quest',
            description: 'Defeat the boss.',
            stages: [{
                description: 'Defeat the boss',
                objectives: [{ type: 'defeat', entityId: 'boss' }],
                onComplete: [{ type: 'setFlag', flag: 'boss_dead', value: true }]
            }]
        };
        qs.loadQuests([quest]);
        qs.startQuest('q2');
        bus.emit(GameEvents.ENTITY_DEFEAT, { entityId: 'boss' });
        expect(ws.get('boss_dead')).toBe(true);
        expect(qs.isCompleted('q2')).toBe(true);
    });

    test('enterBoard objective type works', () => {
        const quest = {
            id: 'q3',
            name: 'Explore Quest',
            description: 'Go to the cave.',
            stages: [{
                description: 'Enter the cave',
                objectives: [{ type: 'enterBoard', boardId: 'cave' }],
                onComplete: []
            }]
        };
        qs.loadQuests([quest]);
        qs.startQuest('q3');
        bus.emit(GameEvents.BOARD_ENTER, { boardId: 'cave' });
        expect(qs.isCompleted('q3')).toBe(true);
    });

    test('flag objective type works', () => {
        const quest = {
            id: 'q4',
            name: 'Flag Quest',
            description: 'Wait for flag.',
            stages: [{
                description: 'Wait for bridge_built',
                objectives: [{ type: 'flag', flag: 'bridge_built', value: true }],
                onComplete: []
            }]
        };
        qs.loadQuests([quest]);
        qs.startQuest('q4');
        bus.emit(GameEvents.FLAG_CHANGED, { flag: 'bridge_built', value: true });
        expect(qs.isCompleted('q4')).toBe(true);
    });

    test('requiredFlags on objective gates completion', () => {
        const quest = {
            id: 'q5',
            name: 'Gated Quest',
            description: 'Gated.',
            stages: [{
                description: 'Talk to guard',
                objectives: [{
                    type: 'interact',
                    entityId: 'guard',
                    requiredFlags: [{ flag: 'has_pass', value: true }]
                }],
                onComplete: []
            }]
        };
        qs.loadQuests([quest]);
        qs.startQuest('q5');

        // No flag set — objective should not complete
        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'guard' });
        expect(qs.isActive('q5')).toBe(true);

        // Set flag and retry
        ws.set('has_pass', true);
        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'guard' });
        expect(qs.isCompleted('q5')).toBe(true);
    });

    test('serialize and deserialize round-trip', () => {
        qs.loadQuests([SIMPLE_QUEST]);
        qs.startQuest('quest1');
        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'npc1' });

        const data = qs.serialize();
        expect(data.active.quest1.stageIndex).toBe(1);

        const qs2 = QuestSystem.deserialize(data, bus, ws, ctx);
        qs2.loadQuests([SIMPLE_QUEST]);
        expect(qs2.isActive('quest1')).toBe(true);
        expect(qs2.getActiveQuests()[0].stageDescription).toBe('Collect the gem');
    });

    test('deserialize with completed quests', () => {
        qs.loadQuests([SIMPLE_QUEST]);
        qs.startQuest('quest1');
        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'npc1' });
        bus.emit(GameEvents.ITEM_PICKUP, { itemId: 'gem' });

        const data = qs.serialize();
        const qs2 = QuestSystem.deserialize(data, bus, ws, ctx);
        qs2.loadQuests([SIMPLE_QUEST]);
        expect(qs2.isCompleted('quest1')).toBe(true);
    });

    test('deserialize handles null data', () => {
        const qs2 = QuestSystem.deserialize(null, bus, ws, ctx);
        expect(qs2.getActiveQuests()).toEqual([]);
    });
});
