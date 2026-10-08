import React from "react";
import { Audio, getStaticFiles, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { useAsset } from "./assets";

export type SfxName = "pin-tick" | "paper" | "pen" | "stamp" | "drawer" | "ui-click" | "motif";

// The mix lives in the files. scripts/make_sfx.py calibrates every WAV (bed -24 LUFS integrated,
// effects about 8 dB above it, the clicks quieter, the motif just under the effects), so every cue
// plays at volume 1 and no component carries its own fader. Re-balance in make_sfx.py, never here.
// Until a file exists the cue is silently skipped so renders never fail on a missing effect.
const available = (() => {
  try {
    return new Set(getStaticFiles().map((f) => f.name));
  } catch {
    return new Set<string>();
  }
})();

export const Sfx: React.FC<{ name: Exclude<SfxName, "motif">; at: number }> = ({ name, at }) => {
  const file = `sfx/${name}.wav`;
  if (!available.has(file)) return null;
  return (
    <Sequence from={Math.max(0, Math.round(at))} layout="none" name={`sfx ${name}`}>
      <Audio src={staticFile(file)} />
    </Sequence>
  );
};

/** motif.wav is 1.6 s. */
export const MOTIF_FRAMES = 48;
const MOTIF_TAIL = 9; // the logo's last ring ends 0.3 s before the cut, so a looping Short breathes
const MOTIF_AFTER = 24; // never on top of the end card's own stamp / drawer / pin landing
const DUCK = 0.5; // -6 dB: the bed steps back while the logo plays
const DUCK_RAMP = 6;
const OUT_FADE = 6; // no click where the bed is cut at the last frame

/** Where the motif starts: the end of the end card (the last beat), clear of its entrance sounds. */
export const motifAt = (endCardFrom: number, total: number) => {
  const at = Math.max(endCardFrom + MOTIF_AFTER, total - MOTIF_FRAMES - MOTIF_TAIL);
  return at + MOTIF_FRAMES <= total ? at : Math.max(endCardFrom, total - MOTIF_FRAMES);
};

/**
 * The episode soundtrack. With `music` (scripts/make_music.py: a 120 bpm track composed to this
 * edit, ending on the SPECIMIND hook) it plays that, with a 6-frame fade at the cut. Without it,
 * the old ambient bed plays, ducking 6 dB under the motif on the end card.
 */
export const Soundtrack: React.FC<{ bed?: string; music?: string; endCardFrom: number }> = ({ bed, music, endCardFrom }) => {
  const { durationInFrames: total } = useVideoConfig();
  const asset = useAsset();
  if (music) {
    const out = (f: number) => interpolate(f, [total - OUT_FADE, total - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return <Audio src={asset(music)} volume={out} />;
  }
  const motif = motifAt(endCardFrom, total);
  const volume = (f: number) =>
    interpolate(f, [motif - DUCK_RAMP, motif, total - OUT_FADE, total - 1], [1, DUCK, DUCK, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  return (
    <>
      {bed ? <Audio src={staticFile(bed)} volume={volume} loop /> : null}
      {available.has("sfx/motif.wav") ? (
        <Sequence from={motif} layout="none" name="sfx motif (end card)">
          <Audio src={staticFile("sfx/motif.wav")} />
        </Sequence>
      ) : null}
    </>
  );
};
