# E013 · The Drawer W01 · Week 1 — review loop (The Drawer, engine v3)

Built only from `data/catalog.json` and the three episodes' own covers (002 Hunyuan3D, 003 TRELLIS 2, 006 Midjourney). Review record: `qa/contact-sheet.jpg` (10 stills including `0230-rollcall-003`); stills are not committed. Preview platform: ig.

## Round 1 — 3 FAILs (engine)
- FAIL: frame 0 was a drawer still sliding in, cut off at the top; no specimen visible, no score.
- FAIL: the roll call used the top third of the frame: small cells, small type, about 700 px of empty paper below.
- FAIL: the cover was an empty plate (a Drawer has no single output).

## Fixes (engine, `video/src/series/Drawer.tsx`, `Cover.tsx`, `scripts/stage_drawer_covers.py`)
- The render scripts stage each recapped episode's real `cover.png` (from catalog.json) into the Drawer's assets; a missing cover fails the render loudly.
- Hook: the week's covers in a row at full content height, each tagged with its score (or "Watch"), all on frame 0; the drawer slides in on the cut to the roll call.
- Roll call: each specimen's cover (380 × 675) next to Nº, tool, score (or "No score: not hands-on"), verdict stamp and flaw, ~25 % larger type.
- Cover: the same row of real covers with scores. Fixtures keep the old look with `"covers": false`.

## Round 2 — all PASS

| Check | Result |
| --- | --- |
| Frame 0 complete and readable sound-off, with a number | PASS: three real covers tagged 71 / 72 / Watch + "Week 1: / 72 beat 71." |
| Hook pattern and first word vs the previous upload | PASS: versus pattern, first word "Week" (E006 before it: number-shock, "$10") |
| Every verdict and score from data/catalog.json | PASS: 002 Captured 71, 003 Captured 72, 006 Watch (no score); tally 2 / 0 / 1 |
| Label, disclosure ("Unpaid"), mode in every still | PASS |
| Safe zones | PASS: check_safe_zones.py, 10 stills, 0 problems |
| Flaws shown | PASS: each roll-call entry shows its catalogued flaw 12 frames after it lands (Chrome lamp shattered · Tail flat as a paddle · Public unless you pay $60), checked on an extra still at frame 330 |
| Music | PASS: groove 2 (electro-funk; E006 before it is groove 5); hook1@0.0, verse1@2.5 (roll call, one specimen per 3.5 s on the beat), build1@13.0 (tally), drop1@16.0 (CTA) |
| Duration and grid | PASS: 19.5 s; 2.5 / 10.5 / 3 / 3.5 s |
| Ends on | PASS: the drawer sliding shut under the CTA "Comment W01 / for the rankings." + hub URL |
| Not structurally identical to the previous upload | PASS: drawer-open · roll-call · tally · cta vs E006's sketch · notes · price-math · flaw · verdict |
| Honest about timing | PASS: posted 20 Oct after the three specimens it recaps; the copy says "so far" |
