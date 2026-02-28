import { describe, test, expect } from 'vitest';
import { NPC } from '../src/entities/NPC.js';
import { Enemy } from '../src/entities/Enemy.js';
import { Item } from '../src/entities/Item.js';
import { InteractiveObject } from '../src/entities/InteractiveObject.js';
import { createEntity } from '../src/entities/EntityFactory.js';
import { EntityRegistry } from '../src/entities/EntityRegistry.js';
import { Board } from '../src/core/Board.js';

describe('NPC', () => {
    test('interact returns dialogue and cycles', () => {
        const npc = new NPC({
            id: 'elder', type: 'npc', x: 0, y: 0,
            properties: { name: 'Elder', dialogue: ['Hello!', 'Welcome!', 'Goodbye!'] }
        });

        const r1 = npc.interact({}, {});
        expect(r1.type).toBe('dialogue');
        expect(r1.speaker).toBe('Elder');
        expect(r1.text).toBe('Hello!');

        const r2 = npc.interact({}, {});
        expect(r2.text).toBe('Welcome!');

        const r3 = npc.interact({}, {});
        expect(r3.text).toBe('Goodbye!');

        // Cycles back
        const r4 = npc.interact({}, {});
        expect(r4.text).toBe('Hello!');
    });

    test('interact returns null for empty dialogue', () => {
        const npc = new NPC({ id: 'n1', type: 'npc', x: 0, y: 0, properties: {} });
        expect(npc.interact({}, {})).toBeNull();
    });

    test('uses id as speaker when no name', () => {
        const npc = new NPC({
            id: 'guard', type: 'npc', x: 0, y: 0,
            properties: { dialogue: ['Halt!'] }
        });
        expect(npc.interact({}, {}).speaker).toBe('guard');
    });

    test('is blocking by default', () => {
        const npc = new NPC({ id: 'n1', type: 'npc', x: 0, y: 0, properties: {} });
        expect(npc.blocking).toBe(true);
    });
});

describe('Enemy', () => {
    test('interact decrements health and returns combat result', () => {
        const enemy = new Enemy({
            id: 'slime', type: 'enemy', x: 5, y: 5,
            properties: { health: 2 }
        });

        const r1 = enemy.interact({}, {});
        expect(r1.type).toBe('combat');
        expect(r1.defeated).toBe(false);
        expect(enemy.health).toBe(1);
        expect(enemy.active).toBe(true);

        const r2 = enemy.interact({}, {});
        expect(r2.defeated).toBe(true);
        expect(enemy.health).toBe(0);
        expect(enemy.active).toBe(false);
    });

    test('greedy chase moves toward player', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w'],
                ['w', '.', '.', '.', 'w'],
                ['w', '.', '.', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w']
            ],
            required_crystals: 0
        });

        const enemy = new Enemy({
            id: 'e1', type: 'enemy', x: 3, y: 2,
            properties: { health: 1 }
        });
        const registry = new EntityRegistry();
        registry.add(enemy);

        const player = { x: 1, y: 1 };
        enemy.update(player, { board, entityRegistry: registry });

        // Enemy should have moved closer to player
        const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
        expect(dist).toBeLessThan(4); // Was 3, should be 2 or less now
    });

    test('chase avoids walls', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w'],
                ['w', '.', 'w', '.', 'w'],
                ['w', '.', '.', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w']
            ],
            required_crystals: 0
        });

        const enemy = new Enemy({
            id: 'e1', type: 'enemy', x: 3, y: 1,
            properties: { health: 1 }
        });
        const registry = new EntityRegistry();
        registry.add(enemy);

        const player = { x: 1, y: 1 };
        enemy.update(player, { board, entityRegistry: registry });

        // Should not move into wall at (2,1), should move down to (3,2)
        expect(enemy.x).toBe(3);
        expect(enemy.y).toBe(2);
    });

    test('chase skips tiles occupied by other entities', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w'],
                ['w', '.', '.', '.', 'w'],
                ['w', '.', '.', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w']
            ],
            required_crystals: 0
        });

        const enemy = new Enemy({
            id: 'e1', type: 'enemy', x: 3, y: 1,
            properties: { health: 1 }
        });
        const blocker = new Enemy({
            id: 'e2', type: 'enemy', x: 2, y: 1,
            properties: { health: 1 }
        });
        const registry = new EntityRegistry();
        registry.add(enemy);
        registry.add(blocker);

        const player = { x: 1, y: 1 };
        enemy.update(player, { board, entityRegistry: registry });

        // Can't move left (occupied by e2), should move down
        expect(enemy.x).toBe(3);
        expect(enemy.y).toBe(2);
    });

    test('default health is 1', () => {
        const enemy = new Enemy({ id: 'e1', type: 'enemy', x: 0, y: 0, properties: {} });
        expect(enemy.health).toBe(1);
    });
});

