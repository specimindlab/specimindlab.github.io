import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { COLORS, FPS } from "../brand";
import { Sfx, SfxName, Soundtrack } from "../system";

// 10 s level check for every sound (scripts/render_sound_test.sh). The bed and the motif go through
// the same <Soundtrack/> as every series, so ducking and the end-card rule are measured too. The
// cue sheet mimics real beats: the label pin, a card, an ink circle, the verdict stamp landing
// with the drawer and its pin, countdown clicks, then the end card with the motif.

export const SOUND_TEST_SECONDS = 10;
export const soundTestSchema = z.object({ bed: z.string() });

const s = (sec: number) => Math.round(sec * FPS);
const CUES: [Exclude<SfxName, "motif">, number][] = [
  ["pin-tick", 0.3],
  ["paper", 1.0],
  ["pen", 2.0],
  ["stamp", 3.0],
  ["drawer", 3.2],
  ["pin-tick", 3.9],
  ["ui-click", 5.0],
  ["ui-click", 5.5],
  ["ui-click", 6.0],
  ["paper", 6.6],
  ["stamp", 7.2],
];
export const SOUND_TEST_END_CARD = s(7.0);

export const SoundTest: React.FC<z.infer<typeof soundTestSchema>> = ({ bed }) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.herbarium }}>
    <Soundtrack bed={bed} endCardFrom={SOUND_TEST_END_CARD} />
    {CUES.map(([name, at], i) => (
      <Sfx key={i} name={name} at={s(at)} />
    ))}
  </AbsoluteFill>
);
