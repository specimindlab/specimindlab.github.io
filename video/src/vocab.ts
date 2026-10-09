// Every word the viewer reads that comes from our own system (not from the script) lives here, in
// plain language (prompts/voice.md v3: "keep the look, change the words"). Data files keep the
// internal names (Captured / Released / Watch, Live specimen / Field sketch, Unpaid / Affiliate);
// the screen only ever shows these.

export const VERDICT_WORD: Record<string, string> = {
  Captured: "Worth it",
  Released: "Skip it",
  Watch: "Not tested",
};

export const MODE_WORD: Record<string, string> = {
  "Live specimen": "Tested by us",
  "Field sketch": "Not tested · research only",
};

export const DISCLOSURE_WORD: Record<string, string> = {
  Unpaid: "Not sponsored",
  Affiliate: "Affiliate link",
};

/** The code on the red tag: "#002" for single tools; group codes (P01, W01 ...) as they are. */
export const tagText = (code: string) => (/^\d{3}$/.test(code) ? `#${code}` : code);

/** Small red chapter label above the caption, by beat type (the first beat and end cards get none). */
export const CHAPTER: Record<string, string> = {
  intro: "What it is",
  conditions: "How we tested",
  observation: "The test",
  output: "What it made",
  notes: "The facts",
  flaw: "The catch",
  "price-math": "The price",
  score: "Our score",
  sketch: "How it works",
  counter: "The free plan",
  triptych: "The test",
  "triptych-fill": "The results",
  details: "Up close",
  countdown: "Your guess?",
  reveal: "The answer",
  tray: "The steps",
  "roll-call": "The ranking",
  tally: "So far",
  timeline: "What happened",
  successors: "What to use now",
  extinct: "Shut down",
};

export const CARD = {
  facts: "The facts",
  factsResearch: "The facts (from their website)",
  how: "How we tested",
  price: "What it costs",
  catch: "The catch",
  decide: "Should you use it?",
  goodFor: "Good for",
  notFor: "Not for",
  source: "Source",
};

export const LABEL = {
  input: "What we gave it",
  output: "What it made",
  seconds: (s: number) => `${s} seconds`,
  scoreOf: "/100 our score",
  scoreTitle: "SPECIMIND score",
  noScore: "No score: not tested",
  redrawn: "Our drawing, from their public pages",
  launched: (d: string) => `Out since ${d}`,
  tested: (d: string) => `Tested ${d}`,
  nextUp: "Next up",
};
