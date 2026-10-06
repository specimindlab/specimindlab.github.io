import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../brand";
import { inkProgress } from "./motion";
import { measureEm } from "./measure";
import { Sfx } from "./Sfx";
import { AXES, Line } from "./Text";

// Free Range: the free allowance as a counter. A big catalog-digit number of what is left, the
// allowance in words, and a strip of cells, one per credit (grouped when the allowance is large);
// spent cells get a red ink slash that draws on when the counter ticks.

export type CreditCounterProps = {
  total: number;
  used: number;
  /** Value before the latest tick (slashes for used - prevUsed draw on at changeAt). */
  prevUsed?: number;
  changeAt?: number;
  unit: string;
  period: string;
  x?: number;
  y: number;
  w?: number;
  compact?: boolean;
  /** Freeze look (final beat): heavier border. */
  frozen?: boolean;
};

export const counterHeight = (compact = false) => (compact ? 190 : 330);

export const CreditCounter: React.FC<CreditCounterProps> = ({
  total,
  used,
  prevUsed = used,
  changeAt = -1,
  unit,
  period,
  x = 70,
  y,
  w = 860,
  compact = false,
  frozen = false,
}) => {
  const frame = useCurrentFrame();
  const h = counterHeight(compact);
  const ticked = frame >= changeAt;
  const shownUsed = ticked ? used : prevUsed;
  const left = Math.max(0, total - shownUsed);
  const perCell = Math.max(1, Math.ceil(total / 50));
  const cells = Math.ceil(total / perCell);
  const pad = 36;
  const numSize = compact ? 100 : 200;
  const number = String(left);
  const numW = measureEm(number, AXES.digits) * numSize;
  const textX = x + pad + numW + 28;
  const textW = x + w - pad - textX;
  const stripY = y + h - (compact ? 26 : 64);
  const cellGap = 4;
  const cellW = (w - 2 * pad - (cells - 1) * cellGap) / cells;
  const cellH = compact ? 22 : 34;
  const slash = inkProgress(frame, changeAt, 6);
  return (
    <>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={x} y={y} width={w} height={h} fill={COLORS.label} stroke={COLORS.ink} strokeWidth={frozen ? 6 : 3} />
        {Array.from({ length: cells }, (_, i) => {
          const cx = x + pad + i * (cellW + cellGap);
          const spentNow = (i + 1) * perCell <= shownUsed || (i * perCell < shownUsed && perCell > 1);
          const spentBefore = (i + 1) * perCell <= prevUsed || (i * perCell < prevUsed && perCell > 1);
          const p = spentBefore ? 1 : spentNow ? slash : 0;
          return (
            <g key={i}>
              <rect x={cx} y={stripY - cellH} width={cellW} height={cellH} fill="none" stroke={COLORS.ink} strokeOpacity={0.5} strokeWidth={1.5} />
              {p > 0 ? (
                <line
                  x1={cx + 1}
                  y1={stripY - 1}
                  x2={cx + 1 + (cellW - 2) * p}
                  y2={stripY - 1 - (cellH - 2) * p}
                  stroke={COLORS.red}
                  strokeWidth={Math.max(2.5, Math.min(5, cellW * 0.3))}
                  strokeLinecap="round"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      <Line text={number} x={x + pad} baseline={y + (compact ? 106 : 214)} maxWidth={w * 0.55} size={numSize} axes={AXES.digits} color={left === 0 ? COLORS.red : COLORS.ink} />
      <Line text={`${unit} left`} x={textX} baseline={y + (compact ? 62 : 120)} maxWidth={textW} size={compact ? 38 : 52} axes={AXES.tool} />
      <Line text={`of ${total} ${period}`} x={textX} baseline={y + (compact ? 100 : 176)} maxWidth={textW} size={compact ? 28 : 36} axes={AXES.small} color={COLORS.steel} />
      {perCell > 1 ? (
        <Line text={`1 cell = ${perCell}`} x={x + w - pad} baseline={stripY - cellH - 12} maxWidth={200} size={20} axes={AXES.key} color={COLORS.steel} anchor="end" />
      ) : null}
      {changeAt >= 0 ? <Sfx name="ui-click" at={changeAt} /> : null}
    </>
  );
};
