import { describe, test, expect, vi, beforeEach } from 'vitest';
import { WorldReactor } from '../src/events/WorldReactor.js';
import { EventBus, GameEvents } from '../src/events/EventBus.js';
import { WorldState } from '../src/events/WorldState.js';

function makeEntity(overrides = {}) {
    return {
        id: 'e1',
        type: 'npc',
        active: true,
        dialogueIndex: 0,
        properties: { dialogue: ['Hello'], ...overrides.properties },
        ...overrides
    };
}

describe('WorldReactor', () => {
    let bus, ws, entities, ctx, reactor;

    beforeEach(() => {
        bus = new EventBus();
        ws = new WorldState(bus);
        entities = new Map();
        ctx = {
            get entityRegistry() {
                return { entities };
            }
        };
        reactor = new WorldReactor(bus, ws, ctx);
    });

    test('applies visibility based on conditions.visible flags', () => {
        const entity = makeEntity({
            properties: {
                dialogue: ['Hi'],
                conditions: { visible: [{ flag: 'quest_active', value: true }] }
            }
        });
        entities.set('e1', entity);

        reactor.applyAll();
        expect(entity.hidden).toBe(true);
        expect(entity.active).toBe(true); // active unchanged — hidden is separate

        ws.set('quest_active', true);
        // FLAG_CHANGED triggers applyAll
        expect(entity.hidden).toBe(false);
    });

    test('swaps NPC dialogue based on conditionalDialogue', () => {
        const entity = makeEntity({
            properties: {
                dialogue: ['Default line'],
                conditionalDialogue: [
                    {
                        conditions: [{ flag: 'quest_done', value: true }],
                        dialogue: ['Thanks for helping!']
                    },
                    {
                        conditions: [{ flag: 'quest_active', value: true }],
                        dialogue: ['Please help me!']
                    }
                ]
            }
        });
        entities.set('e1', entity);

        // No flags set — default dialogue
        reactor.applyAll();
        expect(entity.properties.dialogue).toEqual(['Default line']);

        // Set quest_active
        ws.set('quest_active', true);
        expect(entity.properties.dialogue).toEqual(['Please help me!']);

        // Set quest_done (higher priority, listed first)
        ws.set('quest_done', true);
        expect(entity.properties.dialogue).toEqual(['Thanks for helping!']);
    });

    test('restores original dialogue when no conditionals match', () => {
        const entity = makeEntity({
            properties: {
                dialogue: ['Original'],
                conditionalDialogue: [
                    {
                        conditions: [{ flag: 'temp', value: true }],
                        dialogue: ['Temporary']
                    }
                ]
            }
        });
        entities.set('e1', entity);

        ws.set('temp', true);
        expect(entity.properties.dialogue).toEqual(['Temporary']);

        ws.set('temp', false);
        expect(entity.properties.dialogue).toEqual(['Original']);
    });

    test('resets dialogueIndex when swapping dialogue', () => {
        const entity = makeEntity({
            properties: {
                dialogue: ['Line 1', 'Line 2'],
                conditionalDialogue: [
                    {
                        conditions: [{ flag: 'active', value: true }],
                        dialogue: ['New line']
                    }
                ]
            }
        });
        entity.dialogueIndex = 1;
        entities.set('e1', entity);

        ws.set('active', true);
        expect(entity.dialogueIndex).toBe(0);
    });

    test('swaps sign text based on conditionalText', () => {
        const entity = {
            id: 's1',
            type: 'interactive',
            active: true,
            properties: {
                objectType: 'sign',
                text: 'Original sign text',
                conditionalText: [
                    {
                        conditions: [{ flag: 'bridge_built', value: true }],
                        text: 'The bridge is now open!'
                    }
                ]
            }
        };
        entities.set('s1', entity);

        reactor.applyAll();
        expect(entity.properties.text).toBe('Original sign text');

        ws.set('bridge_built', true);
        expect(entity.properties.text).toBe('The bridge is now open!');
    });

    test('restores original sign text when no conditionals match', () => {
        const entity = {
            id: 's1',
            type: 'interactive',
            active: true,
            properties: {
                objectType: 'sign',
                text: 'Original',
                conditionalText: [
                    {
                        conditions: [{ flag: 'temp', value: true }],
                        text: 'Changed'
                    }
                ]
            }
        };
        entities.set('s1', entity);

        ws.set('temp', true);
        expect(entity.properties.text).toBe('Changed');

        ws.set('temp', false);
        expect(entity.properties.text).toBe('Original');
    });

    test('responds to BOARD_ENTER event', () => {
        const entity = makeEntity({
            properties: {
                dialogue: ['Hi'],
                conditions: { visible: [{ flag: 'show', value: true }] }
            }
        });
        entities.set('e1', entity);

        bus.emit(GameEvents.BOARD_ENTER, { boardId: 'test' });
        expect(entity.hidden).toBe(true);
    });

    test('skips non-NPC entities for dialogue', () => {
        const entity = {
            id: 'item1',
            type: 'item',
            active: true,
            properties: {
                conditionalDialogue: [
                    { conditions: [{ flag: 'x', value: true }], dialogue: ['Test'] }
                ]
            }
        };
        entities.set('item1', entity);

        ws.set('x', true);
        // Should not throw or modify
        expect(entity.properties.conditionalDialogue).toBeDefined();
    });

    test('skips non-interactive entities for text', () => {
        const entity = makeEntity({
            properties: {
                dialogue: ['Hi'],
                conditionalText: [
                    { conditions: [{ flag: 'x', value: true }], text: 'Test' }
                ]
            }
        });
        entities.set('e1', entity);

        ws.set('x', true);
        // Should not modify NPC text
        expect(entity.properties.text).toBeUndefined();
    });

    test('destroy() removes subscriptions', () => {
        const entity = makeEntity({
            properties: {
                dialogue: ['Hi'],
                conditions: { visible: [{ flag: 'show', value: true }] }
            }
        });
        entities.set('e1', entity);

        reactor.destroy();
        ws.set('show', true);
        // applyAll should NOT have been called
        expect(entity.hidden).toBeUndefined(); // unchanged — visibility not re-evaluated
    });

    test('handles missing entityRegistry gracefully', () => {
        const ctx2 = { get entityRegistry() { return null; } };
        const reactor2 = new WorldReactor(bus, ws, ctx2);
        expect(() => reactor2.applyAll()).not.toThrow();
    });
});
