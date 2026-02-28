import { showMessage } from '../ui/messages.js';

export class Player {
    constructor(x, y, board) {
        this.x = x;
        this.y = y;
        this.board = board;
        this.crystals = 0;
    }

    move(dx, dy, callbacks) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (newX >= 0 && newX < this.board.width && newY >= 0 && newY < this.board.height) {
            const tile = this.board.getTile(newX, newY);
            switch(tile) {
                case '.':
                    this.x = newX;
                    this.y = newY;
                    break;
                case 'c':
                    this.collectCrystal(newX, newY, callbacks);
                    break;
                case 'x':
                    this.tryExit(newX, newY, callbacks);
                    break;
                case 'd':
                    this.x = newX;
                    this.y = newY;
                    if (callbacks && callbacks.onTransition) {
                        callbacks.onTransition(newX, newY);
                    }
                    break;
                case 'm':
                    this.pushMovable(newX, newY, dx, dy);
                    break;
                case 'h':
                    this.fallIntoHole(callbacks);
                    break;
                case 'ol': case 'or': case 'ou': case 'od':
                    this.moveOnOneWay(newX, newY, dx, dy);
                    break;
            }
        }
    }

    collectCrystal(x, y, callbacks) {
        this.board.removeCrystal(x, y);
        this.crystals++;
        this.x = x;
        this.y = y;
        if (callbacks && callbacks.onGameInfoUpdate) {
            callbacks.onGameInfoUpdate();
        }
    }

    tryExit(newX, newY, callbacks) {
        if (this.crystals >= this.board.requiredCrystals) {
            if (callbacks && callbacks.onTransition) {
                callbacks.onTransition(newX, newY);
            } else if (callbacks && callbacks.onLevelComplete) {
                showMessage('Level Complete!');
                callbacks.onLevelComplete();
            }
        }
    }

    pushMovable(x, y, dx, dy) {
        const pushX = x + dx;
        const pushY = y + dy;
        if (this.board.getTile(pushX, pushY) === '.') {
            this.board.setTile(pushX, pushY, 'm');
            this.board.setTile(x, y, '.');
            this.x = x;
            this.y = y;
        } else if (this.board.getTile(pushX, pushY) === 'h') {
            this.board.setTile(pushX, pushY, '.');
            this.board.setTile(x, y, '.');
            this.x = x;
            this.y = y;
        }
    }

    fallIntoHole(callbacks) {
        showMessage('Oh snap! You fell into a hole.');

        if (callbacks && callbacks.onResetGame) {
            callbacks.onResetGame();
        }
    }

    moveOnOneWay(x, y, dx, dy) {
        const tileType = this.board.getTile(x, y);
        if ((tileType === 'ol' && dx === -1) ||
            (tileType === 'or' && dx === 1) ||
            (tileType === 'ou' && dy === -1) ||
            (tileType === 'od' && dy === 1)) {
            this.x = x;
            this.y = y;
        }
    }
}
