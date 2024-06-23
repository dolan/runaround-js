function showMessage(message, duration = 3500) {
    const messagePanel = document.getElementById('messagePanel');
    const messageText = document.getElementById('messageText');
    messageText.textContent = message;
    messagePanel.style.display = 'flex';

    // Add a countdown timer
    let remainingTime = duration / 1000;
    const countdownElement = document.createElement('div');
    countdownElement.id = 'countdown';
    countdownElement.textContent = `${remainingTime}s`;
    messagePanel.appendChild(countdownElement);

    const countdownInterval = setInterval(() => {
        remainingTime--;
        countdownElement.textContent = `${remainingTime}s`;
        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            hideMessage();
        }
    }, 1000);

    // Hide the message when the OK button is clicked
    const dismissButton = document.getElementById('dismissButton');
    dismissButton.onclick = () => {
        clearInterval(countdownInterval);
        hideMessage();
    };
}

function hideMessage() {
    const messagePanel = document.getElementById('messagePanel');
    messagePanel.style.display = 'none';
    
    // Remove the countdown element
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        messagePanel.removeChild(countdownElement);
    }
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

// reset the game without changing the level
function resetGame() { 
    initGame(board.getOriginalState());
    board.findStartPosition();
}

function killYourself() {
    showMessage('You died! The level has been reset.');
    resetGame();
}