import React from "react";
import { z } from "zod";
import { COLORS } from "../brand";
import { BeforeAfter, Card, Drawer, drawerSize, InkMark, media, Media, Plate, PLATE_W, PLATE_X, ScaleBar } from "../system";
import {
  Beat,
  beat,
  caption,
  Caption,
  captionBox,
  CONTENT_TOP,
  ctaFor,
  row,
  framed,
  seriesProps,
  seriesScript,
  timeline,
} from "./common";
import { decision, EndCard, scoreBeat, ScoreBeatView } from "./endcard";

// 1. Field Specimen (FS), the flagship: cold open on the output (or before -> after) -> conditions
// -> observation with the scale bar -> field notes with the flaw circled -> SPECIMIND Score ->
// end card: stamp + score, use it for / skip it if, the label in the drawer, the platform CTA.
// v2 pacing: 20-30 s on the 0.5 s grid. Reference: brand/reference/storyboard-episode-001.png.

const output = beat("output", { lines: caption, media, before: media.optional() });
const conditions = beat("conditions", {
  lines: caption,
  rows: z
    .array(row)
    .min(3)
    .max(6)
    .refine((r) => r.some((x) => /attempt/i.test(x.key)), { message: "conditions must state attempts" }),
});
const observation = beat("observation", {
  lines: caption,
  input: media,
  result: media,
  seconds_to_result: z.number().positive(),
  scale_max: z.number().positive().optional(),
});
const notes = beat("notes", {
  lines: caption,
  rows: z
    .array(row)
    .min(4)
    .max(6)
    .refine((r) => r.some((x) => /free/i.test(x.key)) && r.some((x) => /paid/i.test(x.key)), {
      message: "notes must show the free tier and the paid starting price",
    }),
  flaw_row: z.number().int().min(0),
});
const verdict = beat("verdict", { verdict: z.enum(["Captured", "Released"]), ...decision });

export const fieldSpecimenScript = seriesScript(
  "FieldSpecimen",
  {},
  z.discriminatedUnion("type", [output, conditions, observation, notes, scoreBeat, verdict]),
  /^output conditions observation notes( score)? verdict$/,
  "output, conditions, observation, notes, score (Live), verdict",
);
export const fieldSpecimenProps = seriesProps(fieldSpecimenScript);
export type FieldSpecimenProps = z.infer<typeof fieldSpecimenProps>;

type B<T extends string> = Extract<z.infer<typeof fieldSpecimenScript>["beats"][number], { type: T }>;

const OutputBeat: React.FC<{ b: B<"output"> }> = ({ b }) => {
  const box = captionBox(b.lines);
  const h = box.contentBottom - CONTENT_TOP;
  return (
    <>
      {b.before ? (
        <BeforeAfter before={b.before} after={b.media} y={CONTENT_TOP} h={h} />
      ) : (
        <Plate y={CONTENT_TOP} h={h}>
          <Media spec={b.media} width={PLATE_W} height={h} />
        </Plate>
      )}
      <Caption lines={b.lines} />
    </>
  );
};

const ConditionsBeat: React.FC<{ b: B<"conditions"> }> = ({ b }) => {
  const box = captionBox(b.lines);
  return (
    <>
      <Card title="Collection conditions" rows={b.rows} y={CONTENT_TOP} maxHeight={box.contentBottom - CONTENT_TOP} />
      <Caption lines={b.lines} />
    </>
  );
};

export const ObservationPlate: React.FC<{ input: z.input<typeof media>; result: z.input<typeof media>; y: number; h: number; resultAt: number }> = ({
  input,
  result,
  y,
  h,
  resultAt,
}) => {
  // storyboard-3: the input on a rounded inset at the left, a red ink arrow, the result right.
  const inset = { w: Math.round(PLATE_W * 0.37), h: h - 60 };
  const resX = 30 + inset.w + 110;
  const resW = PLATE_W - resX - 20;
  return (
    <>
      <Plate y={y} h={h}>
        <div style={{ position: "absolute", left: 30, top: 30, width: inset.w, height: inset.h, borderRadius: 34, border: `3px solid ${COLORS.ink}`, overflow: "hidden", background: "#E9ECE2" }}>
          <Media spec={input} width={inset.w} height={inset.h} />
        </div>
      </Plate>
      <InkMark shape="arrow" from={{ x: PLATE_X + 30 + inset.w + 18, y: y + h / 2 }} to={{ x: PLATE_X + resX - 14, y: y + h / 2 }} start={resultAt - 12} seed="obs-arrow" />
      <Sequencer at={resultAt}>
        <div style={{ position: "absolute", left: PLATE_X + resX, top: y + 20, width: resW, height: h - 40, overflow: "hidden" }}>
          <Media spec={result} width={resW} height={h - 40} />
        </div>
      </Sequencer>
    </>
  );
};

/** Mounts children from a frame onward, with time reset (video starts at its first frame). */
const Sequencer: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => <Beat t={{ from: at, dur: 100000, type: "result", index: 0 }}>{children}</Beat>;

const ObservationBeat: React.FC<{ b: B<"observation"> }> = ({ b }) => {
  const box = captionBox(b.lines);
  const barSpace = 120;
  const h = box.contentBottom - CONTENT_TOP - barSpace;
  return (
    <>
      <ObservationPlate input={b.input} result={b.result} y={CONTENT_TOP} h={h} resultAt={18} />
      <ScaleBar seconds={b.seconds_to_result} max={b.scale_max} x={PLATE_X} y={CONTENT_TOP + h + 56} width={832} start={18} duration={45} />
      <Caption lines={b.lines} />
    </>
  );
};

const NotesBeat: React.FC<{ b: B<"notes"> }> = ({ b }) => {
  const box = captionBox(b.lines);
  return (
    <>
      <Card title="Field notes" rows={b.rows} y={CONTENT_TOP} maxHeight={box.contentBottom - CONTENT_TOP} mark={{ row: Math.min(b.flaw_row, b.rows.length - 1), start: 24 }} />
      <Caption lines={b.lines} />
    </>
  );
};

const scoreOf = (beats: { type: string; total?: number }[]) => beats.find((b) => b.type === "score")?.total;

const FieldSpecimenBody: React.FC<FieldSpecimenProps> = ({ script, platform, catalog }) => {
  const t = timeline(script.beats);
  return (
    <>
      {t.map((b) => (
        <Beat key={b.index} t={b}>
          {b.type === "output" ? <OutputBeat b={b} /> : null}
          {b.type === "conditions" ? <ConditionsBeat b={b} /> : null}
          {b.type === "observation" ? <ObservationBeat b={b} /> : null}
          {b.type === "notes" ? <NotesBeat b={b} /> : null}
          {b.type === "score" ? <ScoreBeatView b={b} /> : null}
          {b.type === "verdict" ? (
            <EndCard
              word={b.verdict}
              code={script.code}
              score={scoreOf(script.beats)}
              useFor={b.use_for}
              skipIf={b.skip_if}
              lines={ctaFor(script.cta, platform)}
              signature={(top, bottom) => {
                const ds = drawerSize(5, 2, 110);
                if (!/^\d{3}$/.test(script.code) || bottom - top < ds.height + 40) return null;
                return <Drawer highlight={script.code} x={70 + (860 - ds.width) / 2} y={top + 40} cell={110} start={6} dropAt={16} catalog={catalog} />;
              }}
            />
          ) : null}
        </Beat>
      ))}
    </>
  );
};

export const FieldSpecimen = framed(FieldSpecimenBody);
