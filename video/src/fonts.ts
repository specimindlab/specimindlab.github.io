import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { FONT_FAMILY } from "./brand";

// Loads the Anybody variable font (wdth 50-150, wght 100-900) once per bundle.
// The render waits until the font is ready, so text is never measured with a fallback face.
let loaded: Promise<void> | null = null;

export const loadBrandFont = (): Promise<void> => {
  if (!loaded) {
    const face = new FontFace(FONT_FAMILY, `url(${staticFile("fonts/Anybody-VF.ttf")}) format("truetype")`, {
      weight: "100 900",
      stretch: "50% 150%",
    });
    loaded = face.load().then((f) => {
      document.fonts.add(f);
    });
  }
  return loaded;
};

// Returns true once the font is usable. Components that measure text must wait for it.
export const useBrandFont = (): boolean => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Loading Anybody variable font"));
  useEffect(() => {
    loadBrandFont()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => {
        // Fail the render loudly rather than shipping a fallback font.
        throw new Error(`Anybody font failed to load: ${err}`);
      });
  }, [handle]);
  return ready;
};
