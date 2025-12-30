import { clamp } from "../lib/math";
import type { Alien, GameConfig, GameState } from "./types";

function buildAliens(config: GameConfig): Alien[] {
  const { wave, width, height } = config;
  const aliens: Alien[] = [];
  let id = 1;

  for (let r = 0; r < wave.alienRows; r += 1) {
    for (let c = 0; c < wave.alienCols; c += 1) {
      const x = wave.startX + c * wave.colSpacing;
      const y = wave.startY + r * wave.rowSpacing;
      if (x < 0 || x >= width) continue;
      if (y < 0 || y >= height) continue;
      aliens.push({ id: id++, x, y });
    }
  }

  return aliens;
}

export function createInitialGameState(config: GameConfig): GameState {
  const playerX = clamp(Math.floor(config.width / 2), 0, Math.max(0, config.width - 1));
  const aliens = buildAliens(config);

  return {
    config,
    status: "playing",
    score: 0,
    lives: config.lives,
    player: {
      x: playerX,
      cooldownSeconds: 0,
    },
    aliens,
    bullets: [],
    alienDir: 1,
    alienStepTimerSeconds: config.wave.stepIntervalSeconds,
    alienFireTimerSeconds: 0,
    rngState: 0x12345678,
    nextEntityId: aliens.reduce((max, a) => Math.max(max, a.id), 0) + 1,
  };
}
