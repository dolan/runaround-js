import { Board } from '../core/Board.js';
import { Player } from './Player.js';
import { drawGame } from './renderer.js';
import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './constants.js';
import { showMessage, hideMessage } from '../ui/messages.js';
import { loadBoardFromFile, saveBoardToFile } from '../ui/fileIO.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let board;
let player;
let viewportX = 0;
let viewportY = 0;
let currentLevelIndex = 1;

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

function gameLoop() {
    updateViewport();
    drawGame(ctx, board, player, viewportX, viewportY);
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    initGame(board.getOriginalState());
    board.findStartPosition();
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
        updateViewport();
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
    gameLoop();
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

document.addEventListener('keydown', (event) => {
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
    loadNextLevel();
});
