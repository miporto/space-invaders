# Space Invaders (Terminal) — Specification

## 1. Summary
Build a Space Invaders–style game that runs fully in the terminal with color rendering and keyboard controls.

## 2. Decisions (validated by spike)
- **TUI / renderer:** `@opentui/core`.
- **Runtime:** **Bun**.
  - A spike confirmed real-time rendering + raw keyboard input + clean teardown work on Bun.
  - Running the same OpenTUI code on Node fails due to OpenTUI loading non-JS assets (e.g. `.scm`) without additional bundling/loader work.
- **Physics/game SDK:** not required for an MVP Space Invaders.
  - Use a small deterministic game loop and simple collision checks.
- **Saves:** none. Each run starts from the beginning.
- **Level design:** MVP uses predefined waves; procedural/endless mode is optional later.

## 3. Functional requirements

### 3.1 Game lifecycle
- On launch, show a **welcome/start screen** with instructions.
- Start the game when the user presses a start key (e.g. `Enter` or `Space`).
- Game runs until:
  - the player loses, or
  - the player clears the wave (MVP), or
  - the user quits.
- On exit, terminal state must be restored (raw mode, cursor, alternate screen).

### 3.2 Rendering (terminal + color)
- Render a bounded playfield with a HUD.
- Must use color for at least:
  - player ship
  - aliens
  - bullets
  - HUD (score/wave/lives)

### 3.3 Input (keyboard)
- Input is real-time (no `Enter` required) during gameplay.
- Default controls:
  - `←/→` or `A/D`: move
  - `Space`: shoot
  - `Q` or `Esc`: quit
  - `P`: pause/resume (recommended)

### 3.4 Gameplay (MVP rules)
- Player ship at bottom, moves horizontally within bounds.
- Aliens:
  - arranged in a grid formation
  - move horizontally, bounce at walls, descend on bounce
- Projectiles:
  - player bullets move upward
  - alien bullets move downward (recommended; may be added after MVP if needed)
- Collisions:
  - player bullet vs alien removes alien and increases score
  - alien bullet vs player reduces life / ends game (depending on lives setting)
- Win/lose:
  - win when all aliens are destroyed (wave cleared)
  - lose when aliens reach a defined bottom threshold OR player runs out of lives

## 4. Non-functional requirements

### 4.1 Tech stack
- Language: **TypeScript**.
- Runtime/tooling: **Bun**.
- Unit tests: **Vitest**.
- Linting: **oxlint**.

### 4.2 Performance & responsiveness
- Stable update loop; target ~60fps rendering where feasible.
- Low input latency; no flicker.

### 4.3 Portability
- Primary targets: macOS and Linux terminals.
- Must handle SIGINT/SIGTERM and restore terminal state.

### 4.4 Testability
- Game logic must be unit-testable without a real terminal.
- Rendering and input must be behind thin adapters/interfaces.

## 5. Out of scope (MVP)
- Save/load.
- Audio.
- Online scoreboards.
- Complex menus/settings.
