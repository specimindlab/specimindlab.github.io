import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLORS } from "../brand";
import { BeforeAfter, Card, cardLayout, fitInline, InkMark, media, Media, Plate, PLATE_W, PLATE_X, region, ScaleBar, Stamp, AXES, Line } from "../system";
import { Beat, beat, caption, Caption, captionBox, CONTENT_TOP, ctaFor, row, framed, seriesProps, seriesScript, timeline } from "./common";
import { ObservationPlate } from "./FieldSpecimen";
import { decision, EndCard, scoreBeat, ScoreBeatView } from "./endcard";
import { introBeat, IntroVisual } from "./intro";
import { CARD, LABEL } from "../vocab";

// 3. Rare Sighting (RS): speed beats polish. The RARE SIGHTING stamp lands first over a static
// crop, with the launch date -> the full output -> one run with the scale bar -> a 3-row notes
// card with the flaw circled inside -> SPECIMIND Score (Live only) -> end card ending on the
// "spotted" date line and the platform CTA.

const stampOpen = beat("stamp-open", { lines: caption, launched: z.string().min(3), crop: media, before: media.optional() });
const output = beat("output", { lines: caption, media });
const observation = beat("observation", { lines: caption, input: media, result: media, seconds_to_result: z.number().positive() });
const notes = beat("notes", {
  lines: caption,
  rows: z
    .array(row)
    .min(2)
    .max(3)
    .refine((r) => r.some((x) => /free/i.test(x.key)) && r.some((x) => /paid/i.test(x.key)), {
      message: "2-3 rows, including the free plan and the paid price",
    }),
  /** Two-act notes (with flaw_media): the caption for act 2, the flaw ("The catch"); act 1 is "The price". */
  lines2: caption.optional(),
  flaw: z.string().min(1),
  /** Optional: show the flaw on the output itself (a thumbnail plate under the card, ellipse on the region). */
  flaw_media: media.optional(),
  flaw_region: region.optional(),
});
const verdict = beat("verdict", { verdict: z.enum(["Captured", "Released", "Watch"]), spotted: z.string().min(3), ...decision });

export const rareSightingScript = seriesScript(
  "RareSighting",
  {},
  z.discriminatedUnion("type", [stampOpen, introBeat, output, observation, notes, scoreBeat, verdict]),
  /^stamp-open( intro)? output observation notes( score)? verdict$/,
  "stamp-open, intro (optional), output, observation, notes, score (Live only), verdict",
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
  if (b.before) {
    // Before -> after on frame 0 (the strongest still we have); the stamp shrinks to a sticker over
    // the input's top-left corner so the result stays fully visible.
    const pw = (936 - 56) / 2;
    return (
      <>
        <BeforeAfter before={b.before} after={b.crop} y={CONTENT_TOP} h={h} />
        <div style={{ position: "absolute", left: 84, top: CONTENT_TOP + 14, width: pw - 28, height: 200, background: COLORS.label, opacity: 0.92, border: `3px solid ${COLORS.ink}` }} />
        <Stamp word="Rare sighting" x={84 + (pw - 28) / 2} y={CONTENT_TOP + 70} width={pw - 170} start={0} />
        <Line text={LABEL.launched(b.launched)} x={84 + (pw - 28) / 2} baseline={CONTENT_TOP + 194} maxWidth={pw - 70} size={34} axes={AXES.digits} anchor="middle" color={COLORS.red} />
        <Caption lines={b.lines} maxHeight={420} />
      </>
    );
  }
  return (
    <>
      <Plate y={CONTENT_TOP} h={h}>
        <Media spec={b.crop} width={PLATE_W} height={h} />
      </Plate>
      {/* The stamp sits on its own archival patch so it reads over any output. */}
      <div style={{ position: "absolute", left: 140, top: CONTENT_TOP + h / 2 - 210, width: 760, height: 380, background: COLORS.label, opacity: 0.9, border: `3px solid ${COLORS.ink}` }} />
      <Stamp word="Rare sighting" x={520} y={CONTENT_TOP + h / 2 - 66} width={620} start={0} />
      <Line text={LABEL.launched(b.launched)} x={520} baseline={CONTENT_TOP + h / 2 + 128} maxWidth={640} size={50} axes={AXES.digits} anchor="middle" color={COLORS.red} />
      <Caption lines={b.lines} maxHeight={420} />
    </>
  );
};

