import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLORS } from "../brand";
import {
  AXES,
  BeforeAfter,
  Card,
  cardLayout,
  counterHeight,
  CreditCounter,
  InkMark,
  Line,
  media,
  Media,
  PinnedTag,
  Plate,
  region,
  ScoreCard,
  scoreHeight,
  Stamp,
} from "../system";
import { Beat, beat, caption, Caption, captionBox, CONTENT_TOP, ctaFor, row, framed, seriesProps, seriesScript, timeline } from "./common";

// 2. Free Range (FR): what the free tier actually buys, told as a story on the counter.
//   counter (the hook: the most dramatic result on frame 0, the allowance as a number)
//   -> 2-3 generations, each ticking the counter down, with the flaw gag where it happens
//   -> price math -> SPECIMIND Score -> verdict: stamp, use it for / skip it if, frozen counter.
// No conditions card, no notes card, no drawer. 120 bpm grid: beats are multiples of 0.5 s.

const score = z.object({ key: z.string().min(1), value: z.number().int().min(0), max: z.number().int().positive() });

const counter = beat("counter", {
  lines: caption,
  total: z.number().int().positive(),
  unit: z.string().min(1), // "Credits", "Generations", "GPU seconds"
  period: z.string().min(1), // "per day", "a day, logged out"
  /** The hook's hero: the most dramatic real result, on screen from frame 0. */
  media: media.optional(),
  /** With `before` (the input), the hook shows before -> after. */
  before: media.optional(),
});
const observation = beat("observation", {
  lines: caption,
  result: media,
  seconds_to_result: z.number().positive(),
  /** Allowance spent after this generation (cumulative). */
  used_after: z.number().int().min(0),
});
const priceMath = beat("price-math", { lines: caption, rows: z.array(row).min(1).max(4), result: row });
const flaw = beat("flaw", {
  lines: caption,
  result_index: z.number().int().min(0),
  /** What the flaw shows (e.g. the broken mesh) if the observation showed the input. */
  result: media.optional(),
  region,
  note: z.string().min(1),
});
const scoreBeat = beat("score", { lines: caption, total: z.number().int().min(0).max(100), parts: z.array(score).min(1).max(4) });
const verdict = beat("verdict", {
  verdict: z.enum(["Captured", "Released"]),
  use_for: z.string().min(1).optional(),
  skip_if: z.string().min(1).optional(),
});

export const freeRangeScript = seriesScript(
  "FreeRange",
  {},
  z.discriminatedUnion("type", [counter, observation, priceMath, flaw, scoreBeat, verdict]),
  /^counter( observation| flaw)+ price-math( score)? verdict$/,
  "counter, observation x2-3 with one flaw among them, price-math, score (optional), verdict",
).superRefine((s, ctx) => {
  const types = s.beats.map((b) => b.type);
  const nObs = types.filter((t) => t === "observation").length;
  const nFlaw = types.filter((t) => t === "flaw").length;
  if (nObs < 2 || nObs > 3) ctx.addIssue({ code: "custom", path: ["beats"], message: `FreeRange needs 2-3 observations (got ${nObs})` });
  if (nFlaw !== 1) ctx.addIssue({ code: "custom", path: ["beats"], message: `FreeRange needs exactly one flaw (got ${nFlaw})` });
  if (types.indexOf("flaw") < types.indexOf("observation")) ctx.addIssue({ code: "custom", path: ["beats"], message: "the flaw comes after the observation it is about" });
});
export const freeRangeProps = seriesProps(freeRangeScript);
export type FreeRangeProps = z.infer<typeof freeRangeProps>;

type Script = z.infer<typeof freeRangeScript>;
type Obs = Extract<Script["beats"][number], { type: "observation" }>;
type Ctr = Extract<Script["beats"][number], { type: "counter" }>;
type Flaw = Extract<Script["beats"][number], { type: "flaw" }>;
type MediaSpec = z.infer<typeof media>;

// One result large enough to read on a phone (the hero), earlier results as small plates in the
// right column (x 870-1006: plates may run to 1010, never text).
const THUMB = { x: 870, w: 136, gap: 18 }; // border stroke stays inside x 1010
const HERO_W = THUMB.x - 20 - 70;

