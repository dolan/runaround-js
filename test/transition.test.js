import { describe, test, expect } from 'vitest';
import { Transition, TransitionType } from '../src/world/Transition.js';

describe('TransitionType', () => {
    test('defines EXIT and DOOR constants', () => {
        expect(TransitionType.EXIT).toBe('exit');
        expect(TransitionType.DOOR).toBe('door');
    });
});

describe('Transition', () => {
    test('constructs from source and destination objects', () => {
        const t = new Transition(
            { board: 'clearing', x: 5, y: 5, type: 'exit' },
            { board: 'cave', x: 2, y: 1 }
        );
        expect(t.fromBoard).toBe('clearing');
        expect(t.fromX).toBe(5);
        expect(t.fromY).toBe(5);
        expect(t.type).toBe('exit');
        expect(t.toBoard).toBe('cave');
        expect(t.toX).toBe(2);
        expect(t.toY).toBe(1);
    });

    test('defaults to DOOR type when type is not specified', () => {
        const t = new Transition(
            { board: 'a', x: 0, y: 0 },
            { board: 'b', x: 1, y: 1 }
        );
        expect(t.type).toBe(TransitionType.DOOR);
    });

    test('generates correct lookup key', () => {
        const t = new Transition(
            { board: 'cave', x: 3, y: 7, type: 'door' },
            { board: 'tower', x: 1, y: 1 }
        );
        expect(t.key).toBe('cave:3:7');
    });
});
