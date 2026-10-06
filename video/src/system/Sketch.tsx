import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../brand";
import { arrowPaths, toPath } from "./InkMark";
import { Strokes, wobblyRect } from "./Strokes";
import { AXES, Line } from "./Text";

// Field sketch: a pencil diagram redrawn from public information. What goes in (top row), the
// tool (middle), what comes out (bottom row). Each box draws itself, then its words cut in.
// Never generated output: every mark here is ours.

export type SketchProps = {
  inputs: string[];
  tool: string;
  outputs: string[];
  x: number;
  y: number;
  w: number;
  h: number;
  start?: number;
  step?: number;
};

type Box = { x: number; y: number; w: number; h: number; text: string; seed: string; strong?: boolean };

const row = (items: string[], x: number, y: number, w: number, h: number, seed: string): Box[] => {
  const gap = 28;
  const bw = (w - gap * (items.length - 1)) / items.length;
  return items.map((text, i) => ({ x: x + i * (bw + gap), y, w: bw, h, text, seed: `${seed}${i}` }));
};

export const Sketch: React.FC<SketchProps> = ({ inputs, tool, outputs, x, y, w, h, start = 0, step = 8 }) => {
  const frame = useCurrentFrame();
  const pad = 34;
  const boxH = Math.min(120, (h - 2 * pad) / 4.2);
  const toolH = boxH * 1.25;
  const inner = { x: x + pad, w: w - 2 * pad };
  const rowGap = (h - 2 * pad - 2 * boxH - toolH) / 2;
  const ins = row(inputs, inner.x, y + pad, inner.w, boxH, "in");
  const toolBox: Box = { x: inner.x + inner.w * 0.18, y: y + pad + boxH + rowGap, w: inner.w * 0.64, h: toolH, text: tool, seed: "tool", strong: true };
  const outs = row(outputs, inner.x, toolBox.y + toolH + rowGap, inner.w, boxH, "out");
  const items: { paths: ReturnType<typeof toPath>[]; box?: Box; red?: boolean }[] = [];
  ins.forEach((b) => items.push({ paths: wobblyRect(b, b.seed).map(toPath), box: b }));
  ins.forEach((b, i) =>
    items.push({ paths: arrowPaths({ x: b.x + b.w / 2, y: b.y + b.h + 8 }, { x: toolBox.x + toolBox.w * ((i + 1) / (ins.length + 1)), y: toolBox.y - 10 }, `ai${i}`, 3) }),
  );
  items.push({ paths: wobblyRect(toolBox, "tool").map(toPath), box: toolBox, red: true });
  outs.forEach((b, i) =>
    items.push({ paths: arrowPaths({ x: toolBox.x + toolBox.w * ((i + 1) / (outs.length + 1)), y: toolBox.y + toolH + 10 }, { x: b.x + b.w / 2, y: b.y - 8 }, `ao${i}`, 3) }),
  );
  outs.forEach((b) => items.push({ paths: wobblyRect(b, b.seed).map(toPath), box: b }));
  return (
    <>
      {items.map((it, i) => {
        const at = start + i * step;
        if (frame < at) return null;
        return (
          <React.Fragment key={i}>
            <Strokes paths={it.paths} start={at} duration={step} color={it.red ? COLORS.red : COLORS.ink} width={it.red ? 4 : 3} opacity={it.red ? 1 : 0.8} />
            {it.box && frame >= at + step ? (
              <Line
                text={it.box.text}
                x={it.box.x + it.box.w / 2}
                baseline={it.box.y + it.box.h / 2 + (it.box.strong ? 16 : 11)}
                maxWidth={it.box.w - 30}
                size={it.box.strong ? 46 : 32}
                axes={it.box.strong ? AXES.tool : AXES.small}
                anchor="middle"
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const sketchDuration = (inputs: number, outputs: number, step = 8) => (inputs * 2 + 1 + outputs * 2) * step + step;
