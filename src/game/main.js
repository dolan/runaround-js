import { Board } from '../core/Board.js';
import { Player } from './Player.js';
import { drawGame } from './renderer.js';
import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './constants.js';
import { showMessage, hideMessage } from '../ui/messages.js';
import { loadBoardFromFile, saveBoardToFile } from '../ui/fileIO.js';
import { WorldGraph } from '../world/WorldGraph.js';
import { PlayerState } from '../world/PlayerState.js';
import { drawMinimap } from '../world/WorldRenderer.js';
import { EntityRegistry } from '../entities/EntityRegistry.js';
import { createEntity } from '../entities/EntityFactory.js';
import { Inventory } from '../entities/Inventory.js';
import { DialogueSystem } from '../entities/DialogueSystem.js';
import { drawHud } from '../ui/HudRenderer.js';
import { EventBus, GameEvents } from '../events/EventBus.js';
import { WorldState } from '../events/WorldState.js';
import { TriggerSystem } from '../events/TriggerSystem.js';
import { QuestSystem } from '../events/QuestSystem.js';
import { WorldReactor } from '../events/WorldReactor.js';
import { drawQuestLog } from '../ui/QuestLogRenderer.js';

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

// Entity system state
let entityRegistry = new EntityRegistry();
let inventory = new Inventory();
let dialogueSystem = new DialogueSystem();

// Event system state
let eventBus = new EventBus();
let worldState = new WorldState(eventBus);
let questLogVisible = false;

// Getter-based context so TriggerSystem/QuestSystem/WorldReactor always see current refs
const gameContext = {
    get inventory() { return inventory; },
    get entityRegistry() { return entityRegistry; },
    get dialogueSystem() { return dialogueSystem; },
    get questSystem() { return questSystem; }
};

let triggerSystem = new TriggerSystem(eventBus, worldState, gameContext);
let questSystem = new QuestSystem(eventBus, worldState, gameContext);
let worldReactor = new WorldReactor(eventBus, worldState, gameContext);

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
    const healthEl = document.getElementById('health-display');
    if (healthEl) {
        healthEl.textContent = `Health: ${player.health}/${player.maxHealth}`;
    }
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
        drawGame(ctx, board, player, viewportX, viewportY, entityRegistry);
        drawHud(ctx, player, inventory);
        if (worldGraph && playerState) {
            drawMinimap(ctx, worldGraph, playerState);
        }
        if (questLogVisible && questSystem) {
            drawQuestLog(ctx, questSystem);
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

    // Load entities from board data (backward-compatible: entities key is optional)
    entityRegistry = loadEntities(boardData);

    updateGameInfo();
    startGameLoop();
}

/**
 * Load entities from board data into a new EntityRegistry.
 * @param {Object} boardData
 * @returns {EntityRegistry}
 */
