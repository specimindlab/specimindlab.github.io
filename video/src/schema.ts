import { z } from "zod";
import { FPS } from "./brand";

// The contract between episodes/<id>/script.json and every series composition.
// Series compositions extend `scriptBase` with their own beat payloads (prompt S2),
// but these fields are what scripts/render_batch.sh and scripts/episode_frames.mjs rely on.

export const platform = z.enum(["yt", "ig", "x"]);
export type Platform = z.infer<typeof platform>;

export const beat = z
  .object({
    type: z.string(),
    seconds: z.number().positive(),
    lines: z.array(z.string()).max(3).optional(),
  })
  .passthrough();

export const scriptBase = z
  .object({
    id: z.string().regex(/^E\d{3}$/),
    code: z.string(),
    composition: z.string(),
    series: z.string(),
    mode: z.enum(["Live specimen", "Field sketch"]),
    disclosure: z.enum(["Affiliate", "Unpaid"]),
    tool: z.string(),
    genus: z.string(),
    bed: z.string().optional(), // staticFile path, e.g. "sfx/bed-3.wav"
    beats: z.array(beat).min(1),
    cta: z.object({ yt: z.string(), ig: z.string(), x: z.string() }),
  })
  .passthrough();
export type ScriptBase = z.infer<typeof scriptBase>;

export const episodeProps = z.object({
  script: scriptBase,
  platform: platform,
});
export type EpisodeProps = z.infer<typeof episodeProps>;

// Keep in sync with scripts/episode_frames.mjs: each beat lasts round(seconds * fps) frames.
export const beatFrames = (b: { seconds: number }) => Math.round(b.seconds * FPS);
export const totalFrames = (s: { beats: { seconds: number }[] }) =>
  s.beats.reduce((sum, b) => sum + beatFrames(b), 0);