const NotesBeat: React.FC<{ b: Bt<"notes"> }> = ({ b }) => {
  const frame = useCurrentFrame();
  const box = captionBox(b.lines, 420);
  const split = b.lines2 ? 0.55 : 0.4;
  const cardOut = b.flaw_media ? Math.round(b.seconds * 30 * split) : Infinity;
  const l = cardLayout({ title: CARD.facts, rows: b.rows, y: CONTENT_TOP });
  const flawY = CONTENT_TOP + l.height + 90;
  return (
    <>
      {frame < cardOut ? <Card title={b.lines2 ? CARD.price : CARD.facts} rows={b.rows} y={CONTENT_TOP} maxHeight={box.contentBottom - CONTENT_TOP - 140} /> : null}
      {b.flaw_media ? (
        (() => {
          // Two acts in one beat: the field notes (price on screen) for the first 40 %, then the flaw
          // itself, full size, with the region circled. The caption ("Honest flaw: ...") sets it up.
          const swap = cardOut;
          if (frame < swap) return null;
          const ph = Math.min(box.contentBottom, b.lines2 ? captionBox(b.lines2, 420).contentBottom : box.contentBottom) - CONTENT_TOP - 90;
          const r = b.flaw_region ?? { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
          const note = b.flaw.split("|").join(" · ");
          return (
            <>
              <Plate y={CONTENT_TOP} h={ph}>
                <Media spec={b.flaw_media} width={PLATE_W} height={ph} />
              </Plate>
              {(() => {
                // Map the region (0..1 of the media) into the plate, honouring "contain" letterboxing
                // of a square view; crops fill the plate ("cover").
                const sq = b.flaw_media!.crop ? null : Math.min(PLATE_W, ph);
                const mx = sq ? PLATE_X + (PLATE_W - sq) / 2 : PLATE_X;
                const my = sq ? CONTENT_TOP + (ph - sq) / 2 : CONTENT_TOP;
                const mw = sq ?? PLATE_W;
                const mh = sq ?? ph;
                return <InkMark shape="ellipse" target={{ x: mx + r.x * mw, y: my + r.y * mh, w: r.w * mw, h: r.h * mh }} start={swap + 6} seed="rs-flaw" pad={10} />;
              })()}
              <Line text={note} x={PLATE_X} baseline={CONTENT_TOP + ph + 62} maxWidth={860} size={46} axes={AXES.note} color={COLORS.red} />
            </>
          );
        })()
      ) : flawY < box.contentBottom ? (
        <>
          <Line text="Flaw" x={110} baseline={flawY} maxWidth={200} size={28} axes={AXES.key} color={COLORS.steel} />
          <Line text={b.flaw} x={330} baseline={flawY} maxWidth={560} size={40} axes={AXES.value} />
          <InkMark shape="ellipse" target={{ x: 330, y: flawY - 34, w: fitInline(b.flaw, 560, AXES.value, 40).width, h: 42 }} start={20} seed="rs-flaw" pad={14} />
        </>
      ) : null}
      {b.flaw_media && b.lines2 ? (
        frame < cardOut ? <Caption lines={b.lines} maxHeight={420} kicker="The price" /> : <Caption lines={b.lines2} maxHeight={420} kicker="The catch" at={cardOut} />
      ) : (
        <Caption lines={b.lines} maxHeight={420} />
      )}
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
            {b.type === "intro" && box ? (
              <>
                <IntroVisual b={b} y={CONTENT_TOP} bottom={box.contentBottom} />
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
                  <Line text={LABEL.tested(b.spotted)} x={500} baseline={top + 70} maxWidth={760} size={48} axes={AXES.digits} anchor="middle" />
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
