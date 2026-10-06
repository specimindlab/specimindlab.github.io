import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONT_FAMILY, variation } from "../brand";
import { MediaSpec, Region } from "./assets";
import { InkMark } from "./InkMark";
import { Media } from "./Media";
import { paperSlide, pinDrop, pinPush, PIN } from "./motion";
import { PinnedTag } from "./PinnedTag";
import { Plate } from "./Plate";
import { ScaleBar } from "./ScaleBar";
import { Sfx } from "./Sfx";
import { Stamp } from "./Stamp";
import { AXES, Line } from "./Text";

// Plate series: one shared input card on top, three plates in columns underneath. Plates fill
// one by one (each with its own small scale bar), then one ink circle per plate with a short
// note, then rank tags pin on and the winner is stamped.

export type TriptychSpecimen = {
  code: string;
  tool: string;
  media: MediaSpec;
  seconds: number;
  flaw: { text: string; region: Region };
  rank: 1 | 2 | 3;
};

export type TriptychProps = {
  input: MediaSpec;
  inputLabel: string;
  specimens: TriptychSpecimen[];
  x?: number;
  y: number;
  w?: number;
  h: number;
  start?: number;
  fillAt: number[];
  flawAt?: number;
  rankAt?: number;
  scaleMax?: number;
};

export const Triptych: React.FC<TriptychProps> = ({
  input,
  inputLabel,
  specimens,
  x = 70,
  y,
  w = 860,
  h,
  start = 0,
  fillAt,
  flawAt = Infinity,
  rankAt = Infinity,
  scaleMax,
}) => {
  const frame = useCurrentFrame();
  const cardH = 168;
  const gap = 24;
  const colW = (w - 2 * gap) / 3;
  const plateTop = y + cardH + 78; // room for rank-tag pins above the plates
  const footer = 150; // tool name, scale bar, flaw note
  const plateH = Math.max(160, y + h - footer - plateTop);
  const max = scaleMax ?? Math.max(...specimens.map((s) => s.seconds)) * 1.15;
  const cardDy = paperSlide(frame, start, 100);
  // Rank tags pin on worst-first (3, 2, 1), 10 frames apart; the stamp lands on the winner after.
  const rankOrder = [...specimens].sort((a, b) => b.rank - a.rank).map((s) => s.code);
  const winner = specimens.find((s) => s.rank === 1);
  const winnerIdx = winner ? specimens.indexOf(winner) : 0;
  const stampAt = rankAt + rankOrder.length * 10 + 4;
  return (
    <>
      {/* Shared input card */}
      <div style={{ position: "absolute", left: 0, top: cardDy, width: 1, height: 1 }}>
        <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <rect x={x} y={y} width={w} height={cardH} fill={COLORS.label} stroke={COLORS.ink} strokeWidth={3} />
          <text x={x + 36} y={y + 62} fill={COLORS.red} fontFamily={FONT_FAMILY} fontSize={36} style={{ fontVariationSettings: variation(AXES.title) }}>
            Same input
          </text>
        </svg>
        <Line text={inputLabel} x={x + 36} baseline={y + 112} maxWidth={w - 36 - 300 - 36} size={40} axes={AXES.value} />
        <Line text="for all three" x={x + 36} baseline={y + 148} maxWidth={w - 36 - 300 - 36} size={28} axes={AXES.key} color={COLORS.steel} />
        <Plate x={x + w - 28 - 220} y={y + 18} w={220} h={cardH - 36} crosses={false} border={3}>
          <Media spec={input} width={220} height={cardH - 36} />
        </Plate>
      </div>
      {specimens.map((s, i) => {
        const cx = x + i * (colW + gap);
        const filled = frame >= fillAt[i];
        const myFlaw = flawAt + i * 12;
        const rankStart = rankAt + rankOrder.indexOf(s.code) * 10;
        const region = s.flaw.region;
        return (
          <React.Fragment key={s.code}>
            <Plate x={cx} y={plateTop} w={colW} h={plateH} crosses={false}>
              {filled ? <Media spec={s.media} width={colW} height={plateH} angleOffset={-30 + i * 40} /> : null}
            </Plate>
            {!filled ? (
              <Line text={`${i + 1}`} x={cx + colW / 2} baseline={plateTop + plateH / 2 + 30} maxWidth={colW} size={90} axes={AXES.digits} color={COLORS.steel} anchor="middle" />
            ) : null}
            <Line text={s.tool} x={cx} baseline={plateTop + plateH + 46} maxWidth={colW} size={34} axes={AXES.tool} />
            {filled ? (
              <ScaleBar seconds={s.seconds} max={max} x={cx} y={plateTop + plateH + 74} width={colW} start={fillAt[i]} duration={24} suffix="s" labelSize={24} scale={0.6} />
            ) : null}
            {frame >= myFlaw ? (
              <>
                <InkMark
                  shape="ellipse"
                  target={{ x: cx + region.x * colW, y: plateTop + region.y * plateH, w: region.w * colW, h: region.h * plateH }}
                  start={myFlaw}
                  seed={`trip-${s.code}`}
                  pad={8}
                  strokeWidth={5}
                />
                {frame >= myFlaw + 8 ? (
                  <Line text={s.flaw.text} x={cx} baseline={plateTop + plateH + 146} maxWidth={colW} size={26} axes={AXES.note} color={COLORS.red} />
                ) : null}
              </>
            ) : null}
            {frame >= rankStart ? (
              <>
                <PinnedTag
                  x={cx + 10}
                  y={plateTop - 52}
                  w={96}
                  h={56}
                  rotate={-5}
                  tone={s.rank === 1 ? "red" : "ink"}
                  text={String(s.rank)}
                  textSpan={[0.3, 0.7]}
                  headR={6.5}
                  dy={pinDrop(frame, rankStart, 50)}
                  push={pinPush(frame, rankStart, 10)}
                />
                <Sfx name="pin-tick" at={rankStart + PIN.drop} />
              </>
            ) : null}
          </React.Fragment>
        );
      })}
      {winner ? (
        <Stamp word="Captured" x={x + winnerIdx * (colW + gap) + colW / 2} y={plateTop + plateH * 0.5} width={Math.min(colW + 30, 300)} start={stampAt} />
      ) : null}
    </>
  );
};
