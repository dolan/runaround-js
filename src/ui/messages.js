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
