# runaround-js — Sprite Generation Guide

Prompts and workflow for generating consistent 32×32 pixel art tiles using Google Gemini image generation, replacing the current emoji glyphs and colored rectangles.

## Style Direction

The game is a top-down Zelda-like adventure. The current color palette is:

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

## Style Anchor Prompt

Use this prefix for **every** prompt to maintain consistency. Copy-paste it verbatim each time:

> **Style anchor (paste at the start of every prompt):**
>
> `Pixel art, 32x32 pixels, top-down RPG style, clean readable silhouette, limited palette (blues, earth tones, warm accents), black 1px outline, no anti-aliasing, transparent background. Fantasy adventure game aesthetic similar to classic Game Boy Advance or SNES RPGs viewed from above.`

---

## Complete Asset List

### A. Terrain Tiles (32×32, opaque, tileable where noted)

These fill the entire 32×32 space. No transparency.

#### A1. Wall — `tile_wall.png`
```
Style anchor + "Top-down stone wall tile. Dark blue-gray cobblestone or brick pattern (#1a4ba0 base color). Should tile seamlessly when repeated. Viewed from directly above."
```

#### A2. Floor — `tile_floor.png`
```
Style anchor + "Top-down stone floor tile. Light gray/cream flagstone or packed earth (#f0f0f0 base). Subtle texture, should tile seamlessly. Viewed from directly above."
```

#### A3. Door — `tile_door.png`
```
Style anchor + "Top-down wooden door tile. Brown wooden planks with iron hinges (#8B4513 base). Set in a stone frame. Viewed from directly above."
```

#### A4. Exit Locked — `tile_exit_locked.png`
```
Style anchor + "Top-down locked gate or barred door tile. Iron bars or heavy locked door with a visible padlock or chain. Dark metal tones with blue-gray stone surround. Viewed from directly above."
```

#### A5. Exit Open — `tile_exit_open.png`
```
Style anchor + "Top-down open gateway tile. Same frame as the locked gate but now open, showing a bright inviting passage. Blue-teal accent color (#118ab2). Viewed from directly above."
```

#### A6. Hole — `tile_hole.png`
```
Style anchor + "Top-down pit or hole in stone floor. Dark circular opening in light gray flagstone, shadowed edges suggesting depth. Viewed from directly above."
```

#### A7. Crystal Tile — `tile_crystal.png`
```
Style anchor + "Top-down floor tile with a small collectible gem or crystal sitting on it. Light stone floor base with a bright teal/green gem (#06d6a0) in the center. Gem should sparkle. Viewed from directly above."
```

#### A8. Movable Block — `tile_movable.png`
```
Style anchor + "Top-down pushable wooden crate or stone block. Warm brown wood with visible grain and metal corner brackets. Looks heavy but movable. Viewed from directly above."
```

#### A9–A12. One-Way Arrows — `tile_arrow_up.png`, `tile_arrow_down.png`, `tile_arrow_left.png`, `tile_arrow_right.png`
```
Style anchor + "Top-down floor tile with a carved directional arrow pointing [UP/DOWN/LEFT/RIGHT]. Yellow-gold arrow (#FFD700) engraved into gray stone floor. Viewed from directly above."
```
Generate four variants, one per direction.

---

### B. Entity Sprites (32×32, transparent background)

These are drawn on top of floor tiles. Transparent background is essential.

#### B1. Player (4 directions) — `player_down.png`, `player_up.png`, `player_left.png`, `player_right.png`
```
Style anchor + "Top-down RPG player character, small adventurer with a dark cloak and [red/crimson] accent detail. Facing [DOWN/UP/LEFT/RIGHT]. Simple readable silhouette — head, body, maybe a small sword at side. Transparent background."
```
Generate four variants. The red accent (`#e63946`) keeps the player identifiable.

#### B2. Village Elder NPC — `npc_elder.png`
```
Style anchor + "Top-down elderly villager NPC. White beard, blue robes (#4a90d9), wooden walking staff. Wise and friendly appearance. Small character fitting within 32x32 pixels. Transparent background."
```

#### B3. Slime Enemy — `enemy_slime.png`
```
Style anchor + "Top-down green slime monster. Blobby, translucent green (#06d6a0 to #2d8a4e) with small angry eyes. Gooey drip details. Simple menacing shape. Transparent background."
```

#### B4. Generic NPC — `npc_generic.png`
```
Style anchor + "Top-down generic villager NPC. Simple peasant clothes, blue accent (#4a90d9). Neutral friendly pose. Transparent background."
```

