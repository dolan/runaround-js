import { describe, test, expect, beforeEach } from 'vitest';
import { SpriteAtlas } from '../src/game/SpriteAtlas.js';

/**
 * Create a fake loaded image for testing.
 * @param {number} width
 * @param {number} height
 */
function fakeImage(width = 128, height = 32) {
    return { complete: true, naturalWidth: width, naturalHeight: height };
}

describe('SpriteAtlas', () => {
    let atlas;

    beforeEach(() => {
        atlas = new SpriteAtlas();
    });

    describe('register and getFrame', () => {
        test('returns frame data for a registered horizontal strip sprite', () => {
            atlas.register('player', 'walk_down', {
                image: fakeImage(128, 32),
                frames: 4,
                frameDuration: 150
            });

            const frame = atlas.getFrame('player', 'walk_down', 0);
            expect(frame).not.toBeNull();
            expect(frame.sx).toBe(0);
            expect(frame.sy).toBe(0);
            expect(frame.sw).toBe(32);
            expect(frame.sh).toBe(32);
        });

        test('returns correct source rect for frame index in horizontal strip', () => {
            atlas.register('player', 'walk_down', {
                image: fakeImage(128, 32),
                frames: 4,
                frameDuration: 150
            });

            const frame2 = atlas.getFrame('player', 'walk_down', 2);
            expect(frame2.sx).toBe(64); // 2 * 32
            expect(frame2.sy).toBe(0);
        });

        test('wraps frame index when it exceeds frame count', () => {
            atlas.register('player', 'walk_down', {
                image: fakeImage(128, 32),
                frames: 4,
                frameDuration: 150
            });

            const frame = atlas.getFrame('player', 'walk_down', 5); // 5 % 4 = 1
            expect(frame.sx).toBe(32);
            expect(frame.sy).toBe(0);
        });

        test('handles grid layout with columns', () => {
            atlas.register('player', 'all_walk', {
                image: fakeImage(64, 64),
                frames: 4,
                frameDuration: 150,
                columns: 2
            });

            // Frame 0: col 0, row 0
            const f0 = atlas.getFrame('player', 'all_walk', 0);
            expect(f0.sx).toBe(0);
            expect(f0.sy).toBe(0);

            // Frame 1: col 1, row 0
            const f1 = atlas.getFrame('player', 'all_walk', 1);
            expect(f1.sx).toBe(32);
            expect(f1.sy).toBe(0);

            // Frame 2: col 0, row 1
            const f2 = atlas.getFrame('player', 'all_walk', 2);
            expect(f2.sx).toBe(0);
            expect(f2.sy).toBe(32);

            // Frame 3: col 1, row 1
            const f3 = atlas.getFrame('player', 'all_walk', 3);
            expect(f3.sx).toBe(32);
            expect(f3.sy).toBe(32);
        });

        test('returns correct frame for single-frame static sprite', () => {
            atlas.register('tile_wall', 'default', {
                image: fakeImage(32, 32),
                frames: 1,
                frameDuration: 0
            });

            const frame = atlas.getFrame('tile_wall', 'default', 0);
            expect(frame.sx).toBe(0);
            expect(frame.sy).toBe(0);
            expect(frame.sw).toBe(32);
            expect(frame.sh).toBe(32);
        });
    });

    describe('missing sprites return null', () => {
        test('returns null for unknown spriteId', () => {
            expect(atlas.getFrame('nonexistent', 'idle', 0)).toBeNull();
        });

        test('returns null for unknown animation', () => {
            atlas.register('player', 'walk_down', {
                image: fakeImage(),
                frames: 4,
                frameDuration: 150
            });
            expect(atlas.getFrame('player', 'nonexistent', 0)).toBeNull();
        });

        test('returns null if image not loaded', () => {
            atlas.register('player', 'idle', {
                image: { complete: false, naturalWidth: 0 },
                frames: 2,
                frameDuration: 500
            });
            expect(atlas.getFrame('player', 'idle', 0)).toBeNull();
        });
    });

    describe('getAnimationInfo', () => {
        test('returns frame count and duration', () => {
            atlas.register('slime', 'move', {
                image: fakeImage(),
                frames: 4,
                frameDuration: 200
            });

            const info = atlas.getAnimationInfo('slime', 'move');
            expect(info.frames).toBe(4);
            expect(info.frameDuration).toBe(200);
        });

        test('returns null for missing sprite', () => {
            expect(atlas.getAnimationInfo('nope', 'idle')).toBeNull();
        });

        test('returns null for missing animation', () => {
            atlas.register('slime', 'idle', {
                image: fakeImage(),
                frames: 2,
                frameDuration: 400
            });
            expect(atlas.getAnimationInfo('slime', 'walk')).toBeNull();
        });
    });

    describe('has', () => {
        test('returns true for registered animation', () => {
            atlas.register('player', 'idle', {
                image: fakeImage(),
                frames: 2,
                frameDuration: 500
            });
            expect(atlas.has('player', 'idle')).toBe(true);
        });

        test('returns false for unregistered', () => {
            expect(atlas.has('player', 'idle')).toBe(false);
        });
    });
});
