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

export function hideMessage() {
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
    const messagePanel = document.getElementById('messagePanel');
    const messageText = document.getElementById('messageText');

    let html = `<strong>${speaker}:</strong> ${text}`;

    if (choices && choices.length > 0) {
        html += '<div class="dialogue-choices">';
        for (let i = 0; i < choices.length; i++) {
            const marker = i === selectedIndex ? '▸ ' : '  ';
            const cls = i === selectedIndex ? 'dialogue-choice selected' : 'dialogue-choice';
            html += `<div class="${cls}">${marker}${choices[i]}</div>`;
        }
        html += '</div>';
    }

    messageText.innerHTML = html;
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
