function showMessage(message) {
    const messagePanel = document.getElementById('messagePanel');
    const messageText = document.getElementById('messageText');
    messageText.textContent = message;
    messagePanel.style.display = 'flex';
}

function hideMessage() {
    const messagePanel = document.getElementById('messagePanel');
    messagePanel.style.display = 'none';
}

function saveBoardToFile() {
    const originalState = board.getOriginalState();
    const jsonString = JSON.stringify(originalState, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'board.json';
    a.setAttribute('content-disposition', 'attachment; filename="board.json"');
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

function resetGame() {
    board.reset();
    player = new Player(board.startX, board.startY);
    updateGameInfo();
    updateViewport();
    drawGame();
    showMessage('Game reset. Good luck!');
}

function killYourself() {
    showMessage('You died! The level has been reset.');
    resetGame();
}