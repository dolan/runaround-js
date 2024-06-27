class Board {
    constructor(width, height, data = null) {
        if (data) {
            this.loadFromData(data);
        } else {
            this.width = width;
            this.height = height;
            this.tiles = Array(height).fill().map(() => Array(width).fill(0));
            this.requiredCrystals = 0;
            this.crystals = [];
            this.movableBlocks = [];
            this.oneWayDoors = [];
            this.holes = [];
        }
    }

    loadFromData(data) {
        this.width = data.tiles[0].length;
        this.height = data.tiles.length;
        this.tiles = data.tiles;
        this.requiredCrystals = data.required_crystals;
        this.crystals = data.crystals || [];
        this.movableBlocks = data.movable_blocks || [];
        this.oneWayDoors = data.one_way_doors || [];
        this.holes = data.holes || [];
        
        // Rebuild arrays if they're not in the data
        if (this.crystals.length === 0 || this.movableBlocks.length === 0 || 
            this.oneWayDoors.length === 0 || this.holes.length === 0) {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const tile = this.tiles[y][x];
                    if (tile === 2) {
                        this.crystals.push({x, y});
                    } else if (tile === 3) {
                        this.movableBlocks.push({x, y});
                    } else if (tile >= 5 && tile <= 8) {
                        this.oneWayDoors.push({x, y, direction: tile - 5});
                    } else if (tile === 9) {
                        this.holes.push({x, y});
                    }
                }
            }
        }
    }

    setTile(x, y, value) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y][x] = value;
        }
    }

    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[y][x];
        }
        return null;
    }

    addCrystal(x, y) {
        this.crystals.push({x, y});
        this.setTile(x, y, 2);
    }

    removeCrystal(x, y) {
        const index = this.crystals.findIndex(crystal => crystal.x === x && crystal.y === y);
        if (index !== -1) {
            this.crystals.splice(index, 1);
            this.setTile(x, y, 0);
        }
    }

    addMovableBlock(x, y) {
        this.movableBlocks.push({x, y});
        this.setTile(x, y, 3);
    }

    moveBlock(fromX, fromY, toX, toY) {
        const blockIndex = this.movableBlocks.findIndex(block => block.x === fromX && block.y === fromY);
        if (blockIndex !== -1) {
            this.movableBlocks[blockIndex] = {x: toX, y: toY};
            this.setTile(fromX, fromY, 0);
            this.setTile(toX, toY, 3);
            return true;
        }
        return false;
    }

    removeBlock(x, y) {
        const index = this.movableBlocks.findIndex(block => block.x === x && block.y === y);
        if (index !== -1) {
            this.movableBlocks.splice(index, 1);
            this.setTile(x, y, 0);
        }
    }

    addOneWayDoor(x, y, direction) {
        this.oneWayDoors.push({x, y, direction});
        this.setTile(x, y, 5 + direction);
    }

    addHole(x, y) {
        this.holes.push({x, y});
        this.setTile(x, y, 9);
    }

    setRequiredCrystals(count) {
        this.requiredCrystals = count;
    }
}

function saveBoardToFile() {
    const boardData = {
        tiles: board.tiles,
        required_crystals: board.requiredCrystals,
        crystals: board.crystals,
        movable_blocks: board.movableBlocks,
        one_way_doors: board.oneWayDoors,
        holes: board.holes
    };

    const jsonString = JSON.stringify(boardData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'board.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Add event listener for save button
document.getElementById('saveButton').addEventListener('click', saveBoardToFile);