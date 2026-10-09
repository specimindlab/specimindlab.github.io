import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BANDS, COLORS } from "../brand";
import { media, region, Sfx, SplitAB, AXES, Line } from "../system";
import { Beat, beat, caption, Caption, captionBox, CONTENT_TOP, KICKER_H, ctaFor, framed, seriesProps, seriesScript, timeline } from "./common";
import { ctaBox, CtaCaption } from "./endcard";

// 6. Mimicry (MI): AI or real? A and B side by side, unlabelled -> matched detail crops, no hints
// -> 3, 2, 1 in catalog digits -> the AI side gets its specimen tag, the real side "Real", and the
// giveaway is circled -> CTA. Removing the reveal returns to the opening split, so it loops.

const split = beat("split", { lines: caption });
const details = beat("details", { lines: caption, crops: z.array(z.object({ a: region, b: region })).min(1).max(3) });
const countdown = beat("countdown", {});
const reveal = beat("reveal", { lines: caption });
const cta = beat("cta", {});

export const mimicryScript = seriesScript(
  "Mimicry",
  { a: media, b: media, ai: z.enum(["A", "B"]), flaw: region },
  z.discriminatedUnion("type", [split, details, countdown, reveal, cta]),
  /^split details countdown reveal cta$/,
  "split, details, countdown, reveal, cta",
);
export const mimicryProps = seriesProps(mimicryScript);
export type MimicryProps = z.infer<typeof mimicryProps>;

const CAP = 380;

const Countdown: React.FC<{ dur: number; cx: number; cy: number }> = ({ dur, cx, cy }) => {
  const frame = useCurrentFrame();
  const step = dur / 3;
  const n = 3 - Math.min(2, Math.floor(frame / step));
  return (
    <>
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={cx - 150} y={cy - 170} width={300} height={340} fill={COLORS.label} stroke={COLORS.ink} strokeWidth={4} />
      </svg>
      <Line text={String(n)} x={cx} baseline={cy + 105} maxWidth={260} size={300} axes={AXES.digits} anchor="middle" color={COLORS.red} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} name="ui-click" at={Math.round(i * step)} />
      ))}
    </>
  );
};

const MimicryBody: React.FC<MimicryProps> = ({ script, platform }) => {
  const t = timeline(script.beats);
  const ctaLines = ctaFor(script.cta, platform);
  const tallest = Math.max(...t.map((b) => ("lines" in b ? captionBox(b.lines, CAP).layout.height : BANDS.captionBottom - ctaBox(ctaLines, CAP).top)));
  const bottom = BANDS.captionBottom - tallest - BANDS.gap - KICKER_H;
  const h = bottom - CONTENT_TOP;
  const revealBeat = t.find((b) => b.type === "reveal");
  return (
    <>
      {t.map((b) => (
        <Beat key={b.index} t={b}>
          {b.type === "details" ? (
            <DetailCycle crops={b.crops} dur={b.dur} a={script.a} bMedia={script.b} h={h} />
          ) : (
            <SplitAB
              a={script.a}
              b={script.b}
              y={CONTENT_TOP}
              h={h}
              reveal={revealBeat && b.from >= revealBeat.from ? { at: b.type === "reveal" ? 0 : -100, ai: script.ai, code: script.code, flaw: script.flaw } : undefined}
            />
          )}
          {b.type === "countdown" ? <Countdown dur={b.dur} cx={500} cy={CONTENT_TOP + h / 2} /> : null}
          {"lines" in b ? <Caption lines={b.lines} maxHeight={CAP} /> : null}
          {b.type === "cta" ? <CtaCaption lines={ctaLines} code={script.code} maxHeight={CAP} /> : null}
        </Beat>
      ))}
    </>
  );
};

const DetailCycle: React.FC<{ crops: { a: z.infer<typeof region>; b: z.infer<typeof region> }[]; dur: number; a: z.input<typeof media>; bMedia: z.input<typeof media>; h: number }> = ({
  crops,
  dur,
  a,
  bMedia,
  h,
}) => {
  const frame = useCurrentFrame();
  const i = Math.min(crops.length - 1, Math.floor(frame / (dur / crops.length)));
  return <SplitAB a={a} b={bMedia} y={CONTENT_TOP} h={h} crop={crops[i]} />;
};

export const Mimicry = framed(MimicryBody);
