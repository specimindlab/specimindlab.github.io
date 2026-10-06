import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONT_FAMILY, variation } from "../brand";
import { fitInline } from "./measure";
import { fillProgress } from "./motion";

// Ruled bar with ticks (brand/vectors/vector-scale-bar.svg): 6 px ink rule, major ticks at the
// ends and the middle, minor ticks between, a 16 px red fill that grows to `seconds` on a scale
// of `max`, and the measured time underneath. The number counts up with the fill and lands on
// the measured value exactly.

export type ScaleBarProps = {
  seconds: number;
  max?: number;
  x: number;
  y: number; // y of the rule's centre line
  width: number;
  start?: number;
  /** Frames the fill takes to reach `seconds`. */
  duration?: number;
  /** Label suffix after the number. */
  suffix?: string;
  labelSize?: number;
  /** Compact bars (Triptych, Tray) use thinner rules. */
  scale?: number;
};

const niceMax = (s: number) => {
  for (const m of [10, 20, 30, 40, 60, 90, 120, 180, 240, 300, 600, 900, 1200, 1800, 3600]) if (s <= m * 0.92) return m;
  return Math.ceil(s / 600) * 600;
};

export const ScaleBar: React.FC<ScaleBarProps> = ({
  seconds,
  max,
  x,
  y,
  width,
  start = 0,
  duration = 36,
  suffix = "s to result",
  labelSize = 30,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const m = max ?? niceMax(seconds);
  const p = fillProgress(frame, start, duration);
  const value = seconds * p;
  const shown = p >= 1 ? seconds : Math.floor(value);
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  const label = `${fmt(shown)} ${suffix}`;
  const fit = fitInline(`${fmt(seconds)} ${suffix}`, width, { wdth: 100, wght: 800 }, labelSize);
  const ticks = Array.from({ length: 11 }, (_, i) => i);
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <rect x={x} y={y - 8 * scale} width={Math.min(1, value / m) * width} height={16 * scale} fill={COLORS.red} />
      <line x1={x} y1={y} x2={x + width} y2={y} stroke={COLORS.ink} strokeWidth={6 * scale} />
      {ticks.map((i) => {
        const major = i % 5 === 0;
        const tx = x + (i / 10) * width;
        return (
          <line
            key={i}
            x1={tx}
            y1={y - (major ? 18 : 10) * scale}
            x2={tx}
            y2={y + 10 * scale}
            stroke={COLORS.ink}
            strokeWidth={(major ? 5 : 3) * scale}
          />
        );
      })}
      <text
        x={x + width / 2}
        y={y + 26 * scale + fit.fontSize * 0.7}
        textAnchor="middle"
        fill={COLORS.ink}
        fontFamily={FONT_FAMILY}
        fontSize={fit.fontSize}
        style={{ fontVariationSettings: variation(fit.axes) }}
      >
        {label}
      </text>
    </svg>
  );
};

/** Height the bar occupies below its rule centre (for layout). */
export const scaleBarDepth = (labelSize = 30, scale = 1) => 26 * scale + labelSize * 0.7 + 8;
