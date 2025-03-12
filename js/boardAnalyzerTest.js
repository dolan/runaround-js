// Import the required classes
// Note: In a browser environment, these would be loaded via script tags

// Sample level data for testing
const testLevels = {
    // A playable level
    playable: {
        tiles: [
            ['w', 'w', 'w', 'w', 'w', 'w', 'w'],
            ['w', 'p', '.', 'c', '.', 'x', 'w'],
            ['w', '.', 'm', 'h', '.', '.', 'w'],
            ['w', 'w', 'w', 'w', 'w', 'w', 'w']
        ],
        required_crystals: 1
    },
    
    // An unplayable level - crystal unreachable
    unreachableCrystal: {
        tiles: [
            ['w', 'w', 'w', 'w', 'w', 'w', 'w'],
            ['w', 'p', '.', 'w', 'c', 'x', 'w'],
            ['w', '.', 'm', 'h', 'w', '.', 'w'],
            ['w', 'w', 'w', 'w', 'w', 'w', 'w']
        ],
        required_crystals: 1
    },
    
    // An unplayable level - not enough blocks for holes
    notEnoughBlocks: {
        tiles: [
            ['w', 'w', 'w', 'w', 'w', 'w', 'w'],
            ['w', 'p', '.', 'h', 'c', 'x', 'w'],
            ['w', '.', 'h', '.', '.', '.', 'w'],
            ['w', 'w', 'w', 'w', 'w', 'w', 'w']
        ],
        required_crystals: 1
    },
    
    // An unplayable level - block can't be pushed to hole
    unpushableBlock: {
        tiles: [
            ['w', 'w', 'w', 'w', 'w', 'w', 'w'],
            ['w', 'p', 'w', 'h', 'c', 'x', 'w'],
            ['w', '.', 'm', '.', '.', '.', 'w'],
            ['w', 'w', 'w', 'w', 'w', 'w', 'w']
        ],
        required_crystals: 1
    },
    
    // A complex but playable level with one-way doors
    complexPlayable: {
        tiles: [
            ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],
            ['w', 'p', '.', '.', 'w', 'c', '.', 'x', 'w'],
            ['w', '.', 'ol', '.', 'w', '.', '.', '.', 'w'],
            ['w', '.', 'w', '.', 'w', '.', 'w', '.', 'w'],
            ['w', '.', 'm', '.', 'h', '.', 'w', '.', 'w'],
            ['w', '.', '.', '.', 'w', '.', '.', '.', 'w'],
            ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w']
        ],
        required_crystals: 1
    },
    
    // A level with a box next to a hole that blocks a path
    boxNextToHole: {
        tiles: [
            ['w', 'w', 'w', 'w', 'w', 'w', 'w'],
            ['w', 'p', '.', 'h', '.', 'c', 'w'],
            ['w', '.', 'm', '.', '.', '.', 'w'],
            ['w', '.', '.', '.', '.', 'x', 'w'],
            ['w', 'w', 'w', 'w', 'w', 'w', 'w']
        ],
        required_crystals: 1
    },
    
    // A level with a box next to a hole that blocks a path to a crystal
    boxNextToHoleCrystal: {
        tiles: [
            ['w', 'w', 'w', 'w', 'w', 'w', 'w'],
            ['w', 'p', '.', '.', '.', '.', 'w'],
            ['w', '.', '.', 'h', 'w', 'c', 'w'],
            ['w', '.', 'm', '.', '.', 'x', 'w'],
            ['w', 'w', 'w', 'w', 'w', 'w', 'w']
        ],
        required_crystals: 1
    }
};

