import { describe, test, expect, vi } from 'vitest';
import { EventBus, GameEvents } from '../src/events/EventBus.js';

describe('EventBus', () => {
    test('on() subscribes and emit() calls listener', () => {
        const bus = new EventBus();
        const fn = vi.fn();
        bus.on('test', fn);
        bus.emit('test', { value: 1 });
        expect(fn).toHaveBeenCalledWith({ value: 1 });
    });

    test('on() returns unsubscribe function', () => {
        const bus = new EventBus();
        const fn = vi.fn();
        const unsub = bus.on('test', fn);
        unsub();
        bus.emit('test');
        expect(fn).not.toHaveBeenCalled();
    });

    test('off() removes a specific listener', () => {
        const bus = new EventBus();
        const fn1 = vi.fn();
        const fn2 = vi.fn();
        bus.on('test', fn1);
        bus.on('test', fn2);
        bus.off('test', fn1);
        bus.emit('test');
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).toHaveBeenCalled();
    });

    test('once() fires only once', () => {
        const bus = new EventBus();
        const fn = vi.fn();
        bus.once('test', fn);
        bus.emit('test', 'a');
        bus.emit('test', 'b');
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('a');
    });

    test('once() returns unsubscribe function', () => {
        const bus = new EventBus();
        const fn = vi.fn();
        const unsub = bus.once('test', fn);
        unsub();
        bus.emit('test');
        expect(fn).not.toHaveBeenCalled();
    });

    test('emit() with no listeners does not throw', () => {
        const bus = new EventBus();
        expect(() => bus.emit('nonexistent')).not.toThrow();
    });

    test('emit() calls multiple listeners in order', () => {
        const bus = new EventBus();
        const order = [];
        bus.on('test', () => order.push(1));
        bus.on('test', () => order.push(2));
        bus.emit('test');
        expect(order).toEqual([1, 2]);
    });

    test('listener can remove itself during emit without affecting others', () => {
        const bus = new EventBus();
        const fn1 = vi.fn(() => bus.off('test', fn1));
        const fn2 = vi.fn();
        bus.on('test', fn1);
        bus.on('test', fn2);
        bus.emit('test');
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
    });

    test('clear(event) removes all listeners for that event', () => {
        const bus = new EventBus();
        const fn = vi.fn();
        bus.on('a', fn);
        bus.on('b', fn);
        bus.clear('a');
        bus.emit('a');
        bus.emit('b');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('clear() with no args removes all listeners', () => {
        const bus = new EventBus();
        const fn = vi.fn();
        bus.on('a', fn);
        bus.on('b', fn);
        bus.clear();
        bus.emit('a');
        bus.emit('b');
        expect(fn).not.toHaveBeenCalled();
    });
});

describe('GameEvents', () => {
    test('all event names are unique strings', () => {
        const values = Object.values(GameEvents);
        expect(values.length).toBeGreaterThan(0);
        expect(new Set(values).size).toBe(values.length);
        for (const v of values) {
            expect(typeof v).toBe('string');
        }
    });
});