describe('Item', () => {
    test('interact returns pickup and deactivates', () => {
        const item = new Item({
            id: 'potion', type: 'item', x: 2, y: 3,
            properties: { itemId: 'health_potion', description: 'Restores health' }
        });

        expect(item.blocking).toBe(false);

        const result = item.interact({}, {});
        expect(result.type).toBe('pickup');
        expect(result.itemId).toBe('health_potion');
        expect(result.description).toBe('Restores health');
        expect(item.active).toBe(false);
    });

    test('uses id as fallback itemId', () => {
        const item = new Item({ id: 'key1', type: 'item', x: 0, y: 0, properties: {} });
        const result = item.interact({}, {});
        expect(result.itemId).toBe('key1');
    });
});

describe('InteractiveObject', () => {
    test('sign returns dialogue', () => {
        const sign = new InteractiveObject({
            id: 's1', type: 'interactive', x: 0, y: 0,
            properties: { objectType: 'sign', text: 'Welcome to the village!' }
        });

        const result = sign.interact({}, {});
        expect(result.type).toBe('dialogue');
        expect(result.speaker).toBe('Sign');
        expect(result.text).toBe('Welcome to the village!');
    });

    test('chest gives item on first interact, empty on second', () => {
        const chest = new InteractiveObject({
            id: 'c1', type: 'interactive', x: 0, y: 0,
            properties: { objectType: 'chest', itemId: 'gold_key', description: 'A golden key!' }
        });

        const r1 = chest.interact({}, {});
        expect(r1.type).toBe('pickup');
        expect(r1.itemId).toBe('gold_key');
        expect(chest.opened).toBe(true);

        const r2 = chest.interact({}, {});
        expect(r2.type).toBe('dialogue');
        expect(r2.text).toBe('The chest is empty.');
    });

    test('lever toggles', () => {
        const lever = new InteractiveObject({
            id: 'lev1', type: 'interactive', x: 0, y: 0,
            properties: { objectType: 'lever' }
        });

        const r1 = lever.interact({}, {});
        expect(r1.type).toBe('lever');
        expect(r1.activated).toBe(true);

        const r2 = lever.interact({}, {});
        expect(r2.activated).toBe(false);
    });

    test('unknown objectType returns null', () => {
        const obj = new InteractiveObject({
            id: 'x1', type: 'interactive', x: 0, y: 0,
            properties: { objectType: 'unknown' }
        });
        expect(obj.interact({}, {})).toBeNull();
    });
});

describe('EntityFactory', () => {
    test('creates NPC from definition', () => {
        const entity = createEntity({
            id: 'n1', type: 'npc', x: 1, y: 2,
            properties: { name: 'Bob', dialogue: ['Hi'] }
        });
        expect(entity).toBeInstanceOf(NPC);
        expect(entity.glyph).toBe('🧑');
    });

    test('creates Enemy from definition', () => {
        const entity = createEntity({
            id: 'e1', type: 'enemy', x: 3, y: 4,
            properties: { health: 3 }
        });
        expect(entity).toBeInstanceOf(Enemy);
        expect(entity.health).toBe(3);
        expect(entity.glyph).toBe('👾');
    });

    test('creates Item from definition', () => {
        const entity = createEntity({
            id: 'i1', type: 'item', x: 0, y: 0,
            properties: { itemId: 'key' }
        });
        expect(entity).toBeInstanceOf(Item);
        expect(entity.blocking).toBe(false);
        expect(entity.glyph).toBe('✨');
    });

    test('creates InteractiveObject from definition', () => {
        const entity = createEntity({
            id: 's1', type: 'interactive', x: 0, y: 0,
            properties: { objectType: 'sign', text: 'Hello' }
        });
        expect(entity).toBeInstanceOf(InteractiveObject);
        expect(entity.glyph).toBe('🪧');
    });

    test('chest gets chest glyph', () => {
        const entity = createEntity({
            id: 'c1', type: 'interactive', x: 0, y: 0,
            properties: { objectType: 'chest', itemId: 'key' }
        });
        expect(entity.glyph).toBe('📦');
    });

    test('preserves custom glyph', () => {
        const entity = createEntity({
            id: 'n1', type: 'npc', x: 0, y: 0,
            glyph: '👴',
            properties: { dialogue: ['Hi'] }
        });
        expect(entity.glyph).toBe('👴');
    });

    test('unknown type creates base Entity', () => {
        const entity = createEntity({ id: 'x1', type: 'unknown', x: 0, y: 0 });
        expect(entity.type).toBe('unknown');
    });
});
