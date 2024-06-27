const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;

let board;
let player;
let viewportX = 0;
let viewportY = 0;

const gameColors = [
    '#f0f0f0', // 0: Empty space (Light Gray)
    '#1a4ba0', // 1: Wall (Dark Blue)
    '#06d6a0', // 2: Crystal (Turquoise)
    '#f0f0f0', // 3: Movable block (Light Gray)
    '#118ab2', // 4: Exit (Blue)
    '#ffd166', // 5-8: One-way doors (Yellow, Orange, Red, Pink)
    '#ffd166', 
    '#ffd166', 
    '#ffd166', 
    '#f0f0f0'  // 9: Hole (Light Gray)
];

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
            if (tile === 0 || tile === 2 || tile === 4) { // Empty space, crystal, or exit
                this.x = newX;
                this.y = newY;
                if (tile === 2) {
                    this.collectCrystal(newX, newY);
                } else if (tile === 4 && this.crystals >= board.requiredCrystals) {
                    showMessage('Level Complete!');
                    // Add level completion logic here
                }
            } else if (tile === 3) { // Movable block
                const pushX = newX + dx;
                const pushY = newY + dy;
                if (pushX >= 0 && pushX < board.width && pushY >= 0 && pushY < board.height) {
                    const pushTile = board.getTile(pushX, pushY);
                    if (pushTile === 0) { // Can push the block
                        board.moveBlock(newX, newY, pushX, pushY);
                        this.x = newX;
                        this.y = newY;
                    } else if (pushTile === 9) { // Push block into hole
                        board.removeBlock(newX, newY);
                        board.setTile(pushX, pushY, 0); // Fill the hole
                        this.x = newX;
                        this.y = newY;
                    }
                }
            } else if (tile >= 5 && tile <= 8) { // One-way door
                const direction = tile - 5;
                if ((direction === 0 && dy === -1) || // Up
                    (direction === 1 && dx === 1) ||  // Right
                    (direction === 2 && dy === 1) ||  // Down
                    (direction === 3 && dx === -1)) { // Left
                    this.x = newX;
                    this.y = newY;
                }
            }
        }
    }

    collectCrystal(x, y) {
        board.removeCrystal(x, y);
        this.crystals++;
        updateGameInfo();
    }
}

