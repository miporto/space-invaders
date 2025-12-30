import { BoxRenderable, TextRenderable, type CliRenderer, type KeyEvent } from "@opentui/core";

type GameOverInput = { type: "game_over"; won: boolean; score: number };
type ScreenResult = { type: "start_game" } | { type: "quit" };

export function createGameOverScreen(renderer: CliRenderer, info: GameOverInput) {
  const root = renderer.root;

  const container = new BoxRenderable(renderer, {
    id: "gameover-screen",
    flexGrow: 1,
    border: true,
    borderColor: "#6b7280",
    padding: 1,
    justifyContent: "center",
    alignItems: "center",
  });

  const title = info.won ? "YOU WIN" : "GAME OVER";
  const text = new TextRenderable(renderer, {
    fg: info.won ? "#34c759" : "#ff3b30",
    wrapMode: "word",
    content:
      `${title}\n\n` +
      `Score: ${info.score}\n\n` +
      "Press Enter/Space to play again, or Q/Esc to quit.",
  });

  container.add(text);
  root.add(container);

  let resolved = false;
  let resolve!: (r: ScreenResult) => void;
  const promise = new Promise<ScreenResult>((r) => {
    resolve = r;
  });

  const onKey = (key: KeyEvent) => {
    if (resolved) return;

    if (key.name === "q" || key.name === "escape" || (key.ctrl && key.name === "c")) {
      resolved = true;
      key.preventDefault();
      resolve({ type: "quit" });
      return;
    }

    if (key.name === "enter" || key.name === "return" || key.name === "space") {
      resolved = true;
      key.preventDefault();
      resolve({ type: "start_game" });
    }
  };

  renderer.keyInput.on("keypress", onKey);

  return {
    run: async () => promise,
    destroy: () => {
      renderer.keyInput.off("keypress", onKey);
      try {
        root.remove(container.id);
      } catch {
        // ignore
      }
      container.destroyRecursively();
    },
  };
}
