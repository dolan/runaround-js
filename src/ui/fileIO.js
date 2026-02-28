function formatBoard(boardData) {
    let serialized = '{\n';
    serialized += '    "tiles": [\n';
    boardData.tiles.forEach((row, index) => {
        serialized += '      ' + JSON.stringify(row);
        if (index < boardData.tiles.length - 1) {
            serialized += ',';
        }
        serialized += '\n';
    });
    serialized += '    ],\n';
    serialized += `    "required_crystals": ${boardData.required_crystals}\n`;
    serialized += '  }';

    return serialized;
}

export function saveBoardToFile(boardData) {
    const jsonString = formatBoard(boardData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'level.json';
    a.setAttribute('content-disposition', 'attachment; filename="level.json"');

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function loadBoardFromFile(file) {
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
