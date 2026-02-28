import { describe, test, expect } from 'vitest';
import { Inventory } from '../src/entities/Inventory.js';

describe('Inventory', () => {
    test('starts empty', () => {
        const inv = new Inventory();
        expect(inv.getAll()).toEqual([]);
        expect(inv.has('key')).toBe(false);
        expect(inv.count('key')).toBe(0);
    });

    test('add increases count', () => {
        const inv = new Inventory();
        inv.add('key');
        expect(inv.has('key')).toBe(true);
        expect(inv.count('key')).toBe(1);

        inv.add('key', 2);
        expect(inv.count('key')).toBe(3);
    });

    test('remove decreases count', () => {
        const inv = new Inventory();
        inv.add('potion', 3);

        expect(inv.remove('potion', 2)).toBe(true);
        expect(inv.count('potion')).toBe(1);

        expect(inv.remove('potion')).toBe(true);
        expect(inv.has('potion')).toBe(false);
        expect(inv.count('potion')).toBe(0);
    });

    test('remove fails if not enough items', () => {
        const inv = new Inventory();
        inv.add('potion', 1);
        expect(inv.remove('potion', 5)).toBe(false);
        expect(inv.count('potion')).toBe(1); // unchanged
    });

    test('remove fails for missing item', () => {
        const inv = new Inventory();
        expect(inv.remove('nonexistent')).toBe(false);
    });

    test('getAll returns all items', () => {
        const inv = new Inventory();
        inv.add('key', 1);
        inv.add('potion', 3);
        const all = inv.getAll();
        expect(all).toHaveLength(2);
        expect(all).toContainEqual({ itemId: 'key', count: 1 });
        expect(all).toContainEqual({ itemId: 'potion', count: 3 });
    });

    test('serialize and deserialize round-trip', () => {
        const inv = new Inventory();
        inv.add('key', 1);
        inv.add('potion', 3);

        const data = inv.serialize();
        expect(data).toEqual({ key: 1, potion: 3 });

        const inv2 = Inventory.deserialize(data);
        expect(inv2.count('key')).toBe(1);
        expect(inv2.count('potion')).toBe(3);
    });

    test('deserialize handles null', () => {
        const inv = Inventory.deserialize(null);
        expect(inv.getAll()).toEqual([]);
    });
});
