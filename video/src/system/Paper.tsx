import React, { useMemo } from "react";
import { AbsoluteFill, random } from "remotion";
import { COLORS, HEIGHT, WIDTH } from "../brand";
import { seedInt } from "./noise";

// Herbarium sheet. Static grain only (it never moves between frames), no vignette, no gradient.
// Two layers, both at 5 % like brand/templates: seeded speckles of ink, and a fine fibre noise
// split into dark and light specks so the mean colour stays exactly #D8DCCD.
export const Paper: React.FC<{ seed?: string; children?: React.ReactNode }> = ({ seed = "sheet", children }) => {
  const dots = useMemo(
    () =>
      Array.from({ length: 3200 }, (_, i) => (
        <circle
          key={i}
          cx={(random(`${seed}-x${i}`) * WIDTH).toFixed(1)}
          cy={(random(`${seed}-y${i}`) * HEIGHT).toFixed(1)}
          r={(0.32 + random(`${seed}-r${i}`) * 1.38).toFixed(2)}
        />
      )),
    [seed],
  );
  const id = `grain-${seed}`;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.herbarium }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={`${id}-dark`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seedInt(seed)} stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.082  0 0 0 0 0.086  0 0 0 0 0.071  2.4 0 0 0 -1.2" />
          </filter>
          <filter id={`${id}-light`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seedInt(seed)} stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.949  0 0 0 0 0.953  0 0 0 0 0.925  -2.4 0 0 0 1.2" />
          </filter>
        </defs>
        <rect width={WIDTH} height={HEIGHT} filter={`url(#${id}-dark)`} opacity={0.05} />
        <rect width={WIDTH} height={HEIGHT} filter={`url(#${id}-light)`} opacity={0.05} />
        <g fill={COLORS.ink} fillOpacity={0.05}>
          {dots}
        </g>
      </svg>
      {children}
    </AbsoluteFill>
  );
};
