import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../brand";
import { INK, inkProgress } from "./motion";
import { noise1, rand } from "./noise";
import { Sfx } from "./Sfx";

// Hand-drawn red ink annotation that draws on with stroke-dashoffset. The wobble comes from a
// seeded noise function, so the same seed always draws the same hand.

export type Rect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };
export type InkShape = "ellipse" | "underline" | "strike" | "arrow";

export type InkMarkProps = {
  shape: InkShape;
  /** Ellipse / underline / strike: the box to mark. */
  target?: Rect;
  /** Arrow: from -> to. */
  from?: Point;
  to?: Point;
  start?: number;
  duration?: number;
  seed?: string;
  color?: string;
  strokeWidth?: number;
  /** Extra room around the target for ellipses (px). */
  pad?: number;
  sfx?: boolean;
};

export type Path = { d: string; length: number };

export const toPath = (pts: Point[]): Path => {
  let length = 0;
  for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  return { d, length };
};

const ellipse = (t: Rect, seed: string, pad: number): Path[] => {
  const cx = t.x + t.w / 2;
  const cy = t.y + t.h / 2;
  const rx = t.w / 2 + pad * 1.6;
  const ry = t.h / 2 + pad;
  const t0 = rand(`${seed}-t0`, 2.6, 3.4); // start near the left, like a right-handed loop
  const turns = 1.1;
  const tilt = (rand(`${seed}-tilt`, -4, -1.5) * Math.PI) / 180;
  const pts: Point[] = [];
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = t0 + u * turns * Math.PI * 2;
    const grow = 1 + 0.07 * u; // the loop does not close on itself
    const wob = 1 + 0.035 * noise1(seed, u * 5);
    const ex = Math.cos(a) * rx * grow * wob;
    const ey = Math.sin(a) * ry * grow * wob;
    pts.push({ x: cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), y: cy + ex * Math.sin(tilt) + ey * Math.cos(tilt) });
  }
  return [toPath(pts)];
};

export const wobbleLine = (a: Point, b: Point, seed: string, amp: number): Point[] => {
  const pts: Point[] = [];
  const n = 40;
  const nx = -(b.y - a.y);
  const ny = b.x - a.x;
  const l = Math.hypot(nx, ny) || 1;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const bend = Math.sin(u * Math.PI) * amp * 1.6 + noise1(seed, u * 4) * amp;
    pts.push({ x: a.x + (b.x - a.x) * u + (nx / l) * bend, y: a.y + (b.y - a.y) * u + (ny / l) * bend });
  }
  return pts;
};

export const arrowPaths = (from: Point, to: Point, seed: string, sw: number): Path[] => {
  const shaft = wobbleLine(from, to, seed, 4);
  const end = shaft[shaft.length - 1];
  const prev = shaft[shaft.length - 4];
  const ang = Math.atan2(end.y - prev.y, end.x - prev.x);
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const head = Math.min(Math.max(26, sw * 4.5), len * 0.45);
  const wing = (s: number) => ({
    x: end.x - head * Math.cos(ang + s * 0.5),
    y: end.y - head * Math.sin(ang + s * 0.5),
  });
  return [toPath(shaft), toPath([wing(1), end, wing(-1)])];
};

export const inkPaths = (p: InkMarkProps): Path[] => {
  const seed = p.seed ?? "ink";
  const sw = p.strokeWidth ?? 7;
  if (p.shape === "arrow" && p.from && p.to) return arrowPaths(p.from, p.to, seed, sw);
  const t = p.target ?? { x: 0, y: 0, w: 0, h: 0 };
  if (p.shape === "ellipse") return ellipse(t, seed, p.pad ?? 18);
  if (p.shape === "underline") {
    const y = t.y + t.h + 10;
    return [toPath(wobbleLine({ x: t.x - 8, y: y + 3 }, { x: t.x + t.w + 10, y: y - 4 }, seed, 3))];
  }
  // strike: low-left to high-right across the box
  return [toPath(wobbleLine({ x: t.x - 16, y: t.y + t.h * 0.62 }, { x: t.x + t.w + 16, y: t.y + t.h * 0.38 }, seed, 3))];
};

export const InkMark: React.FC<InkMarkProps> = (props) => {
  const frame = useCurrentFrame();
  const { start = 0, duration = INK, color = COLORS.red, strokeWidth = 7, sfx = true } = props;
  const paths = inkPaths(props);
  const total = paths.reduce((s, p) => s + p.length, 0);
  const drawn = inkProgress(frame, start, duration) * total;
  let used = 0;
  return (
    <>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
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
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${p.length} ${p.length}`}
              strokeDashoffset={p.length - visible}
            />
          );
        })}
      </svg>
      {sfx ? <Sfx name="pen" at={start} volume={0.5} /> : null}
    </>
  );
};
