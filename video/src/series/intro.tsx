import React from "react";
import { z } from "zod";
import { BeforeAfter, media, Media, Plate, PlateTag } from "../system";
import { beat, caption } from "./common";

// The plain-language set-up beat (prompts/voice.md v3): "What it is" or, with kicker
// "How we tested", what we gave the tool. Shared by the series that tell a tool's story.

/** Plain-language set-up: what the tool is, or how we tested (kicker "How we tested"). Shows a
 *  before -> after, one picture, or a row of up to 3 labelled inputs. */
export const introBeat = beat("intro", {
  lines: caption,
  media: media.optional(),
  before: media.optional(),
  items: z.array(z.object({ media, label: z.string().min(1).max(24) })).min(2).max(3).optional(),
});

type Intro = z.infer<typeof introBeat>;

/** The intro's picture: a row of labelled inputs, a before -> after, or one plate. */
export const IntroVisual: React.FC<{ b: Intro; y: number; bottom: number }> = ({ b, y, bottom }) => {
  if (b.items) {
    const gap = 24;
    const n = b.items.length;
    const w = (936 - gap * (n - 1)) / n;
    const h = Math.min(bottom - y, w * 1.55);
    const top = y + (bottom - y - h) / 2;
    return (
      <>
        {b.items.map((it, k) => (
          <React.Fragment key={k}>
            <Plate x={70 + k * (w + gap)} y={top} w={w} h={h} crosses={false} border={3}>
              <Media spec={{ ...it.media, fit: "cover" }} width={w} height={h} />
            </Plate>
            <PlateTag text={it.label} x={70 + k * (w + gap) + 10} y={top + h - 58} size={28} maxWidth={w - 20} />
          </React.Fragment>
        ))}
      </>
    );
  }
  if (b.before && b.media) return <BeforeAfter before={b.before} after={b.media} y={y} h={bottom - y} />;
  if (b.media)
    return (
      <Plate x={70} y={y} w={860} h={bottom - y}>
        <Media spec={b.media} width={860} height={bottom - y} />
      </Plate>
    );
  return null;
};

