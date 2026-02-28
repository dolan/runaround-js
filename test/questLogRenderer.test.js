import { describe, test, expect, vi } from 'vitest';
import { drawQuestLog } from '../src/ui/QuestLogRenderer.js';

function makeMockCtx() {
    return {
        canvas: { width: 400, height: 300 },
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        fillRect: vi.fn(),
        fillText: vi.fn()
    };
}

function makeMockQuestSystem(active = [], completed = []) {
    return {
        getActiveQuests: () => active,
        getCompletedQuests: () => completed
    };
}

describe('QuestLogRenderer', () => {
    test('draws background overlay', () => {
        const ctx = makeMockCtx();
        const qs = makeMockQuestSystem();
        drawQuestLog(ctx, qs);
        expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 400, 300);
    });

    test('draws title', () => {
        const ctx = makeMockCtx();
        const qs = makeMockQuestSystem();
        drawQuestLog(ctx, qs);
        const calls = ctx.fillText.mock.calls;
        expect(calls.some(c => c[0] === 'Quest Log')).toBe(true);
    });

    test('draws "No quests yet" when empty', () => {
        const ctx = makeMockCtx();
        const qs = makeMockQuestSystem();
        drawQuestLog(ctx, qs);
        const calls = ctx.fillText.mock.calls;
        expect(calls.some(c => c[0] === 'No quests yet.')).toBe(true);
    });

    test('draws active quest name and stage description', () => {
        const ctx = makeMockCtx();
        const qs = makeMockQuestSystem([
            { id: 'q1', name: 'Find the Key', description: 'Find it', stageDescription: 'Search the cave' }
        ]);
        drawQuestLog(ctx, qs);
        const calls = ctx.fillText.mock.calls;
        expect(calls.some(c => c[0] === 'Find the Key')).toBe(true);
        expect(calls.some(c => c[0] === 'Search the cave')).toBe(true);
    });

    test('draws completed quest with [Complete] tag', () => {
        const ctx = makeMockCtx();
        const qs = makeMockQuestSystem([], [
            { id: 'q1', name: 'Old Quest' }
        ]);
        drawQuestLog(ctx, qs);
        const calls = ctx.fillText.mock.calls;
        expect(calls.some(c => c[0] === 'Old Quest  [Complete]')).toBe(true);
    });

    test('draws footer', () => {
        const ctx = makeMockCtx();
        const qs = makeMockQuestSystem();
        drawQuestLog(ctx, qs);
        const calls = ctx.fillText.mock.calls;
        expect(calls.some(c => c[0] === 'Press Q to close')).toBe(true);
    });
});
