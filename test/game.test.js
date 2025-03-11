// Mock the browser environment
const mockCanvas = {
    getContext: jest.fn(() => ({
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
    })),
    width: 640,
    height: 480,
};

const mockDocument = {
    getElementById: jest.fn((id) => {
        if (id === 'gameCanvas') return mockCanvas;
        if (id === 'crystal-count') return { textContent: '' };
        return null;
    }),
    createElement: jest.fn(() => ({
        getContext: jest.fn(),
    })),
    addEventListener: jest.fn(),
};

global.document = mockDocument;
global.requestAnimationFrame = jest.fn();

jest.mock('./js/board');
jest.mock('./js/utils');

const gameModule = require('./js/game');
const { Board } = require('./js/board');

describe('Player', () => {
    let player;
    let board;

    beforeEach(() => {
        board = new Board();
        player = new gameModule.Player(1, 1);
        player.board = board;
    });

    test('move updates player position correctly', () => {
        player.move(1, 0);
        expect(player.x).toBe(2);
        expect(player.y).toBe(1);
    });

    test('collectCrystal increases crystal count', () => {
        player.collectCrystal(2, 2);
        expect(player.crystals).toBe(1);
        expect(board.removeCrystal).toHaveBeenCalledWith(2, 2);
    });

    // Add more Player tests...
});

describe('Game Functions', () => {
    beforeEach(() => {
        gameModule.board = new Board();
        gameModule.player = new gameModule.Player(1, 1);
    });

    test('updateViewport adjusts viewport based on player position', () => {
        gameModule.player.x = 10;
        gameModule.player.y = 8;
        gameModule.updateViewport();
        expect(gameModule.viewportX).toBeDefined();
        expect(gameModule.viewportY).toBeDefined();
    });

    test('drawGame calls necessary canvas methods', () => {
        gameModule.drawGame();
        expect(mockCanvas.getContext().clearRect).toHaveBeenCalled();
        expect(mockCanvas.getContext().fillRect).toHaveBeenCalled();
    });

    // Add more tests for other functions in game.js...
});