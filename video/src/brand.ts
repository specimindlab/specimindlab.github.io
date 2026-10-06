// Brand tokens and frame geometry. Source of truth: CLAUDE.md ("Brand tokens", "Frame and safe zones").

export const COLORS = {
  herbarium: "#D8DCCD", // every background
  ink: "#151612", // text, rules
  red: "#C4122F", // specimen labels, Captured stamp, scale-bar fill, ink annotations
  label: "#F2F3EC", // output frames, cards
  steel: "#8C938D", // pin steel, card keys
} as const;

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Text lives inside this box. The right 150 px and bottom 480 px belong to platform UI.
export const SAFE = {
  left: 70,
  right: 930,
  top: 180,
  bottom: 1440,
  plateRight: 1010, // output plates may run here, text never
} as const;
export const CONTENT_WIDTH = SAFE.right - SAFE.left;

export const FONT_FAMILY = "Anybody";

// font-variation-settings presets
export const TYPE = {
  caption: { wdth: 60, wght: 850 },
  catalog: { wdth: 140, wght: 900 },
  stamp: { wdth: 150, wght: 900 },
  toolName: { wdth: 100, wght: 900 },
  small: { wdth: 85, wght: 700 },
} as const;

export const variation = (t: { wdth: number; wght: number }) =>
  `'wdth' ${t.wdth}, 'wght' ${t.wght}`;
