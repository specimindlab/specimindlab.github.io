import React from "react";
import { COLORS } from "../brand";
import { fitInline } from "./measure";
import { AXES, Line } from "./Text";

// A small paper slip that says what a picture is ("What we gave it", "What it made", "From the
// side"): plain-language labels on media, so nobody has to guess which image is the result.
export const PlateTag: React.FC<{ text: string; x: number; y: number; maxWidth?: number; size?: number; tone?: "ink" | "red" }> = ({
  text,
  x,
  y,
  maxWidth = 420,
  size = 32,
  tone = "ink",
}) => {
  const fit = fitInline(text, maxWidth - 28, AXES.value, size);
  const w = fit.width + 28;
  const h = fit.fontSize * 1.45;
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: COLORS.label, border: `3px solid ${tone === "red" ? COLORS.red : COLORS.ink}` }} />
      <Line text={text} x={x + 14} baseline={y + h * 0.7} maxWidth={maxWidth - 28} size={size} axes={AXES.value} color={tone === "red" ? COLORS.red : COLORS.ink} />
    </>
  );
};
