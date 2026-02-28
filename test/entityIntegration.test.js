import { describe, test, expect, beforeEach } from 'vitest';
import { Board } from '../src/core/Board.js';
import { Player } from '../src/game/Player.js';
import { EntityRegistry } from '../src/entities/EntityRegistry.js';
import { createEntity } from '../src/entities/EntityFactory.js';
import { Inventory } from '../src/entities/Inventory.js';
import { NPC } from '../src/entities/NPC.js';
import { Enemy } from '../src/entities/Enemy.js';
import { Item } from '../src/entities/Item.js';
import { InteractiveObject } from '../src/entities/InteractiveObject.js';

describe('Entity Integration', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="messagePanel" style="display: none;">
                <div id="messageText"></div>
                <button id="dismissButton"></button>
            </div>
        `;
    });

    const boardData = {
        tiles: [
            ['w', 'w', 'w', 'w', 'w', 'w', 'w'],
            ['w', 'p', '.', '.', '.', '.', 'w'],
            ['w', '.', '.', '.', '.', '.', 'w'],
            ['w', '.', '.', '.', '.', '.', 'w'],
            ['w', '.', '.', '.', '.', '.', 'w'],
            ['w', 'w', 'w', 'w', 'w', 'w', 'w']
        ],
        required_crystals: 0,
        entities: [
            {
                id: 'test_npc',
                type: 'npc',
                x: 3, y: 1,
                properties: { name: 'Bob', dialogue: ['Hello!', 'Goodbye!'] }
            },
            {
                id: 'test_enemy',
                type: 'enemy',
                x: 5, y: 4,
                properties: { health: 2, damage: 1 }
            },
            {
                id: 'test_item',
                type: 'item',
                x: 2, y: 3,
                properties: { itemId: 'gem', description: 'A shiny gem' }
            },
            {
                id: 'test_chest',
                type: 'interactive',
                x: 4, y: 2,
                properties: { objectType: 'chest', itemId: 'key', description: 'A rusty key' }
            }
        ]
    };

    test('entities load from JSON definitions via factory', () => {
        const registry = EntityRegistry.fromDefinitions(boardData.entities, createEntity);
        expect(registry.getAll().length).toBe(4);
        expect(registry.getAt(3, 1)).toBeInstanceOf(NPC);
        expect(registry.getAt(5, 4)).toBeInstanceOf(Enemy);
        expect(registry.getAt(2, 3)).toBeInstanceOf(Item);
        expect(registry.getAt(4, 2)).toBeInstanceOf(InteractiveObject);
    });

    test('NPC interaction returns dialogue', () => {
        const registry = EntityRegistry.fromDefinitions(boardData.entities, createEntity);
        const npc = registry.getAt(3, 1);
        const result = npc.interact({}, {});
        expect(result.type).toBe('dialogue');
        expect(result.speaker).toBe('Bob');
        expect(result.text).toBe('Hello!');
    });

    test('enemy chases player each turn', () => {
        const board = new Board(boardData);
        const player = new Player(1, 1, board);
        const registry = EntityRegistry.fromDefinitions(boardData.entities, createEntity);

        const enemy = registry.getAt(5, 4);
        const startDist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);

        enemy.update(player, { board, entityRegistry: registry });

        const endDist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
        expect(endDist).toBeLessThan(startDist);
    });

    test('item pickup adds to inventory and deactivates entity', () => {
        const registry = EntityRegistry.fromDefinitions(boardData.entities, createEntity);
        const inventory = new Inventory();
        const item = registry.getAt(2, 3);

        const result = item.interact({}, { inventory });
        expect(result.type).toBe('pickup');
        expect(result.itemId).toBe('gem');

        inventory.add(result.itemId);
        expect(inventory.has('gem')).toBe(true);
        expect(item.active).toBe(false);

        registry.cleanup();
        expect(registry.getAt(2, 3)).toBeNull();
    });

    test('blocking entity prevents player movement', () => {
        const board = new Board(boardData);
        const player = new Player(2, 1, board);
        const registry = EntityRegistry.fromDefinitions(boardData.entities, createEntity);

        // NPC is at (3, 1) and blocking
        const npc = registry.getAt(3, 1);
        expect(npc.blocking).toBe(true);

        // Simulate the check from main.js: target has blocking entity
        const targetX = player.x + 1;
        const targetY = player.y;
        const blockingEntity = registry.getAt(targetX, targetY);
        expect(blockingEntity).toBe(npc);

        // Player should not move (in the game loop, this would prevent player.move())
        if (blockingEntity && blockingEntity.blocking) {
            // Don't move
        } else {
            player.move(1, 0, {});
        }
        expect(player.x).toBe(2); // unchanged
    });

    test('non-blocking item does not prevent movement', () => {
        const registry = EntityRegistry.fromDefinitions(boardData.entities, createEntity);
        const item = registry.getAt(2, 3);
        expect(item.blocking).toBe(false);

        // Player can walk through items
        const blockingEntity = registry.getAt(2, 3);
        const canMove = !blockingEntity || !blockingEntity.blocking;
        expect(canMove).toBe(true);
    });

    test('spatial index updates when entity moves', () => {
        const registry = EntityRegistry.fromDefinitions(boardData.entities, createEntity);

        const enemy = registry.getAt(5, 4);
        expect(enemy.id).toBe('test_enemy');

        registry.moveEntity('test_enemy', 4, 4);
        expect(registry.getAt(5, 4)).toBeNull();
        expect(registry.getAt(4, 4)).toBe(enemy);
    });

    test('board without entities key loads empty registry', () => {
        const noEntityData = {
            tiles: [['w', 'p', 'w']],
            required_crystals: 0
        };
        const registry = EntityRegistry.fromDefinitions(noEntityData.entities, createEntity);
        expect(registry.getAll().length).toBe(0);
    });

    test('chest gives item first time, empty message second time', () => {
        const registry = EntityRegistry.fromDefinitions(boardData.entities, createEntity);
        const chest = registry.getAt(4, 2);

        const r1 = chest.interact({}, {});
        expect(r1.type).toBe('pickup');
        expect(r1.itemId).toBe('key');

        const r2 = chest.interact({}, {});
        expect(r2.type).toBe('dialogue');
        expect(r2.text).toBe('The chest is empty.');
    });

    test('enemy combat: attack reduces health, defeated removes enemy', () => {
        const registry = EntityRegistry.fromDefinitions(boardData.entities, createEntity);
        const enemy = registry.getAt(5, 4);

        // First attack
        const r1 = enemy.interact({}, {});
        expect(r1.type).toBe('combat');
        expect(r1.defeated).toBe(false);
        expect(enemy.health).toBe(1);

        // Second attack defeats
        const r2 = enemy.interact({}, {});
        expect(r2.defeated).toBe(true);
        expect(enemy.active).toBe(false);

        registry.cleanup();
        expect(registry.getAt(5, 4)).toBeNull();
    });

    test('inventory persists across simulated board transitions', () => {
        const inventory = new Inventory();

        // Pick up item on board 1
        const reg1 = EntityRegistry.fromDefinitions(boardData.entities, createEntity);
        const item = reg1.getAt(2, 3);
        const result = item.interact({}, {});
        inventory.add(result.itemId);

        // "Transition" to board 2 (new registry, same inventory)
        const reg2 = EntityRegistry.fromDefinitions([], createEntity);
        expect(reg2.getAll().length).toBe(0);
        expect(inventory.has('gem')).toBe(true);
    });
});
