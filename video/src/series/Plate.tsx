import React from "react";
import { z } from "zod";
import { BANDS } from "../brand";
import { media, region, Triptych } from "../system";
import { Beat, beat, caption, Caption, captionBox, CONTENT_TOP, ctaFor, framed, seriesProps, seriesScript, timeline } from "./common";
import { ctaBox, CtaCaption } from "./endcard";

// 4. Plate (PL): same input, three tools, one sheet. Shared input card over three empty plates ->
// the plates fill one by one with their own scale bars -> one ink circle per plate -> rank tags
// pin on with each tool's SPECIMIND Score and the winner is stamped -> the platform CTA over the
// ranked triptych.

const specimen = z.object({
  code: z.string().regex(/^\d{3}$/),
  tool: z.string().min(1),
  media,
  seconds: z.number().positive(),
  flaw: z.object({ text: z.string().min(1).max(32), region }),
  rank: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  /** SPECIMIND Score of this tool in this test (data/score.md); shown with its rank tag. */
  score: z.number().int().min(0).max(100).optional(),
});

const setup = beat("triptych", { lines: caption });
const fill = beat("triptych-fill", { lines: caption });
const flaw = beat("flaw", { lines: caption });
const verdict = beat("verdict", { lines: caption });
const cta = beat("cta", {});

export const plateScript = seriesScript(
  "Plate",
  {
    input: media,
    input_label: z.string().min(1),
    specimens: z
      .array(specimen)
      .length(3)
      .refine((s) => [1, 2, 3].every((r) => s.some((x) => x.rank === r)), { message: "ranks 1, 2 and 3 once each" }),
  },
  z.discriminatedUnion("type", [setup, fill, flaw, verdict, cta]),
  /^triptych triptych-fill flaw verdict cta$/,
  "triptych, triptych-fill, flaw, verdict, cta",
);
export const plateProps = seriesProps(plateScript);
export type PlateSeriesProps = z.infer<typeof plateProps>;

const CAP = 300;

const PlateSeriesBody: React.FC<PlateSeriesProps> = ({ script, platform }) => {
  const t = timeline(script.beats);
  const at = (type: string) => t.find((b) => b.type === type);
  const fillBeat = at("triptych-fill");
  const fillStart = fillBeat ? fillBeat.from : 0;
  const fillStep = fillBeat ? Math.floor(fillBeat.dur / 3) : 0;
  const fillAt = [0, 1, 2].map((i) => fillStart + 6 + i * fillStep);
  const flawAt = (at("flaw")?.from ?? Infinity) + 6;
  const rankAt = (at("verdict")?.from ?? Infinity) + 6;
  const ctaLines = ctaFor(script.cta, platform);
  // One continuous triptych under every beat (global frames); only the captions cut per beat.
  const tallest = Math.max(...t.map((b) => ("lines" in b ? captionBox(b.lines, CAP).layout.height : BANDS.captionBottom - ctaBox(ctaLines, CAP).top)));
  const bottom = BANDS.captionBottom - tallest - BANDS.gap;
  return (
    <>
      <Triptych
        input={script.input}
        inputLabel={script.input_label}
        specimens={script.specimens}
        y={CONTENT_TOP}
        h={bottom - CONTENT_TOP}
        fillAt={fillAt}
        flawAt={flawAt}
        rankAt={rankAt}
      />
      {t.map((b) => (
        <Beat key={b.index} t={b}>
          {"lines" in b ? <Caption lines={b.lines} maxHeight={CAP} /> : <CtaCaption lines={ctaLines} code={script.code} maxHeight={CAP} />}
        </Beat>
      ))}
    </>
  );
};


export const PlateSeries = framed(PlateSeriesBody);
