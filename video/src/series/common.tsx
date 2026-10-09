import React, { createContext, useContext } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { z } from "zod";
import { BANDS, COLORS, FPS, SAFE } from "../brand";
import { CHAPTER } from "../vocab";
import {
  AXES,
  catalogSchema,
  EpisodeAssets,
  Line,
  FitStack,
  FontGate,
  layoutStack,
  Paper,
  Soundtrack,
  SpecimenLabel,
  StackLayout,
} from "../system";

// Shared contract for every series script.json. Each series composes these into its own beat
// list and ORDER (data/series.md); the order is enforced with a pattern over the beat types, so a
// script written for one series can never validate against another.

export const platform = z.enum(["yt", "ig", "x"]);
export type Platform = z.infer<typeof platform>;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** A caption line: 1-7 words (prompts/voice.md v3: plain sentences, still fitted edge to edge). */
export const captionLine = z
  .string()
  .min(1)
  .refine((s) => words(s) >= 1 && words(s) <= 7, { message: "caption lines carry 1-7 words" });
/** 1-3 lines per beat. */
export const caption = z.array(captionLine).min(1).max(3);

export const row = z.object({ key: z.string().min(1), value: z.string().min(1) });
export type Row = z.infer<typeof row>;

/** Beats last whole multiples of 0.5 s: one beat at 120 bpm (scripts/make_music.py), so every cut
 *  lands on the music grid. */
export const beatSeconds = z
  .number()
  .min(1)
  .max(26) // Drawer roll call runs to 24 s
  .refine((s) => Math.abs(s * 2 - Math.round(s * 2)) < 1e-9, { message: "beat seconds must be a multiple of 0.5 (120 bpm grid)" });

/** Every beat may override its chapter label ("" hides it); see vocab.ts CHAPTER for the defaults. */
export const beat = <T extends string, S extends z.ZodRawShape>(type: T, shape: S) =>
  z.object({ type: z.literal(type), seconds: beatSeconds, kicker: z.string().max(40).optional(), ...shape });

export const header = {
  id: z.string().regex(/^E\d{3}$/),
  code: z.string().regex(/^(\d{3}|[PMDWX]\d{2}|TBD)$/),
  series: z.string(),
  mode: z.enum(["Live specimen", "Field sketch"]),
  disclosure: z.enum(["Affiliate", "Unpaid"]),
  tool: z.string().min(1),
  genus: z.string().min(1),
  bed: z.string().optional(),
  /** Episode music (scripts/make_music.py -> <episode>/music.wav). Replaces the ambient bed. */
  music: z.string().optional(),
  /** make_music.py groove 1-6 (never the same as the previous upload). */
  groove: z.number().int().min(1).max(6).optional(),
  cta: z.object({ yt: z.string().min(1), ig: z.string().min(1), x: z.string().min(1) }),
};

// 18-60 s is the hard range; the target is 35-55 s (prompts/voice.md v3: long enough to explain
// what the tool is, what we did, what happened and whether to use it, in plain words).
export const MIN_SECONDS = 18;
export const MAX_SECONDS = 60;

type Beatish = { type: string; seconds: number };

/** Validates beat order against the series pattern and the total length (28-40 s). */
export const seriesScript = <S extends z.ZodRawShape, B extends z.ZodTypeAny>(
  composition: string,
  shape: S,
  beats: B,
  order: RegExp,
  orderText: string,
) =>
  z
    .object({ ...header, composition: z.literal(composition), ...shape, beats: z.array(beats).min(3) })
    .superRefine((s, ctx) => {
      const list = (s as unknown as { beats: Beatish[] }).beats;
      const seq = list.map((b) => b.type).join(" ");
      if (!order.test(seq)) {
        ctx.addIssue({ code: "custom", path: ["beats"], message: `${composition} beats must be: ${orderText} (got: ${seq})` });
      }
      for (const b of list as unknown as { type: string; total?: number; parts?: { value: number }[] }[]) {
        if (b.type === "score" && b.parts && b.parts.reduce((a, p) => a + p.value, 0) !== b.total) {
          ctx.addIssue({ code: "custom", path: ["beats"], message: `score parts add up to ${b.parts.reduce((a, p) => a + p.value, 0)}, not ${b.total} (data/score.md)` });
        }
        if (b.type === "score" && (s as unknown as { mode: string }).mode === "Field sketch") {
          ctx.addIssue({ code: "custom", path: ["beats"], message: "Field sketches get no score (data/score.md)" });
        }
      }
      const total = list.reduce((a, b) => a + b.seconds, 0);
      if (total < MIN_SECONDS || total > MAX_SECONDS) {
        ctx.addIssue({ code: "custom", path: ["beats"], message: `total ${total} s; must be ${MIN_SECONDS}-${MAX_SECONDS} s` });
      }
    });

export const seriesProps = <T extends z.ZodTypeAny>(script: T) =>
  z.object({
    script,
    platform,
    /** Test fixtures only. Renders read data/catalog.json. */
    catalog: catalogSchema.optional(),
  });

// ---- timing ----------------------------------------------------------------------------------

export const frames = (s: number) => Math.round(s * FPS);

export type Timed<T> = T & { from: number; dur: number; index: number };

/** Each beat lasts round(seconds * fps) frames (same rule as scripts/episode_frames.mjs). */
export const timeline = <T extends Beatish>(beats: T[]): Timed<T>[] => {
  let from = 0;
  return beats.map((b, index) => {
    const dur = frames(b.seconds);
    const t = { ...b, from, dur, index };
    from += dur;
    return t;
  });
};