#### B5. Generic Enemy — `enemy_generic.png`
```
Style anchor + "Top-down hostile creature. Small goblin or imp, red tones (#d94a4a). Aggressive stance with small weapon. Transparent background."
```

---

### C. Item Sprites (32×32, transparent background)

Items appear both on the ground (entity layer) and in the inventory sidebar. Generate at 32×32; they'll be displayed at various sizes in the UI.

#### C1. Health Potion — `item_health_potion.png`
```
Style anchor + "Top-down glass potion bottle with red/pink healing liquid. Cork stopper, small heart symbol or cross on label. Warm glow. Transparent background."
```

#### C2. Gold Key — `item_gold_key.png`
```
Style anchor + "Top-down ornate golden key. Classic fantasy skeleton key shape, bright gold (#FFD700) with fine detailing on the bow. Transparent background."
```

#### C3. Sword — `item_sword.png`
```
Style anchor + "Top-down steel short sword. Silver blade, brown leather-wrapped grip, small crossguard. Clean weapon silhouette. Transparent background."
```

#### C4. Shield — `item_shield.png`
```
Style anchor + "Top-down small round wooden shield with metal rim and a simple emblem in the center. Brown and silver tones. Transparent background."
```

#### C5. Bow — `item_bow.png`
```
Style anchor + "Top-down wooden recurve bow with a nocked arrow. Warm brown wood, taut string. Compact design. Transparent background."
```

#### C6. Coin — `item_coin.png`
```
Style anchor + "Top-down shiny gold coin. Circular with a stamped emblem or star, bright gold (#FFD700) with a highlight gleam. Transparent background."
```

#### C7. Gem — `item_gem.png`
```
Style anchor + "Top-down cut gemstone, diamond or ruby shape. Brilliant faceted surface with sparkle highlights. Rich jewel tones. Transparent background."
```

#### C8. Scroll — `item_scroll.png`
```
Style anchor + "Top-down rolled parchment scroll tied with a red ribbon. Aged cream/tan paper, slightly unfurling at ends. Transparent background."
```

#### C9. Ring — `item_ring.png`
```
Style anchor + "Top-down magical ring. Gold band with a small glowing gemstone set in it. Subtle magical sparkle aura. Transparent background."
```

#### C10. Lantern — `item_lantern.png`
```
Style anchor + "Top-down small handheld lantern. Iron frame, glass panels, warm orange flame glow inside. Transparent background."
```

#### C11. Rare Crystal — `item_rare_crystal.png`
```
Style anchor + "Top-down large rare crystal. Bright teal-green (#06d6a0), larger and more elaborate than the regular gem. Multiple facets, strong inner glow, magical sparkle particles. Transparent background."
```

#### C12. Elder Amulet — `item_elder_amulet.png`
```
Style anchor + "Top-down ancient magical amulet on a chain. Circular pendant with a glowing blue eye or mystic symbol in the center. Gold chain, teal-blue glow (#06d6a0). Transparent background."
```

---

### D. Interactive Object Sprites (32×32, transparent background)

#### D1. Sign — `interactive_sign.png`
```
Style anchor + "Top-down wooden signpost. Brown wooden post with a flat sign board, viewed from above. Readable shape, maybe slight shadow on ground. Transparent background."
```

#### D2. Chest (closed) — `interactive_chest_closed.png`
```
Style anchor + "Top-down closed treasure chest. Wooden chest with iron bands and a latch, viewed from above. Brown wood with metal details. Transparent background."
```

#### D3. Chest (opened) — `interactive_chest_open.png`
```
Style anchor + "Top-down opened treasure chest. Same chest as closed but lid is flipped open, showing empty dark interior. Viewed from above. Transparent background."
```

#### D4. Lever (off) — `interactive_lever_off.png`
```
Style anchor + "Top-down stone pedestal with a metal lever in the DOWN/off position. Gray stone base, iron lever arm. Viewed from above. Transparent background."
```

#### D5. Lever (on) — `interactive_lever_on.png`
```
Style anchor + "Top-down stone pedestal with a metal lever in the UP/on position. Same pedestal as off state but lever arm flipped. Viewed from above. Transparent background."
```

---

### E. UI Elements (various sizes, transparent background)

#### E1. Heart Full — `ui_heart_full.png`
```
Style anchor + "Small pixel art heart icon, filled solid red (#e63946). Clean shape, bright and warm. 16x16 pixels. Transparent background."
```

