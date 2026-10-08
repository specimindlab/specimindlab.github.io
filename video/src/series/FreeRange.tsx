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

// One result large enough to read on a phone (the "hero"), the other pinned results as small
// plates in a column on the right (x 870-1010: plates may run to 1010, never text). E002 review:
// three equal plates in a row were 270 px wide and a thin 3D mesh became unreadable.
const THUMB = { x: 870, w: 136, gap: 18 }; // border stroke stays inside x 1010
const HERO_W = THUMB.x - 20 - 70;

const HeroWithThumbs: React.FC<{
  obs: Obs[];
  hero: number;
  thumbs: number[];
  y: number;
  bottom: number;
  live?: boolean;
  flaw?: { region: z.infer<typeof region>; note: string };
}> = ({ obs, hero, thumbs, y, bottom, live, flaw }) => {
  const o = obs[hero];
  const plateY = y + 30;
  const plateH = bottom - plateY - (flaw ? 100 : 64);
  return (
    <>
      <Plate x={70} y={plateY} w={HERO_W} h={plateH} crosses={false}>
        <Media spec={o.result} width={HERO_W} height={plateH} />
      </Plate>
      <PinnedTag x={82} y={y} w={96} h={52} rotate={-4} tone={live ? "red" : "ink"} text={`#${hero + 1}`} textSpan={[0.18, 0.74]} headR={7} />
      <Line text={`${o.seconds_to_result} s`} x={70} baseline={plateY + plateH + 52} maxWidth={HERO_W} size={44} axes={AXES.digits} />
      {flaw ? (
        <>
          <InkMark
            shape="ellipse"
            target={{ x: 70 + flaw.region.x * HERO_W, y: plateY + flaw.region.y * plateH, w: flaw.region.w * HERO_W, h: flaw.region.h * plateH }}
            start={6}
            seed="fr-flaw"
            pad={8}
            strokeWidth={6}
          />
          <Line text={flaw.note} x={70} baseline={plateY + plateH + 94} maxWidth={HERO_W} size={34} axes={AXES.note} color={COLORS.red} />
        </>
      ) : null}
      {thumbs.map((t, k) => (
        <Plate key={t} x={THUMB.x} y={plateY + k * (THUMB.w + THUMB.gap)} w={THUMB.w} h={THUMB.w} crosses={false} border={3}>
          <Media spec={obs[t].result} width={THUMB.w} height={THUMB.w} />
        </Plate>
      ))}
    </>
  );
};

const ObservationBeat: React.FC<{ b: Timed<Obs>; ctr: Ctr; obs: Obs[]; i: number; prevUsed: number }> = ({ b, ctr, obs, i, prevUsed }) => {
  const box = captionBox(b.lines, 420);
  const ch = counterHeight(true);
  const rowY = CONTENT_TOP + ch + 24;
  // The counter ticks when this generation's result lands (after its pin drop).
  return (
    <>
      <CreditCounter total={ctr.total} used={b.used_after} prevUsed={prevUsed} changeAt={14} unit={ctr.unit} period={ctr.period} y={CONTENT_TOP} compact />
      <HeroWithThumbs obs={obs} hero={i} thumbs={Array.from({ length: i }, (_, k) => k)} y={rowY} bottom={box.contentBottom} live />
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
                <HeroWithThumbs
                  obs={obs}
                  hero={Math.min(b.result_index, obs.length - 1)}
                  thumbs={obs.map((_, k) => k).filter((k) => k !== Math.min(b.result_index, obs.length - 1))}
                  y={CONTENT_TOP}
                  bottom={box.contentBottom}
                  flaw={{ region: b.region, note: b.note }}
                />
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
