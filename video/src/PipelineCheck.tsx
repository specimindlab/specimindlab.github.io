import { fitText } from "@remotion/layout-utils";
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { COLORS, CONTENT_WIDTH, FONT_FAMILY, SAFE, TYPE, variation } from "./brand";
import { useBrandFont } from "./fonts";
import { beatFrames, EpisodeProps } from "./schema";

// Edge-to-edge caption line (the brand signature), capped so one-word lines stay sane.
const fitCaption = (text: string) =>
  Math.min(
    260,
    fitText({
      text,
      withinWidth: CONTENT_WIDTH,
      fontFamily: FONT_FAMILY,
      additionalStyles: { fontVariationSettings: variation(TYPE.caption) },
    }).fontSize,
  );

// Not a series. A minimal, brand-correct composition that exercises the whole delivery
// pipeline (props, beats, platform CTA, audio, font) so render.yml and preview.yml can be
// tested before the design system exists. Fixture: scripts/fixtures/episodes/E000-pipeline-check.
export const PipelineCheck: React.FC<EpisodeProps> = ({ script, platform }) => {
  const fontReady = useBrandFont();
  const frame = useCurrentFrame();
  let start = 0;
  const beats = script.beats.map((b, i) => {
    const from = start;
    start += beatFrames(b);
    const isLast = i === script.beats.length - 1;
    const lines = isLast ? [script.cta[platform]] : (b.lines ?? [b.type]);
    return (
      <Sequence key={i} from={from} durationInFrames={beatFrames(b)}>
        <AbsoluteFill>
          <div
            style={{
              position: "absolute",
              left: SAFE.left,
              top: 900,
              width: CONTENT_WIDTH,
              fontFamily: FONT_FAMILY,
              fontVariationSettings: variation(TYPE.caption),
              lineHeight: 1.05,
              color: COLORS.ink,
            }}
          >
            {lines.map((l) => (
              <div key={l} style={{ fontSize: fontReady ? fitCaption(l) : 110, whiteSpace: "nowrap" }}>
                {l}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>
    );
  });
  if (!fontReady) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.herbarium }} />;
  }
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.herbarium }}>
      {script.bed ? <Audio src={staticFile(script.bed)} /> : null}
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          top: SAFE.top,
          padding: "18px 28px",
          background: COLORS.red,
          color: COLORS.label,
          fontFamily: FONT_FAMILY,
          fontVariationSettings: variation(TYPE.catalog),
          fontSize: 72,
        }}
      >
        {script.code}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE.left + 260,
          top: SAFE.top,
          fontFamily: FONT_FAMILY,
          color: COLORS.ink,
          lineHeight: 1.15,
        }}
      >
        <div style={{ fontVariationSettings: variation(TYPE.toolName), fontSize: 52 }}>{script.tool}</div>
        <div style={{ fontVariationSettings: variation(TYPE.small), fontSize: 28 }}>{script.genus}</div>
        <div style={{ fontVariationSettings: variation(TYPE.small), fontSize: 28, color: COLORS.red }}>
          {script.disclosure} · {script.mode}
        </div>
      </div>
      {beats}
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          top: SAFE.bottom - 40,
          fontFamily: FONT_FAMILY,
          fontVariationSettings: variation(TYPE.small),
          fontSize: 28,
          color: COLORS.steel,
        }}
      >
        {platform} · frame {frame}
      </div>
    </AbsoluteFill>
  );
};
