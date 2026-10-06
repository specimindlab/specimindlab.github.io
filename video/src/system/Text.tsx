import React from "react";
import { COLORS, FONT_FAMILY, variation } from "../brand";
import { Axes, fitInline } from "./measure";

// One line of UI text, fitted to a max width (condense first, then shrink), positioned by its
// baseline. Everything that is not a caption uses this so nothing can overflow its box.
export type LineProps = {
  text: string;
  x: number;
  baseline: number;
  maxWidth: number;
  size: number;
  axes: Axes;
  color?: string;
  anchor?: "start" | "middle" | "end";
  minWdth?: number;
};

export const Line: React.FC<LineProps> = ({ text, x, baseline, maxWidth, size, axes, color = COLORS.ink, anchor = "start", minWdth }) => {
  const fit = fitInline(text, maxWidth, axes, size, minWdth);
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <text
        x={x}
        y={baseline}
        textAnchor={anchor}
        fill={color}
        fontFamily={FONT_FAMILY}
        fontSize={fit.fontSize}
        style={{ fontVariationSettings: variation(fit.axes) }}
      >
        {text}
      </text>
    </svg>
  );
};

export const AXES = {
  catalog: { wdth: 140, wght: 900 },
  digits: { wdth: 150, wght: 900 },
  tool: { wdth: 100, wght: 900 },
  title: { wdth: 125, wght: 900 },
  value: { wdth: 100, wght: 800 },
  small: { wdth: 85, wght: 700 },
  key: { wdth: 85, wght: 600 },
  note: { wdth: 80, wght: 800 },
} as const satisfies Record<string, Axes>;
