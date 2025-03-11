class BoardAnalyzer {
    constructor(board) {
        this.board = board;
        this.width = board.width;
        this.height = board.height;
    }

    /**
     * Determines if the board is playable
     * @returns {Object} Result with isPlayable flag and detailed reasons if not playable
     */
    isPlayable() {
        const result = {
            isPlayable: true,
            reasons: []
        };

        // Find all important elements on the board
        const elements = this.findBoardElements();
        
        // Check if player can reach all crystals
        for (const crystal of elements.crystals) {
            if (!this.isPathBetween(elements.playerStart.x, elements.playerStart.y, crystal.x, crystal.y)) {
                result.isPlayable = false;
                result.reasons.push(`Player cannot reach crystal at (${crystal.x}, ${crystal.y})`);
            }
        }

        // Check if player can reach exit after collecting all crystals
        if (elements.exit && !this.isPathBetween(elements.playerStart.x, elements.playerStart.y, elements.exit.x, elements.exit.y)) {
            result.isPlayable = false;
            result.reasons.push(`Player cannot reach exit at (${elements.exit.x}, ${elements.exit.y})`);
        }

        // Check if there are enough movable blocks to fill holes that block critical paths
        const criticalHoles = this.findCriticalHoles(elements);
        if (criticalHoles.length > elements.movableBlocks.length) {
            result.isPlayable = false;
            result.reasons.push(`Not enough movable blocks (${elements.movableBlocks.length}) to fill critical holes (${criticalHoles.length})`);
        }

        // Check if each critical hole can be filled by a movable block
        for (const hole of criticalHoles) {
            let canBeFilled = false;
            for (const block of elements.movableBlocks) {
                if (this.canPushBlockToHole(elements.playerStart, block, hole)) {
                    canBeFilled = true;
                    break;
                }
            }
            if (!canBeFilled) {
                result.isPlayable = false;
                result.reasons.push(`Hole at (${hole.x}, ${hole.y}) cannot be filled by any movable block`);
            }
        }

        return result;
    }

    /**
     * Finds all important elements on the board
     * @returns {Object} Object containing arrays of all important elements
     */
    findBoardElements() {
        const elements = {
            playerStart: { x: this.board.startX, y: this.board.startY },
            crystals: [],
            holes: [],
            movableBlocks: [],
            exit: null
        };

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.board.getTile(x, y);
                switch (tile) {
                    case 'c':
                        elements.crystals.push({ x, y });
                        break;
                    case 'h':
                        elements.holes.push({ x, y });
                        break;
                    case 'm':
                        elements.movableBlocks.push({ x, y });
                        break;
                    case 'x':
                        elements.exit = { x, y };
                        break;
                }
            }
        }

        return elements;
    }

    /**
     * Determines if there is a walkable path between two points using A* algorithm
     * @param {number} startX - Starting X coordinate
     * @param {number} startY - Starting Y coordinate
     * @param {number} endX - Ending X coordinate
     * @param {number} endY - Ending Y coordinate
     * @returns {boolean} True if a path exists, false otherwise
     */
    isPathBetween(startX, startY, endX, endY) {
        // A* algorithm implementation
        const openSet = [];
        const closedSet = new Set();
        const start = { x: startX, y: startY, f: 0, g: 0, h: 0 };
        
        // Calculate heuristic (Manhattan distance)
        const heuristic = (x, y) => Math.abs(x - endX) + Math.abs(y - endY);
        
        start.h = heuristic(startX, startY);
        start.f = start.g + start.h;
        openSet.push(start);

        while (openSet.length > 0) {
            // Find node with lowest f score
            let lowestIndex = 0;
            for (let i = 0; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestIndex].f) {
                    lowestIndex = i;
                }
            }
            
            const current = openSet[lowestIndex];
            
            // If we reached the end, return true
            if (current.x === endX && current.y === endY) {
                return true;
            }
            
            // Remove current from openSet and add to closedSet
            openSet.splice(lowestIndex, 1);
            closedSet.add(`${current.x},${current.y}`);
            
            // Check all neighbors
            const neighbors = this.getWalkableNeighbors(current.x, current.y);
            
            for (const neighbor of neighbors) {
                // Skip if already evaluated
                if (closedSet.has(`${neighbor.x},${neighbor.y}`)) {
                    continue;
                }
                
                // Calculate g score (distance from start)
                const tentativeG = current.g + 1;
                
                // Check if neighbor is in openSet
                let inOpenSet = false;
                for (let i = 0; i < openSet.length; i++) {
                    if (openSet[i].x === neighbor.x && openSet[i].y === neighbor.y) {
                        inOpenSet = true;
                        // If this path is better, update it
                        if (tentativeG < openSet[i].g) {
                            openSet[i].g = tentativeG;
                            openSet[i].f = openSet[i].g + openSet[i].h;
                        }
                        break;
                    }
                }
                
                // If not in openSet, add it
                if (!inOpenSet) {
                    neighbor.g = tentativeG;
                    neighbor.h = heuristic(neighbor.x, neighbor.y);
                    neighbor.f = neighbor.g + neighbor.h;
                    openSet.push(neighbor);
                }
            }
        }
        
        // No path found
        return false;
    }

    /**
     * Gets all walkable neighbors of a tile
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Array} Array of walkable neighbor coordinates
     */
    getWalkableNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 1, dy: 0 },  // Right
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }  // Left
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (this.isWalkable(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }

    /**
     * Determines if a tile is walkable
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if walkable, false otherwise
     */
    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        const tile = this.board.getTile(x, y);
        return tile === '.' || tile === 'c' || tile === 'x' || 
               tile === 'm' || // Movable blocks are walkable in path finding
               tile === 'ol' || tile === 'or' || tile === 'ou' || tile === 'od'; // One-way doors are walkable
    }

    /**
     * Finds holes that block critical paths (paths to crystals or exit)
     * @param {Object} elements - Board elements
     * @returns {Array} Array of critical holes
     */
    findCriticalHoles(elements) {
        const criticalHoles = [];
        
        // Create a temporary board without holes to find ideal paths
        const tempBoard = this.createTempBoardWithoutHoles();
        const tempAnalyzer = new BoardAnalyzer(tempBoard);
        
        // Check each hole to see if it blocks a path to a crystal or exit
        for (const hole of elements.holes) {
            // Check if hole blocks path to any crystal
            for (const crystal of elements.crystals) {
                if (!this.isPathBetween(elements.playerStart.x, elements.playerStart.y, crystal.x, crystal.y) &&
                    tempAnalyzer.isPathBetween(elements.playerStart.x, elements.playerStart.y, crystal.x, crystal.y)) {
                    criticalHoles.push(hole);
                    break;
                }
            }
            
            // Check if hole blocks path to exit
            if (elements.exit && 
                !this.isPathBetween(elements.playerStart.x, elements.playerStart.y, elements.exit.x, elements.exit.y) &&
                tempAnalyzer.isPathBetween(elements.playerStart.x, elements.playerStart.y, elements.exit.x, elements.exit.y)) {
                if (!criticalHoles.some(h => h.x === hole.x && h.y === hole.y)) {
                    criticalHoles.push(hole);
                }
            }
        }
        
        return criticalHoles;
    }

    /**
     * Creates a temporary board with holes replaced by empty spaces
     * @returns {Board} Temporary board
     */
    createTempBoardWithoutHoles() {
        const tempBoardData = {
            tiles: JSON.parse(JSON.stringify(this.board.tiles)),
            required_crystals: this.board.requiredCrystals
        };
        
        // Replace holes with empty spaces
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (tempBoardData.tiles[y][x] === 'h') {
                    tempBoardData.tiles[y][x] = '.';
                }
            }
        }
        
        // Create a new board
        const tempBoard = new Board(tempBoardData);
        
        // Set the start position to match the original board
        tempBoard.startX = this.board.startX;
        tempBoard.startY = this.board.startY;
        
        return tempBoard;
    }

    /**
     * Determines if a block can be pushed to a hole
     * @param {Object} playerStart - Player starting position
     * @param {Object} block - Block position
     * @param {Object} hole - Hole position
     * @returns {boolean} True if block can be pushed to hole, false otherwise
     */
    canPushBlockToHole(playerStart, block, hole) {
        // Check if player can reach the block
        if (!this.isPathBetween(playerStart.x, playerStart.y, block.x, block.y)) {
            return false;
        }
        
        // Check if block can be pushed to hole
        return this.canPushBlockInDirection(block, hole);
    }

    /**
     * Determines if a block can be pushed in a direction that would lead to a hole
     * @param {Object} block - Block position
     * @param {Object} hole - Hole position
     * @returns {boolean} True if block can be pushed to hole, false otherwise
     */
    canPushBlockInDirection(block, hole) {
        // Check all four directions
        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 1, dy: 0 },  // Right
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }  // Left
        ];
        
        for (const dir of directions) {
            // Position where player would need to stand to push block
            const playerX = block.x - dir.dx;
            const playerY = block.y - dir.dy;
            
            // Position where block would end up
            const targetX = block.x + dir.dx;
            const targetY = block.y + dir.dy;
            
            // Check if player position is valid and walkable
            if (playerX >= 0 && playerX < this.width && playerY >= 0 && playerY < this.height &&
                this.isWalkable(playerX, playerY)) {
                
                // Check if target position is the hole
                if (targetX === hole.x && targetY === hole.y) {
                    return true;
                }
                
                // Check if target position is empty and there's a path from there to the hole
                if (this.isWalkable(targetX, targetY) && 
                    this.board.getTile(targetX, targetY) !== 'm' && // Not another block
                    this.isPathBetween(targetX, targetY, hole.x, hole.y)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Provides a detailed analysis of the board
     * @returns {Object} Detailed analysis of the board
     */
    analyzeBoard() {
        const elements = this.findBoardElements();
        const analysis = {
            boardDimensions: {
                width: this.width,
                height: this.height
            },
            elements: {
                playerStart: elements.playerStart,
                crystalsCount: elements.crystals.length,
                crystals: elements.crystals,
                holesCount: elements.holes.length,
                holes: elements.holes,
                movableBlocksCount: elements.movableBlocks.length,
                movableBlocks: elements.movableBlocks,
                exit: elements.exit
            },
            requiredCrystals: this.board.requiredCrystals,
            pathAnalysis: {
                reachableCrystals: [],
                unreachableCrystals: [],
                exitReachable: elements.exit ? this.isPathBetween(elements.playerStart.x, elements.playerStart.y, elements.exit.x, elements.exit.y) : false
            },
            blockAnalysis: {
                reachableBlocks: [],
                unreachableBlocks: [],
                pushableToHole: []
            },
            criticalHoles: []
        };

        // Analyze paths to crystals
        for (const crystal of elements.crystals) {
            const reachable = this.isPathBetween(elements.playerStart.x, elements.playerStart.y, crystal.x, crystal.y);
            if (reachable) {
                analysis.pathAnalysis.reachableCrystals.push(crystal);
            } else {
                analysis.pathAnalysis.unreachableCrystals.push(crystal);
            }
        }

        // Analyze blocks
        for (const block of elements.movableBlocks) {
            const reachable = this.isPathBetween(elements.playerStart.x, elements.playerStart.y, block.x, block.y);
            if (reachable) {
                analysis.blockAnalysis.reachableBlocks.push(block);
            } else {
                analysis.blockAnalysis.unreachableBlocks.push(block);
            }

            // Check if block can be pushed to any hole
            for (const hole of elements.holes) {
                if (this.canPushBlockToHole(elements.playerStart, block, hole)) {
                    analysis.blockAnalysis.pushableToHole.push({
                        block,
                        hole
                    });
                    break;
                }
            }
        }

        // Find critical holes
        analysis.criticalHoles = this.findCriticalHoles(elements);

        return analysis;
    }

    /**
     * Suggests fixes for an unplayable board
     * @returns {Array} Array of suggested fixes
     */
    suggestFixes() {
        const result = this.isPlayable();
        if (result.isPlayable) {
            return ["Board is already playable. No fixes needed."];
        }

        const analysis = this.analyzeBoard();
        const suggestions = [];

        // Check for unreachable crystals
        if (analysis.pathAnalysis.unreachableCrystals.length > 0) {
            suggestions.push("Unreachable crystals detected. Consider:");
            analysis.pathAnalysis.unreachableCrystals.forEach(crystal => {
                suggestions.push(`- Create a path to the crystal at (${crystal.x}, ${crystal.y})`);
            });
            suggestions.push("- Or reduce the required crystal count");
        }

        // Check for unreachable exit
        if (!analysis.pathAnalysis.exitReachable) {
            suggestions.push("Exit is unreachable. Consider creating a path to the exit.");
        }

        // Check for critical holes without pushable blocks
        if (analysis.criticalHoles.length > analysis.blockAnalysis.pushableToHole.length) {
            suggestions.push("Not enough pushable blocks for critical holes. Consider:");
            suggestions.push(`- Add more movable blocks (need at least ${analysis.criticalHoles.length})`);
            suggestions.push("- Reduce the number of holes blocking critical paths");
            suggestions.push("- Create alternative paths that don't require filling holes");
        }

        // Check for unreachable blocks
        if (analysis.blockAnalysis.unreachableBlocks.length > 0) {
            suggestions.push("Some blocks are unreachable. Consider:");
            analysis.blockAnalysis.unreachableBlocks.forEach(block => {
                suggestions.push(`- Create a path to the block at (${block.x}, ${block.y})`);
            });
        }

        // Check for blocks that can't be pushed to holes
        const unpushableBlocks = analysis.elements.movableBlocks.length - analysis.blockAnalysis.pushableToHole.length;
        if (unpushableBlocks > 0) {
            suggestions.push("Some blocks can't be pushed to any hole. Consider:");
            suggestions.push("- Rearrange blocks and holes to allow pushing");
            suggestions.push("- Ensure there's space around blocks for the player to push them");
        }

        return suggestions;
    }
}

// Export the BoardAnalyzer class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BoardAnalyzer };
} 