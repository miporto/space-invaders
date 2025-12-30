import type { KeyEvent } from "@opentui/core";

import type { InputFrame } from "../game/types";

const HOLD_MS = 250;

export class InputController {
  private leftHeld = false;
  private rightHeld = false;
  private leftUntil = 0;
  private rightUntil = 0;
  private shootQueued = false;
  private pauseQueued = false;
  private quitQueued = false;

  onKeyPress(key: KeyEvent): void {
    const now = Date.now();

    const name = key.name;
    if (name === "q" || name === "escape") {
      this.quitQueued = true;
      key.preventDefault();
      return;
    }

    if (key.ctrl && name === "c") {
      this.quitQueued = true;
      key.preventDefault();
      return;
    }

    if (name === "p") {
      this.pauseQueued = true;
      key.preventDefault();
      return;
    }

    if (name === "space") {
      this.shootQueued = true;
      key.preventDefault();
      return;
    }

    if (name === "left" || name === "a") {
      this.leftHeld = true;
      this.leftUntil = now + HOLD_MS;
      key.preventDefault();
      return;
    }
    if (name === "right" || name === "d") {
      this.rightHeld = true;
      this.rightUntil = now + HOLD_MS;
      key.preventDefault();
      return;
    }
  }

  onKeyRelease(key: KeyEvent): void {
    const name = key.name;
    if (name === "left" || name === "a") {
      this.leftHeld = false;
      this.leftUntil = 0;
      return;
    }
    if (name === "right" || name === "d") {
      this.rightHeld = false;
      this.rightUntil = 0;
    }
  }

  snapshot(): InputFrame {
    const now = Date.now();

    const leftHeld = this.leftHeld || now < this.leftUntil;
    const rightHeld = this.rightHeld || now < this.rightUntil;
    const moveX: -1 | 0 | 1 = leftHeld === rightHeld ? 0 : leftHeld ? -1 : 1;

    const frame: InputFrame = {
      moveX,
      shootPressed: this.shootQueued,
      pausePressed: this.pauseQueued,
      quitPressed: this.quitQueued,
    };

    this.shootQueued = false;
    this.pauseQueued = false;
    this.quitQueued = false;

    return frame;
  }
}