const Hero: React.FC<{
  spec: MediaSpec;
  tag?: string;
  seconds?: number;
  thumbs: MediaSpec[];
  y: number;
  bottom: number;
  live?: boolean;
  flaw?: { region: z.infer<typeof region>; note: string };
}> = ({ spec, tag, seconds, thumbs, y, bottom, live, flaw }) => {
  const plateY = y + (tag ? 30 : 0);
  const below = flaw ? 100 : seconds !== undefined ? 64 : 0;
  const plateH = bottom - plateY - below;
  const w = thumbs.length ? HERO_W : 860;
  return (
    <>
      <Plate x={70} y={plateY} w={w} h={plateH} crosses={false}>
        <Media spec={spec} width={w} height={plateH} />
      </Plate>
      {tag ? <PinnedTag x={82} y={y} w={96} h={52} rotate={-4} tone={live ? "red" : "ink"} text={tag} textSpan={[0.18, 0.74]} headR={7} /> : null}
      {seconds !== undefined ? <Line text={`${seconds} s to result`} x={70} baseline={plateY + plateH + 52} maxWidth={w} size={44} axes={AXES.digits} /> : null}
      {flaw ? (
        <>
          <InkMark
            shape="ellipse"
            target={{ x: 70 + flaw.region.x * w, y: plateY + flaw.region.y * plateH, w: flaw.region.w * w, h: flaw.region.h * plateH }}
            start={4}
            seed="fr-flaw"
            pad={8}
            strokeWidth={6}
          />
          <Line text={flaw.note} x={70} baseline={plateY + plateH + 70} maxWidth={w} size={44} axes={AXES.note} color={COLORS.red} />
        </>
      ) : null}
      {thumbs.map((t, k) => (
        <Plate key={k} x={THUMB.x} y={plateY + k * (THUMB.w + THUMB.gap)} w={THUMB.w} h={THUMB.w} crosses={false} border={3}>
          <Media spec={t} width={THUMB.w} height={THUMB.w} />
        </Plate>
      ))}
    </>
  );
};

