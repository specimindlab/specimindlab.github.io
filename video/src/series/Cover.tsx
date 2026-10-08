import React from "react";
import { z } from "zod";
import { BANDS, SAFE } from "../brand";
import { BeforeAfter, EpisodeAssets, FitStack, FontGate, layoutStack, media, Media, Paper, Plate, SpecimenLabel } from "../system";
import { caption, header } from "./common";

// The episode cover (brand/templates/shorts-cover-template.svg): pinned label lowered into the
// cover-safe band (y 240-1680), one output plate with corner crosses, and the hook fitted edge to
// edge. One frame. Reads the same script.json as the video:
//   script.cover = { media?, lines?, angle? }  (optional; defaults: the first media in the beats,
//   the first beat's caption). Rendered by scripts/make_cover.sh -> episodes/<id>/cover.png.

type MediaSpec = z.infer<typeof media>;

export const coverProps = z.object({
  script: z
    .object({
      ...header,
      composition: z.string(),
      beats: z.array(z.record(z.string(), z.unknown())).min(1),
      cover: z.object({ media: media.optional(), before: media.optional(), lines: caption.optional(), angle: z.number().optional() }).optional(),
    })
    .passthrough(),
  platform: z.enum(["yt", "ig", "x"]).optional(),
});
export type CoverProps = z.infer<typeof coverProps>;

const firstMedia = (beats: Record<string, unknown>[]): MediaSpec | null => {
  for (const b of beats) {
    for (const k of ["media", "result", "crop", "input"]) {
      const m = media.safeParse(b[k]);
      if (m.success) return m.data;
    }
  }
  return null;
};
const firstLines = (beats: Record<string, unknown>[]): string[] => {
  for (const b of beats) if (Array.isArray(b.lines) && b.lines.length) return b.lines as string[];
  return [];
};

const LABEL_SHIFT = 96; // video label sits at y 180-330; the cover's at 276-426 (inside y 240+)
const PLATE = { x: 70, y: 510, w: 940, h: 560 };
const CAPTION_TOP = PLATE.y + PLATE.h + 40;
const CAPTION_MAX_H = 1640 - CAPTION_TOP;

const CoverBody: React.FC<CoverProps> = ({ script }) => {
  const spec = script.cover?.media ?? firstMedia(script.beats);
  const lines = script.cover?.lines ?? firstLines(script.beats);
  const layout = layoutStack(lines, { maxHeight: CAPTION_MAX_H });
  return (
    <>
      <Paper seed={script.id} />
      <div style={{ position: "absolute", left: 0, top: LABEL_SHIFT, width: 1080, height: 1920 }}>
        <SpecimenLabel code={script.code} tool={script.tool} genus={script.genus} disclosure={script.disclosure} mode={script.mode} dropAt={-120} />
      </div>
      {spec && script.cover?.before ? (
        <BeforeAfter before={script.cover.before} after={spec} x={PLATE.x} y={PLATE.y} w={PLATE.w} h={PLATE.h} angle={script.cover?.angle} />
      ) : (
        <Plate x={PLATE.x} y={PLATE.y} w={PLATE.w} h={PLATE.h}>
          {spec ? <Media spec={spec} width={PLATE.w} height={PLATE.h} angleOffset={script.cover?.angle} /> : null}
        </Plate>
      )}
      <FitStack lines={lines} layout={layout} y={CAPTION_TOP} anchor="top" start={-60} x={SAFE.left} />
    </>
  );
};

export const Cover: React.FC<CoverProps> = (props) => (
  <FontGate>
    <EpisodeAssets id={props.script.id}>
      <CoverBody {...props} />
    </EpisodeAssets>
  </FontGate>
);

// Keep BANDS referenced for readers comparing with the video layout (caption bottom 1440 there).
export const COVER_CAPTION_BOTTOM_MAX = Math.max(1640, BANDS.captionBottom);
