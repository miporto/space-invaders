# Implementation Plan

## Phase 0 — Spike (done)
- Validate OpenTUI can render a colored scene, handle raw keyboard input, and exit cleanly on Bun.
- Result: keep **OpenTUI + Bun**.

## Phase 1 — Project baseline
1. Standardize scripts:
   - `bun run lint`
   - `bun run typecheck`
   - `bun test`
   - `bun run dev` (game)
2. Establish code layout:
   - `src/game/` (pure game logic)
   - `src/terminal/` (OpenTUI-specific rendering/input adapters)
   - `src/app/` (screens: start/game/over)

## Phase 2 — Core game loop (logic only)
1. Define `GameState`:
   - player position, lives, score
   - alien grid representation
   - bullets
   - timers (cooldowns, alien step timing)
2. Implement deterministic `update(state, input, dt)`:
   - movement
   - shooting and bullet updates
   - alien formation step
   - collisions
   - win/lose detection
3. Add Vitest unit tests for the rules above.

## Phase 3 — Terminal integration (OpenTUI)
1. Implement start screen:
   - title + controls
   - press `Enter`/`Space` to start
2. Implement gameplay screen:
   - render playfield + HUD
   - translate keyboard events into input actions
3. Implement end screen:
   - show score + win/lose
   - restart (optional) or quit
4. Ensure terminal teardown is robust on quit/signals.

## Phase 4 — MVP polish
- Basic difficulty progression across predefined waves (speed/fire-rate tweaks).
- Pause/resume.
- Small visual improvements (colors, simple animations).
- Final validator pass: `bun run lint && bun run typecheck && bun test`.

## Phase 5 — Optional extensions
- Alien bullets (if not in MVP).
- Shields.
- Procedural/endless mode (seeded).
