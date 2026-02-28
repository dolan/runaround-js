import { describe, test, expect, vi, beforeEach } from 'vitest';
import { EventBus, GameEvents } from '../src/events/EventBus.js';
import { WorldState } from '../src/events/WorldState.js';
import { QuestSystem } from '../src/events/QuestSystem.js';
import { WorldReactor } from '../src/events/WorldReactor.js';
import { Inventory } from '../src/entities/Inventory.js';

/**
 * Integration test: simulate the full "Elder's Request" quest lifecycle.
 * Verifies flag progression, quest state transitions, entity visibility, and dialogue changes.
 */

const QUEST_DEF = {
    id: 'elders_request',
    name: "The Elder's Request",
    description: 'Help the Village Elder find a rare crystal from the cave.',
    stages: [
        {
            description: 'Talk to the Village Elder in Oakvale Village',
            objectives: [{ type: 'interact', entityId: 'elder' }],
            onComplete: [
                { type: 'setFlag', flag: 'quest_elders_request_active', value: true },
                { type: 'showMessage', speaker: 'System', text: "New Quest: The Elder's Request" }
            ]
        },
        {
            description: 'Find the rare crystal in Crystal Cave',
            objectives: [{ type: 'pickup', itemId: 'rare_crystal' }],
            onComplete: [
                { type: 'setFlag', flag: 'has_rare_crystal', value: true },
                { type: 'showMessage', speaker: 'System', text: 'Quest Updated: Return the crystal to the Elder' }
            ]
        },
        {
            description: 'Return the rare crystal to the Village Elder',
            objectives: [{
                type: 'interact',
                entityId: 'elder',
                requiredFlags: [{ flag: 'has_rare_crystal', value: true }]
            }],
            onComplete: [
                { type: 'removeItem', itemId: 'rare_crystal' },
                { type: 'giveItem', itemId: 'elder_amulet' },
                { type: 'setFlag', flag: 'quest_elders_request_complete', value: true },
                { type: 'setFlag', flag: 'cave_passage_unlocked', value: true },
                { type: 'showMessage', speaker: 'Village Elder', text: 'Thank you! Take this amulet as a reward.' }
            ]
        }
    ]
};

