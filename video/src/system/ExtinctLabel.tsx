import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../brand";
import { InkMark } from "./InkMark";
import { pinDrop, pinPush, PIN } from "./motion";
import { PinnedTag } from "./PinnedTag";
import { Sfx } from "./Sfx";
import { AXES, Line } from "./Text";

// Extinction Watch: the dead tool on an ink-black label, struck through in red, with its
// successors pinned beside it in a column, each with its free tier and one line.

export type Successor = { tool: string; free_tier: string; line: string; code?: string };

export type ExtinctLabelProps = {
  name: string;
  note: string;
  x?: number;
  y: number;
  strikeAt: number;
  successors?: Successor[];
  successorsAt?: number[];
  /** Index of the successor that is circled (the Watch pick). */
  pick?: { index: number; at: number };
  /** Vertical space available for the whole block. */
  h: number;
};

export const EXTINCT_TAG = { w: 480, h: 150 } as const;

export const ExtinctLabel: React.FC<ExtinctLabelProps> = ({ name, note, x = 70, y, strikeAt, successors = [], successorsAt = [], pick, h }) => {
  const frame = useCurrentFrame();
  // Alone (opening beat) the label fills its stage; with successors it shrinks to make room.
  const alone = successors.length === 0;
  // With successors the label steps back (it was the hook) and the list gets the room: tool names
  // must read on a phone (v4: plain and readable first).
  const tag = alone ? { w: 760, h: 230 } : { w: 380, h: 116 };
  const top = alone ? y + Math.max(40, (h - tag.h - 80) / 2) : y + 30;
  // The successor tags' pins reach ~50 px above them: keep them clear of the note line.
  const listTop = top + tag.h + (alone ? 112 : 134);
  const rowH = successors.length ? Math.min(215, (y + h - listTop) / successors.length) : 0;
  const k = Math.min(1.3, rowH / 150);
  const sw = 150 * k;
  const sh = 74 * k;
  return (
    <>
      <PinnedTag x={x} y={top} w={tag.w} h={tag.h} rotate={-3} tone="ink" text={name} textAxes={{ wdth: 110, wght: 900 }} textSpan={[0.07, 0.8]} textScale={0.42} headR={alone ? 20 : 14} reach={alone ? 140 : 90} />
      <Line text={note} x={x} baseline={top + tag.h + 54} maxWidth={860} size={alone ? 40 : 34} axes={AXES.value} color={COLORS.ink} />
      <InkMark shape="strike" target={{ x: x + 10, y: top + 20, w: tag.w * 0.8, h: tag.h - 40 }} start={strikeAt} seed="extinct" strokeWidth={alone ? 18 : 14} />
      {successors.map((s, i) => {
        const at = successorsAt[i] ?? Infinity;
        if (frame < at) return null;
        const ry = listTop + i * rowH;
        const textX = x + sw + 52 * k;
        return (
          <React.Fragment key={s.tool}>
            <PinnedTag x={x} y={ry} w={sw} h={sh} rotate={-4} tone="red" text={s.code ?? String(i + 1)} textSpan={[0.2, 0.75]} headR={9 * k} dy={pinDrop(frame, at, 60)} push={pinPush(frame, at, 12)} />
            <Sfx name="pin-tick" at={at + PIN.drop} />
            <Line text={s.tool} x={textX} baseline={ry + 36 * k} maxWidth={930 - textX} size={46 * k} axes={AXES.tool} />
            <Line text={s.free_tier} x={textX} baseline={ry + 82 * k} maxWidth={930 - textX} size={34 * k} axes={AXES.value} color={COLORS.red} />
            <Line text={s.line} x={textX} baseline={ry + 122 * k} maxWidth={930 - textX} size={32 * k} axes={AXES.key} color={COLORS.ink} />
            {pick && pick.index === i ? (
              <InkMark shape="ellipse" pad={14} target={{ x, y: ry, w: sw, h: sh }} start={pick.at} seed="extinct-pick" strokeWidth={6} />
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};
