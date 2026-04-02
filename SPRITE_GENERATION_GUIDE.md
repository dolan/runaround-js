# runaround-js — Sprite & Animation Asset Guide

Guide for generating consistent pixel art sprite sheets using PixelLab, and the engine-side system needed to load and animate them. Replaces the current emoji glyphs and colored rectangles with proper animated pixel art.

## Tool: PixelLab

[pixellab.ai](https://www.pixellab.ai/) — AI pixel art generator purpose-built for game assets. Key features we'll use:

- **Directional rotation** — generates 4-direction sprite sheets from a single character (ideal for top-down)
- **Animation generation** — walk, idle, attack cycles as horizontal sprite strips
- **Tileset creation** — Wang tilesets and 3×3 tilesets for terrain (wall-to-floor transitions)
- **Style reference** — feed a reference image so all subsequent generations match
- **Inpainting** — fix specific parts of a sprite without regenerating everything

Works as an Aseprite/Pixelorama plugin or web tool. At 32×32, you get up to 16 frames per generation request.

---

## Style Direction

Top-down Zelda-like adventure. The current color palette:

| Role | Hex | Usage |
|------|-----|-------|
| Wall | `#1a4ba0` | Blue stone walls |
| Floor | `#f0f0f0` | Light walkable ground |
| Player accent | `#e63946` | Facing indicator, selection |
| Crystal/positive | `#06d6a0` | Crystals, health |
| Quest/gold | `#FFD700` | Quest markers |
| Door | `#8B4513` | Wooden doors |
| NPC | `#4a90d9` | Friendly characters |
| Enemy | `#d94a4a` | Hostile characters |
| Item | `#d9d94a` | Pickups |
| Interactive | `#8B4513` | Signs, chests, levers |

**PixelLab style reference workflow:** Generate your first asset (the player idle-down sprite) and get it looking right. Then use that as the **style reference** for every subsequent generation. This is how PixelLab maintains consistency across all your assets — far more reliable than prompt-only approaches.

---

## Sprite Sheet Conventions

All sprite sheets follow these rules so the engine can load them generically:

### Format
- **PNG** with transparency
- **Horizontal strip**: frames laid out left-to-right in a single row
- Each frame is **32×32 pixels**
- A 4-frame walk cycle sheet = 128×32 PNG
- A static sprite (no animation) = 32×32 PNG (1 frame)

### File naming
```
{category}_{name}_{animation}_{direction}.png
```

Examples:
```
player_hero_idle_down.png      → 2-frame idle, facing down
player_hero_walk_down.png      → 4-frame walk cycle, facing down
player_hero_walk_up.png        → 4-frame walk cycle, facing up
entity_slime_idle.png          → 2-frame idle (no direction, blob)
entity_elder_idle_down.png     → 2-frame idle, facing down
item_health_potion.png         → 1-frame static
tile_wall.png                  → 1-frame static
```

### Sprite sheet manifest: `sprites.json`

A single JSON file in `public/sprites/` that tells the engine how to slice every sheet:

```json
{
  "player_hero": {
    "idle_down":  { "file": "player/hero_idle_down.png",  "frames": 2, "frameDuration": 500 },
    "idle_up":    { "file": "player/hero_idle_up.png",    "frames": 2, "frameDuration": 500 },
    "idle_left":  { "file": "player/hero_idle_left.png",  "frames": 2, "frameDuration": 500 },
    "idle_right": { "file": "player/hero_idle_right.png", "frames": 2, "frameDuration": 500 },
    "walk_down":  { "file": "player/hero_walk_down.png",  "frames": 4, "frameDuration": 150 },
    "walk_up":    { "file": "player/hero_walk_up.png",    "frames": 4, "frameDuration": 150 },
    "walk_left":  { "file": "player/hero_walk_left.png",  "frames": 4, "frameDuration": 150 },
    "walk_right": { "file": "player/hero_walk_right.png", "frames": 4, "frameDuration": 150 },
    "attack_down":{ "file": "player/hero_attack_down.png","frames": 3, "frameDuration": 100 }
  },
  "entity_slime": {
    "idle":       { "file": "entities/slime_idle.png",    "frames": 2, "frameDuration": 400 },
    "move":       { "file": "entities/slime_move.png",    "frames": 4, "frameDuration": 200 }
  },
  "entity_elder": {
    "idle_down":  { "file": "entities/elder_idle_down.png","frames": 2, "frameDuration": 600 }
  },
  "item_health_potion": {
    "default":    { "file": "items/health_potion.png",    "frames": 1, "frameDuration": 0 }
  },
  "tile_wall": {
    "default":    { "file": "tiles/wall.png",             "frames": 1, "frameDuration": 0 }
  },
  "tile_crystal": {
    "default":    { "file": "tiles/crystal.png",          "frames": 4, "frameDuration": 200 }
  }
}
```

Fields:
- `file` — path relative to `public/sprites/`
- `frames` — number of 32×32 frames in the horizontal strip
- `frameDuration` — milliseconds per frame (0 = static, no animation)

---

## Complete Asset List

### A. Terrain Tiles

Static tiles (1 frame) unless noted. Opaque, no transparency. Must tile seamlessly.

| ID | Filename | Frames | PixelLab Tool | Description |
|----|----------|--------|---------------|-------------|
| A1 | `tiles/wall.png` | 1 | Create tileset | Blue-gray stone wall, top-down |
| A2 | `tiles/floor.png` | 1 | Create tileset | Light stone/dirt floor, top-down |
| A3 | `tiles/door.png` | 1 | Create S-M image | Wooden door with hinges |
| A4 | `tiles/exit_locked.png` | 1 | Create S-M image | Iron-barred locked gate |
| A5 | `tiles/exit_open.png` | 1 | Create S-M image | Open gateway, bright passage |
| A6 | `tiles/hole.png` | 1 | Create S-M image | Dark pit in stone floor |
| A7 | `tiles/crystal.png` | 4 | Create S-M image + Animate | Sparkling teal gem on floor |
| A8 | `tiles/movable.png` | 1 | Create S-M image | Pushable wooden crate |
| A9–12 | `tiles/arrow_{dir}.png` | 1 | Create S-M image | One-way floor arrows (up/down/left/right) |

**PixelLab tileset workflow for A1+A2:** Use the **Create tileset** tool. Set inner tile to "stone floor" and outer tile to "blue stone wall." This generates a proper Wang tileset with transition tiles (wall corners, edges, etc.). Export the tileset PNG and slice the individual tiles you need. Even if you only use wall and floor initially, you'll have transition tiles ready for later polish.

### B. Player Character

The player needs 4 directions × multiple animation states. Use PixelLab's **directional rotation** tool: generate the down-facing sprite first, then rotate to get the other 3 directions.

| ID | Filename pattern | Frames | PixelLab Tool | Description |
|----|-----------------|--------|---------------|-------------|
| B1 | `player/hero_idle_{dir}.png` | 2 | Rotate + Animate | Subtle breathing/sway idle |
| B2 | `player/hero_walk_{dir}.png` | 4 | Rotate + Animate | Walk cycle |
| B3 | `player/hero_attack_{dir}.png` | 3 | Animate with text | Sword swing or lunge |

That's 4 directions × 3 animations = **12 sprite sheets** for the player.

**PixelLab workflow:**
1. Use **Create S-M image** to generate the base hero sprite (facing down). Get this one perfect — it's your style anchor.
2. Use **Rotate** tool to create left, right, up variants.
3. For each direction, use **Animate with text** or **Animate with skeleton** to generate walk and idle cycles.
4. Use the down-facing sprite as a **style reference** for all other character/entity generations.

### C. Entity Sprites (NPCs, Enemies)

NPCs and enemies need at minimum an idle animation. Enemies that chase the player also need a move animation.

| ID | Filename pattern | Frames | Description |
|----|-----------------|--------|-------------|
| C1 | `entities/elder_idle_down.png` | 2 | Village Elder, blue robes, white beard |
| C2 | `entities/generic_npc_idle_down.png` | 2 | Generic villager |
| C3 | `entities/slime_idle.png` | 2 | Green slime blob, pulsing |
| C4 | `entities/slime_move.png` | 4 | Green slime hopping/sliding |
| C5 | `entities/generic_enemy_idle.png` | 2 | Goblin or imp, red tones |

Entities that don't move (Elder, signs) only need a single-direction idle. Enemies that pathfind toward the player ideally need 4-direction sheets, but can start with a single omnidirectional animation (like the slime blob).

### D. Item Sprites

All static (1 frame). Transparent background. Used both on the ground (entity layer) and in the inventory sidebar.

| ID | Filename | Description |
|----|----------|-------------|
| D1 | `items/health_potion.png` | Red potion bottle |
| D2 | `items/gold_key.png` | Ornate golden key |
| D3 | `items/sword.png` | Steel short sword |
| D4 | `items/shield.png` | Round wooden shield |
| D5 | `items/bow.png` | Wooden bow |
| D6 | `items/coin.png` | Gold coin |
| D7 | `items/gem.png` | Faceted gemstone |
| D8 | `items/scroll.png` | Rolled parchment |
| D9 | `items/ring.png` | Magical ring |
| D10 | `items/lantern.png` | Iron lantern |
| D11 | `items/rare_crystal.png` | Large glowing teal crystal |
| D12 | `items/elder_amulet.png` | Ancient amulet with blue glow |

**PixelLab tip:** Generate all items in one session using the same style reference. Use **Create S-M image** for each. These are small and simple — PixelLab handles static objects well.

### E. Interactive Object Sprites

| ID | Filename | Frames | Description |
|----|----------|--------|-------------|
| E1 | `interactive/sign.png` | 1 | Wooden signpost |
| E2 | `interactive/chest_closed.png` | 1 | Closed treasure chest |
| E3 | `interactive/chest_open.png` | 1 | Open treasure chest |
| E4 | `interactive/lever_off.png` | 1 | Lever in off position |
| E5 | `interactive/lever_on.png` | 1 | Lever in on position |

### F. UI Sprites

| ID | Filename | Size | Description |
|----|----------|------|-------------|
| F1 | `ui/heart_full.png` | 16×16 | Filled red heart |
| F2 | `ui/heart_empty.png` | 16×16 | Empty gray heart outline |

---

## PixelLab Generation Order

Generate in this order to build up style consistency:

1. **Player hero (down-facing idle)** — your style anchor. Iterate until perfect.
2. **Player hero (all directions, all animations)** — use Rotate + Animate tools with step 1 as reference.
3. **Terrain tileset (wall + floor)** — use Create tileset tool. Reference the player sprite for style matching.
4. **Other terrain tiles** (door, exit, hole, crystal, crate, arrows) — use step 1 as style reference.
5. **Items** (all 12) — batch these in one session with style reference.
6. **Interactive objects** (sign, chest, lever) — batch with style reference.
7. **Entity NPCs** (elder, generic) — use Rotate for directions, style reference from player.
8. **Entity enemies** (slime, generic) — Animate for movement cycles.
9. **UI hearts** — simple, do last.

---

## Engine Implementation: Sprite Sheet System

This is a **new phase** of work, independent from the UI redesign. It should come after the UI redesign phases are complete.

### New files to create:

#### `src/game/SpriteLoader.js`

```js
/**
 * Loads sprite sheet manifest and preloads all PNG images.
 * Returns a SpriteAtlas that the renderer and animation system use.
 */
export class SpriteLoader {
    /**
     * Load the manifest and all sprite sheet images.
     * @param {string} manifestUrl - Path to sprites.json
     * @returns {Promise<SpriteAtlas>}
     */
    async load(manifestUrl) { ... }
}

/**
 * Lookup table for loaded sprite sheets.
 * Provides frame-level access to any sprite by ID and animation name.
 */
export class SpriteAtlas {
    /**
     * Get a specific frame from a sprite sheet.
     * @param {string} spriteId - e.g. "player_hero"
     * @param {string} animation - e.g. "walk_down"
     * @param {number} frameIndex - 0-based frame number
     * @returns {{ image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number }}
     */
    getFrame(spriteId, animation, frameIndex) { ... }

    /**
     * Get the animation metadata (frame count, duration).
     * @param {string} spriteId
     * @param {string} animation
     * @returns {{ frames: number, frameDuration: number }}
     */
    getAnimationInfo(spriteId, animation) { ... }
}
```

#### `src/game/AnimationState.js`

```js
/**
 * Tracks the current animation frame for an animated sprite.
 * Each entity/player that animates gets one of these.
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
    }

    /**
     * Switch to a different animation. Resets frame to 0.
     * No-op if already playing that animation.
     * @param {string} animation
     */
    play(animation) { ... }

    /**
     * Advance the animation by deltaTime milliseconds.
     * Updates frameIndex based on frameDuration from the atlas.
     * @param {number} deltaTime - ms since last update
     * @param {SpriteAtlas} atlas
     */
    update(deltaTime, atlas) { ... }

    /**
     * Get the current frame info for rendering.
     * @param {SpriteAtlas} atlas
     * @returns {{ image, sx, sy, sw, sh }}
     */
    getCurrentFrame(atlas) { ... }
}
```

### Files to modify:

#### `src/game/renderer.js`

Replace the drawing functions. The key change in `drawTile()`:

```js
// BEFORE
ctx.fillStyle = getTileColor(tile);
ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
const glyph = getTileGlyph(tile, player, board);
if (glyph) { ctx.fillText(glyph, ...); }

// AFTER
const frame = spriteAtlas.getFrame(tileToSpriteId(tile), 'default', 0);
if (frame) {
    ctx.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh,
                  screenX, screenY, TILE_SIZE, TILE_SIZE);
} else {
    // Fallback to colored rectangle (graceful degradation)
    ctx.fillStyle = getTileColor(tile);
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
}
```

The animated crystal tile would use an AnimationState to cycle frames.

For the player in `drawPlayer()`:

```js
// BEFORE: stick figure drawn with arcs and lines
// AFTER:
const frame = playerAnimState.getCurrentFrame(spriteAtlas);
ctx.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh,
              screenX - TILE_SIZE/2, screenY - TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
```

For entities in `drawEntities()`:

```js
// BEFORE: colored rectangle + emoji glyph
// AFTER: look up entity's sprite sheet and animation state
const entitySpriteId = getEntitySpriteId(entity); // e.g. "entity_slime"
const frame = entity.animState
    ? entity.animState.getCurrentFrame(spriteAtlas)
    : spriteAtlas.getFrame(entitySpriteId, 'default', 0);
if (frame) {
    ctx.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh,
                  screenX, screenY, TILE_SIZE, TILE_SIZE);
} else {
    // fallback to colored rect + glyph (existing behavior)
}
```

#### `src/game/main.js`

- Load sprite atlas at startup (before `startGame()`).
- Create player `AnimationState`, update it each frame.
- On player move: switch animation to `walk_{direction}`, then back to `idle_{direction}` when stopped.
- Pass `spriteAtlas` to renderer functions.
- Call `animState.update(deltaTime, spriteAtlas)` in game loop (requires tracking deltaTime between frames).

#### `src/game/constants.js`

Add a tile-to-sprite mapping:

```js
export const tileSpriteMap = {
    'w': 'tile_wall',
    '.': 'tile_floor',
    'c': 'tile_crystal',
    'x': 'tile_exit',      // renderer picks locked vs open based on game state
    'm': 'tile_movable',
    'h': 'tile_hole',
    'ol': 'tile_arrow_left',
    'or': 'tile_arrow_right',
    'ou': 'tile_arrow_up',
    'od': 'tile_arrow_down',
    'd': 'tile_door'
};
```

### Entity sprite mapping

Entities in board JSON can optionally specify a `spriteId` field:

```json
{
    "id": "elder",
    "type": "npc",
    "spriteId": "entity_elder",
    "x": 3, "y": 2,
    "properties": { ... }
}
```

If `spriteId` is absent, fall back to a type-based default (`entity_generic_npc`, `entity_generic_enemy`, etc.), and if that's absent, fall back to the existing colored-rectangle-plus-glyph rendering. This keeps the system backward-compatible — boards don't need to be updated until their sprites exist.

### DeltaTime tracking

The current game loop doesn't track deltaTime. Add it:

```js
let lastFrameTime = 0;

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    if (board && player) {
        // Update animations
        playerAnimState.update(deltaTime, spriteAtlas);
        entityRegistry.updateAnimations(deltaTime, spriteAtlas);

        // Existing render calls...
        updateViewport();
        drawGame(ctx, board, player, viewportX, viewportY, entityRegistry, spriteAtlas);
        // ...
    }
    requestAnimationFrame(gameLoop);
}
```

---

## Fallback Strategy

**Critical:** sprites are additive, not a hard cutover. The renderer must gracefully fall back to the existing colored rectangles + emoji when a sprite is missing. This means:

1. Sprites can be added incrementally — do the player first, then tiles, then entities.
2. The game remains fully playable at every stage.
3. Board JSON files don't need to change until you're ready.
4. The sprite atlas returns `null` for missing sprites, and the renderer checks before drawing.

---

## File Organization

```
public/sprites/
    sprites.json              ← manifest
    player/
        hero_idle_down.png
        hero_idle_up.png
        hero_idle_left.png
        hero_idle_right.png
        hero_walk_down.png
        hero_walk_up.png
        hero_walk_left.png
        hero_walk_right.png
        hero_attack_down.png
        hero_attack_up.png
        hero_attack_left.png
        hero_attack_right.png
    tiles/
        wall.png
        floor.png
        door.png
        exit_locked.png
        exit_open.png
        hole.png
        crystal.png           ← 4-frame animated strip (128×32)
        movable.png
        arrow_up.png
        arrow_down.png
        arrow_left.png
        arrow_right.png
    entities/
        elder_idle_down.png
        generic_npc_idle_down.png
        slime_idle.png
        slime_move.png
        generic_enemy_idle.png
    items/
        health_potion.png
        gold_key.png
        sword.png
        shield.png
        bow.png
        coin.png
        gem.png
        scroll.png
        ring.png
        lantern.png
        rare_crystal.png
        elder_amulet.png
    interactive/
        sign.png
        chest_closed.png
        chest_open.png
        lever_off.png
        lever_on.png
    ui/
        heart_full.png
        heart_empty.png
```

---

## Implementation Phasing

This work is **separate from and comes after** the UI redesign (Phases 1–5 in `UI_REDESIGN_SPEC.md`).

**Sprite Phase A: Engine plumbing**
- Create `SpriteLoader.js`, `SpriteAtlas`, `AnimationState.js`
- Add deltaTime tracking to game loop
- Add fallback-aware sprite drawing to renderer
- Create empty `sprites.json` manifest
- Tests: loader handles missing files gracefully, animation state cycles frames correctly

**Sprite Phase B: Player sprite**
- Generate player sprite sheets in PixelLab (idle + walk, 4 directions)
- Add to manifest, wire player rendering to use sprites
- Switch animation on move/idle state changes
- Test: player animates when walking, idles when stopped, faces correct direction

**Sprite Phase C: Terrain tiles**
- Generate tileset in PixelLab (wall, floor, transitions)
- Generate individual special tiles (door, exit, crystal, crate, hole, arrows)
- Wire tile rendering to sprite atlas with fallback
- Test: boards render with sprites, crystal animates

**Sprite Phase D: Entities and items**
- Generate NPC/enemy sprites and item icons
- Add `spriteId` field to entity definitions in board JSON
- Wire entity rendering to sprite atlas with fallback
- Update sidebar inventory to show `<img>` sprites instead of emoji glyphs
- Test: entities render with sprites, inventory shows item art

Each phase is a separate branch. The game remains playable after every commit because of the fallback system.
