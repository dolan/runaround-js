import { describe, test, expect } from 'vitest';
import { PlayerState } from '../src/world/PlayerState.js';

describe('PlayerState', () => {
    test('initializes with start board as current and visited', () => {
        const state = new PlayerState('clearing');
        expect(state.currentBoardId).toBe('clearing');
        expect(state.hasVisited('clearing')).toBe(true);
        expect(state.hasVisited('cave')).toBe(false);
    });

    test('enterBoard updates current board and marks visited', () => {
        const state = new PlayerState('clearing');
        state.enterBoard('cave');
        expect(state.currentBoardId).toBe('cave');
        expect(state.hasVisited('cave')).toBe(true);
        expect(state.hasVisited('clearing')).toBe(true);
    });

    test('enterBoard is idempotent for visited set', () => {
        const state = new PlayerState('clearing');
        state.enterBoard('cave');
        state.enterBoard('clearing');
        state.enterBoard('cave');
        expect(state.visitedBoards.size).toBe(2);
    });

    test('serialize returns plain object', () => {
        const state = new PlayerState('clearing');
        state.enterBoard('cave');
        const data = state.serialize();
        expect(data.currentBoardId).toBe('cave');
        expect(data.visitedBoards).toContain('clearing');
        expect(data.visitedBoards).toContain('cave');
        expect(Array.isArray(data.visitedBoards)).toBe(true);
    });

    test('deserialize restores state correctly', () => {
        const original = new PlayerState('clearing');
        original.enterBoard('cave');
        original.enterBoard('tower');

        const restored = PlayerState.deserialize(original.serialize());
        expect(restored.currentBoardId).toBe('tower');
        expect(restored.hasVisited('clearing')).toBe(true);
        expect(restored.hasVisited('cave')).toBe(true);
        expect(restored.hasVisited('tower')).toBe(true);
        expect(restored.hasVisited('dungeon')).toBe(false);
    });
});
