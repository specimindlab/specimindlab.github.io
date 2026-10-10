# E006 · X01 · Sora is gone · review loop (Shut down, research only, engine v4)

Desk study (`research.md`): OpenAI's deprecation notice, press, and the free plans of three places to make AI videos now. No score (research only). Review record: `qa/contact-sheet.jpg`; stills are not committed. Preview platform: ig.

## Round 1: 3 FAILs (engine)
- FAIL: the three replacements were drawn at about 20-30 px under a large crossed-out label, unreadable on a phone. Fix (ExtinctLabel): with replacements on screen the label steps back (380×116) and rows get up to 215 px, so tool names land near 60 px; sub-lines bigger.
- FAIL: the catch card's row label was hardcoded "All three" (a catch the replacements share); ours is about Sora's own data. Fix: optional `key` on the Extinction Watch flaw beat ("Your videos").
- FAIL (fact): our Wan text-to-video test on its official demo got no video in 30 minutes (a stuck job on the demo), so "free demo, no account" was untrue that day. Fix: Wan listed as "free to download; its demo was down"; Kling (free credits with an account) is the circled pick. Evidence: `raw/wan-demo-check.json`.

## Round 2: 2 FAILs
- FAIL: the two-line caption left the list only about 140 px per row. Fix: one-line caption "Where to go now:".
- FAIL: the first list pin overlapped the date line; the end-card stamp grazed it. Fix: list 22 px lower, stamp 40 px higher. Extinction Watch fixture re-rendered: OK.

## Round 3: all PASS

| Check | Result |
| --- | --- |
| Frame 0: complete, a number | PASS: crossed-out Sora label, "OpenAI's Sora app lasted 7 months." |
| Says research only, no score | PASS: "Not tested · research only" label, Not tested stamp |
| Facts sourced this week | PASS: research.md (OpenAI deprecations page for the API date) |
| Plain words, reading speed, AI tells | PASS: `scripts/plain_check.py` |
| The catch shown and circled | PASS: "Your videos · Deleted by OpenAI" |
| Label, "Not sponsored", mode in every frame | PASS |
| Safe zones | PASS: 0 problems on 10 stills |
| Music | PASS: groove 6 (E005 was groove 3) |
