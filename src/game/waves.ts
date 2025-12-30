import type { Wave } from "./types";

export function createWave1(): Wave {
  return {
    alienRows: 5,
    alienCols: 11,
    startX: 6,
    startY: 2,
    colSpacing: 2,
    rowSpacing: 1,
    stepIntervalSeconds: 0.55,
    descendOnBounce: 1,
    scorePerAlien: 10,
    maxPlayerBullets: 2,
    maxAlienBullets: 3,
    alienFireIntervalSeconds: 0.3,
    alienFireChancePerInterval: 0.25,
  };
}
