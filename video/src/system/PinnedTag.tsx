import React from "react";
import { COLORS, FONT_FAMILY, variation } from "../brand";
import { Axes, fitInline } from "./measure";

// A specimen tag pierced by an entomology pin, drawn from the geometry of brand/vectors and
// brand/templates/storyboard-*.svg: crimson (or ink) rectangle, hairline inner border at 85 %,
// pin entering near the right edge at mid height, shaft continuing beneath the tag, black
// spherical head with a small highlight and a soft offset shadow.
//
// Coordinates are in the parent's space. The SVG is unclipped, so the pin may leave the tag box.

export type TagTone = "red" | "ink" | "steel" | "outline";

// Pin direction (head up and to the right) from the reference: (24.2, -151.4) normalised.
const AXIS = (() => {
  const x = 24.2;
  const y = -151.4;
  const l = Math.hypot(x, y);
  return { x: x / l, y: y / l };
})();

export type PinGeometry = { pierce: { x: number; y: number }; head: { x: number; y: number }; tail: { x: number; y: number } };

const rotateAround = (px: number, py: number, cx: number, cy: number, deg: number) => {
  const r = (deg * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) };
};

export const pinGeometry = (x: number, y: number, w: number, h: number, rotate: number, push = 0, reach?: number): PinGeometry => {
  const pierce = rotateAround(x + 0.885 * w, y + 0.5 * h, x + w / 2, y + h / 2, rotate);
  // Reference proportions hold for header tags (146 px) and drawer tags (46.5 px) alike.
  const up = (reach ?? 1.055 * h) + push;
  const down = Math.max(0, (reach ?? 1.055 * h) * 0.9 - push);
  return {
    pierce,
    head: { x: pierce.x + AXIS.x * up, y: pierce.y + AXIS.y * up },
    tail: { x: pierce.x - AXIS.x * down, y: pierce.y - AXIS.y * down },
  };
};

const FILL: Record<TagTone, string> = {
  red: COLORS.red,
  ink: COLORS.ink,
  steel: COLORS.steel,
  outline: "none",
};

export type PinnedTagProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  tone?: TagTone;
  text?: string;
  textAxes?: Axes;
  /** Text box as fractions of w: [left, right]. Defaults keep text clear of the pin. */
  textSpan?: [number, number];
  /** Max text size as a fraction of h. */
  textScale?: number;
  /** px the tag is offset vertically (pin drop). */
  dy?: number;
  /** px the pin is still pulled out along its axis. */
  push?: number;
  pin?: boolean;
  /** Head radius in px. Reference: 0.05 w on header tags, 0.07 w on drawer tags. */
  headR?: number;
  opacity?: number;
  /** Override how far the pin head stands above the tag (px). */
  reach?: number;
};

export const PinnedTag: React.FC<PinnedTagProps> = ({
  x,
  y,
  w,
  h,
  rotate = -4,
  tone = "red",
  text,
  textAxes = { wdth: 130, wght: 900 },
  textSpan = [0.146, 0.79],
  textScale = 0.46,
  dy = 0,
  push = 0,
  pin = true,
  headR = 0.05 * w,
  opacity = 1,
  reach,
}) => {
  const ty = y + dy;
  const g = pinGeometry(x, ty, w, h, rotate, push, reach);
  const shaft = 0.28 * headR;
  const shadow = { x: 0.5 * headR, y: 0.7 * headR };
  const textColor = tone === "outline" ? COLORS.steel : tone === "ink" ? COLORS.herbarium : COLORS.label;
  const hairline = tone === "ink" ? COLORS.herbarium : COLORS.label;
  const fit = text
    ? fitInline(text, (textSpan[1] - textSpan[0]) * w, textAxes, textScale * h, Math.min(textAxes.wdth, textAxes.wdth > 120 ? 90 : 70))
    : null;
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity }}>
      {pin ? (
        <line
          x1={g.pierce.x}
          y1={g.pierce.y}
          x2={g.tail.x}
          y2={g.tail.y}
          stroke={COLORS.steel}
          strokeWidth={shaft}
          strokeLinecap="round"
        />
      ) : null}
      <g transform={`rotate(${rotate} ${x + w / 2} ${ty + h / 2})`}>
        {tone === "outline" ? (
          <rect
            x={x}
            y={ty}
            width={w}
            height={h}
            fill="none"
            stroke={COLORS.steel}
            strokeWidth={Math.max(1, 0.012 * w)}
            strokeDasharray={`${0.04 * w} ${0.03 * w}`}
          />
        ) : (
          <>
            <rect x={x} y={ty} width={w} height={h} fill={FILL[tone]} />
            <rect
              x={x + 0.035 * w}
              y={ty + 0.035 * w}
              width={w - 0.07 * w}
              height={h - 0.07 * w}
              fill="none"
              stroke={hairline}
              strokeOpacity={0.85}
              strokeWidth={Math.max(1.2, 0.0094 * w)}
            />
          </>
        )}
        {fit && text ? (
          <text
            x={x + textSpan[0] * w}
            y={ty + h / 2 + 0.34 * fit.fontSize}
            fill={textColor}
            fontFamily={FONT_FAMILY}
            fontSize={fit.fontSize}
            style={{ fontVariationSettings: variation(fit.axes) }}
          >
            {text}
          </text>
        ) : null}
      </g>
      {pin ? (
        <>
          <circle cx={g.pierce.x} cy={g.pierce.y} r={0.252 * headR} fill={COLORS.ink} fillOpacity={0.55} />
          <line
            x1={g.head.x + shadow.x}
            y1={g.head.y + shadow.y}
            x2={g.pierce.x + 0.1 * headR}
            y2={g.pierce.y + 0.14 * headR}
            stroke={COLORS.ink}
            strokeOpacity={0.13}
            strokeWidth={shaft}
            strokeLinecap="round"
          />
          <circle cx={g.head.x + shadow.x} cy={g.head.y + shadow.y} r={headR} fill={COLORS.ink} fillOpacity={0.13} />
          <line
            x1={g.head.x}
            y1={g.head.y}
            x2={g.pierce.x}
            y2={g.pierce.y}
            stroke={COLORS.steel}
            strokeWidth={shaft}
            strokeLinecap="round"
          />
          <circle cx={g.head.x} cy={g.head.y} r={headR} fill={COLORS.ink} />
          <circle
            cx={g.head.x - 0.35 * headR}
            cy={g.head.y - 0.35 * headR}
            r={0.28 * headR}
            fill={COLORS.label}
            fillOpacity={0.55}
          />
        </>
      ) : null}
    </svg>
  );
};
