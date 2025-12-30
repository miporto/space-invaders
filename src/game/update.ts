import { clamp } from "../lib/math";
import { nextFloat01 } from "./rng";
import type { Bullet, GameState, InputFrame } from "./types";

const PLAYER_SPEED_CELLS_PER_SEC = 22;
const BULLET_SPEED_CELLS_PER_SEC = 28;
const PLAYER_SHOT_COOLDOWN_SEC = 0.22;

function countBullets(state: GameState, owner: Bullet["owner"]): number {
  let n = 0;
  for (const b of state.bullets) if (b.owner === owner) n += 1;
  return n;
}

function spawnBullet(state: GameState, owner: Bullet["owner"], x: number, y: number, vy: number): void {
  state.bullets.push({
    id: state.nextEntityId++,
    owner,
    x,
    y,
    vy,
  });
}

function tryAlienFire(state: GameState): void {
  const { wave, height } = state.config;
  if (state.aliens.length === 0) return;
  if (countBullets(state, "alien") >= wave.maxAlienBullets) return;

  // Choose a random column that has at least one alive alien, then pick the bottom-most alien in that column.
  const byColumn = new Map<number, { x: number; bottomY: number; id: number }>();
  for (const a of state.aliens) {
    const existing = byColumn.get(a.x);
    if (!existing || a.y > existing.bottomY) {
      byColumn.set(a.x, { x: a.x, bottomY: a.y, id: a.id });
    }
  }

  const cols = [...byColumn.values()];
  if (cols.length === 0) return;

  const r1 = nextFloat01(state.rngState);
  state.rngState = r1.state;
  const pick = cols[Math.floor(r1.value * cols.length)]!;

  // Find the alien by id (stable even if multiple share x).
  const shooter = state.aliens.find((a) => a.id === pick.id);
  if (!shooter) return;

  const y = shooter.y + 1;
  if (y < 0 || y >= height) return;
  spawnBullet(state, "alien", shooter.x, y, +1);
}

function moveAliensStep(state: GameState): void {
  const { width } = state.config;
  if (state.aliens.length === 0) return;

  let minX = Infinity;
  let maxX = -Infinity;
  for (const a of state.aliens) {
    if (a.x < minX) minX = a.x;
    if (a.x > maxX) maxX = a.x;
  }

  let nextDir: -1 | 1 = state.alienDir;
  let descend = 0;
  if (state.alienDir === 1 && maxX + 1 >= width) {
    nextDir = -1;
    descend = state.config.wave.descendOnBounce;
  } else if (state.alienDir === -1 && minX - 1 < 0) {
    nextDir = 1;
    descend = state.config.wave.descendOnBounce;
  }

  for (const a of state.aliens) {
    a.x += nextDir;
    a.y += descend;
  }
  state.alienDir = nextDir;
}

function resolveCollisions(state: GameState): void {
  // Build a quick lookup for aliens.
  const alienByCell = new Map<string, number>();
  for (let i = 0; i < state.aliens.length; i += 1) {
    const a = state.aliens[i]!;
    alienByCell.set(`${a.x},${a.y}`, i);
  }

  const bulletsToRemove = new Set<number>();
  const aliensToRemove = new Set<number>();

  const playerY = state.config.height - 1;

  for (let i = 0; i < state.bullets.length; i += 1) {
    const b = state.bullets[i]!;
    const bx = Math.round(b.x);
    const by = Math.round(b.y);

    if (b.owner === "player") {
      const idx = alienByCell.get(`${bx},${by}`);
      if (idx !== undefined) {
        bulletsToRemove.add(b.id);
        aliensToRemove.add(state.aliens[idx]!.id);
        state.score += state.config.wave.scorePerAlien;
      }
    } else {
      if (by === playerY && bx === Math.round(state.player.x)) {
        bulletsToRemove.add(b.id);
        state.lives -= 1;
        if (state.lives <= 0) {
          state.status = "lost";
        } else {
          state.player.x = clamp(Math.floor(state.config.width / 2), 0, state.config.width - 1);
          state.player.cooldownSeconds = 0;
        }
      }
    }
  }

  if (aliensToRemove.size > 0) {
    state.aliens = state.aliens.filter((a) => !aliensToRemove.has(a.id));
  }
  if (bulletsToRemove.size > 0) {
    state.bullets = state.bullets.filter((b) => !bulletsToRemove.has(b.id));
  }
}

export function updateGame(state: GameState, input: InputFrame, dtSeconds: number): GameState {
  if (state.status === "won" || state.status === "lost") return state;

  if (input.pausePressed) {
    state.status = state.status === "paused" ? "playing" : "paused";
  }

  if (state.status === "paused") return state;

  const { width, height, wave } = state.config;

  // Player movement
  state.player.x = clamp(
    state.player.x + input.moveX * PLAYER_SPEED_CELLS_PER_SEC * dtSeconds,
    0,
    Math.max(0, width - 1),
  );

  // Player cooldown + shooting
  state.player.cooldownSeconds = Math.max(0, state.player.cooldownSeconds - dtSeconds);
  if (
    input.shootPressed &&
    state.player.cooldownSeconds <= 0 &&
    countBullets(state, "player") < wave.maxPlayerBullets
  ) {
    const x = Math.round(state.player.x);
    const y = height - 2;
    if (y >= 0) {
      spawnBullet(state, "player", x, y, -1);
      state.player.cooldownSeconds = PLAYER_SHOT_COOLDOWN_SEC;
    }
  }

  // Aliens movement
  state.alienStepTimerSeconds -= dtSeconds;
  while (state.alienStepTimerSeconds <= 0) {
    state.alienStepTimerSeconds += wave.stepIntervalSeconds;
    moveAliensStep(state);
  }

  // Lose condition: aliens reach bottom threshold
  const playerRow = height - 1;
  for (const a of state.aliens) {
    if (a.y >= playerRow) {
      state.status = "lost";
      return state;
    }
  }

  // Alien firing
  state.alienFireTimerSeconds += dtSeconds;
  while (state.alienFireTimerSeconds >= wave.alienFireIntervalSeconds) {
    state.alienFireTimerSeconds -= wave.alienFireIntervalSeconds;
    const r = nextFloat01(state.rngState);
    state.rngState = r.state;
    if (r.value < wave.alienFireChancePerInterval) {
      tryAlienFire(state);
    }
  }

  // Bullets movement
  for (const b of state.bullets) {
    b.y += b.vy * BULLET_SPEED_CELLS_PER_SEC * dtSeconds;
  }
  state.bullets = state.bullets.filter((b) => b.y >= 0 && b.y <= height - 1);

  resolveCollisions(state);

  if (state.aliens.length === 0) {
    state.status = "won";
  }

  return state;
}