// Function to visualize a board
function visualizeBoard(board, analysis) {
    const container = document.createElement('div');
    container.className = 'board-visualization';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${board.width}, 30px)`;
    container.style.gridTemplateRows = `repeat(${board.height}, 30px)`;
    container.style.gap = '1px';
    container.style.margin = '20px 0';
    
    // Create a map of critical holes for quick lookup
    const criticalHolesMap = {};
    analysis.criticalHoles.forEach(hole => {
        criticalHolesMap[`${hole.x},${hole.y}`] = true;
    });
    
    // Create a map of pushable blocks for quick lookup
    const pushableBlocksMap = {};
    analysis.blockAnalysis.pushableToHole.forEach(item => {
        pushableBlocksMap[`${item.block.x},${item.block.y}`] = true;
    });
    
    // Create a map of reachable crystals for quick lookup
    const reachableCrystalsMap = {};
    analysis.pathAnalysis.reachableCrystals.forEach(crystal => {
        reachableCrystalsMap[`${crystal.x},${crystal.y}`] = true;
    });
    
    // Create a cell for each tile
    for (let y = 0; y < board.height; y++) {
        for (let x = 0; x < board.width; x++) {
            const cell = document.createElement('div');
            cell.style.width = '30px';
            cell.style.height = '30px';
            cell.style.display = 'flex';
            cell.style.justifyContent = 'center';
            cell.style.alignItems = 'center';
            cell.style.fontWeight = 'bold';
            
            const tile = board.getTile(x, y);
            
            // Set background color based on tile type
            switch (tile) {
                case 'w':
                    cell.style.backgroundColor = '#1a4ba0';
                    cell.textContent = '■';
                    cell.style.color = 'white';
                    break;
                case '.':
                    cell.style.backgroundColor = '#f0f0f0';
                    break;
                case 'c':
                    cell.style.backgroundColor = '#06d6a0';
                    cell.textContent = '💎';
                    // Highlight unreachable crystals
                    if (!reachableCrystalsMap[`${x},${y}`]) {
                        cell.style.border = '2px solid red';
                    }
                    break;
                case 'h':
                    cell.style.backgroundColor = '#333';
                    cell.textContent = '🕳️';
                    // Highlight critical holes
                    if (criticalHolesMap[`${x},${y}`]) {
                        cell.style.border = '2px solid red';
                    }
                    break;
                case 'm':
                    cell.style.backgroundColor = '#ffd166';
                    cell.textContent = '📦';
                    // Highlight pushable blocks
                    if (pushableBlocksMap[`${x},${y}`]) {
                        cell.style.border = '2px solid green';
                    }
                    break;
                case 'x':
                    cell.style.backgroundColor = '#118ab2';
                    cell.textContent = '🚪';
                    // Highlight unreachable exit
                    if (!analysis.pathAnalysis.exitReachable) {
                        cell.style.border = '2px solid red';
                    }
                    break;
                case 'ol':
                    cell.style.backgroundColor = '#f0f0f0';
                    cell.textContent = '←';
                    break;
                case 'or':
                    cell.style.backgroundColor = '#f0f0f0';
                    cell.textContent = '→';
                    break;
                case 'ou':
                    cell.style.backgroundColor = '#f0f0f0';
                    cell.textContent = '↑';
                    break;
                case 'od':
                    cell.style.backgroundColor = '#f0f0f0';
                    cell.textContent = '↓';
                    break;
            }
            
            // Mark player start position
            if (x === analysis.elements.playerStart.x && y === analysis.elements.playerStart.y) {
                const playerMarker = document.createElement('div');
                playerMarker.style.position = 'absolute';
                playerMarker.style.width = '10px';
                playerMarker.style.height = '10px';
                playerMarker.style.borderRadius = '50%';
                playerMarker.style.backgroundColor = '#e63946';
                cell.style.position = 'relative';
                cell.appendChild(playerMarker);
            }
            
            container.appendChild(cell);
        }
    }
    
    return container;
}

// Function to run the tests
function runBoardAnalyzerTests() {
    console.log("Running BoardAnalyzer Tests...");
    
    // Clear previous results
    const resultsDiv = document.getElementById('testResults');
    resultsDiv.innerHTML = '';
    
    // Test each level
    for (const [levelName, levelData] of Object.entries(testLevels)) {
        console.log(`\nTesting level: ${levelName}`);
        
        // Create a section for this level
        const levelSection = document.createElement('div');
        levelSection.className = 'level-section';
        levelSection.style.marginBottom = '30px';
        levelSection.style.padding = '15px';
        levelSection.style.border = '1px solid #ddd';
        levelSection.style.borderRadius = '4px';
        
        const levelTitle = document.createElement('h2');
        levelTitle.textContent = `Level: ${levelName}`;
        levelSection.appendChild(levelTitle);
        
        // Create a board from the level data
        const board = new Board(levelData);
        
        // Create a board analyzer
        const analyzer = new BoardAnalyzer(board);
        
        // Analyze the board
        const result = analyzer.isPlayable();
        const analysis = analyzer.analyzeBoard();
        
        // Add visualization
        levelSection.appendChild(visualizeBoard(board, analysis));
        
        // Add playability result
        const playableResult = document.createElement('div');
        playableResult.style.marginTop = '10px';
        playableResult.style.fontWeight = 'bold';
        playableResult.style.color = result.isPlayable ? 'green' : 'red';
        playableResult.textContent = `Is playable: ${result.isPlayable}`;
        levelSection.appendChild(playableResult);
        
        // Add reasons if not playable
        if (!result.isPlayable && result.reasons.length > 0) {
            const reasonsList = document.createElement('ul');
            reasonsList.style.color = 'red';
            result.reasons.forEach(reason => {
                const reasonItem = document.createElement('li');
                reasonItem.textContent = reason;
                reasonsList.appendChild(reasonItem);
            });
            levelSection.appendChild(reasonsList);
        }
        
        // Add detailed analysis
        const analysisDetails = document.createElement('div');
        analysisDetails.innerHTML = `
            <h3>Detailed Analysis</h3>
            <p>Board dimensions: ${analysis.boardDimensions.width}x${analysis.boardDimensions.height}</p>
            <p>Player start: (${analysis.elements.playerStart.x}, ${analysis.elements.playerStart.y})</p>
            <p>Crystals: ${analysis.elements.crystalsCount} (Required: ${analysis.requiredCrystals})</p>
            <p>Reachable crystals: ${analysis.pathAnalysis.reachableCrystals.length}</p>
            <p>Unreachable crystals: ${analysis.pathAnalysis.unreachableCrystals.length}</p>
            <p>Exit reachable: ${analysis.pathAnalysis.exitReachable}</p>
            <p>Movable blocks: ${analysis.elements.movableBlocksCount}</p>
            <p>Reachable blocks: ${analysis.blockAnalysis.reachableBlocks.length}</p>
            <p>Unreachable blocks: ${analysis.blockAnalysis.unreachableBlocks.length}</p>
            <p>Blocks pushable to holes: ${analysis.blockAnalysis.pushableToHole.length}</p>
            <p>Holes: ${analysis.elements.holesCount}</p>
            <p>Critical holes: ${analysis.criticalHoles.length}</p>
        `;
        levelSection.appendChild(analysisDetails);
        
        // Add suggested fixes if board is not playable
        if (!result.isPlayable) {
            const suggestions = analyzer.suggestFixes();
            const suggestionsSection = document.createElement('div');
            suggestionsSection.innerHTML = '<h3>Suggested Fixes</h3>';
            
            const suggestionsList = document.createElement('ul');
            suggestions.forEach(suggestion => {
                const item = document.createElement('li');
                item.textContent = suggestion;
                suggestionsList.appendChild(item);
            });
            
            suggestionsSection.appendChild(suggestionsList);
            levelSection.appendChild(suggestionsSection);
            
            // Log suggestions
            console.log("\nSuggested Fixes:");
            suggestions.forEach(suggestion => console.log(suggestion));
        }
        
        // Add to results
        resultsDiv.appendChild(levelSection);
        
        // Log the result
        console.log(`Is playable: ${result.isPlayable}`);
        if (!result.isPlayable && result.reasons.length > 0) {
            console.log("Reasons:");
            result.reasons.forEach(reason => console.log(`- ${reason}`));
        }
        
        // Log detailed analysis
        console.log("\nDetailed Analysis:");
        console.log(`Board dimensions: ${analysis.boardDimensions.width}x${analysis.boardDimensions.height}`);
        console.log(`Player start: (${analysis.elements.playerStart.x}, ${analysis.elements.playerStart.y})`);
        console.log(`Crystals: ${analysis.elements.crystalsCount} (Required: ${analysis.requiredCrystals})`);
        console.log(`Reachable crystals: ${analysis.pathAnalysis.reachableCrystals.length}`);
        console.log(`Unreachable crystals: ${analysis.pathAnalysis.unreachableCrystals.length}`);
        console.log(`Exit reachable: ${analysis.pathAnalysis.exitReachable}`);
        console.log(`Movable blocks: ${analysis.elements.movableBlocksCount}`);
        console.log(`Reachable blocks: ${analysis.blockAnalysis.reachableBlocks.length}`);
        console.log(`Unreachable blocks: ${analysis.blockAnalysis.unreachableBlocks.length}`);
        console.log(`Blocks pushable to holes: ${analysis.blockAnalysis.pushableToHole.length}`);
        console.log(`Holes: ${analysis.elements.holesCount}`);
        console.log(`Critical holes: ${analysis.criticalHoles.length}`);
    }
}

// In a Node.js environment, you would run the tests like this:
// if (typeof require !== 'undefined') {
//     const { Board } = require('./board');
//     const { BoardAnalyzer } = require('./boardAnalyzer');
//     runBoardAnalyzerTests();
// }

// In a browser environment, you would run the tests when the page loads:
document.addEventListener('DOMContentLoaded', () => {
    // Add a button to run the tests
    const testButton = document.createElement('button');
    testButton.textContent = 'Run Board Analyzer Tests';
    testButton.onclick = runBoardAnalyzerTests;
    document.body.appendChild(testButton);
    
    // Create a div to display test results
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'testResults';
    document.body.appendChild(resultsDiv);
    
    // Override console.log to also display in the results div
    const originalConsoleLog = console.log;
    console.log = function() {
        // Call the original console.log
        originalConsoleLog.apply(console, arguments);
        
        // Also display in the results div
        const message = Array.from(arguments).join(' ');
        const p = document.createElement('p');
        p.textContent = message;
        document.getElementById('testResults').appendChild(p);
    };
}); 