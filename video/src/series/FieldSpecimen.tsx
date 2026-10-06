import React from "react";
import { z } from "zod";
import { BANDS, COLORS } from "../brand";
import { Card, CatalogEntry, Drawer, drawerSize, InkMark, media, Media, Plate, PLATE_W, PLATE_X, ScaleBar, Stamp, AXES, Line } from "../system";
import {
  Beat,
  beat,
  caption,
  Caption,
  captionBox,
  CONTENT_TOP,
  ctaFor,
  hubUrl,
  Platform,
  row,
  framed,
  seriesProps,
  seriesScript,
  timeline,
} from "./common";

// 1. Field Specimen (FS): cold open on the output -> conditions -> observation with the scale
// bar -> field notes with the flaw circled -> stamp, then the label drops into the drawer.
// Reference: brand/reference/storyboard-episode-001.png.

const output = beat("output", { lines: caption, media });
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
const verdict = beat("verdict", { verdict: z.enum(["Captured", "Released"]) });

export const fieldSpecimenScript = seriesScript(
  "FieldSpecimen",
  {},
  z.discriminatedUnion("type", [output, conditions, observation, notes, verdict]),
  /^output conditions observation notes verdict$/,
  "output, conditions, observation, notes, verdict",
);
export const fieldSpecimenProps = seriesProps(fieldSpecimenScript);
export type FieldSpecimenProps = z.infer<typeof fieldSpecimenProps>;

type B<T extends string> = Extract<z.infer<typeof fieldSpecimenScript>["beats"][number], { type: T }>;

const OutputBeat: React.FC<{ b: B<"output"> }> = ({ b }) => {
  const box = captionBox(b.lines);
  const h = box.contentBottom - CONTENT_TOP;
  return (
    <>
      <Plate y={CONTENT_TOP} h={h}>
        <Media spec={b.media} width={PLATE_W} height={h} />
      </Plate>
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

export const VerdictWithDrawer: React.FC<{
  word: "Captured" | "Released" | "Watch";
  code: string;
  lines: string[];
  platform: Platform;
  catalog?: CatalogEntry[];
}> = ({ word, code, lines, platform, catalog }) => {
  const small = platform === "ig" ? 56 : 0;
  const box = captionBox(lines, 420, BANDS.captionBottom - small);
  const ds = drawerSize(5, 2);
  const stampY = CONTENT_TOP + 110;
  const drawerY = Math.min(stampY + 210, box.contentBottom - ds.height);
  return (
    <>
      <Stamp word={word} x={420} y={stampY} width={600} start={0} />
      {/^\d{3}$/.test(code) ? <Drawer highlight={code} x={70 + (860 - ds.width) / 2} y={drawerY} start={10} dropAt={24} catalog={catalog} /> : null}
      <Caption lines={lines} maxHeight={420} bottom={BANDS.captionBottom - small} />
      {platform === "ig" ? (
        <Line text={`or type ${hubUrl(code)}`} x={70} baseline={BANDS.captionBottom - 8} maxWidth={860} size={30} axes={AXES.small} />
      ) : null}
    </>
  );
};

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
          {b.type === "verdict" ? <VerdictWithDrawer word={b.verdict} code={script.code} lines={ctaFor(script.cta, platform)} platform={platform} catalog={catalog} /> : null}
        </Beat>
      ))}
    </>
  );
};

export const FieldSpecimen = framed(FieldSpecimenBody);
