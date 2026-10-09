import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, CONTENT_WIDTH, FONT_FAMILY, SAFE, variation } from "../brand";
import { fitInline } from "./measure";
import { pinDrop, pinPush, PIN } from "./motion";
import { PinnedTag } from "./PinnedTag";
import { Sfx } from "./Sfx";
import { DISCLOSURE_WORD, MODE_WORD, tagText } from "../vocab";

export type Disclosure = "Affiliate" | "Unpaid";
export type Mode = "Live specimen" | "Field sketch";

export const modeText = (mode: Mode) => MODE_WORD[mode] ?? mode;
export const disclosureText = (d: Disclosure) => DISCLOSURE_WORD[d] ?? d;

// Reference geometry (brand/templates/storyboard-1.svg): tag 300 x 146 at (70, 177), -4 deg;
// text column at x 410 with baselines 245 / 295 / 340. We add the mode line at 372.
const TAG = { x: SAFE.left, y: 177, w: 300, h: 146 } as const;
const COL_X = 410;
const COL_W = SAFE.right - COL_X; // 520: text never enters the right 150 px

export type SpecimenLabelProps = {
  code: string;
  tool: string;
  genus: string;
  disclosure: Disclosure;
  mode: Mode;
  /** Frame the tag starts its drop. The text column (disclosure + mode) is visible from frame 0. */
  dropAt?: number;
  /** Field Sketch series: the mode label is larger than usual. */
  modeEmphasis?: boolean;
};

/**
 * The pinned label that stays on screen for the whole video: code tag + tool, genus,
 * disclosure word and mode. The disclosure and mode never animate, so they are legible on frame 0
 * (ASCI / FTC: the disclosure is visible for the entire video).
 */
export const SpecimenLabel: React.FC<SpecimenLabelProps> = ({
  code,
  tool,
  genus,
  disclosure,
  mode,
  dropAt = 0,
  modeEmphasis = false,
}) => {
  const frame = useCurrentFrame();
  const dy = pinDrop(frame, dropAt, 90);
  const push = pinPush(frame, dropAt);
  const toolFit = fitInline(tool, COL_W, { wdth: 100, wght: 900 }, 60, 62);
  const genusFit = fitInline(genus, COL_W, { wdth: 85, wght: 700 }, 32, 60);
  const discFit = fitInline(disclosureText(disclosure), COL_W, { wdth: 90, wght: 800 }, 27);
  const modeFit = fitInline(modeText(mode), COL_W, { wdth: 85, wght: modeEmphasis ? 800 : 650 }, modeEmphasis ? 38 : 27, 60);
  const line = (fit: ReturnType<typeof fitInline>, color: string, baseline: number, text: string) => (
    <text
      x={COL_X}
      y={baseline}
      fill={color}
      fontFamily={FONT_FAMILY}
      fontSize={fit.fontSize}
      style={{ fontVariationSettings: variation(fit.axes) }}
    >
      {text}
    </text>
  );
  return (
    <>
      <PinnedTag {...TAG} rotate={-4} tone="red" text={tagText(code)} dy={dy} push={push} />
      <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {line(toolFit, COLORS.ink, 245, tool)}
        {line(genusFit, COLORS.ink, 290, genus)}
        {line(discFit, disclosure === "Affiliate" ? COLORS.red : COLORS.ink, 331, disclosureText(disclosure))}
        {line(modeFit, COLORS.ink, modeEmphasis ? 377 : 366, modeText(mode))}
      </svg>
      <Sfx name="pin-tick" at={dropAt + PIN.drop} />
    </>
  );
};

export const LABEL_COLUMN = { x: COL_X, width: COL_W, contentWidth: CONTENT_WIDTH } as const;