describe('Demo Quest: The Elder\'s Request', () => {
    let bus, ws, inventory, dialogueSystem, entities, ctx, qs, reactor;

    beforeEach(() => {
        bus = new EventBus();
        ws = new WorldState(bus);
        inventory = new Inventory();
        dialogueSystem = { startSimple: vi.fn() };

        // Simulate village entities
        entities = new Map();
        const elder = {
            id: 'elder', type: 'npc', active: true, dialogueIndex: 0,
            properties: {
                name: 'Village Elder',
                dialogue: ['Welcome to the village, traveler.'],
                conditionalDialogue: [
                    {
                        conditions: [{ flag: 'quest_elders_request_complete', value: true }],
                        dialogue: ['Thank you for finding the crystal, hero!']
                    },
                    {
                        conditions: [{ flag: 'has_rare_crystal', value: true }],
                        dialogue: ['You found the rare crystal! Wonderful!']
                    },
                    {
                        conditions: [{ flag: 'quest_elders_request_active', value: true }],
                        dialogue: ['The rare crystal should be somewhere in the cave.']
                    }
                ]
            }
        };
        entities.set('elder', elder);

        // Simulate cave crystal entity (visibility gated)
        const crystal = {
            id: 'rare_crystal', type: 'item', active: true,
            properties: {
                itemId: 'rare_crystal',
                conditions: { visible: [{ flag: 'quest_elders_request_active', value: true }] }
            }
        };
        entities.set('rare_crystal', crystal);

        // Simulate clearing sign
        const sign = {
            id: 'clearing_sign', type: 'interactive', active: true,
            properties: {
                objectType: 'sign',
                text: 'The Clearing. Exits lead to the cave and tower.',
                conditionalText: [
                    {
                        conditions: [{ flag: 'quest_elders_request_complete', value: true }],
                        text: "The Elder's quest is complete — a hero walks among us!"
                    }
                ]
            }
        };
        entities.set('clearing_sign', sign);

        ctx = {
            get inventory() { return inventory; },
            get entityRegistry() { return { entities }; },
            get dialogueSystem() { return dialogueSystem; },
            get questSystem() { return qs; }
        };

        qs = new QuestSystem(bus, ws, ctx);
        reactor = new WorldReactor(bus, ws, ctx);
    });

    test('full quest lifecycle', () => {
        // Load quest
        qs.loadQuests([QUEST_DEF]);

        // Initially: crystal is hidden (quest not active)
        reactor.applyAll();
        expect(entities.get('rare_crystal').hidden).toBe(true);
        expect(entities.get('elder').properties.dialogue).toEqual(['Welcome to the village, traveler.']);

        // Stage 1: Talk to elder → quest starts
        qs.startQuest('elders_request');
        expect(qs.isActive('elders_request')).toBe(true);

        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'elder' });

        // Stage 1 complete → flag set, quest advances
        expect(ws.get('quest_elders_request_active')).toBe(true);
        expect(qs.getActiveQuests()[0].stageDescription).toBe('Find the rare crystal in Crystal Cave');

        // WorldReactor updates: crystal now visible, elder dialogue changed
        expect(entities.get('rare_crystal').hidden).toBe(false);
        expect(entities.get('elder').properties.dialogue).toEqual(
            ['The rare crystal should be somewhere in the cave.']
        );

        // Stage 2: Pick up the crystal
        bus.emit(GameEvents.ITEM_PICKUP, { itemId: 'rare_crystal' });

        expect(ws.get('has_rare_crystal')).toBe(true);
        expect(qs.getActiveQuests()[0].stageDescription).toBe('Return the rare crystal to the Village Elder');

        // Elder dialogue updates for has_rare_crystal
        expect(entities.get('elder').properties.dialogue).toEqual(
            ['You found the rare crystal! Wonderful!']
        );

        // Stage 3: Return to elder (interact with has_rare_crystal flag)
        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'elder' });

        // Quest complete!
        expect(qs.isCompleted('elders_request')).toBe(true);
        expect(qs.isActive('elders_request')).toBe(false);
        expect(ws.get('quest_elders_request_complete')).toBe(true);
        expect(ws.get('cave_passage_unlocked')).toBe(true);

        // Inventory: crystal removed, amulet given
        expect(inventory.has('rare_crystal')).toBe(false);
        expect(inventory.has('elder_amulet')).toBe(true);

        // Elder dialogue reflects completion
        expect(entities.get('elder').properties.dialogue).toEqual(
            ['Thank you for finding the crystal, hero!']
        );

        // Clearing sign text changes
        expect(entities.get('clearing_sign').properties.text).toBe(
            "The Elder's quest is complete — a hero walks among us!"
        );
    });

    test('quest state serialization round-trip', () => {
        qs.loadQuests([QUEST_DEF]);
        qs.startQuest('elders_request');
        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'elder' });

        // Serialize mid-quest
        const questData = qs.serialize();
        const worldData = ws.serialize();

        // Create new instances and restore
        const bus2 = new EventBus();
        const ws2 = WorldState.deserialize(worldData, bus2);
        const ctx2 = { ...ctx };
        const qs2 = QuestSystem.deserialize(questData, bus2, ws2, ctx2);
        qs2.loadQuests([QUEST_DEF]);

        expect(qs2.isActive('elders_request')).toBe(true);
        expect(qs2.getActiveQuests()[0].stageDescription).toBe('Find the rare crystal in Crystal Cave');
        expect(ws2.get('quest_elders_request_active')).toBe(true);
    });

    test('quest events are emitted correctly', () => {
        const startFn = vi.fn();
        const advanceFn = vi.fn();
        const completeFn = vi.fn();

        bus.on(GameEvents.QUEST_START, startFn);
        bus.on(GameEvents.QUEST_ADVANCE, advanceFn);
        bus.on(GameEvents.QUEST_COMPLETE, completeFn);

        qs.loadQuests([QUEST_DEF]);
        qs.startQuest('elders_request');
        expect(startFn).toHaveBeenCalledTimes(1);

        // Complete all stages
        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'elder' });
        expect(advanceFn).toHaveBeenCalledTimes(1);

        bus.emit(GameEvents.ITEM_PICKUP, { itemId: 'rare_crystal' });
        expect(advanceFn).toHaveBeenCalledTimes(2);

        bus.emit(GameEvents.ENTITY_INTERACT, { entityId: 'elder' });
        expect(completeFn).toHaveBeenCalledTimes(1);
    });
});
