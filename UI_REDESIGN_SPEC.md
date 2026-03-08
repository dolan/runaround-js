# runaround-js — UI Redesign Implementation Plan

This spec describes how to migrate the game UI from canvas-only overlays to a DOM-based sidebar layout. The game canvas continues to render tiles, entities, and the player. All HUD/status/inventory/minimap UI moves out of the canvas into HTML/CSS DOM elements in a sidebar panel.

**Reference mockup:** See `runaround-ui-mockup.jsx` in the project root for the target layout and component structure. The mockup is React/JSX for prototyping only — the implementation must be vanilla JS/DOM to match the existing codebase.

## Current State

Phases 1–3 are complete. The game now has:

- Horizontal flex layout: 640×480 game canvas on the left, 200px DOM sidebar on the right (`#game-frame`).
- Sidebar panels: minimap (`MinimapRenderer.js` drawing on `#minimapCanvas`), status (health hearts, crystal counter, board name), inventory grid (3×3 with selection), quest tracker, footer with help/dev toggle buttons.
- DOM-based HUD via `SidebarRenderer.js` — no more canvas overlays for health, inventory, or minimap.
- Inventory selection via number keys 1-9 or click, item use via E key (`handleItemUse()` in `main.js`).
- Crystal counter hides automatically on boards with no `requiredCrystals`.
- Quest log still rendered as a canvas overlay (`QuestLogRenderer.js`, toggled by Q key). Sidebar shows a compact always-visible quest tracker.
- `ITEM_USE` event emitted on item use. Health potions and gold keys have implemented effects.
- Dev tools (Save, Load, Restart) shown below the game frame (toggle not yet wired — Phase 4).
- Change-detection caching on all sidebar updates to avoid DOM thrashing at 60fps.

**Retired files:** `HudRenderer.js`, `WorldRenderer.js`, `test/hudRenderer.test.js`
**New files:** `SidebarRenderer.js`, `MinimapRenderer.js`, `test/sidebarRenderer.test.js`, `test/inventorySelection.test.js`
**Moved:** `itemGlyphs` from `HudRenderer.js` → `constants.js`

Still remaining:
- No help screen (Phase 4).
- No dev tools toggle (Phase 4).
- No gamepad support (Phase 5).
- No sprite-based rendering (Phase 6).

## Target State

- Game canvas (640×480) on the left, 200px DOM sidebar on the right, wrapped in a flex container.
- Sidebar contains: minimap, status (health + crystals), inventory grid, quest tracker, help button, dev tools toggle.
- No HUD overlays on the canvas (health, inventory, minimap all move to sidebar).
- Canvas only renders: tiles, entities, player, facing indicator. Quest log overlay on canvas is acceptable to keep for now OR can move to sidebar.
- Inventory has selection (number keys 1-9 or click) and use (E key) mechanics.
- Help overlay (H or ? key) showing keyboard and gamepad controls.
- Gamepad API support for Xbox controllers.
- Dev tools hidden behind a toggle button, not always visible.
- Crystal counter hides entirely when a board has no `requiredCrystals` (i.e., when it is 0 or unset). Most world-mode boards use door/warp transitions instead of crystal gates, so the counter should not always be visible.

## Commands

- `npm start` — Vite dev server
- `npm test` — Vitest test runner
- `npm run build` — Vite production build

## Implementation Phases

Execute these phases in order. Each phase should be a **separate branch** (e.g., `ui/phase1-layout`, `ui/phase2-sidebar-panels`, etc.). Commit frequently. Run `npm test` after each change to avoid regressions.

---

### Phase 1: Layout Restructure ✅ COMPLETE

**Goal:** Change the page layout from vertically-stacked (canvas → info → controls) to a horizontal flex layout (canvas + sidebar), without changing any game logic.

