import React from "react";
import { z } from "zod";
import { BANDS, COLORS } from "../brand";
import { AXES, Card, cardLayout, Line, ScoreCard, scoreHeight, Stamp } from "../system";
import { beat, caption, Caption, captionBox, CONTENT_TOP, hubUrl } from "./common";

// Shared v2 endings for every series (prompts/voice.md):
//  - scoreBeat: the SPECIMIND Score card (data/score.md), counting up and locking on the music's crash
//  - decision:  "Use it for / Skip it if" on the verdict
//  - CtaCaption: the platform's own ask (IG "Comment 002 for the link.", YT "Tap our name for the
//    link.", X "Link in the first reply.") with the hub URL in small print under it
//  - EndCard:   stamp (+ score), the decision card, the series' own signature in the space left, CTA

export const scorePart = z.object({ key: z.string().min(1), value: z.number().int().min(0), max: z.number().int().positive() });
// (seriesScript checks that the parts add up to the total)
export const scoreBeat = beat("score", { lines: caption, total: z.number().int().min(0).max(100), parts: z.array(scorePart).min(1).max(4) });
export const decision = { use_for: z.string().min(1).max(40).optional(), skip_if: z.string().min(1).max(40).optional() };

export const ScoreBeatView: React.FC<{ b: z.infer<typeof scoreBeat> }> = ({ b }) => {
  const box = captionBox(b.lines, 420);
  // A two- or three-line caption leaves less room than the card needs: shrink the card (centred,
  // from the top of the content box) so it never runs into the caption.
  const h = scoreHeight(b.parts.length);
  const avail = box.contentBottom - CONTENT_TOP - 16;
  const k = Math.min(1, avail / h);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: k < 1 ? `scale(${k})` : undefined, transformOrigin: `540px ${CONTENT_TOP}px` }}>
        <ScoreCard total={b.total} parts={b.parts} y={k < 1 ? CONTENT_TOP : Math.max(CONTENT_TOP, box.contentBottom - h)} />
      </div>
      <Caption lines={b.lines} maxHeight={420} />
    </>
  );
};

const SMALL = 60; // room for the hub URL under the CTA

/** The platform CTA (big, fitted) with the hub address in small print under it. */
export const CtaCaption: React.FC<{ lines: string[]; code: string; maxHeight?: number }> = ({ lines, code, maxHeight = 300 }) => (
  <>
    <Caption lines={lines} maxHeight={maxHeight} bottom={BANDS.captionBottom - SMALL} />
    <Line text={hubUrl(code)} x={70} baseline={BANDS.captionBottom - 12} maxWidth={860} size={34} axes={AXES.small} />
  </>
);
export const ctaBox = (lines: string[], maxHeight = 300) => captionBox(lines, maxHeight, BANDS.captionBottom - SMALL);

export type StampWord = "Captured" | "Released" | "Watch";

/**
 * The end card. `signature(top, bottom)` draws the series' own ending (drawer, counter, spotted
 * line ...) in whatever space is left between the decision card and the CTA.
 */
export const EndCard: React.FC<{
  word: StampWord;
  code: string;
  lines: string[];
  score?: number;
  useFor?: string;
  skipIf?: string;
  signature?: (top: number, bottom: number) => React.ReactNode;
}> = ({ word, code, lines, score, useFor, skipIf, signature }) => {
  const box = ctaBox(lines);
  const rows = [...(useFor ? [{ key: "Use it for", value: useFor }] : []), ...(skipIf ? [{ key: "Skip it if", value: skipIf }] : [])];
  const stampY = CONTENT_TOP + 90;
  const cardY = CONTENT_TOP + 210;
  const cardH = rows.length ? cardLayout({ title: "Field verdict", rows, y: cardY }).height : 0;
  const sigTop = rows.length ? cardY + cardH + 28 : CONTENT_TOP + 230;
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
      {signature && box.contentBottom - sigTop > 120 ? signature(sigTop, box.contentBottom) : null}
      <CtaCaption lines={lines} code={code} />
    </>
  );
};
