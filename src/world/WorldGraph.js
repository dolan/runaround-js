import { Transition } from './Transition.js';

/**
 * Graph data structure representing a connected world of boards.
 * Nodes are boards, edges are transitions between them.
 */
export class WorldGraph {
    /**
     * @param {Object} worldData - Parsed world.json data
     */
    constructor(worldData) {
        this.startBoardId = worldData.startBoard;
        this.boards = worldData.boards;

        /** @type {Map<string, Transition>} Key: "boardId:x:y" -> Transition */
        this.transitionIndex = new Map();

        /** @type {Map<string, Object>} Cache of fetched board JSON data */
        this.boardCache = new Map();

        // Build the transition index for O(1) lookups
        for (const t of worldData.transitions) {
            const transition = new Transition(t.from, t.to);
            this.transitionIndex.set(transition.key, transition);
        }
    }

    /**
     * Get metadata for a board.
     * @param {string} boardId
     * @returns {Object|null} { file, name, gridPosition } or null
     */
    getBoardInfo(boardId) {
        return this.boards[boardId] || null;
    }

    /**
     * O(1) lookup for a transition at a specific tile position.
     * @param {string} boardId
     * @param {number} x
     * @param {number} y
     * @returns {Transition|null}
     */
    getTransitionAt(boardId, x, y) {
        return this.transitionIndex.get(`${boardId}:${x}:${y}`) || null;
    }

    /**
     * Get all outgoing transitions from a board.
     * @param {string} boardId
     * @returns {Transition[]}
     */
    getTransitionsForBoard(boardId) {
        const transitions = [];
        for (const transition of this.transitionIndex.values()) {
            if (transition.fromBoard === boardId) {
                transitions.push(transition);
            }
        }
        return transitions;
    }

    /**
     * Get all board IDs directly connected to a board.
     * @param {string} boardId
     * @returns {string[]}
     */
    getConnectedBoards(boardId) {
        const connected = new Set();
        for (const transition of this.transitionIndex.values()) {
            if (transition.fromBoard === boardId) {
                connected.add(transition.toBoard);
            }
            if (transition.toBoard === boardId) {
                connected.add(transition.fromBoard);
            }
        }
        return [...connected];
    }

    /**
     * Fetch and cache board JSON data. Returns a deep copy so board state
     * resets on re-entry.
     * @param {string} boardId
     * @returns {Promise<Object>} Deep copy of the board JSON data
     */
    async loadBoard(boardId) {
        const info = this.getBoardInfo(boardId);
        if (!info) {
            throw new Error(`Unknown board: ${boardId}`);
        }

        if (!this.boardCache.has(boardId)) {
            const response = await fetch(info.file);
            if (!response.ok) {
                throw new Error(`Failed to load board file: ${info.file}`);
            }
            const data = await response.json();
            this.boardCache.set(boardId, data);
        }

        // Return a deep copy so each visit gets fresh board state
        return JSON.parse(JSON.stringify(this.boardCache.get(boardId)));
    }

    /**
     * Get all board IDs in the world.
     * @returns {string[]}
     */
    getAllBoardIds() {
        return Object.keys(this.boards);
    }

    /**
     * Get all transitions in the world.
     * @returns {Transition[]}
     */
    getAllTransitions() {
        return [...this.transitionIndex.values()];
    }

    /**
     * Get the starting board ID.
     * @returns {string}
     */
    getStartBoardId() {
        return this.startBoardId;
    }
}
