import { describe, test, expect, beforeEach } from 'vitest';
import { updateInventory, setSlotClickHandler, resetCache } from '../src/ui/SidebarRenderer.js';
import { Inventory } from '../src/entities/Inventory.js';

beforeEach(() => {
    document.body.innerHTML = `
        <div id="inventory-grid"></div>
        <div id="inventory-selected"></div>
    `;
    resetCache();
});

describe('Inventory Selection', () => {
    test('selected slot gets selected class', () => {
        const inv = new Inventory();
        inv.add('health_potion', 1);
        inv.add('gold_key', 1);
        updateInventory(inv, 1);
        const slots = document.querySelectorAll('.inventory-slot');
        expect(slots[0].classList.contains('selected')).toBe(false);
        expect(slots[1].classList.contains('selected')).toBe(true);
    });

    test('selected item name shown below grid', () => {
        const inv = new Inventory();
        inv.add('health_potion', 2);
        updateInventory(inv, 0);
        const el = document.getElementById('inventory-selected');
        expect(el.textContent).toContain('health potion');
        expect(el.textContent).toContain('[E] use');
    });

    test('no selected text when slot is empty', () => {
        const inv = new Inventory();
        updateInventory(inv, 3);
        const el = document.getElementById('inventory-selected');
        expect(el.textContent).toBe('');
    });

    test('no selected text when selectedIndex is -1', () => {
        const inv = new Inventory();
        inv.add('sword', 1);
        updateInventory(inv, -1);
        const el = document.getElementById('inventory-selected');
        expect(el.textContent).toBe('');
    });

    test('clicking slot calls slot click handler', () => {
        let clickedIndex = -1;
        setSlotClickHandler((i) => { clickedIndex = i; });

        const inv = new Inventory();
        updateInventory(inv, 0);
        const slots = document.querySelectorAll('.inventory-slot');
        slots[4].click();
        expect(clickedIndex).toBe(4);
    });

    test('clicking different slots reports correct indices', () => {
        const clicked = [];
        setSlotClickHandler((i) => { clicked.push(i); });

        const inv = new Inventory();
        updateInventory(inv, 0);
        const slots = document.querySelectorAll('.inventory-slot');
        slots[0].click();
        slots[8].click();
        slots[3].click();
        expect(clicked).toEqual([0, 8, 3]);
    });
});
