/**
 * Persistent player state that carries across board transitions.
 * Crystals are board-local and NOT tracked here.
 */
export class PlayerState {
    /**
     * @param {string} startBoardId - The initial board ID
     */
    constructor(startBoardId) {
        this.currentBoardId = startBoardId;
        this.visitedBoards = new Set([startBoardId]);
    }

    /**
     * Update state when entering a new board.
     * @param {string} boardId - The board being entered
     */
    enterBoard(boardId) {
        this.currentBoardId = boardId;
        this.visitedBoards.add(boardId);
    }

    /**
     * Check if a board has been visited.
     * @param {string} boardId
     * @returns {boolean}
     */
    hasVisited(boardId) {
        return this.visitedBoards.has(boardId);
    }

    /**
     * Serialize to a plain object for save games.
     * @returns {Object}
     */
    serialize() {
        return {
            currentBoardId: this.currentBoardId,
            visitedBoards: [...this.visitedBoards]
        };
    }

    /**
     * Restore from a serialized object.
     * @param {Object} data
     * @returns {PlayerState}
     */
    static deserialize(data) {
        const state = new PlayerState(data.currentBoardId);
        state.visitedBoards = new Set(data.visitedBoards);
        return state;
    }
}
