import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, DERIVED } from "../brand";
import { MediaSpec, Region } from "./assets";
import { arrowPaths, InkMark } from "./InkMark";
import { fitInline } from "./measure";
import { Media } from "./Media";
import { fillProgress } from "./motion";
import { PinnedTag } from "./PinnedTag";
import { Sfx } from "./Sfx";
import { Strokes } from "./Strokes";
import { AXES, Line } from "./Text";

// Dissection tray: numbered wells stacked top to bottom, one tool per stage on a small tag.
// Each stage fills its well with its result and seconds; red ink arrows join the stages; the
// totals sit under the tray in catalog digits.

export type TrayStage = { tool: string; media: MediaSpec; seconds: number; cost: string; flaw?: Region };

export type TrayProps = {
  stages: TrayStage[];
  x?: number;
  y: number;
  w?: number;
  h: number;
  /** Frame each stage fills (Infinity: still empty). */
  fillAt: number[];
  flaw?: { stage: number; at: number; region: Region };
  totals?: { at: number; seconds: number; cost: string };
};

const TOTALS_H = 96;

export const Tray: React.FC<TrayProps> = ({ stages, x = 70, y, w = 860, h, fillAt, flaw, totals }) => {
  const frame = useCurrentFrame();
  const n = stages.length;
  const arrowGap = 56;
  const wellH = (h - TOTALS_H - arrowGap * (n - 1)) / n;
  const numW = 96;
  const mediaW = Math.min(360, (wellH - 28) * 1.4);
  const mediaX = x + numW + 8;
  const textX = mediaX + mediaW + 30;
  const textW = x + w - 28 - textX;
  const tagH = Math.min(64, wellH * 0.34);
  const secSize = Math.min(52, wellH * 0.3);
  return (
    <>
      {stages.map((s, i) => {
        const wy = y + i * (wellH + arrowGap);
        const filled = frame >= fillAt[i];
        const mediaH = wellH - 28;
        return (
          <React.Fragment key={i}>
            <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <rect x={x} y={wy} width={w} height={wellH} rx={26} fill={DERIVED.inset} stroke={COLORS.ink} strokeWidth={3} />
              <rect x={mediaX} y={wy + 14} width={mediaW} height={mediaH} rx={14} fill={COLORS.label} stroke={COLORS.steel} strokeWidth={1.5} />
            </svg>
            <Line text={String(i + 1)} x={x + numW / 2 + 4} baseline={wy + wellH / 2 + 30} maxWidth={numW - 20} size={84} axes={AXES.digits} anchor="middle" color={filled ? COLORS.ink : COLORS.steel} />
            {filled ? (
              <div style={{ position: "absolute", left: mediaX, top: wy + 14, width: mediaW, height: mediaH, borderRadius: 14, overflow: "hidden" }}>
                <Media spec={s.media} width={mediaW} height={mediaH} />
              </div>
            ) : null}
            <PinnedTag x={textX} y={wy + 0.14 * wellH} w={Math.min(textW - 40, 300)} h={tagH} rotate={-3} tone={filled ? "red" : "ink"} text={s.tool} textAxes={{ wdth: 100, wght: 900 }} textSpan={[0.08, 0.8]} textScale={0.5} headR={Math.max(6, tagH * 0.12)} />
            {filled ? (
              <>
                <Line text={`${s.seconds} s`} x={textX} baseline={wy + wellH - 0.14 * wellH} maxWidth={textW * 0.6} size={secSize} axes={AXES.digits} />
                <Line text={s.cost === "0" ? "free" : s.cost} x={textX + fitInline(`${s.seconds} s`, textW * 0.6, AXES.digits, secSize).width + 18} baseline={wy + wellH - 0.14 * wellH} maxWidth={textW * 0.3} size={secSize * 0.55} axes={AXES.small} color={COLORS.steel} />
              </>
            ) : null}
            {i < n - 1 && frame >= fillAt[i + 1] - 8 ? (
              <Strokes
                paths={arrowPaths({ x: x + numW / 2 + 4, y: wy + wellH + 6 }, { x: x + numW / 2 + 4, y: wy + wellH + arrowGap - 6 }, `tray-${i}`, 5)}
                start={fillAt[i + 1] - 8}
                duration={8}
                color={COLORS.red}
                width={5}
                opacity={1}
              />
            ) : null}
            {flaw && flaw.stage === i ? (
              <InkMark
                shape="ellipse"
                target={{ x: mediaX + flaw.region.x * mediaW, y: wy + 14 + flaw.region.y * mediaH, w: flaw.region.w * mediaW, h: flaw.region.h * mediaH }}
                start={flaw.at}
                seed={`tray-flaw-${i}`}
                pad={8}
                strokeWidth={6}
              />
            ) : null}
          </React.Fragment>
        );
      })}
      {totals && frame >= totals.at ? (
        <>
          <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line x1={x} y1={y + h - TOTALS_H + 16} x2={x + w} y2={y + h - TOTALS_H + 16} stroke={COLORS.ink} strokeWidth={3} />
          </svg>
          <Line text="Total" x={x} baseline={y + h - 22} maxWidth={200} size={30} axes={AXES.small} color={COLORS.steel} />
          <Line
            text={`${Math.round(totals.seconds * fillProgress(frame, totals.at, 18))} s · ${totals.cost === "0" ? "0 spent" : totals.cost}`}
            x={x + w}
            baseline={y + h - 14}
            maxWidth={w - 200}
            size={64}
            axes={AXES.digits}
            anchor="end"
          />
          <Sfx name="ui-click" at={totals.at} />
        </>
      ) : null}
    </>
  );
};
