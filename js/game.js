const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const VIEWPORT_WIDTH = 640;
const VIEWPORT_HEIGHT = 480;
const VIEWPORT_TILES_X = VIEWPORT_WIDTH / TILE_SIZE;
const VIEWPORT_TILES_Y = VIEWPORT_HEIGHT / TILE_SIZE;

let board;
let player;
let viewportX = 0;
let viewportY = 0;

const gameColors = {
    background: '#f0f0f0',
    text: '#333333',
    gridBorder: '#666666',
    wall: '#1a4ba0',
    player: '#e63946',
    crystal: '#06d6a0',
    obstacle: '#ffd166',
    exit: '#118ab2'
};

const glyphs = {
    crystal: '💎',
    openDoor: '🚪',
    closedDoor: '🔒',
    movable: '📦',
    hole: '🕳️',
    upArrow: '↑',
    downArrow: '↓',
    leftArrow: '←',
    rightArrow: '→',
};

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.crystals = 0;
    }

    move(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (newX >= 0 && newX < board.width && newY >= 0 && newY < board.height) {
            const tile = board.getTile(newX, newY);
            switch(tile) {
                case '.':
                    this.x = newX;
                    this.y = newY;
                    break;
                case 'c':
                    this.collectCrystal(newX, newY);
                    break;
                case 'x':
                    this.tryExit();
                    break;
                case 'm':
                    this.pushMovable(newX, newY, dx, dy);
                    break;
                case 'h':
                    this.fallIntoHole();
                    break;
                case 'ol': case 'or': case 'ou': case 'od':
                    this.moveOnOneWay(newX, newY, dx, dy);
                    break;
            }
        }
    }

    collectCrystal(x, y) {
        board.removeCrystal(x, y);
        this.crystals++;
        this.x = x;
        this.y = y;
        updateGameInfo();
    }

    tryExit() {
        if (this.crystals >= board.requiredCrystals) {
            showMessage('Level Complete!');
            // Here you would load the next level
        }
    }

    pushMovable(x, y, dx, dy) {
        const pushX = x + dx;
        const pushY = y + dy;
        if (board.getTile(pushX, pushY) === '.') {
            board.setTile(pushX, pushY, 'm');
            board.setTile(x, y, '.');
            this.x = x;
            this.y = y;
        } else if (board.getTile(pushX, pushY) === 'h') {
            board.setTile(pushX, pushY, '.');
            board.setTile(x, y, '.');
            this.x = x;
            this.y = y;
        }
    }

    fallIntoHole() {
        showMessage('Game Over! You fell into a hole.');
        // Here you would reset the level
    }

    moveOnOneWay(x, y, dx, dy) {
        const tileType = board.getTile(x, y);
        if ((tileType === 'ol' && dx === -1) ||
            (tileType === 'or' && dx === 1) ||
            (tileType === 'ou' && dy === -1) ||
            (tileType === 'od' && dy === 1)) {
            this.x = x;
            this.y = y;
        }
    }
}

function updateViewport() {
    viewportX = Math.max(0, Math.min(player.x * TILE_SIZE - VIEWPORT_WIDTH / 2, board.width * TILE_SIZE - VIEWPORT_WIDTH));
    viewportY = Math.max(0, Math.min(player.y * TILE_SIZE - VIEWPORT_HEIGHT / 2, board.height * TILE_SIZE - VIEWPORT_HEIGHT));
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const startX = Math.floor(viewportX / TILE_SIZE);
    const startY = Math.floor(viewportY / TILE_SIZE);
    const endX = startX + VIEWPORT_TILES_X + 1;
    const endY = startY + VIEWPORT_TILES_Y + 1;
    
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            if (x >= 0 && x < board.width && y >= 0 && y < board.height) {
                const tile = board.getTile(x, y);
                drawTile(x, y, tile);
            }
        }
    }
    
    drawPlayer();
}

function drawTile(x, y, tile) {
    const screenX = x * TILE_SIZE - viewportX;
    const screenY = y * TILE_SIZE - viewportY;
    
    ctx.fillStyle = getTileColor(tile);
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    
    const glyph = getTileGlyph(tile);
    if (glyph) {
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(glyph, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
    }
}

function getTileColor(tile) {
    const colorMap = {
        'w': gameColors.wall,
        '.': gameColors.background,
        'c': gameColors.background,
        'x': gameColors.exit,
        'm': gameColors.background,
        'h': gameColors.background,
        'ol': gameColors.obstacle,
        'or': gameColors.obstacle,
        'ou': gameColors.obstacle,
        'od': gameColors.obstacle
    };
    return colorMap[tile] || 'white';
}

function getTileGlyph(tile) {
    const glyphMap = {
        'c': glyphs.crystal,
        'x': player.crystals >= board.requiredCrystals ? glyphs.openDoor : glyphs.closedDoor,
        'm': glyphs.movable,
        'h': glyphs.hole,
        'ol': glyphs.leftArrow,
        'or': glyphs.rightArrow,
        'ou': glyphs.upArrow,
        'od': glyphs.downArrow
    };
    return glyphMap[tile] || '';
}

function drawPlayer() {
    const screenX = player.x * TILE_SIZE - viewportX + TILE_SIZE / 2;
    const screenY = player.y * TILE_SIZE - viewportY + TILE_SIZE / 2;
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(screenX, screenY, TILE_SIZE / 5, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY + TILE_SIZE / 6);
    ctx.lineTo(screenX, screenY + TILE_SIZE / 2.5);
    ctx.moveTo(screenX - TILE_SIZE / 6, screenY + TILE_SIZE / 3);
    ctx.lineTo(screenX + TILE_SIZE / 6, screenY + TILE_SIZE / 3);
    ctx.moveTo(screenX, screenY + TILE_SIZE / 2.5);
    ctx.lineTo(screenX - TILE_SIZE / 6, screenY + TILE_SIZE / 1.8);
    ctx.moveTo(screenX, screenY + TILE_SIZE / 2.5);
    ctx.lineTo(screenX + TILE_SIZE / 6, screenY + TILE_SIZE / 1.8);
    ctx.stroke();
}

function updateGameInfo() {
    document.getElementById('crystal-count').textContent = player.crystals;
}

function gameLoop() {
    updateViewport();
    drawGame();
    requestAnimationFrame(gameLoop);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        loadBoardFromFile(file)
            .then(boardData => {
                initGame(boardData);
                showMessage('Board loaded successfully!');
            })
            .catch(error => {
                console.error('Error loading board:', error);
                showMessage('Error loading board. Please try again.');
            });
    }
}

function initGame(boardData) {
    canvas.width = VIEWPORT_WIDTH;
    canvas.height = VIEWPORT_HEIGHT;
    
    board = new Board(boardData);
    player = new Player(board.startX, board.startY);
    
    updateGameInfo();
    gameLoop();
}

document.addEventListener('keydown', (event) => {
    const moveMap = {
        'ArrowUp': [0, -1],
        'ArrowDown': [0, 1],
        'ArrowLeft': [-1, 0],
        'ArrowRight': [1, 0]
    };
    
    const [dx, dy] = moveMap[event.key] || [0, 0];
    if (dx !== 0 || dy !== 0) {
        player.move(dx, dy);
        updateViewport();
    }
});

document.getElementById('dismissButton').addEventListener('click', hideMessage);
document.getElementById('loadFile').addEventListener('change', handleFileSelect);

// Load the sample level and start the game
initGame(sampleLevel);