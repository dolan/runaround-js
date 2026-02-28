import { describe, test, expect } from 'vitest';
import { Board, sampleLevel } from '../src/core/Board.js';

describe('Board', () => {
    test('constructs from valid data', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w'],
                ['w', 'p', 'w'],
                ['w', 'w', 'w']
            ],
            required_crystals: 0
        });
        expect(board.width).toBe(3);
        expect(board.height).toBe(3);
        expect(board.startX).toBe(1);
        expect(board.startY).toBe(1);
    });

    test('throws on invalid data', () => {
        expect(() => new Board(null)).toThrow("Invalid board data");
        expect(() => new Board({})).toThrow("Invalid board data");
        expect(() => new Board({ tiles: [] })).toThrow("Invalid board data");
    });

    test('finds player start and replaces with empty', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w'],
                ['w', 'p', 'w'],
                ['w', 'w', 'w']
            ]
        });
        expect(board.startX).toBe(1);
        expect(board.startY).toBe(1);
        expect(board.getTile(1, 1)).toBe('.');
    });

    test('falls back to first empty space if no player marker', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w'],
                ['w', '.', 'w'],
                ['w', 'w', 'w']
            ]
        });
        expect(board.startX).toBe(1);
        expect(board.startY).toBe(1);
    });

    test('getTile returns correct values', () => {
        const board = new Board({
            tiles: [
                ['w', 'c', 'w'],
                ['w', 'p', 'w'],
                ['w', 'x', 'w']
            ]
        });
        expect(board.getTile(0, 0)).toBe('w');
        expect(board.getTile(1, 0)).toBe('c');
        expect(board.getTile(1, 2)).toBe('x');
    });

    test('getTile returns null for out-of-bounds', () => {
        const board = new Board({
            tiles: [
                ['w', 'p', 'w'],
            ]
        });
        expect(board.getTile(-1, 0)).toBeNull();
        expect(board.getTile(0, -1)).toBeNull();
        expect(board.getTile(3, 0)).toBeNull();
        expect(board.getTile(0, 1)).toBeNull();
    });

    test('setTile updates tile value', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w'],
                ['w', 'p', 'w'],
                ['w', 'w', 'w']
            ]
        });
        board.setTile(1, 1, 'c');
        expect(board.getTile(1, 1)).toBe('c');
    });

    test('removeCrystal replaces crystal with empty', () => {
        const board = new Board({
            tiles: [
                ['w', 'c', 'w'],
                ['w', 'p', 'w'],
                ['w', 'w', 'w']
            ]
        });
        board.removeCrystal(1, 0);
        expect(board.getTile(1, 0)).toBe('.');
    });

    test('removeCrystal does nothing on non-crystal tile', () => {
        const board = new Board({
            tiles: [
                ['w', '.', 'w'],
                ['w', 'p', 'w'],
                ['w', 'w', 'w']
            ]
        });
        board.removeCrystal(1, 0);
        expect(board.getTile(1, 0)).toBe('.');
    });

    test('getOriginalState returns original tiles', () => {
        const board = new Board({
            tiles: [
                ['w', 'c', 'w'],
                ['w', 'p', 'w'],
                ['w', 'w', 'w']
            ],
            required_crystals: 1
        });
        board.removeCrystal(1, 0);
        const original = board.getOriginalState();
        expect(original.tiles[0][1]).toBe('c');
        expect(original.required_crystals).toBe(1);
    });

    test('sampleLevel is exported and valid', () => {
        expect(sampleLevel).toBeDefined();
        expect(sampleLevel.tiles).toBeDefined();
        expect(sampleLevel.required_crystals).toBe(3);
        const board = new Board(sampleLevel);
        expect(board.width).toBe(22);
        expect(board.height).toBe(7);
    });
});
