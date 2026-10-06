import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, CONTENT_WIDTH, DERIVED, FONT_FAMILY, SAFE, variation } from "../brand";
import { InkMark, Rect } from "./InkMark";
import { Axes, fitInline } from "./measure";
import { paperSlide } from "./motion";
import { Sfx } from "./Sfx";

// Archival card (brand/templates/storyboard-2 and -4): label-white paper, 3 px ink border, red
// title, ruled rows with the key in pin steel and the value in ink. The whole card slides in
// like paper (12 frames, ease-out); rows follow 2 frames apart.

export type CardRow = {
  key: string;
  value: string;
  /** Price-math result row: value in catalog digits, larger. */
  emphasis?: boolean;
};

export type CardProps = {
  title: string;
  rows: CardRow[];
  x?: number;
  y: number;
  w?: number;
  /** Shrinks the row pitch (down to 62) so the card fits. */
  maxHeight?: number;
  start?: number;
  /** Circle one row's value in red ink. */
  mark?: { row: number; start: number; seed?: string };
  sfx?: boolean;
};

const TITLE_AXES: Axes = { wdth: 125, wght: 900 };
const KEY_AXES: Axes = { wdth: 85, wght: 600 };
const VALUE_AXES: Axes = { wdth: 100, wght: 800 };
const EMPH_AXES: Axes = { wdth: 130, wght: 900 };

export const cardLayout = (p: Pick<CardProps, "rows" | "x" | "y" | "w" | "maxHeight" | "title">) => {
  const x = p.x ?? SAFE.left;
  const w = p.w ?? CONTENT_WIDTH;
  const pad = 40;
  const head = 94;
  const tail = 16;
  const weights = p.rows.map((r) => (r.emphasis ? 1.55 : 1));
  const units = weights.reduce((a, b) => a + b, 0);
  let pitch = 92;
  if (p.maxHeight !== undefined) pitch = Math.max(62, Math.min(92, (p.maxHeight - head - tail) / units));
  const k = pitch / 92;
  const valueX = x + Math.round(w * 0.3);
  const valueW = x + w - pad - valueX;
  const keyW = valueX - (x + pad) - 16;
  let cursor = p.y + head;
  const rows = p.rows.map((r, i) => {
    const rowH = pitch * weights[i];
    const rule = cursor + rowH;
    cursor = rule;
    const valueFit = r.emphasis
      ? fitInline(r.value, valueW, EMPH_AXES, 64 * k, 90)
      : fitInline(r.value, valueW, VALUE_AXES, 34 * Math.max(0.85, k), 70);
    const keyFit = fitInline(r.key, keyW, KEY_AXES, 26 * Math.max(0.9, k), 65);
    return { rule, baseline: rule - 26 * k, valueFit, keyFit };
  });
  const title = fitInline(p.title, w - 2 * pad, TITLE_AXES, 40, 90);
  return { x, y: p.y, w, pad, valueX, rows, title, height: cursor + tail - p.y };
};

/** Box around a row's value text, in frame coordinates (for ink marks). */
export const cardValueBox = (l: ReturnType<typeof cardLayout>, row: number): Rect => {
  const r = l.rows[row];
  const size = r.valueFit.fontSize;
  return { x: l.valueX, y: r.baseline - 0.72 * size, w: r.valueFit.width, h: 0.9 * size };
};

export const Card: React.FC<CardProps> = (props) => {
  const frame = useCurrentFrame();
  const { title, rows, start = 0, mark, sfx = true } = props;
  const l = cardLayout(props);
  if (frame < start) return null;
  const dy = paperSlide(frame, start, 140);
  return (
    <>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(0 ${dy})`}>
          <rect x={l.x} y={l.y} width={l.w} height={l.height} fill={COLORS.label} stroke={COLORS.ink} strokeWidth={3} />
          <text
            x={l.x + l.pad}
            y={l.y + 66}
            fill={COLORS.red}
            fontFamily={FONT_FAMILY}
            fontSize={l.title.fontSize}
            style={{ fontVariationSettings: variation(l.title.axes) }}
          >
            {title}
          </text>
          {rows.map((r, i) => {
            const g = l.rows[i];
            const rowStart = start + 4 + 2 * i;
            if (frame < rowStart) return null;
            const dx = paperSlide(frame, rowStart, 36);
            return (
              <g key={i} transform={`translate(${dx} 0)`}>
                <line x1={l.x + l.pad} y1={g.rule} x2={l.x + l.w - l.pad} y2={g.rule} stroke={DERIVED.rule} strokeWidth={2} />
                <text
                  x={l.x + l.pad}
                  y={g.baseline}
                  fill={COLORS.steel}
                  fontFamily={FONT_FAMILY}
                  fontSize={g.keyFit.fontSize}
                  style={{ fontVariationSettings: variation(g.keyFit.axes) }}
                >
                  {r.key}
                </text>
                <text
                  x={l.valueX}
                  y={g.baseline}
                  fill={r.emphasis ? COLORS.red : COLORS.ink}
                  fontFamily={FONT_FAMILY}
                  fontSize={g.valueFit.fontSize}
                  style={{ fontVariationSettings: variation(g.valueFit.axes) }}
                >
                  {r.value}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {mark ? <InkMark shape="ellipse" target={cardValueBox(l, mark.row)} start={mark.start} seed={mark.seed ?? title} pad={14} /> : null}
      {sfx ? <Sfx name="paper" at={start} /> : null}
    </>
  );
};
