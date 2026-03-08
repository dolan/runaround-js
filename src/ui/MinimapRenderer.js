/**
 * Draws a minimap on the dedicated sidebar canvas showing the world graph.
 * Current board = red, visited = green, unvisited = gray. Lines show connections.
 *
 * @param {import('../world/WorldGraph.js').WorldGraph} worldGraph
 * @param {import('../world/PlayerState.js').PlayerState} playerState
 */
export function updateMinimap(worldGraph, playerState) {
    const canvas = document.getElementById('minimapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const NODE_SIZE = 20;
    const NODE_GAP = 30;
    const PADDING = 10;

    const boardIds = worldGraph.getAllBoardIds();
    if (boardIds.length === 0) return;

    // Calculate grid bounds from gridPositions
    let minGX = Infinity, minGY = Infinity, maxGX = -Infinity, maxGY = -Infinity;
    const positions = {};
    for (const id of boardIds) {
        const info = worldGraph.getBoardInfo(id);
        const gp = info.gridPosition || { x: 0, y: 0 };
        positions[id] = gp;
        minGX = Math.min(minGX, gp.x);
        minGY = Math.min(minGY, gp.y);
        maxGX = Math.max(maxGX, gp.x);
        maxGY = Math.max(maxGY, gp.y);
    }

    const cols = maxGX - minGX + 1;
    const rows = maxGY - minGY + 1;
    const mapW = cols * NODE_GAP + PADDING * 2;
    const mapH = rows * NODE_GAP + PADDING * 2;

    // Resize canvas to fit content
    canvas.width = Math.max(mapW, 120);
    canvas.height = Math.max(mapH, 60);

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Helper to get canvas coords for a board node
    function nodeCenter(boardId) {
        const gp = positions[boardId];
        return {
            x: PADDING + (gp.x - minGX) * NODE_GAP + NODE_GAP / 2,
            y: PADDING + (gp.y - minGY) * NODE_GAP + NODE_GAP / 2
        };
    }

    // Draw connection lines
    const drawnEdges = new Set();
    for (const transition of worldGraph.getAllTransitions()) {
        const edgeKey = [transition.fromBoard, transition.toBoard].sort().join('-');
        if (drawnEdges.has(edgeKey)) continue;
        drawnEdges.add(edgeKey);

        const from = nodeCenter(transition.fromBoard);
        const to = nodeCenter(transition.toBoard);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    }

    // Draw nodes
    for (const id of boardIds) {
        const center = nodeCenter(id);

        if (id === playerState.currentBoardId) {
            ctx.fillStyle = '#e63946'; // red = current
        } else if (playerState.hasVisited(id)) {
            ctx.fillStyle = '#06d6a0'; // green = visited
        } else {
            ctx.fillStyle = '#666666'; // gray = unvisited
        }

        ctx.fillRect(
            center.x - NODE_SIZE / 2,
            center.y - NODE_SIZE / 2,
            NODE_SIZE,
            NODE_SIZE
        );

        // Draw border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            center.x - NODE_SIZE / 2,
            center.y - NODE_SIZE / 2,
            NODE_SIZE,
            NODE_SIZE
        );
    }
}
