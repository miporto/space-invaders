import { createCliRenderer, type CliRenderer } from "@opentui/core";

import { createStartScreen } from "./screens/start";
import { createGameScreen } from "./screens/game";
import { createGameOverScreen } from "./screens/gameOver";
import { createInitialGameState } from "../game/state";
import { createWave1 } from "../game/waves";

type ScreenResult =
  | { type: "start_game" }
  | { type: "quit" }
  | { type: "game_over"; won: boolean; score: number };

type Screen = {
  run: () => Promise<ScreenResult>;
  destroy: () => void;
};

async function createRenderer(): Promise<CliRenderer> {
  const renderer = await createCliRenderer({
    targetFps: 60,
    maxFps: 60,
    useAlternateScreen: true,
    exitOnCtrlC: false,
    useKittyKeyboard: {
      disambiguate: true,
      alternateKeys: true,
      events: true,
    },
  });

  renderer.setTerminalTitle("Space Invaders (Terminal)");
  renderer.setGatherStats(false);

  return renderer;
}

export async function runApp(): Promise<void> {
  const renderer = await createRenderer();
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

  process.on("SIGINT", quit);
  process.on("SIGTERM", quit);

  const root = renderer.root;
  root.width = "100%";
  root.height = "100%";
  root.flexDirection = "column";

  let active: Screen = createStartScreen(renderer);
  const setScreen = (screen: Screen) => {
    active.destroy();
    active = screen;
  };

  renderer.start();

  while (!quitting) {
    const result = await active.run();
    if (result.type === "quit") {
      quit();
      return;
    }

    if (result.type === "start_game") {
      const wave = createWave1();
      const width = Math.max(24, Math.min(60, renderer.width - 4));
      const height = Math.max(16, Math.min(22, renderer.height - 6));
      const state = createInitialGameState({
        width,
        height,
        lives: 3,
        wave,
      });
      setScreen(createGameScreen(renderer, state));
      continue;
    }

    if (result.type === "game_over") {
      setScreen(createGameOverScreen(renderer, result));
      continue;
    }
  }
}
