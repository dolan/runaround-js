export const TILE_SIZE = 32;
export const VIEWPORT_WIDTH = 640;
export const VIEWPORT_HEIGHT = 480;
export const VIEWPORT_TILES_X = VIEWPORT_WIDTH / TILE_SIZE;
export const VIEWPORT_TILES_Y = VIEWPORT_HEIGHT / TILE_SIZE;

export const gameColors = {
    background: '#f0f0f0',
    text: '#333333',
    gridBorder: '#666666',
    wall: '#1a4ba0',
    player: '#e63946',
    crystal: '#06d6a0',
    obstacle: '#ffd166',
    exit: '#118ab2',
    door: '#8B4513'
};

export const glyphs = {
    crystal: '💎',
    openDoor: '🚪',
    closedDoor: '🔒',
    movable: '📦',
    hole: '🕳️',
    upArrow: '↑',
    downArrow: '↓',
    leftArrow: '←',
    rightArrow: '→',
    doorGlyph: '🚪',
};

export const entityColors = {
    npc: '#4a90d9',
    enemy: '#d94a4a',
    item: '#d9d94a',
    interactive: '#8B4513'
};

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

export const FALLBACK_GLYPH = '📦';
