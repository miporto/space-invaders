import { describe, expect, it } from "vitest";

import { createInitialGameState } from "./state";
import { updateGame } from "./update";
import type { GameConfig, InputFrame } from "./types";

function input(partial: Partial<InputFrame> = {}): InputFrame {
  return {
    moveX: 0,
    shootPressed: false,
    pausePressed: false,
    quitPressed: false,
    ...partial,
  };
}

describe("updateGame", () => {
  it("spawns a player bullet when shooting and cooldown allows", () => {
    const cfg: GameConfig = {
      width: 20,
      height: 10,
      lives: 3,
      wave: {
        alienRows: 1,
        alienCols: 1,
        startX: 1,
        startY: 1,
        colSpacing: 2,
        rowSpacing: 1,
        stepIntervalSeconds: 10,
        descendOnBounce: 1,
        scorePerAlien: 10,
        maxPlayerBullets: 2,
        maxAlienBullets: 0,
        alienFireIntervalSeconds: 1,
        alienFireChancePerInterval: 0,
      },
    };

    const state = createInitialGameState(cfg);
    const before = state.bullets.length;

    updateGame(state, input({ shootPressed: true }), 1 / 60);
    expect(state.bullets.length).toBe(before + 1);
    expect(state.bullets[0]!.owner).toBe("player");
  });

  it("kills an alien on bullet collision and increments score", () => {
    const cfg: GameConfig = {
      width: 10,
      height: 8,
      lives: 3,
      wave: {
        alienRows: 1,
        alienCols: 1,
        startX: 5,
        startY: 2,
        colSpacing: 2,
        rowSpacing: 1,
        stepIntervalSeconds: 10,
        descendOnBounce: 1,
        scorePerAlien: 10,
        maxPlayerBullets: 1,
        maxAlienBullets: 0,
        alienFireIntervalSeconds: 1,
        alienFireChancePerInterval: 0,
      },
    };

    const state = createInitialGameState(cfg);
    // Place player under the alien.
    state.player.x = 5;
    // Spawn a bullet exactly on the alien cell.
    state.bullets.push({ id: 999, owner: "player", x: 5, y: 2, vy: -1 });

    updateGame(state, input(), 0);
    expect(state.aliens.length).toBe(0);
    expect(state.score).toBe(10);
    expect(state.status).toBe("won");
  });

  it("moves aliens and descends when hitting a wall", () => {
    const cfg: GameConfig = {
      width: 6,
      height: 8,
      lives: 3,
      wave: {
        alienRows: 1,
        alienCols: 1,
        startX: 5,
        startY: 1,
        colSpacing: 2,
        rowSpacing: 1,
        stepIntervalSeconds: 0.1,
        descendOnBounce: 1,
        scorePerAlien: 10,
        maxPlayerBullets: 1,
        maxAlienBullets: 0,
        alienFireIntervalSeconds: 1,
        alienFireChancePerInterval: 0,
      },
    };

    const state = createInitialGameState(cfg);
    expect(state.aliens[0]!.x).toBe(5);
    expect(state.alienDir).toBe(1);

    // Advance enough dt to force at least one alien step.
    updateGame(state, input(), 0.11);

    // At the right edge, we bounce (dir becomes -1) and descend.
    expect(state.alienDir).toBe(-1);
    expect(state.aliens[0]!.y).toBe(2);
  });

  it("toggles pause on pausePressed and does not update while paused", () => {
    const cfg: GameConfig = {
      width: 20,
      height: 10,
      lives: 3,
      wave: {
        alienRows: 1,
        alienCols: 1,
        startX: 1,
        startY: 1,
        colSpacing: 2,
        rowSpacing: 1,
        stepIntervalSeconds: 10,
        descendOnBounce: 1,
        scorePerAlien: 10,
        maxPlayerBullets: 2,
        maxAlienBullets: 0,
        alienFireIntervalSeconds: 1,
        alienFireChancePerInterval: 0,
      },
    };

    const state = createInitialGameState(cfg);
    const x0 = state.player.x;

    updateGame(state, input({ pausePressed: true }), 1 / 60);
    expect(state.status).toBe("paused");

    updateGame(state, input({ moveX: 1 }), 1);
    expect(state.player.x).toBe(x0);

    updateGame(state, input({ pausePressed: true }), 1 / 60);
    expect(state.status).toBe("playing");
  });
});
