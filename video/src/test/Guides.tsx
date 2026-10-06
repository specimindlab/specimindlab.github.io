import React from "react";
import { AbsoluteFill } from "remotion";
import { HEIGHT, SAFE, WIDTH } from "../brand";

// QA overlay: hatches the zones that belong to platform UI (right 150 px, bottom 480 px) and
// outlines the text box. Only used on test renders.
export const Guides: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width={WIDTH} height={HEIGHT}>
      <defs>
        <pattern id="hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="16" stroke="#0070FF" strokeWidth="3" strokeOpacity="0.35" />
        </pattern>
      </defs>
      <rect x={SAFE.right} y={0} width={WIDTH - SAFE.right} height={HEIGHT} fill="url(#hatch)" />
      <rect x={0} y={SAFE.bottom} width={WIDTH} height={HEIGHT - SAFE.bottom} fill="url(#hatch)" />
      <rect x={SAFE.left} y={SAFE.top} width={SAFE.right - SAFE.left} height={SAFE.bottom - SAFE.top} fill="none" stroke="#0070FF" strokeDasharray="10 8" strokeWidth={2} />
      <line x1={SAFE.plateRight} y1={0} x2={SAFE.plateRight} y2={HEIGHT} stroke="#0070FF" strokeDasharray="4 6" strokeWidth={2} />
    </svg>
  </AbsoluteFill>
);
