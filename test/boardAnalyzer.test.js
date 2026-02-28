import { describe, test, expect } from 'vitest';
import { Board } from '../src/core/Board.js';
import { BoardAnalyzer } from '../src/core/BoardAnalyzer.js';

describe('BoardAnalyzer', () => {
    test('playable board is detected as playable', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w', 'w', 'w'],
                ['w', 'p', '.', 'c', '.', 'x', 'w'],
                ['w', '.', 'm', 'h', '.', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w', 'w', 'w']
            ],
            required_crystals: 1
        });
        const analyzer = new BoardAnalyzer(board);
        const result = analyzer.isPlayable();
        expect(result.isPlayable).toBe(true);
    });

    test('unreachable crystal makes board unplayable', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w', 'w', 'w'],
                ['w', 'p', '.', 'w', 'c', 'x', 'w'],
                ['w', '.', 'm', 'h', 'w', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w', 'w', 'w']
            ],
            required_crystals: 1
        });
        const analyzer = new BoardAnalyzer(board);
        const result = analyzer.isPlayable();
        expect(result.isPlayable).toBe(false);
        expect(result.reasons.length).toBeGreaterThan(0);
    });

    test('findBoardElements finds all elements', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w'],
                ['w', 'p', 'c', 'x', 'w'],
                ['w', 'm', 'h', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w']
            ],
            required_crystals: 1
        });
        const analyzer = new BoardAnalyzer(board);
        const elements = analyzer.findBoardElements();
        expect(elements.playerStart).toEqual({ x: 1, y: 1 });
        expect(elements.crystals).toEqual([{ x: 2, y: 1 }]);
        expect(elements.exit).toEqual({ x: 3, y: 1 });
        expect(elements.movableBlocks).toEqual([{ x: 1, y: 2 }]);
        expect(elements.holes).toEqual([{ x: 2, y: 2 }]);
    });

    test('isPathBetweenSimple finds direct path', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w'],
                ['w', 'p', '.', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w']
            ]
        });
        const analyzer = new BoardAnalyzer(board);
        expect(analyzer.isPathBetweenSimple(1, 1, 3, 1)).toBe(true);
    });

    test('isPathBetweenSimple detects blocked path', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w'],
                ['w', 'p', 'w', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w']
            ]
        });
        const analyzer = new BoardAnalyzer(board);
        expect(analyzer.isPathBetweenSimple(1, 1, 3, 1)).toBe(false);
    });

    test('analyzeBoard returns comprehensive analysis', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w'],
                ['w', 'p', 'c', 'x', 'w'],
                ['w', '.', '.', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w']
            ],
            required_crystals: 1
        });
        const analyzer = new BoardAnalyzer(board);
        const analysis = analyzer.analyzeBoard();
        expect(analysis.boardDimensions.width).toBe(5);
        expect(analysis.boardDimensions.height).toBe(4);
        expect(analysis.elements.crystalsCount).toBe(1);
        expect(analysis.pathAnalysis.exitReachable).toBe(true);
    });

    test('suggestFixes returns suggestions for unplayable board', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w', 'w', 'w'],
                ['w', 'p', '.', 'w', 'c', 'x', 'w'],
                ['w', '.', 'm', 'h', 'w', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w', 'w', 'w']
            ],
            required_crystals: 1
        });
        const analyzer = new BoardAnalyzer(board);
        const fixes = analyzer.suggestFixes();
        expect(fixes.length).toBeGreaterThan(0);
    });

    test('suggestFixes returns no-fix-needed for playable board', () => {
        const board = new Board({
            tiles: [
                ['w', 'w', 'w', 'w', 'w'],
                ['w', 'p', 'c', 'x', 'w'],
                ['w', '.', '.', '.', 'w'],
                ['w', 'w', 'w', 'w', 'w']
            ],
            required_crystals: 1
        });
        const analyzer = new BoardAnalyzer(board);
        const fixes = analyzer.suggestFixes();
        expect(fixes).toEqual(["Board is already playable. No fixes needed."]);
    });
});
