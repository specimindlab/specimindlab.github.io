#!/usr/bin/env node
// Prints facts about an episode's script.json that the shell scripts need.
//   node scripts/episode_frames.mjs <script.json> composition   -> composition id
//   node scripts/episode_frames.mjs <script.json> total         -> total frames
//   node scripts/episode_frames.mjs <script.json> review        -> review-still frames, one per line:
//        every beat boundary + 1 s, 25/50/75 %, plus the first and last frame (loop check)
// Timing rule must match video/src/schema.ts: each beat lasts round(seconds * fps) frames.
import { readFileSync } from "node:fs";

const FPS = 30;
const [file, what] = process.argv.slice(2);
const script = JSON.parse(readFileSync(file, "utf8"));
const frames = script.beats.map((b) => Math.round(b.seconds * FPS));
const total = frames.reduce((a, b) => a + b, 0);

if (what === "composition") {
  console.log(script.composition);
} else if (what === "total") {
  console.log(total);
} else if (what === "review") {
  const out = new Map(); // frame -> label
  const put = (f, label) => {
    const clamped = Math.max(0, Math.min(total - 1, Math.round(f)));
    if (!out.has(clamped)) out.set(clamped, label);
  };
  put(0, "first");
  let start = 0;
  frames.forEach((len, i) => {
    put(start + FPS, `beat${String(i + 1).padStart(2, "0")}-${script.beats[i].type}`);
    start += len;
  });
  for (const p of [25, 50, 75]) put((total * p) / 100, `p${p}`);
  put(total - 1, "last");
  [...out.entries()].sort((a, b) => a[0] - b[0]).forEach(([f, l]) => console.log(`${f} ${l}`));
} else {
  console.error("usage: episode_frames.mjs <script.json> composition|total|review");
  process.exit(2);
}
