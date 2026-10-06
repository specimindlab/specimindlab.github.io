import React from "react";
import { Audio, getStaticFiles, Sequence, staticFile } from "remotion";

export type SfxName = "pin-tick" | "paper" | "pen" | "stamp" | "drawer" | "ui-click" | "motif";

// Effects sit ~8 dB above the bed (prompt S3). The WAVs are synthesised by scripts/make_sfx.py into
// public/sfx; until a file exists the cue is silently skipped so renders never fail on audio.
const available = (() => {
  try {
    return new Set(getStaticFiles().map((f) => f.name));
  } catch {
    return new Set<string>();
  }
})();

export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 0.6 }) => {
  const file = `sfx/${name}.wav`;
  if (!available.has(file)) return null;
  return (
    <Sequence from={Math.max(0, Math.round(at))} layout="none" name={`sfx ${name}`}>
      <Audio src={staticFile(file)} volume={volume} />
    </Sequence>
  );
};