function loadEntities(boardData) {
    if (boardData.entities && Array.isArray(boardData.entities)) {
        return EntityRegistry.fromDefinitions(boardData.entities, createEntity);
    }
    return new EntityRegistry();
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
        player.health = 3; // Reset health on board entry
        playerState.enterBoard(boardId);

        // Load entities from board data
        entityRegistry = loadEntities(boardData);

        // Load board-specific triggers (clear previous board's triggers first)
        triggerSystem.clearTriggersBySource('board');
        if (boardData.triggers) {
            triggerSystem.registerTriggers(boardData.triggers, 'board');
        }

        const info = worldGraph.getBoardInfo(boardId);
        updateBoardName(info ? info.name : boardId);
        updateGameInfo();
        startGameLoop();

        // Emit BOARD_ENTER after everything is loaded so WorldReactor/QuestSystem can react
        eventBus.emit(GameEvents.BOARD_ENTER, { boardId });
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
    inventory = new Inventory();
    dialogueSystem = new DialogueSystem();
    questLogVisible = false;

    // Reset event system
    eventBus = new EventBus();
    worldState = new WorldState(eventBus);
    triggerSystem = new TriggerSystem(eventBus, worldState, gameContext);
    questSystem = new QuestSystem(eventBus, worldState, gameContext);
    worldReactor = new WorldReactor(eventBus, worldState, gameContext);

    try {
        const response = await fetch('levels/world.json');

        if (response.ok) {
            const worldData = await response.json();
            worldGraph = new WorldGraph(worldData);
            playerState = new PlayerState(worldGraph.getStartBoardId());
            playerCallbacks.onTransition = handleTransition;

            // Load quests from world data
            if (worldData.quests) {
                questSystem.loadQuests(worldData.quests);
            }
            // Load global triggers from world data
            if (worldData.triggers) {
                triggerSystem.registerTriggers(worldData.triggers, 'global');
            }

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

/**
 * Handle player interaction with the entity they are facing.
 */
function handleInteraction() {
    const facing = player.getFacingTile();
    const entity = entityRegistry.getAt(facing.x, facing.y);
    if (!entity) return;

    const result = entity.interact(player, { board, entityRegistry, inventory });
    if (!result) return;

    // Emit interaction event for all result types
    eventBus.emit(GameEvents.ENTITY_INTERACT, { entityId: entity.id, entityType: entity.type, result });

    switch (result.type) {
        case 'dialogue':
            dialogueSystem.startSimple(result.speaker, result.text);
            break;
        case 'pickup':
            inventory.add(result.itemId);
            entityRegistry.cleanup();
            showMessage(result.description);
            eventBus.emit(GameEvents.ITEM_PICKUP, { itemId: result.itemId, entityId: entity.id });
            break;
        case 'combat': {
            if (result.defeated) {
                entityRegistry.cleanup();
                showMessage(`Defeated the enemy!`);
                eventBus.emit(GameEvents.ENTITY_DEFEAT, { entityId: entity.id });
            } else {
                showMessage(`You attack! Enemy has ${entity.health} HP left.`);
            }
            break;
        }
        case 'lever':
            showMessage(`Lever ${result.activated ? 'activated' : 'deactivated'}.`);
            eventBus.emit(GameEvents.LEVER_TOGGLE, { entityId: entity.id, activated: result.activated });
            break;
    }
}

/**
 * Check if any enemy is on the player's tile after entity updates.
 * If so, player takes damage.
 */
function checkEnemyCollisions() {
    const enemies = entityRegistry.getAllOfType('enemy');
    for (const enemy of enemies) {
        if (enemy.x === player.x && enemy.y === player.y) {
            player.health -= enemy.damage;
            showMessage(`Hit by ${enemy.id}! Health: ${player.health}`);
            if (player.health <= 0) {
                showMessage('You have been defeated!');
                resetGame();
                return;
            }
        }
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

    // Route input to dialogue system when active
    if (dialogueSystem.active) {
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                dialogueSystem.selectPrevious();
                break;
            case 'ArrowDown':
                event.preventDefault();
                dialogueSystem.selectNext();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                dialogueSystem.advance();
                break;
            case 'Escape':
                event.preventDefault();
                dialogueSystem.close();
                break;
        }
        return;
    }

    // Quest log toggle
    if (event.key === 'q' || event.key === 'Q') {
        questLogVisible = !questLogVisible;
        return;
    }

    // Block other input when quest log is visible
    if (questLogVisible) return;

    if (event.key === 'Enter') {
        hideMessage();
        return;
    }

    // Space = interact with facing entity
    if (event.key === ' ') {
        event.preventDefault();
        handleInteraction();
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
        // Check if target tile has a blocking entity — skip move if so
        const targetX = player.x + dx;
        const targetY = player.y + dy;
        const blockingEntity = entityRegistry.getAt(targetX, targetY);
        if (blockingEntity && blockingEntity.blocking) {
            // Still update facing direction even if blocked by entity
            player.facing = { dx, dy };
            return;
        }

        player.move(dx, dy, playerCallbacks);
        eventBus.emit(GameEvents.PLAYER_MOVE, { x: player.x, y: player.y, dx, dy });

        // After player moves, update all entities (turn-based: enemies move after player)
        entityRegistry.updateAll(player, { board, entityRegistry, inventory });
        entityRegistry.cleanup();

        // Check if an enemy moved onto the player
        checkEnemyCollisions();

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
