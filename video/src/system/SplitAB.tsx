import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../brand";
import { MediaSpec, Region } from "./assets";
import { InkMark } from "./InkMark";
import { Media } from "./Media";
import { pinDrop, pinPush, PIN } from "./motion";
import { PinnedTag } from "./PinnedTag";
import { Plate } from "./Plate";
import { Sfx } from "./Sfx";
import { AXES, Line } from "./Text";

// Mimicry: A and B side by side, unlabelled except for the letters. In detail mode both sides
// zoom into matched crops. At the reveal the AI side gets its specimen tag pinned on, the real
// side an ink "Real" tag, and the giveaway is circled. Removing the reveal returns exactly to
// the opening split, so the loop is clean.

export type SplitABProps = {
  a: MediaSpec;
  b: MediaSpec;
  x?: number;
  y: number;
  w?: number;
  h: number;
  /** Matched detail crops (applied to both sides while set). */
  crop?: { a: Region; b: Region };
  reveal?: { at: number; ai: "A" | "B"; code: string; flaw?: Region };
};

export const SplitAB: React.FC<SplitABProps> = ({ a, b, x = 70, y, w = 860, h, crop, reveal }) => {
  const frame = useCurrentFrame();
  const gap = 24;
  const half = (w - gap) / 2;
  const sides = [
    { letter: "A" as const, spec: crop ? { ...a, crop: crop.a } : a, sx: x },
    { letter: "B" as const, spec: crop ? { ...b, crop: crop.b } : b, sx: x + half + gap },
  ];
  const revealed = reveal && frame >= reveal.at;
  return (
    <>
      {sides.map((s) => {
        const isAi = reveal?.ai === s.letter;
        return (
          <React.Fragment key={s.letter}>
            <Plate x={s.sx} y={y} w={half} h={h} arm={16}>
              <Media spec={s.spec} width={half} height={h} />
            </Plate>
            <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <rect x={s.sx + 18} y={y + 18} width={76} height={76} fill={COLORS.label} stroke={COLORS.ink} strokeWidth={3} />
            </svg>
            <Line text={s.letter} x={s.sx + 56} baseline={y + 79} maxWidth={60} size={58} axes={AXES.digits} anchor="middle" />
            {revealed && reveal ? (
              <>
                <PinnedTag
                  x={s.sx + 20}
                  y={y + h - 110}
                  w={isAi ? 200 : 170}
                  h={isAi ? 96 : 82}
                  rotate={-4}
                  tone={isAi ? "red" : "ink"}
                  text={isAi ? reveal.code : "Real"}
                  textAxes={isAi ? AXES.catalog : { wdth: 110, wght: 900 }}
                  dy={pinDrop(frame, reveal.at + (isAi ? 0 : 8), 70)}
                  push={pinPush(frame, reveal.at + (isAi ? 0 : 8), 14)}
                />
                <Sfx name="pin-tick" at={reveal.at + (isAi ? 0 : 8) + PIN.drop} />
                {isAi && reveal.flaw ? (
                  <InkMark
                    shape="ellipse"
                    target={{ x: s.sx + reveal.flaw.x * half, y: y + reveal.flaw.y * h, w: reveal.flaw.w * half, h: reveal.flaw.h * h }}
                    start={reveal.at + 16}
                    seed="mimicry-flaw"
                    pad={10}
                  />
                ) : null}
              </>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};
