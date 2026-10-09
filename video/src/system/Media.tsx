import React from "react";
import { Img, OffthreadVideo, useCurrentFrame, useVideoConfig } from "remotion";
import { MediaSpec, useAsset } from "./assets";
import { Turntable } from "./Turntable";

// Renders one media item (image, video or .glb) into a w x h box. Crops zoom into a region.
export const Media: React.FC<{ spec: MediaSpec; width: number; height: number; angleOffset?: number }> = ({
  spec,
  width,
  height,
  angleOffset,
}) => {
  const asset = useAsset();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Image sequences step through the tool's own views, one every `hold` seconds.
  const step = spec.frames?.length ? Math.floor(Math.max(0, frame) / Math.max(1, Math.round((spec.hold ?? 0.5) * fps))) % spec.frames.length : 0;
  const src = asset(spec.frames?.length ? spec.frames[step] : spec.src);
  const fit = spec.fit ?? "contain";
  const crop = spec.crop;
  const zoom = crop ? Math.min(1 / Math.max(crop.w, 0.05), 1 / Math.max(crop.h, 0.05)) : 1;
  const origin = crop ? `${(crop.x + crop.w / 2) * 100}% ${(crop.y + crop.h / 2) * 100}%` : "50% 50%";
  const style: React.CSSProperties = {
    width,
    height,
    objectFit: crop ? "cover" : fit,
    display: "block",
    transformOrigin: origin,
    transform: crop ? `scale(${zoom})` : undefined,
  };
  let inner: React.ReactNode;
  if (spec.kind === "image") inner = <Img src={src} style={style} />;
  else if (spec.kind === "video")
    inner = (
      <OffthreadVideo
        src={src}
        style={style}
        muted={!spec.sound}
        trimBefore={Math.round((spec.start_at ?? 0) * fps)}
      />
    );
  else
    inner = (
      <div style={{ ...style, objectFit: undefined }}>
        <Turntable src={src} width={width} height={height} clay={spec.clay ?? false} startAngle={angleOffset} />
      </div>
    );
  return <div style={{ width, height, overflow: "hidden", position: "relative" }}>{inner}</div>;
};
