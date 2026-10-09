import React from "react";
import { COLORS } from "../brand";
import { MediaSpec } from "./assets";
import { Media } from "./Media";
import { Plate } from "./Plate";
import { PlateTag } from "./PlateTag";
import { LABEL } from "../vocab";

// Before -> after in one plate pair: the input on the left, the tool's result on the right, an ink
// arrow between. The strongest first frame we have: the payoff (or the disaster) next to what it
// started as, readable in under a second with the sound off.
export const BeforeAfter: React.FC<{ before: MediaSpec; after: MediaSpec; x?: number; y: number; w?: number; h: number; angle?: number; labels?: [string, string] | false }> = ({
  before,
  after,
  x = 70,
  y,
  w = 936, // plate stroke stays inside x 1010
  h,
  angle,
  labels = [LABEL.input, LABEL.output],
}) => {
  const gap = 56;
  const pw = (w - gap) / 2;
  const ay = y + h / 2;
  const ax = x + pw + 10;
  return (
    <>
      <Plate x={x} y={y} w={pw} h={h} crosses={false}>
        <Media spec={{ ...before, fit: "cover" }} width={pw} height={h} />
      </Plate>
      <Plate x={x + pw + gap} y={y} w={pw} h={h} crosses={false}>
        <Media spec={after} width={pw} height={h} angleOffset={angle} />
      </Plate>
      {labels ? (
        <>
          <PlateTag text={labels[0]} x={x + 12} y={y + h - 64} maxWidth={pw - 24} size={30} />
          <PlateTag text={labels[1]} x={x + pw + gap + 12} y={y + h - 64} maxWidth={pw - 24} size={30} tone="red" />
        </>
      ) : null}
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={`M ${ax} ${ay} L ${ax + gap - 20} ${ay} M ${ax + gap - 34} ${ay - 14} L ${ax + gap - 20} ${ay} L ${ax + gap - 34} ${ay + 14}`} stroke={COLORS.red} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );
};