const FreeRangeBody: React.FC<FreeRangeProps> = ({ script, platform }) => {
  const t = timeline(script.beats);
  const ctr = script.beats.find((b): b is Ctr => b.type === "counter") as Ctr;
  const obs = script.beats.filter((b): b is Obs => b.type === "observation");
  const fl = script.beats.find((b): b is Flaw => b.type === "flaw") as Flaw;
  // What each generation looks like once revealed (the flaw may swap an input photo for the mesh).
  const revealed = obs.map((o, i) => (fl && fl.result_index === i && fl.result ? fl.result : o.result));
  const finalUsed = obs.length ? obs[obs.length - 1].used_after : 0;
  const scoreB = script.beats.find((b) => b.type === "score") as Extract<Script["beats"][number], { type: "score" }> | undefined;
  let obsIndex = -1;
  const ch = counterHeight(true);
  const rowY = CONTENT_TOP + ch + 24;
  return (
    <>
      {t.map((b) => {
        if (b.type === "observation") obsIndex += 1;
        const i = obsIndex;
        const box = "lines" in b ? captionBox(b.lines, 420) : null;
        return (
          <Beat key={b.index} t={b}>
            {b.type === "counter" && box ? (
              b.media ? (
                <>
                  <CreditCounter total={b.total} used={0} unit={b.unit} period={b.period} y={CONTENT_TOP} compact />
                  {b.before ? (
                    <BeforeAfter before={b.before} after={b.media} y={rowY} h={box.contentBottom - rowY} />
                  ) : (
                    <Hero spec={b.media} thumbs={[]} y={rowY} bottom={box.contentBottom} />
                  )}
                  <Caption lines={b.lines} maxHeight={420} />
                </>
              ) : (
                <>
                  <CreditCounter total={b.total} used={0} unit={b.unit} period={b.period} y={Math.max(CONTENT_TOP, (CONTENT_TOP + box.contentBottom - counterHeight(false)) / 2)} />
                  <Caption lines={b.lines} maxHeight={420} />
                </>
              )
            ) : null}
            {b.type === "observation" && box ? (
              <>
                <CreditCounter total={ctr.total} used={b.used_after} prevUsed={i === 0 ? 0 : obs[i - 1].used_after} changeAt={8} unit={ctr.unit} period={ctr.period} y={CONTENT_TOP} compact />
                <Hero spec={b.result} tag={`#${i + 1}`} seconds={b.seconds_to_result} thumbs={revealed.slice(0, i)} y={rowY} bottom={box.contentBottom} live />
                <Caption lines={b.lines} maxHeight={420} />
              </>
            ) : null}
            {b.type === "flaw" && box ? (
              <>
                <Hero
                  spec={revealed[Math.min(b.result_index, obs.length - 1)]}
                  tag={`#${b.result_index + 1}`}
                  thumbs={revealed.slice(0, Math.max(0, i + 1)).filter((_, k) => k !== b.result_index)}
                  y={CONTENT_TOP}
                  bottom={box.contentBottom}
                  flaw={{ region: b.region, note: b.note }}
                />
                <Caption lines={b.lines} maxHeight={420} />
              </>
            ) : null}
            {b.type === "price-math" && box ? (
              <>
                <Card title="Price math" rows={[...b.rows, { ...b.result, emphasis: true }]} y={CONTENT_TOP} maxHeight={box.contentBottom - CONTENT_TOP} />
                <Caption lines={b.lines} maxHeight={420} />
              </>
            ) : null}
            {b.type === "score" && box ? (
              <>
                <ScoreCard total={b.total} parts={b.parts} y={Math.max(CONTENT_TOP, box.contentBottom - scoreHeight(b.parts.length))} />
                <Caption lines={b.lines} maxHeight={420} />
              </>
            ) : null}
            {b.type === "verdict" ? (
              <VerdictCard ctr={ctr} used={finalUsed} word={b.verdict} score={scoreB?.total} useFor={b.use_for} skipIf={b.skip_if} lines={ctaFor(script.cta, platform)} />
            ) : null}
          </Beat>
        );
      })}
    </>
  );
};

/** The end card: stamp + score, the decision (use it for / skip it if), the frozen counter, CTA. */
const VerdictCard: React.FC<{ ctr: Ctr; used: number; word: "Captured" | "Released"; score?: number; useFor?: string; skipIf?: string; lines: string[] }> = ({
  ctr,
  used,
  word,
  score,
  useFor,
  skipIf,
  lines,
}) => {
  const frame = useCurrentFrame();
  const box = captionBox(lines, 300);
  const rows = [
    ...(useFor ? [{ key: "Use it for", value: useFor }] : []),
    ...(skipIf ? [{ key: "Skip it if", value: skipIf }] : []),
  ];
  const stampY = CONTENT_TOP + 90;
  const cardY = CONTENT_TOP + 210;
  const cardH = rows.length ? cardLayout({ title: "Field verdict", rows, y: cardY }).height : 0;
  const ctrY = cardY + cardH + 28;
  const ctrFits = ctrY + counterHeight(true) <= box.contentBottom;
  return (
    <>
      <Stamp word={word} x={score !== undefined ? 360 : 500} y={stampY} width={score !== undefined ? 520 : 600} start={0} />
      {score !== undefined ? (
        <>
          <Line text={`${score}`} x={930} baseline={stampY + 58} maxWidth={250} size={150} axes={AXES.digits} color={COLORS.red} anchor="end" />
          <Line text="/ 100 score" x={930} baseline={stampY + 104} maxWidth={250} size={34} axes={AXES.small} anchor="end" />
        </>
      ) : null}
      {rows.length ? <Card title="Field verdict" rows={rows} y={cardY} start={4} /> : null}
      {ctrFits ? <CreditCounter total={ctr.total} used={used} unit={ctr.unit} period={ctr.period} y={ctrY} compact frozen={frame >= 14} /> : null}
      <Caption lines={lines} maxHeight={300} />
    </>
  );
};

export const FreeRange = framed(FreeRangeBody);
