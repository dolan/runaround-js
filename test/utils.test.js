// utils.test.js

const utils = require('./js/utils');

// Mock the game module
jest.mock('./js/game', () => ({
    initGame: jest.fn(),
    board: {
        getOriginalState: jest.fn(() => ({ tiles: [['w', '.'], ['.', 'c']], required_crystals: 1 }))
    }
}));

describe('Utils', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Set up document body for tests that interact with DOM
        document.body.innerHTML = `
            <div id="messagePanel" style="display: none;">
                <div id="messageText"></div>
                <button id="dismissButton"></button>
            </div>
        `;
    });

    test('showMessage displays message correctly', () => {
        utils.showMessage('Test message');
        
        const messagePanel = document.getElementById('messagePanel');
        const messageText = document.getElementById('messageText');
        
        expect(messagePanel.style.display).toBe('flex');
        expect(messageText.textContent).toBe('Test message');
    });

    test('hideMessage hides message panel', () => {
        const messagePanel = document.getElementById('messagePanel');
        messagePanel.style.display = 'flex';
        
        utils.hideMessage();
        
        expect(messagePanel.style.display).toBe('none');
    });

    test('resetGame calls initGame', () => {
        const gameModule = require('./js/game');
        utils.resetGame();
        expect(gameModule.initGame).toHaveBeenCalled();
    });

    test('killYourself shows message and resets game', () => {
        const showMessageSpy = jest.spyOn(utils, 'showMessage');
        const resetGameSpy = jest.spyOn(utils, 'resetGame');

        utils.killYourself();

        expect(showMessageSpy).toHaveBeenCalledWith('You died! The level has been reset.');
        expect(resetGameSpy).toHaveBeenCalled();
    });

    test('loadBoardFromFile returns a promise', () => {
        const mockFile = new File(['{}'], 'test.json', { type: 'application/json' });
        expect(utils.loadBoardFromFile(mockFile)).toBeInstanceOf(Promise);
    });

    test('saveBoardToFile creates and clicks a download link', () => {
        // Mock URL.createObjectURL
        global.URL.createObjectURL = jest.fn();
        global.URL.revokeObjectURL = jest.fn();

        const createElementSpy = jest.spyOn(document, 'createElement');
        const clickSpy = jest.fn();
        createElementSpy.mockReturnValue({ click: clickSpy, href: '', download: '' });

        utils.saveBoardToFile();

        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(clickSpy).toHaveBeenCalled();
    });

});