import { describe, test, expect, vi, beforeEach } from 'vitest';
import { TriggerSystem, executeActions } from '../src/events/TriggerSystem.js';
import { EventBus, GameEvents } from '../src/events/EventBus.js';
import { WorldState } from '../src/events/WorldState.js';

describe('executeActions', () => {
    test('setFlag action sets world state', () => {
        const ws = new WorldState();
        executeActions(
            [{ type: 'setFlag', flag: 'test', value: true }],
            {},
            { worldState: ws }
        );
        expect(ws.get('test')).toBe(true);
    });

    test('giveItem action adds to inventory', () => {
        const inv = { add: vi.fn() };
        executeActions(
            [{ type: 'giveItem', itemId: 'sword', count: 2 }],
            {},
            { worldState: new WorldState(), inventory: inv }
        );
        expect(inv.add).toHaveBeenCalledWith('sword', 2);
    });

    test('removeItem action removes from inventory', () => {
        const inv = { remove: vi.fn() };
        executeActions(
            [{ type: 'removeItem', itemId: 'key' }],
            {},
            { worldState: new WorldState(), inventory: inv }
        );
        expect(inv.remove).toHaveBeenCalledWith('key', 1);
    });

    test('showMessage action calls dialogueSystem', () => {
        const ds = { startSimple: vi.fn() };
        executeActions(
            [{ type: 'showMessage', text: 'Hello!', speaker: 'NPC' }],
            {},
            { worldState: new WorldState(), dialogueSystem: ds }
        );
        expect(ds.startSimple).toHaveBeenCalledWith('NPC', 'Hello!');
    });

    test('emit action emits on eventBus', () => {
        const bus = new EventBus();
        const fn = vi.fn();
        bus.on('custom:event', fn);
        executeActions(
            [{ type: 'emit', event: 'custom:event', data: { foo: 1 } }],
            {},
            { worldState: new WorldState(), eventBus: bus }
        );
        expect(fn).toHaveBeenCalledWith({ foo: 1 });
    });

    test('handles null actions gracefully', () => {
        expect(() => executeActions(null, {}, {})).not.toThrow();
    });
});

describe('TriggerSystem', () => {
    let bus, ws, triggerSystem;

    beforeEach(() => {
        bus = new EventBus();
        ws = new WorldState(bus);
        triggerSystem = new TriggerSystem(bus, ws, {
            inventory: null,
            dialogueSystem: null,
            questSystem: null,
            entityRegistry: null
        });
    });

    test('registerTriggers subscribes to events and fires actions', () => {
        triggerSystem.registerTriggers([
            {
                id: 't1',
                event: GameEvents.ITEM_PICKUP,
                actions: [{ type: 'setFlag', flag: 'picked_up', value: true }]
            }
        ], 'board1');

        bus.emit(GameEvents.ITEM_PICKUP, { itemId: 'gem' });
        expect(ws.get('picked_up')).toBe(true);
    });

    test('conditions.eventMatch filters by event data fields', () => {
        triggerSystem.registerTriggers([
            {
                id: 't1',
                event: GameEvents.ITEM_PICKUP,
                conditions: { eventMatch: { itemId: 'special' } },
                actions: [{ type: 'setFlag', flag: 'found', value: true }]
            }
        ], 'board1');

        bus.emit(GameEvents.ITEM_PICKUP, { itemId: 'common' });
        expect(ws.get('found')).toBeUndefined();

        bus.emit(GameEvents.ITEM_PICKUP, { itemId: 'special' });
        expect(ws.get('found')).toBe(true);
    });

    test('conditions.flags checks world state', () => {
        triggerSystem.registerTriggers([
            {
                id: 't1',
                event: GameEvents.ENTITY_INTERACT,
                conditions: { flags: [{ flag: 'quest_active', value: true }] },
                actions: [{ type: 'setFlag', flag: 'talked', value: true }]
            }
        ], 'board1');

        bus.emit(GameEvents.ENTITY_INTERACT, {});
        expect(ws.get('talked')).toBeUndefined();

        ws.set('quest_active', true);
        bus.emit(GameEvents.ENTITY_INTERACT, {});
        expect(ws.get('talked')).toBe(true);
    });

    test('once: true fires only once', () => {
        const fn = vi.fn();
        ws.set = fn;
        triggerSystem.registerTriggers([
            {
                id: 't1',
                event: 'test',
                once: true,
                actions: [{ type: 'setFlag', flag: 'x', value: 1 }]
            }
        ], 'board1');

        bus.emit('test');
        bus.emit('test');
        // setFlag called in executeActions — once trigger should only fire once
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('clearTriggersBySource removes only matching triggers', () => {
        triggerSystem.registerTriggers([
            { id: 't1', event: 'test', actions: [{ type: 'setFlag', flag: 'a', value: 1 }] }
        ], 'board1');
        triggerSystem.registerTriggers([
            { id: 't2', event: 'test', actions: [{ type: 'setFlag', flag: 'b', value: 1 }] }
        ], 'global');

        triggerSystem.clearTriggersBySource('board1');
        bus.emit('test');
        expect(ws.get('a')).toBeUndefined();
        expect(ws.get('b')).toBe(1);
    });

    test('clearAll removes all triggers', () => {
        triggerSystem.registerTriggers([
            { id: 't1', event: 'test', actions: [{ type: 'setFlag', flag: 'a', value: 1 }] }
        ], 'board1');

        triggerSystem.clearAll();
        bus.emit('test');
        expect(ws.get('a')).toBeUndefined();
    });

    test('duplicate trigger IDs are skipped', () => {
        triggerSystem.registerTriggers([
            { id: 't1', event: 'test', actions: [{ type: 'setFlag', flag: 'a', value: 1 }] }
        ], 'board1');
        triggerSystem.registerTriggers([
            { id: 't1', event: 'test', actions: [{ type: 'setFlag', flag: 'a', value: 2 }] }
        ], 'board2');

        bus.emit('test');
        expect(ws.get('a')).toBe(1); // first registration wins
    });

    test('serialize and deserializeFiredOnce round-trip', () => {
        triggerSystem.registerTriggers([
            { id: 't1', event: 'test', once: true, actions: [{ type: 'setFlag', flag: 'x', value: 1 }] }
        ], 'board1');
        bus.emit('test');

        const data = triggerSystem.serialize();
        expect(data).toContain('t1');

        const ts2 = new TriggerSystem(bus, ws, {});
        ts2.deserializeFiredOnce(data);
        ts2.registerTriggers([
            { id: 't1', event: 'test', once: true, actions: [{ type: 'setFlag', flag: 'y', value: 1 }] }
        ], 'board1');
        bus.emit('test');
        expect(ws.get('y')).toBeUndefined(); // already fired
    });
});
