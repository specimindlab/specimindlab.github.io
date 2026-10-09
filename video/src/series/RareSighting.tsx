import React from "react";
import { z } from "zod";
import { COLORS } from "../brand";
import { Card, cardLayout, fitInline, InkMark, media, Media, Plate, PLATE_W, PLATE_X, ScaleBar, Stamp, AXES, Line } from "../system";
import { Beat, beat, caption, Caption, captionBox, CONTENT_TOP, ctaFor, row, framed, seriesProps, seriesScript, timeline } from "./common";
import { ObservationPlate } from "./FieldSpecimen";
import { decision, EndCard, scoreBeat, ScoreBeatView } from "./endcard";

// 3. Rare Sighting (RS): speed beats polish. The RARE SIGHTING stamp lands first over a static
// crop, with the launch date -> the full output -> one run with the scale bar -> a 3-row notes
// card with the flaw circled inside -> SPECIMIND Score (Live only) -> end card ending on the
// "spotted" date line and the platform CTA.

const stampOpen = beat("stamp-open", { lines: caption, launched: z.string().min(3), crop: media });
const output = beat("output", { lines: caption, media });
const observation = beat("observation", { lines: caption, input: media, result: media, seconds_to_result: z.number().positive() });
const notes = beat("notes", {
  lines: caption,
  rows: z
    .array(row)
    .length(3)
    .refine((r) => r.some((x) => /free/i.test(x.key)) && r.some((x) => /paid/i.test(x.key)), {
      message: "3 rows: habitat, free tier, paid from",
    }),
  flaw: z.string().min(1),
});
const verdict = beat("verdict", { verdict: z.enum(["Captured", "Released", "Watch"]), spotted: z.string().min(3), ...decision });

export const rareSightingScript = seriesScript(
  "RareSighting",
  {},
  z.discriminatedUnion("type", [stampOpen, output, observation, notes, scoreBeat, verdict]),
  /^stamp-open output observation notes( score)? verdict$/,
  "stamp-open, output, observation, notes, score (Live only), verdict",
).superRefine((s, ctx) => {
  const v = s.beats.find((b) => b.type === "verdict");
  if (v && v.type === "verdict" && (v.verdict === "Watch") !== (s.mode === "Field sketch")) {
    ctx.addIssue({ code: "custom", path: ["beats"], message: "Watch is the verdict for Field sketch mode only (and Field sketch is always Watch)" });
  }
});
export const rareSightingProps = seriesProps(rareSightingScript);
export type RareSightingProps = z.infer<typeof rareSightingProps>;

type Bt<T extends string> = Extract<z.infer<typeof rareSightingScript>["beats"][number], { type: T }>;

const StampOpen: React.FC<{ b: Bt<"stamp-open"> }> = ({ b }) => {
  const box = captionBox(b.lines, 420);
  const h = box.contentBottom - CONTENT_TOP;
  return (
    <>
      <Plate y={CONTENT_TOP} h={h}>
        <Media spec={b.crop} width={PLATE_W} height={h} />
      </Plate>
      {/* The stamp sits on its own archival patch so it reads over any output. */}
      <div style={{ position: "absolute", left: 140, top: CONTENT_TOP + h / 2 - 210, width: 760, height: 380, background: COLORS.label, opacity: 0.9, border: `3px solid ${COLORS.ink}` }} />
      <Stamp word="Rare sighting" x={520} y={CONTENT_TOP + h / 2 - 66} width={620} start={0} />
      <Line text={`Launched ${b.launched}`} x={520} baseline={CONTENT_TOP + h / 2 + 128} maxWidth={640} size={50} axes={AXES.digits} anchor="middle" color={COLORS.red} />
      <Caption lines={b.lines} maxHeight={420} />
    </>
  );
};

const NotesBeat: React.FC<{ b: Bt<"notes"> }> = ({ b }) => {
  const box = captionBox(b.lines, 420);
  const l = cardLayout({ title: "Field notes", rows: b.rows, y: CONTENT_TOP });
  const flawY = CONTENT_TOP + l.height + 90;
  return (
    <>
      <Card title="Field notes" rows={b.rows} y={CONTENT_TOP} maxHeight={box.contentBottom - CONTENT_TOP - 140} />
      {flawY < box.contentBottom ? (
        <>
          <Line text="Flaw" x={110} baseline={flawY} maxWidth={200} size={28} axes={AXES.key} color={COLORS.steel} />
          <Line text={b.flaw} x={330} baseline={flawY} maxWidth={560} size={40} axes={AXES.value} />
          <InkMark shape="ellipse" target={{ x: 330, y: flawY - 34, w: fitInline(b.flaw, 560, AXES.value, 40).width, h: 42 }} start={20} seed="rs-flaw" pad={14} />
        </>
      ) : null}
      <Caption lines={b.lines} maxHeight={420} />
    </>
  );
};

const RareSightingBody: React.FC<RareSightingProps> = ({ script, platform }) => {
  const t = timeline(script.beats);
  return (
    <>
      {t.map((b) => {
        const box = "lines" in b ? captionBox(b.lines, 420) : null;
        return (
          <Beat key={b.index} t={b}>
            {b.type === "stamp-open" ? <StampOpen b={b} /> : null}
            {b.type === "output" && box ? (
              <>
                <Plate y={CONTENT_TOP} h={box.contentBottom - CONTENT_TOP}>
                  <Media spec={b.media} width={PLATE_W} height={box.contentBottom - CONTENT_TOP} />
                </Plate>
                <Caption lines={b.lines} maxHeight={420} />
              </>
            ) : null}
            {b.type === "observation" && box ? (
              <>
                <ObservationPlate input={b.input} result={b.result} y={CONTENT_TOP} h={box.contentBottom - CONTENT_TOP - 120} resultAt={14} />
                <ScaleBar seconds={b.seconds_to_result} x={PLATE_X} y={box.contentBottom - 64} width={832} start={14} duration={40} />
                <Caption lines={b.lines} maxHeight={420} />
              </>
            ) : null}
            {b.type === "notes" ? <NotesBeat b={b} /> : null}
            {b.type === "score" ? <ScoreBeatView b={b} /> : null}
            {b.type === "verdict" ? (
              <EndCard
                word={b.verdict}
                code={script.code}
                score={(script.beats.find((x) => x.type === "score") as { total?: number } | undefined)?.total}
                useFor={b.use_for}
                skipIf={b.skip_if}
                lines={ctaFor(script.cta, platform)}
                signature={(top) => (
                  <Line text={`Spotted ${b.spotted}`} x={500} baseline={top + 70} maxWidth={760} size={48} axes={AXES.digits} anchor="middle" />
                )}
              />
            ) : null}
          </Beat>
        );
      })}
    </>
  );
};


export const RareSighting = framed(RareSightingBody);
