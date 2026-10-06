import { random } from "remotion";

// Deterministic randomness: the same seed always draws the same wobble, so renders are reproducible.

export const rand = (seed: string | number, lo = 0, hi = 1) => lo + random(seed) * (hi - lo);

const smooth = (t: number) => t * t * (3 - 2 * t);

// 1D value noise in [-1, 1]. Slow, organic drift for hand-drawn strokes.
export const noise1 = (seed: string, x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = random(`${seed}:${i}`) * 2 - 1;
  const b = random(`${seed}:${i + 1}`) * 2 - 1;
  return a + (b - a) * smooth(f);
};

// Integer seed for SVG filters (feTurbulence wants a number).
export const seedInt = (seed: string) => Math.floor(random(seed) * 10000);
