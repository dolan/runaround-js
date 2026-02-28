import { NPC } from './NPC.js';
import { Enemy } from './Enemy.js';
import { Item } from './Item.js';
import { InteractiveObject } from './InteractiveObject.js';
import { Entity } from './Entity.js';

/** Default glyphs per entity type */
const defaultGlyphs = {
    npc: '🧑',
    enemy: '👾',
    item: '✨',
    interactive: '❓'
};

/** Default glyphs for interactive object subtypes */
const interactiveGlyphs = {
    sign: '🪧',
    chest: '📦',
    lever: '🔲'
};

/** Default colors per entity type */
const defaultColors = {
    npc: '#4a90d9',
    enemy: '#d94a4a',
    item: '#d9d94a',
    interactive: '#8B4513'
};

/**
 * Create an entity from a JSON definition.
 * @param {Object} def - Entity definition from board JSON
 * @param {string} def.id
 * @param {string} def.type - 'npc' | 'enemy' | 'item' | 'interactive'
 * @param {number} def.x
 * @param {number} def.y
 * @param {string} [def.glyph]
 * @param {string} [def.color]
 * @param {Object} [def.properties]
 * @returns {Entity}
 */
export function createEntity(def) {
    const config = {
        ...def,
        glyph: def.glyph || getDefaultGlyph(def),
        color: def.color || defaultColors[def.type] || '',
        properties: def.properties || {}
    };

    switch (def.type) {
        case 'npc':
            return new NPC(config);
        case 'enemy':
            return new Enemy(config);
        case 'item':
            return new Item(config);
        case 'interactive':
            return new InteractiveObject(config);
        default:
            return new Entity(config);
    }
}

/**
 * Get the default glyph for a definition.
 * @param {Object} def
 * @returns {string}
 */
function getDefaultGlyph(def) {
    if (def.type === 'interactive' && def.properties && def.properties.objectType) {
        return interactiveGlyphs[def.properties.objectType] || defaultGlyphs.interactive;
    }
    return defaultGlyphs[def.type] || '';
}
