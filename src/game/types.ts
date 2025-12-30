export type GameStatus = "playing" | "paused" | "won" | "lost";

export type BulletOwner = "player" | "alien";

export type Bullet = {
  id: number;
  owner: BulletOwner;
  x: number;
  y: number;
  vy: number;
};

export type Alien = {
  id: number;
  x: number;
  y: number;
};

export type Wave = {
  alienRows: number;
  alienCols: number;
  startX: number;
  startY: number;
  colSpacing: number;
  rowSpacing: number;
  stepIntervalSeconds: number;
  descendOnBounce: number;
  scorePerAlien: number;
  maxPlayerBullets: number;
  maxAlienBullets: number;
  alienFireIntervalSeconds: number;
  alienFireChancePerInterval: number; // [0..1]
};

export type GameConfig = {
  width: number; // inner playfield width (cells)
  height: number; // inner playfield height (cells)
  lives: number;
  wave: Wave;
};

export type Player = {
  x: number;
  cooldownSeconds: number;
};

export type GameState = {
  config: GameConfig;
  status: GameStatus;
  score: number;
  lives: number;
  player: Player;
  aliens: Alien[];
  bullets: Bullet[];
  alienDir: -1 | 1;
  alienStepTimerSeconds: number;
  alienFireTimerSeconds: number;
  rngState: number;
  nextEntityId: number;
};

export type InputFrame = {
  moveX: -1 | 0 | 1;
  shootPressed: boolean;
  pausePressed: boolean;
  quitPressed: boolean;
};
