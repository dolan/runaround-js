import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DialogueSystem } from '../src/entities/DialogueSystem.js';

describe('DialogueSystem', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="messagePanel" style="display: none;">
                <div id="messageText"></div>
                <button id="dismissButton"></button>
            </div>
        `;
    });

    test('starts inactive', () => {
        const ds = new DialogueSystem();
        expect(ds.active).toBe(false);
        expect(ds.getCurrentNode()).toBeNull();
    });

    test('startSimple activates with single node', () => {
        const ds = new DialogueSystem();
        ds.startSimple('Bob', 'Hello!');
        expect(ds.active).toBe(true);
        expect(ds.getCurrentNode().text).toBe('Hello!');
    });

    test('advance through single node closes dialogue', () => {
        const ds = new DialogueSystem();
        const onComplete = vi.fn();
        ds.startSimple('Bob', 'Hello!', onComplete);

        const stillActive = ds.advance();
        expect(stillActive).toBe(false);
        expect(ds.active).toBe(false);
        expect(onComplete).toHaveBeenCalled();
    });

    test('advance through multi-node dialogue', () => {
        const ds = new DialogueSystem();
        ds.start({
            speaker: 'Elder',
            nodes: [
                { text: 'First line' },
                { text: 'Second line' },
                { text: 'Third line' }
            ]
        });

        expect(ds.getCurrentNode().text).toBe('First line');

        expect(ds.advance()).toBe(true);
        expect(ds.getCurrentNode().text).toBe('Second line');

        expect(ds.advance()).toBe(true);
        expect(ds.getCurrentNode().text).toBe('Third line');

        expect(ds.advance()).toBe(false);
        expect(ds.active).toBe(false);
    });

    test('choice selection and branching', () => {
        const ds = new DialogueSystem();
        ds.start({
            speaker: 'Guard',
            nodes: [
                {
                    text: 'Who goes there?',
                    choices: [
                        { text: 'A friend', next: 1 },
                        { text: 'None of your business', next: 2 }
                    ]
                },
                { text: 'Welcome, friend!' },
                { text: 'How rude!' }
            ]
        });

        expect(ds.selectedChoice).toBe(0);

        // Select second choice
        ds.selectNext();
        expect(ds.selectedChoice).toBe(1);

        // Advance with choice selected
        expect(ds.advance()).toBe(true);
        expect(ds.getCurrentNode().text).toBe('How rude!');

        expect(ds.advance()).toBe(false);
    });

    test('selectPrevious clamps to 0', () => {
        const ds = new DialogueSystem();
        ds.start({
            speaker: 'NPC',
            nodes: [{
                text: 'Choose:',
                choices: [
                    { text: 'A', next: 1 },
                    { text: 'B', next: 1 }
                ]
            }, { text: 'Done' }]
        });

        ds.selectPrevious();
        expect(ds.selectedChoice).toBe(0);
    });

    test('selectNext clamps to last choice', () => {
        const ds = new DialogueSystem();
        ds.start({
            speaker: 'NPC',
            nodes: [{
                text: 'Choose:',
                choices: [
                    { text: 'A', next: 1 },
                    { text: 'B', next: 1 }
                ]
            }, { text: 'Done' }]
        });

        ds.selectNext();
        ds.selectNext();
        ds.selectNext();
        expect(ds.selectedChoice).toBe(1);
    });

    test('close resets state', () => {
        const ds = new DialogueSystem();
        const onComplete = vi.fn();
        ds.start({
            speaker: 'NPC',
            nodes: [{ text: 'Hi' }, { text: 'Bye' }]
        }, onComplete);

        ds.close();
        expect(ds.active).toBe(false);
        expect(ds.currentDialogue).toBeNull();
        expect(onComplete).toHaveBeenCalled();
    });

    test('showDialogue renders to DOM', () => {
        const ds = new DialogueSystem();
        ds.startSimple('Elder', 'Welcome, traveler!');

        const panel = document.getElementById('messagePanel');
        const text = document.getElementById('messageText');
        expect(panel.style.display).toBe('flex');
        expect(text.innerHTML).toContain('Elder');
        expect(text.innerHTML).toContain('Welcome, traveler!');
    });

    test('hideDialogue hides panel', () => {
        const ds = new DialogueSystem();
        ds.startSimple('Bob', 'Hi');
        ds.close();

        const panel = document.getElementById('messagePanel');
        expect(panel.style.display).toBe('none');
    });
});
