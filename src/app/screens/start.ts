import { BoxRenderable, TextRenderable, type CliRenderer, type KeyEvent } from "@opentui/core";

type ScreenResult = { type: "start_game" } | { type: "quit" };

export function createStartScreen(renderer: CliRenderer) {
  const root = renderer.root;

  const container = new BoxRenderable(renderer, {
    id: "start-screen",
    flexGrow: 1,
    border: true,
    borderColor: "#6b7280",
    padding: 1,
    justifyContent: "center",
    alignItems: "center",
  });

  const text = new TextRenderable(renderer, {
    fg: "#00e5ff",
    wrapMode: "word",
    content:
      "Space Invaders (Terminal)\n\n" +
      "Controls:\n" +
      "  ←/→ or A/D  move\n" +
      "  Space       shoot\n" +
      "  P           pause\n" +
      "  Q / Esc     quit\n\n" +
      "Press Enter or Space to start.",
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