#### E2. Heart Empty — `ui_heart_empty.png`
```
Style anchor + "Small pixel art heart icon, empty/gray outline. Dark gray (#333) outline of a heart shape, hollow interior. 16x16 pixels. Transparent background."
```

---

## Generation Workflow

### Step 1: Generate in batches by category

Group your Gemini sessions by category (all terrain, then all entities, then all items). This helps Gemini stay in the same style zone.

**Recommended batch order:**
1. Terrain tiles (A1–A12) — most critical, must tile well
2. Player sprites (B1) — the character you'll see most
3. Item sprites (C1–C12) — used in world and sidebar
4. Entity sprites (B2–B5) — NPCs and enemies
5. Interactive objects (D1–D5)
6. UI elements (E1–E2)

### Step 2: If results are inconsistent

If a batch comes out in a different style than previous ones, try adding a reference:

```
"Match the exact same pixel art style as [describe a successful previous image]. Same palette, same outline weight, same level of detail."
```

Or regenerate with more specific constraints:

```
"Exactly 4 colors plus black outline. No gradients. No dithering. Chunky readable pixels."
```

### Step 3: Post-processing

After generation, you may need to:

1. **Resize to exactly 32×32** — Gemini may generate at higher resolution. Scale down with nearest-neighbor (not bilinear) to preserve pixel crispness. Any image editor or:
   ```bash
   convert input.png -filter point -resize 32x32 output.png
   ```

2. **Ensure transparency** — If Gemini gives you a colored background instead of transparent, use background removal. For simple pixel art, flood-fill delete the background color in any editor.

3. **Palette normalize** — If colors drift between batches, you can posterize or remap to a fixed palette using a tool like Aseprite or Lospec's palette tools.

### Step 4: File organization

Place all sprites in `public/sprites/`:

```
public/sprites/
  tiles/
    tile_wall.png
    tile_floor.png
    tile_door.png
    tile_exit_locked.png
    tile_exit_open.png
    tile_hole.png
    tile_crystal.png
    tile_movable.png
    tile_arrow_up.png
    tile_arrow_down.png
    tile_arrow_left.png
    tile_arrow_right.png
  entities/
    player_down.png
    player_up.png
    player_left.png
    player_right.png
    npc_elder.png
    npc_generic.png
    enemy_slime.png
    enemy_generic.png
  items/
    item_health_potion.png
    item_gold_key.png
    item_sword.png
    item_shield.png
    item_bow.png
    item_coin.png
    item_gem.png
    item_scroll.png
    item_ring.png
    item_lantern.png
    item_rare_crystal.png
    item_elder_amulet.png
  interactive/
    interactive_sign.png
    interactive_chest_closed.png
    interactive_chest_open.png
    interactive_lever_off.png
    interactive_lever_on.png
  ui/
    ui_heart_full.png
    ui_heart_empty.png
```

---

## Integration Notes (future spec)

Once you have sprites, the renderer changes are straightforward but separate from the UI redesign. The high-level approach:

1. **Create a sprite loader** (`src/game/SpriteLoader.js`) that preloads all PNGs into `Image` objects at startup.
2. **Update `renderer.js`** — replace `ctx.fillRect()` + `ctx.fillText(glyph)` calls with `ctx.drawImage(sprite, screenX, screenY, 32, 32)`.
3. **Update entity rendering** — look up sprite by entity type + id (e.g., `enemy_slime`, `npc_elder`) with fallback to type-based defaults.
4. **Update player rendering** — use `player.facing` to pick the correct directional sprite.
5. **Update sidebar** — replace emoji glyphs in inventory slots with `<img>` tags pointing to item sprites.

This is a separate phase from the UI redesign — do the sidebar/layout work first with glyphs, then swap in sprites later. The two changes are independent.

---

## Prompt Tuning Tips for Gemini

- **If too detailed:** Add "simple, minimal detail, chunky pixels, NES/SNES era"
- **If too cartoony:** Add "clean geometric shapes, no exaggerated features"
- **If colors are off:** Specify exact hex codes and say "use ONLY these colors: #1a4ba0, #f0f0f0, #e63946, #06d6a0, #FFD700, #8B4513, black, white"
- **If backgrounds aren't transparent:** Try "on a solid magenta (#FF00FF) background" then remove that color in post
- **If scale is wrong:** Say "the entire character/object fills most of the 32x32 canvas, not tiny in the center"
- **For tileability:** Say "seamless tiling pattern, edges match when placed adjacent to copies of itself"
