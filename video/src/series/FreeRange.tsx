import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLORS } from "../brand";
import { Card, counterHeight, CreditCounter, InkMark, media, Media, PinnedTag, Plate, region, Stamp, AXES, Line } from "../system";
import { Beat, beat, caption, Caption, captionBox, CONTENT_TOP, ctaFor, row, framed, seriesProps, seriesScript, timeline, Timed } from "./common";

// 2. Free Range (FR): the counter IS the structure. Counter at its start value -> 2-3 generations,
// each ticking it down and pinning its result as a small plate in a row -> the price worked out
// on a card -> the flaw circled on the weakest result -> stamp, then the counter frozen.
// No conditions card, no notes card, no drawer.

const counter = beat("counter", {
  lines: caption,
  total: z.number().int().positive(),
  unit: z.string().min(1), // "Credits", "Generations"
  period: z.string().min(1), // "per day", "per month"
});
const observation = beat("observation", {
  lines: caption,
  result: media,
  seconds_to_result: z.number().positive(),
  /** Allowance spent after this generation (cumulative). */
  used_after: z.number().int().min(0),
});
const priceMath = beat("price-math", { lines: caption, rows: z.array(row).min(1).max(4), result: row });
const flaw = beat("flaw", { lines: caption, result_index: z.number().int().min(0), region, note: z.string().min(1) });
const verdict = beat("verdict", { verdict: z.enum(["Captured", "Released"]) });

export const freeRangeScript = seriesScript(
  "FreeRange",
  {},
  z.discriminatedUnion("type", [counter, observation, priceMath, flaw, verdict]),
  /^counter( observation){2,3} price-math flaw verdict$/,
  "counter, observation x2-3, price-math, flaw, verdict",
);
export const freeRangeProps = seriesProps(freeRangeScript);
export type FreeRangeProps = z.infer<typeof freeRangeProps>;

type Script = z.infer<typeof freeRangeScript>;
type Obs = Extract<Script["beats"][number], { type: "observation" }>;
type Ctr = Extract<Script["beats"][number], { type: "counter" }>;

/** The row of pinned result plates; `upTo` = how many are pinned, `live` = the one playing. */
const ResultRow: React.FC<{ obs: Obs[]; upTo: number; y: number; h: number; live?: number; flaw?: { index: number; region: z.infer<typeof region>; note: string } }> = ({
  obs,
  upTo,
  y,
  h,
  live,
  flaw,
}) => {
  const gap = 24;
  const n = obs.length;
  const w = (860 - gap * (n - 1)) / n;
  const plateH = h - 110;
  return (
    <>
      {obs.slice(0, upTo).map((o, i) => {
        const x = 70 + i * (w + gap);
        return (
          <React.Fragment key={i}>
            <Plate x={x} y={y + 30} w={w} h={plateH} crosses={false}>
              <Media spec={o.result} width={w} height={plateH} />
            </Plate>
            <PinnedTag x={x + 12} y={y} w={84} h={46} rotate={-4} tone={live === i ? "red" : "ink"} text={`#${i + 1}`} textSpan={[0.18, 0.74]} headR={6} />
            <Line text={`${o.seconds_to_result} s`} x={x} baseline={y + 30 + plateH + 50} maxWidth={w} size={40} axes={AXES.digits} />
            {flaw && flaw.index === i ? (
              <>
                <InkMark
                  shape="ellipse"
                  target={{ x: x + flaw.region.x * w, y: y + 30 + flaw.region.y * plateH, w: flaw.region.w * w, h: flaw.region.h * plateH }}
                  start={6}
                  seed="fr-flaw"
                  pad={8}
                  strokeWidth={6}
                />
                <Line text={flaw.note} x={x} baseline={y + 30 + plateH + 90} maxWidth={w} size={30} axes={AXES.note} color={COLORS.red} />
              </>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

const ObservationBeat: React.FC<{ b: Timed<Obs>; ctr: Ctr; obs: Obs[]; i: number; prevUsed: number }> = ({ b, ctr, obs, i, prevUsed }) => {
  const box = captionBox(b.lines, 420);
  const ch = counterHeight(true);
  const rowY = CONTENT_TOP + ch + 30;
  // The counter ticks when this generation's result lands (after its pin drop).
  return (
    <>
      <CreditCounter total={ctr.total} used={b.used_after} prevUsed={prevUsed} changeAt={14} unit={ctr.unit} period={ctr.period} y={CONTENT_TOP} compact />
      <ResultRow obs={obs} upTo={i + 1} y={rowY} h={box.contentBottom - rowY} live={i} />
      <Caption lines={b.lines} maxHeight={420} />
    </>
  );
};

const FrozenCounter: React.FC<{ ctr: Ctr; used: number; word: "Captured" | "Released"; lines: string[] }> = ({ ctr, used, word, lines }) => {
  const box = captionBox(lines, 420);
  const frame = useCurrentFrame();
  const ch = counterHeight(false);
  const y = Math.max(CONTENT_TOP + 230, box.contentBottom - ch);
  return (
    <>
      <Stamp word={word} x={430} y={CONTENT_TOP + 100} width={540} start={0} />
      <CreditCounter total={ctr.total} used={used} unit={ctr.unit} period={ctr.period} y={y} frozen={frame >= 14} />
      <Caption lines={lines} maxHeight={420} />
    </>
  );
};

const FreeRangeBody: React.FC<FreeRangeProps> = ({ script, platform }) => {
  const t = timeline(script.beats);
  const ctr = script.beats.find((b): b is Ctr => b.type === "counter") as Ctr;
  const obs = script.beats.filter((b): b is Obs => b.type === "observation");
  const finalUsed = obs.length ? obs[obs.length - 1].used_after : 0;
  let obsIndex = -1;
  return (
    <>
      {t.map((b) => {
        if (b.type === "observation") obsIndex += 1;
        const i = obsIndex;
        const box = "lines" in b ? captionBox(b.lines, 420) : null;
        return (
          <Beat key={b.index} t={b}>
            {b.type === "counter" && box ? (
              <>
                <CreditCounter total={b.total} used={0} unit={b.unit} period={b.period} y={Math.max(CONTENT_TOP, (CONTENT_TOP + box.contentBottom - counterHeight(false)) / 2)} />
                <Caption lines={b.lines} maxHeight={420} />
              </>
            ) : null}
            {b.type === "observation" ? <ObservationBeat b={b} ctr={ctr} obs={obs} i={i} prevUsed={i === 0 ? 0 : obs[i - 1].used_after} /> : null}
            {b.type === "price-math" && box ? (
              <>
                <Card title="Price math" rows={[...b.rows, { ...b.result, emphasis: true }]} y={CONTENT_TOP} maxHeight={box.contentBottom - CONTENT_TOP} />
                <Caption lines={b.lines} maxHeight={420} />
              </>
            ) : null}
            {b.type === "flaw" && box ? (
              <>
                <ResultRow obs={obs} upTo={obs.length} y={CONTENT_TOP + 20} h={box.contentBottom - CONTENT_TOP - 20} flaw={{ index: Math.min(b.result_index, obs.length - 1), region: b.region, note: b.note }} />
                <Caption lines={b.lines} maxHeight={420} />
              </>
            ) : null}
            {b.type === "verdict" ? <FrozenCounter ctr={ctr} used={finalUsed} word={b.verdict} lines={ctaFor(script.cta, platform)} /> : null}
          </Beat>
        );
      })}
    </>
  );
};


export const FreeRange = framed(FreeRangeBody);
