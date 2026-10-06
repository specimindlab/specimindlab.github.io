import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../brand";
import { Path, Point, Rect, toPath, wobbleLine } from "./InkMark";
import { inkProgress } from "./motion";

// Pencil / ink strokes that draw on in order: used for the Field-sketch diagrams, tray arrows
// and anything else that should look drawn by hand rather than placed.

export const wobblyRect = (r: Rect, seed: string, amp = 1.6): Point[][] => {
  const o = 6; // corners overshoot slightly, like a pencil box
  return [
    wobbleLine({ x: r.x - o, y: r.y }, { x: r.x + r.w + o, y: r.y }, `${seed}-t`, amp),
    wobbleLine({ x: r.x + r.w, y: r.y - o }, { x: r.x + r.w, y: r.y + r.h + o }, `${seed}-r`, amp),
    wobbleLine({ x: r.x + r.w + o, y: r.y + r.h }, { x: r.x - o, y: r.y + r.h }, `${seed}-b`, amp),
    wobbleLine({ x: r.x, y: r.y + r.h + o }, { x: r.x, y: r.y - o }, `${seed}-l`, amp),
  ];
};

export type StrokesProps = {
  paths: Path[];
  start: number;
  duration: number;
  color?: string;
  width?: number;
  opacity?: number;
};

export const Strokes: React.FC<StrokesProps> = ({ paths, start, duration, color = COLORS.ink, width = 3, opacity = 0.85 }) => {
  const frame = useCurrentFrame();
  const total = paths.reduce((s, p) => s + p.length, 0);
  const drawn = inkProgress(frame, start, duration) * total;
  let used = 0;
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity }}>
      {paths.map((p, i) => {
        const visible = Math.max(0, Math.min(p.length, drawn - used));
        used += p.length;
        if (visible <= 0) return null;
        return (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={color}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${p.length} ${p.length}`}
            strokeDashoffset={p.length - visible}
          />
        );
      })}
    </svg>
  );
};

export const rectPaths = (r: Rect, seed: string) => wobblyRect(r, seed).map(toPath);
