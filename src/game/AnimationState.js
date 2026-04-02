/**
 * Tracks the current animation frame for an animated sprite.
 * Each entity or the player that animates gets one of these.
 */
export class AnimationState {
    /**
     * @param {string} spriteId - e.g. "player_hero"
     * @param {string} defaultAnimation - e.g. "idle_down"
     */
    constructor(spriteId, defaultAnimation) {
        this.spriteId = spriteId;
        this.currentAnimation = defaultAnimation;
        this.frameIndex = 0;
        this.elapsed = 0;
        this.loop = true;
        /** @type {Function|null} */
        this.onComplete = null;
        this._finished = false;
    }

    /**
     * Switch to a different animation. Resets frame to 0.
     * No-op if already playing that animation.
     * @param {string} animation
     * @param {{ loop?: boolean, onComplete?: Function }} [options]
     */
    play(animation, options = {}) {
        if (this.currentAnimation === animation && !this._finished) return;
        this.currentAnimation = animation;
        this.frameIndex = 0;
        this.elapsed = 0;
        this.loop = options.loop !== undefined ? options.loop : true;
        this.onComplete = options.onComplete || null;
        this._finished = false;
    }

    /**
     * Advance the animation by deltaTime milliseconds.
     * @param {number} deltaTime - ms since last update
     * @param {import('./SpriteAtlas.js').SpriteAtlas} atlas
     */
    update(deltaTime, atlas) {
        if (this._finished) return;

        const info = atlas.getAnimationInfo(this.spriteId, this.currentAnimation);
        if (!info || info.frameDuration <= 0 || info.frames <= 1) return;

        this.elapsed += deltaTime;

        while (this.elapsed >= info.frameDuration) {
            this.elapsed -= info.frameDuration;
            this.frameIndex++;

            if (this.frameIndex >= info.frames) {
                if (this.loop) {
                    this.frameIndex = 0;
                } else {
                    this.frameIndex = info.frames - 1;
                    this._finished = true;
                    if (this.onComplete) this.onComplete();
                    return;
                }
            }
        }
    }

    /**
     * Get the current frame data for rendering.
     * @param {import('./SpriteAtlas.js').SpriteAtlas} atlas
     * @returns {{ image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number } | null}
     */
    getCurrentFrame(atlas) {
        return atlas.getFrame(this.spriteId, this.currentAnimation, this.frameIndex);
    }

    /**
     * Whether a non-looping animation has finished playing.
     * @returns {boolean}
     */
    get finished() {
        return this._finished;
    }
}
