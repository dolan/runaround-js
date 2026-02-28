import { describe, test, expect, vi, beforeEach } from 'vitest';
import { WorldGraph } from '../src/world/WorldGraph.js';

const sampleWorldData = {
    startBoard: 'clearing',
    boards: {
        clearing: {
            file: 'levels/world_clearing.json',
            name: 'The Clearing',
            gridPosition: { x: 0, y: 0 }
        },
        cave: {
            file: 'levels/world_cave.json',
            name: 'Crystal Cave',
            gridPosition: { x: 1, y: 0 }
        },
        tower: {
            file: 'levels/world_tower.json',
            name: 'The Tower',
            gridPosition: { x: 1, y: 1 }
        }
    },
    transitions: [
        { from: { board: 'clearing', x: 5, y: 5, type: 'exit' },
          to:   { board: 'cave', x: 2, y: 1 } },
        { from: { board: 'cave', x: 1, y: 1, type: 'door' },
          to:   { board: 'clearing', x: 5, y: 4 } },
        { from: { board: 'cave', x: 5, y: 5, type: 'exit' },
          to:   { board: 'tower', x: 6, y: 8 } },
        { from: { board: 'tower', x: 5, y: 8, type: 'door' },
          to:   { board: 'cave', x: 5, y: 4 } }
    ]
};

describe('WorldGraph', () => {
    let graph;

    beforeEach(() => {
        graph = new WorldGraph(sampleWorldData);
    });

    test('getStartBoardId returns the start board', () => {
        expect(graph.getStartBoardId()).toBe('clearing');
    });

    test('getAllBoardIds returns all board IDs', () => {
        const ids = graph.getAllBoardIds();
        expect(ids).toContain('clearing');
        expect(ids).toContain('cave');
        expect(ids).toContain('tower');
        expect(ids).toHaveLength(3);
    });

    test('getBoardInfo returns metadata for a known board', () => {
        const info = graph.getBoardInfo('cave');
        expect(info.file).toBe('levels/world_cave.json');
        expect(info.name).toBe('Crystal Cave');
        expect(info.gridPosition).toEqual({ x: 1, y: 0 });
    });

    test('getBoardInfo returns null for unknown board', () => {
        expect(graph.getBoardInfo('dungeon')).toBeNull();
    });

    test('getTransitionAt returns transition for matching position', () => {
        const t = graph.getTransitionAt('clearing', 5, 5);
        expect(t).not.toBeNull();
        expect(t.toBoard).toBe('cave');
        expect(t.toX).toBe(2);
        expect(t.toY).toBe(1);
        expect(t.type).toBe('exit');
    });

    test('getTransitionAt returns null for non-transition tile', () => {
        expect(graph.getTransitionAt('clearing', 0, 0)).toBeNull();
    });

    test('getTransitionsForBoard returns all outgoing transitions', () => {
        const transitions = graph.getTransitionsForBoard('cave');
        expect(transitions).toHaveLength(2);
        const destinations = transitions.map(t => t.toBoard);
        expect(destinations).toContain('clearing');
        expect(destinations).toContain('tower');
    });

    test('getTransitionsForBoard returns single outgoing transition for a board with one transition', () => {
        // tower has one outgoing transition to cave
        const transitions = graph.getTransitionsForBoard('tower');
        expect(transitions).toHaveLength(1);
    });

    test('getConnectedBoards returns directly connected board IDs', () => {
        const connected = graph.getConnectedBoards('cave');
        expect(connected).toContain('clearing');
        expect(connected).toContain('tower');
    });

    test('getConnectedBoards includes boards connected by incoming transitions', () => {
        // clearing has an outgoing to cave, and cave has an outgoing back to clearing
        const connected = graph.getConnectedBoards('clearing');
        expect(connected).toContain('cave');
    });

    test('loadBoard throws for unknown board ID', async () => {
        await expect(graph.loadBoard('dungeon')).rejects.toThrow('Unknown board: dungeon');
    });

    test('loadBoard fetches and caches board data', async () => {
        const mockBoardData = {
            tiles: [['w', 'w'], ['w', 'p']],
            required_crystals: 0
        };

        // Mock fetch
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockBoardData)
        });

        const data1 = await graph.loadBoard('clearing');
        expect(data1).toEqual(mockBoardData);
        expect(fetch).toHaveBeenCalledTimes(1);

        // Second call should use cache
        const data2 = await graph.loadBoard('clearing');
        expect(data2).toEqual(mockBoardData);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('loadBoard returns deep copies so mutations do not affect cache', async () => {
        const mockBoardData = {
            tiles: [['w', 'p'], ['w', '.']],
            required_crystals: 0
        };

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockBoardData)
        });

        const data1 = await graph.loadBoard('clearing');
        data1.tiles[0][0] = 'MODIFIED';

        const data2 = await graph.loadBoard('clearing');
        expect(data2.tiles[0][0]).toBe('w');
    });
});
