import React from "react";
import { interpolate, Easing, useCurrentFrame } from "remotion";
import { COLORS, FONT_FAMILY, variation } from "../brand";
import { measureEm } from "./measure";
import { Sfx } from "./Sfx";

// Double-rule rubber stamp (brand/vectors/vector-stamp-*.svg): 10 px outer rule, 3 px inner rule
// inset 16 px, the word in capitals at wdth 150 / wght 900. Lands rotating from -14 deg to -7 deg,
// then a 2-frame scale thump on contact.

export type StampWord = "Captured" | "Released" | "Rare sighting" | "Watch" | "Unpaid";

const TONE: Record<StampWord, string> = {
  Captured: COLORS.red,
  Released: COLORS.ink,
  "Rare sighting": COLORS.red,
  Watch: COLORS.ink,
  Unpaid: COLORS.ink,
};

const LAND = 5; // frames from appearance to contact

export type StampProps = {
  word: StampWord;
  /** Centre of the stamp. */
  x: number;
  y: number;
  width?: number;
  start?: number;
  rotate?: number;
  /** Stamp onto a slip of archival paper (for busy backgrounds such as a sketch). */
  backing?: boolean;
};

export const stampHeight = (width: number) => width * 0.3;

export const Stamp: React.FC<StampProps> = ({ word, x, y, width = 620, start = 0, rotate = -7, backing = false }) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0) return null;
  const h = stampHeight(width);
  const color = TONE[word];
  const rot = interpolate(t, [0, LAND], [rotate - 7, rotate], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const scale =
    t < LAND
      ? interpolate(t, [0, LAND], [1.18, 1], { easing: Easing.in(Easing.quad) })
      : interpolate(t, [LAND, LAND + 1, LAND + 2], [1, 0.965, 1], { extrapolateRight: "clamp" });
  const text = word.toUpperCase();
  const axes = { wdth: 150, wght: 900 };
  const inner = width - 2 * 26;
  const size = Math.min(h * 0.36, (inner - 0.09 * width) / measureEm(text, axes));
  return (
    <>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
          {backing ? <rect x={-width / 2 - 14} y={-h / 2 - 14} width={width + 28} height={h + 28} fill={COLORS.label} stroke={COLORS.ink} strokeWidth={2} /> : null}
          <rect x={-width / 2 + 5} y={-h / 2 + 5} width={width - 10} height={h - 10} fill="none" stroke={color} strokeWidth={10} />
          <rect x={-width / 2 + 21} y={-h / 2 + 21} width={width - 42} height={h - 42} fill="none" stroke={color} strokeWidth={3} />
          <text
            x={0}
            y={size * 0.34}
            textAnchor="middle"
            fill={color}
            fontFamily={FONT_FAMILY}
            fontSize={size}
            style={{ fontVariationSettings: variation(axes) }}
          >
            {text}
          </text>
        </g>
      </svg>
      <Sfx name="stamp" at={start + LAND} volume={0.75} />
    </>
  );
};
