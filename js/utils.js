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
    const formatTiles = (tiles) => {
        const formattedRows = tiles.map(row => 
            '    [' + row.map(cell => JSON.stringify(cell)).join(', ') + ']'
        );
        return '[\n' + formattedRows.join(',\n') + '\n  ]';
    };

    const tilesString = formatTiles(board.tiles);
    
    const jsonString = `{
        "tiles": ${tilesString},
        "required_crystals": ${board.requiredCrystals}
    }`;

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