/**
 * Transition types for board-to-board connections.
 * EXIT: crystal-gated exit tile ('x') — requires all crystals collected.
 * DOOR: freely-walkable door tile ('d') — immediate transition.
 */
export const TransitionType = {
    EXIT: 'exit',
    DOOR: 'door'
};

/**
 * Represents a one-way transition from a tile on one board to a tile on another board.
 */
export class Transition {
    /**
     * @param {Object} from - Source location { board, x, y, type }
     * @param {Object} to - Destination location { board, x, y }
     */
    constructor(from, to) {
        this.fromBoard = from.board;
        this.fromX = from.x;
        this.fromY = from.y;
        this.type = from.type || TransitionType.DOOR;
        this.toBoard = to.board;
        this.toX = to.x;
        this.toY = to.y;
    }

    /**
     * Returns the lookup key for fast transition index.
     * @returns {string} Key in format "boardId:x:y"
     */
    get key() {
        return `${this.fromBoard}:${this.fromX}:${this.fromY}`;
    }
}
