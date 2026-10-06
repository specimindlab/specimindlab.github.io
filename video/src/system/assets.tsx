import React, { createContext, useContext } from "react";
import { staticFile } from "remotion";
import { z } from "zod";

// Where media paths in script.json resolve. Episode assets are staged by the render scripts into
// public/episodes/<id>/ (see scripts/render_batch.sh), so "raw/output.mp4" in E001's script means
// public/episodes/E001/raw/output.mp4. Paths starting with "@/" are relative to public/ itself
// (test fixtures); http(s) URLs pass through.

const EpisodeContext = createContext<string | null>(null);

export const EpisodeAssets: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <EpisodeContext.Provider value={id}>{children}</EpisodeContext.Provider>
);

export const useAsset = () => {
  const id = useContext(EpisodeContext);
  return (src: string) => {
    if (/^https?:\/\//.test(src)) return src;
    if (src.startsWith("@/")) return staticFile(src.slice(2));
    return staticFile(id ? `episodes/${id}/${src}` : src);
  };
};

/** Normalised region of a media item (0..1 of its frame), e.g. where the flaw is. */
export const region = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
});
export type Region = z.infer<typeof region>;

export const media = z.object({
  kind: z.enum(["image", "video", "glb"]),
  src: z.string().min(1),
  fit: z.enum(["contain", "cover"]).default("contain"),
  /** 3D only: replace materials with neutral clay so geometry reads. */
  clay: z.boolean().default(false),
  /** Video only: seconds into the clip where this use starts. */
  start_at: z.number().min(0).default(0),
  /** Video only: keep the tool's own sound (an output that IS audio). Default muted. */
  sound: z.boolean().default(false),
  /** Zoom into a region (Mimicry detail crops, Rare Sighting static crop). */
  crop: region.optional(),
  /** Short alt description, used only in QA logs. */
  alt: z.string().optional(),
});
export type MediaSpec = z.input<typeof media>;
