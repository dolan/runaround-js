import { Board } from '../core/Board.js';
import { Player } from './Player.js';
import { drawGame } from './renderer.js';
import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './constants.js';
import { showMessage, hideMessage } from '../ui/messages.js';
import { loadBoardFromFile, saveBoardToFile } from '../ui/fileIO.js';
import { WorldGraph } from '../world/WorldGraph.js';
import { PlayerState } from '../world/PlayerState.js';
import { drawMinimap } from '../world/WorldRenderer.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let board;
let player;
let viewportX = 0;
let viewportY = 0;
let currentLevelIndex = 1;
let gameLoopRunning = false;

// World mode state
let worldGraph = null;
let playerState = null;
let transitioning = false;

const playerCallbacks = {
    onGameInfoUpdate: updateGameInfo,
    onLevelComplete: loadNextLevel,
    onResetGame: resetGame
};

function updateViewport() {
    viewportX = Math.max(0, Math.min(player.x * TILE_SIZE - VIEWPORT_WIDTH / 2, board.width * TILE_SIZE - VIEWPORT_WIDTH));
    viewportY = Math.max(0, Math.min(player.y * TILE_SIZE - VIEWPORT_HEIGHT / 2, board.height * TILE_SIZE - VIEWPORT_HEIGHT));
}

function updateGameInfo() {
    document.getElementById('crystal-count').textContent = player.crystals;
}

/**
 * Update the board name display in the game info area.
 * @param {string} name
 */
function updateBoardName(name) {
    const el = document.getElementById('board-name');
    if (el) {
        el.textContent = name || '';
    }
}

function gameLoop() {
    if (board && player) {
        updateViewport();
        drawGame(ctx, board, player, viewportX, viewportY);
        if (worldGraph && playerState) {
            drawMinimap(ctx, worldGraph, playerState);
        }
    }
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    if (worldGraph && playerState) {
        // World mode: re-enter current board (resets board state)
        enterBoard(playerState.currentBoardId);
    } else {
        initGame(board.getOriginalState());
    }
}

function killYourself() {
    showMessage('You died! The level has been reset.');
    resetGame();
}

async function loadLevelFromFile(levelIndex) {
    const response = await fetch(`levels/level${levelIndex}.json`);
    if (!response.ok) {
        throw new Error(`Level ${levelIndex} not found`);
    }
    const levelData = await response.json();
    return levelData;
}

async function loadNextLevel() {
    try {
        const levelData = await loadLevelFromFile(currentLevelIndex);
        initGame(levelData);
        currentLevelIndex++;
    } catch (error) {
        console.log('No more levels found');
        showMessage('No more levels found');
    }
}

function initGame(boardData) {
    canvas.width = VIEWPORT_WIDTH;
    canvas.height = VIEWPORT_HEIGHT;

    board = new Board(boardData);
    player = new Player(board.startX, board.startY, board);

    updateGameInfo();
    startGameLoop();
}

/**
 * Start the game loop if it's not already running.
 */
function startGameLoop() {
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        gameLoop();
    }
}

// --- World Mode ---

/**
 * Load and enter a board in world mode.
 * @param {string} boardId
 * @param {number} [destX] - Destination X (if omitted, uses board's start position)
 * @param {number} [destY] - Destination Y (if omitted, uses board's start position)
 */
async function enterBoard(boardId, destX, destY) {
    if (!worldGraph) return;

    transitioning = true;
    try {
        const boardData = await worldGraph.loadBoard(boardId);

        canvas.width = VIEWPORT_WIDTH;
        canvas.height = VIEWPORT_HEIGHT;

        board = new Board(boardData);

        // Use destination coordinates if provided, otherwise use board's start position
        const startX = destX !== undefined ? destX : board.startX;
        const startY = destY !== undefined ? destY : board.startY;

        player = new Player(startX, startY, board);
        playerState.enterBoard(boardId);

        const info = worldGraph.getBoardInfo(boardId);
        updateBoardName(info ? info.name : boardId);
        updateGameInfo();
        startGameLoop();
    } catch (error) {
        console.error(`Failed to enter board ${boardId}:`, error);
        showMessage(`Failed to load board: ${boardId}`);
    } finally {
        transitioning = false;
    }
}

/**
 * Handle a transition triggered by the player stepping on a transition tile.
 * @param {number} tileX - The tile X the player is on
 * @param {number} tileY - The tile Y the player is on
 */
function handleTransition(tileX, tileY) {
    if (!worldGraph || !playerState || transitioning) return;

    const transition = worldGraph.getTransitionAt(playerState.currentBoardId, tileX, tileY);
    if (transition) {
        enterBoard(transition.toBoard, transition.toX, transition.toY);
    }
}

/**
 * Try to load world.json and start in world mode.
 * Falls back to legacy sequential levels if world.json is not found.
 */
async function startGame() {
    try {
        const response = await fetch('levels/world.json');

        if (response.ok) {
            const worldData = await response.json();
            worldGraph = new WorldGraph(worldData);
            playerState = new PlayerState(worldGraph.getStartBoardId());
            playerCallbacks.onTransition = handleTransition;
            await enterBoard(worldGraph.getStartBoardId());
            console.log('World mode active');
            return;
        }

        if (response.status === 404) {
            console.log('No world.json found, using legacy level progression');
            worldGraph = null;
            playerState = null;
            loadNextLevel();
            return;
        }

        console.error(`Failed to load world.json: HTTP ${response.status} ${response.statusText}`);
        showMessage('Error loading world configuration. Please check world.json.');
    } catch (error) {
        console.error('Unexpected error while starting game in world mode:', error);
        showMessage('Unexpected error loading world configuration. See console for details.');
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        loadBoardFromFile(file)
            .then(boardData => {
                // Disable world mode when loading custom files
                worldGraph = null;
                playerState = null;
                delete playerCallbacks.onTransition;
                initGame(boardData);
                showMessage('Board loaded successfully!');
            })
            .catch(error => {
                console.error('Error loading board:', error);
                showMessage('Error loading board. Please try again.');
            });
    }
}

document.addEventListener('keydown', (event) => {
    if (transitioning) return;

    if (event.key == 'Enter') {
        hideMessage();
        return;
    }

    const moveMap = {
        'ArrowUp': [0, -1],
        'ArrowDown': [0, 1],
        'ArrowLeft': [-1, 0],
        'ArrowRight': [1, 0]
    };

    const [dx, dy] = moveMap[event.key] || [0, 0];
    if (dx !== 0 || dy !== 0) {
        player.move(dx, dy, playerCallbacks);
        updateViewport();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loadFile').addEventListener('change', handleFileSelect);
    document.getElementById('saveButton').addEventListener('click', () => {
        saveBoardToFile(board.getOriginalState());
    });
    document.getElementById('killButton').addEventListener('click', killYourself);
    document.getElementById('dismissButton').addEventListener('click', hideMessage);
    startGame();
});
