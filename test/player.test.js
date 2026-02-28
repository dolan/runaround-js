import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Board } from '../src/core/Board.js';
import { Player } from '../src/game/Player.js';

describe('Player', () => {
    beforeEach(() => {
        // Set up minimal DOM elements that showMessage needs
        document.body.innerHTML = `
            <div id="messagePanel" style="display: none;">
                <div id="messageText"></div>
                <button id="dismissButton"></button>
            </div>
        `;
    });

    function makeBoard(tiles, required_crystals = 0) {
        return new Board({ tiles, required_crystals });
    }

    test('constructs with position and board reference', () => {
        const board = makeBoard([
            ['w', 'w', 'w'],
            ['w', 'p', 'w'],
            ['w', 'w', 'w']
        ]);
        const player = new Player(board.startX, board.startY, board);
        expect(player.x).toBe(1);
        expect(player.y).toBe(1);
        expect(player.crystals).toBe(0);
        expect(player.board).toBe(board);
    });

    test('move to empty tile updates position', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w'],
            ['w', 'p', '.', 'w'],
            ['w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        player.move(1, 0, {});
        expect(player.x).toBe(2);
        expect(player.y).toBe(1);
    });

    test('move into wall does nothing', () => {
        const board = makeBoard([
            ['w', 'w', 'w'],
            ['w', 'p', 'w'],
            ['w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        player.move(1, 0, {});
        expect(player.x).toBe(1);
        expect(player.y).toBe(1);
    });

    test('collectCrystal increments crystal count and calls callback', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w'],
            ['w', 'p', 'c', 'w'],
            ['w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        const onGameInfoUpdate = vi.fn();
        player.move(1, 0, { onGameInfoUpdate });
        expect(player.crystals).toBe(1);
        expect(player.x).toBe(2);
        expect(onGameInfoUpdate).toHaveBeenCalled();
    });

    test('pushMovable pushes block to empty space', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w', 'w'],
            ['w', 'p', 'm', '.', 'w'],
            ['w', 'w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        player.move(1, 0, {});
        expect(player.x).toBe(2);
        expect(board.getTile(2, 1)).toBe('.');
        expect(board.getTile(3, 1)).toBe('m');
    });

    test('pushMovable into hole fills hole', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w', 'w'],
            ['w', 'p', 'm', 'h', 'w'],
            ['w', 'w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        player.move(1, 0, {});
        expect(player.x).toBe(2);
        expect(board.getTile(2, 1)).toBe('.');
        expect(board.getTile(3, 1)).toBe('.');
    });

    test('pushMovable against wall does nothing', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w'],
            ['w', 'p', 'm', 'w'],
            ['w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        player.move(1, 0, {});
        expect(player.x).toBe(1);
        expect(board.getTile(2, 1)).toBe('m');
    });

    test('moveOnOneWay respects direction', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w', 'w'],
            ['w', 'p', 'or', '.', 'w'],
            ['w', 'w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        // Moving right through a right-only tile should work
        player.move(1, 0, {});
        expect(player.x).toBe(2);
    });

    test('moveOnOneWay blocks wrong direction', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w', 'w'],
            ['w', 'p', 'ol', '.', 'w'],
            ['w', 'w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        // Moving right through a left-only tile should be blocked
        player.move(1, 0, {});
        expect(player.x).toBe(1);
    });

    test('fallIntoHole calls onResetGame callback', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w'],
            ['w', 'p', 'h', 'w'],
            ['w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        const onResetGame = vi.fn();
        player.move(1, 0, { onResetGame });
        expect(onResetGame).toHaveBeenCalled();
    });

    test('tryExit with enough crystals calls onLevelComplete', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w', 'w'],
            ['w', 'p', 'c', 'x', 'w'],
            ['w', 'w', 'w', 'w', 'w']
        ], 1);
        const player = new Player(1, 1, board);
        const onLevelComplete = vi.fn();
        const onGameInfoUpdate = vi.fn();
        // First collect crystal
        player.move(1, 0, { onGameInfoUpdate });
        expect(player.crystals).toBe(1);
        // Then try exit
        player.move(1, 0, { onLevelComplete });
        expect(onLevelComplete).toHaveBeenCalled();
    });

    test('tryExit with enough crystals prefers onTransition over onLevelComplete', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w', 'w'],
            ['w', 'p', 'c', 'x', 'w'],
            ['w', 'w', 'w', 'w', 'w']
        ], 1);
        const player = new Player(1, 1, board);
        const onTransition = vi.fn();
        const onLevelComplete = vi.fn();
        const onGameInfoUpdate = vi.fn();
        // Collect crystal
        player.move(1, 0, { onGameInfoUpdate });
        // Try exit with both callbacks — onTransition should be preferred
        player.move(1, 0, { onTransition, onLevelComplete });
        expect(onTransition).toHaveBeenCalledWith(3, 1);
        expect(onLevelComplete).not.toHaveBeenCalled();
    });

    test('stepping on door tile calls onTransition', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w'],
            ['w', 'p', 'd', 'w'],
            ['w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        const onTransition = vi.fn();
        player.move(1, 0, { onTransition });
        expect(player.x).toBe(2);
        expect(player.y).toBe(1);
        expect(onTransition).toHaveBeenCalledWith(2, 1);
    });

    test('stepping on door tile without onTransition just moves', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w'],
            ['w', 'p', 'd', 'w'],
            ['w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        player.move(1, 0, {});
        expect(player.x).toBe(2);
        expect(player.y).toBe(1);
    });

    test('tryExit without enough crystals does nothing', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w'],
            ['w', 'p', 'x', 'w'],
            ['w', 'w', 'w', 'w']
        ], 1);
        const player = new Player(1, 1, board);
        const onLevelComplete = vi.fn();
        player.move(1, 0, { onLevelComplete });
        expect(onLevelComplete).not.toHaveBeenCalled();
        // Player should NOT have moved (exit blocks when crystals insufficient)
        expect(player.x).toBe(1);
    });

    test('has default facing direction (down) and health', () => {
        const board = makeBoard([
            ['w', 'w', 'w'],
            ['w', 'p', 'w'],
            ['w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);
        expect(player.facing).toEqual({ dx: 0, dy: 1 });
        expect(player.health).toBe(3);
    });

    test('move updates facing direction', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w'],
            ['w', 'p', '.', 'w'],
            ['w', '.', '.', 'w'],
            ['w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);

        player.move(1, 0, {});
        expect(player.facing).toEqual({ dx: 1, dy: 0 });

        player.move(0, 1, {});
        expect(player.facing).toEqual({ dx: 0, dy: 1 });
    });

    test('facing updates even when move is blocked', () => {
        const board = makeBoard([
            ['w', 'w', 'w'],
            ['w', 'p', 'w'],
            ['w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);

        player.move(-1, 0, {});
        expect(player.facing).toEqual({ dx: -1, dy: 0 });
        expect(player.x).toBe(1); // didn't move
    });

    test('getFacingTile returns correct tile', () => {
        const board = makeBoard([
            ['w', 'w', 'w', 'w'],
            ['w', 'p', '.', 'w'],
            ['w', 'w', 'w', 'w']
        ]);
        const player = new Player(1, 1, board);

        // Default facing is down
        expect(player.getFacingTile()).toEqual({ x: 1, y: 2 });

        // After moving right, facing is right
        player.move(1, 0, {});
        expect(player.getFacingTile()).toEqual({ x: 3, y: 1 });
    });
});
