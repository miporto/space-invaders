import {
  BoxRenderable,
  TextRenderable,
  createCliRenderer,
  type KeyEvent,
} from "@opentui/core";

import { clamp } from "./lib/math";

const runtime = typeof (globalThis as any).Bun !== "undefined" ? "bun" : "node";

function isQuitKey(key: KeyEvent): boolean {
  return key.name === "q" || key.name === "escape";
}

async function main() {
  const renderer = await createCliRenderer({
    targetFps: 60,
    maxFps: 60,
    useAlternateScreen: true,
    exitOnCtrlC: false,
    useKittyKeyboard: {
      disambiguate: true,
      alternateKeys: true,
    },
  });

  renderer.setTerminalTitle(`OpenTUI Spike (${runtime})`);
  renderer.setGatherStats(true);

  const root = renderer.root;
  root.width = "100%";
  root.height = "100%";
  root.flexDirection = "column";

  const header = new TextRenderable(renderer, {
    height: 1,
    fg: "#00e5ff",
    content: "",
  });

  const playfield = new BoxRenderable(renderer, {
    flexGrow: 1,
    border: true,
    borderColor: "#6b7280",
    title: "Move with arrows/A-D • Space toggles color • Q/Esc quits",
    padding: 1,
    backgroundColor: "#000000",
  });

  let spriteColor = "#ff3b30";
  const sprite = new TextRenderable(renderer, {
    position: "absolute",
    top: 2,
    left: 2,
    fg: spriteColor,
    content: "▲",
  });

  root.add(header);
  root.add(playfield);
  playfield.add(sprite);

  let x = 2;
  let y = 2;
  let vx = 1;
  let vy = 0;
  let stepAcc = 0;
  const stepSeconds = 0.05; // 20 steps/sec (keeps movement visible)

  let quitting = false;
  const quit = () => {
    if (quitting) return;
    quitting = true;
    try {
      renderer.stop();
      renderer.destroy();
    } finally {
      process.exit(0);
    }
  };

  const autoExitMs = Number(process.env.SPIKE_AUTO_EXIT_MS ?? "0");
  if (Number.isFinite(autoExitMs) && autoExitMs > 0) {
    setTimeout(quit, autoExitMs);
  }

  const onKey = (key: KeyEvent) => {
    if (isQuitKey(key)) {
      key.preventDefault();
      quit();
      return;
    }

    if (key.ctrl && key.name === "c") {
      key.preventDefault();
      quit();
      return;
    }

    switch (key.name) {
      case "left":
      case "a":
        x -= 1;
        vx = -1;
        vy = 0;
        key.preventDefault();
        break;
      case "right":
      case "d":
        x += 1;
        vx = 1;
        vy = 0;
        key.preventDefault();
        break;
      case "up":
      case "w":
        y -= 1;
        vx = 0;
        vy = -1;
        key.preventDefault();
        break;
      case "down":
      case "s":
        y += 1;
        vx = 0;
        vy = 1;
        key.preventDefault();
        break;
      case "space":
        spriteColor = spriteColor === "#ff3b30" ? "#34c759" : "#ff3b30";
        sprite.fg = spriteColor;
        key.preventDefault();
        break;
    }
  };

  renderer.keyInput.on("keypress", onKey);
  process.on("SIGINT", quit);
  process.on("SIGTERM", quit);

  renderer.setFrameCallback(async (deltaMs: number) => {
    if (quitting) return;

    const dt = deltaMs / 1000;
    stepAcc += dt;

    const maxX = Math.max(1, playfield.width - 3);
    const maxY = Math.max(1, playfield.height - 3);

    while (stepAcc >= stepSeconds) {
      stepAcc -= stepSeconds;
      x += vx;
      y += vy;

      if (x <= 1 || x >= maxX) {
        vx = -vx;
        x = clamp(x, 1, maxX);
      }
      if (y <= 1 || y >= maxY) {
        vy = -vy;
        y = clamp(y, 1, maxY);
      }
    }

    sprite.left = clamp(x, 1, maxX);
    sprite.top = clamp(y, 1, maxY);

    const stats = renderer.getStats();
    header.content = `OpenTUI Spike (${runtime})  |  term ${renderer.terminalWidth}x${renderer.terminalHeight}  |  fps ${stats.fps.toFixed(1)}  |  pos (${sprite.left},${sprite.top})`;
  });

  renderer.start();
}

main().catch((err) => {
  // Best-effort: if setup failed, still print the error.
  console.error(err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
