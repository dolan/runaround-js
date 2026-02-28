import { showDialogue, hideDialogue } from '../ui/messages.js';

/**
 * Manages dialogue display and input routing.
 * When active, game input routes here instead of player movement.
 *
 * Dialogue format:
 *   { speaker: string, nodes: [{ text: string, choices?: [{ text: string, next: number }] }] }
 *
 * Simple dialogue (single text):
 *   startSimple(speaker, text)
 */
export class DialogueSystem {
    constructor() {
        this.active = false;
        this.currentDialogue = null;
        this.currentNodeIndex = 0;
        this.selectedChoice = 0;
        this.onComplete = null;
    }

    /**
     * Start a full dialogue sequence.
     * @param {Object} dialogue - { speaker, nodes: [{ text, choices? }] }
     * @param {function} [onComplete] - Called when dialogue ends
     */
    start(dialogue, onComplete) {
        this.active = true;
        this.currentDialogue = dialogue;
        this.currentNodeIndex = 0;
        this.selectedChoice = 0;
        this.onComplete = onComplete || null;
        this._render();
    }

    /**
     * Convenience for a single-line dialogue.
     * @param {string} speaker
     * @param {string} text
     * @param {function} [onComplete]
     */
    startSimple(speaker, text, onComplete) {
        this.start({
            speaker,
            nodes: [{ text }]
        }, onComplete);
    }

    /**
     * Get the current dialogue node.
     * @returns {Object|null} { text, choices? }
     */
    getCurrentNode() {
        if (!this.active || !this.currentDialogue) return null;
        return this.currentDialogue.nodes[this.currentNodeIndex] || null;
    }

    /**
     * Advance to the next node or select a choice.
     * @returns {boolean} True if dialogue is still active after advancing
     */
    advance() {
        if (!this.active) return false;

        const node = this.getCurrentNode();
        if (!node) {
            this.close();
            return false;
        }

        // If node has choices and a choice is selected, go to that node
        if (node.choices && node.choices.length > 0) {
            const choice = node.choices[this.selectedChoice];
            if (choice && choice.next !== undefined) {
                this.currentNodeIndex = choice.next;
                this.selectedChoice = 0;
                if (this.currentNodeIndex < this.currentDialogue.nodes.length) {
                    this._render();
                    return true;
                }
            }
            this.close();
            return false;
        }

        // No choices: advance to next node sequentially
        this.currentNodeIndex++;
        this.selectedChoice = 0;
        if (this.currentNodeIndex < this.currentDialogue.nodes.length) {
            this._render();
            return true;
        }

        this.close();
        return false;
    }

    /**
     * Move choice selection up.
     */
    selectPrevious() {
        const node = this.getCurrentNode();
        if (node && node.choices && node.choices.length > 0) {
            this.selectedChoice = Math.max(0, this.selectedChoice - 1);
            this._render();
        }
    }

    /**
     * Move choice selection down.
     */
    selectNext() {
        const node = this.getCurrentNode();
        if (node && node.choices && node.choices.length > 0) {
            this.selectedChoice = Math.min(node.choices.length - 1, this.selectedChoice + 1);
            this._render();
        }
    }

    /**
     * Close the dialogue immediately.
     */
    close() {
        this.active = false;
        hideDialogue();
        const cb = this.onComplete;
        this.currentDialogue = null;
        this.currentNodeIndex = 0;
        this.selectedChoice = 0;
        this.onComplete = null;
        if (cb) cb();
    }

    /**
     * Render the current dialogue state to the UI.
     */
    _render() {
        const node = this.getCurrentNode();
        if (!node) return;

        const choices = node.choices
            ? node.choices.map(c => c.text)
            : null;

        showDialogue(
            this.currentDialogue.speaker,
            node.text,
            choices,
            this.selectedChoice
        );
    }
}
