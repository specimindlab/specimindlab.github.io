#!/usr/bin/env node
// Writes <id>.srt next to script.json: one cue per beat, timed exactly like the composition
// (each beat lasts round(seconds * 30) frames, scripts/episode_frames.mjs), text = the beat's
// caption lines. The last beat's caption is the CTA; the .srt carries the YouTube variant.
//   node scripts/make_srt.mjs episodes/E002-hunyuan3d/script.json [yt|ig|x]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const FPS = 30;
const [file, platform = "yt"] = process.argv.slice(2);
if (!file) {
  console.error("usage: node scripts/make_srt.mjs <script.json> [yt|ig|x]");
  process.exit(2);
}
const script = JSON.parse(readFileSync(file, "utf8"));
// Same split as ctaLines() in video/src/series/common.tsx: explicit "\n" wins, else two balanced lines.
const ctaLines = (text) => {
  if (text.includes("\n")) return text.split("\n").map((l) => l.trim()).filter(Boolean);
  const w = text.trim().split(/\s+/);
  if (w.length <= 2) return [text.trim()];
  let best = [text];
  let score = Infinity;
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(" ");
    const b = w.slice(i).join(" ");
    if (Math.abs(a.length - b.length) < score) {
      score = Math.abs(a.length - b.length);
      best = [a, b];
    }
  }
  return best;
};
const ts = (frame) => {
  const ms = Math.round((frame / FPS) * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
let from = 0;
const cues = [];
script.beats.forEach((b, i) => {
  const dur = Math.round(b.seconds * FPS);
  const last = i === script.beats.length - 1;
  const lines = b.lines?.length ? b.lines : last && script.cta ? ctaLines(script.cta[platform]) : [];
  if (lines.length) cues.push(`${cues.length + 1}\n${ts(from)} --> ${ts(from + dur)}\n${lines.join("\n")}\n`);
  from += dur;
});
const out = join(dirname(file), `${script.id}.srt`);
writeFileSync(out, cues.join("\n"));
console.log(`${out}: ${cues.length} cues, ${(from / FPS).toFixed(1)} s`);