export const totalFramesOf = (beats: { seconds: number }[]) => beats.reduce((a, b) => a + frames(b.seconds), 0);

// ---- captions & CTA ----------------------------------------------------------------------------

/** Split a CTA sentence into 1-2 balanced lines (explicit "\n" wins). */
export const ctaLines = (text: string): string[] => {
  if (text.includes("\n")) return text.split("\n").map((l) => l.trim()).filter(Boolean);
  const w = text.trim().split(/\s+/);
  if (w.length <= 2) return [text.trim()];
  let best = [text];
  let score = Infinity;
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(" ");
    const b = w.slice(i).join(" ");
    const sc = Math.abs(a.length - b.length);
    if (sc < score) {
      score = sc;
      best = [a, b];
    }
  }
  return best;
};

export const CAPTION_MAX = 600;

/** Room kept above every caption for its chapter label ("The test", "The catch" ...). */
export const KICKER_H = 64;

/** Caption layout + the y where content above it must stop (the chapter label's room included). */
export const captionBox = (lines: string[], maxHeight = CAPTION_MAX, bottom: number = BANDS.captionBottom) => {
  const layout: StackLayout = layoutStack(lines, { maxHeight });
  const top = bottom - layout.height;
  return { layout, top, contentBottom: top - BANDS.gap - KICKER_H, bottom };
};

export const CONTENT_TOP = 430;

/** Which beat is rendering (0 = the first frame of the video). */
export const BeatIndex = createContext(-1);
/** The rendering beat's type and chapter-label override. */
export const BeatInfo = createContext<{ type: string; kicker?: string }>({ type: "" });

export const Caption: React.FC<{ lines: string[]; at?: number; maxHeight?: number; bottom?: number; kicker?: string }> = ({
  lines,
  at = 0,
  maxHeight = CAPTION_MAX,
  bottom = BANDS.captionBottom,
  kicker: kickerProp,
}) => {
  const box = captionBox(lines, maxHeight, bottom);
  // The first frame decides the swipe (prompts/voice.md): the hook's lines are all there on frame 0,
  // no cut-in, no pop. Later beats cut in line by line on the beat.
  const index = useContext(BeatIndex);
  const info = useContext(BeatInfo);
  const first = index === 0;
  // Chapter label: plain words above the caption, so anyone looking up mid-video knows where they are.
  const kicker = bottom !== BANDS.captionBottom ? "" : kickerProp ?? info.kicker ?? (first ? "" : CHAPTER[info.type] ?? "");
  return (
    <>
      {kicker ? <Line text={kicker} x={SAFE.left} baseline={box.top - 26} maxWidth={SAFE.right - SAFE.left} size={42} axes={AXES.title} color={COLORS.red} /> : null}
      <FitStack lines={lines} layout={box.layout} y={bottom} anchor="bottom" start={first ? -60 : at} pop={!first} x={SAFE.left} />
    </>
  );
};

// ---- frame scaffold ----------------------------------------------------------------------------

type HeaderScript = {
  id: string;
  code: string;
  tool: string;
  genus: string;
  disclosure: "Affiliate" | "Unpaid";
  mode: "Live specimen" | "Field sketch";
  bed?: string;
  music?: string;
  beats: { seconds: number }[];
};

/**
 * Paper, the pinned label (code, tool, genus, disclosure, mode: on screen for the whole video),
 * episode asset resolution, the ambient bed and the motif on the end card (the last beat).
 * Beats render as children.
 */
export const SeriesFrame: React.FC<{ script: HeaderScript; modeEmphasis?: boolean; children: React.ReactNode }> = ({
  script,
  modeEmphasis,
  children,
}) => (
  <FontGate>
    <EpisodeAssets id={script.id}>
      <Paper seed={script.id} />
      <Soundtrack bed={script.bed} music={script.music} endCardFrom={totalFramesOf(script.beats.slice(0, -1))} />
      {children}
      <SpecimenLabel
        code={script.code}
        tool={script.tool}
        genus={script.genus}
        disclosure={script.disclosure}
        mode={script.mode}
        modeEmphasis={modeEmphasis}
        dropAt={-20}
      />
    </EpisodeAssets>
  </FontGate>
);

/**
 * Wraps a series body in SeriesFrame. The body renders BELOW the font gate, so every measurement
 * it makes (caption fits, card rows) uses the real font. Never measure in the outer component.
 */
export const framed = <P extends { script: HeaderScript }>(Body: React.FC<P>, opts: { modeEmphasis?: boolean } = {}) => {
  const Framed: React.FC<P> = (props) => (
    <SeriesFrame script={props.script} modeEmphasis={opts.modeEmphasis}>
      <Body {...props} />
    </SeriesFrame>
  );
  return Framed;
};

/** A beat's sequence. Children see frames relative to the beat start. */
export const Beat: React.FC<{ t: { from: number; dur: number; type: string; index: number; kicker?: string }; children: React.ReactNode }> = ({ t, children }) => (
  <Sequence from={t.from} durationInFrames={t.dur} name={`${t.index + 1} ${t.type}`}>
    <BeatIndex.Provider value={t.index}>
      <BeatInfo.Provider value={{ type: t.type, kicker: t.kicker }}>
        <AbsoluteFill>{children}</AbsoluteFill>
      </BeatInfo.Provider>
    </BeatIndex.Provider>
  </Sequence>
);

export const ctaFor = (cta: { yt: string; ig: string; x: string }, p: Platform) => ctaLines(cta[p]);

/** The hub address for small print under an Instagram CTA. */
export const hubUrl = (code: string) => `specimindlab.github.io/${code}`;
