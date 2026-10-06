import { FONT_FAMILY, variation } from "../brand";

export type Axes = { wdth: number; wght: number };

// Text measurement with the real variable-font axes. @remotion/layout-utils builds its probe
// from fontFamily/fontWeight and cannot be trusted with font-variation-settings, so we measure
// in a hidden DOM span carrying the exact settings the render uses. Only call this after the
// font has loaded (everything renders inside <FontGate/>).

const cache = new Map<string, number>();
let host: HTMLDivElement | null = null;

const probeHost = () => {
  if (!host) {
    host = document.createElement("div");
    Object.assign(host.style, {
      position: "absolute",
      left: "-100000px",
      top: "0",
      visibility: "hidden",
      pointerEvents: "none",
      whiteSpace: "pre",
    });
    document.body.appendChild(host);
  }
  return host;
};

/** Advance width of `text` in em (1 em = font size) at the given axes. Includes kerning. */
export const measureEm = (text: string, axes: Axes): number => {
  const key = `${axes.wdth}|${axes.wght}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const span = document.createElement("span");
  span.textContent = text;
  Object.assign(span.style, {
    fontFamily: `'${FONT_FAMILY}'`,
    fontSize: "1000px",
    lineHeight: "1",
    fontVariationSettings: variation(axes),
    fontKerning: "normal",
    whiteSpace: "pre",
  });
  probeHost().appendChild(span);
  const em = span.getBoundingClientRect().width / 1000;
  span.remove();
  // Never remember a width measured against a fallback face.
  if (document.fonts.check(`100px '${FONT_FAMILY}'`)) cache.set(key, em);
  else throw new Error(`measureEm("${text}") called before the ${FONT_FAMILY} font loaded; render it inside <FontGate/>`);
  return em;
};

export type InlineFit = { fontSize: number; axes: Axes; width: number };

/**
 * Fit one line of UI text into `maxWidth`: first condense the width axis (down to `minWdth`),
 * then reduce the size. Keeps labels on one line without ever overflowing their box.
 */
export const fitInline = (
  text: string,
  maxWidth: number,
  axes: Axes,
  fontSize: number,
  minWdth = Math.min(axes.wdth, 70),
): InlineFit => {
  let wdth = axes.wdth;
  let em = measureEm(text, axes);
  while (em * fontSize > maxWidth && wdth > minWdth) {
    wdth = Math.max(minWdth, wdth - 5);
    em = measureEm(text, { wdth, wght: axes.wght });
  }
  const size = em * fontSize > maxWidth ? maxWidth / em : fontSize;
  return { fontSize: size, axes: { wdth, wght: axes.wght }, width: em * size };
};
