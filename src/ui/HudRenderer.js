/**
 * Canvas-based HUD overlay for health and inventory display.
 * Follows the minimap pattern: semi-transparent backgrounds drawn on the canvas.
 */

const PADDING = 10;
const HUD_BG = 'rgba(0, 0, 0, 0.5)';
const HEART_FULL = '❤️';
const HEART_EMPTY = '🖤';
const HEART_SIZE = 20;
const HEART_GAP = 4;
const ITEM_FONT_SIZE = 18;
const ITEM_GAP = 12;

/** @type {Object<string, string>} */
export const itemGlyphs = {
    health_potion: '🧪',
    gold_key: '🗝️',
    sword: '⚔️',
    shield: '🛡️',
    bow: '🏹',
    coin: '🪙',
    gem: '💎',
    scroll: '📜',
    ring: '💍',
    lantern: '🔦',
    rare_crystal: '💎',
    elder_amulet: '🧿'
};

const FALLBACK_GLYPH = '📦';

/**
 * Get the display glyph for an item ID.
 * @param {string} itemId
 * @returns {string}
 */
function getItemGlyph(itemId) {
    return itemGlyphs[itemId] || FALLBACK_GLYPH;
}

/**
 * Draw health display in the top-left corner.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} health - Current health
 * @param {number} maxHealth - Maximum health
 */
export function drawHealth(ctx, health, maxHealth) {
    const heartCount = maxHealth;
    const totalWidth = heartCount * HEART_SIZE + (heartCount - 1) * HEART_GAP + PADDING * 2;
    const totalHeight = HEART_SIZE + PADDING * 2;

    // Background
    ctx.fillStyle = HUD_BG;
    ctx.fillRect(PADDING, PADDING, totalWidth, totalHeight);

    // Hearts
    ctx.font = `${HEART_SIZE}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < heartCount; i++) {
        const glyph = i < health ? HEART_FULL : HEART_EMPTY;
        const x = PADDING + PADDING + i * (HEART_SIZE + HEART_GAP) + HEART_SIZE / 2;
        const y = PADDING + PADDING + HEART_SIZE / 2;
        ctx.fillText(glyph, x, y);
    }
}

/**
 * Draw inventory display in the bottom-left corner.
 * Only renders when inventory is non-empty.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../entities/Inventory.js').Inventory} inventory
 */
export function drawInventory(ctx, inventory) {
    const items = inventory.getAll();
    if (items.length === 0) return;

    ctx.font = `${ITEM_FONT_SIZE}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Measure each item entry to calculate total width
    const entries = items.map(({ itemId, count }) => {
        const glyph = getItemGlyph(itemId);
        const label = `${glyph}×${count}`;
        const width = ctx.measureText(label).width;
        return { label, width };
    });

    const totalWidth = entries.reduce((sum, e) => sum + e.width, 0)
        + (entries.length - 1) * ITEM_GAP
        + PADDING * 2;
    const totalHeight = ITEM_FONT_SIZE + PADDING * 2;

    const x = PADDING;
    const y = ctx.canvas.height - totalHeight - PADDING;

    // Background
    ctx.fillStyle = HUD_BG;
    ctx.fillRect(x, y, totalWidth, totalHeight);

    // Items
    ctx.fillStyle = 'white';
    let cursorX = x + PADDING;
    const textY = y + PADDING + ITEM_FONT_SIZE / 2;

    for (let i = 0; i < entries.length; i++) {
        ctx.fillText(entries[i].label, cursorX, textY);
        cursorX += entries[i].width + ITEM_GAP;
    }
}

/**
 * Draw the full HUD overlay (health + inventory).
 * Call after all other rendering in the game loop.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/Player.js').Player} player
 * @param {import('../entities/Inventory.js').Inventory} inventory
 */
export function drawHud(ctx, player, inventory) {
    drawHealth(ctx, player.health, player.maxHealth);
    drawInventory(ctx, inventory);
}
