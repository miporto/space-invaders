// Deterministic RNG for gameplay (LCG).
// This keeps unit tests stable and avoids Math.random() in core logic.

export function nextUint32(state: number): number {
  // LCG constants (Numerical Recipes)
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

export function nextFloat01(state: number): { state: number; value: number } {
  const next = nextUint32(state);
  // Map to [0, 1)
  return { state: next, value: next / 2 ** 32 };
}
