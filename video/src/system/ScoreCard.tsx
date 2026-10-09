import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, DERIVED } from "../brand";
import { paperSlide } from "./motion";
import { Sfx } from "./Sfx";
import { AXES, Line } from "./Text";

// The SPECIMIND Score (data/score.md): one benchmark number out of 100, like a phone benchmark,
// with its four parts as bars. The number counts up and LOCKS at frame 45 (1.5 s into the beat),
// exactly where scripts/make_music.py lands the crash after its snare roll.

export const SCORE_LOCK = 45;

export type ScorePart = { key: string; value: number; max: number };

export const scoreHeight = (parts: number) => 300 + parts * 92;

export const ScoreCard: React.FC<{ total: number; parts: ScorePart[]; y: number; x?: number; w?: number; start?: number; label?: string }> = ({
  total,
  parts,
  y,
  x = 70,
  w = 860,
  start = 0,
  label = "SPECIMIND score",
}) => {
  const frame = useCurrentFrame() - start;
  if (frame < 0) return null;
  const dy = paperSlide(frame, 0, 120);
  const p = interpolate(frame, [4, SCORE_LOCK], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const shown = Math.round(total * p);
  const locked = frame >= SCORE_LOCK;
  const h = scoreHeight(parts.length);
  const pad = 40;
  const barX = x + pad + 250;
  const barW = w - pad * 2 - 250 - 120;
  return (
    <div style={{ position: "absolute", left: 0, top: dy, width: 1080, height: 1920 }}>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={x} y={y} width={w} height={h} fill={COLORS.label} stroke={COLORS.ink} strokeWidth={locked ? 6 : 3} />
        {parts.map((part, i) => {
          const by = y + 300 + i * 92;
          const f = interpolate(frame, [8 + 4 * i, SCORE_LOCK - 4 + 2 * i], [0, part.value / part.max], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.quad),
          });
          return (
            <g key={part.key}>
              <line x1={x + pad} y1={by - 52} x2={x + w - pad} y2={by - 52} stroke={DERIVED.rule} strokeWidth={2} />
              <rect x={barX} y={by - 30} width={barW} height={26} fill="none" stroke={COLORS.ink} strokeWidth={2} />
              <rect x={barX} y={by - 30} width={barW * f} height={26} fill={COLORS.red} />
            </g>
          );
        })}
      </svg>
      <Line text={label} x={x + pad} baseline={y + 70} maxWidth={w - 2 * pad} size={44} axes={AXES.title} color={COLORS.red} />
      <Line text={String(shown)} x={x + pad} baseline={y + 232} maxWidth={440} size={180} axes={AXES.digits} color={locked ? COLORS.red : COLORS.ink} />
      <Line text="/ 100" x={x + pad + 450} baseline={y + 232} maxWidth={300} size={64} axes={AXES.digits} />
      {parts.map((part, i) => {
        const by = y + 300 + i * 92;
        return (
          <React.Fragment key={part.key}>
            <Line text={part.key} x={x + pad} baseline={by - 6} maxWidth={230} size={38} axes={AXES.value} />
            <Line text={`${part.value}/${part.max}`} x={x + w - pad} baseline={by - 6} maxWidth={110} size={34} axes={AXES.small} anchor="end" />
          </React.Fragment>
        );
      })}
      <Sfx name="paper" at={start} />
      <Sfx name="stamp" at={start + SCORE_LOCK} />
    </div>
  );
};
