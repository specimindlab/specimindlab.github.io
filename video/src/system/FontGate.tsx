import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../brand";
import { useBrandFont } from "../fonts";

// Holds the render (delayRender) until Anybody is loaded, then mounts children. Every measuring
// component lives below this, so text is never fitted against a fallback face.
export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ready = useBrandFont();
  if (!ready) return <AbsoluteFill style={{ backgroundColor: COLORS.herbarium }} />;
  return <>{children}</>;
};
