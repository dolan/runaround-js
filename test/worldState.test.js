import { describe, test, expect, vi } from 'vitest';
import { WorldState } from '../src/events/WorldState.js';
import { EventBus, GameEvents } from '../src/events/EventBus.js';

describe('WorldState', () => {
    test('get() returns default when flag not set', () => {
        const ws = new WorldState();
        expect(ws.get('missing')).toBeUndefined();
        expect(ws.get('missing', false)).toBe(false);
    });

    test('set() and get() store and retrieve values', () => {
        const ws = new WorldState();
        ws.set('bridge_repaired', true);
        expect(ws.get('bridge_repaired')).toBe(true);
    });

    test('set() emits FLAG_CHANGED when value changes', () => {
        const bus = new EventBus();
        const ws = new WorldState(bus);
        const fn = vi.fn();
        bus.on(GameEvents.FLAG_CHANGED, fn);

        ws.set('key', 'value1');
        expect(fn).toHaveBeenCalledWith({ flag: 'key', value: 'value1', oldValue: undefined });

        ws.set('key', 'value2');
        expect(fn).toHaveBeenCalledWith({ flag: 'key', value: 'value2', oldValue: 'value1' });
    });

    test('set() does not emit when value is unchanged', () => {
        const bus = new EventBus();
        const ws = new WorldState(bus);
        const fn = vi.fn();
        bus.on(GameEvents.FLAG_CHANGED, fn);

        ws.set('key', true);
        ws.set('key', true);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('check() with no value arg checks truthiness', () => {
        const ws = new WorldState();
        ws.set('flag_a', true);
        ws.set('flag_b', false);
        ws.set('flag_c', 0);
        ws.set('flag_d', 'yes');
        expect(ws.check('flag_a')).toBe(true);
        expect(ws.check('flag_b')).toBe(false);
        expect(ws.check('flag_c')).toBe(false);
        expect(ws.check('flag_d')).toBe(true);
        expect(ws.check('missing')).toBe(false);
    });

    test('check() with value arg checks exact match', () => {
        const ws = new WorldState();
        ws.set('count', 5);
        expect(ws.check('count', 5)).toBe(true);
        expect(ws.check('count', 3)).toBe(false);
    });

    test('checkAll() returns true for empty conditions', () => {
        const ws = new WorldState();
        expect(ws.checkAll([])).toBe(true);
        expect(ws.checkAll(null)).toBe(true);
    });

    test('checkAll() evaluates multiple conditions', () => {
        const ws = new WorldState();
        ws.set('a', true);
        ws.set('b', true);
        expect(ws.checkAll([{ flag: 'a', value: true }, { flag: 'b', value: true }])).toBe(true);
        expect(ws.checkAll([{ flag: 'a', value: true }, { flag: 'b', value: false }])).toBe(false);
    });

    test('serialize() and deserialize() round-trip', () => {
        const ws = new WorldState();
        ws.set('bridge', true);
        ws.set('coins', 42);
        ws.set('name', 'hero');

        const data = ws.serialize();
        const ws2 = WorldState.deserialize(data);
        expect(ws2.get('bridge')).toBe(true);
        expect(ws2.get('coins')).toBe(42);
        expect(ws2.get('name')).toBe('hero');
    });

    test('deserialize() with eventBus wires up events', () => {
        const bus = new EventBus();
        const ws = WorldState.deserialize({ key: 'old' }, bus);
        const fn = vi.fn();
        bus.on(GameEvents.FLAG_CHANGED, fn);
        ws.set('key', 'new');
        expect(fn).toHaveBeenCalled();
    });

    test('deserialize() handles null data', () => {
        const ws = WorldState.deserialize(null);
        expect(ws.get('anything')).toBeUndefined();
    });
});
