import { describe, test, expect } from 'vitest';
import { Entity } from '../src/entities/Entity.js';

describe('Entity', () => {
    test('constructs with required properties', () => {
        const entity = new Entity({ id: 'e1', type: 'npc', x: 3, y: 5 });
        expect(entity.id).toBe('e1');
        expect(entity.type).toBe('npc');
        expect(entity.x).toBe(3);
        expect(entity.y).toBe(5);
        expect(entity.active).toBe(true);
        expect(entity.blocking).toBe(true);
        expect(entity.glyph).toBe('');
        expect(entity.color).toBe('');
        expect(entity.properties).toEqual({});
    });

    test('constructs with optional properties', () => {
        const entity = new Entity({
            id: 'e2', type: 'item', x: 1, y: 2,
            glyph: '🗝️', color: '#gold', blocking: false,
            properties: { itemId: 'key' }
        });
        expect(entity.glyph).toBe('🗝️');
        expect(entity.color).toBe('#gold');
        expect(entity.blocking).toBe(false);
        expect(entity.properties.itemId).toBe('key');
    });

    test('interact returns null by default', () => {
        const entity = new Entity({ id: 'e1', type: 'npc', x: 0, y: 0 });
        expect(entity.interact({}, {})).toBeNull();
    });

    test('update does nothing by default', () => {
        const entity = new Entity({ id: 'e1', type: 'npc', x: 0, y: 0 });
        // Should not throw
        entity.update({}, {});
    });

    test('deactivate sets active to false', () => {
        const entity = new Entity({ id: 'e1', type: 'npc', x: 0, y: 0 });
        expect(entity.active).toBe(true);
        entity.deactivate();
        expect(entity.active).toBe(false);
    });
});
