import { NPC } from './NPC.js';
import { Enemy } from './Enemy.js';
import { Item } from './Item.js';
import { InteractiveObject } from './InteractiveObject.js';
import { Entity } from './Entity.js';
import { AnimationState } from '../game/AnimationState.js';

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
        properties: def.properties || {},
        spriteId: def.spriteId || null
    };

    let entity;
    switch (def.type) {
        case 'npc':
            entity = new NPC(config);
            break;
        case 'enemy':
            entity = new Enemy(config);
            break;
        case 'item':
            entity = new Item(config);
            break;
        case 'interactive':
            entity = new InteractiveObject(config);
            break;
        default:
            entity = new Entity(config);
    }

    // Create animation state if spriteId is defined
    if (entity.spriteId) {
        entity.animState = new AnimationState(entity.spriteId, def.defaultAnimation || 'idle');
    }

    return entity;
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
