/**
 * DOM-based sidebar panel updates.
 * Replaces canvas HUD overlays with sidebar elements.
 */

import { itemGlyphs, FALLBACK_GLYPH } from '../game/constants.js';

// Cache previous state to avoid unnecessary DOM updates
let _prevHealth = -1;
let _prevMaxHealth = -1;
let _prevCrystals = -1;
let _prevRequired = -1;
let _prevBoardName = null;
let _prevInventoryKey = null;
let _prevQuestKey = null;

/**
 * Update the health display in the sidebar.
 * Renders emoji hearts: ❤️ for full, 🖤 for empty.
 * @param {number} health
 * @param {number} maxHealth
 */
export function updateHealth(health, maxHealth) {
    if (health === _prevHealth && maxHealth === _prevMaxHealth) return;
    _prevHealth = health;
    _prevMaxHealth = maxHealth;

    const el = document.getElementById('sidebar-health');
    if (!el) return;

    el.textContent = '';
    for (let i = 0; i < maxHealth; i++) {
        const span = document.createElement('span');
        span.textContent = i < health ? '❤️' : '🖤';
        el.appendChild(span);
    }
}

/**
 * Update the crystal count display.
 * Shows "💎 X/Y" when required > 0. Hides entirely when required is 0 or unset.
 * @param {number} current
 * @param {number} required
 */
export function updateCrystals(current, required) {
    if (current === _prevCrystals && required === _prevRequired) return;
    _prevCrystals = current;
    _prevRequired = required;

    const el = document.getElementById('crystal-display');
    if (!el) return;

    if (!required) {
        el.style.display = 'none';
        return;
    }
    el.style.display = '';
    el.textContent = '💎 ' + current + '/' + required;
}

/**
 * Update the board name display in the sidebar status section.
 * @param {string} name
 */
export function updateBoardName(name) {
    if (name === _prevBoardName) return;
    _prevBoardName = name;

    const el = document.getElementById('board-name-display');
    if (!el) return;
    el.textContent = name || '';
}

/**
 * Get the display glyph for an item ID.
 * @param {string} itemId
 * @returns {string}
 */
function getItemGlyph(itemId) {
    return itemGlyphs[itemId] || FALLBACK_GLYPH;
}

/**
 * Update the inventory grid in the sidebar.
 * Renders a 3×3 grid of slots. Items show glyph + count.
 * @param {import('../entities/Inventory.js').Inventory} inventory
 * @param {number} [selectedIndex=-1] - Currently selected slot
 */
export function updateInventory(inventory, selectedIndex = -1) {
    const items = inventory.getAll();
    // Build a cache key from items + selection to skip no-op updates
    const key = items.map(i => i.itemId + ':' + i.count).join(',') + '|' + selectedIndex;
    if (key === _prevInventoryKey) return;
    _prevInventoryKey = key;

    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.textContent = '';

    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('button');
        slot.className = 'inventory-slot';
        if (i === selectedIndex) {
            slot.classList.add('selected');
        }

        if (items[i]) {
            const glyph = getItemGlyph(items[i].itemId);
            slot.textContent = glyph + '×' + items[i].count;
        } else {
            slot.classList.add('empty');
            slot.textContent = String(i + 1);
        }

        const keyLabel = document.createElement('span');
        keyLabel.className = 'inventory-slot-key';
        keyLabel.textContent = String(i + 1);
        slot.appendChild(keyLabel);

        grid.appendChild(slot);
    }

    // Selected item name
    const selectedEl = document.getElementById('inventory-selected');
    if (!selectedEl) return;
    if (selectedIndex >= 0 && items[selectedIndex]) {
        const name = items[selectedIndex].itemId.replace(/_/g, ' ');
        selectedEl.textContent = name + '  [E] use';
    } else {
        selectedEl.textContent = '';
    }
}

/**
 * Update the quest tracker in the sidebar.
 * Shows active quests with current objective.
 * @param {import('../events/QuestSystem.js').QuestSystem} questSystem
 */
export function updateQuests(questSystem) {
    const quests = questSystem.getActiveQuests();
    const key = quests.map(q => q.id + ':' + q.stageDescription).join(',');
    if (key === _prevQuestKey) return;
    _prevQuestKey = key;

    const el = document.getElementById('quest-tracker');
    if (!el) return;
    el.textContent = '';

    if (quests.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'No active quests';
        empty.style.color = '#555';
        empty.style.fontSize = '10px';
        el.appendChild(empty);
        return;
    }

    for (const quest of quests) {
        const item = document.createElement('div');
        item.className = 'quest-item';

        const name = document.createElement('div');
        name.className = 'quest-name';
        name.textContent = quest.name;
        item.appendChild(name);

        if (quest.stageDescription) {
            const obj = document.createElement('div');
            obj.className = 'quest-objective';
            obj.textContent = quest.stageDescription;
            item.appendChild(obj);
        }

        el.appendChild(item);
    }
}

/**
 * Reset cached state, forcing full re-render on next update.
 * Call when entering a new board or resetting the game.
 */
export function resetCache() {
    _prevHealth = -1;
    _prevMaxHealth = -1;
    _prevCrystals = -1;
    _prevRequired = -1;
    _prevBoardName = null;
    _prevInventoryKey = null;
    _prevQuestKey = null;
}
