let activeCountdownInterval = null;

export function showMessage(message, duration = 2000) {
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
            activeCountdownInterval = null;
            hideMessage();
        }
    }, 1000);

    activeCountdownInterval = countdownInterval;

    // Hide the message when the OK button is clicked
    const dismissButton = document.getElementById('dismissButton');
    dismissButton.onclick = () => {
        clearInterval(countdownInterval);
        activeCountdownInterval = null;
        hideMessage();
    };
}

export function hideMessage() {
    if (activeCountdownInterval) {
        clearInterval(activeCountdownInterval);
        activeCountdownInterval = null;
    }

    const messagePanel = document.getElementById('messagePanel');
    messagePanel.style.display = 'none';

    // Remove the countdown element
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        messagePanel.removeChild(countdownElement);
    }
}

/**
 * Show a dialogue in the message panel without a countdown timer.
 * @param {string} speaker - Name of the speaker
 * @param {string} text - Dialogue text
 * @param {string[]|null} [choices] - Optional choice labels
 * @param {number} [selectedIndex=0] - Currently selected choice index
 */
export function showDialogue(speaker, text, choices, selectedIndex = 0) {
    // Cancel any active countdown timer from a prior showMessage()
    if (activeCountdownInterval) {
        clearInterval(activeCountdownInterval);
        activeCountdownInterval = null;
    }
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        countdownElement.remove();
    }

    const messagePanel = document.getElementById('messagePanel');
    const messageText = document.getElementById('messageText');

    // Build DOM nodes instead of innerHTML to prevent XSS
    const fragment = document.createDocumentFragment();

    const strong = document.createElement('strong');
    strong.textContent = speaker + ':';
    fragment.appendChild(strong);
    fragment.appendChild(document.createTextNode(' ' + text));

    if (choices && choices.length > 0) {
        const choicesDiv = document.createElement('div');
        choicesDiv.className = 'dialogue-choices';
        for (let i = 0; i < choices.length; i++) {
            const choiceDiv = document.createElement('div');
            const marker = i === selectedIndex ? '▸ ' : '  ';
            choiceDiv.className = i === selectedIndex ? 'dialogue-choice selected' : 'dialogue-choice';
            choiceDiv.textContent = marker + choices[i];
            choicesDiv.appendChild(choiceDiv);
        }
        fragment.appendChild(choicesDiv);
    }

    messageText.innerHTML = '';
    messageText.appendChild(fragment);
    messagePanel.style.display = 'flex';

    // Hide dismiss button during dialogue (advance with Enter/Space instead)
    const dismissButton = document.getElementById('dismissButton');
    if (dismissButton) {
        dismissButton.style.display = 'none';
    }
}

/**
 * Hide the dialogue panel and restore dismiss button.
 */
export function hideDialogue() {
    const messagePanel = document.getElementById('messagePanel');
    messagePanel.style.display = 'none';

    // Restore dismiss button
    const dismissButton = document.getElementById('dismissButton');
    if (dismissButton) {
        dismissButton.style.display = '';
    }

    // Clean up innerHTML
    const messageText = document.getElementById('messageText');
    if (messageText) {
        messageText.innerHTML = '';
    }
}
