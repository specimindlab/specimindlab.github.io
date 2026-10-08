import { Easing, interpolate } from "remotion";

// The house motion vocabulary (CLAUDE.md "Motion rules"). Snappy and exact, cut on the 120 bpm grid:
// no glow, no glitch, no particles, no fades on captions; one small pop when a caption line lands.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const PIN = { drop: 6, overshoot: 2 } as const; // 8 frames total; contact (tick) at frame 6
export const PAPER = 12; // card slide
export const INK = 10; // ink annotation draw-on
export const LINE_CUT = 3; // caption lines, one per 3 frames
export const POP = 4; // caption line lands: scale 1.06 -> 1 over 4 frames (the beat hit, not a zoom-punch)

/** Pin drop: falls `distance` px with gravity, lands at frame 6 a few px low, settles by frame 8. */
export const pinDrop = (frame: number, start: number, distance = 90) => {
  const t = frame - start;
  if (t <= 0) return -distance;
  if (t < PIN.drop) {
    return interpolate(t, [0, PIN.drop], [-distance, 5], { ...clamp, easing: Easing.in(Easing.quad) });
  }
  return interpolate(t, [PIN.drop, PIN.drop + PIN.overshoot], [5, 0], { ...clamp, easing: Easing.out(Easing.quad) });
};

/** How far the pin shaft is still pulled out of the label (px along its axis), 0 once seated. */
export const pinPush = (frame: number, start: number, travel = 26) =>
  interpolate(frame - start, [2, PIN.drop], [travel, 0], { ...clamp, easing: Easing.in(Easing.cubic) });

/** Paper slide: 12 frames, ease-out. Returns the remaining offset (px). */
export const paperSlide = (frame: number, start: number, distance = 140) =>
  interpolate(frame - start, [0, PAPER], [distance, 0], { ...clamp, easing: Easing.out(Easing.cubic) });

/** Ink draw-on progress 0..1 over 10 frames. */
export const inkProgress = (frame: number, start: number, duration = INK) =>
  interpolate(frame - start, [0, duration], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });

/** Linear-ish progress for gauges (scale bar fill, counters). */
export const fillProgress = (frame: number, start: number, duration: number) =>
  interpolate(frame - start, [0, Math.max(1, duration)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });

export const visibleFrom = (frame: number, start: number) => frame >= start;
