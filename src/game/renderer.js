import { TILE_SIZE, gameColors, glyphs } from './constants.js';

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
        'od': gameColors.obstacle
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
        'od': glyphs.downArrow
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

export function drawGame(ctx, board, player, viewportX, viewportY) {
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

    drawPlayer(ctx, player, viewportX, viewportY);
}
