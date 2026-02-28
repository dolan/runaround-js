# runaround-js — Game Engine Evolution

JavaScript tile-based puzzle/action game (Zelda-like). Originally written in C in the 1990s, re-implemented in JS. Currently a sequential level-based game with a tile DSL, JSON level definitions, real-time fighting, crystal collection, and Sokoban-style block pushing. Goal: evolve into an explorable world engine with NPCs, quests, and rich content.

## Commands

- `npm install` — install dependencies
- `npm start` — run the dev server
- `npm test` — run tests (add test scripts as you create them)
- `python generator/` — existing Python-based level generator (inspect before modifying)

## Architecture

- Board system: tile grid rendered with a custom tile DSL and JSON level definitions
- `BoardAnalyzer`: pathfinding (A* search), used for validating board traversability
- Level format: JSON files defining tile layouts, enemies, items, win conditions
- Python level generator: procedurally creates levels (lives in `generator/` or similar)
- Sequential level progression: levels played in order, one after another

## Implementation Plan

Execute the following three phases in order. Each phase should be a separate branch. Commit frequently with descriptive messages. Run existing tests (if any) after each change to avoid regressions.

### Phase 1: World Graph System

**Goal:** Replace sequential level progression with a connected world of explorable boards.

1. Create a `WorldGraph` data structure — a graph where nodes are boards and edges are transitions (door, path, warp, etc.)
2. Define a `world.json` (or similar) schema that maps board IDs to their connections, specifying which tile on board A leads to which tile on board B
3. Modify the game loop so completing a board doesn't auto-advance to the next level — instead, the player walks to an exit tile and transitions to the connected board
4. Implement transition types: walk-off-edge (adjacent areas), door (enter building/dungeon), warp (teleport)
5. Persist player state across board transitions — position, inventory, health carry over
6. Add a minimap or world-position indicator (simple, can be enhanced later)
7. Convert 2–3 existing levels into a small connected test world to validate the system

**Key files to create:**
- `src/world/WorldGraph.js` — graph data structure and traversal logic
- `src/world/Transition.js` — transition types and animation
- World definition schema (JSON)

**Constraints:**
- Do NOT break existing board rendering or tile DSL — layer on top
- Boards should load lazily (only when transitioned to)
- Keep the world definition format simple and human-readable

### Phase 2: Entity Layer

**Goal:** Add NPCs, enemies, items, and interactive objects that exist ON tiles rather than being tiles themselves.

1. Create an `Entity` base class with position, sprite, state, and behavior properties
2. Implement entity subtypes: `NPC` (dialogue, quests), `Enemy` (AI, combat), `Item` (pickup, use), `InteractiveObject` (lever, chest, sign)
3. Add an entity registry per board — entities are defined in the board JSON alongside the tile grid
4. Render entities as a layer on top of the tile grid (z-ordering: tiles → entities → player → UI)
5. Implement collision/interaction: player presses action key near an entity to interact
6. NPC dialogue system: simple sequential text boxes, support for branching choices
7. Enemy AI: use the existing `BoardAnalyzer` A* pathfinding for enemy movement toward player
8. Item system: define items in a catalog, support pickup → inventory → use flow

**Key files to create:**
- `src/entities/Entity.js` — base class
- `src/entities/NPC.js`, `Enemy.js`, `Item.js`, `InteractiveObject.js` — subtypes
- `src/entities/EntityRegistry.js` — per-board entity management
- `src/entities/DialogueSystem.js` — text display, branching
- `src/entities/Inventory.js` — player inventory
- Item/entity catalog schema (JSON)

**Constraints:**
- Entities must not replace the existing tile system — they are an overlay
- Entity definitions go in board JSON under an `"entities"` key
- Reuse `BoardAnalyzer` pathfinding for enemy AI rather than writing new pathfinding

### Phase 3: Event & Trigger System

**Goal:** Enable quest progression, world reactivity, and dynamic content through an event-driven system.

1. Create an `EventBus` — pub/sub system for game events (player actions, state changes, triggers)
2. Define trigger types: `OnEnter` (step on tile), `OnInteract` (talk/use), `OnItemUse`, `OnDefeat`, `OnCollect`, `OnWorldState` (flag-based)
3. Implement a `QuestSystem` with quest definitions (objectives, prerequisites, rewards) in JSON
4. Add world state flags — a global key-value store that persists across boards (e.g., `"bridge_repaired": true`)
5. Make the world reactive: entities appear/disappear, tiles change, dialogue changes based on world state flags
6. Implement quest log UI — list active/completed quests with descriptions
7. Create 1 complete demo quest spanning multiple boards to validate the full pipeline (world transitions + entities + events)

**Key files to create:**
- `src/events/EventBus.js` — publish/subscribe event system
- `src/events/Trigger.js` — trigger types and evaluation
- `src/events/QuestSystem.js` — quest management
- `src/events/WorldState.js` — persistent flag store
- Quest definitions schema (JSON)

**Constraints:**
- Events should be composable — complex behaviors from simple triggers
- Quest definitions are data-driven (JSON), not hardcoded
- World state must serialize/deserialize for save games

## Content Generation (Future / Cross-cutting)

After the three phases, the system should support AI-assisted content generation:

- Boards: generate tile grids from natural language descriptions, validate with `BoardAnalyzer` for traversability
- Worlds: generate world graphs with themed regions and logical connectivity
- Quests: generate quest chains with prerequisites and rewards
- Puzzles: generate block-pushing puzzles with solvability built in by construction (NOT verified after the fact — design the generator to only produce solvable layouts)

Use a **linter approach** for content validation — catch obvious design flaws (unreachable tiles, impossible paths, orphaned triggers) rather than attempting full state-space solvability verification.

## Code Conventions

- Vanilla JavaScript (no TypeScript, no framework — match existing codebase style)
- ES module imports where the existing code uses them; match whatever module system is in place
- Descriptive variable names, JSDoc comments on public methods
- New systems go in organized subdirectories under `src/`
- Keep classes small and focused — prefer composition over deep inheritance
- JSON schemas for all data-driven content (levels, entities, quests, world maps)

## Testing Strategy

- Add unit tests for new systems (WorldGraph traversal, EventBus pub/sub, Entity interactions, QuestSystem state transitions)
- Integration tests: verify a player can traverse a small world, interact with NPCs, and complete a quest
- Use the existing test runner if one exists; if not, set up a minimal test framework (e.g., lightweight assertion library)
- `BoardAnalyzer` tests: verify pathfinding still works correctly after changes

## Important Notes

- **Read the existing codebase first.** Understand the tile DSL, board format, and rendering pipeline before making changes. Use `find` and `grep` to explore the structure.
- **Do not rewrite existing systems.** Layer new functionality on top. The tile system, board renderer, and fighting mechanics should continue to work unchanged.
- **Commit after each meaningful unit of work.** Use conventional commit messages (e.g., `feat: add WorldGraph data structure`, `refactor: extract board loading into separate module`).
- **Ask before making architectural decisions** that aren't covered here — e.g., if the existing module system conflicts with the proposed file structure, flag it.
