import { describe, test, expect, vi, beforeEach } from 'vitest';
import { WorldGraph } from '../src/world/WorldGraph.js';
import { PlayerState } from '../src/world/PlayerState.js';
import { Transition, TransitionType } from '../src/world/Transition.js';
import { Board } from '../src/core/Board.js';
import { Player } from '../src/game/Player.js';

// Minimal world data for integration testing
const worldData = {
    startBoard: 'a',
    boards: {
        a: {
            file: 'levels/board_a.json',
            name: 'Board A',
            gridPosition: { x: 0, y: 0 }
        },
        b: {
            file: 'levels/board_b.json',
            name: 'Board B',
            gridPosition: { x: 1, y: 0 }
        },
        c: {
            file: 'levels/board_c.json',
            name: 'Board C',
            gridPosition: { x: 0, y: 1 }
        }
    },
    transitions: [
        { from: { board: 'a', x: 4, y: 1, type: 'exit' },
          to:   { board: 'b', x: 1, y: 1 } },
        { from: { board: 'b', x: 1, y: 2, type: 'door' },
          to:   { board: 'a', x: 1, y: 1 } },
        { from: { board: 'a', x: 1, y: 2, type: 'door' },
          to:   { board: 'c', x: 1, y: 1 } },
        { from: { board: 'c', x: 3, y: 1, type: 'exit' },
          to:   { board: 'b', x: 3, y: 2 } }
    ]
};

// Simple board data for tests
const boardAData = {
    tiles: [
        ['w', 'w', 'w', 'w', 'w', 'w'],
        ['w', 'p', 'c', '.', 'x', 'w'],
        ['w', 'd', '.', '.', '.', 'w'],
        ['w', 'w', 'w', 'w', 'w', 'w']
    ],
    required_crystals: 1
};

const boardBData = {
    tiles: [
        ['w', 'w', 'w', 'w', 'w'],
        ['w', 'p', '.', '.', 'w'],
        ['w', 'd', '.', '.', 'w'],
        ['w', 'w', 'w', 'w', 'w']
    ],
    required_crystals: 0
};

describe('World Integration', () => {
    // Set up DOM for showMessage
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="messagePanel" style="display: none;">
                <div id="messageText"></div>
                <button id="dismissButton"></button>
            </div>
        `;
    });

    test('WorldGraph transition lookup matches board tile positions', () => {
        const graph = new WorldGraph(worldData);
        const boardA = new Board(boardAData);

        // Exit tile at (4,1) in board A should have a transition
        expect(boardA.getTile(4, 1)).toBe('x');
        const exitTransition = graph.getTransitionAt('a', 4, 1);
        expect(exitTransition).not.toBeNull();
        expect(exitTransition.type).toBe(TransitionType.EXIT);
        expect(exitTransition.toBoard).toBe('b');

        // Door tile at (1,2) in board A should have a transition
        expect(boardA.getTile(1, 2)).toBe('d');
        const doorTransition = graph.getTransitionAt('a', 1, 2);
        expect(doorTransition).not.toBeNull();
        expect(doorTransition.type).toBe(TransitionType.DOOR);
        expect(doorTransition.toBoard).toBe('c');
    });

    test('PlayerState tracks board traversal history', () => {
        const graph = new WorldGraph(worldData);
        const state = new PlayerState(graph.getStartBoardId());

        // Start on board A
        expect(state.currentBoardId).toBe('a');
        expect(state.hasVisited('a')).toBe(true);
        expect(state.hasVisited('b')).toBe(false);

        // Transition to board B
        state.enterBoard('b');
        expect(state.currentBoardId).toBe('b');
        expect(state.hasVisited('b')).toBe(true);
        expect(state.hasVisited('a')).toBe(true);

        // Back to board A
        state.enterBoard('a');
        expect(state.currentBoardId).toBe('a');
        expect(state.visitedBoards.size).toBe(2);
    });

    test('player stepping on door tile fires onTransition with correct coordinates', () => {
        const boardA = new Board(boardAData);
        const player = new Player(boardA.startX, boardA.startY, boardA);
        const onTransition = vi.fn();

        // Player starts at (1,1). Move down to (1,2) which is 'd'
        player.move(0, 1, { onTransition });
        expect(player.x).toBe(1);
        expect(player.y).toBe(2);
        expect(onTransition).toHaveBeenCalledWith(1, 2);
    });

    test('player exiting with crystals fires onTransition when available', () => {
        const boardA = new Board(boardAData);
        const player = new Player(boardA.startX, boardA.startY, boardA);
        const onTransition = vi.fn();
        const onLevelComplete = vi.fn();
        const onGameInfoUpdate = vi.fn();

        // Collect crystal at (2,1)
        player.move(1, 0, { onGameInfoUpdate });
        expect(player.crystals).toBe(1);

        // Move right to (3,1)
        player.move(1, 0, {});

        // Step on exit at (4,1) — should fire onTransition, not onLevelComplete
        player.move(1, 0, { onTransition, onLevelComplete });
        expect(onTransition).toHaveBeenCalledWith(4, 1);
        expect(onLevelComplete).not.toHaveBeenCalled();
    });

    test('legacy mode: exit without onTransition fires onLevelComplete', () => {
        const boardA = new Board(boardAData);
        const player = new Player(boardA.startX, boardA.startY, boardA);
        const onLevelComplete = vi.fn();
        const onGameInfoUpdate = vi.fn();

        // Collect crystal
        player.move(1, 0, { onGameInfoUpdate });
        // Move right
        player.move(1, 0, {});
        // Step on exit with only onLevelComplete (legacy mode)
        player.move(1, 0, { onLevelComplete });
        expect(onLevelComplete).toHaveBeenCalled();
    });

    test('WorldGraph loadBoard returns fresh copies for board state isolation', async () => {
        const graph = new WorldGraph(worldData);

        // Mock fetch
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(boardAData)
        });

        const data1 = await graph.loadBoard('a');
        const board1 = new Board(data1);
        // Mutate board1
        board1.setTile(2, 1, '.');

        const data2 = await graph.loadBoard('a');
        const board2 = new Board(data2);
        // Board2 should still have crystal at (2,1)
        expect(board2.getTile(2, 1)).toBe('c');
    });

    test('serialized PlayerState can be restored and used with WorldGraph', () => {
        const graph = new WorldGraph(worldData);
        const state = new PlayerState(graph.getStartBoardId());
        state.enterBoard('b');
        state.enterBoard('c');

        const serialized = state.serialize();
        const restored = PlayerState.deserialize(serialized);

        expect(restored.currentBoardId).toBe('c');
        expect(graph.getBoardInfo(restored.currentBoardId).name).toBe('Board C');
        expect(restored.hasVisited('a')).toBe(true);
        expect(restored.hasVisited('b')).toBe(true);
        expect(restored.hasVisited('c')).toBe(true);
    });

    test('full traversal: A -> B via exit, B -> A via door', () => {
        const graph = new WorldGraph(worldData);
        const state = new PlayerState('a');

        // Simulate exit transition from A to B
        const exitTransition = graph.getTransitionAt('a', 4, 1);
        expect(exitTransition.toBoard).toBe('b');
        state.enterBoard('b');

        // Now on board B, find door transition back to A
        const doorTransition = graph.getTransitionAt('b', 1, 2);
        expect(doorTransition.toBoard).toBe('a');
        state.enterBoard('a');

        // Verify traversal state
        expect(state.currentBoardId).toBe('a');
        expect(state.hasVisited('a')).toBe(true);
        expect(state.hasVisited('b')).toBe(true);
    });
});
