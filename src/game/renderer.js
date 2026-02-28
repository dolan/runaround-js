import { TILE_SIZE, gameColors, glyphs, entityColors } from './constants.js';

function getTileColor(tile) {
    const colorMap = {
        'w': gameColors.wall,
        '.': gameColors.background,
        'c': gameColors.background,
        'x': gameColors.exit,
        'm': gameColors.background,
        'h': gameColors.background,
        'ol': gameColors.obstacle,
        'or': gameColors.obstacle,
        'ou': gameColors.obstacle,
        'od': gameColors.obstacle,
        'd': gameColors.door
    };
    return colorMap[tile] || 'white';
}

function getTileGlyph(tile, player, board) {
    const glyphMap = {
        'c': glyphs.crystal,
        'x': player.crystals >= board.requiredCrystals ? glyphs.openDoor : glyphs.closedDoor,
        'm': glyphs.movable,
        'h': glyphs.hole,
        'ol': glyphs.leftArrow,
        'or': glyphs.rightArrow,
        'ou': glyphs.upArrow,
        'od': glyphs.downArrow,
        'd': glyphs.doorGlyph
    };
    return glyphMap[tile] || '';
}

function drawTile(ctx, x, y, tile, viewportX, viewportY, player, board) {
    const screenX = x * TILE_SIZE - viewportX;
    const screenY = y * TILE_SIZE - viewportY;

    ctx.fillStyle = getTileColor(tile);
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    const glyph = getTileGlyph(tile, player, board);
    if (glyph) {
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(glyph, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
    }
}

function drawPlayer(ctx, player, viewportX, viewportY) {
    const screenX = player.x * TILE_SIZE - viewportX + TILE_SIZE / 2;
    const screenY = player.y * TILE_SIZE - viewportY + TILE_SIZE / 2;

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(screenX, screenY, TILE_SIZE / 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY + TILE_SIZE / 6);
    ctx.lineTo(screenX, screenY + TILE_SIZE / 2.5);
    ctx.moveTo(screenX - TILE_SIZE / 6, screenY + TILE_SIZE / 3);
    ctx.lineTo(screenX + TILE_SIZE / 6, screenY + TILE_SIZE / 3);
    ctx.moveTo(screenX, screenY + TILE_SIZE / 2.5);
    ctx.lineTo(screenX - TILE_SIZE / 6, screenY + TILE_SIZE / 1.8);
    ctx.moveTo(screenX, screenY + TILE_SIZE / 2.5);
    ctx.lineTo(screenX + TILE_SIZE / 6, screenY + TILE_SIZE / 1.8);
    ctx.stroke();
}

/**
 * Draw all active entities within the viewport.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../entities/EntityRegistry.js').EntityRegistry} entityRegistry
 * @param {number} viewportX
 * @param {number} viewportY
 */
function drawEntities(ctx, entityRegistry, viewportX, viewportY) {
    const startX = Math.floor(viewportX / TILE_SIZE);
    const startY = Math.floor(viewportY / TILE_SIZE);
    const endX = startX + Math.ceil(ctx.canvas.width / TILE_SIZE) + 1;
    const endY = startY + Math.ceil(ctx.canvas.height / TILE_SIZE) + 1;

    for (const entity of entityRegistry.getAll()) {
        if (entity.x < startX || entity.x >= endX || entity.y < startY || entity.y >= endY) {
            continue;
        }

        const screenX = entity.x * TILE_SIZE - viewportX;
        const screenY = entity.y * TILE_SIZE - viewportY;

        // Draw colored background
        const bgColor = entity.color || entityColors[entity.type] || '#888';
        ctx.fillStyle = bgColor;
        ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

        // Draw glyph
        if (entity.glyph) {
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(entity.glyph, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
    }
}

/**
 * Draw a small indicator showing the player's facing direction.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/Player.js').Player} player
 * @param {number} viewportX
 * @param {number} viewportY
 */
function drawFacingIndicator(ctx, player, viewportX, viewportY) {
    const centerX = player.x * TILE_SIZE - viewportX + TILE_SIZE / 2;
    const centerY = player.y * TILE_SIZE - viewportY + TILE_SIZE / 2;
    const dotX = centerX + player.facing.dx * (TILE_SIZE / 2.5);
    const dotY = centerY + player.facing.dy * (TILE_SIZE / 2.5);

    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
    ctx.fill();
}

/**
 * Main draw function. Renders tiles, entities (if provided), player, and facing indicator.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../core/Board.js').Board} board
 * @param {import('../game/Player.js').Player} player
 * @param {number} viewportX
 * @param {number} viewportY
 * @param {import('../entities/EntityRegistry.js').EntityRegistry} [entityRegistry]
 */
export function drawGame(ctx, board, player, viewportX, viewportY, entityRegistry) {
    const VIEWPORT_TILES_X = ctx.canvas.width / TILE_SIZE;
    const VIEWPORT_TILES_Y = ctx.canvas.height / TILE_SIZE;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const startX = Math.floor(viewportX / TILE_SIZE);
    const startY = Math.floor(viewportY / TILE_SIZE);
    const endX = startX + VIEWPORT_TILES_X + 1;
    const endY = startY + VIEWPORT_TILES_Y + 1;

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            if (x >= 0 && x < board.width && y >= 0 && y < board.height) {
                const tile = board.getTile(x, y);
                drawTile(ctx, x, y, tile, viewportX, viewportY, player, board);
            }
        }
    }

    // Entities render between tiles and player
    if (entityRegistry) {
        drawEntities(ctx, entityRegistry, viewportX, viewportY);
    }

    drawPlayer(ctx, player, viewportX, viewportY);
    drawFacingIndicator(ctx, player, viewportX, viewportY);
}