**Branch:** `phase4/ui-improvements` (merged via PR #7)

#### 1.1 Update `index.html`

Replace the current HTML structure:

```html
<!-- BEFORE (current index.html) -->
<div id="game-container">
    <canvas id="gameCanvas"></canvas>
    <div id="game-info">
        <span id="board-name"></span>
        <span id="health-display">Health: 3/3</span>
        <span>Crystals: <span id="crystal-count">0</span></span>
    </div>
</div>
<div id="controls">
    <button id="saveButton">Save Level</button>
    <input type="file" id="loadFile" accept=".json">
    <button id="killButton">Restart</button>
</div>
<div id="messagePanel">
    <div id="messageText"></div>
    <button id="dismissButton">OK</button>
</div>
```

With this structure:

```html
<div id="game-frame">
    <!-- Left: game viewport -->
    <div id="game-viewport">
        <canvas id="gameCanvas"></canvas>
    </div>

    <!-- Right: sidebar -->
    <div id="game-sidebar">
        <div id="sidebar-minimap" class="sidebar-section">
            <div class="sidebar-title">WORLD MAP</div>
            <canvas id="minimapCanvas" width="120" height="120"></canvas>
        </div>
        <div id="sidebar-status" class="sidebar-section">
            <div class="sidebar-title">STATUS</div>
            <div id="sidebar-health"></div>
            <div id="crystal-display"></div>
            <div id="board-name-display"></div>
        </div>
        <div id="sidebar-inventory" class="sidebar-section">
            <div class="sidebar-title">INVENTORY</div>
            <div id="inventory-grid"></div>
            <div id="inventory-selected"></div>
        </div>
        <div id="sidebar-quests" class="sidebar-section collapsible">
            <div class="sidebar-title" id="quest-toggle">
                QUESTS <span class="collapse-indicator">▾</span>
            </div>
            <div id="quest-tracker"></div>
        </div>
        <div id="sidebar-spacer"></div>
        <div id="sidebar-footer">
            <div id="gamepad-status"></div>
            <div id="sidebar-buttons">
                <button id="helpButton">? Help</button>
                <button id="devToolsToggle">⚙</button>
            </div>
        </div>
    </div>
</div>

<!-- Dev tools (below main frame, hidden by default) -->
<div id="dev-tools" style="display: none;">
    <span class="dev-label">DEV</span>
    <button id="saveButton">Save</button>
    <input type="file" id="loadFile" accept=".json">
    <button id="killButton">Restart</button>
</div>

<!-- Message/dialogue panel (keep existing structure, restyle) -->
<div id="messagePanel">
    <div id="messageText"></div>
    <button id="dismissButton">OK</button>
</div>

<!-- Help overlay (new) -->
<div id="helpOverlay" style="display: none;">
    <!-- Populated by JS -->
</div>
```

#### 1.2 Update `css/styles.css`

Rewrite the stylesheet for the new layout. Key properties:

```css
body {
    font-family: 'Courier New', monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #0d0d1a;
    color: #ddd;
    margin: 0;
    padding: 24px;
}

/* Main frame: flex row, game + sidebar */
#game-frame {
    display: flex;
    border: 1px solid #222;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}

#game-viewport {
    position: relative;
    width: 640px;
    height: 480px;
}

#game-sidebar {
    width: 200px;
    background: #111122;
    display: flex;
    flex-direction: column;
    border-left: 1px solid rgba(255,255,255,0.06);
    font-family: 'Courier New', monospace;
}

.sidebar-section {
    border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 10px 12px;
}

.sidebar-title {
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #666;
    font-weight: bold;
    margin-bottom: 8px;
}

#sidebar-spacer {
    flex: 1;
}
```

- Body background darkens from `#222` to `#0d0d1a` to match mockup.
- Monospace font for all sidebar text.
- Sidebar sections separated by subtle borders.
- `#sidebar-spacer` gets `flex: 1` to push footer to bottom.

#### 1.3 Temporarily keep old game-info working

The current `main.js` has `updateGameInfo()` which references `getElementById('health-display')` and `getElementById('crystal-count')`. Since Phase 1 does not modify JS:

- Keep the old `#game-info` div in the HTML but hide it with `display: none` (so the JS doesn't crash on missing elements).
- The sidebar uses new IDs: `#sidebar-health`, `#crystal-display`, `#board-name-display`.
- Phase 2 will rewire the JS to use the sidebar IDs and remove the hidden `#game-info`.

#### 1.4 Verify nothing breaks

- The game canvas must still render at 640×480.
- Existing `drawGame()`, `drawHud()`, `drawMinimap()`, `drawQuestLog()` still called — they just render on-canvas until Phase 2 migrates them.
- `#messagePanel` must still appear/dismiss correctly.
- All keyboard input must still work.
- `npm test` must pass.

**Key constraint:** This phase changes ONLY HTML and CSS. Do not modify any JS files in `src/`.

---

### Phase 2: Migrate HUD to DOM Sidebar ✅ COMPLETE

**Goal:** Move health, crystals, inventory, minimap, and quest tracker from canvas rendering to DOM elements in the sidebar. Remove canvas HUD overlays.

**Branch:** `feature/Phase-5-improve-ui`

#### 2.1 Create `src/ui/SidebarRenderer.js`

New module that updates DOM elements in the sidebar:

```js
/**
 * Update the health display in the sidebar.
 * Renders emoji hearts: ❤️ for full, 🖤 for empty.
 * @param {number} health
 * @param {number} maxHealth
 */
export function updateHealth(health, maxHealth) { ... }

/**
 * Update the crystal count display.
 * Shows "💎 X/Y" when required > 0. Hides entirely when required is 0 or unset.
 * @param {number} current
 * @param {number} required
 */
export function updateCrystals(current, required) { ... }

/**
 * Update the board name display in the sidebar status section.
 * @param {string} name
 */
export function updateBoardName(name) { ... }

/**
 * Update the inventory grid in the sidebar.
 * Renders a 3×3 grid of slots. Items show glyph + count.
 * @param {import('../entities/Inventory.js').Inventory} inventory
 * @param {number} selectedIndex - Currently selected slot (Phase 3 adds selection)
 */
export function updateInventory(inventory, selectedIndex) { ... }

/**
 * Update the quest tracker in the sidebar.
 * Shows active quests with current objective.
 * @param {import('../events/QuestSystem.js').QuestSystem} questSystem
 */
export function updateQuests(questSystem) { ... }
```

**Implementation notes:**

- `updateHealth()`: Write emoji hearts into `#sidebar-health`. Use `textContent` or create span elements. Match the pattern in `HudRenderer.drawHealth()` — ❤️ for full, 🖤 for empty.
- `updateCrystals()`: Write "💎 X/Y" into `#crystal-display`. **When `required` is 0 or falsy, hide `#crystal-display` entirely** (`display: none`). The world-mode boards (`world_clearing.json`, `world_cave.json`, etc.) do not set `requiredCrystals`, so on these boards the crystal counter should not be visible.
- `updateBoardName()`: Write the board name into `#board-name-display`.
- `updateInventory()`: Build a 3×3 CSS grid of button elements in `#inventory-grid`. Each slot shows the item glyph (from the `itemGlyphs` map — move it to a shared location). Number keys 1-9 shown as tiny labels. Selected slot gets a highlight border. Show selected item name in `#inventory-selected`. For Phase 2, `selectedIndex` can default to -1 (nothing selected) since selection is added in Phase 3.
- `updateQuests()`: Render active quest names and current objectives into `#quest-tracker`. Use `questSystem.getActiveQuests()` which returns quest objects with `.name` and `.stageDescription` properties.

Call these from `main.js` — either every frame in the game loop, or preferably on state change (after player moves, after inventory changes, after quest updates).

#### 2.2 Create `src/ui/MinimapRenderer.js`

Move minimap rendering from `src/world/WorldRenderer.js` to a dedicated small canvas (`#minimapCanvas`) in the sidebar.

- Copy the drawing logic from `WorldRenderer.js` → `drawMinimap()` into the new file.
- Adapt it to draw on `#minimapCanvas` (its own 2D context) instead of the main game canvas context.
- The current minimap uses `worldGraph.getAllBoardIds()`, `worldGraph.getBoardInfo(id)` for grid positions, `worldGraph.getAllTransitions()` for edges, and `playerState.currentBoardId` / `playerState.hasVisited(id)` for coloring.
- Size the minimap canvas to fit the sidebar (roughly 120×120, or calculate from the world graph dimensions).
- Export `updateMinimap(minimapCtx, worldGraph, playerState)`.

#### 2.3 Update `src/game/main.js`

- Import `SidebarRenderer` and `MinimapRenderer`.
- In the game loop (`gameLoop()`), replace `drawHud(ctx, player, inventory)` with calls to `SidebarRenderer.updateHealth()`, `updateCrystals()`, `updateInventory()`.
- Replace `drawMinimap(ctx, worldGraph, playerState)` with `MinimapRenderer.updateMinimap()`.
- Add `SidebarRenderer.updateQuests(questSystem)` to the game loop. The sidebar quest tracker should always be visible (compact, showing active quest + objective). The full quest log overlay (Q key) can remain as a canvas overlay or be converted to a DOM overlay — either is acceptable.
- Remove the `drawHud()` call entirely so nothing overlays the game canvas.
- Remove the `drawMinimap()` call from the game loop.
- Rewrite `updateGameInfo()` to call `SidebarRenderer.updateHealth()` and `SidebarRenderer.updateCrystals()`. Pass `board.requiredCrystals || 0` as the required count.
- Rewrite `updateBoardName()` to call `SidebarRenderer.updateBoardName()`.
- Remove the hidden `#game-info` div from `index.html` (no longer needed).

#### 2.4 Move `itemGlyphs` to a shared location

The `itemGlyphs` map currently lives in `src/ui/HudRenderer.js`. Move it to `src/game/constants.js` (alongside `gameColors`, `glyphs`, `entityColors`):

```js
export const itemGlyphs = {
    health_potion: '🧪',
    gold_key: '🗝️',
    sword: '⚔️',
    shield: '🛡️',
    bow: '🏹',
    coin: '🪙',
    gem: '💎',
    scroll: '📜',
    ring: '💍',
    lantern: '🔦',
    rare_crystal: '💎',
    elder_amulet: '🧿'
};
```

#### 2.5 Retire `src/ui/HudRenderer.js`

Delete the file. The `drawHealth()` and `drawInventory()` functions are fully replaced by `SidebarRenderer`. Remove the import from `main.js`.

#### 2.6 Retire `src/world/WorldRenderer.js`

Delete the file (the `drawMinimap()` function is replaced by `MinimapRenderer`). Remove the import from `main.js`.

#### 2.7 Update tests

- `test/hudRenderer.test.js` tests canvas-based HUD drawing. Replace these tests with new tests for `SidebarRenderer` functions (which update DOM elements — use jsdom).
- Add tests for `SidebarRenderer.updateInventory()` verifying correct number of slots, glyph rendering.
- Add tests for `SidebarRenderer.updateCrystals()` verifying it hides when required is 0.
- Add tests for `MinimapRenderer` if practical (may need to mock canvas context like existing tests do).
- `test/questLogRenderer.test.js` — update or keep depending on whether the quest log overlay stays canvas-based.

**Constraints:**
- Do NOT change game logic (Player, Board, Entity, Event systems).
- The game canvas renders ONLY tiles, entities, player, and facing indicator after this phase.
- Sidebar updates should not cause visible lag — avoid heavy DOM manipulation per frame. Prefer updating only when state changes.

---

### Phase 3: Inventory Selection & Item Use ✅ COMPLETE

**Goal:** Add the ability to select inventory items and use them.

**Branch:** `feature/Phase-5-improve-ui`

#### 3.1 Add selection state

Add a `selectedIndex` property to track which inventory slot is selected. This should live in `main.js` as module-level state (like `questLogVisible`), since it's a UI concern, not an inventory data concern.

```js
let inventorySelectedIndex = 0;
```

#### 3.2 Keyboard input

In the `keydown` handler in `main.js`:

- **Number keys 1-9:** Set `inventorySelectedIndex` to `keyNum - 1`. Call `SidebarRenderer.updateInventory(inventory, inventorySelectedIndex)` to refresh the highlight.
- **E key:** Use the selected item. Look up which item is in that slot, then call `inventory.remove(itemId)` and trigger the appropriate game effect. For now, implement item use for:
  - `health_potion`: Restore 1 health (up to `player.maxHealth`). Show message "Used health potion. Health restored!"
  - `gold_key`: Check if player is facing a locked door/gate entity. If so, unlock it (remove entity or change state). Show message.
  - Default: Show message "Can't use that here."

#### 3.3 Item use via EventBus

Emit an `ITEM_USE` event when the player uses an item:

```js
eventBus.emit(GameEvents.ITEM_USE, { itemId, slotIndex: inventorySelectedIndex });
```

**Note:** `ITEM_USE` already exists in `GameEvents` (`src/events/EventBus.js`, value `'item:use'`). No changes to `EventBus.js` are needed.

#### 3.4 Sidebar inventory display

The `SidebarRenderer.updateInventory()` function (from Phase 2) already accepts `selectedIndex`. Ensure:

- Selected slot has a visible border/highlight (e.g., `2px solid #e63946`).
- Below the grid, show the selected item's name (human-readable, replace underscores with spaces) and "[E] use" hint.
- Clicking a slot selects it (add click handlers to slot buttons).

#### 3.5 Tests

- Test that pressing number keys updates `inventorySelectedIndex`.
- Test that pressing E with a health potion selected restores health.
- Test that pressing E with an empty slot does nothing.
- Test that `ITEM_USE` event is emitted with correct payload.

---

### Phase 4: Help Screen & Dev Tools Toggle ⬜ TODO

**Goal:** Add a toggleable help overlay and clean up dev tool visibility.

**Branch:** `feature/Phase-5-improve-ui`

#### 4.1 Help overlay

Create `src/ui/HelpOverlay.js`:

```js
/**
 * Show/hide the help overlay.
 * Renders a key binding reference card over the game viewport.
 */
export function showHelp() { ... }
export function hideHelp() { ... }
export function toggleHelp() { ... }
export function isHelpVisible() { ... }
```

The overlay should:
- Cover the game viewport area (not the sidebar) with a semi-transparent background.
- Show two tabs: "Keyboard" and "Gamepad".
- List all key bindings in a clean two-column format (key → action).
- Close on Escape, clicking outside, or pressing H/? again.
- Use DOM elements (not canvas rendering) — populate `#helpOverlay`.

**Keyboard controls to show:**
| Key | Action |
|-----|--------|
| ← → ↑ ↓ | Move |
| Space | Interact / Attack |
| 1-9 | Select inventory item |
| E | Use selected item |
| Q | Toggle quest log |
| H / ? | Toggle help |
| Enter | Dismiss message |
| Esc | Close dialogue / menu |

**Gamepad controls to show:**
| Button | Action |
|--------|--------|
| D-Pad / Left Stick | Move |
| A Button | Interact / Attack |
| LB / RB | Cycle inventory |
| X Button | Use selected item |
| Y Button | Toggle quest log |
| Select | Toggle help |
| Start | Pause menu |

#### 4.2 Wire help toggle

In `main.js` keydown handler, add:

```js
if (event.key === 'h' || event.key === 'H' || event.key === '?') {
    toggleHelp();
    return;
}
```

Block game input while help is visible (check `isHelpVisible()` early in the keydown handler and return).

Add a click handler on the `#helpButton` in the sidebar footer.

#### 4.3 Dev tools toggle

```js
document.getElementById('devToolsToggle').addEventListener('click', () => {
    const panel = document.getElementById('dev-tools');
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
});
```

Style the dev tools panel with an orange-tinted border (`rgba(255,100,0,0.2)`) to visually distinguish it from game UI. The toggle button in the sidebar should highlight when dev tools are active.

#### 4.4 Collapsible quests section

Wire the `#quest-toggle` click handler to collapse/expand the `#quest-tracker`:

```js
document.getElementById('quest-toggle').addEventListener('click', () => {
    const tracker = document.getElementById('quest-tracker');
    const indicator = document.querySelector('.collapse-indicator');
    const collapsed = tracker.style.display === 'none';
    tracker.style.display = collapsed ? '' : 'none';
    indicator.textContent = collapsed ? '▾' : '▸';
});
```

#### 4.5 Tests

- Test that `toggleHelp()` shows and hides the overlay.
- Test that help blocks game input when visible.
- Test that dev tools toggle shows/hides the panel.

---

### Phase 5: Gamepad Support ⬜ TODO

**Goal:** Support Xbox controllers (and compatible gamepads) via the browser Gamepad API.

**Branch:** `feature/Phase-5-improve-ui`

#### 5.1 Create `src/input/GamepadManager.js`

```js
/**
 * Polls connected gamepads and translates input to game actions.
 * Uses the standard gamepad mapping (Xbox layout).
 *
 * Standard button mapping:
 *   0 = A (interact/attack)
 *   1 = B (cancel/back)
 *   2 = X (use item)
 *   3 = Y (quest log)
 *   4 = LB (prev inventory)
 *   5 = RB (next inventory)
 *   8 = Select/Back (help)
 *   9 = Start (pause — future)
 *   12 = D-Up, 13 = D-Down, 14 = D-Left, 15 = D-Right
 *
 * Left stick axes: axes[0] = X (-1 left, +1 right), axes[1] = Y (-1 up, +1 down)
 */
export class GamepadManager {
    constructor() {
        this.connected = false;
        this.previousButtons = new Array(16).fill(false);
        this.moveRepeatTimer = 0;
        this.DEAD_ZONE = 0.3;
        this.MOVE_REPEAT_DELAY = 150; // ms between repeated moves
    }

    /**
     * Call once per frame. Returns an array of action strings that fired this frame.
     * Actions: 'move_up', 'move_down', 'move_left', 'move_right',
     *          'interact', 'cancel', 'use_item', 'quest_log',
     *          'prev_item', 'next_item', 'help', 'pause'
     * @returns {string[]}
     */
    poll() { ... }
}
```

**Implementation notes:**
- Use `navigator.getGamepads()` to read state.
- Track previous button states to detect button-down events (edge detection), not held states.
- D-pad/stick movement should have a repeat delay (player moves one tile per press, like keyboard — not continuous). Use a timer to allow held-direction repeated movement at a reasonable rate (e.g., 150ms).
- Left stick uses a dead zone (0.3) to prevent drift.

#### 5.2 Extract shared input handlers

**This must happen before wiring the gamepad**, since both keyboard and gamepad need to call the same functions. Refactor `main.js` to extract these from the current `keydown` listener:

- `handleMove(dx, dy)` — player movement, entity blocking check, entity updates, collision check. Currently this logic is inline in the `keydown` handler (the arrow key block starting around line 422 of the current `main.js`). Extract it into a named function.
- `handleInteraction()` — **already exists** as a standalone function in `main.js`. No extraction needed.
- `handleItemUse()` — from Phase 3. Should already be a function by this point.
- `cycleInventorySelection(delta)` — new function. Wraps `inventorySelectedIndex` around 0-8 range.

The `keydown` handler calls these extracted functions, and so does the gamepad polling.

#### 5.3 Wire into game loop

In `main.js`:

```js
import { GamepadManager } from '../input/GamepadManager.js';
const gamepadManager = new GamepadManager();
```

Add a `processGamepadInput()` function:

```js
function processGamepadInput() {
    const actions = gamepadManager.poll();
    for (const action of actions) {
        switch (action) {
            case 'move_up':    handleMove(0, -1); break;
            case 'move_down':  handleMove(0, 1);  break;
            case 'move_left':  handleMove(-1, 0); break;
            case 'move_right': handleMove(1, 0);  break;
            case 'interact':   handleInteraction(); break;
            case 'use_item':   handleItemUse(); break;
            case 'quest_log':  questLogVisible = !questLogVisible; break;
            case 'prev_item':  cycleInventorySelection(-1); break;
            case 'next_item':  cycleInventorySelection(1); break;
            case 'help':       toggleHelp(); break;
        }
    }
}
```

Call `processGamepadInput()` in the `gameLoop()` function, before rendering.

#### 5.4 Connection status indicator

```js
window.addEventListener('gamepadconnected', () => {
    gamepadManager.connected = true;
    document.getElementById('gamepad-status').textContent = '🎮 Controller connected';
    document.getElementById('gamepad-status').style.display = 'block';
});

window.addEventListener('gamepaddisconnected', () => {
    gamepadManager.connected = false;
    document.getElementById('gamepad-status').style.display = 'none';
});
```

Show/hide the `#gamepad-status` element in the sidebar footer.

#### 5.5 Tests

- Unit test `GamepadManager.poll()` with mocked `navigator.getGamepads()`.
- Test edge detection (button down only fires once per press).
- Test dead zone filtering on stick axes.
- Test move repeat timing.

---

## File Summary

### Created (Phases 1–3):
- `src/ui/SidebarRenderer.js` — DOM-based sidebar panel updates (health, crystals, inventory, quests, board name)
- `src/ui/MinimapRenderer.js` — minimap on dedicated sidebar canvas
- `test/sidebarRenderer.test.js` — 21 tests for SidebarRenderer DOM updates
- `test/inventorySelection.test.js` — 6 tests for inventory selection and click handling

### Modified (Phases 1–3):
- `index.html` — flex layout with sidebar, hidden game-info removed, dev tools below frame, help overlay placeholder
- `css/styles.css` — complete restyle for sidebar layout, inventory slots, quest items
- `src/game/main.js` — sidebar/minimap wiring, inventory selection (1-9/E/click), handleItemUse(), cycleInventorySelection()
- `src/game/constants.js` — added `itemGlyphs` and `FALLBACK_GLYPH` exports

### Retired (Phase 2):
- `src/ui/HudRenderer.js` — deleted (replaced by SidebarRenderer)
- `src/world/WorldRenderer.js` — deleted (replaced by MinimapRenderer)
- `test/hudRenderer.test.js` — deleted (replaced by sidebarRenderer.test.js)

### Still to create (Phases 4–5):
- `src/ui/HelpOverlay.js` — help screen overlay
- `src/input/GamepadManager.js` — gamepad polling and action mapping

### Files NOT to modify:
- `src/core/Board.js`
- `src/game/Player.js`
- `src/game/renderer.js` — tile/entity/player rendering stays the same
- `src/entities/*` — entity system untouched
- `src/events/*` — event system untouched
- `src/world/WorldGraph.js`, `PlayerState.js`, `Transition.js` — world system untouched
- `public/levels/*` — level data untouched

---

### Phase 6: Sprite-Based Rendering ⬜ TODO

**Goal:** Replace emoji glyphs and colored rectangles with 32×32 pixel art sprites generated via Google Gemini image generation. This is independent of the sidebar UI work and can proceed after Phase 5 or in parallel.

**Branch:** TBD

**Full asset list and generation prompts:** See `SPRITE_GENERATION_GUIDE.md` for the complete style anchor prompt, per-asset prompts, and post-processing workflow.

#### 6.1 Generate sprite assets

Use Google Gemini image generation with the style anchor prompt from `SPRITE_GENERATION_GUIDE.md`. Generate in batches by category for style consistency:

1. **Terrain tiles** (12 assets) — wall, floor, door, exit locked/open, hole, crystal, movable block, 4 directional arrows
2. **Player sprites** (4 assets) — one per facing direction, red accent for identification
3. **Item sprites** (12 assets) — health potion, gold key, sword, shield, bow, coin, gem, scroll, ring, lantern, rare crystal, elder amulet
4. **Entity sprites** (4 assets) — village elder NPC, generic NPC, slime enemy, generic enemy
5. **Interactive objects** (5 assets) — sign, chest closed/open, lever off/on
6. **UI elements** (2 assets) — heart full, heart empty (16×16)

Post-process with nearest-neighbor scaling to exactly 32×32 (or 16×16 for UI hearts), ensure transparent backgrounds on entities/items, and normalize palette across batches.

#### 6.2 Create sprite loader (`src/game/SpriteLoader.js`)

Preload all PNG assets at startup into `Image` objects. Expose a lookup API:

```js
/**
 * @param {string} category - 'tiles', 'entities', 'items', 'interactive', 'ui'
 * @param {string} name - e.g., 'tile_wall', 'player_down', 'item_health_potion'
 * @returns {HTMLImageElement|null}
 */
export function getSprite(category, name) { ... }

/**
 * Preload all sprites. Returns a promise that resolves when all images are loaded.
 * @returns {Promise<void>}
 */
export async function preloadSprites() { ... }
```

Call `preloadSprites()` before `startGame()` in `main.js`.

#### 6.3 Update `renderer.js` — tile rendering

Replace `ctx.fillRect()` + `ctx.fillText(glyph)` tile drawing with `ctx.drawImage(sprite, screenX, screenY, 32, 32)`. Map tile types to sprite names:

| Tile | Sprite |
|------|--------|
| `w` (wall) | `tile_wall` |
| `.` (floor) | `tile_floor` |
| `d` (door) | `tile_door` |
| `x` (exit, locked) | `tile_exit_locked` |
| `x` (exit, open) | `tile_exit_open` |
| `h` (hole) | `tile_hole` |
| `c` (crystal) | `tile_crystal` |
| `m` (movable) | `tile_movable` |
| `ol/or/ou/od` | `tile_arrow_left/right/up/down` |

Fall back to the current colored rectangle + glyph rendering if a sprite is not found (graceful degradation).

#### 6.4 Update `renderer.js` — entity rendering

Look up entity sprite by type + id (e.g., `enemy_slime`, `npc_elder`). Fall back to type-based default sprites (e.g., `enemy_generic`, `npc_generic`). Then fall back to colored rectangles if no sprite exists.

#### 6.5 Update `renderer.js` — player rendering

Use `player.facing` to select the correct directional sprite (`player_down`, `player_up`, `player_left`, `player_right`). Replace the current colored rectangle + facing indicator rendering.

#### 6.6 Update sidebar — inventory sprites

In `SidebarRenderer.updateInventory()`, replace emoji glyph text with `<img>` tags pointing to item sprites. Fall back to emoji glyphs if sprite not found.

In `SidebarRenderer.updateHealth()`, replace emoji hearts with `<img>` tags using `ui_heart_full` / `ui_heart_empty` sprites.

#### 6.7 File organization

```
public/sprites/
  tiles/       — tile_wall.png, tile_floor.png, etc.
  entities/    — player_down.png, npc_elder.png, enemy_slime.png, etc.
  items/       — item_health_potion.png, item_gold_key.png, etc.
  interactive/ — interactive_sign.png, interactive_chest_closed.png, etc.
  ui/          — ui_heart_full.png, ui_heart_empty.png
```

#### 6.8 Tests

- Test `SpriteLoader.getSprite()` returns loaded images for valid names and null for missing.
- Test `preloadSprites()` resolves after all images load.
- Test renderer falls back gracefully when sprites are missing.

**Constraints:**
- Sprites are an overlay on existing rendering — the game must remain fully playable with the colored rectangle + glyph fallback if sprites fail to load.
- Do not change game logic, entity system, or tile DSL.
- Sprite file names must match the naming convention in `SPRITE_GENERATION_GUIDE.md`.

---

## Code Conventions

- Vanilla JavaScript, ES modules. Match existing codebase style.
- JSDoc comments on all public functions.
- DOM manipulation: use `document.createElement()` and `textContent` — never `innerHTML` with dynamic data (XSS prevention, consistent with existing codebase patterns in `messages.js`).
- CSS: use the existing `css/styles.css` file. No CSS-in-JS or CSS modules.
- Monospace font throughout sidebar (`'Courier New', monospace` to match existing body font).
- Color palette: match existing `gameColors` in `constants.js`. Key accent colors: `#e63946` (player/selected), `#06d6a0` (crystal/positive), `#FFD700` (quest/gold), `#1a4ba0` (wall/primary).

## Testing Strategy

- Unit tests for `SidebarRenderer` functions using jsdom (verify DOM element content after calls).
- Unit tests for `GamepadManager` with mocked navigator.
- Keep existing tests passing — `npm test` must not regress at any point.
- Integration tests: verify that the game loop correctly updates sidebar after player moves, collects items, enters new boards.

## Important Notes

- **Read the existing codebase first.** Especially `main.js` (game loop, input handling), `HudRenderer.js` (what to replace), `WorldRenderer.js` (minimap to migrate), and `messages.js` (DOM patterns to follow).
- **Do not rewrite game systems.** This is a UI-only change. Board, Player, Entity, Event, World, and Quest systems must remain unchanged.
- **Commit after each meaningful unit of work.** Use conventional commit messages (e.g., `feat: add sidebar layout structure`, `refactor: migrate health display to DOM sidebar`).
- **The game must remain playable after every commit.** If canvas HUD is removed before sidebar replacement is wired up, the game is unplayable. Coordinate removal and replacement within the same commit or keep both active temporarily.
- **Test with the existing world.json** — start the dev server, play through The Clearing, transition to other boards, interact with NPCs, collect items, and verify everything still works with the new layout.
- **Crystal counter visibility:** World-mode boards do not set `requiredCrystals` in their JSON files. The crystal counter should hide entirely on these boards. Only show it when `board.requiredCrystals > 0`.
