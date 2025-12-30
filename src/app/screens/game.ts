import {
  FrameBufferRenderable,
  TextRenderable,
  type CliRenderer,
  type KeyEvent,
} from "@opentui/core";

import type { GameState } from "../../game/types";
import { updateGame } from "../../game/update";
import { InputController } from "../../terminal/input";
import { renderGameToBuffer } from "../../terminal/renderGame";

type ScreenResult =
  | { type: "quit" }
  | { type: "game_over"; won: boolean; score: number };

const FIXED_DT = 1 / 60;
const MAX_FRAME_DT = 0.05;

export function createGameScreen(renderer: CliRenderer, initial: GameState) {
  const root = renderer.root;

  let state = initial;

  const hud = new TextRenderable(renderer, {
    id: "game-hud",
    height: 1,
    fg: "#00e5ff",
    content: "",
  });

  const fbWidth = Math.min(renderer.width - 2, state.config.width + 2);
  const fbHeight = Math.min(renderer.height - 4, state.config.height + 2);

  const playfield = new FrameBufferRenderable(renderer, {
    id: "game-playfield",
    width: Math.max(10, fbWidth),
    height: Math.max(6, fbHeight),
    respectAlpha: false,
  });

  const footer = new TextRenderable(renderer, {
    id: "game-footer",
    height: 1,
    fg: "#6b7280",
    content: "P pause • Q/Esc quit",
  });

  root.add(hud);
  root.add(playfield);
  root.add(footer);

  const input = new InputController();
  const onKey = (key: KeyEvent) => input.onKeyPress(key);
  renderer.keyInput.on("keypress", onKey);

  let resolved = false;
  let resolve!: (r: ScreenResult) => void;
  const promise = new Promise<ScreenResult>((r) => {
    resolve = r;
  });

  let acc = 0;
  const frame = async (deltaMs: number) => {
    if (resolved) return;

    const dt = Math.min(MAX_FRAME_DT, Math.max(0, deltaMs / 1000));
    acc += dt;

    const inputFrame = input.snapshot();
    if (inputFrame.quitPressed) {
      resolved = true;
      resolve({ type: "quit" });
      return;
    }

    while (acc >= FIXED_DT) {
      acc -= FIXED_DT;
      state = updateGame(state, inputFrame, FIXED_DT);
      if (state.status === "won" || state.status === "lost") {
        resolved = true;
        resolve({ type: "game_over", won: state.status === "won", score: state.score });
        return;
      }
    }

    hud.content = `Score ${state.score}  Lives ${state.lives}  Aliens ${state.aliens.length}`;
    renderGameToBuffer(playfield.frameBuffer, state);
  };

  renderer.setFrameCallback(frame);

  return {
    run: async () => promise,
    destroy: () => {
      renderer.keyInput.off("keypress", onKey);
      renderer.removeFrameCallback(frame);

      try {
        root.remove(hud.id);
        root.remove(playfield.id);
        root.remove(footer.id);
      } catch {
        // ignore
      }

      hud.destroyRecursively();
      playfield.destroyRecursively();
      footer.destroyRecursively();
    },
  };
}
