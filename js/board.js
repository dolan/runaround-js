class Board {
    constructor(data) {
        if (!data || !data.tiles || !Array.isArray(data.tiles) || data.tiles.length === 0) {
            throw new Error("Invalid board data");
        }
        this.originalTiles = JSON.parse(JSON.stringify(data.tiles)); // Deep copy of original tiles
        this.tiles = JSON.parse(JSON.stringify(data.tiles)); // Create a separate copy for current state
        this.width = this.tiles[0].length;
        this.height = this.tiles.length;
        this.requiredCrystals = data.required_crystals || 0;
        this.startX = 0;
        this.startY = 0;
        this.findStartPosition();
    }

    findStartPosition() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] === 'p') {
                    this.startX = x;
                    this.startY = y;
                    this.tiles[y][x] = '.'; // Replace 'p' with an empty tile
                    return;
                }
            }
        }
        // If no 'p' is found, find the first empty space
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] === '.') {
                    this.startX = x;
                    this.startY = y;
                    return;
                }
            }
        }
        // If no empty space is found, throw an error
        throw new Error("No valid starting position found on the board");
    }

    reset() {
        if (!this.originalTiles) {
            throw new Error("Original tiles are not defined");
        }
        this.tiles = JSON.parse(JSON.stringify(this.originalTiles));
        this.player.crystals = 0;
        this.findStartPosition();
    }

    getOriginalState() {
        return {
            tiles: this.originalTiles,
            required_crystals: this.requiredCrystals
        };
    }

    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[y][x];
        }
        return null;
    }

    setTile(x, y, value) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y][x] = value;
        }
    }

    removeCrystal(x, y) {
        if (this.getTile(x, y) === 'c') {
            this.setTile(x, y, '.');
        }
    }
}

// Sample level data
const sampleLevel = {
    tiles: [
        ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],
        ['w', 'p', '.', '.', 'm', '.', '.', '.', '.', '.', '.', 'w', 'w', 'w', 'w', 'w', 'w', 'w', '.', '.', '.', 'w'],
        ['w', '.', 'ol', '.', 'or', '.', '.', '.', '.', '.', '.', '.', 'w', 'w', 'w', 'w', 'w', 'w', '.', '.', '.', 'w'],
        ['w', 'c', 'ou', 'h', 'od', 'c', 'w', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'od', 'w'],
        ['w', '.', 'm', '.', 'm', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'w', 'c', 'w'],
        ['w', '.', '.', '.', '.', 'x', 'w', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'w'],
        ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w']
    ],
    required_crystals: 3
};