async function loadBoardFromApp(levelName) {
    try {
        const response = await fetch(`levels/${levelName}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not load the board file:", error);
        showMessage('Failed to load level data, using random board instead.');
        initGame();
    }
}

function loadBoardFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

function initGame(boardData = null) {
    canvas.width = VIEWPORT_WIDTH;
    canvas.height = VIEWPORT_HEIGHT;
    
    if (boardData) {
        board = new Board(0, 0, boardData);
    } else {
        board = new Board(50, 50);
        
        // Initialize board with some walls, crystals, blocks, and holes
        for (let i = 0; i < 100; i++) {
            const x = Math.floor(Math.random() * board.width);
            const y = Math.floor(Math.random() * board.height);
            board.setTile(x, y, 1); // Add walls
        }
        
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * board.width);
            const y = Math.floor(Math.random() * board.height);
            if (board.getTile(x, y) === 0) board.addCrystal(x, y);
        }
        
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * board.width);
            const y = Math.floor(Math.random() * board.height);
            if (board.getTile(x, y) === 0) board.addMovableBlock(x, y);
        }
        
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * board.width);
            const y = Math.floor(Math.random() * board.height);
            if (board.getTile(x, y) === 0) board.addHole(x, y);
        }
        
        // Add exit
        const exitX = Math.floor(Math.random() * board.width);
        const exitY = Math.floor(Math.random() * board.height);
        board.setTile(exitX, exitY, 4);
        
        board.setRequiredCrystals(10);
    }
    
    // Find a valid starting position for the player
    let playerX, playerY;
    do {
        playerX = Math.floor(Math.random() * board.width);
        playerY = Math.floor(Math.random() * board.height);
    } while (board.getTile(playerX, playerY) !== 0);
    
    player = new Player(playerX, playerY);
    
    updateGameInfo();
    gameLoop();
}

function gameLoop() {
    updateViewport();
    drawGame();
    requestAnimationFrame(gameLoop);
}

function updateViewport() {
    viewportX = Math.max(0, Math.min(player.x * TILE_SIZE - VIEWPORT_WIDTH / 2, board.width * TILE_SIZE - VIEWPORT_WIDTH));
    viewportY = Math.max(0, Math.min(player.y * TILE_SIZE - VIEWPORT_HEIGHT / 2, board.height * TILE_SIZE - VIEWPORT_HEIGHT));
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw tiles
    for (let y = 0; y < board.height; y++) {
        for (let x = 0; x < board.width; x++) {
            const screenX = x * TILE_SIZE - viewportX;
            const screenY = y * TILE_SIZE - viewportY;
            
            if (screenX >= -TILE_SIZE && screenX <= VIEWPORT_WIDTH && screenY >= -TILE_SIZE && screenY <= VIEWPORT_HEIGHT) {
                const tile = board.getTile(x, y);
                ctx.fillStyle = gameColors[tile];
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = `bold ${TILE_SIZE * 0.7}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                switch (tile) {
                    case 2: // Crystal
                        ctx.fillText('💎', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                        break;
                    case 3: // Movable block
                        ctx.fillText('📦', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                        break;
                    case 4: // Exit
                        ctx.fillText(player.crystals >= board.requiredCrystals ? '🚪' : '🔒', 
                                     screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                        break;
                    case 5: // One-way door (Up)
                        ctx.fillText('↑', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                        break;
                    case 6: // One-way door (Right)
                        ctx.fillText('→', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                        break;
                    case 7: // One-way door (Down)
                        ctx.fillText('↓', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                        break;
                    case 8: // One-way door (Left)
                        ctx.fillText('←', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                        break;
                    case 9: // Hole
                        ctx.fillText('⚫', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                        break;
                }
            }
        }
    }
    
    // Draw player (stick figure)
    const playerScreenX = player.x * TILE_SIZE - viewportX;
    const playerScreenY = player.y * TILE_SIZE - viewportY;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    // Head
    ctx.beginPath();
    ctx.arc(playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 5, TILE_SIZE / 10, 0, Math.PI * 2);
    ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.moveTo(playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 5);
    ctx.lineTo(playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE * 4/5);
    ctx.stroke();
    // Arms
    ctx.beginPath();
    ctx.moveTo(playerScreenX + TILE_SIZE / 4, playerScreenY + TILE_SIZE / 2);
    ctx.lineTo(playerScreenX + TILE_SIZE * 3/4, playerScreenY + TILE_SIZE / 2);
    ctx.stroke();
    // Legs
    ctx.beginPath();
    ctx.moveTo(playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE * 4/5);
    ctx.lineTo(playerScreenX + TILE_SIZE / 4, playerScreenY + TILE_SIZE);
    ctx.moveTo(playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE * 4/5);
    ctx.lineTo(playerScreenX + TILE_SIZE * 3/4, playerScreenY + TILE_SIZE);
    ctx.stroke();
}

function updateGameInfo() {
    const crystalCount = document.getElementById('crystal-count');
    const requiredCrystals = document.getElementById('required-crystals');
    if (crystalCount && requiredCrystals) {
        crystalCount.textContent = `Crystals: ${player.crystals}`;
        requiredCrystals.textContent = `Required: ${board.requiredCrystals}`;
    }
}

function handleKeyDown(e) {
    switch (e.key) {
        case 'ArrowUp':
            player.move(0, -1);
            break;
        case 'ArrowDown':
            player.move(0, 1);
            break;
        case 'ArrowLeft':
            player.move(-1, 0);
            break;
        case 'ArrowRight':
            player.move(1, 0);
            break;
    }
}

function handleFileLoad(event) {
    const file = event.target.files[0];
    if (file) {
        loadBoardFromFile(file)
            .then(boardData => {
                initGame(boardData);
            })
            .catch(error => {
                console.error("Error loading board file:", error);
                showMessage("Failed to load board file. Using random board instead.");
                initGame();
            });
    }
}

function handleLevelSelect(event) {
    const levelName = event.target.value;
    if (levelName) {
        loadBoardFromApp(levelName)
            .then(boardData => {
                if (boardData) {
                    initGame(boardData);
                } else {
                    throw new Error("Failed to load level data");
                }
            })
            .catch(error => {
                console.error("Error loading level:", error);
                showMessage("Failed to load level. Using random board instead.");
                initGame();
            });
    }
}

function showMessage(message, duration = 3000) {
    const messageElement = document.getElementById('message');
    if (!messageElement) {
        const newMessageElement = document.createElement('div');
        newMessageElement.id = 'message';
        newMessageElement.style.position = 'absolute';
        newMessageElement.style.top = '10px';
        newMessageElement.style.left = '50%';
        newMessageElement.style.transform = 'translateX(-50%)';
        newMessageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        newMessageElement.style.color = 'white';
        newMessageElement.style.padding = '10px';
        newMessageElement.style.borderRadius = '5px';
        newMessageElement.style.zIndex = '1000';
        newMessageElement.style.display = 'none';
        document.body.appendChild(newMessageElement);
    }

    const element = document.getElementById('message');
    element.textContent = message;
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
    }, duration);
}

function initialize() {
    const loadFileInput = document.getElementById('loadFile');
    const levelSelect = document.getElementById('levelSelect');

    if (loadFileInput) {
        loadFileInput.addEventListener('change', handleFileLoad);
    }

    if (levelSelect) {
        levelSelect.addEventListener('change', handleLevelSelect);
    }

    document.addEventListener('keydown', handleKeyDown);

    initGame();
}

// Wait for the DOM to be fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', initialize);