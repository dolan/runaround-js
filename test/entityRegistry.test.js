import { describe, test, expect } from 'vitest';
import { Entity } from '../src/entities/Entity.js';
import { EntityRegistry } from '../src/entities/EntityRegistry.js';

describe('EntityRegistry', () => {
    function makeEntity(id, x, y, opts = {}) {
        return new Entity({ id, type: opts.type || 'npc', x, y, ...opts });
    }

    test('add and getAt', () => {
        const reg = new EntityRegistry();
        const e = makeEntity('e1', 3, 5);
        reg.add(e);
        expect(reg.getAt(3, 5)).toBe(e);
        expect(reg.getAt(0, 0)).toBeNull();
    });

    test('remove clears from both maps', () => {
        const reg = new EntityRegistry();
        const e = makeEntity('e1', 3, 5);
        reg.add(e);
        reg.remove('e1');
        expect(reg.getAt(3, 5)).toBeNull();
        expect(reg.entities.size).toBe(0);
    });

    test('getAt returns null for inactive entity', () => {
        const reg = new EntityRegistry();
        const e = makeEntity('e1', 3, 5);
        reg.add(e);
        e.deactivate();
        expect(reg.getAt(3, 5)).toBeNull();
    });

    test('moveEntity updates spatial index', () => {
        const reg = new EntityRegistry();
        const e = makeEntity('e1', 1, 1);
        reg.add(e);
        reg.moveEntity('e1', 2, 3);
        expect(reg.getAt(1, 1)).toBeNull();
        expect(reg.getAt(2, 3)).toBe(e);
        expect(e.x).toBe(2);
        expect(e.y).toBe(3);
    });

    test('moveEntity ignores inactive entity', () => {
        const reg = new EntityRegistry();
        const e = makeEntity('e1', 1, 1);
        reg.add(e);
        e.deactivate();
        reg.moveEntity('e1', 2, 3);
        expect(e.x).toBe(1); // unchanged
    });

    test('getAll returns only active entities', () => {
        const reg = new EntityRegistry();
        const e1 = makeEntity('e1', 0, 0);
        const e2 = makeEntity('e2', 1, 1);
        reg.add(e1);
        reg.add(e2);
        e2.deactivate();
        expect(reg.getAll()).toEqual([e1]);
    });

    test('getAllOfType filters by type', () => {
        const reg = new EntityRegistry();
        const npc = makeEntity('n1', 0, 0, { type: 'npc' });
        const enemy = makeEntity('e1', 1, 1, { type: 'enemy' });
        reg.add(npc);
        reg.add(enemy);
        expect(reg.getAllOfType('npc')).toEqual([npc]);
        expect(reg.getAllOfType('enemy')).toEqual([enemy]);
    });

    test('updateAll calls update on active entities', () => {
        const reg = new EntityRegistry();
        let called = false;
        const e = makeEntity('e1', 0, 0);
        e.update = () => { called = true; };
        reg.add(e);
        reg.updateAll({}, {});
        expect(called).toBe(true);
    });

    test('updateAll skips inactive entities', () => {
        const reg = new EntityRegistry();
        let called = false;
        const e = makeEntity('e1', 0, 0);
        e.update = () => { called = true; };
        e.deactivate();
        reg.add(e);
        reg.updateAll({}, {});
        expect(called).toBe(false);
    });

    test('cleanup removes inactive entities', () => {
        const reg = new EntityRegistry();
        const e1 = makeEntity('e1', 0, 0);
        const e2 = makeEntity('e2', 1, 1);
        reg.add(e1);
        reg.add(e2);
        e1.deactivate();
        reg.cleanup();
        expect(reg.entities.size).toBe(1);
        expect(reg.getAt(0, 0)).toBeNull();
        expect(reg.getAt(1, 1)).toBe(e2);
    });

    test('fromDefinitions builds registry via factory', () => {
        const defs = [
            { id: 'n1', type: 'npc', x: 0, y: 0 },
            { id: 'n2', type: 'npc', x: 2, y: 3 }
        ];
        const factory = (def) => new Entity(def);
        const reg = EntityRegistry.fromDefinitions(defs, factory);
        expect(reg.getAll().length).toBe(2);
        expect(reg.getAt(0, 0).id).toBe('n1');
        expect(reg.getAt(2, 3).id).toBe('n2');
    });

    test('fromDefinitions handles null/undefined defs', () => {
        const reg = EntityRegistry.fromDefinitions(null, () => {});
        expect(reg.getAll().length).toBe(0);
    });

    test('fromDefinitions handles empty array', () => {
        const reg = EntityRegistry.fromDefinitions([], () => {});
        expect(reg.getAll().length).toBe(0);
    });
});
