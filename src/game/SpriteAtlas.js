import { TILE_SIZE } from './constants.js';

/**
 * Loads a sprite manifest and preloads all sprite sheet images.
 * Provides frame-level access for the renderer and animation system.
 *
 * Manifest format (sprites.json):
 * {
 *   "player_hero": {
 *     "idle_down": { "file": "player/hero_idle_down.png", "frames": 2, "frameDuration": 500 },
 *     "walk_down": { "file": "player/hero_walk_down.png", "frames": 4, "frameDuration": 150, "columns": 4 }
 *   }
 * }
 *
 * - "columns" omitted = horizontal strip (all frames in one row)
 * - "columns" present = grid layout (frames wrap at that column count)
 */
export class SpriteAtlas {
    constructor() {
        /** @type {Map<string, Map<string, { image: HTMLImageElement, frames: number, frameDuration: number, columns: number }>>} */
        this.sprites = new Map();
    }

    /**
     * Load a sprite manifest and preload all referenced images.
     * @param {string} manifestUrl - Path to sprites.json
     * @param {string} [basePath='sprites/'] - Base path prepended to file paths in the manifest
     * @returns {Promise<SpriteAtlas>} this atlas, for chaining
     */
    async load(manifestUrl, basePath = 'sprites/') {
        let manifest;
        try {
            const response = await fetch(manifestUrl);
            if (!response.ok) return this;
            manifest = await response.json();
        } catch {
            return this;
        }

        const imagePromises = [];

        for (const [spriteId, animations] of Object.entries(manifest)) {
            const animMap = new Map();

            for (const [animName, info] of Object.entries(animations)) {
                const img = new Image();
                const src = basePath + info.file;

                const loadPromise = new Promise((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = src;
                });
                imagePromises.push(loadPromise);

                animMap.set(animName, {
                    image: img,
                    frames: info.frames || 1,
                    frameDuration: info.frameDuration || 0,
                    columns: info.columns || info.frames || 1
                });
            }

            this.sprites.set(spriteId, animMap);
        }

        await Promise.all(imagePromises);
        return this;
    }

    /**
     * Register a sprite animation directly (for testing or procedural use).
     * @param {string} spriteId
     * @param {string} animName
     * @param {{ image: HTMLImageElement, frames: number, frameDuration: number, columns?: number }} info
     */
    register(spriteId, animName, info) {
        if (!this.sprites.has(spriteId)) {
            this.sprites.set(spriteId, new Map());
        }
        this.sprites.get(spriteId).set(animName, {
            image: info.image,
            frames: info.frames || 1,
            frameDuration: info.frameDuration || 0,
            columns: info.columns || info.frames || 1
        });
    }

    /**
     * Get a specific frame from a sprite sheet.
     * @param {string} spriteId - e.g. "player_hero"
     * @param {string} animation - e.g. "walk_down"
     * @param {number} frameIndex - 0-based frame number
     * @returns {{ image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number } | null}
     */
    getFrame(spriteId, animation, frameIndex) {
        const animMap = this.sprites.get(spriteId);
        if (!animMap) return null;

        const info = animMap.get(animation);
        if (!info || !info.image.complete || info.image.naturalWidth === 0) return null;

        const clampedFrame = frameIndex % info.frames;
        const col = clampedFrame % info.columns;
        const row = Math.floor(clampedFrame / info.columns);

        return {
            image: info.image,
            sx: col * TILE_SIZE,
            sy: row * TILE_SIZE,
            sw: TILE_SIZE,
            sh: TILE_SIZE
        };
    }

    /**
     * Get animation metadata (frame count, duration per frame).
     * @param {string} spriteId
     * @param {string} animation
     * @returns {{ frames: number, frameDuration: number } | null}
     */
    getAnimationInfo(spriteId, animation) {
        const animMap = this.sprites.get(spriteId);
        if (!animMap) return null;

        const info = animMap.get(animation);
        if (!info) return null;

        return { frames: info.frames, frameDuration: info.frameDuration };
    }

    /**
     * Check if a sprite has a specific animation.
     * @param {string} spriteId
     * @param {string} animation
     * @returns {boolean}
     */
    has(spriteId, animation) {
        const animMap = this.sprites.get(spriteId);
        return animMap ? animMap.has(animation) : false;
    }
}
