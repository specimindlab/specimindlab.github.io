import React from "react";
import { COLORS } from "../brand";

// Archival-white output frame: 4 px ink border and registration crosses on the corners
// (brand/templates/shorts-cover-template.svg). Children are clipped to the inside.
// Default geometry keeps the crosses inside x 70..1010, the plate zone allowed by CLAUDE.md.

export const PLATE_X = 98;
export const PLATE_W = 884; // 98..982, crosses reach 70..1010

export type PlateProps = {
  x?: number;
  y: number;
  w?: number;
  h: number;
  crosses?: boolean;
  /** Cross arm length either side of the corner. */
  arm?: number;
  children?: React.ReactNode;
  fill?: string;
  border?: number;
};

export const Plate: React.FC<PlateProps> = ({
  x = PLATE_X,
  y,
  w = PLATE_W,
  h,
  crosses = true,
  arm = 28,
  children,
  fill = COLORS.label,
  border = 4,
}) => {
  const corners = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: fill, overflow: "hidden" }}>
        {children}
      </div>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={x} y={y} width={w} height={h} fill="none" stroke={COLORS.ink} strokeWidth={border} />
        {crosses
          ? corners.map(([cx, cy], i) => (
              <g key={i} stroke={COLORS.ink} strokeWidth={3}>
                <line x1={cx - arm} y1={cy} x2={cx + arm} y2={cy} />
                <line x1={cx} y1={cy - arm} x2={cx} y2={cy + arm} />
              </g>
            ))
          : null}
      </svg>
    </>
  );
};
