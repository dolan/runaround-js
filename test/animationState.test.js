import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AnimationState } from '../src/game/AnimationState.js';
import { SpriteAtlas } from '../src/game/SpriteAtlas.js';

function fakeImage(width = 128, height = 32) {
    return { complete: true, naturalWidth: width, naturalHeight: height };
}

describe('AnimationState', () => {
    let atlas;
    let anim;

    beforeEach(() => {
        atlas = new SpriteAtlas();
        atlas.register('hero', 'idle_down', {
            image: fakeImage(64, 32),
            frames: 2,
            frameDuration: 500
        });
        atlas.register('hero', 'walk_down', {
            image: fakeImage(128, 32),
            frames: 4,
            frameDuration: 150
        });
        atlas.register('hero', 'attack_down', {
            image: fakeImage(96, 32),
            frames: 3,
            frameDuration: 100
        });
        atlas.register('hero', 'static', {
            image: fakeImage(32, 32),
            frames: 1,
            frameDuration: 0
        });

        anim = new AnimationState('hero', 'idle_down');
    });

    test('starts at frame 0 of the default animation', () => {
        expect(anim.currentAnimation).toBe('idle_down');
        expect(anim.frameIndex).toBe(0);
        expect(anim.finished).toBe(false);
    });

    test('advances frames based on elapsed time', () => {
        anim.update(499, atlas);
        expect(anim.frameIndex).toBe(0);

        anim.update(1, atlas); // total 500ms = 1 frame duration
        expect(anim.frameIndex).toBe(1);
    });

    test('loops back to frame 0 by default', () => {
        // 2 frames at 500ms each → 1000ms wraps to frame 0
        anim.update(1000, atlas);
        expect(anim.frameIndex).toBe(0);
    });

    test('handles multiple frame advances in a single update', () => {
        anim.play('walk_down');
        // 4 frames at 150ms each → 450ms should be frame 3
        anim.update(450, atlas);
        expect(anim.frameIndex).toBe(3);
    });

    test('play() switches animation and resets frame', () => {
        anim.update(500, atlas); // advance to frame 1
        expect(anim.frameIndex).toBe(1);

        anim.play('walk_down');
        expect(anim.currentAnimation).toBe('walk_down');
        expect(anim.frameIndex).toBe(0);
        expect(anim.elapsed).toBe(0);
    });

    test('play() is a no-op if same animation already playing', () => {
        anim.update(250, atlas); // some elapsed time
        anim.play('idle_down');
        // Should NOT reset — still mid-animation
        expect(anim.elapsed).toBe(250);
    });

    test('non-looping animation stops at last frame', () => {
        anim.play('attack_down', { loop: false });
        // 3 frames at 100ms = 300ms to finish
        anim.update(300, atlas);
        expect(anim.frameIndex).toBe(2); // last frame
        expect(anim.finished).toBe(true);
    });

    test('non-looping animation calls onComplete', () => {
        const onComplete = vi.fn();
        anim.play('attack_down', { loop: false, onComplete });
        anim.update(300, atlas);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    test('non-looping animation stops advancing after finishing', () => {
        anim.play('attack_down', { loop: false });
        anim.update(300, atlas);
        expect(anim.finished).toBe(true);

        anim.update(1000, atlas); // more time passes
        expect(anim.frameIndex).toBe(2); // still on last frame
    });

    test('play() after finish resets the animation', () => {
        anim.play('attack_down', { loop: false });
        anim.update(300, atlas);
        expect(anim.finished).toBe(true);

        anim.play('idle_down');
        expect(anim.finished).toBe(false);
        expect(anim.frameIndex).toBe(0);
    });

    test('does not advance static sprites (frameDuration 0)', () => {
        anim.play('static');
        anim.update(1000, atlas);
        expect(anim.frameIndex).toBe(0);
    });

    test('does not advance single-frame sprites', () => {
        anim.play('static');
        anim.update(500, atlas);
        expect(anim.frameIndex).toBe(0);
    });

    test('getCurrentFrame delegates to atlas', () => {
        const frame = anim.getCurrentFrame(atlas);
        expect(frame).not.toBeNull();
        expect(frame.sx).toBe(0);
        expect(frame.sy).toBe(0);
        expect(frame.sw).toBe(32);
        expect(frame.sh).toBe(32);
    });

    test('getCurrentFrame returns correct frame after advancing', () => {
        anim.update(500, atlas);
        const frame = anim.getCurrentFrame(atlas);
        expect(frame.sx).toBe(32); // frame 1
    });

    test('returns null from getCurrentFrame when atlas has no sprite', () => {
        const emptyAtlas = new SpriteAtlas();
        const frame = anim.getCurrentFrame(emptyAtlas);
        expect(frame).toBeNull();
    });
});
