import { describe, test, expect, beforeEach } from 'vitest';
import { updateHealth, updateCrystals, updateBoardName, updateInventory, updateQuests, resetCache } from '../src/ui/SidebarRenderer.js';
import { Inventory } from '../src/entities/Inventory.js';
import { itemGlyphs } from '../src/game/constants.js';

/** Set up sidebar DOM elements before each test. */
beforeEach(() => {
    document.body.innerHTML = `
        <div id="sidebar-health"></div>
        <div id="crystal-display"></div>
        <div id="board-name-display"></div>
        <div id="inventory-grid"></div>
        <div id="inventory-selected"></div>
        <div id="quest-tracker"></div>
    `;
    resetCache();
});

describe('SidebarRenderer', () => {
    describe('updateHealth', () => {
        test('renders correct number of hearts', () => {
            updateHealth(2, 3);
            const el = document.getElementById('sidebar-health');
            expect(el.children.length).toBe(3);
        });

        test('full hearts match current health', () => {
            updateHealth(1, 3);
            const hearts = Array.from(document.getElementById('sidebar-health').children)
                .map(s => s.textContent);
            expect(hearts[0]).toBe('❤️');
            expect(hearts[1]).toBe('🖤');
            expect(hearts[2]).toBe('🖤');
        });

        test('all hearts full at max health', () => {
            updateHealth(3, 3);
            const hearts = Array.from(document.getElementById('sidebar-health').children)
                .map(s => s.textContent);
            expect(hearts.every(h => h === '❤️')).toBe(true);
        });

        test('all hearts empty at zero health', () => {
            updateHealth(0, 3);
            const hearts = Array.from(document.getElementById('sidebar-health').children)
                .map(s => s.textContent);
            expect(hearts.every(h => h === '🖤')).toBe(true);
        });
    });

    describe('updateCrystals', () => {
        test('shows crystal count when required > 0', () => {
            updateCrystals(2, 5);
            const el = document.getElementById('crystal-display');
            expect(el.textContent).toBe('💎 2/5');
            expect(el.style.display).not.toBe('none');
        });

        test('hides when required is 0', () => {
            updateCrystals(0, 0);
            const el = document.getElementById('crystal-display');
            expect(el.style.display).toBe('none');
        });

        test('hides when required is undefined', () => {
            updateCrystals(0, undefined);
            const el = document.getElementById('crystal-display');
            expect(el.style.display).toBe('none');
        });
    });

    describe('updateBoardName', () => {
        test('sets text content', () => {
            updateBoardName('The Clearing');
            const el = document.getElementById('board-name-display');
            expect(el.textContent).toBe('The Clearing');
        });

        test('handles empty name', () => {
            updateBoardName('');
            const el = document.getElementById('board-name-display');
            expect(el.textContent).toBe('');
        });

        test('handles null name', () => {
            updateBoardName(null);
            const el = document.getElementById('board-name-display');
            expect(el.textContent).toBe('');
        });
    });

    describe('updateInventory', () => {
        test('creates 9 slot buttons', () => {
            const inv = new Inventory();
            updateInventory(inv);
            const grid = document.getElementById('inventory-grid');
            expect(grid.querySelectorAll('.inventory-slot').length).toBe(9);
        });

        test('shows glyph and count for items', () => {
            const inv = new Inventory();
            inv.add('health_potion', 2);
            updateInventory(inv);
            const slots = document.getElementById('inventory-grid').querySelectorAll('.inventory-slot');
            // First slot should have the potion glyph
            expect(slots[0].textContent).toContain('🧪');
            expect(slots[0].textContent).toContain('2');
        });

        test('uses fallback glyph for unknown items', () => {
            const inv = new Inventory();
            inv.add('mystery_orb', 1);
            updateInventory(inv);
            const slots = document.getElementById('inventory-grid').querySelectorAll('.inventory-slot');
            expect(slots[0].textContent).toContain('📦');
        });

        test('empty slots have empty class', () => {
            const inv = new Inventory();
            updateInventory(inv);
            const slots = document.getElementById('inventory-grid').querySelectorAll('.inventory-slot.empty');
            expect(slots.length).toBe(9);
        });

        test('selected slot has selected class', () => {
            const inv = new Inventory();
            inv.add('gold_key', 1);
            updateInventory(inv, 0);
            const slots = document.getElementById('inventory-grid').querySelectorAll('.inventory-slot');
            expect(slots[0].classList.contains('selected')).toBe(true);
            expect(slots[1].classList.contains('selected')).toBe(false);
        });

        test('shows selected item name', () => {
            const inv = new Inventory();
            inv.add('health_potion', 1);
            updateInventory(inv, 0);
            const el = document.getElementById('inventory-selected');
            expect(el.textContent).toContain('health potion');
            expect(el.textContent).toContain('[E] use');
        });
    });

    describe('updateQuests', () => {
        /** Create a minimal mock QuestSystem. */
        function mockQuestSystem(quests) {
            return { getActiveQuests: () => quests };
        }

        test('renders active quest names', () => {
            const qs = mockQuestSystem([
                { id: 'q1', name: 'Find the Key', stageDescription: 'Talk to the elder' }
            ]);
            updateQuests(qs);
            const el = document.getElementById('quest-tracker');
            expect(el.querySelector('.quest-name').textContent).toBe('Find the Key');
            expect(el.querySelector('.quest-objective').textContent).toBe('Talk to the elder');
        });

        test('shows empty message when no quests active', () => {
            const qs = mockQuestSystem([]);
            updateQuests(qs);
            const el = document.getElementById('quest-tracker');
            expect(el.textContent).toContain('No active quests');
        });

        test('renders multiple quests', () => {
            const qs = mockQuestSystem([
                { id: 'q1', name: 'Quest A', stageDescription: 'Obj A' },
                { id: 'q2', name: 'Quest B', stageDescription: 'Obj B' }
            ]);
            updateQuests(qs);
            const el = document.getElementById('quest-tracker');
            expect(el.querySelectorAll('.quest-item').length).toBe(2);
        });
    });

    describe('itemGlyphs (from constants)', () => {
        test('has glyphs for common items', () => {
            expect(itemGlyphs.health_potion).toBe('🧪');
            expect(itemGlyphs.gold_key).toBe('🗝️');
        });

        test('is a plain object', () => {
            expect(typeof itemGlyphs).toBe('object');
        });
    });
});
