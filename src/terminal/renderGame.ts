import { TextAttributes, type OptimizedBuffer } from "@opentui/core";

import type { GameState } from "../game/types";
import { COLORS } from "./colors";

function drawCenteredText(buf: OptimizedBuffer, text: string, y: number, fg = COLORS.hud): void {
  const x = Math.max(1, Math.floor((buf.width - text.length) / 2));
  buf.drawText(text, x, y, fg, COLORS.bg, TextAttributes.BOLD);
}

export function renderGameToBuffer(buf: OptimizedBuffer, state: GameState): void {
  const w = buf.width;
  const h = buf.height;
  buf.clear(COLORS.bg);

  // Border around the whole buffer.
  buf.drawBox({
    x: 0,
    y: 0,
    width: w,
    height: h,
    border: true,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    borderStyle: "single",
    shouldFill: true,
  });

  // Inner playfield is the state.config width/height anchored at (1,1).
  // If the buffer is smaller than the config, we clamp rendering.
  const innerW = Math.max(0, Math.min(state.config.width, w - 2));
  const innerH = Math.max(0, Math.min(state.config.height, h - 2));

  const drawCell = (x: number, y: number, ch: string, fg = COLORS.hud) => {
    if (x < 0 || y < 0) return;
    if (x >= innerW || y >= innerH) return;
    buf.setCell(1 + x, 1 + y, ch, fg, COLORS.bg, TextAttributes.NONE);
  };

  // Aliens
  for (const a of state.aliens) {
    drawCell(a.x, a.y, "W", COLORS.alien);
  }

  // Bullets
  for (const b of state.bullets) {
    const x = Math.round(b.x);
    const y = Math.round(b.y);
    drawCell(x, y, b.owner === "player" ? "|" : "!", b.owner === "player" ? COLORS.bulletPlayer : COLORS.bulletAlien);
  }

  // Player
  drawCell(Math.round(state.player.x), innerH - 1, "A", COLORS.player);

  if (state.status === "paused") {
    const boxW = Math.max(20, Math.min(w - 4, 34));
    const boxH = 7;
    const bx = Math.floor((w - boxW) / 2);
    const by = Math.floor((h - boxH) / 2);

    buf.drawBox({
      x: bx,
      y: by,
      width: boxW,
      height: boxH,
      border: true,
      borderStyle: "single",
      borderColor: COLORS.hud,
      backgroundColor: COLORS.bg,
      shouldFill: true,
      title: "Paused",
      titleAlignment: "center",
    });

    drawCenteredText(buf, "PAUSED", by + 2, COLORS.hud);
    drawCenteredText(buf, "Press P to resume", by + 4, COLORS.border);
  }
}
