import { Entity } from './Entity.js';

/**
 * Enemy entity with greedy chase AI and combat.
 * Moves one step toward the player each turn (Manhattan distance).
 */
export class Enemy extends Entity {
    /**
     * @param {Object} config
     * @param {number} [config.properties.health=1] - Hit points
     * @param {number} [config.properties.damage=1] - Damage dealt to player on contact
     */
    constructor(config) {
        super({ ...config, type: 'enemy', blocking: true });
        this.health = this.properties.health || 1;
        this.damage = this.properties.damage || 1;
    }

    /**
     * Player attacks this enemy. Decrements health, deactivates if defeated.
     * @param {Object} player
     * @param {Object} context
     * @returns {{ type: 'combat', defeated: boolean, damageToPlayer: number, enemyId: string }}
     */
    interact(player, context) {
        this.health--;
        const defeated = this.health <= 0;
        if (defeated) {
            this.deactivate();
        }
        return {
            type: 'combat',
            defeated,
            damageToPlayer: 0,
            enemyId: this.id
        };
    }

    /**
     * Greedy chase: pick the adjacent walkable tile closest to player.
     * Skips tiles occupied by other entities or non-walkable tiles.
     * @param {Object} player
     * @param {Object} context
     * @param {Object} context.board
     * @param {import('./EntityRegistry.js').EntityRegistry} context.entityRegistry
     */
    update(player, context) {
        if (!context.board || !context.entityRegistry) return;

        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        let bestDir = null;
        let bestDist = Infinity;

        for (const { dx, dy } of directions) {
            const nx = this.x + dx;
            const ny = this.y + dy;

            // Check tile is walkable
            const tile = context.board.getTile(nx, ny);
            if (!tile || tile === 'w' || tile === 'm' || tile === 'h') continue;

            // Allow moving onto player's tile (collision)
            if (nx === player.x && ny === player.y) {
                const dist = 0;
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = { dx, dy };
                }
                continue;
            }

            // Skip tiles occupied by other entities
            const occupant = context.entityRegistry.getAt(nx, ny);
            if (occupant && occupant.id !== this.id) continue;

            const dist = Math.abs(nx - player.x) + Math.abs(ny - player.y);
            if (dist < bestDist) {
                bestDist = dist;
                bestDir = { dx, dy };
            }
        }

        if (bestDir) {
            context.entityRegistry.moveEntity(this.id, this.x + bestDir.dx, this.y + bestDir.dy);
        }
    }
}
