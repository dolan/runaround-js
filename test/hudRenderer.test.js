import { describe, test, expect, vi, beforeEach } from 'vitest';
import { drawHealth, drawInventory, drawHud, itemGlyphs } from '../src/ui/HudRenderer.js';
import { Inventory } from '../src/entities/Inventory.js';

/** Create a mock canvas 2D context. */
function createMockCtx() {
    return {
        canvas: { width: 640, height: 480 },
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        fillRect: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn(() => ({ width: 40 }))
    };
}

describe('HudRenderer', () => {
    let ctx;

    beforeEach(() => {
        ctx = createMockCtx();
    });

    describe('drawHealth', () => {
        test('draws background rect', () => {
            drawHealth(ctx, 3, 3);
            expect(ctx.fillRect).toHaveBeenCalled();
            // First fillRect call is the background
            const bgCall = ctx.fillRect.mock.calls[0];
            expect(bgCall[0]).toBe(10); // PADDING
            expect(bgCall[1]).toBe(10); // PADDING
        });

        test('draws correct number of hearts', () => {
            drawHealth(ctx, 2, 3);
            // 3 hearts total (fillText calls)
            expect(ctx.fillText).toHaveBeenCalledTimes(3);
        });

        test('full hearts match current health', () => {
            drawHealth(ctx, 1, 3);
            const hearts = ctx.fillText.mock.calls.map(c => c[0]);
            expect(hearts[0]).toBe('❤️');
            expect(hearts[1]).toBe('🖤');
            expect(hearts[2]).toBe('🖤');
        });

        test('all hearts full at max health', () => {
            drawHealth(ctx, 3, 3);
            const hearts = ctx.fillText.mock.calls.map(c => c[0]);
            expect(hearts.every(h => h === '❤️')).toBe(true);
        });

        test('all hearts empty at zero health', () => {
            drawHealth(ctx, 0, 3);
            const hearts = ctx.fillText.mock.calls.map(c => c[0]);
            expect(hearts.every(h => h === '🖤')).toBe(true);
        });
    });

    describe('drawInventory', () => {
        test('does not draw when inventory is empty', () => {
            const inv = new Inventory();
            drawInventory(ctx, inv);
            expect(ctx.fillRect).not.toHaveBeenCalled();
            expect(ctx.fillText).not.toHaveBeenCalled();
        });

        test('draws background and items when inventory has items', () => {
            const inv = new Inventory();
            inv.add('health_potion', 2);
            drawInventory(ctx, inv);
            expect(ctx.fillRect).toHaveBeenCalledTimes(1); // background
            expect(ctx.fillText).toHaveBeenCalledTimes(1); // one item entry
        });

        test('renders correct glyph and count', () => {
            const inv = new Inventory();
            inv.add('health_potion', 3);
            drawInventory(ctx, inv);
            const text = ctx.fillText.mock.calls[0][0];
            expect(text).toBe('🧪×3');
        });

        test('uses fallback glyph for unknown items', () => {
            const inv = new Inventory();
            inv.add('mystery_orb', 1);
            drawInventory(ctx, inv);
            const text = ctx.fillText.mock.calls[0][0];
            expect(text).toBe('📦×1');
        });

        test('renders multiple items', () => {
            const inv = new Inventory();
            inv.add('health_potion', 2);
            inv.add('gold_key', 1);
            drawInventory(ctx, inv);
            expect(ctx.fillText).toHaveBeenCalledTimes(2);
        });

        test('positions at bottom-left of canvas', () => {
            const inv = new Inventory();
            inv.add('health_potion', 1);
            drawInventory(ctx, inv);
            // Background rect y should be near bottom
            const bgCall = ctx.fillRect.mock.calls[0];
            expect(bgCall[0]).toBe(10); // PADDING from left
            expect(bgCall[1]).toBeGreaterThan(400); // near bottom of 480px canvas
        });
    });

    describe('drawHud', () => {
        test('draws both health and inventory', () => {
            const player = { health: 2, maxHealth: 3 };
            const inv = new Inventory();
            inv.add('gold_key', 1);

            drawHud(ctx, player, inv);

            // Should have fillRect calls for health bg + inventory bg
            expect(ctx.fillRect).toHaveBeenCalledTimes(2);
            // Should have fillText for 3 hearts + 1 item
            expect(ctx.fillText).toHaveBeenCalledTimes(4);
        });

        test('draws only health when inventory is empty', () => {
            const player = { health: 3, maxHealth: 3 };
            const inv = new Inventory();

            drawHud(ctx, player, inv);

            // Only health background
            expect(ctx.fillRect).toHaveBeenCalledTimes(1);
            // 3 hearts only
            expect(ctx.fillText).toHaveBeenCalledTimes(3);
        });
    });

    describe('itemGlyphs', () => {
        test('has glyphs for common items', () => {
            expect(itemGlyphs.health_potion).toBe('🧪');
            expect(itemGlyphs.gold_key).toBe('🗝️');
        });

        test('is a plain object', () => {
            expect(typeof itemGlyphs).toBe('object');
        });
    });
});
